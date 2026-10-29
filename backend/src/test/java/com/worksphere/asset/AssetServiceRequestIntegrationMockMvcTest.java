package com.worksphere.asset;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.asset.api.request.AssignAssetRequest;
import com.worksphere.asset.api.request.ReturnAssetRequest;
import com.worksphere.asset.domain.Asset;
import com.worksphere.asset.domain.AssetCategory;
import com.worksphere.asset.domain.AssetStatus;
import com.worksphere.asset.infrastructure.persistence.AssetCategoryRepository;
import com.worksphere.asset.infrastructure.persistence.AssetRepairHistoryRepository;
import com.worksphere.asset.infrastructure.persistence.AssetRepository;
import com.worksphere.service_request.api.request.CreateServiceRequestRequest;
import com.worksphere.service_request.domain.ServicePriority;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class AssetServiceRequestIntegrationMockMvcTest {

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
    private AssetRepairHistoryRepository repairHistoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private UUID adminUserId;
    private UUID employee1Id;
    private UUID employee2Id;
    private String adminToken;
    private String employee1Token;
    private String employee2Token;

    private AssetCategory assetCategory;
    private UUID serviceCategoryId;

    @BeforeEach
    void setUp() {
        if (objectMapper == null) {
            objectMapper = new ObjectMapper().findAndRegisterModules();
        }

        OpenEntityManagerInViewFilter osivFilter = new OpenEntityManagerInViewFilter();
        osivFilter.setServletContext(context.getServletContext());

        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(osivFilter)
                .apply(springSecurity())
                .build();

        jdbcTemplate.update("DELETE FROM service_status_histories");
        jdbcTemplate.update("DELETE FROM service_assignments");
        jdbcTemplate.update("DELETE FROM service_comments");
        jdbcTemplate.update("DELETE FROM service_ratings");
        jdbcTemplate.update("DELETE FROM service_attachments");
        jdbcTemplate.update("DELETE FROM service_requests");
        jdbcTemplate.update("DELETE FROM service_categories");

        jdbcTemplate.update("DELETE FROM asset_repair_histories");
        jdbcTemplate.update("DELETE FROM asset_assignments");
        jdbcTemplate.update("DELETE FROM assets");
        jdbcTemplate.update("DELETE FROM asset_categories");

        jdbcTemplate.update("DELETE FROM user_roles");
        jdbcTemplate.update("DELETE FROM users");

        adminUserId = UUID.randomUUID();
        insertUser(adminUserId, "admin_user", "admin@worksphere.com");
        UUID adminRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'ADMIN'", UUID.class);
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                adminUserId, adminRoleId);
        adminToken = jwtService.generateAccessToken(adminUserId, UUID.randomUUID());

        employee1Id = UUID.randomUUID();
        insertUser(employee1Id, "emp1_user", "emp1@worksphere.com");
        UUID empRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'EMPLOYEE'", UUID.class);
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                employee1Id, empRoleId);
        employee1Token = jwtService.generateAccessToken(employee1Id, UUID.randomUUID());

        employee2Id = UUID.randomUUID();
        insertUser(employee2Id, "emp2_user", "emp2@worksphere.com");
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                employee2Id, empRoleId);
        employee2Token = jwtService.generateAccessToken(employee2Id, UUID.randomUUID());

        assetCategory = AssetCategory.create(
                UUID.randomUUID(), "LAPTOP", "Laptop", "Laptop Category", true, Instant.now()
        );
        categoryRepository.save(assetCategory);

        serviceCategoryId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_categories (id, code, name, default_priority, is_active, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, 'MEDIUM', true, now(), now(), 0)",
                serviceCategoryId, "IT_SUPPORT", "Hỗ trợ kỹ thuật IT"
        );
    }

    private void insertUser(UUID id, String username, String email) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, ?, 'Test User', 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordEncoder.encode("Password123!")
        );
    }

    private Asset createTestAsset(String code) {
        Asset asset = Asset.create(
                UUID.randomUUID(),
                code,
                assetCategory.getId(),
                "Device " + code,
                "Description",
                "SN-" + code,
                "Dell",
                "Latitude",
                LocalDate.of(2025, 1, 1),
                new BigDecimal("25000000"),
                LocalDate.of(2028, 1, 1),
                "Floor 2",
                adminUserId,
                Instant.now()
        );
        return assetRepository.save(asset);
    }

    @Test
    @DisplayName("Non-admin gắn tài sản đang được cấp phát cho chính mình vào Service Request thành công")
    void testNonAdminLinksOwnActiveAssignedAssetSuccess() throws Exception {
        Asset asset = createTestAsset("SR-ASSET-01");

        // Giao cho employee1
        AssignAssetRequest assignReq = new AssignAssetRequest(employee1Id, null, "Cấp phát máy");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isCreated());

        // Employee1 tạo Service Request gắn asset này
        CreateServiceRequestRequest srReq = new CreateServiceRequestRequest(
                serviceCategoryId,
                "Máy tính không lên màn hình",
                "Đang làm việc thì màn hình bị đen",
                ServicePriority.HIGH,
                asset.getId(),
                null
        );

        mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + employee1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(srReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        // Kiểm tra: trạng thái Asset không bị thay đổi tự động
        Asset checkAsset = assetRepository.findById(asset.getId()).orElseThrow();
        assertThat(checkAsset.getStatus()).isEqualTo(AssetStatus.ASSIGNED);

        // Kiểm tra: không có Repair History nào được tự động tạo
        assertThat(repairHistoryRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("Non-admin gắn tài sản của người khác vào Service Request bị từ chối 403 ASSET_ACCESS_DENIED")
    void testNonAdminLinksOtherUserAssetDenied() throws Exception {
        Asset asset = createTestAsset("SR-ASSET-02");

        // Giao cho employee2
        AssignAssetRequest assignReq = new AssignAssetRequest(employee2Id, null, "Cấp phát cho Emp2");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isCreated());

        // Employee1 cố tình gắn asset của employee2
        CreateServiceRequestRequest srReq = new CreateServiceRequestRequest(
                serviceCategoryId,
                "Thử gắn máy người khác",
                "Mô tả",
                ServicePriority.MEDIUM,
                asset.getId(),
                null
        );

        mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + employee1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(srReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ASSET_ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Non-admin gắn tài sản đã thu hồi (RETURNED) bị từ chối 403 ASSET_ACCESS_DENIED")
    void testNonAdminLinksReturnedAssetDenied() throws Exception {
        Asset asset = createTestAsset("SR-ASSET-03");

        // Giao cho employee1
        AssignAssetRequest assignReq = new AssignAssetRequest(employee1Id, null, "Cấp phát tạm");
        MvcResult assignRes = mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String assignmentId = objectMapper.readTree(assignRes.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Thu hồi máy
        ReturnAssetRequest returnReq = new ReturnAssetRequest("Thu hồi", AssetStatus.AVAILABLE, 0L);
        mockMvc.perform(put("/api/v1/assets/{assetId}/assignments/{assignmentId}/return", asset.getId(), assignmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(returnReq)))
                .andExpect(status().isOk());

        // Employee1 thử tạo Service Request với máy đã thu hồi
        CreateServiceRequestRequest srReq = new CreateServiceRequestRequest(
                serviceCategoryId,
                "Máy cũ đã trả",
                "Mô tả",
                ServicePriority.LOW,
                asset.getId(),
                null
        );

        mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + employee1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(srReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ASSET_ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Gắn tài sản đã bị xóa mềm (soft-deleted) bị từ chối 404 ASSET_NOT_FOUND")
    void testSoftDeletedAssetNotFound() throws Exception {
        Asset asset = createTestAsset("SR-ASSET-DEL");
        asset.softDelete(adminUserId, Instant.now());
        assetRepository.save(asset);

        CreateServiceRequestRequest srReq = new CreateServiceRequestRequest(
                serviceCategoryId,
                "Máy đã xóa mềm",
                "Mô tả",
                ServicePriority.LOW,
                asset.getId(),
                null
        );

        mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(srReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ASSET_NOT_FOUND"));
    }

    @Test
    @DisplayName("Admin có thể gắn bất kỳ tài sản hợp lệ nào vào Service Request")
    void testAdminCanLinkAnyValidAsset() throws Exception {
        Asset assetAvail = createTestAsset("SR-ADMIN-01");

        CreateServiceRequestRequest srReq = new CreateServiceRequestRequest(
                serviceCategoryId,
                "Yêu cầu xử lý thiết bị kho",
                "Kiểm tra bảo dưỡng",
                ServicePriority.MEDIUM,
                assetAvail.getId(),
                null
        );

        mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(srReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Tạo Service Request không gắn tài sản (assetId null) vẫn hoạt động bình thường")
    void testCreateServiceRequestWithoutAssetStillWorks() throws Exception {
        CreateServiceRequestRequest srReq = new CreateServiceRequestRequest(
                serviceCategoryId,
                "Cài đặt phần mềm chung",
                "Không cần gắn thiết bị",
                ServicePriority.LOW,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + employee1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(srReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }
}
