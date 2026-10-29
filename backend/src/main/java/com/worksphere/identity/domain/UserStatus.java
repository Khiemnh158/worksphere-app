package com.worksphere.identity.domain;

/**
 * Account status values as defined in 05_DATABASE_DESIGN.md and 02_USER_ROLES_AND_WORKFLOWS.md.
 */
public enum UserStatus {
    PENDING,
    ACTIVE,
    LOCKED,
    DISABLED
}
