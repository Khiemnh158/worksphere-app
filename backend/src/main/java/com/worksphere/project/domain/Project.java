package com.worksphere.project.domain;

import com.worksphere.shared.exception.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * JPA Entity for projects table.
 * Per 05_DATABASE_DESIGN.md section 7.1 and V003 migration.
 */
@Entity
@Table(name = "projects")
public class Project {

    @Id
    private UUID id;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "manager_id", nullable = false)
    private UUID managerId;

    @Column(name = "department_id")
    private UUID departmentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ProjectStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private ProjectPriority priority;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "planned_end_date")
    private LocalDate plannedEndDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Column(name = "progress_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal progressPercent;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected Project() {
    }

    public static Project create(
            UUID id,
            String code,
            String name,
            String description,
            UUID managerId,
            UUID departmentId,
            ProjectPriority priority,
            LocalDate startDate,
            LocalDate plannedEndDate,
            UUID createdBy
    ) {
        validateDateRange(startDate, plannedEndDate);

        Project project = new Project();
        project.id = id;
        project.code = code;
        project.name = name;
        project.description = description;
        project.managerId = managerId;
        project.departmentId = departmentId;
        project.status = ProjectStatus.DRAFT; // Initial status is always DRAFT per API contract 11.2
        project.priority = priority != null ? priority : ProjectPriority.MEDIUM;
        project.startDate = startDate;
        project.plannedEndDate = plannedEndDate;
        project.progressPercent = BigDecimal.ZERO;
        project.deleted = false;
        project.createdBy = createdBy;
        project.createdAt = Instant.now();
        project.updatedAt = Instant.now();
        return project;
    }

    public void updateDetails(
            String name,
            String description,
            ProjectPriority priority,
            LocalDate startDate,
            LocalDate plannedEndDate,
            UUID updatedBy
    ) {
        validateDateRange(startDate, plannedEndDate);

        this.name = name;
        this.description = description;
        if (priority != null) {
            this.priority = priority;
        }
        this.startDate = startDate;
        this.plannedEndDate = plannedEndDate;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public void changeStatus(ProjectStatus targetStatus, UUID updatedBy) {
        if (this.status == targetStatus) {
            return;
        }
        if (this.status == ProjectStatus.COMPLETED) {
            throw new BusinessRuleException("PROJECT_ALREADY_COMPLETED", "Dự án đã hoàn thành, không thể chuyển trạng thái");
        }
        if (this.status == ProjectStatus.CANCELLED) {
            throw new BusinessRuleException("PROJECT_ALREADY_CANCELLED", "Dự án đã bị huỷ, không thể chuyển trạng thái");
        }

        // Validate allowed transitions per 02_USER_ROLES_AND_WORKFLOWS.md section 4.2
        boolean allowed = switch (this.status) {
            case DRAFT -> (targetStatus == ProjectStatus.ACTIVE || targetStatus == ProjectStatus.CANCELLED);
            case ACTIVE -> (targetStatus == ProjectStatus.ON_HOLD || targetStatus == ProjectStatus.COMPLETED || targetStatus == ProjectStatus.CANCELLED);
            case ON_HOLD -> (targetStatus == ProjectStatus.ACTIVE || targetStatus == ProjectStatus.CANCELLED);
            case COMPLETED, CANCELLED -> false;
        };

        if (!allowed) {
            throw new BusinessRuleException("PROJECT_STATUS_TRANSITION_INVALID",
                    "Không thể chuyển trạng thái dự án từ " + this.status + " sang " + targetStatus);
        }

        if (targetStatus == ProjectStatus.COMPLETED) {
            this.actualEndDate = LocalDate.now();
        }

        this.status = targetStatus;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public void softDelete(UUID deletedBy) {
        this.deleted = true;
        this.deletedAt = Instant.now();
        this.deletedBy = deletedBy;
        this.updatedAt = Instant.now();
    }

    private static void validateDateRange(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new BusinessRuleException("PROJECT_DATE_RANGE_INVALID", "Ngày kết thúc dự kiến không thể trước ngày bắt đầu");
        }
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public UUID getManagerId() {
        return managerId;
    }

    public UUID getDepartmentId() {
        return departmentId;
    }

    public ProjectStatus getStatus() {
        return status;
    }

    public ProjectPriority getPriority() {
        return priority;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getPlannedEndDate() {
        return plannedEndDate;
    }

    public LocalDate getActualEndDate() {
        return actualEndDate;
    }

    public BigDecimal getProgressPercent() {
        return progressPercent;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public UUID getDeletedBy() {
        return deletedBy;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Long getVersion() {
        return version;
    }
}
