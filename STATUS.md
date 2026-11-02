# Hiện trạng WorkSphere - 02/11/2026

Đã chốt mốc phần mềm MVP cho Kỹ năng lập trình nâng cao theo phạm vi giờ hành chính SME đã thống nhất. Web và Android dùng chung API Java/Spring Boot/PostgreSQL. Chưa phải production hoặc bảo đảm điểm số; nhóm còn hoàn thiện báo cáo/slide theo mẫu và diễn tập.

## Đã có

Tài khoản/CSV/kích hoạt/reset local/TOTP/session; phòng ban động và quyền theo phòng/nhiệm vụ; hỗ trợ trọn vòng; công việc/tệp/nghiệm thu/bàn giao giữ tiến độ; hồ sơ nhân sự/cutoff; công/nghỉ/OT/QR và phiếu thu nhập có kiểm soát. Admin kỹ thuật không tự có quyền nghiệp vụ/lương. Web điều phối/quản trị; Android thao tác nhân viên, không yêu cầu ngang mọi màn web. Giao diện sáng/tối, danh bạ và lịch sử quét có phân trang.

## Bằng chứng mới nhất

| Kiểm tra | Kết quả |
|---|---|
| JDK 21 backend | 407 tests, 0 fail/error/skip; Docker/Testcontainers và 59 ca PostgreSQL opt-in; package đạt, bytecode Java 21 |
| Web | 8 tests phiên/phân trang đạt |
| Mobile | 98 suites/852 tests và TypeScript đạt |
| APK | JDK 21 localDemo ARM64+x86_64 có bundle; cập nhật OPPO, không cần Metro; cần backend local/USB |
| OPPO QR | Người dùng quét đủ bốn loại trong môi trường riêng/đồng hồ mô phỏng; công thường 470 phút, OT45 phút, không tự cộng OT do ra muộn |
| OPPO recovery | Kích hoạt/reset qua OS link và đăng nhập thành công, máy chủ xác nhận sự kiện/token dùng một lần |
| Clone sạch | Cùng máy/cache, DB mới: JDK 21/Maven Wrapper build/chạy, login/logout/mail đúng origin, reuse/Stop/restart đạt |

Chi tiết và giới hạn: [nghiệm thu 02/11](reports/COURSEWORK_ACCEPTANCE_2026-11-02.md), [JSON](reports/COURSEWORK_ACCEPTANCE_2026-11-02.json). Kết quả có ngày cũ là lịch sử. Có cảnh báo đóng fork trong runner backend và act warnings Jest; không ghi là kiểm chứng tải/production.

## Phạm vi và việc tiếp theo

Lịch chung T2-T6, 08:00-17:00, nghỉ 11:30-12:30. Không tự tạo lịch/lương khi thiếu dữ liệu; không tự phạt tiền. Mạng thật chưa cung cấp, USB/QR/IP không chứng minh tuyệt đối hiện diện. Chưa lịch riêng/ca đêm, thuế/BHXH/thực lĩnh, ngân hàng, vân tay/SSO, SMTP/SMS thật, push nền, iOS/production. Đây là giới hạn được công khai, không phải các chức năng bắt buộc còn dở của MVP.

[TODO](TODO.md) tách rõ phần mềm đã nghiệm thu, chuẩn bị nộp, giới hạn và môn Triển khai phần mềm. An toàn thông tin thi trắc nghiệm, repo riêng đã bỏ theo xác nhận 02/11. Đọc [PROJECT_GUIDE](docs/PROJECT_GUIDE.md) để giao việc/báo cáo/demo và [chạy source](docs/FRESH_CLONE_RUNNING.md) cho thành viên khác.
