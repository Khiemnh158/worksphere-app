package com.worksphere.service_request.infrastructure.persistence;

import com.worksphere.service_request.domain.ServiceComment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for ServiceComment.
 */
@Repository
public interface ServiceCommentRepository extends JpaRepository<ServiceComment, UUID> {

    Page<ServiceComment> findAllByRequestIdAndDeletedFalse(UUID requestId, Pageable pageable);

    Page<ServiceComment> findAllByRequestIdAndInternalFalseAndDeletedFalse(UUID requestId, Pageable pageable);

    List<ServiceComment> findAllByRequestIdAndDeletedFalseOrderByCreatedAtAsc(UUID requestId);

    List<ServiceComment> findAllByRequestIdAndInternalFalseAndDeletedFalseOrderByCreatedAtAsc(UUID requestId);
}
