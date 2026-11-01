# Hiện trạng WorkSphere — 01/11/2026

Ứng dụng có web nghiệp vụ và Android dùng chung API. Đây là bản đồ án đang kiểm chứng, chưa nghiệm thu toàn bộ hoặc production. Lịch sử xem Git và báo cáo có ngày, không dùng kế hoạch cũ như tính năng đã hoàn tất.

## Đã triển khai

- Danh bạ theo phòng, tài khoản/CSV kích hoạt/thư local/TOTP/session; phòng ban động, trưởng phòng, lãnh đạo và chuyên trách độc lập; người duyệt thay có phạm vi/thời hạn.
- Hỗ trợ trọn vòng; công việc/trao đổi/tệp/nghiệm thu/bàn giao giữ tiến độ; hồ sơ nhân sự/cutoff truy cập; công/nghỉ/OT và phát hành phiếu thu nhập có kiểm soát.
- QR giờ máy chủ, giờ điểm và mạng cần xác minh, IN mở, nghỉ cụ thể, OT riêng có duyệt trước/ngoại lệ. Không tự phạt hoặc cộng OT do ra muộn. Lịch hiện chung doanh nghiệp, chưa ca riêng/ca đêm.
- Android có tuyến nhân viên, bảo mật/sửa thông tin, custom-scheme recovery link và tệp chọn/gắn/mở/Save As qua API có xác thực. Tệp một lần gửi; ảnh 10 MiB, tài liệu 20 MiB. Phiên cũ không tiếp tục thao tác dưới tài khoản mới, cache riêng dọn khi thu hồi phiên.

## Bằng chứng theo ngày

| Ngày | Kết quả | Giới hạn |
|---|---|---|
|30/10|150 backend tests chọn lọc (56 PostgreSQL), Maven package; clone sạch cùng máy/database riêng|Chưa toàn bộ legacy hoặc máy thứ hai hoàn toàn mới|
|01/11|97 suites/848 mobile tests, TypeScript; lint 8 file: 0 errors/24 warnings; 5 web session tests và kiểm tra cú pháp/diff/secrets/liên kết|Còn act/style warnings; backend không thay đổi/chạy lại trong đợt tệp|
|01/11|Giả lập chọn/gắn tệp thật qua UI; bytes download và Save As khớp fixture; mở ảnh, hủy lưu và dọn cache khi đăng xuất đúng; tiến độ giữ 65%; API chặn sai purpose 415 và ngoài phạm vi 403|Tệp mẫu PNG nhỏ; chưa tệp 20 MiB/cloud/mọi ứng dụng đọc|
|01/11|APK ARM64+x86_64 build 49s/151 tasks, cài OPPO; người dùng xác nhận mở và lưu mẫu thành công|Không coi đây là hash/thiết bị-e2e cho mọi chức năng|

Chi tiết: [báo cáo 01/11](reports/INCREMENT_2026-11-01.md), [mobile JSON](reports/mobile-validation.json). QR thật từng có IN ở bản trước; OUT/OT/network đủ vòng trên APK hiện hành vẫn chờ nghiệm thu. Recovery custom scheme có tests guard, chưa verified HTTPS App Links/iOS.

## Còn lại

[TODO](TODO.md) là backlog chuẩn: nghiệm thu thiết bị/quyền/cutoff; ca cá nhân; phân trang/giải trình punches; load/toàn bộ legacy, release và yêu cầu chính thức ba môn. Mạng văn phòng chưa cung cấp nên giữ UNCONFIGURED; USB không chứng minh vị trí.

Lịch thử được chọn 08–17 T2–T6, nghỉ 11:30–12:30. Không seed lương giả; chưa thuế/BHXH/thực lĩnh, ngân hàng, pháp lý bồi thường/sa thải, vân tay/SSO, SMTP/SMS thật, iOS/production. Hai repo chuyên đề chưa được coi là hoàn tất. Không tính % bằng số tests/ô TODO.

Đọc [PROJECT_GUIDE](docs/PROJECT_GUIDE.md) để giao việc và chuẩn bị báo cáo/slide, [FRESH_CLONE_RUNNING](docs/FRESH_CLONE_RUNNING.md) để chạy từ source.
