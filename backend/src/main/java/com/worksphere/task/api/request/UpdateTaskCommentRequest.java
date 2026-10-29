package com.worksphere.task.api.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for updating a task comment.
 * Per 06_API_CONTRACT.md section 12.14.
 */
public record UpdateTaskCommentRequest(
        @NotBlank(message = "Nội dung bình luận không được để trống")
        String content
) {
}
