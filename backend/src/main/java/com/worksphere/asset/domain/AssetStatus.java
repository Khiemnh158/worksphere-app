package com.worksphere.asset.domain;

/**
 * Status lifecycle of an Asset.
 * Per 05_DATABASE_DESIGN.md section 10.2 and 06_API_CONTRACT.md section 14.
 */
public enum AssetStatus {
    AVAILABLE,
    ASSIGNED,
    MAINTENANCE,
    BROKEN,
    RETIRED
}
