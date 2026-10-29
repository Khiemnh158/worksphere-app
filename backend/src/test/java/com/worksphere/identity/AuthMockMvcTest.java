package com.worksphere.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.identity.api.request.ForgotPasswordRequest;
import com.worksphere.identity.api.request.LoginRequest;
import com.worksphere.identity.api.request.LogoutRequest;
import com.worksphere.identity.api.request.RefreshTokenRequest;
import com.worksphere.identity.api.request.ResetPasswordRequest;
import com.worksphere.identity.domain.PasswordResetToken;
import com.worksphere.identity.infrastructure.persistence.LoginSessionRepository;
import com.worksphere.identity.infrastructure.persistence.PasswordResetTokenRepository;
import com.worksphere.identity.infrastructure.persistence.RefreshTokenRepository;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.shared.security.JwtService;
import com.worksphere.shared.security.WorkSphereAccessDeniedHandler;
import com.worksphere.shared.security.WorkSphereAuthEntryPoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthMockMvcTest {

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
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private LoginSessionRepository loginSessionRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private WorkSphereAuthEntryPoint authEntryPoint;

    @Autowired
    private WorkSphereAccessDeniedHandler accessDeniedHandler;

    private final UUID activeUserId = UUID.randomUUID();
    private final UUID pendingUserId = UUID.randomUUID();
    private final UUID lockedUserId = UUID.randomUUID();
    private final UUID disabledUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        authorizationTestSessions.deleteAll();
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
        passwordResetTokenRepository.deleteAll();
        jdbcTemplate.update("DELETE FROM user_roles");
        userRepository.deleteAll();

        String encodedPassword = passwordEncoder.encode("Password123!");

        // 1. ACTIVE user
        insertUser(activeUserId, "activeuser", "active@test.com", encodedPassword, "ACTIVE");
        UUID adminRoleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE code = 'ADMIN'", UUID.class);
        if (adminRoleId != null) {
            jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, now())",
                    activeUserId, adminRoleId);
        }

        // 2. PENDING user
        insertUser(pendingUserId, "pendinguser", "pending@test.com", encodedPassword, "PENDING");

        // 3. LOCKED user
        insertUser(lockedUserId, "lockeduser", "locked@test.com", encodedPassword, "LOCKED");

        // 4. DISABLED user
        insertUser(disabledUserId, "disableduser", "disabled@test.com", encodedPassword, "DISABLED");
    }

    private void insertUser(UUID id, String username, String email, String passwordHash, String status) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, status, is_deleted, created_at, updated_at, version) " +
                        "VALUES (?, ?, ?, ?, ?, ?, false, now(), now(), 0)",
                id, username, email, passwordHash, username + " Full Name", status
        );
    }

    // =========================================================================
    // 1. HANDLER & UTF-8 / JSON CONTRACT TESTS
    // =========================================================================

    @Test
    @Order(1)
    void authEntryPoint_shouldReturn401JsonUtf8() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        authEntryPoint.commence(request, response, new BadCredentialsException("Unauth"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).contains(MediaType.APPLICATION_JSON_VALUE);
        assertThat(response.getCharacterEncoding()).isEqualToIgnoringCase("UTF-8");

        String content = response.getContentAsString(StandardCharsets.UTF_8);
        assertThat(content).contains("Yêu cầu xác thực");
        assertThat(content).contains("UNAUTHORIZED");

        JsonNode root = objectMapper.readTree(content);
        assertThat(root.get("success").asBoolean()).isFalse();
        assertThat(root.get("code").asText()).isEqualTo("UNAUTHORIZED");
        assertThat(root.get("message").asText()).isEqualTo("Yêu cầu xác thực");
        assertThat(root.has("stackTrace")).isFalse();
    }

    @Test
    @Order(2)
    void accessDeniedHandler_shouldReturn403JsonUtf8() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        accessDeniedHandler.handle(request, response, new AccessDeniedException("Forbidden"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).contains(MediaType.APPLICATION_JSON_VALUE);
        assertThat(response.getCharacterEncoding()).isEqualToIgnoringCase("UTF-8");

        String content = response.getContentAsString(StandardCharsets.UTF_8);
        assertThat(content).contains("Bạn không có quyền thực hiện thao tác này");
        assertThat(content).contains("FORBIDDEN");

        JsonNode root = objectMapper.readTree(content);
        assertThat(root.get("success").asBoolean()).isFalse();
        assertThat(root.get("code").asText()).isEqualTo("FORBIDDEN");
        assertThat(root.get("message").asText()).isEqualTo("Bạn không có quyền thực hiện thao tác này");
        assertThat(root.has("stackTrace")).isFalse();
    }

    // =========================================================================
    // 2. HTTP AUTHENTICATION / LOGIN TESTS
    // =========================================================================

    @Test
    @Order(3)
    void login_shouldSucceed_whenUserIsActiveAndCredentialsAreValid() throws Exception {
        LoginRequest req = new LoginRequest("activeuser", "Password123!", "TestDevice");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString())
                .andExpect(jsonPath("$.data.user.id").value(activeUserId.toString()))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.tokenHash").doesNotExist())
                .andExpect(content().string(not(containsString("passwordHash"))))
                .andExpect(content().string(not(containsString("stackTrace"))));
    }

    @Test
    @Order(4)
    void login_shouldFail_whenPasswordIsWrong() throws Exception {
        LoginRequest req = new LoginRequest("activeuser", "WrongPassword999!", "TestDevice");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Thông tin đăng nhập không chính xác"));
    }

    @Test
    @Order(5)
    void login_shouldFail_whenUserIsPending() throws Exception {
        LoginRequest req = new LoginRequest("pendinguser", "Password123!", "TestDevice");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ACCOUNT_PENDING"))
                .andExpect(jsonPath("$.message").value("Tài khoản chưa được kích hoạt"));
    }

    @Test
    @Order(6)
    void login_shouldFail_whenUserIsLocked() throws Exception {
        LoginRequest req = new LoginRequest("lockeduser", "Password123!", "TestDevice");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"))
                .andExpect(jsonPath("$.message").value("Tài khoản đã bị khóa"));
    }

    @Test
    @Order(7)
    void login_shouldFail_whenUserIsDisabled() throws Exception {
        LoginRequest req = new LoginRequest("disableduser", "Password123!", "TestDevice");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ACCOUNT_DISABLED"))
                .andExpect(jsonPath("$.message").value("Tài khoản đã bị vô hiệu hóa"));
    }

    // =========================================================================
    // 3. ACCESS TOKEN & PROTECTED / PUBLIC ENDPOINT TESTS
    // =========================================================================

    @Test
    @Order(8)
    void publicEndpoints_shouldBeAccessibleWithoutToken() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    @Order(9)
    void protectedEndpoint_shouldReturn401_whenNoTokenProvided() throws Exception {
        mockMvc.perform(get("/api/v1/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Yêu cầu xác thực"));
    }

    @Test
    @Order(10)
    void protectedEndpoint_shouldReturn401_whenTokenIsMalformedOrInvalid() throws Exception {
        mockMvc.perform(get("/api/v1/me")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @Order(11)
    void protectedEndpoint_shouldSucceed_whenValidTokenProvided() throws Exception {
        UUID sessionId = UUID.randomUUID();
        String validToken = authorizationAccessToken(activeUserId);

        mockMvc.perform(get("/api/v1/me")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(activeUserId.toString()))
                .andExpect(jsonPath("$.data.username").value("activeuser"))
                .andExpect(jsonPath("$.data.email").value("active@test.com"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(content().string(not(containsString("passwordHash"))));
    }

    // =========================================================================
    // 4. REFRESH TOKEN ROTATION & REVOCATION TESTS
    // =========================================================================

    @Test
    @Order(12)
    void refreshToken_shouldRotateAndReturnNewTokens() throws Exception {
        // 1. Login to get initial tokens
        LoginRequest loginReq = new LoginRequest("activeuser", "Password123!", "TestDevice");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginData = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("data");
        String initialRefreshToken = loginData.get("refreshToken").asText();

        // 2. Rotate refresh token
        RefreshTokenRequest refreshReq = new RefreshTokenRequest(initialRefreshToken);
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString())
                .andReturn();

        JsonNode refreshData = objectMapper.readTree(refreshResult.getResponse().getContentAsString()).get("data");
        String newRefreshToken = refreshData.get("refreshToken").asText();
        assertThat(newRefreshToken).isNotEqualTo(initialRefreshToken);

        // 3. Re-using old rotated token should fail
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("REFRESH_TOKEN_REVOKED"));
    }

    // =========================================================================
    // 5. LOGOUT & SESSION MANAGEMENT TESTS
    // =========================================================================

    @Test
    @Order(13)
    void logout_shouldRevokeSessionAndReturn204() throws Exception {
        // 1. Login
        LoginRequest loginReq = new LoginRequest("activeuser", "Password123!", "TestDevice");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("data");
        String accessToken = data.get("accessToken").asText();
        String refreshToken = data.get("refreshToken").asText();

        // 2. Logout
        LogoutRequest logoutReq = new LogoutRequest(refreshToken);
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().isNoContent());

        // 3. Trying to refresh with the logged-out refresh token should fail
        RefreshTokenRequest refreshReq = new RefreshTokenRequest(refreshToken);
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("REFRESH_TOKEN_REVOKED"));
    }

    // =========================================================================
    // 6. PASSWORD RESET WORKFLOW TESTS
    // =========================================================================

    @Test
    @Order(14)
    void forgotPassword_shouldReturnOkGenericMessage() throws Exception {
        ForgotPasswordRequest req = new ForgotPasswordRequest("active@test.com");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value(
                        "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi."));
    }

    @Test
    @Order(15)
    void resetPassword_shouldFail_whenTokenIsInvalid() throws Exception {
        ResetPasswordRequest req = new ResetPasswordRequest("non-existent-token", "NewPassword123!", "NewPassword123!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("RESET_TOKEN_INVALID"));
    }

    @Test
    @Order(16)
    void resetPassword_shouldSucceed_whenTokenIsValid() throws Exception {
        String rawToken = UUID.randomUUID().toString().replace("-", "");
        String tokenHash = hashToken(rawToken);

        PasswordResetToken prt = PasswordResetToken.create(
                UUID.randomUUID(),
                activeUserId,
                tokenHash,
                Instant.now().plus(15, ChronoUnit.MINUTES),
                "127.0.0.1",
                "TestAgent"
        );
        passwordResetTokenRepository.save(prt);

        ResetPasswordRequest req = new ResetPasswordRequest(rawToken, "BrandNewPassword123!", "BrandNewPassword123!");
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Mật khẩu đã được đặt lại thành công"));

        // Verify that trying to reuse the used reset token fails
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("RESET_TOKEN_INVALID"));
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.worksphere.identity.infrastructure.persistence.LoginSessionRepository authorizationTestSessions;

    private String authorizationAccessToken(UUID userId) {
        UUID sessionId = UUID.randomUUID();
        authorizationTestSessions.save(com.worksphere.identity.domain.LoginSession.create(
                sessionId, userId, null, "HTTP test", "127.0.0.1", "JUnit"));
        return jwtService.generateAccessToken(userId, sessionId);
    }
}
