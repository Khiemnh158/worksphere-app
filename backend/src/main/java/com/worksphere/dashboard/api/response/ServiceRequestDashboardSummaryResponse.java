package com.worksphere.dashboard.api.response;

/**
 * Service Request metrics summary in personal dashboard.
 * Per 06_API_CONTRACT.md Section 10.1.
 */
public record ServiceRequestDashboardSummaryResponse(
        int open,
        int inProgress,
        int waitingForUser,
        int resolved
) {
    public static ServiceRequestDashboardSummaryResponse empty() {
        return new ServiceRequestDashboardSummaryResponse(0, 0, 0, 0);
    }
}
