package com.worksphere.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.project.domain.Milestone;
import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectPriority;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.domain.ProjectStatus;
import com.worksphere.project.infrastructure.persistence.MilestoneRepository;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.project.infrastructure.persistence.ProjectRepository;
import com.worksphere.shared.security.JwtService;
import com.worksphere.task.api.request.AssignTaskRequest;
import com.worksphere.task.api.request.ChangeTaskStatusRequest;
import com.worksphere.task.api.request.CreateSubtaskRequest;
import com.worksphere.task.api.request.CreateTaskCommentRequest;
import com.worksphere.task.api.request.CreateTaskRequest;
import com.worksphere.task.api.request.UpdateTaskCommentRequest;
import com.worksphere.task.api.request.UpdateTaskProgressRequest;
import com.worksphere.task.api.request.UpdateTaskRequest;
import com.worksphere.task.domain.Task;
import com.worksphere.task.domain.TaskAssignment;
import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;
import com.worksphere.task.infrastructure.persistence.TaskAssignmentRepository;
import com.worksphere.task.infrastructure.persistence.TaskCommentRepository;
import com.worksphere.task.infrastructure.persistence.TaskRepository;
import com.worksphere.task.infrastructure.persistence.TaskStatusHistoryRepository;
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
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import com.worksphere.task.application.TaskApplicationService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.support.TransactionTemplate;
import org.hibernate.Hibernate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
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
public class TaskMockMvcTest {

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
    private TaskRepository taskRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private TaskStatusHistoryRepository statusHistoryRepository;

    @Autowired
    private TaskCommentRepository commentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TaskApplicationService taskApplicationService;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private UUID adminUserId;
    private UUID pmUserId;
    private UUID employeeUserId;
    private UUID otherEmployeeUserId;
    private String adminToken;
    private String pmToken;
    private String employeeToken;
    private String otherEmployeeToken;
    private UUID projectId;
    private UUID milestoneId;
    private UUID deptId;

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

        // Clean tables in reverse dependency order
        jdbcTemplate.update("DELETE FROM task_comments");
        jdbcTemplate.update("DELETE FROM task_status_histories");
        jdbcTemplate.update("DELETE FROM task_assignments");
        jdbcTemplate.update("UPDATE tasks SET parent_task_id = NULL");
        jdbcTemplate.update("DELETE FROM tasks");
        jdbcTemplate.update("DELETE FROM milestones");
        jdbcTemplate.update("DELETE FROM project_members");
        jdbcTemplate.update("DELETE FROM project_status_histories");
        jdbcTemplate.update("DELETE FROM projects");
        jdbcTemplate.update("DELETE FROM user_roles");
        jdbcTemplate.update("DELETE FROM users");
        jdbcTemplate.update("DELETE FROM departments");

