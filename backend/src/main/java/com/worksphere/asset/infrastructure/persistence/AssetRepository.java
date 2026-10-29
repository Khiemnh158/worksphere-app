package com.worksphere.asset.infrastructure.persistence;

import com.worksphere.asset.domain.Asset;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for Asset.
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID>, JpaSpecificationExecutor<Asset> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000")})
    @Query("SELECT a FROM Asset a WHERE a.id = :id AND a.deleted = false")
    Optional<Asset> findByIdForUpdate(@Param("id") UUID id);

    Optional<Asset> findByIdAndDeletedFalse(UUID id);

    boolean existsByAssetCode(String assetCode);

    boolean existsBySerialNumber(String serialNumber);

    boolean existsBySerialNumberAndIdNot(String serialNumber, UUID id);

    boolean existsByCategoryIdAndDeletedFalse(UUID categoryId);

    Page<Asset> findAll(Specification<Asset> spec, Pageable pageable);
}
