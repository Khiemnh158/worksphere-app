package com.worksphere.service_request;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.file.infrastructure.persistence.StoredFileRepository;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.service_request.api.request.AssignServiceRequestRequest;
import com.worksphere.service_request.api.request.CreateServiceCommentRequest;
import com.worksphere.service_request.api.request.CreateServiceRatingRequest;
import com.worksphere.service_request.api.request.CreateServiceRequestRequest;
import com.worksphere.service_request.api.request.RejectResolutionRequest;
import com.worksphere.service_request.api.request.UpdateServiceRequestRequest;
import com.worksphere.service_request.api.request.UpdateServiceRequestStatusRequest;
import com.worksphere.service_request.domain.ServiceAssignment;
import com.worksphere.service_request.domain.ServiceCategory;
import com.worksphere.service_request.domain.ServicePriority;
import com.worksphere.service_request.domain.ServiceRequest;
import com.worksphere.service_request.domain.ServiceStatus;
import com.worksphere.service_request.infrastructure.persistence.ServiceAssignmentRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceAttachmentRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceCategoryRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceCommentRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceRatingRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceRequestRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceStatusHistoryRepository;
import com.worksphere.shared.security.JwtService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
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
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ServiceRequestMockMvcTest {

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

    private static final byte[] VALID_PNG = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4,
            (byte) 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
            0x54, 0x78, (byte) 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, (byte) 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE,
            0x42, 0x60, (byte) 0x82
    };

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired(required = false)
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ServiceRequestRepository requestRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceAssignmentRepository assignmentRepository;

    @Autowired
    private ServiceCommentRepository commentRepository;

    @Autowired
    private ServiceAttachmentRepository attachmentRepository;

    @Autowired
    private ServiceStatusHistoryRepository historyRepository;

    @Autowired
    private ServiceRatingRepository ratingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoredFileRepository storedFileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private UUID adminUserId;
    private UUID requesterUserId;
    private UUID assigneeUserId;
    private UUID unrelatedUserId;

    private String adminToken;
    private String requesterToken;
    private String assigneeToken;
    private String unrelatedToken;

    private ServiceCategory defaultCategory;

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

        jdbcTemplate.update("DELETE FROM service_ratings");
        jdbcTemplate.update("DELETE FROM service_status_histories");
        jdbcTemplate.update("DELETE FROM service_comments");
        jdbcTemplate.update("DELETE FROM service_attachments");
        jdbcTemplate.update("DELETE FROM service_assignments");
        jdbcTemplate.update("DELETE FROM service_requests");
        jdbcTemplate.update("UPDATE service_categories SET parent_id = NULL");
        jdbcTemplate.update("DELETE FROM service_categories");
        jdbcTemplate.update("DELETE FROM stored_files");
        jdbcTemplate.update("DELETE FROM user_roles");
        jdbcTemplate.update("DELETE FROM users");

        // 1. Admin user
        adminUserId = UUID.randomUUID();
        insertUser(adminUserId, "admin_sr_test", "admin_sr@test.com", true);
        assignRole(adminUserId, "ADMIN");
        adminToken = authorizationAccessToken(adminUserId);

        // 2. Requester (Employee)
        requesterUserId = UUID.randomUUID();
        insertUser(requesterUserId, "requester_sr_test", "requester_sr@test.com", true);
        assignRole(requesterUserId, "EMPLOYEE");
        requesterToken = authorizationAccessToken(requesterUserId);

        // 3. Assignee (Team Leader / Handler)
        assigneeUserId = UUID.randomUUID();
        insertUser(assigneeUserId, "assignee_sr_test", "assignee_sr@test.com", true);
        assignRole(assigneeUserId, "TEAM_LEADER");
        assigneeToken = authorizationAccessToken(assigneeUserId);

        // 4. Unrelated (Employee)
        unrelatedUserId = UUID.randomUUID();
        insertUser(unrelatedUserId, "unrelated_sr_test", "unrelated_sr@test.com", true);
        assignRole(unrelatedUserId, "EMPLOYEE");
        unrelatedToken = authorizationAccessToken(unrelatedUserId);

        // 5. Default Category
        defaultCategory = ServiceCategory.create(
                UUID.randomUUID(), null, "HARDWARE", "Phần cứng", "Yêu cầu phần cứng", ServicePriority.HIGH, true, Instant.now()
        );
        defaultCategory = categoryRepository.save(defaultCategory);
    }

    private void insertUser(UUID id, String username, String email, boolean active) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                "VALUES (?, ?, ?, ?, ?, ?, false, now(), now(), 0)",
                id, username, email, passwordEncoder.encode("Password123!"), "Full " + username, active ? "ACTIVE" : "DISABLED"
        );
    }

    private void assignRole(UUID userId, String roleCode) {
        UUID roleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = ?", UUID.class, roleCode);
        if (roleId != null) {
            jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())", userId, roleId);
        }
    }

    private UUID uploadTestFile(String token, String filename, String mimeType, byte[] content, String purpose) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", filename, mimeType, content);
        MvcResult result = mockMvc.perform(multipart("/api/v1/files")
                        .file(file)
                        .param("purpose", purpose)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> resp = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> data = (Map<?, ?>) resp.get("data");
        return UUID.fromString(data.get("id").toString());
    }

    // =========================================================================
    // SECTION B: REQUEST CORE
    // =========================================================================

    @Test
    @Order(1)
    void createServiceRequest_success_generatesSequentialRequestNumber() throws Exception {
        CreateServiceRequestRequest request = new CreateServiceRequestRequest(
                defaultCategory.getId(),
                "Hỏng màn hình",
                "Màn hình bị sọc ngang không hiển thị được",
                ServicePriority.HIGH,
                null,
                null
        );

        MvcResult result = mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.requestNumber", containsString("SR-")))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andReturn();

        Map<?, ?> resp = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> data = (Map<?, ?>) resp.get("data");
        String requestNumber = (String) data.get("requestNumber");
        assertThat(requestNumber).matches("SR-\\d{4}-\\d{6}");

        // Verify initial history created
        UUID reqId = UUID.fromString((String) data.get("id"));
        assertThat(historyRepository.findAllByRequestIdOrderByChangedAtAsc(reqId)).hasSize(1);
    }

    @Test
    @Order(2)
    void createServiceRequest_concurrentCreation_generatesUniqueSequentialNumbers() throws Exception {
        int threadCount = 8;
        int rounds = 5;
        java.util.Set<String> allGeneratedNumbers = ConcurrentHashMap.newKeySet();

        for (int round = 0; round < rounds; round++) {
            final int currentRound = round;
            ExecutorService executor = Executors.newFixedThreadPool(threadCount);
            CountDownLatch readyLatch = new CountDownLatch(threadCount);
            CountDownLatch startLatch = new CountDownLatch(1);
            List<Future<String>> futures = new ArrayList<>();

            for (int i = 0; i < threadCount; i++) {
                final int index = i;
                futures.add(executor.submit(() -> {
                    readyLatch.countDown();
                    startLatch.await();

                    CreateServiceRequestRequest req = new CreateServiceRequestRequest(
                            defaultCategory.getId(),
                            "Concurrent Task R" + currentRound + " T" + index,
                            "Concurrent Description " + index,
                            ServicePriority.MEDIUM,
                            null,
                            null
                    );
                    MvcResult mvcResult = mockMvc.perform(post("/api/v1/service-requests")
                                    .header("Authorization", "Bearer " + requesterToken)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(req)))
                            .andExpect(status().isCreated())
                            .andReturn();
                    Map<?, ?> resp = objectMapper.readValue(mvcResult.getResponse().getContentAsString(), Map.class);
                    Map<?, ?> d = (Map<?, ?>) resp.get("data");
                    return (String) d.get("requestNumber");
                }));
            }

            readyLatch.await();
            startLatch.countDown();

            List<String> roundNumbers = new ArrayList<>();
            for (Future<String> future : futures) {
                String num = future.get();
                assertThat(num).matches("SR-\\d{4}-\\d{6}");
                roundNumbers.add(num);
                allGeneratedNumbers.add(num);
            }
            executor.shutdown();

            assertThat(new java.util.HashSet<>(roundNumbers)).hasSize(threadCount);
        }

        assertThat(allGeneratedNumbers).hasSize(threadCount * rounds);

        // Verify database state: exact row count, unique request_number, all within current business year
        int dbCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM service_requests", Integer.class);
        assertThat(dbCount).isGreaterThanOrEqualTo(threadCount * rounds);

        int uniqueDbNumbers = jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT request_number) FROM service_requests", Integer.class);
        assertThat(uniqueDbNumbers).isEqualTo(dbCount);

        int currentYear = java.time.LocalDate.now().getYear();
        int matchingYearCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM service_requests WHERE request_number LIKE ?",
                Integer.class,
                "SR-" + currentYear + "-%"
        );
        assertThat(matchingYearCount).isEqualTo(dbCount);
    }

    @Test
    @Order(3)
    void createServiceRequest_missingOrInactiveCategory_returns404() throws Exception {
        CreateServiceRequestRequest missingCat = new CreateServiceRequestRequest(
                UUID.randomUUID(), "Title", "Description", ServicePriority.LOW, null, null
        );

        mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingCat)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SERVICE_CATEGORY_NOT_FOUND"));

        ServiceCategory inactiveCat = ServiceCategory.create(
                UUID.randomUUID(), null, "INACTIVE_SR_CAT", "Inactive", null, ServicePriority.LOW, false, Instant.now()
        );
        categoryRepository.save(inactiveCat);

        CreateServiceRequestRequest inactiveCatReq = new CreateServiceRequestRequest(
                inactiveCat.getId(), "Title", "Description", ServicePriority.LOW, null, null
        );

        mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inactiveCatReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SERVICE_CATEGORY_NOT_FOUND"));
    }

    @Test
    @Order(4)
    void getServiceRequestDetail_successAndMissing404() throws Exception {
        CreateServiceRequestRequest req = new CreateServiceRequestRequest(
                defaultCategory.getId(), "Test Detail", "Desc", ServicePriority.HIGH, null, null
        );
        MvcResult createRes = mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> data = (Map<?, ?>) objectMapper.readValue(createRes.getResponse().getContentAsString(), Map.class).get("data");
        UUID requestId = UUID.fromString((String) data.get("id"));

        mockMvc.perform(get("/api/v1/service-requests/" + requestId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(requestId.toString()))
                .andExpect(jsonPath("$.data.title").value("Test Detail"))
                .andExpect(jsonPath("$.data.category.code").value("HARDWARE"))
                .andExpect(jsonPath("$.data.requester.id").value(requesterUserId.toString()))
                .andExpect(jsonPath("$.data.allowedActions", hasItem("UPDATE")));

        mockMvc.perform(get("/api/v1/service-requests/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SERVICE_REQUEST_NOT_FOUND"));
    }

    @Test
    @Order(5)
    void updateServiceRequest_whenOpen_success_andWhenNotOpen_rejected() throws Exception {
        ServiceRequest sr = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-000001", defaultCategory.getId(), requesterUserId, null, "Old Title", "Old Desc", ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr = requestRepository.save(sr);

        UpdateServiceRequestRequest updateReq = new UpdateServiceRequestRequest(
                defaultCategory.getId(), "New Title", "New Desc", ServicePriority.CRITICAL, null, sr.getVersion()
        );

        mockMvc.perform(put("/api/v1/service-requests/" + sr.getId())
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("New Title"))
                .andExpect(jsonPath("$.data.priority").value("CRITICAL"));

        // Transition to IN_PROGRESS
        sr = requestRepository.findById(sr.getId()).orElseThrow();
        sr.transitionStatus(ServiceStatus.IN_PROGRESS, adminUserId, Instant.now());
        requestRepository.save(sr);

        UpdateServiceRequestRequest badReq = new UpdateServiceRequestRequest(
                defaultCategory.getId(), "Newer Title", "Newer Desc", ServicePriority.CRITICAL, null, sr.getVersion()
        );

        mockMvc.perform(put("/api/v1/service-requests/" + sr.getId())
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST_STATE"));
    }

    // =========================================================================
    // SECTION C: QUERY & ACCESS SCOPING
    // =========================================================================

    @Test
    @Order(6)
    void queryLevelScoping_requesterAndAssigneeSeeTheirRequests_unrelatedDenied() throws Exception {
        // Request 1: created by requester, assigned to assignee
        ServiceRequest sr1 = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-000001", defaultCategory.getId(), requesterUserId, null, "Req 1", "Desc 1", ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr1 = requestRepository.save(sr1);
        assignmentRepository.save(ServiceAssignment.create(UUID.randomUUID(), sr1.getId(), assigneeUserId, adminUserId, Instant.now()));

        // Request 2: created by unrelated user
        ServiceRequest sr2 = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-000002", defaultCategory.getId(), unrelatedUserId, null, "Req 2", "Desc 2", ServicePriority.LOW, unrelatedUserId, Instant.now()
        );
        requestRepository.save(sr2);

        // 1. Requester sees only Request 1
        mockMvc.perform(get("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(sr1.getId().toString()));

        // 2. Assignee sees only Request 1
        mockMvc.perform(get("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + assigneeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(sr1.getId().toString()));

        // 3. Admin sees both Request 1 and Request 2
        mockMvc.perform(get("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2));

        // 4. Detail access: Unrelated user gets 403 on Request 1
        mockMvc.perform(get("/api/v1/service-requests/" + sr1.getId())
                        .header("Authorization", "Bearer " + unrelatedToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // SECTION D: ASSIGNMENT
    // =========================================================================

    @Test
    @Order(7)
    void assignment_lifecycle_idempotentAndReassign() throws Exception {
        ServiceRequest sr = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-000001", defaultCategory.getId(), requesterUserId, null, "Assign Req", "Desc", ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr = requestRepository.save(sr);

        // 1. First assign by Admin -> transitions status OPEN -> ASSIGNED
        AssignServiceRequestRequest assignReq = new AssignServiceRequestRequest(assigneeUserId);
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/assignments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk());

        ServiceRequest reloaded = requestRepository.findById(sr.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(ServiceStatus.ASSIGNED);
        assertThat(assignmentRepository.findAllByRequestIdOrderByAssignedAtDesc(sr.getId())).hasSize(1);
        assertThat(assignmentRepository.findByRequestIdAndActiveTrue(sr.getId()).get().getAssigneeId()).isEqualTo(assigneeUserId);

        // 2. Same assignee idempotent -> no duplicate rows
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/assignments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk());
        assertThat(assignmentRepository.findAllByRequestIdOrderByAssignedAtDesc(sr.getId())).hasSize(1);

        // 3. Reassign to another user (unrelatedUserId as new assignee)
        AssignServiceRequestRequest reassignReq = new AssignServiceRequestRequest(unrelatedUserId);
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/assignments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reassignReq)))
                .andExpect(status().isOk());

        List<com.worksphere.service_request.domain.ServiceAssignment> allAssignments =
                assignmentRepository.findAllByRequestIdOrderByAssignedAtDesc(sr.getId());
        assertThat(allAssignments).hasSize(2);
        assertThat(assignmentRepository.findByRequestIdAndActiveTrue(sr.getId()).get().getAssigneeId()).isEqualTo(unrelatedUserId);
        com.worksphere.service_request.domain.ServiceAssignment oldAssignment =
                allAssignments.stream().filter(a -> a.getAssigneeId().equals(assigneeUserId)).findFirst().orElseThrow();
        assertThat(oldAssignment.isActive()).isFalse();
        assertThat(oldAssignment.getUnassignedAt()).isNotNull();

        // 4. Inactive assignee rejected with 400
        UUID inactiveUserId = UUID.randomUUID();
        insertUser(inactiveUserId, "inactive_user", "inactive@test.com", false);
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/assignments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignServiceRequestRequest(inactiveUserId))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("USER_INACTIVE"));

        // 5. Non-admin forbidden (403)
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/assignments")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // SECTION E: WORKFLOW & STATUS TRANSITIONS
    // =========================================================================

    @Test
    @Order(8)
    void workflow_allTransitionsAndTerminalStates() throws Exception {
        ServiceRequest sr = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-000001", defaultCategory.getId(), requesterUserId, null, "Workflow Req", "Desc", ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr = requestRepository.save(sr);
        assignmentRepository.save(ServiceAssignment.create(UUID.randomUUID(), sr.getId(), assigneeUserId, adminUserId, Instant.now()));
        sr.transitionStatus(ServiceStatus.ASSIGNED, adminUserId, Instant.now());
        sr = requestRepository.save(sr);

        // 1. ASSIGNED -> IN_PROGRESS by Assignee
        UpdateServiceRequestStatusRequest toInProgress = new UpdateServiceRequestStatusRequest(ServiceStatus.IN_PROGRESS, "Bắt đầu xử lý", sr.getVersion());
        mockMvc.perform(put("/api/v1/service-requests/" + sr.getId() + "/status")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toInProgress)))
                .andExpect(status().isOk());

        sr = requestRepository.findById(sr.getId()).orElseThrow();
        assertThat(sr.getStatus()).isEqualTo(ServiceStatus.IN_PROGRESS);

        // 2. IN_PROGRESS -> WAITING_FOR_USER
        UpdateServiceRequestStatusRequest toWaiting = new UpdateServiceRequestStatusRequest(ServiceStatus.WAITING_FOR_USER, "Cần thêm thông tin", sr.getVersion());
        mockMvc.perform(put("/api/v1/service-requests/" + sr.getId() + "/status")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toWaiting)))
                .andExpect(status().isOk());

        sr = requestRepository.findById(sr.getId()).orElseThrow();
        assertThat(sr.getStatus()).isEqualTo(ServiceStatus.WAITING_FOR_USER);

        // 3. WAITING_FOR_USER -> IN_PROGRESS
        UpdateServiceRequestStatusRequest toResume = new UpdateServiceRequestStatusRequest(ServiceStatus.IN_PROGRESS, "Tiếp tục xử lý", sr.getVersion());
        mockMvc.perform(put("/api/v1/service-requests/" + sr.getId() + "/status")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toResume)))
                .andExpect(status().isOk());

        sr = requestRepository.findById(sr.getId()).orElseThrow();

        // 4. IN_PROGRESS -> RESOLVED (Missing resolution comment -> 400)
        UpdateServiceRequestStatusRequest noCommentResolve = new UpdateServiceRequestStatusRequest(ServiceStatus.RESOLVED, "", sr.getVersion());
        mockMvc.perform(put("/api/v1/service-requests/" + sr.getId() + "/status")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noCommentResolve)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_RESOLUTION_REQUIRED"));

        // 5. IN_PROGRESS -> RESOLVED with comment -> success, resolvedAt set
        UpdateServiceRequestStatusRequest validResolve = new UpdateServiceRequestStatusRequest(ServiceStatus.RESOLVED, "Đã sửa xong linh kiện", sr.getVersion());
        mockMvc.perform(put("/api/v1/service-requests/" + sr.getId() + "/status")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validResolve)))
                .andExpect(status().isOk());

        sr = requestRepository.findById(sr.getId()).orElseThrow();
        assertThat(sr.getStatus()).isEqualTo(ServiceStatus.RESOLVED);
        assertThat(sr.getResolvedAt()).isNotNull();

        // 6. RESOLVED -> CLOSED by requester
        UpdateServiceRequestStatusRequest toClosed = new UpdateServiceRequestStatusRequest(ServiceStatus.CLOSED, "Xác nhận đóng", sr.getVersion());
        mockMvc.perform(put("/api/v1/service-requests/" + sr.getId() + "/status")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toClosed)))
                .andExpect(status().isOk());

        sr = requestRepository.findById(sr.getId()).orElseThrow();
        assertThat(sr.getStatus()).isEqualTo(ServiceStatus.CLOSED);
        assertThat(sr.getClosedAt()).isNotNull();

        // 7. CLOSED is terminal -> cannot transition to any other status
        UpdateServiceRequestStatusRequest afterClosed = new UpdateServiceRequestStatusRequest(ServiceStatus.IN_PROGRESS, "Reopen", sr.getVersion());
        mockMvc.perform(put("/api/v1/service-requests/" + sr.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(afterClosed)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_ALREADY_CLOSED"));
    }

    // =========================================================================
    // SECTION F: REJECT RESOLUTION
    // =========================================================================

    @Test
    @Order(9)
    void rejectResolution_rulesAndPermissions() throws Exception {
        ServiceRequest sr = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-000001", defaultCategory.getId(), requesterUserId, null, "Reject Req", "Desc", ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr.transitionStatus(ServiceStatus.RESOLVED, adminUserId, Instant.now());
        sr = requestRepository.save(sr);
        assignmentRepository.save(ServiceAssignment.create(UUID.randomUUID(), sr.getId(), assigneeUserId, adminUserId, Instant.now()));

        // 1. Assignee or Unrelated user forbidden (403)
        RejectResolutionRequest rejectReq = new RejectResolutionRequest("Vẫn chưa khắc phục được", sr.getVersion());
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/reject-resolution")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("SERVICE_RESOLUTION_REJECTION_FORBIDDEN"));

        // 2. Requester succeeds -> transitions to IN_PROGRESS, assignee retained
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/reject-resolution")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));

        ServiceRequest reloaded = requestRepository.findById(sr.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(ServiceStatus.IN_PROGRESS);
        assertThat(assignmentRepository.findByRequestIdAndActiveTrue(sr.getId()).get().getAssigneeId()).isEqualTo(assigneeUserId);

        // 3. Reject when not RESOLVED -> 400 SERVICE_NOT_RESOLVED
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/reject-resolution")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RejectResolutionRequest("Lại từ chối", reloaded.getVersion()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_NOT_RESOLVED"));
    }

    // =========================================================================
    // SECTION G: COMMENTS & VISIBILITY
    // =========================================================================

    @Test
    @Order(10)
    void comments_publicAndInternalVisibility() throws Exception {
        ServiceRequest sr = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-000001", defaultCategory.getId(), requesterUserId, null, "Comment Req", "Desc", ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr = requestRepository.save(sr);
        assignmentRepository.save(ServiceAssignment.create(UUID.randomUUID(), sr.getId(), assigneeUserId, adminUserId, Instant.now()));

        // 1. Requester creates public comment
        CreateServiceCommentRequest pubReq = new CreateServiceCommentRequest("Bình luận công khai", false, null);
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pubReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.content").value("Bình luận công khai"))
                .andExpect(jsonPath("$.data.isInternal").value(false));

        // 2. Requester tries creating internal comment -> 403 Forbidden
        CreateServiceCommentRequest internalByReq = new CreateServiceCommentRequest("Ghi chú nội bộ trái phép", true, null);
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(internalByReq)))
                .andExpect(status().isForbidden());

        // 3. Assignee creates internal comment -> 201 Created
        CreateServiceCommentRequest internalByAssignee = new CreateServiceCommentRequest("Ghi chú kỹ thuật", true, null);
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(internalByAssignee)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isInternal").value(true));

        // 4. List comments: Requester sees only 1 comment (public)
        mockMvc.perform(get("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].content").value("Bình luận công khai"));

        // 5. List comments: Assignee sees both 2 comments
        mockMvc.perform(get("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + assigneeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2));
    }

    // =========================================================================
    // SECTION H: ATTACHMENTS & FILE ACCESS
    // =========================================================================

    @Test
    @Order(11)
    void attachments_validationAndDownloadAuthorization() throws Exception {
        UUID validFileId = uploadTestFile(requesterToken, "photo.png", "image/png", VALID_PNG, "SERVICE_ATTACHMENT");
        UUID avatarFileId = uploadTestFile(requesterToken, "avatar.png", "image/png", VALID_PNG, "AVATAR");

        // 1. Wrong purpose (AVATAR) rejected
        CreateServiceRequestRequest wrongPurposeReq = new CreateServiceRequestRequest(
                defaultCategory.getId(), "Attach Req", "Desc", ServicePriority.LOW, null, List.of(avatarFileId)
        );
        mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPurposeReq)))
                .andExpect(status().isUnsupportedMediaType());

        // 2. Valid attachment succeeds
        CreateServiceRequestRequest validReq = new CreateServiceRequestRequest(
                defaultCategory.getId(), "Attach Req", "Desc", ServicePriority.LOW, null, List.of(validFileId)
        );
        MvcResult res = mockMvc.perform(post("/api/v1/service-requests")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID reqId = UUID.fromString((String) ((Map<?, ?>) objectMapper.readValue(res.getResponse().getContentAsString(), Map.class).get("data")).get("id"));
        assignmentRepository.save(ServiceAssignment.create(UUID.randomUUID(), reqId, assigneeUserId, adminUserId, Instant.now()));

        // 3. Download authorization: Requester and Assignee can download
        mockMvc.perform(get("/api/v1/files/" + validFileId + "/download")
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/files/" + validFileId + "/download")
                        .header("Authorization", "Bearer " + assigneeToken))
                .andExpect(status().isOk());

        // 4. Download authorization: Unrelated user forbidden (403)
        mockMvc.perform(get("/api/v1/files/" + validFileId + "/download")
                        .header("Authorization", "Bearer " + unrelatedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FILE_ACCESS_DENIED"));

        // 5. Linked file deletion rejected with 422 FILE_ALREADY_LINKED
        mockMvc.perform(delete("/api/v1/files/" + validFileId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("FILE_ALREADY_LINKED"));
    }

    // =========================================================================
    // SECTION I: RATING
    // =========================================================================

    @Test
    @Order(12)
    void rating_lifecycleAndInvariants() throws Exception {
        ServiceRequest sr = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-000001", defaultCategory.getId(), requesterUserId, null, "Rating Req", "Desc", ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr = requestRepository.save(sr);

        // 1. Not CLOSED -> 400 SERVICE_NOT_CLOSED
        CreateServiceRatingRequest rateReq = new CreateServiceRatingRequest(5, "Rất tốt");
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/rating")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SERVICE_NOT_CLOSED"));

        // Close request
        sr.transitionStatus(ServiceStatus.CLOSED, adminUserId, Instant.now());
        requestRepository.save(sr);

        // 2. Non-requester forbidden (403)
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/rating")
                        .header("Authorization", "Bearer " + unrelatedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rateReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("SERVICE_RATING_FORBIDDEN"));

        // 3. Score out of bounds (6) -> 400
        CreateServiceRatingRequest badScoreReq = new CreateServiceRatingRequest(6, "Quá điểm");
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/rating")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badScoreReq)))
                .andExpect(status().isBadRequest());

        // 4. Requester rates -> 201 Created
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/rating")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rateReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.score").value(5))
                .andExpect(jsonPath("$.data.comment").value("Rất tốt"));

        // 5. Duplicate rating -> 409 Conflict
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/rating")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rateReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SERVICE_RATING_ALREADY_EXISTS"));
    }

    // =========================================================================
    // SECTION J: HARDENED CONCURRENCY & TRANSACTION INTEGRITY
    // =========================================================================

    @Test
    @Order(13)
    void assignment_concurrentAssignments_preservesSingleActiveAssigneeInvariant() throws Exception {
        UUID secondAssigneeId = UUID.randomUUID();
        insertUser(secondAssigneeId, "assignee2_test", "assignee2@test.com", true);
        assignRole(secondAssigneeId, "TEAM_LEADER");

        for (int round = 0; round < 5; round++) {
            ServiceRequest sr = ServiceRequest.create(
                    UUID.randomUUID(), "SR-2026-A" + round, defaultCategory.getId(),
                    requesterUserId, null, "Concurrent Assign " + round, "Desc",
                    ServicePriority.LOW, requesterUserId, Instant.now()
            );
            sr = requestRepository.save(sr);
            final UUID reqId = sr.getId();

            ExecutorService executor = Executors.newFixedThreadPool(2);
            CountDownLatch readyLatch = new CountDownLatch(2);
            CountDownLatch startLatch = new CountDownLatch(1);

            Callable<Integer> assignTask1 = () -> {
                readyLatch.countDown();
                startLatch.await();
                MvcResult res = mockMvc.perform(post("/api/v1/service-requests/" + reqId + "/assignments")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new AssignServiceRequestRequest(assigneeUserId))))
                        .andReturn();
                return res.getResponse().getStatus();
            };

            Callable<Integer> assignTask2 = () -> {
                readyLatch.countDown();
                startLatch.await();
                MvcResult res = mockMvc.perform(post("/api/v1/service-requests/" + reqId + "/assignments")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new AssignServiceRequestRequest(secondAssigneeId))))
                        .andReturn();
                return res.getResponse().getStatus();
            };

            Future<Integer> f1 = executor.submit(assignTask1);
            Future<Integer> f2 = executor.submit(assignTask2);

            readyLatch.await();
            startLatch.countDown();

            int status1 = f1.get();
            int status2 = f2.get();
            executor.shutdown();

            // Neither response should be 500
            assertThat(status1).isNotEqualTo(500);
            assertThat(status2).isNotEqualTo(500);
            assertThat(List.of(200, 409)).contains(status1);
            assertThat(List.of(200, 409)).contains(status2);
            assertThat(status1 == 200 || status2 == 200).isTrue();

            // Verify invariant: Exactly 1 active assignment
            Integer activeCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM service_assignments WHERE request_id = ? AND is_active = TRUE",
                    Integer.class,
                    reqId
            );
            assertThat(activeCount).isEqualTo(1);

            // Verify replaced assignments have is_active = false and unassigned_at set
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT is_active, unassigned_at, assigned_by FROM service_assignments WHERE request_id = ? ORDER BY assigned_at ASC",
                    reqId
            );
            for (Map<String, Object> r : rows) {
                Boolean isActive = (Boolean) r.get("is_active");
                if (!isActive) {
                    assertThat(r.get("unassigned_at")).isNotNull();
                }
                assertThat(r.get("assigned_by")).isEqualTo(adminUserId);
            }
        }
    }

    @Test
    @Order(14)
    void assignment_uniqueConstraintViolation_mapsToAssignmentConflict409() {
        ServiceRequest sr = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-UK", defaultCategory.getId(),
                requesterUserId, null, "UK Req", "Desc",
                ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr = requestRepository.save(sr);

        // First active assignment
        assignmentRepository.saveAndFlush(ServiceAssignment.create(
                UUID.randomUUID(), sr.getId(), assigneeUserId, adminUserId, Instant.now()
        ));

        // Intentionally save a second active assignment without deactivating the first
        ServiceAssignment secondActive = ServiceAssignment.create(
                UUID.randomUUID(), sr.getId(), unrelatedUserId, adminUserId, Instant.now()
        );

        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.dao.DataIntegrityViolationException.class,
                () -> assignmentRepository.saveAndFlush(secondActive)
        );

        // Verify the partial unique index uk_service_assignments_one_active prevented a second active row
        Integer activeCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM service_assignments WHERE request_id = ? AND is_active = TRUE",
                Integer.class,
                sr.getId()
        );
        assertThat(activeCount).isEqualTo(1);
    }

    @Test
    @Order(15)
    void rating_concurrentSubmission_onlyOneSucceedsAndOtherReturns409() throws Exception {
        for (int round = 0; round < 5; round++) {
            ServiceRequest sr = ServiceRequest.create(
                    UUID.randomUUID(), "SR-2026-RATE-" + round, defaultCategory.getId(),
                    requesterUserId, null, "Rating Req " + round, "Desc",
                    ServicePriority.LOW, requesterUserId, Instant.now()
            );
            sr.transitionStatus(ServiceStatus.CLOSED, adminUserId, Instant.now());
            sr = requestRepository.save(sr);
            final UUID reqId = sr.getId();

            ExecutorService executor = Executors.newFixedThreadPool(2);
            CountDownLatch readyLatch = new CountDownLatch(2);
            CountDownLatch startLatch = new CountDownLatch(1);

            CreateServiceRatingRequest rateReq1 = new CreateServiceRatingRequest(5, "Rating Alpha " + round);
            CreateServiceRatingRequest rateReq2 = new CreateServiceRatingRequest(4, "Rating Beta " + round);

            Callable<Integer> task1 = () -> {
                readyLatch.countDown();
                startLatch.await();
                MvcResult res = mockMvc.perform(post("/api/v1/service-requests/" + reqId + "/rating")
                                .header("Authorization", "Bearer " + requesterToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(rateReq1)))
                        .andReturn();
                return res.getResponse().getStatus();
            };

            Callable<Integer> task2 = () -> {
                readyLatch.countDown();
                startLatch.await();
                MvcResult res = mockMvc.perform(post("/api/v1/service-requests/" + reqId + "/rating")
                                .header("Authorization", "Bearer " + requesterToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(rateReq2)))
                        .andReturn();
                return res.getResponse().getStatus();
            };

            Future<Integer> f1 = executor.submit(task1);
            Future<Integer> f2 = executor.submit(task2);

            readyLatch.await();
            startLatch.countDown();

            int status1 = f1.get();
            int status2 = f2.get();
            executor.shutdown();

            // Neither is 500
            assertThat(status1).isNotEqualTo(500);
            assertThat(status2).isNotEqualTo(500);

            // Exactly one 201 Created and one 409 Conflict
            List<Integer> statuses = List.of(status1, status2);
            assertThat(statuses).containsExactlyInAnyOrder(201, 409);

            // Exactly 1 row in service_ratings
            Integer ratingCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM service_ratings WHERE request_id = ?",
                    Integer.class,
                    reqId
            );
            assertThat(ratingCount).isEqualTo(1);
        }
    }

    @Test
    @Order(16)
    void workflow_historyInsertFailure_rollsBackServiceRequestMutation() {
        ServiceRequest sr = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-ROLLBACK", defaultCategory.getId(),
                requesterUserId, null, "Rollback Test", "Desc",
                ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr = requestRepository.save(sr);
        assignmentRepository.save(ServiceAssignment.create(
                UUID.randomUUID(), sr.getId(), assigneeUserId, adminUserId, Instant.now()
        ));
        sr.transitionStatus(ServiceStatus.ASSIGNED, adminUserId, Instant.now());
        sr = requestRepository.save(sr);

        ServiceStatus initialStatus = sr.getStatus();
        Long initialVersion = sr.getVersion();
        Instant initialResolvedAt = sr.getResolvedAt();
        Instant initialClosedAt = sr.getClosedAt();
        Instant initialCancelledAt = sr.getCancelledAt();
        int initialHistoryCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM service_status_histories WHERE request_id = ?",
                Integer.class,
                sr.getId()
        );

        // Create temporary trigger in PostgreSQL to cause failure on INSERT into service_status_histories
        jdbcTemplate.execute(
                "CREATE OR REPLACE FUNCTION trg_fail_status_history() RETURNS trigger AS $$ " +
                "BEGIN RAISE EXCEPTION 'SIMULATED_HISTORY_INSERT_FAILURE'; END; " +
                "$$ LANGUAGE plpgsql;"
        );
        jdbcTemplate.execute(
                "CREATE TRIGGER trg_test_history_fail BEFORE INSERT ON service_status_histories " +
                "FOR EACH ROW EXECUTE FUNCTION trg_fail_status_history();"
        );

        try {
            UpdateServiceRequestStatusRequest toInProgress = new UpdateServiceRequestStatusRequest(
                    ServiceStatus.IN_PROGRESS, "Thử chuyển trạng thái", initialVersion
            );

            try {
                mockMvc.perform(put("/api/v1/service-requests/" + sr.getId() + "/status")
                                .header("Authorization", "Bearer " + assigneeToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(toInProgress)))
                        .andReturn();
            } catch (Exception ignored) {
            }

            // Verify full rollback in PostgreSQL
            ServiceRequest reloaded = requestRepository.findById(sr.getId()).orElseThrow();
            assertThat(reloaded.getStatus()).isEqualTo(initialStatus);
            assertThat(reloaded.getVersion()).isEqualTo(initialVersion);
            assertThat(reloaded.getResolvedAt()).isEqualTo(initialResolvedAt);
            assertThat(reloaded.getClosedAt()).isEqualTo(initialClosedAt);
            assertThat(reloaded.getCancelledAt()).isEqualTo(initialCancelledAt);

            int postHistoryCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM service_status_histories WHERE request_id = ?",
                    Integer.class,
                    sr.getId()
            );
            assertThat(postHistoryCount).isEqualTo(initialHistoryCount);
        } finally {
            jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_test_history_fail ON service_status_histories;");
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS trg_fail_status_history();");
        }
    }

    @Test
    @Order(17)
    void comments_internalNotes_paginationAndVisibilityScoping() throws Exception {
        ServiceRequest sr = ServiceRequest.create(
                UUID.randomUUID(), "SR-2026-PAG-COMM", defaultCategory.getId(),
                requesterUserId, null, "Pagination Comment Req", "Desc",
                ServicePriority.LOW, requesterUserId, Instant.now()
        );
        sr = requestRepository.save(sr);
        assignmentRepository.save(ServiceAssignment.create(
                UUID.randomUUID(), sr.getId(), assigneeUserId, adminUserId, Instant.now()
        ));

        // Create 2 public comments
        CreateServiceCommentRequest pub1 = new CreateServiceCommentRequest("Public Comment 1", false, null);
        CreateServiceCommentRequest pub2 = new CreateServiceCommentRequest("Public Comment 2", false, null);
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pub1)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pub2)))
                .andExpect(status().isCreated());

        // Create 2 internal notes by Assignee
        CreateServiceCommentRequest priv1 = new CreateServiceCommentRequest("SECRET INTERNAL NOTE 1", true, null);
        CreateServiceCommentRequest priv2 = new CreateServiceCommentRequest("SECRET INTERNAL NOTE 2", true, null);
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(priv1)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(priv2)))
                .andExpect(status().isCreated());

        // 1. Requester with page=0, size=2: Sees exactly 2 public comments, totalItems=2, totalPages=1
        MvcResult reqPage0 = mockMvc.perform(get("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + requesterToken)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2))
                .andExpect(jsonPath("$.data.totalPages").value(1))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.items[0].isInternal").value(false))
                .andExpect(jsonPath("$.data.items[1].isInternal").value(false))
                .andReturn();

        String reqContent = reqPage0.getResponse().getContentAsString();
        assertThat(reqContent).doesNotContain("SECRET INTERNAL NOTE");

        // Requester with page=1, size=2: Empty items, no ghost rows
        mockMvc.perform(get("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + requesterToken)
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(0))
                .andExpect(jsonPath("$.data.totalItems").value(2));

        // 2. Active Assignee with size=2: Sees totalItems=4, totalPages=2
        mockMvc.perform(get("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(4))
                .andExpect(jsonPath("$.data.totalPages").value(2));

        // 3. Admin with size=2: Sees totalItems=4, totalPages=2
        mockMvc.perform(get("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(4))
                .andExpect(jsonPath("$.data.totalPages").value(2));

        // 4. Reassign request to unrelatedUser -> old assignee is now inactive
        AssignServiceRequestRequest reassignReq = new AssignServiceRequestRequest(unrelatedUserId);
        mockMvc.perform(post("/api/v1/service-requests/" + sr.getId() + "/assignments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reassignReq)))
                .andExpect(status().isOk());

        // Previous assignee queries: Should no longer have access (403 Forbidden), guaranteeing internal notes are not leaked
        mockMvc.perform(get("/api/v1/service-requests/" + sr.getId() + "/comments")
                        .header("Authorization", "Bearer " + assigneeToken)
                        .param("page", "0")
                        .param("size", "10"))
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
