# PHASE 13 IMPLEMENTATION PLAN: MOBILE AUTHENTICATION

- **Ngày lập kế hoạch**: 18/10/2026.
- **Checkpoint cơ sở**: `58f9f1ce1c05cdfcd2abc41580f01c2a4ce650ac`.
- **Trạng thái**: FROZEN / READY FOR SUBPHASE 13A.
- **Mục tiêu**: Đóng băng toàn bộ kiến trúc, hợp đồng API, máy trạng thái, giải pháp form, điều phối token, xử lý lỗi và lộ trình 6 bước triển khai cho Phase 13 Mobile Authentication.

---

## 1. Checkpoint

- **Git HEAD**: `58f9f1ce1c05cdfcd2abc41580f01c2a4ce650ac`.
- **Git Branch**: `main` (trùng khớp `origin/main`).
- **Working Tree**: Sạch 100%.
- **Trạng thái mã nguồn**:
  - Backend tests: 307/307 PASS, Checkstyle 0 violations, BUILD SUCCESS.
  - Mobile tests: 20/20 test suites, 112/112 tests PASS.
  - Runtime Bridges: Android & iOS native environment bridges đã kiểm định và đăng ký target (D-054, D-055).
  - Dev Provisioning: `E2eUserProvisioner` đã sẵn sàng, an toàn tuyệt đối, không commit credential (D-056).
  - External Governance: Chính sách quản trị tài nguyên bên ngoài D-057 đã ban hành và kiểm toán dữ liệu thực tế.
  - Phase 13 source implementation: **Chưa bắt đầu**.

---

## 2. Canonical scope

Căn cứ theo `docs/01_PROJECT_SCOPE.md`, `docs/03_MOBILE_SCREEN_MAP.md`, `docs/04_SYSTEM_ARCHITECTURE.md`, `docs/06_API_CONTRACT.md`, `docs/08_DEVELOPMENT_ROADMAP.md` (Phase 13), và `docs/09_CODING_STANDARDS.md`:

1. **Màn hình thuộc phạm vi Phase 13**:
   - `LoginScreen` (Đăng nhập bằng username/email và mật khẩu, hỗ trợ hiện/ẩn mật khẩu, hiển thị lỗi thân thiện).
   - `ForgotPasswordScreen` (Yêu cầu đặt lại mật khẩu qua email, an toàn chống user enumeration).
   - `ResetPasswordScreen` (Đặt lại mật khẩu mới bằng reset token, xác nhận mật khẩu, ràng buộc 8–128 ký tự).
   - `ProfileScreen` (Xem thông tin cá nhân hiện tại, cập nhật họ tên / số điện thoại, điều hướng đổi mật khẩu và đăng xuất).
   - `ChangePasswordScreen` (Đổi mật khẩu cho người dùng đang đăng nhập, kiểm tra mật khẩu hiện tại, chống trùng mật khẩu cũ).
   - `SettingsScreen` (Xem phiên bản ứng dụng, chính sách sử dụng, đăng xuất).
   - `SplashScreen / Bootstrap state` (Khởi tạo phiên, kiểm tra refresh token, khôi phục session mượt mà).
2. **Các màn hình không thuộc Phase 13 (Deferred)**:
   - Toàn bộ màn hình Admin Module P1 (`UserManagementScreen`, `DepartmentManagementScreen`, `CategoryManagementScreen`).
   - Tải lên ảnh đại diện thực tế (avatar upload - phụ thuộc File Storage Module Phase 6+).

---

## 3. Frozen contracts

Toàn bộ hợp đồng API được đóng băng dựa trên mã nguồn thực tế của backend (`AuthController.java`, `MeController.java`, `AuthApplicationService.java`):

### 3.1. Đăng nhập (`POST /api/v1/auth/login`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "login": "string (bắt buộc, email hoặc username, tối đa 255 ký tự)",
    "password": "string (bắt buộc, 8 - 128 ký tự)",
    "deviceName": "string (tùy chọn, tối đa 255 ký tự)"
  }
  ```
- **Response Body (`ApiResponse<AuthResponse>`)**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": null,
    "data": {
      "accessToken": "<jwt_access_token>",
      "refreshToken": "secure_random_string",
      "tokenType": "Bearer",
      "accessTokenExpiresIn": 900,
      "refreshTokenExpiresIn": 2592000,
      "user": {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "fullName": "string",
        "avatarUrl": null,
        "department": { "id": "uuid", "name": "string" },
        "roles": ["EMPLOYEE"],
        "permissions": ["TASK_READ", "..."]
      }
    },
    "fieldErrors": null,
    "traceId": "string"
  }
  ```

