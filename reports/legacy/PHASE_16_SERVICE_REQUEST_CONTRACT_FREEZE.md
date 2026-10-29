# PHASE 16 SERVICE REQUEST CONTRACT FREEZE

## Checkpoint

- Repository: `D:\WorkSphere`
- Branch: `main`
- Baseline Checkpoint: `128a8ba74feffce660764a9afae2c7ce9cffed95` (`docs(mobile): audit phase 16 readiness`)
- Pre-Audit Verification: `reports/PRE_PHASE_16_AUDIT.md` (`PRE_PHASE_16_AUDIT_PASS_READY_FOR_DECISION_FREEZE`)
- Status: Clean working tree, `HEAD == origin/main`.
- Phase 15 State: `CLOSED (MEMORY_CHECKPOINT_CLOSED)`.
- Phase 16 State: `CONTRACT_FROZEN / IMPLEMENTATION_NOT_STARTED`.

## Scope

- **Roadmap Precedent**: In `docs/08_DEVELOPMENT_ROADMAP.md` Section 19, "Giai đoạn 15" was originally scheduled as "Mobile Service Request và Asset". Following the proven precedent of Decision `D-061` (which decoupled Roadmap Section 18 into Phase 14 Dashboard/Projects and Phase 15 Tasks to prevent monolithic scope bloat), Service Requests and Asset Management are formally decoupled:
  - **Phase 16**: **Mobile Service Requests** (`SCR-SRV-01` .. `SCR-SRV-06`).
  - **Phase 17**: **Mobile Asset Management** (`SCR-AST-01` .. `SCR-AST-06`).
- **Core Module Purpose**: Provide an end-to-end mobile workplace helpdesk and ticketing flow for employee service requests, technician assignment, status progression, resolution rejection, customer rating, and chronological discussion comments.

## Explicit Exclusions

1. **Asset Management (`SCR-AST-01` .. `SCR-AST-06`)**: Decoupled to Phase 17. Zero Asset CRUD, assignment, or return screens are implemented in Phase 16.
2. **Service Category Admin CRUD (`SCR-ADM-03`)**: Endpoints under `/api/v1/admin/service-categories` (create, edit, deactivate, activate) belong to Admin Module (P1) and are deferred. Phase 16 mobile strictly consumes active categories via public `GET /api/v1/service-categories`.
3. **Native Multipart File Upload / Document Picker UI**: `package.json` contains no document/image picker packages. Displaying server attachments and downloading them via `apiClient` is supported; native file upload is explicitly deferred per standing dependency policy.
4. **Notification Center (`SCR-NOT-01`)**: Belongs to Notification Module; deep link reception is wired, but notification listing is excluded.

## Screens

Phase 16 covers the 6 canonical screens and modals defined in `design/02_SCREEN_INVENTORY.md` Section 5:
- `SCR-SRV-01`: **Service Request List Screen** (Full Screen, Tab 4 root `ServiceRequests`).
- `SCR-SRV-02`: **Service Request Detail Screen** (Full Screen, auxiliary hidden route).
- `SCR-SRV-03`: **Reject Resolution Sheet** (Bottom Sheet / Modal invoked from Detail).
- `SCR-SRV-04`: **Create Service Request Screen** (Full Screen, auxiliary hidden route).
- `SCR-SRV-05`: **Service Request Comments Screen** (Full Screen, auxiliary hidden route).
- `SCR-SRV-06`: **Service Rating Screen** (Modal / Full Screen invoked from Detail).

Auxiliary Modal Flows within `SCR-SRV-02`:
- **Update Status Modal**: Pure domain state transition picker for handler/admin.
- **Assign Request Modal**: Gated by `allowedActions.includes('ASSIGN')` (Admin only), integrating `UserPickerModal`.
- **Edit Request Modal**: Gated by `allowedActions.includes('UPDATE')` (Requester only when status is `OPEN`).

## Backend Endpoints

