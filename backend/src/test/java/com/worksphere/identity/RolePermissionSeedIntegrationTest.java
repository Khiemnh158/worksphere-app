package com.worksphere.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.api.request.LoginRequest;
import com.worksphere.identity.infrastructure.persistence.LoginSessionRepository;
import com.worksphere.identity.infrastructure.persistence.RefreshTokenRepository;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Clean integration tests validating V013, V014, and V015 migrations and canonical role permissions.
 * Tests run against clean PostgreSQL Testcontainers.
 * Absolutely NO manual insertion into role_permissions in this test.
 */
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@Import(RolePermissionSeedIntegrationTest.TestSecurityEndpointConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class RolePermissionSeedIntegrationTest {

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

    @TestConfiguration
    static class TestSecurityEndpointConfig {
        @RestController
        @RequestMapping("/api/v1/test-auth")
        static class TestSecurityController {
            @PostMapping("/service-request-assign")
            @PreAuthorize("hasAuthority('SERVICE_REQUEST_ASSIGN')")
            public ResponseEntity<Map<String, String>> checkServiceRequestAssign() {
                return ResponseEntity.ok(Collections.singletonMap("status", "ALLOWED"));
            }
        }
    }

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired(required = false)
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoginSessionRepository loginSessionRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UUID adminUserId;
    private UUID pmUserId;
    private UUID leaderUserId;
    private UUID employeeUserId;

    private String adminToken;
    private String pmToken;
    private String leaderToken;
    private String employeeToken;

    @BeforeEach
    void setUp() throws Exception {
        if (objectMapper == null) {
            objectMapper = new ObjectMapper().findAndRegisterModules();
        }

        OpenEntityManagerInViewFilter osivFilter = new OpenEntityManagerInViewFilter();
        osivFilter.setServletContext(context.getServletContext());

        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(osivFilter)
                .apply(springSecurity())
                .build();

        loginSessionRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        jdbcTemplate.update("DELETE FROM milestones");
        jdbcTemplate.update("DELETE FROM project_members");
        jdbcTemplate.update("DELETE FROM projects");
        jdbcTemplate.update("DELETE FROM user_roles");
        userRepository.deleteAll();

        String rawPassword = "Password123!";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        // 1. Create ADMIN user
        adminUserId = UUID.randomUUID();
        insertUser(adminUserId, "admin_seed", "admin_seed@test.com", encodedPassword);
        assignRole(adminUserId, "ADMIN");
        adminToken = loginAndGetToken("admin_seed", rawPassword);

        // 2. Create PROJECT_MANAGER user
        pmUserId = UUID.randomUUID();
        insertUser(pmUserId, "pm_seed", "pm_seed@test.com", encodedPassword);
        assignRole(pmUserId, "PROJECT_MANAGER");
        pmToken = loginAndGetToken("pm_seed", rawPassword);

        // 3. Create TEAM_LEADER user
        leaderUserId = UUID.randomUUID();
        insertUser(leaderUserId, "leader_seed", "leader_seed@test.com", encodedPassword);
        assignRole(leaderUserId, "TEAM_LEADER");
        leaderToken = loginAndGetToken("leader_seed", rawPassword);

        // 4. Create EMPLOYEE user
        employeeUserId = UUID.randomUUID();
        insertUser(employeeUserId, "emp_seed", "emp_seed@test.com", encodedPassword);
        assignRole(employeeUserId, "EMPLOYEE");
        employeeToken = loginAndGetToken("emp_seed", rawPassword);
    }

    private void insertUser(UUID id, String username, String email, String passwordHash) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) "
                        + "VALUES (?, ?, ?, ?, ?, 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordHash, username + " Full Name"
        );
    }

    private void assignRole(UUID userId, String roleCode) {
        UUID roleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = ?", UUID.class, roleCode);
        assertThat(roleId).isNotNull();
        jdbcTemplate.update(
                "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                userId, roleId
        );
    }

    private String loginAndGetToken(String username, String password) throws Exception {
        LoginRequest req = new LoginRequest(username, password, "TestDevice");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("data").get("accessToken").asText();
    }

    // =========================================================================
    // 1. DATABASE SEED AND INVARIANT VALIDATION
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("V013 migration: uk_service_assignments_one_active partial unique index must exist")
    void v013_shouldHaveActiveServiceAssignmentUniqueIndex() {
        Integer indexCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'service_assignments' "
                        + "AND indexname = 'uk_service_assignments_one_active'",
                Integer.class
        );
        assertThat(indexCount).isEqualTo(1);
    }

    @Test
    @Order(2)
    @DisplayName("V015 migration: roles, permissions, and role_permissions exact counts")
    void v015_shouldHaveExactCanonicalCounts() {
        Integer roleCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM roles", Integer.class);
        Integer permissionCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM permissions", Integer.class);
        Integer mappingCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM role_permissions", Integer.class);

        assertThat(roleCount).isEqualTo(4);
        assertThat(permissionCount).isEqualTo(29);
        // ADMIN(29) + PM(19) + LEADER(15) + EMP(13) = 76
        assertThat(mappingCount).isEqualTo(76);

        Integer adminPermissions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.code = 'ADMIN'",
                Integer.class);
        Integer pmPermissions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.code = 'PROJECT_MANAGER'",
                Integer.class);
        Integer leaderPermissions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.code = 'TEAM_LEADER'",
                Integer.class);
        Integer empPermissions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.code = 'EMPLOYEE'",
                Integer.class);

        assertThat(adminPermissions).isEqualTo(29);
        assertThat(pmPermissions).isEqualTo(19);
        assertThat(leaderPermissions).isEqualTo(15);
        assertThat(empPermissions).isEqualTo(13);
    }

    // =========================================================================
    // 2. ADMIN AUTHENTICATION AND AUTHORIZATION
    // =========================================================================

    @Test
    @Order(3)
    @DisplayName("ADMIN: Can access identity admin and project/task protected endpoints")
    void admin_shouldAccessIdentityAndProjectsAndTasks() throws Exception {
        // Identity admin endpoint (@PreAuthorize("hasAuthority('USER_READ')"))
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Project read endpoint (@PreAuthorize("hasAuthority('PROJECT_READ')"))
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Task read endpoint (@PreAuthorize("hasAuthority('TASK_READ')"))
        mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Service request assign endpoint (@PreAuthorize("hasAuthority('SERVICE_REQUEST_ASSIGN')"))
        mockMvc.perform(post("/api/v1/test-auth/service-request-assign")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ALLOWED"));
    }

    // =========================================================================
    // 3. EMPLOYEE AUTHENTICATION AND AUTHORIZATION
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("EMPLOYEE: Allowed self-service profile, task read, and project read; forbidden from admin endpoints")
    void employee_shouldAccessSelfServiceAndProjects_andBeForbiddenFromAdmin() throws Exception {
        // Self-service profile endpoint
        mockMvc.perform(get("/api/v1/me")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Task read endpoint (@PreAuthorize("hasAuthority('TASK_READ')"))
        mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Project read endpoint (@PreAuthorize("hasAuthority('PROJECT_READ')")) - allowed per V015
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Forbidden on admin identity endpoint (@PreAuthorize("hasAuthority('USER_READ')"))
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Forbidden on project create endpoint (@PreAuthorize("hasAuthority('PROJECT_CREATE')"))
        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"PRJ-E\",\"name\":\"Project E\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Forbidden on SERVICE_REQUEST_ASSIGN
        mockMvc.perform(post("/api/v1/test-auth/service-request-assign")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    // =========================================================================
    // 4. TEAM_LEADER AUTHENTICATION AND AUTHORIZATION
    // =========================================================================

    @Test
    @Order(5)
    @DisplayName("TEAM_LEADER: Has task and project read; forbidden from admin users and SERVICE_REQUEST_ASSIGN")
    void teamLeader_shouldHaveTaskAndProjectPermissions_andBeForbiddenFromServiceRequestAssign() throws Exception {
        // Task read endpoint (@PreAuthorize("hasAuthority('TASK_READ')"))
        mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Project read endpoint (@PreAuthorize("hasAuthority('PROJECT_READ')")) - allowed per V015
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Forbidden on admin identity endpoint (@PreAuthorize("hasAuthority('USER_READ')"))
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Forbidden on project create endpoint (@PreAuthorize("hasAuthority('PROJECT_CREATE')"))
        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + leaderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"PRJ-L\",\"name\":\"Project L\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Forbidden on SERVICE_REQUEST_ASSIGN
        mockMvc.perform(post("/api/v1/test-auth/service-request-assign")
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    // =========================================================================
    // 5. PROJECT_MANAGER AUTHENTICATION AND AUTHORIZATION
    // =========================================================================

    @Test
    @Order(6)
    @DisplayName("PROJECT_MANAGER: Has project read, forbidden from admin users and SERVICE_REQUEST_ASSIGN")
    void projectManager_shouldHaveProjectPermissions_andBeForbiddenFromServiceRequestAssign() throws Exception {
        // Project read endpoint (@PreAuthorize("hasAuthority('PROJECT_READ')"))
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Task read endpoint (@PreAuthorize("hasAuthority('TASK_READ')"))
        mockMvc.perform(get("/api/v1/tasks")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Forbidden on admin identity endpoint (@PreAuthorize("hasAuthority('USER_READ')"))
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Forbidden on SERVICE_REQUEST_ASSIGN
        mockMvc.perform(post("/api/v1/test-auth/service-request-assign")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    // =========================================================================
    // 6. CANONICAL MATRIX SPECIFIC ASSERTIONS
    // =========================================================================

    @Test
    @Order(7)
    @DisplayName("Verify specific permissions in database match canonical expectations exactly")
    void databaseMappings_shouldMatchCanonicalMatrix() {
        List<String> adminCodes = jdbcTemplate.queryForList(
                "SELECT p.code FROM role_permissions rp "
                        + "JOIN roles r ON r.id = rp.role_id "
                        + "JOIN permissions p ON p.id = rp.permission_id "
                        + "WHERE r.code = 'ADMIN' ORDER BY p.code",
                String.class
        );
        assertThat(adminCodes).hasSize(29);
        assertThat(adminCodes).contains("SERVICE_REQUEST_ASSIGN", "SERVICE_CATEGORY_MANAGE", "USER_MANAGE", "PROJECT_READ");

        List<String> leaderCodes = jdbcTemplate.queryForList(
                "SELECT p.code FROM role_permissions rp "
                        + "JOIN roles r ON r.id = rp.role_id "
                        + "JOIN permissions p ON p.id = rp.permission_id "
                        + "WHERE r.code = 'TEAM_LEADER' ORDER BY p.code",
                String.class
        );
        assertThat(leaderCodes).hasSize(15);
        assertThat(leaderCodes).contains("PROJECT_READ", "TASK_CREATE", "TASK_ASSIGN", "TASK_UPDATE_STATUS");
        assertThat(leaderCodes).doesNotContain("SERVICE_REQUEST_ASSIGN", "PROJECT_CREATE", "USER_READ");

        List<String> pmCodes = jdbcTemplate.queryForList(
                "SELECT p.code FROM role_permissions rp "
                        + "JOIN roles r ON r.id = rp.role_id "
                        + "JOIN permissions p ON p.id = rp.permission_id "
                        + "WHERE r.code = 'PROJECT_MANAGER' ORDER BY p.code",
                String.class
        );
        assertThat(pmCodes).hasSize(19);
        assertThat(pmCodes).contains("PROJECT_READ", "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_MEMBER_MANAGE", "TASK_DELETE");
        assertThat(pmCodes).doesNotContain("SERVICE_REQUEST_ASSIGN", "SERVICE_CATEGORY_MANAGE", "USER_READ");

        List<String> empCodes = jdbcTemplate.queryForList(
                "SELECT p.code FROM role_permissions rp "
                        + "JOIN roles r ON r.id = rp.role_id "
                        + "JOIN permissions p ON p.id = rp.permission_id "
                        + "WHERE r.code = 'EMPLOYEE' ORDER BY p.code",
                String.class
        );
        assertThat(empCodes).hasSize(13);
        assertThat(empCodes).contains("PROJECT_READ", "PROFILE_READ", "PROFILE_UPDATE", "TASK_READ", "TASK_UPDATE",
                "TASK_UPDATE_STATUS", "SERVICE_REQUEST_READ", "SERVICE_REQUEST_CREATE", "SERVICE_REQUEST_UPDATE",
                "SERVICE_REQUEST_UPDATE_STATUS", "ASSET_READ", "NOTIFICATION_READ", "NOTIFICATION_UPDATE");
        assertThat(empCodes).doesNotContain("TASK_CREATE", "TASK_ASSIGN", "TASK_DELETE", "PROJECT_CREATE",
                "SERVICE_REQUEST_ASSIGN", "USER_READ");
    }

    // =========================================================================
    // 7. EXACT MATRIX SET DIFFERENCE VALIDATION (EXPECTED EXCEPT ACTUAL = empty)
    // =========================================================================

    @Test
    @Order(8)
    @DisplayName("Exact set comparison: EXPECTED EXCEPT ACTUAL = empty and ACTUAL EXCEPT EXPECTED = empty")
    void databaseMappings_exactSetComparison() {
        Set<String> expectedAdmin = new HashSet<>(jdbcTemplate.queryForList(
                "SELECT code FROM permissions", String.class));
        assertThat(expectedAdmin).hasSize(29);

        Set<String> expectedPm = Set.of(
                "PROFILE_READ", "PROFILE_UPDATE",
                "PROJECT_READ", "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_MEMBER_MANAGE",
                "TASK_READ", "TASK_CREATE", "TASK_UPDATE", "TASK_DELETE", "TASK_ASSIGN", "TASK_UPDATE_STATUS",
                "SERVICE_REQUEST_READ", "SERVICE_REQUEST_CREATE", "SERVICE_REQUEST_UPDATE", "SERVICE_REQUEST_UPDATE_STATUS",
                "ASSET_READ", "NOTIFICATION_READ", "NOTIFICATION_UPDATE"
        );
        assertThat(expectedPm).hasSize(19);

        Set<String> expectedLeader = Set.of(
                "PROFILE_READ", "PROFILE_UPDATE",
                "PROJECT_READ",
                "TASK_READ", "TASK_CREATE", "TASK_UPDATE", "TASK_ASSIGN", "TASK_UPDATE_STATUS",
                "SERVICE_REQUEST_READ", "SERVICE_REQUEST_CREATE", "SERVICE_REQUEST_UPDATE", "SERVICE_REQUEST_UPDATE_STATUS",
                "ASSET_READ", "NOTIFICATION_READ", "NOTIFICATION_UPDATE"
        );
        assertThat(expectedLeader).hasSize(15);

        Set<String> expectedEmp = Set.of(
                "PROFILE_READ", "PROFILE_UPDATE",
                "PROJECT_READ",
                "TASK_READ", "TASK_UPDATE", "TASK_UPDATE_STATUS",
                "SERVICE_REQUEST_READ", "SERVICE_REQUEST_CREATE", "SERVICE_REQUEST_UPDATE", "SERVICE_REQUEST_UPDATE_STATUS",
                "ASSET_READ", "NOTIFICATION_READ", "NOTIFICATION_UPDATE"
        );
        assertThat(expectedEmp).hasSize(13);

        verifyRoleExactSet("ADMIN", expectedAdmin);
        verifyRoleExactSet("PROJECT_MANAGER", expectedPm);
        verifyRoleExactSet("TEAM_LEADER", expectedLeader);
        verifyRoleExactSet("EMPLOYEE", expectedEmp);
    }

    private void verifyRoleExactSet(String roleCode, Set<String> expectedCodes) {
        Set<String> actualCodes = new HashSet<>(jdbcTemplate.queryForList(
                "SELECT p.code FROM role_permissions rp "
                        + "JOIN roles r ON r.id = rp.role_id "
                        + "JOIN permissions p ON p.id = rp.permission_id "
                        + "WHERE r.code = ?",
                String.class,
                roleCode
        ));

        // EXPECTED EXCEPT ACTUAL
        Set<String> missingInActual = new HashSet<>(expectedCodes);
        missingInActual.removeAll(actualCodes);
        assertThat(missingInActual).as("Permissions expected for %s but missing in database", roleCode).isEmpty();

        // ACTUAL EXCEPT EXPECTED
        Set<String> unexpectedInActual = new HashSet<>(actualCodes);
        unexpectedInActual.removeAll(expectedCodes);
        assertThat(unexpectedInActual).as("Permissions found for %s but unexpected in matrix", roleCode).isEmpty();

        assertThat(actualCodes).isEqualTo(expectedCodes);
    }

    // =========================================================================
    // 8. PROJECT MEMBER ACCESS INTEGRATION TESTS
    // =========================================================================

    @Test
    @Order(9)
    @DisplayName("Project Member Access: EMPLOYEE and TEAM_LEADER active members can read detail, members, milestones, and list")
    void projectRead_activeMembers_shouldAccessDetailMembersMilestonesAndList() throws Exception {
        UUID projectId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO projects (id, code, name, description, manager_id, status, priority, is_deleted, created_by, created_at, updated_at, version) "
                        + "VALUES (?, 'PRJ-MEMBER-TEST', 'Project Member Test', 'Description', ?, 'ACTIVE', 'MEDIUM', false, ?, now(), now(), 0)",
                projectId, pmUserId, pmUserId
        );
        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'PROJECT_MANAGER', true, now(), ?, now(), now())",
                UUID.randomUUID(), projectId, pmUserId, pmUserId
        );
        // Scenario A: EMPLOYEE active member
        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'MEMBER', true, now(), ?, now(), now())",
                UUID.randomUUID(), projectId, employeeUserId, pmUserId
        );
        // Scenario B: TEAM_LEADER active member
        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'TEAM_LEADER', true, now(), ?, now(), now())",
                UUID.randomUUID(), projectId, leaderUserId, pmUserId
        );
        // Add milestone
        UUID milestoneId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO milestones (id, project_id, name, description, due_date, status, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, 'Sprint 1 Target', 'Milestone Desc', CURRENT_DATE + 14, 'PLANNED', ?, now(), now())",
                milestoneId, projectId, pmUserId
        );

        // Employee access verification: detail, members, milestones, list
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(projectId.toString()))
                .andExpect(jsonPath("$.data.code").value("PRJ-MEMBER-TEST"));

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItems").value(3));

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/milestones")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(milestoneId.toString()));

        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(projectId.toString()));

        // Team Leader access verification: detail, members, milestones, list
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(projectId.toString()));

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/milestones")
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1));
    }

    @Test
    @Order(10)
    @DisplayName("Project Member Access: Unrelated user with global PROJECT_READ is denied detail, members, milestones, and excluded from list")
    void projectRead_unrelatedEmployee_shouldBeDenied() throws Exception {
        UUID projectId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO projects (id, code, name, description, manager_id, status, priority, is_deleted, created_by, created_at, updated_at, version) "
                        + "VALUES (?, 'PRJ-SECRET', 'Confidential Project', 'Secret Description', ?, 'ACTIVE', 'HIGH', false, ?, now(), now(), 0)",
                projectId, pmUserId, pmUserId
        );
        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'PROJECT_MANAGER', true, now(), ?, now(), now())",
                UUID.randomUUID(), projectId, pmUserId, pmUserId
        );
        jdbcTemplate.update(
                "INSERT INTO milestones (id, project_id, name, description, due_date, status, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, 'Secret Milestone', 'Secret Milestone Desc', CURRENT_DATE + 30, 'PLANNED', ?, now(), now())",
                UUID.randomUUID(), projectId, pmUserId
        );

        // Create unrelated employee user with EMPLOYEE role (holding global PROJECT_READ)
        UUID unrelatedUserId = UUID.randomUUID();
        insertUser(unrelatedUserId, "unrelated_emp", "unrelated@test.com", passwordEncoder.encode("Password123!"));
        assignRole(unrelatedUserId, "EMPLOYEE");
        String unrelatedToken = loginAndGetToken("unrelated_emp", "Password123!");

        // Unrelated user calling detail is denied
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", "Bearer " + unrelatedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Unrelated user calling members is denied
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", "Bearer " + unrelatedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Unrelated user calling milestones is denied
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/milestones")
                        .header("Authorization", "Bearer " + unrelatedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Project does not appear in unrelated user's project list
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + unrelatedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(0))
                .andExpect(jsonPath("$.data.items").isEmpty());
    }

    @Test
    @Order(11)
    @DisplayName("Project Member Access: Inactive member (is_active = false) is denied detail, members, milestones, and excluded from list")
    void projectRead_inactiveMember_shouldBeDenied() throws Exception {
        UUID projectId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO projects (id, code, name, description, manager_id, status, priority, is_deleted, created_by, created_at, updated_at, version) "
                        + "VALUES (?, 'PRJ-DEACTIVATED', 'Deactivated Project', 'Desc', ?, 'ACTIVE', 'MEDIUM', false, ?, now(), now(), 0)",
                projectId, pmUserId, pmUserId
        );
        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'PROJECT_MANAGER', true, now(), ?, now(), now())",
                UUID.randomUUID(), projectId, pmUserId, pmUserId
        );
        // Create inactive employee member
        UUID inactiveUserId = UUID.randomUUID();
        insertUser(inactiveUserId, "inactive_emp", "inactive@test.com", passwordEncoder.encode("Password123!"));
        assignRole(inactiveUserId, "EMPLOYEE");
        String inactiveToken = loginAndGetToken("inactive_emp", "Password123!");

        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, left_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'MEMBER', false, now() - INTERVAL '10 day', now(), ?, now(), now())",
                UUID.randomUUID(), projectId, inactiveUserId, pmUserId
        );

        // Inactive member calling detail is denied
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", "Bearer " + inactiveToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Inactive member calling members is denied
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", "Bearer " + inactiveToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Inactive member calling milestones is denied
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/milestones")
                        .header("Authorization", "Bearer " + inactiveToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Inactive member project list excludes project
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + inactiveToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(0))
                .andExpect(jsonPath("$.data.items").isEmpty());
    }

    @Test
    @Order(12)
    @DisplayName("Project List Scoping: Multi-project database returns only active member projects with correct pagination, search, and sort")
    void projectRead_multiProjectListScoping_shouldOnlyReturnActiveProjects() throws Exception {
        UUID projectA = UUID.randomUUID();
        UUID projectB = UUID.randomUUID();
        UUID projectC = UUID.randomUUID();

        // Project A: user is active member
        jdbcTemplate.update(
                "INSERT INTO projects (id, code, name, description, manager_id, status, priority, is_deleted, created_by, created_at, updated_at, version) "
                        + "VALUES (?, 'PRJ-SCOPING-A', 'Alpha Project', 'Alpha Desc', ?, 'ACTIVE', 'HIGH', false, ?, now(), now(), 0)",
                projectA, pmUserId, pmUserId
        );
        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'MEMBER', true, now(), ?, now(), now())",
                UUID.randomUUID(), projectA, employeeUserId, pmUserId
        );

        // Project B: user is unrelated
        jdbcTemplate.update(
                "INSERT INTO projects (id, code, name, description, manager_id, status, priority, is_deleted, created_by, created_at, updated_at, version) "
                        + "VALUES (?, 'PRJ-SCOPING-B', 'Beta Project', 'Beta Desc', ?, 'ACTIVE', 'MEDIUM', false, ?, now(), now(), 0)",
                projectB, pmUserId, pmUserId
        );

        // Project C: user is inactive member
        jdbcTemplate.update(
                "INSERT INTO projects (id, code, name, description, manager_id, status, priority, is_deleted, created_by, created_at, updated_at, version) "
                        + "VALUES (?, 'PRJ-SCOPING-C', 'Gamma Project', 'Gamma Desc', ?, 'ACTIVE', 'LOW', false, ?, now(), now(), 0)",
                projectC, pmUserId, pmUserId
        );
        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, left_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'MEMBER', false, now() - INTERVAL '5 day', now(), ?, now(), now())",
                UUID.randomUUID(), projectC, employeeUserId, pmUserId
        );

        // 1. Employee query returns only Project A (totalItems = 1, page metadata exact)
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.totalPages").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(projectA.toString()))
                .andExpect(jsonPath("$.data.items[0].code").value("PRJ-SCOPING-A"));

        // 2. Search for Project B returns 0 items (never leaks out-of-scope project)
        mockMvc.perform(get("/api/v1/projects?search=SCOPING-B")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(0))
                .andExpect(jsonPath("$.data.items").isEmpty());

        // 3. Search for Project A returns Project A
        mockMvc.perform(get("/api/v1/projects?search=Alpha")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(projectA.toString()));

        // 4. Sort preserves scope (returns only Project A)
        mockMvc.perform(get("/api/v1/projects?sort=name,asc")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(projectA.toString()));
    }

    @Test
    @Order(13)
    @DisplayName("Admin vs Project Manager Scope: ADMIN has global scope; PROJECT_MANAGER is scoped to active membership")
    void projectRead_adminAndProjectManagerScope_shouldComplyWithCanonical() throws Exception {
        UUID project1 = UUID.randomUUID();
        UUID project2 = UUID.randomUUID();

        // Project 1: PM is manager & active member
        jdbcTemplate.update(
                "INSERT INTO projects (id, code, name, description, manager_id, status, priority, is_deleted, created_by, created_at, updated_at, version) "
                        + "VALUES (?, 'PRJ-PM-1', 'Managed Project', 'Desc', ?, 'ACTIVE', 'HIGH', false, ?, now(), now(), 0)",
                project1, pmUserId, pmUserId
        );
        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'PROJECT_MANAGER', true, now(), ?, now(), now())",
                UUID.randomUUID(), project1, pmUserId, pmUserId
        );
        jdbcTemplate.update(
                "INSERT INTO milestones (id, project_id, name, description, due_date, status, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, 'P1 Milestone', 'Desc', CURRENT_DATE + 10, 'PLANNED', ?, now(), now())",
                UUID.randomUUID(), project1, pmUserId
        );

        // Project 2: PM is NOT a member (managed by someone else)
        UUID otherPmId = UUID.randomUUID();
        insertUser(otherPmId, "other_pm", "otherpm@test.com", passwordEncoder.encode("Password123!"));
        assignRole(otherPmId, "PROJECT_MANAGER");

        jdbcTemplate.update(
                "INSERT INTO projects (id, code, name, description, manager_id, status, priority, is_deleted, created_by, created_at, updated_at, version) "
                        + "VALUES (?, 'PRJ-PM-2', 'Other Project', 'Desc', ?, 'ACTIVE', 'MEDIUM', false, ?, now(), now(), 0)",
                project2, otherPmId, otherPmId
        );
        jdbcTemplate.update(
                "INSERT INTO project_members (id, project_id, user_id, project_role, is_active, joined_at, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'PROJECT_MANAGER', true, now(), ?, now(), now())",
                UUID.randomUUID(), project2, otherPmId, otherPmId
        );
        jdbcTemplate.update(
                "INSERT INTO milestones (id, project_id, name, description, due_date, status, created_by, created_at, updated_at) "
                        + "VALUES (?, ?, 'P2 Milestone', 'Desc', CURRENT_DATE + 15, 'PLANNED', ?, now(), now())",
                UUID.randomUUID(), project2, otherPmId
        );

        // --- 1. ADMIN has global scope ---
        mockMvc.perform(get("/api/v1/projects/" + project1)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(project1.toString()));

        mockMvc.perform(get("/api/v1/projects/" + project2)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(project2.toString()));

        mockMvc.perform(get("/api/v1/projects/" + project2 + "/members")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/projects/" + project2 + "/milestones")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2));

        // --- 2. PROJECT_MANAGER is scoped: access project1, denied project2 ---
        mockMvc.perform(get("/api/v1/projects/" + project1)
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(project1.toString()));

        mockMvc.perform(get("/api/v1/projects/" + project2)
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(get("/api/v1/projects/" + project2 + "/members")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/projects/" + project2 + "/milestones")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isForbidden());

        // PM list query only returns Project 1
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(project1.toString()));
    }
}
