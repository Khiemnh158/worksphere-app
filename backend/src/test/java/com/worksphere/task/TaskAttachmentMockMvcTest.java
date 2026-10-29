package com.worksphere.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.file.domain.FilePurpose;
import com.worksphere.file.domain.StoredFile;
import com.worksphere.file.infrastructure.persistence.StoredFileRepository;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectPriority;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.domain.ProjectStatus;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.project.infrastructure.persistence.ProjectRepository;
import com.worksphere.shared.security.JwtService;
import com.worksphere.task.api.request.CreateTaskCommentRequest;
import com.worksphere.task.api.request.CreateTaskRequest;
import com.worksphere.task.domain.Task;
import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;
import com.worksphere.task.infrastructure.persistence.TaskAttachmentRepository;
import com.worksphere.task.infrastructure.persistence.TaskCommentRepository;
import com.worksphere.task.infrastructure.persistence.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class TaskAttachmentMockMvcTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @TempDir
    static Path tempDir;

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
        registry.add("worksphere.storage.path", () -> tempDir.toAbsolutePath().toString());
    }

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired(required = false)
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StoredFileRepository storedFileRepository;

    @Autowired
    private TaskAttachmentRepository taskAttachmentRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskCommentRepository commentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private UUID projectManagerId;
    private UUID projectMemberId;
    private UUID nonMemberId;

    private String pmToken;
    private String memberToken;
    private String nonMemberToken;

    private UUID projectId;
    private UUID taskId;

    private static final byte[] VALID_PNG = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01
    };

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

        // Clean tables
        jdbcTemplate.update("DELETE FROM task_attachments");
        jdbcTemplate.update("DELETE FROM task_comments");
        jdbcTemplate.update("DELETE FROM task_status_histories");
        jdbcTemplate.update("DELETE FROM task_assignments");
        jdbcTemplate.update("UPDATE tasks SET parent_task_id = NULL");
        jdbcTemplate.update("DELETE FROM tasks");
        jdbcTemplate.update("DELETE FROM project_members");
        jdbcTemplate.update("DELETE FROM projects");
        jdbcTemplate.update("DELETE FROM stored_files");
        jdbcTemplate.update("DELETE FROM user_roles");
        jdbcTemplate.update("DELETE FROM users");
        jdbcTemplate.update("DELETE FROM departments");

        // Department
        UUID deptId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO departments (id, code, name, is_active, is_deleted, created_at, updated_at, version) "
                        + "VALUES (?, 'DEP-DEV', 'Dev Dept', true, false, now(), now(), 0)",
                deptId
        );

        // Users
        projectManagerId = UUID.randomUUID();
        insertUser(projectManagerId, "pm_attach", "pm_attach@test.com");
        assignRole(projectManagerId, "PROJECT_MANAGER");
        pmToken = jwtService.generateAccessToken(projectManagerId, UUID.randomUUID());

        projectMemberId = UUID.randomUUID();
        insertUser(projectMemberId, "member_attach", "member_attach@test.com");
        assignRole(projectMemberId, "EMPLOYEE");
        memberToken = jwtService.generateAccessToken(projectMemberId, UUID.randomUUID());

        nonMemberId = UUID.randomUUID();
        insertUser(nonMemberId, "nonmember_attach", "nonmember_attach@test.com");
        assignRole(nonMemberId, "EMPLOYEE");
        nonMemberToken = jwtService.generateAccessToken(nonMemberId, UUID.randomUUID());

        // Project
        projectId = UUID.randomUUID();
        Project project = Project.create(
                projectId,
                "PROJ-ATT",
                "Attachment Project",
                "Testing Task Attachments",
                projectManagerId,
                deptId,
                ProjectPriority.HIGH,
                LocalDate.now(),
                LocalDate.now().plusMonths(1),
                projectManagerId
        );
        project.changeStatus(ProjectStatus.ACTIVE, projectManagerId);
        projectRepository.save(project);

        // Members
        projectMemberRepository.save(ProjectMember.create(UUID.randomUUID(), projectId, projectManagerId, ProjectRole.PROJECT_MANAGER, projectManagerId));
        projectMemberRepository.save(ProjectMember.create(UUID.randomUUID(), projectId, projectMemberId, ProjectRole.MEMBER, projectManagerId));

        // Task
        taskId = UUID.randomUUID();
        Task task = Task.create(
                taskId,
                projectId,
                null,
                null,
                "Task with attachments",
                "Task description",
                TaskPriority.MEDIUM,
                projectManagerId,
                LocalDate.now(),
                Instant.now().plusSeconds(86400),
                120,
                projectManagerId
        );
        taskRepository.save(task);
    }

    private void insertUser(UUID id, String username, String email) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) "
                        + "VALUES (?, ?, ?, ?, ?, 'ACTIVE', false, now(), now(), 0)",
                id, username, email, passwordEncoder.encode("Password123!"), username
        );
    }

    private void assignRole(UUID userId, String roleCode) {
        UUID roleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = ?", UUID.class, roleCode);
        if (roleId != null) {
            jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())", userId, roleId);
            jdbcTemplate.update(
                    "INSERT INTO role_permissions (role_id, permission_id, assigned_at) "
                            + "SELECT ?, id, now() FROM permissions ON CONFLICT DO NOTHING",
                    roleId
            );
        }
    }

    @Test
    @DisplayName("Create comment without attachments remains compatible")
    void createCommentWithoutAttachmentsShouldSucceed() throws Exception {
        CreateTaskCommentRequest request = new CreateTaskCommentRequest("Normal comment", null, null);

        mockMvc.perform(post("/api/v1/tasks/{taskId}/comments", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", is("Normal comment")));

        assertThat(taskAttachmentRepository.countByTaskId(taskId)).isZero();
    }

    @Test
    @DisplayName("Create comment with 1 valid attachment links TaskAttachment and updates count")
    void createCommentWithOneAttachmentShouldLinkSuccessfully() throws Exception {
        UUID fileId = uploadTestFile(memberToken, "screenshot.png", "image/png", VALID_PNG, "TASK_ATTACHMENT");

        CreateTaskCommentRequest request = new CreateTaskCommentRequest(
                "Comment with screenshot",
                null,
                List.of(fileId)
        );

        mockMvc.perform(post("/api/v1/tasks/{taskId}/comments", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));

        assertThat(taskAttachmentRepository.countByTaskId(taskId)).isEqualTo(1L);

        // Project member can now download the task-linked file
        mockMvc.perform(get("/api/v1/files/{fileId}/download", fileId)
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"));

        // Non-member of the project cannot download the task-linked file
        mockMvc.perform(get("/api/v1/files/{fileId}/download", fileId)
                        .header("Authorization", "Bearer " + nonMemberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FILE_ACCESS_DENIED")));

        // Task summary reflects attachmentCount
        mockMvc.perform(get("/api/v1/tasks")
                        .param("projectId", projectId.toString())
                        .header("Authorization", "Bearer " + pmToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].attachmentCount", is(1)));
    }

    @Test
    @DisplayName("Create comment with duplicate file IDs in request returns 400 Bad Request")
    void createCommentWithDuplicateFileIdsShouldReturn400() throws Exception {
        UUID fileId = uploadTestFile(memberToken, "screenshot.png", "image/png", VALID_PNG, "TASK_ATTACHMENT");

        CreateTaskCommentRequest request = new CreateTaskCommentRequest(
                "Duplicate IDs",
                null,
                List.of(fileId, fileId)
        );

        mockMvc.perform(post("/api/v1/tasks/{taskId}/comments", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

        assertThat(taskAttachmentRepository.countByTaskId(taskId)).isZero();
    }

    @Test
    @DisplayName("Create comment with non-existent file ID returns 404 Not Found")
    void createCommentWithMissingFileShouldReturn404() throws Exception {
        CreateTaskCommentRequest request = new CreateTaskCommentRequest(
                "Missing file",
                null,
                List.of(UUID.randomUUID())
        );

        mockMvc.perform(post("/api/v1/tasks/{taskId}/comments", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("FILE_NOT_FOUND")));
    }

    @Test
    @DisplayName("Create comment with file uploaded by another user returns 403 Forbidden")
    void createCommentWithFileOfAnotherUserShouldReturn403() throws Exception {
        UUID fileId = uploadTestFile(nonMemberToken, "other_user.png", "image/png", VALID_PNG, "TASK_ATTACHMENT");

        CreateTaskCommentRequest request = new CreateTaskCommentRequest(
                "Stealing file",
                null,
                List.of(fileId)
        );

        mockMvc.perform(post("/api/v1/tasks/{taskId}/comments", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FILE_ACCESS_DENIED")));
    }

    @Test
    @DisplayName("Create comment with wrong purpose (AVATAR) returns 400 Bad Request")
    void createCommentWithWrongPurposeShouldReturn400() throws Exception {
        UUID fileId = uploadTestFile(memberToken, "avatar.png", "image/png", VALID_PNG, "AVATAR");

        CreateTaskCommentRequest request = new CreateTaskCommentRequest(
                "Wrong purpose",
                null,
                List.of(fileId)
        );

        mockMvc.perform(post("/api/v1/tasks/{taskId}/comments", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
    }

    private UUID uploadTestFile(String token, String filename, String mimeType, byte[] content, String purpose) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", filename, mimeType, content);

        MvcResult result = mockMvc.perform(multipart("/api/v1/files")
                        .file(file)
                        .param("purpose", purpose)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> resp = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> data = (Map<?, ?>) resp.get("data");
        return UUID.fromString(data.get("id").toString());
    }
}
