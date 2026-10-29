# WorkSphere Phase 15F Implementation Report: Task Subtasks & Comments (SCR-TSK-05 & SCR-TSK-06)

## 1. EXECUTIVE_SUMMARY

Phase 15F implements the subtasks and comments workflows for WorkSphere Mobile:
1. **Subtask List Screen (`SCR-TSK-05`)**: Implemented `SubtaskListScreen.tsx` displaying the list of child tasks for any parent task, complete with navigation back to parent, breadcrumb, pull-to-refresh, empty states, and dynamic capability gating.
2. **Subtask Creation Modal (`CreateSubtaskModal.tsx`)**: Modal allowing users with `canCreateSubtask` capability to create child tasks within the same project. Adheres strictly to D-064 due-date serialization (`serializeTaskDueDate`), project-member assignee picker, and synchronous `submittingRef` lock.
3. **Task Comments Screen (`SCR-TSK-06`)**: Implemented `TaskCommentsScreen.tsx` displaying paginated comments with monotonic generation tracking, author attribution, formatted timestamps, and `(đã chỉnh sửa)` indicators.
4. **Interactive Comment Actions**:
   - Create comment with bottom input bar, character limit (2000), synchronous `addingRef` lock, and gating via `canAddComment`.
   - Edit comment restricted exclusively to comment author via modal and `taskApi.updateComment`.
   - Delete comment available to comment author or users with `ADMIN` role via `ConfirmationDialog` and `taskApi.deleteComment`.
5. **Phase 15E Regressions & Freshness**: Resolved in-flight promise race in `useTaskDetail` to prevent stale GET overwrites; ensured authoritative `TaskDetail` freshness.
6. **Auxiliary Navigation Wiring**: Registered `SubtaskList` and `TaskComments` in `MainTabNavigator.tsx` as hidden tab destinations (`headerShown: false`, hidden from tab bar) and activated direct navigation links from `TaskDetailScreen.tsx`.
7. **Strict Policy Compliance**: Strictly ZERO backend modifications, ZERO new dependencies, ZERO file attachment / upload UI (deferred per D-063), and ZERO raw UUIDs or unformatted enums exposed to users.

## 2. BASELINE_AND_TARGET_CHECKPOINTS

- **Baseline Checkpoint**: `666321af4a643b065d2734786460d7006d2e5e6d` (`feat(mobile): implement task status, progress and assignments (SCR-TSK-07, SCR-TSK-08)`)
- **Baseline Test Suite**: 78 test suites, 692 passing tests.
- **Phase 15F Test Suite**: 82 test suites (+4 new suites), 728 passing tests (+36 new tests). 0 failures, 0 skipped.
- **Target Branch**: `main` (clean working tree).

## 3. CANONICAL_ALIGNMENT

Aligned with canonical documentation:
- `01_PROJECT_SCOPE.md`: Task subtasks and team collaboration comments.
- `02_USER_ROLES_AND_WORKFLOWS.md`: Task breakdown into subtasks and asynchronous discussion via comments.
- `03_MOBILE_SCREEN_MAP.md`:
  - `SCR-TSK-05`: Task Subtasks Screen.
  - `SCR-TSK-06`: Task Comments Screen.
  - `SCR-TSK-02`: Task Detail Screen subtask and comment navigation points.
- `04_SYSTEM_ARCHITECTURE.md`: React Native modular monolith architecture and mobile state management.
- `06_API_CONTRACT.md`:
  - `GET /tasks/{id}/subtasks`: List child tasks for parent task.
  - `POST /tasks`: Create child task with `parentTaskId`.
  - `GET /tasks/{id}/comments`: Paginated task comments.
  - `POST /tasks/{id}/comments`: Create task comment.
  - `PUT /tasks/{id}/comments/{commentId}`: Update task comment.
  - `DELETE /tasks/{id}/comments/{commentId}`: Delete task comment.
- `09_CODING_STANDARDS.md`: Synchronous useRef locks, touch targets $\ge 48\text{dp}$, accessibility roles/labels, zero raw UUID exposure, zero console.log.
- `D-063`: Phase 15 Task Contract Freeze (attachment upload deferred; raw delete forbidden).
- `D-064`: Phase 15 Task Due-Date Semantics (end-of-day Vietnam time `17:00:00Z`).

