package com.worksphere.identity.api.response;

import com.worksphere.identity.domain.Role;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserSummaryResponse(
        UUID id,
        String username,
        String email,
        String fullName,
        String phoneNumber,
        UUID departmentId,
        UserStatus status,
        List<String> roles,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
    public static UserSummaryResponse from(User user) {
        List<String> roleCodes = user.getRoles().stream()
                .map(Role::getCode)
                .toList();

        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getDepartmentId(),
                user.getStatus(),
                roleCodes,
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getVersion()
        );
    }
}
