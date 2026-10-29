package com.worksphere.task.api.response;

import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Detailed response for a single task.
 * Per 06_API_CONTRACT.md section 12.3.
 */
public record TaskDetailResponse(
        UUID id,
        ProjectBrief project,
        UUID parentTaskId,
        ParentTaskBrief parentTask,
        UUID milestoneId,
        MilestoneBrief milestone,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        BigDecimal progressPercent,
        LocalDate startDate,
        Instant dueDate,
        Instant completedAt,
        Integer estimatedMinutes,
        Integer actualMinutes,
        ReporterDetail reporter,
        List<AssigneeDetail> assignees,
        List<TaskSummaryResponse> subtasks,
        List<TaskCommentResponse> recentComments,
        List<Object> attachments,
        List<TaskStatusHistoryResponse> statusHistory,
        Set<String> allowedActions,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
    public record ProjectBrief(UUID id, String code, String name) {
    }

    public record ParentTaskBrief(UUID id, String title) {
    }

    public record MilestoneBrief(UUID id, String name) {
    }

    public record ReporterDetail(UUID id, String fullName, String avatarUrl) {
    }

    public record AssigneeDetail(
            UUID assignmentId,
            UUID id,
            String fullName,
            String avatarUrl,
            Instant assignedAt
    ) {
    }
}
