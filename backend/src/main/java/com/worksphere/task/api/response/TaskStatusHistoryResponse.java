package com.worksphere.task.api.response;

import com.worksphere.task.domain.TaskStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for task status history entry.
 * Per 06_API_CONTRACT.md section 12.3.
 */
public record TaskStatusHistoryResponse(
        UUID id,
        UUID taskId,
        TaskStatus fromStatus,
        TaskStatus toStatus,
        String comment,
        ActorInfo changedBy,
        Instant changedAt
) {
    public record ActorInfo(
            UUID id,
            String fullName,
            String avatarUrl
    ) {
    }
}
