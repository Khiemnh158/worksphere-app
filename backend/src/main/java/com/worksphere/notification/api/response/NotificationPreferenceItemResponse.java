package com.worksphere.notification.api.response;

import com.worksphere.notification.domain.NotificationType;

/**
 * Item DTO for notification preference.
 * Per 06_API_CONTRACT.md Section 15.5.
 */
public record NotificationPreferenceItemResponse(
        NotificationType notificationType,
        boolean inAppEnabled,
        boolean pushEnabled,
        boolean emailEnabled
) {
}
