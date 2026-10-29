package com.worksphere.task.api.response;

import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Summary response for task list and subtask list.
 * Per 06_API_CONTRACT.md section 12.1.
 */
public record TaskSummaryResponse(
        UUID id,
        ProjectBrief project,
        UUID parentTaskId,
        String title,
        TaskStatus status,
        TaskPriority priority,
        BigDecimal progressPercent,
        List<AssigneeSummary> assignees,
        ReporterSummary reporter,
        Instant dueDate,
        boolean overdue,
        int subtaskCount,
        int completedSubtaskCount,
        int commentCount,
        int attachmentCount,
        Instant updatedAt
) {
    public record ProjectBrief(UUID id, String code, String name) {
    }

    public record AssigneeSummary(UUID id, String fullName, String avatarUrl) {
    }

    public record ReporterSummary(UUID id, String fullName) {
    }
}
