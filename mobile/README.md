# WorkSphere Mobile hiện hành

React Native/TypeScript dùng chung backend và PostgreSQL với web. Tuyến chính mới ở src/features/workspace; project/task kế thừa được giữ trong source, không còn là trang chính sau đăng nhập.

- [Cách chạy và toolchain](../docs/MOBILE_RUNNING.md).
- [Phạm vi, kiểm thử và giới hạn đợt này](../reports/MOBILE_FIRST_CLIENT_2026-10-30.md).
- [TODO thật](../TODO.md).

Đã có: công việc/bàn giao, hỗ trợ, công/nghỉ/OT, camera QR Android, thông báo trong app, danh bạ phòng và phiếu thu nhập cá nhân. Admin kỹ thuật có cổng gọn, quản trị trên web. Lương/dữ liệu đầu vào, hồ sơ HR, quyền và điều phối nâng cao nằm ở web.

809 tests/90 suites Jest và TypeScript đạt. Android debug x86_64 đã build/cài/chạy và đồng bộ ghi chú với web. Còn thử QR trọn vòng trên điện thoại, tệp mobile, deep link, push, iOS và release. Không nhận là mobile đủ mọi màn của web.

README cũ được lưu tại docs/history/MOBILE_README-before-client-2026-10-30.md của repo; không dùng cổng 8080/checkout baseline cũ để chạy client mới.
