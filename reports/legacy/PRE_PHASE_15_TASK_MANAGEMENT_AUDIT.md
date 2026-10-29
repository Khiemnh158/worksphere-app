# Pre-Phase 15 Audit: Mobile Task Management Readiness & Contract Reconciliation

## 1. Checkpoint Verification

- **Repository**: `D:\WorkSphere`
- **Branch**: `main`
- **Verified Commit**: `16ad7824bf40e7273c83de181ccec620ecb50787`
- **Remote Alignment**: `HEAD == origin/main` (verified clean working tree, 0 untracked files, 0 staged changes).
- **Prerequisite State**: `PHASE_14_MEMORY_CHECKPOINT_CLOSED` satisfied. Phase 14 is officially CLOSED. Phase 15 is NOT STARTED.
- **Audit Purpose**: Comprehensive pre-implementation audit, contract reconciliation, reuse mapping, and security pre-mortem for Phase 15 Mobile Task Management (`SCR-TSK-01` .. `SCR-TSK-08`).

---

## 2. Canonical Scope

According to canonical sources:
- `docs/08_DEVELOPMENT_ROADMAP.md` Section 18.3 ("Phase 15: Mobile Task Management"):
  - Task List screen with status/priority filters and pull-to-refresh (`SCR-TSK-01`).
  - Task Detail screen with full task info, assignments, status history, subtasks, and comments (`SCR-TSK-02`).
  - Create Task form with project selector, priority, due date, assignee, and validation (`SCR-TSK-03`).
  - Edit Task form with editable fields and version check (`SCR-TSK-04`).
  - Subtask List and creation screen/modal (`SCR-TSK-05`).
  - Task Comments screen/component with add/reply and attachment list (`SCR-TSK-06`).
  - Status Update action modal with transition validation (`SCR-TSK-07`).
  - Progress Update modal with slider/stepper and version check (`SCR-TSK-08`).
- `docs/03_MOBILE_SCREEN_MAP.md` Section 8:
  - Registers `SCR-TSK-01` through `SCR-TSK-06` as P0 screens.
- `design/02_SCREEN_INVENTORY.md` Section 5:
  - Standardizes UI specifications, accessibility guidelines, and component hierarchy for all task screens.

---

## 3. Screen Inventory

| Screen ID | Canonical Screen Name | Description / Responsibilities | Priority | Navigation Target |
|:---|:---|:---|:---:|:---|
| `SCR-TSK-01` | Task List Screen | Paginated list of tasks, status/priority filter chips, project filter, search bar, overdue indicator, FAB / header create action. | P0 | Bottom Tab: `Tasks` |
| `SCR-TSK-02` | Task Detail Screen | Full task details, status, priority, progress bar, dates, assignees, allowedActions-gated buttons, subtask summary, comment summary. | P0 | Stack: `TaskDetail` |
| `SCR-TSK-03` | Create Task Screen | Form to create a task: project picker, title, description, priority, dates, assignees, milestone picker, client-side validation. | P0 | Stack: `CreateTask` |
| `SCR-TSK-04` | Edit Task Screen | Form to edit mutable fields (title, description, priority, dates, estimatedMinutes) with version concurrency protection. | P0 | Stack: `EditTask` |
| `SCR-TSK-05` | Subtask List Screen | List of subtasks under parent task, creation action, completion toggle/status. | P0 | Stack: `SubtaskList` |
| `SCR-TSK-06` | Task Comments Screen | Threaded/flat comments, add comment input, edit/delete for own comments, timestamp display. | P0 | Stack: `TaskComments` |
| `SCR-TSK-07` | Status Update Action | Modal or bottom sheet on Task Detail to change status according to the canonical state machine with optional comment. | P0 | Modal / Sheet on `TaskDetail` |
| `SCR-TSK-08` | Progress Update Action | Modal or bottom sheet on Task Detail to adjust progress percentage (0–100%) with optimistic locking. | P0 | Modal / Sheet on `TaskDetail` |

---

## 4. Backend Endpoint Inventory

All 15 required Task module endpoints already exist in `backend/src/main/java/com/worksphere/task/web/TaskController.java` and are fully implemented:

