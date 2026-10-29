package com.worksphere.notification.api.response;

import java.util.List;

/**
 * Response DTO for full notification preferences list.
 * Per 06_API_CONTRACT.md Section 15.5.
 */
public record NotificationPreferencesResponse(
        List<NotificationPreferenceItemResponse> preferences
) {
}
