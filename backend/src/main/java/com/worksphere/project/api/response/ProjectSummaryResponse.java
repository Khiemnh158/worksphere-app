package com.worksphere.project.api.response;

import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectPriority;
import com.worksphere.project.domain.ProjectStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Summary response for Project list item.
 * Per 06_API_CONTRACT.md section 11.1.
 */
public record ProjectSummaryResponse(
        UUID id,
        String code,
        String name,
        String description,
        ProjectStatus status,
        ProjectPriority priority,
        ManagerSummary manager,
        LocalDate startDate,
        LocalDate plannedEndDate,
        BigDecimal progressPercent,
        long memberCount,
        TaskSummary taskSummary,
        Instant createdAt,
        Instant updatedAt
) {
    public record ManagerSummary(UUID id, String fullName, String avatarUrl) {}
    public record TaskSummary(long total, long completed, long overdue) {}

    public static ProjectSummaryResponse from(
            Project project,
            String managerFullName,
            String managerAvatarUrl,
            long memberCount
    ) {
        return new ProjectSummaryResponse(
                project.getId(),
                project.getCode(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getPriority(),
                new ManagerSummary(project.getManagerId(), managerFullName, managerAvatarUrl),
                project.getStartDate(),
                project.getPlannedEndDate(),
                project.getProgressPercent(),
                memberCount,
                new TaskSummary(0, 0, 0), // Task module is Phase 7
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
