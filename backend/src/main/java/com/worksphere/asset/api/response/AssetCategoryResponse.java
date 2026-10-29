package com.worksphere.asset.api.response;

import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for an Asset Category.
 * Per 06_API_CONTRACT.md section 14.0.
 */
public record AssetCategoryResponse(
        UUID id,
        String code,
        String name,
        String description,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
}
