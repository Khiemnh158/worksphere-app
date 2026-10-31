# Kết quả triển khai web

Ngày bắt đầu: 29/10/2026. Nhánh feat/authorization-foundation, draft PR #1. Đây là phần triển khai theo yêu cầu người dùng, không phải xác nhận rubric hoặc bản phát hành production.

## Đã triển khai

- Web API thật thay prototype/persona; login/me/refresh/logout, quyền hiện tại, phòng ban động và quyền chuyên trách riêng.
- Hàng đợi theo phòng và quy trình gửi/điều phối/phân công/xử lý/kiểm tra/đóng; chuyển phòng, bổ sung, từ chối, hủy có xem xét, rà soát khi đổi người xử lý.
- Công việc nội bộ theo phòng, hạn/lịch/ưu tiên/tiến độ, tệp/trao đổi, nghiệm thu độc lập, bàn giao giữ phần đã làm và tác giả.
- Admin quản lý phòng/tài khoản/danh mục; HR ghi nhận ngừng truy cập theo quyết định đã có, giữ hồ sơ và thu hồi phiên.
- Công/nghỉ/tăng ca có nguồn, đề nghị và đối soát; thu nhập gross theo cấu hình, tăng ca thực tế mới sinh tiền, không tự phạt, thiếu công chặn chốt và snapshot khóa nguồn.
- UI sáng/tối, menu thu gọn, responsive, hiệu ứng tiếp nhận có reduced-motion, loading/error/empty/conflict.
- Bổ sung V018–V022, không sửa các migration đã chạy. Module dự án kế thừa vẫn tồn tại, không bị nhận là đã chuyển sang mô hình phòng.

## Kiểm thử thực tế

- 120 backend tests, 0 failure, 0 error, 0 skip trong tập được chọn. 31 ca tích hợp PostgreSQL thật: 23 WorkplacePostgresTest và 8 AuthorizationPostgresTest. Bằng chứng số liệu xuất từ Surefire ở web-validation.json.
- 5 tests client trên chính web/api.js: logout loại phản hồi cũ; không replay mutation bằng tài khoản mới; refresh cũ không ghi đè token mới; các 401 đồng thời dùng chung rotation; lỗi tạm thời không xóa refresh token. Chạy bằng Node 24.22.1 với VM modules.
- Maven package BUILD SUCCESS. Lượt đóng gói sau kiểm thử dùng skipTests, không coi riêng lượt đóng gói là bằng chứng chạy test. JDK mục tiêu 21; môi trường biên dịch thực tế JBR 25.
- PostgreSQL test tách khỏi database thực hành, database/ứng dụng mobile cũ không được dùng cho fixture mới.
- Race phân công/cập nhật: một thao tác thắng, thao tác cũ nhận 409; có kiểm tra quyền chéo phòng và Admin không mặc định đọc business/HR/income của portal.
- Kiểm tra công/tăng ca/quỹ phép/khóa kỳ, tránh cộng trùng phép với công, không tự chốt dữ liệu thiếu, không xác nhận giờ tương lai; kiểm tra giới hạn tiêu đề và ghi chú dài.

## Kiểm tra trực tiếp trên trình duyệt

- Minh gửi SR-2026-000001 → đúng queue IT → Hùng chọn Hải (dropdown chỉ có IT) → Hải bắt đầu/gửi kết quả → Minh xác nhận đóng. Đăng nhập lại vẫn thấy lịch sử và trạng thái đóng; Hải không có nút tự nghiệm thu.
- Hùng bàn giao việc 65% từ Lan sang Hải → Hải đánh dấu đã đọc/kiểm tra, ghi nội dung rà soát → tiến độ vẫn 65%, lịch sử Lan/Hùng/Hải còn đủ.
- Admin có danh mục/phòng/tài khoản; người chuyên trách HC có công/nhân sự/thu nhập. Kiểm tra biểu mẫu cấu hình mà không tự khai lương hoặc lịch doanh nghiệp.
- Theme sáng, tối, menu thu gọn và màn hẹp; quan sát cuối không tràn ngang ra body, bảng dài cuộn trong khung. Console JavaScript không có error trong các ca đã thực hiện.
- Phát hiện và sửa race client: đăng xuất khi loadContext đang chạy không được hiện lại phiên cũ; bổ sung epoch/generation và kiểm tra lại thao tác đăng xuất ngay sau lưu.
- Ảnh live-desktop/live-light/live-handover lấy từ web thật, dữ liệu An Phát thực hành. Không dùng ảnh prototype làm chứng cứ API hoạt động.

## Giới hạn còn lại

Không chạy toàn bộ legacy Testcontainers suite do Docker chưa sẵn sàng; không chạy lại native mobile/Jest. Không tuyên bố toàn source đã hết lỗi hay production-ready.

Chưa có thiết bị vân tay, QR/GPS mobile, thuế/BHXH/net payroll, ca đêm/qua ngày, engine bồi thường, email onboarding/reset, lịch nghỉ việc tương lai và mở lại kỳ đã chốt. Một manager/phòng; cần người phê duyệt độc lập khi manager là người đề nghị, không tự cho Admin kỹ thuật quyết định thay. Đọc WEB_WORKFLOWS.md và TODO.md trước khi mở rộng.
