package com.worksphere.project.api.request;

import com.worksphere.project.domain.ProjectRole;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for PUT /api/v1/projects/{projectId}/members/{memberId}.
 * Per 06_API_CONTRACT.md section 11.8.
 */
public record UpdateProjectMemberRoleRequest(
        @NotNull(message = "projectRole không được để trống")
        ProjectRole projectRole
) {
}
