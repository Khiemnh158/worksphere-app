package com.worksphere.task.api.request;

import com.worksphere.task.domain.TaskPriority;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request payload for creating a subtask.
 * Per 06_API_CONTRACT.md section 12.11.
 */
public record CreateSubtaskRequest(
        UUID milestoneId,

        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        @NotNull(message = "Mức độ ưu tiên không được để trống")
        TaskPriority priority,

        List<UUID> assigneeIds,

        LocalDate startDate,

        Instant dueDate,

        @Min(value = 0, message = "Thời gian ước tính không được âm")
        Integer estimatedMinutes
) {
}
