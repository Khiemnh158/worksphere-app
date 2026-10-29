package com.worksphere.shared.security;

import com.worksphere.identity.domain.User;

import java.util.UUID;

/**
 * Principal object stored in SecurityContext representing the authenticated user.
 */
public record WorkSphereUserPrincipal(User user) {

    public UUID userId() {
        return user.getId();
    }

    public String email() {
        return user.getEmail();
    }

    public String username() {
        return user.getUsername();
    }
}
