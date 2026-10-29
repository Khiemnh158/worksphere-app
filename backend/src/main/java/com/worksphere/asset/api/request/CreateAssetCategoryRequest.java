package com.worksphere.asset.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating an Asset Category.
 * Per 06_API_CONTRACT.md section 14.0.3 and D-046.
 */
public record CreateAssetCategoryRequest(
        @NotBlank(message = "Mã loại tài sản không được để trống")
        @Size(min = 2, max = 50, message = "Mã loại tài sản từ 2 đến 50 ký tự")
        String code,

        @NotBlank(message = "Tên loại tài sản không được để trống")
        @Size(max = 150, message = "Tên loại tài sản tối đa 150 ký tự")
        String name,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        Boolean active
) {
}
