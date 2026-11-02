# Nghiệm thu MVP Lập trình nâng cao - 02/11/2026

## Phạm vi được chốt

Người dùng xác nhận chưa có yêu cầu giảng viên bổ sung ngoài Java/Spring Boot, JDK 21 và sản phẩm chạy được. Chốt mô hình SME một công ty, lịch giờ hành chính chung; web điều phối/quản trị, Android thao tác nhân viên dùng chung API. Đây là mốc hoàn tất phạm vi phần mềm đã thống nhất, không phải bảo đảm điểm số hoặc chứng nhận production. Thuế/BHXH/thực lĩnh, ca đêm, vân tay, SSO không cần mở rộng cho mốc này.

Source đã kiểm tra: `1d51b0793427d839bf6cfbe7bb942bc794929fb9`. Tài liệu bổ sung sau commit này không thay đổi nghiệp vụ. Nhánh `feat/authorization-foundation`; PR vẫn draft, chưa merge main.

## Kết quả

| Cổng kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| Backend JDK 21.0.13+9 | 407 tests, 0 fail/error/skip; 41 suites; Maven exit 0; package đạt; class major 65 | Có cảnh báo kết thúc fork Surefire sau System.exit(0); không phải kiểm chứng tải |
| PostgreSQL | Docker/Testcontainers đã chạy; cả 59 ca opt-in authorization/workplace được bật; Flyway V001-V027 | Không dùng DB thực hành để test xóa dữ liệu |
| Web Node 24 | 8/8 tests phiên và phân trang đạt | Không thay thế nghiệm thu UI mọi trình duyệt |
| Mobile | TypeScript đạt; 98 suites/852 tests đạt, 0 fail/skip, 42.168 giây | Còn act warnings kế thừa |
| APK thường | JDK 21, localDemo ARM64+x86_64; build 2m12s, bundle có sẵn, API 18120; cài cập nhật OPPO và người dùng xác nhận phiên thường vẫn vào được | Debug-signed, vẫn cần backend local/USB; không phải bản phát hành store |
| Clone sạch | Maven Wrapper/JDK 21 build/chạy, DB mới; login/logout, thư reset đúng origin, reuse/Stop/restart đạt | Clone local cùng máy, có cache dependencies; chưa máy thứ hai |
| OPPO | Người dùng xác nhận camera quét đủ IN/OUT/OT_IN/OT_OUT; máy chủ lưu đủ, web hiển thị khớp | Môi trường riêng, đồng hồ mô phỏng; không phải công thật |
| OS links Android | Kích hoạt → đăng nhập, reset → đăng nhập; người dùng thao tác, máy chủ ghi 2 sự kiện và 2 token đã dùng | Custom scheme/local mailbox; chưa HTTPS App Links/iOS |

## Tình huống QR đã nghiệm thu

Ngày mô phỏng 06/05/2030, ca 08:00-17:00, nghỉ 11:30-12:30. Bốn lượt camera thật: vào 08:10; ra 17:30; bắt đầu tăng ca 18:00; kết thúc tăng ca 18:45. Đơn tăng ca 18:00-19:00 đã duyệt trước. Kết quả: công thường 470 phút, muộn 10 phút; ra muộn không tự cộng OT. Chỉ xác nhận 45 phút tăng ca thực tế; yêu cầu xác nhận 60 phút bị từ chối. Người chấm không tự duyệt; cảnh báo khác mạng phải được người duyệt xác minh rõ trước khi duyệt công. Không tự trừ tiền/phạt hoặc tự chuyển tiền.

QR xoay vòng thuộc điểm chấm công, hạn 40 giây, web đổi sau 30 giây. Đặt điểm ở văn phòng được; không bắt buộc lễ tân. Người quản lý điểm có quyền mới mở được màn phát QR; người chấm phải đăng nhập. Máy chủ quyết định loại thao tác, lịch, thời gian, trùng lượt và kỳ khóa. Mỗi nhân viên không cần một QR riêng; danh tính lấy từ phiên xác thực. IP/QR là tín hiệu đối chiếu, không chứng minh hiện diện tuyệt đối, không chặn hoàn toàn ảnh chụp/chia sẻ/proxy.

