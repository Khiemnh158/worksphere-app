# PHASE 14F INTEGRATION & HARDENING

## Starting checkpoint

- Repository: `D:\WorkSphere`
- Branch: `main`
- Commit: `1eb070cf46f3a09bdf119a8f930aa45aedb0edf7` (`test(mobile): verify phase 14e capability and freshness hardening`)
- Verification: `git rev-parse HEAD` == `git rev-parse origin/main` == `1eb070cf46f3a09bdf119a8f930aa45aedb0edf7`
- Working Tree: clean (0 untracked files, 0 uncommitted modifications)
- Prerequisites verified:
  - Phase 14A: CLOSED / AUDITED
  - Phase 14B: CLOSED / HARDENED
  - Phase 14C: CLOSED / HARDENED
  - Phase 14D: CLOSED / AUDITED
  - Phase 14E-G1: CLOSED / AUDITED
  - Phase 14E-G2: CLOSED / AUDITED
  - Phase 14E: CLOSED / HARDENED

## Phase 14 inventory

The Phase 14 mobile scope encompasses exactly 10 screens across Personal Dashboard (`SCR-MAIN-01`) and Projects (`SCR-PRJ-01` .. `SCR-PRJ-09`):

| Screen ID | Screen Name | Route Name | Implemented | Route Registered | API Wired | Tested | Security Gated |
|---|---|---|---|---|---|---|---|
| `SCR-MAIN-01` | Personal Dashboard | `Dashboard` | YES | YES (`MainTabNavigator`) | `GET /dashboard/me` | YES | Authenticated |
| `SCR-PRJ-01` | Project List | `Projects` | YES | YES (`MainTabNavigator`) | `GET /projects` | YES | Authenticated (`PROJECT_READ`) |
| `SCR-PRJ-02` | Project Detail | `ProjectDetail` | YES | YES (Auxiliary) | `GET /projects/{id}` | YES | Authenticated (`PROJECT_READ`) |
| `SCR-PRJ-03` | Create Project | `CreateProject` | YES | YES (Auxiliary) | `POST /projects` | YES | `PROJECT_CREATE` client & server |
| `SCR-PRJ-04` | Edit Project | `EditProject` | YES | YES (Auxiliary) | `PUT /projects/{id}` | YES | `PROJECT_UPDATE` + `canEdit` server |
| `SCR-PRJ-05` | Change Status Modal | Modal on Detail | YES | Modal component | `PUT /projects/{id}/status` | YES | `PROJECT_UPDATE` + `canChangeStatus` |
| `SCR-PRJ-06` | Project Members | `ProjectMembers` | YES | YES (Auxiliary) | `GET /projects/{id}/members` | YES | `PROJECT_READ` list |
| `SCR-PRJ-07` | Member Management | Modals on Members | YES | Modal components | `POST/PUT/DELETE /members` | YES | `MANAGE_MEMBERS` authoritative |
| `SCR-PRJ-08` | Project Milestones | `ProjectMilestones` | YES | YES (Auxiliary) | `GET /projects/{id}/milestones` | YES | `PROJECT_READ` list |
| `SCR-PRJ-09` | Create Milestone Modal | Modal on Milestones| YES | Modal component | `POST /projects/{id}/milestones` | YES | `CREATE_MILESTONE` authoritative |

Zero Phase 15 screens or placeholder routes are implemented or registered.

## Navigation

- Auditor checked `mobile/src/app/navigation/MainTabNavigator.tsx` and `mobile/src/app/navigation/types.ts`.
- Visible Bottom Tabs: Exactly 5 runtime screens in registration order:
  1. `Dashboard` (`SCR-MAIN-01`)
  2. `Projects` (`SCR-PRJ-01`)
  3. `Tasks` (Placeholder for Phase 15)
  4. `ServiceRequests` (Placeholder for Phase 16)
  5. `More` (Profile & Settings Menu)
- Auxiliary Protected Routes: Registered on `MainTabNavigator` with `tabBarButton: () => null` to completely hide them from the tab bar without occupying tab slots:
  - `Profile`
  - `EditProfile`
  - `ChangePassword`
  - `Settings`
  - `ProjectDetail`
  - `CreateProject`
  - `EditProject`
  - `ProjectMembers`
  - `ProjectMilestones`