All 10 Service Request REST endpoints in `ServiceRequestController.java` are verified, tested, and frozen:
1. `GET /api/v1/service-requests`: Scoped search and listing (`SERVICE_REQUEST_READ`).
2. `POST /api/v1/service-requests`: Create service request (`SERVICE_REQUEST_CREATE`).
3. `GET /api/v1/service-requests/{requestId}`: Detailed projection (`SERVICE_REQUEST_READ` + relation check).
4. `PUT /api/v1/service-requests/{requestId}`: Update OPEN request (`SERVICE_REQUEST_UPDATE` + requester check, requires `@NotNull Long version`).
5. `POST /api/v1/service-requests/{requestId}/assignments`: Assign handler (`SERVICE_REQUEST_ASSIGN`, row lock / partial unique index).
6. `PUT /api/v1/service-requests/{requestId}/status`: Update workflow status (`SERVICE_REQUEST_UPDATE_STATUS`, requires `@NotNull Long version`).
7. `POST /api/v1/service-requests/{requestId}/reject-resolution`: Reject resolution (`RESOLVED -> IN_PROGRESS`, requires `@NotNull Long version`).
8. `GET /api/v1/service-requests/{requestId}/comments`: Paginated comments list (`SERVICE_REQUEST_READ` + relation check).
9. `POST /api/v1/service-requests/{requestId}/comments`: Append comment (Public or internal note).
10. `POST /api/v1/service-requests/{requestId}/rating`: Submit rating on closed request (1-5 stars).

Supporting Category Endpoint:
11. `GET /api/v1/service-categories`: Public active categories list sorted by `name ASC`.

## Category Contract

- **Endpoint**: `GET /api/v1/service-categories` (Authenticated, no special permission required).
- **Backend Implementation**: `categoryRepository.findAllByActiveTrueAndDeletedFalse(Sort.by(Sort.Direction.ASC, "name"))`.
- **Shape**: `ApiResponse<List<ServiceCategoryResponse>>` (Unpaged flat list).
- **Frozen Response Fields**:
  - `id: string` (UUID)
  - `parentId: string | null` (UUID)
  - `code: string` (e.g. `'IT_SUPPORT'`, regex `^[A-Z0-9_]{2,50}$`)
  - `name: string` (Human-readable name, e.g. `'Hỗ trợ kỹ thuật CNTT'`)
  - `description: string | null`
  - `defaultPriority: ServicePriority` (`'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'`)
  - `active: boolean` (always true)
- **UI Policy**: Category selection is rendered as a human-readable picker (`[CODE] Name`). Text input of category UUIDs is strictly forbidden.

## Create Contract

- **Endpoint**: `POST /api/v1/service-requests` (`SERVICE_REQUEST_CREATE`).
- **Request Payload (`CreateServiceRequestRequest`)**:
  - `categoryId: string` (UUID, mandatory, `@NotNull`)
  - `title: string` (mandatory, `@NotBlank`, `@Size(max = 255)`)
  - `description: string` (mandatory, `@NotBlank`)
  - `priority?: ServicePriority` (optional, defaults to `category.defaultPriority` if omitted)
  - `assetId?: string` (optional UUID, nullable)
  - `attachmentFileIds?: string[]` (optional list of file UUIDs)
- **Requester Identity**: Derived 100% server-side from JWT principal (`principal.userId()`). Mobile client MUST NEVER supply `requesterId` in request payload.
- **Success Response**: `CreateServiceRequestResponse` containing `{ id: string, requestNumber: string, status: ServiceStatus }` (HTTP 201 Created).
- **Navigation on Success**: Client immediately navigates to `ServiceRequestDetail` using the returned `id` (`{ requestId: response.id }`).

## Asset Policy

- **Contextual Linkage**: Service requests may optionally reference an equipment/asset (`assetId`).
- **Backend Authorization Invariant**:
  - If caller has System Admin role: can link any non-deleted asset in the system.
  - If caller is non-admin: asset must be actively assigned to caller (`assetAssignmentRepository.existsByAssetIdAndAssignedToAndStatus(assetId, callerId, ACTIVE)`). Otherwise, backend rejects with HTTP 403 `ASSET_ACCESS_DENIED`.
- **Phase 16 Mobile Reality**:
  - Service requests can always be created without an asset (`assetId: undefined`).
  - No UUID text input box is rendered.
  - Route context: `CreateServiceRequest` supports optional route param `{ assetId?: string }` for future deep linking or "Báo hỏng" navigation from Asset Detail.
  - In-form interactive asset picker modal is deferred until Phase 17 provides `useMyAssets`.

## Attachment Policy

- **Three Attachment Capabilities**:
  1. **Attachment Metadata Display**: Fully supported. `ServiceRequestDetailResponse.attachments` renders file name, size, uploader, timestamp.
  2. **Attachment Download / Open**: Supported via `GET /api/v1/files/{fileId}/download` through `apiClient`.
  3. **Native Multipart File Upload**: Deferred. Current `package.json` contains no native file/document picker. Outgoing create and comment payloads send `attachmentFileIds: []`.
