# BÁO CÁO PHASE 12A: KHỞI TẠO VÀ KIỂM CHỨNG REACT NATIVE SCAFFOLD BASELINE

**Repository:** `D:\WorkSphere`
**Ngày thực hiện:** 17/10/2026
**Trạng thái thực thi:** THÀNH CÔNG (PASS)

---

## 1. Checkpoint Ban Đầu

- **Base Checkpoint:** `ab006e409a57bec93bd98b03b38d5188b98304f8` (`docs(tooling): record phase 12 android prerequisites`)
- **Trạng thái trước khi chạy:**
  - Branch: `main`
  - `HEAD` = `origin/main` = `ab006e409a57bec93bd98b03b38d5188b98304f8`
  - Working tree: clean
  - Thư mục `mobile/`: chỉ chứa duy nhất `mobile/.gitkeep`

---

## 2. Lệnh Khởi Tạo Scaffold Nguyên Bản (Init Command)

Thực hiện tạo scaffold trong thư mục tạm `D:\WorkSphere\.phase12-scaffold` để đảm bảo an toàn tuyệt đối cho repository:

```powershell
cd D:\WorkSphere\.phase12-scaffold
npx @react-native-community/cli@20.2.0 init WorkSphereMobile --version 0.88.0 --pm npm
```

Sau khi khởi tạo thành công, toàn bộ mã nguồn sạch (loại trừ `node_modules`, `.git`, `.gradle`, `build`) được chuyển vào `D:\WorkSphere\mobile`. File `mobile/.gitkeep` được gỡ bỏ và thư mục tạm `.phase12-scaffold` được xóa hoàn toàn.

---

## 3. Các Phiên Bản Nguyên Bản Sinh Ra (Generated Versions)

- **React Native:** `0.88.0`
- **React:** `19.3.0`
- **TypeScript:** `^6.0.3`
- **Community CLI:** `20.2.0`
- **Node.js Baseline:** `v24.19.0` (Định nghĩa `mobile/.node-version: 24.19.0`, `package.json` engines: `node: >=24.3.0 <25`)
- **npm:** `11.17.0`
- **Gradle Wrapper:** `Gradle 9.4.1` (`gradle-9.4.1-bin.zip`)
- **Android Gradle Plugin (AGP):** Tích hợp qua `com.android.tools.build:gradle` và `react-native-gradle-plugin`
- **Kotlin:** `2.2.0`
- **compileSdkVersion:** `37` (Android API 37.0)
- **targetSdkVersion:** `36`
- **minSdkVersion:** `24`
- **buildToolsVersion:** `37.0.0`
- **ndkVersion:** `27.1.12297006`
- **New Architecture:** `newArchEnabled=true` (Bật mặc định)
- **JS Engine:** Hermes (`hermesEnabled=true`)

---

## 4. Danh Mục Tập Tin Sinh Ra (Scaffold Inventory)

1. Cấu hình gốc dự án:
   - `mobile/package.json`
   - `mobile/package-lock.json`
   - `mobile/tsconfig.json`
   - `mobile/.eslintrc.js`
   - `mobile/.prettierrc.js`
   - `mobile/babel.config.js`
   - `mobile/metro.config.js`
   - `mobile/jest.config.js`
   - `mobile/app.json`
   - `mobile/.watchmanconfig`
   - `mobile/Gemfile`
   - `mobile/.gitignore`
   - `mobile/.node-version`
   - `mobile/README.md`
2. Mã nguồn ứng dụng:
   - `mobile/index.js`
   - `mobile/App.tsx`
   - `mobile/__tests__/App.test.tsx`
3. Thư mục nền tảng:
   - `mobile/android/`: Toàn bộ source wrapper Gradle, manifests, `MainActivity.kt`, `MainApplication.kt`, resources và debug signing config.
   - `mobile/ios/`: Toàn bộ cấu trúc Xcode project và Podfile.

