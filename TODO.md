# TODO hiện hành — 31/10/2026

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
- [x] Rà soát mới: 150 backend tests chọn lọc (56 PostgreSQL), 5 tests phiên web, package thành công; sửa lộ trạng thái login khi sai mật khẩu và nhãn hủy công việc.
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
- [x] TypeScript; toàn bộ 93 suites/824 Jest tests đạt; Android debug x86_64 build/cài/đăng nhập/khởi động nguội.
- [x] Ghi chú Android → web đồng bộ; công việc bàn giao giữ 65%. Khôi phục Wrapper chính thức, ghim checksum.
- [ ] Nghiệm thu camera quét QR đang xoay và lượt IN/OUT trên điện thoại thật; thử mất mạng, hết hạn, trùng lượt bằng thiết bị. Test backend cho các điều kiện này đã có, không thay thế thử thiết bị.
- [ ] Tải lên/xem/tải tệp đính kèm mobile; hiện chỉ có metadata tệp công việc, thao tác tệp trên web.
- [x] Mobile: đổi mật khẩu, thiết lập/bật/tắt TOTP, mã dự phòng một lần và đăng xuất mọi thiết bị; che secrets khi background/blur, không giả báo remote logout thành công khi mất mạng.
- [x] Mobile sửa họ tên/số liên hệ qua /me; giữ số đã có khi chỉ sửa tên, không gửi thay đổi quyền/phòng/ảnh.
- [x] Android custom scheme kích hoạt/reset, warm/cold/session guard và nút từ web; không tự POST khi mở.
- [ ] Nghiệm thu OS link trọn vòng trên OPPO; HTTPS App Links xác minh miền/iOS chưa có. Dán liên kết web vẫn dùng được.
- [ ] Push khi ứng dụng đóng/realtime; hiện làm mới khi focus/foreground hoặc bấm cập nhật.
- [ ] Điều phối hỗ trợ mở rộng (chuyển phòng/đề nghị hủy/đổi người kèm rà soát), tạo/sửa việc từ mobile nếu chốt cần mang khỏi web. Hiện thực hiện đầy đủ trên web, không hiện nút giả.
- [x] Build/cài Android debug arm64-v8a trên OPPO thật qua USB; vẫn phụ thuộc Metro/backend local. Đã xác nhận lượt IN bằng camera điện thoại thật trong môi trường thử local; OUT còn chờ.
- [x] APK localDemo arm64-v8a + x86_64 chứa bundle, tắt dev support, chỉ loopback; đăng nhập và xem công trên giả lập khi Metro tắt. Backend local/USB vẫn cần.
- [ ] Production release signing/HTTPS hosted API và iOS trên macOS; chưa nghiệm thu.

## Còn nghiệm thu / chưa kiểm chứng

- [ ] Người dùng nghiệm thu UI/quy trình; rubric chính thức môn Lập trình nâng cao chưa được cung cấp.
- [ ] Toàn bộ legacy Testcontainers trên Docker; audit hết project/task/assets kế thừa. 150 tests không đại diện toàn bộ suite.
- [ ] Thử tải/phân trang hồ sơ/nhật ký còn giới hạn 200 và bộ chọn 1000 nếu mở rộng quy mô.
- [ ] Release signing, HTTPS/SMTP thật, backup/restore, CI triển khai hai repo chuyên đề.
- [ ] Thuế/BHXH/thực lĩnh/ca đêm/vân tay/SSO chỉ mở khi có yêu cầu/chính sách cụ thể; hiện chưa làm.

## Hạn mức

Ngày31/10 người dùng cho phép tiếp tục dù hạn mức tuần còn5%, thay ngưỡng dừng trước đó. Theo dõi và lưu bàn giao trước khi hết; không cam kết đủ hạn mức để xong mọi việc.

## Chấm công sau rà soát — đã triển khai, còn nghiệm thu thiết bị

- [x] Hiển thị IN đang mở, trạng thái/actions theo máy chủ, late/early và khoảng nghỉ cụ thể trên web/mobile.
- [x] Giờ mở điểm, IP/CIDR dạng số; bỏ qua header IP tự khai, cảnh báo chưa cấu hình/khác mạng, thông báo trưởng phòng; người duyệt phải xác minh rõ.
- [x] Lưu timestamp/IP/cảnh báo của lượt; thay cấu hình đóng điểm làm hết hạn QR, không ghi đè nguồn công đã có.
- [x] OT duyệt trước/ngoại lệ có căn cứ, cặp quét OT riêng, không vượt phút thực tế trong khoảng duyệt, không tự cộng tiền do ra muộn.
- [x] Công thường chỉ trừ phần nghỉ giao với thời gian làm; lịch cũ phải bổ sung giờ nghỉ, không tự đoán hoặc sửa nguồn đã duyệt.
- [x] Script khởi động web và Android nằm trong repo; thử trên database/cổng riêng, nhận lại tiến trình và Stop riêng; Maven Wrapper đã xác minh.
- [ ] Nghiệm thu OUT/cảnh báo mạng/OT bằng điện thoại thật trên bản mới; hiện đã kiểm IN thật và các nhánh nghiệp vụ bằng PostgreSQL tests.
- [ ] Lịch riêng/ca khác nhau theo từng nhân viên; hiện lịch công chung doanh nghiệp. Ca đêm vẫn ngoài phạm vi hiện tại.
- [ ] Biểu mẫu giải trình riêng gắn từng punch; hiện căn cứ ở quyết định đối soát/đơn bổ sung, kèm thông báo người phụ trách.
- [ ] Phân trang punches (đang giới hạn 1000/kỳ) và giám sát tải khi mở rộng.

Đọc docs/ATTENDANCE_POLICY.md và docs/FRESH_CLONE_RUNNING.md. Không khẳng định QR/IP chứng minh hiện diện tuyệt đối; không tự phạt tiền. Các chính sách/mạng thật chưa cung cấp không được tự giả định.

## Tài liệu và giao việc — 31/10

- [x] Một đầu mối PROJECT_GUIDE: kiến trúc, vai trò, luồng, bảng giao việc/đầu ra/nghiệm thu và khung báo cáo/slide.
- [x] README/STATUS/COURSE_SCOPE/RUNNING gọn, xóa năm kế hoạch/trạng thái bị thay thế; giữ bằng chứng riêng và nguồn gốc.
- [ ] Đối chiếu rubric/mẫu giảng viên; tạo báo cáo/slide thực tế sau khi chốt bằng chứng.

- [x] Ngày31/10: toàn bộ mobile95 suites/832 tests và TypeScript đạt; lint5 file thay đổi0errors/2warnings. Backend150 là kết quả30/10, không chạy lại hôm nay.

- [x] Nhãn ngày nghỉ/ngày lễ và khung ca thường web/mobile đúng day_kind; OT tiếp tục theo actions máy chủ, thêm2 tests, không đổi lịch.
- [x] Biểu mẫu kích hoạt Android có lối quay về Login trước khi kích hoạt; mở rộng test không POST và biểu mẫu/token rời màn hình. Kiểm tra trên OPPO vẫn cần nghiệm thu.
