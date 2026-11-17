package com.worksphere.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.notification.domain.Notification;
import com.worksphere.notification.domain.NotificationReferenceType;
import com.worksphere.notification.domain.NotificationType;
import com.worksphere.notification.infrastructure.persistence.NotificationRepository;
import com.worksphere.shared.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class NotificationMockMvcTest {

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

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;

    private UUID user1Id;
    private UUID user2Id;
    private String user1Token;
    private String user2Token;

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

        createTestUser(user1Id, "notif_user1", "notif_user1@test.com", "EMPLOYEE");
        createTestUser(user2Id, "notif_user2", "notif_user2@test.com", "EMPLOYEE");

        user1Token = authorizationAccessToken(user1Id);
        user2Token = authorizationAccessToken(user2Id);
    }

    @Test
    @DisplayName("GET /api/v1/notifications: List own notifications with user isolation")
    void testListOwnNotifications() throws Exception {
        UUID notifUser1 = UUID.randomUUID();
        UUID notifUser2 = UUID.randomUUID();

        notificationRepository.save(Notification.create(
                notifUser1, user1Id, NotificationType.TASK_ASSIGNED,
                "User 1 Task", "You got a task", NotificationReferenceType.TASK,
                UUID.randomUUID(), "KEY_U1_" + notifUser1, Instant.now()
        ));
        notificationRepository.save(Notification.create(
                notifUser2, user2Id, NotificationType.TASK_ASSIGNED,
                "User 2 Task", "You got a task", NotificationReferenceType.TASK,
                UUID.randomUUID(), "KEY_U2_" + notifUser2, Instant.now()
        ));

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(notifUser1.toString()))
                .andExpect(jsonPath("$.data.items[0].title").value("User 1 Task"));
    }

    @Test
    @DisplayName("GET /api/v1/notifications: Filter by read and type")
    void testFilterByReadAndType() throws Exception {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();

        Notification n1 = Notification.create(
                id1, user1Id, NotificationType.TASK_ASSIGNED,
                "Task Notif", "Msg", NotificationReferenceType.TASK,
                UUID.randomUUID(), "KEY_F1_" + id1, Instant.now()
        );
        Notification n2 = Notification.create(
                id2, user1Id, NotificationType.COMMENT_ADDED,
                "Comment Notif", "Msg", NotificationReferenceType.TASK,
                UUID.randomUUID(), "KEY_F2_" + id2, Instant.now()
        );
        n2.markRead(Instant.now());

        notificationRepository.save(n1);
        notificationRepository.save(n2);

        // Filter unread
        mockMvc.perform(get("/api/v1/notifications?read=false")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(id1.toString()));

        // Filter type COMMENT_ADDED
        mockMvc.perform(get("/api/v1/notifications?type=COMMENT_ADDED")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(id2.toString()));
    }

    @Test
    @DisplayName("GET /api/v1/notifications/unread-count: Accurate count of unread notifications")
    void testUnreadCount() throws Exception {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();

        Notification n1 = Notification.create(
                id1, user1Id, NotificationType.TASK_ASSIGNED,
                "Task 1", "Msg", null, null, "KEY_CNT_1_" + id1, Instant.now()
        );
        Notification n2 = Notification.create(
                id2, user1Id, NotificationType.TASK_ASSIGNED,
                "Task 2", "Msg", null, null, "KEY_CNT_2_" + id2, Instant.now()
        );
        n2.markRead(Instant.now());

        notificationRepository.save(n1);
        notificationRepository.save(n2);

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.count").value(1));
    }

    @Test
    @DisplayName("PUT /api/v1/notifications/{id}/read: Mark single notification read (owner and idempotent)")
    void testMarkRead() throws Exception {
        UUID id = UUID.randomUUID();
        Notification n = Notification.create(
                id, user1Id, NotificationType.TASK_ASSIGNED,
                "Task", "Msg", null, null, "KEY_MR_" + id, Instant.now()
        );
        notificationRepository.save(n);

        // First mark-read: returns 200
        mockMvc.perform(put("/api/v1/notifications/" + id + "/read")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Notification reloaded = notificationRepository.findById(id).orElseThrow();
        assertThat(reloaded.isRead()).isTrue();
        assertThat(reloaded.getReadAt()).isNotNull();

        // Second mark-read (idempotent): returns 200
        mockMvc.perform(put("/api/v1/notifications/" + id + "/read")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/v1/notifications/{id}/read: Other user's notification returns 404 NOTIFICATION_NOT_FOUND")
    void testMarkReadOtherUserNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        Notification n = Notification.create(
                id, user1Id, NotificationType.TASK_ASSIGNED,
                "Task", "Msg", null, null, "KEY_OTH_" + id, Instant.now()
        );
        notificationRepository.save(n);

        // User 2 attempts to mark User 1's notification as read
        mockMvc.perform(put("/api/v1/notifications/" + id + "/read")
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOTIFICATION_NOT_FOUND"));
    }

    @Test
    @DisplayName("PUT /api/v1/notifications/read-all: Mark all unread notifications read with updatedCount")
    void testMarkAllRead() throws Exception {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();

        notificationRepository.save(Notification.create(
                id1, user1Id, NotificationType.TASK_ASSIGNED,
                "Task 1", "Msg", null, null, "KEY_ALL_1_" + id1, Instant.now()
        ));
        notificationRepository.save(Notification.create(
                id2, user1Id, NotificationType.TASK_ASSIGNED,
                "Task 2", "Msg", null, null, "KEY_ALL_2_" + id2, Instant.now()
        ));

        mockMvc.perform(put("/api/v1/notifications/read-all")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.updatedCount").value(2));

        assertThat(notificationRepository.findById(id1).orElseThrow().isRead()).isTrue();
        assertThat(notificationRepository.findById(id2).orElseThrow().isRead()).isTrue();
    }

    @Test
    @DisplayName("Security: Unauthenticated request rejected with 401")
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized());
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

    @org.springframework.beans.factory.annotation.Autowired
    private com.worksphere.identity.infrastructure.persistence.LoginSessionRepository authorizationTestSessions;

    private String authorizationAccessToken(UUID userId) {
        UUID sessionId = UUID.randomUUID();
        authorizationTestSessions.save(com.worksphere.identity.domain.LoginSession.create(
                sessionId, userId, null, "HTTP test", "127.0.0.1", "JUnit"));
        return jwtService.generateAccessToken(userId, sessionId);
    }
}