---

## 5. Kết Quả Cài Đặt Dependency (`npm ci`)

Thực hiện trong `D:\WorkSphere\mobile` bằng lệnh `npm ci` dựa trên `package-lock.json`:
- **Kết quả:** `added 857 packages, and audited 858 packages in 41s` (Exit code: 0).
- Không tự ý chạy `npm audit fix` hay nâng cấp version.

---

## 6. Kết Quả Kiểm Tra Tĩnh (Static Validation)

1. **Lint (`npm run lint`):**
   - Lệnh: `eslint .`
   - Kết quả: PASS (0 errors, 0 warnings).
2. **Jest Unit Test (`npm test -- --runInBand`):**
   - Lệnh: `jest --runInBand`
   - Kết quả: PASS (`__tests__/App.test.tsx` renders correctly, 1 suite passed, 1 test passed).
3. **Typecheck (`npm run typecheck`):**
   - Lệnh: `tsc --noEmit`
   - Kết quả: PASS (0 errors).

---

## 7. Môi Trường Gradle / JDK

- **Java Home Session:** `$env:JAVA_HOME = "D:\Android\jbr"` (OpenJDK 25.0.3, Android Studio JBR).
- **Android SDK Session:** `$env:ANDROID_HOME = "D:\AndroidSDK"`.
- **Gradle Version Check:** `.\gradlew.bat --version` nhận diện chính xác `Gradle 9.4.1`, `Launcher JVM: 25.0.3 (JetBrains s.r.o.)`.
- **Cấu hình Cục Bộ:** Tạo `mobile/android/local.properties` chứa `sdk.dir=D\:\\AndroidSDK` (được `.gitignore` bảo vệ, không commit). Không cấu hình `org.gradle.java.home` vào Git repository.

---

## 8. Kết Quả Android Build (`assembleDebug`)

- **Lệnh thực thi:**
  ```powershell
  cd D:\WorkSphere\mobile\android
  .\gradlew.bat clean
  .\gradlew.bat assembleDebug --no-daemon --stacktrace
  ```
- **Kết quả:** **BUILD SUCCESSFUL in 4m 28s** (93 actionable tasks: 83 executed, 10 up-to-date, Exit code: 0).
- CMake 3.22.1 được tự động tải vào `D:\AndroidSDK\cmake\3.22.1` bằng license chính thức đã có.
- Biên dịch thành công toàn bộ C++ TurboModules cho 4 kiến trúc: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`.

---

## 9. Xác Minh Debug APK

- **Đường dẫn tập tin:** `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- **File tồn tại:** `True`
- **Kích thước:** `125,271,415 bytes` (~119.5 MB bao gồm 4 architectures và Hermes engine)
- **Mã băm SHA-256:** `91740B31DC30243C3A428EF06536925B82EA1F0E84A9C41E0196A5189F5D82B1`
- **Trạng thái Git:** Tập tin APK và thư mục `build/` được bỏ qua hoàn toàn bởi `.gitignore`.

---

## 10. Kết Quả Smoke Test Trên Emulator (`emulator-5554`)

1. **Cài đặt APK:**
   - Lệnh: `adb -s emulator-5554 install -r app-debug.apk`
   - Kết quả: `Performing Streamed Install -> Success`.
2. **Khởi chạy ứng dụng:**
   - Lệnh: `adb -s emulator-5554 shell am start -n com.workspheremobile/.MainActivity`
   - Tiến trình: PID `24918` khởi chạy thành công.
3. **Kết nối Metro Bundler:**
   - `adb -s emulator-5554 reverse tcp:8081 tcp:8081`
   - Metro bundle `index.js` thành công 100%.
