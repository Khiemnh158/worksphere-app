package com.worksphere.service_request.api.response;

import com.worksphere.service_request.domain.ServicePriority;
import com.worksphere.service_request.domain.ServiceStatus;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Detailed response for a single service request. Per 06_API_CONTRACT.md section 13.4 and Decision
 * D-035.
 */
public record ServiceRequestDetailResponse(
        UUID id,
        UUID receivingDepartmentId,
        String requestNumber,
        CategoryBrief category,
        UserBrief requester,
        AssigneeBrief assignee,
        AssetBrief asset,
        String title,
        String description,
        ServicePriority priority,
        ServiceStatus status,
        Instant resolvedAt,
        Instant closedAt,
        Instant cancelledAt,
        List<ServiceAttachmentResponse> attachments,
        List<ServiceCommentResponse> comments,
        List<ServiceStatusHistoryResponse> histories,
        ServiceRatingResponse rating,
        Set<String> allowedActions,
        java.util.Map<String, Object> workflow,
        Instant createdAt,
        Instant updatedAt,
        Long version) {
    public record CategoryBrief(UUID id, String code, String name) {}

    public record UserBrief(UUID id, String fullName, String email) {}

    public record AssigneeBrief(
            UUID assignmentId, UUID id, String fullName, String email, Instant assignedAt) {}

    public record AssetBrief(UUID id, String assetCode, String name) {}
}
