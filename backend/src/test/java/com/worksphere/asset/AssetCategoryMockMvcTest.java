package com.worksphere.asset;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.asset.api.request.CreateAssetCategoryRequest;
import com.worksphere.asset.api.request.UpdateAssetCategoryRequest;
import com.worksphere.asset.domain.Asset;
import com.worksphere.asset.domain.AssetCategory;
import com.worksphere.asset.domain.AssetStatus;
import com.worksphere.asset.infrastructure.persistence.AssetCategoryRepository;
import com.worksphere.asset.infrastructure.persistence.AssetRepository;
import com.worksphere.shared.security.JwtService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class AssetCategoryMockMvcTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("worksphere.jwt.secret",
                () -> "worksphere-integration-test-secret-key-at-least-32-chars");
        registry.add("worksphere.jwt.access-token-expiry-seconds", () -> "900");
    }

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired(required = false)
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AssetCategoryRepository categoryRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private UUID adminUserId;
    private UUID employeeUserId;
    private String adminToken;
    private String employeeToken;

    @BeforeEach
    void setUp() {
        authorizationTestSessions.deleteAll();
        if (objectMapper == null) {
            objectMapper = new ObjectMapper().findAndRegisterModules();
        }

        OpenEntityManagerInViewFilter osivFilter = new OpenEntityManagerInViewFilter();
        osivFilter.setServletContext(context.getServletContext());

        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(osivFilter)
                .apply(springSecurity())
                .build();

        jdbcTemplate.update("DELETE FROM asset_repair_histories");
        jdbcTemplate.update("DELETE FROM asset_assignments");
        jdbcTemplate.update("DELETE FROM service_requests");
        jdbcTemplate.update("DELETE FROM assets");
        jdbcTemplate.update("DELETE FROM asset_categories");

        jdbcTemplate.update("DELETE FROM user_roles");
        jdbcTemplate.update("DELETE FROM users");

        adminUserId = UUID.randomUUID();
        insertUser(adminUserId, "admin_user", "admin@worksphere.com");
        UUID adminRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'ADMIN'", UUID.class);
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                adminUserId, adminRoleId);
        adminToken = authorizationAccessToken(adminUserId);

        employeeUserId = UUID.randomUUID();
        insertUser(employeeUserId, "emp_user", "employee@worksphere.com");
        UUID empRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'EMPLOYEE'", UUID.class);
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                employeeUserId, empRoleId);
        employeeToken = authorizationAccessToken(employeeUserId);
    }

    private void insertUser(UUID id, String username, String email) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, ?, 'Test User', 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordEncoder.encode("Password123!")
        );
    }

    @Test
    @DisplayName("Create asset category successfully with normalized uppercase code")
    void testCreateCategorySuccess() throws Exception {
        CreateAssetCategoryRequest req = new CreateAssetCategoryRequest(
                "laptop", "Máy tính xách tay", "Thiết bị laptop", true
        );

        mockMvc.perform(post("/api/v1/admin/asset-categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("LAPTOP"))
                .andExpect(jsonPath("$.data.name").value("Máy tính xách tay"))
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    @DisplayName("Create asset category duplicate code returns 409 ASSET_CATEGORY_CODE_ALREADY_EXISTS")
    void testCreateCategoryDuplicateCode() throws Exception {
        AssetCategory cat = AssetCategory.create(
                UUID.randomUUID(), "MONITOR", "Màn hình", "Mô tả", true, Instant.now()
        );
        categoryRepository.save(cat);

        CreateAssetCategoryRequest req = new CreateAssetCategoryRequest(
                "MONITOR", "Màn hình mới", "Mô tả trùng", true
        );

        mockMvc.perform(post("/api/v1/admin/asset-categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ASSET_CATEGORY_CODE_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Public get asset-categories returns only active categories")
    void testGetPublicActiveCategories() throws Exception {
        AssetCategory cat1 = AssetCategory.create(
                UUID.randomUUID(), "CAT_ACTIVE", "Active Category", "Desc", true, Instant.now()
        );
        AssetCategory cat2 = AssetCategory.create(
                UUID.randomUUID(), "CAT_INACTIVE", "Inactive Category", "Desc", false, Instant.now()
        );
        categoryRepository.save(cat1);
        categoryRepository.save(cat2);

        mockMvc.perform(get("/api/v1/asset-categories")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].code").value("CAT_ACTIVE"));
    }

    @Test
    @DisplayName("Admin get paginated categories with search and active filter")
    void testGetAdminCategories() throws Exception {
        AssetCategory cat1 = AssetCategory.create(
                UUID.randomUUID(), "SERVER_RACK", "Server Rack", "Desc", true, Instant.now()
        );
        AssetCategory cat2 = AssetCategory.create(
                UUID.randomUUID(), "SERVER_BLADE", "Server Blade", "Desc", false, Instant.now()
        );
        categoryRepository.save(cat1);
        categoryRepository.save(cat2);

        mockMvc.perform(get("/api/v1/admin/asset-categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", "SERVER")
                        .param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].code").value("SERVER_BLADE"));
    }

    @Test
    @DisplayName("Update asset category updates name and description while code remains immutable")
    void testUpdateCategorySuccess() throws Exception {
        AssetCategory cat = AssetCategory.create(
                UUID.randomUUID(), "PRINTER", "Máy in", "Mô tả cũ", true, Instant.now()
        );
        AssetCategory saved = categoryRepository.save(cat);

        UpdateAssetCategoryRequest req = new UpdateAssetCategoryRequest(
                "Máy in đa năng", "Mô tả mới", true, saved.getVersion()
        );

        mockMvc.perform(put("/api/v1/admin/asset-categories/" + saved.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Máy in đa năng"))
                .andExpect(jsonPath("$.data.code").value("PRINTER"));
    }

    @Test
    @DisplayName("Deactivate asset category in-use by AVAILABLE asset returns 400 ASSET_CATEGORY_IN_USE")
    void testDeactivateInUseByAvailableAssetFails() throws Exception {
        AssetCategory cat = AssetCategory.create(
                UUID.randomUUID(), "TABLET", "Máy tính bảng", "Desc", true, Instant.now()
        );
        AssetCategory savedCat = categoryRepository.save(cat);

        Asset asset = Asset.create(
                UUID.randomUUID(), "TAB-001", savedCat.getId(), "iPad Pro", "Tablet",
                "SN-TAB-01", "Apple", "iPad Pro", LocalDate.now(), BigDecimal.valueOf(20000000),
                LocalDate.now().plusYears(1), "Kho A", adminUserId, Instant.now()
        );
        assetRepository.save(asset);

        mockMvc.perform(put("/api/v1/admin/asset-categories/" + savedCat.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ASSET_CATEGORY_IN_USE"));
    }

    @Test
    @DisplayName("Deactivate asset category in-use by RETIRED asset returns 400 ASSET_CATEGORY_IN_USE")
    void testDeactivateInUseByRetiredAssetFails() throws Exception {
        AssetCategory cat = AssetCategory.create(
                UUID.randomUUID(), "SCANNER", "Máy quét", "Desc", true, Instant.now()
        );
        AssetCategory savedCat = categoryRepository.save(cat);

        Asset asset = Asset.create(
                UUID.randomUUID(), "SCN-001", savedCat.getId(), "Scanner cũ", "Máy quét thanh lý",
                "SN-SCN-01", "Canon", "Lide", LocalDate.now(), BigDecimal.valueOf(2000000),
                LocalDate.now().plusYears(1), "Kho C", adminUserId, Instant.now()
        );
        asset.update(null, "Scanner cũ", "Thanh lý", "SN-SCN-01", "Canon", "Lide",
                LocalDate.now(), BigDecimal.valueOf(2000000), LocalDate.now().plusYears(1),
                AssetStatus.RETIRED, "Kho C", adminUserId, Instant.now());
        assetRepository.save(asset);

        mockMvc.perform(put("/api/v1/admin/asset-categories/" + savedCat.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ASSET_CATEGORY_IN_USE"));
    }

    @Test
    @DisplayName("Activate and deactivate category lifecycle works when not in use")
    void testActivateDeactivateLifecycle() throws Exception {
        AssetCategory cat = AssetCategory.create(
                UUID.randomUUID(), "HEADSET", "Tai nghe", "Desc", true, Instant.now()
        );
        AssetCategory savedCat = categoryRepository.save(cat);

        // Deactivate
        mockMvc.perform(put("/api/v1/admin/asset-categories/" + savedCat.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));

        // Re-deactivate returns 400 ASSET_CATEGORY_ALREADY_INACTIVE
        mockMvc.perform(put("/api/v1/admin/asset-categories/" + savedCat.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_CATEGORY_ALREADY_INACTIVE"));

        // Activate
        mockMvc.perform(put("/api/v1/admin/asset-categories/" + savedCat.getId() + "/activate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));

        // Re-activate returns 400 ASSET_CATEGORY_ALREADY_ACTIVE
        mockMvc.perform(put("/api/v1/admin/asset-categories/" + savedCat.getId() + "/activate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_CATEGORY_ALREADY_ACTIVE"));
    }

    @Test
    @DisplayName("Non-admin user is rejected with 403 on admin category endpoints")
    void testNonAdminForbidden() throws Exception {
        CreateAssetCategoryRequest req = new CreateAssetCategoryRequest(
                "PHONE", "Điện thoại", "Mô tả", true
        );

        mockMvc.perform(post("/api/v1/admin/asset-categories")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.worksphere.identity.infrastructure.persistence.LoginSessionRepository authorizationTestSessions;

    private String authorizationAccessToken(UUID userId) {
        UUID sessionId = UUID.randomUUID();
        authorizationTestSessions.save(com.worksphere.identity.domain.LoginSession.create(
                sessionId, userId, null, "HTTP test", "127.0.0.1", "JUnit"));
        return jwtService.generateAccessToken(userId, sessionId);
    }
}
