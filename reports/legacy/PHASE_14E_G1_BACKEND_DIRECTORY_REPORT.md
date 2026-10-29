# PHASE 14E-G1 BACKEND USER DIRECTORY REPORT

## Checkpoint

- **Repository**: `D:\WorkSphere`
- **Branch**: `main`
- **Baseline Checkpoint**: `57c428daa14842d3d7ee81fba1a2ace75988b737` (`docs(project): resolve phase 14e reference data contract`)
- **Remote Verification**: `HEAD == origin/main` verified clean before execution.
- **Scope Boundary**: Backend-only implementation of `GET /api/v1/directory/users` per decision D-062. Zero mobile changes, zero database migrations, zero Project domain changes.

---

## Frozen contract

Implemented strictly according to architecture decision **D-062** and `reports/PHASE_14E_REFERENCE_DATA_CONTRACT_RESOLUTION.md`:
- **Path**: `GET /api/v1/directory/users`
- **Module Placement**: Identity module (`com.worksphere.identity.web.UserDirectoryController`).
- **Authorization**: Open to any authenticated user with an active account via Bearer token (`AUTHENTICATED`).
- **Purpose**: Provides a least-privilege, privacy-preserving employee directory for human-readable user selection in project management (`SCR-PRJ-03`, `SCR-PRJ-07`) and future collaboration workflows without exposing administrative APIs or requiring raw UUID entry.

---

## Repository reuse

- **Existing JPA Query Reused**: `UserRepository.searchUsers` in `com.worksphere.identity.infrastructure.persistence.UserRepository`:
  ```sql
  SELECT u FROM User u WHERE u.deleted = false
  AND (CAST(:search AS string) IS NULL
       OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
       OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
       OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
  AND (:departmentId IS NULL OR u.departmentId = :departmentId)
  AND (:status IS NULL OR u.status = :status)
  ```
- **Zero Duplicate Queries**: Reused `UserRepository.searchUsers` as-is at the persistence layer. No redundant queries or schema modifications introduced.

---

## Endpoint

- **Controller**: `UserDirectoryController` (`@RestController`, `@RequestMapping("/api/v1/directory/users")`, `@Tag(name = "User Directory")`, `@SecurityRequirement(name = "bearerAuth")`).
- **Parameters**:
  - `search`: String (optional, trimmed)
  - `departmentId`: UUID (optional)
  - `page`: int (default `0`, must be $\ge 0$)
  - `size`: int (default `20`, must be between $1$ and $100$)
  - `sort`: String (default `fullName,asc`)
- **Response Format**: `ResponseEntity<ApiResponse<PagedData<UserDirectoryItemResponse>>>`

---

## Security

- **Authentication Invariant**: Enforced by Spring Security (`.anyRequest().authenticated()`). Anonymous calls return HTTP 401 Unauthorized.
- **RBAC Isolation**: Completely isolated from administrative controller `/api/v1/admin/users`. Ordinary employees, project managers, and administrators can all safely access directory discovery without granting administrative `USER_READ` privileges.
- **Zero Schema/Migration Footprint**: Operates cleanly without modifying `permissions` or `role_permissions` seed tables.

---

## Search

- **Search Normalization**: Outer whitespace is trimmed. Whitespace-only searches (e.g. `"   "`) are normalized to `null` and return all eligible active users.
- **Target Fields**: Matches case-insensitively across `fullName`, `username`, and `email`.
- **Search Boundary**: Does not search or match against `phoneNumber`, ensuring employee personal phone numbers are never discoverable through directory search.

---

## Active-user policy

The endpoint strictly enforces the active-user invariant at the JPA database query level:
$$\text{deleted} = \text{false} \land \text{status} = \text{UserStatus.ACTIVE}$$
- Excludes soft-deleted accounts (`deleted = true`).
- Excludes inactive lifecycle statuses: `PENDING`, `LOCKED`, `DISABLED`.
- Verified by integration test `UserDirectoryMockMvcTest.searchDirectory_activeOnly_excludesInactiveAndDeletedUsers`.

---

## Department filter

- When `departmentId` is supplied, query strictly restricts results to active users assigned to that department (`u.departmentId = :departmentId`).
- Department names are batch-resolved in a single query via `departmentRepository.findAllById(departmentIds)` to eliminate N+1 query overhead.
- When an unknown or non-existent `departmentId` is passed, the endpoint returns an empty page (`items: []`, `totalItems: 0`) with HTTP 200 rather than an unhandled error, conforming to canonical pagination behavior.

---

## Pagination

