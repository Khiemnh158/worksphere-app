# BÁO CÁO ĐỐI SOÁT HỢP ĐỒNG PHASE 13 (PHASE 13 CONTRACT RECONCILIATION)

- **Ngày thực hiện**: 18/10/2026.
- **Checkpoint cơ sở**: `a30b8477222970dc9e9f6e1cda0c906254f4cc7f`.
- **Trạng thái**: RECONCILED / APPROVED / READY FOR SUBPHASE 13A.
- **Mục tiêu**: Đối soát chính xác 100% các hợp đồng kỹ thuật, TTL token, ma trận mã lỗi HTTP, điều kiện kích hoạt làm mới token, luồng đặt lại mật khẩu và phân quyền giữa backend Spring Boot hiện hữu và kế hoạch triển khai Phase 13 Mobile.

---

## 1. Checkpoint

- **Git HEAD**: `a30b8477222970dc9e9f6e1cda0c906254f4cc7f`.
- **Git Branch**: `main` (trùng khớp `origin/main`).
- **Working Tree**: Sạch 100%.
- **Trạng thái kiểm thử**:
  - Backend: 307/307 tests PASS, Checkstyle 0 violations, BUILD SUCCESS.
  - Mobile: 20/20 test suites, 112/112 tests PASS.
  - Mã nguồn mobile & backend: Không bị chỉnh sửa trong nhiệm vụ đối soát này.

---

## 2. Token TTL Source Truth

Đối soát trực tiếp từ mã nguồn backend (`JwtService.java`, `AuthApplicationService.java`, `application.yml`, `application-dev.yml` và `AuthMockMvcTest.java`):

| Thuộc tính | Cấu hình / Mã nguồn | Đơn vị | Giá trị Default | Giá trị Dev Profile | Giá trị Test Profile |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Access Token TTL** | `worksphere.jwt.access-token-expiry-seconds` | Giây | 900 (15 phút) | 900 (15 phút) | 900 (15 phút) |
| **Refresh Token TTL** | `REFRESH_TOKEN_EXPIRY_DAYS = 30L` (`AuthApplicationService`) | Giây | **2,592,000** (30 ngày) | **2,592,000** (30 ngày) | **2,592,000** (30 ngày) |
| **Reset Token TTL** | `RESET_TOKEN_EXPIRY_MINUTES = 15L` (`AuthApplicationService`) | Phút | 15 (900 giây) | 15 (900 giây) | 15 (900 giây) |

### Giải quyết sai lệch 604,800s vs 2,592,000s:
- **Phát hiện**: Trong các tài liệu sơ bộ ban đầu, giá trị `refreshTokenExpiresIn` được ghi chú là 604,800 giây (7 ngày).
- **Sự thật mã nguồn**: Tại `AuthApplicationService.java` dòng 41 và 451, hằng số là `REFRESH_TOKEN_EXPIRY_DAYS = 30L`, tính toán trả về `30 * 24 * 3600 = 2,592,000` giây. Cả hai DTO `AuthResponse` và `RefreshResponse` đều trả về `2592000`.
- **Kết luận đối soát**: Hợp đồng được chuẩn hóa chính xác là **2,592,000 giây (30 ngày)** cho toàn bộ hệ thống mobile.

---

## 3. Exact Auth HTTP Status Matrix

Đối soát trực tiếp từ `GlobalExceptionHandler.java`, `WorkSphereAuthEntryPoint.java`, `WorkSphereAccessDeniedHandler.java`, và `AuthMockMvcTest.java`:

