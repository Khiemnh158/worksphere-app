# Phase 9: Service Request Module Implementation Report

## 1. Initial Checkpoint & Environment
- **Initial Commit**: fb8f41b03b110e069cb2639a39ab6981463c0294 (fix(project): enforce member-scoped project reads).
- **Branch**: main, HEAD aligned with origin/main, clean working tree.
- **Java Target**: 21 (Spring Boot 3.4.1).
- **Database**: PostgreSQL 15 (Testcontainers).
- **Flyway Migrations**: V001–V015 validated and active; no schema gap identified, no V016 migration needed.
- **Pre-Phase 9 Test Baseline**: 183/183 PASS; Checkstyle 0 violations.

---

## 2. Canonical Scope & Architecture
Phase 9 implements the complete Service Request Module as specified in canonical documents:
- docs/01_PROJECT_SCOPE.md
- docs/02_USER_ROLES_AND_WORKFLOWS.md
- docs/04_SYSTEM_ARCHITECTURE.md
- docs/05_DATABASE_DESIGN.md
- docs/06_API_CONTRACT.md
- Decisions D-035 through D-044.

### Package Structure
```text
com.worksphere.service_request
├── api
│   ├── request
│   │   ├── AssignServiceRequestRequest.java
│   │   ├── CreateServiceCategoryRequest.java
│   │   ├── CreateServiceCommentRequest.java
│   │   ├── CreateServiceRatingRequest.java
│   │   ├── CreateServiceRequestRequest.java
│   │   ├── RejectResolutionRequest.java
│   │   ├── UpdateServiceCategoryRequest.java
│   │   ├── UpdateServiceRequestRequest.java
│   │   └── UpdateServiceRequestStatusRequest.java
│   └── response
│       ├── CreateServiceRequestResponse.java
│       ├── ServiceAttachmentResponse.java
│       ├── ServiceCategoryResponse.java
│       ├── ServiceCommentResponse.java
│       ├── ServiceRatingResponse.java
│       ├── ServiceRequestDetailResponse.java
│       ├── ServiceRequestSummaryResponse.java
│       └── ServiceStatusHistoryResponse.java
├── application
│   ├── ServiceCategoryApplicationService.java
│   └── ServiceRequestApplicationService.java
├── domain
│   ├── ServiceAssignment.java
│   ├── ServiceAttachment.java
│   ├── ServiceCategory.java
│   ├── ServiceComment.java
│   ├── ServicePriority.java
│   ├── ServiceRating.java
│   ├── ServiceRequest.java
│   ├── ServiceStatus.java
│   └── ServiceStatusHistory.java
├── infrastructure.persistence
│   ├── ServiceAssignmentRepository.java
│   ├── ServiceAttachmentRepository.java
│   ├── ServiceCategoryRepository.java
│   ├── ServiceCommentRepository.java
│   ├── ServiceRatingRepository.java
│   ├── ServiceRequestRepository.java
│   └── ServiceStatusHistoryRepository.java
└── web
    ├── ServiceCategoryController.java
    └── ServiceRequestController.java
```

---

## 3. Out-of-Scope Confirmations
As strictly directed:
- **No SLA Engine**: No business-hours calculation or automated escalation rules.
- **No Asset Module / Asset Repair History**: No asset mutation or lifecycle changes.
- **No Workflow Engine**: No Activiti/Camunda/external workflow dependency added.
- **No Push / WebSocket / Email**: Handled via deferred side-effect marker:
  NOTIFICATION_SIDE_EFFECT_DEFERRED logged cleanly without external broker dependencies.
- **No Mobile Code**: Zero edits to mobile/ or React Native source.
- **No Visual Prototype Changes**: Zero edits to design/.
- **No Phase 10 scope**.

---

## 4. Key Subsystem Implementations

