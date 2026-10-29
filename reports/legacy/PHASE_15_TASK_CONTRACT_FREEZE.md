# Phase 15 Task Management Contract & Architecture Freeze

## 1. Checkpoint Verification

- **Repository**: `D:\WorkSphere`
- **Branch**: `main`
- **Verified Commit**: `2b84fba0f46f30955ff0584353c97ac067ea6bb4`
- **Remote Alignment**: `HEAD == origin/main` (verified clean working tree).
- **Prerequisite Validations**:
  - `PHASE_14_MEMORY_CHECKPOINT_CLOSED`: Satisfied.
  - `PRE_PHASE_15_AUDIT_PASS_READY_FOR_DECISION_FREEZE`: Satisfied.
  - Phase 14: CLOSED.
  - Phase 15: AUDITED / IMPLEMENTATION_NOT_STARTED.
- **Truth Priority Hierarchy**:
  1. Current backend production source (`backend/src/main/java/com/worksphere/task/`).
  2. Canonical documentation (`docs/08_DEVELOPMENT_ROADMAP.md`, `docs/03_MOBILE_SCREEN_MAP.md`, `docs/06_API_CONTRACT.md`, `design/02_SCREEN_INVENTORY.md`).
  3. Existing audited Phase 13/14 mobile patterns.
  4. Pre-Phase-15 audit report (`reports/PRE_PHASE_15_TASK_MANAGEMENT_AUDIT.md`).

---

## 2. Canonical Scope

Canonical boundaries governing Phase 15 Mobile Task Management:
- `docs/08_DEVELOPMENT_ROADMAP.md` Section 18.3:
  - Task List, Task Detail, Create Task, Edit Task, Subtask List, Task Comment, Status Update, Progress Update.
- `docs/03_MOBILE_SCREEN_MAP.md` Section 8:
  - Registers `SCR-TSK-01` through `SCR-TSK-06` as P0 mobile screens.
- `design/02_SCREEN_INVENTORY.md` Section 4 & 5:
  - Defines UX requirements, responsive rules, accessibility touch targets ($\ge 48\,\text{dp}$), and empty/loading/error states.

---

## 3. Screen Ownership & Routing Inventory

Every screen and action modal belongs to exactly one subphase. Zero orphaned artifacts:

| Screen ID | Canonical Name | Runtime Route / Presentation | Route Parameters | Data Source | Mutation Ownership | Subphase Owner |
|:---|:---|:---|:---|:---|:---|:---:|
| `SCR-TSK-01` | Task List Screen | `MainTabNavigator` tab: `Tasks` | None | `GET /api/v1/tasks` | None (read/filter/search) | **15B** |
| `SCR-TSK-02` | Task Detail Screen | Stack Screen: `TaskDetail` | `{ taskId: string }` | `GET /api/v1/tasks/{taskId}` | Delete Task (`DELETE /api/v1/tasks/{taskId}`) | **15C** |
| `SCR-TSK-03` | Create Task Screen | Stack Screen: `CreateTask` | `{ projectId?: string, parentTaskId?: string }` | Form draft | `POST /api/v1/tasks` | **15D** |
| `SCR-TSK-04` | Edit Task Screen | Stack Screen: `EditTask` | `{ taskId: string }` | `GET /api/v1/tasks/{taskId}` | `PUT /api/v1/tasks/{taskId}` | **15D** |
| `SCR-TSK-05` | Subtask List Screen | Stack Screen: `SubtaskList` | `{ parentTaskId: string, projectId: string }` | `GET /api/v1/tasks/{taskId}/subtasks` | `POST /api/v1/tasks/{taskId}/subtasks` | **15F** |
| `SCR-TSK-06` | Task Comments Screen | Stack Screen: `TaskComments` | `{ taskId: string }` | `GET /api/v1/tasks/{taskId}/comments` | `POST/PUT/DELETE /api/v1/tasks/{taskId}/comments` | **15F** |
| `SCR-TSK-07` | Status Update Action | Modal on `TaskDetail` | In-component state (`task`) | `TaskDetailResponse` | `PUT /api/v1/tasks/{taskId}/status` | **15E** |
| `SCR-TSK-08` | Progress Update Action | Modal on `TaskDetail` | In-component state (`task`) | `TaskDetailResponse` | `PUT /api/v1/tasks/{taskId}/progress` | **15E** |

---

## 4. Endpoint Matrix

