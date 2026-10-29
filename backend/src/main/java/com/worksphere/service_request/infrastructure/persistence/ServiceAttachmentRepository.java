package com.worksphere.service_request.infrastructure.persistence;

import com.worksphere.service_request.domain.ServiceAttachment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for ServiceAttachment.
 */
@Repository
public interface ServiceAttachmentRepository extends JpaRepository<ServiceAttachment, UUID> {

    List<ServiceAttachment> findAllByRequestIdOrderByCreatedAtAsc(UUID requestId);

    boolean existsByFileId(UUID fileId);

    boolean existsByRequestIdAndFileId(UUID requestId, UUID fileId);
}
