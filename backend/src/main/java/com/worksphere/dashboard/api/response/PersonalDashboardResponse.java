package com.worksphere.dashboard.api.response;

import java.util.List;

/**
 * Full personal dashboard response DTO.
 * Per 06_API_CONTRACT.md Section 10.1.
 */
public record PersonalDashboardResponse(
        TaskDashboardSummaryResponse tasks,
        ServiceRequestDashboardSummaryResponse serviceRequests,
        ProjectDashboardSummaryResponse projects,
        List<UpcomingTaskItemResponse> upcomingTasks,
        List<RecentNotificationItemResponse> recentNotifications
) {
}
