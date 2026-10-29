package com.worksphere.project.api.request;

import com.worksphere.project.domain.ProjectRole;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request payload for POST /api/v1/projects/{projectId}/members.
 * Per 06_API_CONTRACT.md section 11.7.
 */
public record AddProjectMemberRequest(
        @NotNull(message = "userId không được để trống")
        UUID userId,

        @NotNull(message = "projectRole không được để trống")
        ProjectRole projectRole
) {
}
