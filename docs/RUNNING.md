# Chạy mobile hiện hành

Đọc MOBILE_RUNNING.md cho Android nối cùng backend web 18120. Hướng dẫn bên dưới giữ làm lịch sử; không dùng launcher baseline 18080 cho client mới.

# Chạy web hiện hành

Đọc WEB_RUNNING.md cho cổng web/API mới. Tên JAR trong repo này hiện là target/worksphere-web.jar. Phần dưới là hướng dẫn nguồn kế thừa; launcher mobile trong workspace dùng checkout gốc riêng, không dùng để nhận web mới đã hoạt động.


# Chạy source hiện có

## Toolchain
- Backend mục tiêu Java 21, Maven Wrapper, PostgreSQL và Flyway.
- Mobile theo `mobile/.node-version`/package.json: Node 24.x phù hợp range, không dùng yêu cầu Node 20 cũ trong README lịch sử.
- Android SDK/NDK theo Gradle hiện hành; bản đã kiểm tra là debug x86_64 trên giả lập. iOS/release ARM chưa xác minh.

## Backend
1. Tạo PostgreSQL local riêng và tài khoản DB; không commit dữ liệu hoặc mật khẩu.
2. Cấp `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `WORKSPHERE_STORAGE_PATH`, `WORKSPHERE_JWT_SECRET` theo cấu hình binding đang dùng. Nếu dùng biến JWT khác, phải kiểm tra mapping trước, không chỉ copy .env.example và giả định Spring tự đọc.
3. Profile dev hiện có giá trị mặc định mẫu; phải override datasource và `worksphere.jwt.secret` bằng cấu hình riêng, ví dụ biến môi trường theo Spring relaxed binding.
4. Trong `backend/`: Windows `mvnw.cmd spring-boot:run`; Linux/macOS `./mvnw spring-boot:run`. Chọn server.port chưa bị dùng; profile demo trước dùng 18080.
5. Seed dev tắt mặc định; nếu bật `WORKSPHERE_DEV_E2E_USER_ENABLED`, cung cấp login/username/email/password riêng qua biến môi trường được khai báo trong application-dev.yml. Không public seed này.

## Mobile
Trong `mobile/`: `npm ci`, `npm run typecheck`, `npm test -- --runInBand`. Khởi động Metro bằng `npm start`; debug Android dùng `npm run android` với Gradle property API URL trỏ backend đúng cổng. Android Emulator truy cập host qua `10.0.2.2`; mặc định source 8080, phải điều chỉnh khi backend dùng 18080.

Không có Dockerfile/Compose đã triển khai trong snapshot này. Xem repo deployment cho kế hoạch, không chạy những file TODO như cấu hình thật. Cache/tool portable và launcher có secrets trên máy cũ không được đưa vào GitHub.
