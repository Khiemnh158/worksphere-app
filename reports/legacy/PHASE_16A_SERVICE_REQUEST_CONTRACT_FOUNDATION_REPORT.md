# Phase 16A Implementation Report: Service Request Contract Foundation

## Overview

- **Phase**: 16A
- **Subphase Title**: Service Request Contract Foundation & Transport Types
- **Checkpoint Baseline**: `756c12db20e9aeee0732f37dd247747d73cc1194`
- **Scope**: Core Service Request transport contracts, API adapter, runtime type guards, error mapper, navigation route-contract types, and StatusBadge extension.
- **Architectural Reference**: Decision `D-065` (Phase 16 Mobile Service Request Contract & Scope Freeze) and `docs/06_API_CONTRACT.md` Section 13.
- **Scope Compliance**: Strictly contract foundation only. Zero UI screens, zero modals, zero mutation hooks, zero backend modifications, zero dependency changes.

---

## 1. Delivered Artifacts

### 1.1. Core Types & Runtime Type Guards
- **File**: `mobile/src/features/serviceRequests/types/serviceRequestTypes.ts`
- **Barrels**: `mobile/src/features/serviceRequests/types/index.ts`, `mobile/src/features/serviceRequests/index.ts`
- **Domain Enums**:
  - `ServiceStatus`: Closed union `'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED' | 'CANCELLED'`.
  - `ServicePriority`: Closed union `'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'`.
  - `isServiceStatus(val: unknown): val is ServiceStatus`
  - `isServicePriority(val: unknown): val is ServicePriority`
- **Allowed Actions**:
  - `KNOWN_SERVICE_REQUEST_ACTIONS`: `['ASSIGN', 'UPDATE', 'CANCEL', 'REJECT_RESOLUTION', 'CONFIRM', 'RATE', 'START', 'WAIT_FOR_USER', 'RESOLVE', 'RESUME', 'COMMENT']`.
  - `isKnownServiceRequestAction(action: string): action is KnownServiceRequestAction`
  - `hasServiceRequestAction(actions, action): boolean`
- **Sorting**:
  - `SERVICE_REQUEST_SORT_PROPERTIES`: `['createdAt', 'updatedAt', 'priority', 'status', 'requestNumber', 'title']`.
- **Response DTOs & Projections**:
  - `ServiceCategoryResponse`: Unpaged active categories with audit metadata.
  - `ServiceRequestSummaryResponse`: List projection with category, requester, assignee briefs.
  - `CreateServiceRequestResponse`: Id, requestNumber, and initial status.
  - `ServiceAttachmentResponse`: Attachment metadata (`fileId`, `originalName`, `mimeType`, `sizeBytes`, `downloadUrl`, `uploadedBy`, `createdAt`).
  - `ServiceCommentResponse`: Append-only comments with author and `isInternal`/`isEdited` flags.
  - `ServiceStatusHistoryResponse`: Audit trail entries with transition history.
  - `ServiceRatingResponse`: Closed request rating score and comment.
  - `ServiceRequestDetailResponse`: Complete aggregate projection with nested briefs, attachments, comments, histories, rating, allowedActions, and version.
- **Request DTOs**:
  - `CreateServiceRequestRequest`: Category, title, description, optional priority, optional assetId, optional attachmentFileIds.
  - `UpdateServiceRequestRequest`: Title, description, optional priority, optional assetId, mandatory `@NotNull Long version`.
  - `AssignServiceRequestRequest`: Single `assigneeId` (User UUID).
  - `UpdateServiceRequestStatusRequest`: Status, optional comment, mandatory `@NotNull Long version`.
  - `RejectResolutionRequest`: Mandatory `reason` (max 1000 chars), mandatory `@NotNull Long version`.
  - `CreateServiceCommentRequest`: Content (max 5000 chars), optional `isInternal`, optional `attachmentFileIds`.
  - `CreateServiceRatingRequest`: Score (1..5), optional comment (max 2000 chars).
- **Runtime Type Guards**: Complete guards for all entities, summaries, details, comments, and paginated wrappers (`isServiceCategoryResponse`, `isServiceCategoryList`, `isServiceRequestSummary`, `isServiceRequestSummaryPage`, `isCreateServiceRequestResponse`, `isServiceAttachmentResponse`, `isServiceCommentResponse`, `isServiceCommentPage`, `isServiceStatusHistoryResponse`, `isServiceRatingResponse`, `isServiceRequestDetail`).

