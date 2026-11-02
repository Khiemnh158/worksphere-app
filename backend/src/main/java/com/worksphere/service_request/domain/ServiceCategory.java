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
 * JPA Entity for service_categories table. Per 05_DATABASE_DESIGN.md section 9.1 and V007
 * migration.
 */
@Entity
@Table(name = "service_categories")
public class ServiceCategory {

    @Column(name = "receiving_department_id")
    private UUID receivingDepartmentId;

    public UUID getReceivingDepartmentId() {
        return receivingDepartmentId;
    }

    public void routeTo(UUID departmentId) {
        this.receivingDepartmentId = departmentId;
    }

    @Id private UUID id;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_priority", nullable = false, length = 20)
    private ServicePriority defaultPriority;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected ServiceCategory() {}

    public static ServiceCategory create(
            UUID id,
            UUID parentId,
            String code,
            String name,
            String description,
            ServicePriority defaultPriority,
            boolean active,
            Instant now) {
        ServiceCategory category = new ServiceCategory();
        category.id = id != null ? id : UUID.randomUUID();
        category.parentId = parentId;
        category.code = code;
        category.name = name;
        category.description = description;
        category.defaultPriority =
                defaultPriority != null ? defaultPriority : ServicePriority.MEDIUM;
        category.active = active;
        category.deleted = false;
        category.createdAt = now != null ? now : Instant.now();
        category.updatedAt = category.createdAt;
        return category;
    }

    public void update(
            String name,
            String description,
            UUID parentId,
            ServicePriority defaultPriority,
            Boolean active,
            Instant now) {
        this.name = name;
        this.description = description;
        this.parentId = parentId;
        if (defaultPriority != null) {
            this.defaultPriority = defaultPriority;
        }
        if (active != null) {
            this.active = active;
        }
        this.updatedAt = now != null ? now : Instant.now();
    }

    public void deactivate(Instant now) {
        this.active = false;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public void activate(Instant now) {
        this.active = true;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public void softDelete(Instant now) {
        this.deleted = true;
        this.updatedAt = now != null ? now : Instant.now();
    }

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

    public ServicePriority getDefaultPriority() {
        return defaultPriority;
    }

    public boolean isActive() {
        return active;
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

    public Long getVersion() {
        return version;
    }
}
