package com.worksphere.service_request.api.response;

import com.worksphere.service_request.domain.ServiceStatus;
import java.util.UUID;

/**
 * Response payload for created service request.
 * Per 06_API_CONTRACT.md section 13.3.
 */
public record CreateServiceRequestResponse(
        UUID id,
        String requestNumber,
        ServiceStatus status
) {
}
