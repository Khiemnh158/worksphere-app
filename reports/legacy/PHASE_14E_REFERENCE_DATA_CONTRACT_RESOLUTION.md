# PHASE 14E REFERENCE DATA CONTRACT RESOLUTION

## Checkpoint

- **Repository**: `D:\WorkSphere`
- **Branch**: `main`
- **Baseline Checkpoint**: `8a3384e6e4a4016c31fc5095a988eb1f77e00432` (`docs(project): document phase 14e reference data blocker`)
- **Remote Verification**: `HEAD == origin/main` verified clean prior to design execution.
- **Scope Status**: Read-only architecture and contract design. Zero source files modified, zero migrations added.

---

## Blockers

During Subphase 14E execution, two reference-data blockers were audited and documented:
1. `PROJECT_MEMBER_SELECTION_API_GAP`:
   - `SCR-PRJ-07 Add Member` requires `@NotNull UUID userId` in `POST /api/v1/projects/{projectId}/members`.
   - The only user search endpoint in the backend is `GET /api/v1/admin/users`, restricted to `ADMIN` by `@PreAuthorize("hasAuthority('USER_READ')")`.
   - Project Managers (`PROJECT_MEMBER_MANAGE`) do not have `USER_READ`.
   - No non-admin user directory or autocomplete API exists in `docs/06_API_CONTRACT.md` or backend code.
   - Per Coding Standards and Instruction Policy, shipping free-text UUID controls is strictly prohibited.
2. `PROJECT_CREATE_REFERENCE_DATA_GAP`:
   - `SCR-PRJ-03 Create Project` includes optional `initialMemberIds: List<UUID>`.
   - Selecting candidate users at project creation time suffers from the same lack of an unprivileged user search endpoint.

---

## Existing reusable APIs

A comprehensive search of the WorkSphere codebase was conducted across controllers, services, repositories, and DTOs:

| Component / Endpoint | Current Purpose | Classification | Detailed Rationale |
| :--- | :--- | :---: | :--- |
| `AdminUserController` (`GET /api/v1/admin/users`) | Administrative user query | **NOT_REUSABLE** (`ADMIN_USER_API_OVERPRIVILEGED_FOR_PROJECT_PICKER`) | Strictly restricted to `USER_READ`. Exposes sensitive security fields (`roles`, `phoneNumber`, locked/disabled statuses, audit timestamps). Granting Project Managers `USER_READ` would violate least-privilege principles and expose admin user management. |
| `DepartmentController` (`GET /api/v1/departments`) | Lists active departments | **REUSE_AS_IS** (For department selection only) | Open to all authenticated users. Fully resolves `departmentId` selection in `SCR-PRJ-03`. Does not contain user or employee records. |
| `UserRepository` (`searchUsers`) | JPA query for users with filter/search | **REUSE_AS_IS** (Persistence layer) | Query method already handles `deleted = false`, case-insensitive search on `username`, `fullName`, `email`, optional `departmentId` filter, optional `status` filter, and Spring `Pageable`. Fully reusable at repository layer. |
| `UserManagementApplicationService` | Application service for Identity module | **REUSE_WITH_NARROW_EXTENSION** (Service layer) | Can host a narrow `searchDirectory` method that calls `userRepository.searchUsers(search, departmentId, UserStatus.ACTIVE, pageable)` and projects entities into a minimized `UserDirectoryResponse` without admin metadata. |
| `TaskApplicationService` (`validateAssignees`) | Validates task assignees | **NOT_REUSABLE** (For project member selection) | Enforces that assignees must already be active project members (`projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue`). Does not search organization-wide users. |
| `ServiceRequestApplicationService` / `AssetApplicationService` | Service request & asset assignments | **NOT_REUSABLE** (As search source) | Both accept raw `assigneeId: UUID` without providing search endpoints; both will benefit in Phase 15 from the directory contract resolved here. |

---

## Create Project requirement

- **DTO Contract**: `CreateProjectRequest` (`code`, `name`, `description`, `priority`, `startDate`, `plannedEndDate`, `departmentId`, `initialMemberIds`).
- **Service Truth**: In `ProjectApplicationService.createProject`:
  - `initialMemberIds` is completely optional (`if (request.initialMemberIds() != null)`).
  - The creator is automatically inserted into `project_members` as `PROJECT_MANAGER`.
  - Exactly one active Project Manager is guaranteed, satisfying the D-013 invariant.
  - Zero other members are required by backend business rules for project creation.
