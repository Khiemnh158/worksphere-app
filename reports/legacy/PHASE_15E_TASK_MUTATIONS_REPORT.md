# WorkSphere Phase 15E Implementation Report: Task Status, Progress & Assignments

## 1. EXECUTIVE_SUMMARY

Phase 15E implements interactive task lifecycle actions on Mobile for Task Detail (`SCR-TSK-02`), including:
1. **Change Status Modal (`SCR-TSK-07`)**: Implemented pure domain transition machine with valid target statuses, terminal status safeguards, mandatory rejection comment enforcement for `IN_REVIEW -> IN_PROGRESS`, and version-backed status mutation.
2. **Update Progress Modal (`SCR-TSK-08`)**: Implemented percentage progress update with full decimal support (`0.0` to `100.0`), quick presets (`0%`, `25%`, `50%`, `75%`, `100%`), and version-backed progress mutation.
3. **Existing Task Assign Action**: Implemented assignee addition through project-member candidate selection (`projectApi.listMembers(projectId, { active: true })`, strictly zero `directoryApi` calls), disabling already-assigned members, and dispatching `assigneeIds: [userId]` (User UUID, never Membership record UUID or Assignment UUID).
4. **Existing Task Unassign Action**: Implemented assignee removal gated by accessible `ConfirmationDialog`, dispatching `DELETE /tasks/{taskId}/assignments/{assignmentId}` with `assignmentId` (TaskAssignment UUID, never User UUID).
5. **Gating & Concurrency Protections**: Strict gating by authoritative backend `TaskDetail.allowedActions` (`UPDATE_STATUS`, `UPDATE_PROGRESS`, `ASSIGN`, `UNASSIGN`); synchronous `useRef` locks preventing duplicate in-flight mutations; optimistic locking HTTP 409 conflict reload dialog; and `useTaskDetail.applyTaskUpdate` updating state immediately with the mutation response while invalidating slower in-flight GETs to eliminate `TASK_DETAIL_MUTATION_STALE_OVERWRITE` race hazards.

## 2. BASELINE_AND_TARGET_CHECKPOINTS

- **Baseline Checkpoint**: `fbc771fe5bf704828df3b83d14f5820b9a46afb5` (`fix(mobile): implement D-064 task due-date semantics in 15D`)
- **Baseline Test Suite**: 75 test suites, 665 passing tests.
- **Phase 15E Test Suite**: 78 test suites (+3 new suites), 692 passing tests (+27 new tests). 0 failures, 0 skipped.
- **Target Branch**: `main` (clean working tree).

## 3. CANONICAL_ALIGNMENT

Aligned strictly with:
- `01_PROJECT_SCOPE.md`: Task operations and team collaboration workflows.
- `02_USER_ROLES_AND_WORKFLOWS.md`: Task status progression, QA review and rejection workflows.
- `03_MOBILE_SCREEN_MAP.md`: `SCR-TSK-02` (Task Detail), `SCR-TSK-07` (Change Task Status Modal), `SCR-TSK-08` (Update Task Progress Modal).
- `04_SYSTEM_ARCHITECTURE.md`: Mobile React Native modular monolith architecture and optimistic concurrency control.
- `06_API_CONTRACT.md` Section 12:
  - `12.5 Thay đổi trạng thái task` (`PATCH /tasks/{id}/status`)
  - `12.6 Cập nhật tiến độ task` (`PATCH /tasks/{id}/progress`)
  - `12.7 Gán nhân sự cho task` (`POST /tasks/{id}/assignments`)
  - `12.8 Gỡ nhân sự khỏi task` (`DELETE /tasks/{id}/assignments/{assignmentId}`)
- `09_CODING_STANDARDS.md`: Synchronous useRef locks, touch targets $\ge 48\text{dp}$, accessibility labels, zero raw UUID exposure, zero console.log.
- Architecture Decisions:
  - `D-063: Phase 15 Task Contract Freeze`
  - `D-064: Phase 15 Task Due-Date Semantics`

## 4. DELIVERED_COMPONENTS_AND_HOOKS

1. `mobile/src/features/tasks/domain/taskStatusTransitions.ts` (CREATED):
   - Pure domain state machine defining valid transitions, terminal status detection, label formatting, and rejection comment predicate.
