package com.worksphere.organization.infrastructure.persistence;

import com.worksphere.organization.domain.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for Team entity.
 */
public interface TeamRepository extends JpaRepository<Team, UUID> {

    @Query("SELECT t FROM Team t WHERE t.deleted = false")
    List<Team> findAllActive();

    @Query("SELECT t FROM Team t WHERE t.id = :id AND t.deleted = false")
    Optional<Team> findActiveById(@Param("id") UUID id);

    @Query("SELECT t FROM Team t WHERE t.departmentId = :departmentId AND t.deleted = false")
    List<Team> findByDepartmentId(@Param("departmentId") UUID departmentId);
}
