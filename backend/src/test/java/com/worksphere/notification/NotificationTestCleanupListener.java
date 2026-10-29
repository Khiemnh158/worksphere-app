package com.worksphere.notification;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.TestContext;
import org.springframework.test.context.support.AbstractTestExecutionListener;

/**
 * Hardened TestExecutionListener that cleans up notification and preference tables.
 * Safely inspects table existence via PostgreSQL to_regclass (or JDBC metadata on non-Postgres) before deletion.
 * Only deletes from notifications and notification_preferences.
 */
public class NotificationTestCleanupListener extends AbstractTestExecutionListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationTestCleanupListener.class);

    @Override
    public int getOrder() {
        return Integer.MIN_VALUE + 50;
    }

    @Override
    public void beforeTestMethod(TestContext testContext) {
        cleanup(testContext);
    }

    @Override
    public void afterTestMethod(TestContext testContext) {
        cleanup(testContext);
    }

    private void cleanup(TestContext testContext) {
        if (!testContext.hasApplicationContext()) {
            return;
        }
        if (!testContext.getApplicationContext().containsBean("dataSource")) {
            return;
        }

        DataSource ds = testContext.getApplicationContext().getBean(DataSource.class);
        Connection conn;
        try {
            conn = ds.getConnection();
        } catch (SQLException ex) {
            log.debug("Database not reachable in test slice, skipping cleanup: {}", ex.getMessage());
            return;
        }

        try (conn; Statement stmt = conn.createStatement()) {
            DatabaseMetaData meta = conn.getMetaData();
            String dbProduct = meta.getDatabaseProductName() != null ? meta.getDatabaseProductName().toLowerCase() : "";

            boolean notifExists = false;
            boolean prefExists = false;

            if (dbProduct.contains("postgres")) {
                try (ResultSet rs = stmt.executeQuery(
                        "SELECT to_regclass('public.notifications'), to_regclass('public.notification_preferences')")) {
                    if (rs.next()) {
                        notifExists = rs.getObject(1) != null;
                        prefExists = rs.getObject(2) != null;
                    }
                }
            } else {
                try (ResultSet rs = meta.getTables(null, null, "%", new String[]{"TABLE"})) {
                    while (rs.next()) {
                        String tableName = rs.getString("TABLE_NAME");
                        if ("notifications".equalsIgnoreCase(tableName)) {
                            notifExists = true;
                        } else if ("notification_preferences".equalsIgnoreCase(tableName)) {
                            prefExists = true;
                        }
                    }
                }
            }

            if (notifExists) {
                stmt.executeUpdate("DELETE FROM notifications");
            }
            if (prefExists) {
                stmt.executeUpdate("DELETE FROM notification_preferences");
            }
        } catch (SQLException ex) {
            log.error("Failed to clean up notification test tables: {}", ex.getMessage(), ex);
            throw new RuntimeException("NotificationTestCleanupListener cleanup failed", ex);
        }
    }
}
