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
 * JPA Entity for project_members table.
 * Per 05_DATABASE_DESIGN.md section 7.2 and V003 migration.
 */
@Entity
@Table(name = "project_members")
public class ProjectMember {

    @Id
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "project_role", nullable = false, length = 50)
    private ProjectRole projectRole;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProjectMember() {
    }

    public static ProjectMember create(
            UUID id,
            UUID projectId,
            UUID userId,
            ProjectRole projectRole,
            UUID createdBy
    ) {
        ProjectMember member = new ProjectMember();
        member.id = id;
        member.projectId = projectId;
        member.userId = userId;
        member.projectRole = projectRole != null ? projectRole : ProjectRole.MEMBER;
        member.joinedAt = Instant.now();
        member.active = true;
        member.createdBy = createdBy;
        member.createdAt = Instant.now();
        member.updatedAt = Instant.now();
        return member;
    }

    public void updateRole(ProjectRole newRole) {
        this.projectRole = newRole;
        this.updatedAt = Instant.now();
    }

    public void deactivate() {
        this.active = false;
        this.leftAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getUserId() {
        return userId;
    }

    public ProjectRole getProjectRole() {
        return projectRole;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public Instant getLeftAt() {
        return leftAt;
    }

    public boolean isActive() {
        return active;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
