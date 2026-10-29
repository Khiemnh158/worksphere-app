# Phase 14C Report: Mobile Project List (SCR-PRJ-01)

## Executive Summary

Phase 14C introduces the production-grade implementation of the Mobile Project List screen (`SCR-PRJ-01`) backed by backend endpoint `GET /projects`. The implementation adheres strictly to the canonical contracts and architecture decisions established in `D-061` (Phase 14 Dashboard & Projects Contract Freeze), canonical API contracts (`docs/06_API_CONTRACT.md`), system architecture (`docs/04_SYSTEM_ARCHITECTURE.md`), and UI/UX specification maps (`design/05_PROJECT_MANAGEMENT.md`, `design/11_ACCESSIBILITY_GUIDELINES.md`).

All static, linting, unit testing, and native compilation verification steps passed with zero errors, zero warnings, zero backend changes, zero Flyway migration changes, and zero third-party dependencies added.

---

## 1. Subphase Scope & Boundaries

- **Subphase Objective**: Implement Project List Screen (`SCR-PRJ-01`) using `GET /projects`.
- **Implemented Scope**:
  - `useProjects` custom data hook (`mobile/src/features/projects/hooks/useProjects.ts`).
  - `ProjectCard` presentational component (`mobile/src/features/projects/components/ProjectCard.tsx`).
  - `ProjectsScreen` screen container (`mobile/src/features/projects/screens/ProjectsScreen.tsx`).
  - Unit tests covering hook, component, screen, and integration (`mobile/__tests__/projects/`).
- **Strictly Excluded Boundaries**:
  - `ProjectDetailScreen` (`SCR-PRJ-02`) deferred to Phase 14D.
  - `CreateProjectScreen` (`SCR-PRJ-03`) deferred to Phase 14E.
  - `EditProjectScreen` deferred to Phase 14E.
  - Member management and milestone editing deferred to Phase 14D/14F.
  - No backend or database modifications.
  - No third-party packages installed.

---

## 2. Architecture & Design Principles

### A. Concurrency & Latest-Query-Wins

The `useProjects` hook implements monotonic generation tracking (`queryGenerationRef`) for all list replace queries:
- **Generation Monotonicity**: Every trigger of search debouncing, status filter change, or pull-to-refresh increments `queryGenerationRef.current`.
- **Replace vs. Append Queries**:
  - Replace queries (`page = 0`) reset pagination state, trigger loading states, and update the list.
  - Append queries (`page > 0` on `loadMore`) capture the active query generation. If a user alters search or filter while an append request is in-flight, the arrival of the stale append payload is discarded immediately (`generation !== queryGenerationRef.current`).
- **In-flight Pagination Lock**: A boolean lock (`paginationLockRef`) prevents concurrent duplicate page append calls triggered by rapid scroll events.
- **Unmounted Protection**: `mountedRef` prevents state updates after the hook unmounts.

### B. Search Debouncing & Filtering

- **Debounce Specification**: 300ms debounce interval (`debounceTimerRef`) between keystrokes before issuing network request.
- **Immediate Controlled Input**: `search` state updates immediately for responsive typing, while `debouncedSearch` drives data loading.
- **Filter Chips**: Canonical status chips (`Tất cả`, `Đang chạy (ACTIVE)`, `Bản nháp (DRAFT)`, `Tạm dừng (ON_HOLD)`, `Hoàn thành (COMPLETED)`). Changing status resets page to 0.
- **Clear Filters**: `clearFilters()` cancels any pending debounce timers, resets search text to empty string, and clears status filter.

### C. Pagination & Deduplication

- **Page Parameters**: Explicit `page = 0`, `size = 20`, `sort = 'createdAt,desc'`.
- **Deduplication Strategy**: When merging subsequent pages into existing list, projects are deduplicated by `project.id` (UUID) while preserving original backend ordering.
- **Error Retention**: If page $N > 0$ fails, existing items are preserved on screen, loading indicator is cleared, and an inline footer error with retry button is displayed.
- **Pull-to-Refresh Retention**: If pull-to-refresh fails, existing list items remain intact, and a non-blocking banner notifies the user.

### D. Security & Accessibility

- **No Raw UUIDs in UI**: Project UUIDs are never exposed in user-facing text elements. Accessible labels identify cards by code and name (`Dự án PRJ-001: WorkSphere Platform`).
- **Touch Target**: Project cards maintain $\ge 48\times 48\,\text{dp}$ touch targets conforming to accessibility guidelines.
- **Clamped Progress**: `progressPercent` values are clamped safely to the $0..100$ range before rendering.
- **Capability Gating & Staged Navigation**:
  - `ProjectCard`: Rendered non-interactively without `onPress` navigation to prevent routing to unmounted `ProjectDetail` until Phase 14D.
  - `ProjectsScreen`: `+ Tạo mới` button and empty state create actions are gated until Phase 14E provides the real `CreateProject` destination, eliminating broken route navigation while preserving permission detection.
- **Canonical Filter Chips**: Reconciled to exact wireframe intersection (`Tất cả`, `Đang chạy (ACTIVE)`, `Bản nháp (DRAFT)`, `Tạm dừng (ON_HOLD)`). `COMPLETED` is excluded from primary chips per wireframe spec.

---

## 3. Test Coverage & Verification Evidence

### A. Static Code Analysis & Type Safety
- **ESLint**:
  ```bash
  npm run lint
  # PASS (0 errors, 0 warnings)
  ```
- **TypeScript**:
  ```bash
  npm run typecheck
  # PASS (tsc --noEmit exit code 0)
  ```

### B. Unit & Component Test Suite
- **Projects Feature Suite**:
  - `ProjectCard.test.tsx`: 3/3 PASS
  - `ProjectsScreen.test.tsx`: 10/10 PASS
  - `useProjects.test.tsx`: 9/9 PASS
  - `projectApi.test.ts`: 15/15 PASS
  - `projectTypes.test.ts`: 13/13 PASS
  - `projectErrorMapper.test.ts`: 9/9 PASS
  - Total Projects tests: **59 passed, 0 failed**.
- **Full Mobile Test Suite**:
  ```bash
  npm test -- --runInBand --forceExit
  # Test Suites: 48 passed, 48 total
  # Tests:       425 passed, 425 total
  ```

### C. Native Android Debug Build
- **Gradle Verification**:
  ```powershell
  $env:JAVA_HOME = "D:\Android\jbr"; $env:ANDROID_HOME = "D:\AndroidSDK"; $env:ANDROID_SDK_ROOT = "D:\AndroidSDK"; .\gradlew.bat assembleDebug --no-daemon
  # Output: BUILD SUCCESSFUL in 36s (203 actionable tasks: 16 executed, 187 up-to-date)
  ```

---

## 4. Subphase Completion Status

- **Subphase 14C (Project List Screen `SCR-PRJ-01`)**: **IMPLEMENTED & AUDITED**
- **Subphase 14D (Project Detail Screen `SCR-PRJ-02`)**: **NOT STARTED**