- **Canonical Screen**: `design/02_SCREEN_INVENTORY.md` confirms `initialMemberIds` is optional; projects start in `DRAFT`. Members can be added post-creation in `SCR-PRJ-06`/`SCR-PRJ-07`.
- **Classification**: **`CREATE_PROJECT_CAN_PROCEED_WITHOUT_MEMBER_PICKER`**.
  - `departmentId` is fully selectable via `GET /api/v1/departments`.
  - While a user picker can enrich `SCR-PRJ-03` with multi-select initial members once available, project creation is not fundamentally blocked if initial members are omitted.

---

## Add Member requirement

- **DTO Contract**: `AddProjectMemberRequest` (`userId: UUID`, `projectRole: ProjectRole`). Both are mandatory (`@NotNull`).
- **Service Truth**: In `ProjectMemberApplicationService.addMember`:
  - `userId` must refer to an existing user (`userRepository.findActiveById(userId)`).
  - Candidate user must be active: `user.getStatus() == UserStatus.ACTIVE`.
  - Candidate user must not already be an active project member: `projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, userId)` must be `false` (otherwise `PROJECT_MEMBER_ALREADY_EXISTS`).
  - Inactive historical members are reactivated with their new role.
  - No cross-department restriction exists (members can belong to any department).
- **Classification**: **`ADD_MEMBER_TRULY_BLOCKED_BY_USER_PICKER`**.
  - Without an unprivileged search/lookup source, end users cannot safely specify `userId`.

---

## Admin API assessment

- **Endpoint**: `GET /api/v1/admin/users`.
- **RBAC Matrix**: Controlled by `USER_READ`, granted exclusively to `ADMIN`.
- **Overprivilege Risk**:
  - Exposes sensitive personal data: private phone numbers (`phoneNumber`), system role assignments (`roles`), account statuses (`LOCKED`, `DISABLED`), and account audit versioning.
  - Exposing this endpoint to Project Managers or broadening `USER_READ` violates security boundaries, ISO/IEC 27001 data minimization standards, and project decisions D-014/D-015.
- **Assessment Verdict**: **`ADMIN_USER_API_OVERPRIVILEGED_FOR_PROJECT_PICKER`**.
  - We strictly reject widening `USER_READ` or exposing `/admin/users` to non-admin roles.

---

## Chosen directory contract

We adopt an enterprise-standard, purpose-scoped public employee directory endpoint:

$$\mathbf{GET\ /api/v1/directory/users}$$

### Rationale and Trade-off Comparison:
1. **Generic Directory (`GET /api/v1/directory/users`) [CHOSEN]**:
   - Mirrors enterprise platforms (Microsoft Graph `/users`, Google Workspace Directory, Slack `/users.list`, Jira user picker).
   - Serves `SCR-PRJ-07` (Add Project Member), `SCR-PRJ-03` (Create Project initial members), and future Phase 15 assignment flows (Asset, Service Request).
   - Zero coupling to the Project domain; resides cleanly in `com.worksphere.identity` module.
   - Clean security boundary separating administrative user management (`/admin/users`) from workplace employee discovery (`/directory/users`).
2. **Project-Scoped Candidates (`GET /api/v1/projects/{projectId}/member-candidates`) [REJECTED]**:
   - Cannot support pre-creation initial member selection (`SCR-PRJ-03`) because `projectId` does not exist prior to project creation.
   - Forces redundant, duplicate candidate-search endpoints for every other module in Phase 15 (e.g. `/assets/candidates`, `/service-requests/candidates`).

---

## Response minimization

Data minimization (GDPR / ISO 27001 / OWASP API Security) is strictly applied. The endpoint returns a lightweight workplace contact card:

```typescript
export interface UserDirectoryItem {
  id: string; // UUID
  username: string; // Handle/login identifier
  fullName: string; // Display name
  email: string; // Official work email
  avatarUrl: string | null; // Avatar image URL
  departmentName: string | null; // Primary department
}
```

