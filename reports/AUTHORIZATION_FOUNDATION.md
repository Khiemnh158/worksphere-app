# Kết quả đợt 1: authorization foundation + dark UI draft

Ngày: 29/10/2026. Nhánh: feat/authorization-foundation.

## Đã sửa

- F03: JWT filter kiểm tra session còn hoạt động và đúng user; logout dùng session trong JWT nên xử lý được refresh payload cũ; khóa/mở khóa không làm token cũ có hiệu lực lại.
- F04: rotation có khóa PostgreSQL, thống nhất thứ tự khóa session trước token trong các luồng thu hồi liên quan.
- F05: ProjectAccessPolicy dùng ở cập nhật dự án/trạng thái, thành viên, milestone và allowedActions; kiểm tra cả permission và active membership theo project.
- F06/F07/F08: requester được cancel/confirm theo state; chặn assignee tự nghiệm thu, assign terminal/self-request; validate asset khi update.
- F14: thêm mapping lỗi token/session sang 401, FORBIDDEN sang 403.
- F19 một phần: không quảng cáo UPDATE_STATUS cho task reader không phải assignee/PM/TL/admin. Chưa trả allowedTransitions chi tiết cho Task.
- Test HTTP kế thừa được sửa fixture để lưu LoginSession thật; dọn session trước khi dọn user, tránh FK mới phát sinh từ fixture. Chưa xác nhận toàn bộ legacy integration suite.

## Kết quả chạy thực

- Maven package: BUILD SUCCESS, 97 tests, 0 failures/errors/skipped trong tập được chọn.
- Gồm 25 unit tests mới về ProjectAccessPolicy, ServiceRequestAccessPolicy và JWT session; 8 integration tests mới trên PostgreSQL local riêng; các unit/domain/file/provisioner liên quan còn lại qua.
- Integration đi qua MockMvc + Spring Security + JPA + Flyway + PostgreSQL thật, không mock policy hoặc database.
- Kiểm tra 7 route read/write project bằng PM ngoài phạm vi: 403 và dữ liệu không đổi; owner update thành công; reader không có manager actions.
- /me sau logout: 401, phiên khác vẫn 200; sau logout-all hai phiên bị chặn; lock rồi unlock không khôi phục token cũ; logout với refresh payload trước rotation vẫn chặn access/refresh mới của cùng phiên.
- Hai refresh đồng thời: đúng một 200 và một 401 trên PostgreSQL.
- Ticket: requester cancel; agent start/resolve; agent close bị 403; requester close thành công; assign ticket đã đóng bị 400.

Lượt integration đầu có một kỳ vọng test sai (assignment endpoint hiện trả 200, test viết 204); đã đối chiếu controller, sửa kỳ vọng và chạy lại. Không đổi API để ép test qua.

## UI đã kiểm tra

- `node --check` cho web/app.js và scripts/preview-ui.mjs.
- Browser desktop và mobile: lọc/tìm task, chọn ngày tương lai, chi tiết bàn giao, checkbox rà soát, ghi nhận vấn đề, bố cục persona nhân viên/quản lý/admin.
- Rà soát xong tiến độ vẫn 65%, history của Lan còn, ghi nhận mới mang tên Hải.
- Mobile CSS viewport khoảng 375 px: không tràn ngang; không thấy JavaScript console error trong các thao tác đã thử.
- Chạy local: `node scripts/preview-ui.mjs` → http://127.0.0.1:18110.
- UI dùng dữ liệu minh họa trong bộ nhớ, chưa có login/API thật, chưa thay mobile UI hiện hành.

## Giới hạn

- Docker Engine chưa hoạt động trong phiên kiểm tra; chưa chạy toàn bộ Testcontainers suite. Tập mới dùng DB PostgreSQL local được tạo riêng, không dùng DB demo chính.
- Không có kết quả mobile build/Jest mới vì không thay source mobile trong đợt này. Timeout Jest baseline vẫn là nợ đã công khai.
- Chưa triển khai hàng đợi phòng ban, coordinator assignment, offboarding DISABLED API, full handover, invite/reset mail hoặc audit writer đầy đủ.
- Không nhận các tests mới là chứng minh toàn ứng dụng an toàn hay đủ production. Scope và quy tắc tiếp theo ở docs/ACCESS_AND_HANDOVER_MVP.md.

## Tái lập integration tests mới

Tạo DB PostgreSQL local riêng có quyền chạy Flyway; cấp WORKSPHERE_AUTHZ_TEST_JDBC_URL, WORKSPHERE_AUTHZ_TEST_DB_USER, WORKSPHERE_AUTHZ_TEST_DB_PASSWORD trong môi trường test. Không trỏ vào production hoặc DB có dữ liệu thật. Nếu không cấp URL, AuthorizationPostgresTest được skip có chủ ý; CI cần cấp fixture hoặc chạy Testcontainers suite hiện hành trên Docker.

Trong backend: Maven `-Dtest=AuthorizationPostgresTest,ProjectAccessPolicyTest,SessionAuthorizationTest,ServiceRequestAccessPolicyTest,TaskTest,TaskWorkflowTest,E2eUserProvisionerTest,FileValidationServiceTest,FilenameSanitizerTest,StoredFileTest package` bằng wrapper theo hệ điều hành. JDK mục tiêu 21; lượt chạy thực dùng JBR Java 25 để biên dịch target 21.
