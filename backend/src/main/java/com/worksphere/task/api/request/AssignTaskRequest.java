package com.worksphere.task.api.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

/**
 * Request payload for assigning users to a task.
 * Per 06_API_CONTRACT.md section 12.7.
 */
public record AssignTaskRequest(
        @NotEmpty(message = "Danh sách người được giao không được để trống")
        List<UUID> assigneeIds
) {
}
