package com.worksphere.task.domain;

/**
 * Task workflow statuses.
 * Per 05_DATABASE_DESIGN.md section 8.1 and 02_USER_ROLES_AND_WORKFLOWS.md section 5.2.
 */
public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    IN_REVIEW,
    COMPLETED,
    CANCELLED;

    /**
     * Checks if this status is a terminal state.
     */
    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED;
    }
}