Verified directly against `backend/src/main/java/com/worksphere/task/web/TaskController.java`:

| # | HTTP Method | Path | Request Body / Params | Response Body | HTTP Status | Controller Authority | Service / Domain Contextual Check |
|:---:|:---|:---|:---|:---|:---:|:---|:---|
| 1 | `GET` | `/api/v1/tasks` | `search, projectId, parentTaskId, assigneeId, reporterId, status, priority, overdue, dueFrom, dueTo, page, size, sort` | `ApiResponse<PagedData<TaskSummaryResponse>>` | 200 OK | `hasAuthority('TASK_READ')` | User can only see tasks within accessible projects / assignments. |
| 2 | `POST` | `/api/v1/tasks` | `CreateTaskRequest` | `ApiResponse<TaskDetailResponse>` | 201 Created | `hasAuthority('TASK_CREATE')` | Project must be ACTIVE; user must be active project member or Admin; assignees must be active project members. |
| 3 | `GET` | `/api/v1/tasks/{taskId}` | None | `ApiResponse<TaskDetailResponse>` | 200 OK | `hasAuthority('TASK_READ')` | Project access verification; dynamic `allowedActions` calculation. |
| 4 | `PUT` | `/api/v1/tasks/{taskId}` | `UpdateTaskRequest` | `ApiResponse<TaskDetailResponse>` | 200 OK | `hasAuthority('TASK_UPDATE')` | `verifyOptimisticLock`; cannot be terminal; Admin/PM/TL/Reporter only. |
| 5 | `PUT` | `/api/v1/tasks/{taskId}/status` | `ChangeTaskStatusRequest` | `ApiResponse<TaskDetailResponse>` | 200 OK | `hasAuthority('TASK_UPDATE_STATUS')` | `verifyOptimisticLock`; state machine validation; mandatory comment if IN_REVIEW $\rightarrow$ IN_PROGRESS; emits event. |
| 6 | `PUT` | `/api/v1/tasks/{taskId}/progress` | `UpdateTaskProgressRequest` | `ApiResponse<TaskDetailResponse>` | 200 OK | `hasAuthority('TASK_UPDATE')` | `verifyOptimisticLock`; cannot be terminal; 0–100% bounds; Admin/PM/TL/Assignee only. |
| 7 | `POST` | `/api/v1/tasks/{taskId}/assignments` | `AssignTaskRequest` | `ApiResponse<TaskDetailResponse>` | 200 OK | `hasAuthority('TASK_ASSIGN')` | Assignees must be active project members; Admin/PM/TL only. |
| 8 | `DELETE` | `/api/v1/tasks/{taskId}/assignments/{assignmentId}` | Path: `assignmentId` | `ApiResponse<TaskDetailResponse>` | 200 OK | `hasAuthority('TASK_ASSIGN')` | Admin/PM/TL only; assignment must exist and belong to task. |
| 9 | `DELETE` | `/api/v1/tasks/{taskId}` | None | `ApiResponse<Void>` | 200 OK | `hasAuthority('TASK_DELETE')` | Status must be TODO; Admin/PM only; no status history exists. |
| 10 | `GET` | `/api/v1/tasks/{taskId}/subtasks` | None | `ApiResponse<List<TaskSummaryResponse>>` | 200 OK | `hasAuthority('TASK_READ')` | Project access verification; unpaginated list of child tasks. |
| 11 | `POST` | `/api/v1/tasks/{taskId}/subtasks` | `CreateSubtaskRequest` | `ApiResponse<TaskDetailResponse>` | 201 Created | `hasAuthority('TASK_CREATE')` | Inherits parent project; cycle check; project must be ACTIVE. |
| 12 | `GET` | `/api/v1/tasks/{taskId}/comments` | `page, size, sort` | `ApiResponse<PagedData<TaskCommentResponse>>` | 200 OK | `hasAuthority('TASK_READ')` | Project access verification. |
| 13 | `POST` | `/api/v1/tasks/{taskId}/comments` | `CreateTaskCommentRequest` | `ApiResponse<TaskCommentResponse>` | 201 Created | `hasAuthority('TASK_READ')` | Project membership verification; optional parentCommentId. |
| 14 | `PUT` | `/api/v1/tasks/{taskId}/comments/{commentId}` | `UpdateTaskCommentRequest` | `ApiResponse<TaskCommentResponse>` | 200 OK | `hasAuthority('TASK_READ')` | Author or Admin only. |
| 15 | `DELETE` | `/api/v1/tasks/{taskId}/comments/{commentId}` | None | `ApiResponse<Void>` | 200 OK | `hasAuthority('TASK_READ')` | Author or Admin only. |

