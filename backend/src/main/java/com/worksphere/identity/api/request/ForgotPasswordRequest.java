package com.worksphere.identity.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Forgot password request per API Contract section 8.5.
 */
public record ForgotPasswordRequest(
        @NotBlank @Email @Size(max = 255) String email
) {
}
