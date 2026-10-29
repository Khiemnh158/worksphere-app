package com.worksphere.service_request.api.request;

import com.worksphere.service_request.domain.ServicePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Request payload for creating a service category.
 * Per 06_API_CONTRACT.md section 13.1.2.
 */
public record CreateServiceCategoryRequest(
        UUID parentId,

        @NotBlank(message = "Mã danh mục không được để trống")
        @Size(min = 2, max = 50, message = "Mã danh mục phải từ 2 đến 50 ký tự")
        @Pattern(regexp = "^[A-Z0-9_]{2,50}$", message = "Mã danh mục chỉ chứa chữ hoa, chữ số và dấu gạch dưới")
        String code,

        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 150, message = "Tên danh mục tối đa 150 ký tự")
        String name,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        @NotNull(message = "Mức độ ưu tiên mặc định không được để trống")
        ServicePriority defaultPriority,

        Boolean active
) {
}
