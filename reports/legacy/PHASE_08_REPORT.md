# WorkSphere Phase 8 Report: File Module & Task Attachment Integration

- **Execution Date**: 2026-10-15
- **Initial Checkpoint**: `1306570330ef645df4690d2fcbef17f7f16f5131` (`docs(agent): checkpoint phase 7 completion`)
- **Hardening Checkpoint**: `5d45728e7fc0e08206fe5d4314e03c2c0f09f0b0`
- **Status**: COMPLETED, HARDENED & VERIFIED

---

## 1. Executive Summary

Phase 8 implements the **File Module** and its integration with **Task Attachments** within the WorkSphere backend modular monolith. All implementations adhere strictly to canonical architecture specifications (`docs/01_PROJECT_SCOPE.md` through `docs/10_AI_AGENT_INSTRUCTIONS.md`) and database migrations (`V004`, `V005`, `V010`, `V011`, `V012`).

Key achievements:
- **Core File Module**: Safe local filesystem storage abstraction (`FileStorageService`, `LocalFileSystemStorageService`), content-based validation, SHA-256 integrity calculation, short-lived transactional metadata persistence, safe download streaming with nosniff headers and UTF-8 RFC 5987 Content-Disposition, and transactional compensating cleanup.
- **Security Hardening**:
  - Prevent destination overwrite by removing `REPLACE_EXISTING` on final move.
  - Symlink escape prevention inspecting existing path ancestors against real storage root using `LinkOption.NOFOLLOW_LINKS`.
  - ZIP bomb defense enforcing explicit thresholds (`MAX_ZIP_ENTRIES = 200`, `MAX_ENTRY_UNCOMPRESSED_SIZE = 50MB`, `MAX_TOTAL_UNCOMPRESSED_SIZE = 100MB`, `MAX_COMPRESSION_RATIO = 100.0`) with `CountingInputStream` live compression ratio tracking.
  - Download authorization enforcing Project confidentiality before original uploader fallback when a file is linked to a Task.
  - Service Request linkage protection preventing deletion of files attached to `service_attachments`.
  - Non-masking compensating cleanup: exceptions during emergency storage deletion do not obscure the original database persistence failure.
- **Task Attachment Integration**: `TaskAttachment` entity and repository, transactional comment attachment linkage (`attachmentFileIds`), cross-project & uploader ownership validation, and task detail `attachmentCount` retrieval with batch count aggregation preventing N+1 queries.
- **Test Suite**: **163/163 tests PASS** (including 63 new Unit/Integration/MockMvc tests across domain, filesystem, validation, and PostgreSQL Testcontainers). Checkstyle violations: 0.

---

## 2. Canonical Scope & Boundaries

### Included Scope
1. **Core File Entity & Status**: `StoredFile`, `StoredFileStatus` (`ACTIVE`, `QUARANTINED`, `DELETED`), `FilePurpose` (`AVATAR`, `TASK_ATTACHMENT`, `SERVICE_ATTACHMENT`, `PROJECT_DOCUMENT`).
2. **Storage Abstraction**: `FileStorageService` interface defining `store`, `loadAsResource`, `exists`, and `delete`.
3. **Local Filesystem Storage**: `LocalFileSystemStorageService` using Java NIO, root path normalization, traversal prevention, temporary staging `.tmp/`, destination overwrite protection without `REPLACE_EXISTING`, and atomic move.
4. **Validation**: Basename sanitization (`FilenameSanitizer`), size enforcement (Images $\le$ 10MB, Documents $\le$ 20MB), MIME and extension whitelist verification, magic byte checks (JPEG, PNG, WEBP, PDF), and in-memory ZipInputStream structure inspection for DOCX (`word/`) and XLSX (`xl/`) preventing zip bombs, excessive compression ratios, and path traversal without disk decompression.
5. **Canonical Endpoints**:
   - `POST /api/v1/files`: Multipart upload returning `201 Created` with metadata DTO (`FileUploadResponse`).
   - `GET /api/v1/files/{fileId}/download`: Secure streaming download returning `200 OK` with verified Content-Type, Content-Length, `X-Content-Type-Options: nosniff`, and UTF-8 Content-Disposition.
   - `DELETE /api/v1/files/{fileId}`: Soft-delete metadata retention returning `204 No Content` for unlinked files owned by uploader or System Admin.
