# Kết quả web giai đoạn 2 — 30/10/2026

Triển khai theo phản hồi bảy ảnh và kế hoạch WEB_PHASE2_PLAN. Người dùng đã chọn hộp thư thử local, QR xoay vòng và yêu cầu dừng trước mobile để kiểm tra web.

## Thay đổi chính

- Admin có menu riêng; nhân viên/trưởng phòng/chuyên trách/lãnh đạo có phạm vi và nhãn tương ứng. Chức danh, quản lý phòng và quyền hệ thống tách riêng.
- Danh bạ chỉ trả thành viên phòng, có tìm kiếm/phân trang 20 và đầu mối hỗ trợ. Nhập tài khoản CSV dùng mã phòng, preview trước khi tạo; kích hoạt/khôi phục email và TOTP opt-in.
- Lãnh đạo theo phòng, phụ trách thay OPERATIONS/TIME có hạn; tránh tự duyệt và mất quyền ngay khi hết hạn/thu hồi. Thông báo đến người thực sự cần xem xét.
- Hồ sơ nhân sự qua HR và lãnh đạo, các đầu việc truy cập/bàn giao/đối soát độc lập. Cutoff chặn JWT/refresh đúng mốc, giữ tiến độ và lịch sử.
- Công việc có báo vướng/tiếp tục/hủy. Bảng tính có gửi–duyệt–phát hành, so sánh dữ liệu trước phát hành và điều chỉnh bổ sung; hỗ trợ công quá khứ sau thu hồi truy cập.
- Menu giữ vị trí, logo mở được, header luôn truy cập được, không tràn ngang menu; sáng/tối và chuyển động nhẹ có reduced-motion.
- Màn điểm QR tạo mã thật có hạn và API kiểm soát lượt chấm; native mobile chưa sửa.
- Bổ sung V023–V026, không sửa migration đã chạy. ZXing core 3.5.3 được khai báo qua Maven Central.

## Kiểm thử

140 backend tests chọn lọc, 50 trong số đó dùng PostgreSQL thật; 0 failure/error/skip. Số liệu xuất từ Surefire, xem web-validation.json. Không dùng số liệu giai đoạn trước thay cho kết quả mới.

5 session regression tests trên web/api.js đạt. JavaScript syntax, diff check và quét giá trị bí mật runtime được kiểm tra trước khi commit. Maven package chạy sau test; lượt package dùng skipTests, không tính là một lượt chạy test bổ sung. Mục tiêu Java 21; máy biên dịch JBR 25.

Các tình huống mới: scope/phân trang danh bạ; người thay thế hết hạn; quản lý không tự duyệt; quyền lãnh đạo bị thu hồi; bật MFA/backup một lần/RFC vectors; kích hoạt/reset hết hạn/dùng lại; import preview/atomic; HR→lãnh đạo→cutoff/bàn giao; QR hết hạn/chấm trùng/điểm đóng; bảng tính chưa duyệt, dữ liệu thay sau duyệt; công quá khứ và người nộp thay không tự duyệt; thông báo đúng tuyến.

Browser: menu Admin không có công/lương cá nhân; preview CSV hợp lệ; Hải chỉ thấy ba thành viên IT; email khôi phục vào hộp thư private local; QR hiện tại điểm chấm; các biểu mẫu lãnh đạo/phụ trách thay/nhân sự; responsive, light/dark, logo/menu và vị trí cuộn. Đã kiểm tra mở–Hủy–mở lại biểu mẫu sau khi sửa lỗi mất vùng nội dung dialog. Ở 390 px, menu đóng có inert và không tràn ngang sau chuyển động; ở 1280 px vị trí cuộn menu giữ nguyên sau chuyển trang. Ảnh chụp từ ứng dụng thật, không phải ảnh thiết kế.

## Ranh giới

Email thử không phải SMTP thật; TOTP opt-in; QR không chống gian lận tuyệt đối. Không tự khai lương/lịch/chính sách doanh nghiệp trong database thực hành. Quy trình ghi nhận quyết định không thay thủ tục pháp lý; chốt/đối soát không chuyển tiền. Chưa có thuế/BHXH/net payroll/ca qua đêm, vân tay thật, full legacy Testcontainers, tải lớn hoặc xác nhận production. Giới hạn danh sách và API kế thừa được ghi trong WEB_PHASE2_CONTRACT.

Mobile chờ người dùng kiểm tra web, không tự bắt đầu. Hai repo học phần khác vẫn ghim baseline cho tới khi chọn bản phát hành app.