2. `mobile/src/features/tasks/components/ChangeStatusModal.tsx` (CREATED):
   - Accessible modal implementing `SCR-TSK-07`. Only lists valid transitions from domain machine, validates mandatory rejection comment, locks submission synchronously.
3. `mobile/src/features/tasks/components/UpdateProgressModal.tsx` (CREATED):
   - Accessible modal implementing `SCR-TSK-08`. Validates numeric float inputs (`0..100`), quick preset shortcuts, locks submission synchronously.
4. `mobile/src/features/tasks/components/ProjectMemberAssigneePickerModal.tsx` (MODIFIED):
   - Added support for `disabledUserIds?: string[]`. Marks existing assignees as disabled with "(Đã phân công)" label and excludes them from candidate toggling and confirmed payloads. Resilient pagination and array extraction (`items` or `content`).
5. `mobile/src/features/tasks/hooks/useTaskDetail.ts` (MODIFIED):
   - Added `applyTaskUpdate(updated: TaskDetail)`: immediately commits authoritative returned state, advances `requestGenerationRef.current++`, and clears `inFlightPromiseRef.current` to prevent stale GET overwrites.
6. `mobile/src/features/tasks/screens/TaskDetailScreen.tsx` (MODIFIED):
   - Wired status, progress, assign, and unassign mutations with authoritative `allowedActions` gating, `useRef` locks, conflict reload modal, error banners, and touch targets $\ge 48\text{dp}$.

## 5. DOMAIN_STATE_MACHINE

- Pure transition table:
  - `TODO` $\rightarrow$ `['IN_PROGRESS', 'CANCELLED']`
  - `IN_PROGRESS` $\rightarrow$ `['IN_REVIEW', 'CANCELLED']`
  - `IN_REVIEW` $\rightarrow$ `['COMPLETED', 'IN_PROGRESS']` (rejection back to `IN_PROGRESS` strictly requires comment)
  - `COMPLETED` $\rightarrow$ `[]` (terminal)
  - `CANCELLED` $\rightarrow$ `[]` (terminal)
- Functions: `getValidTaskStatusTransitions`, `canTransitionTaskStatus`, `isTaskTerminalStatus`, `getTaskStatusLabel`, `isCommentRequiredForTransition`.

## 6. STATUS_MUTATION_FLOW (SCR-TSK-07)

- Triggered by "Đổi trạng thái" chip when `allowedActions.includes('UPDATE_STATUS')`.
- Displays `ChangeStatusModal` showing current status badge and radios for valid target statuses.
- If current status is terminal (`COMPLETED`, `CANCELLED`), displays friendly notice and hides submit button.
- Rejection check: If `currentStatus === 'IN_REVIEW'` and `targetStatus === 'IN_PROGRESS'`, comment input becomes mandatory (`* (Bắt buộc)`). Submitting without comment displays validation error.
- Dispatches `taskApi.changeTaskStatus(taskId, { status, comment, version })`.
- On success, invokes `applyTaskUpdate(updated)` and closes modal.

## 7. PROGRESS_MUTATION_FLOW (SCR-TSK-08)

- Triggered by "Cập nhật" chip next to progress bar when `allowedActions.includes('UPDATE_PROGRESS')`.
- Displays `UpdateProgressModal` pre-populated with current progress.
- Includes preset buttons (`0%`, `25%`, `50%`, `75%`, `100%`) and text input with `%` suffix.
- Validates decimal percentages (`parseFloat`) ensuring $0.0 \le \text{progress} \le 100.0$.
- Dispatches `taskApi.updateTaskProgress(taskId, { progressPercent, version })`.
- On success, invokes `applyTaskUpdate(updated)` and closes modal.

## 8. ASSIGN_MUTATION_FLOW (EXISTING TASK)

- Triggered by "+ Phân công" button in Personnel section when `allowedActions.includes('ASSIGN')`.
- Opens `ProjectMemberAssigneePickerModal` with `projectId={task.project.id}` and `disabledUserIds={task.assignees.map(a => a.id)}`.
- Queries `projectApi.listMembers(projectId, { active: true })`. Strictly zero calls to `directoryApi`.
- Existing assignees are disabled with "(Đã phân công)".
- On confirmation, filters out already-assigned users and dispatches `taskApi.assignUsers(task.id, { assigneeIds: [userId] })` using User UUID.
- On success, invokes `applyTaskUpdate(updated)` and closes modal.