| Backend Code | Lớp Exception Nguồn | HTTP Status | Ngữ cảnh Endpoint | Cấu trúc Envelope (`ApiResponse`) |
| :--- | :--- | :---: | :--- | :--- |
| `VALIDATION_ERROR` | `MethodArgumentNotValidException`, `ConstraintViolationException` | **400 Bad Request** | Mọi endpoint khi dữ liệu body/param vi phạm validate | `{"success": false, "code": "VALIDATION_ERROR", "message": "...", "fieldErrors": {...}}` |
| `UNAUTHORIZED` | `WorkSphereAuthEntryPoint` (thiếu token, token sai/hết hạn trên protected endpoint) | **401 Unauthorized** | Protected endpoints (`/api/v1/me`, `/api/v1/auth/logout`,...) | `{"success": false, "code": "UNAUTHORIZED", "message": "Yêu cầu xác thực", "data": null}` |
| `FORBIDDEN` | `WorkSphereAccessDeniedHandler`, `AccessDeniedException` | **403 Forbidden** | Protected endpoint khi user thiếu quyền hạn | `{"success": false, "code": "FORBIDDEN", "message": "Bạn không có quyền thực hiện thao tác này"}` |
| `USER_NOT_FOUND` | `ResourceNotFoundException` | **404 Not Found** | `/api/v1/me`, `/api/v1/me/password` khi ID không tồn tại | `{"success": false, "code": "USER_NOT_FOUND", "message": "Người dùng không tồn tại"}` |
| `INVALID_CREDENTIALS` | `BusinessRuleException` | **422 Unprocessable Entity** | `POST /api/v1/auth/login` (sai username/password) | `{"success": false, "code": "INVALID_CREDENTIALS", "message": "Thông tin đăng nhập không chính xác"}` |
| `ACCOUNT_PENDING` | `BusinessRuleException` (từ `user.validateCanLogin()`) | **422 Unprocessable Entity** | `POST /api/v1/auth/login` (tài khoản chưa kích hoạt) | `{"success": false, "code": "ACCOUNT_PENDING", "message": "Tài khoản chưa được kích hoạt"}` |
| `ACCOUNT_LOCKED` | `BusinessRuleException` (từ `user.validateCanLogin()`) | **422 Unprocessable Entity** | `POST /api/v1/auth/login` (tài khoản bị khóa) | `{"success": false, "code": "ACCOUNT_LOCKED", "message": "Tài khoản đã bị khóa"}` |
| `ACCOUNT_DISABLED` | `BusinessRuleException` (từ `user.validateCanLogin()`) | **422 Unprocessable Entity** | `POST /api/v1/auth/login` (tài khoản bị vô hiệu hóa) | `{"success": false, "code": "ACCOUNT_DISABLED", "message": "Tài khoản đã bị vô hiệu hóa"}` |
| `REFRESH_TOKEN_INVALID` | `BusinessRuleException` | **422 Unprocessable Entity** | `POST /api/v1/auth/refresh` (token không tồn tại/sai format) | `{"success": false, "code": "REFRESH_TOKEN_INVALID", "message": "Refresh token không hợp lệ"}` |
| `REFRESH_TOKEN_REVOKED` | `BusinessRuleException` | **422 Unprocessable Entity** | `POST /api/v1/auth/refresh` (token đã dùng hoặc bị thu hồi) | `{"success": false, "code": "REFRESH_TOKEN_REVOKED", "message": "Refresh token đã bị thu hồi"}` |
| `REFRESH_TOKEN_EXPIRED` | `BusinessRuleException` | **422 Unprocessable Entity** | `POST /api/v1/auth/refresh` (token quá 30 ngày) | `{"success": false, "code": "REFRESH_TOKEN_EXPIRED", "message": "Refresh token đã hết hạn"}` |
| `RESET_TOKEN_INVALID` | `BusinessRuleException` | **422 Unprocessable Entity** | `POST /api/v1/auth/reset-password` (token sai hoặc đã dùng) | `{"success": false, "code": "RESET_TOKEN_INVALID", "message": "Token đặt lại mật khẩu không hợp lệ"}` |
| `RESET_TOKEN_EXPIRED` | `BusinessRuleException` | **422 Unprocessable Entity** | `POST /api/v1/auth/reset-password` (token quá 15 phút) | `{"success": false, "code": "RESET_TOKEN_EXPIRED", "message": "Token đặt lại mật khẩu đã hết hạn"}` |
| `CURRENT_PASSWORD_INCORRECT` | `BusinessRuleException` | **422 Unprocessable Entity** | `PUT /api/v1/me/password` (mật khẩu hiện tại sai) | `{"success": false, "code": "CURRENT_PASSWORD_INCORRECT", "message": "Mật khẩu hiện tại không chính xác"}` |
| `NEW_PASSWORD_SAME_AS_CURRENT` | `BusinessRuleException` | **422 Unprocessable Entity** | `PUT /api/v1/me/password` (mật khẩu mới trùng mật khẩu cũ) | `{"success": false, "code": "NEW_PASSWORD_SAME_AS_CURRENT", "message": "Mật khẩu mới không được trùng mật khẩu hiện tại"}` |
| `PASSWORD_CONFIRMATION_MISMATCH` | `BusinessRuleException` | **422 Unprocessable Entity** | `POST /reset-password`, `PUT /me/password` | `{"success": false, "code": "PASSWORD_CONFIRMATION_MISMATCH", "message": "Mật khẩu xác nhận không khớp"}` |
| `PASSWORD_POLICY_VIOLATION` | `BusinessRuleException` | **422 Unprocessable Entity** | `POST /reset-password`, `PUT /me/password` (< 8 hoặc > 128) | `{"success": false, "code": "PASSWORD_POLICY_VIOLATION", "message": "Mật khẩu phải có từ 8 đến 128 ký tự"}` |
| `INTERNAL_ERROR` | `Exception` (unhandled) | **500 Internal Server Error** | Lỗi runtime hệ thống máy chủ | `{"success": false, "code": "INTERNAL_ERROR", "message": "Đã xảy ra lỗi hệ thống"}` |