### 1.2. API Adapter
- **File**: `mobile/src/features/serviceRequests/api/serviceRequestApi.ts`
- **Barrel**: `mobile/src/features/serviceRequests/api/index.ts`
- **11 Frozen Client Endpoints**:
  1. `listCategories()`: `GET /service-categories` -> `Promise<ServiceCategoryResponse[]>`
  2. `listServiceRequests(query)`: `GET /service-requests` -> `Promise<PagedData<ServiceRequestSummaryResponse>>`
  3. `createServiceRequest(request)`: `POST /service-requests` -> `Promise<CreateServiceRequestResponse>`
  4. `getServiceRequestDetail(requestId)`: `GET /service-requests/{requestId}` -> `Promise<ServiceRequestDetailResponse>`
  5. `updateServiceRequest(requestId, request)`: `PUT /service-requests/{requestId}` -> `Promise<ServiceRequestDetailResponse>`
  6. `assignServiceRequest(requestId, request)`: `POST /service-requests/{requestId}/assignments` -> `Promise<void>`
  7. `updateServiceRequestStatus(requestId, request)`: `PUT /service-requests/{requestId}/status` -> `Promise<void>`
  8. `rejectResolution(requestId, request)`: `POST /service-requests/{requestId}/reject-resolution` -> `Promise<ServiceRequestDetailResponse>`
  9. `getComments(requestId, query)`: `GET /service-requests/{requestId}/comments` -> `Promise<PagedData<ServiceCommentResponse>>`
  10. `createComment(requestId, request)`: `POST /service-requests/{requestId}/comments` -> `Promise<ServiceCommentResponse>`
  11. `rateServiceRequest(requestId, request)`: `POST /service-requests/{requestId}/rating` -> `Promise<ServiceRatingResponse>`
- **Query Serialization**: Deterministic trimming, whitelist sort validation, omitting empty/whitespace parameters.

### 1.3. Presentation-Safe Error Mapper
- **File**: `mobile/src/features/serviceRequests/errors/serviceRequestErrorMapper.ts`
- **Barrel**: `mobile/src/features/serviceRequests/errors/index.ts`
- **Business Error Mappings**:
  - `SERVICE_REQUEST_NOT_FOUND` -> `'Không tìm thấy yêu cầu dịch vụ'` (dialog, `isNotFound: true`)
  - `SERVICE_CATEGORY_NOT_FOUND` -> `'Không tìm thấy danh mục dịch vụ hoặc danh mục đã dừng hoạt động'` (dialog, `isNotFound: true`)
  - `OPTIMISTIC_LOCK_CONFLICT` -> `'Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.'` (dialog, `isConflict: true`)
  - `SERVICE_STATUS_TRANSITION_INVALID` -> `'Chuyển trạng thái yêu cầu không hợp lệ'` (status)
  - `SERVICE_RESOLUTION_COMMENT_REQUIRED` -> `'Vui lòng nhập giải pháp xử lý trước khi hoàn tất'` (status)
  - `SERVICE_RESOLUTION_REJECTION_FORBIDDEN` -> `'Bạn không có quyền từ chối kết quả yêu cầu này'` (dialog, `isForbidden: true`)
  - `SERVICE_NOT_RESOLVED` -> `'Yêu cầu không còn ở trạng thái đã giải quyết'` (dialog)
  - `SERVICE_ALREADY_CLOSED` -> `'Yêu cầu dịch vụ đã đóng'` (dialog)
  - `SERVICE_ALREADY_CANCELLED` -> `'Yêu cầu dịch vụ đã bị hủy'` (dialog)
  - `SERVICE_ASSIGNMENT_CONFLICT` -> `'Yêu cầu dịch vụ đã được phân công cho người khác'` (assignments, `isConflict: true`)
  - `SERVICE_RATING_FORBIDDEN` -> `'Chỉ người tạo yêu cầu mới có quyền đánh giá'` (rating, `isForbidden: true`)
  - `SERVICE_NOT_CLOSED` -> `'Chỉ có thể đánh giá khi yêu cầu đã đóng'` (rating)
  - `SERVICE_RATING_ALREADY_EXISTS` -> `'Yêu cầu này đã được đánh giá trước đó'` (rating, `isConflict: true`)
  - `ASSET_ACCESS_DENIED` -> `'Bạn chỉ được gắn tài sản đang được cấp phát cho chính mình'` (form, `isForbidden: true`)
  - `USER_INACTIVE` -> `'Người xử lý không còn ở trạng thái hoạt động'` (assignments)
  - Standard fallbacks for `CONFLICT`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `VALIDATION_ERROR`, `NETWORK_ERROR`, `TIMEOUT`, `SERVER_ERROR`.

### 1.4. Shared Presentation Extension: StatusBadge
- **File**: `mobile/src/shared/components/StatusBadge.tsx`
- **Extension**: Added `type="serviceRequest"` and mapped canonical `'ASSIGNED'` status:
  - `OPEN`: `'Mở'`, `infoContainer` / `info`
  - `ASSIGNED`: `'Đã phân công'`, `primaryContainer` / `#2563EB`
  - `IN_PROGRESS`: `'Đang xử lý'`, `successContainer` / `success`
  - `WAITING_FOR_USER`: `'Chờ phản hồi'`, `warningContainer` / `warning`
  - `RESOLVED`: `'Đã giải quyết'`, `successContainer` / `success`
  - `CLOSED`: `'Đã đóng'`, `successContainer` / `#047857`
  - `CANCELLED`: `'Đã hủy'`, `errorContainer` / `error`

