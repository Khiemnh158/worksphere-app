package com.worksphere.service_request.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for rating a closed service request.
 * Per 06_API_CONTRACT.md section 13.10.
 */
public record CreateServiceRatingRequest(
        @NotNull(message = "Điểm đánh giá không được để trống")
        @Min(value = 1, message = "Điểm đánh giá từ 1 đến 5")
        @Max(value = 5, message = "Điểm đánh giá từ 1 đến 5")
        Integer score,

        @Size(max = 2000, message = "Nhận xét tối đa 2000 ký tự")
        String comment
) {
}
