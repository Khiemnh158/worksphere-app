# Kế hoạch điều chỉnh: một người chính, khoảng hai tuần

Người dùng cho biết nhóm bốn người nhưng chủ yếu tự gánh công việc. Lịch trong PDF lập theo 4 người là tài liệu audit gốc; không dùng nguyên 140-168 giờ người làm năng lực thực tế hiện tại.

Nếu một người chỉ có 2,5-3 giờ/ngày, tổng 14 ngày khoảng 35-42 giờ trước dự phòng. Không đủ để viết lại toàn bộ UI, backend và mọi chức năng cùng hoàn thiện ba môn. Cần đóng scope bằng một lát helpdesk và dùng lại mobile hiện có.

| Thứ tự | Công việc | Điểm bàn giao |
| --- | --- | --- |
| 1 | Chốt rubric, quyền/state, fixture và UI map | Hợp đồng rõ, chưa code dàn trải |
| 2 | Auth/session + scope project + test âm | Không có đường vượt quyền đã biết trong lát demo |
| 3 | Requester/agent/coordinator backend trọn vòng | Cancel/confirm/terminal/queue đúng |
| 4 | Một client web tối thiểu theo từng API | Tạo → giao → xử lý → từ chối/xác nhận thật |
| 5 | Đóng gói Jenkins/Compose/Sonar/monitoring bắt buộc | Pipeline local + ảnh tự chạy |
| 6 | Báo cáo security trước/sau, restore/rollback, rehearsal | Ba môn cùng target commit |

Không đợi UI hoàn hảo mới xử lý Docker; bắt đầu kiểm tra điều kiện môi trường sớm. Nếu có người nhóm hỗ trợ, giao đầu việc đo được: thu ảnh pipeline, chạy test fixture, viết báo cáo theo mẫu, nhập dữ liệu demo. Không giả định họ làm được toàn bộ hạ tầng trong im lặng.

Đợt tiếp theo bắt đầu ở worksphere-app, nhưng cần người dùng chốt lát công việc cụ thể. Full UI/mobile parity, asset management và public bonus hoãn khi thiếu giờ. Ngày nộp chính xác chưa được xác nhận.
