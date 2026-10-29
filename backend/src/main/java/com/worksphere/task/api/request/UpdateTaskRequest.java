package com.worksphere.task.api.request;

import com.worksphere.task.domain.TaskPriority;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Request payload for updating task details.
 * Per 06_API_CONTRACT.md section 12.4.
 */
public record UpdateTaskRequest(
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        TaskPriority priority,

        LocalDate startDate,

        Instant dueDate,

        @Min(value = 0, message = "Thời gian ước tính không được âm")
        Integer estimatedMinutes,

        @NotNull(message = "Phiên bản dữ liệu (version) không được để trống")
        Long version
) {
}
