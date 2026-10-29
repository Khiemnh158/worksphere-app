package com.worksphere.service_request.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for service_status_histories table.
 * Per 05_DATABASE_DESIGN.md section 9.6 and V007 migration.
 */
@Entity
@Table(name = "service_status_histories")
public class ServiceStatusHistory {

    @Id
    private UUID id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private ServiceStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private ServiceStatus toStatus;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    protected ServiceStatusHistory() {
    }

    public static ServiceStatusHistory create(
            UUID id,
            UUID requestId,
            ServiceStatus fromStatus,
            ServiceStatus toStatus,
            String comment,
            UUID changedBy,
            Instant changedAt
    ) {
        ServiceStatusHistory history = new ServiceStatusHistory();
        history.id = id != null ? id : UUID.randomUUID();
        history.requestId = requestId;
        history.fromStatus = fromStatus;
        history.toStatus = toStatus;
        history.comment = comment;
        history.changedBy = changedBy;
        history.changedAt = changedAt != null ? changedAt : Instant.now();
        return history;
    }

    public UUID getId() {
        return id;
    }

    public UUID getRequestId() {
        return requestId;
    }

    public ServiceStatus getFromStatus() {
        return fromStatus;
    }

    public ServiceStatus getToStatus() {
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