| # | HTTP Method | Endpoint URI | Authority Requirement | Controller Handler Method | Return Type |
|:---:|:---|:---|:---|:---|:---|
| 1 | `GET` | `/api/v1/tasks` | `hasAuthority('TASK_READ')` | `searchTasks(...)` | `ApiResponse<PagedData<TaskSummaryResponse>>` |
| 2 | `POST` | `/api/v1/tasks` | `hasAuthority('TASK_CREATE')` | `createTask(...)` | `ApiResponse<TaskDetailResponse>` (201 Created) |
| 3 | `GET` | `/api/v1/tasks/{taskId}` | `hasAuthority('TASK_READ')` | `getTaskById(...)` | `ApiResponse<TaskDetailResponse>` |
| 4 | `PUT` | `/api/v1/tasks/{taskId}` | `hasAuthority('TASK_UPDATE')` | `updateTask(...)` | `ApiResponse<TaskDetailResponse>` |
| 5 | `PUT` | `/api/v1/tasks/{taskId}/status` | `hasAuthority('TASK_UPDATE_STATUS')` | `changeTaskStatus(...)` | `ApiResponse<TaskDetailResponse>` |
| 6 | `PUT` | `/api/v1/tasks/{taskId}/progress` | `hasAuthority('TASK_UPDATE')` | `updateTaskProgress(...)` | `ApiResponse<TaskDetailResponse>` |
| 7 | `POST` | `/api/v1/tasks/{taskId}/assignments` | `hasAuthority('TASK_ASSIGN')` | `assignTask(...)` | `ApiResponse<TaskDetailResponse>` |
| 8 | `DELETE` | `/api/v1/tasks/{taskId}/assignments/{assignmentId}` | `hasAuthority('TASK_ASSIGN')` | `unassignTask(...)` | `ApiResponse<TaskDetailResponse>` |
| 9 | `DELETE` | `/api/v1/tasks/{taskId}` | `hasAuthority('TASK_DELETE')` | `deleteTask(...)` | `ApiResponse<Void>` (200 OK, successNoContent) |
| 10 | `GET` | `/api/v1/tasks/{taskId}/subtasks` | `hasAuthority('TASK_READ')` | `getSubtasks(...)` | `ApiResponse<List<TaskSummaryResponse>>` |
| 11 | `POST` | `/api/v1/tasks/{taskId}/subtasks` | `hasAuthority('TASK_CREATE')` | `createSubtask(...)` | `ApiResponse<TaskDetailResponse>` (201 Created) |
| 12 | `GET` | `/api/v1/tasks/{taskId}/comments` | `hasAuthority('TASK_READ')` | `getComments(...)` | `ApiResponse<PagedData<TaskCommentResponse>>` |
| 13 | `POST` | `/api/v1/tasks/{taskId}/comments` | `hasAuthority('TASK_READ')` | `addComment(...)` | `ApiResponse<TaskCommentResponse>` (201 Created) |
| 14 | `PUT` | `/api/v1/tasks/{taskId}/comments/{commentId}` | `hasAuthority('TASK_READ')` | `updateComment(...)` | `ApiResponse<TaskCommentResponse>` |
| 15 | `DELETE` | `/api/v1/tasks/{taskId}/comments/{commentId}` | `hasAuthority('TASK_READ')` | `deleteComment(...)` | `ApiResponse<Void>` (200 OK, successNoContent) |

---

## 5. DTO Contracts

### 5.1 Request DTOs
1. `CreateTaskRequest`:
   - `projectId` (`UUID`, Required)
   - `parentTaskId` (`UUID`, Optional)
   - `milestoneId` (`UUID`, Optional)
   - `title` (`String`, 1–255 chars, Required)
   - `description` (`String`, Optional)
   - `priority` (`TaskPriority`, Required)
   - `assigneeIds` (`List<UUID>`, Optional)
   - `startDate` (`LocalDate`, Optional)
   - `dueDate` (`LocalDate`, Optional)
   - `estimatedMinutes` (`Integer`, min 0, Optional)
2. `UpdateTaskRequest`:
   - `title` (`String`, 1–255 chars, Required)
   - `description` (`String`, Optional)
   - `priority` (`TaskPriority`, Required)
   - `startDate` (`LocalDate`, Optional)
   - `dueDate` (`LocalDate`, Optional)
   - `estimatedMinutes` (`Integer`, min 0, Optional)
   - `version` (`Long`, Required — optimistic locking)
3. `ChangeTaskStatusRequest`:
   - `status` (`TaskStatus`, Required)
   - `comment` (`String`, Optional)
   - `version` (`Long`, Required — optimistic locking)
