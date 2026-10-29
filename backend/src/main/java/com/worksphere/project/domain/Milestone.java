package com.worksphere.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * JPA Entity for milestones table.
 * Per 05_DATABASE_DESIGN.md section 7.3 and V003 migration.
 */
@Entity
@Table(name = "milestones")
public class Milestone {

    @Id
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private MilestoneStatus status;

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

    protected Milestone() {
    }

    public static Milestone create(
            UUID id,
            UUID projectId,
            String name,
            String description,
            LocalDate dueDate,
            UUID createdBy
    ) {
        Milestone milestone = new Milestone();
        milestone.id = id;
        milestone.projectId = projectId;
        milestone.name = name;
        milestone.description = description;
        milestone.dueDate = dueDate;
        milestone.status = MilestoneStatus.PLANNED;
        milestone.createdBy = createdBy;
        milestone.createdAt = Instant.now();
        milestone.updatedAt = Instant.now();
        return milestone;
    }

    public void complete(UUID updatedBy) {
        this.status = MilestoneStatus.COMPLETED;
        this.completedAt = Instant.now();
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public MilestoneStatus getStatus() {
        return status;
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
