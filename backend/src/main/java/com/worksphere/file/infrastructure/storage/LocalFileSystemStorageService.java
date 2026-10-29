package com.worksphere.file.infrastructure.storage;

import com.worksphere.file.domain.FileStorageService;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Local filesystem implementation of FileStorageService.
 * Follows strict path traversal protections and atomic moves.
 */
@Service
public class LocalFileSystemStorageService implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalFileSystemStorageService.class);

    private final Path rootLocation;
    private final Path tempLocation;

    @org.springframework.beans.factory.annotation.Autowired
    public LocalFileSystemStorageService(
            @Value("${worksphere.storage.path:${WORKSPHERE_STORAGE_PATH:D:/WorkSphereData/uploads}}") String rootDir
    ) {
        this.rootLocation = Paths.get(rootDir).toAbsolutePath().normalize();
        this.tempLocation = this.rootLocation.resolve(".tmp").normalize();
        try {
            Files.createDirectories(this.rootLocation);
            Files.createDirectories(this.tempLocation);
        } catch (IOException e) {
            log.error("Could not initialize local storage directory at {}", this.rootLocation, e);
        }
    }

    /**
     * Constructor for custom Path (useful in testing with @TempDir).
     */
    public LocalFileSystemStorageService(Path rootLocation) {
        this.rootLocation = rootLocation.toAbsolutePath().normalize();
        this.tempLocation = this.rootLocation.resolve(".tmp").normalize();
        try {
            Files.createDirectories(this.rootLocation);
            Files.createDirectories(this.tempLocation);
        } catch (IOException e) {
            log.error("Could not initialize local storage directory at {}", this.rootLocation, e);
        }
    }

    @Override
    public String store(InputStream content, String storagePath) {
        if (content == null || storagePath == null || storagePath.trim().isEmpty()) {
            throw new BusinessRuleException("FILE_UPLOAD_FAILED", "Dữ liệu lưu trữ không hợp lệ");
        }

        Path destinationFile = resolveAndValidate(storagePath);

        if (Files.exists(destinationFile)) {
            log.warn("Destination file already exists at {}", destinationFile);
            throw new BusinessRuleException("FILE_UPLOAD_FAILED", "Tệp đích đã tồn tại trên hệ thống lưu trữ");
        }

        try {
            Files.createDirectories(destinationFile.getParent());
            Files.createDirectories(this.tempLocation);

            // 1. Write to temporary file first
            Path tempFile = Files.createTempFile(this.tempLocation, "upload-", ".tmp");
            try {
                Files.copy(content, tempFile, StandardCopyOption.REPLACE_EXISTING);

                // 2. Atomic move to final target destination without replacing existing
                try {
                    Files.move(tempFile, destinationFile, StandardCopyOption.ATOMIC_MOVE);
                } catch (AtomicMoveNotSupportedException e) {
                    Files.move(tempFile, destinationFile);
                }
            } finally {
                Files.deleteIfExists(tempFile);
            }

            return storagePath;
        } catch (java.nio.file.FileAlreadyExistsException e) {
            log.error("Destination file already exists during move at {}", destinationFile);
            throw new BusinessRuleException("FILE_UPLOAD_FAILED", "Tệp đích đã tồn tại trên hệ thống lưu trữ");
        } catch (IOException e) {
            log.error("Failed to store file at {}", destinationFile, e);
            throw new BusinessRuleException("FILE_UPLOAD_FAILED", "Không thể lưu tệp vào hệ thống lưu trữ");
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        Path file = resolveAndValidate(storagePath);
        try {
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new ResourceNotFoundException("FILE_NOT_FOUND", "Không tìm thấy tệp vật lý trên hệ thống lưu trữ");
        } catch (MalformedURLException e) {
            log.error("Malformed URL for path {}", storagePath, e);
            throw new ResourceNotFoundException("FILE_NOT_FOUND", "Không tìm thấy tệp trên hệ thống lưu trữ");
        }
    }

    @Override
    public boolean exists(String storagePath) {
        if (storagePath == null || storagePath.trim().isEmpty()) {
            return false;
        }
        try {
            Path file = resolveAndValidate(storagePath);
            return Files.exists(file) && Files.isRegularFile(file);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public void delete(String storagePath) {
        if (storagePath == null || storagePath.trim().isEmpty()) {
            return;
        }
        try {
            Path file = resolveAndValidate(storagePath);
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Failed to delete physical file at {}: {}", storagePath, e.getMessage());
        }
    }

    public Path getRootLocation() {
        return rootLocation;
    }

    private Path resolveAndValidate(String storagePath) {
        // Prevent path traversal attacks
        String normalizedSubPath = storagePath.replace('\\', '/').trim();
        while (normalizedSubPath.startsWith("/")) {
            normalizedSubPath = normalizedSubPath.substring(1);
        }

        Path resolved = this.rootLocation.resolve(normalizedSubPath).normalize();
        if (!resolved.startsWith(this.rootLocation)) {
            log.warn("Path traversal attempt detected with subpath: {}", storagePath);
            throw new BusinessRuleException("FILE_ACCESS_DENIED", "Đường dẫn tệp không hợp lệ");
        }

        validateNoSymlinkEscape(resolved);

        return resolved;
    }

    private void validateNoSymlinkEscape(Path path) {
        Path realRoot;
        try {
            realRoot = this.rootLocation.toRealPath();
        } catch (IOException e) {
            realRoot = this.rootLocation.toAbsolutePath().normalize();
        }

        // Walk existing ancestors up to rootLocation
        Path existingAncestor = path;
        while (existingAncestor != null && !Files.exists(existingAncestor, java.nio.file.LinkOption.NOFOLLOW_LINKS)) {
            existingAncestor = existingAncestor.getParent();
        }

        if (existingAncestor != null) {
            Path cur = existingAncestor;
            while (cur != null && !cur.equals(this.rootLocation)) {
                if (Files.isSymbolicLink(cur)) {
                    log.warn("Symbolic link detected in storage hierarchy: {}", cur);
                    throw new BusinessRuleException("FILE_ACCESS_DENIED", "Đường dẫn tệp không hợp lệ: liên kết tượng trưng không được phép");
                }
                try {
                    if (!cur.toRealPath().startsWith(realRoot)) {
                        log.warn("Symlink escape detected: real path {} does not start with root {}", cur.toRealPath(), realRoot);
                        throw new BusinessRuleException("FILE_ACCESS_DENIED", "Đường dẫn tệp không hợp lệ");
                    }
                } catch (IOException e) {
                    log.warn("Failed to resolve real path for ancestor {}", cur, e);
                    throw new BusinessRuleException("FILE_ACCESS_DENIED", "Đường dẫn tệp không hợp lệ");
                }
                cur = cur.getParent();
            }
        }
    }
}
