package com.worksphere.asset;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.asset.api.request.CreateAssetRequest;
import com.worksphere.asset.api.request.UpdateAssetRequest;
import com.worksphere.asset.domain.Asset;
import com.worksphere.asset.domain.AssetAssignment;
import com.worksphere.asset.domain.AssetCategory;
import com.worksphere.asset.domain.AssetStatus;
import com.worksphere.asset.infrastructure.persistence.AssetAssignmentRepository;
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
public class AssetCoreMockMvcTest {

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
    private AssetAssignmentRepository assignmentRepository;

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

    private AssetCategory activeCategory;
    private AssetCategory inactiveCategory;

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

        jdbcTemplate.update("DELETE FROM service_assignments");
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

        activeCategory = AssetCategory.create(
                UUID.randomUUID(), "LAPTOP", "Laptop", "Laptop Category", true, Instant.now()
        );
        categoryRepository.save(activeCategory);

        inactiveCategory = AssetCategory.create(
                UUID.randomUUID(), "OLD_DEVICE", "Thiết bị cũ", "Không dùng nữa", false, Instant.now()
        );
        categoryRepository.save(inactiveCategory);
    }

    private void insertUser(UUID id, String username, String email) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, ?, 'Test User', 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordEncoder.encode("Password123!")
        );
    }

    @Test
    @DisplayName("Create asset successfully with initial AVAILABLE status and uppercase normalized code")
    void testCreateAssetSuccess() throws Exception {
        CreateAssetRequest req = new CreateAssetRequest(
                "lap-00001", activeCategory.getId(), "Dell Latitude 5420",
                "Laptop cho DEV", "SN-DELL-001", "Dell", "5420",
                LocalDate.of(2026, 1, 15), BigDecimal.valueOf(25000000),
                LocalDate.of(2029, 1, 15), "Tầng 3"
        );

        mockMvc.perform(post("/api/v1/assets")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assetCode").value("LAP-00001"))
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.data.name").value("Dell Latitude 5420"));
    }

    @Test
    @DisplayName("Create asset with inactive category returns 400 ASSET_CATEGORY_ALREADY_INACTIVE")
    void testCreateAssetWithInactiveCategoryFails() throws Exception {
        CreateAssetRequest req = new CreateAssetRequest(
                "OLD-00001", inactiveCategory.getId(), "Old Laptop",
                "Desc", null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/assets")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_CATEGORY_ALREADY_INACTIVE"));
    }

    @Test
    @DisplayName("Create asset duplicate assetCode returns 409 ASSET_CODE_ALREADY_EXISTS")
    void testCreateAssetDuplicateCodeFails() throws Exception {
        Asset asset = Asset.create(
                UUID.randomUUID(), "LAP-EXIST", activeCategory.getId(), "Existing Laptop",
                "Desc", null, null, null, null, null, null, null, adminUserId, Instant.now()
        );
        assetRepository.save(asset);

        CreateAssetRequest req = new CreateAssetRequest(
                "lap-exist", activeCategory.getId(), "Duplicate Laptop",
                "Desc", null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/assets")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ASSET_CODE_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Create asset duplicate serial number returns 409 ASSET_SERIAL_ALREADY_EXISTS")
    void testCreateAssetDuplicateSerialFails() throws Exception {
        Asset asset = Asset.create(
                UUID.randomUUID(), "LAP-001", activeCategory.getId(), "Laptop 1",
                "Desc", "SN-SAME-999", null, null, null, null, null, null, adminUserId, Instant.now()
        );
        assetRepository.save(asset);

        CreateAssetRequest req = new CreateAssetRequest(
                "LAP-002", activeCategory.getId(), "Laptop 2",
                "Desc", "SN-SAME-999", null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/assets")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ASSET_SERIAL_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Update asset updates metadata and follows transition matrix")
    void testUpdateAssetSuccess() throws Exception {
        Asset asset = Asset.create(
                UUID.randomUUID(), "LAP-UP-01", activeCategory.getId(), "Laptop Original",
                "Original Desc", "SN-UP-01", "Dell", "5420",
                LocalDate.now(), BigDecimal.valueOf(20000000), LocalDate.now().plusYears(1),
                "Kho 1", adminUserId, Instant.now()
        );
        Asset saved = assetRepository.save(asset);

        UpdateAssetRequest req = new UpdateAssetRequest(
                activeCategory.getId(), "Laptop Updated Name", "Updated Desc",
                "SN-UP-01", "Dell", "5420",
                LocalDate.now(), BigDecimal.valueOf(22000000), LocalDate.now().plusYears(1),
                AssetStatus.MAINTENANCE, "Phòng Kỹ Thuật", saved.getVersion()
        );

        mockMvc.perform(put("/api/v1/assets/" + saved.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Laptop Updated Name"))
                .andExpect(jsonPath("$.data.status").value("MAINTENANCE"))
                .andExpect(jsonPath("$.data.assetCode").value("LAP-UP-01"));
    }

    @Test
    @DisplayName("Update asset directly to ASSIGNED is rejected with 400 ASSET_STATUS_TRANSITION_INVALID")
    void testUpdateAssetToAssignedFails() throws Exception {
        Asset asset = Asset.create(
                UUID.randomUUID(), "LAP-NO-ASSIGN", activeCategory.getId(), "Laptop",
                null, null, null, null, null, null, null, null, adminUserId, Instant.now()
        );
        Asset saved = assetRepository.save(asset);

        UpdateAssetRequest req = new UpdateAssetRequest(
                activeCategory.getId(), "Laptop", null, null, null, null,
                null, null, null, AssetStatus.ASSIGNED, null, saved.getVersion()
        );

        mockMvc.perform(put("/api/v1/assets/" + saved.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_STATUS_TRANSITION_INVALID"));
    }

    @Test
    @DisplayName("Update asset away from RETIRED terminal state returns 400 ASSET_RETIRED")
    void testUpdateRetiredAssetFails() throws Exception {
        Asset asset = Asset.create(
                UUID.randomUUID(), "LAP-RET", activeCategory.getId(), "Retired Laptop",
                null, null, null, null, null, null, null, null, adminUserId, Instant.now()
        );
        asset.update(null, "Retired", null, null, null, null, null, null, null,
                AssetStatus.RETIRED, null, adminUserId, Instant.now());
        Asset saved = assetRepository.save(asset);

        UpdateAssetRequest req = new UpdateAssetRequest(
                activeCategory.getId(), "Retired Laptop", null, null, null, null,
                null, null, null, AssetStatus.AVAILABLE, null, saved.getVersion()
        );

        mockMvc.perform(put("/api/v1/assets/" + saved.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_RETIRED"));
    }

    @Test
    @DisplayName("Read scoping: Admin sees all, Non-admin only sees actively assigned assets")
    void testReadScopingAndDetailAuthorization() throws Exception {
        // Asset 1 assigned to Employee 1
        Asset asset1 = Asset.create(
                UUID.randomUUID(), "LAP-E1", activeCategory.getId(), "Asset For Emp 1",
                null, null, null, null, null, null, null, null, adminUserId, Instant.now()
        );
        asset1.assign(adminUserId, Instant.now());
        assetRepository.save(asset1);
        AssetAssignment aa1 = AssetAssignment.create(
                UUID.randomUUID(), asset1.getId(), employee1Id, adminUserId,
                Instant.now(), null, "Assign for emp1", Instant.now()
        );
        assignmentRepository.save(aa1);

        // Asset 2 assigned to Employee 2
        Asset asset2 = Asset.create(
                UUID.randomUUID(), "LAP-E2", activeCategory.getId(), "Asset For Emp 2",
                null, null, null, null, null, null, null, null, adminUserId, Instant.now()
        );
        asset2.assign(adminUserId, Instant.now());
        assetRepository.save(asset2);
        AssetAssignment aa2 = AssetAssignment.create(
                UUID.randomUUID(), asset2.getId(), employee2Id, adminUserId,
                Instant.now(), null, "Assign for emp2", Instant.now()
        );
        assignmentRepository.save(aa2);

        // 1. Admin calls GET /api/v1/assets -> sees 2 assets
        mockMvc.perform(get("/api/v1/assets")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(2));

        // 2. Employee 1 calls GET /api/v1/assets -> sees only Asset 1
        mockMvc.perform(get("/api/v1/assets")
                        .header("Authorization", "Bearer " + employee1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].assetCode").value("LAP-E1"));

        // 3. Employee 1 calls GET /api/v1/assets/my-assets -> sees Asset 1
        mockMvc.perform(get("/api/v1/assets/my-assets")
                        .header("Authorization", "Bearer " + employee1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].assetCode").value("LAP-E1"));

        // 4. Employee 1 attempts to pass assignedTo=employee2Id to expand scope -> still sees only Asset 1
        mockMvc.perform(get("/api/v1/assets")
                        .header("Authorization", "Bearer " + employee1Token)
                        .param("assignedTo", employee2Id.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].assetCode").value("LAP-E1"));

        // 5. Employee 1 detail access to Asset 1 -> 200 OK
        mockMvc.perform(get("/api/v1/assets/" + asset1.getId())
                        .header("Authorization", "Bearer " + employee1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assetCode").value("LAP-E1"));

        // 6. Employee 1 detail access to Asset 2 -> 403 ASSET_ACCESS_DENIED
        mockMvc.perform(get("/api/v1/assets/" + asset2.getId())
                        .header("Authorization", "Bearer " + employee1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ASSET_ACCESS_DENIED"));
    }

    private Asset createTestAsset(String code, AssetStatus status) {
        Asset asset = Asset.create(
                UUID.randomUUID(),
                code,
                activeCategory.getId(),
                "Device " + code,
                "Description",
                "SN-" + code,
                "Dell",
                "Latitude 7420",
                LocalDate.of(2025, 1, 1),
                new BigDecimal("20000000"),
                LocalDate.of(2027, 1, 1),
                "Floor 3",
                adminUserId,
                Instant.now()
        );
        if (status != AssetStatus.AVAILABLE) {
            asset.changeStatus(status, Instant.now());
        }
        return assetRepository.save(asset);
    }

    @Test
    @DisplayName("Related Service Requests: Áp dụng nhất quán phân quyền Phase 9 (Requester hoặc Active Assignee)")
    void testRelatedServiceRequestsAuthorizationConsistency() throws Exception {
        // 1. Tạo Asset và gán cho Employee 1
        Asset asset = createTestAsset("LAP-SR-AUTH", AssetStatus.AVAILABLE);
        asset.assign(adminUserId, Instant.now());
        assetRepository.save(asset);
        AssetAssignment aa = AssetAssignment.create(
                UUID.randomUUID(), asset.getId(), employee1Id, adminUserId,
                Instant.now(), null, "Giao máy", Instant.now()
        );
        assignmentRepository.save(aa);

        UUID serviceCatId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_categories (id, code, name, default_priority, is_active, created_at, updated_at, version) " +
                "VALUES (?, 'IT_HARDWARE', 'Phần cứng', 'MEDIUM', true, now(), now(), 0)",
                serviceCatId
        );

        // SR1: Employee 1 là requester trên asset này -> Employee 1 THẤY
        UUID sr1Id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_requests (id, request_number, category_id, requester_id, asset_id, title, description, priority, status, created_by, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, 'SR-REQ-01', ?, ?, ?, 'Màn hình bị nháy', 'Desc', 'MEDIUM', 'OPEN', ?, false, now(), now(), 0)",
                sr1Id, serviceCatId, employee1Id, asset.getId(), employee1Id
        );

        // SR2: Employee 2 là requester, nhưng Employee 1 là ACTIVE assignee -> Employee 1 THẤY
        UUID sr2Id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_requests (id, request_number, category_id, requester_id, asset_id, title, description, priority, status, created_by, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, 'SR-REQ-02', ?, ?, ?, 'Bàn phím hỏng', 'Desc', 'MEDIUM', 'IN_PROGRESS', ?, false, now(), now(), 0)",
                sr2Id, serviceCatId, employee2Id, asset.getId(), employee2Id
        );
        UUID saActiveId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_assignments (id, request_id, assignee_id, assigned_by, assigned_at, is_active) " +
                "VALUES (?, ?, ?, ?, now(), true)",
                saActiveId, sr2Id, employee1Id, adminUserId
        );

        // SR3: Employee 2 là requester, Employee 1 từng là assignee nhưng ĐÃ INACTIVE (is_active = false) -> Employee 1 KHÔNG THẤY
        UUID sr3Id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_requests (id, request_number, category_id, requester_id, asset_id, title, description, priority, status, created_by, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, 'SR-REQ-03', ?, ?, ?, 'Chuột hỏng', 'Desc', 'LOW', 'OPEN', ?, false, now(), now(), 0)",
                sr3Id, serviceCatId, employee2Id, asset.getId(), employee2Id
        );
        UUID saInactiveId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_assignments (id, request_id, assignee_id, assigned_by, assigned_at, unassigned_at, is_active) " +
                "VALUES (?, ?, ?, ?, now(), now(), false)",
                saInactiveId, sr3Id, employee1Id, adminUserId
        );

        // SR4: Yêu cầu của tài sản khác -> KHÔNG THẤY
        Asset otherAsset = createTestAsset("LAP-OTHER", AssetStatus.AVAILABLE);
        UUID sr4Id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_requests (id, request_number, category_id, requester_id, asset_id, title, description, priority, status, created_by, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, 'SR-REQ-04', ?, ?, ?, 'Máy khác', 'Desc', 'LOW', 'OPEN', ?, false, now(), now(), 0)",
                sr4Id, serviceCatId, employee1Id, otherAsset.getId(), employee1Id
        );

        // SR5: Thuộc asset này, requester là Employee 1 nhưng ĐÃ BỊ XÓA MỀM (is_deleted = true) -> KHÔNG THẤY
        UUID sr5Id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_requests (id, request_number, category_id, requester_id, asset_id, title, description, priority, status, created_by, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, 'SR-REQ-05', ?, ?, ?, 'Đã xóa', 'Desc', 'LOW', 'OPEN', ?, true, now(), now(), 0)",
                sr5Id, serviceCatId, employee1Id, asset.getId(), employee1Id
        );

        // 1. Employee 1 gọi GET /api/v1/assets/{id}: chỉ thấy SR1 (requester) và SR2 (active assignee)
        MvcResult empRes = mockMvc.perform(get("/api/v1/assets/" + asset.getId())
                        .header("Authorization", "Bearer " + employee1Token))
                .andExpect(status().isOk())
                .andReturn();

        String empJson = empRes.getResponse().getContentAsString();
        com.fasterxml.jackson.databind.JsonNode empNode = objectMapper.readTree(empJson).path("data").path("relatedServiceRequests");
        assertThat(empNode.size()).isEqualTo(2);
        java.util.List<String> empSrNums = new java.util.ArrayList<>();
        java.util.List<UUID> empSrIds = new java.util.ArrayList<>();
        empNode.forEach(n -> {
            empSrNums.add(n.path("requestNumber").asText());
            empSrIds.add(UUID.fromString(n.path("id").asText()));
        });
        assertThat(empSrNums).containsExactlyInAnyOrder("SR-REQ-01", "SR-REQ-02");
        assertThat(empSrIds).containsExactlyInAnyOrder(sr1Id, sr2Id);

        // 2. Admin gọi GET /api/v1/assets/{id}: thấy tất cả non-deleted SR của asset này (SR1, SR2, SR3), không thấy SR4 (asset khác) và SR5 (đã xóa)
        MvcResult adminRes = mockMvc.perform(get("/api/v1/assets/" + asset.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        String adminJson = adminRes.getResponse().getContentAsString();
        com.fasterxml.jackson.databind.JsonNode adminNode = objectMapper.readTree(adminJson).path("data").path("relatedServiceRequests");
        assertThat(adminNode.size()).isEqualTo(3);
        java.util.List<String> adminSrNums = new java.util.ArrayList<>();
        java.util.List<UUID> adminSrIds = new java.util.ArrayList<>();
        adminNode.forEach(n -> {
            adminSrNums.add(n.path("requestNumber").asText());
            adminSrIds.add(UUID.fromString(n.path("id").asText()));
        });
        assertThat(adminSrNums).containsExactlyInAnyOrder("SR-REQ-01", "SR-REQ-02", "SR-REQ-03");
        assertThat(adminSrIds).containsExactlyInAnyOrder(sr1Id, sr2Id, sr3Id);
    }
}
