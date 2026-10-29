package com.worksphere.service_request.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * Request payload for creating a service request comment.
 * Per 06_API_CONTRACT.md section 13.9.
 */
public record CreateServiceCommentRequest(
        @NotBlank(message = "Nội dung bình luận không được để trống")
        @Size(max = 5000, message = "Nội dung bình luận tối đa 5000 ký tự")
        String content,

        Boolean isInternal,

        List<UUID> attachmentFileIds
) {
}
