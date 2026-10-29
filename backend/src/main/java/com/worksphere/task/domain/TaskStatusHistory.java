package com.worksphere.task.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity for task_status_histories table.
 * Per 05_DATABASE_DESIGN.md section 8.5 and V005 migration.
 */
@Entity
@Table(name = "task_status_histories")
public class TaskStatusHistory {

    @Id
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private TaskStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private TaskStatus toStatus;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    protected TaskStatusHistory() {
    }

    public static TaskStatusHistory create(
            UUID id,
            UUID taskId,
            TaskStatus fromStatus,
            TaskStatus toStatus,
            String comment,
            UUID changedBy
    ) {
        Objects.requireNonNull(id, "TaskStatusHistory id must not be null");
        Objects.requireNonNull(taskId, "Task id must not be null");
        Objects.requireNonNull(toStatus, "To status must not be null");
        Objects.requireNonNull(changedBy, "Changed by must not be null");

        TaskStatusHistory history = new TaskStatusHistory();
        history.id = id;
        history.taskId = taskId;
        history.fromStatus = fromStatus;
        history.toStatus = toStatus;
        history.comment = comment != null ? comment.trim() : null;
        history.changedBy = changedBy;
        history.changedAt = Instant.now();
        return history;
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public UUID getTaskId() {
        return taskId;
    }

    public TaskStatus getFromStatus() {
        return fromStatus;
    }

    public TaskStatus getToStatus() {
        return toStatus;
    }

    public String getComment() {
        return comment;
    }

    public UUID getChangedBy() {
        return changedBy;
    }

    public Instant getChangedAt() {
        return changedAt;
    }
}
