package com.worksphere.file.domain;

/**
 * Lifecycle status of a stored file.
 * Per 05_DATABASE_DESIGN.md section 12.1.
 */
public enum StoredFileStatus {
    ACTIVE,
    QUARANTINED,
    DELETED
}
