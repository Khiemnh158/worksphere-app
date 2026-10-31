package com.worksphere.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.project.api.request.AddProjectMemberRequest;
import com.worksphere.project.api.request.ChangeProjectStatusRequest;
import com.worksphere.project.api.request.CreateMilestoneRequest;
import com.worksphere.project.api.request.CreateProjectRequest;
import com.worksphere.project.api.request.UpdateProjectMemberRoleRequest;
import com.worksphere.project.api.request.UpdateProjectRequest;
import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectPriority;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.domain.ProjectStatus;
import com.worksphere.project.infrastructure.persistence.MilestoneRepository;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.project.infrastructure.persistence.ProjectRepository;
import com.worksphere.project.infrastructure.persistence.ProjectStatusHistoryRepository;
import com.worksphere.shared.security.JwtService;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
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
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProjectMockMvcTest {

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
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private ProjectStatusHistoryRepository statusHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private UUID adminUserId;
    private UUID pmUserId;
    private UUID employeeUserId;
    private String adminToken;
    private String pmToken;
    private String employeeToken;
    private String unprivilegedToken;
    private UUID departmentId;

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

        // Clean tables in reverse dependency order
        milestoneRepository.deleteAll();
        statusHistoryRepository.deleteAll();
        projectMemberRepository.deleteAll();
        projectRepository.deleteAll();
        jdbcTemplate.update("DELETE FROM user_roles");
        userRepository.deleteAll();
        departmentRepository.deleteAll();

        // Create Department
        departmentId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO departments (id, code, name, is_active, is_deleted, created_at, updated_at, version) " +
                        "VALUES (?, 'DEP-IT', 'Phòng CNTT', true, false, now(), now(), 0)",
                departmentId
        );

        // Create Admin user
        adminUserId = UUID.randomUUID();
        insertUser(adminUserId, "admin_user", "admin@test.com", passwordEncoder.encode("Password123!"));
        UUID adminRoleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = 'ADMIN'", UUID.class);
        if (adminRoleId != null) {
            jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    adminUserId, adminRoleId);
            jdbcTemplate.update(
                    "INSERT INTO role_permissions (role_id, permission_id, assigned_at) " +
                    "SELECT ?, id, now() FROM permissions ON CONFLICT DO NOTHING",
                    adminRoleId);
        }
        adminToken = authorizationAccessToken(adminUserId);

        // Create PM user (has PROJECT_MANAGER role with PROJECT_READ, PROJECT_CREATE, PROJECT_UPDATE, PROJECT_MEMBER_MANAGE)
        pmUserId = UUID.randomUUID();
        insertUser(pmUserId, "pm_user", "pm@test.com", passwordEncoder.encode("Password123!"));
        UUID pmRoleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = 'PROJECT_MANAGER'", UUID.class);
        if (pmRoleId != null) {
            jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    pmUserId, pmRoleId);
            jdbcTemplate.update(
                    "INSERT INTO role_permissions (role_id, permission_id, assigned_at) " +
                    "SELECT ?, id, now() FROM permissions WHERE code IN ('PROJECT_READ', 'PROJECT_CREATE', 'PROJECT_UPDATE', 'PROJECT_MEMBER_MANAGE') " +
                    "ON CONFLICT DO NOTHING",
                    pmRoleId);
        }
        pmToken = authorizationAccessToken(pmUserId);

        // Create regular Employee user (has PROJECT_READ per V015)
        employeeUserId = UUID.randomUUID();
        insertUser(employeeUserId, "emp_user", "emp@test.com", passwordEncoder.encode("Password123!"));
        UUID empRoleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = 'EMPLOYEE'", UUID.class);
        if (empRoleId != null) {
            jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    employeeUserId, empRoleId);
        }
        employeeToken = authorizationAccessToken(employeeUserId);

        // Create unprivileged user with no roles/permissions
        UUID unprivilegedUserId = UUID.randomUUID();
        insertUser(unprivilegedUserId, "no_perm_user", "noperm@test.com", passwordEncoder.encode("Password123!"));
        unprivilegedToken = authorizationAccessToken(unprivilegedUserId);
    }

    private void insertUser(UUID id, String username, String email, String passwordHash) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                        "VALUES (?, ?, ?, ?, ?, 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordHash, username + " Full Name"
        );
    }

    @Test
    @Order(1)
    void getProjects_shouldReturnEmptyListInitially() throws Exception {
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.totalItems").value(0));
    }

    @Test
    @Order(2)
    void getProjects_shouldFailWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(3)
    void getProjects_shouldFailWhenMissingPermission() throws Exception {
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + unprivilegedToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(4)
    void createProject_shouldSucceedAndInitializeAsDraft() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "PRJ-2026-001",
                "WorkSphere Platform",
                "Mô tả dự án",
                ProjectPriority.HIGH,
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                departmentId,
                List.of(employeeUserId)
        );

        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("PRJ-2026-001"))
                .andExpect(jsonPath("$.data.name").value("WorkSphere Platform"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.priority").value("HIGH"))
                .andExpect(jsonPath("$.data.memberCount").value(2)); // creator + employee
    }

    @Test
    @Order(5)
    void createProject_shouldFailWhenCodeAlreadyExists() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "PRJ-DUP",
                "Dự án 1",
                null,
                ProjectPriority.MEDIUM,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate code
        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PROJECT_CODE_ALREADY_EXISTS"));
    }

    @Test
    @Order(6)
    void createProject_shouldFailWhenEndDateBeforeStartDate() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "PRJ-INVALID-DATE",
                "Dự án ngày sai",
                null,
                ProjectPriority.LOW,
                LocalDate.now().plusDays(10),
                LocalDate.now(),
                null,
                null
        );

        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PROJECT_DATE_RANGE_INVALID"));
    }

    @Test
    @Order(7)
    void updateProject_shouldSucceed() throws Exception {
        Project project = projectRepository.save(Project.create(
                UUID.randomUUID(),
                "PRJ-UPDATE",
                "Tên cũ",
                "Mô tả cũ",
                pmUserId,
                departmentId,
                ProjectPriority.MEDIUM,
                LocalDate.now(),
                LocalDate.now().plusMonths(2),
                pmUserId
        ));

        UpdateProjectRequest req = new UpdateProjectRequest(
                "Tên mới",
                "Mô tả mới",
                ProjectPriority.CRITICAL,
                LocalDate.now(),
                LocalDate.now().plusMonths(4),
                project.getVersion()
        );

        mockMvc.perform(put("/api/v1/projects/" + project.getId())
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Tên mới"))
                .andExpect(jsonPath("$.data.priority").value("CRITICAL"));
    }

    @Test
    @Order(8)
    void updateProject_shouldFailWhenOptimisticLockConflict() throws Exception {
        Project project = projectRepository.save(Project.create(
                UUID.randomUUID(),
                "PRJ-OPT-LOCK",
                "Tên ban đầu",
                null,
                pmUserId,
                null,
                ProjectPriority.LOW,
                null,
                null,
                pmUserId
        ));

        UpdateProjectRequest req = new UpdateProjectRequest(
                "Tên sửa",
                null,
                ProjectPriority.LOW,
                null,
                null,
                999L // wrong version
        );

        mockMvc.perform(put("/api/v1/projects/" + project.getId())
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("OPTIMISTIC_LOCK_CONFLICT"));
    }

    @Test
    @Order(9)
    void changeProjectStatus_shouldSucceedAndRecordHistory() throws Exception {
        Project project = projectRepository.save(Project.create(
                UUID.randomUUID(),
                "PRJ-STATUS",
                "Dự án chuyển trạng thái",
                null,
                pmUserId,
                null,
                ProjectPriority.MEDIUM,
                null,
                null,
                pmUserId
        ));

        // DRAFT -> ACTIVE
        ChangeProjectStatusRequest req = new ChangeProjectStatusRequest(
                ProjectStatus.ACTIVE,
                "Bắt đầu triển khai",
                project.getVersion()
        );

        mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/status")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));

        // Verify status history recorded
        List<?> histories = statusHistoryRepository.findAllByProjectIdOrderByChangedAtAsc(project.getId());
        org.junit.jupiter.api.Assertions.assertEquals(1, histories.size());
    }

    @Test
    @Order(10)
    void changeProjectStatus_shouldFailWhenInvalidTransition() throws Exception {
        Project project = projectRepository.save(Project.create(
                UUID.randomUUID(),
                "PRJ-INVALID-TR",
                "Dự án DRAFT",
                null,
                pmUserId,
                null,
                ProjectPriority.MEDIUM,
                null,
                null,
                pmUserId
        ));

        // DRAFT -> COMPLETED is invalid per 06_API_CONTRACT.md section 11.5
        ChangeProjectStatusRequest req = new ChangeProjectStatusRequest(
                ProjectStatus.COMPLETED,
                "Không thể nhảy cóc",
                project.getVersion()
        );

        mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/status")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PROJECT_STATUS_TRANSITION_INVALID"));
    }

    @Test
    @Order(11)
    void projectMembers_crudWorkflow() throws Exception {
        Project project = projectRepository.save(Project.create(
                UUID.randomUUID(),
                "PRJ-MEMBERS",
                "Dự án quản lý thành viên",
                null,
                pmUserId,
                null,
                ProjectPriority.MEDIUM,
                null,
                null,
                pmUserId
        ));
        // Add PM as member
        ProjectMember pmMember = projectMemberRepository.save(ProjectMember.create(
                UUID.randomUUID(), project.getId(), pmUserId, ProjectRole.PROJECT_MANAGER, pmUserId
        ));

        // 1. Add Employee as member
        AddProjectMemberRequest addReq = new AddProjectMemberRequest(employeeUserId, ProjectRole.MEMBER);
        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/members")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.projectRole").value("MEMBER"));

        // 2. Duplicate member add rejected
        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/members")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PROJECT_MEMBER_ALREADY_EXISTS"));

        // 3. List members
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/members")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2));

        // 4. Update member role
        ProjectMember empMember = projectMemberRepository.findActiveByProjectIdAndUserId(project.getId(), employeeUserId).orElseThrow();
        UpdateProjectMemberRoleRequest updateRoleReq = new UpdateProjectMemberRoleRequest(ProjectRole.TEAM_LEADER);
        mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/members/" + empMember.getId())
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRoleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projectRole").value("TEAM_LEADER"));

        // 5. Remove sole Project Manager rejected
        mockMvc.perform(delete("/api/v1/projects/" + project.getId() + "/members/" + pmMember.getId())
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PROJECT_MANAGER_REQUIRED"));

        // 6. Remove employee succeeds
        mockMvc.perform(delete("/api/v1/projects/" + project.getId() + "/members/" + empMember.getId())
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(12)
    void milestones_crudWorkflow() throws Exception {
        Project project = projectRepository.save(Project.create(
                UUID.randomUUID(),
                "PRJ-MILESTONES",
                "Dự án mốc tiến độ",
                null,
                pmUserId,
                null,
                ProjectPriority.MEDIUM,
                null,
                null,
                pmUserId
        ));
        projectMemberRepository.save(ProjectMember.create(
                UUID.randomUUID(), project.getId(), pmUserId, ProjectRole.PROJECT_MANAGER, pmUserId
        ));

        CreateMilestoneRequest req = new CreateMilestoneRequest(
                "Mốc 1 - Khởi động",
                "Hoàn thành khảo sát",
                LocalDate.now().plusDays(15)
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/milestones")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Mốc 1 - Khởi động"))
                .andExpect(jsonPath("$.data.status").value("PLANNED"));

        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/milestones")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    @Order(13)
    void updateMemberRole_shouldFailWhenDemotingSoleProjectManager() throws Exception {
        Project project = projectRepository.save(Project.create(
                UUID.randomUUID(),
                "PRJ-DEMOTE-FAIL",
                "Dự án thử giáng cấp PM duy nhất",
                null,
                pmUserId,
                null,
                ProjectPriority.MEDIUM,
                null,
                null,
                pmUserId
        ));
        ProjectMember solePm = projectMemberRepository.save(ProjectMember.create(
                UUID.randomUUID(), project.getId(), pmUserId, ProjectRole.PROJECT_MANAGER, pmUserId
        ));

        UpdateProjectMemberRoleRequest demoteReq = new UpdateProjectMemberRoleRequest(ProjectRole.MEMBER);
        mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/members/" + solePm.getId())
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(demoteReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PROJECT_MANAGER_REQUIRED"));

        // Verify role in database remains PROJECT_MANAGER
        ProjectMember reloaded = projectMemberRepository.findById(solePm.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(ProjectRole.PROJECT_MANAGER, reloaded.getProjectRole());
    }

    @Test
    @Order(14)
    void updateMemberRole_shouldSucceedWhenAnotherProjectManagerExists() throws Exception {
        Project project = projectRepository.save(Project.create(
                UUID.randomUUID(),
                "PRJ-DEMOTE-OK",
                "Dự án có 2 PM",
                null,
                pmUserId,
                null,
                ProjectPriority.MEDIUM,
                null,
                null,
                pmUserId
        ));
        projectMemberRepository.save(ProjectMember.create(
                UUID.randomUUID(), project.getId(), pmUserId, ProjectRole.PROJECT_MANAGER, pmUserId
        ));
        ProjectMember secondPm = projectMemberRepository.save(ProjectMember.create(
                UUID.randomUUID(), project.getId(), employeeUserId, ProjectRole.PROJECT_MANAGER, pmUserId
        ));

        // Demote second PM to TEAM_LEADER
        UpdateProjectMemberRoleRequest demoteReq = new UpdateProjectMemberRoleRequest(ProjectRole.TEAM_LEADER);
        mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/members/" + secondPm.getId())
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(demoteReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projectRole").value("TEAM_LEADER"));

        ProjectMember reloaded = projectMemberRepository.findById(secondPm.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(ProjectRole.TEAM_LEADER, reloaded.getProjectRole());

        // Verify project still has 1 active PROJECT_MANAGER
        long pmCount = projectMemberRepository.countByProjectIdAndProjectRoleAndActiveTrue(
                project.getId(), ProjectRole.PROJECT_MANAGER);
        org.junit.jupiter.api.Assertions.assertEquals(1, pmCount);
    }

    @Test
    @Order(15)
    void updateMemberRole_shouldSucceedWhenKeepingSameProjectManagerRole() throws Exception {
        Project project = projectRepository.save(Project.create(
                UUID.randomUUID(),
                "PRJ-SAME-PM",
                "Dự án giữ nguyên vai trò PM",
                null,
                pmUserId,
                null,
                ProjectPriority.MEDIUM,
                null,
                null,
                pmUserId
        ));
        ProjectMember solePm = projectMemberRepository.save(ProjectMember.create(
                UUID.randomUUID(), project.getId(), pmUserId, ProjectRole.PROJECT_MANAGER, pmUserId
        ));

        UpdateProjectMemberRoleRequest sameReq = new UpdateProjectMemberRoleRequest(ProjectRole.PROJECT_MANAGER);
        mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/members/" + solePm.getId())
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sameReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projectRole").value("PROJECT_MANAGER"));
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
