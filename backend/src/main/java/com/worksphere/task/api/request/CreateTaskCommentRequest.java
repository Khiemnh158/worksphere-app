package com.worksphere.task.api.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

/**
 * Request payload for creating a task comment.
 * Per 06_API_CONTRACT.md section 12.13.
 */
public record CreateTaskCommentRequest(
        @NotBlank(message = "Nội dung bình luận không được để trống")
        String content,

        UUID parentCommentId,

        List<UUID> attachmentFileIds
) {
}
