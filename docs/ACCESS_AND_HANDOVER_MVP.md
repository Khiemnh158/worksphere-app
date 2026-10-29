# Cập nhật triển khai web

Hợp đồng đang vận hành và giới hạn ở WEB_WORKFLOWS.md. Bàn giao công việc và yêu cầu hỗ trợ đã lưu DB, không còn chỉ là minh họa. Tài khoản/phòng ban và ngừng truy cập đã có API; quyết định pháp lý/lịch hiệu lực tương lai vẫn chưa được tự động hóa.

## Hợp đồng đợt foundation ban đầu

# Hợp đồng quyền và bàn giao MVP - 29/10/2026

Trạng thái: hợp đồng đã được thống nhất trong trao đổi. Chỉ các mục ở phần “đã triển khai đợt 1” là code hoạt động; các luồng còn lại là thiết kế tiếp theo.

## Mô hình đã chốt

- Một công ty thương mại/dịch vụ nhỏ, ba phòng: Kinh doanh, IT, Hành chính.
- Mỗi phòng hỗ trợ có một hàng đợi; mô hình nhiều team con hoãn. Không đồng nhất trưởng phòng với quản lý mọi dự án.
- Nhân viên có một phòng chính. Chức vụ quản lý phòng, role hệ thống và quan hệ requester/assignee/membership là những thông tin riêng.
- Role hiện có: ADMIN, PROJECT_MANAGER, TEAM_LEADER, EMPLOYEE; không thêm role MANAGER_IT/EMPLOYEE_IT.
- Permission + quan hệ với tài nguyên + trạng thái quyết định thao tác. UI ẩn nút không thay thế authorization trên server.

## Đã triển khai đợt 1

| Phạm vi | Quy tắc server |
| --- | --- |
| Access token | Tài khoản ACTIVE và login session ACTIVE, session thuộc đúng user; kiểm tra DB mỗi request |
| Logout | Phiên ký trong JWT là căn cứ; logout vẫn thu hồi đúng phiên khi refresh payload cũ do vừa rotation; phiên khác không bị ảnh hưởng |
| Logout-all/khóa/reset | Thu hồi session; mở khóa không khôi phục session đã thu hồi; thứ tự khóa session → token |
| Refresh | Kiểm tra tài khoản và phiên; khóa dữ liệu để một refresh token chỉ có một lần rotation thành công |
| Project đọc | PROJECT_READ + active membership, hoặc ADMIN có permission |
| Project cập nhật/trạng thái/milestone | PROJECT_UPDATE + active PROJECT_MANAGER trong chính dự án, hoặc ADMIN có permission |
| Project thành viên | PROJECT_MEMBER_MANAGE + active PROJECT_MANAGER trong chính dự án, hoặc ADMIN có permission |
| allowedActions dự án | Dùng cùng ProjectAccessPolicy với các mutation; không cấp quyền bằng managerId cũ hoặc role toàn cục đơn thuần |
| Ticket OPEN → CANCELLED | Chỉ requester; hợp đồng version vẫn áp dụng |
| Ticket RESOLVED → CLOSED | Requester, không phải người đang tự xử lý; assignee không nghiệm thu thay |
| Ticket vận hành | Assignee hoặc ADMIN theo chuyển trạng thái hợp lệ; từ chối kết quả qua endpoint riêng có lý do |
| Ticket phân công | Chặn CLOSED/CANCELLED và không giao cho chính requester; hiện vẫn là endpoint ADMIN, chưa có coordinator theo phòng |
| Liên kết tài sản | Update ticket kiểm tra tài sản bằng cùng policy của create |
| Task UPDATE_STATUS hint | Reader thường không nhận action này; server vẫn kiểm tra vai trò/assignee theo từng chuyển trạng thái |

HTTP lỗi token/phiên trả 401; lỗi quyền trả 403; version conflict giữ 409. Không thay DTO công khai hoặc migration trong đợt này. Token tự tạo ở test HTTP phải có session thật trong DB.

## Quy tắc bàn giao đã được người dùng bổ sung

Ví dụ Lan đang làm 65%, Hải nhận tiếp:

1. Giữ nguyên tiến độ, trạng thái công việc, hạn, kết quả, file và lịch sử của Lan.
2. Ghi một sự kiện phân công/bàn giao mới từ Lan sang Hải; không thay tác giả cập nhật cũ.
3. Hải tự kiểm tra phần Lan đã làm, xác định phần đúng/chưa rõ/cần sửa, rồi tiếp tục công việc.
4. Ghi nhận rà soát thuộc Hải; không sửa nội dung lịch sử của Lan.
5. Đánh dấu “đã rà soát bàn giao” không tăng phần trăm, không chuyển COMPLETED và không thay bước review cuối của công việc.
6. Nếu thấy vấn đề, Hải ghi nhận và trao đổi với quản lý khi cần. Không đặt thêm cổng quản lý phải duyệt việc nhận bàn giao trước khi Hải kiểm tra.

Phần này mới có UI minh họa; chưa có API/lưu trữ quy trình bàn giao hoàn chỉnh.

## Ngừng hoạt động/chuyển phòng - thiết kế tiếp theo

- Ngừng hoạt động: thu hồi quyền trước; việc chưa kết thúc hiện trong danh sách cần bàn giao. Không chờ có người thay mới khóa tài khoản.
- Việc COMPLETED/CLOSED/CANCELLED giữ lịch sử; việc đang review để người có quyền review quyết định.
- Trưởng phòng hỗ trợ xử lý ticket của phòng; quản lý từng project xử lý task của project đó; admin chỉ định người thay khi người quản lý cũng nghỉ.
- Người nhận phải ACTIVE, thuộc phạm vi nhận việc; task dự án còn cần membership hợp lệ. Không tự chuyển mọi việc sang nhân viên mới.
- Người gửi đã nghỉ: quyết định người xác nhận thay theo từng ticket, giữ requester gốc và lý do; chưa triển khai delegated acceptance.
- Phân biệt nghỉ phép và vô hiệu hóa tài khoản. PENDING/ACTIVE/LOCKED/DISABLED không phải hệ thống chấm công.
- Department routing và notification nhân sự mới/ngừng hoạt động cần migration/API riêng; chưa có trong đợt 1.

## UI và giới hạn lịch

- Hướng thiết kế: dark theme, chữ rõ, điểm nhấn xanh vàng nhạt/lavender, thẻ công việc và lịch cá nhân.
- Bản `web/` là prototype responsive, dữ liệu fixture. Persona picker dùng để duyệt bố cục, không phải login thật.
- Lịch 7 ngày hỗ trợ xem việc hiện tại/tương lai trong prototype; khung giờ minh họa không đồng nghĩa backend đã có scheduling hoặc timesheet.
- Không nối prototype vào dữ liệu thật bằng cách lấy role do người dùng tự chọn. Client thực sẽ dùng login + /me và allowedActions từ server.

## Bước tiếp theo

1. Routing theo phòng và coordinator scope (thay đề xuất owner team trong bản PDF ban đầu).
2. API quản lý tài khoản/ngừng hoạt động + danh sách việc cần bàn giao và audit.
3. Lưu ghi nhận rà soát của Hải và giữ nguyên tiến độ khi bàn giao.
4. Nối UI login/me/task/ticket vào API thật; sau đó áp dụng thiết kế cho mobile.
