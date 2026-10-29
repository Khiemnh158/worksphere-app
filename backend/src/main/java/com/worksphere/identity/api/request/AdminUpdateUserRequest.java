package com.worksphere.identity.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record AdminUpdateUserRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(min = 2, max = 150, message = "Họ tên từ 2 đến 150 ký tự")
        String fullName,

        String phoneNumber,
        UUID departmentId,
        List<String> roleCodes
) {}