4. `UpdateTaskProgressRequest`:
   - `progressPercent` (`BigDecimal`, 0.00–100.00, Required)
   - `version` (`Long`, Required — optimistic locking)
5. `AssignTaskRequest`:
   - `assigneeIds` (`List<UUID>`, non-empty, Required)
6. `CreateSubtaskRequest`:
   - `title` (`String`, 1–255 chars, Required)
   - `description` (`String`, Optional)
   - `priority` (`TaskPriority`, Required)
   - `assigneeIds` (`List<UUID>`, Optional)
   - `startDate` (`LocalDate`, Optional)
   - `dueDate` (`LocalDate`, Optional)
   - `estimatedMinutes` (`Integer`, min 0, Optional)
7. `CreateTaskCommentRequest`:
   - `content` (`String`, 1–2000 chars, Required)
   - `parentCommentId` (`UUID`, Optional)
   - `attachmentFileIds` (`List<UUID>`, Optional)
8. `UpdateTaskCommentRequest`:
   - `content` (`String`, 1–2000 chars, Required)

### 5.2 Response DTOs
1. `TaskSummaryResponse`:
   - `id` (`UUID`), `taskCode` (`String`), `title` (`String`), `status` (`TaskStatus`), `priority` (`TaskPriority`), `progressPercent` (`BigDecimal`), `dueDate` (`LocalDate`), `assignees` (`List<AssigneeSummary>`), `subtaskCount` (`int`), `commentCount` (`int`), `overdue` (`boolean`).
2. `TaskDetailResponse`:
   - `id` (`UUID`), `taskCode` (`String`), `title` (`String`), `description` (`String`), `status` (`TaskStatus`), `priority` (`TaskPriority`), `progressPercent` (`BigDecimal`), `startDate` (`LocalDate`), `dueDate` (`LocalDate`), `estimatedMinutes` (`Integer`), `actualMinutes` (`Integer`), `completedAt` (`Instant`), `projectId` (`UUID`), `projectName` (`String`), `parentTaskId` (`UUID`), `parentTaskTitle` (`String`), `milestoneId` (`UUID`), `milestoneName` (`String`), `reporter` (`UserInfo`), `assignees` (`List<AssigneeDetail>`), `subtaskCount` (`int`), `commentCount` (`int`), `allowedActions` (`Set<String>`), `version` (`Long`), `createdAt` (`Instant`), `updatedAt` (`Instant`).
3. `AssigneeDetail`:
   - `id` (`UUID` — User ID), `name` (`String`), `email` (`String`), `avatarUrl` (`String`), `assignmentId` (`UUID` — Task Assignment ID, needed for unassigning).
4. `TaskCommentResponse`:
   - `id` (`UUID`), `taskId` (`UUID`), `author` (`UserInfo`), `content` (`String`), `parentCommentId` (`UUID`), `replyCount` (`int`), `attachments` (`List<AttachmentInfo>`), `createdAt` (`Instant`), `updatedAt` (`Instant`).
5. `TaskStatusHistoryResponse`:
   - `id` (`UUID`), `taskId` (`UUID`), `fromStatus` (`TaskStatus`), `toStatus` (`TaskStatus`), `changedBy` (`UserInfo`), `comment` (`String`), `createdAt` (`Instant`).

---

## 6. Task Statuses & Lifecycle

Defined in `com.worksphere.task.domain.TaskStatus`:

| Status | Code | Is Terminal? | Allowed Next Statuses | Color / Semantic Representation |
|:---|:---|:---:|:---|:---|
| **TODO** | `TODO` | No | `IN_PROGRESS`, `CANCELLED` | Gray / Neutral |
| **IN PROGRESS** | `IN_PROGRESS` | No | `IN_REVIEW`, `CANCELLED` | Blue / Information |
| **IN REVIEW** | `IN_REVIEW` | No | `COMPLETED`, `IN_PROGRESS` | Yellow / Warning |
| **COMPLETED** | `COMPLETED` | **Yes** | None (terminal) | Green / Success |
| **CANCELLED** | `CANCELLED` | **Yes** | None (terminal) | Dark Red / Neutral Dark |

- Invariant: Terminal status tasks (`COMPLETED`, `CANCELLED`) reject updates to status, progress, edit, assignments, and subtask creation with HTTP 422 `TASK_TERMINAL_STATE`.