> **Phát hiện cốt lõi về HTTP Status**:
> Tại backend Spring Boot hiện tại, `GlobalExceptionHandler.handleBusinessRule()` định tuyến toàn bộ mã ngoại lệ nghiệp vụ không nằm trong danh sách đặc biệt về `HttpStatus.UNPROCESSABLE_ENTITY` (HTTP 422). Do đó, lỗi đăng nhập sai tài khoản (`INVALID_CREDENTIALS`), tài khoản bị khóa/pending (`ACCOUNT_*`), và token refresh/reset không hợp lệ đều trả về **HTTP 422**, KHÔNG PHẢI HTTP 400 hay 401. Duy nhất lỗi thiếu token xác thực trên protected endpoint mới do Spring Security `WorkSphereAuthEntryPoint` trả về **HTTP 401**.

---

## 4. Refresh Interceptor Eligibility

Để loại trừ triệt để nguy cơ vòng lặp đệ quy vô hạn và không kích hoạt nhầm cơ chế làm mới token khi gọi các endpoint công khai hoặc lỗi nghiệp vụ, quy tắc kích hoạt làm mới token tự động được đóng băng như sau:

Một request chỉ đủ điều kiện kích hoạt `refreshCoordinator` khi và chỉ khi thỏa mãn **toàn bộ 5 điều kiện**:
1. **HTTP Status**: Response trả về chính xác `status === 401` và `data.code === 'UNAUTHORIZED'`.
2. **Yêu cầu đã được xác thực**: Request gốc có chứa header `Authorization: Bearer <token>` (chứng minh đây là request được bảo vệ, không phải request công khai).
3. **Loại trừ Endpoint Auth**: URL request không thuộc nhóm endpoint xác thực:
   - Không phải `POST /api/v1/auth/login` (lỗi 422/401 tại đây là sai thông tin đăng nhập, không được refresh).
   - Không phải `POST /api/v1/auth/refresh` (chính endpoint refresh, refresh dùng client độc lập không qua interceptor này).
   - Không phải `POST /api/v1/auth/forgot-password`.
   - Không phải `POST /api/v1/auth/reset-password`.
4. **Cờ Retry Duy Nhất**: Request chưa từng được thử lại (`!config._retry`). Khi gửi lại, gán `config._retry = true`. Nếu request đã retry mà vẫn nhận 401, reject ngay lập tức và kích hoạt xóa phiên.
5. **Metadata Điều Khiển**: Thuộc tính cấu hình `config.skipAuthRefresh !== true`.

---

## 5. Forgot/Reset Contract & Token Delivery

### 5.1. Quên mật khẩu (`POST /api/v1/auth/forgot-password`)
- Trường yêu cầu: `email` (NotBlank, Email, max 255).
- Phản hồi: `200 OK` với `message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi."`.
- Bảo vệ dò quét: Backend luôn trả về thông điệp thành công đồng nhất dù email có tồn tại hay không.
- Thời hạn hiệu lực: Token sinh ra có thời hạn 15 phút (`RESET_TOKEN_EXPIRY_MINUTES = 15L`).
- Rate limit: Chưa triển khai tại backend ở phase hiện tại.
- Kênh chuyển giao token: Out-of-band (ghi log an toàn trên backend, không in token thô).

