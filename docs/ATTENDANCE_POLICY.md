# Chấm công, mạng văn phòng và OT

Hợp đồng triển khai sau đợt thử QR. Web và Android dùng cùng API/PostgreSQL; timestamp và quyền do máy chủ quyết định. Phạm vi hiện hành là lịch công chung của doanh nghiệp theo ngày, ca ban ngày trong cùng ngày 06:00–22:00; chưa có lịch ca riêng khác nhau cho từng nhân viên hoặc ca qua đêm.

## Quy trình

1. Người có TIME_REVIEW quản lý điểm đặt tại văn phòng/tầng/chi nhánh, cấu hình giờ mở và mạng IP/CIDR. Điểm không mặc định phải ở lễ tân. Mặc định kỹ thuật 06:00–22:00, có thể thu hẹp trong web.
2. Màn web phát QR chung khi điểm hoạt động và trong giờ mở. Mã đổi sau 30 giây, hạn 40 giây; đóng/đổi cấu hình làm hết hạn các mã đang phát. Nhiều nhân viên dùng cùng mã, mỗi lượt gắn với tài khoản đăng nhập.
3. GET /workplace/attendance/today trả ngày/giờ máy chủ, lịch, các lượt đã lưu và actions. Mobile chỉ hiện actions này. IN xong chuyển WORKING và chỉ còn OUT; OUT xong COMPLETED. Không chấm trùng, không OUT thiếu IN. Đến muộn/về sớm vẫn ghi giờ thật trong phạm vi ca ban ngày và giờ mở điểm.
4. /workplace/time?period=YYYY-MM trả punches riêng với attendance. Lượt IN hiện ngay, không cần đợi OUT. OUT tạo bản ghi PENDING; nếu đã có nguồn công khác thì yêu cầu đối soát, không ghi đè hoặc giả báo hoàn thành.
5. QR chỉ là bằng chứng quét mã ngắn hạn, không chứng minh hiện diện hoặc làm việc thực tế. Không xác nhận chống chấm hộ tuyệt đối, không tự trừ tiền phạt.

## Mạng và người duyệt

Máy chủ lấy địa chỉ kết nối từ request, bỏ qua X-Forwarded-For do client khai; forward-headers-strategy=none. Chỉ chấp nhận IP số/CIDR, không DNS, không CIDR /0. Mỗi điểm tối đa 32 mạng.

- MATCH: khớp cấu hình; vẫn cần đối soát công/OT.
- MISMATCH: khác mạng; lưu lượt kèm cảnh báo, báo trưởng phòng trực tiếp.
- UNCONFIGURED: chưa cấu hình mạng; lưu và yêu cầu xác minh, không tự đánh dấu tại văn phòng.
- UNVERIFIED: lượt lịch sử trước khi có kiểm tra mạng; không sửa lại bằng chứng cũ thành MATCH.

Người duyệt phải ghi căn cứ và chọn rõ đã xác minh mạng khi bản ghi yêu cầu. Backend chặn APPROVE nếu thiếu acknowledgeNetwork=true. Nhân viên không tự duyệt; người duyệt theo phòng/ủy nhiệm đã có. Thông báo ATTENDANCE mở màn công trên web/mobile. Đợt này chưa có biểu mẫu giải trình riêng gắn vào từng punch; căn cứ được ghi ở quyết định đối soát hoặc đơn bổ sung công.

IP không đủ xác minh hiện diện: 4G có thể khác mạng, VPN/proxy có thể làm nhiều nơi có chung IP. USB adb reverse là đường thử local, không phải bằng chứng mạng văn phòng. Không cấu hình IP văn phòng thật nếu chưa được cung cấp. Khi triển khai reverse proxy cần thiết kế nguồn IP tin cậy và kiểm thử riêng; không bật tin header tùy tiện.

## Tính phút công

Phút công thường = giao khoảng IN/OUT với ca − phần nghỉ thực sự nằm trong giao đó, giới hạn bởi normal_minutes. Ví dụ ca 08:00–17:00, nghỉ 11:30–12:30: làm 08:00–11:00 là 180 phút; 12:30–17:00 là 270 phút. Ở lại sau ca không tự tạo OT.

Lịch có giờ nghỉ cụ thể; tổng thời gian nghỉ phải khớp breakMinutes. Lịch cũ thiếu giờ nghỉ không được đoán: bổ sung trước khi tính OUT. Khi chỉ có punch, chỉ được bổ sung khoảng nghỉ còn thiếu mà giữ nguyên lịch nguồn. Khi đã có công/đơn hoặc kỳ khóa, cấu hình lịch bị chặn để không diễn giải lại dữ liệu cũ.

late_minutes = max(0, phút từ đầu ca đến IN − dung sai); early_minutes = max(0, phút từ OUT đến cuối ca). Dung sai chỉ ảnh hưởng cờ báo muộn, không cộng phút công. Hiện chưa trừ khoảng nghỉ khỏi chỉ báo phút đi muộn/về sớm; công thực tế dùng phép giao khoảng nghỉ riêng. Số phút không phải khoản phạt tự động. Kỳ đã chốt không sửa nguồn; thu nhập dựa trên dữ liệu đã duyệt/phát hành theo workflow hiện có.

## OT tách khỏi ca chính

- OT thông thường phải đăng ký và được duyệt trước starts_at (approval_mode=PRIOR).
- Đăng ký sau giờ bắt đầu cần exceptionReason ít nhất 10 ký tự. Duyệt sau giờ bắt đầu cũng cần căn cứ ngoại lệ của người duyệt; ghi EXCEPTION. Không tự chuyển thành duyệt trước.
- Mobile có OT_IN trong khoảng được duyệt và OT_OUT sau khi đã bắt đầu. Giờ ca chính được giữ. Mỗi người/ngày hiện có tối đa một đơn OT và một cặp lượt OT.
- Sau giờ kết thúc kế hoạch, người có quyền xác nhận actualMinutes không vượt requestedMinutes hoặc giao khoảng OT_IN/OT_OUT với khoảng đã duyệt. Cảnh báo mạng phải được xác minh. Về muộn ngoài khoảng không tự cộng thêm.
- Luồng đối soát nhập/bổ sung công cũ vẫn được hỗ trợ: nếu không có cặp quét OT, cần bản ghi công APPROVED bao phủ khoảng OT. Không có bằng chứng thì không xác nhận số phút dương; có thể xác nhận 0.
- Thu nhập chỉ lấy OT CONFIRMED; chưa phải chuyển tiền hoặc bảng lương pháp lý đầy đủ.

## Giới hạn nghiệm thu

Có unit tests cho giao khoảng nghỉ/CIDR/dung sai, PostgreSQL tests cho scope/lượt mở/cảnh báo mạng/OT ngoại lệ và thời lượng thực, mobile tests cho actions và xác nhận mạng. QR IN đã từng kiểm chứng bằng điện thoại thật; OUT trọn vòng, thử mạng văn phòng thật, ca riêng từng người và phản hồi mạng mất trên thiết bị vẫn còn phải nghiệm thu. Danh sách punches hiện giới hạn 1000/kỳ, chưa phân trang.
