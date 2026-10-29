package com.worksphere.identity.api.response;

import java.util.Set;
import java.util.UUID;

/**
 * Auth response per API Contract section 8.1.
 * Contains tokens and user info.
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessTokenExpiresIn,
        long refreshTokenExpiresIn,
        UserInfo user
) {
    public record UserInfo(
            UUID id,
            String username,
            String email,
            String fullName,
            String avatarUrl,
            DepartmentInfo department,
            Set<String> roles,
            Set<String> permissions
    ) {
    }

    public record DepartmentInfo(
            UUID id,
            String name
    ) {
    }
}