### 3.2. Làm mới token (`POST /api/v1/auth/refresh`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "refreshToken": "string (bắt buộc)"
  }
  ```
- **Response Body (`ApiResponse<RefreshResponse>`)**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": null,
    "data": {
      "accessToken": "<jwt_access_token>",
      "refreshToken": "new_rotated_secure_random_string",
      "tokenType": "Bearer",
      "accessTokenExpiresIn": 900,
      "refreshTokenExpiresIn": 604800
    },
    "fieldErrors": null,
    "traceId": "string"
  }
  ```
  *(Lưu ý: `RefreshResponse` không trả về `user`; client giữ nguyên session user hiện có hoặc gọi `GET /api/v1/me` trong cold start nếu thiếu).*

### 3.3. Đăng xuất (`POST /api/v1/auth/logout`)
- **Headers**: `Authorization: Bearer <accessToken>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "refreshToken": "string (bắt buộc)"
  }
  ```
- **Response**: `204 No Content`

### 3.4. Quên mật khẩu (`POST /api/v1/auth/forgot-password`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "string (bắt buộc, email hợp lệ, tối đa 255 ký tự)"
  }
  ```
- **Response Body**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.",
    "data": null,
    "fieldErrors": null,
    "traceId": "string"
  }
  ```
  *(Đảm bảo an toàn chống User Enumeration: luôn trả lời thông điệp đồng nhất).*

### 3.5. Đặt lại mật khẩu (`POST /api/v1/auth/reset-password`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "resetToken": "string (bắt buộc)",
    "newPassword": "string (bắt buộc, 8 - 128 ký tự)",
    "confirmPassword": "string (bắt buộc, 8 - 128 ký tự)"
  }
  ```
- **Response Body**: `200 OK` với message "Mật khẩu đã được đặt lại thành công". Hủy toàn bộ session đang hoạt động của người dùng.

### 3.6. Xem thông tin cá nhân (`GET /api/v1/me`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response Body (`ApiResponse<UserProfileResponse>`)**:
  ```json
  {
    "success": true,
    "code": "OK",
    "message": null,
    "data": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "fullName": "string",
      "phoneNumber": "string",
      "avatarUrl": null,
      "status": "ACTIVE",
      "department": { "id": "uuid", "code": "string", "name": "string" },
      "roles": ["EMPLOYEE"],
      "permissions": ["TASK_READ", "..."],
      "createdAt": "2026-10-18T...",
      "lastLoginAt": "2026-10-18T..."
    },
    "fieldErrors": null,
    "traceId": "string"
  }
  ```

### 3.7. Cập nhật thông tin cá nhân (`PUT /api/v1/me`)
- **Headers**: `Authorization: Bearer <accessToken>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "fullName": "string (bắt buộc, tối đa 150 ký tự)",
    "phoneNumber": "string (tùy chọn, tối đa 20 ký tự)",
    "avatarFileId": null
  }
  ```
- **Response Body**: `ApiResponse<UserProfileResponse>`

### 3.8. Đổi mật khẩu (`PUT /api/v1/me/password`)
- **Headers**: `Authorization: Bearer <accessToken>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "currentPassword": "string (bắt buộc)",
    "newPassword": "string (bắt buộc, 8 - 128 ký tự)",
    "confirmPassword": "string (bắt buộc, 8 - 128 ký tự)"
  }
  ```
- **Response Body**: `200 OK` với message "Mật khẩu đã được đổi thành công".

---

## 4. Architecture

### 4.1. Cấu trúc thư mục mô-đun
```text
mobile/src/
├── features/auth/
│   ├── api/
│   │   ├── authApi.ts          # Triển khai các hàm gọi API Auth
│   │   └── authTypes.ts        # TypeScript DTOs tương ứng backend contracts
│   ├── validation/
│   │   └── authValidation.ts   # Pure validation functions cho login, reset, change password
│   ├── errors/
│   │   └── authErrorMapper.ts  # Ánh xạ mã lỗi backend sang thông báo tiếng Việt và UI target
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── ForgotPasswordScreen.tsx
│       └── ResetPasswordScreen.tsx
├── features/profile/
│   └── screens/
│       ├── ProfileScreen.tsx
│       └── ChangePasswordScreen.tsx
├── features/more/
│   └── screens/
│       └── SettingsScreen.tsx
├── app/auth/
│   ├── AuthProvider.tsx        # React Context & Provider quản lý toàn bộ Auth lifecycle
│   ├── authReducer.ts          # Pure reducer máy trạng thái Auth
│   ├── authTypes.ts            # State, Action, Operation State definitions
│   └── refreshCoordinator.ts   # Single-flight token refresh controller với bare Axios instance
└── app/navigation/
    └── RootNavigator.tsx       # Khóa chuyển hướng giữa INITIALIZING, UNAUTHENTICATED, AUTHENTICATED
