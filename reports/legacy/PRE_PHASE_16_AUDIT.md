# PRE-PHASE 16 AUDIT / CONTRACT RECONCILIATION

## Checkpoint

- Repository: `D:\WorkSphere`
- Branch: `main`
- Initial Pre-Audit Checkpoint: `b49970b781811e26a7df3320c9ec42ac2bae50fa` (`docs(mobile): close phase 15 memory checkpoint`)
- Status: Working tree clean, HEAD equal to origin/main.
- Phase 15 State: `CLOSED (MEMORY_CHECKPOINT_CLOSED)`.
- Phase 16 State: `AUDITED / IMPLEMENTATION_NOT_STARTED`.

## Canonical Phase 16 Scope

### 1. Roadmap & Architecture Context

In `docs/08_DEVELOPMENT_ROADMAP.md`:
- Roadmap Section 3 & Section 19 defined "GIAI ĐOẠN 15: MOBILE SERVICE REQUEST VÀ ASSET".
- Roadmap Section 18 defined "GIAI ĐOẠN 14: MOBILE PROJECT VÀ TASK".
- During actual execution, Architecture Decision `D-061` decoupled Section 18 into two manageable phases:
  - Phase 14: Mobile Dashboard & Projects (`SCR-MAIN-01`, `SCR-PRJ-01` .. `SCR-PRJ-09`) - CLOSED.
  - Phase 15: Mobile Task Management (`SCR-TSK-01` .. `SCR-TSK-08`) - CLOSED.
- This execution progression shifts the roadmap numbering by +1.
- In `reports/PROJECT_STATE.md` and `reports/HANDOFF.md`, the next mobile implementation phase is formally designated as **Phase 16: Mobile Service Requests**.
- Decoupling Service Requests from Asset Management mirrors the proven Phase 14 / Phase 15 decoupling, keeping feature scope focused and regression-safe. Asset Management (`SCR-AST-01` .. `SCR-AST-06`) is deferred to Phase 17.

### 2. Canonical Module Name & Screen Inventory

- **Module Name**: `Mobile Service Requests`
- **Canonical Screen IDs** (per `design/02_SCREEN_INVENTORY.md` Section 5):
  - `SCR-SRV-01`: Service Request List Screen
  - `SCR-SRV-02`: Service Request Detail Screen
  - `SCR-SRV-03`: Reject Resolution Sheet (Bottom Sheet / Modal)
  - `SCR-SRV-04`: Create Service Request Screen
  - `SCR-SRV-05`: Service Request Comments Screen
  - `SCR-SRV-06`: Service Rating Screen (or Modal)
- **Modal Flows within SCR-SRV-02**:
  - Update Status Modal (`PUT /api/v1/service-requests/{requestId}/status`)
  - Assign Request Modal (`POST /api/v1/service-requests/{requestId}/assignments`)
  - Edit Request Screen/Modal (`PUT /api/v1/service-requests/{requestId}`)

### 3. Explicit Exclusions

- **Asset Management (`SCR-AST-01` .. `SCR-AST-06`)**: Deferred to Phase 17.
- **Service Category Management (`SCR-ADM-03`)**: Admin category CRUD (`/api/v1/admin/service-categories`) is part of Admin Module (P1); Phase 16 consumes active categories via `GET /api/v1/service-categories`.
- **Native Multipart File Upload / Document Picker**: Mobile currently has zero document picker or image picker packages in `package.json`. Server attachments display and download are supported; file upload UI is deferred per standing dependency policy.
- **Notification List (`SCR-NOT-01`)**: Part of Notification Center module.

## Screen Inventory

