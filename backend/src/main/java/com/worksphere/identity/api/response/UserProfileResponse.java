package com.worksphere.identity.api.response;

import com.worksphere.identity.domain.Permission;
import com.worksphere.identity.domain.Role;
import com.worksphere.identity.domain.User;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * User profile response per API Contract section 9.1.
 */
public record UserProfileResponse(
        UUID id,
        String username,
        String email,
        String fullName,
        String phoneNumber,
        String avatarUrl,
        String status,
        DepartmentInfo department,
        Set<String> roles,
        Set<String> permissions,
        Instant createdAt,
        Instant lastLoginAt
) {

    public record DepartmentInfo(UUID id, String code, String name) {
    }

    public static UserProfileResponse from(User user) {
        Set<String> roleCodes = user.getRoles().stream()
                .filter(Role::isActive)
                .map(Role::getCode)
                .collect(Collectors.toSet());

        Set<String> permissionCodes = user.getRoles().stream()
                .filter(Role::isActive)
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                null, // avatarUrl: resolved via file module in Phase 6+
                user.getStatus().name(),
                null, // department: org module Phase 5
                roleCodes,
                permissionCodes,
                user.getCreatedAt(),
                user.getLastLoginAt()
        );
    }
}
