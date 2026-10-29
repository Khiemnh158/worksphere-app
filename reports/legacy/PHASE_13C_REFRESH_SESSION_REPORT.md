# Phase 13C Implementation Report: Single-Flight Refresh, Session Bootstrap, and Remote Logout

## Executive Summary

Phase 13C establishes robust, single-flight token refresh coordination, cold-start secure session bootstrap from hardware Keychain, and remote/local logout semantics for WorkSphere Mobile. All changes adhere strictly to project canonical documentation, avoiding out-of-scope package additions, preserving backwards compatibility, and maintaining security invariants (zero tokens in React state, secure storage persistence before memory commitment, and synchronous concurrency mutex guards).

---

## 1. Key Architectural Implementations

### 1.1 Dedicated Refresh Transport & Single-Flight Coordinator (`refreshCoordinator.ts`)
- **Isolated Transport**: `createRefreshTransport()` instantiates a pure Axios client configured with identical baseURL and timeout semantics but completely stripped of request/response authentication interceptors. This eliminates circular 401 interceptor loops.
- **Single-Flight Concurrency**: A module-private promise (`refreshPromise`) coalesces multiple concurrent refresh requests into a single network execution (`POST /auth/refresh`). When the flight finishes, `refreshPromise` is reset to `null`.
- **Atomic Token Rotation**: Reads the current refresh token from secure Keychain hardware, invokes the refresh endpoint, validates response schema, writes the newly rotated refresh token into Keychain, and only then commits the new access token to in-memory store (`accessTokenStore`). If Keychain write fails, the in-memory access token is cleared and best-effort cleanup of Keychain occurs.

### 1.2 Enhanced API Client Interceptors (`apiClient.ts`)
- **Refresh Eligibility Verification**: Protected requests encountering HTTP 401 are filtered through 5 strict eligibility rules:
  1. Status must be 401.
  2. Request must not have already undergone retry (`!config._retry`).
  3. Request must not explicitly opt out (`!config.skipAuthRefresh`).
  4. Request must present an `Authorization: Bearer` header.
  5. URL must not belong to non-refreshable endpoints (`/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/logout`, `/auth/logout-all`).
- **Retry-Once Guarantee**: Upon successful single-flight refresh, the original failed request is tagged with `_retry = true`, its `Authorization` header is updated with the fresh access token, and it is re-dispatched. If the retried request fails with 401 again, unauthorized notification is dispatched immediately without re-triggering refresh.

### 1.3 Cold-Start Session Bootstrap (`AuthProvider.tsx`)
- **Keychain Inspection**: On application startup or when invoked via `retryBootstrap()`, `runBootstrap()` inspects Keychain storage for a persisted refresh token.
- **Session Transition**:
  - If no token exists: Dispatches `INITIALIZATION_COMPLETED_UNAUTHENTICATED`.
  - If token exists: Coordinates token refresh via `refreshAccessToken()`, fetches authenticated user profile via `authApi.getCurrentUser()`, and dispatches `BOOTSTRAP_SUCCEEDED`.
- **Offline / Network Preservation**:
  - Transient network or timeout errors trigger `BOOTSTRAP_RECOVERABLE_FAILED` with `canRetryBootstrap = true`. The persisted refresh token in Keychain is preserved intact.
  - Terminal errors (401 invalid/expired token, 403, revoked session) trigger terminal cleanup and transition to `UNAUTHENTICATED`.
- **Epoch Guard**: Uses `sessionEpochRef` to reject stale asynchronous resolutions if a user triggers concurrent actions or explicit logout during an active bootstrap cycle.

### 1.4 Resilient Remote & Local Logout
- **Remote Logout**: Calls `authApi.logout({ refreshToken })` with `skipAuthRefresh: true` while holding synchronous lock `logoutInFlightRef`. Regardless of network reachability or HTTP response, local session teardown (clearing memory access token and Keychain refresh token) is guaranteed.
- **Logout-All Support**: Provides optional `logoutAll()` for multi-device revocation.
- **Local Fallback**: `logoutLocal()` allows immediate offline session termination.

