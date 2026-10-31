# Hiện trạng WorkSphere — 31/10/2026

Tài liệu được rà soát ngày 31/10; bằng chứng phân biệt theo ngày bên dưới. Lịch sử thay đổi xem Git và báo cáo từng đợt, không ghép nhiều hiện trạng cũ vào trang này.

## Đã triển khai

- Web: đăng nhập/thu hồi phiên/TOTP; tài khoản và CSV kích hoạt; phòng ban động, quản lý theo phòng, chuyên trách/lãnh đạo/duyệt thay; danh bạ cùng phòng.
- Hỗ trợ trọn vòng; công việc, trao đổi/tệp, nghiệm thu và bàn giao giữ tiến độ; nhân sự/cutoff truy cập; đối soát công và phát hành phiếu thu nhập có kiểm soát độc lập.
- QR xoay vòng, giờ điểm, timestamp máy chủ, IP peer/CIDR và cảnh báo xác minh; IN mở; nghỉ cụ thể; OT cặp riêng có duyệt trước/ngoại lệ. Không tự phạt tiền hoặc tự cộng OT vì về muộn.
- Android dùng chung API: việc/hỗ trợ/công/QR/thông báo/danh bạ/phiếu riêng; bảo mật và sửa tên/số liên hệ. APK localDemo ARM64+x86_64 có bundle, không Metro; vẫn cần backend và đường kết nối local/USB.

## Đã kiểm chứng ngày 30/10

- 150 backend tests được chọn: 94 unit và 56 PostgreSQL thật; package đạt. Chưa toàn bộ legacy Testcontainers.
- 824 mobile tests/93 suites, TypeScript đạt; lint nguồn thay đổi 0 lỗi/32 cảnh báo, còn act warnings kế thừa.
- 5 tests phiên web, kiểm tra cú pháp/diff/credentials. Một số luồng UI web và Android đã kiểm tra; không suy rộng thành mọi vai trò/chức năng đều nghiệm thu.
- Clone sạch cùng máy với Maven Wrapper/cache, database/cổng riêng: login/logout, thư reset đúng origin, reuse/Stop/restart đạt. Chưa kiểm tra trên máy thứ hai hoàn toàn mới.
- Camera OPPO đã lưu một lượt IN ở bản trước. APK mới build/cài/mở trên giả lập; OUT/OT/network trên OPPO mới chưa nghiệm thu.

## Chưa hoàn thành

Xem [TODO](TODO.md) cho các việc có điều kiện hoàn thành. Chính: nghiệm thu thiết bị, tệp và OS links mobile, ca cá nhân, phân trang/giải trình từng lượt công; kiểm thử tải/toàn bộ mã kế thừa và nghiệm thu người dùng.

Mạng văn phòng chưa được cung cấp, giữ UNCONFIGURED; USB không chứng minh vị trí. Lịch local được người dùng chọn 08–17 T2–T6, nghỉ11:30–12:30, không seed lương giả. Chưa ca đêm, tính thuế/BHXH/thực lĩnh, máy vân tay, ký production/iOS/SMTP thật. Hai repo chuyên đề chưa được nhận là triển khai hoàn chỉnh.

Không tính % hoàn thành bằng số ô TODO, không khẳng định hết lỗi hoặc an toàn production. Đọc [hướng dẫn đầu mối](docs/PROJECT_GUIDE.md) và [bằng chứng đợt gần nhất](reports/ATTENDANCE_INCREMENT_2026-10-30.md).

## Cập nhật kiểm chứng31/10

Mobile95 suites/832 tests và TypeScript đạt (32.174s); lint5 file liên quan0errors/2warnings, act warnings kế thừa còn. Android localDemo build4m37s/151tasks, cài cập nhật OPPO và người dùng xác nhận mở ứng dụng; OSlink/QR đủ vòng vẫn cần nghiệm thu riêng. Web có nút mở Android trên biểu mẫu khôi phục với token fixture; không đổi credential thật. Backend không thay đổi,150 tests là bằng chứng30/10. Xem [báo cáo31/10](reports/INCREMENT_2026-10-31.md).
