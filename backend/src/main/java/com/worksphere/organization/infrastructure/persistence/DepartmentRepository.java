package com.worksphere.organization.infrastructure.persistence;

import com.worksphere.organization.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for Department entity.
 */
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    @Query("SELECT d FROM Department d WHERE d.deleted = false ORDER BY d.name ASC")
    List<Department> findAllActive();

    @Query("SELECT d FROM Department d WHERE d.id = :id AND d.deleted = false")
    Optional<Department> findActiveById(@Param("id") UUID id);

    boolean existsByCodeAndDeletedFalse(String code);

    @Query("SELECT d FROM Department d WHERE d.parentId = :parentId AND d.deleted = false")
    List<Department> findByParentId(@Param("parentId") UUID parentId);
}
