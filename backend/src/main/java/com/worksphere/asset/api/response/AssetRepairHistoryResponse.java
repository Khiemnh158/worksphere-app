package com.worksphere.asset.api.response;

import com.worksphere.asset.domain.AssetRepairType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response payload for an Asset Repair History audit record.
 * Per 06_API_CONTRACT.md section 14.9.2.
 */
public record AssetRepairHistoryResponse(
        UUID id,
        UUID assetId,
        UUID serviceRequestId,
        AssetRepairType repairType,
        String description,
        String vendorName,
        BigDecimal cost,
        Instant startedAt,
        Instant completedAt,
        String result,
        UUID createdBy,
        Instant createdAt
) {
}
