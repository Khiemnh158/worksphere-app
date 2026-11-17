# WorkSphere Mobile

Module ứng dụng di động WorkSphere xây dựng bằng React Native và TypeScript theo kiến trúc chuẩn hóa.

## 1. Phiên Bản Toolchain Đã Xác Minh

- **React Native**: `0.88.0`
- **React**: `19.3.0`
- **TypeScript**: `^6.0.3`
- **Node.js Baseline**: `v24.19.0` (Hỗ trợ engine `node: >=24.3.0 <25`)
- **npm**: `11.17.0`
- **Gradle**: `9.4.1` (Gradle Wrapper `gradlew.bat`)
- **Kotlin**: `2.2.0`
- **New Architecture**: Bật mặc định (`newArchEnabled=true`)
- **JS Engine**: Hermes (`hermesEnabled=true`)

## 2. Tiền Điều Kiện Android SDK

Dự án yêu cầu Android SDK đặt tại `D:\AndroidSDK` với các thành phần:
- **compileSdkVersion**: `37` (`platforms/android-37.0`)
- **buildToolsVersion**: `37.0.0` (`build-tools/37.0.0`)
- **targetSdkVersion**: `36`
- **minSdkVersion**: `24`
- **ndkVersion**: `27.1.12297006` (`ndk/27.1.12297006`)

## 3. Thiết Lập Biến Môi Trường Phiên Làm Việc (Session Environment)

Thiết lập biến môi trường cục bộ trước khi build Android (không sửa cấu hình vĩnh viễn):

```powershell
$env:JAVA_HOME = "D:\Android\jbr"
$env:ANDROID_HOME = "D:\AndroidSDK"
$env:ANDROID_SDK_ROOT = "D:\AndroidSDK"
```

*Lưu ý:* `android/local.properties` chỉ tồn tại cục bộ máy phát triển (chứa `sdk.dir=D\:\\AndroidSDK`) và đã được thêm vào `.gitignore`, tuyệt đối không commit lên Git.

## 4. Các Lệnh Thực Thi Chuẩn

Tất cả các lệnh chạy trong thư mục `mobile/`:

```powershell
# Cài đặt dependency nguyên bản
npm ci

# Kiểm tra tĩnh và định dạng
npm run lint

# Kiểm tra kiểu TypeScript
npm run typecheck

# Chạy unit tests
npm test -- --runInBand

# Build Android Debug APK
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug --no-daemon
```

File APK tạo ra tại: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

## 5. Hướng Dẫn Kết Nối Mạng Cho Emulator / Thiết Bị Thật

- **Android Emulator**: Sử dụng địa chỉ `http://10.0.2.2:8080/api/v1` để kết nối vào backend WorkSphere chạy trên máy host.
- **Thiết Bị Thật (Physical Device)**: Sử dụng IP LAN của máy host (ví dụ: `http://192.168.x.x:8080/api/v1`).
- *Cảnh báo:* Không sử dụng `localhost` hoặc `127.0.0.1` bên trong emulator vì sẽ trỏ vào chính máy ảo Android.

## 6. Phạm Vi Phase 12A

- **iOS Build**: Môi trường Windows không hỗ trợ biên dịch native iOS. Bản build iOS chỉ khả dụng trên macOS hoặc CI macOS.
- **Nghiệp vụ**: Giai đoạn 12A chỉ khởi tạo và xác minh React Native scaffold nguyên bản. Chưa triển khai bất kỳ tính năng nghiệp vụ, màn hình Đăng nhập (Phase 13), hay các dependencies WorkSphere (React Navigation, Axios, Keychain, AsyncStorage, TanStack Query, Zustand).
