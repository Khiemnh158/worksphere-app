package com.worksphere.notification.domain;

/**
 * Canonical notification types.
 * Per 02_USER_ROLES_AND_WORKFLOWS.md Section 8 and 06_API_CONTRACT.md Section 15.5.
 */
public enum NotificationType {
    PROJECT_MEMBER_ADDED,
    TASK_ASSIGNED,
    TASK_STATUS_CHANGED,
    TASK_DUE_SOON,
    TASK_OVERDUE,
    SERVICE_REQUEST_UPDATED,
    COMMENT_ADDED,
    ASSET_ASSIGNED
}
