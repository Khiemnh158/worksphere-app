# Báo Cáo Triển Khai Phase 12D: Network, Storage và Auth State Foundation

## 1. Checkpoint Ban Đầu
- Checkpoint commit: `bcc881bcf322e892905356411e5f3d77f01de09f`
- Branch: `main`
- HEAD == origin/main, working tree clean trước khi triển khai.
- 59/59 mobile unit tests PASS từ Phase 12C patch.

## 2. Dependencies & Compatibility
Đã cài đặt đúng 3 dependency canonical:
- `axios`: `1.20.0` (MIT License)
- `react-native-keychain`: `10.0.0` (MIT License)
- `@react-native-async-storage/async-storage`: `3.1.1` (MIT License)
- Cấu hình an toàn: `npm config get allow-scripts` = `opencode-ai`.
- Tương thích hoàn toàn với React Native 0.88.0, React 19.3.0, Hermes và New Architecture (C++ / Fabric / TurboModules).

## 3. Environment Configuration Foundation
- Triển khai tại `mobile/src/shared/config/environment.ts` & `index.ts`.
- Môi trường development (`__DEV__`): mặc định canonical `http://10.0.2.2:8080/api/v1` cho Android emulator kết nối backend máy host.
- Môi trường production: bắt buộc HTTPS, không dùng fallback domain giả, bắt buộc cấu hình tường minh tại bootstrap runtime.
- Chuẩn hóa URL (`normalizeApiBaseUrl`): cắt bỏ trailing slash, đảm bảo hậu tố `/api/v1` xuất hiện đúng 1 lần, từ chối URL sai cấu trúc hoặc không an toàn.
- Khả năng kiểm thử: hỗ trợ `setEnvironmentConfig` và `resetEnvironmentConfig` cho testing isolation.

## 4. API Types & Envelope Decoder
- Triển khai tại `mobile/src/shared/api/apiTypes.ts` và `apiEnvelope.ts`.
- Bám sát chính xác backend `ApiResponse.java` và `PagedData.java`:
  - `ApiResponse<T>`: `success`, `data?`, `code?`, `message?`, `fieldErrors?`, `timestamp`, `traceId?`.
  - Tương thích Jackson `@JsonInclude(JsonInclude.Include.NON_NULL)` khi backend trả về lỗi hoặc `successNoContent` không có thuộc tính `data`.
  - `PagedData<T>`: `items`, `page`, `size`, `totalItems`, `totalPages`, `hasNext`, `hasPrevious`.
  - `PageRequest`: `page`, `size`, `sort`.
- Type guards & unwrap pure functions:
  - `isApiResponse`: kiểm tra cấu trúc envelope.
  - `isApiErrorEnvelope`: phát hiện phản hồi thất bại từ backend.
  - `unwrapApiResponse`: bóc tách payload dữ liệu, ném lỗi kèm `backendCode`, `traceId`, `fieldErrors` nếu backend báo thất bại mà không lộ cấu trúc thô ra UI.

## 5. Normalized Error Model
- Triển khai tại `mobile/src/shared/api/apiError.ts`.
- Phân loại lỗi chuẩn hóa (`ApiErrorKind`):
  - `NETWORK_ERROR`: Mất kết nối, server unreachable, không nhận được phản hồi.
  - `TIMEOUT`: Quá thời gian chờ (15.000 ms hoặc `ECONNABORTED`).
  - `UNAUTHORIZED`: 401 Unauthorized.
  - `FORBIDDEN`: 403 Forbidden.
  - `NOT_FOUND`: 404 Not Found.
  - `CONFLICT`: 409 Conflict.
  - `VALIDATION_ERROR`: 400/422 kèm danh sách lỗi trường nhập liệu (`fieldErrors`).
  - `SERVER_ERROR`: 5xx từ backend.
  - `UNKNOWN_ERROR`: Lỗi chưa phân loại.
- Bảo mật thông tin lỗi: Tuyệt đối không để lộ Authorization header, token, câu lệnh SQL, stack trace hoặc cấu hình Axios vào thông báo lỗi trả về cho client.

## 6. Access Token Holder
- Triển khai tại `mobile/src/shared/storage/accessTokenStore.ts`.
- Lưu trữ hoàn toàn In-Memory (`inMemoryAccessToken: string | null`).
- API: `getAccessToken()`, `setAccessToken(token)`, `clearAccessToken()`.
- Tuyệt đối không ghi access token vào AsyncStorage hay Keychain.
- Không decode JWT hay suy diễn thời gian hết hạn trong shared layer.

