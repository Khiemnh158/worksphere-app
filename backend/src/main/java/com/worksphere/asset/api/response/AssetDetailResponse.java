package com.worksphere.asset.api.response;

import com.worksphere.asset.domain.AssetStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Detailed response payload for an Asset.
 * Per 06_API_CONTRACT.md section 14.3.
 */
public record AssetDetailResponse(
        UUID id,
        String assetCode,
        String name,
        CategoryBrief category,
        String description,
        String serialNumber,
        String manufacturer,
        String model,
        LocalDate purchaseDate,
        BigDecimal purchasePrice,
        AssetStatus status,
        String location,
        LocalDate warrantyEndDate,
        AssignmentBrief currentAssignment,
        List<AssetRepairHistoryResponse> repairHistories,
        List<ServiceRequestBrief> relatedServiceRequests,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
    public record CategoryBrief(UUID id, String code, String name) {
    }

    public record UserBrief(UUID id, String fullName) {
    }

    public record AssignmentBrief(
            UUID id,
            UserBrief assignedTo,
            UserBrief assignedBy,
            Instant assignedAt,
            Instant expectedReturnAt,
            String notes
    ) {
    }

    public record ServiceRequestBrief(
            UUID id,
            String requestNumber,
            String title,
            String status
    ) {
    }
}
