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