---

## 5. DTOs & Transport Typing

TypeScript definitions in `mobile/src/features/tasks/api/taskTypes.ts` will strictly reflect backend records:

```typescript
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AssigneeSummary {
  id: string; // userId
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface AssigneeDetail extends AssigneeSummary {
  assignmentId: string; // task_assignments.id (required for unassign)
}

export interface TaskSummary {
  id: string;
  taskCode: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progressPercent: number;
  dueDate?: string | null;
  assignees: AssigneeSummary[];
  subtaskCount: number;
  commentCount: number;
  overdue: boolean;
}

export interface TaskDetail {
  id: string;
  taskCode: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progressPercent: number;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  completedAt?: string | null;
  projectId: string;
  projectName: string;
  parentTaskId?: string | null;
  parentTaskTitle?: string | null;
  milestoneId?: string | null;
  milestoneName?: string | null;
  reporter: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  assignees: AssigneeDetail[];
  subtaskCount: number;
  commentCount: number;
  allowedActions: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Task Statuses & Closed Unions

- Exact source enum in `com.worksphere.task.domain.TaskStatus`:
  - `TODO`
  - `IN_PROGRESS`
  - `IN_REVIEW`
  - `COMPLETED`
  - `CANCELLED`
- Mobile Rule: Strict TypeScript union `TaskStatus`. No open `string` types.
- Runtime Type Guards:
  ```typescript
  export function isTaskStatus(value: unknown): value is TaskStatus {
    return typeof value === 'string' && ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'].includes(value);
  }
  ```

---

## 7. Status Transition Matrix & Domain Side Effects

Verified from `Task.changeStatus` in `backend/src/main/java/com/worksphere/task/domain/Task.java`:

| Current Status | Allowed Next Statuses | Transition Rule / Mandatory Data | Side Effects on Execution |
|:---|:---|:---|:---|
| `TODO` | `IN_PROGRESS`, `CANCELLED` | Optional comment | Updates `status`, `updatedBy`, `updatedAt` |
| `IN_PROGRESS` | `IN_REVIEW`, `CANCELLED` | Optional comment | Updates `status`, `updatedBy`, `updatedAt` |
| `IN_REVIEW` | `COMPLETED` | Optional comment | Sets `progressPercent = 100.00`, records `completedAt = now` |
| `IN_REVIEW` | `IN_PROGRESS` | **Mandatory comment** (rejection reason) | Throws `VALIDATION_ERROR` if comment is empty/blank |
| `COMPLETED` | *None* | **Terminal state** | Throws `TASK_TERMINAL_STATE` |
| `CANCELLED` | *None* | **Terminal state** | Throws `TASK_TERMINAL_STATE` |

- **Critical Invariant**: Setting progress to 100% via `updateProgress` does NOT change status to `COMPLETED`. Only `changeStatus(COMPLETED)` transitions to completed state and sets progress to 100%.

---

## 8. Task Priority

Verified from `com.worksphere.task.domain.TaskPriority`:
- Closed enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Exact 1-to-1 match with `mobile/src/shared/components/PriorityBadge.tsx` (`PriorityLevel`).
- Reused as-is without adapters.

---

## 9. Versioning & Concurrency Contract

Source truth from `TaskApplicationService.java`:
- The `tasks` entity contains `@Version private Long version;`.
- `TaskDetailResponse` returns `version: Long`.
- `TaskSummaryResponse` does **NOT** contain `version`.
- Exact operations requiring `version`:
  1. `PUT /api/v1/tasks/{taskId}` (`UpdateTaskRequest(..., version)`)
  2. `PUT /api/v1/tasks/{taskId}/status` (`ChangeTaskStatusRequest(..., version)`)
  3. `PUT /api/v1/tasks/{taskId}/progress` (`UpdateTaskProgressRequest(..., version)`)
- Operations **NOT** using `version`:
  - `POST /api/v1/tasks/{taskId}/assignments` (uses DB unique constraint)
  - `DELETE /api/v1/tasks/{taskId}/assignments/{assignmentId}`
  - `DELETE /api/v1/tasks/{taskId}`
  - `POST /api/v1/tasks/{taskId}/subtasks`
  - All Comment operations.
- On HTTP 409 `OPTIMISTIC_LOCK_CONFLICT`, the UI shows a reload dialog: *"Dữ liệu công việc đã được cập nhật bởi người khác. Vui lòng tải lại dữ liệu mới nhất."* and triggers a refetch of `TaskDetail`.

---

## 10. Assignment Model & Identifier Disambiguation

- Cardinality: Multi-assignee support (`task_assignments` join entity).
- Identifier Invariant:
  - `taskId`: UUID of the task.
  - `userId`: UUID of the user/employee (`AssigneeDetail.id`).
  - `assignmentId`: UUID of the assignment entity (`task_assignments.id` $\rightarrow$ `AssigneeDetail.assignmentId`).
- **Critical Unassign Rule**:
  - `DELETE /api/v1/tasks/{taskId}/assignments/{assignmentId}` requires `assignmentId`, NOT `userId`.
  - The mobile app must pass `assignee.assignmentId`.

---

## 11. Assignee Eligibility & Member Constraint

- Server Enforcement:
  ```java
  if (!projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, assigneeId)) {
      throw new BusinessException(TaskErrorCode.TASK_ASSIGNEE_NOT_PROJECT_MEMBER);
  }
  ```
- Architectural Rule: Task assignees MUST be active project members.
- Selection Source: `GET /api/v1/projects/{projectId}/members?active=true` (`ProjectMemberResponse[]`).
- Global directory (`GET /api/v1/directory/users`) is strictly prohibited as the candidate source for direct Task assignments.

---

## 12. People-Picker Reuse Decision

- **Evaluated Options**:
  - Option A: Extend `UserPickerModal` with generic person interface. (High risk of regression to Phase 14E screens).
  - Option B: Add `ProjectMemberAssigneePicker` adapter around `UserPickerModal`. (Clumsy; `UserPickerModal` internally calls `useUserDirectory()`).
  - Option C: Build `ProjectMemberAssigneePickerModal` in `mobile/src/features/tasks/components/ProjectMemberAssigneePickerModal.tsx`.
- **Frozen Decision**: **Option C** (Dedicated, low-coupling component).
  - Reuses the visual styles, search debouncing, and accessibility patterns of `UserPickerModal`.
  - Consumes `ProjectMemberResponse` from `GET /api/v1/projects/{projectId}/members`.
  - Supports multi-select (checkbox) for `CreateTask` and `TaskDetail.assignUsers`.
  - Zero raw UUIDs rendered in UI. Displays `fullName`, `email`, and project `role`.

---

## 13. Permissions & Authorities Matrix

| Action | Controller Authority | Service Contextual Requirement | Task `allowedActions` | Mobile UI Gate |
|:---|:---|:---|:---|:---|
| View Tasks | `hasAuthority('TASK_READ')` | Project access / user assignment | N/A | Tab & list accessible |
| View Task Detail | `hasAuthority('TASK_READ')` | Project access | N/A | Screen accessible |
| Create Task | `hasAuthority('TASK_CREATE')` | Active project member or Admin | N/A | FAB / `+ Tạo mới` button |
| Edit Task | `hasAuthority('TASK_UPDATE')` | Not terminal AND (Admin \|\| PM \|\| TL \|\| Reporter) | `UPDATE` | "Chỉnh sửa" button on Task Detail |
| Change Status | `hasAuthority('TASK_UPDATE_STATUS')` | Not terminal | `UPDATE_STATUS` | "Cập nhật trạng thái" button |
| Update Progress | `hasAuthority('TASK_UPDATE')` | Not terminal AND (Admin \|\| PM \|\| TL \|\| Assignee) | `UPDATE_PROGRESS` | Progress edit button / tap |
| Assign Member | `hasAuthority('TASK_ASSIGN')` | Not terminal AND (Admin \|\| PM \|\| TL) | `ASSIGN` | "+ Phân công" button |
| Unassign Member | `hasAuthority('TASK_ASSIGN')` | Not terminal AND (Admin \|\| PM \|\| TL) | `UNASSIGN` | Remove icon on assignee chip |
| Create Subtask | `hasAuthority('TASK_CREATE')` | Not terminal AND (Admin \|\| PM \|\| TL) | `CREATE_SUBTASK` | "+ Thêm công việc con" button |
| Delete Task | `hasAuthority('TASK_DELETE')` | Status == TODO AND (Admin \|\| PM) AND no history | `DELETE` | "Xóa công việc" button |
| Add Comment | `hasAuthority('TASK_READ')` | Authenticated project member | `ADD_COMMENT` | Comment input field |
| Edit/Delete Comment | `hasAuthority('TASK_READ')` | Comment author OR Admin | N/A | Context menu on comment item |

---

## 14. Allowed Actions Contract

Emitted by `TaskApplicationService.computeAllowedActions`:
- Recognized actions: `"ADD_COMMENT"`, `"UPDATE"`, `"UPDATE_PROGRESS"`, `"UPDATE_STATUS"`, `"ASSIGN"`, `"UNASSIGN"`, `"CREATE_SUBTASK"`, `"DELETE"`.
- Mobile Invariant:
  - Unknown action strings in transport are gracefully accepted and ignored.
  - Privileged UI elements fail closed (hidden) unless the required action string is present in `taskDetail.allowedActions`.

---

## 15. Task List Query & Pagination

- Endpoint: `GET /api/v1/tasks`
- Mobile Query Defaults:
  - `page`: 0
  - `size`: 20
  - `sort`: `createdAt,desc`
- Filter Mapping:
  - `status`: Filter chip bar (`Tất cả`, `Cần làm`, `Đang làm`, `Đang duyệt`, `Hoàn thành`).
  - `priority`: Filter chip bar (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - `projectId`: Dropdown or pre-filtered context when navigating from project.
  - `search`: Debounced text search (300ms delay).
- Concurrency Invariant:
  - Monotonic `queryGenerationRef` ensures latest query wins.
  - Append lock (`paginationLockRef`) prevents duplicate fetches on rapid scroll.

---

## 16. Task Detail Lifecycle & Freshness

- Route Parameter: `{ taskId: string }` only. No object passing.
- Focus-Return Freshness:
  - Uses `navigation.addListener('focus')` with `isFirstMountRef` guard (reusing the Phase 14E hardening pattern) to silently refresh task detail when returning from `EditTaskScreen`.
- Cross-ID Supersession:
  - If navigating between tasks (e.g. from parent task to subtask), previous queries are superseded and discarded.

---

## 17. Create Task Contract & Form Fields

- Required Fields: `projectId`, `title` (1–255 chars), `priority`.
- Optional Fields: `parentTaskId`, `milestoneId`, `description`, `assigneeIds`, `startDate`, `dueDate`, `estimatedMinutes`.
- Reference Selectors:
  - `projectId`: Sourced from `projectApi.listProjects({ size: 100 })` displaying project code and name.
  - `assigneeIds`: Sourced from `ProjectMemberAssigneePickerModal` querying `projectApi.listMembers(projectId)`.
  - `milestoneId`: Sourced from `GET /api/v1/projects/{projectId}/milestones`.
- Client Validation:
  - `title.trim().length > 0`
  - If `startDate` and `dueDate` provided: `dueDate >= startDate`
  - `estimatedMinutes >= 0`

---

## 18. Edit Task Contract

- Endpoint: `PUT /api/v1/tasks/{taskId}`
- Mutable Fields: `title`, `description`, `priority`, `startDate`, `dueDate`, `estimatedMinutes`, `version`.
- Immutable Fields: `projectId`, `parentTaskId`, `milestoneId`, `status`, `progressPercent`.
- Optimistic Lock: Requires current `version`.

---

## 19. Status & Progress Mutations

- **Status Mutation**:
  - Endpoint: `PUT /api/v1/tasks/{taskId}/status`
  - Body: `{ status: TaskStatus, comment?: string, version: number }`
  - Special Rule: Transition from `IN_REVIEW` to `IN_PROGRESS` requires a rejection comment.
- **Progress Mutation**:
  - Endpoint: `PUT /api/v1/tasks/{taskId}/progress`
  - Body: `{ progressPercent: number, version: number }`
  - Bounds: 0.00 to 100.00.

---

## 20. Subtask Contract

- **List Subtasks**: `GET /api/v1/tasks/{taskId}/subtasks` $\rightarrow$ `List<TaskSummaryResponse>`.
- **Create Subtask**: `POST /api/v1/tasks/{taskId}/subtasks` $\rightarrow$ `CreateSubtaskRequest`.
  - Automatically inherits `projectId` and `milestoneId` from parent.
  - Cycle detection: Task cannot be its own parent.

---

## 21. Comments Contract

- **List Comments**: `GET /api/v1/tasks/{taskId}/comments?page=0&size=20&sort=createdAt,asc` $\rightarrow$ `PagedData<TaskCommentResponse>`.
- **Create Comment**: `POST /api/v1/tasks/{taskId}/comments` $\rightarrow$ `CreateTaskCommentRequest(content, parentCommentId)`.
- **Update Comment**: `PUT /api/v1/tasks/{taskId}/comments/{commentId}` $\rightarrow$ `UpdateTaskCommentRequest(content)`.
- **Delete Comment**: `DELETE /api/v1/tasks/{taskId}/comments/{commentId}`.
- Authorization: Author or Admin can edit/delete comments.

---

## 22. Attachments Reality & Documentation Drift

- **Inspection Finding**:
  - Backend does not expose endpoints to upload or stream task attachments via `TaskController`.
  - Generic `FileController` exists, but mobile file upload infrastructure is not yet implemented.
- **Drift Record**: `PRE_PHASE_15_ATTACHMENT_SCOPE_DRIFT`.
- **Resolution**: Phase 15 Mobile Task Management excludes file attachment uploading. If comment responses include attachment metadata, it will be rendered read-only. Full file attachments are deferred to a dedicated File Management module.

---

## 23. Task Error Codes & Presentation Mapping

| Error Code | HTTP Status | User-Facing Vietnamese Message | Presentation Channel |
|:---|:---:|:---|:---|
| `TASK_NOT_FOUND` | 404 | Công việc không tồn tại hoặc đã bị xóa. | Screen ErrorState |
| `TASK_INVALID_STATUS_TRANSITION` | 422 | Không thể chuyển trạng thái không hợp lệ. | Banner / Toast |
| `TASK_TERMINAL_STATE` | 422 | Công việc đã hoàn thành hoặc đã hủy, không thể chỉnh sửa. | Banner |
| `TASK_CANNOT_DELETE_HAS_HISTORY` | 422 | Không thể xóa công việc đã có lịch sử trạng thái. Vui lòng chọn Hủy. | Confirmation Dialog Error |
| `TASK_PARENT_CYCLE_DETECTED` | 422 | Công việc không thể làm cha của chính nó. | Field Error |
| `TASK_DATE_RANGE_INVALID` | 422 | Ngày bắt đầu không được sau ngày đến hạn. | Field Error |
| `TASK_INVALID_PROGRESS` | 422 | Tiến độ công việc phải nằm trong khoảng từ 0% đến 100%. | Field Error |
| `TASK_ASSIGNEE_NOT_PROJECT_MEMBER` | 422 | Người được chọn không phải là thành viên hoạt động của dự án. | Picker Banner |
| `TASK_ALREADY_ASSIGNED` | 422 | Người dùng này đã được phân công vào công việc. | Picker Banner |
| `OPTIMISTIC_LOCK_CONFLICT` | 409 | Dữ liệu công việc đã được cập nhật bởi người khác. Vui lòng tải lại. | Conflict Dialog |
| `TASK_COMMENT_NOT_FOUND` | 404 | Bình luận không tồn tại. | Banner |
| `ACCESS_DENIED` | 403 | Bạn không có quyền thực hiện thao tác này. | Banner |

---

## 24. Navigation Integration

- **Visible Tabs**:
  - Tab 3 (`Tasks`) in `MainTabNavigator` will be updated from placeholder `TasksScreen` to production `SCR-TSK-01 TaskListScreen`.
  - Preserves exactly 5 visible bottom tabs: `Dashboard`, `Projects`, `Tasks`, `ServiceRequests`, `More`.
- **Auxiliary Hidden Screens** (registered with `tabBarButton: () => null`):
  - `TaskDetail`: `{ taskId: string }`
  - `CreateTask`: `{ projectId?: string, parentTaskId?: string }`
  - `EditTask`: `{ taskId: string }`
  - `SubtaskList`: `{ parentTaskId: string, projectId: string }`
  - `TaskComments`: `{ taskId: string }`
- **Navigation Invariant**: Routes pass entity IDs only. Never pass full task objects, version numbers, or permissions.

---

## 25. Capability Model Invariants

- Mutation controls are governed by dual gating:
  $$\text{Render Control} = \text{Feature Implemented} \land \text{allowedActions.includes}(\text{Action})$$
- Navigating directly to an auxiliary route does not grant mutation privileges. The server enforces permissions, and client UI fails closed when capabilities are missing.

---

## 26. Mutation Lock Standard

To eliminate `PROJECT_MUTATION_DUPLICATE_SUBMIT_RISK` from Phase 14, all Phase 15 mutation handlers MUST use synchronous `useRef` locks:

```typescript
const isSubmittingRef = useRef(false);

