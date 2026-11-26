# Kiểm tra Swagger local ngày 26/11/2026

## Lỗi và bản sửa

Trước sửa, `/swagger-ui/index.html` trả 200 nhưng `/v3/api-docs` trả 500.
Log có `NoSuchMethodError: ControllerAdviceBean.<init>(Object)` từ springdoc 2.6.0.
Cặp Spring Boot 4.1.1 / springdoc 2.6.0 đã có trong baseline nhập ngày 29/10.

Đổi riêng springdoc sang 3.1.1 theo dòng tương thích Spring Boot 4.1, giữ Spring Boot
4.1.1 và Java 21. `OpenApiConfig` khai báo JWT bearer cho Swagger và bỏ yêu cầu
access token trên login, refresh, activate, forgot-password và reset-password.
Các cấu hình này mô tả API; SecurityConfig và service tiếp tục quyết định quyền.

Nguồn đối chiếu: [ma trận chính thức](https://springdoc.org/#what-is-the-compatibility-matrix-of-springdoc-openapi-with-spring-boot)
và [bản phát hành 3.1.1](https://github.com/springdoc/springdoc-openapi/releases/tag/v3.1.1).

## Kiểm chứng

- JDK build 21.0.13; class major 65; JAR chứa springdoc 3.1.1, không còn 2.6.0.
- Maven package đạt với 17 tests, 0 failure/error/skip: OpenApiPostgresTest,
  AttendanceRulesTest, TaskWorkflowTest, TwoFactorServiceTest.
- OpenApiPostgresTest dùng biến môi trường `WORKSPHERE_AUTHZ_TEST_JDBC_URL`,
  `WORKSPHERE_AUTHZ_TEST_DB_USER`, `WORKSPHERE_AUTHZ_TEST_DB_PASSWORD` với database
  thử riêng. Không trỏ biến này vào database demo. Hai ca xác nhận tạo schema cùng
  GlobalExceptionHandler, có bearer auth và business API vẫn trả 401 khi chưa đăng nhập.
- Bản thử cổng 18121 / database riêng: 56 kiểm tra đạt. Có tạo công việc và luồng
  ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED; người khác phòng không đọc được việc.
- Bản local chính cổng 18120: 45 kiểm tra đạt. Đăng nhập, context và danh sách việc
  của 11 tài khoản mẫu đạt; mật khẩu sai bị từ chối; tài khoản thường không quản trị
  điểm chấm công; Admin kỹ thuật không nhận dữ liệu lương người khác.
- `/v3/api-docs`, `/v3/api-docs/swagger-config`, Swagger UI và health đều trả 200.
  Schema có 117 đường dẫn và 150 thao tác HTTP. UI trên Edge hiển thị WorkSphere API
  và nút Authorize, không còn Failed to load API definition.

## Trình bày

Bật ứng dụng local rồi mở `http://127.0.0.1:18120/swagger-ui/index.html`.
Ctrl+P trong VS Code mở Controller để đọc source; Swagger hoặc Network gửi và quan sát
yêu cầu HTTP thật. Đăng nhập qua POST `/api/v1/auth/login`, lấy `data.accessToken`
vào Authorize, rồi thử GET `/api/v1/workplace/work` bằng tài khoản demo đã được cấp.
Không đưa token hoặc mật khẩu lên ảnh hoặc GitHub.

## Giới hạn

Các con số trên là kiểm tra tập trung và smoke local ngày 26/11, không thay kết quả
kiểm thử toàn bộ hoặc Jenkins trước đó. Môi trường triển khai Docker/Jenkins chưa
được build lại trong lượt sửa này. APK không đổi; web và mobile vẫn dùng API local
cũ ở cổng 18120. Source được đưa vào bản cập nhật nhánh main; xem
[nội dung bàn giao và kiểm chứng bổ sung](UPDATE_2026-11-26.md).

Nginx của web Docker có thêm tuyến `/swagger-ui/`, `/swagger-ui.html` và
`/v3/api-docs` đến backend. Sau khi build lại, mở Swagger qua cổng web Docker
ở `/swagger-ui/index.html`. Kiểm tra cổng reverse proxy trong Docker được ghi riêng
tại repo triển khai, không suy ra từ lần kiểm tra API local ở trên.
