# PHASE 15 MEMORY CHECKPOINT

## Checkpoint

- Repository: `D:\WorkSphere`
- Branch: `main`
- Initial Phase 15 Baseline Checkpoint: `763b877d1b3e7ecde94f288dd64dea902f193b96` (`docs(mobile): record architecture decision D-064 phase 15 task due-date semantics`)
- Final Reconciled Pre-Closure Checkpoint: `eb0c973dfe44fc3a717925a87b8a48f313502575` (`fix(mobile): reconcile phase 15 final audit`)
- Status: Working tree clean, HEAD equal to origin/main.
- Phase 15 Memory State: `CLOSED`.

## Closure Prerequisites

All required Phase 15 closure preconditions are satisfied:
1. Subphases Completed, Audited & Hardened:
   - Phase 15A (Task Contracts & Foundations): CLOSED / VERIFIED
   - Phase 15B (Task List SCR-TSK-01): CLOSED / AUDITED
   - Phase 15C (Task Detail SCR-TSK-02): CLOSED / AUDITED
   - Phase 15D (Create & Edit Task SCR-TSK-03/04): CLOSED / HARDENED / D-064 VERIFIED
   - Phase 15E (Task Status, Progress, Assign SCR-TSK-07/08): CLOSED / AUDITED
   - Phase 15F (Subtasks & Comments SCR-TSK-05/06): CLOSED / AUDITED / HARDENED
   - Phase 15G (Integration, Regression & Security Hardening): IMPLEMENTED / VALIDATED
2. Final Independent Audit: `PHASE_15_FINAL_AUDIT_PASS_WITH_E2E_DEFERRALS`
3. Final Reconciliation: `PHASE_15_RECONCILIATION_PASS_READY_FOR_MEMORY_CHECKPOINT`
4. Blocking Findings Count:
   - CRITICAL: 0
   - HIGH: 0
   - MEDIUM: 0
   - LOW: 0 remaining (1 finding `COMMENT_ADMIN_ROLE_ALIAS_DRIFT` verified resolved during final reconciliation)

## Delivered Scope Inventory

Phase 15 delivered complete Mobile Task Management functionality across 8 screens and modal flows:
- `SCR-TSK-01`: Task List Screen (`TasksScreen.tsx`)
- `SCR-TSK-02`: Task Detail Screen (`TaskDetailScreen.tsx`)
- `SCR-TSK-03`: Create Task Screen (`CreateTaskScreen.tsx`)
- `SCR-TSK-04`: Edit Task Screen (`EditTaskScreen.tsx`)
- `SCR-TSK-05`: Subtask List Screen & Creation Modal (`SubtaskListScreen.tsx`, `CreateSubtaskModal.tsx`)
- `SCR-TSK-06`: Task Comments Screen (`TaskCommentsScreen.tsx`)
- `SCR-TSK-07`: Change Task Status Modal (`ChangeTaskStatusModal.tsx`)
- `SCR-TSK-08`: Update Task Progress Modal (`UpdateTaskProgressModal.tsx`)
- Existing-Task Assignment Management: Assign Task Modal (`AssignTaskModal.tsx`) and Unassign confirmation flow (`ConfirmationDialog`)

Zero Service Request screens and zero Asset Management screens were implemented. Task file attachments and uploads were strictly excluded per Decision `D-063` (deferred to File Management module). Task deletion was deferred per roadmap.

## Navigation & Screen Map Integration

- Five-Tab Invariant Preserved: Bottom navigation retains exactly 5 visible tabs (`Dashboard`, `Projects`, `Tasks`, `ServiceRequests`, `More`).
- Auxiliary Hidden Routes: Registered in `mobile/src/app/navigation/MainTabNavigator.tsx` with `tabBarButton: () => null` and `headerShown: false`:
  - `TaskDetail: { taskId: string }`
  - `CreateTask: { projectId?: string }`
  - `EditTask: { taskId: string }`
  - `SubtaskList: { parentTaskId: string }`
  - `TaskComments: { taskId: string }`
