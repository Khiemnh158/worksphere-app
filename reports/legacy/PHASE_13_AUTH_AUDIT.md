# PHASE 13 MOBILE AUTHENTICATION AUDIT

## 1. Checkpoint and Audit Context

- **Repository**: `D:\WorkSphere`
- **Base Checkpoint**: `a9c59259904f2dd6e9bd38e4ca63c1a88c89c474` (`feat(mobile): finalize pre-auth runtime readiness`)
- **Current Branch**: `main`
- **Audit Target**: Phase 13 Mobile Authentication (`docs/08_DEVELOPMENT_ROADMAP.md` Section 17, P0).
- **Implementation Status**: Phase 13 source implementation has **not** started.
- **Scope**: Native environment bridge, Xcode target membership, backend auth contracts, token lifecycle, session architecture, form architecture, error mapping, safe test-account policy, and provisioning requirements.

---

## 2. Pre-Auth Native Environment Bridge Audit

### 2.1. Android Environment Bridge
- **Status**: `VERIFIED_AND_LINKED`.
- `mobile/android/app/build.gradle` has `buildFeatures { buildConfig true }`.
- Injects compile-time string `BuildConfig.API_BASE_URL` with fail-fast validation (`normalizeAndValidateApiUrl`).
- Debug builds default safely to canonical emulator address `http://10.0.2.2:8080/api/v1` when property `-PWORKSPHERE_API_BASE_URL` is omitted.
- Release builds strictly require an explicit HTTPS URL (`-PWORKSPHERE_API_BASE_URL=https://...`), enforce `android:usesCleartextTraffic="false"`, and reject cleartext HTTP at Gradle configuration time.
- Registered via `EnvironmentConfigModule.kt` and `EnvironmentConfigPackage.kt` in `MainApplication.kt`.

### 2.2. iOS Environment Bridge & Xcode Target Membership
- **Status**: `RESOLVED_STATICALLY_DEFERRED_TO_MACOS`.
- `mobile/ios/WorkSphereMobile/Info.plist`: Defines `<key>WORKSPHERE_API_BASE_URL</key><string>$(WORKSPHERE_API_BASE_URL)</string>`.
- Native source files:
  - `mobile/ios/WorkSphereMobile/EnvironmentConfigModule.h`
  - `mobile/ios/WorkSphereMobile/EnvironmentConfigModule.m`
- **Resolution of `IOS_ENVIRONMENT_BRIDGE_TARGET_GAP`**:
  - The missing target membership gap identified during initial audit has been resolved in `mobile/ios/WorkSphereMobile.xcodeproj/project.pbxproj`:
    - `PBXBuildFile`: Registered `EnvironmentConfigModule.m in Sources` (`761780F22CA45674006654F2`).
    - `PBXFileReference`: Registered `EnvironmentConfigModule.h` (`761780F02CA45674006654F0`) with `sourcecode.c.h` and `EnvironmentConfigModule.m` (`761780F12CA45674006654F1`) with `sourcecode.c.objc`.
    - `PBXGroup`: Both files added to `WorkSphereMobile` source group.
    - `PBXSourcesBuildPhase`: Registered `EnvironmentConfigModule.m in Sources` exactly once. `EnvironmentConfigModule.h` is excluded from compile sources.
- **Contract Verification**:
  - Module exports `API_BASE_URL` reading `WORKSPHERE_API_BASE_URL` from main bundle `Info.plist`.
  - TypeScript `nativeEnvironment.ts` accesses `NativeModules.EnvironmentConfig.API_BASE_URL` matching the native export.
- **macOS Build Limitation**:
  - Physical compilation and `.xcconfig` release property verification remain deferred (`IOS_BUILD_ON_MACOS_DEFERRED`) due to running on a Windows host.

### 2.3. Release Downgrade & Protocol Safety Policy
- `mobile/src/shared/config/environment.ts`:
  - Enforces HTTPS for all production environments.
  - Normalizes base URL: strips trailing slashes and guarantees exactly one `/api/v1` suffix.
  - If `nativeUrl` is missing or empty in production mode, `getEnvironmentConfig()` throws a fail-safe exception instead of silently falling back to the emulator address.
  - `setEnvironmentConfig` enforces runtime downgrade protection (rejects switching an active production build to non-production).