### 1.5 UI Navigation Integration (`RootNavigator.tsx`)
- Handles recoverable bootstrap failure states by rendering an accessible error view with "Thử lại" (`retryBootstrap`) and "Đăng nhập lại" (`logoutLocal`), preventing users from being stuck on an infinite loading screen during offline app startup.

---

## 2. Test & Verification Matrix

### 2.1 Mobile Unit & Integration Tests (Jest)
- Total test suites: **32 passed, 32 total**
- Total tests: **269 passed, 269 total** (0 failures, 0 skipped)
- Hardened test suites:
  - `mobile/__tests__/auth/sessionCredentialCoordinator.test.ts` (4 tests: deterministic Login-wins, deterministic Logout-wins, queue failure recovery, bootstrap access token cleanup)
  - `mobile/__tests__/auth/refreshCoordinator.test.ts` (9 tests: single-flight deduplication, atomic rotation, failure handling, isolation, stale refresh race A, stale refresh race B, generation coexistence)
  - `mobile/__tests__/auth/AuthProvider.bootstrap.test.tsx` (7 tests: absent token unauthenticated, successful bootstrap, recoverable network preservation, terminal 401 cleanup, concurrent 401 terminal cleanup coalescing, retry recovery)
  - `mobile/__tests__/auth/AuthProvider.logout.test.tsx` (5 tests: remote logout cleanup, network failure resilience, logoutAll, mutex locks)
  - `mobile/__tests__/api/apiClient.test.ts` (14 tests: retry-once, 401 handling, non-refreshable endpoints exclusion, handler ownership unregister safety)
  - `mobile/__tests__/auth/authReducer.test.ts` (11 tests: state machine transitions, canRetryBootstrap lifecycle, security invariants)

### 2.2 Static Analysis & Quality Gates
- `npm config get allow-scripts`: Verified (`opencode-ai`)
- `npm run lint`: **0 errors, 0 warnings**
- `npm run typecheck`: **0 errors**

### 2.3 Android Build & Smoke Test
- Gradle Build: `.\gradlew.bat assembleDebug --no-daemon` -> **BUILD SUCCESSFUL** (203 actionable tasks, exit code 0)
- Device Verification: `emulator-5554` running Android 15 (API 35).
- APK Installation: `app-debug.apk` successfully streamed and installed (`Success`).
- Runtime Smoke Test: Application `com.workspheremobile/.MainActivity` launched successfully (PID `24109`), SoLoader initialized without crash, and process terminated cleanly.

---

## 3. Scope Boundary Enforcement
- No packages added or upgraded in `package.json`.
- Zero changes to backend Java source code or Flyway SQL migrations.
- Out-of-scope Phase 13D features (Profile, Change Password, Forgot/Reset Password, User Settings) remain untouched.
- Invariants verified: Auth tokens are never stored in React state or plain text storage.

---

## 4. Phase 13C Concurrency Hardening Patch Summary

### 4.1 Findings Resolved
1. **STALE_REFRESH_TOKEN_COMMIT_RISK (HIGH)**:
   - Added monotonic `refreshGeneration` counter and `invalidateRefreshCoordinator()` in `refreshCoordinator.ts`.
   - Verified generation in 3 critical positions: (1) before HTTP call, (2) before writing rotated token to Keychain, (3) after Keychain write before publishing access token into memory.
   - Synchronously invoked `invalidateRefreshCoordinator()` in `AuthProvider.tsx` upon `login`, `logout`, `logoutAll`, `logoutLocal`, and terminal cleanup.
   - Any stale flight in progress aborts immediately with rejection and does not overwrite current storage or clear newer tokens.

2. **TERMINAL_CLEANUP_DEDUP_GAP (MEDIUM)**:
   - Added `terminalCleanupPromiseRef` in `AuthProvider.tsx`.
   - Multiple concurrent 401 terminal rejection errors coalesce into exactly one session cleanup, one Keychain clear, and one unauthenticated state dispatch.

