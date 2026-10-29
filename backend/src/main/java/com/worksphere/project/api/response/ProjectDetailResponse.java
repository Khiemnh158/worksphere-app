package com.worksphere.project.api.response;

import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectPriority;
import com.worksphere.project.domain.ProjectStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Detailed response for a Project.
 * Per 06_API_CONTRACT.md section 11.3.
 */
public record ProjectDetailResponse(
        UUID id,
        String code,
        String name,
        String description,
        ProjectStatus status,
        ProjectPriority priority,
        ManagerDetail manager,
        DepartmentDetail department,
        LocalDate startDate,
        LocalDate plannedEndDate,
        LocalDate actualEndDate,
        BigDecimal progressPercent,
        long memberCount,
        List<MilestoneResponse> milestones,
        List<Object> recentTasks,
        Set<String> allowedActions,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
    public record ManagerDetail(UUID id, String fullName, String avatarUrl) {}
    public record DepartmentDetail(UUID id, String code, String name) {}

    public static ProjectDetailResponse from(
            Project project,
            String managerFullName,
            String managerAvatarUrl,
            UUID deptId,
            String deptCode,
            String deptName,
            long memberCount,
            List<MilestoneResponse> milestones,
            Set<String> allowedActions
    ) {
        DepartmentDetail deptDetail = null;
        if (deptId != null) {
            deptDetail = new DepartmentDetail(deptId, deptCode, deptName);
        }

        return new ProjectDetailResponse(
                project.getId(),
                project.getCode(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getPriority(),
                new ManagerDetail(project.getManagerId(), managerFullName, managerAvatarUrl),
                deptDetail,
                project.getStartDate(),
                project.getPlannedEndDate(),
                project.getActualEndDate(),
                project.getProgressPercent(),
                memberCount,
                milestones != null ? milestones : List.of(),
                List.of(), // Phase 7
                allowedActions != null ? allowedActions : Set.of(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getVersion()
        );
    }
}
