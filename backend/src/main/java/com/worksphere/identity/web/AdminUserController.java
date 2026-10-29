package com.worksphere.identity.web;

import com.worksphere.identity.api.request.AdminUpdateUserRequest;
import com.worksphere.identity.api.request.CreateUserRequest;
import com.worksphere.identity.api.request.LockUserRequest;
import com.worksphere.identity.api.response.UserSummaryResponse;
import com.worksphere.identity.application.UserManagementApplicationService;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.response.PagedData;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for Admin User Management endpoints.
 * Per API Contract sections 17.1 to 17.5.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "Admin Users", description = "User administration endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AdminUserController {

    private final UserManagementApplicationService userManagementService;

    public AdminUserController(UserManagementApplicationService userManagementService) {
        this.userManagementService = userManagementService;
    }

    /**
     * GET /api/v1/admin/users
     * Requires USER_READ permission.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    @Operation(summary = "Get list of users with filtering and pagination")
    public ResponseEntity<ApiResponse<PagedData<UserSummaryResponse>>> searchUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) UserStatus status,
            @PageableDefault(page = 0, size = 20) Pageable pageable
    ) {
        PagedData<UserSummaryResponse> result = userManagementService.searchUsers(
                search, departmentId, role, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * POST /api/v1/admin/users
     * Requires USER_MANAGE permission.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    @Operation(summary = "Create user by admin")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request
    ) {
        UserSummaryResponse response = userManagementService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/admin/users/{userId}
     * Requires USER_MANAGE permission.
     */
    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    @Operation(summary = "Update user by admin")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        UserSummaryResponse response = userManagementService.updateUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/admin/users/{userId}/lock
     * Requires USER_MANAGE permission.
     */
    @PutMapping("/{userId}/lock")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    @Operation(summary = "Lock user account")
    public ResponseEntity<ApiResponse<Void>> lockUser(
            @PathVariable UUID userId,
            @RequestBody(required = false) LockUserRequest request
    ) {
        String reason = request != null ? request.reason() : "Khóa bởi quản trị viên";
        userManagementService.lockUser(userId, reason);
        return ResponseEntity.ok(ApiResponse.successNoContent("Tài khoản đã bị khóa"));
    }

    /**
     * PUT /api/v1/admin/users/{userId}/unlock
     * Requires USER_MANAGE permission.
     */
    @PutMapping("/{userId}/unlock")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    @Operation(summary = "Unlock user account")
    public ResponseEntity<ApiResponse<Void>> unlockUser(
            @PathVariable UUID userId
    ) {
        userManagementService.unlockUser(userId);
        return ResponseEntity.ok(ApiResponse.successNoContent("Tài khoản đã được mở khóa"));
    }
}
