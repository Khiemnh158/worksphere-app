# Liên kết kích hoạt/khôi phục Android

Android nhận đúng worksphere://reset/<token> hoặc worksphere://activate/<token>, token base64url43 ký tự do máy chủ cấp. URI sai scheme/host/path/query/fragment bị bỏ qua. Không chấp nhận URL tùy ý để điều hướng màn nghiệp vụ.

## Sử dụng local

1. Xin thư mới qua Quên mật khẩu hoặc cấp tài khoản PENDING. Thư vẫn nằm trong hộp thư thử local; không gửi email thật.
2. Mở liên kết web trong thư bằng trình duyệt trên điện thoại có thể truy cập backend/web. Trang hiện nút **Mở trong ứng dụng Android** khi token đúng định dạng.
3. Chạm nút để Android mở biểu mẫu đúng loại. Người dùng tự nhập thông tin/mật khẩu và xác nhận; mở liên kết không gửi API đổi credential hoặc tự đăng nhập.
4. Nếu đang đăng nhập, ứng dụng giữ phiên và bỏ qua liên kết. Chủ tài khoản chủ động đăng xuất rồi mở lại nếu cần. Khôi phục phiên trong lúc khởi động cũng không bị liên kết chen ngang.

Thư local mặc định trỏ web trên máy tính; điện thoại dùng USB cần reverse thêm cổng web18110 và mở http://127.0.0.1:18110 trong trình duyệt điện thoại nếu thử nút này. Script Android hiện reverse API18120; không coi cổng web đã tự có trên điện thoại. Có thể tiếp tục dán liên kết web vào biểu mẫu như trước.

## Phạm vi và bảo mật

Token chỉ ở bộ nhớ/navigation params, không lưu AsyncStorage hoặc log chủ động; chưa có navigation state persistence. Máy chủ kiểm purpose/hạn/một lần/trạng thái tài khoản khi người dùng xác nhận. RESET15 phút, ACTIVATE24 giờ theo hợp đồng hiện hành; đúng định dạng không đồng nghĩa token hợp lệ.

Custom scheme phù hợp demo local, chưa phải Android App Links đã xác minh tên miền; ứng dụng khác có thể đăng ký cùng scheme. Bản public cần tên miền HTTPS và assetlinks.json do đơn vị sở hữu miền cấu hình, xác minh/kiểm tra lại trước khi sử dụng thật. iOS Universal Links chưa triển khai. Khi chưa cài app, dùng biểu mẫu web hoặc cài APK trước; không giả định trình duyệt nào cũng mở được scheme.

## Kiểm chứng

31/10: parser và lifecycle có test warm/cold, bootstrap, khôi phục phiên, late initial URL, cleanup và URI sai; test navigator mở activation đúng token mà không POST. TypeScript và toàn bộ mobile95 suites/830 tests đạt. Web đã xác minh nút bằng token fixture không có giá trị. Build/cài/kiểm tra thiết bị ghi riêng trong báo cáo đợt này; không dùng Jest thay cho nghiệm thu Android thật.
