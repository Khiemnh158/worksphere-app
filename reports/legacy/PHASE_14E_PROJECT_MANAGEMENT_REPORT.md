# Phase 14E Implementation Report: Mobile Project Management Actions

**Date:** 2026-10-20  
**Status:** PASS  
**Branch:** `main`  
**Phase:** 14E — Project Management Flows (`SCR-PRJ-03` to `SCR-PRJ-09`)  
**Previous Baseline:** `87539a9fd0ce52c9c36f8b641818866a59eca571` (Phase 14E-G2 Mobile Directory Foundation & Picker)

---

## 1. Executive Summary

Phase 14E implements the core project-management lifecycle screens and capabilities for WorkSphere Mobile, delivering complete end-to-end functionality for:
- **SCR-PRJ-03:** Create Project screen with department selector adapter and initial member selection.
- **SCR-PRJ-04:** Edit Project screen with authoritative prefill and version-based optimistic concurrency control.
- **SCR-PRJ-05:** Change Project Status modal with pure state-machine transition validation and terminal status guards.
- **SCR-PRJ-06:** Project Member List screen with role filtering, pull-to-refresh, and stale-response protection.
- **SCR-PRJ-07:** Add, Edit Role, and Remove Member capabilities with D-013 last Project Manager invariant protection.
- **SCR-PRJ-08 & SCR-PRJ-09:** Milestone List screen and Create Milestone modal.

All actions are strictly capability-gated via server `allowedActions` and user permissions (`PROJECT_CREATE`), maintaining zero broken routes, zero raw UUID exposure in the UI, and exactly 5 visible tabs on `MainTabNavigator`.

---

## 2. Delivered Artifacts & Architecture

### Block E1: SCR-PRJ-03 Create Project & Organization Department Adapter
- `mobile/src/features/organization/api/departmentTypes.ts`: Domain models (`DepartmentItem`, runtime guards `isDepartmentItem`, `isDepartmentList`).
- `mobile/src/features/organization/api/departmentApi.ts`: HTTP client calling `GET /departments`.
- `mobile/src/features/organization/components/DepartmentSelectModal.tsx`: Searchable modal for selecting departments without revealing raw UUIDs.
- `mobile/src/features/organization/index.ts`: Barrel export.
- `mobile/src/features/projects/screens/CreateProjectScreen.tsx`: Complete form for project creation (code, name, description, priority chips, start/end dates with format and range validation, department picker, initial members picker via `UserPickerModal`).
- `mobile/src/features/projects/screens/ProjectsScreen.tsx`: Top bar "+ Tạo mới" action dynamically rendered when `currentUser.permissions.includes('PROJECT_CREATE')`, navigating to `CreateProject`.
- Tests: `departmentApi.test.ts` (2 tests), `CreateProjectScreen.test.tsx` (6 tests), updated `ProjectsScreen.test.tsx`.

### Block E2: SCR-PRJ-04 Edit Project
- `mobile/src/features/projects/screens/EditProjectScreen.tsx`: Authoritative prefill via `projectApi.getProject(projectId)`, non-editable read-only display for `code` and `department`, version-tracking optimistic locking, and HTTP 409 `OPTIMISTIC_LOCK_CONFLICT` reload prompt ("Tải lại dữ liệu").
- `mobile/src/features/projects/screens/ProjectDetailScreen.tsx`: Action button "Chỉnh sửa" enabled when `project.allowedActions.includes('UPDATE')`.
- Tests: `EditProjectScreen.test.tsx` (4 tests).

### Block E3: SCR-PRJ-05 Change Project Status
- `mobile/src/features/projects/domain/projectStatusTransitions.ts`: Pure domain transition matrix matching backend `Project.java`:
  - `DRAFT -> ACTIVE, CANCELLED`
  - `ACTIVE -> ON_HOLD, COMPLETED, CANCELLED`
  - `ON_HOLD -> ACTIVE, CANCELLED`
  - `COMPLETED -> []` (terminal)
  - `CANCELLED -> []` (terminal)
  - Helpers: `getAllowedTargetStatuses`, `canTransitionStatus`, `isTerminalStatus`, `getStatusLabel`.
- `mobile/src/features/projects/components/ChangeStatusModal.tsx`: Controlled modal with current status badge, target status radio options, optional reason field, optimistic locking via `version`, and terminal state notice.
- `mobile/src/features/projects/screens/ProjectDetailScreen.tsx`: Action button "Đổi trạng thái" enabled when `project.allowedActions.includes('CHANGE_STATUS')`.
- Tests: `projectStatusTransitions.test.ts` (5 tests), `ChangeStatusModal.test.tsx` (5 tests).

### Block E4 & E5: SCR-PRJ-06 Project Member List & SCR-PRJ-07 Member Governance
- `mobile/src/features/projects/hooks/useProjectMembers.ts`: Data hook managing member listing, role filtering, pagination, refresh, in-flight deduplication, and generation-based unmount protection.
- `mobile/src/features/projects/screens/ProjectMembersScreen.tsx`: Member cards with initials avatar, full name, email, role badge, role filter chips (Tất cả, Quản lý, Trưởng nhóm, Thành viên, Quan sát viên).
  - Add Member: Opens single-select `UserPickerModal` with existing member userIds in `disabledIds` (`disabledReason="Đã là thành viên"`), followed by role selection modal.
  - Edit Role: Radio role selection modal updating member role via `projectApi.updateProjectMemberRole`.
  - Remove Member: ConfirmationDialog with dangerous action prompt calling `projectApi.removeProjectMember`.
  - D-013 Invariant: Server rejection with `PROJECT_MANAGER_REQUIRED` ("Không thể giáng cấp/xoá Project Manager duy nhất của dự án") displays an error banner and leaves local state intact.