```

### 4.2. Nguyên tắc phân định ranh giới (Separation of Concerns)
- Tuyệt đối không viết logic xác thực hay gọi API trong `shared/components`, file navigation, hoặc JSX của màn hình.
- Tái sử dụng tối đa các thành phần nền tảng đã qua kiểm duyệt:
  - Giao tiếp mạng: `apiClient`, `http`, `normalizeError`.
  - Lưu trữ: `accessTokenStore` (in-memory), `secureStorage` (Keychain).
  - Giao diện: `AppButton`, `AppTextInput`, `PasswordInput`, `EmptyState`, `ErrorState`, `LoadingIndicator`, `ConfirmationDialog`.
  - Cấu hình: `getEnvironmentConfig()`.

---

## 5. Security invariants

1. **Cô lập bí mật (Secret Isolation)**:
   - `accessToken`: Lưu trữ **duy nhất trong bộ nhớ tạm (in-memory)** thông qua `accessTokenStore`. Tuyệt đối không lưu vào `AsyncStorage`, React state, hay navigation params.
   - `refreshToken`: Lưu trữ **duy nhất trong phần cứng bảo mật (Keychain / Keystore)** thông qua `secureStorage`.
   - Mật khẩu (Password): Tuyệt đối không lưu vào state toàn cục, không ghi log, không in ra terminal, không xuất hiện trong URL hoặc query parameters.
2. **Quy tắc Single-Flight Token Refresh & Điều Kiện Kích Hoạt (Eligibility)**:
   - Request chỉ đủ điều kiện kích hoạt refresh khi thỏa mãn cả 5 điều kiện:
     1. Nhận HTTP `401 Unauthorized` với mã `UNAUTHORIZED` từ backend.
     2. Request gốc có header `Authorization: Bearer <token>` (đã xác thực).
     3. Request không thuộc nhóm endpoint xác thực (`/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password`).
     4. Request chưa từng retry (`!config._retry`).
     5. Cấu hình request không bật cờ bỏ qua (`config.skipAuthRefresh !== true`).
   - Duy trì duy nhất **một Promise làm mới token** tại một thời điểm (`module-private refreshPromise`).
   - Yêu cầu 401 hợp lệ đầu tiên kích hoạt refresh; các yêu cầu 401 đồng thời chia sẻ chung Promise này.
   - Sử dụng **instance Axios riêng biệt (`refreshClient`)** không chứa interceptor 401 đệ quy để gọi endpoint `/auth/refresh`.
   - Token refresh xoay vòng (rotated refresh token - TTL 2,592,000s / 30 ngày) phải được lưu an toàn vào Keychain trước khi retry các request trong hàng đợi.
   - Mỗi request bị 401 chỉ được retry **tối đa 1 lần** (`config._retry = true`). Nếu request thử lại tiếp tục nhận 401, reject ngay lập tức và kích hoạt xóa phiên an toàn một lần duy nhất; tuyệt đối không tạo vòng lặp vô hạn.
3. **Bảo vệ chống User Enumeration**:
   - Endpoint `forgot-password` luôn hiển thị kết quả thành công đồng nhất bất kể email có tồn tại trên hệ thống hay không.
4. **Quản lý tài khoản tạm thời (`TEMPORARY_PASSWORD_FLOW_GAP`)**:
   - Tài khoản ở trạng thái `PENDING` (do admin tạo với mật khẩu tạm) sẽ bị backend từ chối với lỗi `ACCOUNT_PENDING`. Mobile ánh xạ lỗi này rõ ràng: *"Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ quản trị viên để kích hoạt tài khoản."*
   - Mobile không tự phát minh luồng tự kích hoạt mật khẩu tạm thời khi chưa có hợp đồng backend.

---

## 6. External references

Theo quy định quản trị tài nguyên D-057, đã kiểm tra theo đúng thứ tự ưu tiên:
1. **WorkSphere Source**: Tái sử dụng `accessTokenStore.ts`, `secureStorage.ts`, `apiClient.ts`, `apiError.ts`.
2. **Registry đã duyệt**: `EXT-RES-001` (React Native Architecture Reference) và `EXT-RES-002` (Spring Security Standards).
3. **Official Axios Documentation & Interceptors**:
   - *URL*: `https://github.com/axios/axios`
   - *Pattern*: Phân tách dedicated refresh client (`refreshClient = axios.create(...)`) và gắn cờ `config._retry = true` để loại bỏ rủi ro đệ quy interceptor.
