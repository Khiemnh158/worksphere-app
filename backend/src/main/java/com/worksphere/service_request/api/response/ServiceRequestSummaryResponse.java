package com.worksphere.service_request.api.response;

import com.worksphere.service_request.domain.ServicePriority;
import com.worksphere.service_request.domain.ServiceStatus;
import java.time.Instant;
import java.util.UUID;

/**
 * Summary response for service request list endpoint.
 * Per 06_API_CONTRACT.md section 13.2.
 */
public record ServiceRequestSummaryResponse(
        UUID id,
        String requestNumber,
        UUID categoryId,
        String categoryName,
        UUID requesterId,
        String requesterName,
        UUID assigneeId,
        String assigneeName,
        String title,
        ServicePriority priority,
        ServiceStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
