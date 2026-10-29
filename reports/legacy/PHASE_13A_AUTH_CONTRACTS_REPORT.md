# Báo Cáo Kỹ Thuật Subphase 13A: Mobile Authentication DTOs, API Adapter, Pure Validators & Error Mapper

## 1. Thông Tin Checkpoint và Bối Cảnh Thực Thi

- **Kho lưu trữ:** `D:\WorkSphere`
- **Nhánh:** `main`
- **Pre-13A Base Commit:** `fb86802162c3458085509979b4061698b1a4627f` (không sử by bất kỳ SHA lệch nào)
- **Subphase 13A Implementation Checkpoint:** `be3c10a6dd34238be206452f2cf83b9b8e3a7504`
- **Governance Checkpoint trước Patch:** `e5de739fe5530f65d9fc3c0700075883cbdcb0a9`
- **Mục tiêu Subphase 13A:** Thiết lập nền tảng hợp đồng DTO, adapter API thuần túy, bộ kiểm tra tính hợp lệ biểu mẫu thuần túy, và bộ ánh xạ lỗi giao diện cho tính năng xác thực di động WorkSphere.
- **Quyết định kiến trúc:** D-058 (Đóng băng kiến trúc Phase 13), D-059 (Triển khai Subphase 13A), D-060 (Chính sách điều phối đa tác nhân).
- **Ranh giới nghiêm ngặt:** Phase 13B chưa bắt đầu; không triển khai AuthProvider, không triển khai màn hình, không triển khai refresh coordinator, không gọi API thật.

---

## 2. Danh Mục 9 Phương Thức API Adapter và Cấu Trúc URL

Tất cả 9 phương thức adapter trong `mobile/src/features/auth/api/authApi.ts` sử dụng đường dẫn tương đối (relative paths), được Axios tự động ghép với `apiBaseUrl` (`http://10.0.2.2:8080/api/v1` trong môi trường phát triển). Không xảy ra hiện tượng lặp tiền tố `/api/v1/api/v1`.

| STT | Phương thức Adapter | HTTP Method & Path Tương đối | URL Cuối Cùng (Axios Semantics) | Cơ chế Xác thực & Metadata |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `login(request)` | `POST /auth/login` | `http://10.0.2.2:8080/api/v1/auth/login` | Công khai, `skipAuthRefresh: true` |
| 2 | `refresh(request)` | `POST /auth/refresh` | `http://10.0.2.2:8080/api/v1/auth/refresh` | Công khai, `skipAuthRefresh: true` |
| 3 | `logout(request)` | `POST /auth/logout` | `http://10.0.2.2:8080/api/v1/auth/logout` | Được bảo vệ (Bearer token), 204 No Content |
| 4 | `logoutAll()` | `POST /auth/logout-all` | `http://10.0.2.2:8080/api/v1/auth/logout-all` | Được bảo vệ (Bearer token), 204 No Content |
| 5 | `forgotPassword(request)` | `POST /auth/forgot-password` | `http://10.0.2.2:8080/api/v1/auth/forgot-password` | Công khai, `skipAuthRefresh: true` |
| 6 | `resetPassword(request)` | `POST /auth/reset-password` | `http://10.0.2.2:8080/api/v1/auth/reset-password` | Công khai, `skipAuthRefresh: true` |
| 7 | `getCurrentUser()` | `GET /me` | `http://10.0.2.2:8080/api/v1/me` | Được bảo vệ (Bearer token) |
| 8 | `updateProfile(request)` | `PUT /me` | `http://10.0.2.2:8080/api/v1/me` | Được bảo vệ (Bearer token) |
| 9 | `changePassword(request)` | `PUT /me/password` | `http://10.0.2.2:8080/api/v1/me/password` | Được bảo vệ (Bearer token) |

**Nguyên tắc vận hành của adapter:**
- Hoạt động thuần túy như lớp vận chuyển HTTP;
- Tuyệt đối không lưu token vào Keychain hay AsyncStorage;
- Không tự ý thay đổi state toàn cục hay điều hướng;
- Không tự động retry đệ quy;
- Không in log thông tin đăng nhập, token hay mật khẩu.

---

## 3. Khảo Sát và Đối Soát Ràng Buộc Xác Thực Số Điện Thoại (Phone Validation Alignment)

