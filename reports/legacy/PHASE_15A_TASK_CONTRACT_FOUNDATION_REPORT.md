# Phase 15A Task Contract Foundation Report

## 1. Checkpoint Verification

- **Repository**: `D:\WorkSphere`
- **Branch**: `main`
- **Verified Commit**: `8e25684b97264ce96bd4421d652ff150d36a1f60`
- **Prerequisites Satisfied**:
  - `PHASE_14_MEMORY_CHECKPOINT_CLOSED`
  - `PRE_PHASE_15_AUDIT_PASS_READY_FOR_DECISION_FREEZE`
  - `PHASE_15_CONTRACT_FREEZE_PASS_READY_FOR_15A`
  - `D-063 Phase 15 Task Management Mobile Contract Freeze`
- **Subphase 15A Purpose**: Implement transport contracts, runtime type guards, API adapter, presentation error mapping, navigation typing, and narrow StatusBadge presentation support for Phase 15 Mobile Task Management.

---

## 2. Frozen Source Parity

Mobile contracts were implemented strictly against backend production source:
- `backend/src/main/java/com/worksphere/task/web/TaskController.java`
- `backend/src/main/java/com/worksphere/task/application/TaskApplicationService.java`
- `backend/src/main/java/com/worksphere/task/application/TaskCommentApplicationService.java`
- `backend/src/main/java/com/worksphere/task/domain/Task.java`
- `backend/src/main/java/com/worksphere/task/domain/TaskStatus.java`
- `backend/src/main/java/com/worksphere/task/domain/TaskPriority.java`
- `backend/src/main/java/com/worksphere/task/domain/TaskAssignment.java`
- All Task request and response DTO records.

---

## 3. Project Member Endpoint Query Reconciliation

- Source verification on `backend/src/main/java/com/worksphere/project/web/ProjectController.java` (`GET /{projectId}/members`):
  - Parameters: `@RequestParam(required = false) Boolean active` and `@RequestParam(required = false) ProjectRole role` are actively supported by the backend controller.
  - Return: `ProjectMemberResponse` exposes `boolean active`.
  - Conclusion: Querying with `active=true` is valid in the backend. In addition, client-side guards will filter `member.active === true` to ensure zero inactive members are selected as task assignees.

---

## 4. DTOs & Transport Contracts

Implemented in `mobile/src/features/tasks/api/taskTypes.ts`:
- `TaskSummary`: Matches `TaskSummaryResponse` with project brief, assignees summary, reporter summary, subtask counts, comment counts, and overdue status.
- `TaskDetail`: Matches `TaskDetailResponse` with project, reporter, assignees (with `assignmentId`), status history, and `version: number`.
- `TaskComment`: Matches `TaskCommentResponse` with `author`, `content`, `parentId`, `isEdited`, and timestamps.
- Runtime guards: `isTaskSummary`, `isTaskDetail`, `isTaskComment`, `isTaskSummaryPage`, `isTaskCommentPage`.

---

## 5. Enums & Closed Unions

- `TaskStatus`: Closed TypeScript union `'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'`.
  - Validated by `isTaskStatus(value: unknown): value is TaskStatus`.
- `TaskPriority`: Closed TypeScript union `'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'`.
  - Validated by `isTaskPriority(value: unknown): value is TaskPriority`.
- Zero arbitrary string types used for domain enums.

---

## 6. Allowed Actions Transport Policy

- Known actions: `KNOWN_TASK_ACTIONS = ['ADD_COMMENT', 'UPDATE', 'UPDATE_PROGRESS', 'UPDATE_STATUS', 'ASSIGN', 'UNASSIGN', 'CREATE_SUBTASK', 'DELETE'] as const`.
- Forward-compatible model: In `TaskDetail`, `allowedActions: string[]` accepts unknown future actions without rejecting the response.
- Helper `isKnownTaskAction(action: string)` identifies supported client capabilities.

---

## 7. Assignment Identity Invariant