### 1.5. Navigation Contract Types
- **File**: `mobile/src/app/navigation/types.ts`
- **Added Typed Route Contracts**:
  - `ServiceRequestDetail: { requestId: string }`
  - `CreateServiceRequest: { assetId?: string } | undefined`
  - `ServiceRequestComments: { requestId: string }`
  - `ServiceRating: { requestId: string }`
- **Route Data Minimization**: Parameters are strictly IDs only (`requestId`, `assetId`). Zero entities, versions, permissions, or tokens.

---

## 2. Verification & Validation Evidence

### 2.1. TypeScript Compilation
- **Command**: `npm run typecheck`
- **Result**: `0 errors`, exit code 0.

### 2.2. ESLint
- **Command**: `npm run lint`
- **Result**: `0 errors`, 48 pre-existing warnings in projects/organization components. `0 warnings` in newly created serviceRequests features.

### 2.3. Unit & Integration Test Suites
- **Command**: `npm test -- --runInBand`
- **Baseline**: 82 suites, 736 tests PASS.
- **Current**: 85 suites, 793 tests PASS (+3 suites, +57 tests).
- **Failures**: 0.
- **Skipped**: 0.
- **Snapshots**: 0.
- **Suites Added**:
  1. `__tests__/serviceRequests/serviceRequestTypes.test.ts` (10 tests)
  2. `__tests__/serviceRequests/serviceRequestApi.test.ts` (14 tests)
  3. `__tests__/serviceRequests/serviceRequestErrorMapper.test.ts` (14 tests)
  4. Extended `__tests__/components/StatusBadge.test.tsx` (all 7 service request states + assigned mapping)

### 2.4. Android Native Build
- **Command**: `cd mobile/android; .\gradlew.bat assembleDebug --no-daemon`
- **Result**: `BUILD SUCCESSFUL in 1m 22s` (203 actionable tasks: 17 executed, 186 up-to-date).

---

## 3. Strict Scope & Invariant Compliance

- [x] Zero modifications to backend source code.
- [x] Zero modifications to `mobile/src/features/directory/`.
- [x] Zero new dependencies added to `package.json` / `package-lock.json`.
- [x] Zero Service Request feature screen implementation (SCR-SRV-01 to SCR-SRV-06 deferred to subsequent subphases).
- [x] Zero Service Request mutation hooks or modals.
- [x] All 11 API endpoints strictly aligned with backend controllers and Decision D-065.
- [x] Continuous version chaining support built into request/response contracts (`@NotNull Long version`).
- [x] Clean working tree ready for commit and push.

---

## 4. Independent Audit Hardening

- **Finding Addressed**: `SERVICE_REQUEST_ERROR_MAPPING_DRIFT` (Medium severity).
- **Audit Drift Analysis & Reconciliation**:
  - The independent audit identified that the initial Phase 16A error mapper contained phantom error code `SERVICE_RESOLUTION_COMMENT_REQUIRED` (derived from earlier roadmap prose) which does not exist in backend production code or API contract.
  - In contrast, three backend production-thrown error codes were missing explicit mappings:
    1. `SERVICE_RESOLUTION_REQUIRED` (thrown in `ServiceRequestApplicationService.java:539` when transitioning status to `RESOLVED` without providing a resolution): Mapped to placement `'status'` with message `"Vui lòng nhập giải pháp xử lý trước khi hoàn tất yêu cầu."`.
    2. `SERVICE_ASSIGNEE_REQUIRED` (thrown in `ServiceRequestApplicationService.java:546` when transitioning status to `ASSIGNED` without an active assignee): Mapped to placement `'status'` with message `"Yêu cầu cần có người xử lý trước khi chuyển sang trạng thái đã phân công."`.
    3. `INVALID_REQUEST_STATE` (thrown in `ServiceRequestApplicationService.java:424` when attempting to update a service request that is no longer in `OPEN` state): Mapped to placement `'banner'` with message `"Chỉ có thể cập nhật yêu cầu khi yêu cầu đang ở trạng thái mở."`.
  - The phantom code `SERVICE_RESOLUTION_COMMENT_REQUIRED` was eliminated. If received, it safely falls back to standard validation error handling (`placement: 'form'`) without inappropriate status placement.
- **Test Suite Expansion**:
  - `mobile/__tests__/serviceRequests/serviceRequestErrorMapper.test.ts` was expanded with 3 new test cases verifying exact mapping for `SERVICE_RESOLUTION_REQUIRED`, `SERVICE_ASSIGNEE_REQUIRED`, and `INVALID_REQUEST_STATE`, plus a negative regression test verifying that `SERVICE_RESOLUTION_COMMENT_REQUIRED` falls back to generic validation.
  - Validation baseline expanded from 793 to 796 tests across 85 suites.
- **Verification Evidence**:
  - TypeScript: 0 errors (`npm run typecheck`).
  - ESLint: 0 errors (`npm run lint`).
  - Jest: 85 suites, 796 tests PASS (`npm test -- --runInBand`).
  - Android Build: `cd mobile/android; .\gradlew.bat assembleDebug --no-daemon` -> `BUILD SUCCESSFUL in 26s`.

---

## Conclusion

PHASE_16A_HARDENING_PASS_PUSHED