- Navigation Invariant: No broken destinations, all auxiliary screens properly receive and utilize navigation parameters.

## Session integration

- All Phase 14 network requests strictly funnel through `mobile/src/services/api/apiClient.ts`.
- Phase 13 session handling invariants preserved:
  - In-flight Bearer token injection via Axios interceptor.
  - Automatic 401 interception and single-flight token refresh coordinator (`refreshCoordinator.ts`).
  - Terminal 401 handling triggers `authEvents.emit('unauthorized')` and `AuthProvider` unmounts protected tree.
  - No Phase 14 component or hook directly accesses tokens, triggers manual refreshes, or attempts ad-hoc navigation to `Login`.

## Data persistence

- State Ownership Inspection:
  - Dashboard: In-memory hook state (`useDashboard`).
  - Projects: In-memory hook states (`useProjects`, `useProjectDetail`, `useUserDirectory`).
  - Members & Milestones: In-memory component state (`useState`, `useCallback`).
- Protected Tree Unmount / Logout:
  - Upon user logout, the entire authenticated navigation stack unmounts.
  - All Phase 14 React state, queries, and refs are cleanly destroyed by React garbage collection.
- Persistent Storage Audit:
  - Zero occurrences of `AsyncStorage` or `react-native-keychain` across `mobile/src/features/projects/`, `mobile/src/features/dashboard/`, `mobile/src/features/directory/`, or `mobile/src/features/organization/`.
  - Finding: No authenticated Project, Member, Milestone, Dashboard, or Directory data is written to disk or Keychain (`PHASE_14_AUTHENTICATED_DATA_PERSISTENCE_RISK` = ABSENT / SECURE).

## Dashboard

- Contract: Strictly calls `GET /api/v1/dashboard/me`.
- Aggregation: 100% server-computed personal dashboard metrics (`taskStats`, `projectStats`, `serviceRequestStats`, `upcomingTasks`, `recentNotifications`). Zero client-side aggregation or unprivileged bulk scanning.
- Single-Flight Execution: Guarded by `isMounted` ref and deduplicated load effect; pull-to-refresh safely updates in-memory dashboard data.
- Domain Enums: Task priorities and statuses adhere to canonical closed unions.
- Safe Boundaries: No unsupported Task detail navigation or Phase 15 routes are invoked.

## Project List