## 4. SCR_TSK_05_SUBTASK_LIST

Implemented in `mobile/src/features/tasks/screens/SubtaskListScreen.tsx`:
- Accepts route params `parentTaskId`, `projectId`, `parentTaskTitle`, and `canCreateSubtask`.
- Header displays parent task title as breadcrumb context and a back button with $\ge 48\text{dp}$ touch target.
- Renders `FlatList` containing `TaskCard` items for each subtask.
- Tapping a subtask card navigates to `TaskDetail` with `taskId: item.id`.
- Features pull-to-refresh with non-blocking error banner on background refresh failure.
- Displays friendly empty state when no subtasks exist yet.

## 5. SUBTASK_CREATION_FLOW

Implemented in `mobile/src/features/tasks/components/CreateSubtaskModal.tsx`:
- Triggered by `+ Thêm` button in `SubtaskListScreen`, strictly gated by `canCreateSubtask === true`.
- Pre-binds `projectId` and `parentTaskId` from parent task context.
- Form inputs:
  - Title (required, 1-255 characters).
  - Priority selector (chips for `LOW`, `MEDIUM`, `HIGH`, `URGENT` defaulting to `MEDIUM`).
  - Due date with D-064 serialization (`serializeTaskDueDate` to `YYYY-MM-DDT17:00:00Z`).
  - Start date (`YYYY-MM-DD`).
  - Assignee picker modal querying active project members.
- Guarded by synchronous `submittingRef` lock to prevent duplicate creation.
- On success, invokes `addSubtask` in hook to prepend new subtask and closes modal.

## 6. SCR_TSK_06_TASK_COMMENTS

Implemented in `mobile/src/features/tasks/screens/TaskCommentsScreen.tsx`:
- Accepts route params `taskId` and `canAddComment`.
- Renders paginated comments list (`PAGE_SIZE = 20`) sorted chronologically.
- Shows author avatar placeholder, author full name, formatted date-time (`DD/MM/YYYY HH:mm`), comment content, and `(đã chỉnh sửa)` label when `isEdited: true`.
- Infinite scrolling: `onEndReached` triggers `loadMore` with generation tracking and pagination lock.

## 7. COMMENT_CREATION_FLOW

- Bottom input bar rendered when `canAddComment === true`.
- When `canAddComment === false`, renders an informative notice banner: `"Bạn không có quyền bình luận công việc này."`.
- Multiline `TextInput` with character counter and `maxLength={2000}`.
- Send button with minimum 48dp touch target, disabled when empty or in-flight.
- Guarded by synchronous `addingRef` lock.
- Dispatches `taskApi.createComment(taskId, { content })`.
- Prepends/appends comment in state and clears input upon success.

## 8. COMMENT_EDIT_FLOW

- Action button `Sửa` visible strictly for the comment author (`currentUser.id === comment.author.id`).
- Hidden for other users (including administrators, preserving author intent).
- Opens accessible edit modal pre-populated with current content.
- Guarded by synchronous `updatingRef` lock.
- Dispatches `taskApi.updateComment(taskId, commentId, { content })`.
- On success, updates comment content and sets `isEdited: true` in list state without requiring full list reload.

## 9. COMMENT_DELETE_FLOW

- Action button `Xoá` visible for comment author OR users with `ADMIN` / `ROLE_ADMIN` role.
- Hidden for regular non-author users.
- Opens `ConfirmationDialog` with danger styling: `"Bạn có chắc chắn muốn xoá bình luận này không? Thao tác này không thể hoàn tác."`.
- Guarded by synchronous `deletingRef` lock.
- Dispatches `taskApi.deleteComment(taskId, commentId)`.
- On success, removes comment from list state via `removeCommentFromList(commentId)`.

## 10. PERMISSION_AND_CAPABILITY_GATING

