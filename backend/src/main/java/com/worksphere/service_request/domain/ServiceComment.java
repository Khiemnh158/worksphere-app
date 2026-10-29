package com.worksphere.service_request.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for service_comments table.
 * Per 05_DATABASE_DESIGN.md section 9.4 and V007 migration.
 */
@Entity
@Table(name = "service_comments")
public class ServiceComment {

    @Id
    private UUID id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_internal", nullable = false)
    private boolean internal;

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

    protected ServiceComment() {
    }

    public static ServiceComment create(
            UUID id,
            UUID requestId,
            UUID authorId,
            String content,
            boolean isInternal,
            Instant now
    ) {
        ServiceComment sc = new ServiceComment();
        sc.id = id != null ? id : UUID.randomUUID();
        sc.requestId = requestId;
        sc.authorId = authorId;
        sc.content = content;
        sc.internal = isInternal;
        sc.edited = false;
        sc.deleted = false;
        sc.createdAt = now != null ? now : Instant.now();
        sc.updatedAt = sc.createdAt;
        return sc;
    }

    public void updateContent(String newContent, Instant now) {
        this.content = newContent;
        this.edited = true;
        this.editedAt = now != null ? now : Instant.now();
        this.updatedAt = this.editedAt;
    }

    public void softDelete(Instant now) {
        this.deleted = true;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getRequestId() {
        return requestId;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public String getContent() {
        return content;
    }

    public boolean isInternal() {
        return internal;
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
