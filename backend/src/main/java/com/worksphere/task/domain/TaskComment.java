package com.worksphere.task.domain;

import com.worksphere.shared.exception.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity for task_comments table.
 * Per 05_DATABASE_DESIGN.md section 8.3 and V005 migration.
 */
@Entity
@Table(name = "task_comments")
public class TaskComment {

    @Id
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "is_edited", nullable = false)
    private boolean edited;

    @Column(name = "edited_at")
    private Instant editedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TaskComment() {
    }

    public static TaskComment create(UUID id, UUID taskId, UUID authorId, String content, UUID parentId) {
        Objects.requireNonNull(id, "TaskComment id must not be null");
        Objects.requireNonNull(taskId, "Task id must not be null");
        Objects.requireNonNull(authorId, "Author id must not be null");
        Objects.requireNonNull(content, "Content must not be null");

        if (content.isBlank()) {
            throw new BusinessRuleException("VALIDATION_ERROR", "Nội dung bình luận không được để trống");
        }

        TaskComment comment = new TaskComment();
        comment.id = id;
        comment.taskId = taskId;
        comment.authorId = authorId;
        comment.content = content.trim();
        comment.parentId = parentId;
        comment.edited = false;
        comment.editedAt = null;
        comment.deleted = false;
        Instant now = Instant.now();
        comment.createdAt = now;
        comment.updatedAt = now;
        return comment;
    }

    public void editContent(String newContent) {
        Objects.requireNonNull(newContent, "Content must not be null");
        if (newContent.isBlank()) {
            throw new BusinessRuleException("VALIDATION_ERROR", "Nội dung bình luận không được để trống");
        }
        this.content = newContent.trim();
        this.edited = true;
        Instant now = Instant.now();
        this.editedAt = now;
        this.updatedAt = now;
    }

    public void softDelete() {
        this.deleted = true;
        this.updatedAt = Instant.now();
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public UUID getTaskId() {
        return taskId;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public String getContent() {
        return content;
    }

    public UUID getParentId() {
        return parentId;
    }

    public boolean isEdited() {
        return edited;
    }

    public Instant getEditedAt() {
        return editedAt;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
