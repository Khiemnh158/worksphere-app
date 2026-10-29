package com.worksphere.organization.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UpdateDepartmentRequest(
        @NotBlank(message = "Tên phòng ban không được để trống")
        @Size(min = 2, max = 150, message = "Tên phòng ban từ 2 đến 150 ký tự")
        String name,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        UUID parentId,
        UUID managerId
) {}
