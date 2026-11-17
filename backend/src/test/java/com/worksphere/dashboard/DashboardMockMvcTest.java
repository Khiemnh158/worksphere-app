package com.worksphere.dashboard;

import com.worksphere.notification.domain.Notification;
import com.worksphere.notification.domain.NotificationReferenceType;
import com.worksphere.notification.domain.NotificationType;
import com.worksphere.notification.infrastructure.persistence.NotificationRepository;
import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.domain.ProjectStatus;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.project.infrastructure.persistence.ProjectRepository;
import com.worksphere.service_request.domain.ServiceAssignment;
import com.worksphere.service_request.domain.ServiceCategory;
import com.worksphere.service_request.domain.ServicePriority;
import com.worksphere.service_request.domain.ServiceRequest;
import com.worksphere.service_request.domain.ServiceStatus;
import com.worksphere.service_request.infrastructure.persistence.ServiceAssignmentRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceCategoryRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceRequestRepository;
import com.worksphere.shared.security.JwtService;
import com.worksphere.task.domain.Task;
import com.worksphere.task.domain.TaskAssignment;
import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;
import com.worksphere.task.infrastructure.persistence.TaskAssignmentRepository;
import com.worksphere.task.infrastructure.persistence.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class DashboardMockMvcTest {

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
    }

    private static final Instant FIXED_NOW = Instant.parse("2026-10-16T12:00:00Z");

    @TestConfiguration
    static class FixedClockConfig {
        @Bean
        @Primary
        public Clock fixedClock() {
            return Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        }
    }

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private ServiceAssignmentRepository serviceAssignmentRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private MockMvc mockMvc;

    private UUID user1Id;
    private UUID user2Id;
    private String user1Token;
    private String user2Token;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        authorizationTestSessions.deleteAll();
        OpenEntityManagerInViewFilter osivFilter = new OpenEntityManagerInViewFilter();
        osivFilter.setServletContext(context.getServletContext());
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilter(osivFilter)
                .apply(springSecurity())
                .build();

        user1Id = UUID.randomUUID();
        user2Id = UUID.randomUUID();

        createTestUser(user1Id, "dash_u1", "dash_u1@test.com", "EMPLOYEE");
        createTestUser(user2Id, "dash_u2", "dash_u2@test.com", "EMPLOYEE");

        user1Token = authorizationAccessToken(user1Id);
        user2Token = authorizationAccessToken(user2Id);

        categoryId = UUID.randomUUID();
        ServiceCategory category = ServiceCategory.create(
                categoryId, null, "CAT_DASH_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(),
                "Category Dash", "Desc", ServicePriority.MEDIUM, true, FIXED_NOW
        );
        serviceCategoryRepository.save(category);
    }

    @Test
    @DisplayName("GET /api/v1/dashboard/me: Empty dashboard returns zeros and empty arrays")
    void testEmptyDashboard() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/me")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tasks.todo").value(0))
                .andExpect(jsonPath("$.data.tasks.inProgress").value(0))
                .andExpect(jsonPath("$.data.tasks.inReview").value(0))
                .andExpect(jsonPath("$.data.tasks.completed").value(0))
                .andExpect(jsonPath("$.data.tasks.overdue").value(0))
                .andExpect(jsonPath("$.data.tasks.dueSoon").value(0))
                .andExpect(jsonPath("$.data.serviceRequests.open").value(0))
                .andExpect(jsonPath("$.data.serviceRequests.inProgress").value(0))
                .andExpect(jsonPath("$.data.serviceRequests.waitingForUser").value(0))
                .andExpect(jsonPath("$.data.serviceRequests.resolved").value(0))
                .andExpect(jsonPath("$.data.projects.active").value(0))
                .andExpect(jsonPath("$.data.projects.onHold").value(0))
                .andExpect(jsonPath("$.data.upcomingTasks", hasSize(0)))
                .andExpect(jsonPath("$.data.recentNotifications", hasSize(0)));
    }

    @Test
    @DisplayName("GET /api/v1/dashboard/me: Accurate task summary, upcoming tasks, and cross-user isolation")
    void testTaskMetricsAndUpcomingTasks() throws Exception {
        UUID projId = UUID.randomUUID();
        Project project = Project.create(
                projId, "P_DASH_1", "Project Dash Alpha", "Desc", user1Id,
                null, null, null, null, user1Id
        );
        project.changeStatus(ProjectStatus.ACTIVE, user1Id);
        projectRepository.save(project);

        // 1. Task TODO (due soon: now + 24h)
        UUID t1 = UUID.randomUUID();
        Instant t1Due = FIXED_NOW.plusSeconds(86400);
        createTaskWithAssignment(t1, projId, "Task Todo Due Soon", TaskStatus.TODO, t1Due, user1Id);

        // 2. Task IN_PROGRESS (overdue: now - 5h)
        UUID t2 = UUID.randomUUID();
        Instant t2Due = FIXED_NOW.minusSeconds(18000);
        createTaskWithAssignment(t2, projId, "Task InProgress Overdue", TaskStatus.IN_PROGRESS, t2Due, user1Id);

        // 3. Task COMPLETED (due date in past, but completed -> NOT overdue)
        UUID t3 = UUID.randomUUID();
        Instant t3Due = FIXED_NOW.minusSeconds(18000);
        createTaskWithAssignment(t3, projId, "Task Completed", TaskStatus.COMPLETED, t3Due, user1Id);

        // 4. Task for User 2 (must not be seen by User 1)
        UUID tUser2 = UUID.randomUUID();
        createTaskWithAssignment(tUser2, projId, "Task User 2", TaskStatus.TODO, t1Due, user2Id);

        mockMvc.perform(get("/api/v1/dashboard/me")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tasks.todo").value(1))
                .andExpect(jsonPath("$.data.tasks.inProgress").value(1))
                .andExpect(jsonPath("$.data.tasks.completed").value(1))
                .andExpect(jsonPath("$.data.tasks.overdue").value(1))
                .andExpect(jsonPath("$.data.tasks.dueSoon").value(1))
                .andExpect(jsonPath("$.data.upcomingTasks", hasSize(1)))
                .andExpect(jsonPath("$.data.upcomingTasks[0].id").value(t1.toString()))
                .andExpect(jsonPath("$.data.upcomingTasks[0].projectName").value("Project Dash Alpha"))
                .andExpect(jsonPath("$.data.upcomingTasks[0].title").value("Task Todo Due Soon"));
    }

    @Test
    @DisplayName("GET /api/v1/dashboard/me: Service request summary with requester and assignee relations without double count")
    void testServiceRequestMetricsNoDoubleCount() throws Exception {
        // SR 1: User 1 is requester only (status OPEN)
        UUID sr1Id = UUID.randomUUID();
        ServiceRequest sr1 = ServiceRequest.create(
                sr1Id, "SR-2026-900001", categoryId, user1Id, null,
                "Request 1", "Desc", ServicePriority.MEDIUM, user1Id, FIXED_NOW
        );
        serviceRequestRepository.save(sr1);

        // SR 2: User 1 is assignee only (status IN_PROGRESS)
        UUID sr2Id = UUID.randomUUID();
        ServiceRequest sr2 = ServiceRequest.create(
                sr2Id, "SR-2026-900002", categoryId, user2Id, null,
                "Request 2", "Desc", ServicePriority.HIGH, user2Id, FIXED_NOW
        );
        sr2.transitionStatus(ServiceStatus.ASSIGNED, user2Id, FIXED_NOW);
        sr2.transitionStatus(ServiceStatus.IN_PROGRESS, user2Id, FIXED_NOW);
        serviceRequestRepository.save(sr2);

        ServiceAssignment sa2 = ServiceAssignment.create(UUID.randomUUID(), sr2Id, user1Id, user2Id, FIXED_NOW);
        serviceAssignmentRepository.save(sa2);

        // SR 3: User 1 is BOTH requester and assignee (status RESOLVED)
        UUID sr3Id = UUID.randomUUID();
        ServiceRequest sr3 = ServiceRequest.create(
                sr3Id, "SR-2026-900003", categoryId, user1Id, null,
                "Request 3", "Desc", ServicePriority.LOW, user1Id, FIXED_NOW
        );
        sr3.transitionStatus(ServiceStatus.ASSIGNED, user1Id, FIXED_NOW);
        sr3.transitionStatus(ServiceStatus.IN_PROGRESS, user1Id, FIXED_NOW);
        sr3.transitionStatus(ServiceStatus.RESOLVED, user1Id, FIXED_NOW);
        serviceRequestRepository.save(sr3);

        ServiceAssignment sa3 = ServiceAssignment.create(UUID.randomUUID(), sr3Id, user1Id, user1Id, FIXED_NOW);
        serviceAssignmentRepository.save(sa3);

        mockMvc.perform(get("/api/v1/dashboard/me")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.serviceRequests.open").value(1))
                .andExpect(jsonPath("$.data.serviceRequests.inProgress").value(1))
                .andExpect(jsonPath("$.data.serviceRequests.resolved").value(1))
                .andExpect(jsonPath("$.data.serviceRequests.waitingForUser").value(0));
    }

    @Test
    @DisplayName("GET /api/v1/dashboard/me: Project summary counts active project memberships only")
    void testProjectMetricsMembershipScoping() throws Exception {
        // Project 1: ACTIVE, user 1 is active member
        UUID p1Id = UUID.randomUUID();
        Project p1 = Project.create(p1Id, "PRJ_ACT", "Active Proj", "Desc", user2Id, null, null, null, null, user2Id);
        p1.changeStatus(ProjectStatus.ACTIVE, user2Id);
        projectRepository.save(p1);
        ProjectMember pm1 = ProjectMember.create(UUID.randomUUID(), p1Id, user1Id, ProjectRole.MEMBER, user2Id);
        projectMemberRepository.save(pm1);

        // Project 2: ON_HOLD, user 1 is active member
        UUID p2Id = UUID.randomUUID();
        Project p2 = Project.create(p2Id, "PRJ_HOLD", "OnHold Proj", "Desc", user2Id, null, null, null, null, user2Id);
        p2.changeStatus(ProjectStatus.ACTIVE, user2Id);
        p2.changeStatus(ProjectStatus.ON_HOLD, user2Id);
        projectRepository.save(p2);
        ProjectMember pm2 = ProjectMember.create(UUID.randomUUID(), p2Id, user1Id, ProjectRole.MEMBER, user2Id);
        projectMemberRepository.save(pm2);

        // Project 3: ACTIVE, user 1 was deactivated / inactive
        UUID p3Id = UUID.randomUUID();
        Project p3 = Project.create(p3Id, "PRJ_INACT", "Inactive Mem Proj", "Desc", user2Id, null, null, null, null, user2Id);
        p3.changeStatus(ProjectStatus.ACTIVE, user2Id);
        projectRepository.save(p3);
        ProjectMember pm3 = ProjectMember.create(UUID.randomUUID(), p3Id, user1Id, ProjectRole.MEMBER, user2Id);
        pm3.deactivate();
        projectMemberRepository.save(pm3);

        mockMvc.perform(get("/api/v1/dashboard/me")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projects.active").value(1))
                .andExpect(jsonPath("$.data.projects.onHold").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/dashboard/me: Recent notifications top 5 ordered by createdAt DESC, id DESC")
    void testRecentNotificationsTop5() throws Exception {
        for (int i = 1; i <= 7; i++) {
            Notification n = Notification.create(
                    UUID.randomUUID(),
                    user1Id,
                    NotificationType.TASK_ASSIGNED,
                    "Notif " + i,
                    "Message " + i,
                    NotificationReferenceType.TASK,
                    UUID.randomUUID(),
                    "KEY_DASH_N_" + i + "_" + UUID.randomUUID(),
                    FIXED_NOW.plusSeconds(i * 10)
            );
            notificationRepository.save(n);
        }

        mockMvc.perform(get("/api/v1/dashboard/me")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recentNotifications", hasSize(5)))
                .andExpect(jsonPath("$.data.recentNotifications[0].title").value("Notif 7"))
                .andExpect(jsonPath("$.data.recentNotifications[1].title").value("Notif 6"))
                .andExpect(jsonPath("$.data.recentNotifications[2].title").value("Notif 5"))
                .andExpect(jsonPath("$.data.recentNotifications[3].title").value("Notif 4"))
                .andExpect(jsonPath("$.data.recentNotifications[4].title").value("Notif 3"));
    }

    private void createTestUser(UUID userId, String username, String email, String roleCode) {
        jdbcTemplate.update("""
                INSERT INTO users (id, username, password_hash, full_name, email, status, created_at, updated_at)
                VALUES (?, ?, 'hash', 'Test User', ?, 'ACTIVE', NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
                """, userId, username, email);

        jdbcTemplate.update("""
                INSERT INTO user_roles (user_id, role_id, assigned_at)
                SELECT ?, r.id, NOW() FROM roles r WHERE r.code = ?
                ON CONFLICT DO NOTHING
                """, userId, roleCode);
    }

    private void createTaskWithAssignment(UUID taskId, UUID projId, String title, TaskStatus status, Instant dueDate, UUID assigneeId) {
        Task task = Task.create(
                taskId, projId, null, null, title, "Desc",
                TaskPriority.MEDIUM, assigneeId, null, dueDate, 60, assigneeId
        );
        if (status == TaskStatus.IN_PROGRESS) {
            task.changeStatus(TaskStatus.IN_PROGRESS, "start", assigneeId);
        } else if (status == TaskStatus.COMPLETED) {
            task.changeStatus(TaskStatus.IN_PROGRESS, "start", assigneeId);
            task.changeStatus(TaskStatus.IN_REVIEW, "review", assigneeId);
            task.changeStatus(TaskStatus.COMPLETED, "done", assigneeId);
        }
        taskRepository.save(task);

        TaskAssignment assignment = TaskAssignment.create(UUID.randomUUID(), taskId, assigneeId, assigneeId);
        taskAssignmentRepository.save(assignment);
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
