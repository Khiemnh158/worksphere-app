package com.worksphere.project.api.request;

import com.worksphere.project.domain.ProjectPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Request payload for PUT /api/v1/projects/{projectId}.
 * Per 06_API_CONTRACT.md section 11.4.
 */
public record UpdateProjectRequest(
        @NotBlank(message = "Tên dự án không được để trống")
        @Size(min = 3, max = 200, message = "Tên dự án phải từ 3 đến 200 ký tự")
        String name,

        String description,

        ProjectPriority priority,

        LocalDate startDate,

        LocalDate plannedEndDate,

        @NotNull(message = "Version không được để trống")
        Long version
) {
}
