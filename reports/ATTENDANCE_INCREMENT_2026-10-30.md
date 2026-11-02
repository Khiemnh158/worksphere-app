# Chấm công, Android đóng gói và khởi động local

## Thay đổi

- Migration V027 bổ sung khoảng nghỉ/dung sai, cấu hình điểm/mạng, bằng chứng từng lượt và chế độ duyệt OT. Không sửa migration cũ hoặc giả lượt quét người dùng.
- Máy chủ quyết định actions/trạng thái, peer IP, khóa kỳ và quyền duyệt. Giờ mở điểm có cấu hình; đóng/đổi cấu hình làm hết hạn QR. IN hiện riêng trước OUT; công chỉ trừ phần nghỉ giao thời gian làm.
- OT thông thường duyệt trước; trường hợp trễ cần giải trình và căn cứ duyệt ngoại lệ. Cặp OT riêng, giới hạn phút theo thực tế trong khoảng duyệt. Không tự thêm tiền do ra muộn.
- Mobile: đổi mật khẩu, TOTP/mã dự phòng, logout mọi thiết bị. Secrets chỉ ở state và xóa khi blur/background; phản hồi trễ không khôi phục secrets đã che. Remote logout lỗi được báo, không giả báo đã thu hồi hết phiên.
- localDemo chứa bundle ARM64/x86_64, tắt dev support, chỉ loopback HTTP; release vẫn yêu cầu HTTPS. Đã đăng nhập/xem công trên giả lập khi Metro tắt; launcher kiểm bundle/ABI và không xóa dữ liệu app.
- Script chạy nằm trong repo, sinh thông tin thử riêng; đã thử database/cổng mới, nhận lại đúng tiến trình và Stop riêng. Maven Wrapper đã xác minh. Không cần copy mật khẩu máy tác giả.

## Kiểm tra

- 150 backend tests chọn lọc đạt: 56 PostgreSQL thật, 94 unit; 0 failure/error/skip. Maven package thành công. Không phải toàn bộ legacy Testcontainers.
- Toàn bộ mobile: 93 suites/824 tests đạt; TypeScript đạt. Lint nguồn thay đổi: 0 lỗi/32 cảnh báo style/render; cảnh báo act kế thừa còn.
- 5 tests phiên web, cú pháp JS, diff whitespace và dò secrets/artifacts đạt.
- Android localDemo cuối: BUILD SUCCESSFUL 48 giây, 151 tasks. Lượt đầu vướng Windows subst/Metro; giải quyết bằng projectRoot thực qua WORKSPHERE_JS_ROOT, không sửa registry hay hạ yêu cầu HTTPS của release.
- Web: IN mở đã hiện, lưu giờ nghỉ người dùng chọn, kiểm biểu mẫu giờ điểm/CIDR. Không tự cấu hình IP văn phòng, lương hoặc duyệt công thay người dùng.

Ảnh/log minh chứng giữ local ngoài Git. Báo cáo công khai không chứa tài khoản/giờ hoạt động/IP cá nhân từ lượt quét thật.

## Còn thiếu

OUT/OT/mạng trên điện thoại thật với APK mới; mạng văn phòng thật; lịch ca riêng từng người/ca qua đêm; phân trang punches; giải trình riêng từng punch; tệp/deep link/push mobile; ký production/iOS; thử tải, toàn bộ legacy suite và người dùng nghiệm thu. Clone sạch trên cùng máy đã chạy Maven Wrapper, database/cổng riêng, đăng nhập/đăng xuất và thư reset đúng origin; thử reuse/Stop/restart đạt, web chính không bị dừng. Có dùng cache thư viện; chưa thay thế kiểm tra máy thứ hai.

Hợp đồng: docs/ATTENDANCE_POLICY.md. Cách chạy: docs/FRESH_CLONE_RUNNING.md. Theo dõi: TODO.md.
