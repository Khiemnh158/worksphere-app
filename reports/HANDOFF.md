# Cập nhật 30/10/2026 — chờ nghiệm thu web trước mobile

Web giai đoạn 2 đã triển khai: Admin tách riêng, danh bạ phòng, kích hoạt/reset qua hộp thư thử, TOTP opt-in, lãnh đạo/phụ trách thay, hồ sơ nhân sự/cutoff, bảng tính duyệt độc lập và điểm QR. Hợp đồng hiện hành: docs/WEB_PHASE2_CONTRACT.md. Kết quả: reports/WEB_PHASE2_IMPLEMENTATION.md.

140 backend tests chọn lọc đạt (gồm 50 PostgreSQL integration), 5 tests phiên web đạt. Chưa xác nhận toàn bộ legacy suite hoặc production. Mobile chưa thay đổi, theo yêu cầu đợi người dùng kiểm tra web. Thư chỉ local, lương/lịch cần dữ liệu có thẩm quyền; không có chuyển tiền.

## Lịch sử trước cập nhật này

# Bàn giao web

Repo worksphere-app, nhánh feat/authorization-foundation, draft PR #1. Đọc docs/WEB_WORKFLOWS.md, docs/WEB_RUNNING.md và reports/WEB_IMPLEMENTATION.md trước khi sửa.

Web hiện nối máy chủ 18120 qua proxy 18110, database thực hành worksphere_web. Launcher và mật khẩu local nằm ngoài Git, trong outputs của workspace. Không commit work/, runtime hoặc file tài khoản.

Phòng ban là dữ liệu động. manager_id cho quyền điều phối phòng; ba quyền chuyên trách lưu riêng. Công việc phòng độc lập với project/task kế thừa. Yêu cầu hỗ trợ tái sử dụng service_request, lưu snapshot phòng nhận, có version, hủy có xem xét và rà soát khi đổi người xử lý.

Hải tiếp tục 65% của Lan, giữ tác giả/lịch sử, tự ghi nhận phần cần kiểm tra. Đã kiểm tra lưu thật qua UI và PostgreSQL. Tài khoản ngừng truy cập giữ hồ sơ/thu hồi phiên, việc còn mở phải có điều phối bàn giao.

Công/thu nhập phải có lịch, nguồn, duyệt và thông số lương. Không tự đặt lương, tự phạt hoặc dùng giờ mở app làm công. Đây là gross đối soát trước thuế/BHXH/khoản khác; bản đầu ca ngày, chưa tích hợp máy chấm công, chưa sửa mobile.

120 backend tests (31 PG integration) và 5 client session tests đạt. Toàn bộ Testcontainers/Jest mobile chưa chạy. Source UI đã kiểm tra race logout/đổi tài khoản để phản hồi cũ không hiện lại hoặc replay bằng người mới.

Tiếp theo: nghiệm thu web theo rubric/chính sách thật, hoàn thiện các mục chưa làm trong TODO trước khi mở rộng mobile. Hai repo học phần khác chỉ nâng pin khi chốt app release, không copy business code.