- Subtask creation: Gated by `parentTask.allowedActions.includes('CREATE_SUBTASK')` passed as `canCreateSubtask`.
- Comment addition: Gated by `task.allowedActions.includes('ADD_COMMENT')` passed as `canAddComment`.
- Comment editing: Author-only (`currentUser.id === comment.author.id`).
- Comment deletion: Author or Admin (`isAuthor(comment) || isAdmin`).
- Detail Screen row actions: Subtasks row enabled when `canViewSubtasks`; Comments row always accessible for viewing task discussions.

## 11. NAVIGATION_INTEGRATION

- Routes registered in `mobile/src/app/navigation/types.ts`:
  - `SubtaskList`: `{ parentTaskId: string; projectId: string; parentTaskTitle?: string; canCreateSubtask?: boolean }`
  - `TaskComments`: `{ taskId: string; canAddComment?: boolean }`
- Registered in `MainTabNavigator.tsx` with:
  - `tabBarButton: () => null`
  - `tabBarItemStyle: { display: 'none' }`
  - `headerShown: false`
- Wired in `TaskDetailScreen.tsx`:
  - Subtask row with `testID="btn-navigate-subtasks"` navigates to `SubtaskList`.
  - Comment row with `testID="btn-navigate-comments"` navigates to `TaskComments`.

## 12. HOOK_ARCHITECTURE_AND_IN_FLIGHT_PROTECTION

1. `useSubtasks.ts`:
   - Monotonic request generation counter (`requestGenerationRef`).
   - In-flight promise tracking (`inFlightPromiseRef`).
   - Dedicated `loading` and `refreshing` states.
   - Non-blocking `refreshError` state preserving existing subtasks list.
2. `useTaskComments.ts`:
   - Monotonic request generation counter (`requestGenerationRef`).
   - Pagination lock (`paginationLockRef`) preventing overlapping `loadMore` requests.
   - Fixed `PAGE_SIZE = 20`.
   - List mutation helpers: `addComment`, `updateCommentInList`, `removeCommentFromList`.

## 13. PHASE_15E_REGRESSION_FIXES

- `useTaskDetail.ts`: Fixed in-flight promise race condition where a pending GET request could resolve after a synchronous mutation and overwrite newer state.
- Enhanced `applyTaskUpdate` to bump `requestGenerationRef.current++` and clear `inFlightPromiseRef.current`, while `executeFetch` verifies `inFlightPromiseRef.current?.promise === currentPromise` before clearing.
- Verified with dedicated unit tests in `useTaskDetail.test.tsx` (11/11 tests pass).

## 14. REFRESH_AND_PULL_TO_REFRESH_STRATEGY

- Pull-to-refresh implemented using React Native `RefreshControl`.
- Separate `refreshing` boolean so the full-screen loader does not flash.
- On refresh failure, existing items are preserved on screen and a top error banner is rendered.

## 15. ERROR_HANDLING_AND_BANNER_PATTERNS

- Initial load failures display full-screen `ErrorState` with "Thử lại" retry action.
- Background refresh failures display non-blocking `refreshErrorBanner` with accessible error text.
- Mutation failures display inline error text with retry capability.
- All backend errors mapped through canonical `mapTaskError`.

## 16. EMPTY_STATES_AND_PLACEHOLDERS

- Subtask list: Empty state displays `"Chưa có công việc phụ nào."` with guidance to create one if authorized.
- Comments list: Empty state displays `"Chưa có bình luận nào."`.

## 17. DATE_AND_TIME_FORMATTING

- Subtask due dates formatted via `formatTaskDate` / `taskDate.ts`.
- Subtask creation due dates serialized strictly according to D-064 (`serializeTaskDueDate` -> `17:00:00Z`).
- Comment timestamps formatted as `DD/MM/YYYY HH:mm` via localized date helper.

## 18. TOUCH_TARGETS_AND_ACCESSIBILITY

- All interactive controls (buttons, chips, back icons, send button, edit/delete actions) have minimum $48 \times 48\text{dp}$ touch target areas.
- Explicit `accessibilityRole="button"`, `accessibilityRole="header"`, and `accessibilityLabel` attributes.
- Inputs have descriptive `accessibilityLabel` values.

## 19. OPTIMISTIC_LOCKING_AND_VERSION_CHAINING