- `mobile/src/features/projects/screens/ProjectDetailScreen.tsx`: Members section header includes "Quản lý →" action navigating to `ProjectMembers`.
- Tests: `ProjectMembersScreen.test.tsx` (6 tests).

### Block E6: SCR-PRJ-08 Milestone List & SCR-PRJ-09 Create Milestone
- `mobile/src/features/projects/components/CreateMilestoneModal.tsx`: Modal form validating name (required, max 200), due date (required, `YYYY-MM-DD`), and optional description.
- `mobile/src/features/projects/screens/ProjectMilestonesScreen.tsx`: Milestone cards displaying name, status badge, description, formatted dates, pull-to-refresh, status filter chips, and "+ Thêm mốc" button opening `CreateMilestoneModal`.
- `mobile/src/features/projects/screens/ProjectDetailScreen.tsx`: Milestones summary card header includes "Xem tất cả →" action navigating to `ProjectMilestones`.
- Tests: `ProjectMilestonesScreen.test.tsx` (4 tests).

### Navigation & Routing
- `mobile/src/app/navigation/MainTabNavigator.tsx`: Registered `CreateProject`, `EditProject`, `ProjectMembers`, and `ProjectMilestones` with `tabBarButton: () => null` and `tabBarItemStyle: { display: 'none' }`, preserving exactly 5 bottom tabs: Dashboard, Dự án, Công việc, Yêu cầu, Thêm.

---

## 3. Strict Invariants & Security Audit

1. **Zero Raw UUID Leakage:**
   - Departments are rendered by name and code (`Kỹ thuật phần mềm (ENG)`).
   - Users and members are rendered by full name, email, and role.
   - IDs are kept strictly in internal state and network payloads.
2. **Optimistic Locking:**
   - Both `UpdateProjectRequest` and `ChangeProjectStatusRequest` supply the authoritative `version`.
   - On 409 `OPTIMISTIC_LOCK_CONFLICT`, an explicit prompt ("Tải lại dữ liệu") reloads authoritative server state without silent overwriting.
3. **D-013 Last Project Manager Invariant:**
   - Demoting or deleting the last Project Manager is rejected by the backend.
   - Mobile surfaces the exact business error and preserves the local member list and roles without mutation.
4. **Boundary & Dependency Discipline:**
   - Zero modifications to backend or Flyway migrations.
   - Zero modifications to `mobile/src/features/directory/` (audited G2 remains frozen).
   - Zero new third-party dependencies installed.

---

## 4. Verification & Quality Gates

| Verification Step | Command | Result |
| :--- | :--- | :--- |
| TypeScript Compilation | `npm --prefix mobile run typecheck` | `tsc --noEmit` exit code 0 (0 errors) |
| ESLint Static Analysis | `npm --prefix mobile run lint` | `eslint .` exit code 0 (0 errors) |
| Mobile Unit & Integration Tests | `npm --prefix mobile test -- --runInBand` | **61 suites passed, 519 tests passed** (0 failed, 0 skipped) |
| Android Debug Build | `cmd /c "set ""JAVA_HOME=D:\Android\jbr"" && cd mobile\android && gradlew.bat assembleDebug --no-daemon"` | **BUILD SUCCESSFUL in 59s** (203 actionable tasks, exit code 0) |

---

## 5. Audit Reconciliation & Security Hardening

### Source Truth Reconciliation
- **Visible Tabs:** Exactly 5 visible tabs on `MainTabNavigator`: `Dashboard`, `Projects`, `Tasks`, `ServiceRequests`, `More`. (Prior audit wording mistake corrected; runtime navigation was never drifted).
- **DELETE Project Member:** Backend `ProjectController.removeProjectMember` emits `HTTP 200 OK` with `ApiResponse<Void>` (`success: true`, `data: null`, `message: "Thành viên đã được xóa khỏi dự án"` via `ApiResponse.successNoContent`). Handled cleanly by `projectApi.removeProjectMember` and `apiClient.delete`. (Prior audit wording claiming 204 corrected).
- **ESLint Warning Debt:** `PHASE_14E_LINT_WARNING_DEBT`: 48 total warnings (`react-native/no-inline-styles`: 47 introduced in 14E screens/components, 1 pre-existing in 14C; exit code 0, 0 errors). Classified LOW / non-blocking debt.

### Security Capability & Freshness Hardening
1. **Authoritative Member Capability Gate:** `ProjectMembersScreen` derives `canManageMembers = !!projectDetail?.allowedActions?.includes('MANAGE_MEMBERS')` from server `useProjectDetail(projectId)`. Fails closed (false) during initial loading or fetch failure. When false, all mutation entry points (`+ Thêm thành viên`, `Đổi vai trò`, `Xóa`) and mutation modals are omitted, protecting direct-route access. Read-only member list remains accessible.
2. **Authoritative Milestone Capability Gate:** `ProjectMilestonesScreen` derives `canCreateMilestone = !!projectDetail?.allowedActions?.includes('CREATE_MILESTONE')` from server `useProjectDetail(projectId)`. Fails closed (false) during initial loading or fetch failure. When false, `+ Thêm mốc` action and `CreateMilestoneModal` are omitted, protecting direct-route access. Read-only milestone list remains accessible.
3. **Edit Return Freshness:** `ProjectDetailScreen` integrates React Navigation focus lifecycle listener (`navigation.addListener('focus')`) with initial-mount guard (`isFirstMountRef`), guaranteeing exactly one GET on initial entry while triggering an authoritative refetch (`refresh()`) upon return from `EditProjectScreen` to replace stale state without manual pull-to-refresh.

---

## 6. Conclusion & Checkpoint

Phase 14E core project management flows are complete, capability-hardened, and reconciled against all canonical rules and wireframe specifications. Ready for final narrow verification.
