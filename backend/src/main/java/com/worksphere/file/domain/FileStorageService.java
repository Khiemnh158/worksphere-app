package com.worksphere.file.domain;

import org.springframework.core.io.Resource;

import java.io.InputStream;

/**
 * Storage abstraction for physical file operations.
 * Allows decoupling file I/O from domain and database metadata.
 */
public interface FileStorageService {

    /**
     * Stores the stream content at the given relative storage path.
     *
     * @param content stream of the file content
     * @param storagePath relative storage path (e.g. TASK_ATTACHMENT/2026/10/uuid.pdf)
     * @return the normalized relative storage path
     */
    String store(InputStream content, String storagePath);

    /**
     * Loads the stored file as a Spring Resource for streaming downloads.
     *
     * @param storagePath relative storage path
     * @return Resource representing the physical file
     */
    Resource loadAsResource(String storagePath);

    /**
     * Checks if physical file exists at the given relative storage path.
     *
     * @param storagePath relative storage path
     * @return true if file exists physically
     */
    boolean exists(String storagePath);

    /**
     * Deletes the physical file if it exists.
     *
     * @param storagePath relative storage path
     */
    void delete(String storagePath);
}
