# Quy tắc tài liệu

## Nguồn đọc hiện hành

README chỉ đường; PROJECT_GUIDE giải thích và giao việc; STATUS tóm tắt thực tế; TODO theo dõi công việc. Hợp đồng nghiệp vụ ở WEB_WORKFLOWS/WEB_PHASE2_CONTRACT/ATTENDANCE_POLICY. Hướng dẫn chạy chuẩn ở FRESH_CLONE_RUNNING. Reports là bằng chứng có ngày, không phải danh sách yêu cầu.

Khi sửa code phải cập nhật đúng hợp đồng, TODO và kết quả kiểm chứng liên quan; không tạo thêm PROJECT_STATE/HANDOFF hoặc kế hoạch trùng chức năng. Báo cáo/slide chưa chạy không được ghi PASS, chưa triển khai không gọi là đã có.

## Dọn ngày 31/10/2026

Đã thay README/STATUS/COURSE_SCOPE/RUNNING bằng thông tin gọn, xóa năm tài liệu bị thay thế: docs/PRODUCT_PLAN.md, docs/SOLO_PLAN.md, docs/WEB_PHASE2_PLAN.md, reports/PROJECT_STATE.md, reports/HANDOFF.md. Quyết định có giá trị giữ ở reports/DECISIONS.md; bằng chứng test/nguồn gốc/audit không xóa. Bản trước vẫn truy vết trong Git (trước commit dọn tài liệu).

docs/legacy, reports/legacy và docs/history là lịch sử có bằng chứng riêng; không lấy số liệu hoặc tuyên bố hoàn thành trong đó làm hiện trạng. Chỉ mở khi cần truy nguồn, không bắt người mới đọc hết. Không xóa source/module/migration chỉ vì tên cũ hoặc chưa nằm trên menu mới.

## Quyền riêng tư

Không đưa mật khẩu/token, thư reset, dữ liệu lương cá nhân, serial thiết bị, IP/giờ hoạt động nhận diện hoặc dump database lên GitHub công khai. Ảnh dùng báo cáo cần dữ liệu fixture và che bí mật. Mỗi ảnh/test cần phiên bản, môi trường, thao tác và kết quả; không dùng ảnh mockup làm bằng chứng chức năng.
