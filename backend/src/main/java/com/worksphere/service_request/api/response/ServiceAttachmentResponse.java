package com.worksphere.service_request.api.response;

import java.time.Instant;
import java.util.UUID;

/**
 * Implementation response projection for service attachments.
 * Per Decision D-035 (IMPLEMENTATION_RESPONSE_PROJECTION) and 06_API_CONTRACT.md section 13.4.
 */
public record ServiceAttachmentResponse(
        UUID fileId,
        String originalName,
        String mimeType,
        Long sizeBytes,
        String downloadUrl,
        UUID uploadedBy,
        Instant createdAt
) {
}
