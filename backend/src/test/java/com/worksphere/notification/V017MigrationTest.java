package com.worksphere.notification;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Migration tests for V017__add_notification_idempotency_and_query_indexes.sql.
 * Validates preflight, backfill, idempotency unique index, and query index.
 * Per reports/runbooks/V017_NOTIFICATION_IDEMPOTENCY_PLAN.md and D-049, D-050.
 */
@Testcontainers
class V017MigrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    private static Connection connection;
    private static UUID legacyUser1Id = UUID.randomUUID();
    private static UUID legacyUser2Id = UUID.randomUUID();
    private static UUID legacyNotif1Id = UUID.randomUUID();
    private static UUID legacyNotif2Id = UUID.randomUUID();

    private static UUID legacyRefId1 = UUID.randomUUID();
    private static UUID legacyRefId2 = UUID.randomUUID();
    private static Instant legacyCreated1 = Instant.parse("2026-10-10T10:00:00Z");
    private static Instant legacyCreated2 = Instant.parse("2026-10-11T11:00:00Z");
    private static Instant legacyReadAt1 = Instant.parse("2026-10-10T12:00:00Z");

    @BeforeAll
    static void setUp() throws SQLException {
        // 1. Run migrations up to V016
        Flyway flywayV16 = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .target("016")
                .load();
        flywayV16.migrate();

        connection = DriverManager.getConnection(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()
        );

        // 2. Insert legacy users and notifications prior to V017 with all business fields populated
        insertUser(legacyUser1Id, "legacy_user1", "legacy1@test.com");
        insertUser(legacyUser2Id, "legacy_user2", "legacy2@test.com");

        insertLegacyNotification(
                legacyNotif1Id, legacyUser1Id, "TASK_ASSIGNED", "Task Assigned 1",
                "Message 1", "TASK", legacyRefId1, true, legacyReadAt1, legacyCreated1
        );
        insertLegacyNotification(
                legacyNotif2Id, legacyUser2Id, "TASK_STATUS_CHANGED", "Task Status 2",
                "Message 2", "PROJECT", legacyRefId2, false, null, legacyCreated2
        );

        // 3. Migrate V017
        Flyway flywayV17 = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .target("017")
                .load();
        flywayV17.migrate();
    }

    @AfterAll
    static void tearDown() throws SQLException {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    @Test
    @Order(1)
    @DisplayName("Verify V017 indexes and existing indexes exist")
    void testIndexesExist() throws SQLException {
        String query = """
                SELECT indexname FROM pg_indexes
                WHERE tablename = 'notifications'
                """;
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            Set<String> indexNames = new HashSet<>();
            while (rs.next()) {
                indexNames.add(rs.getString("indexname"));
            }
            assertThat(indexNames).contains(
                    "uk_notifications_recipient_event",
                    "idx_notifications_recipient_created_at",
                    "idx_notifications_recipient_id",
                    "idx_notifications_recipient_read",
                    "idx_notifications_created_at"
            );
        }
    }

    @Test
    @Order(2)
    @DisplayName("Verify legacy notifications deterministic backfill, data preservation, and zero collisions")
    void testLegacyBackfill() throws SQLException {
        // Preflight & postflight validation: no NULL event_keys
        String nullCheckSql = "SELECT COUNT(*) FROM notifications WHERE event_key IS NULL";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(nullCheckSql)) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getLong(1)).isEqualTo(0L);
        }

        // Collision validation: zero duplicate event_keys
        String collisionSql = """
                SELECT event_key, COUNT(*) FROM notifications
                GROUP BY event_key HAVING COUNT(*) > 1
                """;
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(collisionSql)) {
            assertThat(rs.next()).isFalse();
        }

        // Verify deterministic legacy keys and full data preservation
        String checkKeySql = """
                SELECT id, recipient_id, type, title, message, reference_type, reference_id,
                       is_read, read_at, created_at, event_key
                FROM notifications WHERE id = ?
                """;
        try (PreparedStatement ps = connection.prepareStatement(checkKeySql)) {
            // Verify notification 1
            ps.setObject(1, legacyNotif1Id);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getObject("recipient_id")).isEqualTo(legacyUser1Id);
                assertThat(rs.getString("type")).isEqualTo("TASK_ASSIGNED");
                assertThat(rs.getString("title")).isEqualTo("Task Assigned 1");
                assertThat(rs.getString("message")).isEqualTo("Message 1");
                assertThat(rs.getString("reference_type")).isEqualTo("TASK");
                assertThat(rs.getObject("reference_id")).isEqualTo(legacyRefId1);
                assertThat(rs.getBoolean("is_read")).isTrue();
                assertThat(rs.getTimestamp("read_at").toInstant()).isEqualTo(legacyReadAt1);
                assertThat(rs.getTimestamp("created_at").toInstant()).isEqualTo(legacyCreated1);
                assertThat(rs.getString("event_key")).isEqualTo("LEGACY_MIGRATION:" + legacyNotif1Id);
            }

            // Verify notification 2
            ps.setObject(1, legacyNotif2Id);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getObject("recipient_id")).isEqualTo(legacyUser2Id);
                assertThat(rs.getString("type")).isEqualTo("TASK_STATUS_CHANGED");
                assertThat(rs.getString("title")).isEqualTo("Task Status 2");
                assertThat(rs.getString("message")).isEqualTo("Message 2");
                assertThat(rs.getString("reference_type")).isEqualTo("PROJECT");
                assertThat(rs.getObject("reference_id")).isEqualTo(legacyRefId2);
                assertThat(rs.getBoolean("is_read")).isFalse();
                assertThat(rs.getTimestamp("read_at")).isNull();
                assertThat(rs.getTimestamp("created_at").toInstant()).isEqualTo(legacyCreated2);
                assertThat(rs.getString("event_key")).isEqualTo("LEGACY_MIGRATION:" + legacyNotif2Id);
            }
        }
    }

    @Test
    @Order(3)
    @DisplayName("Verify duplicate (recipient_id, event_key) is blocked with unique constraint violation")
    void testDuplicateRecipientEventKeyBlocked() throws SQLException {
        UUID newNotif1Id = UUID.randomUUID();
        UUID newNotif2Id = UUID.randomUUID();
        String eventKey = "TASK_ASSIGNED:test-task:assign-1";

        insertNotificationWithKey(newNotif1Id, legacyUser1Id, "TASK_ASSIGNED", "Title 1", eventKey);

        assertThatThrownBy(() ->
                insertNotificationWithKey(newNotif2Id, legacyUser1Id, "TASK_ASSIGNED", "Title 2", eventKey)
        ).isInstanceOf(SQLException.class)
                .hasMessageContaining("uk_notifications_recipient_event");
    }

    @Test
    @Order(4)
    @DisplayName("Verify two different recipients can have the same event_key")
    void testDifferentRecipientsSameEventKeyAllowed() throws SQLException {
        UUID notifUser1 = UUID.randomUUID();
        UUID notifUser2 = UUID.randomUUID();
        String sharedEventKey = "TASK_STATUS_CHANGED:shared-task:history-1";

        insertNotificationWithKey(notifUser1, legacyUser1Id, "TASK_STATUS_CHANGED", "Title A", sharedEventKey);
        insertNotificationWithKey(notifUser2, legacyUser2Id, "TASK_STATUS_CHANGED", "Title B", sharedEventKey);

        // Both rows must exist successfully
        String query = "SELECT COUNT(*) FROM notifications WHERE event_key = ?";
        try (PreparedStatement ps = connection.prepareStatement(query)) {
            ps.setString(1, sharedEventKey);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getLong(1)).isEqualTo(2L);
            }
        }
    }

    @Test
    @Order(5)
    @DisplayName("Verify V017 transactional DDL/DML rollback preserves pre-V017 schema and data on preflight failure")
    void testV017TransactionalRollbackPreservesPreV017Data() throws SQLException {
        String dbName = "v017_rollback_db";

        // Create separate database for isolated rollback testing
        try (Statement adminStmt = connection.createStatement()) {
            adminStmt.execute("CREATE DATABASE " + dbName);
        }

        String rollbackJdbcUrl = postgres.getJdbcUrl().replace("/test", "/" + dbName);

        // Migrate to V016 in the isolated database
        Flyway flywayV16 = Flyway.configure()
                .dataSource(rollbackJdbcUrl, postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .target("016")
                .load();
        flywayV16.migrate();

        UUID rollbackUserId = UUID.randomUUID();
        UUID rollbackNotifId = UUID.randomUUID();
        UUID rollbackRefId = UUID.randomUUID();
        Instant notifCreated = Instant.parse("2026-10-12T08:00:00Z");

        try (Connection rollbackConn = DriverManager.getConnection(
                rollbackJdbcUrl, postgres.getUsername(), postgres.getPassword())) {

            // Seed user and legacy notification prior to V017
            insertUserOnConnection(rollbackConn, rollbackUserId, "rollback_user", "rollback@test.com");
            insertLegacyNotificationOnConnection(
                    rollbackConn, rollbackNotifId, rollbackUserId, "TASK_ASSIGNED",
                    "Pre-V017 Title", "Pre-V017 Message", "TASK", rollbackRefId,
                    false, null, notifCreated
            );

            // Execute V017 DDL/DML in a manual transaction and simulate failure before commit
            rollbackConn.setAutoCommit(false);
            try (Statement migrationStmt = rollbackConn.createStatement()) {
                // 1. Add nullable event_key column
                migrationStmt.execute("ALTER TABLE notifications ADD COLUMN event_key VARCHAR(255)");

                // 2. Controlled deterministic backfill
                migrationStmt.execute("UPDATE notifications SET event_key = 'LEGACY_MIGRATION:' || id::text WHERE event_key IS NULL");

                // 3. Simulate failure in preflight validation block before commit
                migrationStmt.execute("DO $$ BEGIN RAISE EXCEPTION 'Simulated preflight migration failure'; END $$");

                rollbackConn.commit();
            } catch (SQLException ex) {
                // Expected simulated error -> rollback transaction
                rollbackConn.rollback();
            }

            rollbackConn.setAutoCommit(true);

            // Verify PostgreSQL transactional DDL: event_key column does NOT exist in schema
            String checkColumnSql = """
                    SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_name = 'notifications' AND column_name = 'event_key'
                    """;
            try (Statement verifyStmt = rollbackConn.createStatement();
                 ResultSet rs = verifyStmt.executeQuery(checkColumnSql)) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getLong(1)).isEqualTo(0L); // Column rolled back!
            }

            // Verify legacy notification is preserved intact with all original values
            String verifyDataSql = """
                    SELECT id, recipient_id, type, title, message, reference_type, reference_id, is_read, read_at, created_at
                    FROM notifications WHERE id = ?
                    """;
            try (PreparedStatement ps = rollbackConn.prepareStatement(verifyDataSql)) {
                ps.setObject(1, rollbackNotifId);
                try (ResultSet rs = ps.executeQuery()) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getObject("recipient_id")).isEqualTo(rollbackUserId);
                    assertThat(rs.getString("type")).isEqualTo("TASK_ASSIGNED");
                    assertThat(rs.getString("title")).isEqualTo("Pre-V017 Title");
                    assertThat(rs.getString("message")).isEqualTo("Pre-V017 Message");
                    assertThat(rs.getString("reference_type")).isEqualTo("TASK");
                    assertThat(rs.getObject("reference_id")).isEqualTo(rollbackRefId);
                    assertThat(rs.getBoolean("is_read")).isFalse();
                    assertThat(rs.getTimestamp("read_at")).isNull();
                    assertThat(rs.getTimestamp("created_at").toInstant()).isEqualTo(notifCreated);
                }
            }
        }
    }

    private static void insertUser(UUID userId, String username, String email) throws SQLException {
        insertUserOnConnection(connection, userId, username, email);
    }

    private static void insertUserOnConnection(Connection conn, UUID userId, String username, String email) throws SQLException {
        String sql = """
                INSERT INTO users (id, username, password_hash, full_name, email, status, created_at, updated_at)
                VALUES (?, ?, 'hash', 'User ' || ?, ?, 'ACTIVE', NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
                """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, userId);
            ps.setString(2, username);
            ps.setString(3, username);
            ps.setString(4, email);
            ps.executeUpdate();
        }
    }

    private static void insertLegacyNotification(
            UUID id, UUID recipientId, String type, String title,
            String message, String refType, UUID refId, boolean isRead, Instant readAt, Instant createdAt
    ) throws SQLException {
        insertLegacyNotificationOnConnection(connection, id, recipientId, type, title, message, refType, refId, isRead, readAt, createdAt);
    }

    private static void insertLegacyNotificationOnConnection(
            Connection conn, UUID id, UUID recipientId, String type, String title,
            String message, String refType, UUID refId, boolean isRead, Instant readAt, Instant createdAt
    ) throws SQLException {
        String sql = """
                INSERT INTO notifications (id, recipient_id, type, title, message, reference_type, reference_id, is_read, read_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            ps.setObject(2, recipientId);
            ps.setString(3, type);
            ps.setString(4, title);
            ps.setString(5, message);
            ps.setString(6, refType);
            ps.setObject(7, refId);
            ps.setBoolean(8, isRead);
            ps.setTimestamp(9, readAt != null ? Timestamp.from(readAt) : null);
            ps.setTimestamp(10, Timestamp.from(createdAt));
            ps.executeUpdate();
        }
    }

    private static void insertNotificationWithKey(UUID id, UUID recipientId, String type, String title, String eventKey) throws SQLException {
        String sql = """
                INSERT INTO notifications (id, recipient_id, type, title, message, event_key, is_read, created_at)
                VALUES (?, ?, ?, ?, 'Message', ?, FALSE, NOW())
                """;
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setObject(1, id);
            ps.setObject(2, recipientId);
            ps.setString(3, type);
            ps.setString(4, title);
            ps.setString(5, eventKey);
            ps.executeUpdate();
        }
    }
}