- **Attachment Identity**: `ServiceAttachmentResponse` identifies files by `fileId: string` (StoredFile UUID). The download URL is structured as `/api/v1/files/{fileId}/download`.

## Status and Priority

### 1. ServiceStatus (Closed Union)
```typescript
export type ServiceStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';
```
Runtime type guard `isServiceStatus` must reject any unknown strings.

### 2. ServicePriority (Closed Union)
```typescript
export type ServicePriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';
```
Matches shared `PriorityLevel` in `PriorityBadge.tsx` with 100% semantic identity.

## Status Transitions

Enforced by pure domain transition rules matching backend `ServiceStatus.canTransitionTo`:
- `OPEN -> ASSIGNED, CANCELLED`
- `ASSIGNED -> IN_PROGRESS`
- `IN_PROGRESS -> WAITING_FOR_USER, RESOLVED`
- `WAITING_FOR_USER -> IN_PROGRESS`
- `RESOLVED -> CLOSED, IN_PROGRESS` (Transitioning back to `IN_PROGRESS` from `RESOLVED` uses `POST /reject-resolution`)
- Terminal States: `CLOSED` and `CANCELLED` allow zero further transitions.
- **Transition Constraints**:
  - Transition to `RESOLVED` strictly requires a non-empty `comment` (solution/resolution notes).
  - Reject resolution strictly requires a non-empty `reason` (max 1000 chars) and `@NotNull Long version`.

## Allowed Actions

- Dynamic capabilities returned by backend in `ServiceRequestDetailResponse.allowedActions`:
  - `ASSIGN`: System Admin can assign request.
  - `UPDATE`: Requester can edit request content while in `OPEN`.
  - `CANCEL`: Requester can cancel request while in `OPEN`.
  - `REJECT_RESOLUTION`: Requester can reject resolution while in `RESOLVED`.
  - `CONFIRM`: Requester can confirm resolution while in `RESOLVED` (transitions to `CLOSED`).
  - `RATE`: Requester can submit rating while in `CLOSED` (if not already rated).
  - `START`: Handler/Admin can start request from `ASSIGNED` to `IN_PROGRESS`.
  - `WAIT_FOR_USER`: Handler/Admin can pause request waiting for user.
  - `RESOLVE`: Handler/Admin can resolve request with solution notes.
  - `RESUME`: Handler/Admin can resume request from `WAITING_FOR_USER` to `IN_PROGRESS`.
  - `COMMENT`: Requester, Handler, or Admin can add comments.
- **Client Defense**: Gated by `KNOWN_SERVICE_REQUEST_ACTIONS`. Unknown actions fail closed (omitted from UI).

## Permissions

- **Global Authorities**:
  - `SERVICE_REQUEST_READ`: Query-scoped listing and detail view.
  - `SERVICE_REQUEST_CREATE`: Create new service request.
  - `SERVICE_REQUEST_UPDATE`: Edit OPEN request (requester only).
  - `SERVICE_REQUEST_ASSIGN`: Assign request (Admin only).
  - `SERVICE_REQUEST_UPDATE_STATUS`: Workflow transitions (Admin or active assignee).
- **Separation**: Global authorities gate navigation entries and screen mounting; contextual `allowedActions` gate in-screen action buttons and modals.

## Assignee Source

- **Candidate Source**: Company Directory via `GET /api/v1/directory/users`.
- **Picker Component**: Reuses `UserPickerModal` from Phase 14 (`mobile/src/features/directory/components/UserPickerModal.tsx`).
- **Eligibility**: Any active, non-deleted user in the company directory is eligible for assignment. Inactive users are excluded automatically by backend directory query.
- **Cardinality**: Exactly one active assignee per request (`0..1`).
- **Assignment Payload**: `AssignServiceRequestRequest`: `{ assigneeId: string }` (User UUID).

## Identity Semantics

