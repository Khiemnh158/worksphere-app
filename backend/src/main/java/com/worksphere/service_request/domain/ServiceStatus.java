package com.worksphere.service_request.domain;

/**
 * Service Request lifecycle status. Per 02_USER_ROLES_AND_WORKFLOWS.md section 6.2 and
 * 05_DATABASE_DESIGN.md section 9.2.
 */
public enum ServiceStatus {
    OPEN,
    ASSIGNED,
    IN_PROGRESS,
    WAITING_FOR_USER,
    RESOLVED,
    CLOSED,
    CANCELLED,
    REJECTED;

    /** Checks if transitioning from this status to the target status is allowed. */
    public boolean canTransitionTo(ServiceStatus target) {
        if (target == null || this == target) {
            return false;
        }
        return switch (this) {
            case OPEN -> target == ASSIGNED || target == CANCELLED;
            case ASSIGNED -> target == IN_PROGRESS;
            case IN_PROGRESS -> target == WAITING_FOR_USER || target == RESOLVED;
            case WAITING_FOR_USER -> target == IN_PROGRESS;
            case RESOLVED -> target == CLOSED || target == IN_PROGRESS;
            case CLOSED, CANCELLED, REJECTED -> false;
        };
    }
}
