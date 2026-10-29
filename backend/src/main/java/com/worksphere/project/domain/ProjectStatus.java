package com.worksphere.project.domain;

/**
 * Status of a Project.
 * Per 05_DATABASE_DESIGN.md section 7.1 and 02_USER_ROLES_AND_WORKFLOWS.md section 4.2.
 */
public enum ProjectStatus {
    DRAFT,
    ACTIVE,
    ON_HOLD,
    COMPLETED,
    CANCELLED
}
