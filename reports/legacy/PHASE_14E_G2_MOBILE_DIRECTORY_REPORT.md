# PHASE 14E-G2 MOBILE USER DIRECTORY FOUNDATION & PICKER REPORT

## Checkpoint

- **Repository**: `D:\WorkSphere`
- **Branch**: `main`
- **Baseline Checkpoint**: `c555ca76b3f21321bea4b567370df12303298295` (`feat(identity): add authenticated user directory`)
- **Remote Verification**: `HEAD == origin/main` verified clean before execution.
- **Scope Boundary**: Mobile foundation and reusable `UserPickerModal` component for human-readable user selection per architecture decision **D-062**. Strictly zero Project Management screen modifications (`SCR-PRJ-03..09` remains BLOCKED pending independent audit), zero backend changes, zero database migrations, and zero new dependencies.

---

## Architecture Alignment (D-062)

Implemented strictly according to architecture decision **D-062** and `reports/PHASE_14E_REFERENCE_DATA_CONTRACT_RESOLUTION.md`:
- Integrates with the authenticated directory endpoint `GET /api/v1/directory/users`.
- Encapsulates user directory access within a dedicated feature domain: `mobile/src/features/directory/`.
- Eliminates raw UUID input from the user interface. Project managers and employees interact only with human-readable workplace identities (`fullName`, `username`, `email`, `departmentName`).
- UUIDs are maintained internally as stable opaque transport identifiers for entity references.

---

## Mobile Transport Layer

### 1. Transport Interfaces & Contracts (`api/directoryTypes.ts`)
- **`UserDirectoryItem`**:
  ```ts
  export interface UserDirectoryItem {
    id: string; // UUID
    username: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    departmentName: string | null;
  }
  ```
- **`UserDirectoryQuery`**:
  ```ts
  export interface UserDirectoryQuery {
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    departmentId?: string;
  }
  ```
- **Frozen Constants**:
  - `DIRECTORY_DEFAULT_PAGE_SIZE = 20`
  - `DIRECTORY_MAX_PAGE_SIZE = 100`
  - `DIRECTORY_ALLOWED_SORT = 'fullName,asc'`
- **Runtime Validation Type Guards**:
  - `isUserDirectoryItem(value: unknown): value is UserDirectoryItem`: Validates shape, non-empty UUID string, strings for username, fullName, email, and nullable avatarUrl/departmentName.
  - `isUserDirectoryPage(value: unknown): value is PagedData<UserDirectoryItem>`: Validates paged envelope metadata and item collection.
- **Error Presentation Model**:
  - `mapDirectoryError(err: unknown): DirectoryPresentationError`: Maps HTTP 401 (`AUTH_REQUIRED`), HTTP 403 (`ACCESS_DENIED`), HTTP 400 (`INVALID_QUERY`), and network/timeout errors into user-friendly Vietnamese presentation strings with retryable flags.

### 2. Directory API Client (`api/directoryApi.ts`)
- Implements `directoryApi.searchUsers(query?: UserDirectoryQuery): Promise<PagedData<UserDirectoryItem>>`.
- Queries path `/directory/users` via configured `apiClient` (`baseURL` points to `/api/v1`).
- Enforces normalized query serialization: trims search whitespace, omits empty strings, clamps page $\ge 0$, and validates sort against whitelist.

---

## Custom Directory Hook (`hooks/useUserDirectory.ts`)

Encapsulates data fetching, debouncing, pagination, concurrency, and lifecycle control:
- **300ms Debounce**: Input search queries are debounced by exactly 300ms. Keystrokes within the debounce window cancel previous timers. Unmounting immediately clears pending timers.
- **Monotonic Generation Counter (`queryGenerationRef`)**: Every new query replacement increments the generation counter. Out-of-order responses from stale queries are automatically discarded (latest-query-wins concurrency).
- **Append Locking (`paginationLockRef`)**: Prevents duplicate in-flight requests during `loadMore`. Discards append responses if search criteria changed while pagination was in flight.
- **Item Deduplication**: Merges paged items by unique `user.id`, updating existing items in place while preserving backend sort ordering.
- **Lifecycle Gating (`enabled` option)**: When `enabled: false` (e.g. picker modal is hidden), network queries and debounce timers are suspended.

