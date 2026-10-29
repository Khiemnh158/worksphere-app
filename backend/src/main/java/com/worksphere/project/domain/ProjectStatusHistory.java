package com.worksphere.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for project_status_histories table.
 * Per 05_DATABASE_DESIGN.md section 7.4 and V003 migration.
 */
@Entity
@Table(name = "project_status_histories")
public class ProjectStatusHistory {

    @Id
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private ProjectStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private ProjectStatus toStatus;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    protected ProjectStatusHistory() {
    }

    public static ProjectStatusHistory create(
            UUID id,
            UUID projectId,
            ProjectStatus fromStatus,
            ProjectStatus toStatus,
            String reason,
            UUID changedBy
    ) {
        ProjectStatusHistory history = new ProjectStatusHistory();
        history.id = id;
        history.projectId = projectId;
        history.fromStatus = fromStatus;
        history.toStatus = toStatus;
        history.reason = reason;
        history.changedBy = changedBy;
        history.changedAt = Instant.now();
        return history;
    }

    public UUID getId() {
        return id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public ProjectStatus getFromStatus() {
        return fromStatus;
    }

    public ProjectStatus getToStatus() {
        return toStatus;
    }

    public String getReason() {
        return reason;
    }

    public UUID getChangedBy() {
        return changedBy;
    }

    public Instant getChangedAt() {
        return changedAt;
    }
}
