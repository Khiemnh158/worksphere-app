# Cập nhật 30/10/2026 — chờ nghiệm thu web trước mobile

Web giai đoạn 2 đã triển khai: Admin tách riêng, danh bạ phòng, kích hoạt/reset qua hộp thư thử, TOTP opt-in, lãnh đạo/phụ trách thay, hồ sơ nhân sự/cutoff, bảng tính duyệt độc lập và điểm QR. Hợp đồng hiện hành: docs/WEB_PHASE2_CONTRACT.md. Kết quả: reports/WEB_PHASE2_IMPLEMENTATION.md.

140 backend tests chọn lọc đạt (gồm 50 PostgreSQL integration), 5 tests phiên web đạt. Chưa xác nhận toàn bộ legacy suite hoặc production. Mobile chưa thay đổi, theo yêu cầu đợi người dùng kiểm tra web. Thư chỉ local, lương/lịch cần dữ liệu có thẩm quyền; không có chuyển tiền.

## Lịch sử trước cập nhật này

# Trạng thái dự án

Cổng web ở feat/authorization-foundation dùng API và PostgreSQL thật. Hợp đồng mới: docs/WEB_WORKFLOWS.md. Không dùng các tuyên bố prototype lịch sử làm trạng thái hiện tại.

120 backend tests chọn lọc đạt, gồm 31 PostgreSQL integration; 5 client session tests đạt. Build JAR thành công. Browser xác minh Minh → IT/Hùng → Hải → Minh đóng yêu cầu, bàn giao Lan → Hải vẫn 65%, theme/menu và màn chuyên trách.

Chưa coi toàn bộ source kế thừa hoặc sản phẩm production đã đạt. Xem STATUS.md, TODO.md, reports/WEB_IMPLEMENTATION.md. Mobile và hai repo môn khác chưa được nâng pin/release trong lượt này.
