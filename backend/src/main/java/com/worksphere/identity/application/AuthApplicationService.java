package com.worksphere.identity.application;

import com.worksphere.identity.api.request.LoginRequest;
import com.worksphere.identity.api.request.RefreshTokenRequest;
import com.worksphere.identity.api.request.LogoutRequest;
import com.worksphere.identity.api.request.ForgotPasswordRequest;
import com.worksphere.identity.api.request.ResetPasswordRequest;
import com.worksphere.identity.api.request.ChangePasswordRequest;
import com.worksphere.identity.api.request.UpdateProfileRequest;
import com.worksphere.identity.api.response.AuthResponse;
import com.worksphere.identity.api.response.RefreshResponse;
import com.worksphere.identity.api.response.UserProfileResponse;
import com.worksphere.identity.domain.*;
import com.worksphere.identity.infrastructure.persistence.*;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Application service for all authentication and authorization use cases.
 * Coordinates domain objects, repositories, and security services.
 */
@Service
public class AuthApplicationService {

    private static final Logger log = LoggerFactory.getLogger(AuthApplicationService.class);

    private static final long REFRESH_TOKEN_EXPIRY_DAYS = 30L;
    private static final long RESET_TOKEN_EXPIRY_MINUTES = 15L;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginSessionRepository loginSessionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom;

