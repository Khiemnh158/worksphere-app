# 13. MOBILE TEST LAB GUIDE - WORKSPHERE MOBILE

Tài liệu này xác lập quy trình vận hành, kết nối, tự động hóa và thu thập bằng chứng kiểm thử trên môi trường di động thực tế (Android Emulator và Android SDK) cho dự án WorkSphere.

---

## 1. Phát hiện và Khởi tạo Môi trường Android SDK & ADB

### 1.1. Thứ tự tìm kiếm công cụ ADB (ADB Discovery Order)
Khi thực hiện kiểm tra hoặc tương tác kiểm thử, tìm kiếm đường dẫn thực thi `adb.exe` theo đúng thứ tự ưu tiên sau trên hệ điều hành Windows:

1. Lệnh trong PATH hệ thống: `Get-Command adb`
2. Biến môi trường ANDROID_HOME: `$env:ANDROID_HOME\platform-tools\adb.exe`
3. Biến môi trường ANDROID_SDK_ROOT: `$env:ANDROID_SDK_ROOT\platform-tools\adb.exe`
4. Thư mục cài đặt mặc định: `$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe`
5. Đường dẫn SDK tùy biến đã cấu hình trên máy chủ: `D:\AndroidSDK\platform-tools\adb.exe`

> **Đường dẫn thực tế đã xác minh trên môi trường hiện tại**:
> `$adb = "D:\AndroidSDK\platform-tools\adb.exe"`
> Phiên bản xác nhận: Android Debug Bridge version `1.0.41` (Version 37.0.1).

### 1.2. Kiểm tra và Chọn Thiết bị Emulator Chuẩn
Chạy lệnh kiểm tra danh sách thiết bị:
```powershell
& $adb devices -l
```

**Quy tắc định danh thiết bị bắt buộc**:
- Chỉ tương tác với thiết bị có trạng thái `device`.
- Serial emulator chuẩn được chỉ định: `emulator-5554`.
- Luôn chỉ định cờ `-s emulator-5554` trong mọi lệnh ADB để tránh thao tác nhầm thiết bị khác nếu có nhiều thiết bị cắm vào máy.

### 1.3. Thu thập Thông số Thiết bị (Chỉ đọc)
Chỉ thực hiện đọc thông số hệ thống, tuyệt đối không ghi đè thuộc tính hệ điều hành:
```powershell
& $adb -s emulator-5554 shell getprop ro.product.model       # Kết quả: sdk_gphone64_x86_64
& $adb -s emulator-5554 shell getprop ro.build.version.release # Kết quả: 15
& $adb -s emulator-5554 shell getprop ro.build.version.sdk     # Kết quả: 35
& $adb -s emulator-5554 shell wm size                          # Kết quả: Physical size: 1080x2400
& $adb -s emulator-5554 shell wm density                       # Kết quả: Physical density: 420
```

> [!CAUTION]
> **Quy tắc bảo mật thiết bị**:
> Tuyệt đối không đọc, in ra log hoặc lưu trữ mã IMEI, địa chỉ MAC phần cứng, thông tin tài khoản Google hoặc bất kỳ định danh nhạy cảm nào vào kho mã nguồn (Git repository).

---

## 2. Kết nối Mạng giữa Emulator và Backend Máy Host

### 2.1. Bản chất Mạng Loopback của Android Emulator
- **Hiểu lầm phổ biến**: `localhost` hoặc `127.0.0.1` khi gọi từ bên trong ứng dụng mobile chạy trên emulator sẽ trỏ về **chính máy ảo Linux của emulator**, không phải máy tính host chạy backend.
- **Địa chỉ Loopback Host chuẩn**: Android Emulator thiết lập một router ảo (Virtual Router). Địa chỉ **`10.0.2.2`** là alias đặc biệt đại diện cho loopback interface (`127.0.0.1`) của máy host Windows.

### 2.2. Cấu hình Backend Host cho Mobile
- **URL cơ sở cho Mobile (Android Emulator)**:
  ```text
  http://10.0.2.2:8080/api/v1
  ```
- **Quy tắc chống Hard-code**:
  - Tuyệt đối không hard-code địa chỉ IP LAN tạm thời (ví dụ `10.0.2.16` hoặc IP Wi-Fi) vào mã nguồn ứng dụng vì IP này có thể thay đổi khi đổi mạng hoặc cấp phát lại DHCP.
  - Cấu hình endpoint thông qua biến môi trường hoặc file config nội bộ `API_BASE_URL` với fallback mặc định `http://10.0.2.2:8080/api/v1`.

