package com.worksphere.project.domain;

/**
 * Status of a Milestone.
 * Per 05_DATABASE_DESIGN.md section 7.3.
 */
public enum MilestoneStatus {
    PLANNED,
    IN_PROGRESS,
    COMPLETED,
    OVERDUE,
    CANCELLED
}
