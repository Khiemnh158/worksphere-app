# WorkSphere Mobile hiện hành

Bản localDemo đã chứa giao diện, không cần Metro; backend local/USB vẫn cần. Có trạng thái công/OT và màn bảo mật TOTP/đổi mật khẩu/logout mọi thiết bị. 93 suites/824 tests đạt. Đọc [hướng dẫn clone](../docs/FRESH_CLONE_RUNNING.md), [chấm công](../docs/ATTENDANCE_POLICY.md) và [kết quả](../reports/ATTENDANCE_INCREMENT_2026-10-30.md).

React Native/TypeScript dùng chung backend và PostgreSQL với web. Tuyến chính mới ở src/features/workspace; project/task kế thừa được giữ trong source, không còn là trang chính sau đăng nhập.

- [Cách chạy và toolchain](../docs/MOBILE_RUNNING.md).
- [Phạm vi, kiểm thử và giới hạn đợt này](../reports/MOBILE_FIRST_CLIENT_2026-10-30.md).
- [TODO thật](../TODO.md).

Đã có: công việc/bàn giao, hỗ trợ, công/nghỉ/OT, camera QR Android, thông báo trong app, danh bạ phòng và phiếu thu nhập cá nhân. Admin kỹ thuật có cổng gọn, quản trị trên web. Lương/dữ liệu đầu vào, hồ sơ HR, quyền và điều phối nâng cao nằm ở web.

824 tests/93 suites Jest và TypeScript đạt. Android localDemo ARM64/x86_64 đã build, cài và chạy trên giả lập không bật Metro; đợt trước đã đồng bộ ghi chú với web. Còn thử QR trọn vòng trên điện thoại, tệp mobile, deep link, push, iOS và release. Không nhận là mobile đủ mọi màn của web.

README cũ được lưu tại docs/history/MOBILE_README-before-client-2026-10-30.md của repo; không dùng cổng 8080/checkout baseline cũ để chạy client mới.
