package com.worksphere.service_request.api.request;

import com.worksphere.service_request.domain.ServiceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for changing service request status.
 * Per 06_API_CONTRACT.md section 13.7.
 */
public record UpdateServiceRequestStatusRequest(
        @NotNull(message = "Trạng thái mới không được để trống")
        ServiceStatus status,

        @Size(max = 1000, message = "Ghi chú/giải pháp tối đa 1000 ký tự")
        String comment,

        @NotNull(message = "Phiên bản dữ liệu không được để trống")
        Long version
) {
}
