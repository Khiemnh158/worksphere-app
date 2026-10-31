# Android đợt đầu — 30/10/2026

Đã bắt đầu sau khi web qua cổng kiểm tra (WEB_READINESS_2026-10-30.md), theo yêu cầu người dùng. Đây là client dùng cùng API, không phải hệ nghiệp vụ hoặc database mới. Chưa phải bản mobile đầy đủ/production.

## Chia chức năng

| Tài khoản / nhóm | Trên mobile hiện tại | Trên web |
| --- | --- | --- |
| Nhân viên | Công việc được giao, tiến độ/vướng mắc/nghiệm thu, tiếp nhận bàn giao có ghi rà soát; yêu cầu hỗ trợ và trao đổi; QR, đơn nghỉ/OT/sửa công; thông báo, danh bạ phòng, phiếu riêng | Tệp đầy đủ và bảo mật tài khoản; các luồng web đã có |
| Trưởng phòng / người được duyệt | Phạm vi việc được máy chủ trả; nghiệm thu/bàn giao theo allowedActions; phân công hỗ trợ cơ bản; duyệt công/đơn và xác nhận OT theo canReview | Tạo/sửa việc, điều phối hỗ trợ mở rộng, cấu hình/ủy nhiệm |
| HR / chuyên trách lương / lãnh đạo | Các chức năng cá nhân và duyệt công khi có nhiệm vụ; endpoint thu nhập mobile luôn giới hạn chính tài khoản | Hồ sơ nhân sự, cutoff, nguồn công/lịch/quỹ nghỉ, lập/duyệt/phát hành lương độc lập, quyết định/ủy nhiệm theo quyền |
| Admin kỹ thuật | Trang hướng dẫn quản trị, hồ sơ đọc, thông báo, sáng/tối/đăng xuất; không công việc, công hoặc lương | Tài khoản, phòng ban, truy cập, cấu hình kỹ thuật/nhật ký; không tự thành HR |

Danh bạ/yêu cầu có phân trang 20. Công việc, thông báo và bối cảnh vẫn theo giới hạn hiện hành của API; cần thêm phân trang khi mở rộng. Các màn không có thao tác backend tương ứng không dựng nút giả.

## Kiểm thử đã thực hiện

- TypeScript: exit 0.
- Toàn bộ mobile Jest: **91 suites, 810 tests pass**, không skip/failure. Có cảnh báo act từ một số tests kế thừa; không dùng forceExit/tăng timeout để che lỗi. Lượt đầu có kỳ vọng cũ về navigation, theme và mật khẩu; đã sửa theo hợp đồng và chạy lại.
- Ca mới: allowed version và review bàn giao bắt buộc; không retry ngầm khi conflict; QR sai/hủy/đổi tài khoản khi camera chờ không chấm; phản hồi phiên cũ không lộ và mutation không replay dưới tài khoản mới; mạng lỗi tạm không làm logout giả; endpoint phiếu cá nhân; màn duyệt công hiển thị đúng nhân viên và gửi đúng record/version kèm lý do.
- Backend liên quan: 142 tests chọn lọc, 52 PostgreSQL thật; 5 tests session web. Không phải toàn bộ backend Testcontainers.
- Android debug x86_64 build/cài thành công; đăng nhập hai.it và khởi động nguội vào lại; danh bạ cùng phòng, công việc/hạn/người kiểm tra và lịch sử Lan → Hải giữ 65%. Camera native mở được trên giả lập; quét mã thật và IN/OUT trọn vòng bằng camera thiết bị chưa xác minh.
- Gửi ghi chú kiểm tra từ mobile; web tải lại hiện cùng nội dung, tác giả Hải, tiến độ vẫn 65%. Chỉ thêm ghi chú trong database thực hành; không sửa tiến độ/lương/quyết định nhân sự.
- Wrapper chính thức kiểm checksum và chạy --version thành công. APK dùng bản URL loopback qua adb reverse; không phải release độc lập Metro.

Lỗi cập nhật nóng sau khi định dạng ThemeProvider đã xuất hiện trong quá trình phát triển; khởi động nguội hết lỗi và khôi phục phiên bình thường. Không ghi nhận đó là lỗi khởi động nguội đã được tái hiện.

Ảnh ngoài repo: outputs/Web-Mobile-sync-2026-10-30.png và outputs/Android-WorkSphere-2026-10-30.png. Log test/build ngoài repo: work/mobile-all-final.log, mobile-typecheck.log, mobile-android-final.log, mobile-eslint-final.log. reports/mobile-validation.json ghi kết quả có cấu trúc.

## Quyền, đồng bộ và riêng tư

- Backend quyết định scope/state/canReview/allowedActions/version. Mobile không gửi userId, giờ chấm, mức lương hoặc trạng thái đã duyệt trong QR. Camera giữ generation của phiên bắt đầu quét; refresh cũng không được replay thao tác phiên cũ.
- GET /workplace/time/incomes/mine chỉ trả PUBLISHED của chính mình, kể cả tài khoản có quyền lương chuyên trách; điều chỉnh chỉ APPROVED. Che số tiền mặc định và che khi rời màn/background; chưa có biện pháp cấm chụp màn hình hay che snapshot hệ điều hành tuyệt đối.
- Refresh token giữ bằng Keychain, access token trong bộ nhớ. AsyncStorage chỉ lưu giao diện. Khi quay lại màn/app hoặc bấm cập nhật, tải dữ liệu mới; chưa WebSocket/push/offline queue.
- QR xoay hạn ngắn, đồng hồ máy chủ, kiểm trùng/ca/kỳ khóa do backend. QR có thể bị chia sẻ, nên không tuyên bố chống gian lận tuyệt đối hoặc GPS/vân tay thật.

## Chưa làm / chưa nghiệm thu

Tệp đính kèm mobile đầy đủ; cấu hình MFA/đổi mật khẩu/quản lý phiên và sửa hồ sơ trực tiếp mobile; deep link OS; điều phối hỗ trợ nâng cao ngoài web; push/realtime/offline; iOS, ARM/release signing; QR bằng điện thoại thật; kiểm tra tải và nghiệm thu của người dùng. Lint trên nguồn thay đổi: 0 lỗi, 34 cảnh báo về style/render callback theo cấu hình hiện hành. TODO.md là nguồn theo dõi, không nhận mọi checkbox code là E2E thiết bị đã đạt.

## Cài trên OPPO thật

Android debug arm64-v8a đã build/cài và gửi lệnh mở trên OPPO CPH2603 (Android 16), nối backend/Metro qua USB. Người dùng đang đăng nhập để kiểm tra QR; chưa đánh dấu nghiệm thu camera/IN/OUT. Hướng dẫn: docs/MOBILE_RUNNING.md. Bản release/iOS vẫn chưa làm.

## QR trên thiết bị thật — IN đã xác minh

Người dùng quét bằng điện thoại thật; đã kiểm chứng PostgreSQL lưu lượt IN trong môi trường thử local. Chi tiết tài khoản và giờ hoạt động giữ trên máy, không xuất bản. OUT chưa xác minh. Bảng công hiện chỉ sinh khi OUT; việc chưa thấy dòng bảng công sau IN không có nghĩa chưa lưu punch. Các khoảng trống lịch mở điểm, late/early, phê duyệt OT trước giờ và tính khoảng nghỉ được ghi tại TODO.md, chưa nhận là hoàn thiện.