- **Backend:** `UpdateProfileRequest.java` định nghĩa `@Size(max = 20) String phoneNumber`. Trường là tùy chọn (nullable), tối đa 20 ký tự, không áp đặt regex hay ký tự đặc biệt.
- **Mobile:** `authValidation.ts` triển khai `validateUpdateProfile`, chỉ kiểm tra `phoneTrimmed.length > 20`.
- **Đánh giá đồng bộ:**
  - `(024) 1234 5678`: 15 ký tự $\le 20 \rightarrow$ Hợp lệ.
  - `+84 912 345 678`: 15 ký tự $\le 20 \rightarrow$ Hợp lệ.
  - `0912-345-678`: 12 ký tự $\le 20 \rightarrow$ Hợp lệ.
  - Không có sự lệch pha xác thực (`PROFILE_PHONE_VALIDATION_DRIFT = NEGATIVE`).

---

## 4. Xử Lý Rủi Ro Khai Báo Kiểu Metadata (AXIOS_REQUEST_METADATA_TYPING_RISK Resolved)

### Vấn đề Phát Hiện trong Audit:
Module augmentation của `AxiosRequestConfig` trước đây được khai báo trực tiếp trong `mobile/src/features/auth/api/authTypes.ts`. Điều này vi phạm nguyên tắc phân tầng D-053 (`src/shared` không được import ngược từ `src/features`) và tạo ra rủi ro phụ thuộc thứ tự nạp kiểu trong TypeScript.

### Giải Pháp Triển Khai Bản Vá:
1. **Tạo tệp khai báo chuẩn:** Di chuyển định nghĩa module augmentation sang `mobile/src/shared/api/axios.d.ts` thuộc tầng vận chuyển dùng chung:
   ```typescript
   import 'axios';

   declare module 'axios' {
     interface AxiosRequestConfig {
       skipAuthRefresh?: boolean;
       _retry?: boolean;
     }
   }
   ```
2. **Loại bỏ khỏi Feature DTOs:** Xóa hoàn toàn khai báo `declare module 'axios'` khỏi `mobile/src/features/auth/api/authTypes.ts`.
3. **Độc lập và tự động nạp:** TypeScript tự động nạp `axios.d.ts` thông qua cấu hình `mobile/tsconfig.json` (`include: ["**/*.ts", "**/*.tsx"]`), đảm bảo mọi module (kể cả trong `src/shared/api/`) đều có định kiểu mà không cần import ngược từ `features`.
4. **Bảo toàn dữ liệu:** Thuộc tính `skipAuthRefresh` được truyền qua tham số cấu hình `config` của Axios và không bị rò rỉ vào thân yêu cầu (request body).

---

## 5. Kết Quả Kiểm Thử và Biên Dịch

- **Baseline Tests trước Patch:** 24 suites, 193/193 tests PASS (100%).
- **Tests sau Patch:** 24 suites, 194/194 tests PASS (bổ sung 1 test xác minh typed transport metadata không rò rỉ vào request body trong `apiClient.test.ts`).
- **Static Validation:**
  - `npm ci`: PASS (lockfile nguyên vẹn, cờ `allow-scripts=opencode-ai`).
  - `npm run lint`: PASS (0 errors, 0 warnings).
  - `npm run typecheck`: PASS (`tsc --noEmit` đạt 0 lỗi).
  - `npm test -- --runInBand`: PASS (24/24 suites, 194/194 tests, 0 skipped, 0 failures).
- **Android Native Build:**
  - Lệnh: `.\gradlew.bat assembleDebug --no-daemon` với `JAVA_HOME=D:\Android\jbr` và `ANDROID_HOME=D:\AndroidSDK`.
  - Kết quả: `BUILD SUCCESSFUL`, 203 actionable tasks, exit code 0.
  - Tệp APK: `app-debug.apk` tồn tại và được Git bỏ qua đúng quy chuẩn.

---

## 6. Ranh Giới Phạm Vi và Sẵn Sàng Chuyển Giao (13B Readiness)

- **Mã nguồn Backend:** Không thay đổi (0 changes).
- **Cơ sở dữ liệu & Migration:** Không thay đổi (0 changes).
- **Màn hình, Navigation & State:** Không thay đổi (0 changes).
- **Trạng thái Subphase 13A:** Hoàn tất, đã kiểm toán và đã vá lỗi dứt điểm.
- **Trạng thái Phase 13B:** **Chưa bắt đầu**. Sẵn sàng cho phiên làm việc tiếp theo để thực hiện Subphase 13B (AuthProvider, Auth State Machine, Login Flow, Local Logout, và Navigation Guard).
