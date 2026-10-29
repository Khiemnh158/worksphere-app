package com.worksphere.task.infrastructure.persistence;

import com.worksphere.task.domain.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for TaskAttachment.
 */
@Repository
public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, UUID> {

    List<TaskAttachment> findByTaskId(UUID taskId);

    Optional<TaskAttachment> findByTaskIdAndFileId(UUID taskId, UUID fileId);

    boolean existsByFileId(UUID fileId);

    boolean existsByTaskIdAndFileId(UUID taskId, UUID fileId);

    long countByTaskId(UUID taskId);

    @org.springframework.data.jpa.repository.Query("SELECT a.taskId, COUNT(a.id) FROM TaskAttachment a WHERE a.taskId IN :taskIds GROUP BY a.taskId")
    List<Object[]> countByTaskIdIn(@org.springframework.data.repository.query.Param("taskIds") java.util.Collection<UUID> taskIds);

    Optional<TaskAttachment> findByFileId(UUID fileId);
}
