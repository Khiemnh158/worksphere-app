package com.worksphere.task.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity for task_assignments table.
 * Per 05_DATABASE_DESIGN.md section 8.2 and V005 migration.
 */
@Entity
@Table(name = "task_assignments")
public class TaskAssignment {

    @Id
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "assignee_id", nullable = false)
    private UUID assigneeId;

    @Column(name = "assigned_by", nullable = false)
    private UUID assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "unassigned_at")
    private Instant unassignedAt;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    protected TaskAssignment() {
    }

    public static TaskAssignment create(UUID id, UUID taskId, UUID assigneeId, UUID assignedBy) {
        Objects.requireNonNull(id, "TaskAssignment id must not be null");
        Objects.requireNonNull(taskId, "Task id must not be null");
        Objects.requireNonNull(assigneeId, "Assignee id must not be null");
        Objects.requireNonNull(assignedBy, "Assigned by must not be null");

        TaskAssignment assignment = new TaskAssignment();
        assignment.id = id;
        assignment.taskId = taskId;
        assignment.assigneeId = assigneeId;
        assignment.assignedBy = assignedBy;
        assignment.assignedAt = Instant.now();
        assignment.unassignedAt = null;
        assignment.active = true;
        return assignment;
    }

    public void unassign() {
        this.active = false;
        this.unassignedAt = Instant.now();
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public UUID getTaskId() {
        return taskId;
    }

    public UUID getAssigneeId() {
        return assigneeId;
    }

    public UUID getAssignedBy() {
        return assignedBy;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public Instant getUnassignedAt() {
        return unassignedAt;
    }

    public boolean isActive() {
        return active;
    }
}
