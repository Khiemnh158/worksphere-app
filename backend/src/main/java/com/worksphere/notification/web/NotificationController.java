package com.worksphere.notification.web;

import com.worksphere.notification.api.request.UpdateNotificationPreferencesRequest;
import com.worksphere.notification.api.response.NotificationPreferencesResponse;
import com.worksphere.notification.api.response.NotificationResponse;
import com.worksphere.notification.api.response.ReadAllNotificationsResponse;
import com.worksphere.notification.api.response.UnreadCountResponse;
import com.worksphere.notification.application.NotificationApplicationService;
import com.worksphere.notification.domain.NotificationType;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for in-app Notifications and Notification Preferences.
 * Per 06_API_CONTRACT.md Section 15.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Notification", description = "In-App Notification and Preference APIs")
public class NotificationController {

    private final NotificationApplicationService notificationService;

    public NotificationController(NotificationApplicationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * 15.1. Danh sách thông báo
     * GET /notifications
     */
    @GetMapping("/notifications")
    @PreAuthorize("hasAuthority('NOTIFICATION_READ')")
    @Operation(summary = "List notifications of current user")
    public ResponseEntity<ApiResponse<PagedData<NotificationResponse>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean read,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        PagedData<NotificationResponse> result = notificationService.getNotifications(
                principal.userId(), page, size, read, type, sort
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 15.2. Đánh dấu đã đọc
     * PUT /notifications/{notificationId}/read
     */
    @PutMapping("/notifications/{notificationId}/read")
    @PreAuthorize("hasAuthority('NOTIFICATION_UPDATE')")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        notificationService.markRead(notificationId, principal.userId());
        return ResponseEntity.ok(ApiResponse.successNoContent("Đánh dấu thông báo đã đọc thành công"));
    }

    /**
     * 15.3. Đánh dấu tất cả đã đọc
     * PUT /notifications/read-all
     */
    @PutMapping("/notifications/read-all")
    @PreAuthorize("hasAuthority('NOTIFICATION_UPDATE')")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<ReadAllNotificationsResponse>> markAllRead(
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        ReadAllNotificationsResponse response = notificationService.markAllRead(principal.userId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 15.4. Số thông báo chưa đọc
     * GET /notifications/unread-count
     */
    @GetMapping("/notifications/unread-count")
    @PreAuthorize("hasAuthority('NOTIFICATION_READ')")
    @Operation(summary = "Get count of unread notifications")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        UnreadCountResponse response = notificationService.getUnreadCount(principal.userId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 15.5. Tùy chọn thông báo - Xem cấu hình
     * GET /notification-preferences
     */
    @GetMapping("/notification-preferences")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get notification preferences of current user")
    public ResponseEntity<ApiResponse<NotificationPreferencesResponse>> getPreferences(
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        NotificationPreferencesResponse response = notificationService.getPreferences(principal.userId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 15.5. Tùy chọn thông báo - Cập nhật cấu hình
     * PUT /notification-preferences
     */
    @PutMapping("/notification-preferences")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update notification preferences of current user")
    public ResponseEntity<ApiResponse<Void>> updatePreferences(
            @Valid @RequestBody UpdateNotificationPreferencesRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        notificationService.updatePreferences(principal.userId(), request);
        return ResponseEntity.ok(ApiResponse.successNoContent("Cập nhật tùy chọn thông báo thành công"));
    }
}
