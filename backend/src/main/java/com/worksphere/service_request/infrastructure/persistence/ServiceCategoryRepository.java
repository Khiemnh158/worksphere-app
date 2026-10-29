package com.worksphere.service_request.infrastructure.persistence;

import com.worksphere.service_request.domain.ServiceCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for ServiceCategory.
 */
@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, UUID> {

    Optional<ServiceCategory> findByIdAndDeletedFalse(UUID id);

    boolean existsByCodeIgnoreCaseAndDeletedFalse(String code);

    boolean existsByCodeIgnoreCaseAndIdNotAndDeletedFalse(String code, UUID id);

    List<ServiceCategory> findAllByActiveTrueAndDeletedFalseOrderByCodeAsc();

    List<ServiceCategory> findAllByDeletedFalse();

    boolean existsByParentIdAndDeletedFalse(UUID parentId);

    @Query(value = """
            SELECT c FROM ServiceCategory c
            WHERE c.deleted = false
              AND (:active IS NULL OR c.active = :active)
              AND (:parentId IS NULL OR c.parentId = :parentId)
              AND (:search IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))
            """,
            countQuery = """
            SELECT COUNT(c) FROM ServiceCategory c
            WHERE c.deleted = false
              AND (:active IS NULL OR c.active = :active)
              AND (:parentId IS NULL OR c.parentId = :parentId)
              AND (:search IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<ServiceCategory> searchCategories(
            @Param("search") String search,
            @Param("active") Boolean active,
            @Param("parentId") UUID parentId,
            Pageable pageable
    );
}
