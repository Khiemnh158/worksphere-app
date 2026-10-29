package com.worksphere.task.infrastructure;

import org.flywaydb.core.api.MigrationVersion;
import org.springframework.boot.flyway.autoconfigure.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Customizes Flyway migration targets based on database vendor.
 * Ensures PostgreSQL partial unique indexes in V012 are executed on PostgreSQL
 * while in-memory H2 context tests target V011 to prevent H2 parser syntax incompatibility.
 */
@Configuration
public class TaskFlywayConfiguration {

    @Bean
    public FlywayConfigurationCustomizer taskFlywayCustomizer(DataSource dataSource) {
        return configuration -> {
            try (Connection conn = dataSource.getConnection()) {
                String dbName = conn.getMetaData().getDatabaseProductName();
                if ("H2".equalsIgnoreCase(dbName)) {
                    configuration.target(MigrationVersion.fromVersion("011"));
                }
            } catch (SQLException ignored) {
                // Ignore and proceed with default target
            }
        };
    }
}
