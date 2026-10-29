package com.worksphere.asset.infrastructure.persistence;

import com.worksphere.asset.domain.AssetAssignment;
import com.worksphere.asset.domain.AssetAssignmentStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for AssetAssignment.
 */
@Repository
public interface AssetAssignmentRepository extends JpaRepository<AssetAssignment, UUID> {

    Optional<AssetAssignment> findFirstByAssetIdAndStatus(UUID assetId, AssetAssignmentStatus status);

    List<AssetAssignment> findByAssetIdAndStatus(UUID assetId, AssetAssignmentStatus status);

    boolean existsByAssetIdAndStatus(UUID assetId, AssetAssignmentStatus status);

    Optional<AssetAssignment> findByIdAndAssetId(UUID id, UUID assetId);

    List<AssetAssignment> findByAssetIdOrderByAssignedAtDesc(UUID assetId);

    boolean existsByAssetIdAndAssignedToAndStatus(UUID assetId, UUID assignedTo, AssetAssignmentStatus status);

    List<AssetAssignment> findByAssetIdInAndStatus(Collection<UUID> assetIds, AssetAssignmentStatus status);
}
