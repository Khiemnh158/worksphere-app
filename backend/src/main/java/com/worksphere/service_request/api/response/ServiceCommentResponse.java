package com.worksphere.service_request.api.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for a service request comment.
 * Per 06_API_CONTRACT.md section 13.8.
 */
public record ServiceCommentResponse(
        UUID id,
        UUID requestId,
        UUID authorId,
        String authorName,
        String content,
        @JsonProperty("isInternal")
        boolean isInternal,
        @JsonProperty("isEdited")
        boolean isEdited,
        Instant editedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
