package com.worksphere.asset.domain;

/**
 * Type of asset repair or maintenance event.
 * Per 05_DATABASE_DESIGN.md section 10.4 and 06_API_CONTRACT.md section 14.9.
 */
public enum AssetRepairType {
    MAINTENANCE,
    REPAIR,
    INSPECTION,
    UPGRADE
}
