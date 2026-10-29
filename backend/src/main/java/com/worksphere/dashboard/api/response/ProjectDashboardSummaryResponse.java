package com.worksphere.dashboard.api.response;

/**
 * Project metrics summary in personal dashboard.
 * Per 06_API_CONTRACT.md Section 10.1.
 */
public record ProjectDashboardSummaryResponse(
        int active,
        int onHold
) {
    public static ProjectDashboardSummaryResponse empty() {
        return new ProjectDashboardSummaryResponse(0, 0);
    }
}
