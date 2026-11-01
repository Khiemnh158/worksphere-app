# Tệp đính kèm Android — 01/11/2026

## Thay đổi

- Android dùng bộ chọn tệp hệ thống, chép bản được chọn vào cache riêng có kiểm tra dung lượng thực. FileProvider không exported và chỉ trỏ đúng thư mục cache. Không thêm quyền đọc toàn bộ bộ nhớ hoặc lưu bearer token trong native/URL.
- Mobile tạo hỗ trợ, trao đổi hỗ trợ và trao đổi/tiến độ/gửi nghiệm thu công việc có thể gắn một tệp mỗi lần. Danh sách chi tiết mở bằng ứng dụng người dùng chọn hoặc Save As có xác nhận kết quả.
- Tải lên/gắn/tải xuống gắn generation phiên gốc; dọn cache khi thu hồi phiên; native kiểm epoch khi đọc/ghi. Rời màn hình hủy tải, không mở phản hồi trễ. Lỗi401 dạng binary được giải mã envelope có giới hạn để dùng lại refresh policy.
- Thử lại thao tác gắn dùng ID đã upload; thấy file đã được gắn sau tải lại thì bỏ lựa chọn đã xử lý. Dọn server chỉ best effort cho file chưa gắn, không giả báo xóa khi không còn phiên/mạng.

## Đã kiểm chứng

- TypeScript đạt; toàn bộ 97 suites/848 tests đạt trong 36.037s, 0 fail/skip. Các act warnings kế thừa còn. Hai suites mới và mở rộng kiểm tra hợp đồng/phiên; không dùng số test để suy ra % sản phẩm.
- ESLint 8 file source thay đổi: 0 errors/24 warnings (style/no-void và phép đóng gói base64). Cú pháp JS, diff/credentials/artifacts và 5 tests phiên web đạt.
- Build Android localDemo ARM64+x86_64: thành công, bản cuối 49s/151 tasks; backend không thay đổi.150 backend tests vẫn là bằng chứng 30/10, không nhận là đã chạy lại trong đợt này.
- API local: sai purpose tệp bị415 FILE_TYPE_NOT_ALLOWED; tạo hỗ trợ và trao đổi kèm tệp đạt; bytes tải xuống của chủ thể trùng fixture; tài khoản ngoài phạm vi bị403. Yêu cầu kiểm thử được hủy có lịch sử, không xóa liên kết hoặc giả dữ liệu.
- Giả lập Android: chọn ảnh tổng hợp trong Downloads → gửi cùng trao đổi công việc → tải lại bytes khớp ảnh gốc, giữ tiến độ65%; mở được bằng trình đọc ảnh; Save As tạo bản sao khớp từng byte; hủy Save As hiện đúng thông báo chưa lưu. Tài khoản khác phòng không tải được tệp công việc (403). Một tệp fixture sai-purpose còn chưa gắn đã được soft-delete qua API chủ sở hữu sau thử, giữ file đang liên kết.
- APK cuối đã cài lên OPPO qua USB; người dùng xác nhận mở được ảnh mẫu và lưu bản sao thành công. Không suy rộng xác nhận này thành kiểm chứng mọi loại tệp/provider hoặc hash của bản sao trên OPPO.
- Đăng xuất riêng phiên giả lập: ứng dụng trở về màn đăng nhập, cache native từ một tệp về trống. Phiên OPPO được giữ nguyên. APK cuối cũng đã cài lại thành công lên giả lập, không cần Metro.

## Giới hạn

Chưa thử file 20 MiB thật/provider cloud và nhiều ứng dụng đọc; chưa iOS. Bản sao đã lưu/ứng dụng khác đã đọc không bị thu hồi khi khóa tài khoản. Kết quả tạo yêu cầu không rõ vì mất mạng cần kiểm tra danh sách trước khi gửi lại. File chưa gắn có thể cần dọn server khi hết phiên.

QR/OT/network thiết bị thật, ca cá nhân, phân trang/giải trình punches, full legacy/load/production và hai repo chuyên đề vẫn còn TODO. Đọc [hợp đồng tệp](../docs/MOBILE_ATTACHMENTS.md), [hướng dẫn đầu mối](../docs/PROJECT_GUIDE.md) và [TODO](../TODO.md).

Ảnh và ID bằng chứng gắn với tài khoản thực hành giữ local ngoài Git; báo cáo công khai chỉ mô tả ca thử bằng fixture.
