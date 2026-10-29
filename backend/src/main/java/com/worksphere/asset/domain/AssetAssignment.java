package com.worksphere.asset.domain;

import com.worksphere.shared.exception.BusinessRuleException;
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
 * JPA Entity for asset_assignments table.
 * Per 05_DATABASE_DESIGN.md section 10.3, V006 migration, and D-046.
 */
@Entity
@Table(name = "asset_assignments")
public class AssetAssignment {

    @Id
    private UUID id;

    @Column(name = "asset_id", nullable = false)
    private UUID assetId;

    @Column(name = "assigned_to", nullable = false)
    private UUID assignedTo;

    @Column(name = "assigned_by", nullable = false)
    private UUID assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "expected_return_at")
    private Instant expectedReturnAt;

    @Column(name = "returned_at")
    private Instant returnedAt;

    @Column(name = "return_condition", length = 500)
    private String returnCondition;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private AssetAssignmentStatus status;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected AssetAssignment() {
    }

    public static AssetAssignment create(
            UUID id,
            UUID assetId,
            UUID assignedTo,
            UUID assignedBy,
            Instant assignedAt,
            Instant expectedReturnAt,
            String notes,
            Instant now
    ) {
        AssetAssignment assignment = new AssetAssignment();
        assignment.id = id != null ? id : UUID.randomUUID();
        assignment.assetId = assetId;
        assignment.assignedTo = assignedTo;
        assignment.assignedBy = assignedBy;
        assignment.assignedAt = assignedAt != null ? assignedAt : (now != null ? now : Instant.now());
        assignment.expectedReturnAt = expectedReturnAt;
        assignment.notes = notes;
        assignment.status = AssetAssignmentStatus.ACTIVE;
        assignment.createdAt = now != null ? now : Instant.now();
        assignment.updatedAt = assignment.createdAt;
        return assignment;
    }

    public void markReturned(String returnCondition, Instant now) {
        if (this.status != AssetAssignmentStatus.ACTIVE) {
            throw new BusinessRuleException("ASSET_ASSIGNMENT_NOT_ACTIVE", "Phân công không ở trạng thái hoạt động");
        }
        this.status = AssetAssignmentStatus.RETURNED;
        this.returnCondition = returnCondition;
        this.returnedAt = now != null ? now : Instant.now();
        this.updatedAt = this.returnedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public UUID getAssignedTo() {
        return assignedTo;
    }

    public UUID getAssignedBy() {
        return assignedBy;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public Instant getExpectedReturnAt() {
        return expectedReturnAt;
    }

    public Instant getReturnedAt() {
        return returnedAt;
    }

    public String getReturnCondition() {
        return returnCondition;
    }

    public AssetAssignmentStatus getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
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
