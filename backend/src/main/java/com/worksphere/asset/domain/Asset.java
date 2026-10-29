package com.worksphere.asset.domain;

import com.worksphere.shared.exception.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * JPA Entity for assets table.
 * Per 05_DATABASE_DESIGN.md section 10.2, V006 migration, and D-046.
 */
@Entity
@Table(name = "assets")
public class Asset {

    @Id
    private UUID id;

    @Column(name = "asset_code", nullable = false, length = 50)
    private String assetCode;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "serial_number", length = 150)
    private String serialNumber;

    @Column(name = "manufacturer", length = 150)
    private String manufacturer;

    @Column(name = "model", length = 150)
    private String model;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "purchase_price", precision = 18, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "warranty_end_date")
    private LocalDate warrantyEndDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private AssetStatus status;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;

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

    protected Asset() {
    }

    public static Asset create(
            UUID id,
            String assetCode,
            UUID categoryId,
            String name,
            String description,
            String serialNumber,
            String manufacturer,
            String model,
            LocalDate purchaseDate,
            BigDecimal purchasePrice,
            LocalDate warrantyEndDate,
            String location,
            UUID createdBy,
            Instant now
    ) {
        Asset asset = new Asset();
        asset.id = id != null ? id : UUID.randomUUID();
        asset.assetCode = assetCode;
        asset.categoryId = categoryId;
        asset.name = name;
        asset.description = description;
        asset.serialNumber = serialNumber;
        asset.manufacturer = manufacturer;
        asset.model = model;
        asset.purchaseDate = purchaseDate;
        asset.purchasePrice = purchasePrice;
        asset.warrantyEndDate = warrantyEndDate;
        asset.status = AssetStatus.AVAILABLE;
        asset.location = location;
        asset.deleted = false;
        asset.createdBy = createdBy;
        asset.updatedBy = createdBy;
        asset.createdAt = now != null ? now : Instant.now();
        asset.updatedAt = asset.createdAt;
        return asset;
    }

    public void update(
            UUID categoryId,
            String name,
            String description,
            String serialNumber,
            String manufacturer,
            String model,
            LocalDate purchaseDate,
            BigDecimal purchasePrice,
            LocalDate warrantyEndDate,
            AssetStatus newStatus,
            String location,
            UUID updatedBy,
            Instant now
    ) {
        if (newStatus != null && newStatus != this.status) {
            validateUpdateStatusTransition(this.status, newStatus);
            this.status = newStatus;
        }

        if (categoryId != null) {
            this.categoryId = categoryId;
        }
        if (name != null) {
            this.name = name;
        }
        this.description = description;
        this.serialNumber = serialNumber;
        this.manufacturer = manufacturer;
        this.model = model;
        this.purchaseDate = purchaseDate;
        this.purchasePrice = purchasePrice;
        this.warrantyEndDate = warrantyEndDate;
        this.location = location;
        this.updatedBy = updatedBy;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public void assign(UUID updatedBy, Instant now) {
        if (this.status != AssetStatus.AVAILABLE) {
            throw new BusinessRuleException("ASSET_NOT_AVAILABLE", "Tài sản không ở trạng thái sẵn sàng để cấp phát");
        }
        this.status = AssetStatus.ASSIGNED;
        this.updatedBy = updatedBy;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public void changeStatus(AssetStatus newStatus, Instant now) {
        if (newStatus != null && newStatus != this.status) {
            validateUpdateStatusTransition(this.status, newStatus);
            this.status = newStatus;
            this.updatedAt = now != null ? now : Instant.now();
        }
    }

    public void returnAsset(AssetStatus resultingStatus, UUID updatedBy, Instant now) {
        if (resultingStatus == AssetStatus.ASSIGNED) {
            throw new BusinessRuleException("ASSET_STATUS_TRANSITION_INVALID",
                    "Không thể chuyển tài sản sang ASSIGNED khi trả");
        }
        this.status = resultingStatus;
        this.updatedBy = updatedBy;
        this.updatedAt = now != null ? now : Instant.now();
    }

    public void softDelete(UUID deletedBy, Instant now) {
        this.deleted = true;
        this.deletedBy = deletedBy;
        this.deletedAt = now != null ? now : Instant.now();
        this.updatedBy = deletedBy;
        this.updatedAt = this.deletedAt;
    }

    private void validateUpdateStatusTransition(AssetStatus currentStatus, AssetStatus targetStatus) {
        if (currentStatus == AssetStatus.RETIRED) {
            throw new BusinessRuleException("ASSET_RETIRED", "Tài sản đã thanh lý không thể thay đổi trạng thái");
        }
        if (targetStatus == AssetStatus.ASSIGNED) {
            throw new BusinessRuleException("ASSET_STATUS_TRANSITION_INVALID",
                    "Không thể đặt trực tiếp trạng thái ASSIGNED qua cập nhật tài sản");
        }
        if (currentStatus == AssetStatus.ASSIGNED) {
            throw new BusinessRuleException("ASSET_STATUS_TRANSITION_INVALID",
                    "Tài sản đang cấp phát không thể đổi trạng thái qua cập nhật chung");
        }

        // Allowed transitions between warehouse states (AVAILABLE, MAINTENANCE, BROKEN, RETIRED)
        boolean allowed = switch (currentStatus) {
            case AVAILABLE -> targetStatus == AssetStatus.MAINTENANCE
                    || targetStatus == AssetStatus.BROKEN
                    || targetStatus == AssetStatus.RETIRED;
            case MAINTENANCE -> targetStatus == AssetStatus.AVAILABLE
                    || targetStatus == AssetStatus.BROKEN
                    || targetStatus == AssetStatus.RETIRED;
            case BROKEN -> targetStatus == AssetStatus.MAINTENANCE
                    || targetStatus == AssetStatus.AVAILABLE
                    || targetStatus == AssetStatus.RETIRED;
            default -> false;
        };

        if (!allowed) {
            throw new BusinessRuleException("ASSET_STATUS_TRANSITION_INVALID",
                    "Chuyển đổi trạng thái từ " + currentStatus + " sang " + targetStatus + " không hợp lệ");
        }
    }

    public UUID getId() {
        return id;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public String getModel() {
        return model;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public LocalDate getWarrantyEndDate() {
        return warrantyEndDate;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public String getLocation() {
        return location;
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
