# WorkSphere Android

React Native/TypeScript dùng chung API và PostgreSQL với web. Tuyến chính ở src/features/workspace; module project/task cũ giữ để truy nguồn. Admin kỹ thuật có cổng riêng, quản trị và đối soát chuyên trách chủ yếu trên web.

- [Chạy clone và APK localDemo](../docs/FRESH_CLONE_RUNNING.md), [chi tiết toolchain](../docs/MOBILE_RUNNING.md).
- [Tệp chọn/tải/mở/lưu](../docs/MOBILE_ATTACHMENTS.md), [QR/công/OT](../docs/ATTENDANCE_POLICY.md), [liên kết khôi phục](../docs/MOBILE_RECOVERY_LINKS.md).
- [Trạng thái và TODO](../STATUS.md), [kết quả 01/11](../reports/INCREMENT_2026-11-01.md).

Đã có công việc/bàn giao, hỗ trợ, công/nghỉ/OT/QR, thông báo, danh bạ phòng, phiếu thu nhập riêng, bảo mật, sửa thông tin và tệp. 01/11: 98 suites/852 tests và TypeScript đạt. Tệp đã thử chọn/gắn/mở/lưu/hủy trên giả lập; người dùng xác nhận mở và lưu trên OPPO.

localDemo ARM64/x86_64 chứa giao diện, không cần Metro; backend và đường USB local vẫn cần. Chưa production/iOS, verified HTTPS App Links, push khi đóng app hoặc QR/OT/network đủ vòng mới nhất trên điện thoại. Không nhận mobile đủ mọi màn web. Không copy database/credentials/launcher private của tác giả.
