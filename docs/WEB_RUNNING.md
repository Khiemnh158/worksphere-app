# Chạy cổng web

## Trên máy hiện tại

Launcher nằm ngoài repository, tại `outputs/Run-WorkSphere-Web.ps1` của workspace. Nó dùng PostgreSQL local 55432, database **worksphere_web**, máy chủ 18120, web/proxy 18110 và thư mục lưu tệp riêng. Không dùng database worksphere của ứng dụng mobile cũ.

Mở http://127.0.0.1:18110. Tài khoản thực hành và mật khẩu được tạo bên ngoài Git trong `outputs/Tai-khoan-Web-local.txt`. Không upload tệp này.

## Trên máy khác

1. Chuẩn bị JDK 21 và PostgreSQL, tạo database local riêng tên `worksphere_web`.
2. Cấp các biến môi trường qua cấu hình riêng: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `WORKSPHERE_JWT_SECRET`, `WORKSPHERE_STORAGE_PATH`.
3. Nếu cần tạo công ty và tài khoản thực hành trên **database trống**, cấp `WORKSPHERE_WEB_DEMO_ENABLED=true` và `WORKSPHERE_WEB_DEMO_PASSWORD` ít nhất 12 ký tự. Provisioner chỉ chạy profile dev và URL local/database worksphere_web*. Nó không ghi đè dữ liệu đã có, không chạy trên production, không ghi mật khẩu ra log.
4. Trong backend, build bằng Maven wrapper. `mvnw.cmd -DskipTests package` chỉ build, không có nghĩa kiểm thử đã qua. JAR mới là `target/worksphere-web.jar`.
5. Chạy `java -jar target/worksphere-web.jar --spring.profiles.active=dev --server.port=18120 --server.address=127.0.0.1` với môi trường đã cấp.
6. Tại gốc repo, chạy `node scripts/preview-ui.mjs`; mở http://127.0.0.1:18110. Không mở index.html bằng file:// vì cần proxy/API chung nguồn.

Proxy chỉ phục vụ web và chuyển `/api/v1/` tới loopback 18120. Có thể cấu hình `WORKSPHERE_PREVIEW_PORT` và `WORKSPHERE_BACKEND_PORT`. Đây là máy chủ phát triển local, chưa phải cấu hình triển khai Internet.

## Công ty thực hành

- Admin hệ thống: admin.web.
- IT: hung.it là trưởng phòng, lan.it và hai.it là nhân viên.
- Kinh doanh: ngoc.kd là trưởng phòng, minh.kd và linh.kd là nhân viên.
- Hành chính–Nhân sự: thao.hc là trưởng phòng, mai.hc và an.hc là nhân viên.
- Riêng thao.hc được cấp HR_MANAGE/TIME_REVIEW/PAYROLL_MANAGE để thực hành các quyền chuyên trách. Admin không mặc định có các quyền này.
- Ba công việc khởi đầu được ghi rõ là dữ liệu thực hành. Không tự tạo bảng lương, quỹ phép hoặc lịch công cho người dùng; các thông số phải được người có quyền khai báo.

## Kiểm thử

Tạo một database PostgreSQL local riêng có tên worksphere_authz*, worksphere_test* hoặc worksphere_web_test*. Cấp `WORKSPHERE_AUTHZ_TEST_JDBC_URL`, `WORKSPHERE_AUTHZ_TEST_DB_USER`, `WORKSPHERE_AUTHZ_TEST_DB_PASSWORD`, chạy `scripts/test-web.ps1`. Các integration test tạo dữ liệu ngẫu nhiên; chỉ chạy với database dùng riêng cho kiểm thử.

Hai lớp PostgreSQL mới có opt-in: không cấp URL thì bị skip. Cần kiểm tra số ca thực chạy, không coi skip là đã xác minh tích hợp. Các test Testcontainers kế thừa yêu cầu Docker và chưa được thay bằng kết quả của tập kiểm thử web.

## Giai đoạn 2 — 30/10/2026

Xem WEB_PHASE2_CONTRACT.md và reports/WEB_PHASE2_IMPLEMENTATION.md. Không bật dữ liệu demo ở production.

Hộp thư thử: profile dev và worksphere.mail.local-enabled=true, worksphere.mail.local-path trỏ tới thư mục riêng ngoài repo. Tác vụ nền ghi từng thư .txt; không có trang HTTP đọc thư. Thư chứa link kích hoạt/reset có hạn, không upload Git. Cấu hình worksphere.public-url theo URL frontend khi cần thử trên địa chỉ khác. Hiện chưa có SMTP/SMS thật.

EXECUTIVE cần department_authority để phụ trách phòng; PAYROLL_APPROVE cấp riêng. Demo local thêm giamdoc.web, mật khẩu lấy từ biến ngoài repo như các tài khoản mẫu; không ghi mật khẩu trong tài liệu Git. Tài khoản mới bình thường luôn PENDING và phải kích hoạt qua thư.

TOTP thiết lập ở Bảo mật bằng ứng dụng xác thực theo thời gian; lưu mã dự phòng ở nơi riêng. Quên mật khẩu không bỏ qua TOTP. Mã nhân viên không đổi khi đổi tên đăng nhập.

Màn QR ở tài khoản TIME_REVIEW. Mã đổi 30 giây, hết hạn 40 giây, điểm có thể đóng. Chưa dùng camera/máy vân tay/mobile mới. Không thử chấm bằng cách sửa đồng hồ trên trình duyệt.

Database test phải riêng và được guard trong scripts/test-web.ps1. Chạy thêm scripts/test-web-session.mjs bằng Node --experimental-vm-modules. Native mobile chưa có lượt kiểm thử mới trong đợt này.
