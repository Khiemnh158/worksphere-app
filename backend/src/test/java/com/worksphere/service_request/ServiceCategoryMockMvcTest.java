package com.worksphere.service_request;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.service_request.api.request.CreateServiceCategoryRequest;
import com.worksphere.service_request.api.request.UpdateServiceCategoryRequest;
import com.worksphere.service_request.domain.ServiceCategory;
import com.worksphere.service_request.domain.ServicePriority;
import com.worksphere.service_request.infrastructure.persistence.ServiceCategoryRepository;
import com.worksphere.shared.security.JwtService;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
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
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ServiceCategoryMockMvcTest {

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
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

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
        if (objectMapper == null) {
            objectMapper = new ObjectMapper().findAndRegisterModules();
        }

        OpenEntityManagerInViewFilter osivFilter = new OpenEntityManagerInViewFilter();
        osivFilter.setServletContext(context.getServletContext());

        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(osivFilter)
                .apply(springSecurity())
                .build();

        jdbcTemplate.update("DELETE FROM service_ratings");
        jdbcTemplate.update("DELETE FROM service_status_histories");
        jdbcTemplate.update("DELETE FROM service_comments");
        jdbcTemplate.update("DELETE FROM service_attachments");
        jdbcTemplate.update("DELETE FROM service_assignments");
        jdbcTemplate.update("DELETE FROM service_requests");
        jdbcTemplate.update("UPDATE service_categories SET parent_id = NULL");
        jdbcTemplate.update("DELETE FROM service_categories");

        jdbcTemplate.update("DELETE FROM user_roles");
        userRepository.deleteAll();

        adminUserId = UUID.randomUUID();
        insertUser(adminUserId, "admin_cat_test", "admin_cat@test.com", passwordEncoder.encode("Password123!"));
        UUID adminRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'ADMIN'", UUID.class);
        if (adminRoleId != null) {
            jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())", adminUserId, adminRoleId);
        }
        adminToken = jwtService.generateAccessToken(adminUserId, UUID.randomUUID());

        employeeUserId = UUID.randomUUID();
        insertUser(employeeUserId, "emp_cat_test", "emp_cat@test.com", passwordEncoder.encode("Password123!"));
        UUID empRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'EMPLOYEE'", UUID.class);
        if (empRoleId != null) {
            jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())", employeeUserId, empRoleId);
        }
        employeeToken = jwtService.generateAccessToken(employeeUserId, UUID.randomUUID());
    }

    private void insertUser(UUID id, String username, String email, String passwordHash) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, ?, ?, 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordHash, "User " + username
        );
    }

    @Test
    @Order(1)
    void createCategory_success() throws Exception {
        CreateServiceCategoryRequest request = new CreateServiceCategoryRequest(
                null, "IT_SUPPORT", "Hỗ trợ CNTT", "Yêu cầu IT", ServicePriority.HIGH, true
        );

        mockMvc.perform(post("/api/v1/admin/service-categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("IT_SUPPORT"))
                .andExpect(jsonPath("$.data.defaultPriority").value("HIGH"))
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    @Order(2)
    void createCategory_duplicateCode_returns409() throws Exception {
        ServiceCategory cat = ServiceCategory.create(
                UUID.randomUUID(), null, "FACILITY", "Cơ sở vật chất", "Mô tả", ServicePriority.MEDIUM, true, Instant.now()
        );
        categoryRepository.save(cat);

        CreateServiceCategoryRequest request = new CreateServiceCategoryRequest(
                null, "FACILITY", "Cơ sở vật chất trùng", "Mô tả", ServicePriority.LOW, true
        );


        mockMvc.perform(post("/api/v1/admin/service-categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("SERVICE_CATEGORY_CODE_ALREADY_EXISTS"));
    }

    @Test
    @Order(3)
    void getActiveCategories_onlyReturnsActive() throws Exception {
        ServiceCategory activeCat = ServiceCategory.create(
                UUID.randomUUID(), null, "ACTIVE_CAT", "Active Cat", null, ServicePriority.LOW, true, Instant.now()
        );
        ServiceCategory inactiveCat = ServiceCategory.create(
                UUID.randomUUID(), null, "INACTIVE_CAT", "Inactive Cat", null, ServicePriority.LOW, false, Instant.now()
        );
        categoryRepository.save(activeCat);
        categoryRepository.save(inactiveCat);

        mockMvc.perform(get("/api/v1/service-categories")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].code").value("ACTIVE_CAT"));
    }

    @Test
    @Order(4)
    void adminSearchCategories_supportsPaginationAndFilters() throws Exception {
        ServiceCategory cat1 = ServiceCategory.create(
                UUID.randomUUID(), null, "CAT_A", "Hardware Support", null, ServicePriority.HIGH, true, Instant.now()
        );
        ServiceCategory cat2 = ServiceCategory.create(
                UUID.randomUUID(), null, "CAT_B", "Software Support", null, ServicePriority.MEDIUM, false, Instant.now()
        );
        categoryRepository.save(cat1);
        categoryRepository.save(cat2);

        mockMvc.perform(get("/api/v1/admin/service-categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("active", "false")
                        .param("search", "software"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].code").value("CAT_B"));
    }

    @Test
    @Order(5)
    void updateCategory_optimisticLockConflict_returns409() throws Exception {
        ServiceCategory cat = ServiceCategory.create(
                UUID.randomUUID(), null, "NETWORK", "Mạng nội bộ", "Mô tả", ServicePriority.HIGH, true, Instant.now()
        );
        cat = categoryRepository.save(cat);

        UpdateServiceCategoryRequest request = new UpdateServiceCategoryRequest(
                null, "Mạng cập nhật", "Mô tả mới", ServicePriority.CRITICAL, true, cat.getVersion() + 99
        );

        mockMvc.perform(put("/api/v1/admin/service-categories/" + cat.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("OPTIMISTIC_LOCK_CONFLICT"));
    }

    @Test
    @Order(6)
    void activateAndDeactivateCategory() throws Exception {
        ServiceCategory cat = ServiceCategory.create(
                UUID.randomUUID(), null, "HR_SERVICE", "Nhân sự", null, ServicePriority.LOW, true, Instant.now()
        );
        cat = categoryRepository.save(cat);

        // 1. Deactivate
        mockMvc.perform(put("/api/v1/admin/service-categories/" + cat.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 2. Deactivate already inactive -> 400
        mockMvc.perform(put("/api/v1/admin/service-categories/" + cat.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_CATEGORY_ALREADY_INACTIVE"));

        // 3. Activate
        mockMvc.perform(put("/api/v1/admin/service-categories/" + cat.getId() + "/activate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 4. Activate already active -> 400
        mockMvc.perform(put("/api/v1/admin/service-categories/" + cat.getId() + "/activate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_CATEGORY_ALREADY_ACTIVE"));
    }

    @Test
    @Order(7)
    void parentValidation_missingOrInactiveParent_returns400() throws Exception {
        UUID randomParentId = UUID.randomUUID();
        CreateServiceCategoryRequest requestMissing = new CreateServiceCategoryRequest(
                randomParentId, "SUB_CAT", "Sub Category", null, ServicePriority.LOW, true
        );

        mockMvc.perform(post("/api/v1/admin/service-categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestMissing)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_CATEGORY_PARENT_INVALID"));

        ServiceCategory inactiveParent = ServiceCategory.create(
                UUID.randomUUID(), null, "INACTIVE_PARENT", "Inactive Parent", null, ServicePriority.LOW, false, Instant.now()
        );
        categoryRepository.save(inactiveParent);

        CreateServiceCategoryRequest requestInactive = new CreateServiceCategoryRequest(
                inactiveParent.getId(), "SUB_CAT_2", "Sub Category 2", null, ServicePriority.LOW, true
        );

        mockMvc.perform(post("/api/v1/admin/service-categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestInactive)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_CATEGORY_PARENT_INVALID"));
    }

    @Test
    @Order(8)
    void cycleDetection_selfParentAndMultiLevelCycle_returns400() throws Exception {
        ServiceCategory catA = ServiceCategory.create(
                UUID.randomUUID(), null, "CAT_CYCLE_A", "Cat Cycle A", null, ServicePriority.LOW, true, Instant.now()
        );
        catA = categoryRepository.save(catA);

        // 1. Self-parent
        UpdateServiceCategoryRequest selfParentReq = new UpdateServiceCategoryRequest(
                catA.getId(), catA.getName(), catA.getDescription(), catA.getDefaultPriority(), true, catA.getVersion()
        );
        mockMvc.perform(put("/api/v1/admin/service-categories/" + catA.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selfParentReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_CATEGORY_CYCLE_DETECTED"));

        // 2. Two-level and Multi-level cycle
        ServiceCategory catB = ServiceCategory.create(
                UUID.randomUUID(), catA.getId(), "CAT_CYCLE_B", "Cat Cycle B", null, ServicePriority.LOW, true, Instant.now()
        );
        catB = categoryRepository.save(catB);

        ServiceCategory catC = ServiceCategory.create(
                UUID.randomUUID(), catB.getId(), "CAT_CYCLE_C", "Cat Cycle C", null, ServicePriority.LOW, true, Instant.now()
        );
        catC = categoryRepository.save(catC);

        // Try setting parent of A to C (A -> B -> C -> A)
        UpdateServiceCategoryRequest cycleReq = new UpdateServiceCategoryRequest(
                catC.getId(), catA.getName(), catA.getDescription(), catA.getDefaultPriority(), true, catA.getVersion()
        );
        mockMvc.perform(put("/api/v1/admin/service-categories/" + catA.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cycleReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_CATEGORY_CYCLE_DETECTED"));
    }

    @Test
    @Order(9)
    void validChainDeep_over50Levels_succeedsWithoutCycleError() throws Exception {
        // Build valid chain of 52 levels: root -> cat1 -> cat2 -> ... -> cat52
        ServiceCategory currentParent = ServiceCategory.create(
                UUID.randomUUID(), null, "CHAIN_ROOT", "Chain Root", null, ServicePriority.LOW, true, Instant.now()
        );
        currentParent = categoryRepository.save(currentParent);

        for (int i = 1; i <= 52; i++) {
            ServiceCategory child = ServiceCategory.create(
                    UUID.randomUUID(), currentParent.getId(), "CHAIN_LVL_" + i, "Level " + i, null, ServicePriority.LOW, true, Instant.now()
            );
            currentParent = categoryRepository.save(child);
        }

        // Now update a new child pointing to level 52 as parent
        ServiceCategory target = ServiceCategory.create(
                UUID.randomUUID(), null, "CHAIN_TARGET", "Chain Target", null, ServicePriority.LOW, true, Instant.now()
        );
        target = categoryRepository.save(target);

        UpdateServiceCategoryRequest req = new UpdateServiceCategoryRequest(
                currentParent.getId(), target.getName(), target.getDescription(), target.getDefaultPriority(), true, target.getVersion()
        );

        mockMvc.perform(put("/api/v1/admin/service-categories/" + target.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @Order(10)
    void employeeWithoutAdminRole_isForbiddenOnAdminEndpoints() throws Exception {
        CreateServiceCategoryRequest request = new CreateServiceCategoryRequest(
                null, "SEC_TEST", "Sec Test", null, ServicePriority.LOW, true
        );

        mockMvc.perform(post("/api/v1/admin/service-categories")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