4. **Official React Navigation Authentication Flow**:
   - *URL*: `https://reactnavigation.org/docs/auth-flow/`
   - *Pattern*: Điều hướng có điều kiện dựa trên `sessionState` (`INITIALIZING` -> `UNAUTHENTICATED` / `AUTHENTICATED`), ngăn chặn việc back lại màn hình Login khi đã đăng nhập.
5. **Official react-native-keychain Documentation**:
   - *URL*: `https://github.com/oblador/react-native-keychain`
   - *Pattern*: Đọc/ghi khóa an toàn qua Keychain/Keystore với fallback an toàn (đã hoàn thiện tại `secureStorage.ts`).

---

## 7. Chi tiết triển khai Subphase 13A

- **Mục tiêu**: Định nghĩa toàn bộ Auth DTOs, API client adapters, pure form validators và error mappers.
- **Tập tin tạo/sửa đổi**:
  - `mobile/src/features/auth/api/authTypes.ts`
  - `mobile/src/features/auth/api/authApi.ts`
  - `mobile/src/features/auth/validation/authValidation.ts`
  - `mobile/src/features/auth/errors/authErrorMapper.ts`
  - `mobile/__tests__/features/auth/authApi.test.ts`
  - `mobile/__tests__/features/auth/authValidation.test.ts`
  - `mobile/__tests__/features/auth/authErrorMapper.test.ts`
- **Tập tin bị cấm chỉnh sửa**: Các file trong `app/navigation/`, màn hình JSX, backend source, `package.json`.
- **Kiểm thử**: Unit tests cho validation boundaries (login, password 8–128, confirmation match), API unwrap, error mapping tiếng Việt.
- **Cam kết Git**: `feat(mobile): add auth dtos api adapters and validation`
- **Điều kiện dừng**: `npm run lint`, `npm run typecheck`, `npm test` PASS 100%.

---

## 8. Chi tiết triển khai Subphase 13B

- **Mục tiêu**: Xây dựng AuthProvider, authReducer, chức năng đăng nhập, đăng xuất cục bộ, và liên kết điều hướng bảo vệ.
- **Tập tin tạo/sửa đổi**:
  - `mobile/src/app/auth/authTypes.ts`
  - `mobile/src/app/auth/authReducer.ts`
  - `mobile/src/app/auth/AuthProvider.tsx`
  - `mobile/src/features/auth/screens/LoginScreen.tsx`
  - `mobile/src/app/navigation/RootNavigator.tsx` (liên kết sessionState từ AuthContext)
  - `mobile/__tests__/app/auth/authReducer.test.ts`
  - `mobile/__tests__/features/auth/LoginScreen.test.ts`
- **Kiểm thử**: Đăng nhập thành công, đăng nhập thất bại, submit trùng lặp, xử lý lỗi `ACCOUNT_PENDING` / `ACCOUNT_LOCKED`, xóa session khi đăng xuất cục bộ, rollback an toàn nếu ghi Keychain thất bại.
- **Cam kết Git**: `feat(mobile): implement auth provider and login flow`

---

## 9. Chi tiết triển khai Subphase 13C

- **Mục tiêu**: Xây dựng Single-Flight Token Refresh coordinator, khôi phục phiên khi khởi động ứng dụng (Cold-start bootstrap), và cơ chế xoay vòng token retry-once.
- **Tập tin tạo/sửa đổi**:
  - `mobile/src/app/auth/refreshCoordinator.ts`
  - Cập nhật `mobile/src/shared/api/apiClient.ts` để tích hợp với refresh coordinator
  - Cập nhật `mobile/src/app/auth/AuthProvider.tsx` để thực thi bootstrap lifecycle
  - `mobile/__tests__/app/auth/refreshCoordinator.test.ts`
  - `mobile/__tests__/app/auth/sessionBootstrap.test.ts`
