package com.worksphere.asset.api.response;

import com.worksphere.asset.domain.AssetAssignmentStatus;
import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for an Asset Assignment.
 * Per 06_API_CONTRACT.md section 14.6 and 14.7.
 */
public record AssetAssignmentResponse(
        UUID id,
        UUID assetId,
        UserBrief assignedTo,
        UserBrief assignedBy,
        Instant assignedAt,
        Instant expectedReturnAt,
        Instant returnedAt,
        String returnCondition,
        AssetAssignmentStatus status,
        String notes,
        Long version
) {
    public record UserBrief(UUID id, String fullName) {
    }
}
