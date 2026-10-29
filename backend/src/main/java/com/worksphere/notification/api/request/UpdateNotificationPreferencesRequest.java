package com.worksphere.notification.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Request DTO for updating user notification preferences.
 * Per 06_API_CONTRACT.md Section 15.5.
 */
public record UpdateNotificationPreferencesRequest(
        @NotEmpty(message = "Danh sách tùy chọn thông báo không được để trống")
        List<@Valid UpdateNotificationPreferenceItemRequest> preferences
) {
}
