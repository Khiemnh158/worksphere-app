package com.worksphere.organization.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for the teams table.
 * Per 05_DATABASE_DESIGN.md section 6.2 and V002 migration.
 */
@Entity
@Table(name = "teams")
public class Team {

    @Id
    private UUID id;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "leader_id")
    private UUID leaderId;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected Team() {
    }

    public static Team create(
            UUID id,
            UUID departmentId,
            String code,
            String name,
            String description,
            UUID leaderId
    ) {
        Team team = new Team();
        team.id = id != null ? id : UUID.randomUUID();
        team.departmentId = departmentId;
        team.code = code;
        team.name = name;
        team.description = description;
        team.leaderId = leaderId;
        team.active = true;
        team.deleted = false;
        team.createdAt = Instant.now();
        team.updatedAt = Instant.now();
        return team;
    }

    public void update(String name, String description, UUID leaderId) {
        this.name = name;
        this.description = description;
        this.leaderId = leaderId;
        this.updatedAt = Instant.now();
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = Instant.now();
    }

    public void softDelete(UUID deletedBy) {
        this.deleted = true;
        this.deletedAt = Instant.now();
        this.deletedBy = deletedBy;
        this.updatedAt = Instant.now();
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public UUID getDepartmentId() {
        return departmentId;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public UUID getLeaderId() {
        return leaderId;
    }

    public boolean isActive() {
        return active;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public UUID getDeletedBy() {
        return deletedBy;
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
