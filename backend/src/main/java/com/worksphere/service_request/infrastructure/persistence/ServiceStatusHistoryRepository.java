package com.worksphere.service_request.infrastructure.persistence;

import com.worksphere.service_request.domain.ServiceStatusHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for ServiceStatusHistory.
 */
@Repository
public interface ServiceStatusHistoryRepository extends JpaRepository<ServiceStatusHistory, UUID> {

    List<ServiceStatusHistory> findAllByRequestIdOrderByChangedAtAsc(UUID requestId);
}