### 5.2. Đặt lại mật khẩu (`POST /api/v1/auth/reset-password`)
- Trường yêu cầu: `resetToken` (NotBlank), `newPassword` (NotBlank, 8–128), `confirmPassword` (NotBlank, 8–128).
- Kiểm tra tính khớp: `newPassword.equals(confirmPassword)` -> `PASSWORD_CONFIRMATION_MISMATCH` (422).
- Sử dụng một lần: `resetToken.markUsed()`. Thử tái sử dụng trả về `RESET_TOKEN_INVALID` (422).
- Thu hồi phiên: Backend tự động thu hồi toàn bộ session và refresh token của user (`refreshTokenRepository.revokeAllByUserId`, `loginSessionRepository.revokeAllActiveByUserId`).

### 5.3. Kênh chuyển giao Reset Token tới Mobile (`RESET_PASSWORD_DEEP_LINK_DEFERRED`)
- **Đối soát**: Trong mã nguồn mobile (`AndroidManifest.xml`, `Info.plist`) và canonical docs, chưa có hợp đồng Deep Link / Universal Link chuẩn hóa nào được phê duyệt cho Mobile Reset Password.
- **Quyết định đối soát**: Ghi nhận khoảng trống kỹ thuật:
  `RESET_PASSWORD_DEEP_LINK_DEFERRED`.
- **Cơ chế Mobile Phase 13**: Màn hình `ResetPasswordScreen` hỗ trợ:
  - Nhập mã `resetToken` thủ công qua ô nhập liệu.
  - Tiếp nhận `token` truyền qua route navigation param (`route.params?.token`) phục vụ kiểm thử.
  - Tuyệt đối không tự ý giả định luồng deep-link hoàn chỉnh khi chưa có cấu hình hệ thống.

---

## 6. Profile Permissions

Đối soát từ `V011__seed_roles_and_permissions.sql`, `V014__seed_role_permissions.sql`, `SecurityConfig.java`, và `MeController.java`:

| Endpoint | Method | Cấu hình SecurityConfig | Kiểm tra Method `@PreAuthorize` | Quyền yêu cầu của User |
| :--- | :---: | :--- | :--- | :--- |
| `/api/v1/me` | `GET` | `.anyRequest().authenticated()` | Không có | Bất kỳ người dùng authenticated |
| `/api/v1/me` | `PUT` | `.anyRequest().authenticated()` | Không có | Bất kỳ người dùng authenticated |
| `/api/v1/me/password` | `PUT` | `.anyRequest().authenticated()` | Không có | Bất kỳ người dùng authenticated |
| `/api/v1/auth/logout` | `POST` | `.anyRequest().authenticated()` | Không có | Bất kỳ người dùng authenticated |
| `/api/v1/auth/logout-all` | `POST` | `.anyRequest().authenticated()` | Không có | Bất kỳ người dùng authenticated |

- **Quyền hạn của Role `EMPLOYEE`**:
  Tại `V014__seed_role_permissions.sql` (dòng 69–71), role `EMPLOYEE` được cấp sẵn quyền `PROFILE_READ` và `PROFILE_UPDATE`.
- **Kết luận**: Tài khoản với vai trò `EMPLOYEE` có đầy đủ quyền hạn truy cập 100% các endpoint cá nhân trên. Không cần nâng cấp quyền hay thay đổi database seed.

---

## 7. Settings Contract

Đối soát theo `docs/03_MOBILE_SCREEN_MAP.md` Mục 12.3:
1. **Xem phiên bản ứng dụng**: Đọc trực tiếp từ cấu hình ứng dụng (`1.0.0`). Triển khai trong Subphase 13F.
2. **Đăng xuất**: Gọi hàm `logout()` từ `AuthContext` (đã xây dựng từ Subphase 13B/13C). Triển khai trong Subphase 13F.
3. **Bật/tắt thông báo**: Phụ thuộc `/api/v1/notification-preferences` (Phase 11 backend). Tạm hoãn đến giai đoạn tích hợp Notification.
4. **Giao diện sáng/tối**: Phụ thuộc `ThemeProvider`. Tạm hoãn đến giai đoạn hoàn thiện UI theme.
5. **Chính sách sử dụng**:
   - Canonical docs không cung cấp URL chính sách sử dụng (`terms_of_service` / `privacy_policy`).
   - Ghi nhận: `SETTINGS_POLICY_URL_DEFERRED`. Trong Subphase 13F, mục này hiển thị bản tĩnh hoặc thông tin nội bộ mà không dẫn link ngoài rò rỉ dữ liệu.

