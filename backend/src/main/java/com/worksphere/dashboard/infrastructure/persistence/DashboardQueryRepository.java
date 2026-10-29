package com.worksphere.dashboard.infrastructure.persistence;

import com.worksphere.dashboard.api.response.ProjectDashboardSummaryResponse;
import com.worksphere.dashboard.api.response.ServiceRequestDashboardSummaryResponse;
import com.worksphere.dashboard.api.response.TaskDashboardSummaryResponse;
import com.worksphere.dashboard.api.response.UpcomingTaskItemResponse;
import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Repository for high-performance aggregate queries of Personal Dashboard.
 * Avoids full entity loading per reports/DECISIONS.md D-049, D-050.
 */
@Repository
public class DashboardQueryRepository {

    private static final Duration DUE_SOON_WINDOW = Duration.ofHours(72);

    @PersistenceContext
    private EntityManager entityManager;

    public TaskDashboardSummaryResponse getTaskSummary(UUID principalId, Instant now) {
        Instant dueSoonThreshold = now.plus(DUE_SOON_WINDOW);

        String sql = """
                SELECT
                    COALESCE(COUNT(CASE WHEN t.status = 'TODO' THEN 1 END), 0) AS todo_count,
                    COALESCE(COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END), 0) AS in_progress_count,
                    COALESCE(COUNT(CASE WHEN t.status = 'IN_REVIEW' THEN 1 END), 0) AS in_review_count,
                    COALESCE(COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END), 0) AS completed_count,
                    COALESCE(COUNT(CASE WHEN t.status NOT IN ('COMPLETED', 'CANCELLED')
                                         AND t.due_date IS NOT NULL
                                         AND t.due_date < :now THEN 1 END), 0) AS overdue_count,
                    COALESCE(COUNT(CASE WHEN t.status NOT IN ('COMPLETED', 'CANCELLED')
                                         AND t.due_date IS NOT NULL
                                         AND t.due_date >= :now
                                         AND t.due_date < :dueSoonThreshold THEN 1 END), 0) AS due_soon_count
                FROM tasks t
                WHERE t.is_deleted = FALSE
                  AND EXISTS (
                      SELECT 1
                      FROM task_assignments ta
                      WHERE ta.task_id = t.id
                        AND ta.assignee_id = :principalId
                        AND ta.is_active = TRUE
                  )
                """;

        Query query = entityManager.createNativeQuery(sql)
                .setParameter("principalId", principalId)
                .setParameter("now", Timestamp.from(now))
                .setParameter("dueSoonThreshold", Timestamp.from(dueSoonThreshold));

        Object[] result = (Object[]) query.getSingleResult();
        return new TaskDashboardSummaryResponse(
                ((Number) result[0]).intValue(),
                ((Number) result[1]).intValue(),
                ((Number) result[2]).intValue(),
                ((Number) result[3]).intValue(),
                ((Number) result[4]).intValue(),
                ((Number) result[5]).intValue()
        );
    }

    public ServiceRequestDashboardSummaryResponse getServiceRequestSummary(UUID principalId) {
        String sql = """
                SELECT
                    COALESCE(COUNT(DISTINCT CASE WHEN sr.status = 'OPEN' THEN sr.id END), 0) AS open_count,
                    COALESCE(COUNT(DISTINCT CASE WHEN sr.status = 'IN_PROGRESS' THEN sr.id END), 0) AS in_progress_count,
                    COALESCE(COUNT(DISTINCT CASE WHEN sr.status = 'WAITING_FOR_USER' THEN sr.id END), 0) AS waiting_count,
                    COALESCE(COUNT(DISTINCT CASE WHEN sr.status = 'RESOLVED' THEN sr.id END), 0) AS resolved_count
                FROM service_requests sr
                WHERE sr.is_deleted = FALSE
                  AND (
                      sr.requester_id = :principalId
                      OR EXISTS (
                          SELECT 1
                          FROM service_assignments sa
                          WHERE sa.request_id = sr.id
                            AND sa.assignee_id = :principalId
                            AND sa.is_active = TRUE
                      )
                  )
                """;

        Query query = entityManager.createNativeQuery(sql)
                .setParameter("principalId", principalId);

        Object[] result = (Object[]) query.getSingleResult();
        return new ServiceRequestDashboardSummaryResponse(
                ((Number) result[0]).intValue(),
                ((Number) result[1]).intValue(),
                ((Number) result[2]).intValue(),
                ((Number) result[3]).intValue()
        );
    }