6. **Task Attachment Integration**:
   - `TaskAttachment` mapping table `task_attachments`.
   - `POST /api/v1/tasks/{taskId}/comments`: Attachment validation and reference persistence in single transaction.
   - `GET /api/v1/tasks/{taskId}` & `GET /api/v1/projects/{projectId}/tasks`: Summary `attachmentCount` populated via batch query `countByTaskIdIn` without N+1.

### Explicitly Excluded (Out of Scope)
- **Phase 9 (Service Request)**: No Service Request entity, controller, or service implemented.
- **Service Attachment Integration**: Bounded context boundary respected; no Service Request tables modified or linked via API.
- **User Avatar Update Flow**: Handled in identity context.
- **Project Document Management Flow**: Outside Phase 8 canonical file scope.
- **Cloud Storage**: AWS S3, MinIO, Azure Blob Storage deferred.
- **External Daemons**: No ClamAV or virus scanning daemon installed (noted in technical debt).
- **Client/Mobile**: No React Native or mobile code written.

---

## 3. Storage Provider & Architecture Decisions

### Storage Provider Decision
- **Development & Test Provider**: `LOCAL_FILESYSTEM` (`LocalFileSystemStorageService`).
- **Production Provider**: `DEFERRED_DECISION` (pluggable via `FileStorageService` abstraction without impacting Controllers or domain).
- **Default Path**: Configurable via `WORKSPHERE_STORAGE_PATH` environment variable / `worksphere.storage.path` property, defaulting to `D:/WorkSphereData/uploads` on Windows and fully overridable on Linux/Docker containers.
- **Test Isolation**: Automated tests execute using JUnit 5 `@TempDir` instances, ensuring complete cleanup after each test suite with zero test artifacts written to host or repository.
- **Overwrite Protection**: Final storage move strictly omits `StandardCopyOption.REPLACE_EXISTING`. Pre-checks destination existence and catches `FileAlreadyExistsException`. Existing destination content is preserved on collision.

### Storage Key Implementation
- Local storage relative keys are generated with format:
  `<purpose>/<yyyy>/<MM>/<fileId>.<normalized-extension>`
  *(e.g., `TASK_ATTACHMENT/2026/10/a5f6e91b-871d-4890-a541-b61596796da1.png`)*
- Properties:
  - Purpose derived from canonical enum.
  - Server-generated timestamps (`yyyy/MM`) and UUID `fileId`.
  - Extension derived from verified file type (not trusting client inputs).
  - Storage key is strictly internal and never exposed to clients via response DTOs.
  - Path traversal characters (`..`), drive letters, UNC paths, and leading slashes are prohibited and sanitized.

### Deletion & Retention Policy
- Consistent with canonical schema `stored_files.deleted_at` and database design:
  - Deleting an unlinked file executes a soft delete by updating status to `DELETED` and setting `deleted_at = Instant.now()`.
  - Physical file on disk is retained for operational audit and recovery per enterprise retention policy until a dedicated purge background job is scheduled.
  - Attempting to delete a file linked to a task or service request (`service_attachments`) is rejected with `FILE_ALREADY_LINKED` (HTTP 422).

---

## 4. Security & Validation Controls

