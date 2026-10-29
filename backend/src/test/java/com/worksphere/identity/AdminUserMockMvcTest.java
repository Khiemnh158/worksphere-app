package com.worksphere.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.api.request.AdminUpdateUserRequest;
import com.worksphere.identity.api.request.CreateUserRequest;
import com.worksphere.identity.api.request.LockUserRequest;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.shared.security.JwtService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AdminUserMockMvcTest {

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
    private UUID employeeUserId;
    private String adminToken;
    private String employeeToken;

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

        // 1. Create Admin User
        adminUserId = UUID.randomUUID();
        insertUser(adminUserId, "adminuser", "admin@test.com", passwordEncoder.encode("Password123!"), "ACTIVE");
        UUID adminRoleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = 'ADMIN'", UUID.class);
        if (adminRoleId != null) {
            jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    adminUserId, adminRoleId);
            jdbcTemplate.update(
                    "INSERT INTO role_permissions (role_id, permission_id, assigned_at) " +
                    "SELECT ?, id, now() FROM permissions ON CONFLICT DO NOTHING",
                    adminRoleId);
        }
        adminToken = jwtService.generateAccessToken(adminUserId, UUID.randomUUID());

        // 2. Create Regular Employee
        employeeUserId = UUID.randomUUID();
        insertUser(employeeUserId, "regularuser", "regular@test.com", passwordEncoder.encode("Password123!"), "ACTIVE");
        UUID empRoleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = 'EMPLOYEE'", UUID.class);
        if (empRoleId != null) {
            jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    employeeUserId, empRoleId);
        }
        employeeToken = jwtService.generateAccessToken(employeeUserId, UUID.randomUUID());
    }

    private void insertUser(UUID id, String username, String email, String passwordHash, String status) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                        "VALUES (?, ?, ?, ?, ?, ?, false, now(), now(), 0)",
                id, username, email, passwordHash, username + " Full Name", status
        );
    }

    @Test
    @Order(1)
    void searchUsers_shouldSucceedForAdminWithUserRead() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.totalItems").value(2))
                .andExpect(jsonPath("$.data.items[0].passwordHash").doesNotExist());
    }

    @Test
    @Order(2)
    void searchUsers_shouldFailForEmployeeWithoutUserRead() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @Order(3)
    void createUser_shouldSucceedForAdmin() throws Exception {
        Department dept = Department.create(UUID.randomUUID(), "ENG", "Kỹ thuật", null, null, null);
        Department savedDept = departmentRepository.save(dept);

        CreateUserRequest req = new CreateUserRequest(
                "nguyenvanb",
                "vanb@test.com",
                "Nguyễn Văn B",
                "0987654321",
                savedDept.getId(),
                List.of("EMPLOYEE")
        );

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("nguyenvanb"))
                .andExpect(jsonPath("$.data.email").value("vanb@test.com"))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.roles[0]").value("EMPLOYEE"));
    }

    @Test
    @Order(4)
    void createUser_shouldFailWhenUsernameAlreadyExists() throws Exception {
        CreateUserRequest req = new CreateUserRequest(
                "adminuser",
                "different@test.com",
                "Admin Trùng",
                null,
                null,
                List.of("EMPLOYEE")
        );

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("USERNAME_ALREADY_EXISTS"));
    }

    @Test
    @Order(5)
    void updateUser_shouldSucceedForAdmin() throws Exception {
        AdminUpdateUserRequest req = new AdminUpdateUserRequest(
                "Tên Cập Nhật",
                "0912345678",
                null,
                List.of("TEAM_LEADER")
        );

        mockMvc.perform(put("/api/v1/admin/users/" + employeeUserId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Tên Cập Nhật"))
                .andExpect(jsonPath("$.data.phoneNumber").value("0912345678"))
                .andExpect(jsonPath("$.data.roles[0]").value("TEAM_LEADER"));
    }

    @Test
    @Order(6)
    void lockUser_shouldSucceedAndRevokeAccess() throws Exception {
        LockUserRequest req = new LockUserRequest("Vi phạm chính sách");

        mockMvc.perform(put("/api/v1/admin/users/" + employeeUserId + "/lock")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        User locked = userRepository.findById(employeeUserId).orElseThrow();
        assertThat(locked.getStatus()).isEqualTo(UserStatus.LOCKED);
    }

    @Test
    @Order(7)
    void unlockUser_shouldSucceed() throws Exception {
        // Lock first
        mockMvc.perform(put("/api/v1/admin/users/" + employeeUserId + "/lock")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Then unlock
        mockMvc.perform(put("/api/v1/admin/users/" + employeeUserId + "/unlock")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        User unlocked = userRepository.findById(employeeUserId).orElseThrow();
        assertThat(unlocked.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }
}
