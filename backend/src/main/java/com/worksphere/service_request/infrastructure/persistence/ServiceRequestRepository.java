package com.worksphere.service_request.infrastructure.persistence;

import com.worksphere.service_request.domain.ServicePriority;
import com.worksphere.service_request.domain.ServiceRequest;
import com.worksphere.service_request.domain.ServiceStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for ServiceRequest.
 */
@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, UUID>, JpaSpecificationExecutor<ServiceRequest> {

    Optional<ServiceRequest> findByIdAndDeletedFalse(UUID id);

    boolean existsByCategoryIdAndDeletedFalse(UUID categoryId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000")})
    @Query("SELECT sr FROM ServiceRequest sr WHERE sr.id = :id AND sr.deleted = false")
    Optional<ServiceRequest> findByIdForUpdate(@Param("id") UUID id);

    @Query(value = "SELECT pg_advisory_xact_lock(1301, :year)", nativeQuery = true)
    void acquireRequestNumberLock(@Param("year") int year);

    @Query(value = """
            SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 9) AS INTEGER)), 0) + 1
            FROM service_requests
            WHERE request_number LIKE :prefix
            """, nativeQuery = true)
    Integer getNextSequenceForPrefix(@Param("prefix") String prefix);
}