---

## 3. Backend Auth Contracts and Invariants

All endpoints are implemented in `com.worksphere.identity` and aligned with `docs/06_API_CONTRACT.md` Section 8 & 9:

| Endpoint | Method | Security Level | Request DTO | Response Payload | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | `PUBLIC` | `LoginRequest` | `ApiResponse<AuthResponse>` | `IMPLEMENTED_AND_TESTED` |
| `/api/v1/auth/refresh` | `POST` | `PUBLIC_WITH_REFRESH_TOKEN` | `RefreshTokenRequest` | `ApiResponse<RefreshResponse>` | `IMPLEMENTED_AND_TESTED` |
| `/api/v1/auth/logout` | `POST` | `AUTHENTICATED` | `LogoutRequest` | `204 No Content` | `IMPLEMENTED_AND_TESTED` |
| `/api/v1/auth/logout-all` | `POST` | `AUTHENTICATED` | None | `204 No Content` | `IMPLEMENTED_AND_TESTED` |
| `/api/v1/auth/forgot-password`| `POST` | `PUBLIC` | `ForgotPasswordRequest`| `ApiResponse<Void>` | `IMPLEMENTED_AND_TESTED` |
| `/api/v1/auth/reset-password` | `POST` | `PUBLIC` | `ResetPasswordRequest` | `ApiResponse<Void>` | `IMPLEMENTED_AND_TESTED` |
| `/api/v1/me` | `GET` | `AUTHENTICATED` | None | `ApiResponse<UserProfileResponse>` | `IMPLEMENTED_AND_TESTED` |
| `/api/v1/me` | `PUT` | `PROFILE_UPDATE` | `UpdateProfileRequest` | `ApiResponse<UserProfileResponse>` | `IMPLEMENTED_AND_TESTED` |
| `/api/v1/me/password` | `PUT` | `AUTHENTICATED` | `ChangePasswordRequest`| `ApiResponse<Void>` | `IMPLEMENTED_NOT_FULLY_TESTED` |

---

## 4. Token Storage and Lifecycle Policy

### 4.1. Access Token Model
- **Lifetime**: 15 minutes (900 seconds).
- **Storage**: Strictly in-memory via `mobile/src/shared/storage/accessTokenStore.ts`.
- **Policy**: NEVER persisted to disk, AsyncStorage, or Keychain. Zero token logging. Automatically injected by Axios request interceptor as `Authorization: Bearer <token>`.

### 4.2. Refresh Token Model
- **Lifetime**: 30 days (2,592,000 seconds).
- **Storage**: Hardware-backed Keystore/Keychain via `mobile/src/shared/storage/secureStorage.ts` (`react-native-keychain`).
- **Scoping**: Service `worksphere.auth.refresh_token`, Account `refresh_token_account`.
- **Backend Storage**: Backend only stores SHA-256 hash (`RefreshToken.tokenHash`). Raw token is never stored in database.

### 4.3. Token Rotation and Single-Flight Refresh
- **Rotation**: Every successful refresh returns a new refresh token and revokes the previous token (`revokedAt = now()`, `replacedByTokenId = newToken.id`).
- **Single-Flight Guard**: Axios response interceptor must queue all concurrent 401 requests behind a single in-flight `refreshPromise` to prevent race conditions that invalidate rotated single-use tokens.
- **Loop Prevention**: Requests to `/auth/refresh` or `/auth/login` that fail with 401 must reject immediately without triggering refresh logic.

---

## 5. Account Lock and Temporary-Password Gap Analysis

### 5.1. Account Lock
- When user status is `LOCKED`:
  - Login fails with `ACCOUNT_LOCKED` ("Tài khoản đã bị khóa").
  - Refresh fails with `ACCOUNT_LOCKED`.
  - Active JWT requests fail 401 via `JwtAuthenticationFilter` (`user.getStatus() == UserStatus.ACTIVE`).
  - Mobile UI must display an explicit modal/dialog prompting the user to contact administrator.