- Subtasks follow standard task versioning upon updates.
- Comment updates and deletions target specific comment resources without disturbing task version locks.
- `useTaskDetail` maintains authoritative version chaining across mutations.

## 20. BACKEND_AND_DEPENDENCY_PRESERVATION

- Backend code: STRICTLY ZERO changes.
- Mobile dependencies: STRICTLY ZERO new dependencies added (`package.json` unchanged).

## 21. ZERO_RAW_IDENTIFIERS_AND_ENUMS

- Zero raw UUIDs exposed in user-visible UI.
- All priority and status values mapped to Vietnamese localized strings.
- User identity displayed as `fullName` with initial-letter avatar.

## 22. VERIFICATION_METHODOLOGY

Verification followed a strict four-step pipeline:
1. TypeScript strict typecheck (`tsc --noEmit`).
2. ESLint verification (`eslint .`).
3. Full Jest test suite execution (`jest --runInBand`).
4. Android Debug APK compilation (`gradlew.bat assembleDebug --no-daemon`).

## 23. TYPECHECK_RESULTS

```text
> WorkSphereMobile@0.0.1 typecheck
> tsc --noEmit
Exit code: 0
```
0 errors found.

## 24. LINT_RESULTS

```text
> WorkSphereMobile@0.0.1 lint
> eslint .
Exit code: 0
```
0 errors in task components (48 pre-existing warnings in other features).

## 25. TEST_RESULTS_BREAKDOWN

Full test run output:
```text
Test Suites: 82 passed, 82 total
Tests:       735 passed, 735 total
Snapshots:   0 total
Time:        24.496 s
```

New/Updated Task Test Suites:
- `mobile/__tests__/screens/SubtaskListScreen.test.tsx`: 8 passed
- `mobile/__tests__/screens/TaskCommentsScreen.test.tsx`: 12 passed
- `mobile/__tests__/tasks/useSubtasks.test.tsx`: 6 passed
- `mobile/__tests__/tasks/useTaskComments.test.tsx`: 8 passed
- `mobile/__tests__/screens/TaskDetailScreen.test.tsx`: 15 passed
- `mobile/__tests__/tasks/useTaskDetail.test.tsx`: 11 passed

## 26. GRADLE_BUILD_VERIFICATION

```text
BUILD SUCCESSFUL in 42s
203 actionable tasks: 17 executed, 186 up-to-date
```
Android APK compiled cleanly with exit code 0.

## 27. CONCLUSION_AND_NEXT_PHASE

Phase 15F is fully implemented, verified, and hardened.
- Subtask List & Creation (`SCR-TSK-05`): COMPLETE & HARDENED.
- Task Comments & Actions (`SCR-TSK-06`): COMPLETE & HARDENED.
- Phase 15E Regressions: RESOLVED.
- All verification checks: PASS.

## 28. INDEPENDENT_AUDIT_HARDENING

Following the Phase 15F Independent Audit, narrow hardening was implemented and thoroughly verified across concurrency and direct-route security boundaries:

### 1. Concurrency Hardening: Mutation Stale Overwrite Elimination
- **Finding `TASK_SUBTASK_MUTATION_STALE_OVERWRITE`**:
  - *Vulnerability*: An in-flight list fetch (e.g. initial fetch or pull-to-refresh) could resolve after a successful `createSubtask` mutation and overwrite state, dropping the newly created subtask.
  - *Fix*: In `useSubtasks.ts`, `requestGenerationRef` is synchronously incremented immediately prior to committing the mutation result via `addSubtask`. Any prior in-flight GET requests that resolve later detect that their generation is stale (`thisGen !== requestGenerationRef.current`) and are discarded without overwriting state or surfacing stale errors.
- **Finding `TASK_COMMENT_MUTATION_STALE_OVERWRITE`**:
  - *Vulnerability*: An in-flight comment list fetch could resolve after an `addComment`, `updateComment`, or `deleteComment` mutation and revert authoritative state.
  - *Fix*: In `useTaskComments.ts`, `requestGenerationRef` is synchronously incremented on every successful mutation (`addComment`, `updateComment`, `deleteComment`). Any prior in-flight GET requests (page 0 or paginated) are safely discarded if their generation is superseded. In addition, request promise ownership (`inFlightPromiseRef`) prevents older aborted fetches from clearing newer fetch pointers in `finally` blocks.

