package com.worksphere.task.api.response;

import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for a task comment.
 * Per 06_API_CONTRACT.md section 12.12.
 */
public record TaskCommentResponse(
        UUID id,
        UUID taskId,
        AuthorInfo author,
        String content,
        UUID parentId,
        boolean isEdited,
        Instant editedAt,
        Instant createdAt
) {
    public record AuthorInfo(
            UUID id,
            String fullName,
            String avatarUrl
    ) {
    }
}