- `AssigneeSummary.id`: User account UUID.
- `AssigneeDetail.id`: User account UUID.
- `AssigneeDetail.assignmentId`: Join entity UUID (`task_assignments.id`).
- Tests in `taskTypes.test.ts` and `taskApi.test.ts` verify that `assignmentId != userId` and that unassigning passes `assignmentId` in the URL path.

---

## 8. Request DTOs

Implemented with exact backend parity:
- `CreateTaskRequest`: `projectId`, `title`, `priority` required; optional parent, milestone, assignees, dates, estimatedMinutes.
- `UpdateTaskRequest`: `version` required (optimistic locking); mutable title, description, priority, dates, estimatedMinutes.
- `ChangeTaskStatusRequest`: `status` and `version` required; optional comment.
- `UpdateTaskProgressRequest`: `progressPercent` (0–100%) and `version` required.
- `AssignTaskRequest`: `assigneeIds: string[]`.
- `CreateSubtaskRequest`: `title`, `priority`; optional assignees, dates, estimatedMinutes.
- `CreateTaskCommentRequest`: `content`, optional `parentCommentId`.
- `UpdateTaskCommentRequest`: `content`.

---

## 9. Task Query Serialization

- Function: `serializeTaskListQuery(query?: TaskListQuery)`
- Behavior:
  - Trims search; omits blank/whitespace search strings.
  - Whitelists sort against `TASK_SORT_PROPERTIES` (`createdAt`, `dueDate`, `priority`, `status`, `title`). Discards unauthorized sort fields without using unsafe `as any`.
  - Omits undefined/empty filter parameters.

---

## 10. API Adapter (`taskApi`)

Implemented in `mobile/src/features/tasks/api/taskApi.ts`:
- All 15 endpoints mapped and tested.
- All URL path IDs safely URI-encoded (`encodeURIComponent`).
- Standard `http` client unwrap with runtime type guard validation on responses.

---

## 11. Delete Behavior & HTTP Semantics

Verified against controller sources:
- `deleteTask`: `DELETE /tasks/{taskId}` $\rightarrow$ HTTP 200 OK with `ApiResponse.successNoContent`. Returns `void`.
- `unassignUser`: `DELETE /tasks/{taskId}/assignments/{assignmentId}` $\rightarrow$ HTTP 200 OK with `ApiResponse<TaskDetailResponse>`. Returns `TaskDetail`.
- `deleteComment`: `DELETE /tasks/{taskId}/comments/{commentId}` $\rightarrow$ HTTP 200 OK with `ApiResponse.successNoContent`. Returns `void`.

---

## 12. Safe Presentation Error Mapping

Implemented in `mobile/src/features/tasks/errors/taskErrorMapper.ts`:
- Maps backend error codes (`TASK_NOT_FOUND`, `TASK_TERMINAL_STATE`, `TASK_INVALID_STATUS_TRANSITION`, `TASK_CANNOT_DELETE_HAS_HISTORY`, `TASK_PROJECT_NOT_ACTIVE`, `TASK_PARENT_CYCLE_DETECTED`, `TASK_PARENT_PROJECT_MISMATCH`, `TASK_ASSIGNEE_NOT_PROJECT_MEMBER`, `TASK_ALREADY_ASSIGNED`, `TASK_INVALID_PROGRESS`, `TASK_DATE_RANGE_INVALID`, `ASSIGNMENT_NOT_FOUND`, `OPTIMISTIC_LOCK_CONFLICT`, `FORBIDDEN`, `VALIDATION_ERROR`).
- Distinguishable conflict: `isConflict: true` allows UI screens to trigger data reload without regex parsing Vietnamese messages.
- Security: Raw SQL (e.g. `PSQLException`), internal stack traces, and database table names are suppressed.

---

## 13. StatusBadge Extension