## 9. UNASSIGN_MUTATION_FLOW (EXISTING TASK)

- Triggered by "Gỡ" button on assignee item when `allowedActions.includes('UNASSIGN')`.
- Displays accessible `ConfirmationDialog` with title "Gỡ phân công" and message "Bạn có chắc chắn muốn gỡ {fullName} khỏi công việc không?".
- On confirmation, dispatches `taskApi.unassignUser(task.id, assignee.assignmentId)` using `assignmentId` (TaskAssignment UUID, NOT User UUID).
- On success, invokes `applyTaskUpdate(updated)` and closes dialog.

## 10. ALLOWED_ACTIONS_GATING

- Every mutation action is strictly gated by authoritative `task.allowedActions`:
  - `UPDATE_STATUS`: Controls visibility of "Đổi trạng thái" chip.
  - `UPDATE_PROGRESS`: Controls visibility of "Cập nhật" progress chip.
  - `ASSIGN`: Controls visibility of "+ Phân công" button.
  - `UNASSIGN`: Controls visibility of "Gỡ" buttons on assignee rows.
- If `allowedActions` does not include an action (or task is terminal), corresponding controls are omitted from the UI. Unknown future actions are safely ignored without errors.

## 11. OPTIMISTIC_LOCKING_AND_CONFLICT_HANDLING

- Outgoing status and progress mutations pass `version: task.version`.
- Raw versions are never displayed in the UI.
- On HTTP 409 conflict (`OPTIMISTIC_LOCK_CONFLICT`), screen dismisses the mutation modal and displays `ConfirmationDialog` ("Xung đột dữ liệu", "Dữ liệu công việc đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.").
- Pressing "Tải lại dữ liệu" invokes `refresh()` to fetch latest authoritative server state.

## 12. SYNCHRONOUS_MUTATION_LOCKS

- Synchronous `useRef` locks guard all mutation flows against rapid double-clicks:
  - `statusLockRef.current`
  - `progressLockRef.current`
  - `assignLockRef.current`
  - `unassignLockRef.current`
- Modal-level synchronous submit locks:
  - `ChangeStatusModal`: `submittingRef.current`
  - `UpdateProgressModal`: `submittingRef.current`
  - `ProjectMemberAssigneePickerModal`: `paginationLockRef.current`

## 13. STALE_OVERWRITE_PROTECTION (applyTaskUpdate)

- Identified race hazard: If an in-flight GET query is slower than a mutation response, the GET could resolve later and overwrite the fresh mutation result (`TASK_DETAIL_MUTATION_STALE_OVERWRITE`).
- Resolution in `useTaskDetail.ts`:
  ```typescript
  const applyTaskUpdate = useCallback((updated: TaskDetail) => {
    requestGenerationRef.current++;
    inFlightPromiseRef.current = null;
    setTask(updated);
    setError(null);
    setRefreshError(null);
  }, []);
  ```
- This immediately commits the returned `TaskDetail` and invalidates any in-flight GET request.

## 14. REFRESH_AND_FOCUS_LIFECYCLE

- Task Detail maintains auto-refresh on screen focus via `navigation.addListener('focus', refresh)`.
- Pull-to-refresh (`RefreshControl`) retains current data while refreshing and renders a non-blocking banner if refresh fails.

## 15. ERROR_HANDLING_AND_FEEDBACK

- Validation errors inside modals are displayed inline in dedicated error banners (`change-status-error`, `update-progress-error`).
- Mutation API errors (non-conflict) are displayed in an accessible dismissible banner at the top of the Task Detail screen (`task-mutation-error-banner`).
- Network failures provide clear Vietnamese messages without unhandled rejections or crashes.

## 16. ACCESSIBILITY_AND_USABILITY

- Touch targets: All action chips, unassign buttons, radio options, and dialog buttons meet or exceed $48\times 48\text{dp}$.
- Semantic roles: `accessibilityRole="button"`, `accessibilityRole="radio"`, `accessibilityRole="checkbox"`, `accessibilityRole="alert"`.
- `accessibilityState`: Checked/disabled states populated accurately for screen readers.

## 17. DESIGN_SYSTEM_COMPLIANCE

