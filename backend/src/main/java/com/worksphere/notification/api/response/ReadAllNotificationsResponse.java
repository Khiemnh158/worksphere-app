package com.worksphere.notification.api.response;

/**
 * Response DTO for mark-all-read operation.
 * Per 06_API_CONTRACT.md Section 15.3.
 */
public record ReadAllNotificationsResponse(
        int updatedCount
) {
}