- **Kiểm thử**: Khởi động không có refresh token -> UNAUTHENTICATED; có refresh token hợp lệ -> refresh thành công -> nạp user -> AUTHENTICATED; 3 request 401 đồng thời chỉ kích hoạt 1 lần refresh duy nhất; request retry nhận 401 thứ hai không tạo vòng lặp vô hạn; xử lý khởi động khi mất kết nối mạng.
- **Cam kết Git**: `feat(mobile): add single-flight refresh and session bootstrap`

---

## 10. Chi tiết triển khai Subphase 13D

- **Mục tiêu**: Xây dựng màn hình Hồ sơ cá nhân (`ProfileScreen`) và Đổi mật khẩu (`ChangePasswordScreen`).
- **Tập tin tạo/sửa đổi**:
  - `mobile/src/features/profile/screens/ProfileScreen.tsx`
  - `mobile/src/features/profile/screens/ChangePasswordScreen.tsx`
  - `mobile/src/features/profile/api/profileApi.ts`
  - Cập nhật `mobile/src/app/navigation/` (nếu cần route params cho Profile stack)
  - `mobile/__tests__/features/profile/ProfileScreen.test.ts`
  - `mobile/__tests__/features/profile/ChangePasswordScreen.test.ts`
- **Kiểm thử**: Tải hồ sơ cá nhân, cập nhật họ tên / số điện thoại, đổi mật khẩu thành công, báo lỗi khi mật khẩu hiện tại sai, báo lỗi khi mật khẩu mới trùng mật khẩu cũ.
- **Cam kết Git**: `feat(mobile): implement profile and change password screens`

---

## 11. Chi tiết triển khai Subphase 13E

- **Mục tiêu**: Xây dựng màn hình Quên mật khẩu (`ForgotPasswordScreen`) và Đặt lại mật khẩu (`ResetPasswordScreen`).
- **Tập tin tạo/sửa đổi**:
  - `mobile/src/features/auth/screens/ForgotPasswordScreen.tsx`
  - `mobile/src/features/auth/screens/ResetPasswordScreen.tsx`
  - `mobile/__tests__/features/auth/ForgotPasswordScreen.test.ts`
  - `mobile/__tests__/features/auth/ResetPasswordScreen.test.ts`
- **Kiểm thử**: Gửi yêu cầu quên mật khẩu hiển thị thông báo thành công đồng nhất, đặt lại mật khẩu với token hết hạn báo lỗi `RESET_TOKEN_EXPIRED`, đặt lại mật khẩu thành công điều hướng về Login.
- **Cam kết Git**: `feat(mobile): implement forgot and reset password screens`

---

## 12. Chi tiết triển khai Subphase 13F

- **Mục tiêu**: Xây dựng màn hình Cài đặt (`SettingsScreen`), tích hợp E2E test với tài khoản dev được inject bên ngoài, kiểm thử trên Android Emulator, quét an ninh và đóng gói nghiệm thu Phase 13.
- **Tập tin tạo/sửa đổi**:
  - `mobile/src/features/more/screens/SettingsScreen.tsx`
  - `reports/PHASE_13_REPORT.md`
  - `reports/PROJECT_STATE.md`
  - `reports/HANDOFF.md`
- **Quy tắc E2E**: Chạy kịch bản E2E kiểm thử đăng nhập bằng biến môi trường `WORKSPHERE_E2E_*`; nếu không có biến môi trường thì gracefully skip test mà không báo fail; tuyệt đối không in mật khẩu ra logcat hay báo cáo.
- **Kiểm thử Android**: Biên dịch Android debug APK, chạy emulator cold start, login, restore session, và logout.
- **Cam kết Git**: `feat(mobile): finalize phase 13 authentication integration`

---

## 13. Test matrix

| Subphase | Mục tiêu kiểm thử | Số lượng ca kiểm thử dự kiến | Loại kiểm thử |
| :---: | :--- | :---: | :---: |
| **13A** | Form validators (login, password rules, email), DTO mapping, error mapper tiếng Việt | 15 - 20 | Jest Unit Test |
| **13B** | Auth reducer state transitions, Login screen user interaction, error display, logout cleanup | 12 - 16 | Jest Unit / Component Test |
| **13C** | Single-flight refresh mutex, concurrent 401 dedup, cold-start bootstrap, offline handling | 12 - 15 | Jest Unit / Integration Test |
| **13D** | Profile data load/update, change password validation, error mapping | 8 - 12 | Jest Component Test |
| **13E** | Forgot password uniform response, reset password token validation & flow | 8 - 10 | Jest Component Test |
| **13F** | Settings screen, E2E auth flow, Android APK build, Emulator verification | 5 - 8 | E2E / Android Verification |

