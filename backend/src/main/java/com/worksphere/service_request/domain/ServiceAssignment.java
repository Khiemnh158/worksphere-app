package com.worksphere.service_request.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for service_assignments table.
 * Per 05_DATABASE_DESIGN.md section 9.3 and V007/V013 migrations.
 */
@Entity
@Table(name = "service_assignments")
public class ServiceAssignment {

    @Id
    private UUID id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

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

    protected ServiceAssignment() {
    }

    public static ServiceAssignment create(
            UUID id,
            UUID requestId,
            UUID assigneeId,
            UUID assignedBy,
            Instant assignedAt
    ) {
        ServiceAssignment sa = new ServiceAssignment();
        sa.id = id != null ? id : UUID.randomUUID();
        sa.requestId = requestId;
        sa.assigneeId = assigneeId;
        sa.assignedBy = assignedBy;
        sa.assignedAt = assignedAt != null ? assignedAt : Instant.now();
        sa.active = true;
        return sa;
    }

    public void deactivate(Instant unassignedAt) {
        this.active = false;
        this.unassignedAt = unassignedAt != null ? unassignedAt : Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getRequestId() {
        return requestId;
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
