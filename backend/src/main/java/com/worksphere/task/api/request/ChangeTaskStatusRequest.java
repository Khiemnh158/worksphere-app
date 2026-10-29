package com.worksphere.task.api.request;

import com.worksphere.task.domain.TaskStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for changing task status.
 * Per 06_API_CONTRACT.md section 12.5.
 */
public record ChangeTaskStatusRequest(
        @NotNull(message = "Trạng thái mới không được để trống")
        TaskStatus status,

        @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
        String comment,

        @NotNull(message = "Phiên bản dữ liệu (version) không được để trống")
        Long version
) {
}
