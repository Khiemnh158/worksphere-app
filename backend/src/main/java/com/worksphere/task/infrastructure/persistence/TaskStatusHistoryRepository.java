package com.worksphere.task.infrastructure.persistence;

import com.worksphere.task.domain.TaskStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA Repository for TaskStatusHistory.
 */
@Repository
public interface TaskStatusHistoryRepository extends JpaRepository<TaskStatusHistory, UUID> {

    List<TaskStatusHistory> findByTaskIdOrderByChangedAtDesc(UUID taskId);

    boolean existsByTaskId(UUID taskId);
}
