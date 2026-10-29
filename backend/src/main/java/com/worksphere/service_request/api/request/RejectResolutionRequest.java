package com.worksphere.service_request.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for rejecting a resolved service request.
 * Per 06_API_CONTRACT.md section 13.7.1.
 */
public record RejectResolutionRequest(
        @NotBlank(message = "Lý do từ chối không được để trống")
        @Size(max = 1000, message = "Lý do từ chối tối đa 1000 ký tự")
        String reason,

        @NotNull(message = "Phiên bản dữ liệu không được để trống")
        Long version
) {
}
