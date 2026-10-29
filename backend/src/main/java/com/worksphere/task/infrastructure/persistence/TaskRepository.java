package com.worksphere.task.infrastructure.persistence;

import com.worksphere.task.domain.Task;
import com.worksphere.task.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for Task.
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    Optional<Task> findByIdAndDeletedFalse(UUID id);

    List<Task> findByParentTaskIdAndDeletedFalse(UUID parentTaskId);

    long countByParentTaskIdAndDeletedFalse(UUID parentTaskId);

    long countByParentTaskIdAndStatusAndDeletedFalse(UUID parentTaskId, TaskStatus status);
}