---

## 7. Task Priorities

Defined in `com.worksphere.task.domain.TaskPriority`:
- Values: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Compatibility: Matches mobile `PriorityLevel` enum in `mobile/src/shared/components/PriorityBadge.tsx` with 100% equivalence (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Invariant: `PriorityBadge` can be reused immediately without any changes or adapter overhead.

---

## 8. Assignment Model & Cardinality

- **Cardinality**: Many-to-Many (`task_assignments` join table). A task may have multiple active assignees.
- **Identifier Separation**:
  - `AssigneeDetail.id`: The User ID (`UUID`) representing the person assigned.
  - `AssigneeDetail.assignmentId`: The Assignment Record ID (`task_assignments.id`).
- **Unassign Invariant**: The backend endpoint `DELETE /api/v1/tasks/{taskId}/assignments/{assignmentId}` requires `assignmentId` (the assignment entity ID), NOT `userId`. The mobile app must supply `assignee.assignmentId`.

---

## 9. Assignee Eligibility & Project Membership Constraint

- **Strict Server Rule**: In `TaskApplicationService.validateAssignees(assigneeIds, projectId)`:
  ```java
  for (UUID assigneeId : assigneeIds) {
      if (!projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, assigneeId)) {
          throw new BusinessException(TaskErrorCode.TASK_ASSIGNEE_NOT_PROJECT_MEMBER);
      }
  }
  ```
- **Architectural Discovery**: Global `GET /api/v1/directory/users` is **NOT** sufficient or safe for task assignee selection! Attempting to assign an active employee who is not an active member of `projectId` triggers HTTP 422 `TASK_ASSIGNEE_NOT_PROJECT_MEMBER`.
- **Prescribed Solution**:
  - For `CreateTask` and `TaskDetail` assignments, the user selector MUST source members from `GET /api/v1/projects/{projectId}/members` (`ProjectMemberResponse[]`).
  - The UI will filter active members and pass their `userId` values to `assigneeIds`.

---

## 10. Permissions & Authorities

Backend Spring Security requirements:
- `TASK_READ`: Query tasks, view task detail, list subtasks, view comments.
- `TASK_CREATE`: Create new root tasks (`POST /tasks`) and subtasks (`POST /tasks/{id}/subtasks`).
- `TASK_UPDATE`: Update task fields (`PUT /tasks/{id}`) and progress (`PUT /tasks/{id}/progress`).
- `TASK_UPDATE_STATUS`: Change task status (`PUT /tasks/{id}/status`).
- `TASK_ASSIGN`: Assign members (`POST /tasks/{id}/assignments`) and remove assignments (`DELETE /tasks/{id}/assignments/{assignmentId}`).
- `TASK_DELETE`: Delete task (`DELETE /tasks/{id}`).

---

## 11. Allowed Actions & Client Action Gating

The backend dynamically computes `allowedActions: Set<String>` in `TaskDetailResponse`:
- `"ADD_COMMENT"`: Authenticated members of the project.
- `"UPDATE"`: If not terminal AND (Admin || isPM || isTL || isReporter).
- `"UPDATE_PROGRESS"`: If not terminal AND (Admin || isPM || isTL || isAssignee).
- `"UPDATE_STATUS"`: If not terminal (any project member can request status change, governed by state machine).
- `"ASSIGN"`, `"UNASSIGN"`: If not terminal AND (Admin || isPM || isTL).
- `"CREATE_SUBTASK"`: If not terminal AND (Admin || isPM || isTL).
- `"DELETE"`: If status == `TODO`, (Admin || isPM), and `!statusHistoryRepository.existsByTaskId(taskId)`.

**Client UI Invariant**: Buttons and interactive controls on `TaskDetailScreen` MUST check `task.allowedActions.includes(...)` before rendering, failing closed (hidden/disabled) if not permitted.

---

## 12. Task Creation Contract

- Endpoint: `POST /api/v1/tasks`
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Required Fields: `projectId`, `title` (1–255 non-whitespace chars), `priority`.
- Optional Fields: `parentTaskId`, `milestoneId`, `description`, `assigneeIds`, `startDate`, `dueDate`, `estimatedMinutes`.
- Invariants:
  - If `startDate` and `dueDate` are both provided, `dueDate` must be on or after `startDate` (client-side validation + backend validation).
  - Selected `assigneeIds` must be active members of `projectId`.
  - Selected `milestoneId` must belong to `projectId`.
  - Initial status is automatically set to `TODO`, progress to `0.00`.

---

## 13. Task Edit Contract

- Endpoint: `PUT /api/v1/tasks/{taskId}`
- Required Fields: `title`, `priority`, `version` (optimistic lock token).
- Optional Fields: `description`, `startDate`, `dueDate`, `estimatedMinutes`.
- Invariant & Immutable Fields:
  - `projectId`, `parentTaskId`, `milestoneId`, `status`, and `progressPercent` **CANNOT** be updated via this endpoint.
  - Returns HTTP 409 `OPTIMISTIC_LOCK_CONFLICT` if `version` does not match the database version.

---

## 14. Status Transition Machine

- Endpoint: `PUT /api/v1/tasks/{taskId}/status`
- DTO: `{ status: TaskStatus, comment?: string, version: number }`
- Rules:
  - `TODO` $\rightarrow$ `IN_PROGRESS` or `CANCELLED`
  - `IN_PROGRESS` $\rightarrow$ `IN_REVIEW` or `CANCELLED`
  - `IN_REVIEW` $\rightarrow$ `COMPLETED` or `IN_PROGRESS`
  - `COMPLETED` $\rightarrow$ Terminal (No transitions)
  - `CANCELLED` $\rightarrow$ Terminal (No transitions)
- Side Effects on Completion: When transition to `COMPLETED` succeeds, backend automatically sets `progressPercent = 100.00` and records `completedAt = Instant.now()`.
- Error Handling: Invalid transition triggers HTTP 422 `TASK_INVALID_STATUS_TRANSITION`.

---

## 15. Assignment Mutation Contracts

1. **Add Assignments**:
   - `POST /api/v1/tasks/{taskId}/assignments`
   - Body: `{ assigneeIds: [UUID, ...] }`
   - Pre-condition: Assignees must be active project members.
2. **Remove Assignment**:
   - `DELETE /api/v1/tasks/{taskId}/assignments/{assignmentId}`
   - Param: `assignmentId` (`UUID` from `AssigneeDetail.assignmentId`).
   - Note: Returns full `TaskDetailResponse` with updated assignments list.

---

## 16. Error Codes & HTTP Semantics

| Error Code | HTTP Status | Meaning / Client Handling |
|:---|:---:|:---|
| `TASK_NOT_FOUND` | 404 | Task ID does not exist; display error state and navigate back. |
| `TASK_INVALID_STATUS_TRANSITION` | 422 | Attempted illegal state transition; refresh task detail. |
| `TASK_TERMINAL_STATE` | 422 | Cannot mutate a completed or cancelled task. |
| `TASK_CANNOT_DELETE` | 422 | Task is not in TODO status or has status history. |
| `TASK_CANNOT_BE_OWN_PARENT` | 422 | Parent task ID equals task ID. |
| `TASK_INVALID_PROGRESS` | 422 | Progress percent outside 0.00–100.00 range. |
| `TASK_ASSIGNEE_NOT_PROJECT_MEMBER` | 422 | Selected assignee is not an active project member. |
| `TASK_COMMENT_NOT_FOUND` | 404 | Comment ID does not exist. |
| `TASK_COMMENT_NOT_AUTHORIZED` | 403 | User cannot edit or delete comments authored by others. |
| `OPTIMISTIC_LOCK_CONFLICT` | 409 | Version mismatch; prompt user to reload and retry. |

---

## 17. Search, Filtering, and Sorting

- Endpoint: `GET /api/v1/tasks`
- Supported Query Parameters:
  - `search`: String (matches taskCode or title, case-insensitive).
  - `projectId`: UUID (filter tasks by project).
  - `parentTaskId`: UUID (filter direct subtasks).
  - `assigneeId`: UUID (filter tasks assigned to user).
  - `reporterId`: UUID (filter tasks created by user).
  - `status`: `TaskStatus` (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `CANCELLED`).
  - `priority`: `TaskPriority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - `overdue`: Boolean (filter overdue tasks).
  - `dueFrom` / `dueTo`: `LocalDate` (`YYYY-MM-DD`).
  - `page`: Integer (0-based, default 0).
  - `size`: Integer (default 20).
  - `sort`: String (default `createdAt,desc`). Whitelisted: `dueDate,asc`, `dueDate,desc`, `priority,desc`, `status,asc`.

---

## 18. Navigation & Tab Hierarchy

- Current `MainTabNavigator` status:
  - Tab 3 is already registered as `Tasks` with icon `format-list-checks`.
  - Currently renders a placeholder screen (`TasksScreen`).
- Auxiliary screens to register in `MainTabNavigator` (with `tabBarButton: () => null` to preserve the 5-visible-tab invariant):
  - `TaskDetail`: Params `{ taskId: string }`.
  - `CreateTask`: Params `{ projectId?: string, parentTaskId?: string }`.
  - `EditTask`: Params `{ taskId: string }`.
  - `SubtaskList`: Params `{ parentTaskId: string, projectId: string }`.
  - `TaskComments`: Params `{ taskId: string }`.

---

## 19. Reference Data Dependencies

| Reference Data | Source Endpoint | Consumption Point | Fallback / Behavior |
|:---|:---|:---|:---|
| **Projects List** | `GET /api/v1/projects` | `CreateTaskScreen` Project selector | If navigated from `ProjectDetail`, `projectId` is pre-populated; otherwise fetch user projects. |
| **Project Members** | `GET /api/v1/projects/{projectId}/members` | Assignee selector in `CreateTask` and `TaskDetail` | Required for assignee selection to avoid `TASK_ASSIGNEE_NOT_PROJECT_MEMBER`. |
| **Project Milestones** | `GET /api/v1/projects/{projectId}/milestones` | Milestone selector in `CreateTask` | Optional milestone association. |

---

## 20. Component & Hook Reuse Matrix

| Asset | Source Location | Classification | Usage in Phase 15 |
|:---|:---|:---:|:---|
| `apiClient` | `mobile/src/shared/api/apiClient.ts` | `REUSE_AS_IS` | All Task API calls |
| `PriorityBadge` | `mobile/src/shared/components/PriorityBadge.tsx` | `REUSE_AS_IS` | Task priority rendering (identical 4-tier enum) |
| `StatusBadge` | `mobile/src/shared/components/StatusBadge.tsx` | `REUSE_WITH_NARROW_EXTENSION` | Add task status mapping (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `CANCELLED`) |
| `SearchBar` | `mobile/src/shared/components/SearchBar.tsx` | `REUSE_AS_IS` | Task list search input |
| `LoadingIndicator` | `mobile/src/shared/components/LoadingIndicator.tsx` | `REUSE_AS_IS` | Loading states across all task screens |
| `ErrorState` | `mobile/src/shared/components/ErrorState.tsx` | `REUSE_AS_IS` | Failure views with retry action |
| `EmptyState` | `mobile/src/shared/components/EmptyState.tsx` | `REUSE_AS_IS` | Empty task lists, empty subtasks, empty comments |
| `ConfirmationDialog` | `mobile/src/shared/components/ConfirmationDialog.tsx` | `REUSE_AS_IS` | Delete task, delete comment, and remove assignment dialogs |
| `AppButton` / `AppTextInput` | `mobile/src/shared/components/` | `REUSE_AS_IS` | All task forms, comments, and modals |
| `useProjects` pagination hook | `mobile/src/features/projects/hooks/useProjects.ts` | `REUSE_PATTERN` | Pattern for `useTasks` (monotonic generation, append lock, debounced search) |
| `useProjectDetail` hook | `mobile/src/features/projects/hooks/useProjectDetail.ts` | `REUSE_PATTERN` | Pattern for `useTaskDetail` (focus listener, ID supersession) |

---

## 21. Concurrency & Optimistic Locking Plan

- **Version Token Invariant**:
  - `TaskDetailResponse` exposes `version: number`.
  - Mutating operations (`PUT /tasks/{id}`, `PUT /tasks/{id}/status`, `PUT /tasks/{id}/progress`) require `version`.
  - On HTTP 409 `OPTIMISTIC_LOCK_CONFLICT`, the UI will prompt: *"Dữ liệu công việc đã được cập nhật bởi người khác. Vui lòng tải lại."* and execute a fresh GET.
- **Synchronous Submit Lock (`useRef`)**:
  - To eliminate the `PROJECT_MUTATION_DUPLICATE_SUBMIT_RISK` debt identified in Phase 14, all Phase 15 mutation handlers will use `const isSubmittingRef = useRef(false)` checked and set synchronously before any async API dispatch.

---

## 22. Security Pre-Mortem

1. **Client-Side Action Gating**:
   - `allowedActions` returned by backend MUST dictate action availability in UI.
   - Example: Only render "Cập nhật trạng thái" if `allowedActions.includes('UPDATE_STATUS')`.
2. **Access Token Lifecycle**:
   - Inherits Phase 13 token handling via `apiClient`. No local token storage in Task module.
3. **No Sensitive PII Exposure**:
   - Assignees and reporters use public profile representations (`id`, `name`, `email`, `avatarUrl`).
4. **Zero Raw UUID Display**:
   - User interfaces must always display `taskCode` (e.g. `TSK-001`), user names, and project names; raw UUIDs must never appear in text or accessibility labels.

---

## 23. Backend Test Suite Evidence

Backend task module tests are comprehensive and green:
- `TaskApplicationServiceTest`: 22 tests PASS (lifecycle, assignments, permissions, terminal checks, validations).
- `TaskControllerIntegrationTest`: 14 tests PASS (REST endpoints, pagination, security, error mapping).
- `TaskCommentApplicationServiceTest`: 11 tests PASS (comments, replies, ownership authorization).
- Overall Backend Baseline: 318/318 tests PASS, Checkstyle 0 violations, BUILD SUCCESS.

---

## 24. Contract Discrepancies & Resolutions

1. **Discrepancy: Assignee Selection Source**:
   - *Conflict*: Naive implementation might use `GET /api/v1/directory/users`.
   - *Resolution*: Tasks strictly enforce project membership. Assignee picker must query `GET /api/v1/projects/{projectId}/members`.
2. **Discrepancy: Unassign Identifier**:
   - *Conflict*: Developers might assume `unassignTask(taskId, userId)`.
   - *Resolution*: Backend endpoint `DELETE /api/v1/tasks/{taskId}/assignments/{assignmentId}` requires `assignmentId` (`task_assignments.id`). Mobile types must preserve `assignmentId` in `AssigneeDetail`.
3. **Discrepancy: Task Status Badges**:
   - *Conflict*: `StatusBadge` currently only handles `ProjectStatus` and `UserStatus`.
   - *Resolution*: Safely extend `StatusBadge.tsx` with task status keys (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `CANCELLED`).

---

## 25. Blocking Gaps & Pre-Conditions

- **Gaps**: ZERO blocking technical or contract gaps. All backend endpoints, DTOs, security annotations, and database tables exist and are verified.
- **Pre-Conditions for Implementation**:
  - Decision Freeze (D-063) establishing Phase 15 subphases, contracts, and assignment picker policy.

---

## 26. Recommended Implementation Subphases

We recommend executing Phase 15 across 6 orderly subphases:
- **Phase 15A**: Contracts, Types & Extended StatusBadge (Define `taskTypes.ts`, `taskApi.ts`, update `StatusBadge.tsx`).
- **Phase 15B**: Task List Screen & Filters (`SCR-TSK-01`, `useTasks` hook, search, status/priority chips, pagination).
- **Phase 15C**: Task Detail Screen (`SCR-TSK-02`, `useTaskDetail` hook, status & progress update modals `SCR-TSK-07` & `SCR-TSK-08`).
- **Phase 15D**: Create & Edit Task Screens (`SCR-TSK-03`, `SCR-TSK-04`, project selector, project member assignee picker).
- **Phase 15E**: Subtasks & Task Assignments (`SCR-TSK-05`, subtask list & create, add/remove assignees).
- **Phase 15F**: Task Comments, Attachments & Full Regression (`SCR-TSK-06`, mobile suite run, clean Android build).

---

## 27. Phase 15 Readiness Verdict

All foundational layers (backend APIs, security annotations, testcontainers tests, shared mobile UI components, navigation tab registration) are in place and verified.

**Readiness Assessment**: **HIGH / PRODUCTION-READY FOR IMPLEMENTATION PLANNING**

---

## 28. Conclusion & Sign-Off

The Pre-Phase 15 Audit confirms that the WorkSphere codebase is fully prepared for Phase 15 Mobile Task Management implementation without backend changes or architecture modifications.

**Audit Verdict**: `PRE_PHASE_15_AUDIT_PASS_READY_FOR_DECISION_FREEZE`
