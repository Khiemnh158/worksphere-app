# TODO hiện hành - mốc MVP 02/11/2026

Phạm vi phần mềm Lập trình nâng cao đã chốt: SME, giờ hành chính chung, web quản trị/điều phối và Android nhân viên. Người dùng xác nhận chưa có yêu cầu giảng viên bổ sung. Không dùng số tests để suy ra điểm hoặc phần trăm sản phẩm. Bằng chứng: [nghiệm thu 02/11](reports/COURSEWORK_ACCEPTANCE_2026-11-02.md).

## Cổng hoàn tất phần mềm

- [x] Tài khoản/CSV PENDING, kích hoạt và reset email local một lần, TOTP tùy chọn, thu hồi phiên; Admin kỹ thuật tách nghiệp vụ.
- [x] Phòng động, trưởng phòng/lãnh đạo/chuyên trách và người duyệt thay theo phạm vi/thời hạn; chặn tự duyệt; danh bạ phòng 20/trang.
- [x] Công việc, trao đổi/tệp, nghiệm thu, bàn giao giữ tiến độ và yêu cầu rà soát; hỗ trợ trọn vòng trên web.
- [x] Hồ sơ HR → lãnh đạo → cutoff và checklist; không xóa lịch sử tác giả; lương dự tính có người lập/duyệt/phát hành độc lập, không tự phạt/chuyển tiền.
- [x] Công/nghỉ/OT, QR xoay vòng theo điểm, giờ máy chủ, lịch nghỉ cụ thể, cảnh báo mạng phải đối soát, cặp OT riêng; lịch sử punches phân trang cùng phạm vi rows/total.
- [x] Web sáng/tối và điều hướng; Android công việc/hỗ trợ/tệp/chấm công/QR/hồ sơ/bảo mật/phiếu thu nhập cá nhân.
- [x] OPPO: mở/lưu tệp mẫu, lịch sử tháng; đủ IN/OUT/OT_IN/OT_OUT qua camera trong môi trường đồng hồ mô phỏng riêng, đối soát công 470 phút và OT 45 phút.
- [x] OPPO: liên kết OS kích hoạt và reset trọn vòng, người dùng tự đặt mật khẩu và đăng nhập; máy chủ xác nhận token đã dùng.
- [x] Toàn bộ backend 407 tests bằng JDK 21, Docker/Testcontainers và 59 PostgreSQL opt-in: 0 fail/error/skip; package đạt.
- [x] Mobile 98 suites/852 tests và TypeScript; web 8 tests đạt; APK localDemo JDK 21 ARM64+x86_64 có bundle.
- [x] Clone sạch cùng máy/DB mới: build/chạy JDK 21, login/logout, thư reset đúng origin, reuse/Stop/restart; không seed lịch/lương giả.

## Chuẩn bị nộp và trình bày

- [ ] Điền đúng tên/MSSV/phân công thực tế; đối chiếu mẫu báo cáo/slide và rubric khi giảng viên cung cấp.
- [ ] Nhóm diễn tập demo theo PROJECT_GUIDE, tự kiểm trên máy thành viên trước ngày nộp. Đây là kiểm tra môi trường thứ hai, chưa thực hiện.
- [ ] Người dùng duyệt trải nghiệm/phạm vi cuối; lỗi tái hiện trong MVP tiếp tục sửa, không mở rộng tùy ý.

## Giới hạn đã ghi nhận, không kéo dài MVP vì các mục này

- Lịch công chung; ca riêng/ca đêm, biểu mẫu giải trình từng punch, push khi app đóng và mobile quản trị ngang web chưa thuộc mốc này.
- QR/IP không chứng minh hiện diện tuyệt đối; mạng văn phòng thật chưa cung cấp. Không có tự phạt vì muộn hoặc tự cộng OT do quét ra trễ.
- Chưa camera thật mọi nhánh hết hạn/trùng/mất mạng; chưa file cloud/20 MiB/mọi ứng dụng đọc hoặc nhiều trang lịch sử thực tế OPPO. Có tests liên quan nhưng không thay thử thiết bị.
- Danh sách hồ sơ/nhật ký còn giới hạn 200, bộ chọn 1000; chưa thử tải/chứng nhận quy mô lớn hoặc xuất snapshot kế toán.
- Runner backend còn cảnh báo đóng fork Surefire; Jest còn act warnings. Tests đạt không có nghĩa mọi dòng legacy đã được audit.
- Thuế/BHXH/thực lĩnh/ngân hàng, pháp lý sa thải/bồi thường, vân tay/SSO/iOS chưa triển khai; không cần cho phạm vi môn hiện tại.

## Môn Triển khai phần mềm - thực hiện tiếp tại repo riêng

- [ ] Ghim mốc app đã kiểm chứng; build/test/CI theo mẫu môn, cấu hình bí mật và môi trường.
- [ ] Jenkins/Compose/chất lượng/giám sát theo yêu cầu; backup/restore/rollback, log và hướng dẫn tự chạy.
- [ ] HTTPS/SMTP thật, ký phát hành/hosting chỉ khi cần và có cấu hình; không gọi localDemo là production.

Đầu mối: [PROJECT_GUIDE](docs/PROJECT_GUIDE.md). Bằng chứng cũ có ngày giữ làm lịch sử; không mở lại các kế hoạch đã được thay thế. An toàn thông tin thi trắc nghiệm, không có repo/chuyên đề riêng. Hạn mức cũ không dùng làm tiêu chí hoàn tất công việc.
