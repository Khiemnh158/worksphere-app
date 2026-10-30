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
    @Test
    void personalIncomeEndpointNeverReturnsOtherPeopleEvenForPayrollSpecialist() throws Exception {
        timeSetup();
        UUID id = income("2020-02-03");
        assertThat(data(call("GET", "/workplace/time/incomes/mine?period=2020-02", e, null)))
                .isEmpty();
        db.update("UPDATE income_periods SET approval_state='PUBLISHED' WHERE id=?", id);
        db.update(
                "INSERT INTO staff_capabilities(user_id,capability) VALUES (?,'PAYROLL_MANAGE')",
                employee.getId());
        var own = data(call("GET", "/workplace/time/incomes/mine?period=2020-02", e, null));
        assertThat(own).hasSize(1);
        assertThat(own.get(0).path("user_id").asText()).isEqualTo(employee.getId().toString());
        assertThat(data(call("GET", "/workplace/time/incomes/mine?period=2020-02", h, null)))
                .isEmpty();
        assertThat(data(call("GET", "/workplace/time/incomes/mine?period=2020-02", a, null)))
                .isEmpty();
        db.update(
                "INSERT INTO income_adjustments(id,income_id,created_by,reason,amount) VALUES"
                    + " (?,?,?,?,?)",
                UUID.randomUUID(),
                id,
                hr.getId(),
                "Pending review",
                1000);
        assertThat(
                        data(call("GET", "/workplace/time/incomes/mine?period=2020-02", e, null))
                                .get(0)
                                .path("adjustments"))
                .isEmpty();
    }

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
        p.add("worksphere.mail.local-enabled", () -> "false");
        p.add("worksphere.people.scheduling.enabled", () -> "false");
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
        UUID approvedCase = UUID.randomUUID();
        db.update(
                "INSERT INTO"
                    + " personnel_cases(id,user_id,created_by,reason,effective_at,status,approved_by)"
                    + " VALUES (?,?,?,'Authorized fixture',now()-interval '1 second','APPROVED',?)",
                approvedCase,
                employee.getId(),
                manager.getId(),
                otherManager.getId());
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
                "SELECT id FROM staff_time_requests WHERE user_id=? AND request_type=? ORDER BY"
                        + " created_at DESC,id DESC LIMIT 1",
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
        var before = ownIncome().path("calculation");
        assertThat(before.path("overtimePay").asInt()).isZero();
        assertThat(before.path("pendingItems").asInt()).isPositive();
        reviewTime(overtime, "CONFIRM", 1, 120);
        var after = ownIncome().path("calculation");
        assertThat(after.path("basePay").asInt()).isEqualTo(500000);
        assertThat(after.path("overtimePay").asInt()).isEqualTo(187500);
        assertThat(after.path("grossEstimate").asInt()).isEqualTo(687500);
        assertThat(data(call("GET", "/workplace/time/incomes?period=2020-02", a, null))).isEmpty();
    }

    @Test
    void missingAttendanceCannotBeSilentlyClosedAsZeroPay() throws Exception {
        timeSetup();
        UUID income = income("2020-02-03");
        var calculation = ownIncome().path("calculation");
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
        db.update(
                "INSERT INTO staff_capabilities(user_id,capability) VALUES (?,'PAYROLL_APPROVE')",
                otherManager.getId());
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + income + "/commands",
                        h,
                        Map.of("action", "SUBMIT", "reason", "Independent review", "version", 0)),
                200);
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + income + "/commands",
                        o,
                        Map.of("action", "APPROVE", "reason", "Checked", "version", 1)),
                200);
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + income + "/lock",
                        h,
                        Map.of("reason", "Month checked", "version", 2)),
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
        assertThat(ownIncome().path("calculation").path("basePay").asInt()).isEqualTo(500000);
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

    JsonNode ownIncome() throws Exception {
        var rows = data(call("GET", "/workplace/time/incomes?period=2020-02", h, null));
        return java.util.stream.StreamSupport.stream(rows.spliterator(), false)
                .filter(r -> r.path("user_id").asText().equals(employee.getId().toString()))
                .findFirst()
                .orElseThrow();
    }

    @Autowired com.worksphere.workplace.PeopleOperations peopleOperations;
    @Autowired com.worksphere.identity.application.RecoveryService recoveryService;

    String leadership() {
        db.update(
                "INSERT INTO staff_capabilities(user_id,capability) VALUES (?,'EXECUTIVE') ON"
                        + " CONFLICT DO NOTHING",
                otherManager.getId());
        db.update(
                "INSERT INTO department_authority(department_id,executive_id,reason,changed_by)"
                    + " VALUES (?,?,'Test authorized structure',?) ON CONFLICT(department_id) DO"
                    + " UPDATE SET executive_id=excluded.executive_id",
                department,
                otherManager.getId(),
                admin.getId());
        return o;
    }

    @Test
    void directoryIsScopedAndPaginatedOnServer() throws Exception {
        for (int i = 0; i < 22; i++)
            db.update(
                    "INSERT INTO"
                        + " users(id,username,email,password_hash,full_name,status,department_id,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,'ACTIVE',?,now(),now())",
                    UUID.randomUUID(),
                    "dir-" + UUID.randomUUID(),
                    UUID.randomUUID() + "@example.invalid",
                    "not-a-login-hash",
                    "Directory fixture " + i,
                    department);
        var first = data(call("GET", "/workplace/directory", e, null));
        assertThat(first.path("items").size()).isEqualTo(20);
        assertThat(first.path("total").asInt()).isGreaterThan(20);
        for (var person : first.path("items"))
            assertThat(person.path("department_id").asText()).isEqualTo(department.toString());
        var second = data(call("GET", "/workplace/directory?page=1", e, null));
        assertThat(second.path("items").size()).isBetween(1, 20);
        var context = data(call("GET", "/workplace/context", e, null));
        assertThat(context.path("people").toString()).doesNotContain(outsider.getId().toString());
    }

    @Test
    void delegatedOperationsExpireAndDoNotGrantTimeApproval() throws Exception {
        var input =
                Map.of(
                        "departmentId",
                        department,
                        "delegateId",
                        replacement.getId(),
                        "scope",
                        "OPERATIONS",
                        "startsAt",
                        Instant.now().minusSeconds(5).toString(),
                        "endsAt",
                        Instant.now().plusSeconds(3600).toString(),
                        "reason",
                        "Manager away");
        status(call("POST", "/workplace/delegations", e, input), 403);
        status(call("POST", "/workplace/delegations", m, input), 200);
        status(call("GET", "/workplace/delegations", m, null), 200);
        status(call("GET", "/workplace/delegations", b, null), 200);
        UUID id = work();
        status(call("GET", "/workplace/work/" + id, b, null), 200);
        status(call("POST", "/workplace/delegations", b, input), 403);
        db.update(
                "UPDATE approval_delegations SET ends_at=now()-interval '1"
                        + " second',starts_at=now()-interval '1 hour' WHERE delegate_id=?",
                replacement.getId());
        status(call("GET", "/workplace/work/" + id, b, null), 403);
    }

    @Test
    void managerTimeRequestNeedsDesignatedExecutiveNotHrOverride() throws Exception {
        timeSetup();
        leadership();
        status(
                call(
                        "POST",
                        "/workplace/time/requests",
                        m,
                        Map.of(
                                "requestType",
                                "LEAVE_UNPAID",
                                "workDate",
                                "2020-02-04",
                                "startsAt",
                                "2020-02-04T01:00:00Z",
                                "endsAt",
                                "2020-02-04T02:00:00Z",
                                "requestedMinutes",
                                60,
                                "reason",
                                "Manager request")),
                200);
        UUID id =
                db.queryForObject(
                        "SELECT id FROM staff_time_requests WHERE user_id=?",
                        UUID.class,
                        manager.getId());
        var cmd = Map.of("action", "APPROVE", "reason", "Check", "version", 0);
        status(call("POST", "/workplace/time/requests/" + id + "/review", m, cmd), 403);
        status(call("POST", "/workplace/time/requests/" + id + "/review", h, cmd), 403);
        status(call("POST", "/workplace/time/requests/" + id + "/review", o, cmd), 200);
    }

    @Test
    void newAccountMustActivateAndCannotReuseActivation() throws Exception {
        String name = "new-" + UUID.randomUUID().toString().substring(0, 10);
        var result =
                call(
                        "POST",
                        "/workplace/staff",
                        a,
                        Map.of(
                                "username",
                                name,
                                "email",
                                name + "@example.invalid",
                                "fullName",
                                "New employee",
                                "departmentId",
                                department,
                                "role",
                                "EMPLOYEE"));
        status(result, 200);
        UUID id = UUID.fromString(data(result).asText());
        assertThat(db.queryForObject("SELECT status FROM users WHERE id=?", String.class, id))
                .isEqualTo("PENDING");
        var mail =
                db.queryForObject(
                        "SELECT encrypted_body FROM mail_outbox WHERE recipient=? ORDER BY"
                                + " created_at DESC LIMIT 1",
                        String.class,
                        name + "@example.invalid");
        String body = recoveryService.decrypt(mail);
        String token = body.split("/#activate/")[1].split("\\s")[0];
        var activate =
                Map.of(
                        "token",
                        token,
                        "username",
                        name + "x",
                        "fullName",
                        "New verified employee",
                        "password",
                        "Personal-password-123",
                        "confirmPassword",
                        "Personal-password-123");
        status(call("POST", "/auth/activate", null, activate), 200);
        status(call("POST", "/auth/activate", null, activate), 422);
        status(
                call(
                        "POST",
                        "/auth/login",
                        null,
                        Map.of("login", name + "x", "password", "Personal-password-123")),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT email_verified_at IS NOT NULL FROM users WHERE id=?",
                                Boolean.class,
                                id))
                .isTrue();
    }

    @Test
    void resetIsSingleUseRevokesSessionsAndCannotUnlockDisabledAccount() throws Exception {
        db.update("UPDATE users SET email_verified_at=now() WHERE id=?", employee.getId());
        status(
                call("POST", "/auth/forgot-password", null, Map.of("email", employee.getEmail())),
                200);
        String mail =
                db.queryForObject(
                        "SELECT encrypted_body FROM mail_outbox WHERE recipient=? ORDER BY"
                                + " created_at DESC LIMIT 1",
                        String.class,
                        employee.getEmail());
        String token = recoveryService.decrypt(mail).split("/#reset/")[1].split("\\s")[0];
        var reset =
                Map.of(
                        "resetToken",
                        token,
                        "newPassword",
                        "Updated-password-123",
                        "confirmPassword",
                        "Updated-password-123");
        status(call("POST", "/auth/reset-password", null, reset), 200);
        status(call("GET", "/workplace/context", e, null), 401);
        status(call("POST", "/auth/reset-password", null, reset), 422);
        recoveryService.forgot(employee.getEmail());
        db.update("UPDATE users SET status='DISABLED' WHERE id=?", employee.getId());
        String mail2 =
                db.queryForObject(
                        "SELECT encrypted_body FROM mail_outbox WHERE recipient=? AND subject LIKE"
                                + " '%Đặt lại%' ORDER BY created_at DESC LIMIT 1",
                        String.class, employee.getEmail());
        String token2 = recoveryService.decrypt(mail2).split("/#reset/")[1].split("\\s")[0];
        status(
                call(
                        "POST",
                        "/auth/reset-password",
                        null,
                        Map.of(
                                "resetToken",
                                token2,
                                "newPassword",
                                "Updated-password-456",
                                "confirmPassword",
                                "Updated-password-456")),
                422);
    }

    @Test
    void importPreviewDoesNotCreateAndInvalidBatchDoesNotPartiallyCreate() throws Exception {
        String name = "batch-" + UUID.randomUUID().toString().substring(0, 8);
        var row =
                Map.of(
                        "username",
                        name,
                        "email",
                        name + "@example.invalid",
                        "fullName",
                        "Batch employee",
                        "departmentId",
                        department,
                        "role",
                        "EMPLOYEE");
        var preview =
                call(
                        "POST",
                        "/workplace/staff/import",
                        a,
                        Map.of("rows", List.of(row), "preview", true));
        status(preview, 200);
        assertThat(data(preview).path("valid").asBoolean()).isTrue();
        assertThat(
                        db.queryForObject(
                                "SELECT count(*) FROM users WHERE username=?", Integer.class, name))
                .isZero();
        var invalid =
                call(
                        "POST",
                        "/workplace/staff/import",
                        a,
                        Map.of("rows", List.of(row, row), "preview", false));
        status(invalid, 200);
        assertThat(data(invalid).path("valid").asBoolean()).isFalse();
        assertThat(
                        db.queryForObject(
                                "SELECT count(*) FROM users WHERE username=?", Integer.class, name))
                .isZero();
        status(
                call(
                        "POST",
                        "/workplace/staff/import",
                        a,
                        Map.of("rows", List.of(row), "preview", false)),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT activation_required FROM users WHERE username=?",
                                Boolean.class,
                                name))
                .isTrue();
    }

    @Test
    void personnelRequiresHrAndIndependentExecutiveThenCutsOffAtEffectiveTime() throws Exception {
        leadership();
        UUID work = work();
        command(work, e, "START", 0);
        command(work, e, "PROGRESS", 1, "progress", 65);
        var made =
                call(
                        "POST",
                        "/workplace/personnel",
                        e,
                        Map.of(
                                "userId",
                                employee.getId(),
                                "effectiveAt",
                                Instant.now().plusSeconds(3600).toString(),
                                "reason",
                                "Voluntary practice departure"));
        status(made, 200);
        UUID id = UUID.fromString(data(made).asText());
        status(
                call(
                        "POST",
                        "/workplace/personnel/" + id + "/commands",
                        m,
                        Map.of("action", "SUBMIT", "reason", "Check", "version", 0)),
                403);
        status(
                call(
                        "POST",
                        "/workplace/personnel/" + id + "/commands",
                        h,
                        Map.of("action", "SUBMIT", "reason", "Evidence checked", "version", 0)),
                200);
        status(
                call(
                        "POST",
                        "/workplace/personnel/" + id + "/commands",
                        a,
                        Map.of("action", "APPROVE", "reason", "Decision", "version", 1)),
                403);
        status(
                call(
                        "POST",
                        "/workplace/personnel/" + id + "/commands",
                        o,
                        Map.of(
                                "action",
                                "APPROVE",
                                "reason",
                                "Authorized decision fixture",
                                "version",
                                1)),
                200);
        status(call("GET", "/workplace/context", e, null), 200);
        db.update(
                "UPDATE users SET access_ends_at=now()-interval '1 second' WHERE id=?",
                employee.getId());
        db.update(
                "UPDATE personnel_cases SET effective_at=now()-interval '1 second' WHERE id=?", id);
        status(call("GET", "/workplace/context", e, null), 401);
        peopleOperations.enforceDue();
        var row =
                db.queryForMap(
                        "SELECT progress,status,assignee_id FROM department_work WHERE id=?", work);
        assertThat(row.get("progress")).isEqualTo(65);
        assertThat(row.get("status")).isEqualTo("HANDOVER");
        assertThat(row.get("assignee_id")).isNull();
        UUID request =
                db.queryForObject(
                        "SELECT id FROM access_requests WHERE personnel_case_id=?", UUID.class, id);
        status(
                call(
                        "POST",
                        "/workplace/access-requests/" + request + "/commands",
                        a,
                        Map.of("action", "EXECUTE", "reason", "Access reviewed", "version", 0)),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT access_done FROM personnel_cases WHERE id=?",
                                Boolean.class,
                                id))
                .isTrue();
        status(
                call(
                        "POST",
                        "/workplace/personnel/" + id + "/commands",
                        h,
                        Map.of("action", "CLOSE", "reason", "Too early", "version", 3)),
                422);
    }

    @Test
    void privilegedAccountCannotGrantBusinessCapabilitiesToItself() throws Exception {
        long v =
                db.queryForObject(
                        "SELECT version FROM users WHERE id=?", Long.class, admin.getId());
        status(
                call(
                        "PUT",
                        "/workplace/staff/" + admin.getId(),
                        a,
                        Map.of(
                                "role",
                                "ADMIN",
                                "capabilities",
                                List.of("PAYROLL_MANAGE"),
                                "reason",
                                "Not permitted",
                                "version",
                                v)),
                422);
    }

    @Test
    void incomeCannotPublishWithoutIndependentApprovalAndOwnDraftIsNotVisible() throws Exception {
        timeSetup();
        UUID id = income("2020-02-03");
        assertThat(data(call("GET", "/workplace/time/incomes?period=2020-02", e, null))).isEmpty();
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + id + "/lock",
                        h,
                        Map.of("reason", "Bypass", "version", 0)),
                422);
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + id + "/commands",
                        a,
                        Map.of("action", "APPROVE", "reason", "Admin bypass", "version", 0)),
                403);
    }

    @Test
    void qrStationRequiresSpecialistAndRejectsExpiredReplayAndClosedStation() throws Exception {
        db.update(
                "INSERT INTO staff_capabilities(user_id,capability) VALUES (?,'TIME_REVIEW')",
                hr.getId());
        status(
                call("POST", "/workplace/attendance/stations", e, Map.of("name", "Unauthorized")),
                403);
        var made =
                call("POST", "/workplace/attendance/stations", h, Map.of("name", "Office fixture"));
        status(made, 200);
        UUID station = UUID.fromString(data(made).asText());
        var qr = call("POST", "/workplace/attendance/stations/" + station + "/challenge", h, null);
        status(qr, 200);
        assertThat(data(qr).path("image").asText()).startsWith("data:image/svg+xml;base64,");
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        db.update(
                "INSERT INTO"
                    + " work_calendar(work_date,day_kind,normal_minutes,shift_start,shift_end,break_minutes,configured_by)"
                    + " VALUES (?,'NORMAL',480,'08:00','17:00',60,?) ON CONFLICT(work_date) DO"
                    + " NOTHING",
                java.sql.Date.valueOf(today),
                hr.getId());
        UUID challenge = UUID.randomUUID();
        String token = "fixture-token-" + UUID.randomUUID();
        db.update(
                "INSERT INTO"
                        + " attendance_qr_challenges(id,station_id,token_hash,issued_by,expires_at)"
                        + " VALUES (?,?,?,?,now()+interval '30 seconds')",
                challenge,
                station,
                recoveryService.hash(token),
                hr.getId());
        status(
                call(
                        "POST",
                        "/workplace/attendance/punches",
                        e,
                        Map.of("token", token, "type", "IN")),
                200);
        status(
                call(
                        "POST",
                        "/workplace/attendance/punches",
                        e,
                        Map.of("token", token, "type", "IN")),
                422);
        db.update(
                "UPDATE attendance_qr_challenges SET expires_at=now()-interval '1 second' WHERE"
                        + " id=?",
                challenge);
        status(
                call(
                        "POST",
                        "/workplace/attendance/punches",
                        b,
                        Map.of("token", token, "type", "IN")),
                422);
        db.update(
                "UPDATE attendance_qr_challenges SET expires_at=now()+interval '30 seconds' WHERE"
                        + " id=?",
                challenge);
        db.update("UPDATE attendance_stations SET is_active=false WHERE id=?", station);
        status(
                call(
                        "POST",
                        "/workplace/attendance/punches",
                        b,
                        Map.of("token", token, "type", "IN")),
                422);
        assertThat(
                        db.queryForObject(
                                "SELECT count(*) FROM attendance_punches WHERE user_id=?",
                                Integer.class,
                                employee.getId()))
                .isEqualTo(1);
    }

    @Test
    void enabledMfaRejectsPasswordOnlyAndConsumesBackupCodeOnce() throws Exception {
        String secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
                backup = "fixture-recovery-" + UUID.randomUUID();
        db.update(
                "INSERT INTO identity_totp(user_id,secret_cipher,enabled,recovery_hashes) VALUES"
                        + " (?,?,true,?)",
                employee.getId(),
                recoveryService.encrypt(secret),
                recoveryService.hash(backup));
        status(
                call(
                        "POST",
                        "/auth/login",
                        null,
                        Map.of(
                                "login",
                                employee.getUsername(),
                                "password",
                                "Test-only-password-123")),
                422);
        status(
                call(
                        "POST",
                        "/auth/login",
                        null,
                        Map.of(
                                "login",
                                employee.getUsername(),
                                "password",
                                "Test-only-password-123",
                                "mfaCode",
                                "wrong-code")),
                422);
        status(
                call(
                        "POST",
                        "/auth/login",
                        null,
                        Map.of(
                                "login",
                                employee.getUsername(),
                                "password",
                                "Test-only-password-123",
                                "mfaCode",
                                backup)),
                200);
        status(
                call(
                        "POST",
                        "/auth/login",
                        null,
                        Map.of(
                                "login",
                                employee.getUsername(),
                                "password",
                                "Test-only-password-123",
                                "mfaCode",
                                backup)),
                422);
    }

    @Test
    void activationExpiryCannotBeBypassedWithValidTokenHash() throws Exception {
        String token = "expired-activation-" + UUID.randomUUID();
        db.update(
                "UPDATE users SET status='PENDING',activation_required=true WHERE id=?",
                employee.getId());
        db.update(
                "INSERT INTO account_recovery_tokens(id,user_id,purpose,token_hash,expires_at)"
                        + " VALUES (?,?,'ACTIVATE',?,now()-interval '1 second')",
                UUID.randomUUID(),
                employee.getId(),
                recoveryService.hash(token));
        status(
                call(
                        "POST",
                        "/auth/activate",
                        null,
                        Map.of(
                                "token",
                                token,
                                "fullName",
                                "Expired",
                                "password",
                                "Personal-password-123",
                                "confirmPassword",
                                "Personal-password-123")),
                422);
        assertThat(
                        db.queryForObject(
                                "SELECT status FROM users WHERE id=?",
                                String.class,
                                employee.getId()))
                .isEqualTo("PENDING");
    }

    @Test
    void blockedWorkRequiresReasonAndCancelIsTerminal() throws Exception {
        UUID id = work();
        command(id, e, "START", 0);
        status(
                call(
                        "POST",
                        "/workplace/work/" + id + "/commands",
                        e,
                        Map.of("action", "BLOCK", "version", 1)),
                422);
        var blocked = command(id, e, "BLOCK", 1, "content", "Awaiting approved access");
        assertThat(blocked.path("status").asText()).isEqualTo("BLOCKED");
        status(
                call(
                        "POST",
                        "/workplace/work/" + id + "/commands",
                        e,
                        Map.of("action", "SUBMIT", "content", "Bypass", "version", 2)),
                403);
        command(id, e, "RESUME", 2, "content", "Access provided");
        var cancelled = command(id, m, "CANCEL", 3, "content", "Requirement withdrawn");
        assertThat(cancelled.path("status").asText()).isEqualTo("CANCELLED");
        assertThat(cancelled.path("allowedActions")).isEmpty();
        status(
                call(
                        "POST",
                        "/workplace/work/" + id + "/commands",
                        e,
                        Map.of("action", "START", "version", 4)),
                403);
    }

    @Test
    void twoFactorEnrollmentVerifiesCodeAndCannotReplaceEnabledSecret() throws Exception {
        var setup =
                call(
                        "POST",
                        "/me/two-factor/setup",
                        e,
                        Map.of("password", "Test-only-password-123"));
        status(setup, 200);
        String secret = data(setup).path("secret").asText();
        var method =
                com.worksphere.identity.application.TwoFactorService.class.getDeclaredMethod(
                        "totp", String.class, long.class);
        method.setAccessible(true);
        String code = (String) method.invoke(null, secret, Instant.now().getEpochSecond() / 30);
        var enabled =
                call(
                        "POST",
                        "/me/two-factor/enable",
                        e,
                        Map.of("password", "Test-only-password-123", "code", code));
        status(enabled, 200);
        assertThat(data(enabled).path("recoveryCodes").size()).isEqualTo(8);
        status(
                call(
                        "POST",
                        "/me/two-factor/setup",
                        e,
                        Map.of("password", "Test-only-password-123")),
                422);
        var backup = data(enabled).path("recoveryCodes").get(0).asText();
        status(
                call(
                        "POST",
                        "/me/two-factor/disable",
                        e,
                        Map.of("password", "Test-only-password-123", "code", backup)),
                200);
        status(call("GET", "/workplace/context", e, null), 401);
    }

    @Test
    void approvedIncomeDetectsChangedSourceBeforePublication() throws Exception {
        timeSetup();
        var first =
                timeRequest("TIME_CORRECTION", "2020-02-03T01:00:00Z", "2020-02-03T10:00:00Z", 480);
        reviewTime(first, "APPROVE", 0, null);
        UUID id = income("2020-02-03");
        db.update(
                "INSERT INTO staff_capabilities(user_id,capability) VALUES (?,'PAYROLL_APPROVE')",
                otherManager.getId());
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + id + "/commands",
                        h,
                        Map.of("action", "SUBMIT", "reason", "Ready", "version", 0)),
                200);
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + id + "/commands",
                        o,
                        Map.of("action", "APPROVE", "reason", "Independent", "version", 1)),
                200);
        var correction =
                timeRequest("TIME_CORRECTION", "2020-02-03T02:00:00Z", "2020-02-03T10:00:00Z", 420);
        reviewTime(correction, "APPROVE", 0, null);
        status(
                call(
                        "POST",
                        "/workplace/time/incomes/" + id + "/lock",
                        h,
                        Map.of("reason", "Stale approval", "version", 2)),
                422);
        assertThat(
                        db.queryForObject(
                                "SELECT status FROM income_periods WHERE id=?", String.class, id))
                .isEqualTo("DRAFT");
    }

    @Test
    void specialistsCanSubmitHistoricalCorrectionAfterOffboardingButCannotSelfReview()
            throws Exception {
        timeSetup();
        db.update(
                "UPDATE users SET status='DISABLED',access_ends_at='2020-02-05T00:00:00Z' WHERE"
                        + " id=?",
                employee.getId());
        status(
                call(
                        "POST",
                        "/workplace/time/corrections",
                        h,
                        Map.of(
                                "userId",
                                employee.getId(),
                                "workDate",
                                "2020-02-03",
                                "startsAt",
                                "2020-02-03T01:00:00Z",
                                "endsAt",
                                "2020-02-03T10:00:00Z",
                                "requestedMinutes",
                                480,
                                "reason",
                                "Source verified after departure")),
                200);
        UUID id =
                db.queryForObject(
                        "SELECT id FROM staff_time_requests WHERE user_id=?",
                        UUID.class,
                        employee.getId());
        status(
                call(
                        "POST",
                        "/workplace/time/requests/" + id + "/review",
                        h,
                        Map.of("action", "APPROVE", "reason", "Cannot self-review", "version", 0)),
                403);
        status(
                call(
                        "POST",
                        "/workplace/time/requests/" + id + "/review",
                        m,
                        Map.of(
                                "action",
                                "APPROVE",
                                "reason",
                                "Manager checked source",
                                "version",
                                0)),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT submitted_by FROM staff_time_requests WHERE id=?",
                                UUID.class,
                                id))
                .isEqualTo(hr.getId());
        status(call("GET", "/workplace/context", e, null), 401);
    }

    @Test
    void personnelSelectorsRespectScopeAndDoNotIncludeTechnicalAdmins() throws Exception {
        var own = data(call("GET", "/workplace/time/people", e, null));
        assertThat(own.size()).isEqualTo(1);
        assertThat(own.get(0).path("id").asText()).isEqualTo(employee.getId().toString());
        var managed = data(call("GET", "/workplace/time/people", m, null));
        assertThat(managed.toString())
                .contains(employee.getId().toString())
                .doesNotContain(outsider.getId().toString())
                .doesNotContain(admin.getId().toString());
        status(call("GET", "/workplace/time/people", a, null), 403);
    }

    @Test
    void executiveReadScopeEndsWhenCapabilityIsRevoked() throws Exception {
        User director = user("EMPLOYEE", null);
        String directorToken = token(director);
        db.update(
                "INSERT INTO staff_capabilities(user_id,capability) VALUES (?,'EXECUTIVE')",
                director.getId());
        db.update(
                "INSERT INTO department_authority(department_id,executive_id,reason,changed_by)"
                        + " VALUES (?,?,'Assigned department',?)",
                department,
                director.getId(),
                admin.getId());
        var ownCase =
                call(
                        "POST",
                        "/workplace/personnel",
                        e,
                        Map.of(
                                "userId",
                                employee.getId(),
                                "effectiveAt",
                                Instant.now().plusSeconds(7200).toString(),
                                "reason",
                                "Own department"));
        status(ownCase, 200);
        var otherCase =
                call(
                        "POST",
                        "/workplace/personnel",
                        x,
                        Map.of(
                                "userId",
                                outsider.getId(),
                                "effectiveAt",
                                Instant.now().plusSeconds(7200).toString(),
                                "reason",
                                "Other department"));
        status(otherCase, 200);
        var visible = data(call("GET", "/workplace/personnel", directorToken, null));
        assertThat(visible.toString())
                .contains(data(ownCase).asText())
                .doesNotContain(data(otherCase).asText());
        var req1 =
                call(
                        "POST",
                        "/workplace/access-requests",
                        e,
                        Map.of(
                                "userId",
                                employee.getId(),
                                "type",
                                "LOCK",
                                "reason",
                                "Own request"));
        status(req1, 200);
        var req2 =
                call(
                        "POST",
                        "/workplace/access-requests",
                        x,
                        Map.of(
                                "userId",
                                outsider.getId(),
                                "type",
                                "LOCK",
                                "reason",
                                "Other request"));
        status(req2, 200);
        assertThat(data(call("GET", "/workplace/access-requests", directorToken, null)).toString())
                .contains(data(req1).asText())
                .doesNotContain(data(req2).asText());
        db.update("DELETE FROM staff_capabilities WHERE user_id=?", director.getId());
        assertThat(data(call("GET", "/workplace/personnel", directorToken, null))).isEmpty();
        assertThat(data(call("GET", "/workplace/access-requests", directorToken, null))).isEmpty();
    }

    @Test
    void personnelAndManagerTimeRequestsNotifyTheCorrectReviewers() throws Exception {
        leadership();
        timeSetup();
        var made =
                call(
                        "POST",
                        "/workplace/personnel",
                        e,
                        Map.of(
                                "userId",
                                employee.getId(),
                                "effectiveAt",
                                Instant.now().plusSeconds(7200).toString(),
                                "reason",
                                "Notification fixture"));
        status(made, 200);
        UUID id = UUID.fromString(data(made).asText());
        assertThat(
                        db.queryForObject(
                                "SELECT count(*) FROM workplace_notices WHERE user_id=? AND"
                                        + " reference_type='PERSONNEL' AND reference_id=?",
                                Integer.class,
                                hr.getId(),
                                id))
                .isEqualTo(1);
        status(
                call(
                        "POST",
                        "/workplace/personnel/" + id + "/commands",
                        h,
                        Map.of("action", "SUBMIT", "reason", "Checked", "version", 0)),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT count(*) FROM workplace_notices WHERE user_id=? AND"
                                        + " reference_type='PERSONNEL' AND reference_id=?",
                                Integer.class,
                                otherManager.getId(),
                                id))
                .isEqualTo(1);
        status(
                call(
                        "POST",
                        "/workplace/time/requests",
                        m,
                        Map.of(
                                "requestType",
                                "LEAVE_UNPAID",
                                "workDate",
                                "2020-02-04",
                                "startsAt",
                                "2020-02-04T01:00:00Z",
                                "endsAt",
                                "2020-02-04T02:00:00Z",
                                "requestedMinutes",
                                60,
                                "reason",
                                "Manager self request")),
                200);
        assertThat(
                        db.queryForObject(
                                "SELECT count(*) FROM workplace_notices WHERE user_id=? AND"
                                        + " reference_type='TIME'",
                                Integer.class,
                                otherManager.getId()))
                .isEqualTo(1);
    }

    @Test
    void wrongPasswordDoesNotDiscloseWhetherAccountIsLockedPendingOrDisabled() throws Exception {
        for (String accountState : List.of("ACTIVE", "LOCKED", "PENDING", "DISABLED")) {
            db.update("UPDATE users SET status=? WHERE id=?", accountState, employee.getId());
            var response =
                    call(
                            "POST",
                            "/auth/login",
                            null,
                            Map.of(
                                    "login",
                                    employee.getUsername(),
                                    "password",
                                    "Incorrect-test-password-123"));
            var error = json.readTree(response.getResponse().getContentAsString());
            assertThat(error.path("code").asText()).isEqualTo("INVALID_CREDENTIALS");
            assertThat(error.path("message").asText())
                    .isEqualTo("Thông tin đăng nhập không chính xác");
            assertThat(error.path("data").isNull() || error.path("data").isMissingNode()).isTrue();
        }
    }
}