    public ProjectDashboardSummaryResponse getProjectSummary(UUID principalId) {
        String sql = """
                SELECT
                    COALESCE(COUNT(CASE WHEN p.status = 'ACTIVE' THEN 1 END), 0) AS active_count,
                    COALESCE(COUNT(CASE WHEN p.status = 'ON_HOLD' THEN 1 END), 0) AS on_hold_count
                FROM projects p
                WHERE p.is_deleted = FALSE
                  AND EXISTS (
                      SELECT 1
                      FROM project_members pm
                      WHERE pm.project_id = p.id
                        AND pm.user_id = :principalId
                        AND pm.is_active = TRUE
                  )
                """;

        Query query = entityManager.createNativeQuery(sql)
                .setParameter("principalId", principalId);

        Object[] result = (Object[]) query.getSingleResult();
        return new ProjectDashboardSummaryResponse(
                ((Number) result[0]).intValue(),
                ((Number) result[1]).intValue()
        );
    }

    @SuppressWarnings("unchecked")
    public List<UpcomingTaskItemResponse> getUpcomingTasks(UUID principalId, Instant now) {
        Instant dueSoonThreshold = now.plus(DUE_SOON_WINDOW);

        String sql = """
                SELECT
                    t.id AS task_id,
                    t.project_id AS project_id,
                    p.name AS project_name,
                    t.title AS task_title,
                    t.status AS task_status,
                    t.priority AS task_priority,
                    t.due_date AS task_due_date
                FROM tasks t
                JOIN projects p ON p.id = t.project_id
                WHERE t.is_deleted = FALSE
                  AND t.status NOT IN ('COMPLETED', 'CANCELLED')
                  AND t.due_date IS NOT NULL
                  AND t.due_date >= :now
                  AND t.due_date < :dueSoonThreshold
                  AND EXISTS (
                      SELECT 1
                      FROM task_assignments ta
                      WHERE ta.task_id = t.id
                        AND ta.assignee_id = :principalId
                        AND ta.is_active = TRUE
                  )
                ORDER BY t.due_date ASC, t.id ASC
                LIMIT 5
                """;

        Query query = entityManager.createNativeQuery(sql)
                .setParameter("principalId", principalId)
                .setParameter("now", Timestamp.from(now))
                .setParameter("dueSoonThreshold", Timestamp.from(dueSoonThreshold));

        List<Object[]> rows = query.getResultList();
        List<UpcomingTaskItemResponse> items = new ArrayList<>();

        for (Object[] row : rows) {
            UUID taskId = (UUID) row[0];
            UUID projectId = (UUID) row[1];
            String projectName = (String) row[2];
            String title = (String) row[3];
            TaskStatus status = TaskStatus.valueOf((String) row[4]);
            TaskPriority priority = TaskPriority.valueOf((String) row[5]);
            Instant dueDate = null;
            if (row[6] instanceof Instant inst) {
                dueDate = inst;
            } else if (row[6] instanceof Timestamp ts) {
                dueDate = ts.toInstant();
            } else if (row[6] instanceof java.time.OffsetDateTime odt) {
                dueDate = odt.toInstant();
            }

            items.add(new UpcomingTaskItemResponse(
                    taskId,
                    projectId,
                    projectName,
                    title,
                    status,
                    priority,
                    dueDate
            ));
        }

        return items;
    }
}