Ứng dụng WorkSphere Test, API/DB/đồng hồ mô phỏng và APK thường được tách riêng. Harness đổi giờ nằm ngoài source/JAR sản phẩm, giới hạn DB thử và loopback; không được đưa vào bản triển khai. Kiểm tra trực tiếp phần camera/luồng dùng APK thử; thay đổi sau đó chỉ sửa hướng dẫn mật khẩu và chặn Admin kỹ thuật gắn phòng nghiệp vụ. Các nhánh mã hết hạn/trùng/OUT thiếu IN/mất mạng có tests liên quan; chưa nghiệm thu toàn bộ bằng camera thật từng nhánh.

## Sửa trong đợt này

- API tạo tài khoản từ chối Admin kỹ thuật kèm phòng nghiệp vụ (422), đồng nhất API sửa; không tạo user nửa chừng. Regression test kiểm cả nhánh từ chối và tạo Admin PENDING không thuộc phòng.
- Sửa fixtures legacy theo hợp đồng hiện hành: auth trả 401, recovery dùng token do luồng email mới phát hành, cập nhật project cần membership, direct service call cần SecurityContext và cleanup FK notices. Không hạ kiểm tra quyền để ép pass. Reset test còn kiểm mật khẩu cũ không khớp, access/refresh cũ bị thu hồi và token không dùng lại.
- Sửa hướng dẫn/placeholder/thông báo policy mật khẩu mobile theo mức tối thiểu 12 ký tự, tối đa 72 byte UTF-8. Đăng nhập vẫn cho nhập mật khẩu cũ theo hợp đồng; không tự đổi mật khẩu người dùng.

## Cách lặp lại kiểm thử

Đọc [chạy clone](../docs/FRESH_CLONE_RUNNING.md). Backend: JDK 21, Docker engine hoạt động, PostgreSQL local riêng; đặt WORKSPHERE_AUTHZ_TEST_JDBC_URL/DB_USER/DB_PASSWORD tới DB thử có tên được guard chấp nhận, rồi chạy `./mvnw.cmd clean test` trong backend. Hai suite opt-in có thể xóa dữ liệu fixture; tuyệt đối không trỏ DB thực hành/dữ liệu thật. Không cấp env thì 59 ca này bị skip; không được báo như kết quả của đợt này.

Web: `node --experimental-vm-modules --test scripts/test-web-session.mjs scripts/test-web-punch-history.mjs`. Mobile: `npm ci`, `npm run typecheck`, `npm test -- --runInBand`. Android theo hướng dẫn chạy, không cần copy DB/mật khẩu/APK từ máy tác giả. Các phiên bản/hashes và kết quả máy đọc tại [JSON](COURSEWORK_ACCEPTANCE_2026-11-02.json). Chạy `package -DskipTests` chỉ đóng gói, không chứng minh tests đạt.

## Ranh giới bàn giao

Hoàn tất mốc phần mềm MVP; các trường hợp tải lớn, file cloud/20 MiB, máy thứ hai, ca riêng, push/iOS và production là giới hạn hoặc mở rộng có ghi nhận. Chưa tự nhận đã audit hết logic của mọi module legacy chỉ vì suite đạt. Cảnh báo lifecycle trong runner cần dọn nếu mở rộng CI, không sửa cấu hình để che cảnh báo. Môn Triển khai phần mềm tiếp tục có backlog riêng. Báo cáo/slide nộp cần bổ sung mẫu giảng viên, tên/MSSV và phân công thực tế, không bịa đóng góp.

Đầu mối đọc và kịch bản trình bày: [PROJECT_GUIDE](../docs/PROJECT_GUIDE.md). Backlog hiện hành: [TODO](../TODO.md).
