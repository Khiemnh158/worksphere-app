package com.worksphere.notification.infrastructure.persistence;

import com.worksphere.notification.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for Notification entity with idempotent native insert.
 * Per 05_DATABASE_DESIGN.md Section 8.8 and reports/DECISIONS.md D-049, D-050.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID>, JpaSpecificationExecutor<Notification> {

    Optional<Notification> findByIdAndRecipientId(UUID id, UUID recipientId);

    boolean existsByIdAndRecipientId(UUID id, UUID recipientId);

    long countByRecipientIdAndReadFalse(UUID recipientId);

    List<Notification> findTop5ByRecipientIdOrderByCreatedAtDescIdDesc(UUID recipientId);

    @Modifying
    @Query(value = """
            INSERT INTO notifications (
                id, recipient_id, type, title, message, reference_type, reference_id, event_key, is_read, created_at
            )
            VALUES (
                :id, :recipientId, :type, :title, :message, :referenceType, :referenceId, :eventKey, FALSE, :createdAt
            )
            ON CONFLICT (recipient_id, event_key) DO NOTHING
            """, nativeQuery = true)
    int insertIdempotent(
            @Param("id") UUID id,
            @Param("recipientId") UUID recipientId,
            @Param("type") String type,
            @Param("title") String title,
            @Param("message") String message,
            @Param("referenceType") String referenceType,
            @Param("referenceId") UUID referenceId,
            @Param("eventKey") String eventKey,
            @Param("createdAt") Instant createdAt
    );

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.read = true, n.readAt = :readAt
            WHERE n.id = :id AND n.recipientId = :recipientId AND n.read = false
            """)
    int markAsRead(
            @Param("id") UUID id,
            @Param("recipientId") UUID recipientId,
            @Param("readAt") Instant readAt
    );

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.read = true, n.readAt = :readAt
            WHERE n.recipientId = :recipientId AND n.read = false
            """)
    int markAllAsRead(
            @Param("recipientId") UUID recipientId,
            @Param("readAt") Instant readAt
    );
}
