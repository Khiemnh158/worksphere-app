package com.worksphere.asset.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for asset_repair_histories table.
 * Immutable audit record of asset repair/maintenance events.
 * Per 05_DATABASE_DESIGN.md section 10.4, V006 migration, and D-046.
 */
@Entity
@Table(name = "asset_repair_histories")
public class AssetRepairHistory {

    @Id
    private UUID id;

    @Column(name = "asset_id", nullable = false)
    private UUID assetId;

    @Column(name = "service_request_id")
    private UUID serviceRequestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "repair_type", nullable = false, length = 50)
    private AssetRepairType repairType;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "vendor_name", length = 255)
    private String vendorName;

    @Column(name = "cost", precision = 18, scale = 2)
    private BigDecimal cost;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "result", length = 1000)
    private String result;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AssetRepairHistory() {
    }

    public static AssetRepairHistory create(
            UUID id,
            UUID assetId,
            UUID serviceRequestId,
            AssetRepairType repairType,
            String description,
            String vendorName,
            BigDecimal cost,
            Instant startedAt,
            Instant completedAt,
            String result,
            UUID createdBy,
            Instant now
    ) {
        AssetRepairHistory history = new AssetRepairHistory();
        history.id = id != null ? id : UUID.randomUUID();
        history.assetId = assetId;
        history.serviceRequestId = serviceRequestId;
        history.repairType = repairType;
        history.description = description;
        history.vendorName = vendorName;
        history.cost = cost;
        history.startedAt = startedAt;
        history.completedAt = completedAt;
        history.result = result;
        history.createdBy = createdBy;
        history.createdAt = now != null ? now : Instant.now();
        history.updatedAt = history.createdAt;
        return history;
    }

    public UUID getId() {
        return id;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public UUID getServiceRequestId() {
        return serviceRequestId;
    }

    public AssetRepairType getRepairType() {
        return repairType;
    }

    public String getDescription() {
        return description;
    }

    public String getVendorName() {
        return vendorName;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public String getResult() {
        return result;
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