4. **Hiển thị giao diện:**
   - Ứng dụng không có lỗi fatal crash.
   - Màn hình khởi đầu chính thức của React Native 0.88.0 hiển thị trọn vẹn: logo React, dòng chữ *"Welcome to React Native"*, *"Version: 0.88.0"*, *"JS Engine: Hermes (260318099.0.4)"*, các thẻ *"Learn & Explore"*.
   - Ảnh chụp minh chứng kiểm thử được lưu trữ tại: `design/prototype/review-output/smoke_phase12a_starter.png`.

---

## 11. Báo Cáo Bảo Mật (Secret Scan)

Quét toàn bộ tập tin được staged trong `mobile/`:
- `password`: Chỉ xuất hiện mật khẩu mặc định của debug keystore trong template (`android`).
- `keystore`: Chỉ tham chiếu `debug.keystore` nguyên bản đi kèm template.
- `usesCleartextTraffic`: Cấu hình tham số placeholder `${usesCleartextTraffic}` trong AndroidManifest theo chuẩn React Native.
- `token`, `secret`, `api_key`: Không phát hiện bất kỳ bí mật hay khóa nhạy cảm nào.
- Thư mục `mobile/.gitignore` đã bổ sung các quy tắc chặn nghiêm ngặt: `.env`, `.env.*`, `*.jks`.

---

## 12. Cam Kết Phạm Vi (Scope Compliance)

- **Dependencies:** Tuyệt đối không thêm bất kỳ package nào ngoài template gốc. Không có React Navigation, Axios, Keychain, AsyncStorage, TanStack Query, Zustand, React Hook Form hay Zod.
- **Tính năng:** Chưa code Navigation Shell, Theme, Components, HTTP Client, Token Storage hay màn hình nghiệp vụ nào.
- **Backend / Migration / Docs:** Không sửa backend, migration hay tài liệu canonical.
- **Phase 13:** Chưa bắt đầu.

---

## 13. Kết Luận

Phase 12A đã hoàn thành xuất sắc tất cả các mục tiêu đề ra: khởi tạo scaffold sạch, cài đặt npm reproducible, vượt qua toàn bộ lint/test/typecheck, build Android Debug APK thành công và hoàn thành smoke test hiển thị trên emulator.

```text
PHASE_12A_SCAFFOLD_PASS_PUSHED
```

---

## 14. Ghi Chú Kiểm Toán Môi Trường và CI (Environment & CI Patch Audit Note)

- **Khôi phục cấu hình npm cấp người dùng:** Trong quá trình khởi tạo Phase 12A, cấu hình cấp người dùng `allow-scripts` tạm thời bị gỡ bỏ để tránh xung đột `npm init`. Sau kiểm toán, thiết lập cấp người dùng đã được khôi phục nguyên trạng về `allow-scripts=opencode-ai` trong `C:\Users\dienm\.npmrc`.
- **Khả năng tương thích `npm ci`:** Sau khi khôi phục `allow-scripts=opencode-ai`, thực thi `npm ci` trong thư mục `mobile/` đạt kết quả PASS (exit code 0, 857 packages added, không phát sinh `EALLOWSCRIPTS`). Thiết lập `allow-scripts=opencode-ai` được duy trì an toàn.
- **Minh chứng smoke screenshot:** Ảnh chụp màn hình `design/prototype/review-output/smoke_phase12a_starter.png` là bằng chứng kiểm thử cục bộ được `.gitignore` bảo vệ, không commit vào repository Git.
- **Debug keystore và bí mật:** Tập tin `debug.keystore` là artifact mẫu chính thức đi kèm template React Native phục vụ môi trường phát triển cục bộ và debug build. Tuyệt đối không theo dõi release keystore hay release signing credentials trong Git.
- **Khắc phục lệch phiên bản CI Node:** Đồng bộ cấu hình CI trong `.github/workflows/ci.yml` sử dụng `node-version-file: mobile/.node-version` (Node 24.19.0) thay thế cho phiên bản cũ `node-version: 20`, đồng thời thiết lập chu trình kiểm thử chất lượng di động (`npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`).