- Narrowly extended `mobile/src/shared/components/StatusBadge.tsx`:
  - Added `TODO` (`bg: surfaceVariant`, `text: textSecondary`) and `IN_REVIEW` (`bg: warningContainer`, `text: warning`) color mappings.
  - Added `type?: StatusCategory` handling so `type="task"` renders task-specific labels (`TODO` $\rightarrow$ `'Cần làm'`, `IN_REVIEW` $\rightarrow$ `'Đang kiểm tra'`), while generic dashboard badges avoid conflicting with `DashboardScreen` metric labels.
  - All 15 StatusBadge and Dashboard tests PASS cleanly.

---

## 14. Navigation Types

Added type contracts to `MainTabParamList` in `mobile/src/app/navigation/types.ts`:
- `TaskDetail: { taskId: string }`
- `CreateTask: { projectId?: string; parentTaskId?: string } | undefined`
- `EditTask: { taskId: string }`
- `SubtaskList: { parentTaskId: string; projectId: string }`
- `TaskComments: { taskId: string }`
- Invariant: Zero placeholder screens or broken runtime routes were registered.

---

## 15. Type Safety & Strict Verification

- Zero `any` keyword in new production code.
- Zero `as any` casts.
- Zero `@ts-ignore` or `@ts-expect-error`.
- Zero `eslint-disable`.
- All unknown network responses narrowed via runtime type guards.

---

## 16. Test Suite Evidence

- `taskTypes.test.ts`: 15 tests PASS.
- `taskApi.test.ts`: 17 tests PASS.
- `taskErrorMapper.test.ts`: 16 tests PASS.
- `StatusBadge.test.tsx`: 6 tests PASS (+1 new test).
- Mobile Baseline: **64 test suites, 579 tests PASS** (100% passing, 0 failures, 0 skipped, 0 snapshots).
- TypeScript: `tsc --noEmit` PASS (0 errors).
- ESLint: `eslint .` PASS (0 errors, 48 pre-existing warnings in 14E screens).

---

## 17. Android Native Build Verification

- Command: `.\gradlew.bat assembleDebug --no-daemon`
- Configuration: `JAVA_HOME=D:\Android\jbr`, `ANDROID_HOME=D:\AndroidSDK`
- Result: **BUILD SUCCESSFUL in 46s** (203 actionable tasks: 16 executed, 187 up-to-date, exit code 0).

---

## 18. Security Verification

- Zero sensitive token/password logging.
- Zero AsyncStorage caching of authenticated task payloads.
- Strict isolation of project assignees from global directory.
- Zero changes to backend code or database migrations.
- Zero new dependencies added.

---

## 19. Scope Boundary Compliance

- Only files within authorized 15A scope were created or modified.
- No Task screens, hooks, components, or runtime navigation changes were introduced.

---

## 20. Files Created & Modified

### Created:
- `mobile/src/features/tasks/api/taskTypes.ts`
- `mobile/src/features/tasks/api/taskApi.ts`
- `mobile/src/features/tasks/api/index.ts`
- `mobile/src/features/tasks/errors/taskErrorMapper.ts`
- `mobile/src/features/tasks/errors/index.ts`
- `mobile/src/features/tasks/index.ts`
- `mobile/__tests__/tasks/taskTypes.test.ts`
- `mobile/__tests__/tasks/taskApi.test.ts`
- `mobile/__tests__/tasks/taskErrorMapper.test.ts`
- `reports/PHASE_15A_TASK_CONTRACT_FOUNDATION_REPORT.md`

### Modified:
- `mobile/src/app/navigation/types.ts`
- `mobile/src/shared/components/StatusBadge.tsx`
- `mobile/__tests__/components/StatusBadge.test.tsx`
- `reports/PROJECT_STATE.md`
- `reports/HANDOFF.md`

---

## 21. Subphase 15B Boundary

- Subphase 15A is complete.
- Subphase 15B (`SCR-TSK-01 TaskListScreen`, `useTasks` data hook, search, filter chips, pagination) is NOT STARTED.

---

## 22. Conclusion

All 15A requirements, type guards, API adapters, error mappers, unit tests, and native Android build checks are verified and passing.

**Verdict**: `PHASE_15A_PASS_PUSHED`
