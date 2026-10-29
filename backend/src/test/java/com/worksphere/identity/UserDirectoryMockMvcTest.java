package com.worksphere.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.shared.security.JwtService;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class UserDirectoryMockMvcTest {

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
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private UUID adminUserId;
    private UUID pmUserId;
    private UUID employeeUserId;

    private String adminToken;
    private String pmToken;
    private String employeeToken;

    private Department engineeringDept;
    private Department hrDept;

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

        jdbcTemplate.update("DELETE FROM user_roles");
        userRepository.deleteAll();
        departmentRepository.deleteAll();

        // Departments
        engineeringDept = departmentRepository.save(
                Department.create(UUID.randomUUID(), "ENG", "Kỹ thuật", null, null, null));
        hrDept = departmentRepository.save(
                Department.create(UUID.randomUUID(), "HR", "Nhân sự", null, null, null));

        // 1. Admin
        adminUserId = UUID.randomUUID();
        insertUserWithDetails(adminUserId, "admin_user", "admin@worksphere.com", "Admin Manager",
                passwordEncoder.encode("Password123!"), "ACTIVE", engineeringDept.getId(), false, "0901111111");
        assignRole(adminUserId, "ADMIN");
        adminToken = jwtService.generateAccessToken(adminUserId, UUID.randomUUID());

        // 2. Project Manager
        pmUserId = UUID.randomUUID();
        insertUserWithDetails(pmUserId, "pm_user", "pm@worksphere.com", "Project Manager One",
                passwordEncoder.encode("Password123!"), "ACTIVE", engineeringDept.getId(), false, "0902222222");
        assignRole(pmUserId, "PROJECT_MANAGER");
        pmToken = jwtService.generateAccessToken(pmUserId, UUID.randomUUID());

        // 3. Regular Employee
        employeeUserId = UUID.randomUUID();
        insertUserWithDetails(employeeUserId, "emp_user", "emp@worksphere.com", "Ordinary Employee",
                passwordEncoder.encode("Password123!"), "ACTIVE", hrDept.getId(), false, "0903333333");
        assignRole(employeeUserId, "EMPLOYEE");
        employeeToken = jwtService.generateAccessToken(employeeUserId, UUID.randomUUID());
    }

    private void insertUserWithDetails(UUID id, String username, String email, String fullName,
                                       String passwordHash, String status, UUID departmentId,
                                       boolean isDeleted, String phoneNumber) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, full_name, password_hash, status, department_id, is_deleted, phone_number, created_at, updated_at, version) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now(), 0)",
                id, username, email, fullName, passwordHash, status, departmentId, isDeleted, phoneNumber
        );
    }

    private void assignRole(UUID userId, String roleCode) {
        UUID roleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = ?", UUID.class, roleCode);
        if (roleId != null) {
            jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now()) ON CONFLICT DO NOTHING",
                    userId, roleId);
        }
    }

    @Test
    @Order(1)
    @DisplayName("1. Unauthenticated request to directory must return 401 Unauthorized")
    void searchDirectory_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/directory/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(2)
    @DisplayName("2. Authenticated ordinary employee can query directory without USER_READ")
    void searchDirectory_authenticatedEmployee_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items", hasSize(3)));
    }

    @Test
    @Order(3)
    @DisplayName("3. Authenticated Project Manager can query directory")
    void searchDirectory_authenticatedPM_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItems").value(3));
    }

    @Test
    @Order(4)
    @DisplayName("4. Authenticated Admin can query directory")
    void searchDirectory_authenticatedAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItems").value(3));
    }

    @Test
    @Order(5)
    @DisplayName("5. Data minimization: Response excludes phoneNumber, roles, permissions, status, security metadata")
    void searchDirectory_dataMinimization_excludesAdminMetadata() throws Exception {
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].id").exists())
                .andExpect(jsonPath("$.data.items[0].username").exists())
                .andExpect(jsonPath("$.data.items[0].fullName").exists())
                .andExpect(jsonPath("$.data.items[0].email").exists())
                // Strictly excluded fields:
                .andExpect(jsonPath("$.data.items[0].phoneNumber").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].roles").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].permissions").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].status").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].lastLoginAt").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].failedLoginAttempts").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].lockedUntil").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].version").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].createdAt").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].deleted").doesNotExist());
    }

    @Test
    @Order(6)
    @DisplayName("6. Active-only policy: PENDING, LOCKED, DISABLED, and soft-deleted accounts are excluded")
    void searchDirectory_activeOnly_excludesInactiveAndDeletedUsers() throws Exception {
        // Add inactive fixture accounts
        insertUserWithDetails(UUID.randomUUID(), "pending_user", "pending@test.com", "Pending Account",
                "hash", "PENDING", engineeringDept.getId(), false, "0900000001");
        insertUserWithDetails(UUID.randomUUID(), "locked_user", "locked@test.com", "Locked Account",
                "hash", "LOCKED", engineeringDept.getId(), false, "0900000002");
        insertUserWithDetails(UUID.randomUUID(), "disabled_user", "disabled@test.com", "Disabled Account",
                "hash", "DISABLED", engineeringDept.getId(), false, "0900000003");
        insertUserWithDetails(UUID.randomUUID(), "deleted_user", "deleted@test.com", "Deleted Account",
                "hash", "ACTIVE", engineeringDept.getId(), true, "0900000004");

        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                // Total eligible active users must remain 3
                .andExpect(jsonPath("$.data.totalItems").value(3))
                .andExpect(jsonPath("$.data.items[*].username", not(hasItems("pending_user", "locked_user", "disabled_user", "deleted_user"))));
    }

    @Test
    @Order(7)
    @DisplayName("7. Search matches fullName, username, and email case-insensitively")
    void searchDirectory_searchMatchesNameUsernameEmail() throws Exception {
        // Match fullName
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("search", "project manager"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].username").value("pm_user"));

        // Match username
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("search", "EMP_USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].fullName").value("Ordinary Employee"));

        // Match email
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("search", "admin@worksphere"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].username").value("admin_user"));
    }

    @Test
    @Order(8)
    @DisplayName("8. Search normalization: trims outer whitespace; whitespace-only behaves as no search; phone numbers do not match")
    void searchDirectory_searchNormalization() throws Exception {
        // Outer whitespace trimmed
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("search", "   admin_user   "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].username").value("admin_user"));

        // Whitespace-only search returns all active users
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("search", "    "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(3));

        // Phone number search does not match
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("search", "0901111111"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(0));
    }

    @Test
    @Order(9)
    @DisplayName("9. Department filter restricts to users in specified department; unknown department returns empty page")
    void searchDirectory_departmentFilter() throws Exception {
        // Filter by ENG dept (admin + pm = 2 users)
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("departmentId", engineeringDept.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2))
                .andExpect(jsonPath("$.data.items[0].departmentName").value("Kỹ thuật"));

        // Filter by HR dept (employee = 1 user)
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("departmentId", hrDept.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.items[0].departmentName").value("Nhân sự"));

        // Unknown department returns empty page, not 404
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("departmentId", UUID.randomUUID().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(0))
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    @Test
    @Order(10)
    @DisplayName("10. Pagination and sorting: default fullName,asc; custom size; page navigation; PagedData metadata")
    void searchDirectory_paginationAndSort() throws Exception {
        // Page 0 with size 2
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(2))
                .andExpect(jsonPath("$.data.totalItems").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.hasNext").value(true))
                .andExpect(jsonPath("$.data.hasPrevious").value(false))
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                // Default sort: fullName,asc -> "Admin Manager", "Ordinary Employee"
                .andExpect(jsonPath("$.data.items[0].fullName").value("Admin Manager"))
                .andExpect(jsonPath("$.data.items[1].fullName").value("Ordinary Employee"));

        // Page 1 with size 2
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.hasNext").value(false))
                .andExpect(jsonPath("$.data.hasPrevious").value(true))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].fullName").value("Project Manager One"));

        // Custom sort: fullName,desc
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("sort", "fullName,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].fullName").value("Project Manager One"));

        // Max size 100 succeeds
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size").value(100));
    }

    @Test
    @Order(11)
    @DisplayName("11. Pagination validation: negative page and size out of bounds (0 or > 100) return 400 Bad Request")
    void searchDirectory_paginationValidationErrors() throws Exception {
        // Negative page
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        // Size 0
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        // Size > 100
        mockMvc.perform(get("/api/v1/directory/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }
}
