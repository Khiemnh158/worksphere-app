package com.worksphere.identity.api.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Refresh token request per API Contract section 8.2.
 */
public record RefreshTokenRequest(
        @NotBlank String refreshToken
) {
}