const handleMutation = async () => {
  if (isSubmittingRef.current) return;
  isSubmittingRef.current = true;
  setIsSubmitting(true);

  try {
    await taskApi.performMutation(...);
    // Success handling
  } catch (err) {
    // Error handling
  } finally {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  }
};
```

---

## 27. Concurrency & Freshness Standards

1. **Task List**: Latest-query-wins via monotonic `queryGenerationRef`; append lock for pagination.
2. **Task Detail**: Monotonic fetch supersession; focus listener silently refetches on return from mutation screens.
3. **Assignee Candidates**: Project member query generation guard; deduplicated selection.
4. **Unmount Safety**: Check `isMountedRef` before committing state updates.

---

## 28. Component & Hook Reuse Matrix

| Asset | Source Location | Decision | Justification |
|:---|:---|:---:|:---|
| `apiClient` | `mobile/src/shared/api/apiClient.ts` | `REUSE_AS_IS` | Token refresh and auth boundary |
| `ApiResponse` / `PagedData` | `mobile/src/shared/api/types.ts` | `REUSE_AS_IS` | Standard REST envelopes |
| `PriorityBadge` | `mobile/src/shared/components/PriorityBadge.tsx` | `REUSE_AS_IS` | 100% enum match with `TaskPriority` |
| `StatusBadge` | `mobile/src/shared/components/StatusBadge.tsx` | `NARROW_EXTENSION` | Add task status keys (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `CANCELLED`) |
| `SearchBar` | `mobile/src/shared/components/SearchBar.tsx` | `REUSE_AS_IS` | Reusable search with clear button |
| `LoadingIndicator` | `mobile/src/shared/components/LoadingIndicator.tsx` | `REUSE_AS_IS` | Reusable spinner |
| `ErrorState` | `mobile/src/shared/components/ErrorState.tsx` | `REUSE_AS_IS` | Standard failure view with retry |
| `EmptyState` | `mobile/src/shared/components/EmptyState.tsx` | `REUSE_AS_IS` | Standard empty view |
| `ConfirmationDialog` | `mobile/src/shared/components/ConfirmationDialog.tsx` | `REUSE_AS_IS` | Confirmation dialogs |
| `AppButton` / `AppTextInput` | `mobile/src/shared/components/` | `REUSE_AS_IS` | Accessible design system inputs |
| `UserPickerModal` | `mobile/src/features/directory/components/` | `DO_NOT_REUSE` | Queries global directory; invalid for task assignees |
| `projectApi.listProjects` | `mobile/src/features/projects/api/projectApi.ts` | `REUSE_AS_IS` | Source for project selection in Create Task |
| `projectApi.listMembers` | `mobile/src/features/projects/api/projectApi.ts` | `REUSE_AS_IS` | Source for project member assignee picker |
| `useProjects` patterns | `mobile/src/features/projects/hooks/useProjects.ts` | `REUSE_PATTERN` | Monotonic generation and pagination lock |
| `useProjectDetail` patterns | `mobile/src/features/projects/hooks/useProjectDetail.ts` | `REUSE_PATTERN` | Focus listener and ID supersession |

---

## 29. StatusBadge Extension Specification

Extend `mobile/src/shared/components/StatusBadge.tsx` with narrow mapping for task statuses:
- `TODO`: Label `"Cần làm"`, neutral background (`#F3F4F6`), text (`#4B5563`).
- `IN_PROGRESS`: Label `"Đang làm"`, info background (`#DBEAFE`), text (`#1D4ED8`).
- `IN_REVIEW`: Label `"Đang kiểm tra"`, warning background (`#FEF3C7`), text (`#B45309`).
- `COMPLETED`: Label `"Hoàn thành"`, success background (`#D1FAE5`), text (`#047857`).
- `CANCELLED`: Label `"Đã hủy"`, neutral-dark background (`#FEE2E2`), text (`#B91C1C`).

