package com.worksphere.identity.api.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Logout request per API Contract section 8.3.
 */
public record LogoutRequest(
        @NotBlank String refreshToken
) {
}
