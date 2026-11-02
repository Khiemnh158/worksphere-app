package com.worksphere.service_request.application;

import com.worksphere.service_request.domain.ServiceStatus;
import org.springframework.stereotype.Component;

/** Actor rules independent of controllers and presentation. */
@Component
public class ServiceRequestAccessPolicy {
    public boolean canTransition(ServiceStatus from, ServiceStatus to,
                                 boolean requester, boolean assignee, boolean admin) {
        if (from == null || !from.canTransitionTo(to)) {
            return false;
        }
        if (to == ServiceStatus.CANCELLED) {
            return requester && from == ServiceStatus.OPEN;
        }
        if (to == ServiceStatus.CLOSED) {
            return requester && !assignee && from == ServiceStatus.RESOLVED;
        }
        // Rejection needs its own endpoint and a mandatory reason.
        if (from == ServiceStatus.RESOLVED) {
            return false;
        }
        if (to == ServiceStatus.ASSIGNED) {
            return false;
        } // Assignment endpoint owns this transition.
        return assignee || admin;
    }
}
