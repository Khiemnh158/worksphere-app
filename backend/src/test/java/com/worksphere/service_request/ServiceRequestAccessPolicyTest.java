package com.worksphere.service_request;

import com.worksphere.service_request.application.ServiceRequestAccessPolicy;
import com.worksphere.service_request.domain.ServiceStatus;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class ServiceRequestAccessPolicyTest {
    private final ServiceRequestAccessPolicy policy = new ServiceRequestAccessPolicy();

    @Test
    void requesterCanCancelOpenAndConfirmResolved() {
        assertThat(policy.canTransition(ServiceStatus.OPEN, ServiceStatus.CANCELLED, true, false, false)).isTrue();
        assertThat(policy.canTransition(ServiceStatus.RESOLVED, ServiceStatus.CLOSED, true, false, false)).isTrue();
    }

    @Test
    void unrelatedEmployeeCannotCancelOrConfirm() {
        assertThat(policy.canTransition(ServiceStatus.OPEN, ServiceStatus.CANCELLED, false, false, false)).isFalse();
        assertThat(policy.canTransition(ServiceStatus.RESOLVED, ServiceStatus.CLOSED, false, false, false)).isFalse();
    }

    @Test
    void assigneeCannotAcceptTheirOwnResolutionEvenWhenAdmin() {
        assertThat(policy.canTransition(ServiceStatus.RESOLVED, ServiceStatus.CLOSED, false, true, false)).isFalse();
        assertThat(policy.canTransition(ServiceStatus.RESOLVED, ServiceStatus.CLOSED, true, true, true)).isFalse();
    }

    @Test
    void requesterCannotPerformAgentTransitions() {
        assertThat(policy.canTransition(ServiceStatus.ASSIGNED, ServiceStatus.IN_PROGRESS, true, false, false)).isFalse();
        assertThat(policy.canTransition(ServiceStatus.IN_PROGRESS, ServiceStatus.RESOLVED, true, false, false)).isFalse();
    }

    @Test
    void assignedAgentCanStartWaitResumeAndResolve() {
        assertThat(policy.canTransition(ServiceStatus.ASSIGNED, ServiceStatus.IN_PROGRESS, false, true, false)).isTrue();
        assertThat(policy.canTransition(ServiceStatus.IN_PROGRESS, ServiceStatus.WAITING_FOR_USER, false, true, false)).isTrue();
        assertThat(policy.canTransition(ServiceStatus.WAITING_FOR_USER, ServiceStatus.IN_PROGRESS, false, true, false)).isTrue();
        assertThat(policy.canTransition(ServiceStatus.IN_PROGRESS, ServiceStatus.RESOLVED, false, true, false)).isTrue();
    }

    @Test
    void terminalRequestsCannotBeChangedAndRejectionUsesDedicatedEndpoint() {
        assertThat(policy.canTransition(ServiceStatus.CLOSED, ServiceStatus.IN_PROGRESS, true, true, true)).isFalse();
        assertThat(policy.canTransition(ServiceStatus.CANCELLED, ServiceStatus.ASSIGNED, true, true, true)).isFalse();
        assertThat(policy.canTransition(ServiceStatus.RESOLVED, ServiceStatus.IN_PROGRESS, true, false, false)).isFalse();
        assertThat(policy.canTransition(ServiceStatus.OPEN, ServiceStatus.ASSIGNED, false, true, true)).isFalse();
    }
}