### 2.3. Kiểm tra Tính sẵn sàng của Cổng Backend
Trước khi chạy kiểm thử mobile, kiểm tra backend trên máy host:
```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 8080
```
Backend phải phản hồi kết quả `TcpTestSucceeded: True`.

---

## 3. Quy trình Triển khai, Cài đặt và Điều khiển Ứng dụng (Mobile Runtime)

*Các bước này áp dụng khi source code React Native được triển khai (từ Phase 12).*

### 3.1. Build và Cài đặt APK
```powershell
# Chuyển vào thư mục mobile/android và build bản debug
./gradlew assembleDebug

# Cài đặt APK vào đúng emulator-5554
& $adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
```

### 3.2. Mở Package Ứng dụng
```powershell
& $adb -s emulator-5554 shell am start -n com.worksphere/.MainActivity
```

### 3.3. Dừng Ứng dụng
```powershell
& $adb -s emulator-5554 shell am force-stop com.worksphere
```

### 3.4. Xóa Dữ liệu Ứng dụng (App Data Cache)
*Chỉ thực hiện khi kịch bản kiểm thử yêu cầu reset phiên đăng nhập hoàn toàn:*
```powershell
& $adb -s emulator-5554 shell pm clear com.worksphere
```

### 3.5. Thu thập Logcat có Lọc (Process / Package Filtered Logcat)
Tuyệt đối không dump toàn bộ logcat hệ thống vì dung lượng lớn và có thể chứa log rác của Android OS:
```powershell
# Lọc logcat theo PID của ứng dụng WorkSphere
$pidApp = & $adb -s emulator-5554 shell pidof -s com.worksphere
& $adb -s emulator-5554 logcat -d --pid=$pidApp

# Hoặc lọc theo thẻ React Native chuyên dụng
& $adb -s emulator-5554 logcat -d -s ReactNative:V ReactNativeJS:V
```

---

## 4. Quy trình Chuẩn Chụp ảnh và Quay Video Màn hình (Screenshot & Video Protocol)

### 4.1. Lệnh PowerShell Chụp màn hình Chuẩn
```powershell
$adb = "D:\AndroidSDK\platform-tools\adb.exe"
$serial = "emulator-5554"
$fileName = "fig-4-04_scr-prj-01_success_20261015-091500.png"
$targetPath = "D:\WorkSphere\reports\screenshots\$fileName"

# Đảm bảo thư mục lưu trữ tồn tại
if (-not (Test-Path "D:\WorkSphere\reports\screenshots")) {
    New-Item -ItemType Directory -Path "D:\WorkSphere\reports\screenshots" -Force
}

# 1. Chụp màn hình lưu tạm vào sdcard của emulator
& $adb -s $serial shell screencap -p /sdcard/worksphere-screen.png

# 2. Kéo ảnh về thư mục chỉ định trên máy host
& $adb -s $serial pull /sdcard/worksphere-screen.png $targetPath

# 3. Dọn dẹp file tạm trên emulator ngay lập tức
& $adb -s $serial shell rm /sdcard/worksphere-screen.png
```

### 4.2. Quy tắc Đặt tên File Ảnh (Naming Convention)
Tên file phải tuân thủ nghiêm ngặt định dạng:
```text
<figure-id>_<screen-id>_<state>_<yyyyMMdd-HHmmss>.png
```
**Ví dụ**:
- `fig-4-01_scr-auth-02_success_20261015-083000.png`
- `fig-4-04_scr-prj-01_success_20261015-091500.png`
- `fig-4-07_scr-prj-02_optimistic-lock-conflict_20261015-100000.png`
- `fig-4-11_scr-prj-03_validation-error_20261015-103000.png`

### 4.3. Quy tắc Bảo mật Dữ liệu Ảnh
- Tuyệt đối không chụp màn hình có chứa mật khẩu dạng plaintext, mã token bí mật, API key, hoặc dữ liệu cá nhân nhạy cảm.
- Khi nhập form thử nghiệm, sử dụng dữ liệu mẫu học thuật đã quy định trong `design/12_REPORT_SCREENSHOT_PLAN.md`.

### 4.4. Quay Video Thao tác Ngắn (Screen Recording)
Phục vụ chứng minh các tương tác động (Pull to Refresh, Skeleton Loading, Optimistic Lock Dialog):
```powershell
# Ghi hình tối đa 30 giây
& $adb -s emulator-5554 shell screenrecord --time-limit 30 /sdcard/worksphere-demo.mp4

# Kéo video về host
& $adb -s emulator-5554 pull /sdcard/worksphere-demo.mp4 "D:\WorkSphere\reports\screenshots\worksphere-demo.mp4"

# Xóa file tạm
& $adb -s emulator-5554 shell rm /sdcard/worksphere-demo.mp4
```

