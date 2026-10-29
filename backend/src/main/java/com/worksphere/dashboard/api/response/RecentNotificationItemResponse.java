package com.worksphere.dashboard.api.response;

import com.worksphere.notification.domain.Notification;
import com.worksphere.notification.domain.NotificationReferenceType;
import com.worksphere.notification.domain.NotificationType;

import java.time.Instant;
import java.util.UUID;

/**
 * Item projection for recent notifications in personal dashboard.
 * Per 06_API_CONTRACT.md Section 10.1.
 */
public record RecentNotificationItemResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        NotificationReferenceType referenceType,
        UUID referenceId,
        boolean read,
        Instant createdAt
) {
    public static RecentNotificationItemResponse from(Notification n) {
        return new RecentNotificationItemResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getReferenceType(),
                n.getReferenceId(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