| Identifier | Entity Field | Path / Payload Usage | Display Rules |
|:---|:---|:---|:---|
| `requestId` | `service_requests.id` (UUID) | Path param in all request endpoints | Hidden from UI. |
| `requestNumber` | `service_requests.request_number` | Display only (e.g. `SR-2026-000001`) | Visible to user. Never passed in URL paths. |
| `categoryId` | `service_categories.id` (UUID) | In create/update payload | Rendered as `category.name` (`[CODE] Name`). |
| `requesterId` | `users.id` (UUID) | Filter param, response display | Derived server-side from JWT principal. |
| `assigneeId` | `users.id` (UUID) | `AssignServiceRequestRequest.assigneeId` | User UUID from `/directory/users`. |
| `assignmentId` | `service_assignments.id` (UUID) | Audit projection only | Never sent to backend path params. |
| `assetId` | `assets.id` (UUID) | Optional create/update payload | Rendered as `asset.name` (`[CODE] Name`). |
| `fileId` | `stored_files.id` (UUID) | `attachmentFileIds`, download URL | Never displayed as raw string. |
| `commentId` | `service_comments.id` (UUID) | Response display only | Internal key for FlatList rendering. |

## List Query

- **Endpoint**: `GET /api/v1/service-requests`
- **Supported Parameters**:
  - `page`: 0-based integer, default `0`.
  - `size`: default `20`, clamped `1..100`.
  - `sort`: default `'createdAt,desc'`.
  - `search`: trimmed string (matches `title`, `description`, `requestNumber`).
  - `status`: `ServiceStatus` filter.
  - `priority`: `ServicePriority` filter.
  - `categoryId`: UUID filter.
- **Whitelist Sort Properties**: `['createdAt', 'updatedAt', 'priority', 'status', 'requestNumber', 'title']`.
- **Query Scoping**: Backend automatically scopes queries for non-admins to requests where caller is requester OR active assignee.

## Summary DTO

Frozen shape for `ServiceRequestSummaryResponse`:
```typescript
export interface ServiceRequestSummary {
  id: string;
  requestNumber: string;
  categoryId: string;
  categoryName: string;
  requesterId: string;
  requesterName: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  title: string;
  priority: ServicePriority;
  status: ServiceStatus;
  createdAt: string; // ISO Instant
  updatedAt: string; // ISO Instant
}
```

## Detail DTO

Frozen shape for `ServiceRequestDetailResponse`:
```typescript
export interface ServiceRequestDetail {
  id: string;
  requestNumber: string;
  category: { id: string; code: string; name: string };
  requester: { id: string; fullName: string; email: string };
  assignee?: {
    assignmentId: string;
    id: string;
    fullName: string;
    email: string;
    assignedAt: string;
  } | null;
  asset?: { id: string; assetCode: string; name: string } | null;
  title: string;
  description: string;
  priority: ServicePriority;
  status: ServiceStatus;
  resolvedAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  attachments: ServiceAttachment[];
  comments: ServiceComment[];
  histories: ServiceStatusHistory[];
  rating?: ServiceRating | null;
  allowedActions: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

## Comments

- **Endpoints**: `GET /api/v1/service-requests/{requestId}/comments` (paged) and `POST /api/v1/service-requests/{requestId}/comments` (create).
- **Append-Only Contract**: Backend has zero update or delete comment endpoints. Comments are strictly append-only.
- **Internal Note Visibility**:
  - Checkbox "Ghi chú nội bộ" (`isInternal = true`) is visible only to Admin and active assignee.
  - Requesters are blocked by backend from viewing or creating internal notes (`AccessDeniedException`).

## Rating

- **Endpoint**: `POST /api/v1/service-requests/{requestId}/rating` (HTTP 201 Created).
- **Payload (`CreateServiceRatingRequest`)**: `{ score: number, comment?: string }`.
- **Validation**: `score` integer $\in [1, 5]$; `comment` optional max 2000 chars.
- **Eligibility**: Gated by `allowedActions.includes('RATE')` (Caller is requester, status is `CLOSED`, and rating does not exist yet).
- **Duplicate Protection**: Backend unique constraint `service_ratings.request_id` enforces single rating per request (HTTP 409 `SERVICE_RATING_ALREADY_EXISTS`).

## Reject Resolution

- **Endpoint**: `POST /api/v1/service-requests/{requestId}/reject-resolution` (HTTP 200 OK).
- **Payload (`RejectResolutionRequest`)**: `{ reason: string, version: number }`.
- **Validation**: `reason` mandatory non-blank max 1000 chars; `version` mandatory.
- **Eligibility**: Gated by `allowedActions.includes('REJECT_RESOLUTION')` (Caller is requester and status is `RESOLVED`).
- **Resulting State**: Status becomes `IN_PROGRESS`; active assignee is retained; returned `ServiceRequestDetailResponse` is immediately applied to local detail hook state.

## Versioning

- **Entities with `@Version`**: `ServiceRequest` (`version`), `ServiceCategory` (`version`).
- **Versioned Mutation Endpoints**:
  1. `PUT /api/v1/service-requests/{requestId}`: sends `{ ..., version }`
  2. `PUT /api/v1/service-requests/{requestId}/status`: sends `{ status, comment, version }`
  3. `POST /api/v1/service-requests/{requestId}/reject-resolution`: sends `{ reason, version }`
- **Conflict Handling**: On HTTP 409 `OPTIMISTIC_LOCK_CONFLICT`, display `ConfirmationDialog` "Tải lại dữ liệu" to reload authoritative server state.

## Date/Time

- **Zero Calendar Date Input Fields**: There is no start date, due date, or delivery date in Service Requests.
- **Server Timestamps**: All timestamps (`createdAt`, `updatedAt`, `resolvedAt`, `closedAt`, `cancelledAt`, `assignedAt`, `changedAt`) are server-generated UTC `Instant` values.
- **Mobile Formatting**: Displayed using local Vietnamese date-time utility (`HH:mm dd/MM/yyyy`).
- **D-064 Applicability**: `D-064` (UTC+7 17:00:00Z calendar date serialization) is **NOT** applicable.

## StatusBadge Extension

- **Narrow Presentation Context**: `type="serviceRequest"`
- **Canonical Label & Color Mappings**:
  - `OPEN`: `'Mở'`, `infoContainer` / `info`
  - `ASSIGNED`: `'Đã phân công'`, `primaryContainer` / `#2563EB`
  - `IN_PROGRESS`: `'Đang xử lý'`, `successContainer` / `success`
  - `WAITING_FOR_USER`: `'Chờ phản hồi'`, `warningContainer` / `warning`
  - `RESOLVED`: `'Đã giải quyết'`, `successContainer` / `success`
  - `CLOSED`: `'Đã đóng'`, `successContainer` / `#047857`
  - `CANCELLED`: `'Đã hủy'`, `errorContainer` / `error`
