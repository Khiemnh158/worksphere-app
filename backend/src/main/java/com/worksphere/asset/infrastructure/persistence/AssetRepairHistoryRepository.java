package com.worksphere.asset.infrastructure.persistence;

import com.worksphere.asset.domain.AssetRepairHistory;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for AssetRepairHistory.
 */
@Repository
public interface AssetRepairHistoryRepository extends JpaRepository<AssetRepairHistory, UUID> {

    List<AssetRepairHistory> findByAssetIdOrderByStartedAtDesc(UUID assetId);

    List<AssetRepairHistory> findByAssetIdInOrderByStartedAtDesc(Collection<UUID> assetIds);

    Optional<AssetRepairHistory> findByIdAndAssetId(UUID id, UUID assetId);
}
