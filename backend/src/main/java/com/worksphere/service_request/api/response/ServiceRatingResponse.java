package com.worksphere.service_request.api.response;

import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for service request rating.
 * Per 06_API_CONTRACT.md section 13.10.
 */
public record ServiceRatingResponse(
        UUID id,
        UUID requestId,
        UUID ratedBy,
        String ratedByName,
        int score,
        String comment,
        Instant createdAt
) {
}
