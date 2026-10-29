package com.worksphere.identity.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Update profile request per API Contract section 9.2.
 */
public record UpdateProfileRequest(
        @NotBlank @Size(max = 150) String fullName,
        @Size(max = 20) String phoneNumber,
        UUID avatarFileId
) {
}