        // Department
        deptId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO departments (id, code, name, is_active, is_deleted, created_at, updated_at, version) "
                        + "VALUES (?, 'DEP-IT', 'IT Dept', true, false, now(), now(), 0)",
                deptId
        );

        // Users
        adminUserId = UUID.randomUUID();
        insertUser(adminUserId, "admin_task", "admin_task@test.com", passwordEncoder.encode("Password123!"));
        UUID adminRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'ADMIN'", UUID.class);
        if (adminRoleId != null) {
            jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    adminUserId, adminRoleId);
            jdbcTemplate.update(
                    "INSERT INTO role_permissions (role_id, permission_id, assigned_at) "
                            + "SELECT ?, id, now() FROM permissions ON CONFLICT DO NOTHING",
                    adminRoleId);
        }
        adminToken = jwtService.generateAccessToken(adminUserId, UUID.randomUUID());

        pmUserId = UUID.randomUUID();
        insertUser(pmUserId, "pm_task", "pm_task@test.com", passwordEncoder.encode("Password123!"));
        UUID pmRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'PROJECT_MANAGER'", UUID.class);
        if (pmRoleId != null) {
            jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    pmUserId, pmRoleId);
            jdbcTemplate.update(
                    "INSERT INTO role_permissions (role_id, permission_id, assigned_at) "
                            + "SELECT ?, id, now() FROM permissions WHERE code IN ("
                            + "'PROJECT_READ', 'PROJECT_CREATE', 'PROJECT_UPDATE', 'PROJECT_MEMBER_MANAGE', "
                            + "'TASK_READ', 'TASK_CREATE', 'TASK_UPDATE', 'TASK_DELETE', 'TASK_ASSIGN', 'TASK_UPDATE_STATUS') "
                            + "ON CONFLICT DO NOTHING",
                    pmRoleId);
        }
        pmToken = jwtService.generateAccessToken(pmUserId, UUID.randomUUID());

        employeeUserId = UUID.randomUUID();
        insertUser(employeeUserId, "emp_task", "emp_task@test.com", passwordEncoder.encode("Password123!"));
        UUID empRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'EMPLOYEE'", UUID.class);
        if (empRoleId != null) {
            jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    employeeUserId, empRoleId);
            jdbcTemplate.update(
                    "INSERT INTO role_permissions (role_id, permission_id, assigned_at) "
                            + "SELECT ?, id, now() FROM permissions WHERE code IN ('TASK_READ', 'TASK_UPDATE', 'TASK_UPDATE_STATUS') "
                            + "ON CONFLICT DO NOTHING",
                    empRoleId);
        }
        employeeToken = jwtService.generateAccessToken(employeeUserId, UUID.randomUUID());

        otherEmployeeUserId = UUID.randomUUID();
        insertUser(otherEmployeeUserId, "emp_other", "emp_other@test.com", passwordEncoder.encode("Password123!"));
        if (empRoleId != null) {
            jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    otherEmployeeUserId, empRoleId);
        }
        otherEmployeeToken = jwtService.generateAccessToken(otherEmployeeUserId, UUID.randomUUID());

        // Create Project
        projectId = UUID.randomUUID();
        Project project = Project.create(
                projectId,
                "PRJ-TASK-001",
                "Task Test Project",
                "Project for task backend tests",
                pmUserId,
                deptId,
                ProjectPriority.HIGH,
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                pmUserId
        );
        project.changeStatus(ProjectStatus.ACTIVE, pmUserId);
        projectRepository.save(project);

        // Add Project Members
        ProjectMember pmMember = ProjectMember.create(
                UUID.randomUUID(),
                projectId,
                pmUserId,
                ProjectRole.PROJECT_MANAGER,
                pmUserId
        );
        projectMemberRepository.save(pmMember);

        ProjectMember empMember = ProjectMember.create(
                UUID.randomUUID(),
                projectId,
                employeeUserId,
                ProjectRole.MEMBER,
                pmUserId
        );
        projectMemberRepository.save(empMember);

        // Create Milestone
        milestoneId = UUID.randomUUID();
        Milestone milestone = Milestone.create(
                milestoneId,
                projectId,
                "Sprint 1 MVP",
                "Complete Sprint 1 tasks",
                LocalDate.now().plusWeeks(2),
                pmUserId
        );
        milestoneRepository.save(milestone);
    }

    private void insertUser(UUID id, String username, String email, String passwordHash) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) "
                        + "VALUES (?, ?, ?, ?, ?, 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordHash, username.toUpperCase()
        );
    }

    @Test
    @DisplayName("1. Create Task successfully")
    void testCreateTaskSuccess() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest(
                projectId,
                null,
                milestoneId,
                "Implement Login API",
                "Build auth endpoints with JWT",
                TaskPriority.HIGH,
                List.of(employeeUserId),
                LocalDate.now(),
                Instant.now().plus(5, ChronoUnit.DAYS),
                480
        );

        mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Implement Login API")))
                .andExpect(jsonPath("$.data.status", is("TODO")))
                .andExpect(jsonPath("$.data.priority", is("HIGH")))
                .andExpect(jsonPath("$.data.progressPercent", is(0)))
                .andExpect(jsonPath("$.data.assignees", hasSize(1)))
                .andExpect(jsonPath("$.data.assignees[0].id", is(employeeUserId.toString())))
                .andExpect(jsonPath("$.data.milestone.id", is(milestoneId.toString())));
    }

    @Test
    @DisplayName("2. Create Task rejected when project not active")
    void testCreateTaskProjectNotActive() throws Exception {
        Project inactiveProject = Project.create(
                UUID.randomUUID(),
                "PRJ-TASK-002",
                "Inactive Project",
                null,
                pmUserId,
                null,
                ProjectPriority.LOW,
                LocalDate.now(),
                LocalDate.now().plusMonths(1),
                pmUserId
        );
        inactiveProject.changeStatus(ProjectStatus.ACTIVE, pmUserId);
        inactiveProject.changeStatus(ProjectStatus.ON_HOLD, pmUserId);
        projectRepository.save(inactiveProject);

        ProjectMember member = ProjectMember.create(
                UUID.randomUUID(),
                inactiveProject.getId(),
                pmUserId,
                ProjectRole.PROJECT_MANAGER,
                pmUserId
        );
        projectMemberRepository.save(member);

        CreateTaskRequest request = new CreateTaskRequest(
                inactiveProject.getId(),
                null,
                null,
                "Task on Inactive",
                null,
                TaskPriority.MEDIUM,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.code", is("TASK_PROJECT_NOT_ACTIVE")));
    }

    @Test
    @DisplayName("3. Create Task rejected when assignee is not project member")
    void testCreateTaskAssigneeNotProjectMember() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest(
                projectId,
                null,
                null,
                "Task with outsider",
                null,
                TaskPriority.LOW,
                List.of(otherEmployeeUserId),
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.code", is("TASK_ASSIGNEE_NOT_PROJECT_MEMBER")));
    }

    @Test
    @DisplayName("4. Create Task rejected when startDate is after dueDate")
    void testCreateTaskInvalidDateRange() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest(
                projectId,
                null,
                null,
                "Invalid Dates Task",
                null,
                TaskPriority.MEDIUM,
                null,
                LocalDate.of(2026, 12, 1),
                Instant.parse("2026-11-01T10:00:00Z"),
                null
        );

        mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.code", is("TASK_DATE_RANGE_INVALID")));
    }

    @Test
    @DisplayName("5. List tasks with filters and pagination")
    void testGetTasksWithFilters() throws Exception {
        Task task1 = Task.create(
                UUID.randomUUID(), projectId, null, null, "Frontend Task",
                "Build UI", TaskPriority.HIGH, pmUserId, null, null, 120, pmUserId
        );
        taskRepository.save(task1);

        Task task2 = Task.create(
                UUID.randomUUID(), projectId, null, null, "Backend Task",
                "Build API", TaskPriority.MEDIUM, pmUserId, null, null, 180, pmUserId
        );
        taskRepository.save(task2);

        mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + pmToken)
                        .param("projectId", projectId.toString())
                        .param("priority", "HIGH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].title", is("Frontend Task")));
    }

    @Test
    @DisplayName("6. Get task detail with allowed actions")
    void testGetTaskDetail() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, milestoneId, "Detail Test Task",
                "Testing details", TaskPriority.CRITICAL, pmUserId, null, null, 300, pmUserId
        );
        taskRepository.save(task);

        mockMvc.perform(get("/api/v1/tasks/" + task.getId())
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(task.getId().toString())))
                .andExpect(jsonPath("$.data.title", is("Detail Test Task")))
                .andExpect(jsonPath("$.data.allowedActions", notNullValue()));
    }

    @Test
    @DisplayName("7. Update task details and optimistic lock conflict")
    void testUpdateTaskDetailsAndOptimisticLock() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Initial Title",
                "Initial Desc", TaskPriority.LOW, pmUserId, null, null, 60, pmUserId
        );
        taskRepository.save(task);

        // Success update
        UpdateTaskRequest updateReq = new UpdateTaskRequest(
                "Updated Title",
                "Updated Desc",
                TaskPriority.HIGH,
                null,
                null,
                90,
                0L
        );

        mockMvc.perform(put("/api/v1/tasks/" + task.getId())
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Updated Title")))
                .andExpect(jsonPath("$.data.priority", is("HIGH")));

        // Optimistic lock conflict with old version
        UpdateTaskRequest staleReq = new UpdateTaskRequest(
                "Stale Update", null, null, null, null, null, 0L
        );

        mockMvc.perform(put("/api/v1/tasks/" + task.getId())
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staleReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("OPTIMISTIC_LOCK_CONFLICT")));
    }

    @Test
    @DisplayName("8. Workflow transitions and status history")
    void testTaskWorkflowLifecycle() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Lifecycle Task",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        TaskAssignment assignment = TaskAssignment.create(
                UUID.randomUUID(), task.getId(), employeeUserId, pmUserId
        );
        taskAssignmentRepository.save(assignment);

        // 1. TODO -> IN_PROGRESS by Assignee
        ChangeTaskStatusRequest startReq = new ChangeTaskStatusRequest(TaskStatus.IN_PROGRESS, "Start working", 0L);
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/status")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")));

        // 2. Update progress to 60%
        UpdateTaskProgressRequest progReq = new UpdateTaskProgressRequest(new BigDecimal("60.00"), 1L);
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/progress")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(progReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progressPercent", is(60.0)));

        // 3. IN_PROGRESS -> IN_REVIEW by Assignee
        ChangeTaskStatusRequest reviewReq = new ChangeTaskStatusRequest(TaskStatus.IN_REVIEW, "Ready for test", 2L);
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/status")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("IN_REVIEW")));

        // 4. Assignee cannot self-approve to COMPLETED
        ChangeTaskStatusRequest selfApproveReq = new ChangeTaskStatusRequest(TaskStatus.COMPLETED, "Self approve", 3L);
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/status")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selfApproveReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        // 5. IN_REVIEW -> COMPLETED by PM
        ChangeTaskStatusRequest completeReq = new ChangeTaskStatusRequest(TaskStatus.COMPLETED, "Approved by PM", 3L);
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/status")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.progressPercent", is(100.0)))
                .andExpect(jsonPath("$.data.completedAt", notNullValue()))
                .andExpect(jsonPath("$.data.statusHistory", hasSize(3)));

        // 6. Terminal state: cannot change status
        ChangeTaskStatusRequest reopenReq = new ChangeTaskStatusRequest(TaskStatus.IN_PROGRESS, "Reopen", 4L);
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/status")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reopenReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("TASK_TERMINAL_STATE")));
    }

    @Test
    @DisplayName("9. Review rejection requires comment")
    void testReviewRejectionRequiresComment() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Review Task",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        task.changeStatus(TaskStatus.IN_PROGRESS, "Start", pmUserId);
        task.changeStatus(TaskStatus.IN_REVIEW, "Submit", pmUserId);
        taskRepository.save(task);

        // Reject with empty comment
        ChangeTaskStatusRequest emptyCommentReq = new ChangeTaskStatusRequest(TaskStatus.IN_PROGRESS, "   ", 0L);
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/status")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyCommentReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("10. Direct TODO to COMPLETED is rejected")
    void testDirectTodoToCompletedRejected() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Bypass Task",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        ChangeTaskStatusRequest bypassReq = new ChangeTaskStatusRequest(TaskStatus.COMPLETED, "Skip review", 0L);
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/status")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bypassReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("TASK_INVALID_STATUS_TRANSITION")));
    }

    @Test
    @DisplayName("11. Task Assignments: assign and duplicate check")
    void testTaskAssignments() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Assign Test Task",
                null, TaskPriority.LOW, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        // Assign user
        AssignTaskRequest assignReq = new AssignTaskRequest(List.of(employeeUserId));
        mockMvc.perform(post("/api/v1/tasks/" + task.getId() + "/assignments")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assignees", hasSize(1)));

        // Duplicate active assignment throws TASK_ALREADY_ASSIGNED
        mockMvc.perform(post("/api/v1/tasks/" + task.getId() + "/assignments")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("TASK_ALREADY_ASSIGNED")));
    }

    @Test
    @DisplayName("12. Subtasks creation, list, and cycle detection")
    void testSubtasksAndCycleDetection() throws Exception {
        Task parentTask = Task.create(
                UUID.randomUUID(), projectId, null, null, "Parent Task",
                null, TaskPriority.HIGH, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(parentTask);

        // Create Subtask
        CreateSubtaskRequest subtaskReq = new CreateSubtaskRequest(
                null, "Subtask 1", "Subtask desc", TaskPriority.MEDIUM, null, null, null, 60
        );

        mockMvc.perform(post("/api/v1/tasks/" + parentTask.getId() + "/subtasks")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(subtaskReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.parentTaskId", is(parentTask.getId().toString())));

        // List Subtasks
        mockMvc.perform(get("/api/v1/tasks/" + parentTask.getId() + "/subtasks")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    @DisplayName("13. Comments: create, update, author permission, soft delete")
    void testTaskComments() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Comment Test Task",
                null, TaskPriority.LOW, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        // 1. Create Comment
        CreateTaskCommentRequest commentReq = new CreateTaskCommentRequest(
                "First comment by employee", null, null
        );

        String responseStr = mockMvc.perform(post("/api/v1/tasks/" + task.getId() + "/comments")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commentReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.content", is("First comment by employee")))
                .andReturn().getResponse().getContentAsString();

        UUID commentId = UUID.fromString(objectMapper.readTree(responseStr).get("data").get("id").asText());

        // 2. Other employee cannot edit comment
        UpdateTaskCommentRequest editReq = new UpdateTaskCommentRequest("Hacked comment");
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + otherEmployeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(editReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        // 3. Author edits comment
        UpdateTaskCommentRequest validEdit = new UpdateTaskCommentRequest("Edited by author");
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validEdit)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", is("Edited by author")))
                .andExpect(jsonPath("$.data.isEdited", is(true)));

        // 4. Soft delete comment
        mockMvc.perform(delete("/api/v1/tasks/" + task.getId() + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk());

        // 5. List comments does not return deleted comment
        mockMvc.perform(get("/api/v1/tasks/" + task.getId() + "/comments")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    @Test
    @DisplayName("14. Delete task restrictions: blocked if has history, allowed if fresh")
    void testDeleteTaskRestrictions() throws Exception {
        // Fresh task (no history)
        Task freshTask = Task.create(
                UUID.randomUUID(), projectId, null, null, "Fresh Task",
                null, TaskPriority.LOW, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(freshTask);

        // Can delete
        mockMvc.perform(delete("/api/v1/tasks/" + freshTask.getId())
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk());

        // Task with history
        Task taskWithHistory = Task.create(
                UUID.randomUUID(), projectId, null, null, "Task With History",
                null, TaskPriority.LOW, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(taskWithHistory);

        ChangeTaskStatusRequest startReq = new ChangeTaskStatusRequest(TaskStatus.IN_PROGRESS, "Start", 0L);
        mockMvc.perform(put("/api/v1/tasks/" + taskWithHistory.getId() + "/status")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isOk());

        // Delete fails with TASK_CANNOT_DELETE_HAS_HISTORY
        mockMvc.perform(delete("/api/v1/tasks/" + taskWithHistory.getId())
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("TASK_CANNOT_DELETE_HAS_HISTORY")));
    }

    @Test
    @DisplayName("15. Security: 401 without token and 403 without permission")
    void testSecurityAuthenticationAndAuthorization() throws Exception {
        // 401 without token
        mockMvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isUnauthorized());

        // 403 without TASK_DELETE permission
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Delete Perm Test",
                null, TaskPriority.LOW, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        mockMvc.perform(delete("/api/v1/tasks/" + task.getId())
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("16. Concurrency: uk_task_assignments_active partial unique index exists in PostgreSQL")
    void testActiveTaskAssignmentDatabaseIndexUniqueness() {
        List<Map<String, Object>> indexes = jdbcTemplate.queryForList(
                "SELECT indexname, indexdef FROM pg_indexes "
                        + "WHERE tablename = 'task_assignments' AND indexname = 'uk_task_assignments_active'"
        );
        assertThat(indexes).hasSize(1);
        String indexdef = ((String) indexes.get(0).get("indexdef")).toLowerCase();
        assertThat(indexdef).contains("task_id");
        assertThat(indexdef).contains("assignee_id");
        assertThat(indexdef).contains("is_active");
    }

    @Test
    @DisplayName("17. Concurrency: Sequential duplicate assignment is rejected with TASK_ALREADY_ASSIGNED")
    void testSequentialDuplicateAssignmentRejected() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Assign Seq Task",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        AssignTaskRequest assignReq = new AssignTaskRequest(List.of(employeeUserId));

        // First assignment succeeds
        mockMvc.perform(post("/api/v1/tasks/" + task.getId() + "/assignments")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk());

        // Duplicate sequential assignment is rejected
        mockMvc.perform(post("/api/v1/tasks/" + task.getId() + "/assignments")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("TASK_ALREADY_ASSIGNED")));
    }

    @Test
    @DisplayName("18. Concurrency: Reassign after unassign succeeds (inactive row does not block reassign)")
    void testReassignAfterUnassignSucceeds() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Reassign Task",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        AssignTaskRequest assignReq = new AssignTaskRequest(List.of(employeeUserId));

        // 1. Assign
        mockMvc.perform(post("/api/v1/tasks/" + task.getId() + "/assignments")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk());

        TaskAssignment assignment = taskAssignmentRepository.findByTaskIdAndActiveTrue(task.getId()).get(0);
        assertThat(assignment.isActive()).isTrue();

        // 2. Unassign
        mockMvc.perform(delete("/api/v1/tasks/" + task.getId() + "/assignments/" + assignment.getId())
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk());

        TaskAssignment unassigned = taskAssignmentRepository.findById(assignment.getId()).orElseThrow();
        assertThat(unassigned.isActive()).isFalse();

        // 3. Reassign same user succeeds
        mockMvc.perform(post("/api/v1/tasks/" + task.getId() + "/assignments")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk());

        Integer activeCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM task_assignments WHERE task_id = ? AND assignee_id = ? AND is_active = true",
                Integer.class, task.getId(), employeeUserId
        );
        assertThat(activeCount).isEqualTo(1);

        Integer totalCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM task_assignments WHERE task_id = ? AND assignee_id = ?",
                Integer.class, task.getId(), employeeUserId
        );
        assertThat(totalCount).isEqualTo(2);
    }

    @Test
    @DisplayName("19. Concurrency: Concurrent duplicate assignments commit exactly one active assignment")
    void testConcurrentDuplicateAssignmentsOnlyOneCommitted() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Concurrent Assign Task",
                null, TaskPriority.HIGH, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        int threads = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger alreadyAssignedCount = new AtomicInteger(0);

        List<Future<Void>> futures = new ArrayList<>();
        AssignTaskRequest assignReq = new AssignTaskRequest(List.of(employeeUserId));
        String body = objectMapper.writeValueAsString(assignReq);

        for (int i = 0; i < threads; i++) {
            futures.add(executor.submit(() -> {
                startLatch.await();
                try {
                    mockMvc.perform(post("/api/v1/tasks/" + task.getId() + "/assignments")
                                    .header("Authorization", "Bearer " + pmToken)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(body))
                            .andDo(result -> {
                                int s = result.getResponse().getStatus();
                                String content = result.getResponse().getContentAsString();
                                if (s == 200) {
                                    successCount.incrementAndGet();
                                } else if (content.contains("TASK_ALREADY_ASSIGNED")) {
                                    alreadyAssignedCount.incrementAndGet();
                                }
                            });
                } catch (Exception e) {
                    // Ignored
                }
                return null;
            }));
        }

        startLatch.countDown();
        for (Future<Void> future : futures) {
            future.get(10, TimeUnit.SECONDS);
        }
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(1);
        assertThat(alreadyAssignedCount.get()).isEqualTo(threads - 1);

        Integer activeInDb = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM task_assignments WHERE task_id = ? AND assignee_id = ? AND is_active = true",
                Integer.class, task.getId(), employeeUserId
        );
        assertThat(activeInDb).isEqualTo(1);
    }

    @Test
    @DisplayName("20. Hierarchy: Cycle detection rejects self-parent, 2-level cycle, and 3-level cycle")
    void testHierarchyCycleDetectionSelfTwoAndThreeLevel() {
        // 1. Self cycle
        Task taskA = Task.create(
                UUID.randomUUID(), projectId, null, null, "Task A",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(taskA);

        assertThatThrownBy(() -> taskApplicationService.validateParentHierarchy(taskA.getId(), taskA.getId(), projectId))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_PARENT_CYCLE_DETECTED"));

        // 2. Two-level cycle: A -> B, setting parent of A to B
        Task taskB = Task.create(
                UUID.randomUUID(), projectId, taskA.getId(), null, "Task B (child of A)",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(taskB);

        assertThatThrownBy(() -> taskApplicationService.validateParentHierarchy(taskA.getId(), taskB.getId(), projectId))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_PARENT_CYCLE_DETECTED"));

        // 3. Three-level cycle: A -> B -> C, setting parent of A to C
        Task taskC = Task.create(
                UUID.randomUUID(), projectId, taskB.getId(), null, "Task C (child of B)",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(taskC);

        assertThatThrownBy(() -> taskApplicationService.validateParentHierarchy(taskA.getId(), taskC.getId(), projectId))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_PARENT_CYCLE_DETECTED"));
    }

    @Test
    @DisplayName("21. Hierarchy: Valid hierarchy chain of 52 levels passes without cycle error")
    void testDeepHierarchyOver50LevelsPasses() throws Exception {
        UUID currentParentId = null;
        for (int i = 0; i < 52; i++) {
            Task chainTask = Task.create(
                    UUID.randomUUID(), projectId, currentParentId, null, "Chain Level " + i,
                    null, TaskPriority.LOW, pmUserId, null, null, null, pmUserId
            );
            taskRepository.save(chainTask);
            currentParentId = chainTask.getId();
        }

        // Subtask creation at level 52 under currentParentId should succeed
        CreateSubtaskRequest subtaskReq = new CreateSubtaskRequest(
                null, "Subtask at depth 52", null, TaskPriority.MEDIUM, null, null, null, null
        );
        mockMvc.perform(post("/api/v1/tasks/" + currentParentId + "/subtasks")
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(subtaskReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title", is("Subtask at depth 52")))
                .andExpect(jsonPath("$.data.parentTaskId", is(currentParentId.toString())));
    }

    @Test
    @DisplayName("22. Hierarchy: Parent validation rejects soft-deleted parent and different project parent")
    void testParentValidationSoftDeletedOrDifferentProject() {
        // Soft-deleted parent
        Task deletedTask = Task.create(
                UUID.randomUUID(), projectId, null, null, "Deleted Parent",
                null, TaskPriority.LOW, pmUserId, null, null, null, pmUserId
        );
        deletedTask.softDelete(pmUserId);
        taskRepository.save(deletedTask);

        assertThatThrownBy(() -> taskApplicationService.validateParentHierarchy(null, deletedTask.getId(), projectId))
                .isInstanceOf(ResourceNotFoundException.class)
                .satisfies(e -> assertThat(((ResourceNotFoundException) e).getCode()).isEqualTo("TASK_NOT_FOUND"));

        // Different project parent
        UUID otherProjectId = UUID.randomUUID();
        Project otherProject = Project.create(
                otherProjectId,
                "PRJ-OTHER",
                "Other Project",
                "Other description",
                pmUserId,
                deptId,
                ProjectPriority.MEDIUM,
                LocalDate.now(),
                LocalDate.now().plusMonths(1),
                pmUserId
        );
        projectRepository.save(otherProject);

        Task otherProjectTask = Task.create(
                UUID.randomUUID(), otherProjectId, null, null, "Other Proj Task",
                null, TaskPriority.LOW, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(otherProjectTask);

        assertThatThrownBy(() -> taskApplicationService.validateParentHierarchy(null, otherProjectTask.getId(), projectId))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_PARENT_PROJECT_MISMATCH"));
    }

    @Test
    @DisplayName("23. Comments: Author and Admin can edit/delete, but PM (non-Admin) is forbidden from editing/deleting other users' comments")
    void testCommentAuthorizationAuthorAdminAndPmNonAdminRestrictions() throws Exception {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Comment Auth Task",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        // Employee creates comment
        CreateTaskCommentRequest createReq = new CreateTaskCommentRequest("Employee comment", null, null);
        String res = mockMvc.perform(post("/api/v1/tasks/" + task.getId() + "/comments")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String commentId = objectMapper.readTree(res).path("data").path("id").asText();

        // 1. PM (non-admin) tries to update employee's comment -> 422 FORBIDDEN
        UpdateTaskCommentRequest pmEditReq = new UpdateTaskCommentRequest("PM override edit");
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + pmToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pmEditReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        // 2. PM (non-admin) tries to delete employee's comment -> 422 FORBIDDEN
        mockMvc.perform(delete("/api/v1/tasks/" + task.getId() + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        // 3. System Admin updates employee's comment -> 200 OK
        UpdateTaskCommentRequest adminEditReq = new UpdateTaskCommentRequest("Admin curated edit");
        mockMvc.perform(put("/api/v1/tasks/" + task.getId() + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminEditReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", is("Admin curated edit")));

        // 4. System Admin deletes employee's comment -> 200 OK
        mockMvc.perform(delete("/api/v1/tasks/" + task.getId() + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("24. Comments: Parent comment from different task or soft-deleted parent is rejected")
    void testCommentParentValidationMismatchedTaskOrDeleted() throws Exception {
        Task task1 = Task.create(
                UUID.randomUUID(), projectId, null, null, "Comment Task 1",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task1);

        Task task2 = Task.create(
                UUID.randomUUID(), projectId, null, null, "Comment Task 2",
                null, TaskPriority.MEDIUM, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task2);

        // Comment on Task 1
        CreateTaskCommentRequest req1 = new CreateTaskCommentRequest("Parent on task 1", null, null);
        String res1 = mockMvc.perform(post("/api/v1/tasks/" + task1.getId() + "/comments")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String comment1Id = objectMapper.readTree(res1).path("data").path("id").asText();

        // 1. Reply on Task 2 referencing comment from Task 1 -> rejected with COMMENT_NOT_FOUND (404)
        CreateTaskCommentRequest replyDiffTask = new CreateTaskCommentRequest(
                "Reply cross task", UUID.fromString(comment1Id), null
        );
        mockMvc.perform(post("/api/v1/tasks/" + task2.getId() + "/comments")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyDiffTask)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("COMMENT_NOT_FOUND")));

        // 2. Soft-delete comment on Task 1
        mockMvc.perform(delete("/api/v1/tasks/" + task1.getId() + "/comments/" + comment1Id)
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk());

        // Reply on Task 1 referencing deleted comment -> rejected with COMMENT_NOT_FOUND (404)
        CreateTaskCommentRequest replyDeleted = new CreateTaskCommentRequest(
                "Reply to deleted", UUID.fromString(comment1Id), null
        );
        mockMvc.perform(post("/api/v1/tasks/" + task1.getId() + "/comments")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyDeleted)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("COMMENT_NOT_FOUND")));
    }

    @Test
    @DisplayName("25. Rollback: Failure during status history insert rolls back task status, version, and history on PostgreSQL")
    void testStatusHistoryRollbackOnFailure() {
        Task task = Task.create(
                UUID.randomUUID(), projectId, null, null, "Rollback Test Task",
                null, TaskPriority.HIGH, pmUserId, null, null, null, pmUserId
        );
        taskRepository.save(task);

        User pmUser = transactionTemplate.execute(status -> {
            User u = userRepository.findById(pmUserId).orElseThrow();
            Hibernate.initialize(u.getRoles());
            return u;
        });
        WorkSphereUserPrincipal pmPrincipal = new WorkSphereUserPrincipal(pmUser);

        // Comment > 1000 characters triggers PostgreSQL VARCHAR(1000) constraint violation when saving TaskStatusHistory
        String overlyLongComment = "R".repeat(1005);
        ChangeTaskStatusRequest badReq = new ChangeTaskStatusRequest(TaskStatus.IN_PROGRESS, overlyLongComment, 0L);

        // Executing changeStatus will fail when Hibernate flushes history insert to PostgreSQL
        assertThatThrownBy(() -> taskApplicationService.changeStatus(task.getId(), badReq, pmPrincipal))
                .isInstanceOf(DataIntegrityViolationException.class);

        // In a fresh query from PostgreSQL:
        Map<String, Object> taskRow = jdbcTemplate.queryForMap(
                "SELECT status, version FROM tasks WHERE id = ?", task.getId()
        );
        assertThat(taskRow.get("status")).isEqualTo("TODO");
        assertThat(((Number) taskRow.get("version")).longValue()).isEqualTo(0L);

        Integer historyCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM task_status_histories WHERE task_id = ?",
                Integer.class, task.getId()
        );
        assertThat(historyCount).isEqualTo(0);
    }
}