### A. Service Category
- Full hierarchy support with arbitrary depth (no arbitrary depth limit; verified chains > 50).
- Cycle detection using Set<UUID> traversal preventing self-parenting and multi-level loops (SERVICE_CATEGORY_CYCLE_DETECTED).
- Parent validation: must exist, be active, and not deleted (SERVICE_CATEGORY_PARENT_INVALID).
- Code uniqueness normalized and enforced (SERVICE_CATEGORY_CODE_ALREADY_EXISTS, 409).
- Activate / Deactivate lifecycle with guard checks (SERVICE_CATEGORY_ALREADY_ACTIVE, SERVICE_CATEGORY_ALREADY_INACTIVE).
- In-use protection: Cannot deactivate categories actively referenced by non-terminal service requests (SERVICE_CATEGORY_IN_USE, 400).

### B. Request Number Generation
- Canonical format: SR-YYYY-NNNNNN (e.g. SR-2026-000001).
- PostgreSQL transactional advisory lock: SELECT pg_advisory_xact_lock(1301, :year).
- Gap-resistant, year-scoped MAX + 1 allocation using server Clock (Asia/Ho_Chi_Minh timezone).
- Year rollover resilience: Counter resets cleanly to 000001 upon new calendar year.
- Controlled concurrency integration testing: verified with 8 worker threads and dual barrier (ready/start) repeated across 5 consecutive rounds.
- Database unique constraint uk_service_requests_number acts as final guard.

### C. Query-Level Authorization Scoping
- Evaluated entirely within PostgreSQL queries via Spring Data JPA Specification<ServiceRequest>:
  - System ADMIN: Sees all service requests.
  - Non-Admin (EMPLOYEE, TEAM_LEADER, PROJECT_MANAGER):
    sr.requesterId = :callerId OR EXISTS (SELECT 1 FROM ServiceAssignment sa WHERE sa.requestId = sr.id AND sa.assigneeId = :callerId AND sa.active = true).
  - Unrelated users cannot see records in list queries, nor access detail (403 Forbidden).
  - Total items and pagination metadata strictly mirror the caller's scoped records.

### D. Assignment & Reassignment Lifecycle
- Invariant: Exactly one active assignee per request (0..1).
- Pessimistic write lock (PESSIMISTIC_WRITE with timeout) acquired on ServiceRequest prior to assignment.
- Idempotent assign: Assigning the same user returns 200 OK without creating duplicate rows.
- Reassignment: Atomically deactivates current active assignment (is_active = FALSE, unassigned_at = Clock.instant()) and inserts a new active assignment.
- Final DB guard: Partial unique index uk_service_assignments_one_active with SQLState 23505 mapping to SERVICE_ASSIGNMENT_CONFLICT (HTTP 409).
- Concurrency hardened: Controlled concurrency test verifies active assignment invariant under concurrent race condition over 5 rounds.

### E. Status Workflow & History
- 7 canonical states: OPEN, ASSIGNED, IN_PROGRESS, WAITING_FOR_USER, RESOLVED, CLOSED, CANCELLED.
- Valid transitions:
  - OPEN -> ASSIGNED
  - ASSIGNED -> IN_PROGRESS
  - IN_PROGRESS -> WAITING_FOR_USER
  - WAITING_FOR_USER -> IN_PROGRESS
  - IN_PROGRESS -> RESOLVED (requires comment/resolution)
  - RESOLVED -> CLOSED (terminal, records closed_at)
  - OPEN -> CANCELLED (terminal, records cancelled_at)
- service_status_histories records every valid mutation in the same database transaction.
- Client cannot provide changedBy or changedAt; populated from principal and injected Clock.
- Transaction rollback verified on PostgreSQL: DB failure on history insert rolls back the entire ServiceRequest mutation.

### F. Reject Resolution Endpoint
- Dedicated endpoint: POST /service-requests/{requestId}/reject-resolution.
- Restricted to the original requester (Resource Ownership); active assignee or third parties receive 403 Forbidden.
- Allowed only when status is RESOLVED; transitions back to IN_PROGRESS.
- Retains active assignee.
- Reason mandatory (1–1000 characters), logged directly into service_status_histories.

### G. Comments & Internal Notes
- Public comments: Viewable and creatable by requester, active assignee, and Admin.
- Internal notes (isInternal = true):
  - Creatable only by active assignee or Admin. Requester attempt is rejected with 403 Forbidden.
  - Filtered at DB query level; requesters never receive internal notes in list or detail responses.
  - Pagination integrity: totalItems and totalPages calculated by PostgreSQL without empty pages or ghost records. Previous assignees denied internal note visibility.

