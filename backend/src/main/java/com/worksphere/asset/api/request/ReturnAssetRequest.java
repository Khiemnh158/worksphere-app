package com.worksphere.asset.api.request;

import com.worksphere.asset.domain.AssetStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for returning an Asset.
 * Per 06_API_CONTRACT.md section 14.7 and D-046.
 */
public record ReturnAssetRequest(
        @Size(max = 500, message = "Tình trạng bàn giao tối đa 500 ký tự")
        String returnCondition,

        @NotNull(message = "Trạng thái tài sản sau khi trả không được để trống")
        AssetStatus resultingAssetStatus,

        @NotNull(message = "Phiên bản dữ liệu phân công không được để trống")
        Long version
) {
}
