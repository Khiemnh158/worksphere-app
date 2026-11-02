package com.worksphere.asset;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.asset.api.request.AssignAssetRequest;
import com.worksphere.asset.api.request.ReturnAssetRequest;
import com.worksphere.asset.domain.Asset;
import com.worksphere.asset.domain.AssetAssignment;
import com.worksphere.asset.domain.AssetAssignmentStatus;
import com.worksphere.asset.domain.AssetCategory;
import com.worksphere.asset.domain.AssetStatus;
import com.worksphere.asset.infrastructure.persistence.AssetAssignmentRepository;
import com.worksphere.asset.infrastructure.persistence.AssetCategoryRepository;
import com.worksphere.asset.infrastructure.persistence.AssetRepository;
import com.worksphere.shared.security.JwtService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
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
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.DynamicPropertyRegistry;
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
public class AssetAssignmentAndConcurrencyMockMvcTest {

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
    private UUID inactiveUserId;
    private String adminToken;
    private String employee1Token;

    private AssetCategory testCategory;

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
        insertUser(adminUserId, "admin_user", "admin@worksphere.com", "ACTIVE");
        UUID adminRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'ADMIN'", UUID.class);
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                adminUserId, adminRoleId);
        adminToken = authorizationAccessToken(adminUserId);

        employee1Id = UUID.randomUUID();
        insertUser(employee1Id, "emp1_user", "emp1@worksphere.com", "ACTIVE");
        UUID empRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'EMPLOYEE'", UUID.class);
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                employee1Id, empRoleId);
        employee1Token = authorizationAccessToken(employee1Id);

        employee2Id = UUID.randomUUID();
        insertUser(employee2Id, "emp2_user", "emp2@worksphere.com", "ACTIVE");
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                employee2Id, empRoleId);

        inactiveUserId = UUID.randomUUID();
        insertUser(inactiveUserId, "inactive_user", "inactive@worksphere.com", "DISABLED");
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                inactiveUserId, empRoleId);

        testCategory = AssetCategory.create(
                UUID.randomUUID(), "LAPTOP", "Laptop", "Laptop Category", true, Instant.now()
        );
        categoryRepository.save(testCategory);
    }

    private void insertUser(UUID id, String username, String email, String status) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, ?, 'Test User', ?, false, now(), now(), 0)",
                id, username, email, passwordEncoder.encode("Password123!"), status
        );
    }

    private Asset createTestAsset(String code, AssetStatus status) {
        Asset asset = Asset.create(
                UUID.randomUUID(),
                code,
                testCategory.getId(),
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
    @DisplayName("Giao tài sản thành công chuyển trạng thái sang ASSIGNED và tạo ACTIVE assignment")
    void testAssignAssetSuccess() throws Exception {
        Asset asset = createTestAsset("ASSIGN-01", AssetStatus.AVAILABLE);

        AssignAssetRequest request = new AssignAssetRequest(
                employee1Id,
                Instant.now().plusSeconds(86400 * 30),
                "Bàn giao làm việc"
        );

        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.assignedTo.id").value(employee1Id.toString()))
                .andExpect(jsonPath("$.data.notes").value("Bàn giao làm việc"));

        Asset updatedAsset = assetRepository.findById(asset.getId()).orElseThrow();
        assertThat(updatedAsset.getStatus()).isEqualTo(AssetStatus.ASSIGNED);

        List<AssetAssignment> assignments = assignmentRepository.findByAssetIdOrderByAssignedAtDesc(asset.getId());
        assertThat(assignments).hasSize(1);
        assertThat(assignments.get(0).getStatus()).isEqualTo(AssetAssignmentStatus.ACTIVE);
    }

    @Test
    @DisplayName("Giao tài sản khi đã có active assignment bị từ chối 400 ASSET_ALREADY_ASSIGNED")
    void testAssignAssetWhenAlreadyAssigned() throws Exception {
        Asset asset = createTestAsset("ASSIGN-02", AssetStatus.AVAILABLE);

        // Assign lần 1
        AssignAssetRequest request1 = new AssignAssetRequest(employee1Id, null, "Giao lần 1");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        // Assign lần 2 cho cùng user -> 400 ASSET_ALREADY_ASSIGNED
        AssignAssetRequest request2 = new AssignAssetRequest(employee1Id, null, "Giao lại");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_ALREADY_ASSIGNED"));

        // Assign lần 2 cho user khác (no direct reassignment) -> 400 ASSET_ALREADY_ASSIGNED
        AssignAssetRequest request3 = new AssignAssetRequest(employee2Id, null, "Giao người khác");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request3)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_ALREADY_ASSIGNED"));
    }

    @Test
    @DisplayName("Giao tài sản không ở trạng thái AVAILABLE bị từ chối 400")
    void testAssignAssetWhenNotAvailable() throws Exception {
        Asset assetMaint = createTestAsset("ASSIGN-MAINT", AssetStatus.MAINTENANCE);

        AssignAssetRequest request = new AssignAssetRequest(employee1Id, null, "Thử giao bảo trì");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", assetMaint.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_NOT_AVAILABLE"));
    }

    @Test
    @DisplayName("Giao tài sản cho user không tồn tại hoặc không ACTIVE bị từ chối")
    void testAssignAssetUserValidation() throws Exception {
        Asset asset = createTestAsset("ASSIGN-USR", AssetStatus.AVAILABLE);

        AssignAssetRequest requestNotFound = new AssignAssetRequest(UUID.randomUUID(), null, "User không tồn tại");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestNotFound)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));

        AssignAssetRequest requestInactive = new AssignAssetRequest(inactiveUserId, null, "User bị vô hiệu");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestInactive)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("USER_NOT_ACTIVE"));
    }

    @Test
    @DisplayName("Non-admin bị từ chối 403 khi thực hiện giao hoặc trả tài sản")
    void testAssignAndReturnForbiddenForNonAdmin() throws Exception {
        Asset asset = createTestAsset("ASSIGN-FORBID", AssetStatus.AVAILABLE);

        AssignAssetRequest assignReq = new AssignAssetRequest(employee1Id, null, "Thử giao");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + employee1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isForbidden());

        ReturnAssetRequest returnReq = new ReturnAssetRequest("Trả máy", AssetStatus.AVAILABLE, 0L);
        mockMvc.perform(put("/api/v1/assets/{assetId}/assignments/{assignmentId}/return", asset.getId(), UUID.randomUUID())
                        .header("Authorization", "Bearer " + employee1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(returnReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Trả tài sản thành công cập nhật trạng thái RETURNED và trạng thái Asset theo yêu cầu")
    void testReturnAssetSuccess() throws Exception {
        Asset asset = createTestAsset("RETURN-01", AssetStatus.AVAILABLE);

        AssignAssetRequest assignReq = new AssignAssetRequest(employee1Id, null, "Bàn giao ban đầu");
        MvcResult assignRes = mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String assignJson = assignRes.getResponse().getContentAsString();
        String assignmentId = objectMapper.readTree(assignJson).path("data").path("id").asText();

        ReturnAssetRequest returnReq = new ReturnAssetRequest("Máy hoàn trả nguyên vẹn", AssetStatus.AVAILABLE, 0L);
        mockMvc.perform(put("/api/v1/assets/{assetId}/assignments/{assignmentId}/return", asset.getId(), assignmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(returnReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RETURNED"))
                .andExpect(jsonPath("$.data.returnCondition").value("Máy hoàn trả nguyên vẹn"));

        Asset updated = assetRepository.findById(asset.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(AssetStatus.AVAILABLE);

        // Trả lại lần nữa -> 400 ASSET_ASSIGNMENT_NOT_ACTIVE
        mockMvc.perform(put("/api/v1/assets/{assetId}/assignments/{assignmentId}/return", asset.getId(), assignmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(returnReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_ASSIGNMENT_NOT_ACTIVE"));
    }

    @Test
    @DisplayName("Trả tài sản với resultingStatus là ASSIGNED bị từ chối 400 ASSET_STATUS_TRANSITION_INVALID")
    void testReturnAssetResultingStatusAssignedRejected() throws Exception {
        Asset asset = createTestAsset("RETURN-INV", AssetStatus.AVAILABLE);

        AssignAssetRequest assignReq = new AssignAssetRequest(employee1Id, null, "Giao");
        MvcResult assignRes = mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String assignmentId = objectMapper.readTree(assignRes.getResponse().getContentAsString())
                .path("data").path("id").asText();

        ReturnAssetRequest returnReq = new ReturnAssetRequest("Lỗi", AssetStatus.ASSIGNED, 0L);
        mockMvc.perform(put("/api/v1/assets/{assetId}/assignments/{assignmentId}/return", asset.getId(), assignmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(returnReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ASSET_STATUS_TRANSITION_INVALID"));
    }

    @Test
    @DisplayName("Trả tài sản rồi giao lại lưu giữ toàn bộ lịch sử phân bổ")
    void testReturnThenReassignHistoryPreserved() throws Exception {
        Asset asset = createTestAsset("HIST-01", AssetStatus.AVAILABLE);

        // 1. Assign cho employee 1
        AssignAssetRequest req1 = new AssignAssetRequest(employee1Id, null, "Giao đợt 1");
        MvcResult res1 = mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated())
                .andReturn();
        String assignId1 = objectMapper.readTree(res1.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // 2. Return về AVAILABLE
        ReturnAssetRequest ret1 = new ReturnAssetRequest("Thu hồi chuyển phòng ban", AssetStatus.AVAILABLE, 0L);
        mockMvc.perform(put("/api/v1/assets/{assetId}/assignments/{assignmentId}/return", asset.getId(), assignId1)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ret1)))
                .andExpect(status().isOk());

        // 3. Assign cho employee 2
        AssignAssetRequest req2 = new AssignAssetRequest(employee2Id, null, "Giao đợt 2");
        mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated());

        // Kiểm tra history
        List<AssetAssignment> list = assignmentRepository.findByAssetIdOrderByAssignedAtDesc(asset.getId());
        assertThat(list).hasSize(2);
        assertThat(list.stream().filter(a -> a.getStatus() == AssetAssignmentStatus.ACTIVE).count()).isEqualTo(1);
        assertThat(list.stream().filter(a -> a.getStatus() == AssetAssignmentStatus.RETURNED).count()).isEqualTo(1);
    }

    record WorkerResult(int status, String code) {}

    @Test
    @DisplayName("Thực thi phân bổ đồng thời có kiểm soát: 2 workers, 5 rounds, duy nhất 1 ACTIVE assignment")
    void testControlledConcurrencyRounds() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        int rounds = 5;

        try {
            for (int round = 1; round <= rounds; round++) {
                Asset asset = createTestAsset("CONCUR-" + round, AssetStatus.AVAILABLE);
                CyclicBarrier barrier = new CyclicBarrier(2);

                Callable<WorkerResult> task1 = () -> {
                    barrier.await();
                    AssignAssetRequest req = new AssignAssetRequest(employee1Id, null, "Concurrent Assign 1");
                    MvcResult res = mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                                    .header("Authorization", "Bearer " + adminToken)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(req)))
                            .andReturn();
                    int st = res.getResponse().getStatus();
                    String cd = null;
                    if (st != 201) {
                        cd = objectMapper.readTree(res.getResponse().getContentAsString()).path("code").asText();
                    }
                    return new WorkerResult(st, cd);
                };

                Callable<WorkerResult> task2 = () -> {
                    barrier.await();
                    AssignAssetRequest req = new AssignAssetRequest(employee2Id, null, "Concurrent Assign 2");
                    MvcResult res = mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                                    .header("Authorization", "Bearer " + adminToken)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(req)))
                            .andReturn();
                    int st = res.getResponse().getStatus();
                    String cd = null;
                    if (st != 201) {
                        cd = objectMapper.readTree(res.getResponse().getContentAsString()).path("code").asText();
                    }
                    return new WorkerResult(st, cd);
                };

                List<Future<WorkerResult>> futures = executor.invokeAll(List.of(task1, task2));
                WorkerResult r1 = futures.get(0).get(10, TimeUnit.SECONDS);
                WorkerResult r2 = futures.get(1).get(10, TimeUnit.SECONDS);

                // Không bao giờ được nhận 500
                assertThat(r1.status()).isNotEqualTo(500);
                assertThat(r2.status()).isNotEqualTo(500);

                boolean r1Success = r1.status() == 201;
                boolean r2Success = r2.status() == 201;

                // Đúng 1 worker thành công 201
                assertThat(r1Success ^ r2Success).as("Round " + round + " exactly one winner").isTrue();

                // Worker đối kháng nhận mã lỗi chuẩn canonical
                WorkerResult loser = r1Success ? r2 : r1;
                if (loser.status() == 400) {
                    assertThat(loser.code()).isIn("ASSET_NOT_AVAILABLE", "ASSET_ALREADY_ASSIGNED");
                } else if (loser.status() == 409) {
                    assertThat(loser.code()).isEqualTo("ASSET_ASSIGNMENT_CONFLICT");
                } else {
                    org.junit.jupiter.api.Assertions.fail("Unexpected loser status: " + loser.status() + ", code: " + loser.code());
                }

                // Kiểm tra trạng thái Asset trong database là ASSIGNED
                Asset updatedAsset = assetRepository.findById(asset.getId()).orElseThrow();
                assertThat(updatedAsset.getStatus()).isEqualTo(AssetStatus.ASSIGNED);

                // Kiểm tra database invariant: duy nhất 1 ACTIVE assignment
                List<AssetAssignment> actives = assignmentRepository.findByAssetIdAndStatus(
                        asset.getId(), AssetAssignmentStatus.ACTIVE
                );
                assertThat(actives).as("Round " + round + " active assignments count").hasSize(1);

                AssetAssignment activeAssignment = actives.get(0);
                UUID expectedWinnerUser = r1Success ? employee1Id : employee2Id;
                assertThat(activeAssignment.getAssignedTo()).isEqualTo(expectedWinnerUser);
                assertThat(activeAssignment.getAssignedBy()).isEqualTo(adminUserId);
                assertThat(activeAssignment.getAssignedAt()).isNotNull();
            }
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    @DisplayName("Rollback: Thất bại khi cập nhật Asset phục hồi nguyên trạng Assignment và Asset trên PostgreSQL")
    void testReturnAssetRollbackOnFailure() throws Exception {
        Asset asset = createTestAsset("ROLLBACK-01", AssetStatus.AVAILABLE);

        AssignAssetRequest assignReq = new AssignAssetRequest(employee1Id, null, "Bàn giao ban đầu");
        MvcResult assignRes = mockMvc.perform(post("/api/v1/assets/{assetId}/assignments", asset.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String assignJson = assignRes.getResponse().getContentAsString();
        String assignmentIdStr = objectMapper.readTree(assignJson).path("data").path("id").asText();
        UUID assignmentId = UUID.fromString(assignmentIdStr);

        // Lưu snapshot trạng thái ban đầu
        Asset originalAsset = assetRepository.findById(asset.getId()).orElseThrow();
        AssetAssignment originalAssignment = assignmentRepository.findById(assignmentId).orElseThrow();
        Long originalAssetVersion = originalAsset.getVersion();
        Long originalAssignmentVersion = originalAssignment.getVersion();
        assertThat(originalAsset.getStatus()).isEqualTo(AssetStatus.ASSIGNED);
        assertThat(originalAssignment.getStatus()).isEqualTo(AssetAssignmentStatus.ACTIVE);
        assertThat(originalAssignment.getReturnedAt()).isNull();

        // Failure injection: Tạo trigger lỗi dành riêng cho asset này trên PostgreSQL
        String triggerFunc = """
                CREATE OR REPLACE FUNCTION fail_asset_return_rollback_test()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.id = '%s'::uuid THEN
                        RAISE EXCEPTION 'Simulated failure on asset update for return rollback test';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """.formatted(asset.getId());

        String triggerSql = """
                CREATE TRIGGER trg_test_return_rollback_asset
                BEFORE UPDATE ON assets
                FOR EACH ROW
                EXECUTE FUNCTION fail_asset_return_rollback_test();
                """;

        jdbcTemplate.execute(triggerFunc);
        jdbcTemplate.execute(triggerSql);

        try {
            ReturnAssetRequest returnReq = new ReturnAssetRequest("Thu hồi máy", AssetStatus.AVAILABLE, originalAssignmentVersion);
            MvcResult failureResult = mockMvc.perform(put("/api/v1/assets/{assetId}/assignments/{assignmentId}/return", asset.getId(), assignmentId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(returnReq)))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                    .andExpect(jsonPath("$.message").value("Đã xảy ra lỗi hệ thống"))
                    .andReturn();

            // Xác minh an toàn response: Không lộ stack trace, SQL, tên trigger function, hay thông tin nhạy cảm
            String errorResponse = failureResult.getResponse().getContentAsString();
            assertThat(errorResponse).doesNotContain("fail_asset_return_rollback_test");
            assertThat(errorResponse).doesNotContain("Simulated failure");
            assertThat(errorResponse).doesNotContain("BEFORE UPDATE ON assets");
            assertThat(errorResponse).doesNotContain("SQLException");
            assertThat(errorResponse).doesNotContain("PSQLException");

            // Đọc lại từ database qua fresh lookup để xác minh full rollback
            Asset afterFailureAsset = assetRepository.findById(asset.getId()).orElseThrow();
            AssetAssignment afterFailureAssignment = assignmentRepository.findById(assignmentId).orElseThrow();

            // 1. Asset vẫn ở trạng thái ASSIGNED, version không đổi
            assertThat(afterFailureAsset.getStatus()).isEqualTo(AssetStatus.ASSIGNED);
            assertThat(afterFailureAsset.getVersion()).isEqualTo(originalAssetVersion);

            // 2. Assignment vẫn ở trạng thái ACTIVE, version không đổi, returnedAt vẫn null
            assertThat(afterFailureAssignment.getStatus()).isEqualTo(AssetAssignmentStatus.ACTIVE);
            assertThat(afterFailureAssignment.getVersion()).isEqualTo(originalAssignmentVersion);
            assertThat(afterFailureAssignment.getReturnedAt()).isNull();
            assertThat(afterFailureAssignment.getReturnCondition()).isNull();
        } finally {
            jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_test_return_rollback_asset ON assets;");
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS fail_asset_return_rollback_test();");
        }
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
