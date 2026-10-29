package com.worksphere.project.infrastructure.persistence;

import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectPriority;
import com.worksphere.project.domain.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

/**
 * Spring Data JPA Repository for Project entity.
 */
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("SELECT p FROM Project p WHERE p.id = :id AND p.deleted = false")
    Optional<Project> findActiveById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Project p WHERE p.id = :id AND p.deleted = false")
    Optional<Project> findActiveByIdForUpdate(@Param("id") UUID id);

    @Query("SELECT p FROM Project p WHERE p.code = :code AND p.deleted = false")
    Optional<Project> findActiveByCode(@Param("code") String code);

    boolean existsByCodeAndDeletedFalse(String code);

    @Query(value = "SELECT p FROM Project p WHERE p.deleted = false " +
            "AND (CAST(:search AS string) IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:priority IS NULL OR p.priority = :priority) " +
            "AND (:managerId IS NULL OR p.managerId = :managerId) " +
            "AND (:departmentId IS NULL OR p.departmentId = :departmentId) " +
            "AND (:memberUserId IS NULL OR EXISTS (SELECT 1 FROM ProjectMember pm WHERE pm.projectId = p.id AND pm.userId = :memberUserId AND pm.active = true))",
           countQuery = "SELECT count(p) FROM Project p WHERE p.deleted = false " +
            "AND (CAST(:search AS string) IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:priority IS NULL OR p.priority = :priority) " +
            "AND (:managerId IS NULL OR p.managerId = :managerId) " +
            "AND (:departmentId IS NULL OR p.departmentId = :departmentId) " +
            "AND (:memberUserId IS NULL OR EXISTS (SELECT 1 FROM ProjectMember pm WHERE pm.projectId = p.id AND pm.userId = :memberUserId AND pm.active = true))")
    Page<Project> searchProjects(
            @Param("search") String search,
            @Param("status") ProjectStatus status,
            @Param("priority") ProjectPriority priority,
            @Param("managerId") UUID managerId,
            @Param("departmentId") UUID departmentId,
            @Param("memberUserId") UUID memberUserId,
            Pageable pageable
    );
}
