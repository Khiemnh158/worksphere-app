package com.worksphere.project.api.response;

import com.worksphere.project.domain.Milestone;
import com.worksphere.project.domain.MilestoneStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Response DTO for Milestone.
 */
public record MilestoneResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        LocalDate dueDate,
        Instant completedAt,
        MilestoneStatus status,
        UUID createdBy,
        Instant createdAt,
        Long version
) {
    public static MilestoneResponse from(Milestone milestone) {
        return new MilestoneResponse(
                milestone.getId(),
                milestone.getProjectId(),
                milestone.getName(),
                milestone.getDescription(),
                milestone.getDueDate(),
                milestone.getCompletedAt(),
                milestone.getStatus(),
                milestone.getCreatedBy(),
                milestone.getCreatedAt(),
                milestone.getVersion()
        );
    }
}
