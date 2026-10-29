package com.worksphere.project.api.request;

import com.worksphere.project.domain.ProjectStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for PUT /api/v1/projects/{projectId}/status.
 * Per 06_API_CONTRACT.md section 11.5.
 */
public record ChangeProjectStatusRequest(
        @NotNull(message = "Trạng thái không được để trống")
        ProjectStatus status,

        String reason,

        @NotNull(message = "Version không được để trống")
        Long version
) {
}
