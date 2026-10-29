package com.worksphere.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.notification.api.request.UpdateNotificationPreferenceItemRequest;
import com.worksphere.notification.api.request.UpdateNotificationPreferencesRequest;
import com.worksphere.notification.domain.NotificationType;
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

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class NotificationPreferenceMockMvcTest {

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

    @Autowired(required = false)
    private ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;

    private UUID user1Id;
    private UUID user2Id;
    private String user1Token;
    private String user2Token;

    @BeforeEach
    void setUp() {
        OpenEntityManagerInViewFilter osivFilter = new OpenEntityManagerInViewFilter();
        osivFilter.setServletContext(context.getServletContext());
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilter(osivFilter)
                .apply(springSecurity())
                .build();

        user1Id = UUID.randomUUID();
        user2Id = UUID.randomUUID();

        createTestUser(user1Id, "pref_user1", "pref_user1@test.com", "EMPLOYEE");
        createTestUser(user2Id, "pref_user2", "pref_user2@test.com", "EMPLOYEE");

        user1Token = jwtService.generateAccessToken(user1Id, UUID.randomUUID());
        user2Token = jwtService.generateAccessToken(user2Id, UUID.randomUUID());
    }

    @Test
    @DisplayName("GET /api/v1/notification-preferences: Returns all 8 canonical types with defaults")
    void testGetPreferencesDefaults() throws Exception {
        mockMvc.perform(get("/api/v1/notification-preferences")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.preferences", hasSize(8)))
                .andExpect(jsonPath("$.data.preferences[?(@.notificationType == 'TASK_ASSIGNED')].inAppEnabled").value(true))
                .andExpect(jsonPath("$.data.preferences[?(@.notificationType == 'TASK_ASSIGNED')].pushEnabled").value(true))
                .andExpect(jsonPath("$.data.preferences[?(@.notificationType == 'TASK_ASSIGNED')].emailEnabled").value(false));
    }

    @Test
    @DisplayName("PUT /api/v1/notification-preferences: Update preferences with user isolation")
    void testUpdatePreferences() throws Exception {
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest(List.of(
                new UpdateNotificationPreferenceItemRequest("TASK_ASSIGNED", false, true, true),
                new UpdateNotificationPreferenceItemRequest("TASK_DUE_SOON", true, false, false)
        ));

        mockMvc.perform(put("/api/v1/notification-preferences")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // User 1 gets updated preferences
        mockMvc.perform(get("/api/v1/notification-preferences")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.preferences[?(@.notificationType == 'TASK_ASSIGNED')].inAppEnabled").value(false))
                .andExpect(jsonPath("$.data.preferences[?(@.notificationType == 'TASK_ASSIGNED')].emailEnabled").value(true));

        // User 2 retains defaults (user isolation)
        mockMvc.perform(get("/api/v1/notification-preferences")
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.preferences[?(@.notificationType == 'TASK_ASSIGNED')].inAppEnabled").value(true));
    }

    @Test
    @DisplayName("PUT /api/v1/notification-preferences: Invalid type returns 400 NOTIFICATION_TYPE_INVALID")
    void testInvalidTypeReturns400() throws Exception {
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest(List.of(
                new UpdateNotificationPreferenceItemRequest("INVALID_NOTIF_TYPE", true, true, false)
        ));

        mockMvc.perform(put("/api/v1/notification-preferences")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("NOTIFICATION_TYPE_INVALID"));
    }

    @Test
    @DisplayName("PUT /api/v1/notification-preferences: Duplicate type returns 400 NOTIFICATION_PREFERENCE_DUPLICATE_TYPE")
    void testDuplicateTypeReturns400() throws Exception {
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest(List.of(
                new UpdateNotificationPreferenceItemRequest("TASK_ASSIGNED", true, true, false),
                new UpdateNotificationPreferenceItemRequest("TASK_ASSIGNED", false, false, false)
        ));

        mockMvc.perform(put("/api/v1/notification-preferences")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("NOTIFICATION_PREFERENCE_DUPLICATE_TYPE"));
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
}
