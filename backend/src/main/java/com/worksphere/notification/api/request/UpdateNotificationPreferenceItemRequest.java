package com.worksphere.notification.api.request;

import jakarta.validation.constraints.NotNull;

/**
 * Item DTO for updating a single notification preference.
 * Per 06_API_CONTRACT.md Section 15.5.
 */
public record UpdateNotificationPreferenceItemRequest(
        @NotNull(message = "notificationType không được để trống")
        String notificationType,

        @NotNull(message = "inAppEnabled không được để trống")
        Boolean inAppEnabled,

        @NotNull(message = "pushEnabled không được để trống")
        Boolean pushEnabled,

        @NotNull(message = "emailEnabled không được để trống")
        Boolean emailEnabled
) {
}
