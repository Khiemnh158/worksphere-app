package com.worksphere.service_request.api.response;

import com.worksphere.service_request.domain.ServiceCategory;
import com.worksphere.service_request.domain.ServicePriority;
import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for a service category.
 * Per 06_API_CONTRACT.md section 13.1.
 */
public record ServiceCategoryResponse(
        UUID id,
        UUID parentId,
        String code,
        String name,
        String description,
        ServicePriority defaultPriority,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
    public static ServiceCategoryResponse from(ServiceCategory category) {
        return new ServiceCategoryResponse(
                category.getId(),
                category.getParentId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.getDefaultPriority(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt(),
                category.getVersion()
        );
    }
}
