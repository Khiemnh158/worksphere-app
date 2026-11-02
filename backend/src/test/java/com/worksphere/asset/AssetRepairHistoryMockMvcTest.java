package com.worksphere.asset;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.asset.api.request.AssignAssetRequest;
import com.worksphere.asset.api.request.CreateAssetRepairHistoryRequest;
import com.worksphere.asset.domain.Asset;
import com.worksphere.asset.domain.AssetCategory;
import com.worksphere.asset.domain.AssetRepairType;
import com.worksphere.asset.domain.AssetStatus;
import com.worksphere.asset.infrastructure.persistence.AssetAssignmentRepository;
import com.worksphere.asset.infrastructure.persistence.AssetCategoryRepository;
import com.worksphere.asset.infrastructure.persistence.AssetRepairHistoryRepository;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class AssetRepairHistoryMockMvcTest {

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

    private AssetCategory testCategory;
    private Asset testAsset;

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
        jdbcTemplate.update("DELETE FROM service_categories");
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

        employee1Id = UUID.randomUUID();
        insertUser(employee1Id, "emp1_user", "emp1@worksphere.com");
        UUID empRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'EMPLOYEE'", UUID.class);
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                employee1Id, empRoleId);
        employee1Token = authorizationAccessToken(employee1Id);

        employee2Id = UUID.randomUUID();
        insertUser(employee2Id, "emp2_user", "emp2@worksphere.com");
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                employee2Id, empRoleId);
        employee2Token = authorizationAccessToken(employee2Id);

        testCategory = AssetCategory.create(
                UUID.randomUUID(), "LAPTOP", "Laptop", "Laptop Category", true, Instant.now()
        );
        categoryRepository.save(testCategory);

        testAsset = Asset.create(
                UUID.randomUUID(),
                "REPAIR-ASSET-01",
                testCategory.getId(),
                "Dell Precision",
                "Workstation laptop",
                "SN-PRECISION-01",
                "Dell",
                "Precision 5570",
                LocalDate.of(2025, 1, 1),
                new BigDecimal("45000000"),
                LocalDate.of(2028, 1, 1),
                "Floor 5",
                adminUserId,
                Instant.now()
        );
        testAsset = assetRepository.save(testAsset);
    }

    private void insertUser(UUID id, String username, String email) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, ?, 'Test User', 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordEncoder.encode("Password123!")
        );
    }

    private UUID insertServiceRequest(UUID assetId, UUID requesterId) {
        UUID serviceCatId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_categories (id, code, name, default_priority, is_active, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, 'MEDIUM', true, now(), now(), 0)",
                serviceCatId, "CAT_" + UUID.randomUUID().toString().substring(0, 8), "IT Support"
        );

        UUID srId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO service_requests (id, request_number, category_id, requester_id, asset_id, title, description, priority, status, created_by, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, ?, ?, 'Broken keyboard', 'Keys not working', 'MEDIUM', 'OPEN', ?, false, now(), now(), 0)",
                srId, "SR-" + UUID.randomUUID().toString().substring(0, 8), serviceCatId, requesterId, assetId, requesterId
        );
        return srId;
    }

    @Test
    @DisplayName("Admin tạo lịch sử bảo dưỡng thành công và trạng thái Asset không bị tự động thay đổi")
    void testCreateRepairHistorySuccess() throws Exception {
        Instant started = Instant.now().minusSeconds(3600);
        Instant completed = Instant.now();

        CreateAssetRepairHistoryRequest request = new CreateAssetRepairHistoryRequest(
                null,
                AssetRepairType.MAINTENANCE,
                "Vệ sinh tra keo tản nhiệt định kỳ",
                "Phong Vũ",
                new BigDecimal("500000"),
                started,
                completed,
                "Hoàn thành tốt"
        );

        mockMvc.perform(post("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.repairType").value("MAINTENANCE"))
                .andExpect(jsonPath("$.data.description").value("Vệ sinh tra keo tản nhiệt định kỳ"))
                .andExpect(jsonPath("$.data.vendorName").value("Phong Vũ"))
                .andExpect(jsonPath("$.data.cost").value(500000))
                .andExpect(jsonPath("$.data.result").value("Hoàn thành tốt"));

        Asset after = assetRepository.findById(testAsset.getId()).orElseThrow();
        assertThat(after.getStatus()).isEqualTo(AssetStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Admin tạo lịch sử gắn với Service Request hợp lệ thành công")
    void testCreateRepairHistoryWithServiceRequestMatches() throws Exception {
        UUID srId = insertServiceRequest(testAsset.getId(), employee1Id);

        Instant started = Instant.now().minusSeconds(1800);
        CreateAssetRepairHistoryRequest request = new CreateAssetRepairHistoryRequest(
                srId,
                AssetRepairType.REPAIR,
                "Thay bàn phím mới theo yêu cầu",
                "Trung tâm bảo hành Dell",
                new BigDecimal("1200000"),
                started,
                null,
                "Đang chờ linh kiện"
        );

        mockMvc.perform(post("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.serviceRequestId").value(srId.toString()));
    }

    @Test
    @DisplayName("Tạo lịch sử bảo dưỡng gắn Service Request thuộc tài sản khác bị từ chối 400")
    void testCreateRepairHistoryWithServiceRequestMismatch() throws Exception {
        Asset otherAsset = Asset.create(
                UUID.randomUUID(),
                "OTHER-ASSET",
                testCategory.getId(),
                "Other PC",
                "Desc",
                "SN-OTHER",
                "HP",
                "EliteDesk",
                LocalDate.now(),
                BigDecimal.ZERO,
                LocalDate.now(),
                "Floor 1",
                adminUserId,
                Instant.now()
        );
        assetRepository.save(otherAsset);

        UUID otherSrId = insertServiceRequest(otherAsset.getId(), employee1Id);

        CreateAssetRepairHistoryRequest request = new CreateAssetRepairHistoryRequest(
                otherSrId,
                AssetRepairType.REPAIR,
                "Sửa chữa",
                null,
                BigDecimal.ZERO,
                Instant.now(),
                null,
                null
        );

        mockMvc.perform(post("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_STATUS_TRANSITION_INVALID"));
    }

    @Test
    @DisplayName("Validation bắt lỗi: cost âm hoặc completedAt nhỏ hơn startedAt")
    void testCreateRepairHistoryValidations() throws Exception {
        Instant started = Instant.now();
        Instant completedEarlier = started.minusSeconds(100);

        CreateAssetRepairHistoryRequest reqDate = new CreateAssetRepairHistoryRequest(
                null,
                AssetRepairType.INSPECTION,
                "Kiểm tra",
                null,
                BigDecimal.ZERO,
                started,
                completedEarlier,
                null
        );

        mockMvc.perform(post("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqDate)))
                .andExpect(status().isBadRequest());

        CreateAssetRepairHistoryRequest reqCost = new CreateAssetRepairHistoryRequest(
                null,
                AssetRepairType.INSPECTION,
                "Kiểm tra",
                null,
                new BigDecimal("-50000"),
                started,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqCost)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Non-admin bị từ chối 403 khi tạo lịch sử sửa chữa")
    void testCreateRepairHistoryForbiddenForNonAdmin() throws Exception {
        CreateAssetRepairHistoryRequest request = new CreateAssetRepairHistoryRequest(
                null,
                AssetRepairType.UPGRADE,
                "Nâng RAM",
                null,
                null,
                Instant.now(),
                null,
                null
        );

        mockMvc.perform(post("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + employee1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Xem danh sách lịch sử sửa chữa: Admin xem được, user được giao xem được, người ngoài bị từ chối 403")
    void testGetRepairHistoriesAuthorization() throws Exception {
        Instant t1 = Instant.now().minusSeconds(7200);
        Instant t2 = Instant.now().minusSeconds(3600);

        CreateAssetRepairHistoryRequest req1 = new CreateAssetRepairHistoryRequest(
                null, AssetRepairType.INSPECTION, "Đợt 1", null, null, t1, null, null
        );
        CreateAssetRepairHistoryRequest req2 = new CreateAssetRepairHistoryRequest(
                null, AssetRepairType.MAINTENANCE, "Đợt 2", null, null, t2, null, null
        );

        mockMvc.perform(post("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)));

        mockMvc.perform(post("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)));

        // Giao tài sản cho employee1
        AssignAssetRequest assignReq = new AssignAssetRequest(employee1Id, null, "Giao");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", testAsset.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(assignReq)));

        // 1. Admin đọc được và sắp xếp startedAt DESC
        mockMvc.perform(get("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].description").value("Đợt 2"))
                .andExpect(jsonPath("$.data[1].description").value("Đợt 1"));

        // 2. Employee 1 (được giao máy) đọc được
        mockMvc.perform(get("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + employee1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));

        // 3. Employee 2 (không liên quan) bị 403 ASSET_ACCESS_DENIED
        mockMvc.perform(get("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + employee2Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ASSET_ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Tính bất biến: Không có endpoint PUT hoặc DELETE cho lịch sử sửa chữa")
    void testRepairHistoryImmutabilityNoPutOrDelete() throws Exception {
        mockMvc.perform(put("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(delete("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Tạo lịch sử bảo dưỡng thành công khi không truyền chi phí (cost is null/optional)")
    void testCreateRepairHistoryWithNullCostSuccess() throws Exception {
        CreateAssetRepairHistoryRequest request = new CreateAssetRepairHistoryRequest(
                null,
                AssetRepairType.INSPECTION,
                "Kiểm định an toàn định kỳ không tính phí",
                "Nội bộ",
                null,
                Instant.now(),
                null,
                "Đạt chuẩn"
        );

        mockMvc.perform(post("/api/v1/assets/{assetId}/repair-histories", testAsset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cost").doesNotExist())
                .andExpect(jsonPath("$.data.description").value("Kiểm định an toàn định kỳ không tính phí"));
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
