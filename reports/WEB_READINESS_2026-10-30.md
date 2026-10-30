# Cổng web trước mobile — 30/10/2026

Đủ điều kiện bắt đầu mobile dùng chung API trong phạm vi web giai đoạn 2. Chưa phải release production, kiểm hết mã kế thừa hoặc người dùng đã nghiệm thu giao diện.

## Kết quả chạy mới

- Maven: 142 tests, 0 failures/errors/skipped trong 12 lớp chọn lọc; 52 PostgreSQL (8 AuthorizationPostgresTest + 44 WorkplacePostgresTest), 90 unit. Surefire: backend/target/surefire-reports.
- 5 tests phiên web đạt: logout/đổi tài khoản không nhận phản hồi trễ hoặc replay mutation dưới tài khoản mới, refresh đồng thời và lỗi tạm thời lúc restore.
- Cú pháp JS, git diff --check, dò credentials/artifact cục bộ đạt. Maven package thành công.
- Runtime mới: backend UP, frontend 200. UI thực: Admin chỉ menu quản trị; tài khoản có trưởng phòng/chuyên trách riêng; nhân viên Hải xem đúng việc và lịch sử Lan → Hải giữ 65%; biểu mẫu mở → hủy → mở lại hoạt động. Không thay dữ liệu nghiệp vụ trong lượt kiểm tra UI này.
- Ảnh ngoài repo: outputs/Web-readiness-2026-10-30.png.

## Lỗi vừa sửa

1. Login kiểm trạng thái trước mật khẩu nên có thể lộ trạng thái tài khoản. Nay xác minh mật khẩu trước; sai mật khẩu tại ACTIVE/LOCKED/PENDING/DISABLED cùng INVALID_CREDENTIALS/thông báo chung. Có regression PostgreSQL. Chưa tuyên bố chống suy luận qua timing tuyệt đối.
2. Nhãn CANCEL/RESUME hỗ trợ lấn nhãn công việc; tách workLabels.
3. Mức ưu tiên khẩn của yêu cầu hỗ trợ phải là CRITICAL (enum backend); URGENT dành cho công việc nội bộ. Sửa bộ chọn web/mobile theo đúng miền.
4. API GET /api/v1/workplace/time/incomes/mine chỉ trả phiếu PUBLISHED của chính tài khoản, kể cả người có quyền chuyên trách lương; chỉ đính kèm điều chỉnh APPROVED. Có regression PostgreSQL.
5. Lượt test đầu lỗi context do cấu hình demo từ launcher lọt vào test. Cố định test không demo/lịch nhân sự/thư local; chạy lại toàn bộ tập đạt, không bỏ test.

## Giới hạn và cổng mobile

Hợp đồng: docs/WEB_PHASE2_CONTRACT.md. Thư local, TOTP tùy chọn, QR không chứng minh chống chấm hộ tuyệt đối. Chưa thuế/BHXH/net pay/ca đêm/ngân hàng, ký quyết định pháp lý. Một số danh sách giới hạn 200. Legacy Testcontainers chưa chạy lại toàn bộ vì thiếu Docker; chưa rubric chính thức/thử tải production.

Người dùng đã cho phép bắt đầu mobile sau kiểm tra web. Mobile dùng cùng API/quyền/state, không tạo hệ nghiệp vụ riêng. Giữ source project/task cũ nhưng không nhận các màn cũ là đã nối nghiệp vụ mới. TODO.md là checklist hiện hành.

Sau khi Android được nối API, đã gửi một ghi chú kiểm tra local từ mobile và xem lại trên web thành công; tiến độ công việc giữ 65%. Ảnh: outputs/Web-Mobile-sync-2026-10-30.png (ngoài repo).
