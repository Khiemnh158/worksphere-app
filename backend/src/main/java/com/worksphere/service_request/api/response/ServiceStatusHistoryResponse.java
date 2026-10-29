package com.worksphere.service_request.api.response;

import com.worksphere.service_request.domain.ServiceStatus;
import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for a service status history entry.
 */
public record ServiceStatusHistoryResponse(
        UUID id,
        UUID requestId,
        ServiceStatus fromStatus,
        ServiceStatus toStatus,
        String comment,
        UUID changedBy,
        String changedByName,
        Instant changedAt
) {
}
