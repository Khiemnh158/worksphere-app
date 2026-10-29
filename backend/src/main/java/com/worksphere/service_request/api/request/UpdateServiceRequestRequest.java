package com.worksphere.service_request.api.request;

import com.worksphere.service_request.domain.ServicePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Request payload for updating an OPEN service request.
 * Per 06_API_CONTRACT.md section 13.5.
 */
public record UpdateServiceRequestRequest(
        UUID categoryId,

        @NotBlank(message = "Tiêu đề yêu cầu không được để trống")
        @Size(max = 255, message = "Tiêu đề yêu cầu tối đa 255 ký tự")
        String title,

        @NotBlank(message = "Mô tả yêu cầu không được để trống")
        String description,

        ServicePriority priority,

        UUID assetId,

        @NotNull(message = "Phiên bản dữ liệu không được để trống")
        Long version
) {
}
