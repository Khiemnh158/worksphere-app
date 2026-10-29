package com.worksphere.identity.api.response;

import java.util.UUID;

/**
 * Minimal public workplace contact card for user directory search and selection.
 * Enforces strict data minimization per D-062 and ISO/IEC 27001.
 */
public record UserDirectoryItemResponse(
        UUID id,
        String username,
        String fullName,
        String email,
        String avatarUrl,
        String departmentName
) {
}
