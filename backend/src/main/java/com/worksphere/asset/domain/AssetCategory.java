package com.worksphere.asset.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for asset_categories table.
 * Per 05_DATABASE_DESIGN.md section 10.1, V006 migration, and D-046.
 */
@Entity
@Table(name = "asset_categories")
public class AssetCategory {

    @Id
    private UUID id;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

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

    protected AssetCategory() {
    }

    public static AssetCategory create(
            UUID id,
            String code,
            String name,
            String description,
            boolean active,
            Instant now
    ) {
        AssetCategory category = new AssetCategory();
        category.id = id != null ? id : UUID.randomUUID();
        category.code = code;
        category.name = name;
        category.description = description;
        category.active = active;
        category.deleted = false;
        category.createdAt = now != null ? now : Instant.now();
        category.updatedAt = category.createdAt;
        return category;
    }

    public void update(
            String name,
            String description,
            Boolean active,
            Instant now
    ) {
        this.name = name;
        this.description = description;
        if (active != null) {
            this.active = active;
        }
        this.updatedAt = now != null ? now : Instant.now();
    }

    public void activate(Instant now) {
        this.active = true;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public void deactivate(Instant now) {
        this.active = false;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public UUID getId() {
        return id;
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