    public AuthApplicationService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            LoginSessionRepository loginSessionRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.loginSessionRepository = loginSessionRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.secureRandom = new SecureRandom();
    }

    /**
     * TASK-407: Login flow.
     * Per API Contract section 8.1 and Roadmap section 8.3.
     */
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findActiveByUsernameOrEmail(request.login())
                .orElseThrow(() -> new BusinessRuleException("INVALID_CREDENTIALS",
                        "Thông tin đăng nhập không chính xác"));

        // Domain validates status - throws if not ACTIVE
        user.validateCanLogin();

        // Verify password without logging it
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessRuleException("INVALID_CREDENTIALS",
                    "Thông tin đăng nhập không chính xác");
        }

        // Create login session first
        UUID sessionId = UUID.randomUUID();
        LoginSession session = LoginSession.create(
                sessionId,
                user.getId(),
                null,
                request.deviceName(),
                ipAddress,
                userAgent
        );
        loginSessionRepository.save(session);

        // Generate JWT access token
        String accessToken = jwtService.generateAccessToken(user.getId(), sessionId);

        // Create refresh token - store only hash
        String rawRefreshToken = generateSecureToken();
        String tokenHash = hashToken(rawRefreshToken);
        Instant refreshExpiry = Instant.now().plus(REFRESH_TOKEN_EXPIRY_DAYS, ChronoUnit.DAYS);

        RefreshToken refreshToken = RefreshToken.create(
                UUID.randomUUID(),
                user.getId(),
                tokenHash,
                request.deviceName(),
                ipAddress,
                userAgent,
                refreshExpiry
        );
        refreshToken = refreshTokenRepository.save(refreshToken);

        // Link refresh token to session
        session.linkRefreshToken(refreshToken.getId());
        loginSessionRepository.save(session);

        // Update last login
        user.recordLogin();
        userRepository.save(user);

        log.info("User logged in. userId={}, sessionId={}", user.getId(), sessionId);

        return buildAuthResponse(user, accessToken, rawRefreshToken, refreshExpiry);
    }

    /**
     * TASK-407: Refresh token rotation.
     * Per API Contract section 8.2.
     */
    @Transactional
    public RefreshResponse refresh(RefreshTokenRequest request, String ipAddress, String userAgent) {
        String tokenHash = hashToken(request.refreshToken());

        RefreshToken oldToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessRuleException("REFRESH_TOKEN_INVALID",
                        "Refresh token không hợp lệ"));

        if (oldToken.isRevoked()) {
            throw new BusinessRuleException("REFRESH_TOKEN_REVOKED", "Refresh token đã bị thu hồi");
        }
        if (oldToken.isExpired()) {
            throw new BusinessRuleException("REFRESH_TOKEN_EXPIRED", "Refresh token đã hết hạn");
        }

        User user = userRepository.findActiveById(oldToken.getUserId())
                .orElseThrow(() -> new BusinessRuleException("REFRESH_TOKEN_INVALID",
                        "Refresh token không hợp lệ"));

        // Check user status after token was issued
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new BusinessRuleException("ACCOUNT_LOCKED", "Tài khoản đã bị khóa");
        }
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new BusinessRuleException("ACCOUNT_DISABLED", "Tài khoản đã bị vô hiệu hóa");
        }

        // Find session associated with old token
        LoginSession session = loginSessionRepository.findByRefreshTokenId(oldToken.getId())
                .orElseThrow(() -> new BusinessRuleException("SESSION_NOT_FOUND",
                        "Phiên đăng nhập không tồn tại"));

        if (!session.isActive()) {
            throw new BusinessRuleException("SESSION_NOT_FOUND", "Phiên đăng nhập không còn hoạt động");
        }

        // Rotate refresh token
        String newRawToken = generateSecureToken();
        String newTokenHash = hashToken(newRawToken);
        Instant newExpiry = Instant.now().plus(REFRESH_TOKEN_EXPIRY_DAYS, ChronoUnit.DAYS);

        RefreshToken newToken = RefreshToken.create(
                UUID.randomUUID(),
                user.getId(),
                newTokenHash,
                oldToken.getDeviceName(),
                ipAddress,
                userAgent,
                newExpiry
        );
        newToken = refreshTokenRepository.save(newToken);

        // Revoke old token, link to new token
        oldToken.revoke(newToken.getId());
        refreshTokenRepository.save(oldToken);

        // Update session to use new refresh token
        session.linkRefreshToken(newToken.getId());
        session.updateActivity();
        loginSessionRepository.save(session);

        // Generate new access token
        String newAccessToken = jwtService.generateAccessToken(user.getId(), session.getId());

        log.info("Token rotated. userId={}, sessionId={}", user.getId(), session.getId());

        return new RefreshResponse(
                newAccessToken,
                newRawToken,
                "Bearer",
                jwtService.getAccessTokenExpirySeconds(),
                REFRESH_TOKEN_EXPIRY_DAYS * 24 * 3600
        );
    }

    /**
     * TASK-408: Logout current session.
     * Per API Contract section 8.3.
     */
    @Transactional
    public void logout(LogoutRequest request, UUID currentUserId) {
        String tokenHash = hashToken(request.refreshToken());

        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            // Verify token belongs to current user
            if (token.getUserId().equals(currentUserId)) {
                token.revoke();
                refreshTokenRepository.save(token);

                loginSessionRepository.findByRefreshTokenId(token.getId()).ifPresent(session -> {
                    session.logout();
                    loginSessionRepository.save(session);
                });
                log.info("User logged out. userId={}", currentUserId);
            }
        });
    }

    /**
     * TASK-408: Logout all sessions.
     * Per API Contract section 8.4.
     */
    @Transactional
    public void logoutAll(UUID currentUserId) {
        refreshTokenRepository.revokeAllByUserId(currentUserId, Instant.now());
        loginSessionRepository.revokeAllActiveByUserId(currentUserId, Instant.now());
        log.info("All sessions revoked. userId={}", currentUserId);
    }

    /**
     * TASK-409: Forgot password request.
     * Per API Contract section 8.5.
     * Always returns same message regardless of email existence (to prevent enumeration).
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String requestIp, String userAgent) {
        userRepository.findActiveByEmail(request.email()).ifPresent(user -> {
            // Revoke any existing unused reset tokens
            passwordResetTokenRepository.revokeAllUnusedByUserId(user.getId(), Instant.now());

            // Generate raw token, store only hash
            String rawToken = generateSecureToken();
            String tokenHash = hashToken(rawToken);
            Instant expiry = Instant.now().plus(RESET_TOKEN_EXPIRY_MINUTES, ChronoUnit.MINUTES);

            PasswordResetToken resetToken = PasswordResetToken.create(
                    UUID.randomUUID(),
                    user.getId(),
                    tokenHash,
                    expiry,
                    requestIp,
                    userAgent
            );
            passwordResetTokenRepository.save(resetToken);

            // In production: send rawToken via email. For Phase 4, we log the token
            // ONLY in a safe way - to trace ID only, not the token itself.
            log.info("Password reset token created for userId={}. Token sent via out-of-band channel.", user.getId());
        });
        // Always returns without revealing if email exists
    }

    /**
     * TASK-409: Reset password with token.
     * Per API Contract section 8.6.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BusinessRuleException("PASSWORD_CONFIRMATION_MISMATCH",
                    "Mật khẩu xác nhận không khớp");
        }

        String tokenHash = hashToken(request.resetToken());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessRuleException("RESET_TOKEN_INVALID",
                        "Token đặt lại mật khẩu không hợp lệ"));

        if (!resetToken.isValid()) {
            if (resetToken.isExpired()) {
                throw new BusinessRuleException("RESET_TOKEN_EXPIRED", "Token đặt lại mật khẩu đã hết hạn");
            }
            throw new BusinessRuleException("RESET_TOKEN_INVALID", "Token đặt lại mật khẩu không hợp lệ");
        }

        User user = userRepository.findActiveById(resetToken.getUserId())
                .orElseThrow(() -> new BusinessRuleException("RESET_TOKEN_INVALID",
                        "Token đặt lại mật khẩu không hợp lệ"));

        // Enforce password policy: at least 8 chars
        if (request.newPassword().length() < 8 || request.newPassword().length() > 128) {
            throw new BusinessRuleException("PASSWORD_POLICY_VIOLATION",
                    "Mật khẩu phải có từ 8 đến 128 ký tự");
        }

        user.updatePassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.markUsed();
        passwordResetTokenRepository.save(resetToken);

        // Per security policy: revoke all active sessions after password reset
        refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
        loginSessionRepository.revokeAllActiveByUserId(user.getId(), Instant.now());

        log.info("Password reset completed. userId={}", user.getId());
    }

    /**
     * TASK-405: Change password for authenticated user.
     * Per API Contract section 9.3.
     */
    @Transactional
    public void changePassword(ChangePasswordRequest request, UUID currentUserId) {
        User user = userRepository.findActiveById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Người dùng không tồn tại"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("CURRENT_PASSWORD_INCORRECT",
                    "Mật khẩu hiện tại không chính xác");
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BusinessRuleException("PASSWORD_CONFIRMATION_MISMATCH",
                    "Mật khẩu xác nhận không khớp");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("NEW_PASSWORD_SAME_AS_CURRENT",
                    "Mật khẩu mới không được trùng mật khẩu hiện tại");
        }
        if (request.newPassword().length() < 8 || request.newPassword().length() > 128) {
            throw new BusinessRuleException("PASSWORD_POLICY_VIOLATION",
                    "Mật khẩu phải có từ 8 đến 128 ký tự");
        }

        user.updatePassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        log.info("Password changed. userId={}", currentUserId);
    }

    /**
     * TASK-404: Get current user profile.
     * Per API Contract section 9.1.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser(UUID currentUserId) {
        User user = userRepository.findActiveById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Người dùng không tồn tại"));
        return UserProfileResponse.from(user);
    }

    /**
     * TASK-404: Update current user profile.
     * Per API Contract section 9.2.
     */
    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request, UUID currentUserId) {
        User user = userRepository.findActiveById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Người dùng không tồn tại"));

        user.updateProfile(request.fullName(), request.phoneNumber());
        if (request.avatarFileId() != null) {
            user.updateAvatarFileId(request.avatarFileId());
        }
        userRepository.save(user);
        return UserProfileResponse.from(user);
    }

    // ---- Private helpers ----

    /**
     * Generates a cryptographically secure random token (URL-safe Base64).
     */
    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Hash a raw token using SHA-256 for storage.
     * Never stores raw tokens.
     */
    private String hashToken(String rawToken) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new RuntimeException("SHA-256 not available", ex);
        }
    }

    private AuthResponse buildAuthResponse(
            User user,
            String accessToken,
            String rawRefreshToken,
            Instant refreshExpiry
    ) {
        Set<String> roleCodes = user.getRoles().stream()
                .filter(Role::isActive)
                .map(Role::getCode)
                .collect(Collectors.toSet());

        Set<String> permissionCodes = user.getRoles().stream()
                .filter(Role::isActive)
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                null, // avatarUrl: file module is Phase later
                null, // department: org module is Phase 5
                roleCodes,
                permissionCodes
        );

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                "Bearer",
                jwtService.getAccessTokenExpirySeconds(),
                REFRESH_TOKEN_EXPIRY_DAYS * 24 * 3600,
                userInfo
        );
    }
}
