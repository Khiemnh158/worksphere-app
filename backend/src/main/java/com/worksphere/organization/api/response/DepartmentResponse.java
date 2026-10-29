package com.worksphere.organization.api.response;

import com.worksphere.organization.domain.Department;
import java.time.Instant;
import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        UUID parentId,
        String code,
        String name,
        String description,
        UUID managerId,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
    public static DepartmentResponse from(Department dept) {
        return new DepartmentResponse(
                dept.getId(),
                dept.getParentId(),
                dept.getCode(),
                dept.getName(),
                dept.getDescription(),
                dept.getManagerId(),
                dept.isActive(),
                dept.getCreatedAt(),
                dept.getUpdatedAt(),
                dept.getVersion()
        );
    }
}