| Screen ID | Screen Name | Type | Purpose | Entry Path | Read Actions | Mutation Actions | Permissions / Capabilities |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `SCR-SRV-01` | Service Request List Screen | Full Screen | Scoped service request list with search & chips | MainTab: Tab 4 (`ServiceRequests`) | `GET /service-requests` | None (navigates to Detail or Create) | `SERVICE_REQUEST_READ` |
| `SCR-SRV-02` | Service Request Detail Screen | Full Screen | Comprehensive request details, status history, assignees, allowedActions | `SCR-SRV-01` tap card, deep link | `GET /service-requests/{id}` | Status change, assign, reject resolution, rate, comment | `SERVICE_REQUEST_READ` + relation |
| `SCR-SRV-03` | Reject Resolution Sheet | Bottom Sheet / Modal | Requester rejects resolution with reason and version | `SCR-SRV-02` button "Từ chối kết quả" | None | `POST /service-requests/{id}/reject-resolution` | `allowedActions` has `REJECT_RESOLUTION` |
| `SCR-SRV-04` | Create Service Request Screen | Full Screen | Create service request with category and priority | `SCR-SRV-01` `+ Tạo mới`, Asset Detail "Báo hỏng" | `GET /service-categories` | `POST /service-requests` | `SERVICE_REQUEST_CREATE` |
| `SCR-SRV-05` | Service Request Comments | Full Screen | Discussion thread, public comments, internal notes | `SCR-SRV-02` button "Thảo luận" | `GET /service-requests/{id}/comments` | `POST /service-requests/{id}/comments` | Relation (Admin, Requester, Assignee) |
| `SCR-SRV-06` | Service Rating Screen | Modal / Full Screen | 1-5 star rating and comment on closed request | `SCR-SRV-02` button "Đánh giá dịch vụ" | None | `POST /service-requests/{id}/rating` | `allowedActions` has `RATE` (Requester) |

## Existing Mobile State

- `mobile/src/features/serviceRequests/screens/ServiceRequestsScreen.tsx`: PLACEHOLDER screen (`PlaceholderScreen` with `screenId="SCR-SRV-01"`).
- `mobile/src/app/navigation/MainTabNavigator.tsx`: Route `ServiceRequests` already registered in `Tab.Screen` with label `'Yêu cầu'`, icon `'Headphones'`.
- `mobile/src/app/navigation/types.ts`: `ServiceRequests: undefined` defined in `MainTabParamList`.
- Components, hooks, API adapters, domain types, and tests: NONE exist yet for Service Requests.
- Overall Mobile State: Clean shell ready for feature implementation.

## Backend Module

Package: `com.worksphere.service_request`
- **Controllers**:
  - `ServiceRequestController.java`: 10 REST endpoints
  - `ServiceCategoryController.java`: 7 REST endpoints
- **Services**:
  - `ServiceRequestApplicationService.java`: Core request lifecycle, status transitions, scoping, advisory locks, allowedActions computation
  - `ServiceCategoryApplicationService.java`: Category tree hierarchy, cycle detection, active category list
- **Domain Entities**:
  - `ServiceRequest.java` (`@Version`, `requestNumber`, `status`, `priority`, `categoryId`, `requesterId`, `assetId`)
  - `ServiceCategory.java` (`@Version`, `code`, `name`, `defaultPriority`, `active`, `parentId`)
  - `ServiceAssignment.java` (`requestId`, `assigneeId`, `assignedBy`, `assignedAt`, `unassignedAt`, `active`)
  - `ServiceComment.java` (`requestId`, `authorId`, `content`, `isInternal`, `createdAt`)
  - `ServiceStatusHistory.java` (`requestId`, `fromStatus`, `toStatus`, `changedBy`, `changedAt`, `reason`)
  - `ServiceRating.java` (`requestId`, `score`, `comment`, `ratedBy`, `ratedAt`)
  - `ServiceAttachment.java` (`requestId`, `fileId`, `uploadedBy`, `createdAt`)
