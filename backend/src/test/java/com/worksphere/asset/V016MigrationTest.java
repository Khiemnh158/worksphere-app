package com.worksphere.asset;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers
class V016MigrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    private static Connection connection;

    @BeforeAll
    static void setUp() throws SQLException {
        Flyway flyway = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .target("016")
                .load();
        flyway.migrate();

        connection = DriverManager.getConnection(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()
        );
    }

    @AfterAll
    static void tearDown() throws SQLException {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    @Test
    @Order(1)
    @DisplayName("Verify V016 indexes exist in pg_indexes")
    void testV016IndexesExist() throws SQLException {
        String query = """
                SELECT indexname FROM pg_indexes
                WHERE tablename IN ('asset_assignments', 'asset_categories')
                """;
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            java.util.Set<String> indexNames = new java.util.HashSet<>();
            while (rs.next()) {
                indexNames.add(rs.getString("indexname"));
            }
            assertThat(indexNames).contains(
                    "uk_asset_assignments_one_active",
                    "uk_asset_categories_code",
                    "idx_asset_assignments_assigned_to",
                    "idx_asset_assignments_asset_id"
            );
        }
    }

    @Test
    @Order(2)
    @DisplayName("Verify partial unique index blocks two ACTIVE assignments for the same asset")
    void testActiveAssignmentUniqueness() throws SQLException {
        UUID categoryId = UUID.randomUUID();
        UUID assetId = UUID.randomUUID();
        UUID user1Id = UUID.randomUUID();
        UUID user2Id = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();

        insertCategory(categoryId, "LAPTOP_V016", "Laptop Category");
        insertAsset(assetId, "LAP-V016-01", categoryId, "Laptop 01", adminId);
        insertUser(user1Id, "user1_v016", "user1_v016@test.com");
        insertUser(user2Id, "user2_v016", "user2_v016@test.com");
        insertUser(adminId, "admin_v016", "admin_v016@test.com");

        UUID assignment1Id = UUID.randomUUID();
        insertAssignment(assignment1Id, assetId, user1Id, adminId, "ACTIVE");

        UUID assignment2Id = UUID.randomUUID();
        assertThatThrownBy(() -> insertAssignment(assignment2Id, assetId, user2Id, adminId, "ACTIVE"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("uk_asset_assignments_one_active");

        // Allowed to have inactive/returned history
        UUID assignment3Id = UUID.randomUUID();
        insertAssignment(assignment3Id, assetId, user2Id, adminId, "RETURNED");
    }

    @Test
    @Order(3)
    @DisplayName("Verify unique index blocks duplicate asset category code")
    void testCategoryCodeUniqueness() throws SQLException {
        UUID cat1 = UUID.randomUUID();
        UUID cat2 = UUID.randomUUID();

        insertCategory(cat1, "MONITOR_V016", "Monitor Category");

        assertThatThrownBy(() -> insertCategory(cat2, "MONITOR_V016", "Duplicate Monitor"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("uk_asset_categories_code");
    }

    @Test
    @Order(4)
    @DisplayName("Verify check constraint blocks unnormalized category code")
    void testCategoryCodeNormalizationCheck() {
        UUID cat = UUID.randomUUID();

        // Lowercase code
        assertThatThrownBy(() -> insertCategory(cat, "lowercase_code", "Invalid"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("chk_asset_categories_code_normalized");

        // Untrimmed code
        assertThatThrownBy(() -> insertCategory(cat, " CODE ", "Untrimmed"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("chk_asset_categories_code_normalized");
    }

    @Test
    @Order(5)
    @DisplayName("Verify check constraint blocks unnormalized asset code")
    void testAssetCodeNormalizationCheck() throws SQLException {
        UUID cat = UUID.randomUUID();
        UUID assetId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        insertCategory(cat, "DESKTOP_V016", "Desktop");
        insertUser(adminId, "admin_code_test", "admin_code@test.com");

        // Lowercase code
        assertThatThrownBy(() -> insertAsset(assetId, "lap-001", cat, "Invalid", adminId))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("chk_assets_asset_code_normalized");

        // Untrimmed code
        assertThatThrownBy(() -> insertAsset(assetId, " LAP-001 ", cat, "Invalid", adminId))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("chk_assets_asset_code_normalized");
    }

    @Test
    @Order(6)
    @DisplayName("Verify preflight NO-GO scenario: duplicate active assignment fails V016 migration")
    void testPreflightNoGoScenario() throws Exception {
        try (PostgreSQLContainer<?> freshPostgres = new PostgreSQLContainer<>("postgres:15-alpine")) {
            freshPostgres.start();

            Flyway flywayV15 = Flyway.configure()
                    .dataSource(freshPostgres.getJdbcUrl(), freshPostgres.getUsername(), freshPostgres.getPassword())
                    .locations("classpath:db/migration")
                    .target("015")
                    .load();
            flywayV15.migrate();

            try (Connection conn = DriverManager.getConnection(
                    freshPostgres.getJdbcUrl(), freshPostgres.getUsername(), freshPostgres.getPassword())) {
                UUID catId = UUID.randomUUID();
                UUID assetId = UUID.randomUUID();
                UUID adminId = UUID.randomUUID();
                UUID u1 = UUID.randomUUID();
                UUID u2 = UUID.randomUUID();

                try (Statement stmt = conn.createStatement()) {
                    stmt.executeUpdate(String.format(
                            "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at) " +
                            "VALUES ('%s', 'adm', 'adm@t.com', 'h', 'A', 'ACTIVE', false, now(), now())", adminId));
                    stmt.executeUpdate(String.format(
                            "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at) " +
                            "VALUES ('%s', 'u1', 'u1@t.com', 'h', 'U1', 'ACTIVE', false, now(), now())", u1));
                    stmt.executeUpdate(String.format(
                            "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at) " +
                            "VALUES ('%s', 'u2', 'u2@t.com', 'h', 'U2', 'ACTIVE', false, now(), now())", u2));
                    stmt.executeUpdate(String.format(
                            "INSERT INTO asset_categories (id, code, name, is_active, is_deleted, created_at, updated_at) " +
                            "VALUES ('%s', 'SRV', 'Server', true, false, now(), now())", catId));
                    stmt.executeUpdate(String.format(
                            "INSERT INTO assets (id, asset_code, category_id, name, status, is_deleted, created_by, created_at, updated_at) " +
                            "VALUES ('%s', 'SRV-01', '%s', 'Server 01', 'ASSIGNED', false, '%s', now(), now())",
                            assetId, catId, adminId));

                    // Seed duplicate ACTIVE assignments (violating V016 invariant before migration)
                    stmt.executeUpdate(String.format(
                            "INSERT INTO asset_assignments (id, asset_id, assigned_to, assigned_by, assigned_at, status, created_at, updated_at) " +
                            "VALUES ('%s', '%s', '%s', '%s', now(), 'ACTIVE', now(), now())",
                            UUID.randomUUID(), assetId, u1, adminId));
                    stmt.executeUpdate(String.format(
                            "INSERT INTO asset_assignments (id, asset_id, assigned_to, assigned_by, assigned_at, status, created_at, updated_at) " +
                            "VALUES ('%s', '%s', '%s', '%s', now(), 'ACTIVE', now(), now())",
                            UUID.randomUUID(), assetId, u2, adminId));
                }

                // Now migrating to V016 must fail with duplicate key violation
                Flyway flywayV16 = Flyway.configure()
                        .dataSource(freshPostgres.getJdbcUrl(), freshPostgres.getUsername(), freshPostgres.getPassword())
                        .locations("classpath:db/migration")
                        .target("016")
                        .load();

                assertThatThrownBy(flywayV16::migrate)
                        .hasMessageContaining("uk_asset_assignments_one_active");

                // Verify data is preserved after rollback
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery(
                             "SELECT COUNT(*) FROM asset_assignments WHERE status = 'ACTIVE'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).isEqualTo(2);
                }
            }
        }
    }

    @Test
    @Order(7)
    @DisplayName("Verify clean V001 to V016 migration succeeds on fresh database")
    void testCleanV001ToV016Migration() {
        try (PostgreSQLContainer<?> freshPostgres = new PostgreSQLContainer<>("postgres:15-alpine")) {
            freshPostgres.start();
            Flyway flyway = Flyway.configure()
                    .dataSource(freshPostgres.getJdbcUrl(), freshPostgres.getUsername(), freshPostgres.getPassword())
                    .locations("classpath:db/migration")
                    .target("016")
                    .load();
            var result = flyway.migrate();
            assertThat(result.success).isTrue();
            assertThat(result.targetSchemaVersion).isEqualTo("016");
        }
    }

    @Test
    @Order(8)
    @DisplayName("Verify preflight NO-GO scenario: duplicate category code fails V016 migration and preserves data")
    void testPreflightCategoryDuplicateFailsV016() throws Exception {
        try (PostgreSQLContainer<?> freshPostgres = new PostgreSQLContainer<>("postgres:15-alpine")) {
            freshPostgres.start();

            Flyway flywayV15 = Flyway.configure()
                    .dataSource(freshPostgres.getJdbcUrl(), freshPostgres.getUsername(), freshPostgres.getPassword())
                    .locations("classpath:db/migration")
                    .target("015")
                    .load();
            flywayV15.migrate();

            try (Connection conn = DriverManager.getConnection(
                    freshPostgres.getJdbcUrl(), freshPostgres.getUsername(), freshPostgres.getPassword())) {
                try (Statement stmt = conn.createStatement()) {
                    stmt.executeUpdate(
                            "INSERT INTO asset_categories (id, code, name, is_active, is_deleted, created_at, updated_at) " +
                            "VALUES ('" + UUID.randomUUID() + "', 'DUP_CAT', 'Cat 1', true, false, now(), now())");
                    stmt.executeUpdate(
                            "INSERT INTO asset_categories (id, code, name, is_active, is_deleted, created_at, updated_at) " +
                            "VALUES ('" + UUID.randomUUID() + "', 'DUP_CAT', 'Cat 2', true, false, now(), now())");
                }

                Flyway flywayV16 = Flyway.configure()
                        .dataSource(freshPostgres.getJdbcUrl(), freshPostgres.getUsername(), freshPostgres.getPassword())
                        .locations("classpath:db/migration")
                        .target("016")
                        .load();

                assertThatThrownBy(flywayV16::migrate)
                        .hasMessageContaining("uk_asset_categories_code");

                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM asset_categories WHERE code = 'DUP_CAT'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).isEqualTo(2);
                }
            }
        }
    }

    private void insertUser(UUID id, String username, String email) throws SQLException {
        String sql = """
                INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at)
                VALUES (?, ?, ?, 'dummy_hash', 'User Full Name', 'ACTIVE', false, now(), now())
                ON CONFLICT (id) DO NOTHING
                """;
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setObject(1, id);
            ps.setString(2, username);
            ps.setString(3, email);
            ps.executeUpdate();
        }
    }

    private void insertCategory(UUID id, String code, String name) throws SQLException {
        String sql = """
                INSERT INTO asset_categories (id, code, name, is_active, is_deleted, created_at, updated_at)
                VALUES (?, ?, ?, true, false, now(), now())
                """;
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setObject(1, id);
            ps.setString(2, code);
            ps.setString(3, name);
            ps.executeUpdate();
        }
    }

    private void insertAsset(UUID id, String code, UUID categoryId, String name, UUID adminId) throws SQLException {
        String sql = """
                INSERT INTO assets (id, asset_code, category_id, name, status, is_deleted, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'AVAILABLE', false, ?, now(), now())
                """;
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setObject(1, id);
            ps.setString(2, code);
            ps.setObject(3, categoryId);
            ps.setString(4, name);
            ps.setObject(5, adminId);
            ps.executeUpdate();
        }
    }

    private void insertAssignment(UUID id, UUID assetId, UUID userId, UUID adminId, String status) throws SQLException {
        String sql = """
                INSERT INTO asset_assignments (id, asset_id, assigned_to, assigned_by, assigned_at, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, now(), ?, now(), now())
                """;
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setObject(1, id);
            ps.setObject(2, assetId);
            ps.setObject(3, userId);
            ps.setObject(4, adminId);
            ps.setString(5, status);
            ps.executeUpdate();
        }
    }
}
