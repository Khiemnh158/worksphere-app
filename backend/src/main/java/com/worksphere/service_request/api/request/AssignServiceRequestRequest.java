package com.worksphere.service_request.api.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** Request payload for assigning a service request. Per 06_API_CONTRACT.md section 13.6. */
public record AssignServiceRequestRequest(
        @NotNull(message = "Người xử lý không được để trống") UUID assigneeId, Long version) {
    public AssignServiceRequestRequest(UUID assigneeId) {
        this(assigneeId, null);
    }
}
