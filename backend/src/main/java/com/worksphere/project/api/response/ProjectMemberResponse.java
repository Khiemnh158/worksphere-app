package com.worksphere.project.api.response;

import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectRole;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for Project Member.
 */
public record ProjectMemberResponse(
        UUID id,
        UUID projectId,
        UUID userId,
        String fullName,
        String email,
        String avatarUrl,
        ProjectRole projectRole,
        Instant joinedAt,
        Instant leftAt,
        boolean active
) {
    public static ProjectMemberResponse from(ProjectMember pm, String fullName, String email, String avatarUrl) {
        return new ProjectMemberResponse(
                pm.getId(),
                pm.getProjectId(),
                pm.getUserId(),
                fullName,
                email,
                avatarUrl,
                pm.getProjectRole(),
                pm.getJoinedAt(),
                pm.getLeftAt(),
                pm.isActive()
        );
    }
}
