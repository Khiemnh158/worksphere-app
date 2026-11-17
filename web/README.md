# WorkSphere Web

Cổng web dùng API thật, không còn đổi persona hoặc dữ liệu công việc trong bộ nhớ. Khởi chạy máy chủ và proxy theo [hướng dẫn](../docs/WEB_RUNNING.md), mở http://127.0.0.1:18110.

- HTML/CSS/JavaScript modules, không cần cài frontend dependencies.
- Đăng nhập, refresh một lượt, bảo vệ phản hồi/truy vấn cũ khi đăng xuất hoặc đổi tài khoản.
- Nhân viên, trưởng phòng, Admin và quyền chuyên trách có menu/hành động theo dữ liệu và policy ở server.
- Công việc/lịch, yêu cầu hỗ trợ, bàn giao, quản trị phòng/tài khoản/danh mục, thông báo, công/nghỉ/tăng ca và đối soát thu nhập.
- Sáng/tối đồng bộ trong các màn, menu thu gọn, responsive và giảm chuyển động theo tùy chọn hệ thống.
- Tài khoản, lịch công và mức lương cần được cấp/cấu hình; không tự tạo số lương hay giả kết nối thiết bị.

Đọc [hợp đồng và giới hạn](../docs/WEB_WORKFLOWS.md). Mobile React Native chưa thay đổi. Ảnh trong screenshots có thể bao gồm bản prototype lịch sử; ảnh web thật ở live-desktop.png, live-light.png và live-handover.png.

Kiểm thử session client: `node --experimental-vm-modules scripts/test-web-session.mjs` từ gốc repo. Kiểm thử server: `scripts/test-web.ps1` với PostgreSQL test riêng.

## Giai đoạn 2 — 30/10/2026

Xem [hợp đồng](../docs/WEB_PHASE2_CONTRACT.md) và [kết quả](../reports/WEB_PHASE2_IMPLEMENTATION.md). Không bật dữ liệu demo ở production.

Hộp thư thử: profile dev và worksphere.mail.local-enabled=true, worksphere.mail.local-path trỏ tới thư mục riêng ngoài repo. Tác vụ nền ghi từng thư .txt; không có trang HTTP đọc thư. Thư chứa link kích hoạt/reset có hạn, không upload Git. Cấu hình worksphere.public-url theo URL frontend khi cần thử trên địa chỉ khác. Hiện chưa có SMTP/SMS thật.

EXECUTIVE cần department_authority để phụ trách phòng; PAYROLL_APPROVE cấp riêng. Demo local thêm giamdoc.web, mật khẩu lấy từ biến ngoài repo như các tài khoản mẫu; không ghi mật khẩu trong tài liệu Git. Tài khoản mới bình thường luôn PENDING và phải kích hoạt qua thư.

TOTP thiết lập ở Bảo mật bằng ứng dụng xác thực theo thời gian; lưu mã dự phòng ở nơi riêng. Quên mật khẩu không bỏ qua TOTP. Mã nhân viên không đổi khi đổi tên đăng nhập.

Màn QR ở tài khoản TIME_REVIEW. Mã đổi 30 giây, hết hạn 40 giây, điểm có thể đóng. Chưa dùng camera/máy vân tay/mobile mới. Không thử chấm bằng cách sửa đồng hồ trên trình duyệt.

Database test phải riêng và được guard trong scripts/test-web.ps1. Chạy thêm scripts/test-web-session.mjs bằng Node --experimental-vm-modules. Native mobile chưa có lượt kiểm thử mới trong đợt này.
