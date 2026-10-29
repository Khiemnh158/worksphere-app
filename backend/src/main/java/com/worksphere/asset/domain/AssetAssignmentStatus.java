package com.worksphere.asset.domain;

/**
 * Status of an Asset Assignment.
 * Per 05_DATABASE_DESIGN.md section 10.3 and 06_API_CONTRACT.md section 14.
 */
public enum AssetAssignmentStatus {
    ACTIVE,
    RETURNED,
    LOST,
    DAMAGED
}
