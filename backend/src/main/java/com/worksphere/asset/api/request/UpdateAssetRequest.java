package com.worksphere.asset.api.request;

import com.worksphere.asset.domain.AssetStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Request payload for updating an Asset.
 * Per 06_API_CONTRACT.md section 14.5 and D-046.
 */
public record UpdateAssetRequest(
        UUID categoryId,

        @NotBlank(message = "Tên tài sản không được để trống")
        @Size(max = 200, message = "Tên tài sản tối đa 200 ký tự")
        String name,

        String description,

        @Size(max = 150, message = "Số serial tối đa 150 ký tự")
        String serialNumber,

        @Size(max = 150, message = "Nhà sản xuất tối đa 150 ký tự")
        String manufacturer,

        @Size(max = 150, message = "Model tối đa 150 ký tự")
        String model,

        LocalDate purchaseDate,

        @DecimalMin(value = "0.0", message = "Giá mua phải lớn hơn hoặc bằng 0")
        BigDecimal purchasePrice,

        LocalDate warrantyEndDate,

        AssetStatus status,

        @Size(max = 255, message = "Vị trí tối đa 255 ký tự")
        String location,

        @NotNull(message = "Phiên bản dữ liệu không được để trống")
        Long version
) {
}
