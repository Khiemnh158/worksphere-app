package com.worksphere.asset.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for updating an Asset Category.
 * Per 06_API_CONTRACT.md section 14.0.5 and D-046.
 */
public record UpdateAssetCategoryRequest(
        @NotBlank(message = "Tên loại tài sản không được để trống")
        @Size(max = 150, message = "Tên loại tài sản tối đa 150 ký tự")
        String name,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        Boolean active,

        @NotNull(message = "Phiên bản dữ liệu không được để trống")
        Long version
) {
}