- **Domain Enums**:
  - `ServiceStatus.java` (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`, `CANCELLED`)
  - `ServicePriority.java` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- **Repositories**: 7 Spring Data JPA repositories with specifications and failure-injection tested transactional methods.

## Endpoint Matrix

| # | HTTP Method | Path | Controller Method | Permission / Guard | Request DTO | Response DTO | HTTP Status | Version Required |
|:--|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | `GET` | `/api/v1/service-categories` | `getActiveCategories` | Authenticated | None | `List<ServiceCategoryResponse>` | 200 OK | No |
| 2 | `GET` | `/api/v1/admin/service-categories` | `searchCategories` | `SERVICE_CATEGORY_MANAGE` | None | `PagedData<ServiceCategoryResponse>` | 200 OK | No |
| 3 | `POST` | `/api/v1/admin/service-categories` | `createCategory` | `SERVICE_CATEGORY_MANAGE` | `CreateServiceCategoryRequest` | `ServiceCategoryResponse` | 201 Created | No |
| 4 | `GET` | `/api/v1/admin/service-categories/{id}` | `getCategory` | `SERVICE_CATEGORY_MANAGE` | None | `ServiceCategoryResponse` | 200 OK | No |
| 5 | `PUT` | `/api/v1/admin/service-categories/{id}` | `updateCategory` | `SERVICE_CATEGORY_MANAGE` | `UpdateServiceCategoryRequest` | `ServiceCategoryResponse` | 200 OK | **Yes** (`version`) |
| 6 | `PUT` | `/api/v1/admin/service-categories/{id}/deactivate` | `deactivateCategory` | `SERVICE_CATEGORY_MANAGE` | None | `Void` | 200 OK | No |
| 7 | `PUT` | `/api/v1/admin/service-categories/{id}/activate` | `activateCategory` | `SERVICE_CATEGORY_MANAGE` | None | `Void` | 200 OK | No |
| 8 | `GET` | `/api/v1/service-requests` | `getRequests` | `SERVICE_REQUEST_READ` | Query params | `PagedData<ServiceRequestSummaryResponse>` | 200 OK | No |
| 9 | `POST` | `/api/v1/service-requests` | `createRequest` | `SERVICE_REQUEST_CREATE` | `CreateServiceRequestRequest` | `CreateServiceRequestResponse` | 201 Created | No |
| 10 | `GET` | `/api/v1/service-requests/{id}` | `getRequestDetail` | `SERVICE_REQUEST_READ` + relation | None | `ServiceRequestDetailResponse` | 200 OK | No |
| 11 | `PUT` | `/api/v1/service-requests/{id}` | `updateRequest` | `SERVICE_REQUEST_UPDATE` + requester | `UpdateServiceRequestRequest` | `ServiceRequestDetailResponse` | 200 OK | **Yes** (`version`) |
| 12 | `POST` | `/api/v1/service-requests/{id}/assignments` | `assignRequest` | `SERVICE_REQUEST_ASSIGN` (Admin) | `AssignServiceRequestRequest` | `Void` | 200 OK | No (row lock) |
| 13 | `PUT` | `/api/v1/service-requests/{id}/status` | `updateStatus` | `SERVICE_REQUEST_UPDATE_STATUS` | `UpdateServiceRequestStatusRequest` | `Void` | 200 OK | **Yes** (`version`) |
| 14 | `POST` | `/api/v1/service-requests/{id}/reject-resolution` | `rejectResolution` | Requester + `RESOLVED` | `RejectResolutionRequest` | `ServiceRequestDetailResponse` | 200 OK | **Yes** (`version`) |
| 15 | `GET` | `/api/v1/service-requests/{id}/comments` | `getComments` | `SERVICE_REQUEST_READ` + relation | Query params | `PagedData<ServiceCommentResponse>` | 200 OK | No |
| 16 | `POST` | `/api/v1/service-requests/{id}/comments` | `createComment` | Authenticated relation | `CreateServiceCommentRequest` | `ServiceCommentResponse` | 201 Created | No |
| 17 | `POST` | `/api/v1/service-requests/{id}/rating` | `rateRequest` | Requester + `CLOSED` | `CreateServiceRatingRequest` | `ServiceRatingResponse` | 201 Created | No (unique index) |

Total Endpoints in Service Request Module: **17 endpoints**.

## API Contract Reconciliation

Every backend endpoint was compared directly with `docs/06_API_CONTRACT.md` Section 13:
- Endpoints 1 to 7: 100% `MATCH` with Section 13.1 (Service Categories).
- Endpoints 8 to 17: 100% `MATCH` with Sections 13.2 to 13.10 (Service Requests).
- Material Conflicts: 0. Verdict: `MATCH`.

## Domain Model & State Machine

### 1. ServiceStatus Lifecycle

Seven canonical statuses:
- `OPEN`: Newly created request, waiting for assignment or cancellation.
- `ASSIGNED`: Handled assigned, waiting for handler to start work.
- `IN_PROGRESS`: Actively being resolved by handler.
- `WAITING_FOR_USER`: Waiting for additional info/feedback from requester.
- `RESOLVED`: Handler resolved the issue, waiting for requester confirmation or rejection.
- `CLOSED`: Terminal state, confirmed resolved, eligible for rating.
- `CANCELLED`: Terminal state, cancelled by requester while in `OPEN`.

Valid transition paths (implemented in `ServiceStatus.canTransitionTo`):
- `OPEN -> ASSIGNED, CANCELLED`
- `ASSIGNED -> IN_PROGRESS`
- `IN_PROGRESS -> WAITING_FOR_USER, RESOLVED`
- `WAITING_FOR_USER -> IN_PROGRESS`
- `RESOLVED -> CLOSED, IN_PROGRESS`
- Terminal states `CLOSED` and `CANCELLED` allow zero further transitions.

### 2. ServicePriority Levels

- `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (identical values and semantics to `PriorityLevel` in shared `PriorityBadge.tsx`).

## Permissions & Contextual Capabilities

### 1. Global Permissions
- `SERVICE_REQUEST_READ`: Query-scoped list and detail viewing.
- `SERVICE_REQUEST_CREATE`: Create new request.
- `SERVICE_REQUEST_UPDATE`: Update an OPEN request (requester only).
- `SERVICE_REQUEST_ASSIGN`: Assign a handler to request (Admin only).
- `SERVICE_REQUEST_UPDATE_STATUS`: Advance workflow status (Admin or active assignee).
- `SERVICE_CATEGORY_MANAGE`: Admin category CRUD.

### 2. Contextual Capabilities (`allowedActions`)
Computed dynamically by `ServiceRequestApplicationService.computeAllowedActions`:
- `ASSIGN`: Returned if user has System Admin role.
- `UPDATE`: Returned if user is requester and status is `OPEN`.
- `CANCEL`: Returned if user is requester and status is `OPEN`.
- `REJECT_RESOLUTION`: Returned if user is requester and status is `RESOLVED`.
- `CONFIRM`: Returned if user is requester and status is `RESOLVED`.
- `RATE`: Returned if user is requester, status is `CLOSED`, and rating does not exist yet.
- `START`: Returned if user is (Admin or active assignee) and status is `ASSIGNED`.
- `WAIT_FOR_USER`: Returned if user is (Admin or active assignee) and status is `IN_PROGRESS`.
- `RESOLVE`: Returned if user is (Admin or active assignee) and status is `IN_PROGRESS`.
- `RESUME`: Returned if user is (Admin or active assignee) and status is `WAITING_FOR_USER`.
- `COMMENT`: Returned if user is Admin, requester, or active assignee.

## Identity Model

| Identifier | Type | Entity | Usage / Path Param | Rules & Safeguards |
|:---|:---|:---|:---|:---|
| `requestId` | UUID | `service_requests.id` | Path param in all request mutations & detail | Primary entity key. Never substitute with `requestNumber`. |
| `requestNumber` | String | `service_requests.request_number` | Display only (`SR-YYYY-NNNNNN`) | Generated via advisory lock `(1301, year)`. Never sent as path param. |
| `categoryId` | UUID | `service_categories.id` | `CreateServiceRequestRequest.categoryId`, category CRUD | Must reference active category. |
| `requesterId` | UUID | `users.id` | Response display only | Derived server-side from JWT principal. Never sent in create body. |
| `assigneeId` | UUID | `users.id` | `AssignServiceRequestRequest.assigneeId` | User UUID from company directory (`/directory/users`). |
| `assignmentId` | UUID | `service_assignments.id` | Response display only (`assignee.assignmentId`) | Assignment record ID. Not used in path params (no separate unassign endpoint). |
| `assetId` | UUID | `assets.id` | `CreateServiceRequestRequest.assetId` | Optional. Must be actively assigned to caller if caller is non-admin. |
| `commentId` | UUID | `service_comments.id` | Response display only | Comment entity ID. |
| `fileId` | UUID | `stored_files.id` | `attachmentFileIds`, `attachments[].fileId` | File attachment entity ID. |

## Versioning (@Version)

- **Entities with Optimistic Locking**: `ServiceRequest` (`@Version Long version`), `ServiceCategory` (`@Version Long version`).
- **Mutations Requiring `version`**:
  1. `PUT /api/v1/service-requests/{requestId}`: `UpdateServiceRequestRequest.version`
  2. `PUT /api/v1/service-requests/{requestId}/status`: `UpdateServiceRequestStatusRequest.version`
  3. `POST /api/v1/service-requests/{requestId}/reject-resolution`: `RejectResolutionRequest.version`
  4. `PUT /api/v1/admin/service-categories/{categoryId}`: `UpdateServiceCategoryRequest.version`
- **Mutations NOT Requiring `version`**:
  1. `POST /api/v1/service-requests` (create)
  2. `POST /api/v1/service-requests/{requestId}/assignments` (assign, guarded by pessimistic row lock)
  3. `POST /api/v1/service-requests/{requestId}/comments` (append-only)
  4. `POST /api/v1/service-requests/{requestId}/rating` (single insert, guarded by unique index)
- **Conflict Handling**: On HTTP 409 `OPTIMISTIC_LOCK_CONFLICT`, display `ConfirmationDialog` "Tải lại dữ liệu" to reload authoritative server state.

## Date / Time Semantics

- **No Calendar Date Inputs**: Service Requests have ZERO user-supplied calendar dates (`YYYY-MM-DD`). There is no start date or due date.
- **Timestamp Types**: All date fields in domain and DTOs (`createdAt`, `updatedAt`, `resolvedAt`, `closedAt`, `cancelledAt`, `assignedAt`, `changedAt`) are server-generated UTC timestamps (`Instant`).
- **Mobile UX**: Timestamps formatted display-only in local Vietnamese format (`HH:mm dd/MM/yyyy`).
- **D-064 Applicability**: Decision `D-064` (UTC+7 17:00:00Z calendar date serialization) does **NOT** apply to Service Requests because there are no calendar date input fields.

## Pagination

- `GET /api/v1/service-requests`:
  - 0-based indexing (`page=0`), default `size=20` (clamped 1..100).
  - Default sort: `createdAt,desc`.
  - Allowed sort properties: `createdAt`, `updatedAt`, `priority`, `status`, `requestNumber`, `title`.
  - Query filters: `categoryId`, `requesterId`, `assigneeId`, `assetId`, `status`, `priority`, `createdFrom`, `createdTo`, `search`.
- `GET /api/v1/service-requests/{requestId}/comments`:
  - 0-based indexing (`page=0`), default `size=20`.
  - Default sort: `createdAt,asc` (chronological order).
- `GET /api/v1/service-categories`:
  - Unpaged `List<ServiceCategoryResponse>` (active categories for dropdown/picker).

## Error Inventory

28 actual error codes extracted directly from backend source:
1. `SERVICE_REQUEST_NOT_FOUND` (HTTP 404): Request does not exist or soft-deleted.
2. `SERVICE_CATEGORY_NOT_FOUND` (HTTP 404): Category does not exist or inactive.
3. `SERVICE_CATEGORY_CODE_ALREADY_EXISTS` (HTTP 409): Duplicate category code.
4. `SERVICE_CATEGORY_PARENT_INVALID` (HTTP 400): Parent category invalid.
5. `SERVICE_CATEGORY_CYCLE_DETECTED` (HTTP 400): Category hierarchy cycle detected.
6. `SERVICE_CATEGORY_ALREADY_INACTIVE` (HTTP 400): Category already inactive.
7. `SERVICE_CATEGORY_ALREADY_ACTIVE` (HTTP 400): Category already active.
8. `SERVICE_CATEGORY_IN_USE` (HTTP 400): Cannot deactivate category referenced by active requests.
9. `OPTIMISTIC_LOCK_CONFLICT` (HTTP 409): Version mismatch.
10. `INVALID_REQUEST_STATE` (HTTP 400): Request not in valid state for operation.
11. `SERVICE_STATUS_TRANSITION_INVALID` (HTTP 400): Illegal state transition.
12. `SERVICE_RESOLUTION_COMMENT_REQUIRED` (HTTP 400): Transition to RESOLVED requires resolution comment.
13. `SERVICE_RESOLUTION_REJECTION_FORBIDDEN` (HTTP 403): User not requester or request not in RESOLVED.
14. `SERVICE_NOT_RESOLVED` (HTTP 400): Request not in RESOLVED state.
15. `SERVICE_ALREADY_CLOSED` (HTTP 400): Request already closed.
16. `SERVICE_ALREADY_CANCELLED` (HTTP 400): Request already cancelled.
17. `SERVICE_ASSIGNMENT_CONFLICT` (HTTP 409): Concurrent assignment race.
18. `SERVICE_RATING_FORBIDDEN` (HTTP 403): User not requester.
19. `SERVICE_NOT_CLOSED` (HTTP 400): Request not in CLOSED state.
20. `SERVICE_RATING_ALREADY_EXISTS` (HTTP 409): Request already rated.
21. `ASSET_NOT_FOUND` (HTTP 404): Linked asset not found.
22. `ASSET_ACCESS_DENIED` (HTTP 403): Non-admin linking asset not assigned to them.
23. `FILE_NOT_FOUND` (HTTP 404): Attached file not found.
24. `FILE_TYPE_NOT_ALLOWED` (HTTP 400): Attached file purpose not SERVICE_ATTACHMENT.
25. `FILE_ACCESS_DENIED` (HTTP 403): User not uploader of file.
26. `USER_NOT_FOUND` (HTTP 404): Assignee not found.
27. `USER_INACTIVE` (HTTP 400): Assignee is inactive or deleted.
28. `VALIDATION_ERROR` (HTTP 400): DTO validation failure.

## File / Attachment Scope

- **Contract**: Backend supports `attachmentFileIds: List<UUID>` on create request and create comment. Detail response provides `attachments: List<ServiceAttachmentResponse>`.
- **Mobile Reality**: Mobile currently has NO file picker or image picker libraries in `package.json`.
- **Policy**: Phase 16 supports displaying server attachments (`originalName`, `sizeBytes`, `downloadUrl`), opening download URLs via `apiClient`, and graceful empty states. Native file picker/upload is deferred per standing dependency policy.

## Existing Mobile Reuse Matrix

| Candidate / Pattern | Classification | Notes / Justification |
|:---|:---|:---|
| `apiClient.ts` | `REUSE_AS_IS` | Automatic Bearer injection, token refresh, error formatting |
| `ApiResponse<T>`, `PagedData<T>` | `REUSE_AS_IS` | Standard response envelope and pagination models |
| `SearchBar.tsx` | `REUSE_AS_IS` | Reusable search input with clear button |
| `LoadingIndicator.tsx`, `ErrorState.tsx`, `EmptyState.tsx` | `REUSE_AS_IS` | Standard screen state presentations |
| `ConfirmationDialog.tsx` | `REUSE_AS_IS` | Reusable for status changes, cancellation, conflict reloads |
| `AppButton.tsx`, `AppTextInput.tsx` | `REUSE_AS_IS` | Standard accessible UI inputs |
| `PriorityBadge.tsx` | `REUSE_AS_IS` | Matches `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` 100% |
| `StatusBadge.tsx` | `NARROW_EXTENSION` | Add `'ASSIGNED': 'Đã phân công'` to `CANONICAL_STATUS_LABELS` and color switch |
| `UserPickerModal.tsx` | `REUSE_AS_IS` | Company directory picker for Admin assigning requests (`GET /directory/users`) |
| `useTasks` pattern | `REUSE_PATTERN` | Data hook with debounce, generation supersession, append lock for `useServiceRequests` |
| `useTaskDetail` pattern | `REUSE_PATTERN` | In-flight deduplication, generation supersession, focus freshness, version chaining for `useServiceRequestDetail` |
| `useTaskComments` pattern | `REUSE_PATTERN` | Generation invalidation on comment mutation for `useServiceRequestComments` |

## Concurrency Model

All Phase 16 data hooks and mutations will follow the proven repository concurrency patterns:
1. **List Queries (`useServiceRequests`)**: Monotonic `queryGenerationRef` ensures latest-query-wins; `paginationLockRef` blocks concurrent page appends; in-place deduplication by `id`.
2. **Detail Queries (`useServiceRequestDetail`)**: `inFlightPromiseRef` deduplicates concurrent calls for same ID; `generationRef` supersedes cross-ID calls; `isMountedRef` unmount safety; non-destructive pull-to-refresh; focus listener with initial-mount guard.
3. **Continuous Version Chaining**: `applyServiceRequestUpdate` commits mutation response immediately to local state and increments optimistic version (`v1 -> v2 -> v3`), invalidating in-flight GETs to eliminate stale overwrite races.
4. **Synchronous Mutation Locks**: Every mutation handler implements a synchronous `useRef` lock (`submittingRef.current = true`) on the first frame to eliminate double-tap duplicate submissions.

## Mutation Inventory

| # | Screen / Modal | Mutation Action | Endpoint | Version | Lock Ref | Confirmation |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | `CreateServiceRequestScreen` | Create request | `POST /service-requests` | No | `submittingRef` | No |
| 2 | `RejectResolutionSheet` | Reject resolution | `POST /service-requests/{id}/reject-resolution` | **Yes** | `submittingRef` | Yes |
| 3 | `UpdateStatusModal` | Update status | `PUT /service-requests/{id}/status` | **Yes** | `submittingRef` | Yes |
| 4 | `AssignServiceRequestModal` | Assign handler | `POST /service-requests/{id}/assignments` | No | `submittingRef` | Yes |
| 5 | `EditServiceRequestModal` | Update request | `PUT /service-requests/{id}` | **Yes** | `submittingRef` | No |
| 6 | `ServiceCommentsScreen` | Add comment | `POST /service-requests/{id}/comments` | No | `addingRef` | No |
| 7 | `ServiceRatingScreen` | Submit rating | `POST /service-requests/{id}/rating` | No | `submittingRef` | No |

Total Phase 16 Mutations: **7 mutation flows**.

## Navigation Plan

- **Preserve Exactly 5 Visible Tabs**: Bottom tab bar retains `Dashboard`, `Projects`, `Tasks`, `ServiceRequests`, `More`.
- **Root Screen for Tab 4**: `ServiceRequestsScreen.tsx` (`SCR-SRV-01`).
- **Auxiliary Hidden Routes** (registered with `tabBarButton: () => null`, `headerShown: false`):
  - `ServiceRequestDetail: { requestId: string }`
  - `CreateServiceRequest: { assetId?: string } | undefined`
  - `ServiceRequestComments: { requestId: string }`
  - `ServiceRating: { requestId: string }`
- **Route Data Minimization**: Strictly IDs only (`requestId`, `assetId`). Zero entity objects, zero permissions, zero `allowedActions`, zero version numbers.

## Accessibility Plan

- Interactive touch targets $\ge 48\,\text{dp}$ across cards, buttons, filter chips, rating stars, and modal dismiss buttons.
- Accessible modal dialogs with `accessibilityRole="alertdialog"` or `modal={true}`.
- Rating stars with explicit accessibility labels (e.g. `Đánh giá: 4 trên 5 sao`).
- Error messages associated with inputs via `accessibilityLiveRegion="polite"`.
- Non-color-only status and priority representations (label text always present).

## Test Baseline

- **Current Frozen Mobile Baseline**: 82 test suites, 736 tests PASS (0 failures, 0 skipped, 0 snapshots).
- **Test Filters Check**: Verified 0 `.only` and 0 `.skip` filters across all mobile test suites.
- **Backend Service Request Test Baseline**: 46 integration tests PASS:
  - `ServiceRequestMockMvcTest.java`: 25 tests
  - `ServiceCategoryMockMvcTest.java`: 14 tests
  - `AssetServiceRequestIntegrationMockMvcTest.java`: 7 tests

## Contract Conflicts & Scope Alignment

1. **Phase 16 Scope Decoupling**:
   - `docs/08_DEVELOPMENT_ROADMAP.md` Section 19 bundled Service Request and Asset together as "Giai đoạn 15".
   - Following the precedent of Decision `D-061` (which split Roadmap Section 18 into Phase 14 Dashboard/Projects and Phase 15 Tasks), Service Requests and Asset Management must be decoupled into Phase 16 (Service Requests) and Phase 17 (Assets).
   - Severity: `DECISION_REQUIRED` (resolved via proposed Decision `D-065`).
2. **Assignee Candidate Source**:
   - Unlike Tasks (which restricted assignees to active project members per `D-063`), Service Requests are organizational and backend validates against `userRepository.findById()` for active non-deleted users.
   - Severity: `DECISION_REQUIRED` (freeze reuse of `UserPickerModal` with `/directory/users`).
3. **StatusBadge Missing Enum Value**:
   - `ASSIGNED` is a canonical `ServiceStatus` but is missing from `StatusBadge.tsx` `CANONICAL_STATUS_LABELS`.
   - Severity: `IMPLEMENTATION_DETAIL` (resolved via narrow extension in Phase 16A).
4. **File Picker Native Package**:
   - Native document/image picker is absent from `package.json`.
   - Severity: `DEFERRED` (server attachments displayed, native upload UI deferred per D-063 precedent).

## Decisions Required Before Implementation (D-065)

An architecture decision `D-065: Phase 16 Mobile Service Request Contract & Scope Freeze` is required covering:
1. **Scope Boundary**: Phase 16 is strictly Mobile Service Requests (`SCR-SRV-01` .. `SCR-SRV-06`). Asset Management is decoupled to Phase 17.
2. **Assignee Candidate Source**: Assignee picker uses `UserPickerModal` querying `GET /api/v1/directory/users`, restricted to Admin.
3. **Category Source**: Dropdown/picker queries active categories via `GET /api/v1/service-categories`.
4. **Attachment Policy**: Display server attachments; native file upload deferred.
5. **Route Data Minimization**: IDs only (`requestId`, `assetId`).
6. **Synchronous Ref Lock Standard**: Mandatory `useRef` lock on all 7 mutation flows.
7. **StatusBadge Extension**: Add `ASSIGNED` ('Đã phân công') to `StatusBadge.tsx`.

## Proposed Subphases

- **Phase 16A**: Service Request Contract Foundation & Transport Types
  - Scope: `serviceRequestTypes.ts`, `serviceRequestApi.ts`, `serviceRequestErrorMapper.ts`, `StatusBadge` narrow extension, navigation param types.
  - Exclusions: Screen UI.
- **Phase 16B**: Service Request List Screen (`SCR-SRV-01`)
  - Scope: `useServiceRequests.ts`, `ServiceRequestCard.tsx`, `ServiceRequestsScreen.tsx`, filter chips, search debounce, pull-to-refresh.
- **Phase 16C**: Service Request Detail Screen (`SCR-SRV-02`)
  - Scope: `useServiceRequestDetail.ts`, `ServiceRequestDetailScreen.tsx`, status history timeline, assignee card, action gating, deep link wiring.
- **Phase 16D**: Create & Edit Service Request (`SCR-SRV-04`)
  - Scope: `CategorySelectModal.tsx`, `CreateServiceRequestScreen.tsx`, Edit request modal, asset linkage adapter.
- **Phase 16E**: Service Request Workflow & Mutations (`SCR-SRV-03` + Status + Assign)
  - Scope: `RejectResolutionSheet.tsx`, `UpdateServiceStatusModal.tsx`, `AssignServiceRequestModal.tsx` (integrating `UserPickerModal`), continuous version chaining.
- **Phase 16F**: Service Request Comments & Rating (`SCR-SRV-05` & `SCR-SRV-06`)
  - Scope: `useServiceRequestComments.ts`, `ServiceRequestCommentsScreen.tsx`, `ServiceRatingModal.tsx` (1-5 stars).
- **Phase 16G**: Integration, Regression, Android Native Build & Emulator Smoke
  - Scope: Full regression (mobile + backend), navigation audit, clean Gradle build, emulator smoke test.

## Dependency Order

```text
Phase 16A: Contract Foundation (Types, API, Error Mapper, StatusBadge)
  │
  ├──► Phase 16B: List Screen (SCR-SRV-01, useServiceRequests, Card)
  │       │
  │       ├──► Phase 16C: Detail Screen (SCR-SRV-02, useServiceRequestDetail)
  │       │       │
  │       │       ├──► Phase 16E: Workflow Mutations (SCR-SRV-03, Status, Assign)
  │       │       │
  │       │       └──► Phase 16F: Comments & Rating (SCR-SRV-05, SCR-SRV-06)
  │       │
  │       └──► Phase 16D: Create & Edit (SCR-SRV-04, CategorySelectModal)
  │
  └────────────────────────────────────────────────► Phase 16G: Integration & Hardening
```

## Readiness Matrix

| Area | Status | Evidence / Notes |
|:---|:---|:---|
| Canonical Scope | **READY** | Clear boundary defined; Asset decoupled to Phase 17 |
| Backend Endpoints | **READY** | All 17 endpoints exist in `ServiceRequestController` & `ServiceCategoryController` |
| Transport DTOs | **READY** | 7 request DTOs, 8 response DTOs verified against source |
| Permissions | **READY** | Global permissions + 11 dynamic `allowedActions` mapped |
| Identity Model | **READY** | Strict isolation: `requestId` vs `requestNumber` vs `assigneeId` vs `assignmentId` |
| Date / Time | **READY** | Server-side UTC Instants only; zero calendar rollovers; D-064 not applicable |
| Navigation | **READY** | Tab 4 exists; 4 auxiliary hidden routes planned; IDs-only params |
| Mobile Reuse | **READY** | PriorityBadge, UserPickerModal, apiClient, hooks patterns all reusable |
| Test Baseline | **READY** | Mobile 82/736 clean (0 filters); Backend 46 tests passing |
| Security | **READY** | Centralized apiClient, relation checks, fail-closed direct routes |

## Conclusion

PRE_PHASE_16_AUDIT_PASS_READY_FOR_DECISION_FREEZE
