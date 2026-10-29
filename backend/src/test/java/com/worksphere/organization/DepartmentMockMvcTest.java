package com.worksphere.organization;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.organization.api.request.CreateDepartmentRequest;
import com.worksphere.organization.api.request.UpdateDepartmentRequest;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class DepartmentMockMvcTest {

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
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

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

        departmentRepository.deleteAll();
        jdbcTemplate.update("DELETE FROM user_roles");
        userRepository.deleteAll();

        // Create Admin user
        adminUserId = UUID.randomUUID();
        insertUser(adminUserId, "adminuser", "admin@test.com", passwordEncoder.encode("Password123!"));
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

        // Create regular Employee user
        employeeUserId = UUID.randomUUID();
        insertUser(employeeUserId, "empuser", "emp@test.com", passwordEncoder.encode("Password123!"));
        UUID empRoleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = 'EMPLOYEE'", UUID.class);
        if (empRoleId != null) {
            jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    employeeUserId, empRoleId);
        }
        employeeToken = jwtService.generateAccessToken(employeeUserId, UUID.randomUUID());
    }

    private void insertUser(UUID id, String username, String email, String passwordHash) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                        "VALUES (?, ?, ?, ?, ?, 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordHash, username + " Full Name"
        );
    }

    @Test
    @Order(1)
    void getDepartments_shouldSucceedForAuthenticatedUser() throws Exception {
        Department dept = Department.create(UUID.randomUUID(), "IT", "Phòng Công nghệ", "Mô tả", null, null);
        departmentRepository.save(dept);

        mockMvc.perform(get("/api/v1/departments")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].code").value("IT"))
                .andExpect(jsonPath("$.data[0].name").value("Phòng Công nghệ"));
    }

    @Test
    @Order(2)
    void getDepartments_shouldFailForUnauthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/v1/departments"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @Order(3)
    void createDepartment_shouldSucceedForAdmin() throws Exception {
        CreateDepartmentRequest req = new CreateDepartmentRequest(
                "HR", "Phòng Nhân sự", "Mô tả nhân sự", null, null);

        mockMvc.perform(post("/api/v1/admin/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("HR"))
                .andExpect(jsonPath("$.data.name").value("Phòng Nhân sự"))
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    @Order(4)
    void createDepartment_shouldFailForRegularEmployeeWithoutPermission() throws Exception {
        CreateDepartmentRequest req = new CreateDepartmentRequest(
                "FIN", "Phòng Tài chính", "Mô tả", null, null);

        mockMvc.perform(post("/api/v1/admin/departments")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @Order(5)
    void createDepartment_shouldFailWhenCodeAlreadyExists() throws Exception {
        Department existing = Department.create(UUID.randomUUID(), "SALES", "Phòng Kinh doanh", null, null, null);
        departmentRepository.save(existing);

        CreateDepartmentRequest req = new CreateDepartmentRequest(
                "SALES", "Phòng Kinh doanh 2", "Trùng code", null, null);

        mockMvc.perform(post("/api/v1/admin/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("DEPARTMENT_CODE_EXISTS"));
    }

    @Test
    @Order(6)
    void updateDepartment_shouldSucceed() throws Exception {
        Department dept = Department.create(UUID.randomUUID(), "MKT", "Marketing", "Ban đầu", null, null);
        Department saved = departmentRepository.save(dept);

        UpdateDepartmentRequest req = new UpdateDepartmentRequest(
                "Marketing & Truyền thông", "Cập nhật", null, null);

        mockMvc.perform(put("/api/v1/admin/departments/" + saved.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Marketing & Truyền thông"));
    }

    @Test
    @Order(7)
    void updateDepartment_shouldFailWhenSelfParent() throws Exception {
        Department dept = Department.create(UUID.randomUUID(), "OPS", "Vận hành", null, null, null);
        Department saved = departmentRepository.save(dept);

        UpdateDepartmentRequest req = new UpdateDepartmentRequest(
                "Vận hành", null, saved.getId(), null);

        mockMvc.perform(put("/api/v1/admin/departments/" + saved.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("INVALID_PARENT_DEPARTMENT"));
    }

    @Test
    @Order(8)
    void deactivateDepartment_shouldSucceed() throws Exception {
        Department dept = Department.create(UUID.randomUUID(), "TEMP", "Tạm thời", null, null, null);
        Department saved = departmentRepository.save(dept);

        mockMvc.perform(put("/api/v1/admin/departments/" + saved.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Department found = departmentRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.isActive()).isFalse();
    }
}
