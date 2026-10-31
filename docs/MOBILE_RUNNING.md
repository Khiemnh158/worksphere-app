# Bản Android localDemo hiện hành

Đã có APK chứa giao diện, không cần Metro, cho arm64-v8a và x86_64. Backend local/USB vẫn cần; chưa phải production/iOS. Đọc [cách chạy từ clone](FRESH_CLONE_RUNNING.md), dùng scripts/run-android-local.ps1. Bản thử chỉ loopback; release vẫn yêu cầu HTTPS.

Trên máy tác giả: outputs/WorkSphere-Android-local-demo.apk. Native build qua ổ subst: đặt WORKSPHERE_JS_ROOT trỏ đường dẫn mobile gốc cho Metro; Gradle vẫn chạy trên ổ ngắn.

Có trạng thái công/OT, cảnh báo mạng, khoảng nghỉ cụ thể và màn bảo mật TOTP/đổi mật khẩu/logout mọi thiết bị. Hồ sơ vẫn đọc; tệp/deep link/push còn TODO. Xem reports/ATTENDANCE_INCREMENT_2026-10-30.md.

## Hướng dẫn debug dùng Metro trước đây

Phần dưới giữ cho phát triển/debug, không phải yêu cầu chạy localDemo.

# Chạy Android cùng cổng web hiện hành

## Trên máy làm đồ án hiện tại

Mở outputs/Mo-WorkSphere-Mobile.cmd ở thư mục workspace (ngoài Git). Launcher gọi Run-WorkSphere-Web.ps1 trước, dùng backend 18120 và cùng database worksphere_web; Metro 8081, giả lập Small_Phone, adb reverse hai cổng. Tài khoản/mật khẩu thử nằm trong outputs/Tai-khoan-Web-local.txt riêng trên máy, không upload. Cổng web: http://127.0.0.1:18110/.

Đã có hai bản debug: x86_64 cho giả lập và arm64-v8a cho điện thoại Android. Cả hai cần Metro và máy chủ local, chưa phải bản phát hành độc lập. Hai launcher cũ Run-WorkSphere.ps1/checkout outputs/WorkSphere trỏ baseline 18080, không dùng cho nghiệp vụ mới.

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

## Điện thoại Android ARM64 qua USB — 30/10/2026

Đã build arm64-v8a thành công (3 phút 45 giây, 191 tasks), cài bằng adb và gửi lệnh mở trên OPPO CPH2603 chạy Android 16. Xác nhận camera/QR trọn vòng trên điện thoại thật còn chờ người dùng, không lấy việc cài thành công làm bằng chứng đã quét thành công.

Trên máy hiện tại: outputs/Mo-WorkSphere-OPPO.cmd; APK local outputs/WorkSphere-Android-arm64-debug.apk; hướng dẫn outputs/Thu-QR-tren-OPPO.md. Launcher nhận DeviceId/ApkPath, adb reverse 18120 và 8081; giữ USB trong lúc thử. Không đưa số thiết bị, tài khoản, APK hoặc cấu hình riêng lên Git.

Build như lệnh trên nhưng thay -PreactNativeArchitectures=x86_64 bằng -PreactNativeArchitectures=arm64-v8a. Luôn kiểm tra ABI trong APK trước khi cài. Mỗi bản build ghi đè app-debug.apk, nên giữ các bản cục bộ dưới tên riêng.

Người dùng chọn lịch công thử local tháng 10/2026: thứ Hai–thứ Sáu, 08:00–17:00, nghỉ 60 phút. Đã lưu qua web bằng HR thử; không thiết lập lương. Thử ngoài ca có thể ghi 0 phút công thường; công vẫn cần đối soát và không tự xác nhận OT.