### Explicitly Excluded Fields:
- System security roles (`roles`) and permissions (`permissions`)
- Sensitive contact data (`phoneNumber`)
- Account security flags (`status`, `lockedAt`, `failedLoginCount`, `lastLoginAt`)
- Password and session tokens (`passwordHash`, `refreshToken`)
- Audit metadata (`createdAt`, `updatedAt`, `version`, `deleted`)

---

## Search/pagination

- **HTTP Method**: `GET`
- **Path**: `/api/v1/directory/users`
- **Query Parameters**:
  - `search` (optional, string, trimmed): Matches case-insensitively against `fullName`, `username`, or `email`.
  - `departmentId` (optional, UUID): Filters candidate users by department.
  - `page` (optional, integer, 0-based): Default `0`.
  - `size` (optional, integer): Default `20`, maximum `100`.
  - `sort` (optional, string): Default `fullName,asc`.
- **Response Format**: `ApiResponse<PagedData<UserDirectoryItem>>`
- **Performance**: Leverages the existing index `idx_users_deleted_status_dept` and composite search criteria on `UserRepository.searchUsers`.

---

## Eligibility

The directory query enforces the strict invariant that only active, uncompromised accounts can be returned:
- `deleted = false`
- `status = UserStatus.ACTIVE`

Excluded account statuses:
- `PENDING` (Account unverified)
- `LOCKED` (Account locked due to authentication failures or admin intervention)
- `DISABLED` (Account deactivated)
- `DELETED` (Soft-deleted)

---

## Permission model

- **Authorization Principle**: Workplace Directory Discovery.
- **Enforcement**: `@SecurityRequirement(name = "bearerAuth")` open to all **authenticated active users**.
- **Precedent**: Mirrors `DepartmentController.getDepartments()` (`GET /api/v1/departments`), which is accessible to any authenticated employee without requiring administrative privileges.
- **Benefits**:
  - **Zero Flyway migrations**: Eliminates the need to alter the canonical 29-permission RBAC seed matrix (`V011__seed_roles_and_permissions.sql`).
  - **No privilege escalation**: Does not grant any write, update, or administrative capabilities.
  - **Universal workplace collaboration**: Enables employees, team leads, and project managers to discover colleagues across projects, tasks, and requests.

---

## Candidate filtering

- **Server-Side**: The directory returns all active employees in the organization matching search criteria.
- **Client-Side in `SCR-PRJ-07 Add Member`**:
  - The mobile screen already has the current project's member list loaded (`useProjectMembers`).
  - The picker UI maps existing active member IDs into a Set (`existingMemberUserIds`).
  - Any candidate user whose `id` exists in `existingMemberUserIds` is visually indicated as `(Đã tham gia)` and disabled from selection.
  - This eliminates duplicate submission attempts while keeping the server directory API generic and cache-friendly.
- **No Artificial Restrictions**: Candidates are not artificially filtered by department or role, reflecting backend domain truth.

---

## Create-project strategy

1. **Phase 14E Execution**:
   - `SCR-PRJ-03 Create Project` will be implemented with mandatory fields (`code`, `name`, `startDate`, `plannedEndDate`, `priority`) and `departmentId` selector (from `GET /api/v1/departments`).
   - `initialMemberIds` can be safely populated using the new directory selector OR left empty (in which case the creator is the initial Project Manager).
2. **Canonical Workflow Alignment**:
   - Users can create the project directly, then immediately transition to `SCR-PRJ-06/SCR-PRJ-07` to configure project members with distinct roles (`PROJECT_MANAGER`, `TEAM_LEADER`, `MEMBER`, `OBSERVER`).

---

## Task future reuse

- In the Task Module (`SCR-TSK-03 Create Task`, `SCR-TSK-04 Edit Task`), task assignees MUST be project members (`TASK_ASSIGNEE_NOT_PROJECT_MEMBER`).
- Therefore, Task Assignee picker naturally queries `GET /api/v1/projects/{projectId}/members`.
- For other collaborative features (Task watchers, comment mentions, Service Request assignments, Asset assignments), the resolved `GET /api/v1/directory/users` contract provides a single, unified enterprise solution.

---

## Mobile contract

