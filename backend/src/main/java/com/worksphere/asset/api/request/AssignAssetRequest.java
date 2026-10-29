package com.worksphere.asset.api.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

/**
 * Request payload for assigning an Asset to a User.
 * Per 06_API_CONTRACT.md section 14.6 and D-046.
 */
public record AssignAssetRequest(
        @NotNull(message = "Người nhận bàn giao không được để trống")
        UUID assignedTo,

        Instant expectedReturnAt,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String notes
) {
}