---

## 30. Backend Test Evidence

Backend Task Module test coverage is comprehensive:
- `TaskApplicationServiceTest`: 22 tests covering creation, editing, transitions, progress bounds, assignment validations, and optimistic locks.
- `TaskControllerIntegrationTest`: 14 tests covering Spring Security `@PreAuthorize`, REST inputs, and JSON serialization.
- `TaskCommentApplicationServiceTest`: 11 tests covering comments and ownership authorizations.
- Total Backend Baseline: 318/318 tests PASS, Checkstyle 0 violations.
- Conclusion: Zero new backend tests or migrations required.

---

## 31. Contract Conflict Resolutions

1. **Assignee Selection Scope**:
   - *Conflict*: Using directory picker would allow selecting non-project members.
   - *Resolution*: Dedicated `ProjectMemberAssigneePickerModal` querying `projectApi.listMembers`.
2. **Unassign Identifier**:
   - *Conflict*: Passing `userId` to unassign endpoint fails.
   - *Resolution*: Frozen contract enforces passing `assignmentId` from `AssigneeDetail.assignmentId`.
3. **Attachments**:
   - *Conflict*: Pre-audit suggested comment attachments.
   - *Resolution*: Attachments removed from Phase 15 scope; recorded `PRE_PHASE_15_ATTACHMENT_SCOPE_DRIFT`.

