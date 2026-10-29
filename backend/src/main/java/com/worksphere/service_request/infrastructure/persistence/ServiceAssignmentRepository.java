package com.worksphere.service_request.infrastructure.persistence;

import com.worksphere.service_request.domain.ServiceAssignment;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for ServiceAssignment.
 */
@Repository
public interface ServiceAssignmentRepository extends JpaRepository<ServiceAssignment, UUID> {

    Optional<ServiceAssignment> findByRequestIdAndActiveTrue(UUID requestId);

    boolean existsByRequestIdAndAssigneeIdAndActiveTrue(UUID requestId, UUID assigneeId);

    List<ServiceAssignment> findAllByRequestIdOrderByAssignedAtDesc(UUID requestId);

    List<ServiceAssignment> findAllByRequestIdInAndActiveTrue(Collection<UUID> requestIds);
}
