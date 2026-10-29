package com.worksphere.service_request.api.request;

import com.worksphere.service_request.domain.ServicePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Request payload for updating a service category.
 * Per 06_API_CONTRACT.md section 13.1.4.
 */
public record UpdateServiceCategoryRequest(
        UUID parentId,

        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 150, message = "Tên danh mục tối đa 150 ký tự")
        String name,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        @NotNull(message = "Mức độ ưu tiên mặc định không được để trống")
        ServicePriority defaultPriority,

        Boolean active,

        @NotNull(message = "Phiên bản dữ liệu không được để trống")
        Long version
) {
}