---

## 32. Phase 15 Implementation Subphase Plan

| Subphase | Name | Scope & Responsibilities | Deliverables |
|:---:|:---|:---|:---|
| **15A** | Task Contract Foundations | TypeScript types, API client adapter, error mapper, StatusBadge extension, navigation typing. | `taskTypes.ts`, `taskApi.ts`, `taskErrors.ts`, `StatusBadge.tsx` update, unit tests. |
| **15B** | Task List Screen (`SCR-TSK-01`) | `useTasks` data hook, `TaskCard`, filter chips (status/priority), search bar, pagination. | `useTasks.ts`, `TaskListScreen.tsx`, `TaskCard.tsx`, unit tests. |
| **15C** | Task Detail Screen (`SCR-TSK-02`) | `useTaskDetail` hook, task details view, `allowedActions` capability gating, focus freshness. | `useTaskDetail.ts`, `TaskDetailScreen.tsx`, unit tests. |
| **15D** | Create & Edit Task Screens (`SCR-TSK-03`, `SCR-TSK-04`) | Forms, project picker, `ProjectMemberAssigneePickerModal`, optimistic lock conflict reload. | `CreateTaskScreen.tsx`, `EditTaskScreen.tsx`, `ProjectMemberAssigneePickerModal.tsx`, unit tests. |
| **15E** | Task Actions & Modals (`SCR-TSK-07`, `SCR-TSK-08`) | Status update modal (with transition validation), progress modal (0-100%), assign/unassign controls. | `ChangeTaskStatusModal.tsx`, `UpdateProgressModal.tsx`, unit tests. |
| **15F** | Subtasks & Comments (`SCR-TSK-05`, `SCR-TSK-06`) | Subtask list/creation, comment discussion thread, add/edit/delete comment. | `SubtaskListScreen.tsx`, `TaskCommentsScreen.tsx`, unit tests. |
| **15G** | Integration, Full Regression & Native Build | Full mobile Jest suite (61+ suites), clean Android native build (`assembleDebug`), emulator smoke. | Final regression report, zero regressions. |

