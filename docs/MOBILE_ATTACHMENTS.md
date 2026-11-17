# Tệp đính kèm trên Android

Mobile dùng lại /files và quyền tài nguyên ở backend; không có kho dữ liệu hoặc URL tải công khai riêng. Android dùng Storage Access Framework cho chọn tệp/lưu bản sao và FileProvider chỉ trỏ vùng cache riêng. Không xin quyền đọc toàn bộ bộ nhớ.

## Thao tác

- Công việc: chọn Trao đổi, Cập nhật tiến độ hoặc Gửi nghiệm thu → nhập nội dung phù hợp → Chọn tệp → xác nhận. Những bước đổi người/bàn giao vẫn giữ yêu cầu rà soát và version hiện hành.
- Hỗ trợ: chọn tệp khi tạo yêu cầu hoặc khi gửi Trao đổi trong chi tiết. Tệp trao đổi xuất hiện trong danh sách tệp chung của yêu cầu, theo hợp đồng backend hiện có.
- Mỗi lần gửi chọn một tệp; có thể bổ sung bằng lần trao đổi tiếp theo. Bỏ lựa chọn không xóa tệp gốc trên điện thoại. Chọn rồi hủy bộ chọn giữ lựa chọn trước đó.
- Mở tệp tải qua API có xác thực, sau đó đưa bản tạm tới ứng dụng đọc do người dùng chọn. Lưu bản sao mở hộp chọn nơi lưu của Android; chỉ báo đã lưu khi ghi thành công. Hủy hộp lưu không báo đã lưu.

JPG/JPEG/PNG/WEBP tối đa 10 MiB; PDF/DOCX/XLSX tối đa 20 MiB. Backend kiểm tra lại phần mở rộng, chữ ký nhị phân/nội dung Office và dung lượng thật; không tin MIME/size từ bộ chọn. Chưa hỗ trợ video/ZIP/DOC/XLS cũ hoặc iOS.

## Quyền và phiên

TASK_ATTACHMENT dùng cho công việc phòng; SERVICE_ATTACHMENT dùng cho hỗ trợ. File ID từ máy chủ và generation phiên gốc đi cùng thao tác gắn tệp. Chuyển tài khoản giữa lúc chọn/tải không cho phần việc cũ chạy dưới tài khoản mới. Tệp tải xuống gặp 401 dạng binary vẫn qua cùng cơ chế refresh; 403 không tự nâng quyền.

Không đặt bearer token vào URL/file/bridge native. URL download được dựng từ ID, không mở URL tùy ý trong metadata. Rời danh sách tệp hủy tải và bỏ phản hồi trễ trước khi mở viewer. Máy chủ kiểm tra quyền tải mỗi lần, kể cả khi app từng xem tài nguyên trước đó.

Upload thành công nhưng gắn thất bại giữ ID để thử lại không tải trùng. Nếu tải lại chi tiết thấy tệp đã gắn (mất phản hồi trước), app bỏ bản lựa chọn đã xử lý. Hủy/thoát chỉ cố dọn tệp chưa gắn bằng API ở phiên gốc; máy chủ từ chối xóa tệp đang liên kết. Không khẳng định đã xóa server khi mạng/phiên không còn; tệp chưa gắn có thể cần chuyên trách dọn sau. Khi kết quả tạo yêu cầu không rõ do mất mạng, kiểm tra danh sách trước khi gửi lại để tránh tạo yêu cầu trùng.

## Bản sao trên thiết bị

Bộ chọn chép tệp được chọn vào vùng tạm riêng để nội dung ổn định khi gửi. Cache có giới hạn dung lượng, hạn 24 giờ, xóa khi runtime mới/thu hồi phiên và kiểm tra epoch cho thao tác native đang chờ. FileProvider không exported, chỉ cấp đọc cho URI tệp cụ thể. App không tự mở tệp thực thi hay yêu cầu quyền quản lý mọi tệp.

Ứng dụng đọc hoặc nơi lưu do người dùng chọn nhận nội dung tệp. Bản sao người dùng đã lưu và nội dung ứng dụng khác đã đọc không thể bị thu hồi bằng cách khóa tài khoản. Nếu lưu bị gián đoạn, kiểm tra bản sao ở nơi đã chọn và thực hiện lại; không coi một lần mở hộp lưu là lưu thành công.

## Kiểm chứng

Xem [báo cáo 01/11](../reports/INCREMENT_2026-11-01.md) cho tests và ca thiết bị thật đã chạy. Các kết quả unit không thay thế nghiệm thu bộ chọn, ứng dụng đọc và nơi lưu trên từng máy. Khi chưa cài bản có WorkplaceFiles, app báo rõ chưa hỗ trợ; không mở nút giả hoặc tự chuyển sang URL không xác thực.
