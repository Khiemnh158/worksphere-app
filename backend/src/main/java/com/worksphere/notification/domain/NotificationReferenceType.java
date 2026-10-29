package com.worksphere.notification.domain;

/**
 * Reference types for notification deep-linking and domain entity affiliation.
 * Per 05_DATABASE_DESIGN.md Section 8.8 and 06_API_CONTRACT.md Section 15.
 */
public enum NotificationReferenceType {
    PROJECT,
    TASK,
    SERVICE_REQUEST,
    ASSET
}