---

## 8. External Reference Evidence

Tuân thủ chính sách quản trị tài nguyên D-057:
- Toàn bộ các tài liệu tham khảo bên ngoài được ghi nhận là **Tài liệu tham chiếu chuẩn cho thiết kế và triển khai (Required Architectural References)**, không phải mã nguồn bên ngoài được vendored hoặc tải về repository.
- Các tài liệu chuẩn hóa:
  1. **Axios Interceptor Pattern**: `https://github.com/axios/axios` - Nguyên tắc phân tách instance `refreshClient = axios.create(...)` độc lập nhằm loại bỏ đệ quy.
  2. **React Navigation Auth Flow**: `https://reactnavigation.org/docs/auth-flow/` - Nguyên tắc conditional screen rendering dựa trên `sessionState`.
  3. **React Native Keychain**: `https://github.com/oblador/react-native-keychain` - Nguyên tắc lưu trữ phần cứng an toàn (đã hoàn thiện tại `secureStorage.ts`).
- Không có kho mã hay gói cài đặt mới nào cần clone/download vào `.external/` trong nhiệm vụ đối soát này. Sổ đăng ký `reports/EXTERNAL_RESOURCE_REGISTRY.md` được giữ nguyên trạng thái xác thực thực tế.

---

## 9. Subphase Boundary Correction

Ranh giới 6 bước triển khai Phase 13 được hiệu chỉnh và khóa cứng:
- **Subphase 13A**: Auth DTOs, API adapters (`authApi.ts`), pure form validators (`authValidation.ts`), và error mapper (`authErrorMapper.ts`). Tuyệt đối không chỉnh sửa `AuthProvider`, `RootNavigator`, hoặc Axios interceptor.
- **Subphase 13B**: `AuthProvider`, `authReducer`, luồng đăng nhập `LoginScreen`, đăng xuất cục bộ (local logout), và rào chắn `RootNavigator` (chuyển đổi giữa `Auth` và `MainTab`). Chưa triển khai refresh coordinator đầy đủ.
- **Subphase 13C**: Dedicated `refreshClient`, `refreshCoordinator` (single-flight mutex, concurrent 401 dedup, retry-once), cold-start bootstrap khôi phục phiên từ Keychain, và gọi API đăng xuất phía server (`logout` / `logout-all`).
- **Subphase 13D**: Màn hình Hồ sơ cá nhân (`ProfileScreen`) và Đổi mật khẩu (`ChangePasswordScreen`).
- **Subphase 13E**: Màn hình Quên mật khẩu (`ForgotPasswordScreen`) và Đặt lại mật khẩu (`ResetPasswordScreen`) trong phạm vi token transport đã xác minh (`RESET_PASSWORD_DEEP_LINK_DEFERRED`).
- **Subphase 13F**: Màn hình Cài đặt (`SettingsScreen` trong phạm vi `SETTINGS_POLICY_URL_DEFERRED`), kiểm thử E2E tự động, biên dịch Android APK, xác minh trên emulator, quét an ninh và đóng gói nghiệm thu Phase 13.

---

## 10. Remaining Gaps & Non-Blockers

1. `RESET_PASSWORD_DEEP_LINK_DEFERRED`: Chưa có cấu hình deep link cho mobile; token được nhập thủ công hoặc truyền qua route params kiểm thử.
2. `SETTINGS_POLICY_URL_DEFERRED`: Chưa có URL chính sách công khai; màn hình Settings hiển thị thông tin phiên bản nội bộ.
3. `TEMPORARY_PASSWORD_FLOW_GAP`: Tài khoản `PENDING` được ánh xạ lỗi thân thiện yêu cầu liên hệ admin; kiểm thử E2E dev sử dụng tài khoản `ACTIVE` do `E2eUserProvisioner` tạo ra.
4. `IOS_BUILD_ON_MACOS_DEFERRED`: Mã nguồn iOS bridge đã tích hợp đúng target, nhưng chưa thể build binary native trên máy host Windows.

---

## 11. 13A Readiness Assessment

- Toàn bộ hợp đồng API, DTOs, validation rules, HTTP status mapping và ranh giới thư mục cho Subphase 13A đã được đối soát 100% khớp với mã nguồn backend thực tế.
- Hệ thống hoàn toàn sẵn sàng cho việc khởi động Subphase 13A.
