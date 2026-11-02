# Tệp Android và lịch sử chấm công — 01/11/2026

## Thay đổi

- Android dùng bộ chọn tệp hệ thống, chép bản được chọn vào cache riêng có kiểm tra dung lượng thực. FileProvider không exported và chỉ trỏ đúng thư mục cache. Không thêm quyền đọc toàn bộ bộ nhớ hoặc lưu bearer token trong native/URL.
- Mobile tạo hỗ trợ, trao đổi hỗ trợ và trao đổi/tiến độ/gửi nghiệm thu công việc có thể gắn một tệp mỗi lần. Danh sách chi tiết mở bằng ứng dụng người dùng chọn hoặc Save As có xác nhận kết quả.
- Tải lên/gắn/tải xuống gắn generation phiên gốc; dọn cache khi thu hồi phiên; native kiểm epoch khi đọc/ghi. Rời màn hình hủy tải, không mở phản hồi trễ. Lỗi401 dạng binary được giải mã envelope có giới hạn để dùng lại refresh policy.
- Thử lại thao tác gắn dùng ID đã upload; thấy file đã được gắn sau tải lại thì bỏ lựa chọn đã xử lý. Dọn server chỉ best effort cho file chưa gắn, không giả báo xóa khi không còn phiên/mạng.

## Đã kiểm chứng

- TypeScript đạt; toàn bộ 97 suites/848 tests đạt trong 36.037s, 0 fail/skip. Các act warnings kế thừa còn. Hai suites mới và mở rộng kiểm tra hợp đồng/phiên; không dùng số test để suy ra % sản phẩm.
- ESLint 8 file source thay đổi: 0 errors/24 warnings (style/no-void và phép đóng gói base64). Cú pháp JS, diff/credentials/artifacts và 5 tests phiên web đạt.
- Build Android localDemo ARM64+x86_64: thành công, bản cuối 49s/151 tasks; backend không thay đổi.150 backend tests vẫn là bằng chứng 30/10, chưa chạy lại trong đợt tệp; kết quả chạy lại khi thêm phân trang ở mục bên dưới.
- API local: sai purpose tệp bị415 FILE_TYPE_NOT_ALLOWED; tạo hỗ trợ và trao đổi kèm tệp đạt; bytes tải xuống của chủ thể trùng fixture; tài khoản ngoài phạm vi bị403. Yêu cầu kiểm thử được hủy có lịch sử, không xóa liên kết hoặc giả dữ liệu.
- Giả lập Android: chọn ảnh tổng hợp trong Downloads → gửi cùng trao đổi công việc → tải lại bytes khớp ảnh gốc, giữ tiến độ65%; mở được bằng trình đọc ảnh; Save As tạo bản sao khớp từng byte; hủy Save As hiện đúng thông báo chưa lưu. Tài khoản khác phòng không tải được tệp công việc (403). Một tệp fixture sai-purpose còn chưa gắn đã được soft-delete qua API chủ sở hữu sau thử, giữ file đang liên kết.
- APK cuối đã cài lên OPPO qua USB; người dùng xác nhận mở được ảnh mẫu và lưu bản sao thành công. Không suy rộng xác nhận này thành kiểm chứng mọi loại tệp/provider hoặc hash của bản sao trên OPPO.
- Đăng xuất riêng phiên giả lập: ứng dụng trở về màn đăng nhập, cache native từ một tệp về trống. Phiên OPPO được giữ nguyên. APK cuối cũng đã cài lại thành công lên giả lập, không cần Metro.

## Giới hạn

Chưa thử file 20 MiB thật/provider cloud và nhiều ứng dụng đọc; chưa iOS. Bản sao đã lưu/ứng dụng khác đã đọc không bị thu hồi khi khóa tài khoản. Kết quả tạo yêu cầu không rõ vì mất mạng cần kiểm tra danh sách trước khi gửi lại. File chưa gắn có thể cần dọn server khi hết phiên.

QR/OT/network thiết bị thật, ca cá nhân, giải trình punches/thử tải phân trang, full legacy/load/production và hai repo chuyên đề vẫn còn TODO. Đọc [hợp đồng tệp](../docs/MOBILE_ATTACHMENTS.md), [hướng dẫn đầu mối](../docs/PROJECT_GUIDE.md) và [TODO](../TODO.md).

Ảnh và ID bằng chứng gắn với tài khoản thực hành giữ local ngoài Git; báo cáo công khai chỉ mô tả ca thử bằng fixture.

## Bổ sung: phân trang lịch sử chấm công

- GET /workplace/attendance/punches nhận kỳ/page/size, áp lại cùng phạm vi cho rows và total; trả tối đa 100/trang, mặc định 20. Bỏ giới hạn tổng 1.000 lượt/kỳ; thứ tự recorded_at DESC, id DESC. Overview giữ punches trang đầu và thêm punchPage. Không đổi timestamp, QR, lịch hay phép tính công; không cần migration.
- Web đổi riêng lịch sử để giữ phần còn lại của màn; bỏ phản hồi khi rời màn/đổi phiên, khóa chuyển trang khi đang tải, lỗi giữ trang đã xác nhận. Android có lịch sử theo tháng, về trang đầu khi đổi kỳ, bỏ phản hồi tháng cũ và thử lại sau lỗi.
- PostgreSQL: 1.116 lượt fixture đọc đủ 12 trang size 100, không trùng, thứ tự cùng timestamp ổn định. Nhân viên chỉ thấy 124 lượt của mình; ngoài phòng và Admin kỹ thuật không thấy rows hoặc total; TIME_REVIEW có phạm vi chuyên trách. Thử page/size cực trị, tháng sai 422, page sai kiểu 400, chưa đăng nhập 401.
- Bộ backend chọn lọc chạy lại: 152 tests, 58 PostgreSQL, không lỗi hoặc bỏ qua; Maven package đạt. Lần đầu một kỳ vọng test dùng 400 thay vì hợp đồng lỗi nghiệp vụ 422; đã sửa test và chạy lại toàn bộ bộ chọn lọc thành công. Không phải toàn bộ legacy/Testcontainers hoặc thử tải.
- Mobile cuối: 98 suites/852 tests, TypeScript đạt; lint 3 file đợt này 0 errors/4 warnings. Bộ trước cho tệp vẫn là 848 tests/lint 8 file 24 warnings. Web thêm 3 tests pager (phản hồi trễ, bấm liên tiếp, lỗi/thử lại) cùng 5 tests phiên hiện có.
- APK cuối ARM64+x86_64 build thành công 59s/151 tasks. Đã cập nhật runtime local và cài trên OPPO/giả lập, giữ dữ liệu ứng dụng. API runtime đối chiếu trang và overview của hai nhân viên khác phòng đạt; không ghi/sửa lượt chấm công. Web đổi tháng thấy lượt IN cũ, đúng tên điểm và hai nút biên trang bị khóa. Người dùng xác nhận OPPO thấy lượt quét và tên điểm trong lịch sử tháng. Chưa thử chuyển nhiều trang thực tế trên OPPO; phạm vi nhiều trang là ca PostgreSQL và tests pager.

Các trang là dữ liệu sống; dữ liệu mới có thể dịch vị trí giữa hai lần tải, chưa phải xuất snapshot kế toán. Hiệu năng/trang sâu, giải trình từng punch và ca cá nhân còn TODO.
