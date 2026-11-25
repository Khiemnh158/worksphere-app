package com.worksphere.file.application;

import com.worksphere.file.domain.StoredFile;
import com.worksphere.file.infrastructure.persistence.StoredFileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Commits metadata before the upload returns, so commit failures trigger file cleanup. */
@Service
public class FileMetadataWriter {
    private final StoredFileRepository files;

    public FileMetadataWriter(StoredFileRepository files) {
        this.files = files;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public StoredFile save(StoredFile file) {
        return files.save(file);
    }
}