- **0-Based Indexing**: `page = 0` represents the first page. Negative page index (`page < 0`) triggers validation error: `BAD_REQUEST` (HTTP 400).
- **Size Bounds**: Default `20`, maximum `100`. Sizes outside $1 \le \text{size} \le 100$ trigger validation error: `BAD_REQUEST` (HTTP 400).
- **Sort Whitelist**: Permitted sort properties are restricted to `fullName`, `username`, and `email`. Default sort order is `fullName,asc`. Unknown sort fields safely fall back to default `fullName,asc`.
- **PagedData Metadata**: Correctly returns `items`, `page`, `size`, `totalItems`, `totalPages`, `hasNext`, `hasPrevious`.

---

## Response minimization

Adheres to strict ISO/IEC 27001 and OWASP API data minimization standards via `UserDirectoryItemResponse`:
- **Included Fields**: `id` (UUID), `username`, `fullName`, `email`, `avatarUrl` (nullable), `departmentName` (nullable).
- **Explicitly Excluded**: `phoneNumber`, `roles`, `permissions`, `status`, `lastLoginAt`, `passwordHash`, `failedLoginAttempts`, `lockedUntil`, `version`, `createdAt`, `updatedAt`, `deleted`. Verified via JSON path assertions in `searchDirectory_dataMinimization_excludesAdminMetadata`.

---

## Tests

New test suite: `backend/src/test/java/com/worksphere/identity/UserDirectoryMockMvcTest.java` (11 tests, all passing):
1. `searchDirectory_unauthenticated_returns401`: Verifies unauthenticated calls receive 401.
2. `searchDirectory_authenticatedEmployee_returns200`: Verifies ordinary employees can search directory.
3. `searchDirectory_authenticatedPM_returns200`: Verifies Project Managers can search directory.
4. `searchDirectory_authenticatedAdmin_returns200`: Verifies Admins can search directory.
5. `searchDirectory_dataMinimization_excludesAdminMetadata`: Verifies exclusion of PII and security metadata in JSON.
6. `searchDirectory_activeOnly_excludesInactiveAndDeletedUsers`: Verifies PENDING, LOCKED, DISABLED, and soft-deleted accounts are excluded.
7. `searchDirectory_searchMatchesNameUsernameEmail`: Verifies search matching on name, username, and email.
8. `searchDirectory_searchNormalization`: Verifies whitespace trimming, whitespace-only behavior, and phone number exclusion.
9. `searchDirectory_departmentFilter`: Verifies filtering by valid and unknown department IDs.
10. `searchDirectory_paginationAndSort`: Verifies page navigation, custom size, sort direction, and metadata.
11. `searchDirectory_paginationValidationErrors`: Verifies negative page and invalid sizes return HTTP 400 `BAD_REQUEST`.

---

## Backend build

- Maven Compiler: Java release 21 target.
- Checkstyle audit: **0 Checkstyle violations**.
- Full Test Suite Results:
  - Total Tests Run: **318 tests** (Baseline 307 + 11 new User Directory tests).
  - Failures: **0**
  - Errors: **0**
  - Skipped: **0**
  - Build Status: **BUILD SUCCESS** (exit code 0).

---

## Security scan

- No credentials, secrets, or raw passwords logged.
- Directory search query logging does not log user PII at INFO level.
- No changes to RBAC migrations or database seed scripts.
- No modifications to Project domain or Auth mobile modules.

---

## Scope

- Zero modifications to `mobile/**`.
- Zero modifications to `backend/src/main/resources/db/migration/**`.
- Zero modifications to Project module business logic.
- Diff strictly constrained to Identity module directory contract and tests.

---

## Files

### Created:
- `backend/src/main/java/com/worksphere/identity/api/response/UserDirectoryItemResponse.java`
- `backend/src/main/java/com/worksphere/identity/web/UserDirectoryController.java`
- `backend/src/test/java/com/worksphere/identity/UserDirectoryMockMvcTest.java`
- `reports/PHASE_14E_G1_BACKEND_DIRECTORY_REPORT.md`

### Modified:
- `backend/src/main/java/com/worksphere/identity/application/UserManagementApplicationService.java`
- `reports/PROJECT_STATE.md`
- `reports/HANDOFF.md`

---

## G2 readiness

- Subphase 14E-G1 backend contract is complete and verified against PostgreSQL Testcontainers.
- The repository is fully ready for **Phase 14E-G2 (Mobile Directory Foundation & Picker Component)**.

---

## Conclusion

**PHASE_14E_G1_PASS_PUSHED**