### 5.2. Temporary-Password Flow Gap (`TEMPORARY_PASSWORD_FLOW_GAP`)
- **Repository Fact**: Admin creation (`UserManagementApplicationService.createUser`) generates a temporary password, but assigns status `UserStatus.PENDING`.
- **Invariant**: `user.validateCanLogin()` rejects `PENDING` users with `ACCOUNT_PENDING` ("Tài khoản chưa được kích hoạt").
- **Gap**: There is no self-activation endpoint with a temporary password in the backend. Activation requires administrative status transition.
- **Mobile Treatment**: Mobile login form must intercept `ACCOUNT_PENDING` and display an informative message directing the user to contact their administrator, avoiding misleading `INVALID_CREDENTIALS` feedback.

---

## 6. Form Architecture and Dependency Decision

- **Evaluated**:
  1. `react-hook-form` + `zod`: Risks peer dependency conflicts with React 19.3.0 / React Native 0.88.0 and adds unnecessary runtime weight for 1–3 field forms.
  2. Controlled state with custom form hook (`useAuthForm`) and lightweight validation: 100% type-safe, zero peer dependency hazards, zero external bundle weight, seamlessly integrates with pre-built `AppTextInput` and `PasswordInput` shared components.
- **Decision**: Adopt **Controlled State with Custom Form Hook** for Phase 13.

---

## 7. Test-Account Inventory and Safe Policy

### 7.1. Existing Account Inventory
- **Unit / MockMvc Fixtures**: Synthetic users (`activeuser`, `lockeduser`, etc.) exist in `backend/src/test/...` inserted directly into ephemeral PostgreSQL Testcontainers. Not accessible from Android emulator or external processes.
- **Local Developer Seed**: None. Flyway migrations V001..V017 seed only roles and permissions; no users are seeded. The local PostgreSQL container `worksphere-dev-pg` contains no user accounts.
- **Demo Users**: None in repository.
- **Production Credentials**: None in repository.

### 7.2. Safe Test-Account Policy (`AUTH_TEST_ACCOUNT_POLICY_GAP` Resolved)
To prevent committing passwords or hardcoding credentials in repository code, tests, or documentation:
- **Contract Environment Variables**:
  - `WORKSPHERE_E2E_LOGIN`: Login username or email for local testing.
  - `WORKSPHERE_E2E_PASSWORD`: Password for local testing (injected outside Git).
  - `WORKSPHERE_E2E_BASE_URL` (optional): Override base URL for custom host testing.
- **Rules**:
  1. Values must live outside Git (never committed to repository or `.env` files).
  2. Never print, log, or include credential values in test output, terminal echoes, reports, or screenshots.
  3. No default or fallback password hardcoded in source.
  4. Local development accounts must use dedicated test accounts with least privileges required for Phase 13.
  5. Automated E2E tests on emulator must safely skip or prompt when environment variables are absent.
  6. CI execution (if introduced) must source credentials exclusively from GitHub Actions Secrets.

### 7.3. Provisioning Requirement (`AUTH_TEST_ACCOUNT_PROVISIONING_REQUIRED`)
Because `worksphere-dev-pg` contains no seeded accounts, executing real E2E login on the live backend remains blocked until a dedicated, idempotent dev provisioning mechanism is established:
- Must run in local/dev profile only.
- Must be disabled in production.
- Must accept password injected from environment outside Git without logging.
- Must provision a test user with `ACTIVE` status and valid role/department mapping.

---

## 8. Summary of Findings

- **`IOS_ENVIRONMENT_BRIDGE_TARGET_GAP`**: `RESOLVED`. `EnvironmentConfigModule.h` and `EnvironmentConfigModule.m` are registered in Xcode project target membership.
- **`AUTH_TEST_ACCOUNT_POLICY_GAP`**: `RESOLVED`. Safe environment-variable contract and handling rules established.
- **`AUTH_TEST_ACCOUNT_PROVISIONING_REQUIRED`**: `OPEN_OPERATIONAL_REQUIREMENT`. Live backend E2E login requires dev account provisioning mechanism.
- **`TEMPORARY_PASSWORD_FLOW_GAP`**: `DOCUMENTED`. PENDING status error mapped to informative user message.
- **`IOS_BUILD_ON_MACOS_DEFERRED`**: `ACTIVE`. iOS build deferred to macOS host.
- **Phase 13 Implementation**: `NOT_STARTED`.

---

## Conclusion

PHASE_13_AUDIT_READY_FOR_DECISION
