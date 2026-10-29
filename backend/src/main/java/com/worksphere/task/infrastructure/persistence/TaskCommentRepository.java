package com.worksphere.task.infrastructure.persistence;

import com.worksphere.task.domain.TaskComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for TaskComment.
 */
@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, UUID> {

    Page<TaskComment> findByTaskIdAndDeletedFalse(UUID taskId, Pageable pageable);

    Optional<TaskComment> findByIdAndTaskIdAndDeletedFalse(UUID id, UUID taskId);

    long countByTaskIdAndDeletedFalse(UUID taskId);

    java.util.List<TaskComment> findTop5ByTaskIdAndDeletedFalseOrderByCreatedAtDesc(UUID taskId);
}