- Contract: `GET /api/v1/projects?page=0&size=20&sort=createdAt,desc`.
- Query Capabilities:
  - Server-side search with debounce (300ms).
  - Canonical status filters (`ALL`, `DRAFT`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`).
  - Pagination with append locking (`isLoadingMoreRef`) and stale generation protection (`queryGenerationRef`).
  - In-place item deduplication by `item.id`.
- Navigation: Tapping a project card navigates directly to `ProjectDetail` with `{ projectId: project.id }`.
- Permission Gating: `+ Tạo mới` FAB is rendered only when user has `PROJECT_CREATE` client permission.

## Project Detail

- Contract: `GET /api/v1/projects/{projectId}`.
- Concurrency & Dedup: Managed by `useProjectDetail` with monotonic generation supersession, same-ID in-flight deduplication, and unmount safety.
- Post-Mutation Freshness: `navigation.addListener('focus')` combined with `isFirstMountRef` ensures zero duplicate initial GET on mount, while automatically triggering a fresh authoritative GET when returning from `EditProjectScreen`.
- UI Presentation: Status badge, priority badge, progress bar (clamped 0..100%), description, manager, department, member count, milestone summary.
- Authoritative Capability Gating: `allowedActions` array from backend dictates visibility of action buttons (`UPDATE`, `CHANGE_STATUS`, `MANAGE_MEMBERS`, `CREATE_MILESTONE`). Unknown actions are silently ignored; raw `allowedActions` strings are never displayed.

## Create/Edit

- Create Project (`SCR-PRJ-03`):
  - Department selection: `DepartmentSelectModal` integrating `GET /api/v1/departments` (human-readable name selection, zero UUID input).
  - Initial members selection: `UserPickerModal` multi-select integrating `GET /api/v1/directory/users`.
  - Creator Invariant: Creator does not need to manually add self (handled authoritatively by backend application service).
  - Validation: Client validates required fields and date ordering (`plannedEndDate >= startDate`).
  - Submission: Sends exact DTO; on success, replaces route with `ProjectDetail` passing `{ projectId }`.
- Edit Project (`SCR-PRJ-04`):
  - Prefill: Authoritative data from `GET /api/v1/projects/{projectId}`.
  - Immutable Fields: `code` and `department` are read-only.
  - Optimistic Locking: Sends `version` internally (never displayed to user).
  - Conflict Handling: HTTP 409 conflict catches `OPTIMISTIC_LOCK_CONFLICT` and prompts user with "Tải lại dữ liệu" button without infinite retries.

## Status

- Modal: `ChangeStatusModal` (`SCR-PRJ-05`).
- State Machine: Backed by `domain/projectStatusTransitions.ts` aligning with backend `ProjectStatus`:
  - `DRAFT` $\rightarrow$ `ACTIVE`, `CANCELLED`
  - `ACTIVE` $\rightarrow$ `ON_HOLD`, `COMPLETED`, `CANCELLED`
  - `ON_HOLD` $\rightarrow$ `ACTIVE`, `CANCELLED`
  - Terminal states (`COMPLETED`, `CANCELLED`) have zero transitions.
- Request DTO: `{ status, reason, version }`.
- Error Handling: HTTP 409 (optimistic lock conflict) and HTTP 422 (invalid status transition) mapped to friendly Vietnamese explanations.
- Freshness: On success, refreshes parent ProjectDetail authoritatively.

## Members

- Screen: `ProjectMembersScreen` (`SCR-PRJ-06`, `SCR-PRJ-07`).
- Security Gating:
  - Read-only list: Accessible to all active project members under `PROJECT_READ`.
  - Mutation controls: `+ Thêm thành viên`, `Đổi vai trò`, `Xóa` strictly require `MANAGE_MEMBERS` in `projectDetail.allowedActions`. Gated fail-closed during loading.
- Human-Readable Selection: `UserPickerModal` (single-select) with `disabledIds` tracking current project member user IDs to prevent selecting existing members.
- Role Management: Role selection modal (`MEMBER`, `TEAM_LEADER`, `PROJECT_MANAGER`).
- D-013 Invariant: Attempting to remove or demote the last Project Manager returns HTTP 422 `PROJECT_MANAGER_REQUIRED` from backend, displayed as an error banner without local optimistic removal.

## Milestones

- Screen: `ProjectMilestonesScreen` (`SCR-PRJ-08`, `SCR-PRJ-09`).
- Security Gating:
  - Read-only list: Accessible under `PROJECT_READ`.
  - Creation action: `+ Thêm mốc` strictly requires `CREATE_MILESTONE` in `projectDetail.allowedActions`. Gated fail-closed during loading.
- Modal: `CreateMilestoneModal` validates milestone name, target date, and optional description.
- Display: Clean milestone list with status tags (`PLANNED`, `REACHED`, `MISSED`), target date, and description. Zero raw milestone UUIDs rendered.

## Directory

- Contract: `GET /api/v1/directory/users` (implemented in G1 and mobile client in G2).
- Security Constraints:
  - Returns only `ACTIVE` and non-deleted users.
  - Excludes password hashes, administrative roles, security metadata, and sensitive PII.
  - Query parameters: `search`, `page`, `size` (default 20, max 100), `sort` (whitelisted to `fullName`, `username`, `email`).
- Mobile Component: `UserPickerModal` with in-memory state, search debouncing (300ms), deduplication, and zero local disk caching.

## Department

- Contract: `GET /api/v1/departments`.
- Integration: `DepartmentSelectModal` in `mobile/src/features/organization/components/`.
- User Experience: Displays department list with human-readable names and descriptions. ID is used purely as selection key and is never rendered to the user.

## Authorization matrix

| Action | Server Authority | Mobile Client Gate | Direct-Route Behavior | Failure Fallback |
|---|---|---|---|---|
| View Project List | `@PreAuthorize("hasAuthority('PROJECT_READ')")` | Authenticated session | Navigates to Project List | 403 error state displayed |
| View Project Detail | `@PreAuthorize("hasAuthority('PROJECT_READ')")` | Authenticated session | Direct navigation with `{ projectId }` | 403 error state / back button |
| Create Project | `@PreAuthorize("hasAuthority('PROJECT_CREATE')")` | `hasPermission('PROJECT_CREATE')` | Hidden FAB if missing; form blocked | 403 banner on API submit |
| Edit Project | `@PreAuthorize("hasAuthority('PROJECT_UPDATE')")` | `allowedActions.includes('UPDATE')` | Button hidden if absent | 403 banner on submit |
| Change Status | `@PreAuthorize("hasAuthority('PROJECT_UPDATE')")` | `allowedActions.includes('CHANGE_STATUS')` | Button hidden if absent | 403 banner on submit |
| View Members | `@PreAuthorize("hasAuthority('PROJECT_READ')")` | Authenticated session | List displayed read-only | 403 error state |
| Manage Members | `@PreAuthorize("hasAuthority('PROJECT_MEMBER_MANAGE')")` | `allowedActions.includes('MANAGE_MEMBERS')` | Add/Edit/Delete actions hidden | 403 banner on submit |
| View Milestones | `@PreAuthorize("hasAuthority('PROJECT_READ')")` | Authenticated session | List displayed read-only | 403 error state |
| Create Milestone | `@PreAuthorize("hasAuthority('PROJECT_UPDATE')")` | `allowedActions.includes('CREATE_MILESTONE')` | Add button hidden | 403 banner on submit |

## Identifier safety

- Codebase Scan Results:
  - `projectId`, `departmentId`, `userId`, `memberId`, `milestoneId`, `version`, `allowedActions` were scanned across all Phase 14 JSX rendering templates and accessibility labels.
  - Usage Classification:
    - React keys: Internal (`key={member.id}`) - APPROVED.
    - Route params: Internal (`{ projectId }`) - APPROVED.
    - Mutation payloads: Internal (`memberId`, `version`) - APPROVED.
    - User-facing text / accessibility labels: ZERO raw UUIDs or version numbers displayed. All entities identify by human-readable names (`fullName`, `name`, `code`, `departmentName`).

## Type safety

- TypeScript Strictness:
  - Zero `@ts-ignore` comments.
  - Zero `@ts-expect-error` comments.
  - Zero `eslint-disable` comments.
  - Single classified occurrence of `as any` in `mobile/src/features/projects/api/projectApi.ts`: `(property as any)` used inside a generic helper guard for property verification.
- Transport Safety: Complete typed request/response interfaces for Dashboard, Projects, Members, Milestones, and Directory.

## Error safety

- Error Mappers:
  - `mapProjectError`: Translates canonical error codes (`PROJECT_NOT_FOUND`, `PROJECT_CODE_ALREADY_EXISTS`, `PROJECT_INVALID_STATUS_TRANSITION`, `OPTIMISTIC_LOCK_CONFLICT`, `PROJECT_MANAGER_REQUIRED`) to localized user-friendly messages.
  - `mapDirectoryError`: Translates directory lookup failures.
- Sanitization:
  - Zero raw Axios error objects, stack traces, or SQL error messages displayed.
  - Preserves `traceId` when provided by backend envelope for debugging support.
  - Safe network timeout and HTTP 500 fallback messages.

## Concurrency matrix

| Module / Screen | Concurrency Pattern | Implementation Mechanism | Test Coverage |
|---|---|---|---|
| Dashboard | Single-flight fetch | `isMounted` ref + single active promise | `useDashboard.test.tsx` |
| Project List | Latest-query-wins | Monotonic `queryGenerationRef` + append lock | `useProjects.test.tsx` |
| Project Detail | Dedup + cross-ID supersession | `queryGenerationRef` + active request cancellation | `useProjectDetail.test.tsx` |
| Directory Picker | Debounce + latest-query-wins | 300ms debounce + `queryGenerationRef` + append lock | `useUserDirectory.test.tsx` |
| Member List | Generation + pagination lock | `isMounted` ref + search generation | `ProjectMembersScreen.test.tsx` |
| All Mutations (7 actions) | State-only submit guard | `submitting` boolean lock states (`STATE_ONLY_GUARD`) | Component integration tests |

## Mutation safety

All 7 mutation flows implement state-only submit locking (`STATE_ONLY_GUARD / DISABLED_UI_ONLY`):
1. `CreateProjectScreen`: `isSubmitting` flag disables "Tạo dự án" button.
2. `EditProjectScreen`: `isSubmitting` flag disables "Lưu thay đổi" button.
3. `ChangeStatusModal`: `submitting` state disables "Cập nhật" button and radio options.
4. `ProjectMembersScreen - Add Member`: `submitting` state disables "Thêm thành viên" button.
5. `ProjectMembersScreen - Update Role`: `submitting` state disables "Lưu thay đổi" button.
6. `ProjectMembersScreen - Remove Member`: `isSubmitting` state disables confirmation button.
7. `CreateMilestoneModal`: `submitting` state disables "Tạo mốc" button.

Rapid repeated taps produce exactly one network call; duplicate submissions are prevented.

## Freshness

- Post-Create: Navigates with replace to `ProjectDetail` for authoritative display of the newly created project.
- Post-Edit: Returning to `ProjectDetail` triggers `focus` listener with `isFirstMountRef` guard to re-fetch latest data authoritatively.
- Post-Status Change: Modal close triggers parent `refresh()` on `ProjectDetail`.
- Post-Member Mutation: Member addition, role update, or member removal triggers immediate re-fetch of member list and detail.
- Post-Milestone Creation: Creation triggers immediate re-fetch of milestone list and summary count.
- Result: Zero permanently stale screens.

## Accessibility

- Touch Targets: All interactive buttons, chips, list items, and modal actions adhere to WCAG minimum touch target size ($\ge 48 \times 48\,\text{dp}$).
- Labels & Roles: Explicit `accessibilityRole="button"`, `accessibilityRole="header"`, and `accessibilityLabel` applied across all screens.
- State Announcements: Badges use accessible status labels; loading indicators include `accessibilityLabel="Đang tải..."`.
- Modal Dialogs: Modal components implement `accessibilityViewIsModal={true}` and accessible dismiss actions.

## Lint debt

- Debt Identifier: `PHASE_14E_LINT_WARNING_DEBT`
- Status: Recorded as LOW-priority deferred non-functional debt.
- Metrics:
  - `eslint .`: 0 errors, 48 warnings.
  - Warning Type: Exclusively `react-native/no-inline-styles` (47 introduced in Phase 14E screens/modals, 1 pre-existing in `DepartmentSelectModal.tsx`).
- Policy Compliance: Non-blocking debt. No broad inline-style refactoring was performed in 14F to avoid risk of visual regression.

## Dependency/toolchain debt

- `package.json` and `package-lock.json`: 100% UNCHANGED.
- `allow-scripts` policy: Verified set to `opencode-ai`.
- Environmental Warnings Recorded:
  - npm audit notices: 55 vulnerabilities (5 moderate, 50 high in build/dev dependencies) deferred; zero `npm audit fix` executed.
  - Android Gradle Plugin: `android.builtInKotlin=false` and `android.newDsl=false` deprecation warnings.
  - KSP / Kotlin Compiler: `ksp-2.2.0-2.0.2 is too old for kotlin-2.2.10` compatibility notice.
  - All environmental/toolchain notices recorded without ad-hoc modification.

## Mobile regression

- Command: `npm test -- --runInBand` executed in `mobile/`.
- Results:
  - Test Suites: 61 passed, 61 total
  - Tests: 528 passed, 528 total
  - Snapshots: 0 total
  - Exit code: 0
- Typecheck: `npm run typecheck` (`tsc --noEmit`) $\rightarrow$ 0 errors, exit code 0.
- Lint: `npm run lint` (`eslint .`) $\rightarrow$ 0 errors, 48 warnings, exit code 0.

## Backend regression

- Command: `.\mvnw.cmd test "-Dtest=ProjectMockMvcTest,DashboardMockMvcTest,UserDirectoryMockMvcTest"` executed in `backend/`.
- Results:
  - Checkstyle: 0 violations.
  - `ProjectMockMvcTest`: 15 tests run, 0 failures, 0 errors, 0 skipped.
  - `DashboardMockMvcTest`: 5 tests run, 0 failures, 0 errors, 0 skipped.
  - `UserDirectoryMockMvcTest`: 11 tests run, 0 failures, 0 errors, 0 skipped.
  - Total: 31 tests run, 0 failures, 0 errors, 0 skipped.
  - Execution Status: `BUILD SUCCESS` (1m 15s).

## Android clean build

- Environment:
  - `JAVA_HOME=D:\Android\jbr`
  - `ANDROID_HOME=D:\AndroidSDK`
  - `ANDROID_SDK_ROOT=D:\AndroidSDK`
- Command: `gradlew.bat clean assembleDebug --no-daemon` executed in `mobile/android`.
- Results:
  - Execution Status: `BUILD SUCCESSFUL in 5m 51s`
  - Actionable Tasks: 213 (190 executed, 23 up-to-date)
  - Exit code: 0

## APK

- Artifact: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- Verification: File confirmed present.
- File Size: 157,662,829 bytes
- Timestamp: 2026-10-20 16:47:57
- Repository Hygiene: APK artifact is Git-ignored; binary is not committed to repository.

## Emulator smoke

- Target Device: `emulator-5554` (state: `device`).
- Installation: `adb -s emulator-5554 install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk` $\rightarrow$ `Success`.
- Launch: `adb -s emulator-5554 shell am start -n com.workspheremobile/.MainActivity`.
- Inspection:
  - Process PID: 22064
  - Focused Window: `Window{66fe67e u0 com.workspheremobile/com.workspheremobile.MainActivity}`
  - Focused App: `ActivityRecord{62a8ec3 u0 com.workspheremobile/.MainActivity t30}`
  - Zero native crashes on launch.
- Verdict: `PRE_AUTH_ANDROID_SMOKE_PASS`.

## Authenticated E2E

- Credential Environment Check:
  - `WORKSPHERE_DEV_E2E_USER_ENABLED`: ABSENT
  - `WORKSPHERE_E2E_LOGIN`: ABSENT
  - `WORKSPHERE_E2E_PASSWORD`: ABSENT
- Verdict: `PHASE_14_AUTH_E2E_CREDENTIALS_NOT_AVAILABLE_SAFE_SKIP`.
- Policy Compliance: No credentials fabricated; no database mutations performed.

## Deferred E2E

- Mutation E2E: `PHASE_14_MUTATION_E2E_DEFERRED` (deferred until approved disposable test fixture provisioning mechanism exists).
- Offline Network E2E: `PHASE_14_OFFLINE_DEVICE_E2E_DEFERRED` (device network manipulation deferred; network disconnection and recovery is fully covered by Jest tests in `apiClient.test.ts`).

## Security

- Security Source Scan:
  - Scanned for `console.log`, `console.error`, `password`, `Authorization`, `token`, `AsyncStorage`, `Keychain` across `mobile/src/features/projects/`, `mobile/src/features/dashboard/`, `mobile/src/features/directory/`.
  - Zero sensitive leaks found.
  - Zero unauthorized storage of tokens or credentials.
  - Zero exposure of internal passwords.

## Scope

- Strictly confined to Phase 14 Dashboard and Projects validation and reporting.
- Zero modifications to backend source, database schema, or Flyway migrations.
- Zero modifications to Phase 13 source.
- Zero new dependencies added.
- Zero Task management (`Phase 15`) or Service Request (`Phase 16`) screens implemented.

## Files

Files created or modified in Phase 14F:
1. `reports/PHASE_14F_INTEGRATION_HARDENING_REPORT.md` (Created)
2. `reports/PROJECT_STATE.md` (Updated)
3. `reports/HANDOFF.md` (Updated)

Zero production code changes were required as all integration, regression, and security gates passed cleanly without finding any blockers.

## Final audit readiness

- All Phase 14 subphases (14A, 14B, 14C, 14D, 14E-G1, 14E-G2, 14E, 14F) are complete and validated.
- All test baselines (528 mobile tests, 31 targeted backend tests) are 100% passing.
- Android clean native build succeeds (`BUILD SUCCESSFUL`).
- Pre-auth emulator smoke test on `emulator-5554` passes.
- Phase 14 is ready for Final Independent Audit.

## Conclusion

`PHASE_14F_PASS_PUSHED_READY_FOR_FINAL_AUDIT`
