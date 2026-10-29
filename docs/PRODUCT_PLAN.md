# Kế hoạch xây lại UI và hoàn thiện nghiệp vụ (CHƯA TRIỂN KHAI)

## Mô hình tối thiểu
- Một công ty, 3 phòng ban: IT, Nhân sự - Hành chính, Kinh doanh - Vận hành.
- Department là đơn vị tổ chức; Team là nhóm nhận việc; Project có membership/role riêng.
- ServiceRequest là nhu cầu của người gửi và có bước nghiệm thu; Task là công việc thực hiện nội bộ. Liên kết ticket-task là backlog, chưa có trong source.
- MVP dùng một hàng đợi mỗi phòng hỗ trợ; category dự kiến gắn phòng tiếp nhận. Nhiều team con hoãn; người điều phối chỉ xử lý hàng đợi đúng phòng.
- Role admin trong source hiện tại là `ADMIN`; các role còn lại `PROJECT_MANAGER`, `TEAM_LEADER`, `EMPLOYEE`. Requester/agent/coordinator là khả năng theo từng tài nguyên; không tự thêm role DB khi chưa chốt hợp đồng.

## Quyền theo actor và trạng thái cần sửa
| Chuyển trạng thái | Người được làm | Điều kiện |
| --- | --- | --- |
| tạo → OPEN | requester | category/file/asset hợp lệ |
| OPEN → ASSIGNED | coordinator đúng phòng | agent ACTIVE; một active assignment |
| ASSIGNED → IN_PROGRESS | active assignee | bắt đầu xử lý |
| IN_PROGRESS → WAITING_FOR_USER | assignee | ghi câu hỏi |
| WAITING_FOR_USER → IN_PROGRESS | assignee | requester bổ sung thông tin |
| IN_PROGRESS → RESOLVED | assignee | có giải pháp |
| RESOLVED → CLOSED | requester | xác nhận kết quả; không tự nghiệm thu thay người gửi |
| RESOLVED → IN_PROGRESS | requester | lý do từ chối, thông báo assignee |
| OPEN → CANCELLED | requester | hủy trước tiếp nhận |
| CLOSED/CANCELLED | không sửa assignment vận hành | nhu cầu mới tạo ticket mới hoặc thiết kế reopen sau |

## UI ưu tiên theo sức một người
1. Chốt sitemap và vai trò; dùng mock theo API contract trước khi làm visual polish.
2. Web tối thiểu: Login, yêu cầu của tôi/tạo, chi tiết có comment/history/action, hàng đợi hỗ trợ cho coordinator/agent.
3. Giữ Project/Task mobile đã có, sửa lỗi quyền/hiển thị liên quan; không xây lại cả hai client từ số 0 cùng lúc.
4. Bổ sung web project/task sau khi ticket trọn vòng; admin organization UI và full asset UI để sau.

## Luồng đăng nhập/phân quyền cần chốt trước UI chi tiết
- Login /me, trạng thái ACTIVE/LOCKED/PENDING; lỗi ngoài thống nhất, không dò tài khoản.
- Access token/logout, refresh single-use atomic, policy session khi đổi/reset mật khẩu.
- Query và mutation cùng phạm vi; backend không dựa vào UI ẩn nút.
- Profile avatar kiểm ownership/purpose; project PM không sửa project ngoài phạm vi.
- Seed demo dùng local, không biến seed thành onboarding thật; email invite/reset hiện chưa hoàn chỉnh.

## Tiêu chí xong một lát nghiệp vụ
Test quyền/state qua, API contract rõ, UI tương tác thật với nhiều tài khoản, history/notification đúng, không sửa DB để vượt bước demo. Chưa có thiết kế UI mới được triển khai ở commit import.

## Hợp đồng bổ sung hiện hành

Đọc [ACCESS_AND_HANDOVER_MVP.md](ACCESS_AND_HANDOVER_MVP.md). Quy tắc bàn giao: Hải tiếp tục tiến độ của Lan và tự rà soát phần trước; không reset tiến độ, không thay tác giả lịch sử. Xem reports/AUTHORIZATION_FOUNDATION.md để phân biệt code đợt 1 với thiết kế còn chờ.
