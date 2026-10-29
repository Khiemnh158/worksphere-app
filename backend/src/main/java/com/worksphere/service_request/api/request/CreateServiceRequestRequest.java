package com.worksphere.service_request.api.request;

import com.worksphere.service_request.domain.ServicePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * Request payload for creating a service request.
 * Per 06_API_CONTRACT.md section 13.3.
 */
public record CreateServiceRequestRequest(
        @NotNull(message = "Danh mục yêu cầu không được để trống")
        UUID categoryId,

        @NotBlank(message = "Tiêu đề yêu cầu không được để trống")
        @Size(max = 255, message = "Tiêu đề yêu cầu tối đa 255 ký tự")
        String title,

        @NotBlank(message = "Mô tả yêu cầu không được để trống")
        String description,

        ServicePriority priority,

        UUID assetId,

        List<UUID> attachmentFileIds
) {
}