## 7. Secure Storage (Keychain)
- Triển khai tại `mobile/src/shared/storage/secureStorage.ts`.
- Sử dụng `react-native-keychain` độc quyền cho Refresh Token foundation.
- Service identifier: `worksphere.refresh-token` (`SECURE_STORAGE_SERVICES.REFRESH_TOKEN`).
- API: `getRefreshToken()`, `setRefreshToken(token)`, `clearRefreshToken()`.
- Thao tác xóa có tính chất idempotent; từ chối token rỗng/whitespace; không log giá trị token.

## 8. Local Storage (AsyncStorage) - Hardened Strict Key Policy
- Triển khai tại `mobile/src/shared/storage/localStorage.ts` & `storageKeys.ts`.
- Sử dụng `@react-native-async-storage/async-storage` cho dữ liệu không nhạy cảm (`THEME_PREFERENCE`, `ONBOARDING_COMPLETED`).
- Namespace chuẩn: `@worksphere/<key>`.
- Giải quyết triệt để rủi ro `LOCAL_STORAGE_KEY_POLICY_RISK`:
  - Loại bỏ hoàn toàn cơ chế substring blacklist (`['token', 'password', 'secret', 'auth']`) để triệt tiêu false positives (`authorPreference`) và false negatives (`sessionData`, `jwt`, `credentials`).
  - Sử dụng định nghĩa kiểu nghiêm ngặt: `LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS]`.
  - Bổ sung runtime guard `assertAllowedKey(key)` kiểm tra tập hợp `Set<string>(Object.values(LOCAL_STORAGE_KEYS))` bảo vệ ứng dụng trước các caller JavaScript untyped; không in chuỗi khóa lạ vào thông báo lỗi để tránh rò rỉ.
  - Hàm `getJson<T>` bắt buộc truyền hàm `parser: (value: unknown) => T`, loại bỏ hoàn toàn việc ép kiểu mù quáng `as T`. Nếu parser ném lỗi hoặc JSON hỏng, hàm trả về `null` an toàn.

## 9. Axios Client & Interceptors
- Triển khai tại `mobile/src/shared/api/apiClient.ts`.
- Cấu hình baseURL lấy động từ Environment config, timeout 15.000 ms, headers mặc định `Accept: application/json` và `Content-Type: application/json`.
- Ghi nhận: `AXIOS_MULTIPART_CONTENT_TYPE_OVERRIDE_REQUIRED` (khi triển khai upload tệp ở các phase sau, helper upload cần override/xóa Content-Type để Axios sinh boundary).
- Request Interceptor: Tự động đính kèm `Authorization: Bearer <token>` nếu In-Memory store có access token; bỏ qua header nếu token vắng mặt; không bao giờ log header chứa token.
- Response Interceptor: Bắt mã 401 để kích hoạt callback `notifyUnauthorized()`, chuẩn hóa mọi lỗi vận chuyển/HTTP thành `NormalizedApiError`.
- Typed HTTP Helpers: `http.get`, `http.post`, `http.put`, `http.delete` hỗ trợ gọi API sạch sẽ với typed envelope.

## 10. 401 Unauthorized Callback Foundation
- Cơ chế callback không phụ thuộc navigation: `setUnauthorizedHandler`, `notifyUnauthorized`.
- Khi interceptor bắt gặp HTTP 401:
  - Gọi handler đã đăng ký đúng 1 lần cho request lỗi.
  - Không tự ý retry request hoặc tự động gọi refresh token.
  - Không điều hướng trực tiếp hay xóa storage trong shared network module.
  - Trao toàn quyền quản lý phiên đăng nhập cho Phase 13.

## 11. Android Debug Network Security Configuration
- Tạo `mobile/android/app/src/debug/res/xml/network_security_config.xml`: Chỉ cho phép cleartext traffic (HTTP) cho các host cục bộ:
  - `10.0.2.2` (Android emulator kết nối host)
  - `localhost` và `127.0.0.1`
- Khai báo tại `mobile/android/app/src/debug/AndroidManifest.xml` áp dụng cấu hình này riêng cho variant debug.
- Bản release (`mobile/android/app/src/main/AndroidManifest.xml`) giữ nguyên chính sách bảo mật HTTPS mặc định của Android (`android:usesCleartextTraffic="false"`).

## 12. Unit Tests & Static Validation
- Viết 47 unit tests phủ toàn diện (sau khi patch hardening):
  - `__tests__/config/environment.test.ts`: Kiểm tra dev default, chuẩn hóa trailing slash, từ chối HTTP production, injectable config.
  - `__tests__/storage/accessTokenStore.test.ts`: Kiểm tra in-memory get/set/clear, cách ly state.
  - `__tests__/storage/secureStorage.test.ts`: Kiểm tra get/set/clear refresh token, chặn token rỗng, xử lý lỗi Keychain.
  - `__tests__/storage/localStorage.test.ts`: Kiểm tra set/get/remove allowlist keys, runtime rejection của arbitrary keys, loại bỏ false-positives của authorPreference, missing key trả null, malformed JSON an toàn, parse JSON với parser callback và xử lý parser rejection.
  - `__tests__/api/apiEnvelope.test.ts`: Kiểm tra unwrap thành công, null data, ném lỗi business/validation, giữ nguyên metadata.
  - `__tests__/api/apiError.test.ts`: Kiểm tra chuẩn hóa 9 loại lỗi (network, timeout, 400, 401, 403, 404, 409, 500, unknown).
  - `__tests__/api/apiClient.test.ts`: Kiểm tra gắn Bearer header, bỏ qua khi thiếu token, gọi 401 handler, an toàn khi không có handler.
