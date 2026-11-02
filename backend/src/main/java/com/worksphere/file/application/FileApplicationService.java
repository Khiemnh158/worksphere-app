package com.worksphere.file.application;

import com.worksphere.file.api.response.FileUploadResponse;
import com.worksphere.file.domain.FilePurpose;
import com.worksphere.file.domain.FileStorageService;
import com.worksphere.file.domain.StoredFile;
import com.worksphere.file.domain.StoredFileStatus;
import com.worksphere.file.infrastructure.persistence.StoredFileRepository;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import com.worksphere.task.domain.Task;
import com.worksphere.task.domain.TaskAttachment;
import com.worksphere.task.infrastructure.persistence.TaskAttachmentRepository;
import com.worksphere.task.infrastructure.persistence.TaskRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Application service for file management (Upload, Download, Delete). Implements strict security
 * validations, short DB transactions, and compensating cleanup.
 */
@Service
public class FileApplicationService {

    private static final Logger log = LoggerFactory.getLogger(FileApplicationService.class);

    private final StoredFileRepository storedFileRepository;
    private final FileStorageService fileStorageService;
    private final FileValidationService fileValidationService;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final JdbcTemplate jdbcTemplate;

    public FileApplicationService(
            StoredFileRepository storedFileRepository,
            FileStorageService fileStorageService,
            FileValidationService fileValidationService,
            TaskAttachmentRepository taskAttachmentRepository,
            TaskRepository taskRepository,
            ProjectMemberRepository projectMemberRepository,
            JdbcTemplate jdbcTemplate) {
        this.storedFileRepository = storedFileRepository;
        this.fileStorageService = fileStorageService;
        this.fileValidationService = fileValidationService;
        this.taskAttachmentRepository = taskAttachmentRepository;
        this.taskRepository = taskRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Uploads a file with full validation, checksum calculation, and atomic storage. Database
     * transaction is kept strictly outside streaming operations.
     */
    public FileUploadResponse uploadFile(
            MultipartFile file, FilePurpose purpose, WorkSphereUserPrincipal principal) {
        if (principal == null || principal.userId() == null) {
            throw new BusinessRuleException("FILE_ACCESS_DENIED", "Yêu cầu xác thực");
        }
        if (purpose == null) {
            throw new BusinessRuleException(
                    "VALIDATION_ERROR", "Mục đích sử dụng tệp (purpose) không được để trống");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("FILE_EMPTY", "Tệp tải lên không được để rỗng");
        }

        String rawOriginalFilename = file.getOriginalFilename();
        String sanitizedFilename = FilenameSanitizer.sanitize(rawOriginalFilename);

        Path tempFile = null;
        String storagePath = null;
        UUID fileId = UUID.randomUUID();

        try {
            // 1. Stream file into temp file outside DB transaction while calculating SHA-256
            MessageDigest sha256Digest = MessageDigest.getInstance("SHA-256");
            tempFile = Files.createTempFile("worksphere-upload-", ".tmp");

            long actualBytes = 0;
            try (InputStream in = file.getInputStream();
                    DigestInputStream digestIn = new DigestInputStream(in, sha256Digest);
                    var out = Files.newOutputStream(tempFile)) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = digestIn.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                    actualBytes += read;
                    // Early check to avoid unbounded streaming
                    if (actualBytes > FileValidationService.MAX_DOCUMENT_SIZE) {
                        throw new BusinessRuleException(
                                "FILE_TOO_LARGE", "Dung lượng tệp vượt quá giới hạn tối đa 20 MB");
                    }
                }
            }

            if (actualBytes <= 0) {
                throw new BusinessRuleException("FILE_EMPTY", "Tệp tải lên không được để rỗng");
            }

            String checksumSha256 = HexFormat.of().formatHex(sha256Digest.digest());

            // 2. Validate header bytes and structure
            byte[] headerBytes = new byte[64];
            try (InputStream tempIn = Files.newInputStream(tempFile)) {
                int readHeader = tempIn.read(headerBytes);
                if (readHeader < headerBytes.length) {
                    byte[] smallerHeader = new byte[Math.max(0, readHeader)];
                    System.arraycopy(headerBytes, 0, smallerHeader, 0, smallerHeader.length);
                    headerBytes = smallerHeader;
                }
            }

            FileValidationService.ValidatedFileAttributes validatedAttrs;
            try (InputStream zipStream = Files.newInputStream(tempFile)) {
                validatedAttrs =
                        fileValidationService.validate(
                                sanitizedFilename,
                                file.getContentType(),
                                actualBytes,
                                headerBytes,
                                zipStream);
            }

            // 3. Move to permanent storage key
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            String storedName = fileId + "." + validatedAttrs.extension();
            storagePath =
                    String.format(
                            "%s/%04d/%02d/%s",
                            purpose.name(), today.getYear(), today.getMonthValue(), storedName);

            try (InputStream storeIn = Files.newInputStream(tempFile)) {
                fileStorageService.store(storeIn, storagePath);
            }

            // 4. Save metadata in short DB transaction
            StoredFile storedFile =
                    saveMetadata(
                            fileId,
                            sanitizedFilename,
                            storedName,
                            storagePath,
                            validatedAttrs.mimeType(),
                            validatedAttrs.extension(),
                            actualBytes,
                            checksumSha256,
                            principal.userId());

            return new FileUploadResponse(
                    storedFile.getId(),
                    storedFile.getOriginalName(),
                    storedFile.getMimeType(),
                    storedFile.getSizeBytes(),
                    "/api/v1/files/" + storedFile.getId() + "/download",
                    storedFile.getCreatedAt());

        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not available", e);
            throw new BusinessRuleException("FILE_UPLOAD_FAILED", "Không thể xử lý mã hóa tệp");
        } catch (IOException e) {
            log.error("I/O error during file upload", e);
            cleanupPhysicalFile(storagePath, fileId);
            throw new BusinessRuleException("FILE_UPLOAD_FAILED", "Lỗi lưu trữ tệp tin");
        } catch (Exception e) {
            log.error(
                    "Failed to complete file upload, executing compensating physical cleanup for"
                            + " fileId={}",
                    fileId,
                    e);
            cleanupPhysicalFile(storagePath, fileId);
            throw e;
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {
                    // Ignored temp cleanup
                }
            }
        }
    }

    /** Short transaction strictly for metadata persistence. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public StoredFile saveMetadata(
            UUID fileId,
            String originalName,
            String storedName,
            String storagePath,
            String mimeType,
            String extension,
            long sizeBytes,
            String checksumSha256,
            UUID uploadedBy) {
        StoredFile storedFile =
                StoredFile.create(
                        fileId,
                        originalName,
                        storedName,
                        storagePath,
                        mimeType,
                        extension,
                        sizeBytes,
                        checksumSha256,
                        uploadedBy);
        return storedFileRepository.save(storedFile);
    }

    /** Downloads an active file after validating caller permissions. */
    @Transactional(readOnly = true)
    public FileDownloadResult downloadFile(UUID fileId, WorkSphereUserPrincipal principal) {
        if (principal == null || principal.userId() == null) {
            throw new BusinessRuleException("FILE_ACCESS_DENIED", "Yêu cầu xác thực");
        }

        StoredFile storedFile =
                storedFileRepository
                        .findById(fileId)
                        .filter(f -> f.getStatus() == StoredFileStatus.ACTIVE)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "FILE_NOT_FOUND", "Không tìm thấy tệp"));

        verifyDownloadAccess(storedFile, principal);

        Resource resource = fileStorageService.loadAsResource(storedFile.getStoragePath());
        return new FileDownloadResult(resource, storedFile);
    }

    /** Soft deletes an unlinked file. */
    @Transactional
    public void deleteFile(UUID fileId, WorkSphereUserPrincipal principal) {
        if (principal == null || principal.userId() == null) {
            throw new BusinessRuleException("FILE_ACCESS_DENIED", "Yêu cầu xác thực");
        }

        StoredFile storedFile =
                storedFileRepository
                        .findById(fileId)
                        .filter(f -> f.getStatus() == StoredFileStatus.ACTIVE)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "FILE_NOT_FOUND", "Không tìm thấy tệp"));

        // Only uploader or System Admin can delete
        boolean isAdmin = hasSystemAdminRole(principal);
        boolean isUploader = storedFile.getUploadedBy().equals(principal.userId());
        if (!isAdmin && !isUploader) {
            throw new BusinessRuleException(
                    "FILE_ACCESS_DENIED",
                    "Chỉ người tải lên hoặc quản trị viên mới có quyền xoá tệp");
        }

        // Verify file is unlinked
        verifyFileNotLinked(fileId);

        // Soft delete metadata
        storedFile.markAsDeleted();
        storedFileRepository.save(storedFile);
    }

    private void verifyFileNotLinked(UUID fileId) {
        if (jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM department_work_files WHERE file_id=?",
                        Integer.class,
                        fileId)
                > 0)
            throw new BusinessRuleException(
                    "FILE_ALREADY_LINKED", "Tệp đang thuộc công việc nội bộ");
        // 1. Check Task Attachments
        if (taskAttachmentRepository.existsByFileId(fileId)) {
            throw new BusinessRuleException(
                    "FILE_ALREADY_LINKED", "Tệp đang được liên kết với công việc, không thể xoá");
        }

        // 2. Check Service Attachments
        try {
            Integer serviceCount =
                    jdbcTemplate.queryForObject(
                            "SELECT COUNT(1) FROM service_attachments WHERE file_id = ?",
                            Integer.class,
                            fileId);
            if (serviceCount != null && serviceCount > 0) {
                throw new BusinessRuleException(
                        "FILE_ALREADY_LINKED",
                        "Tệp đang được liên kết với yêu cầu dịch vụ, không thể xoá");
            }
        } catch (DataAccessException ex) {
            throw new BusinessRuleException(
                    "FILE_ACCESS_DENIED", "Chưa kiểm tra được liên kết tệp");
        }

        // 3. Check User Avatar
        try {
            Integer avatarCount =
                    jdbcTemplate.queryForObject(
                            "SELECT COUNT(1) FROM users WHERE avatar_file_id = ?",
                            Integer.class,
                            fileId);
            if (avatarCount != null && avatarCount > 0) {
                throw new BusinessRuleException(
                        "FILE_ALREADY_LINKED",
                        "Tệp đang được sử dụng làm ảnh đại diện, không thể xoá");
            }
        } catch (DataAccessException ex) {
            throw new BusinessRuleException(
                    "FILE_ACCESS_DENIED", "Chưa kiểm tra được liên kết tệp");
        }
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.worksphere.organization.application.ApprovalPolicy departmentAuthority;

    private void verifyDownloadAccess(StoredFile file, WorkSphereUserPrincipal principal) {
        // Department resources are scoped before the legacy ADMIN/project shortcut.
        try {
            var workFiles =
                    jdbcTemplate.queryForList(
                            "SELECT w.id FROM department_work_files f JOIN department_work w ON"
                                    + " w.id=f.work_id WHERE f.file_id=?",
                            java.util.UUID.class,
                            file.getId());
            if (!workFiles.isEmpty()) {
                var dept =
                        jdbcTemplate.queryForObject(
                                "SELECT department_id FROM department_work WHERE id=?",
                                java.util.UUID.class,
                                workFiles.getFirst());
                if (departmentAuthority.operations(dept, principal.userId())
                        || departmentAuthority.oversees(dept, principal.userId())) return;
                Integer n =
                        jdbcTemplate.queryForObject(
                                "SELECT count(*) FROM department_work w LEFT JOIN departments d ON"
                                    + " d.id=w.department_id WHERE w.id=? AND (w.assignee_id=? OR"
                                    + " w.reviewer_id=? OR (d.manager_id=? AND d.is_active AND NOT"
                                    + " d.is_deleted))",
                                Integer.class,
                                workFiles.getFirst(),
                                principal.userId(),
                                principal.userId(),
                                principal.userId());
                if (n != null && n > 0) return;
                throw new BusinessRuleException(
                        "FILE_ACCESS_DENIED", "Tệp công việc ngoài phạm vi");
            }
            var routed =
                    jdbcTemplate.queryForList(
                            "SELECT sr.id FROM service_attachments f JOIN service_requests sr ON"
                                    + " sr.id=f.request_id WHERE f.file_id=? AND"
                                    + " sr.receiving_department_id IS NOT NULL",
                            java.util.UUID.class,
                            file.getId());
            if (!routed.isEmpty()) {
                var dept =
                        jdbcTemplate.queryForObject(
                                "SELECT receiving_department_id FROM service_requests WHERE id=?",
                                java.util.UUID.class,
                                routed.getFirst());
                if (departmentAuthority.operations(dept, principal.userId())) return;
                Integer n =
                        jdbcTemplate.queryForObject(
                                "SELECT count(*) FROM service_requests sr LEFT JOIN"
                                    + " service_assignments a ON a.request_id=sr.id AND a.is_active"
                                    + " LEFT JOIN departments d ON d.id=sr.receiving_department_id"
                                    + " WHERE sr.id=? AND NOT sr.is_deleted AND (sr.requester_id=?"
                                    + " OR a.assignee_id=? OR (d.manager_id=? AND d.is_active AND"
                                    + " NOT d.is_deleted))",
                                Integer.class,
                                routed.getFirst(),
                                principal.userId(),
                                principal.userId(),
                                principal.userId());
                if (n != null && n > 0) return;
                throw new BusinessRuleException("FILE_ACCESS_DENIED", "Tệp yêu cầu ngoài phạm vi");
            }
        } catch (DataAccessException ex) {
            throw new BusinessRuleException(
                    "FILE_ACCESS_DENIED", "Chưa kiểm tra được quyền tệp. Vui lòng thử lại.");
        }

        // 1. Admin always has access
        if (hasSystemAdminRole(principal)) {
            return;
        }

        // 2. Check Task Attachment linkage FIRST to enforce project confidentiality
        Optional<TaskAttachment> taskAttachmentOpt =
                taskAttachmentRepository.findByFileId(file.getId());
        if (taskAttachmentOpt.isPresent()) {
            TaskAttachment attachment = taskAttachmentOpt.get();
            Task task = taskRepository.findByIdAndDeletedFalse(attachment.getTaskId()).orElse(null);
            if (task != null) {
                boolean isProjectMember =
                        projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(
                                task.getProjectId(), principal.userId());
                if (isProjectMember) {
                    return;
                }
                throw new BusinessRuleException(
                        "FILE_ACCESS_DENIED",
                        "Bạn không có quyền truy cập tệp đính kèm của dự án này");
            }
        }

        // 3. Check Service Attachment linkage
        try {
            List<UUID> requestIds =
                    jdbcTemplate.query(
                            "SELECT request_id FROM service_attachments WHERE file_id = ?",
                            (rs, rowNum) -> (UUID) rs.getObject("request_id"),
                            file.getId());
            if (!requestIds.isEmpty()) {
                boolean hasServiceAccess = false;
                for (UUID reqId : requestIds) {
                    Integer count =
                            jdbcTemplate.queryForObject(
                                    "SELECT COUNT(1) FROM service_requests sr LEFT JOIN"
                                            + " service_assignments sa ON sa.request_id = sr.id AND"
                                            + " sa.is_active = true WHERE sr.id = ? AND"
                                            + " (sr.requester_id = ? OR sa.assignee_id = ?)",
                                    Integer.class,
                                    reqId,
                                    principal.userId(),
                                    principal.userId());
                    if (count != null && count > 0) {
                        hasServiceAccess = true;
                        break;
                    }
                }
                if (hasServiceAccess) {
                    return;
                }
                throw new BusinessRuleException(
                        "FILE_ACCESS_DENIED",
                        "Bạn không có quyền truy cập tệp đính kèm của yêu cầu dịch vụ này");
            }
        } catch (DataAccessException ex) {
            throw new BusinessRuleException("FILE_ACCESS_DENIED", "Chưa kiểm tra được quyền tệp");
        }

        // 4. Unlinked file: original uploader has access
        if (file.getUploadedBy().equals(principal.userId())) {
            return;
        }

        // 5. Unlinked file, caller is not uploader and not admin
        throw new BusinessRuleException(
                "FILE_ACCESS_DENIED", "Bạn không có quyền truy cập tệp này");
    }

    private boolean hasSystemAdminRole(WorkSphereUserPrincipal principal) {
        if (principal == null || principal.user() == null || principal.user().getRoles() == null) {
            return false;
        }
        return principal.user().getRoles().stream()
                .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getCode()));
    }

    private void cleanupPhysicalFile(String storagePath, UUID fileId) {
        if (storagePath == null) {
            return;
        }
        try {
            fileStorageService.delete(storagePath);
        } catch (Exception ex) {
            log.error(
                    "CRITICAL: Compensating cleanup failed for fileId={}. Physical file may be"
                            + " orphaned and requires reconciliation.",
                    fileId,
                    ex);
        }
    }

    /** Download outcome record containing Resource and metadata. */
    public record FileDownloadResult(Resource resource, StoredFile file) {
}
}
