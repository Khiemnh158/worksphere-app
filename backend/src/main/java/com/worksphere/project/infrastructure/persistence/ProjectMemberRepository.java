package com.worksphere.project.infrastructure.persistence;

import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for ProjectMember entity.
 */
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    @Query("SELECT pm FROM ProjectMember pm WHERE pm.projectId = :projectId AND pm.userId = :userId AND pm.active = true")
    Optional<ProjectMember> findActiveByProjectIdAndUserId(@Param("projectId") UUID projectId, @Param("userId") UUID userId);

    boolean existsByProjectIdAndUserIdAndActiveTrue(UUID projectId, UUID userId);

    long countByProjectIdAndActiveTrue(UUID projectId);

    long countByProjectIdAndProjectRoleAndActiveTrue(UUID projectId, ProjectRole role);

    List<ProjectMember> findAllByProjectIdAndActiveTrue(UUID projectId);

    @Query("SELECT pm FROM ProjectMember pm WHERE pm.projectId = :projectId " +
            "AND (:role IS NULL OR pm.projectRole = :role) " +
            "AND (:active IS NULL OR pm.active = :active)")
    Page<ProjectMember> searchMembers(
            @Param("projectId") UUID projectId,
            @Param("role") ProjectRole role,
            @Param("active") Boolean active,
            Pageable pageable
    );
}