- Kết quả test: **20 test suites PASS, 106/106 tests PASS**.
- `npm run lint`: **0 errors, 0 warnings**.
- `npm run typecheck`: **0 errors**.

## 13. Android Build & Native Linking
- Lệnh: `.\gradlew.bat assembleDebug --no-daemon`
- Kết quả: **BUILD SUCCESSFUL in 54s** (203 actionable tasks).
- Native modules `react-native-keychain` và `@react-native-async-storage/async-storage` biên dịch và liên kết thành công trên New Architecture và Hermes.

## 14. Android Emulator Smoke Test
- Thiết bị: `emulator-5554` (Android 15, API 35).
- Cài đặt APK: Thành công (`Performing Streamed Install -> Success`).
- Reverse port: `adb reverse tcp:8081 tcp:8081` thành công.
- Khởi chạy Metro dev server và mở app: Màn hình Login Shell (Phase 12) hiển thị hoàn hảo, không gặp crash, không lỗi native linking hay red screen.
- Dọn dẹp: Đã dừng tiến trình Metro background sau khi hoàn tất kiểm tra.

## 15. Security Verification
- Không hardcode IP LAN, mật khẩu, API key hay secret.
- In-memory access token không lưu vào đĩa hay log.
- LocalStorage có cơ chế chủ động ngăn chặn lưu trữ token/mật khẩu.
- Cleartext HTTP chỉ cho phép trên debug build cho 10.0.2.2 và localhost.

## 16. Phạm Vi Hoãn Lại Cho Phase 13
- Chưa thực hiện gọi API login (`POST /auth/login`).
- Chưa thực hiện orchestration refresh token (`POST /auth/refresh`).
- Chưa khôi phục phiên làm việc (session restoration) khi mở app.
- Chưa tạo Auth Store (Zustand) hay màn hình chức năng.

## 17. Deferred Evidence Tokens
- `PRODUCTION_ENVIRONMENT_WIRING_DEFERRED`: Build-variant env wiring (.env / native config) hoãn lại cho production pipeline.
- `KEYCHAIN_NATIVE_OPERATION_SMOKE_DEFERRED`: Native module linked/compiled; thao tác Keystore runtime hoãn đến khi có token thật trong Phase 13.
- `ASYNC_STORAGE_NATIVE_OPERATION_SMOKE_DEFERRED`: Native module linked/compiled; thao tác ghi/đọc AsyncStorage runtime hoãn đến khi có màn hình tính năng.
- `AXIOS_MULTIPART_CONTENT_TYPE_OVERRIDE_REQUIRED`: Content-Type mặc định application/json cần override khi upload tệp multipart ở các phase sau.

## 18. Files Changed
- `mobile/package.json`
- `mobile/package-lock.json`
- `mobile/android/app/src/debug/AndroidManifest.xml`
- `mobile/android/app/src/debug/res/xml/network_security_config.xml`
- `mobile/src/shared/config/environment.ts`
- `mobile/src/shared/config/index.ts`
- `mobile/src/shared/api/apiTypes.ts`
- `mobile/src/shared/api/apiEnvelope.ts`
- `mobile/src/shared/api/apiError.ts`
- `mobile/src/shared/api/apiClient.ts`
- `mobile/src/shared/api/index.ts`
- `mobile/src/shared/storage/storageKeys.ts`
- `mobile/src/shared/storage/accessTokenStore.ts`
- `mobile/src/shared/storage/secureStorage.ts`
- `mobile/src/shared/storage/localStorage.ts`
- `mobile/src/shared/storage/index.ts`
- `mobile/__tests__/config/environment.test.ts`
- `mobile/__tests__/storage/accessTokenStore.test.ts`
- `mobile/__tests__/storage/secureStorage.test.ts`
- `mobile/__tests__/storage/localStorage.test.ts`
- `mobile/__tests__/api/apiEnvelope.test.ts`
- `mobile/__tests__/api/apiError.test.ts`
- `mobile/__tests__/api/apiClient.test.ts`
- `reports/PHASE_12D_NETWORK_STORAGE_REPORT.md`
- `reports/PROJECT_STATE.md`
- `reports/HANDOFF.md`
