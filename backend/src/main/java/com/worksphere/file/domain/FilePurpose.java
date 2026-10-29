package com.worksphere.file.domain;

/**
 * Upload purpose of a stored file.
 * Per 06_API_CONTRACT.md section 16.1.
 */
public enum FilePurpose {
    AVATAR,
    TASK_ATTACHMENT,
    SERVICE_ATTACHMENT,
    PROJECT_DOCUMENT
}
