package com.worksphere.task.api.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Request payload for updating task progress.
 * Per 06_API_CONTRACT.md section 12.6.
 */
public record UpdateTaskProgressRequest(
        @NotNull(message = "Tiến độ hoàn thành không được để trống")
        @DecimalMin(value = "0.0", message = "Tiến độ không được nhỏ hơn 0%")
        @DecimalMax(value = "100.0", message = "Tiến độ không được lớn hơn 100%")
        BigDecimal progressPercent,

        @NotNull(message = "Phiên bản dữ liệu (version) không được để trống")
        Long version
) {
}