- Route Data Minimization: Strictly IDs only (`taskId`, `projectId`, `parentTaskId`). Zero permissions, tokens, `allowedActions`, or optimistic version numbers travel via route parameters. Screens fetch authoritative server state on demand.

## Task List Architecture (`SCR-TSK-01`)

- Data Hook: `useTasks.ts` managing paginated task listing querying `GET /api/v1/tasks`.
- Search & Filtering: 300ms search input debouncing, canonical status chips (`ALL`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`), canonical priority chips (`ALL`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- Presentation Component: `TaskCard.tsx` rendering project badge, task title, priority and status badges, clamped progress bar with percentage, formatted due date with overdue highlighting, assignee count/names, and subtask/comment counts.
- Concurrency & Concurrency Protection: Monotonic query generation identity (`queryGenerationRef`) ensuring latest-query-wins concurrency, synchronous append lock (`paginationLockRef`), stale append rejection, in-place deduplication by `task.id`, and pull-to-refresh.
- Navigation Wiring: Tapping `TaskCard` navigates to `TaskDetail` with `{ taskId }`. `+ Tạo mới` button gated by `currentUser.permissions.includes('TASK_CREATE')` navigates to `CreateTask`.

## Task Detail Architecture (`SCR-TSK-02`)

- Data Hook: `useTaskDetail.ts` managing single task query lifecycle (`GET /api/v1/tasks/{taskId}`) with in-flight same-ID deduplication (`inFlightPromiseRef`), monotonic generation supersession (`generationRef`), non-destructive pull-to-refresh data retention with separate `refreshError`, and unmount safety (`isMountedRef`).
- Focus Lifecycle Freshness: Integrated focus listener (`navigation.addListener('focus')`) with initial-mount guard (`isFirstMountRef`), keeping task details fresh on return from edit or child flows without unnecessary duplicate initial fetches.
- Presentation & Hierarchy: Project breadcrumb, task title, priority badge, status badge, clamped progress bar, formatted dates (start date, due date with overdue warning, completed date), description, hierarchy parent task and milestone, reporter and assignees list, read-only subtask and comment summaries, chronological status history timeline.
- Error States: Accessible and user-friendly error views for 404 Not Found, 403 Forbidden, and retryable network errors.
- Authoritative Action Gating:
  - `UPDATE` in `allowedActions` -> "Chỉnh sửa" button navigates to `EditTask`.
  - `UPDATE_STATUS` in `allowedActions` -> "Đổi trạng thái" button opens `ChangeTaskStatusModal`.
  - `UPDATE_PROGRESS` in `allowedActions` -> "Cập nhật tiến độ" button opens `UpdateTaskProgressModal`.
  - `ASSIGN` in `allowedActions` -> "+ Phân công" button opens `AssignTaskModal`.
  - `UNASSIGN` in `allowedActions` -> "Gỡ" button triggers confirmation dialog and unassign flow.
  - Subtask navigation button -> navigates to `SubtaskList`.
  - Comment navigation button -> navigates to `TaskComments`.
- Continuous Version Chaining: `applyTaskUpdate` immediately commits returned `TaskDetail` (advancing optimistic version: `v1 -> v2 -> v3...`) and invalidates in-flight GETs to eliminate stale overwrite races. Tested and verified in Test 15 of `TaskDetailScreen.test.tsx`.

## Create & Edit Task Flows (`SCR-TSK-03` & `SCR-TSK-04`)

- Create Task (`SCR-TSK-03`):
  - Direct Route Authorization: Enforces `currentUser.permissions.includes('TASK_CREATE') === true` on screen mount with accessible unauthorized view.
  - Project Selection: `ProjectSelectModal.tsx` displaying human-readable `[CODE] Name`.
  - Assignee Selection: `ProjectMemberAssigneePickerModal.tsx` querying exclusively `GET /api/v1/projects/{projectId}/members?active=true` (strictly zero calls to `/directory/users`).
  - Due Date Serialization: Pure date validation (`isValidCalendarDate`), serializing calendar date `YYYY-MM-DD` to `${YYYY-MM-DD}T17:00:00Z` per Decision `D-064`.
  - Concurrency Lock: Synchronous `submittingRef` lock preventing double-tap duplicate submissions.
- Edit Task (`SCR-TSK-04`):
  - Authoritative Prefill: Loaded from `GET /api/v1/tasks/{taskId}`; immutable project and task code.
  - Optimistic Locking: Internal `version` tracking; HTTP 409 conflict dialog prompts "Tải lại dữ liệu" to reload authoritative server state.
  - D-064 Server Instant Round-Trip Preservation: `PRESERVE_EXACT_SERVER_INSTANT_WHEN_DATE_UNCHANGED` tracks `originalDueDateInstant`. If user leaves date untouched (or reverts back to original date), the raw server Instant string is preserved byte-for-byte; if changed, serializes to `${newDate}T17:00:00Z`; if cleared, passes `undefined`.
  - Concurrency Lock: Synchronous `submittingRef` lock preventing double-tap duplicate submissions.

## Task Mutations & State Machine (`SCR-TSK-07`, `SCR-TSK-08`, Assign/Unassign)

- Task Status Update Modal (`SCR-TSK-07`):
  - Backed by pure domain state machine (`taskStatusTransitions.ts`) strictly matching backend `Task.java`:
    - `TODO -> IN_PROGRESS, CANCELLED`
    - `IN_PROGRESS -> IN_REVIEW, ON_HOLD, CANCELLED`
    - `IN_REVIEW -> IN_PROGRESS, COMPLETED`
    - `ON_HOLD -> IN_PROGRESS, CANCELLED`
    - Terminal states `COMPLETED` and `CANCELLED` permit no further transitions.
  - Mandatory Rejection Comment: Transition from `IN_REVIEW -> IN_PROGRESS` strictly enforces a non-empty rejection comment before submission is allowed.
  - Optimistic Locking: Sends `{ status, reason, version }`; on 409 conflict, prompts reload.
  - Concurrency Lock: Synchronous `submittingRef` lock.
- Task Progress Update Modal (`SCR-TSK-08`):
  - Decimal progress support (`0.0..100.0`) with quick preset buttons (`0%`, `25%`, `50%`, `75%`, `100%`).
  - Validation: Numbers outside `0.0..100.0` or invalid formats rejected.
  - State Decoupling: Progress=100 alone does not mark the task completed; completion strictly requires explicit status transition to `COMPLETED` via backend authority.
  - Optimistic Locking: Sends `{ progress, version }`; on 409 conflict, prompts reload.
  - Concurrency Lock: Synchronous `submittingRef` lock.
- Existing-Task Assignment:
  - Dispatches `POST /api/v1/tasks/{taskId}/assignments` with payload `{ assigneeIds: [userId] }` where `userId` is the `ProjectMember.userId` (User UUID).
  - Queries candidates via `projectApi.listMembers(projectId, { active: true })`; disables already-assigned members.
  - Concurrency Lock: Synchronous `submittingRef` lock.
- Existing-Task Unassign:
  - Dispatches `DELETE /api/v1/tasks/{taskId}/assignments/{assignmentId}` where `assignmentId` is the `AssigneeDetail.assignmentId` (TaskAssignment UUID, NOT User UUID).
  - Confirmation dialog protects against accidental removal.
  - Concurrency Lock: Synchronous `unassigningRef` lock.

## Subtasks & Comments Architecture (`SCR-TSK-05` & `SCR-TSK-06`)

- Subtask List Screen (`SCR-TSK-05`):
  - Breadcrumb, parent task context, child tasks `FlatList` using `TaskCard`, navigation to child `TaskDetail`, empty state, pull-to-refresh.
  - Authoritative Capability Gating: Uses `useTaskDetail(parentTaskId)` to gate `+ Tạo công việc phụ` by `CREATE_SUBTASK` in `allowedActions`.
  - Subtask Creation Modal (`CreateSubtaskModal.tsx`): Gated by parent task capability, project-member assignee picker, D-064 due-date serialization, synchronous `submittingRef` lock.
  - Concurrency & Freshness: Monotonic query generation increment on mutations in `useSubtasks.ts` eliminating `TASK_SUBTASK_MUTATION_STALE_OVERWRITE`. Request promise ownership prevents aborted fetches from clearing newer fetch pointers.
- Task Comments Screen (`SCR-TSK-06`):
  - Paginated comments list, author attribution, formatted timestamps, `(đã chỉnh sửa)` indicators.
  - Authoritative Capability Gating: Uses `useTaskDetail(taskId)` to gate comment creation by `ADD_COMMENT` in `allowedActions`.
  - Bottom Input Bar: Add comment input gated with synchronous `addingRef` lock.
  - Action Permissions: Edit comment restricted to comment author or system admin (`isAuthor || isSystemAdmin`). Delete comment gated to comment author or system admin via `ConfirmationDialog`.
  - Strict Canonical Role: System Admin check strictly enforces canonical backend role code `'ADMIN'`. Unsupported `ROLE_ADMIN` alias completely eliminated.
  - Concurrency & Freshness: Monotonic query generation increment on mutations in `useTaskComments.ts` eliminating `TASK_COMMENT_MUTATION_STALE_OVERWRITE`. Request promise ownership prevents aborted fetches from clearing newer fetch pointers.

## Assignment & Identity Architecture

Phase 15 strictly isolates and respects the three distinct entity identities defined by the backend Task and Project modules:
1. `ProjectMember.userId`: User UUID from active project membership (`GET /projects/{id}/members?active=true`). Used in `assigneeIds` payload when assigning a task (`POST /tasks/{id}/assignments`).
2. `AssigneeDetail.id`: User UUID embedded in the Task Detail assignee projection (`id`, `name`, `username`, `email`, `avatarUrl`, `assignedAt`). Used for user display and existing assignee matching.
3. `AssigneeDetail.assignmentId`: TaskAssignment UUID representing the specific assignment relationship. Used exclusively in the path parameter for unassigning a task (`DELETE /tasks/{id}/assignments/{assignmentId}`).

Under no circumstances is `AssigneeDetail.id` (User UUID) sent to the unassign endpoint.

## Architectural Decisions Frozen

The following canonical architectural decisions governed Phase 15:
- `D-063`: Phase 15 Task Management Mobile Contract Freeze
  - Assignee candidate source: active project members only (`GET /projects/{id}/members?active=true`), never company directory.
  - Distinct identities: `ProjectMember.userId` for assign; `AssigneeDetail.assignmentId` for unassign.
  - Allowed actions: Server authoritative; unknown actions fail closed.
  - Route parameters: IDs only.
  - Concurrency: Synchronous `useRef` locks on all 10 mutation flows.
  - Exclusions: Task file attachments excluded (deferred to File module); Task deletion deferred per roadmap.
- `D-064`: Phase 15 Task Due-Date Semantics
  - Calendar date `YYYY-MM-DD` serializes to `${YYYY-MM-DD}T17:00:00Z` (24:00:00 UTC+7 next-day exclusive boundary).
  - Unchanged date on edit preserves exact raw server Instant (`originalDueDateInstant`).
  - Reverting to original date restores raw server Instant.
  - Zero `23:59:59Z` in codebase.

Both decisions remain fully authoritative and binding.

## Validation Baseline Evidence

All validation evidence is frozen from final reconciliation and test execution:
- Mobile Test Suite: 82 test suites, 736 tests PASS (0 failures, 0 skipped, 0 snapshots).
- TypeScript: `tsc --noEmit` PASS (0 errors).
- ESLint: `eslint .` PASS (0 errors, 48 pre-existing warnings in 14E screens).
- Backend Targeted Task Regression: 47 tests PASS across `TaskTest`, `TaskWorkflowTest`, `TaskMockMvcTest`, `TaskAttachmentMockMvcTest` with Checkstyle 0 violations and `BUILD SUCCESS`.
- Android Native Build: `gradlew.bat clean assembleDebug` -> `BUILD SUCCESSFUL` (213 actionable tasks).
- Android APK Artifact: `mobile/android/app/build/outputs/apk/debug/app-debug.apk` confirmed present (157,662,829 bytes).
- Android Smoke: Verified on `emulator-5554` (`MainActivity` focused window, PID confirmed, 0 crashes, `PRE_AUTH_ANDROID_SMOKE_PASS`).
- Test Filters: Zero `.only` or `.skip` test filters across all test files.

## Security Posture

- Session Integration: All network requests use `apiClient.ts` with automatic Bearer token injection and single-flight refresh coordination. Phase 15 features contain zero custom token storage or manual 401 handling.
- Data Persistence & Logout: Zero persistent storage of task data in `AsyncStorage` or `Keychain`. All state unmounts and is cleanly destroyed upon logout.
- Internal Identifiers: Zero raw UUIDs or version numbers rendered in user-visible text or accessibility labels.
- Role Enforcement: Strict canonical backend role code `'ADMIN'` enforced. Synthetic `ROLE_ADMIN` fallback eliminated from `TaskCommentsScreen.tsx`.
- Error Sanitization: Server errors mapped to friendly Vietnamese messages; zero raw Axios errors, stack traces, or SQL messages exposed. `traceId` preserved safely when provided.

## Concurrency & Race Hazard Hardening

- Synchronous Ref Locks: Implemented and verified across all 10 Phase 15 mutation flows:
  1. `CreateTaskScreen`: `submittingRef`
  2. `EditTaskScreen`: `submittingRef`
  3. `ChangeTaskStatusModal`: `submittingRef`
  4. `UpdateTaskProgressModal`: `submittingRef`
  5. `AssignTaskModal`: `submittingRef`
  6. `TaskDetailScreen` unassign: `unassigningRef`
  7. `CreateSubtaskModal`: `submittingRef`
  8. `TaskCommentsScreen` add comment: `addingRef`
  9. `TaskCommentsScreen` edit comment: `editingRef`
  10. `TaskCommentsScreen` delete comment: `deletingRef`
- Generation Supersession: `useSubtasks` and `useTaskComments` increment monotonic query generation on mutations, preventing late-arriving responses from overwriting optimistic or mutated state.
- Continuous Version Propagation: `useTaskDetail.applyTaskUpdate` immediately commits returned `TaskDetail` and invalidates in-flight GETs, allowing successive mutations in a single mounted session without stale version conflicts.

## Resolved Audit Debt

- `COMMENT_ADMIN_ROLE_ALIAS_DRIFT`:
  - Identified during Phase 15 Final Independent Audit as LOW debt.
  - Root Cause: Fallback `currentUser?.roles?.includes('ROLE_ADMIN')` in `TaskCommentsScreen.tsx`. Backend canonical role code is `'ADMIN'`.
  - Resolution: Removed `ROLE_ADMIN` from `isSystemAdmin` check. Aligned strictly with canonical backend role code `'ADMIN'`. Added regression test in `TaskCommentsScreen.test.tsx` verifying synthetic `ROLE_ADMIN` identity cannot edit/delete comments.
  - Status: `RESOLVED_DURING_FINAL_RECONCILIATION`.
  - Remaining Phase 15-specific debt: 0.

## Accepted Pre-Existing Debt

1. `PHASE_14E_LINT_WARNING_DEBT`:
   - 48 warnings for `react-native/no-inline-styles` in mobile code (47 from 14E screens/modals, 1 pre-existing in 14C; exit code 0, 0 errors).
   - Classified as low-priority non-functional debt; preserved without broad styling refactoring to prevent visual regression.
2. `PROJECT_MUTATION_DUPLICATE_SUBMIT_RISK`:
   - 7 project mutation flows use React state-only submit guards rather than synchronous `useRef` locks.
   - Low practical risk due to React Native gesture responder touch serialization; backend remains authoritative. Deferred as candidate future hardening item.
   - Note: All 10 Task mutation flows in Phase 15 strictly implement synchronous `useRef` locks.

## Carried E2E Deferrals

1. `PHASE_15_AUTH_E2E_CREDENTIALS_NOT_AVAILABLE_SAFE_SKIP`: Authenticated live device E2E skipped due to missing environment test credentials (`WORKSPHERE_DEV_E2E_USER_ENABLED`, `WORKSPHERE_E2E_LOGIN`, `WORKSPHERE_E2E_PASSWORD`).
2. `PHASE_15_MUTATION_E2E_DEFERRED`: Automated mutation E2E deferred until isolated disposable test fixture provisioning exists to avoid dirtying development database.
3. `PHASE_15_OFFLINE_DEVICE_E2E_DEFERRED`: Device-level network disconnection simulation deferred; offline and timeout behaviors are verified by Jest network interceptor test suites.

## Toolchain Debt

Carried forward as pre-existing environmental debt (not Phase 15 feature defects):
- `PRE_EXISTING_TOOLCHAIN_DEBT_GRADLE`: AGP deprecation notices (`android.builtInKotlin=false`, `android.newDsl=false`, `applicationVariants`).
- `PRE_EXISTING_TOOLCHAIN_DEBT_KSP`: Compiler notice `ksp-2.2.0-2.0.2 is too old for kotlin-2.2.10`.
- `PRE_EXISTING_TOOLCHAIN_DEBT_NPM`: 55 vulnerabilities reported in dev/build dependencies (zero `npm audit fix` executed).

## Explicitly Excluded & Deferred Features

- Task Attachments & Upload: Excluded by Decision `D-063`, deferred to File Management module.
- Task Delete: Deferred per roadmap (`docs/08_DEVELOPMENT_ROADMAP.md`).
- Service Requests: Roadmap Section 19 (`Phase 16`).
- Asset Management: Roadmap Section 19 (`Phase 16`).

## Phase 16 Boundary & Resume Rules

- Scope Separation:
  - Phase 15 (Mobile Task Management: `SCR-TSK-01` .. `SCR-TSK-08`): CLOSED.
  - Phase 16 (Mobile Service Requests: `SCR-SR-01` .. `SCR-SR-07` per canonical roadmap `docs/08_DEVELOPMENT_ROADMAP.md` Section 19, P0): NOT STARTED.
- Strictly Forbidden in this Checkpoint:
  - Implementing Service Request screens (`SCR-SR-01` to `SCR-SR-07`).
  - Implementing Asset screens or endpoints.
  - Modifying backend code, database schema, or dependencies.
  - Starting Pre-Phase 16 audit in this session.
- Next Permitted Action: `PRE-PHASE 16 AUDIT` (or `POST-PHASE-15 / PHASE-16 PRE-IMPLEMENTATION AUDIT`).

## Final State

- Phase 15: CLOSED.
- Milestone: `IMPLEMENTATION_COMPLETE`, `FINAL_AUDIT_PASS_WITH_E2E_DEFERRALS`, `FINAL_RECONCILIATION_COMPLETE`, `MEMORY_CHECKPOINT_CLOSED`.
- Memory Checkpoint: FROZEN.

## Conclusion

PHASE_15_MEMORY_CHECKPOINT_CLOSED
