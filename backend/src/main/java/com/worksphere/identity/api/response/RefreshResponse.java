package com.worksphere.identity.api.response;

/**
 * Refresh token response per API Contract section 8.2.
 */
public record RefreshResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessTokenExpiresIn,
        long refreshTokenExpiresIn
) {
}
