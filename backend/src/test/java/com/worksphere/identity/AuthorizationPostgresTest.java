package com.worksphere.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.application.AuthApplicationService;
import com.worksphere.identity.application.UserManagementApplicationService;
import com.worksphere.identity.domain.LoginSession;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.infrastructure.persistence.LoginSessionRepository;
import com.worksphere.identity.infrastructure.persistence.RoleRepository;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.project.domain.*;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.project.infrastructure.persistence.ProjectRepository;
import com.worksphere.service_request.domain.ServiceCategory;
import com.worksphere.service_request.domain.ServicePriority;
import com.worksphere.service_request.infrastructure.persistence.ServiceCategoryRepository;
import com.worksphere.shared.security.JwtService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

/** Explicit opt-in: run only against a dedicated disposable PostgreSQL database. */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@EnabledIfEnvironmentVariable(named = "WORKSPHERE_AUTHZ_TEST_JDBC_URL", matches = ".+")
class AuthorizationPostgresTest {
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", () -> System.getenv("WORKSPHERE_AUTHZ_TEST_JDBC_URL"));
        properties.add("spring.datasource.username", () -> System.getenv("WORKSPHERE_AUTHZ_TEST_DB_USER"));
        properties.add("spring.datasource.password", () -> System.getenv("WORKSPHERE_AUTHZ_TEST_DB_PASSWORD"));
        properties.add("worksphere.jwt.secret", () -> "authorization-integration-test-signing-key-not-for-production");
        properties.add("worksphere.dev.e2e-user.enabled", () -> "false");
        properties.add("worksphere.notification.scheduling.enabled", () -> "false");
        properties.add("worksphere.storage.path", () -> "target/authz-test-uploads");
    }

    @Autowired private WebApplicationContext context;
    @Autowired private UserRepository users;
    @Autowired private RoleRepository roles;
    @Autowired private LoginSessionRepository sessions;
    @Autowired private ProjectRepository projects;
    @Autowired private ProjectMemberRepository members;
    @Autowired private ServiceCategoryRepository categories;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtService jwt;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private AuthApplicationService authentication;
    @Autowired private UserManagementApplicationService userManagement;
    private final ObjectMapper json = new ObjectMapper();
    private final String password = "Test-" + UUID.randomUUID() + "aA1!";
    private MockMvc mvc;
    private User pmA;
    private User pmB;
    private User employee;
    private User agent;
    private User admin;
    private Project projectA;
    private Project projectB;
    private UUID memberB;
    private UUID categoryId;

    @BeforeAll
    void fixtures() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        pmA = user("PROJECT_MANAGER"); pmB = user("PROJECT_MANAGER");
        employee = user("EMPLOYEE"); agent = user("EMPLOYEE"); admin = user("ADMIN");
        projectA = project(pmA); projectB = project(pmB);
        memberB = members.findActiveByProjectIdAndUserId(projectB.getId(), pmB.getId()).orElseThrow().getId();
        members.saveAndFlush(ProjectMember.create(UUID.randomUUID(), projectA.getId(), employee.getId(), ProjectRole.MEMBER, pmA.getId()));
        categoryId = UUID.randomUUID();
        categories.saveAndFlush(ServiceCategory.create(categoryId, null, "AUTHZ-" + UUID.randomUUID().toString().substring(0,8),
                "Authorization test category", null, ServicePriority.MEDIUM, true, Instant.now()));
    }

    private User user(String role) {
        String name = "authz-" + UUID.randomUUID().toString().substring(0,12);
        User user = users.saveAndFlush(User.create(UUID.randomUUID(), name, name + "@example.invalid", encoder.encode(password), name));
        jdbc.update("UPDATE users SET status='ACTIVE' WHERE id=?", user.getId());
        jdbc.update("INSERT INTO user_roles(user_id, role_id, assigned_at) VALUES (?, ?, CURRENT_TIMESTAMP)", user.getId(), roles.findByCode(role).orElseThrow().getId());
        return users.findActiveById(user.getId()).orElseThrow();
    }

    private Project project(User manager) {
        Project project = projects.saveAndFlush(Project.create(UUID.randomUUID(), "AZ-" + UUID.randomUUID().toString().substring(0,8),
                "Original project", null, manager.getId(), null, ProjectPriority.MEDIUM, LocalDate.now(), LocalDate.now().plusDays(10), manager.getId()));
        members.saveAndFlush(ProjectMember.create(UUID.randomUUID(), project.getId(), manager.getId(), ProjectRole.PROJECT_MANAGER, manager.getId()));
        return project;
    }

    private String token(User user) {
        UUID session = UUID.randomUUID();
        sessions.saveAndFlush(LoginSession.create(session, user.getId(), null, "authz test", "127.0.0.1", "JUnit"));
        return jwt.generateAccessToken(user.getId(), session);
    }

    private MvcResult call(String method, String path, String token, Object body) throws Exception {
        var request = request(HttpMethod.valueOf(method), path).contentType(MediaType.APPLICATION_JSON);
        if (token != null) { request.header("Authorization", "Bearer " + token); }
        if (body != null) { request.content(json.writeValueAsString(body)); }
        return mvc.perform(request).andReturn();
    }

    private JsonNode data(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString()).path("data");
    }

    private void status(MvcResult result, int status) {
        // Do not print response bodies: auth responses contain live test tokens.
        assertThat(result.getResponse().getStatus()).isEqualTo(status);
    }

    @Test
    void projectMutationRoutesRejectManagerOfAnotherProject() throws Exception {
        String token = token(pmA);
        String path = "/api/v1/projects/" + projectB.getId();
        status(call("GET", path, token, null), 403);
        status(call("PUT", path, token, Map.of("name","Unauthorized edit","version",projectB.getVersion())), 403);
        status(call("PUT", path + "/status", token, Map.of("status","ACTIVE","version",projectB.getVersion())), 403);
        status(call("POST", path + "/members", token, Map.of("userId",pmA.getId(),"projectRole","PROJECT_MANAGER")), 403);
        status(call("PUT", path + "/members/" + memberB, token, Map.of("projectRole","TEAM_LEADER")), 403);
        status(call("DELETE", path + "/members/" + memberB, token, null), 403);
        status(call("POST", path + "/milestones", token, Map.of("name","Unauthorized milestone","dueDate","2026-11-10")), 403);
        assertThat(projects.findById(projectB.getId()).orElseThrow().getName()).isEqualTo("Original project");
        assertThat(members.existsByProjectIdAndUserIdAndActiveTrue(projectB.getId(),pmA.getId())).isFalse();
    }

    @Test
    void projectOwnerCanUpdateAndReaderDoesNotAdvertiseManagerActions() throws Exception {
        String path = "/api/v1/projects/" + projectA.getId();
        JsonNode reader = data(call("GET",path,token(employee),null));
        assertThat(reader.path("allowedActions").toString()).doesNotContain("UPDATE","MANAGE_MEMBERS");
        status(call("PUT",path,token(pmA),Map.of("name","Authorized update","version",projects.findById(projectA.getId()).orElseThrow().getVersion())),200);
    }

    @Test
    void logoutInvalidatesAccessTokenButLeavesOtherSessionActive() throws Exception {
        JsonNode first = data(call("POST","/api/v1/auth/login",null,Map.of("login",employee.getUsername(),"password",password)));
        String otherSession = token(employee);
        status(call("GET","/api/v1/me",first.path("accessToken").asText(),null),200);
        status(call("POST","/api/v1/auth/logout",first.path("accessToken").asText(),Map.of("refreshToken",first.path("refreshToken").asText())),204);
        status(call("GET","/api/v1/me",first.path("accessToken").asText(),null),401);
        status(call("GET","/api/v1/me",otherSession,null),200);
    }

    @Test
    void sameRefreshTokenHasOnlyOneConcurrentWinner() throws Exception {
        JsonNode login = data(call("POST","/api/v1/auth/login",null,Map.of("login",agent.getUsername(),"password",password)));
        String refresh = login.path("refreshToken").asText();
        CountDownLatch ready = new CountDownLatch(2); CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        Callable<Integer> attempt = () -> {
            ready.countDown(); start.await(10,TimeUnit.SECONDS);
            return call("POST","/api/v1/auth/refresh",null,Map.of("refreshToken",refresh)).getResponse().getStatus();
        };
        try {
            Future<Integer> first = executor.submit(attempt); Future<Integer> second = executor.submit(attempt);
            assertThat(ready.await(10,TimeUnit.SECONDS)).isTrue(); start.countDown();
            assertThat(java.util.List.of(first.get(20,TimeUnit.SECONDS),second.get(20,TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(200,401);
        } finally { start.countDown(); executor.shutdownNow(); authentication.logoutAll(agent.getId()); }
    }

    @Test
    void logoutWithPreRotationPayloadStillRevokesCurrentJwtSession() throws Exception {
        JsonNode login = data(call("POST","/api/v1/auth/login",null,Map.of("login",employee.getUsername(),"password",password)));
        MvcResult rotated = call("POST","/api/v1/auth/refresh",null,Map.of("refreshToken",login.path("refreshToken").asText()));
        status(rotated,200);
        JsonNode fresh = data(rotated);
        status(call("POST","/api/v1/auth/logout",login.path("accessToken").asText(),Map.of("refreshToken",login.path("refreshToken").asText())),204);
        status(call("GET","/api/v1/me",fresh.path("accessToken").asText(),null),401);
        status(call("POST","/api/v1/auth/refresh",null,Map.of("refreshToken",fresh.path("refreshToken").asText())),401);
    }

    @Test
    void logoutAllRevokesBothSessions() throws Exception {
        User temporary = user("EMPLOYEE");
        String first = token(temporary); String second = token(temporary);
        authentication.logoutAll(temporary.getId());
        status(call("GET","/api/v1/me",first,null),401);
        status(call("GET","/api/v1/me",second,null),401);
    }

    @Test
    void unlockDoesNotRevivePreviouslyRevokedSession() throws Exception {
        User temporary = user("EMPLOYEE"); String token = token(temporary);
        status(call("GET","/api/v1/me",token,null),200);
        userManagement.lockUser(temporary.getId(),"test account lock");
        status(call("GET","/api/v1/me",token,null),401);
        userManagement.unlockUser(temporary.getId());
        status(call("GET","/api/v1/me",token,null),401);
        status(call("GET","/api/v1/me",token(temporary),null),200);
    }

    private UUID ticket(String requester) throws Exception {
        MvcResult result = call("POST","/api/v1/service-requests",requester,Map.of("categoryId",categoryId,"title","Test support request","description","Test details"));
        status(result,201);
        return UUID.fromString(data(result).path("id").asText());
    }

    private MvcResult transition(UUID id, String token, String target) throws Exception {
        long version = data(call("GET","/api/v1/service-requests/"+id,token,null)).path("version").asLong();
        return call("PUT","/api/v1/service-requests/"+id+"/status",token,Map.of("status",target,"version",version,"comment","Test resolution"));
    }

    @Test
    void requesterCancelsOpenTicketAndAcceptsResolutionWhileAgentCannotSelfApprove() throws Exception {
        String requester = token(employee); String assigned = token(agent); String administrator = token(admin);
        UUID cancelled = ticket(requester);
        status(transition(cancelled,requester,"CANCELLED"),200);
        UUID id = ticket(requester);
        status(call("POST","/api/v1/service-requests/"+id+"/assignments",administrator,Map.of("assigneeId",agent.getId())),200);
        status(transition(id,assigned,"IN_PROGRESS"),200);
        status(transition(id,assigned,"RESOLVED"),200);
        assertThat(data(call("GET","/api/v1/service-requests/"+id,requester,null)).path("allowedActions").toString()).contains("CONFIRM");
        status(transition(id,assigned,"CLOSED"),403);
        status(transition(id,requester,"CLOSED"),200);
        status(call("POST","/api/v1/service-requests/"+id+"/assignments",administrator,Map.of("assigneeId",pmA.getId())),400);
    }
}
