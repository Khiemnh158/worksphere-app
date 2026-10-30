# TODO hiện hành — 30/10/2026

Checklist cũ trùng/lỗi thời được giữ tại [lịch sử](docs/history/TODO-before-mobile-2026-10-30.md). Dấu hoàn thành chỉ áp dụng phạm vi mô tả, không xác nhận production/toàn bộ module kế thừa.

## Web đã triển khai và kiểm tra

- [x] Đăng nhập thật, thu hồi phiên, menu Admin kỹ thuật riêng; quyền nghiệp vụ theo phòng/nhiệm vụ.
- [x] Phòng ban động, chức vụ trưởng phòng riêng, lãnh đạo theo phòng, người duyệt thay có thời hạn, chặn tự duyệt.
- [x] Danh bạ phòng phân trang 20; đầu mối hỗ trợ liên phòng riêng.
- [x] CSV tối đa 200 tài khoản nguyên lượt, kích hoạt PENDING, reset email local một lần, rate limit, TOTP/mã dự phòng tùy chọn.
- [x] Công việc/tiến độ/tệp/trao đổi/nghiệm thu; bàn giao giữ phần đã làm, người nhận bắt buộc rà soát.
- [x] Hỗ trợ: gửi → phòng nhận → phân công → xử lý → người gửi xác nhận; bổ sung/chuyển phòng/hủy có kiểm soát.
- [x] Hồ sơ nhân sự HR kiểm tra → lãnh đạo quyết định → checklist; cutoff chặn JWT/refresh trước khi tác vụ nền hoàn thiện.
- [x] Công/nghỉ/OT/đối soát thay; bảng lương lập/duyệt độc lập, phát hành khóa nguồn, điều chỉnh bổ sung; không tự phạt/chuyển tiền.
- [x] Điểm QR xoay vòng, hạn mã/thời gian máy chủ, chặn OUT thiếu IN/trùng/điểm đóng/kỳ khóa.
- [x] Sáng/tối, logo mở điều hướng, cuộn menu độc lập, reduced-motion, biểu mẫu mở lại sau hủy.
- [x] Rà soát mới: 142 backend tests chọn lọc (52 PostgreSQL), 5 tests phiên web, package thành công; sửa lộ trạng thái login khi sai mật khẩu và nhãn hủy công việc.
- [x] Khởi động bản mới; kiểm tra UI Admin, tài khoản/chức vụ, nhân viên, bàn giao giữ 65%, mở → hủy → mở biểu mẫu.

Đủ điều kiện bắt đầu mobile trong phạm vi đồ án. Xem [báo cáo cổng web](reports/WEB_READINESS_2026-10-30.md).

## Mobile — đợt đầu đã chạy, chưa coi là hoàn thiện toàn bộ

- [x] Tuyến chính nghiệp vụ mới; tông đen/xanh nhạt, chuyển sáng/tối, hiệu ứng nhẹ theo reduced-motion.
- [x] Đăng nhập TOTP/mã dự phòng; kích hoạt/reset bằng dán liên kết thư local; chặn phản hồi/mutation phiên cũ dưới tài khoản mới.
- [x] Việc của tôi, lịch theo hạn, thao tác theo allowedActions/version; bàn giao bắt buộc rà soát, giữ tiến độ/lịch sử.
- [x] Hỗ trợ tạo/xem/phân trang/trao đổi/xác nhận; nhân viên xử lý và trưởng phòng phân công cơ bản đúng quyền.
- [x] Công/nghỉ/OT/sửa công; xem và duyệt theo canReview, phiên bản; OT phải xác nhận thực tế.
- [x] Bridge camera QR Android; chặn mã sai, hủy camera không chấm, kết quả camera sau đổi phiên bị bỏ. Đã mở camera trên giả lập.
- [x] Thông báo trong app, danh bạ phòng 20/trang, hồ sơ đọc, phiếu thu nhập của chính mình đã phát hành; che số tiền mặc định.
- [x] TypeScript; toàn bộ 91 suites/810 Jest tests đạt; Android debug x86_64 build/cài/đăng nhập/khởi động nguội.
- [x] Ghi chú Android → web đồng bộ; công việc bàn giao giữ 65%. Khôi phục Wrapper chính thức, ghim checksum.
- [ ] Nghiệm thu camera quét QR đang xoay và lượt IN/OUT trên điện thoại thật; thử mất mạng, hết hạn, trùng lượt bằng thiết bị. Test backend cho các điều kiện này đã có, không thay thế thử thiết bị.
- [ ] Tải lên/xem/tải tệp đính kèm mobile; hiện chỉ có metadata tệp công việc, thao tác tệp trên web.
- [ ] Đổi thông tin hồ sơ/MFA/quản lý phiên trực tiếp trên mobile, deep link OS; hiện cấu hình bảo mật qua web, kích hoạt/reset dán liên kết.
- [ ] Push khi ứng dụng đóng/realtime; hiện làm mới khi focus/foreground hoặc bấm cập nhật.
- [ ] Điều phối hỗ trợ mở rộng (chuyển phòng/đề nghị hủy/đổi người kèm rà soát), tạo/sửa việc từ mobile nếu chốt cần mang khỏi web. Hiện thực hiện đầy đủ trên web, không hiện nút giả.
- [x] Build/cài Android debug arm64-v8a trên OPPO thật qua USB; vẫn phụ thuộc Metro/backend local. Chưa xác nhận quét QR thành công.
- [ ] Release signing/APK chạy độc lập Metro và iOS trên macOS; chưa nghiệm thu.

## Còn nghiệm thu / chưa kiểm chứng

- [ ] Người dùng nghiệm thu UI/quy trình; rubric chính thức môn Lập trình nâng cao chưa được cung cấp.
- [ ] Toàn bộ legacy Testcontainers trên Docker; audit hết project/task/assets kế thừa. 142 tests không đại diện toàn bộ suite.
- [ ] Thử tải/phân trang hồ sơ/nhật ký còn giới hạn 200 và bộ chọn 1000 nếu mở rộng quy mô.
- [ ] Release signing, HTTPS/SMTP thật, backup/restore, CI triển khai hai repo chuyên đề.
- [ ] Thuế/BHXH/thực lĩnh/ca đêm/vân tay/SSO chỉ mở khi có yêu cầu/chính sách cụ thể; hiện chưa làm.

## Hạn mức

Kiểm tra hạn mức thực sau mỗi chặng. Khi một cửa sổ còn ≤5%, dừng, lưu trạng thái/việc tiếp theo và báo người dùng. Chờ người dùng yêu cầu mới tiếp tục.
