package com.worksphere.asset.api.request;

import com.worksphere.asset.domain.AssetRepairType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Request payload for creating an Asset Repair History audit record.
 * Per 06_API_CONTRACT.md section 14.9.1 and D-046.
 */
public record CreateAssetRepairHistoryRequest(
        UUID serviceRequestId,

        @NotNull(message = "Loại sửa chữa/bảo dưỡng không được để trống")
        AssetRepairType repairType,

        @NotBlank(message = "Mô tả nội dung sửa chữa không được để trống")
        String description,

        @Size(max = 255, message = "Đơn vị thực hiện tối đa 255 ký tự")
        String vendorName,

        @DecimalMin(value = "0.0", message = "Chi phí phải lớn hơn hoặc bằng 0")
        BigDecimal cost,

        @NotNull(message = "Thời gian bắt đầu không được để trống")
        Instant startedAt,

        Instant completedAt,

        @Size(max = 1000, message = "Kết quả tối đa 1000 ký tự")
        String result
) {
}
