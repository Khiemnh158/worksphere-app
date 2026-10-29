package com.worksphere.notification.api.response;

import com.worksphere.notification.domain.Notification;
import com.worksphere.notification.domain.NotificationReferenceType;
import com.worksphere.notification.domain.NotificationType;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for a single notification item.
 * Per 06_API_CONTRACT.md Section 15.1.
 */
public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        NotificationReferenceType referenceType,
        UUID referenceId,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
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
