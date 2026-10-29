package com.worksphere.service_request.domain;

/**
 * Service Request priority levels.
 * Per 05_DATABASE_DESIGN.md section 9.2 and 06_API_CONTRACT.md section 13.
 */
public enum ServicePriority {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
