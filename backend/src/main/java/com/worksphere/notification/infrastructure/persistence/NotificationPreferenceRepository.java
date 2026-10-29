package com.worksphere.notification.infrastructure.persistence;

import com.worksphere.notification.domain.NotificationPreference;
import com.worksphere.notification.domain.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for NotificationPreference entity.
 * Per 05_DATABASE_DESIGN.md Section 8.8 and 06_API_CONTRACT.md Section 15.5.
 */
@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    List<NotificationPreference> findAllByUserId(UUID userId);

    Optional<NotificationPreference> findByUserIdAndNotificationType(UUID userId, NotificationType notificationType);

    boolean existsByUserIdAndNotificationType(UUID userId, NotificationType notificationType);
}
