package com.worksphere.project.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Request payload for POST /api/v1/projects/{projectId}/milestones.
 * Per 06_API_CONTRACT.md section 11.10.
 */
public record CreateMilestoneRequest(
        @NotBlank(message = "Tên milestone không được để trống")
        @Size(max = 200, message = "Tên milestone tối đa 200 ký tự")
        String name,

        String description,

        @NotNull(message = "dueDate không được để trống")
        LocalDate dueDate
) {
}