---

## 14. Commit boundaries

Mỗi subphase tương ứng với đúng **một commit duy nhất** trên nhánh `main`:
1. `13A`: `feat(mobile): add auth dtos api adapters and validation`
2. `13B`: `feat(mobile): implement auth provider and login flow`
3. `13C`: `feat(mobile): add single-flight refresh and session bootstrap`
4. `13D`: `feat(mobile): implement profile and change password screens`
5. `13E`: `feat(mobile): implement forgot and reset password screens`
6. `13F`: `feat(mobile): finalize phase 13 authentication integration`

---

## 15. Rollback strategy

- Nếu bất kỳ subphase nào gặp lỗi kiểm thử hoặc vi phạm Checkstyle/Lint:
  - Giữ nguyên trạng thái working tree, không tạo commit lỗi.
  - Sửa lỗi tại chỗ và chạy lại toàn bộ test suite (`npm run lint`, `npm run typecheck`, `npm test`, `.\mvnw.cmd validate`).
  - Chỉ commit và push khi toàn bộ kiểm thử đạt PASS 100%.
- Nếu cần hoàn tác một subphase chưa hoàn tất, dùng `git restore` hoặc quay lại commit SHA trước đó mà không dùng `git reset --hard` trên commit đã push.

---

## 16. Deferred items

Các hạng mục sau được ghi nhận rõ ràng là **hoãn lại sau Phase 13**:
1. **RESET_PASSWORD_DEEP_LINK_DEFERRED**: Chưa có cấu hình deep link cho mobile trong canonical specs; token đặt lại mật khẩu trong Phase 13 được nhập thủ công hoặc truyền qua route navigation param kiểm thử.
2. **SETTINGS_POLICY_URL_DEFERRED**: Chưa có URL chính sách công khai trong canonical docs; SettingsScreen trong Subphase 13F hiển thị thông tin tĩnh nội bộ.
3. **Avatar Upload**: Cần File Service và multipart upload (thuộc Phase 6+). Trong Phase 13, `avatarUrl` hiển thị placeholder hoặc avatar mặc định từ theme.
4. **First-Login Activation Flow cho PENDING Users (`TEMPORARY_PASSWORD_FLOW_GAP`)**: Cần hợp đồng tự kích hoạt tài khoản backend; Phase 13 mobile ánh xạ lỗi ACCOUNT_PENDING thân thiện yêu cầu liên hệ admin.
5. **Biometric Authentication (Fingerprint / Face ID)**: Chưa có trong scope Phase 13 MVP; lưu trữ Keychain hiện tại làm nền tảng cho Phase nâng cao sau này.
6. **Push Notification Token Registration**: Sẽ được triển khai trong Phase Notification tương ứng.

---

## 17. Entry criteria

Để bắt đầu Subphase 13A:
- [x] Checkpoint `58f9f1ce1c05cdfcd2abc41580f01c2a4ce650ac` sạch và đồng bộ `origin/main`.
- [x] Backend 307/307 tests PASS, Checkstyle 0 violations, BUILD SUCCESS.
- [x] Mobile 112/112 tests PASS, Lint clean, TypeScript clean.
- [x] Quyết định D-058 đã đóng băng toàn bộ hợp đồng và kiến trúc.
- [x] Kế hoạch triển khai `reports/PHASE_13_IMPLEMENTATION_PLAN.md` đã phê duyệt.

---

## 18. Exit criteria

Để hoàn thành toàn bộ Phase 13 (sau Subphase 13F):
- [ ] Cả 6 màn hình (Login, Forgot, Reset, Profile, Change Password, Settings) hoạt động đầy đủ và đạt chuẩn accessibility.
- [ ] Single-flight refresh hoạt động ổn định, không rò rỉ token, không tạo vòng lặp vô hạn.
- [ ] Mật khẩu và token tuân thủ tuyệt đối quy tắc bảo mật (in-memory access token, keychain refresh token).
- [ ] 0 lỗi Lint, 0 lỗi TypeScript, 100% tests PASS (backend + mobile).
- [ ] Build thành công Android Debug APK và xác minh luồng đăng nhập/đăng xuất trên Android Emulator.
- [ ] Không có bất kỳ credential nào bị rò rỉ trong Git history, logcat, hoặc báo cáo.