3. **HANDLER_OWNERSHIP_RACE_NOTE (LOW/MEDIUM)**:
   - Implemented `registerUnauthorizedHandler` and `registerTokenRefreshHandler` in `apiClient.ts` returning unregister closures that check reference identity before clearing, preventing race conditions during provider unmount/remount.

---

## 5. Phase 13C Final Token Commit Serialization Patch

### 5.1 Architecture & Findings Resolved
1. **TOKEN_COMMIT_SERIALIZATION_GAP & STALE_REFRESH_KEYCHAIN_OVERWRITE_RISK**:
   - Created `mobile/src/app/auth/sessionCredentialCoordinator.ts`.
   - Unified all Keychain mutations and memory token updates under a single module-private FIFO promise queue (`credentialQueue`).
   - Every mutation is gated by `expectedGeneration`: if the session generation was invalidated before Keychain write completes, the mutation aborts without altering storage or overwriting newer session tokens.
   - All direct `secureStorage.setRefreshToken` and `secureStorage.clearRefreshToken` calls in `AuthProvider` and `refreshCoordinator` were migrated to the coordinator.

2. **LOGOUT_STALE_REFRESH_REPOPULATION_GAP & LOGIN_REFRESH_FINAL_TOKEN_TEST_GAP**:
   - Added deterministic integration tests in `sessionCredentialCoordinator.test.ts`:
     - `1. DETERMINISTIC LOGIN-WINS TEST`: Demonstrates that when a delayed refresh A is held during Keychain write while login B invalidates and commits, refresh A rejects and final Keychain / memory tokens belong exclusively to B.
     - `2. DETERMINISTIC LOGOUT-WINS TEST`: Demonstrates that when refresh A is delayed while logout occurs, refresh A rejects and final Keychain / memory state is strictly `null`.
     - `3. FAILURE RECOVERY TEST`: Proves that a failed credential transaction (e.g. Keychain write error) does not poison or block subsequent queued transactions.

---

## 6. Phase 13C Bootstrap Credential Mutation Patch

### 6.1 Architecture & Findings Resolved
1. **BOOTSTRAP_CREDENTIAL_MUTATION_BYPASS**:
   - Removed direct `accessTokenStore.clearAccessToken()` and `accessTokenStore.getAccessToken()` from `AuthProvider.tsx`.
   - Introduced `clearAccessTokenForBootstrap(expectedGeneration?)` and `hasActiveAccessToken()` in `sessionCredentialCoordinator.ts`.
   - `runBootstrap()` now purges stale in-memory access tokens through the serialized queue without touching or clearing persistent Keychain refresh tokens.
   - 100% of production credential mutations across mobile source now reside exclusively within `sessionCredentialCoordinator.ts`.

---

## 7. Phase 13C Strict Eligibility and Single Cleanup Owner Patch

### 7.1 Architecture & Findings Resolved
1. **AUTH_REFRESH_ELIGIBILITY_DRIFT**:
   - Gated automatic refresh in `isEligibleForRefresh` strictly to valid `ApiResponse` error envelopes containing `success === false` and `code === 'UNAUTHORIZED'`.
   - Non-envelope payloads (HTML error bodies, plain text) and envelopes missing `code` or bearing non-UNAUTHORIZED codes (e.g. `ACCOUNT_LOCKED`) never trigger refresh attempts.
   - Added exhaustive matrix test suite for payloads A through F in `apiClient.test.ts`.

2. **AUTH_TERMINAL_CLEANUP_DUPLICATION_RISK**:
   - Established `AuthProvider`'s registered unauthorized handler as the sole owner for terminal credential cleanup on server refresh rejections.
   - Removed secondary `clearSessionCredentials` call from `refreshCoordinator` on refresh endpoint failure; `refreshCoordinator` retains cleanup ownership strictly for local atomic commit failures (Keychain write failure).
   - Added deterministic test proving that when 3 concurrent protected requests fail refresh terminally, exactly 1 actual storage cleanup execution and exactly 1 transition to `UNAUTHENTICATED` occur.
