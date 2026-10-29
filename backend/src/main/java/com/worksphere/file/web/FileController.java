package com.worksphere.file.web;

import com.worksphere.file.api.response.FileUploadResponse;
import com.worksphere.file.application.FileApplicationService;
import com.worksphere.file.domain.FilePurpose;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * REST controller for file operations: upload, download, and delete.
 * Implements 06_API_CONTRACT.md section 16.
 */
@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final FileApplicationService fileApplicationService;

    public FileController(FileApplicationService fileApplicationService) {
        this.fileApplicationService = fileApplicationService;
    }

    /**
     * Uploads a file with metadata and purpose.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("purpose") FilePurpose purpose,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        FileUploadResponse response = fileApplicationService.uploadFile(file, purpose, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * Downloads an authorized file by streaming the binary resource.
     */
    @GetMapping("/{fileId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable("fileId") UUID fileId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        FileApplicationService.FileDownloadResult result = fileApplicationService.downloadFile(fileId, principal);

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(result.file().getOriginalName(), StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(MediaType.parseMediaType(result.file().getMimeType()));
        headers.setContentLength(result.file().getSizeBytes());
        headers.add("X-Content-Type-Options", "nosniff");

        return ResponseEntity.ok()
                .headers(headers)
                .body(result.resource());
    }

    /**
     * Deletes an unlinked file.
     */
    @DeleteMapping("/{fileId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable("fileId") UUID fileId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        fileApplicationService.deleteFile(fileId, principal);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
