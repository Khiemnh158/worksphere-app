package com.worksphere.dashboard.application;

import com.worksphere.dashboard.api.response.PersonalDashboardResponse;
import com.worksphere.dashboard.api.response.ProjectDashboardSummaryResponse;
import com.worksphere.dashboard.api.response.RecentNotificationItemResponse;
import com.worksphere.dashboard.api.response.ServiceRequestDashboardSummaryResponse;
import com.worksphere.dashboard.api.response.TaskDashboardSummaryResponse;
import com.worksphere.dashboard.api.response.UpcomingTaskItemResponse;
import com.worksphere.dashboard.infrastructure.persistence.DashboardQueryRepository;
import com.worksphere.notification.domain.Notification;
import com.worksphere.notification.infrastructure.persistence.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Application service for Personal Dashboard aggregation.
 * Per 06_API_CONTRACT.md Section 10.1 and reports/DECISIONS.md D-049, D-050.
 */
@Service
public class DashboardApplicationService {

    private final DashboardQueryRepository dashboardQueryRepository;
    private final NotificationRepository notificationRepository;
    private final Clock clock;

    public DashboardApplicationService(
            DashboardQueryRepository dashboardQueryRepository,
            NotificationRepository notificationRepository,
            Clock clock
    ) {
        this.dashboardQueryRepository = dashboardQueryRepository;
        this.notificationRepository = notificationRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PersonalDashboardResponse getPersonalDashboard(UUID principalId) {
        Instant now = clock.instant();

        TaskDashboardSummaryResponse tasks = dashboardQueryRepository.getTaskSummary(principalId, now);
        ServiceRequestDashboardSummaryResponse serviceRequests = dashboardQueryRepository.getServiceRequestSummary(principalId);
        ProjectDashboardSummaryResponse projects = dashboardQueryRepository.getProjectSummary(principalId);
        List<UpcomingTaskItemResponse> upcomingTasks = dashboardQueryRepository.getUpcomingTasks(principalId, now);

        List<Notification> recentNotificationEntities = notificationRepository
                .findTop5ByRecipientIdOrderByCreatedAtDescIdDesc(principalId);
        List<RecentNotificationItemResponse> recentNotifications = recentNotificationEntities.stream()
                .map(RecentNotificationItemResponse::from)
                .toList();

        return new PersonalDashboardResponse(
                tasks,
                serviceRequests,
                projects,
                upcomingTasks,
                recentNotifications
        );
    }
}
