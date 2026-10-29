package com.worksphere.notification;

import com.worksphere.notification.application.NotificationApplicationService;
import com.worksphere.notification.application.TaskDeadlineScanner;
import com.worksphere.notification.domain.NotificationReferenceType;
import com.worksphere.notification.domain.NotificationType;
import com.worksphere.notification.infrastructure.persistence.NotificationPreferenceRepository;
import com.worksphere.notification.infrastructure.persistence.NotificationRepository;
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
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class NotificationIdempotencyAndScannerTest {

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
    private NotificationApplicationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationPreferenceRepository preferenceRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private TaskDeadlineScanner scanner;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private UUID userId1;
    private UUID userId2;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM task_assignments");
        jdbcTemplate.update("UPDATE tasks SET parent_task_id = NULL");
        jdbcTemplate.update("DELETE FROM tasks");
        jdbcTemplate.update("DELETE FROM notifications");
        scanner.setBatchSize(100);

        userId1 = UUID.randomUUID();
        userId2 = UUID.randomUUID();
        projectId = UUID.randomUUID();

        createTestUser(userId1, "scan_u1", "scan_u1@test.com");
        createTestUser(userId2, "scan_u2", "scan_u2@test.com");
        createTestProject(projectId, "Scanner Project", userId1);
    }

    @Test
    @DisplayName("Idempotency: Native insert ON CONFLICT DO NOTHING preserves single row on duplicate eventKey")
    void testNativeInsertIdempotency() {
        String eventKey = "TASK_ASSIGNED:test-task-1:assign-1";

        boolean first = notificationService.deliverInAppNotification(
                userId1, NotificationType.TASK_ASSIGNED,
                "Title", "Message", NotificationReferenceType.TASK, UUID.randomUUID(), eventKey
        );
        assertThat(first).isTrue();

        boolean second = notificationService.deliverInAppNotification(
                userId1, NotificationType.TASK_ASSIGNED,
                "Title", "Message", NotificationReferenceType.TASK, UUID.randomUUID(), eventKey
        );
        assertThat(second).isFalse();

        long count = notificationRepository.findAll().stream()
                .filter(n -> eventKey.equals(n.getEventKey()) && userId1.equals(n.getRecipientId()))
                .count();
        assertThat(count).isEqualTo(1L);
    }

    @Test
    @DisplayName("Idempotency: Two recipients with same eventKey each receive exactly one notification")
    void testMultiRecipientDelivery() {
        String sharedKey = "TASK_STATUS_CHANGED:shared-task-1:hist-1";

        boolean res1 = notificationService.deliverInAppNotification(
                userId1, NotificationType.TASK_STATUS_CHANGED,
                "Status changed", "Msg", NotificationReferenceType.TASK, UUID.randomUUID(), sharedKey
        );
        boolean res2 = notificationService.deliverInAppNotification(
                userId2, NotificationType.TASK_STATUS_CHANGED,
                "Status changed", "Msg", NotificationReferenceType.TASK, UUID.randomUUID(), sharedKey
        );

        assertThat(res1).isTrue();
        assertThat(res2).isTrue();

        long count = notificationRepository.findAll().stream()
                .filter(n -> sharedKey.equals(n.getEventKey()))
                .count();
        assertThat(count).isEqualTo(2L);
    }

    @Test
    @DisplayName("Preference: Disabled inApp preference skips notification insertion")
    void testPreferenceDisabledSkipsInsert() {
        // Disable inApp for TASK_ASSIGNED for user 1
        jdbcTemplate.update("""
                INSERT INTO notification_preferences (id, user_id, notification_type, in_app_enabled, push_enabled, email_enabled, updated_at)
                VALUES (?, ?, 'TASK_ASSIGNED', FALSE, TRUE, FALSE, NOW())
                ON CONFLICT (user_id, notification_type) DO UPDATE SET in_app_enabled = FALSE
                """, UUID.randomUUID(), userId1);

        String eventKey = "TASK_ASSIGNED:task-pref-test:assign-1";
        boolean created = notificationService.deliverInAppNotification(
                userId1, NotificationType.TASK_ASSIGNED,
                "Title", "Msg", NotificationReferenceType.TASK, UUID.randomUUID(), eventKey
        );

        assertThat(created).isFalse();
        long count = notificationRepository.findAll().stream()
                .filter(n -> eventKey.equals(n.getEventKey()))
                .count();
        assertThat(count).isEqualTo(0L);
    }

    @Test
    @DisplayName("Scanner: Detects OVERDUE and DUE_SOON tasks with fixed Clock and delivers idempotently")
    void testTaskDeadlineScanner() {
        // Task 1: Overdue (now - 2 hours)
        UUID task1Id = UUID.randomUUID();
        Instant task1Due = FIXED_NOW.minusSeconds(7200);
        createTaskWithAssignment(task1Id, "Overdue Task", TaskStatus.IN_PROGRESS, task1Due, userId1);

        // Task 2: Due Soon (now + 24 hours <= 72h)
        UUID task2Id = UUID.randomUUID();
        Instant task2Due = FIXED_NOW.plusSeconds(86400);
        createTaskWithAssignment(task2Id, "Due Soon Task", TaskStatus.TODO, task2Due, userId1);

        // Task 3: Far future (now + 100 hours > 72h)
        UUID task3Id = UUID.randomUUID();
        Instant task3Due = FIXED_NOW.plusSeconds(360000);
        createTaskWithAssignment(task3Id, "Far Future Task", TaskStatus.TODO, task3Due, userId1);

        // Task 4: Terminal completed (should be excluded)
        UUID task4Id = UUID.randomUUID();
        Instant task4Due = FIXED_NOW.minusSeconds(7200);
        createTaskWithAssignment(task4Id, "Completed Task", TaskStatus.COMPLETED, task4Due, userId1);

        // Execute scan 1
        int processed1 = scanner.scanDeadlines();
        assertThat(processed1).isEqualTo(2);

        // Verify Task 1 OVERDUE notification
        String task1Key = "TASK_OVERDUE:" + task1Id + ":" + task1Due.toEpochMilli();
        long task1Notifs = notificationRepository.findAll().stream()
                .filter(n -> task1Key.equals(n.getEventKey()) && userId1.equals(n.getRecipientId()))
                .count();
        assertThat(task1Notifs).isEqualTo(1L);

        // Verify Task 2 DUE_SOON notification
        String task2Key = "TASK_DUE_SOON:" + task2Id + ":" + task2Due.toEpochMilli();
        long task2Notifs = notificationRepository.findAll().stream()
                .filter(n -> task2Key.equals(n.getEventKey()) && userId1.equals(n.getRecipientId()))
                .count();
        assertThat(task2Notifs).isEqualTo(1L);

        // Execute scan 2 (should be idempotent: 0 new rows)
        int processed2 = scanner.scanDeadlines();
        assertThat(processed2).isEqualTo(2);

        long totalUserNotifs = notificationRepository.findAll().stream()
                .filter(n -> userId1.equals(n.getRecipientId()))
                .count();
        assertThat(totalUserNotifs).isEqualTo(2L);
    }

    @Test
    @DisplayName("Scanner: Keyset pagination processes > batch size tasks without starvation")
    void testTaskDeadlineScanner_KeysetPagination_PreventsStarvation() {
        scanner.setBatchSize(10);

        // Create 25 eligible tasks
        for (int i = 0; i < 25; i++) {
            UUID taskId = UUID.randomUUID();
            Instant dueDate = FIXED_NOW.plusSeconds(3600L * (i + 1)); // between now + 1h and now + 25h
            createTaskWithAssignment(taskId, "Starvation Test Task " + i, TaskStatus.TODO, dueDate, userId1);
        }

        // Single scan iteration must process all 25 tasks across 3 keyset pages (10, 10, 5)
        int processed1 = scanner.scanDeadlines();
        assertThat(processed1).isEqualTo(25);

        long totalDueSoon = notificationRepository.findAll().stream()
                .filter(n -> userId1.equals(n.getRecipientId()) && n.getType() == NotificationType.TASK_DUE_SOON)
                .count();
        assertThat(totalDueSoon).isEqualTo(25L);

        // Second scan iteration verifies 0 new rows and no infinite loop
        int processed2 = scanner.scanDeadlines();
        assertThat(processed2).isEqualTo(25);

        long totalDueSoonAfter = notificationRepository.findAll().stream()
                .filter(n -> userId1.equals(n.getRecipientId()) && n.getType() == NotificationType.TASK_DUE_SOON)
                .count();
        assertThat(totalDueSoonAfter).isEqualTo(25L);

        // Scenario: Delete notifications, pre-seed notifications for first 10 tasks, verify remaining 15 processed
        notificationRepository.deleteAll();

        // Query first 10 tasks in order
        var first10Tasks = taskRepository.findAll().stream()
                .filter(t -> t.getDueDate() != null && !t.isDeleted())
                .sorted(java.util.Comparator.comparing(Task::getDueDate).thenComparing(Task::getId))
                .limit(10)
                .toList();

        for (Task t : first10Tasks) {
            notificationService.deliverInAppNotification(
                    userId1, NotificationType.TASK_DUE_SOON,
                    "Pre-seeded", "Pre-seeded msg", NotificationReferenceType.TASK, t.getId(),
                    "TASK_DUE_SOON:" + t.getId() + ":" + t.getDueDate().toEpochMilli()
            );
        }
        assertThat(notificationRepository.count()).isEqualTo(10L);

        // Scanner must not starve on the first 10, must evaluate all and deliver the remaining 15
        int processed3 = scanner.scanDeadlines();
        assertThat(processed3).isEqualTo(25);

        long totalAfterPartialPreseed = notificationRepository.findAll().stream()
                .filter(n -> userId1.equals(n.getRecipientId()) && n.getType() == NotificationType.TASK_DUE_SOON)
                .count();
        assertThat(totalAfterPartialPreseed).isEqualTo(25L);

        // Restore default batch size
        scanner.setBatchSize(100);
    }

    @Test
    @DisplayName("Scanner: Advisory lock contention skips scan without error")
    void testTaskDeadlineScanner_AdvisoryLockContention_SkipsExecution() throws Exception {
        UUID taskId = UUID.randomUUID();
        Instant dueDate = FIXED_NOW.plusSeconds(3600);
        createTaskWithAssignment(taskId, "Lock Task", TaskStatus.TODO, dueDate, userId1);

        try (java.sql.Connection lockConn = java.sql.DriverManager.getConnection(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())) {
            lockConn.setAutoCommit(false);
            try (java.sql.Statement stmt = lockConn.createStatement()) {
                // Hold advisory lock on key (1101, 1) in separate connection
                stmt.execute("SELECT pg_advisory_lock(1101, 1)");

                // Scanner in Spring transaction must see false from pg_try_advisory_xact_lock and skip
                int countWhenLocked = scanner.scanDeadlines();
                assertThat(countWhenLocked).isEqualTo(0);

                // Release advisory lock
                stmt.execute("SELECT pg_advisory_unlock(1101, 1)");
            }
            lockConn.commit();
        }

        // Now that lock is released, scanner executes normally
        int countWhenUnlocked = scanner.scanDeadlines();
        assertThat(countWhenUnlocked).isEqualTo(1);
    }

    @Test
    @DisplayName("Scanner: Strict boundary checks for DUE_SOON and OVERDUE")
    void testTaskDeadlineScanner_StrictDueSoonBoundaries() {
        // Boundary 1: dueDate == FIXED_NOW -> DUE_SOON (now <= dueDate < now + 72h)
        UUID taskExactNow = UUID.randomUUID();
        createTaskWithAssignment(taskExactNow, "Exact Now", TaskStatus.TODO, FIXED_NOW, userId1);

        // Boundary 2: dueDate == FIXED_NOW - 1ms -> OVERDUE
        UUID taskJustBeforeNow = UUID.randomUUID();
        createTaskWithAssignment(taskJustBeforeNow, "Just Before Now", TaskStatus.TODO, FIXED_NOW.minusMillis(1), userId1);

        // Boundary 3: dueDate == FIXED_NOW + 72h -> EXCLUDED (strict upper bound < 72h)
        UUID taskExact72h = UUID.randomUUID();
        createTaskWithAssignment(taskExact72h, "Exact 72h", TaskStatus.TODO, FIXED_NOW.plus(java.time.Duration.ofHours(72)), userId1);

        // Boundary 4: dueDate == FIXED_NOW + 72h - 1s -> DUE_SOON
        UUID taskJustBefore72h = UUID.randomUUID();
        createTaskWithAssignment(taskJustBefore72h, "Just Before 72h", TaskStatus.TODO, FIXED_NOW.plus(java.time.Duration.ofHours(72)).minusSeconds(1), userId1);

        scanner.scanDeadlines();

        // Verify taskExactNow is DUE_SOON
        String exactNowKey = "TASK_DUE_SOON:" + taskExactNow + ":" + FIXED_NOW.toEpochMilli();
        assertThat(notificationRepository.findAll().stream().anyMatch(n -> exactNowKey.equals(n.getEventKey()))).isTrue();

        // Verify taskJustBeforeNow is OVERDUE
        String justBeforeNowKey = "TASK_OVERDUE:" + taskJustBeforeNow + ":" + FIXED_NOW.minusMillis(1).toEpochMilli();
        assertThat(notificationRepository.findAll().stream().anyMatch(n -> justBeforeNowKey.equals(n.getEventKey()))).isTrue();

        // Verify taskExact72h is NOT present
        assertThat(notificationRepository.findAll().stream().noneMatch(n -> n.getEventKey() != null && n.getEventKey().contains(taskExact72h.toString()))).isTrue();

        // Verify taskJustBefore72h is DUE_SOON
        String justBefore72hKey = "TASK_DUE_SOON:" + taskJustBefore72h + ":" + FIXED_NOW.plus(java.time.Duration.ofHours(72)).minusSeconds(1).toEpochMilli();
        assertThat(notificationRepository.findAll().stream().anyMatch(n -> justBefore72hKey.equals(n.getEventKey()))).isTrue();
    }

    private void createTestUser(UUID userId, String username, String email) {
        jdbcTemplate.update("""
                INSERT INTO users (id, username, password_hash, full_name, email, status, created_at, updated_at)
                VALUES (?, ?, 'hash', 'Test User', ?, 'ACTIVE', NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
                """, userId, username, email);
    }

    private void createTestProject(UUID projId, String name, UUID ownerId) {
        jdbcTemplate.update("""
                INSERT INTO projects (id, code, name, status, priority, manager_id, created_by, is_deleted, created_at, updated_at)
                VALUES (?, 'PRJ_' || SUBSTR(?, 1, 8), ?, 'ACTIVE', 'MEDIUM', ?, ?, FALSE, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
                """, projId, projId.toString(), name, ownerId, ownerId);
    }

    private void createTaskWithAssignment(UUID taskId, String title, TaskStatus status, Instant dueDate, UUID assigneeId) {
        Task task = Task.create(
                taskId, projectId, null, null, title, "Desc",
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
}
