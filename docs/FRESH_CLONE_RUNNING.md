# Thành viên khác chạy từ source

Lấy đúng nhánh feat/authorization-foundation cho đến khi PR được merge. Không copy database hoặc tệp mật khẩu trên máy người khác. Hướng dẫn Windows; chưa xác minh launcher trên Linux/macOS.

## Chuẩn bị

- Git, JDK 21 trở lên (backend target Java 21), Node 24.
- PostgreSQL đang chạy local; biết tài khoản/password quản trị để tạo một database thử riêng. Có psql.exe trong PATH hoặc cung cấp PgBinPath.
- Internet cho Maven Wrapper tải Maven/dependencies ở lượt đầu. Backend có mvnw.cmd và cấu hình Wrapper. Android thêm Android Studio/SDK, ANDROID_HOME và USB debugging được chính người dùng cho phép.

```powershell
git clone --branch feat/authorization-foundation https://github.com/Khiemnh158/worksphere-app.git
cd worksphere-app
.\scripts\run-local.ps1 -PgBinPath 'C:\Program Files\PostgreSQL\16\bin'
```

Đổi đường dẫn PostgreSQL cho đúng máy. Script hỏi mật khẩu PostgreSQL bằng ô nhập ẩn nếu chưa có WORKSPHERE_DB_PASSWORD. Không đưa password vào lệnh/chụp màn hình hoặc Git. Mặc định PostgreSQL 5432, database worksphere_web_local, API 18120, web 18110. Có thể chọn DbPort/DbName/ApiPort/WebPort; database phải tên thường bắt đầu worksphere_web và là môi trường thử riêng.

Script build backend, chạy Flyway và tạo dữ liệu tài khoản demo; tạo JWT/mật khẩu thử riêng tại .local/runtime.json. Tài khoản ở .local/accounts.txt; thư kích hoạt/reset trong .local/mailbox. Cả .local bị loại khỏi Git. Không tự tạo lịch công/lương. HR cấu hình lịch theo chính sách đã chọn.

Chạy lại sẽ nhận đúng hai tiến trình đã ghi và báo URL sẵn sàng; cổng thuộc tiến trình khác sẽ báo lỗi, không giết dịch vụ khác. Dừng bằng:

```powershell
.\scripts\run-local.ps1 -Stop
```

Không dừng PostgreSQL, không xóa dữ liệu. Muốn cập nhật source đang chạy: Stop, cập nhật đúng nhánh rồi chạy lại. Không đổi database của checkout sau khi cấu hình; dùng checkout mới/database riêng nếu cần môi trường khác. Không tự nhận một database đã tồn tại vào lần setup đầu.

## Android có sẵn giao diện, không cần Metro

```powershell
cd mobile
npm ci
cd android
.\gradlew.bat assembleLocalDemo -PreactNativeArchitectures=arm64-v8a -PWORKSPHERE_API_BASE_URL=http://127.0.0.1:18120/api/v1 --max-workers=2
cd ../..
.\scripts\run-android-local.ps1
```

Giả lập x86_64: thay kiến trúc thành x86_64; có thể build cả hai bằng '-PreactNativeArchitectures=arm64-v8a,x86_64'. Nếu có nhiều thiết bị, truyền DeviceId. Launcher kiểm APK có bundle/đúng kiến trúc, reverse cổng API qua USB và cài cập nhật, không xóa app. Điện thoại tự xử lý hộp cho phép USB/camera.

Bản localDemo debug-signed, chỉ cho loopback/emulator HTTP và tắt dev support; release vẫn yêu cầu HTTPS, chưa ký phát hành. Giao diện đã nằm trong APK nhưng backend vẫn phải chạy; giữ USB. Không phải ứng dụng dùng được ở mọi nơi sau khi rút USB. Nếu API dùng cổng khác, truyền ApiPort cho launcher (ClientPort mặc định 18120 phải khớp URL build).

Windows đường dẫn dài: ưu tiên clone vào đường dẫn ngắn. Nếu dùng ổ subst cho native build, đặt WORKSPHERE_JS_ROOT là đường dẫn mobile gốc cho Metro; không đổi root Gradle sang ổ khác. Xem docs/MOBILE_RUNNING.md. Hai script không tự cài JDK/PostgreSQL/SDK và không tự đổi thiết lập bảo mật máy.