- Uses theme tokens for all typography (`theme.typography`), colors (`theme.colors`), and border radii (`theme.radii`).
- Zero inline styles added in new task feature components.
- Zero raw database UUIDs or version numbers exposed to users.

## 18. DRIFT_ANALYSIS_AND_SCOPE_BOUNDARIES

- **Backend**: Zero changes to backend codebase.
- **Dependencies**: Zero new npm dependencies added.
- **Directory Feature**: Strictly zero direct imports or queries to `directoryApi` in Task feature.
- **Phase 15F Boundaries**:
  - Subtask list screen/modals (`SCR-TSK-05`) strictly NOT implemented.
  - Comments screen/modals (`SCR-TSK-06`) strictly NOT implemented.
  - Delete Task strictly NOT implemented.

## 19. TEST_STRATEGY_AND_RESULTS

- **Total Test Suites**: 78 (75 baseline + 3 new).
- **Total Tests**: 692 (665 baseline + 27 new). All PASS (0 failed, 0 skipped).
- **New Test Suites**:
  1. `mobile/__tests__/tasks/taskStatusTransitions.test.ts` (13 tests): Domain state machine matrix, terminal states, Vietnamese labels, rejection comment requirements.
  2. `mobile/__tests__/tasks/ChangeStatusModal.test.tsx` (5 tests): Modal rendering, valid options, terminal notice, rejection validation, submit locks.
  3. `mobile/__tests__/tasks/UpdateProgressModal.test.tsx` (4 tests): Decimal parsing, presets, range validation ($0..100$), submit locks.
- **Updated Test Suites**:
  1. `mobile/__tests__/tasks/useTaskDetail.test.tsx` (9 tests): Added test 9 verifying `applyTaskUpdate` immediate commit and race supersession.
  2. `mobile/__tests__/screens/TaskDetailScreen.test.tsx` (14 tests): Full coverage of canonical rendering, 404/403/network errors, refresh banner, goBack, status mutation, rejection comment requirement, 409 conflict reload, progress mutation, assign flow with eligible project members, unassign flow with assignmentId, and `allowedActions` capability gating.

## 20. STATIC_VERIFICATION

- **TypeScript Typecheck**:
  - Command: `npm --prefix mobile run typecheck`
  - Result: `tsc --noEmit` exited with code 0 (0 errors).
- **ESLint**:
  - Command: `npm --prefix mobile run lint`
  - Result: `eslint .` exited with code 0 (0 errors, 48 preexisting warnings in other modules).

## 21. BUILD_VERIFICATION

- **Android Gradle Debug Build**:
  - Command: `.\gradlew.bat assembleDebug --no-daemon`
  - Environment: `JAVA_HOME=D:\Android\jbr`, `ANDROID_HOME=D:\AndroidSDK`
  - Result: `BUILD SUCCESSFUL in 1m 29s` (203 actionable tasks: 16 executed, 187 up-to-date).

## 22. RESIDUAL_RISKS_AND_DEBT

- `PHASE_14E_LINT_WARNING_DEBT`: 48 preexisting warnings for `react-native/no-inline-styles` in project/org modules. Zero warnings in Phase 15E task mutation components.
- `PHASE_15F_PENDING`: Subtasks (`SCR-TSK-05`) and Comments (`SCR-TSK-06`) remain to be implemented in Phase 15F.

## 23. VERIFICATION_COMMAND_LOG

1. `npm --prefix mobile test -- --runInBand taskStatusTransitions ChangeStatusModal UpdateProgressModal` -> PASS (4 suites, 27 tests).
2. `npm --prefix mobile test -- --runInBand TaskDetailScreen` -> PASS (1 suite, 14 tests).
3. `npm --prefix mobile run typecheck` -> PASS (0 errors).
4. `npm --prefix mobile run lint` -> PASS (0 errors, 48 preexisting warnings).
5. `npm --prefix mobile test -- --runInBand` -> PASS (78 suites, 692 tests).
6. `.\gradlew.bat assembleDebug --no-daemon` -> BUILD SUCCESSFUL.
7. `git diff -- backend mobile/package.json mobile/src/features/directory` -> CLEAN (0 differences).

## 24. CONCLUSION

Phase 15E (Task Status, Progress & Assignments) is fully implemented, verified, and ready for independent audit.

Verdict: **PHASE_15E_PASS_PUSHED**
