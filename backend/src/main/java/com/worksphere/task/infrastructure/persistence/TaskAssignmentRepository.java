package com.worksphere.task.infrastructure.persistence;

import com.worksphere.task.domain.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for TaskAssignment.
 */
@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, UUID> {

    List<TaskAssignment> findByTaskIdAndActiveTrue(UUID taskId);

    List<TaskAssignment> findByTaskIdInAndActiveTrue(java.util.Collection<UUID> taskIds);

    Optional<TaskAssignment> findByIdAndTaskId(UUID id, UUID taskId);

    boolean existsByTaskIdAndAssigneeIdAndActiveTrue(UUID taskId, UUID assigneeId);

    Optional<TaskAssignment> findByTaskIdAndAssigneeIdAndActiveTrue(UUID taskId, UUID assigneeId);

    long countByTaskIdAndActiveTrue(UUID taskId);
}
