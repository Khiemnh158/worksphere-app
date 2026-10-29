package com.worksphere.identity;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.domain.*;
import com.worksphere.identity.infrastructure.persistence.*;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.service_request.domain.*;
import com.worksphere.service_request.infrastructure.persistence.ServiceCategoryRepository;
import com.worksphere.shared.security.JwtService;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.*;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.*;
import java.util.*;
import java.util.concurrent.*;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "WORKSPHERE_AUTHZ_TEST_JDBC_URL", matches = ".+")
class WorkplacePostgresTest {
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry p) {
        p.add("spring.datasource.url", () -> System.getenv("WORKSPHERE_AUTHZ_TEST_JDBC_URL"));
        p.add("spring.datasource.username", () -> System.getenv("WORKSPHERE_AUTHZ_TEST_DB_USER"));
        p.add(
                "spring.datasource.password",
                () -> System.getenv("WORKSPHERE_AUTHZ_TEST_DB_PASSWORD"));
        p.add(
                "worksphere.jwt.secret",
                () -> "authorization-integration-test-signing-key-not-for-production");
        p.add("worksphere.dev.e2e-user.enabled", () -> "false");
        p.add("worksphere.web-demo.enabled", () -> "false");
        p.add("worksphere.notification.scheduling.enabled", () -> "false");
        p.add("worksphere.storage.path", () -> "target/authz-test-uploads");
    }

    @Autowired WebApplicationContext context;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired LoginSessionRepository sessions;
    @Autowired DepartmentRepository departments;
    @Autowired ServiceCategoryRepository categories;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate db;
    MockMvc mvc;
    ObjectMapper json = new ObjectMapper();
    User admin, manager, otherManager, employee, replacement, outsider, hr;
    UUID department, otherDepartment, category;
    String a, m, o, e, b, x, h;

    @BeforeEach
    void fixtures() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var d =
                departments.saveAndFlush(
                        Department.create(
                                UUID.randomUUID(),
                                "WP-" + UUID.randomUUID().toString().substring(0, 8),
                                "IT fixture",
                                null,
                                null,
                                null));
        department = d.getId();
        var d2 =
                departments.saveAndFlush(
                        Department.create(
                                UUID.randomUUID(),
                                "WP-" + UUID.randomUUID().toString().substring(0, 8),
                                "Other fixture",
                                null,
                                null,
                                null));
        otherDepartment = d2.getId();
        admin = user("ADMIN", null);
        manager = user("EMPLOYEE", department);
        otherManager = user("EMPLOYEE", otherDepartment);
        employee = user("EMPLOYEE", department);
        replacement = user("EMPLOYEE", department);
        outsider = user("EMPLOYEE", otherDepartment);
        hr = user("EMPLOYEE", otherDepartment);
        d.update(d.getName(), null, null, manager.getId());
        departments.saveAndFlush(d);
        d2.update(d2.getName(), null, null, otherManager.getId());
        departments.saveAndFlush(d2);
        db.update(
                "INSERT INTO staff_capabilities(user_id,capability,granted_by) VALUES"
                        + " (?,'HR_MANAGE',?)",
                hr.getId(),
                admin.getId());
        var c =
                ServiceCategory.create(
                        UUID.randomUUID(),
                        null,
                        "WP-" + UUID.randomUUID().toString().substring(0, 8),
                        "IT support",
                        null,
                        ServicePriority.MEDIUM,
                        true,
                        Instant.now());
        c.routeTo(department);
        categories.saveAndFlush(c);
        category = c.getId();
        a = token(admin);
        m = token(manager);
        o = token(otherManager);
        e = token(employee);
        b = token(replacement);
        x = token(outsider);
        h = token(hr);
    }

    User user(String role, UUID dept) {
        String name = "web-" + UUID.randomUUID().toString().substring(0, 12);
        var user =
                User.create(
                        UUID.randomUUID(),
                        name,
                        name + "@example.invalid",
                        encoder.encode("Test-only-password-123"),
                        name);
        user.updateDepartmentId(dept);
        user.lock();
        user.unlock();
        users.saveAndFlush(user);
        db.update(
                "INSERT INTO user_roles(user_id,role_id,assigned_at) SELECT ?,id,now() FROM roles"
                        + " WHERE code=?",
                user.getId(),
                role);
        return user;
    }

    String token(User u) {
        UUID id = UUID.randomUUID();
        sessions.saveAndFlush(
                LoginSession.create(id, u.getId(), null, "test", "127.0.0.1", "JUnit"));
        return jwt.generateAccessToken(u.getId(), id);
    }

    MvcResult call(String method, String path, String token, Object body) throws Exception {
        if (path.matches("/service-requests/[a-f0-9-]+/assignments")
                && body instanceof Map<?, ?> original
                && !original.containsKey("version")) {
            Map<String, Object> versioned = new LinkedHashMap<>();
            original.forEach((key, value) -> versioned.put(String.valueOf(key), value));
            versioned.put(
                    "version",
                    db.queryForObject(
                            "SELECT version FROM service_requests WHERE id=?",
                            Long.class,
                            UUID.fromString(path.split("/")[2])));
            body = versioned;
        }
        var req =
                request(HttpMethod.valueOf(method), "/api/v1" + path)
                        .contentType(MediaType.APPLICATION_JSON);
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.content(json.writeValueAsString(body));
        return mvc.perform(req).andReturn();
    }

    JsonNode data(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString()).path("data");
    }

    void status(MvcResult r, int expected) {
        assertThat(r.getResponse().getStatus())
                .as("HTTP status; body omitted to protect tokens")
                .isEqualTo(expected);
    }

    UUID work() throws Exception {
        var r =
                call(
                        "POST",
                        "/workplace/work",
                        m,
                        Map.of(
                                "departmentId",
                                department,
                                "title",
                                "Continue preparation",
                                "description",
                                "Keep history and progress",
                                "priority",
                                "HIGH",
                                "assigneeId",
                                employee.getId(),
                                "dueAt",
                                Instant.now().plusSeconds(86400).toString()));
        status(r, 200);
        return UUID.fromString(data(r).path("id").asText());
    }

    JsonNode command(UUID work, String token, String action, long version, Object... pairs)
            throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("action", action);
        body.put("version", version);
        for (int i = 0; i < pairs.length; i += 2) body.put((String) pairs[i], pairs[i + 1]);
        var r = call("POST", "/workplace/work/" + work + "/commands", token, body);
        status(r, 200);
        return data(r);
    }

    UUID ticket() throws Exception {
        var r =
                call(
                        "POST",
                        "/service-requests",
                        x,
                        Map.of(
                                "categoryId",
                                category,
                                "title",
                                "Computer issue",
                                "description",
                                "Please inspect",
                                "priority",
                                "MEDIUM"));
        status(r, 201);
        return UUID.fromString(data(r).path("id").asText());
    }

    @Test
    void departmentScopeCannotBeForgedAndAdminIsNotDefaultBusinessReader() throws Exception {
        UUID id = work();
        status(call("GET", "/workplace/work/" + id, x, null), 403);
        status(call("GET", "/workplace/work/" + id, o, null), 403);
        status(call("GET", "/workplace/work/" + id, a, null), 403);
        assertThat(data(call("GET", "/workplace/work", x, null)).toString())
                .doesNotContain(id.toString());
        status(
                call(
                        "POST",
                        "/workplace/work",
                        o,
                        Map.of(
                                "departmentId",
                                department,
                                "title",
                                "Forged",
                                "description",
                                "Wrong manager",
                                "priority",
                                "HIGH",
                                "assigneeId",
                                employee.getId(),
                                "dueAt",
                                Instant.now().plusSeconds(86400).toString())),
                403);
    }

    @Test
    void handoverKeeps65PercentAndOriginalHistoryThenRequiresReview() throws Exception {
        UUID id = work();
        var started = command(id, e, "START", 0);
        var progressed =
                command(
                        id,
                        e,
                        "PROGRESS",
                        started.path("version").asLong(),
                        "progress",
                        65,
                        "content",
                        "Lan completed setup");
        var handed =
                command(
                        id,
                        m,
                        "HANDOVER",
                        progressed.path("version").asLong(),
                        "userId",
                        replacement.getId(),
                        "content",
                        "Continue and inspect Lan work");
        status(call("GET", "/workplace/work/" + id, e, null), 403);
        status(
                call(
                        "POST",
                        "/workplace/work/" + id + "/commands",
                        b,
                        Map.of(
                                "action",
                                "SUBMIT",
                                "version",
                                handed.path("version").asLong(),
                                "content",
                                "Skip review")),
                403);
        var accepted =
                command(
                        id,
                        b,
                        "ACCEPT_HANDOVER",
                        handed.path("version").asLong(),
                        "content",
                        "Reviewed existing work; verify software next");
        assertThat(accepted.path("progress").asInt()).isEqualTo(65);
        assertThat(accepted.path("events").toString())
                .contains(employee.getFullName(), "Lan completed setup");
        assertThat(accepted.path("handovers").get(0).path("progress_snapshot").asInt())
                .isEqualTo(65);
        var submitted =
                command(
                        id,
                        b,
                        "SUBMIT",
                        accepted.path("version").asLong(),
                        "content",
                        "All checks complete");
        status(
                call(
                        "POST",
                        "/workplace/work/" + id + "/commands",
                        b,
                        Map.of("action", "APPROVE", "version", submitted.path("version").asLong())),
                403);
        assertThat(
                        command(id, m, "APPROVE", submitted.path("version").asLong())
                                .path("status")
                                .asText())
                .isEqualTo("COMPLETED");
    }

    @Test
    void staleVersionAndParallelCommandsCannotOverwriteProgress() throws Exception {
        UUID id = work();
        command(id, e, "START", 0);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch go = new CountDownLatch(1);
        try {
            var f1 =
                    pool.submit(
                            () -> {
                                go.await();
                                return call(
                                                "POST",
                                                "/workplace/work/" + id + "/commands",
                                                e,
                                                Map.of(
                                                        "action",
                                                        "PROGRESS",
                                                        "version",
                                                        1,
                                                        "progress",
                                                        35))
                                        .getResponse()
                                        .getStatus();
                            });
            var f2 =
                    pool.submit(
                            () -> {
                                go.await();
                                return call(
                                                "POST",
                                                "/workplace/work/" + id + "/commands",
                                                e,
                                                Map.of(
                                                        "action",
                                                        "PROGRESS",
                                                        "version",
                                                        1,
                                                        "progress",
                                                        65))
                                        .getResponse()
                                        .getStatus();
                            });
            go.countDown();
            assertThat(List.of(f1.get(20, TimeUnit.SECONDS), f2.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(200, 409);
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void routedTicketVisibleOnlyToRequesterHandlerAndReceivingManager() throws Exception {
        UUID id = ticket();
        status(call("GET", "/service-requests/" + id, m, null), 200);
        status(call("GET", "/service-requests/" + id, e, null), 403);
        status(call("GET", "/service-requests/" + id, o, null), 403);
        status(call("GET", "/service-requests/" + id, a, null), 403);
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        o,
                        Map.of("assigneeId", outsider.getId())),
                403);
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        m,
                        Map.of("assigneeId", outsider.getId())),
                422);
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        m,
                        Map.of("assigneeId", employee.getId())),
                200);
        status(call("GET", "/service-requests/" + id, e, null), 200);
        assertThat(data(call("GET", "/workplace/requests?scope=queue", o, null)).toString())
                .doesNotContain(id.toString());
    }

    @Test
    void requestRunsFromDepartmentQueueThroughRequesterAcceptance() throws Exception {
        UUID id = ticket();
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        m,
                        Map.of("assigneeId", employee.getId())),
                200);
        for (String next : List.of("IN_PROGRESS", "RESOLVED")) {
            long v = data(call("GET", "/service-requests/" + id, e, null)).path("version").asLong();
            status(
                    call(
                            "PUT",
                            "/service-requests/" + id + "/status",
                            e,
                            Map.of("status", next, "comment", "Checked", "version", v)),
                    200);
        }
        long v = data(call("GET", "/service-requests/" + id, x, null)).path("version").asLong();
        status(
                call(
                        "PUT",
                        "/service-requests/" + id + "/status",
                        e,
                        Map.of("status", "CLOSED", "version", v)),
                403);
        status(
                call(
                        "PUT",
                        "/service-requests/" + id + "/status",
                        x,
                        Map.of("status", "CLOSED", "version", v)),
                200);
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        m,
                        Map.of("assigneeId", replacement.getId())),
                400);
    }

    @Test
    void informationAndTransferMoveQueueWithoutLeakingToPreviousManager() throws Exception {
        UUID id = ticket();
        long v = data(call("GET", "/service-requests/" + id, m, null)).path("version").asLong();
        status(
                call(
                        "POST",
                        "/workplace/requests/" + id + "/dispatch",
                        m,
                        Map.of(
                                "action",
                                "DISPATCH_INFO",
                                "reason",
                                "Need device details",
                                "version",
                                v)),
                200);
        var cat =
                ServiceCategory.create(
                        UUID.randomUUID(),
                        null,
                        "WP-" + UUID.randomUUID().toString().substring(0, 8),
                        "Other support",
                        null,
                        ServicePriority.MEDIUM,
                        true,
                        Instant.now());
        cat.routeTo(otherDepartment);
        categories.saveAndFlush(cat);
        v = data(call("GET", "/service-requests/" + id, m, null)).path("version").asLong();
        status(
                call(
                        "POST",
                        "/workplace/requests/" + id + "/dispatch",
                        m,
                        Map.of(
                                "action",
                                "TRANSFER",
                                "reason",
                                "Wrong department",
                                "categoryId",
                                cat.getId(),
                                "version",
                                v)),
                200);
        status(call("GET", "/service-requests/" + id, m, null), 403);
        status(call("GET", "/service-requests/" + id, o, null), 200);
    }

    @Test
    void declineNeedsReasonAndCannotBeAssignedAfterward() throws Exception {
        UUID id = ticket();
        long v = data(call("GET", "/service-requests/" + id, m, null)).path("version").asLong();
        status(
                call(
                        "POST",
                        "/workplace/requests/" + id + "/dispatch",
                        m,
                        Map.of("action", "DECLINE", "reason", "", "version", v)),
                422);
        status(
                call(
                        "POST",
                        "/workplace/requests/" + id + "/dispatch",
                        m,
                        Map.of(
                                "action",
                                "DECLINE",
                                "reason",
                                "Outside agreed service scope",
                                "version",
                                v)),
                200);
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        m,
                        Map.of("assigneeId", employee.getId())),
                400);
    }

    @Test
    void offboardingRequiresHrCapabilityRevokesSessionsAndKeepsWork() throws Exception {
        UUID id = work();
        command(id, e, "START", 0);
        command(id, e, "PROGRESS", 1, "progress", 65);
        long v =
                db.queryForObject(
                        "SELECT version FROM users WHERE id=?", Long.class, employee.getId());
        var body =
                Map.of(
                        "action",
                        "DISABLE",
                        "content",
                        "Authorized practice decision",
                        "version",
                        v);
        status(call("POST", "/workplace/staff/" + employee.getId() + "/state", a, body), 403);
        status(call("POST", "/workplace/staff/" + employee.getId() + "/state", h, body), 200);
        status(call("GET", "/workplace/context", e, null), 401);
        var work = data(call("GET", "/workplace/work/" + id, m, null));
        assertThat(work.path("progress").asInt()).isEqualTo(65);
        assertThat(work.path("status").asText()).isEqualTo("HANDOVER");
        assertThat(
                        db.queryForObject(
                                "SELECT count(*) FROM users WHERE id=?",
                                Integer.class,
                                employee.getId()))
                .isEqualTo(1);
    }

    @Test
    void adminDoesNotAutomaticallyReceiveHrAccess() throws Exception {
        status(call("GET", "/workplace/hr-staff", a, null), 403);
        status(call("GET", "/workplace/hr-staff", h, null), 200);
        status(call("GET", "/workplace/staff", h, null), 403);
        status(call("GET", "/workplace/audit", h, null), 403);
    }

    @Test
    void departmentCannotStopWithOpenWorkAndManagerMustBelongToIt() throws Exception {
        work();
        long v =
                db.queryForObject(
                        "SELECT version FROM departments WHERE id=?", Long.class, department);
        status(
                call(
                        "PUT",
                        "/workplace/departments/" + department,
                        a,
                        Map.of(
                                "name",
                                "IT fixture",
                                "managerId",
                                manager.getId(),
                                "active",
                                false,
                                "version",
                                v)),
                422);
        status(
                call(
                        "PUT",
                        "/workplace/departments/" + department,
                        a,
                        Map.of(
                                "name",
                                "IT fixture",
                                "managerId",
                                otherManager.getId(),
                                "active",
                                true,
                                "version",
                                v)),
                422);
        status(call("PUT", "/admin/departments/" + department + "/deactivate", a, null), 422);
    }

    @Test
    void staffCannotTransferAwayLeavingOpenResponsibilities() throws Exception {
        work();
        long v =
                db.queryForObject(
                        "SELECT version FROM users WHERE id=?", Long.class, employee.getId());
        status(
                call(
                        "PUT",
                        "/workplace/staff/" + employee.getId(),
                        a,
                        Map.of(
                                "departmentId",
                                otherDepartment,
                                "role",
                                "EMPLOYEE",
                                "capabilities",
                                List.of(),
                                "reason",
                                "Transfer",
                                "version",
                                v)),
                422);
        status(
                call(
                        "PUT",
                        "/admin/users/" + employee.getId(),
                        a,
                        Map.of(
                                "fullName",
                                employee.getFullName(),
                                "departmentId",
                                otherDepartment,
                                "roleCodes",
                                List.of("EMPLOYEE"))),
                422);
    }

    @Test
    void profileContainsDepartmentAndPasswordChangeRevokesEverySession() throws Exception {
        assertThat(data(call("GET", "/me", e, null)).path("department").path("id").asText())
                .isEqualTo(department.toString());
        String second = token(employee);
        status(
                call(
                        "PUT",
                        "/me/password",
                        e,
                        Map.of(
                                "currentPassword",
                                "Test-only-password-123",
                                "newPassword",
                                "New-test-only-password-456",
                                "confirmPassword",
                                "New-test-only-password-456")),
                200);
        status(call("GET", "/me", e, null), 401);
        status(call("GET", "/me", second, null), 401);
    }

    @Test
    void workFileIsAvailableOnlyToItsParticipantsAndCannotBeDeletedWhenLinked() throws Exception {
        UUID work = work();
        var file =
                new org.springframework.mock.web.MockMultipartFile(
                        "file",
                        "review.pdf",
                        "application/pdf",
                        "%PDF-1.4\nEvidence of work\n%%EOF"
                                .getBytes(java.nio.charset.StandardCharsets.UTF_8));
        var upload =
                mvc.perform(
                                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                        .multipart("/api/v1/files")
                                        .file(file)
                                        .param("purpose", "TASK_ATTACHMENT")
                                        .header("Authorization", "Bearer " + e))
                        .andReturn();
        status(upload, 201);
        UUID fileId = UUID.fromString(data(upload).path("id").asText());
        command(work, e, "COMMENT", 0, "content", "Evidence attached", "fileIds", List.of(fileId));
        status(call("GET", "/files/" + fileId + "/download", e, null), 200);
        status(call("GET", "/files/" + fileId + "/download", m, null), 200);
        status(call("GET", "/files/" + fileId + "/download", a, null), 403);
        status(call("GET", "/files/" + fileId + "/download", x, null), 403);
        status(call("DELETE", "/files/" + fileId, a, null), 422);
    }

    @Test
    void parallelAssignmentsUseVersionAndLeaveOneActiveHandler() throws Exception {
        UUID request = ticket();
        long version =
                db.queryForObject(
                        "SELECT version FROM service_requests WHERE id=?", Long.class, request);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch go = new CountDownLatch(1);
        try {
            var first =
                    pool.submit(
                            () -> {
                                go.await();
                                return call(
                                                "POST",
                                                "/service-requests/" + request + "/assignments",
                                                m,
                                                Map.of(
                                                        "assigneeId",
                                                        employee.getId(),
                                                        "version",
                                                        version))
                                        .getResponse()
                                        .getStatus();
                            });
            var second =
                    pool.submit(
                            () -> {
                                go.await();
                                return call(
                                                "POST",
                                                "/service-requests/" + request + "/assignments",
                                                m,
                                                Map.of(
                                                        "assigneeId",
                                                        replacement.getId(),
                                                        "version",
                                                        version))
                                        .getResponse()
                                        .getStatus();
                            });
            go.countDown();
            assertThat(List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(200, 409);
        } finally {
            pool.shutdownNow();
        }
        assertThat(
                        db.queryForObject(
                                "SELECT count(*) FROM service_assignments WHERE request_id=? AND"
                                        + " is_active",
                                Integer.class,
                                request))
                .isEqualTo(1);
    }

    @Test
    void cancellationAfterAssignmentRequiresIndependentManagerReview() throws Exception {
        UUID id = ticket();
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        m,
                        Map.of("assigneeId", employee.getId())),
                200);
        long v =
                db.queryForObject(
                        "SELECT version FROM service_requests WHERE id=?", Long.class, id);
        status(
                call(
                        "POST",
                        "/workplace/requests/" + id + "/operations",
                        x,
                        Map.of(
                                "action",
                                "REQUEST_CANCEL",
                                "reason",
                                "No longer needed",
                                "version",
                                v)),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT status FROM service_requests WHERE id=?", String.class, id))
                .isEqualTo("ASSIGNED");
        v = db.queryForObject("SELECT version FROM service_requests WHERE id=?", Long.class, id);
        status(
                call(
                        "POST",
                        "/workplace/requests/" + id + "/operations",
                        e,
                        Map.of(
                                "action",
                                "APPROVE_CANCEL",
                                "reason",
                                "Handler cannot decide",
                                "version",
                                v)),
                403);
        status(
                call(
                        "POST",
                        "/workplace/requests/" + id + "/operations",
                        m,
                        Map.of(
                                "action",
                                "APPROVE_CANCEL",
                                "reason",
                                "Reviewed remaining work",
                                "version",
                                v)),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT status FROM service_requests WHERE id=?", String.class, id))
                .isEqualTo("CANCELLED");
    }

    @Test
    void reassignedHandlerMustReviewPreviousWorkBeforeResolving() throws Exception {
        UUID id = ticket();
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        m,
                        Map.of("assigneeId", employee.getId())),
                200);
        long v =
                db.queryForObject(
                        "SELECT version FROM service_requests WHERE id=?", Long.class, id);
        status(
                call(
                        "PUT",
                        "/service-requests/" + id + "/status",
                        e,
                        Map.of("status", "IN_PROGRESS", "version", v)),
                200);
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        m,
                        Map.of("assigneeId", replacement.getId())),
                200);
        var detail = data(call("GET", "/service-requests/" + id, b, null));
        assertThat(detail.path("status").asText()).isEqualTo("IN_PROGRESS");
        assertThat(detail.path("allowedActions").toString())
                .contains("REVIEW_HANDOVER")
                .doesNotContain("RESOLVE");
        v = detail.path("version").asLong();
        status(
                call(
                        "PUT",
                        "/service-requests/" + id + "/status",
                        b,
                        Map.of("status", "RESOLVED", "comment", "Skipped review", "version", v)),
                403);
        status(
                call(
                        "POST",
                        "/workplace/requests/" + id + "/operations",
                        b,
                        Map.of(
                                "action",
                                "REVIEW_HANDOVER",
                                "reason",
                                "Reviewed previous results and remaining issue",
                                "version",
                                v)),
                200);
        v = data(call("GET", "/service-requests/" + id, b, null)).path("version").asLong();
        status(
                call(
                        "PUT",
                        "/service-requests/" + id + "/status",
                        b,
                        Map.of("status", "RESOLVED", "comment", "Checked and fixed", "version", v)),
                200);
        status(call("GET", "/service-requests/" + id, e, null), 403);
    }

    @Test
    void maximumTitleAndDecisionNoteAreRetainedWithoutBreakingNotifications() throws Exception {
        status(
                call(
                        "POST",
                        "/workplace/work",
                        m,
                        Map.of(
                                "departmentId",
                                department,
                                "title",
                                "V".repeat(255),
                                "description",
                                "Boundary case",
                                "priority",
                                "MEDIUM",
                                "assigneeId",
                                employee.getId(),
                                "dueAt",
                                Instant.now().plusSeconds(86400).toString())),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT max(length(title)) FROM workplace_notices WHERE user_id=?",
                                Integer.class,
                                employee.getId()))
                .isLessThanOrEqualTo(255);
        UUID id = ticket();
        status(
                call(
                        "POST",
                        "/service-requests/" + id + "/assignments",
                        m,
                        Map.of("assigneeId", employee.getId())),
                200);
        long v =
                db.queryForObject(
                        "SELECT version FROM service_requests WHERE id=?", Long.class, id);
        status(
                call(
                        "POST",
                        "/workplace/requests/" + id + "/operations",
                        x,
                        Map.of(
                                "action",
                                "REQUEST_CANCEL",
                                "reason",
                                "Evidence " + "x".repeat(1991),
                                "version",
                                v)),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT max(length(comment)) FROM service_status_histories WHERE"
                                        + " request_id=?",
                                Integer.class,
                                id))
                .isGreaterThanOrEqualTo(2000);
    }

    void timeSetup() throws Exception {
        db.update(
                "INSERT INTO staff_capabilities(user_id,capability,granted_by) VALUES"
                        + " (?,'TIME_REVIEW',?),(?,'PAYROLL_MANAGE',?)",
                hr.getId(),
                admin.getId(),
                hr.getId(),
                admin.getId());
        if (db.queryForObject(
                        "SELECT count(*) FROM work_calendar WHERE work_date BETWEEN '2020-02-01'"
                                + " AND '2020-02-29'",
                        Integer.class)
                == 0)
            status(
                    call(
                            "PUT",
                            "/workplace/time/calendar",
                            h,
                            Map.of(
                                    "period",
                                    "2020-02",
                                    "weekdays",
                                    List.of(1, 2, 3, 4, 5),
                                    "shiftStart",
                                    "08:00",
                                    "shiftEnd",
                                    "17:00",
                                    "breakMinutes",
                                    60,
                                    "holidays",
                                    List.of("2020-02-06"))),
                    200);
    }

    UUID timeRequest(String type, String start, String end, int minutes) throws Exception {
        status(
                call(
                        "POST",
                        "/workplace/time/requests",
                        e,
                        Map.of(
                                "requestType",
                                type,
                                "workDate",
                                "2020-02-03",
                                "startsAt",
                                start,
                                "endsAt",
                                end,
                                "requestedMinutes",
                                minutes,
                                "reason",
                                "Practice request with evidence")),
                200);
        return db.queryForObject(
                "SELECT id FROM staff_time_requests WHERE user_id=? AND request_type=?",
                UUID.class,
                employee.getId(),
                type);
    }

    void reviewTime(UUID id, String action, long version, Integer actual) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("action", action);
        body.put("reason", "Reviewed evidence");
        body.put("version", version);
        if (actual != null) body.put("actualMinutes", actual);
        status(call("POST", "/workplace/time/requests/" + id + "/review", m, body), 200);
    }

    UUID income(String date) throws Exception {
        var result =
                call(
                        "PUT",
                        "/workplace/time/incomes",
                        h,
                        Map.of(
                                "userId",
                                employee.getId(),
                                "period",
                                "2020-02",
                                "monthlyWorkPay",
                                10000000,
                                "employmentFrom",
                                date,
                                "employmentTo",
                                date));
        status(result, 200);
        return UUID.fromString(data(result).asText());
    }

    @Test
    void overtimeOnlyIncreasesIncomeAfterActualAttendanceConfirmation() throws Exception {
        timeSetup();
        var correction =
                timeRequest("TIME_CORRECTION", "2020-02-03T01:00:00Z", "2020-02-03T13:00:00Z", 480);
        reviewTime(correction, "APPROVE", 0, null);
        var overtime = timeRequest("OVERTIME", "2020-02-03T11:00:00Z", "2020-02-03T13:00:00Z", 120);
        reviewTime(overtime, "APPROVE", 0, null);
        income("2020-02-03");
        var before =
                data(call("GET", "/workplace/time/incomes?period=2020-02", e, null))
                        .get(0)
                        .path("calculation");
        assertThat(before.path("overtimePay").asInt()).isZero();
        assertThat(before.path("pendingItems").asInt()).isPositive();
        reviewTime(overtime, "CONFIRM", 1, 120);
        var after =
                data(call("GET", "/workplace/time/incomes?period=2020-02", e, null))
                        .get(0)
                        .path("calculation");
        assertThat(after.path("basePay").asInt()).isEqualTo(500000);
        assertThat(after.path("overtimePay").asInt()).isEqualTo(187500);
        assertThat(after.path("grossEstimate").asInt()).isEqualTo(687500);
        assertThat(data(call("GET", "/workplace/time/incomes?period=2020-02", a, null))).isEmpty();
    }

    @Test
    void missingAttendanceCannotBeSilentlyClosedAsZeroPay() throws Exception {
        timeSetup();
        UUID income = income("2020-02-03");
        var calculation =
                data(call("GET", "/workplace/time/incomes?period=2020-02", e, null))
                        .get(0)
                        .path("calculation");
        assertThat(calculation.path("missingDays").asInt()).isEqualTo(1);
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + income + "/lock",
                        h,
                        Map.of("reason", "Review", "version", 0)),
                422);
    }

    @Test
    void closingIncomeLocksSourceDataAndSnapshot() throws Exception {
        timeSetup();
        var correction =
                timeRequest("TIME_CORRECTION", "2020-02-03T01:00:00Z", "2020-02-03T10:00:00Z", 480);
        reviewTime(correction, "APPROVE", 0, null);
        UUID income = income("2020-02-03");
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + income + "/lock",
                        h,
                        Map.of("reason", "Month checked", "version", 0)),
                200);
        var before =
                db.queryForObject(
                        "SELECT snapshot FROM income_periods WHERE id=?", String.class, income);
        status(
                call(
                        "POST",
                        "/workplace/time/requests",
                        e,
                        Map.of(
                                "requestType",
                                "LEAVE_UNPAID",
                                "workDate",
                                "2020-02-03",
                                "startsAt",
                                "2020-02-03T01:00:00Z",
                                "endsAt",
                                "2020-02-03T10:00:00Z",
                                "requestedMinutes",
                                480,
                                "reason",
                                "Attempt after lock")),
                422);
        assertThat(
                        db.queryForObject(
                                "SELECT snapshot FROM income_periods WHERE id=?",
                                String.class,
                                income))
                .isEqualTo(before);
    }

    @Test
    void employeeCannotImportClockRecordsOrApproveOwnRequest() throws Exception {
        timeSetup();
        status(
                call(
                        "POST",
                        "/workplace/time/imports",
                        e,
                        List.of(
                                Map.of(
                                        "userId",
                                        employee.getId(),
                                        "workDate",
                                        "2020-02-03",
                                        "clockIn",
                                        "2020-02-03T01:00:00Z",
                                        "clockOut",
                                        "2020-02-03T10:00:00Z",
                                        "regularMinutes",
                                        480,
                                        "sourceReference",
                                        "Forged import"))),
                403);
        var correction =
                timeRequest("TIME_CORRECTION", "2020-02-03T01:00:00Z", "2020-02-03T10:00:00Z", 480);
        status(
                call(
                        "POST",
                        "/workplace/time/requests/" + correction + "/review",
                        e,
                        Map.of("action", "APPROVE", "reason", "Self approval", "version", 0)),
                403);
        status(
                call(
                        "POST",
                        "/workplace/time/requests/" + correction + "/review",
                        o,
                        Map.of("action", "APPROVE", "reason", "Wrong manager", "version", 0)),
                403);
    }

    @Test
    void paidLeaveNeedsConfirmedBalanceAndCannotOverlapAttendance() throws Exception {
        timeSetup();
        var leave = timeRequest("LEAVE_PAID", "2020-02-03T01:00:00Z", "2020-02-03T10:00:00Z", 480);
        status(
                call(
                        "POST",
                        "/workplace/time/requests/" + leave + "/review",
                        m,
                        Map.of("action", "APPROVE", "reason", "No entitlement yet", "version", 0)),
                422);
        status(
                call(
                        "PUT",
                        "/workplace/time/leave-balances",
                        h,
                        Map.of(
                                "userId",
                                employee.getId(),
                                "year",
                                2020,
                                "allowanceMinutes",
                                480,
                                "reason",
                                "Entitlement confirmed")),
                200);
        reviewTime(leave, "APPROVE", 0, null);
        income("2020-02-03");
        assertThat(
                        data(call("GET", "/workplace/time/incomes?period=2020-02", e, null))
                                .get(0)
                                .path("calculation")
                                .path("basePay")
                                .asInt())
                .isEqualTo(500000);
        status(
                call(
                        "POST",
                        "/workplace/time/imports",
                        h,
                        List.of(
                                Map.of(
                                        "userId",
                                        employee.getId(),
                                        "workDate",
                                        "2020-02-03",
                                        "clockIn",
                                        "2020-02-03T01:00:00Z",
                                        "clockOut",
                                        "2020-02-03T10:00:00Z",
                                        "regularMinutes",
                                        480,
                                        "sourceReference",
                                        "Practice import"))),
                200);
        UUID record =
                db.queryForObject(
                        "SELECT id FROM attendance_records WHERE user_id=?",
                        UUID.class,
                        employee.getId());
        status(
                call(
                        "POST",
                        "/workplace/time/records/" + record + "/review",
                        m,
                        Map.of("action", "APPROVE", "reason", "Overlapping leave", "version", 0)),
                422);
        var correction =
                timeRequest("TIME_CORRECTION", "2020-02-03T01:00:00Z", "2020-02-03T10:00:00Z", 480);
        status(
                call(
                        "POST",
                        "/workplace/time/requests/" + correction + "/review",
                        m,
                        Map.of(
                                "action",
                                "APPROVE",
                                "reason",
                                "Correction overlaps paid leave",
                                "version",
                                0)),
                422);
    }

    @Test
    void overtimeCannotOverlapNormalShiftOrBeConfirmedWithoutClockEvidence() throws Exception {
        timeSetup();
        status(
                call(
                        "POST",
                        "/workplace/time/requests",
                        e,
                        Map.of(
                                "requestType",
                                "OVERTIME",
                                "workDate",
                                "2020-02-03",
                                "startsAt",
                                "2020-02-03T02:00:00Z",
                                "endsAt",
                                "2020-02-03T04:00:00Z",
                                "requestedMinutes",
                                120,
                                "reason",
                                "Inside shift")),
                422);
        var overtime = timeRequest("OVERTIME", "2020-02-03T11:00:00Z", "2020-02-03T13:00:00Z", 120);
        reviewTime(overtime, "APPROVE", 0, null);
        status(
                call(
                        "POST",
                        "/workplace/time/requests/" + overtime + "/review",
                        m,
                        Map.of(
                                "action",
                                "CONFIRM",
                                "actualMinutes",
                                120,
                                "reason",
                                "No attendance",
                                "version",
                                1)),
                422);
        reviewTime(overtime, "CONFIRM", 1, 0);
    }
}
