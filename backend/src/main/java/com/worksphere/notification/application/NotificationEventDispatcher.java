package com.worksphere.notification.application;

import com.worksphere.notification.domain.NotificationReferenceType;
import com.worksphere.notification.domain.NotificationType;
import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.service_request.domain.ServiceStatus;
import com.worksphere.task.domain.TaskAssignment;
import com.worksphere.task.domain.TaskStatus;
import com.worksphere.task.infrastructure.persistence.TaskAssignmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Event dispatcher coordinating domain events and idempotent notification delivery.
 * Per 02_USER_ROLES_AND_WORKFLOWS.md Section 8 and reports/DECISIONS.md D-049, D-050.
 */
@Service
public class NotificationEventDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventDispatcher.class);

    private final NotificationApplicationService notificationService;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public NotificationEventDispatcher(
            NotificationApplicationService notificationService,
            TaskAssignmentRepository taskAssignmentRepository,
            ProjectMemberRepository projectMemberRepository
    ) {
        this.notificationService = notificationService;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    @Transactional
    public void onProjectMemberAdded(
            UUID projectId,
            UUID membershipId,
            UUID memberUserId,
            UUID actorId,
            String projectName
    ) {
        if (Objects.equals(memberUserId, actorId)) {
            return;
        }

        String eventKey = "PROJECT_MEMBER_ADDED:" + projectId + ":" + membershipId;
        String title = "Bạn đã được thêm vào dự án";
        String message = "Bạn đã được thêm vào dự án: " + (projectName != null ? projectName : "");

        notificationService.deliverInAppNotification(
                memberUserId,
                NotificationType.PROJECT_MEMBER_ADDED,
                title,
                message,
                NotificationReferenceType.PROJECT,
                projectId,
                eventKey
        );
    }

    @Transactional
    public void onTaskAssigned(
            UUID taskId,
            UUID assignmentId,
            UUID assigneeId,
            UUID actorId,
            String taskTitle
    ) {
        if (Objects.equals(assigneeId, actorId)) {
            return;
        }

        String eventKey = "TASK_ASSIGNED:" + taskId + ":" + assignmentId;
        String title = "Bạn được giao công việc mới";
        String message = "Bạn đã được giao công việc: " + (taskTitle != null ? taskTitle : "");

        notificationService.deliverInAppNotification(
                assigneeId,
                NotificationType.TASK_ASSIGNED,
                title,
                message,
                NotificationReferenceType.TASK,
                taskId,
                eventKey
        );
    }

    @Transactional
    public void onTaskStatusChanged(
            UUID taskId,
            UUID statusHistoryId,
            TaskStatus toStatus,
            UUID actorId,
            String taskTitle,
            UUID projectId,
            UUID reporterId
    ) {
        Set<UUID> recipientIds = new HashSet<>();

        // 1. Active assignee(s)
        List<TaskAssignment> activeAssignments = taskAssignmentRepository.findByTaskIdAndActiveTrue(taskId);
        for (TaskAssignment a : activeAssignments) {
            recipientIds.add(a.getAssigneeId());
        }

        // 2. Task reporter/creator
        if (reporterId != null) {
            recipientIds.add(reporterId);
        }

        // 3. Active PM / TL in project
        if (projectId != null) {
            List<ProjectMember> activeMembers = projectMemberRepository.findAllByProjectIdAndActiveTrue(projectId);
            for (ProjectMember m : activeMembers) {
                if (m.getProjectRole() == ProjectRole.PROJECT_MANAGER || m.getProjectRole() == ProjectRole.TEAM_LEADER) {
                    recipientIds.add(m.getUserId());
                }
            }
        }

        // 4. Remove actor
        if (actorId != null) {
            recipientIds.remove(actorId);
        }

        String eventKey = "TASK_STATUS_CHANGED:" + taskId + ":" + statusHistoryId;
        String title = "Trạng thái công việc đã thay đổi";
        String message = "Công việc " + (taskTitle != null ? taskTitle : "") + " đã chuyển sang trạng thái " + toStatus;

        for (UUID recipientId : recipientIds) {
            notificationService.deliverInAppNotification(
                    recipientId,
                    NotificationType.TASK_STATUS_CHANGED,
                    title,
                    message,
                    NotificationReferenceType.TASK,
                    taskId,
                    eventKey
            );
        }
    }

    @Transactional
    public void onTaskCommentAdded(
            UUID taskId,
            UUID commentId,
            UUID actorId,
            String taskTitle,
            UUID projectId,
            UUID reporterId
    ) {
        Set<UUID> recipientIds = new HashSet<>();

        // Active assignee(s)
        List<TaskAssignment> activeAssignments = taskAssignmentRepository.findByTaskIdAndActiveTrue(taskId);
        for (TaskAssignment a : activeAssignments) {
            recipientIds.add(a.getAssigneeId());
        }

        // Reporter
        if (reporterId != null) {
            recipientIds.add(reporterId);
        }

        // Active PM / TL
        if (projectId != null) {
            List<ProjectMember> activeMembers = projectMemberRepository.findAllByProjectIdAndActiveTrue(projectId);
            for (ProjectMember m : activeMembers) {
                if (m.getProjectRole() == ProjectRole.PROJECT_MANAGER || m.getProjectRole() == ProjectRole.TEAM_LEADER) {
                    recipientIds.add(m.getUserId());
                }
            }
        }

        if (actorId != null) {
            recipientIds.remove(actorId);
        }

        String eventKey = "COMMENT_ADDED:TASK:" + commentId;
        String title = "Có bình luận mới";
        String message = "Có bình luận mới trên công việc: " + (taskTitle != null ? taskTitle : "");

        for (UUID recipientId : recipientIds) {
            notificationService.deliverInAppNotification(
                    recipientId,
                    NotificationType.COMMENT_ADDED,
                    title,
                    message,
                    NotificationReferenceType.TASK,
                    taskId,
                    eventKey
            );
        }
    }

    @Transactional
    public void onServiceRequestAssigned(
            UUID requestId,
            UUID assignmentId,
            UUID assigneeId,
            UUID actorId,
            String requestTitle
    ) {
        if (Objects.equals(assigneeId, actorId)) {
            return;
        }

        String eventKey = "SERVICE_REQUEST_UPDATED:" + requestId + ":ASSIGNED:" + assignmentId;
        String title = "Bạn được phân công yêu cầu dịch vụ";
        String message = "Bạn được phân công xử lý yêu cầu: " + (requestTitle != null ? requestTitle : "");

        notificationService.deliverInAppNotification(
                assigneeId,
                NotificationType.SERVICE_REQUEST_UPDATED,
                title,
                message,
                NotificationReferenceType.SERVICE_REQUEST,
                requestId,
                eventKey
        );
    }

    @Transactional
    public void onServiceRequestStatusChanged(
            UUID requestId,
            UUID statusHistoryId,
            ServiceStatus toStatus,
            UUID actorId,
            String requestTitle,
            UUID requesterId
    ) {
        if (Objects.equals(requesterId, actorId)) {
            return;
        }

        String eventKey = "SERVICE_REQUEST_UPDATED:" + requestId + ":" + statusHistoryId;
        String title = "Yêu cầu dịch vụ được cập nhật";
        String message = "Yêu cầu " + (requestTitle != null ? requestTitle : "") + " đã chuyển sang trạng thái " + toStatus;

        notificationService.deliverInAppNotification(
                requesterId,
                NotificationType.SERVICE_REQUEST_UPDATED,
                title,
                message,
                NotificationReferenceType.SERVICE_REQUEST,
                requestId,
                eventKey
        );
    }

    @Transactional
    public void onServiceRequestCommentAdded(
            UUID requestId,
            UUID commentId,
            UUID actorId,
            String requestTitle,
            UUID requesterId,
            boolean isInternal,
            UUID activeAssigneeId
    ) {
        if (isInternal) {
            // Deferred per SERVICE_REQUEST_INTERNAL_NOTE_NOTIFICATION_DEFERRED
            return;
        }

        Set<UUID> recipientIds = new HashSet<>();
        if (Objects.equals(actorId, requesterId)) {
            if (activeAssigneeId != null) {
                recipientIds.add(activeAssigneeId);
            }
        } else if (Objects.equals(actorId, activeAssigneeId)) {
            if (requesterId != null) {
                recipientIds.add(requesterId);
            }
        } else {
            // Admin or third-party comment
            if (requesterId != null) {
                recipientIds.add(requesterId);
            }
            if (activeAssigneeId != null) {
                recipientIds.add(activeAssigneeId);
            }
        }

        if (actorId != null) {
            recipientIds.remove(actorId);
        }

        String eventKey = "COMMENT_ADDED:SERVICE_REQUEST:" + commentId;
        String title = "Có bình luận mới";
        String message = "Có bình luận mới trên yêu cầu: " + (requestTitle != null ? requestTitle : "");

        for (UUID recipientId : recipientIds) {
            notificationService.deliverInAppNotification(
                    recipientId,
                    NotificationType.COMMENT_ADDED,
                    title,
                    message,
                    NotificationReferenceType.SERVICE_REQUEST,
                    requestId,
                    eventKey
            );
        }
    }

    @Transactional
    public void onAssetAssigned(
            UUID assetId,
            UUID assignmentId,
            UUID assignedTo,
            UUID actorId,
            String assetName,
            String assetCode
    ) {
        if (Objects.equals(assignedTo, actorId)) {
            return;
        }

        String eventKey = "ASSET_ASSIGNED:" + assetId + ":" + assignmentId;
        String title = "Bạn được cấp phát tài sản";
        String message = "Bạn đã được cấp phát tài sản: " + (assetName != null ? assetName : "") + " (" + (assetCode != null ? assetCode : "") + ")";

        notificationService.deliverInAppNotification(
                assignedTo,
                NotificationType.ASSET_ASSIGNED,
                title,
                message,
                NotificationReferenceType.ASSET,
                assetId,
                eventKey
        );
    }
}