---

## 33. Audit Gate Strategy

- Subphase 15A Implementation $\rightarrow$ Subphase 15A Independent Audit.
- Subphase 15B Implementation $\rightarrow$ Subphase 15B Independent Audit.
- Subphase 15C Implementation $\rightarrow$ Subphase 15C Independent Audit.
- Subphase 15D Implementation $\rightarrow$ Subphase 15D Independent Audit.
- Subphase 15E Implementation $\rightarrow$ Subphase 15E Independent Audit.
- Subphase 15F Implementation $\rightarrow$ Subphase 15F Independent Audit.
- Subphase 15G Implementation $\rightarrow$ Phase 15 Final Independent Audit $\rightarrow$ Reconciliation $\rightarrow$ Memory Checkpoint.

---

## 34. Phase 15 Readiness Assessment

- Backend APIs: 15/15 endpoints verified and green.
- Security Invariants: Contextual project membership and allowedActions verified.
- Component Reuse: Standard components and hooks mapped.
- Blocking Issues: None.

---

## 35. Conclusion & Sign-Off

The Phase 15 Mobile Task Management architecture and contracts are frozen. Later agents must adhere strictly to these frozen contracts and must not reinterpret Task semantics.

**Verdict**: `PHASE_15_CONTRACT_FREEZE_PASS_READY_FOR_15A`
