package com.worksphere.project.infrastructure.persistence;

import com.worksphere.project.domain.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA Repository for Milestone entity.
 */
public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {

    List<Milestone> findAllByProjectIdOrderByDueDateAsc(UUID projectId);
}
