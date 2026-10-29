package com.worksphere.dashboard.api.response;

import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Item projection for upcoming tasks in personal dashboard.
 * Per 06_API_CONTRACT.md Section 10.1.
 */
public record UpcomingTaskItemResponse(
        UUID id,
        UUID projectId,
        String projectName,
        String title,
        TaskStatus status,
        TaskPriority priority,
        Instant dueDate
) {
}
