package com.worksphere.asset.api.response;

import com.worksphere.asset.domain.AssetStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Summary response payload for Asset list and my-assets endpoints.
 * Per 06_API_CONTRACT.md section 14.1 and 14.2.
 */
public record AssetSummaryResponse(
        UUID id,
        String assetCode,
        String name,
        CategoryBrief category,
        String serialNumber,
        String manufacturer,
        String model,
        AssetStatus status,
        String location,
        LocalDate warrantyEndDate,
        UserBrief currentAssignee,
        Instant assignedAt,
        Long version
) {
    public record CategoryBrief(UUID id, String code, String name) {
    }

    public record UserBrief(UUID id, String fullName) {
    }
}
