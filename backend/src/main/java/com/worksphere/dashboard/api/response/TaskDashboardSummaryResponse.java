package com.worksphere.dashboard.api.response;

/**
 * Task metrics summary in personal dashboard.
 * Per 06_API_CONTRACT.md Section 10.1.
 */
public record TaskDashboardSummaryResponse(
        int todo,
        int inProgress,
        int inReview,
        int completed,
        int overdue,
        int dueSoon
) {
    public static TaskDashboardSummaryResponse empty() {
        return new TaskDashboardSummaryResponse(0, 0, 0, 0, 0, 0);
    }
}
