# Phạm vi Kỹ năng lập trình nâng cao

## Mục tiêu
Ứng dụng là xương sống dùng chung của hai học phần còn lại. Chứng minh bằng code thật: thiết kế miền/OOP, DI, validation, exception contract, transactions, optimistic locking, concurrency, policy phân quyền, unit/integration test. Đề cương/chấm điểm môn này chưa được cung cấp: các mục là đề xuất, phải đối chiếu giảng viên.

## Đầu ra cần hoàn thành
- Một client có UI trọn vòng requester → coordinator → agent → requester xác nhận/từ chối.
- Backend quyết định quyền theo permission + quan hệ tài nguyên + trạng thái; allowedActions phản ánh cùng policy.
- Project/Task không vượt phạm vi; nhiều tài khoản thực sự tham gia demo.
- Bộ test âm cho quyền, chuyển trạng thái, race token và dữ liệu liên kết.
- ADR/hợp đồng API, kết quả test đúng thực tế và release target để hai repo khác kiểm thử/triển khai.

## Chưa cam kết
Web + mobile ngang đầy đủ chức năng, microservices, đa công ty, AI/chatbot, full asset UI, SSO/MFA, SLA/escalation nâng cao. Chưa có cơ sở nói giảng viên bắt buộc cả web lẫn mobile.

Môn Phát triển ứng dụng di động của nhóm khác không nằm trong ba học phần nộp ở đây. Mobile được kế thừa như một client và ghi đúng phần công việc sửa/tích hợp thực sự.
