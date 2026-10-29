package com.worksphere.service_request.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for service_requests table.
 * Per 05_DATABASE_DESIGN.md section 9.2 and V007 migration.
 */
@Entity
@Table(name = "service_requests")
public class ServiceRequest {

    @Id
    private UUID id;

    @Column(name = "request_number", nullable = false, unique = true, length = 30)
    private String requestNumber;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @Column(name = "asset_id")
    private UUID assetId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private ServicePriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ServiceStatus status;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

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

    protected ServiceRequest() {
    }

    public static ServiceRequest create(
            UUID id,
            String requestNumber,
            UUID categoryId,
            UUID requesterId,
            UUID assetId,
            String title,
            String description,
            ServicePriority priority,
            UUID createdBy,
            Instant now
    ) {
        ServiceRequest sr = new ServiceRequest();
        sr.id = id != null ? id : UUID.randomUUID();
        sr.requestNumber = requestNumber;
        sr.categoryId = categoryId;
        sr.requesterId = requesterId;
        sr.assetId = assetId;
        sr.title = title;
        sr.description = description;
        sr.priority = priority != null ? priority : ServicePriority.MEDIUM;
        sr.status = ServiceStatus.OPEN;
        sr.deleted = false;
        sr.createdBy = createdBy;
        sr.updatedBy = createdBy;
        sr.createdAt = now != null ? now : Instant.now();
        sr.updatedAt = sr.createdAt;
        return sr;
    }

    public void updateContent(
            String title,
            String description,
            ServicePriority priority,
            UUID categoryId,
            UUID assetId,
            UUID updatedBy,
            Instant now
    ) {
        this.title = title;
        this.description = description;
        if (priority != null) {
            this.priority = priority;
        }
        if (categoryId != null) {
            this.categoryId = categoryId;
        }
        this.assetId = assetId;
        this.updatedBy = updatedBy;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public void transitionStatus(ServiceStatus newStatus, UUID updatedBy, Instant now) {
        this.status = newStatus;
        this.updatedBy = updatedBy;
        this.updatedAt = now != null ? now : Instant.now();
        if (newStatus == ServiceStatus.RESOLVED) {
            this.resolvedAt = this.updatedAt;
        } else if (newStatus == ServiceStatus.CLOSED) {
            this.closedAt = this.updatedAt;
        } else if (newStatus == ServiceStatus.CANCELLED) {
            this.cancelledAt = this.updatedAt;
        } else if (newStatus == ServiceStatus.IN_PROGRESS && this.resolvedAt != null) {
            this.resolvedAt = null;
        }
    }

    public void softDelete(UUID updatedBy, Instant now) {
        this.deleted = true;
        this.updatedBy = updatedBy;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getRequesterId() {
        return requesterId;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public ServicePriority getPriority() {
        return priority;
    }

    public ServiceStatus getStatus() {
        return status;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public boolean isDeleted() {
        return deleted;
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
