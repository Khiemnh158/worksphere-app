package com.worksphere.file.domain;

import com.worksphere.shared.exception.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Domain entity representing a stored file and its metadata.
 * Maps to table 'stored_files' per 05_DATABASE_DESIGN.md section 12.1.
 */
@Entity
@Table(name = "stored_files")
public class StoredFile {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "stored_name", nullable = false, length = 255)
    private String storedName;

    @Column(name = "storage_path", nullable = false, length = 1000)
    private String storagePath;

    @Column(name = "mime_type", nullable = false, length = 150)
    private String mimeType;

    @Column(name = "extension", length = 20)
    private String extension;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "checksum_sha256", nullable = false, length = 64)
    private String checksumSha256;

    @Column(name = "uploaded_by", nullable = false, updatable = false)
    private UUID uploadedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private StoredFileStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    protected StoredFile() {
        // Required by JPA
    }

    private StoredFile(
            UUID id,
            String originalName,
            String storedName,
            String storagePath,
            String mimeType,
            String extension,
            long sizeBytes,
            String checksumSha256,
            UUID uploadedBy,
            StoredFileStatus status,
            Instant createdAt
    ) {
        this.id = Objects.requireNonNull(id, "File id cannot be null");
        this.originalName = Objects.requireNonNull(originalName, "Original name cannot be null");
        this.storedName = Objects.requireNonNull(storedName, "Stored name cannot be null");
        this.storagePath = Objects.requireNonNull(storagePath, "Storage path cannot be null");
        this.mimeType = Objects.requireNonNull(mimeType, "MIME type cannot be null");
        this.extension = extension;
        this.sizeBytes = sizeBytes;
        this.checksumSha256 = Objects.requireNonNull(checksumSha256, "Checksum cannot be null");
        this.uploadedBy = Objects.requireNonNull(uploadedBy, "Uploader id cannot be null");
        this.status = Objects.requireNonNull(status, "Status cannot be null");
        this.createdAt = Objects.requireNonNull(createdAt, "Created at cannot be null");
    }

    /**
     * Factory method to instantiate a new StoredFile metadata record.
     */
    public static StoredFile create(
            UUID id,
            String originalName,
            String storedName,
            String storagePath,
            String mimeType,
            String extension,
            long sizeBytes,
            String checksumSha256,
            UUID uploadedBy
    ) {
        if (sizeBytes <= 0) {
            throw new BusinessRuleException("FILE_EMPTY", "Kích thước tệp phải lớn hơn 0 byte");
        }
        if (checksumSha256.length() != 64) {
            throw new BusinessRuleException("FILE_UPLOAD_FAILED", "Mã băm SHA-256 không hợp lệ");
        }

        return new StoredFile(
                id,
                originalName,
                storedName,
                storagePath,
                mimeType,
                extension,
                sizeBytes,
                checksumSha256.toLowerCase(),
                uploadedBy,
                StoredFileStatus.ACTIVE,
                Instant.now()
        );
    }

    /**
     * Marks the stored file as soft-deleted.
     */
    public void softDelete() {
        this.status = StoredFileStatus.DELETED;
        this.deletedAt = Instant.now();
    }

    /**
     * Alias for softDelete.
     */
    public void markAsDeleted() {
        softDelete();
    }

    /**
     * Checks if the file is active.
     */
    public boolean isActive() {
        return this.status == StoredFileStatus.ACTIVE;
    }

    /**
     * Checks if the file is deleted.
     */
    public boolean isDeleted() {
        return this.status == StoredFileStatus.DELETED || this.deletedAt != null;
    }

    public UUID getId() {
        return id;
    }

    public String getOriginalName() {
        return originalName;
    }

    public String getStoredName() {
        return storedName;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public String getMimeType() {
        return mimeType;
    }

    public String getExtension() {
        return extension;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public String getChecksumSha256() {
        return checksumSha256;
    }

    public UUID getUploadedBy() {
        return uploadedBy;
    }

    public StoredFileStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }
}
