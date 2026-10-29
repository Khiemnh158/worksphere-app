package com.worksphere.asset.infrastructure.persistence;

import com.worksphere.asset.domain.AssetCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for AssetCategory.
 */
@Repository
public interface AssetCategoryRepository extends JpaRepository<AssetCategory, UUID>,
        JpaSpecificationExecutor<AssetCategory> {

    Optional<AssetCategory> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    Optional<AssetCategory> findByIdAndDeletedFalse(UUID id);

    List<AssetCategory> findAllByActiveTrueAndDeletedFalseOrderByNameAsc();

    Page<AssetCategory> findAll(Specification<AssetCategory> spec, Pageable pageable);
}
