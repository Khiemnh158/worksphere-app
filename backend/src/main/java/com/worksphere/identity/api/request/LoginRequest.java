package com.worksphere.identity.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Login request per API Contract section 8.1.
 */
public record LoginRequest(
        @NotBlank @Size(max = 255) String login,
        @NotBlank @Size(min = 8, max = 128) String password,
        @Size(max = 255) String deviceName
) {
}
