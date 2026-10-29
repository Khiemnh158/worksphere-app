package com.worksphere.project.infrastructure.persistence;

import com.worksphere.project.domain.ProjectStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA Repository for ProjectStatusHistory entity.
 */
public interface ProjectStatusHistoryRepository extends JpaRepository<ProjectStatusHistory, UUID> {

    List<ProjectStatusHistory> findAllByProjectIdOrderByChangedAtAsc(UUID projectId);
}
