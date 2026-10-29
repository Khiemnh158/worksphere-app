package com.worksphere.file.infrastructure.persistence;

import com.worksphere.file.domain.StoredFile;
import com.worksphere.file.domain.StoredFileStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for StoredFile entity.
 */
@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    /**
     * Finds active file by id.
     */
    Optional<StoredFile> findByIdAndStatus(UUID id, StoredFileStatus status);

    /**
     * Finds file by id where status is not DELETED.
     */
    default Optional<StoredFile> findActiveById(UUID id) {
        return findByIdAndStatus(id, StoredFileStatus.ACTIVE);
    }
}