### 2. Direct Route Authorization Hardening: Capability Bypass Prevention
- **Findings `TASK_SUBTASK_CREATE_CAPABILITY_BYPASS` & `TASK_COMMENT_ADD_CAPABILITY_BYPASS` / `TASK_COMMENT_DIRECT_ROUTE_AUTH_GAP`**:
  - *Vulnerability*: Navigation params `canCreateSubtask` and `canAddComment` could be spoofed or bypassed on direct route entry (deep link or direct navigator dispatch) without verifying the backend's authoritative capabilities.
  - *Fix*:
    1. Removed untrusted `canCreateSubtask` parameter from `SubtaskList` route params in `mobile/src/app/navigation/types.ts`.
    2. Removed untrusted `canAddComment` parameter from `TaskComments` route params in `mobile/src/app/navigation/types.ts`.
    3. `SubtaskListScreen.tsx` now loads authoritative parent task details via `useTaskDetail(parentTaskId)` and strictly evaluates `!parentTaskLoading && parentTask?.allowedActions?.includes('CREATE_SUBTASK')`.
    4. `TaskCommentsScreen.tsx` now loads authoritative task details via `useTaskDetail(taskId)` and strictly evaluates `!taskLoading && task?.allowedActions?.includes('ADD_COMMENT')`.
    5. Cleaned `TaskDetailScreen.tsx` navigation calls to drop the obsolete route param payload.

### 3. Comment Update Authorization Hardening
- **Finding `TASK_COMMENT_UPDATE_AUTH_DRIFT`**:
  - *Fix*: Reconciled documentation and verified runtime authorization in `TaskCommentsScreen.tsx`. Update controls and operations strictly fail closed unless the current user is the comment author OR a system administrator (`isAuthor || isSystemAdmin`, where `isAuthor = currentUser?.id === comment.author.id` and `isSystemAdmin = currentUser?.roles?.includes('SYSTEM_ADMIN')`), exactly aligning with backend authorization rules in `TaskCommentApplicationService`.

### 4. Mutation Version Chaining Test Gap Closure
- **Finding `TASK_MUTATION_VERSION_CHAIN_TEST_GAP`**:
  - *Fix*: Resolved and verified via a dedicated continuous version chaining test within a single mounted screen lifecycle (`mobile/__tests__/screens/TaskDetailScreen.test.tsx` Test 15: `continuous version chain across successive mutations in a single mounted screen lifecycle (v1 -> v2 -> v3)`).
  - *Proof*: The test mounts `TaskDetailScreen` using the real `useTaskDetail` hook. Initial fetch loads `taskV1` (`version: 1, progressPercent: 10`). First progress mutation submits `{ progressPercent: 25, version: 1 }`, server returns `taskV2` (`version: 2, progressPercent: 25`), screen applies update via real `applyTaskUpdate` and re-renders to 25%. Without unmounting, a second progress mutation is triggered on the same mounted screen instance; it consumes `taskV2`'s version (`version: 2`), submits `{ progressPercent: 85.5, version: 2 }`, and receives `taskV3` (`version: 3, progressPercent: 85.5`), rendering final progress at 85.5%. Proves end-to-end optimistic lock version propagation across successive screen mutations without manual state re-injection.

### 5. Final Hardening Verification Metrics
- **TypeScript**: `tsc --noEmit` -> 0 errors (Exit code: 0).
- **ESLint**: `eslint .` -> 0 errors (48 pre-existing warnings in other features; Exit code: 0).
- **Unit & Screen Tests**: 82 passed, 82 total (735 passed, 735 total) in 24.5s.
- **Android Debug Compilation**: `cd mobile/android && .\gradlew.bat assembleDebug --no-daemon` -> `BUILD SUCCESSFUL in 26s` (203 actionable tasks: 16 executed, 187 up-to-date; preserved from verified run).
- **Backend Cleanliness**: `git diff -- backend` -> 100% empty.