- **Protection**: Extending `StatusBadge.tsx` with `type="serviceRequest"` protects Task, Project, and Dashboard status presentations from collision.

## Error Inventory

Standardized error mappings in `serviceRequestErrorMapper.ts`:
- `SERVICE_REQUEST_NOT_FOUND` -> `'Không tìm thấy yêu cầu dịch vụ'` (404)
- `SERVICE_CATEGORY_NOT_FOUND` -> `'Không tìm thấy danh mục dịch vụ hoặc danh mục đã dừng hoạt động'` (404)
- `OPTIMISTIC_LOCK_CONFLICT` -> `'Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.'` (409)
- `SERVICE_STATUS_TRANSITION_INVALID` -> `'Chuyển trạng thái yêu cầu không hợp lệ'` (400)
- `SERVICE_RESOLUTION_COMMENT_REQUIRED` -> `'Vui lòng nhập giải pháp xử lý trước khi hoàn tất'` (400)
- `SERVICE_RESOLUTION_REJECTION_FORBIDDEN` -> `'Bạn không có quyền từ chối kết quả yêu cầu này'` (403)
- `SERVICE_NOT_RESOLVED` -> `'Yêu cầu không còn ở trạng thái đã giải quyết'` (400)
- `SERVICE_ALREADY_CLOSED` -> `'Yêu cầu dịch vụ đã đóng'` (400)
- `SERVICE_ALREADY_CANCELLED` -> `'Yêu cầu dịch vụ đã bị hủy'` (400)
- `SERVICE_ASSIGNMENT_CONFLICT` -> `'Yêu cầu dịch vụ đã được phân công cho người khác'` (409)
- `SERVICE_RATING_FORBIDDEN` -> `'Chỉ người tạo yêu cầu mới có quyền đánh giá'` (403)
- `SERVICE_NOT_CLOSED` -> `'Chỉ có thể đánh giá khi yêu cầu đã đóng'` (400)
- `SERVICE_RATING_ALREADY_EXISTS` -> `'Yêu cầu này đã được đánh giá trước đó'` (409)
- `ASSET_ACCESS_DENIED` -> `'Bạn chỉ được gắn tài sản đang được cấp phát cho chính mình'` (403)
- `USER_INACTIVE` -> `'Người xử lý không còn ở trạng thái hoạt động'` (400)

## Navigation Plan

