# WorkSphere dark UI - bản phác thảo có tương tác

Chạy từ root repo: `node scripts/preview-ui.mjs`, mở http://127.0.0.1:18110.

- Tông đen, thẻ công việc, lịch 7 ngày hiện tại/tương lai, bố cục desktop và mobile.
- Lọc/tìm việc, xem chi tiết và lịch sử bàn giao Lan → Hải; ghi nhận rà soát giữ nguyên tiến độ 65%.
- Chuyển persona chỉ để duyệt bố cục và ma trận quyền. Đây **không phải login hoặc cơ chế bảo mật**.
- Toàn bộ dữ liệu là fixture trong bộ nhớ, không gọi backend, không lưu tài khoản thật, không thay đổi database. Refresh trang sẽ reset minh họa.
- Hàng đợi phòng ban, admin/offboarding và lịch theo giờ là bố cục đề xuất, chưa phải endpoint/tính năng backend đã triển khai.
- Lấy cấu trúc công việc/lịch và màu tối làm cảm hứng từ ảnh tham khảo do người dùng cung cấp; không sao chép hình ảnh, nhân vật hoặc mã của tác giả mẫu.

Quyền thật được thực thi và kiểm thử ở backend. Chưa thay màn mobile đang chạy hoặc nhận đây là web production hoàn chỉnh.

Ảnh đã render và kiểm tra: [desktop](screenshots/desktop.jpg), [mobile](screenshots/mobile.jpg).
