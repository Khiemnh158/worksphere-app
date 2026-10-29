package com.worksphere.task.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Domain entity representing an attachment linked to a Task.
 * Maps to table 'task_attachments' per 05_DATABASE_DESIGN.md section 8.4.
 */
@Entity
@Table(
        name = "task_attachments",
        uniqueConstraints = @UniqueConstraint(name = "uk_task_attachments", columnNames = {"task_id", "file_id"})
)
public class TaskAttachment {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "task_id", nullable = false, updatable = false)
    private UUID taskId;

    @Column(name = "file_id", nullable = false, updatable = false)
    private UUID fileId;

    @Column(name = "uploaded_by", nullable = false, updatable = false)
    private UUID uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected TaskAttachment() {
        // Required by JPA
    }

    private TaskAttachment(UUID id, UUID taskId, UUID fileId, UUID uploadedBy, Instant createdAt) {
        this.id = Objects.requireNonNull(id, "Attachment id cannot be null");
        this.taskId = Objects.requireNonNull(taskId, "Task id cannot be null");
        this.fileId = Objects.requireNonNull(fileId, "File id cannot be null");
        this.uploadedBy = Objects.requireNonNull(uploadedBy, "Uploader id cannot be null");
        this.createdAt = Objects.requireNonNull(createdAt, "Created at cannot be null");
    }

    /**
     * Factory method to link a stored file to a task.
     */
    public static TaskAttachment create(UUID id, UUID taskId, UUID fileId, UUID uploadedBy) {
        return new TaskAttachment(id, taskId, fileId, uploadedBy, Instant.now());
    }

    public UUID getId() {
        return id;
    }

    public UUID getTaskId() {
        return taskId;
    }

    public UUID getFileId() {
        return fileId;
    }

    public UUID getUploadedBy() {
        return uploadedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
