# WorkSphere app - hướng dẫn làm việc

## Nguồn hiện hành
- Đọc README.md, docs/PROJECT_GUIDE.md, STATUS.md, docs/COURSE_SCOPE.md và TODO.md trước khi thay đổi.
- Ba môn của nhóm: Kỹ năng lập trình nâng cao, An toàn thông tin, Triển khai phần mềm.
- worksphere-app là nguồn chuẩn duy nhất của business logic; hai repo khác tham chiếu commit cụ thể.
- Tài liệu docs/legacy và reports/legacy là lịch sử nguồn kế thừa, không phải yêu cầu hiện hành.
- Không suy diễn rằng nhóm này học môn Phát triển ứng dụng di động hoặc Quản lý dự án CNTT.

## Quy tắc
- Không commit credentials, dữ liệu runtime, .env thật, build, node_modules hoặc DB dump.
- Không force push, reset hard, sửa migration đã chạy hay thay origin của checkout gốc.
- Mọi chức năng chưa làm phải ghi TODO; không sinh code hạ tầng giả hoặc báo cáo PASS khi chưa chạy.
- Import baseline được phép mang theo lỗi đã công khai trong STATUS; không được gọi import là release đã qua toàn bộ kiểm thử.
- Khi sửa sản phẩm: scope nhỏ, cập nhật hợp đồng/quyền/state, chạy kiểm thử liên quan và ghi đúng kết quả.
- Không tự động bắt đầu sửa UI/auth chỉ vì tài liệu có TODO; làm theo yêu cầu tiếp theo của người dùng.
- Không tạo hoặc gửi thông tin tài khoản mới để upload source. Dùng kết nối GitHub/Git đã được cấp quyền.