- **Preserve Exactly 5 Visible Tabs**: `Dashboard`, `Projects`, `Tasks`, `ServiceRequests`, `More`.
- **Root Screen for Tab 4**: `ServiceRequestsScreen.tsx` (`SCR-SRV-01`).
- **Auxiliary Hidden Routes** (`tabBarButton: () => null`, `headerShown: false`):
  - `ServiceRequestDetail: { requestId: string }`
  - `CreateServiceRequest: { assetId?: string } | undefined`
  - `ServiceRequestComments: { requestId: string }`
  - `ServiceRating: { requestId: string }`
- **Route Data Minimization**: Parameters are strictly IDs only (`requestId`, `assetId`).

## Mutation Inventory

Exactly **7 mutation flows** to implement across Phase 16:
1. `CreateServiceRequestScreen`: `POST /api/v1/service-requests` (lock: `submittingRef`, no version)
2. `RejectResolutionSheet`: `POST /api/v1/service-requests/{id}/reject-resolution` (lock: `submittingRef`, requires `version`)
3. `UpdateServiceStatusModal`: `PUT /api/v1/service-requests/{id}/status` (lock: `submittingRef`, requires `version`)
4. `AssignServiceRequestModal`: `POST /api/v1/service-requests/{id}/assignments` (lock: `submittingRef`, no version)
5. `EditServiceRequestModal`: `PUT /api/v1/service-requests/{id}` (lock: `submittingRef`, requires `version`)
6. `ServiceRequestCommentsScreen`: `POST /api/v1/service-requests/{id}/comments` (lock: `addingRef`, no version)
7. `ServiceRatingModal`: `POST /api/v1/service-requests/{id}/rating` (lock: `submittingRef`, no version)

## Concurrency Model

- **Query Deduplication**: Monotonic query generation identity (`queryGenerationRef`), append lock (`paginationLockRef`), in-flight deduplication (`inFlightPromiseRef`), cross-ID supersession (`generationRef`), unmount safety (`isMountedRef`), focus listener with initial-mount guard.
- **Continuous Version Chaining**: `applyServiceRequestUpdate` in `useServiceRequestDetail` immediately commits mutation response and increments optimistic version (`v1 -> v2 -> v3`), invalidating in-flight GETs.
- **Synchronous Mutation Locks**: Mandatory `submittingRef.current = true` on the first frame of every mutation handler to eliminate double-tap duplicate submissions.

## Security

- **Centralized Network Layer**: All requests execute through `apiClient.ts` with automatic Bearer token injection and single-flight refresh coordination.
- **Zero Local Credential/Entity Storage**: Service request entities are held strictly in React memory; unmounted and destroyed on logout.
- **Identifier Minimization**: Zero raw UUIDs or version numbers rendered in user-visible text or accessibility labels.
- **Direct Route Security**: Direct navigation fails closed.

## Tests

Required test coverage before subphases can claim completion:
- **Phase 16A**: Transport types, runtime guards, API adapters, error mapper, StatusBadge extension tests.
- **Phase 16B**: List data hook (`useServiceRequests`), search debouncing, filter chips, pagination, deduplication, screen container.
- **Phase 16C**: Detail data hook (`useServiceRequestDetail`), single-flight dedup, focus freshness, detail screen, error states.
- **Phase 16D**: Create & edit flows, category select modal, synchronous submit locks, optimistic lock conflict reloads.
- **Phase 16E**: Workflow status modal, reject resolution sheet, assignment modal with `UserPickerModal`, continuous version chaining.
- **Phase 16F**: Comments hook & screen (internal note gating), rating modal (score validation, single rating rule).
- **Phase 16G**: Full mobile regression (82+ suites), backend targeted regression (46 tests), clean Android native build, emulator smoke.

## Subphases

- **Phase 16A**: Service Request Contract Foundation & Transport Types
- **Phase 16B**: Service Request List Screen (`SCR-SRV-01`)
- **Phase 16C**: Service Request Detail Screen (`SCR-SRV-02`)
- **Phase 16D**: Create & Edit Service Request (`SCR-SRV-04`)
- **Phase 16E**: Service Request Workflow & Mutations (`SCR-SRV-03`, Status, Assign)
- **Phase 16F**: Comments & Rating Screens (`SCR-SRV-05`, `SCR-SRV-06`)
- **Phase 16G**: Full Integration, Regression, Android Native Build & Emulator Smoke

## Resume Rules

- Never implement Phase 16 feature code outside the designated subphase scope.
- Subphase 16A is the immediate next step.
- Do not start Phase 17 (Asset Management) until Phase 16 is memory-closed.

## Conclusion

PHASE_16_CONTRACT_FROZEN_READY_FOR_16A
