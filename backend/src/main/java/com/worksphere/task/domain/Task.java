package com.worksphere.task.domain;

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
import java.time.ZoneOffset;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity for tasks table.
 * Per 05_DATABASE_DESIGN.md section 8.1, 02_USER_ROLES_AND_WORKFLOWS.md section 5.2,
 * and V005 migration.
 */
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "parent_task_id")
    private UUID parentTaskId;

    @Column(name = "milestone_id")
    private UUID milestoneId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private TaskStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private TaskPriority priority;

    @Column(name = "reporter_id", nullable = false)
    private UUID reporterId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "progress_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal progressPercent;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "actual_minutes")
    private Integer actualMinutes;

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

    protected Task() {
    }

    public static Task create(
            UUID id,
            UUID projectId,
            UUID parentTaskId,
            UUID milestoneId,
            String title,
            String description,
            TaskPriority priority,
            UUID reporterId,
            LocalDate startDate,
            Instant dueDate,
            Integer estimatedMinutes,
            UUID createdBy
    ) {
        Objects.requireNonNull(id, "Task id must not be null");
        Objects.requireNonNull(projectId, "Project id must not be null");
        Objects.requireNonNull(title, "Task title must not be null");
        Objects.requireNonNull(priority, "Task priority must not be null");
        Objects.requireNonNull(reporterId, "Reporter id must not be null");
        Objects.requireNonNull(createdBy, "Created by must not be null");

        if (title.isBlank()) {
            throw new BusinessRuleException("VALIDATION_ERROR", "Tiêu đề công việc không được để trống");
        }

        validateDateRange(startDate, dueDate);

        if (estimatedMinutes != null && estimatedMinutes < 0) {
            throw new BusinessRuleException("VALIDATION_ERROR", "Thời gian ước tính không được âm");
        }

        if (parentTaskId != null && parentTaskId.equals(id)) {
            throw new BusinessRuleException("TASK_PARENT_CYCLE_DETECTED", "Công việc không thể làm cha của chính nó");
        }

        Task task = new Task();
        task.id = id;
        task.projectId = projectId;
        task.parentTaskId = parentTaskId;
        task.milestoneId = milestoneId;
        task.title = title.trim();
        task.description = description != null ? description.trim() : null;
        task.status = TaskStatus.TODO;
        task.priority = priority;
        task.reporterId = reporterId;
        task.startDate = startDate;
        task.dueDate = dueDate;
        task.completedAt = null;
        task.progressPercent = BigDecimal.ZERO;
        task.estimatedMinutes = estimatedMinutes;
        task.actualMinutes = null;
        task.deleted = false;
        task.deletedAt = null;
        task.deletedBy = null;
        task.createdBy = createdBy;
        task.updatedBy = createdBy;
        Instant now = Instant.now();
        task.createdAt = now;
        task.updatedAt = now;
        return task;
    }

    public void updateDetails(
            String title,
            String description,
            TaskPriority priority,
            LocalDate startDate,
            Instant dueDate,
            Integer estimatedMinutes,
            UUID updatedBy
    ) {
        if (title != null) {
            if (title.isBlank()) {
                throw new BusinessRuleException("VALIDATION_ERROR", "Tiêu đề công việc không được để trống");
            }
            this.title = title.trim();
        }
        if (description != null) {
            this.description = description.trim();
        }
        if (priority != null) {
            this.priority = priority;
        }

        LocalDate effectiveStart = startDate != null ? startDate : this.startDate;
        Instant effectiveDue = dueDate != null ? dueDate : this.dueDate;
        validateDateRange(effectiveStart, effectiveDue);

        if (startDate != null) {
            this.startDate = startDate;
        }
        if (dueDate != null) {
            this.dueDate = dueDate;
        }
        if (estimatedMinutes != null) {
            if (estimatedMinutes < 0) {
                throw new BusinessRuleException("VALIDATION_ERROR", "Thời gian ước tính không được âm");
            }
            this.estimatedMinutes = estimatedMinutes;
        }

        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public void changeStatus(TaskStatus newStatus, String comment, UUID changedBy) {
        Objects.requireNonNull(newStatus, "New status must not be null");

        if (this.status == newStatus) {
            return;
        }

        if (this.status.isTerminal()) {
            throw new BusinessRuleException("TASK_TERMINAL_STATE",
                    "Công việc đã ở trạng thái kết thúc (" + this.status + "), không thể thay đổi trạng thái");
        }

        boolean validTransition = false;
        switch (this.status) {
            case TODO -> {
                if (newStatus == TaskStatus.IN_PROGRESS || newStatus == TaskStatus.CANCELLED) {
                    validTransition = true;
                }
            }
            case IN_PROGRESS -> {
                if (newStatus == TaskStatus.IN_REVIEW || newStatus == TaskStatus.CANCELLED) {
                    validTransition = true;
                }
            }
            case IN_REVIEW -> {
                if (newStatus == TaskStatus.COMPLETED) {
                    validTransition = true;
                } else if (newStatus == TaskStatus.IN_PROGRESS) {
                    validTransition = true;
                }
            }
            default -> validTransition = false;
        }

        if (!validTransition) {
            throw new BusinessRuleException("TASK_INVALID_STATUS_TRANSITION",
                    "Không thể chuyển trạng thái từ " + this.status + " sang " + newStatus);
        }

        this.status = newStatus;
        Instant now = Instant.now();

        if (newStatus == TaskStatus.COMPLETED) {
            this.progressPercent = new BigDecimal("100.00");
            this.completedAt = now;
        }

        this.updatedBy = changedBy;
        this.updatedAt = now;
    }

    public void updateProgress(BigDecimal newProgress, UUID updatedBy) {
        Objects.requireNonNull(newProgress, "Progress percent must not be null");

        if (this.status.isTerminal()) {
            throw new BusinessRuleException("TASK_TERMINAL_STATE",
                    "Không thể cập nhật tiến độ cho công việc ở trạng thái kết thúc (" + this.status + ")");
        }

        if (newProgress.compareTo(BigDecimal.ZERO) < 0 || newProgress.compareTo(new BigDecimal("100")) > 0) {
            throw new BusinessRuleException("TASK_INVALID_PROGRESS", "Tiến độ phải nằm trong khoảng từ 0 đến 100%");
        }

        this.progressPercent = newProgress;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public void setParentTaskId(UUID parentTaskId) {
        if (parentTaskId != null && parentTaskId.equals(this.id)) {
            throw new BusinessRuleException("TASK_PARENT_CYCLE_DETECTED", "Công việc không thể làm cha của chính nó");
        }
        this.parentTaskId = parentTaskId;
    }

    public void softDelete(UUID deletedBy) {
        this.deleted = true;
        this.deletedAt = Instant.now();
        this.deletedBy = deletedBy;
        this.updatedAt = Instant.now();
    }

    private static void validateDateRange(LocalDate startDate, Instant dueDate) {
        if (startDate != null && dueDate != null) {
            LocalDate dueLocalDate = dueDate.atZone(ZoneOffset.UTC).toLocalDate();
            if (startDate.isAfter(dueLocalDate)) {
                throw new BusinessRuleException("TASK_DATE_RANGE_INVALID",
                        "Ngày bắt đầu (" + startDate + ") không được sau hạn hoàn thành (" + dueLocalDate + ")");
            }
        }
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getParentTaskId() {
        return parentTaskId;
    }

    public UUID getMilestoneId() {
        return milestoneId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public TaskPriority getPriority() {
        return priority;
    }

    public UUID getReporterId() {
        return reporterId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public BigDecimal getProgressPercent() {
        return progressPercent;
    }

    public Integer getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public Integer getActualMinutes() {
        return actualMinutes;
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
