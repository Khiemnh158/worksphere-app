package com.worksphere.project.api.request;

import com.worksphere.project.domain.ProjectPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request payload for POST /api/v1/projects.
 * Per 06_API_CONTRACT.md section 11.2.
 */
public record CreateProjectRequest(
        @NotBlank(message = "Mã dự án không được để trống")
        @Size(min = 3, max = 50, message = "Mã dự án phải từ 3 đến 50 ký tự")
        String code,

        @NotBlank(message = "Tên dự án không được để trống")
        @Size(min = 3, max = 200, message = "Tên dự án phải từ 3 đến 200 ký tự")
        String name,

        String description,

        ProjectPriority priority,

        LocalDate startDate,

        LocalDate plannedEndDate,

        UUID departmentId,

        List<UUID> initialMemberIds
) {
}