```typescript
// mobile/src/features/directory/api/directoryTypes.ts
export interface UserDirectoryItem {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  departmentName: string | null;
}

export interface UserDirectorySearchParams {
  search?: string;
  departmentId?: string;
  page?: number;
  size?: number;
}

// mobile/src/features/directory/api/directoryApi.ts
export const directoryApi = {
  searchUsers: async (params: UserDirectorySearchParams): Promise<PagedData<UserDirectoryItem>> => {
    const response = await apiClient.get<ApiResponse<PagedData<UserDirectoryItem>>>('/directory/users', {
      params: {
        search: params.search?.trim() || undefined,
        departmentId: params.departmentId || undefined,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });
    return response.data.data;
  },
};
```

---

## Picker UX

- **Component**: `UserPickerModal` (built using React Native primitive `Modal`).
- **Interaction Flow**:
  1. Trigger button: `"Chọn thành viên"` / `"Thêm thành viên"`.
  2. Modal opens with auto-focused `SearchBar` and initial 20 active users loaded.
  3. 300ms internal debounce on search input.
  4. Each item displays Avatar/initials, `fullName`, `email`, and `departmentName`.
  5. Touch targets $\ge 48\,\text{dp}$ with complete accessibility labels.
  6. Infinite scroll via `FlatList` with `onEndReached` and `hasNext` guard.
  7. In `SCR-PRJ-07`: Single-select mode. Tapping an eligible candidate selects them and advances to role selection (`PROJECT_MANAGER`, `TEAM_LEADER`, `MEMBER`, `OBSERVER`).
  8. In `SCR-PRJ-03`: Multi-select mode with checkmarks and selected counter.
- **Safety**: Zero raw UUID inputs or displays anywhere in the UI.

---

## Security

| Threat | Impact | Grounded Architecture Mitigation |
| :--- | :--- | :--- |
| **User Enumeration / Scraping** | Medium | Strict pagination (`size` clamped to 100 max). Requires authenticated Bearer token. |
| **PII / Security Leakage** | High | Response minimization strictly excludes phone numbers, password metadata, failed attempts, roles, and audit timestamps. |
| **Inactive User Assignment** | Medium | Persistence query strictly enforces `u.deleted = false AND u.status = 'ACTIVE'`. |
| **Privilege Escalation** | High | Endpoint located at `/api/v1/directory/users` completely isolated from `/api/v1/admin/users`. No administrative mutations exposed. |
| **Injection Attacks** | Medium | Parameterized JPA queries with sanitized string matching via `LOWER(CONCAT('%', :search, '%'))`. |

---

## Gap patches

To safely resolve the blocker without violating phase boundaries or risking regressions, we define two focused, auditable gap patches:

1. **`Phase 14E-G1: Backend Directory Contract`**:
   - Create `UserDirectoryResponse` record.
   - Implement `searchDirectory` in `UserManagementApplicationService` using existing `UserRepository.searchUsers`.
   - Expose `GET /api/v1/directory/users` in `UserDirectoryController` authenticated via Bearer token.
   - Comprehensive unit and MockMvc tests (search, pagination, active-only filter, PII exclusion).
   - Independent audit gate.
2. **`Phase 14E-G2: Mobile Directory Foundation & Picker Component`**:
   - Implement `directoryTypes.ts` and `directoryApi.ts`.
   - Build `useUserDirectory` data hook with debounce and pagination.
   - Build accessible `UserPickerModal` component (single-select & multi-select).
   - Comprehensive unit and render tests.
   - Independent audit gate.
3. **`Phase 14E: Resume Project Management Implementation`**:
   - Resume `SCR-PRJ-03` through `SCR-PRJ-09` implementation with unblocked reference data.

---

## 14E resume criteria

Phase 14E can resume when:
1. `GET /api/v1/directory/users` is implemented, tested, and audited in the backend (`Phase 14E-G1`).
2. `UserPickerModal` is implemented, tested, and audited in the mobile app (`Phase 14E-G2`).
3. Both gap patches achieve 100% test pass rates and zero drift against canonical specifications.

---

## Conclusion

**PHASE_14E_REFERENCE_CONTRACT_RESOLVED_READY_FOR_GAP_PATCH**
