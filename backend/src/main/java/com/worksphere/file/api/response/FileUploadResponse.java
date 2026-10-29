package com.worksphere.file.api.response;

import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for uploaded file metadata.
 * Per 06_API_CONTRACT.md section 16.1.
 */
public record FileUploadResponse(
        UUID id,
        String originalName,
        String mimeType,
        Long sizeBytes,
        String downloadUrl,
        Instant createdAt
) {
}