---

## Reusable User Picker Modal (`components/UserPickerModal.tsx`)

A standalone, accessible React Native modal dialog for employee selection:
- **Selection Modes**:
  - `mode="single"`: Exclusive selection using radio indicators; clicking another user switches selection immediately.
  - `mode="multiple"`: Checkbox indicators with counter badge on confirm button (`Xác nhận (N)`).
- **Strict Privacy Invariant**:
  - **Zero Raw UUIDs Rendered**: Verified that no raw UUID string appears in any Text or Accessibility label. All user representations display `fullName`, `@username`, `email`, and `departmentName`.
- **Controlled Draft State**:
  - Manages selection drafts locally (`draftSelectedIdsRef`, `knownUsersMapRef`).
  - Canceling or closing the modal cleanly discards unconfirmed draft selections without mutating the caller's state.
  - Confirming emits the complete `UserDirectoryItem[]` models to `onConfirm`.
- **Disabled Items Support (`disabledIds` & `disabledReason`)**:
  - Accepts `disabledIds: string[]` (e.g. users who are already project members).
  - Renders disabled badges with customizable explanation (default `"Đã tham gia"`).
  - Disables touch interaction and sets `accessibilityState={{ disabled: true }}`.
- **Accessibility & UX**:
  - Meets WCAG touch target standards ($\ge 48\,\text{dp}$).
  - Full screen reader labels (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`).
  - Integrates `SearchBar`, `EmptyState`, `ErrorState`, and `LoadingIndicator` from shared design system.

---

## Verification & Test Results

### 1. Dedicated Directory Test Suites
- **`__tests__/directory/directoryTypes.test.ts`** (10 tests):
  - Validates type guards with valid objects, malformed shapes, corrupted types, non-UUID strings, and missing fields.
  - Validates error mapper across 400, 401, 403, 500, network error, and unknown error types.
- **`__tests__/directory/directoryApi.test.ts`** (7 tests):
  - Validates URL `/directory/users`, param serialization, search trimming, page size clamping, sort defaults, and API envelope extraction.
- **`__tests__/directory/useUserDirectory.test.tsx`** (13 tests):
  - Validates initial mount query, `enabled: false` suspension, 300ms debounce threshold, rapid keystroke cancellation, unmount cleanup, latest-query-wins, stale failure protection, pagination `loadMore`, deduplication, and retry.
- **`__tests__/directory/UserPickerModal.test.tsx`** (10 tests):
  - Validates modal visibility gating, zero raw UUID rendering, single-select confirmation, single-select item switching, multi-select toggling with counter, `disabledIds` enforcement, cancellation handling, loading indicator, empty state, and error retry.
- **Directory Test Summary**: **4/4 suites PASS**, **40/40 tests PASS** (0 failures, 0 skipped).

### 2. Full Mobile Test Baseline
- **Execution**: `npm test -- --runInBand`
- **Result**: **54/54 test suites PASS**, **483/483 tests PASS** (0 failures, 0 skipped).
- **Prior Baseline**: 50 test suites, 443 tests $\rightarrow$ New baseline: 54 test suites, 483 tests (+4 suites, +40 tests).

### 3. Static Quality Gates
- **ESLint**: `npm run lint` $\rightarrow$ **0 errors, 0 warnings**.
- **TypeScript**: `npm run typecheck` $\rightarrow$ **0 errors** (`tsc --noEmit` clean).

### 4. Android Build Verification
- **Command**: `.\gradlew.bat assembleDebug --no-daemon`
- **Environment**: Java 25 JBR (`D:\Android\jbr`), Android SDK (`D:\AndroidSDK`).
- **Result**: **BUILD SUCCESSFUL** (exit code 0).

---

## Roadmap & Next Phase State

- **Phase 14E-G2**: **COMPLETED & READY FOR AUDIT**.
- **Phase 14E Core (`SCR-PRJ-03..09`)**: **BLOCKED** pending independent audit of Phase 14E-G2.
- **Phase 14F / Phase 15**: **NOT STARTED**.