---

## 5. Chính sách Tự động hóa Môi trường Runtime (Runtime Automation Policy)

Quy định phạm vi quyền hạn và ranh giới an toàn cho AI Agent khi thực hiện các nhiệm vụ kiểm thử di động và backend:

### 5.1. Các Hành động AI Agent ĐƯỢC PHÉP Thực hiện:
1. **Kiểm tra Docker Engine**: Kiểm tra trạng thái daemon, context và danh sách container (`docker ps -a`).
2. **Quản lý Container Database Dev**: Khởi động container `worksphere-dev-pg` khi và chỉ khi nhiệm vụ kiểm thử cần database dev thực tế.
3. **Khởi động Backend**: Chạy Spring Boot Backend bằng lệnh Maven Wrapper với profile kiểm thử phù hợp (`./mvnw spring-boot:run`).
4. **Kiểm tra Health Backend**: Gửi yêu cầu HTTP kiểm tra `/actuator/health` hoặc các endpoint test.
5. **Kiểm tra ADB & Chọn Thiết bị**: Phát hiện adb, kiểm tra `adb devices -l`, chỉ định đúng serial `emulator-5554`.
6. **Build & Cài đặt Mobile**: Build ứng dụng debug, cài đặt APK, mở package `com.worksphere/.MainActivity`.
7. **Điều khiển Tự động có Kiểm soát**: Thực thi lệnh ADB input (tap, text, keyevent) theo đúng kịch bản kiểm thử đã lên kế hoạch.
8. **Thu thập Bằng chứng**: Thu logcat có lọc PID, chụp ảnh screenshot theo đúng cú pháp tên file, quay video ngắn.
9. **Dọn dẹp Tiến trình**: Dừng ứng dụng mobile, dừng tiến trình backend do chính Agent khởi chạy khi hoàn thành nhiệm vụ.
10. **Xử lý Container Testcontainers**: Cho phép Testcontainers tự động tạo và hủy container PostgreSQL tạm trong quá trình chạy test JUnit.

### 5.2. Các Hành động AI Agent TUYỆT ĐỐI BỊ CẤM:
1. **Không can thiệp thiết bị ngoài**: Không gửi lệnh ADB đến các thiết bị di động vật lý hoặc emulator khác ngoài `emulator-5554`.
2. **Không tự ý chấp thuận điều khoản**: Không giả mạo đồng ý người dùng (fake consent) đối với các điều khoản pháp lý hoặc license của bên thứ ba.
3. **Không phá hủy máy ảo**: Tuyệt đối không chạy lệnh Factory Reset (`wipe-data`), không xóa AVD (Android Virtual Device).
4. **Không xóa dữ liệu SDK**: Không xóa hoặc sửa đổi nội dung trong thư mục Android SDK (`D:\AndroidSDK`).
5. **Không can thiệp hạ tầng cố định**:
   - **Tuyệt đối không dừng, sửa hoặc xóa container `jenkins-lts`**.
   - Không xóa container `worksphere-dev-pg`.
   - Không xóa bất kỳ Docker volume, network hoặc Docker image dùng chung nào trên máy host.
6. **Không can thiệp bảo mật hệ thống**: Không mở port public ra internet, không tắt Windows Firewall hoặc thay đổi proxy mạng.
7. **Không lưu trữ Secret**: Không ghi mật khẩu thật, JWT private key, API token vào mã nguồn, file log hoặc chụp ảnh dính secret.
8. **Không commit file rác vào Git**: Tuyệt đối không commit file APK/AAB, file keystore, file logcat thô, hoặc video ghi hình dung lượng lớn vào repository.

### 5.3. Xử lý Khi Gặp Hộp thoại Xác nhận Quyền (Permission Dialog Handling)
Nếu hệ điều hành Windows (UAC) hoặc Android Emulator hiển thị hộp thoại cấp quyền đặc quyền mà Terminal/PowerShell không thể xử lý an toàn:
- **Hành động**: Ngay lập tức dừng lại và báo cáo trạng thái **`BLOCKED_FOR_USER_ACTION`**.
- **Nội dung thông báo**: Nêu rõ ràng tên cửa sổ, nội dung yêu cầu, và nút bấm cụ thể người dùng cần thao tác bằng tay (ví dụ: *"Bấm 'Allow' trên màn hình Emulator để cấp quyền thông báo"*).
- **Ràng buộc an toàn**: Tuyệt đối không thực hiện click tọa độ mù (`adb shell input tap x y`) để vượt qua các cảnh báo bảo mật hệ thống. Không thực hiện vòng lặp vô hạn chờ đợi.
