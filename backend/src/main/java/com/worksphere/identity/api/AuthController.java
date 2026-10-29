package com.worksphere.identity.api;

import com.worksphere.identity.api.request.*;
import com.worksphere.identity.api.response.AuthResponse;
import com.worksphere.identity.api.response.RefreshResponse;
import com.worksphere.identity.application.AuthApplicationService;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication REST controller.
 * Handles login, refresh, logout, logout-all, forgot-password, reset-password.
 * Per API Contract section 8.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Authentication and token management endpoints")
public class AuthController {

    private final AuthApplicationService authService;

    public AuthController(AuthApplicationService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/v1/auth/login
     * Per API Contract section 8.1.
     */
    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate with email/username and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.login(
                request,
                getClientIp(httpRequest),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/auth/refresh
     * Per API Contract section 8.2.
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Rotate refresh token and get new access token")
    public ResponseEntity<ApiResponse<RefreshResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest
    ) {
        RefreshResponse response = authService.refresh(
                request,
                getClientIp(httpRequest),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/auth/logout
     * Per API Contract section 8.3.
     */
    @PostMapping("/logout")
    @Operation(summary = "Logout current session")
    public ResponseEntity<Void> logout(
            @Valid @RequestBody LogoutRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        authService.logout(request, principal.userId());
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v1/auth/logout-all
     * Per API Contract section 8.4.
     */
    @PostMapping("/logout-all")
    @Operation(summary = "Logout all sessions")
    public ResponseEntity<Void> logoutAll(
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        authService.logoutAll(principal.userId());
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v1/auth/forgot-password
     * Per API Contract section 8.5.
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest
    ) {
        authService.forgotPassword(
                request,
                getClientIp(httpRequest),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(ApiResponse.successNoContent(
                "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi."));
    }

    /**
     * POST /api/v1/auth/reset-password
     * Per API Contract section 8.6.
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password with token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.successNoContent("Mật khẩu đã được đặt lại thành công"));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
