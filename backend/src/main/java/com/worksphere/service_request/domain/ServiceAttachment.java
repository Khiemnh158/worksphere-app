package com.worksphere.service_request.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for service_attachments table.
 * Per 05_DATABASE_DESIGN.md section 9.5 and V007 migration.
 */
@Entity
@Table(name = "service_attachments")
public class ServiceAttachment {

    @Id
    private UUID id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "file_id", nullable = false)
    private UUID fileId;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ServiceAttachment() {
    }

    public static ServiceAttachment create(
            UUID id,
            UUID requestId,
            UUID fileId,
            UUID uploadedBy,
            Instant createdAt
    ) {
        ServiceAttachment sa = new ServiceAttachment();
        sa.id = id != null ? id : UUID.randomUUID();
        sa.requestId = requestId;
        sa.fileId = fileId;
        sa.uploadedBy = uploadedBy;
        sa.createdAt = createdAt != null ? createdAt : Instant.now();
        return sa;
    }

    public UUID getId() {
        return id;
    }

    public UUID getRequestId() {
        return requestId;
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
