package com.worksphere.identity.api;

import com.worksphere.identity.api.request.ChangePasswordRequest;
import com.worksphere.identity.api.request.UpdateProfileRequest;
import com.worksphere.identity.api.response.UserProfileResponse;
import com.worksphere.identity.application.AuthApplicationService;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Me (current user) REST controller.
 * Per API Contract section 9.
 */
@RestController
@RequestMapping("/api/v1/me")
@Tag(name = "Profile", description = "Current user profile endpoints")
@SecurityRequirement(name = "bearerAuth")
public class MeController {

    private final AuthApplicationService authService;

    public MeController(AuthApplicationService authService) {
        this.authService = authService;
    }

    /**
     * GET /api/v1/me
     * Per API Contract section 9.1.
     */
    @GetMapping
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        UserProfileResponse response = authService.getCurrentUser(principal.userId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/me
     * Per API Contract section 9.2.
     */
    @PutMapping
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        UserProfileResponse response = authService.updateProfile(request, principal.userId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/me/password
     * Per API Contract section 9.3.
     */
    @PutMapping("/password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        authService.changePassword(request, principal.userId());
        return ResponseEntity.ok(ApiResponse.successNoContent("Mật khẩu đã được đổi thành công"));
    }
}
