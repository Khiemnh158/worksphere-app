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
