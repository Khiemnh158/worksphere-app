package com.worksphere.service_request.infrastructure.persistence;

import com.worksphere.service_request.domain.ServiceRating;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for ServiceRating.
 */
@Repository
public interface ServiceRatingRepository extends JpaRepository<ServiceRating, UUID> {

    Optional<ServiceRating> findByRequestId(UUID requestId);

    boolean existsByRequestId(UUID requestId);
}
