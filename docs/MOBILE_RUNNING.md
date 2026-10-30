# Chạy Android cùng cổng web hiện hành

## Trên máy làm đồ án hiện tại

Mở outputs/Mo-WorkSphere-Mobile.cmd ở thư mục workspace (ngoài Git). Launcher gọi Run-WorkSphere-Web.ps1 trước, dùng backend 18120 và cùng database worksphere_web; Metro 8081, giả lập Small_Phone, adb reverse hai cổng. Tài khoản/mật khẩu thử nằm trong outputs/Tai-khoan-Web-local.txt riêng trên máy, không upload. Cổng web: http://127.0.0.1:18110/.

APK hiện tại là debug x86_64, cần Metro và máy chủ local; không phải APK phát hành cho điện thoại ARM. Hai launcher cũ Run-WorkSphere.ps1/checkout outputs/WorkSphere trỏ baseline 18080, không dùng cho nghiệp vụ mới.

Nếu cổng 8081 thuộc một dự án khác, dừng đúng Metro của dự án đó hoặc đổi cổng đồng bộ; launcher không tự giết tiến trình không rõ nguồn. Không tạo tài khoản/mật khẩu dễ đoán hoặc copy token web vào mobile.

## Build từ clone mới

- Node theo package.json: >=24.3.0 <25; lượt này dùng 24.22.1. npm ci trong mobile.
- Backend Java 21 (pom.xml). Android đã build bằng JBR 25 của Android Studio, Gradle Wrapper 9.4.1, Kotlin plugin 2.2.0; JBR là toolchain native trên máy, không đổi mục tiêu backend sang Java 25.
- SDK compile 37/build tools 37.0.0, target 36, min 24, NDK 27.1.12297006. Cấu hình ANDROID_HOME và mobile/android/local.properties của chính máy; không commit đường dẫn máy.
- Wrapper JAR chính thức được khôi phục; SHA-256 55243ef57851f12b070ad14f7f5bb8302daceeebc5bce5ece5fa6edb23e1145c. Đã so với checksum công bố tại https://services.gradle.org/distributions/gradle-9.4.1-wrapper.jar.sha256. Distribution checksum ghim trong gradle-wrapper.properties.

Trong mobile:

```sh
npm ci
npm run typecheck
npm test -- --runInBand
npm start -- --host 127.0.0.1 --port 8081
```

Trong mobile/android, một terminal khác:

```powershell
.\gradlew.bat assembleDebug -PreactNativeArchitectures=x86_64 -PWORKSPHERE_API_BASE_URL=http://127.0.0.1:18120/api/v1 --max-workers=2
adb -s emulator-5554 reverse tcp:18120 tcp:18120
adb -s emulator-5554 reverse tcp:8081 tcp:8081
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5554 shell am start -n com.workspheremobile/.MainActivity
```

Không dùng adb reverse thì build URL http://10.0.2.2:18120/api/v1 cho giả lập. Máy thật qua USB có thể reverse cùng cổng nhưng phải build kiến trúc arm64-v8a phù hợp; không đổi HTTP thành release. Release bắt buộc URL HTTPS và cấu hình ký riêng, chưa xác minh đợt này.

Windows: nếu CMake/prefab báo đường dẫn >260 ký tự, dùng thư mục clone và cache Gradle có đường dẫn ngắn. Lượt này dùng subst W: trỏ repo, G: trỏ cache có sẵn; đó chỉ là cấu hình cục bộ, không sửa registry/tắt bảo vệ Windows. Nên --max-workers=2 trên máy ít RAM. Không chạy clean tùy tiện để tránh mất cache build.

## Kiểm tra đúng phạm vi

Đăng nhập nhân viên → việc được giao → lịch sử bàn giao → ghi chú → mở web cùng tài khoản và tải lại. QR: mở điểm chấm công được phân quyền trên web, quét mã đang xoay từ điện thoại; thời gian/người chấm do máy chủ quyết định. Không có đồng bộ offline hoặc bằng chứng định vị tuyệt đối.

Email kích hoạt/reset dùng hộp thư thử local; dán liên kết vào màn mobile. Mã một lần và hạn dùng do máy chủ kiểm tra; app không tự cấp token/mật khẩu tạm. TOTP/mã dự phòng nhập lúc đăng nhập, thiết lập và quản lý phiên qua web.

Camera Android dùng JourneyApps ZXing embedded 4.3.0: https://github.com/journeyapps/zxing-android-embedded. iOS cần triển khai scanner native tương ứng và kiểm tra trên macOS, không nhận là đã hỗ trợ quét iOS.