### H. Attachments & Security
- Pre-uploaded file validation: StoredFileStatus.ACTIVE, purpose SERVICE_ATTACHMENT.
- Upload ownership: Actor must be file uploader (or Admin).
- Linkage: Zero cross-request file reuse permitted.
- Schema semantics: The service_attachments table maintains (id, request_id, file_id, attached_by, attached_at). It does not maintain a comment_id column; attachmentFileIds provided when creating comments establish Service Request-level attachment linkage.
- Download authorization: Handled by File Module rules; inherits Service Request relations (requester, active assignee, Admin). Unrelated users receive 403 Forbidden.
- Response projection per Decision D-035: fileId, originalName, mimeType, sizeBytes, downloadUrl, uploadedBy, createdAt (where createdAt maps to attached_at). Zero storagePath, storedName, or storage metadata leaked.

### I. Rating
- Restricted to original requester after request reaches CLOSED.
- Score: 1 to 5 (chk_service_ratings_score DB constraint).
- Maximum 1 rating per request guarded by unique constraint service_ratings_request_id_key mapping to SERVICE_RATING_ALREADY_EXISTS (409).
- Concurrency hardened: Controlled concurrency test verifies concurrent duplicate ratings return 201 for winner and 409 for loser without 500 error over 5 rounds.

---

## 5. Verification & Test Suite Summary
- **Total Test Cases**: 210 (183 existing regression + 27 Phase 9 tests).
- **Checkstyle**: 0 violations (.\mvnw.cmd checkstyle:check "-Dcheckstyle.config.location=checkstyle.xml").
- **Maven Build**: BUILD SUCCESS.
- **Exit Code**: 0.

### Test Coverage Hardening Matrix:
- Request number concurrency: TESTED_WITH_BARRIER_AND_REPEAT (8 workers, ready/start latches, 5 rounds).
- Assignment concurrency: TESTED_WITH_ROW_LOCK_AND_DB_INVARIANT (2 workers, latch barrier, single-active invariant, 5 rounds).
- Rating concurrency: TESTED_WITH_UNIQUE_CONSTRAINT_MAPPING (2 workers, dual latch, 201/409 assertions, 5 rounds).
- History rollback: TESTED_ON_POSTGRESQL (trigger failure injection verifying full rollback).
- Internal comment pagination: TESTED_AT_QUERY_LEVEL (DB query scoping, page count, previous assignee scoping).

### Phase 9 Test Matrix:
1. ServiceCategoryMockMvcTest (10 tests):
   - Category CRUD, code normalization & regex.
   - Cycle detection (self-parent, 2-level loop, multi-level cycle).
   - Valid deep chain (> 50 depth).
   - Activation, deactivation, and in-use validation.
   - Optimistic locking conflict.
2. ServiceRequestMockMvcTest (17 exhaustive scenario tests):
   - Request creation & request number format SR-YYYY-NNNNNN.
   - Request number concurrency with barrier & repeat (8 workers x 5 rounds).
   - Category validation (missing, inactive).
   - Detail access & 404 handling.
   - Update request when OPEN / rejected when not OPEN.
   - Query-level scoping (Requester, Assignee, Admin, Unrelated).
   - Assignment lifecycle (idempotent assign, reassign, inactive user rejection, non-admin forbidden).
   - Workflow state machine transitions & terminal states.
   - Reject resolution rules & permissions.
   - Comments & internal note basic visibility.
   - Attachment validation, cross-request prevention, and download access.
   - Rating submission (score range, requester-only, closed-only, duplicate prevention).
   - Assignment concurrency invariant under race condition (5 rounds).
   - Assignment unique constraint direct violation mapping (SQLState 23505).
   - Rating concurrent submission race condition (5 rounds, 201 vs 409).
   - Workflow history insert failure PostgreSQL rollback.
   - Comments internal notes pagination, count, and previous assignee scoping.

---

## 6. Conclusion
Phase 9 Service Request Module is fully hardened, verified, and passes all regression, domain, and concurrency requirements with verified PostgreSQL transaction rollback and invariant enforcement.