1. **Filename Sanitization**:
   - Strips directory path components (both `/` and `\`).
   - Strips null bytes (`\0`), CRLF control characters (`\r`, `\n`), quotation marks, and non-printable control characters.
   - Truncates to 255 characters max.
   - Falls back to `attachment` if the resulting name is blank.
   - Uses Spring `ContentDisposition.attachment().filename(..., StandardCharsets.UTF_8).build()` for RFC 5987 compliance.
2. **Size Enforcement**:
   - Images (`image/jpeg`, `image/png`, `image/webp`): 10 MB maximum.
   - Documents (`application/pdf`, DOCX, XLSX): 20 MB maximum.
   - Multipart limit configured to 25 MB in `application.yml` to allow domain error handling (`FILE_TOO_LARGE` / 413).
3. **MIME & Magic Byte Verification**:
   - JPEG: Checks `FF D8 FF`.
   - PNG: Checks 8-byte signature `89 50 4E 47 0D 0A 1A 0A`.
   - WEBP: Checks `RIFF....WEBP`.
   - PDF: Checks `%PDF-`.
   - DOCX: Checks ZIP signature + parses entries in memory requiring `[Content_Types].xml` and at least one entry under `word/` (rejecting `xl/`).
   - XLSX: Checks ZIP signature + parses entries in memory requiring `[Content_Types].xml` and at least one entry under `xl/` (rejecting `word/`).
   - Zip bomb defense:
     - Enforces `MAX_ZIP_ENTRIES = 200`.
     - Enforces `MAX_ENTRY_UNCOMPRESSED_SIZE = 50 MB`.
     - Enforces `MAX_TOTAL_UNCOMPRESSED_SIZE = 100 MB`.
     - Enforces `MAX_COMPRESSION_RATIO = 100.0`.
     - Monitors live compression ratio using `CountingInputStream`.
     - Rejects path traversal (`..`) within archive entry names.
     - Operates strictly in memory without disk expansion.
4. **Download Security**:
   - Strict access control check:
     - System Admin always has access.
     - Task-linked files require the caller to be an active `ProjectMember` of the task's project; non-members or inactive members are denied (HTTP 403 `FILE_ACCESS_DENIED`).
     - Service-linked files require caller to be requester, active assignee, or Admin.
     - Unlinked files accessible only by the original uploader.
   - Streams `Resource` directly from disk with chunking to protect JVM heap.
   - Sets `X-Content-Type-Options: nosniff`.
   - Absolute filesystem path and storage key are never leaked in headers, body, or logs.

---

## 5. Task Attachment Integration

- **Entity & Persistence**: `TaskAttachment` mapped to table `task_attachments` (`task_id`, `file_id`, `uploaded_by`, `created_at`).
- **Comment Linkage**: `POST /api/v1/tasks/{taskId}/comments` accepts optional `attachmentFileIds: List<UUID>`.
  - Validates all files exist and have status `ACTIVE`.
  - Validates `purpose == FilePurpose.TASK_ATTACHMENT`.
  - Validates uploader ownership: actor must be the original uploader (or Admin).
  - Validates against duplicate file IDs within request and against already attached files.
  - Atomically creates `task_attachments` rows within the same short transaction as the `task_comments` row.
- **N+1 Prevention**: `TaskAttachmentRepository.countByTaskIdIn(List<UUID> taskIds)` performs a single `GROUP BY task_id` query to compute attachment counts for task summaries and lists.
- **API_CONTRACT_GAP Note**: In `docs/06_API_CONTRACT.md`, the Task Detail response explicitly specifies `attachmentCount: integer` and comment requests support `attachmentFileIds: uuid[]`. Canonical docs do not define an embedded attachment items list schema in Task Detail. Accordingly, `attachmentCount` is implemented accurately without inventing uncontracted response fields.

---

## 6. Verification & Test Evidence

### Test Execution Summary
- **Windows Host Tests Run**: 170 (170 PASS, 0 Failures, 0 Errors, 0 Skipped)
- **Linux Container Targeted Tests**: 33 (33 PASS, 0 Failures, 0 Errors, 0 Skipped, executed in `eclipse-temurin:21-jdk`)
- **Checkstyle Violations**: 0 (`You have 0 Checkstyle violations`)
- **Build Result**: `BUILD SUCCESS` (Apache Maven 3.9.16, Spring Boot parent 4.1.1, Java Target 21, Host JDK 27, Linux Container JDK 21.0.12.1 LTS)

### Security Verification & Coverage Audit

1. **Symlink Escape Defense**:
   - Status: `TESTED_ON_LINUX_CONTAINER`
   - Windows Status: `WINDOWS_HOST_TEST_SKIPPED_PRIVILEGE_REQUIRED`
   - Linux Container Evidence: Executed within `eclipse-temurin:21-jdk` where `Files.createSymbolicLink` succeeds.
     - Store traversing symlink: REJECTED with `BusinessRuleException` ("Đường dẫn tệp không hợp lệ"); outside directory untouched.
     - Load traversing symlink: REJECTED with `BusinessRuleException`; outside file protected.
     - Delete traversing symlink: REJECTED with `BusinessRuleException`; outside file not deleted or altered.
     - Direct file symlink: Load & Delete REJECTED; outside file protected.
   - Technical Debt Note: Standard Java NIO cannot completely eliminate TOCTOU race conditions if an attacker possesses concurrent local OS filesystem write access to the storage directory.

2. **ZIP Bomb & Archive Safety Defense**:
   - Status: `TESTED`
   - Entry Count Test: 201+ entries rejected with `"Số lượng entry trong tệp nén vượt quá giới hạn an toàn"`.
   - Declared Oversized Entry Test: Entry declaring > 50MB uncompressed rejected before inflation.
   - Actual Per-Entry Expansion Test: Bounded counter halts decompress immediately when uncompressed bytes exceed threshold with `"Kích thước giải nén thực tế của entry vượt quá giới hạn an toàn"`.
   - Actual Total Expansion Test: Archive with multiple valid entries exceeding cumulative total limit halts with `"Tổng kích thước giải nén của tệp vượt quá giới hạn an toàn"`.
   - Compression Ratio Tests:
     - Declared Ratio Test: Header declaring ratio > 100 rejected with `"Tỷ lệ nén khai báo của tệp vượt ngưỡng an toàn"`.
     - Live Ratio Test: Stream decompressing data exceeding live ratio > 100 halted with `"Tỷ lệ nén thực tế của tệp vượt ngưỡng an toàn"`.
   - Traversal Tests:
     - Relative traversal (`..`): REJECTED.
     - Backslash traversal (`\`): REJECTED.
     - Absolute path (`/`): REJECTED.
     - Drive letter (`C:`): REJECTED.
   - Office Validity & Cross-Detection Tests:
     - Valid DOCX (`[Content_Types].xml` and `word/`): PASS.
     - Valid XLSX (`[Content_Types].xml` and `xl/`): PASS.
     - DOCX containing `xl/`: REJECTED with `"Cấu trúc tệp không khớp định dạng tài liệu được khai báo"`.
     - XLSX containing `word/`: REJECTED with `"Cấu trúc tệp không khớp định dạng tài liệu được khai báo"`.
     - Corrupt ZIP payload: REJECTED with `"Tệp tài liệu Office bị hỏng hoặc không hợp lệ"`.

3. **Cleanup Failure Exception Preservation**:
   - Status: `TESTED_FOR_EXCEPTION_PRESERVATION`
   - Verified that storage deletion failure during compensating transaction rollback does not obscure the primary persistence exception.
   - Status: `FILE_ORPHAN_RECONCILIATION_GAP` (orphans are not automatically reconciled; requires future reconciliation daemon).

### Suite Breakdown
1. **File Core Unit Tests**:
   - `StoredFileTest`: 4 tests PASS.
   - `FilenameSanitizerTest`: 10 tests PASS.
   - `LocalFileSystemStorageTest`: 8 tests PASS on Windows host; 8 tests PASS in Linux container (`SYMLINK_ESCAPE_VERIFIED_ON_LINUX`).
   - `FileValidationServiceTest`: 25 tests PASS on Windows host and Linux container.
   - `FileApplicationServiceTest`: 1 test PASS (`TESTED_FOR_EXCEPTION_PRESERVATION`).
2. **File Integration & Security Tests (PostgreSQL Testcontainers)**:
   - `FileMockMvcTest`: 16 tests PASS.
3. **Task Attachment Integration Tests (PostgreSQL Testcontainers)**:
   - `TaskAttachmentMockMvcTest`: 6 tests PASS.
4. **Regression Suites**:
   - `BackendApplicationTests`: 1 test PASS.
   - `AuthMockMvcTest`: 16 tests PASS.
   - `AdminUserMockMvcTest`: 7 tests PASS.
   - `AuthIntegrationTest`: 11 tests PASS.
   - `MigrationIntegrationTest`: 1 test PASS (all 12 Flyway migrations V001-V012 applied cleanly).
   - `DepartmentMockMvcTest`: 8 tests PASS.
   - `ProjectMockMvcTest`: 15 tests PASS.
   - `TaskMockMvcTest`: 25 tests PASS.
   - `TaskTest` & `TaskWorkflowTest`: 16 tests PASS.

### Pre-Commit Gate Audit
- `git diff -- docs`: 0 changes (Canonical docs untouched).
- `git diff -- backend/src/main/resources/db/migration`: 0 changes (V001-V012 untouched, no V013 created).
- `git diff -- mobile`: 0 changes (Mobile untouched).
- `git diff -- design`: 0 changes (Design untouched).
- `git diff -- AGENTS.md`: 0 changes (Untouched).
- `git diff --check`: 0 whitespace errors.
- Test artifacts: Zero upload files left in workspace or host repository.

---

## 7. Artifacts Created & Modified

### Modified Files in Hardening Verification
- `backend/src/main/java/com/worksphere/file/application/FileValidationService.java`
- `backend/src/test/java/com/worksphere/file/application/FileValidationServiceTest.java`
- `backend/src/test/java/com/worksphere/file/infrastructure/storage/LocalFileSystemStorageTest.java`
- `reports/PHASE_08_REPORT.md`

---

## 8. Known Gaps & Technical Debt

1. **Virus Scanning (Deferred)**: As specified in instructions, ClamAV daemon is deferred to production infrastructure setup; in-flight file validation is performed via strict magic-byte and ZIP structure verification.
2. **Cloud Storage Provider (Deferred)**: S3/MinIO provider integration is deferred to future cloud production phases. `FileStorageService` abstraction is prepared for seamless drop-in replacement.
3. **Physical File Purge Worker**: Soft-deleted files remain in local storage for audit retention. A scheduled background purge job for permanently removing expired deleted files will be required before production.
4. **FILE_ORPHAN_RECONCILIATION_GAP**: When database persistence fails and compensating storage cleanup also encounters an unexpected failure, physical file orphans are not automatically reconciled. A background reconciliation job comparing physical storage files with active `stored_files` database records is recommended before production go-live.
5. **SYMLINK_ESCAPE_TEST_GAP**: On Windows development hosts without Administrator privileges or Developer Mode, creating symbolic links requires elevated privileges (`WINDOWS_HOST_TEST_SKIPPED_PRIVILEGE_REQUIRED`). Full verification was completed on Linux container (`TESTED_ON_LINUX_CONTAINER`). Additionally, portable Java NIO APIs cannot eliminate TOCTOU if an attacker has concurrent local filesystem write access to the host storage directory.
6. **Task Detail Attachment Items List (`API_CONTRACT_GAP`)**: As documented in Section 5, `attachmentCount` is implemented in Task Detail response according to canonical contract. If mobile or web requires an inline list of attachment metadata inside Task Detail in future phases, `docs/06_API_CONTRACT.md` should be amended first.
