# Cập nhật tiếp tục — 30/10/2026

Đã bổ sung chấm công/QR/mạng văn phòng, khoảng nghỉ cụ thể, trạng thái IN mở và OT riêng có duyệt trước/ngoại lệ. Mobile có sửa họ tên/số liên hệ và màn bảo mật và bản localDemo chứa bundle, không cần Metro; vẫn cần backend local/USB. Lịch hiện là lịch chung doanh nghiệp, chưa có ca riêng từng người.

- 150 backend tests chọn lọc đạt, gồm 56 PostgreSQL; Maven package thành công.
- Toàn bộ mobile 93 suites/824 tests đạt; TypeScript đạt, lint nguồn thay đổi 0 lỗi/32 cảnh báo.
- Web đã kiểm tra lượt quét đang mở và bổ sung khoảng nghỉ 11:30–12:30 do người dùng chọn; không tự cấu hình mạng/IP văn phòng.
- Script chạy cho máy khác nằm trong repo; đã thử database/cổng riêng và lifecycle. Xem docs/FRESH_CLONE_RUNNING.md, docs/ATTENDANCE_POLICY.md và TODO.md cho giới hạn.

## Trạng thái trước đợt này

# Hiện hành 30/10/2026 — web qua cổng kiểm tra, Android đã bắt đầu

Web giai đoạn 2 đủ điều kiện nối mobile trong phạm vi đồ án, chưa phải production hoặc nghiệm thu toàn bộ mã kế thừa. Đã sửa kiểm tra mật khẩu trước trạng thái tài khoản, nhãn thao tác công việc và enum ưu tiên hỗ trợ; thêm API thu nhập chỉ của chính mình đã phát hành.

- 142 backend tests chọn lọc đạt, gồm 52 PostgreSQL thật; 5 tests phiên web đạt; Maven package thành công.
- Mobile: TypeScript đạt; toàn bộ Jest 91 suites/810 tests đạt, còn cảnh báo act trong một số tests kế thừa. Android debug x86_64 đã build/cài/đăng nhập, khởi động nguội giữ phiên; camera QR mở được. Không nhận kết quả này là iOS/ARM/release hoặc QR trọn vòng trên điện thoại thật.
- Đã xác minh ghi chú từ Android xuất hiện trên web, giữ tiến độ bàn giao 65%; danh bạ cùng phòng và công việc đúng tài khoản. Web và mobile dùng cùng backend/PostgreSQL, tải lại khi vào màn hoặc quay lại ứng dụng; chưa realtime/push khi đóng app.
- Admin kỹ thuật không có tab công việc/chấm công/thu nhập. Quản trị, hồ sơ nhân sự, dữ liệu lương và điều phối mở rộng tiếp tục trên web. Mobile có các thao tác thường dùng đúng allowedActions/canReview và version từ máy chủ.
- Còn tệp mobile, cấu hình MFA/quản lý phiên trên mobile, deep link hệ điều hành, push, kiểm thử camera/QR thiết bị thật và nghiệm thu UI. Xem TODO.md và reports/MOBILE_FIRST_CLIENT_2026-10-30.md.

- Cập nhật thiết bị: Android ARM64 debug đã build/cài và gửi lệnh mở trên OPPO CPH2603, Android 16 qua USB; đang chờ xác nhận quét QR thật. Đã cấu hình lịch thử local theo giờ người dùng chọn, chưa thiết lập lương.

## Lịch sử trước cập nhật này

# Web đang chạy — 29/10/2026

Nhánh feat/authorization-foundation tiếp tục phát triển cổng web thật. Không còn persona picker/prototype cho các màn đang vận hành. Hợp đồng hiện hành: docs/WEB_WORKFLOWS.md; cách chạy: docs/WEB_RUNNING.md.

- Đã có: login/refresh/logout, phòng/nhân sự/quyền, queue theo phòng, hỗ trợ trọn vòng, công việc và nghiệm thu/bàn giao, thông báo, nguồn công/đơn/duyệt, thu nhập tạm tính và khóa phiếu đối soát.
- 120 backend tests được chọn: 0 lỗi, 0 failure, 0 skip; 31 integration PostgreSQL thật (23 Workplace + 8 Authorization). 5 tests session client đạt. Maven package thành công. Xem reports/web-validation.json và reports/WEB_IMPLEMENTATION.md.
- Máy đang chạy database thực hành worksphere_web riêng; ứng dụng/database mobile cũ được giữ. Không tạo lịch công, quỹ nghỉ hoặc mức lương giả định cho người dùng.
- Chưa làm: mobile mới; thiết bị vân tay/QR/GPS; ca đêm; lương thực nhận/thuế/BHXH/bồi thường; lịch nghỉ việc tương lai; email onboarding/reset; hardening/rate limit và toàn bộ legacy Testcontainers suite.
- Các module project/task cũ chưa được coi là đã chuyển sang mô hình phòng ban. Hai repo security/deployment vẫn ghim baseline cho tới khi chốt release.

## Lịch sử đợt trước (không phải trạng thái web hiện tại)

# Trạng thái hiện hành - 29/10/2026

Đợt 1 đang ở nhánh feat/authorization-foundation. Quyền theo project, session revocation/refresh và quyền trạng thái ticket đã có code + test. Dark UI responsive ở web/ là prototype dữ liệu minh họa, chưa nối backend. Chưa có offboarding/handover và queue phòng ban hoàn chỉnh.

Kết quả mới: Maven package BUILD SUCCESS, 97 tests được chọn qua (gồm 8 integration PostgreSQL local riêng). Chi tiết phạm vi/giới hạn: [reports/AUTHORIZATION_FOUNDATION.md](reports/AUTHORIZATION_FOUNDATION.md).

## Baseline lịch sử trước đợt 1


## Bằng chứng đã có
- Backend package: BUILD SUCCESS ở lượt chạy trước trên máy hiện tại; Android debug x86_64: BUILD SUCCESSFUL, đã mở Dashboard.
- E2eUserProvisionerTest: 9 test qua ở lượt sửa local.
- Mobile typecheck trong audit: exit 0.
- Mobile Jest audit: 84 suite qua / 1 suite lỗi; 795 test qua / 1 test timeout 5 giây tại TaskDetailScreen.test.tsx:231; có cảnh báo act/open handles. Chưa xác định đó là lỗi sản phẩm hay bất ổn test/môi trường.
- npm audit --omit=dev: 5 mục package bị ảnh hưởng (high 1, low 4), không đồng nghĩa 5 exploit trên APK.

## Lỗi đã tái hiện tại baseline (F03/F04 đã sửa ở nhánh đợt 1)
- F03: /me 200, logout 204, gọi lại bằng access token cũ vẫn 200.
- F04: hai refresh đồng thời cùng token đều trả 200.

## Chưa xác minh / chưa làm
- Toàn bộ backend integration suite với Docker/Testcontainers, Sonar gate, tải lớn, phát hành APK ARM.
- F05 cross-project authorization được xác định qua code, chưa chạy fixture HTTP chéo dự án.
- Web UI mới, coordinator queue, audit writer, Jenkins/Compose/monitoring chưa được xây trong lượt import.

Hai patch local đã nằm trong code import. Không ghi “toàn bộ kiểm thử PASS” và không đưa baseline này ra public như bản sản phẩm hoàn chỉnh.
