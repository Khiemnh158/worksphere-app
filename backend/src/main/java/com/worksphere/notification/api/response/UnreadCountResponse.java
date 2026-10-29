package com.worksphere.notification.api.response;

/**
 * Response DTO for unread notification count.
 * Per 06_API_CONTRACT.md Section 15.4.
 */
public record UnreadCountResponse(
        long count
) {
}
