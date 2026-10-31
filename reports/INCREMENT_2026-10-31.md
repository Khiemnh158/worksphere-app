# Dọn tài liệu và mở liên kết Android — 31/10/2026

## Đã làm

- README/STATUS/phạm vi/cách chạy được rút gọn; PROJECT_GUIDE chứa kiến trúc, vai trò, tám luồng, bảng giao việc với đầu ra/điều kiện hoàn thành, hướng dẫn báo cáo/slide và nguồn tra cứu. DOCUMENTATION ghi quy tắc sử dụng/lịch sử.
- Xóa năm kế hoạch/trạng thái bị thay thế, cập nhật tham chiếu; giữ hợp đồng, nguồn gốc, audit và bằng chứng riêng. Git vẫn lưu phiên bản trước khi dọn.
- Android thêm URI reset/activate có kiểm định cấu trúc. Giữ link trong bộ nhớ khi bootstrap, bỏ khi session thật được khôi phục; không chen ngang tài khoản đang đăng nhập. Warm link mới thắng initial URL trễ. Mở biểu mẫu không tự gửi credential hoặc cấp phiên.
- Web có nút mở Android và sửa nhãn chính sách mật khẩu theo12 ký tự/72byte. Không đổi cơ chế token/hạn/quyền backend.

## Kết quả thực hiện

- TypeScript đạt;22 tests liên quan/4 suites đạt; toàn bộ mobile95 suites/832 tests đạt trong32.174s,0fail/skip. Các act warnings kế thừa còn.
- Lint5 file source liên quan:0errors/2warnings no-void.
- Kiểm tra liên kết Markdown đã đổi: tồn tại. Dò credentials/artifacts/diff và5 tests phiên web được xác minh lại trước bàn giao (xem log local).
- Web local đã mở được biểu mẫu reset với nút Android, dùng token fixture không hợp lệ; không đặt lại mật khẩu thật.
- Backend không thay đổi đợt này. Kết quả150 backend tests là bằng chứng30/10, không ghi như đã chạy lại31/10.

## Chưa nghiệm thu

Liên kết custom scheme trên thiết bị và hết hạn/một lần cần kiểm chứng thực tế tiếp; chưa verified HTTPS App Links/iOS. QR Vào/Ra/OT/network trên APK mới chưa đủ vòng thật. Ngày31/10 lịch đã chọn là WEEKLY_OFF, không tự sửa thành ngày làm để tạo ảnh demo. Không đổi lương, duyệt OT hoặc giả lượt quét.

Tệp mobile, ca cá nhân, phân trang/giải trình punches, thử tải/toàn bộ legacy và nghiệm thu người dùng vẫn trong TODO. Hai repo chuyên đề chưa được gọi là hoàn tất.

Android localDemo: BUILD SUCCESSFUL4m37s,151tasks; cài cập nhật lên OPPO không xóa dữ liệu. Người dùng xác nhận mở được WorkSphere. Android resolver nhận URI về đúng MainActivity. Đây chưa phải kết quả quét QR hoặc hoàn tất khôi phục thật.

## Sửa nhãn ngày nghỉ sau kiểm tra dữ liệu

Web/mobile phân biệt WEEKLY_OFF/HOLIDAY khi chưa vào ca: ghi Ngày nghỉ theo lịch, ẩn khung ca thường; giữ nút OT chỉ theo actions máy chủ. Hai ca regression kiểm tra ngày nghỉ/ngày lễ không mở IN nhưng giữ OT được phép. Backend/lịch/tiền không đổi. Web đã xác minh trực tiếp sau reload.

Bộ cuối95 suites/832 tests đạt32.174s; TypeScript đạt. Lint tăng thêm2file0errors/3warnings (cộng lần7files0errors/5warnings). APK cuối build47s/151tasks, tiếp tục có bundle ARM64+x86_64. Không dùng kết quả fixture thay nghiệm thu QR/OT thật.

## Bổ sung sau khi tiếp tục dưới1%

Biểu mẫu kích hoạt Android có nút Về đăng nhập cả trước khi kích hoạt. Khi bấm, xóa giá trị token/mật khẩu trong state của biểu mẫu và reset stack về Login; không tự gửi API. Kiểm thử navigator mở link → về Login → biểu mẫu/token không còn hiện và không POST đạt (1 test mở rộng,4.352s); TypeScript đạt. Bộ832 tests đầy đủ là kết quả trước thay đổi nhỏ này, không ghi là đã chạy lại toàn bộ sau bổ sung. Nghiệm thu UI thực trên thiết bị vẫn ghi riêng.
