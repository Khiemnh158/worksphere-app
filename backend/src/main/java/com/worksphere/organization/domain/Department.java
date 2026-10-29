package com.worksphere.organization.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for the departments table.
 * Per 05_DATABASE_DESIGN.md section 6.1 and V002 migration.
 */
@Entity
@Table(name = "departments")
public class Department {

    @Id
    private UUID id;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "manager_id")
    private UUID managerId;

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

    protected Department() {
    }

    public static Department create(
            UUID id,
            String code,
            String name,
            String description,
            UUID parentId,
            UUID managerId
    ) {
        Department dept = new Department();
        dept.id = id != null ? id : UUID.randomUUID();
        dept.code = code;
        dept.name = name;
        dept.description = description;
        dept.parentId = parentId;
        dept.managerId = managerId;
        dept.active = true;
        dept.deleted = false;
        dept.createdAt = Instant.now();
        dept.updatedAt = Instant.now();
        return dept;
    }

    public void update(String name, String description, UUID parentId, UUID managerId) {
        this.name = name;
        this.description = description;
        this.parentId = parentId;
        this.managerId = managerId;
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

    public UUID getParentId() {
        return parentId;
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

    public UUID getManagerId() {
        return managerId;
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
