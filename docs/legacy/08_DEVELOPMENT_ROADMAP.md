# LỘ TRÌNH PHÁT TRIỂN DỰ ÁN WORKSPHERE

## 1. Mục đích

Tài liệu này xác định thứ tự phát triển dự án WorkSphere từ khi chuẩn bị repository đến khi hoàn thành mobile, backend, kiểm thử, triển khai, báo cáo và slide.

Mục tiêu:

- Chia dự án thành các giai đoạn nhỏ có thể kiểm soát.
- Không tạo toàn bộ source code trong một lần.
- Mỗi giai đoạn phải có đầu ra và điều kiện hoàn thành rõ ràng.
- Hạn chế lỗi dây chuyền giữa database, backend và mobile.
- Giúp AI Agent biết chính xác phần nào được phép thực hiện.
- Tạo bằng chứng cho bốn môn học.
- Cho phép phát hiện và sửa lỗi trước khi sang giai đoạn tiếp theo.

Không bắt đầu giai đoạn mới nếu giai đoạn trước chưa đạt điều kiện hoàn thành.

---

## 2. Nguyên tắc phát triển

### 2.1. Phát triển theo chiều dọc

Mỗi chức năng được hoàn thiện theo chuỗi:

```text
Tài liệu
→ Database Migration
→ Backend Domain
→ Backend API
→ Backend Test
→ Mobile API Service
→ Mobile Screen
→ Mobile Test
→ Tích hợp
→ Bằng chứng
```

Không làm toàn bộ database trước rồi để trống backend và mobile trong thời gian dài.

Không tạo hàng loạt màn hình mobile không có API hoạt động.

### 2.2. Mỗi giai đoạn phải chạy được

Sau mỗi giai đoạn:

- Source code phải build được.
- Test liên quan phải chạy được.
- Không được để lỗi compile.
- Không được để migration lỗi.
- Không được để dependency thừa.
- Không được lưu secret trong source code.
- Tài liệu phải được cập nhật.
- Phải ghi lại bằng chứng thực hiện.

### 2.3. Ưu tiên chức năng cốt lõi

Thứ tự ưu tiên:

```text
P0: Bắt buộc để hệ thống hoạt động
P1: Bắt buộc để hoàn thiện MVP
P2: Nâng cao, thực hiện sau MVP
P3: Hướng phát triển
```

MVP, viết tắt của Minimum Viable Product, là phiên bản nhỏ nhất nhưng có thể chạy, trình diễn và giải quyết được bài toán chính.

### 2.4. Không thêm chức năng tự phát

Chức năng mới chỉ được triển khai khi:

1. Có trong phạm vi dự án.
2. Có trong tài liệu nghiệp vụ.
3. Có thiết kế database nếu cần.
4. Có API Contract.
5. Có vị trí trong roadmap.
6. Có tiêu chí kiểm thử.
7. Có quyết định cập nhật phạm vi nếu là chức năng mới.

---

## 3. Tổng quan các giai đoạn

```text
Giai đoạn 0: Hoàn thiện tài liệu nền
Giai đoạn 1: Chuẩn bị repository và môi trường
Giai đoạn 2: Khởi tạo backend
Giai đoạn 3: Khởi tạo database và migration
Giai đoạn 4: Authentication và Authorization
Giai đoạn 5: Organization và User Management
Giai đoạn 6: Project Module
Giai đoạn 7: Task Module
Giai đoạn 8: File Module
Giai đoạn 9: Service Request Module
Giai đoạn 10: Asset Module
Giai đoạn 11: Notification và Dashboard
Giai đoạn 12: Khởi tạo ứng dụng mobile
Giai đoạn 13: Mobile Authentication
Giai đoạn 14: Mobile Project và Task
Giai đoạn 15: Mobile Service Request và Asset
Giai đoạn 16: Tích hợp và kiểm thử hệ thống
Giai đoạn 17: Docker và môi trường local
Giai đoạn 18: CI/CD
Giai đoạn 19: Logging, Monitoring, Backup và Rollback
Giai đoạn 20: Hoàn thiện báo cáo và slide
Giai đoạn 21: Nghiệm thu và đóng dự án
```

---

## 4. GIAI ĐOẠN 0: HOÀN THIỆN TÀI LIỆU NỀN

### 4.1. Mục tiêu

Khóa các quyết định quan trọng trước khi sinh mã nguồn.

### 4.2. Tài liệu bắt buộc

- `01_PROJECT_SCOPE.md`
- `02_USER_ROLES_AND_WORKFLOWS.md`
- `03_MOBILE_SCREEN_MAP.md`
- `04_SYSTEM_ARCHITECTURE.md`
- `05_DATABASE_DESIGN.md`
- `06_API_CONTRACT.md`
- `07_FOUR_COURSE_MATRIX.md`
- `08_DEVELOPMENT_ROADMAP.md`

Tài liệu bổ sung sẽ tạo sau:

- Coding Standards.
- Testing Strategy.
- Git Workflow.
- Deployment Guide.
- Agent Instructions.

### 4.3. Điều kiện hoàn thành

- Tên đề tài đã được đăng ký.
- Phạm vi MVP đã được xác định.
- Vai trò người dùng đã được xác định.
- Workflow trạng thái đã được xác định.
- Màn hình mobile đã được xác định.
- Kiến trúc đã được khóa.
- Database đã được thiết kế.
- API Contract đã được thiết kế.
- Ma trận bốn môn đã hoàn thành.
- Không còn mâu thuẫn lớn giữa các tài liệu.

---

## 5. GIAI ĐOẠN 1: CHUẨN BỊ REPOSITORY VÀ MÔI TRƯỜNG

### 5.1. Mục tiêu

Tạo cấu trúc monorepo chuẩn cho WorkSphere.

### 5.2. Công việc

- Khởi tạo Git repository.
- Tạo `.gitignore`.
- Tạo `README.md`.
- Tạo thư mục `backend`.
- Tạo thư mục `mobile`.
- Tạo thư mục `infrastructure`.
- Tạo thư mục `scripts`.
- Tạo `.github/workflows`.
- Tạo `.env.example`.
- Xác định quy tắc commit.
- Xác định branch strategy.
- Kiểm tra phiên bản Java, Node.js, npm và Docker.

Cấu trúc:

```text
WorkSphere/
├── docs/
├── backend/
├── mobile/
├── infrastructure/
├── scripts/
├── .github/
│   └── workflows/
├── .gitignore
├── .env.example
├── docker-compose.yml
├── README.md
└── LICENSE
```

### 5.3. Không thực hiện

- Không sinh toàn bộ backend.
- Không sinh toàn bộ mobile.
- Không cài dependency không cần thiết.
- Không commit file `.env` thật.
- Không commit secret.

### 5.4. Điều kiện hoàn thành

- Git hoạt động.
- Cấu trúc repository đúng tài liệu.
- `.gitignore` chặn secret và file build.
- README mô tả được cách mở project.
- Không có secret trong repository.
- Commit đầu tiên được tạo thành công.

---

## 6. GIAI ĐOẠN 2: KHỞI TẠO BACKEND

### 6.1. Mục tiêu

Tạo ứng dụng Spring Boot tối thiểu có thể build và chạy.

### 6.2. Dependency dự kiến

Chỉ cài dependency cần thiết:

- Spring Web.
- Spring Validation.
- Spring Data JPA.
- Spring Security.
- PostgreSQL Driver.
- Flyway.
- OpenAPI hoặc Swagger.
- Spring Boot Actuator.
- Test dependency.
- JWT library đã được kiểm tra.
- Mapping library nếu thật sự cần.

Trước khi cài dependency phải kiểm tra:

- Project đã có dependency cùng chức năng chưa.
- Dependency còn được duy trì không.
- Phiên bản có tương thích không.
- Giấy phép có phù hợp không.
- Tài liệu chính thức có đầy đủ không.

### 6.3. Công việc

- Tạo project Spring Boot.
- Thiết lập package `com.worksphere`.
- Tạo cấu hình `dev`, `test`, `prod`.
- Tạo response chuẩn.
- Tạo exception chuẩn.
- Tạo trace ID.
- Tạo health endpoint.
- Tạo OpenAPI cơ bản.
- Tạo test khởi động ứng dụng.

### 6.4. Điều kiện hoàn thành

- Backend build thành công.
- Backend chạy thành công.
- Health endpoint trả kết quả.
- Swagger mở được.
- Test khởi động vượt qua.
- Không kết nối database production.
- Không có secret hard-code.

---

## 7. GIAI ĐOẠN 3: DATABASE VÀ MIGRATION

### 7.1. Mục tiêu

Tạo PostgreSQL local và các migration nền.

### 7.2. Công việc

- Tạo PostgreSQL bằng Docker Compose.
- Cấu hình datasource qua environment variable.
- Cấu hình Flyway.
- Tạo migration Identity.
- Tạo migration Organization.
- Tạo migration Project.
- Tạo migration File.
- Tạo migration Task.
- Tạo migration Asset.
- Tạo migration Service Request.
- Tạo migration Notification.
- Tạo migration Audit.
- Tạo index và constraint.
- Seed Role và Permission.

File Module phải được tạo trước Task Module vì `task_attachments.file_id` tham chiếu bảng `stored_files`.

Thứ tự migration chi tiết phải tuân theo 05_DATABASE_DESIGN.md:

```text
V001 Identity
V002 Organization
V003 Project
V004 File
V005 Task
V006 Asset
V007 Service Request
V008 Notification
V009 Audit
V010 Deferred Foreign Keys, Indexes and Constraints
V011 Seed
```

### 7.3. Quy tắc

- Không dùng `ddl-auto=create` trên môi trường dùng chung.
- Không dùng `ddl-auto=update` như cơ chế migration.
- Không sửa migration đã áp dụng trên môi trường dùng chung.
- Không hard-code mật khẩu quản trị.
- Không seed dữ liệu cá nhân thật.
- Mỗi thay đổi schema phải có migration mới.

### 7.4. Kiểm thử

- Migration chạy trên database trống.
- Migration chạy lại không lỗi.
- Foreign Key hoạt động.
- Unique constraint hoạt động.
- Check constraint hoạt động.
- Index tồn tại.
- Seed Role và Permission đúng.

### 7.5. Điều kiện hoàn thành

- Database khởi động được.
- Tất cả migration thành công.
- Backend kết nối database thành công.
- Không có lỗi schema validation.
- Test repository nền hoạt động.

---

## 8. GIAI ĐOẠN 4: AUTHENTICATION VÀ AUTHORIZATION

### 8.1. Mức ưu tiên

```text
P0
```

### 8.2. Mục tiêu

Hoàn thiện đăng nhập, refresh token, đăng xuất và phân quyền.

### 8.3. Backend

- User Entity.
- Role Entity.
- Permission Entity.
- User Role.
- Role Permission.
- Password hashing.
- Login.
- Access token.
- Refresh token rotation.
- Logout.
- Logout all.
- Account status.
- Security filter.
- Permission checker.
- Current user.
- Change password.
- Forgot password ở mức phù hợp.
- Audit đăng nhập.

### 8.4. API

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /me`
- `PUT /me`
- `PUT /me/password`

### 8.5. Kiểm thử

- Đăng nhập đúng.
- Sai mật khẩu.
- Tài khoản bị khoá.
- Access token hết hạn.
- Refresh token hợp lệ.
- Refresh token hết hạn.
- Refresh token đã thu hồi.
- Permission hợp lệ.
- Permission bị từ chối.
- Đổi mật khẩu.
- Đăng xuất.
- Đăng xuất tất cả thiết bị.

### 8.6. Điều kiện hoàn thành

- API đăng nhập hoạt động.
- Token không xuất hiện trong log.
- Refresh token chỉ lưu hash.
- Endpoint bảo vệ từ chối người không có quyền.
- Swagger mô tả đúng.
- Test Security vượt qua.

---

## 9. GIAI ĐOẠN 5: ORGANIZATION VÀ USER MANAGEMENT

### 9.1. Mức ưu tiên

```text
P1
```

### 9.2. Backend

- Department.
- Team.
- Team Member.
- User Management.
- Lock và Unlock User.
- Gán Role.
- Tìm kiếm người dùng.
- Phân trang.
- Soft Delete phù hợp.

### 9.3. API

- Danh sách phòng ban.
- Tạo và cập nhật phòng ban.
- Danh sách người dùng.
- Tạo người dùng.
- Cập nhật người dùng.
- Khoá và mở khoá.
- Danh sách vai trò.
- Gán vai trò.

### 9.4. Kiểm thử

- Không tạo trùng username.
- Không tạo trùng email.
- Không tạo vòng lặp phòng ban.
- Người dùng bị khoá không đăng nhập.
- Người không có quyền không quản lý người dùng.

### 9.5. Điều kiện hoàn thành

- Quản trị viên quản lý được người dùng.
- Phòng ban hoạt động.
- API hỗ trợ tìm kiếm và phân trang.
- Test quyền hoạt động.

---

## 10. GIAI ĐOẠN 6: PROJECT MODULE

### 10.1. Mức ưu tiên

```text
P0
```

### 10.2. Backend

- Project Entity.
- Project Member.
- Milestone.
- Project Status History.
- Project Application Service.
- Project Permission.
- Project Workflow.
- Project Progress.
- Optimistic Locking.

### 10.3. API

- Danh sách dự án.
- Tạo dự án.
- Chi tiết dự án.
- Cập nhật dự án.
- Chuyển trạng thái.
- Danh sách thành viên.
- Thêm thành viên.
- Đổi vai trò thành viên.
- Xoá thành viên.
- Tạo milestone.
- Danh sách milestone.
- Dashboard dự án.

### 10.4. Kiểm thử

- Tạo dự án.
- Trùng mã dự án.
- Ngày dự án không hợp lệ.
- Thêm thành viên.
- Thêm trùng thành viên.
- Người dùng không hoạt động.
- Chuyển trạng thái hợp lệ.
- Chuyển trạng thái không hợp lệ.
- Optimistic Locking.
- Người ngoài dự án không xem dữ liệu.

### 10.5. Điều kiện hoàn thành

- Project API hoạt động.
- Workflow đúng tài liệu.
- Quyền truy cập đúng.
- Lịch sử trạng thái được ghi.
- Test vượt qua.
- Swagger cập nhật.

---

## 11. GIAI ĐOẠN 7: TASK MODULE

### 11.1. Mức ưu tiên

```text
P0
```

### 11.2. Backend

- Task.
- Subtask.
- Task Assignment.
- Task Comment.
- Task Attachment chỉ được tích hợp sau khi File Module đạt Definition of Done.

Quy tắc dependency:

- Giai đoạn 7 triển khai Task Core trước, gồm Task, Subtask, Assignment, Comment, Workflow, Progress và Status History.
- Không tạo `task_attachments` trong source hoặc migration của Task trước khi bảng `stored_files` và File API đã sẵn sàng.
- Không tự tạo cơ chế upload riêng trong Task Module.
- Không lưu file nhị phân trực tiếp trong database.
- Task Attachment ở trạng thái `BLOCKED` cho đến khi Giai đoạn 8 hoàn thành.
- Sau khi File Module hoàn thành, Task Module được mở lại phạm vi tích hợp attachment.
- Việc trì hoãn Task Attachment không chặn hoàn thành Task Core.

Điều kiện mở khoá Task Attachment:

```text
stored_files đã tồn tại
→ File Upload API đã được kiểm thử
→ File validation hoạt động
→ File permission hoạt động
→ Migration File chạy thành công
→ mới tích hợp task_attachments
```

- Task Status History.
- Priority.
- Progress.
- Overdue calculation.
- Workflow validation.
- Optimistic Locking.

### 11.3. API

- Danh sách task.
- Tạo task.
- Chi tiết task.
- Cập nhật task.
- Xoá hoặc huỷ task.
- Cập nhật trạng thái.
- Cập nhật tiến độ.
- Phân công.
- Gỡ phân công.
- Danh sách subtask.
- Tạo subtask.
- Bình luận.
- Chỉnh sửa bình luận.
- Xoá bình luận.

### 11.4. Kiểm thử

- Tạo task trong dự án hoạt động.
- Không tạo task trong dự án hoàn thành.
- Người được giao phải là thành viên dự án.
- Task con phải cùng dự án.
- Không tạo vòng lặp task.
- Workflow trạng thái.
- Task hoàn thành có progress 100.
- Task quá hạn.
- Optimistic Locking.
- Permission.
- Transaction rollback.

### 11.5. Điều kiện hoàn thành

- Task API hoạt động.
- Workflow trạng thái đúng.
- Subtask hoạt động.
- Phân công đúng.
- Bình luận hoạt động.
- Test vượt qua.

---

## 12. GIAI ĐOẠN 8: FILE MODULE

### 12.1. Mức ưu tiên

```text
P0 - Nền tảng bắt buộc cho Attachment
```

Vai trò trong Roadmap:

- File Module là dependency nền tảng của Task Attachment và Service Request Attachment.
- File Module phải hoàn thành trước khi tích hợp attachment vào bất kỳ module nghiệp vụ nào.
- File Module không bị thay thế bằng logic upload riêng trong Task hoặc Service Request.
- File Module có thể được triển khai sau Task Core, nhưng phải hoàn thành trước Task Attachment và Service Request Attachment.

Điều kiện đầu vào:

- Database Design đã khóa bảng `stored_files`.
- Migration File đứng trước migration Task.
- API Contract cho upload, download và metadata đã được định nghĩa.
- Quy tắc loại file, dung lượng, bảo mật và quyền truy cập đã rõ.

Đầu ra bắt buộc:

- Migration tạo `stored_files` chạy thành công.
- Upload API hoạt động.
- Download API kiểm tra quyền.
- Metadata file được lưu đúng.
- Validation extension, MIME type và kích thước hoạt động.
- Không log nội dung file hoặc secret.
- Unit Test và Integration Test liên quan vượt qua.
- Có bằng chứng upload và download thật.

Sau khi File Module đạt Definition of Done:

```text
Mở khoá Task Attachment
→ tích hợp task_attachments
→ kiểm thử Task Attachment
→ mở khoá Service Request Attachment
→ tích hợp service_attachments
→ kiểm thử Service Request Attachment
```

### 12.2. Backend

- Stored File.
- File Storage Interface.
- Local File Storage cho môi trường phát triển.
- Upload file.
- Download file.
- Xoá file chưa liên kết.
- File validation.
- Checksum.
- Permission check.

### 12.3. Kiểm thử

- Upload ảnh.
- Upload PDF.
- File rỗng.
- File quá lớn.
- Loại file không hỗ trợ.
- Tên file có đường dẫn nguy hiểm.
- Download khi có quyền.
- Download khi không có quyền.
- Không xoá file đang được liên kết.

### 12.4. Điều kiện hoàn thành

- Upload và download hoạt động.
- Không dùng tên file gốc làm tên lưu.
- File metadata được lưu.
- Kiểm tra quyền hoạt động.
- Test vượt qua.

---

## 13. GIAI ĐOẠN 9: SERVICE REQUEST MODULE

### 13.1. Mức ưu tiên

```text
P0
```

### 13.2. Backend

- Service Category.
- Service Request.
- Assignment.
- Comment.
- Attachment.
- Status History.
- Rating.
- Workflow.
- Request Number Generator.
- Asset Link.

### 13.3. API

- Danh mục dịch vụ.
- Danh sách yêu cầu.
- Tạo yêu cầu.
- Chi tiết yêu cầu.
- Cập nhật yêu cầu.
- Phân công xử lý.
- Cập nhật trạng thái.
- Bình luận.
- Đính kèm.
- Đánh giá.

### 13.4. Kiểm thử

- Tạo yêu cầu.
- Sinh mã yêu cầu duy nhất.
- Phân công.
- Chuyển trạng thái.
- Chuyển trạng thái sai.
- Đóng yêu cầu.
- Đánh giá yêu cầu.
- Không đánh giá hai lần.
- Liên kết tài sản.
- Permission.
- Phạm vi dữ liệu.

### 13.5. Điều kiện hoàn thành

- Service Request API hoạt động.
- Workflow đúng.
- Lịch sử được ghi.
- Rating đúng quy tắc.
- Test vượt qua.

---

## 14. GIAI ĐOẠN 10: ASSET MODULE

### 14.1. Mức ưu tiên

```text
P1
```

### 14.2. Backend

- Asset Category.
- Asset.
- Asset Assignment.
- Repair History.
- Asset Status.
- Liên kết Service Request.

### 14.3. API

- Danh sách tài sản.
- Tài sản của tôi.
- Chi tiết tài sản.
- Tạo tài sản.
- Cập nhật tài sản.
- Cấp phát.
- Trả tài sản.
- Lịch sử sửa chữa.

### 14.4. Kiểm thử

- Mã tài sản duy nhất.
- Serial duy nhất.
- Chỉ tài sản sẵn sàng được cấp phát.
- Một tài sản chỉ có một cấp phát hoạt động.
- Tài sản hỏng không cấp phát.
- Tài sản ngừng sử dụng không cấp phát.
- Trả tài sản.
- Báo hỏng qua Service Request.

### 14.5. Điều kiện hoàn thành

- Asset API hoạt động.
- Cấp phát đúng.
- Trạng thái đồng bộ.
- Service Request liên kết đúng.
- Test vượt qua.

---

## 15. GIAI ĐOẠN 11: NOTIFICATION VÀ DASHBOARD

### 15.1. Mức ưu tiên

```text
P1
```

### 15.2. Notification

- Notification Entity và Repositories.
- Di trú CSDL: Bản di trú `V017__add_notification_idempotency_and_query_indexes.sql` bổ sung cột `event_key` và unique index `uk_notifications_recipient_event` chống trùng lặp, cùng composite index `idx_notifications_recipient_created_at`.
- Mô hình phân phối: In-app Database Notification Center. Kênh Push/Email lưu trữ preference, hoãn delivery side-effect (`push_enabled`, `email_enabled`).
- Tạo thông báo từ hành động nghiệp vụ thực tế (Project Member `POST /members`, Task Assigned `POST /assignments`, Task Status `PUT /status`, Service Request Assigned `POST /assignments`, Service Request Status `PUT /status`, Asset Assigned `POST /assignments`, Comment `POST /comments`).
- Cơ chế lũy đẳng (Idempotency): Native `INSERT ... ON CONFLICT (recipient_id, event_key) DO NOTHING` trả về affected rows (1: tạo mới, 0: duplicate success; không dùng exception làm control flow).
- Xử lý khi tùy chọn tắt: `inAppEnabled = false` bỏ qua không ghi CSDL, không lưu pending, không backfill.
- Scheduler Scanner Policy: Quét định kỳ hạn chót (`TASK_DUE_SOON`, `TASK_OVERDUE`), điều phối đa thực thể bằng PostgreSQL advisory lock key `1101`, default scan delay `PT15M`, batch size `100`.
- Danh sách thông báo (`GET /notifications`).
- Đánh dấu đã đọc (`PUT /notifications/{id}/read` - trả về 404 nếu không sở hữu).
- Đánh dấu tất cả đã đọc (`PUT /notifications/read-all`).
- Đếm thông báo chưa đọc (`GET /notifications/unread-count`).
- Cấu hình nhận thông báo (`GET /notification-preferences`, `PUT /notification-preferences`).
- Điều hướng sâu (Deep Link) qua `referenceType` và `referenceId`; không mở endpoint riêng `GET /notifications/{id}`.
- Chính sách lưu trữ: Hoãn xóa/dọn dẹp tự động (`NOTIFICATION_RETENTION_CLEANUP_DEFERRED`).

### 15.3. Dashboard

- Dashboard cá nhân (`GET /dashboard/me`) cho mọi vai trò (kể cả Admin):
  - Task Summary (chỉ task có active assignment cho principal qua `task_assignments`: `todo`, `inProgress`, `inReview`, `completed`, `overdue`, `dueSoon`).
  - Project Summary (chỉ dự án không soft-deleted mà principal là thành viên hoạt động qua `project_members`: `active`, `onHold`).
  - Service Request Summary (yêu cầu do principal tạo hoặc có active assignment qua `service_assignments`: `open`, `inProgress`, `waitingForUser`, `resolved`).
  - Danh sách công việc sắp đến hạn (`upcomingTasks`: Top 5, cùng scope active assignment, hạn trong vòng 72 giờ, sắp xếp `dueDate ASC, id ASC`).
  - Danh sách thông báo gần nhất (`recentNotifications`: Top 5, của principal, sắp xếp `createdAt DESC, id DESC`).
- Hoãn triển khai Dashboard dự án (`PROJECT_DASHBOARD_PROJECTION_DEFERRED`).

### 15.4. Kiểm thử

- Tạo thông báo khi giao task và đổi trạng thái với thuật toán resolution chuẩn (active assignee, reporter, PM/Leaders; loại trừ actor).
- Phân quyền thông báo: người dùng chỉ xem và cập nhật thông báo của chính mình (chặn truy cập chéo bằng 404).
- Kiểm thử lũy đẳng: ghi trùng sự kiện qua `ON CONFLICT DO NOTHING` không sinh thêm bản ghi và không rollback nghiệp vụ gốc.
- Dashboard tính toán chính xác số liệu theo phân quyền CSDL (`task_assignments`, `service_assignments`, `project_members`); cô lập dữ liệu giữa các người dùng.
- Kiểm thử ngưỡng thời gian `dueSoon` (72 giờ) và `overdue` bằng mock Clock.

### 15.5. Điều kiện hoàn thành

- Di trú V017 áp dụng thành công theo quy trình Controlled Deterministic Data Backfill.
- Notification API hoạt động đầy đủ, đúng contract.
- Dashboard cá nhân hoạt động với số liệu khớp dữ liệu thực tế.
- Quyền dữ liệu và bảo mật được thực thi 100% tại tầng CSDL.
- Toàn bộ test suite vượt qua với kết quả BUILD SUCCESS.
- Không có lỗi Checkstyle.

---

## 16. GIAI ĐOẠN 12: KHỞI TẠO ỨNG DỤNG MOBILE

### 16.1. Mức ưu tiên

```text
P0
```

### 16.2. Mục tiêu

Tạo ứng dụng React Native và TypeScript có cấu trúc feature-based.

### 16.3. Công việc

- Kiểm tra phiên bản Node.js.
- Kiểm tra môi trường Android.
- Tạo React Native project.
- Cấu hình TypeScript.
- Cấu hình lint và format.
- Tạo Navigation.
- Tạo Theme.
- Tạo HTTP Client.
- Tạo Error Handler.
- Tạo Secure Storage.
- Tạo Local Storage.
- Tạo component dùng chung.
- Tạo test nền.
- Cấu hình environment mobile.

### 16.4. Component dùng chung ban đầu

- AppButton.
- AppTextInput.
- PasswordInput.
- LoadingIndicator.
- EmptyState.
- ErrorState.
- StatusBadge.
- PriorityBadge.
- ConfirmationDialog.
- SearchBar.

### 16.5. Điều kiện hoàn thành

- Mobile build được.
- Chạy được trên Android Emulator.
- Navigation hoạt động.
- Test nền hoạt động.
- Không có token hard-code.
- Cấu trúc đúng tài liệu.

---

## 17. GIAI ĐOẠN 13: MOBILE AUTHENTICATION

### 17.1. Mức ưu tiên

```text
P0
```

### 17.2. Màn hình

- Splash.
- Login.
- Forgot Password.
- Profile.
- Change Password.
- Settings.

### 17.3. Logic

- Form validation.
- Gọi API login.
- Lưu token bằng Secure Storage.
- Tự thêm access token vào request.
- Refresh token.
- Xử lý logout.
- Xử lý tài khoản bị khoá.
- Xử lý token hết hạn.
- Điều hướng Auth và Main.

### 17.4. Kiểm thử

- Form rỗng.
- Email sai.
- Đăng nhập thành công.
- Đăng nhập thất bại.
- Token hết hạn.
- Refresh thành công.
- Refresh thất bại.
- Logout.
- Khởi động lại ứng dụng khi đã đăng nhập.

### 17.5. Điều kiện hoàn thành

- Đăng nhập end-to-end hoạt động.
- Token được lưu an toàn.
- Refresh không tạo vòng lặp.
- Logout xoá phiên.
- Mobile không hiện màn hình được bảo vệ khi chưa đăng nhập.

---

## 18. GIAI ĐOẠN 14: MOBILE PROJECT VÀ TASK

### 18.1. Mức ưu tiên

```text
P0
```

### 18.2. Project Screen

- Project List.
- Project Detail.
- Create Project.
- Edit Project.
- Project Member List.
- Add Project Member.
- Milestone List.

### 18.3. Task Screen

- Task List.
- Task Detail.
- Create Task.
- Edit Task.
- Subtask List.
- Task Comment.
- Status Update.
- Progress Update.

### 18.4. Trạng thái giao diện

Mỗi màn hình phải xử lý:

- Loading.
- Success.
- Empty.
- Error.
- Refreshing.
- Loading More.

### 18.5. Kiểm thử

- Load danh sách.
- Phân trang.
- Tìm kiếm.
- Lọc.
- Tạo dữ liệu.
- Validation.
- API lỗi.
- Mất mạng.
- Permission.
- Refresh dữ liệu sau mutation.
- Navigation bằng ID.
- Optimistic Lock Conflict.

### 18.6. Điều kiện hoàn thành

- Project và Task chạy end-to-end.
- Danh sách và chi tiết đồng bộ.
- Form hoạt động.
- Quyền hiển thị đúng.
- Backend vẫn kiểm tra quyền.
- Test mobile chính vượt qua.

---

## 19. GIAI ĐOẠN 15: MOBILE SERVICE REQUEST VÀ ASSET

### 19.1. Mức ưu tiên

```text
P0 và P1
```

### 19.2. Service Request Screen

- Service Request List.
- Service Request Detail.
- Create Service Request.
- Comment.
- Status Update.
- Rating.
- Attachment Picker.

### 19.3. Asset Screen

- Asset List.
- My Assets.
- Asset Detail.
- Repair History.
- Report Broken Asset.

### 19.4. Notification Screen

- Notification List.
- Unread Badge.
- Mark as Read.
- Mark All as Read.
- Deep Link đến dữ liệu liên quan.

Deep Link là điều hướng trực tiếp từ thông báo đến màn hình chi tiết phù hợp.

### 19.5. Kiểm thử

- Tạo yêu cầu.
- Upload ảnh.
- Bình luận.
- Chuyển trạng thái.
- Đánh giá.
- Tài sản của tôi.
- Báo hỏng tài sản.
- Notification deep link.
- Upload thất bại.
- Mất mạng.
- Permission.

### 19.6. Điều kiện hoàn thành

- Service Request chạy end-to-end.
- Asset hiển thị đúng phạm vi.
- Notification điều hướng đúng.
- Upload hoạt động.
- Test vượt qua.

---

## 20. GIAI ĐOẠN 16: TÍCH HỢP VÀ KIỂM THỬ HỆ THỐNG

### 20.1. Mục tiêu

Kiểm tra toàn bộ hệ thống theo luồng người dùng thực tế.

### 20.2. Luồng End-to-End bắt buộc

### Luồng 1: Đăng nhập

```text
Mở ứng dụng
→ đăng nhập
→ dashboard
→ refresh token
→ đăng xuất
```

### Luồng 2: Quản lý dự án

```text
Tạo dự án
→ thêm thành viên
→ tạo milestone
→ xem dashboard dự án
```

### Luồng 3: Quản lý công việc

```text
Tạo task
→ phân công
→ bắt đầu
→ gửi kiểm tra
→ hoàn thành
```

### Luồng 4: Yêu cầu dịch vụ

```text
Tạo yêu cầu
→ phân công
→ xử lý
→ giải quyết
→ đóng
→ đánh giá
```

### Luồng 5: Tài sản

```text
Tạo tài sản
→ cấp phát
→ người dùng xem tài sản
→ báo hỏng
→ tạo yêu cầu dịch vụ
→ ghi lịch sử sửa chữa
```

### Luồng 6: Thông báo

```text
Phát sinh sự kiện
→ tạo thông báo
→ mobile hiển thị badge
→ mở thông báo
→ điều hướng chi tiết
→ đánh dấu đã đọc
```

### 20.3. Loại kiểm thử

- Functional Test.
- Permission Test.
- Security Test.
- Integration Test.
- End-to-End Test.
- Validation Test.
- Error Handling Test.
- Performance Test cơ bản.
- Mobile Device Test.
- Regression Test.

Regression Test là kiểm thử lại chức năng cũ sau khi code thay đổi để bảo đảm chức năng cũ không bị hỏng.

### 20.4. Điều kiện hoàn thành

- Không còn lỗi nghiêm trọng.
- Các luồng chính chạy được.
- Permission đúng.
- Không lộ secret.
- Không mất dữ liệu.
- API Contract khớp.
- Mobile không crash trong luồng chính.
- Test report được lưu.

---

## 21. GIAI ĐOẠN 17: DOCKER VÀ MÔI TRƯỜNG LOCAL

### 21.1. Mục tiêu

Cho phép chạy backend và database bằng Docker Compose.

### 21.2. Công việc

- Tạo Dockerfile backend.
- Sử dụng multi-stage build.
- Tạo Docker Compose.
- Tạo PostgreSQL volume.
- Tạo network.
- Cấu hình health check.
- Tạo `.env.example`.
- Tách secret khỏi source code.
- Tạo lệnh khởi động.
- Tạo lệnh dừng.
- Tạo hướng dẫn reset local database.

### 21.3. Điều kiện hoàn thành

Lệnh sau chạy được:

```text
docker compose up
```

Backend phải:

- Kết nối database.
- Chạy migration.
- Trả health.
- Mở API.
- Không chạy bằng cấu hình production giả.
- Không chứa secret trong image.

---

## 22. GIAI ĐOẠN 18: CI/CD

### 22.1. Mức ưu tiên

```text
P1
```

### 22.2. CI Backend

- Checkout.
- Cài Java.
- Cache Maven.
- Compile.
- Unit Test.
- Integration Test.
- Package.
- Lưu test report.
- Build Docker Image khi phù hợp.

### 22.3. CI Mobile

- Cài Node.js.
- Cache dependency.
- Install dependency.
- Lint.
- Type Check.
- Unit Test.
- Component Test.
- Build kiểm tra khi môi trường cho phép.

### 22.4. Pull Request Gate

Không cho merge khi:

- Build lỗi.
- Test lỗi.
- Lint lỗi nghiêm trọng.
- Type Check lỗi.
- Có secret bị phát hiện.
- Migration không hợp lệ.

### 22.5. CD

Giai đoạn đầu:

- Tạo artifact.
- Tạo Docker image.
- Gắn version tag.
- Chuẩn bị triển khai staging.
- Không tự động production nếu chưa có phê duyệt.

### 22.6. Điều kiện hoàn thành

- Pull Request chạy CI.
- CI thành công với code hợp lệ.
- CI thất bại với test lỗi.
- Test report được lưu.
- Docker image có version.
- Không lộ secret.

---

## 23. GIAI ĐOẠN 19: LOGGING, MONITORING, BACKUP VÀ ROLLBACK

### 23.1. Logging

Log cần có:

- Timestamp.
- Level.
- Trace ID.
- Request ID.
- Endpoint.
- HTTP Status.
- Thời gian xử lý.
- Thông tin lỗi phù hợp.

Không log:

- Password.
- Access token.
- Refresh token.
- Secret.
- Nội dung nhạy cảm.

### 23.2. Monitoring

Theo dõi:

- Health.
- CPU.
- Memory.
- Request Count.
- Error Rate.
- Response Time.
- Database Connection.
- Storage.

### 23.3. Backup

- Backup PostgreSQL.
- Backup file storage.
- Ghi thời gian backup.
- Có hướng dẫn phục hồi.
- Chạy thử phục hồi ít nhất trên môi trường test.

### 23.4. Rollback

- Giữ image phiên bản trước.
- Gắn release tag.
- Có hướng dẫn rollback.
- Không sửa migration cũ.
- Đánh giá ảnh hưởng database trước rollback.

### 23.5. Điều kiện hoàn thành

- Health Check hoạt động.
- Log có Trace ID.
- Monitoring đọc được metrics.
- Backup tạo được.
- Restore thử nghiệm thành công.
- Có tài liệu rollback.

---

## 24. GIAI ĐOẠN 20: BÁO CÁO VÀ SLIDE

### 24.1. Nguyên tắc

- Dùng bằng chứng thật.
- Không tạo ảnh giả.
- Không tạo số liệu test giả.
- Không tuyên bố deployment thành công nếu chưa triển khai.
- Không chép code chỉ để tăng số trang.
- Code đưa vào phải có giải thích.
- Mỗi môn có trọng tâm riêng.

### 24.2. Báo cáo Kỹ năng lập trình nâng cao

Thu thập:

- Backend architecture.
- Spring configuration.
- IoC và Dependency Injection.
- REST API.
- JPA.
- Security.
- JWT.
- AOP.
- Workflow.
- Test.
- Code tiêu biểu.

### 24.3. Báo cáo Phát triển ứng dụng di động

Thu thập:

- Navigation.
- Component.
- Screen.
- Props và State.
- API Integration.
- Local Storage.
- Secure Storage.
- Loading, Empty và Error.
- Mobile Test.
- Ảnh giao diện.

### 24.4. Báo cáo Quản lý dự án CNTT

Thu thập:

- Charter.
- Scope.
- WBS.
- Backlog.
- Timeline.
- RACI.
- Risk.
- Communication.
- Change Request.
- Báo cáo tiến độ.
- Nghiệm thu.

### 24.5. Báo cáo Triển khai phần mềm

Thu thập:

- Git Workflow.
- Pull Request.
- CI.
- Test Result.
- Docker.
- Docker Compose.
- Environment.
- Logging.
- Monitoring.
- Backup.
- Rollback.

### 24.6. Điều kiện hoàn thành

- Mỗi báo cáo đúng trọng tâm môn.
- Báo cáo đúng giới hạn trang.
- Có trích dẫn nguồn.
- Có sơ đồ.
- Có ảnh minh chứng.
- Có mã nguồn quan trọng.
- Có kiểm thử.
- Slide đồng bộ với báo cáo.
- Speaker Notes đầy đủ.
- Demo có kịch bản.

---

## 25. GIAI ĐOẠN 21: NGHIỆM THU VÀ ĐÓNG DỰ ÁN

### 25.1. Kiểm tra sản phẩm

- Backend chạy.
- Mobile chạy.
- Database migration thành công.
- Docker Compose chạy.
- Test chính vượt qua.
- Tài liệu cài đặt đầy đủ.
- Tài khoản demo hoạt động.
- Không có secret công khai.
- Repository sạch.
- Release tag được tạo.

### 25.2. Kiểm tra tài liệu

- README.
- Hướng dẫn cài đặt.
- Hướng dẫn sử dụng.
- API Documentation.
- Database Design.
- Test Report.
- Deployment Guide.
- Backup Guide.
- Rollback Guide.
- Báo cáo bốn môn.
- Slide bốn môn.

### 25.3. Đóng dự án

- Ghi kết quả đạt được.
- Ghi chức năng chưa hoàn thành.
- Ghi lỗi còn lại.
- Ghi Lessons Learned.
- Ghi hướng phát triển.
- Tạo bản release.
- Lưu bằng chứng.
- Backup repository và tài liệu.

Lessons Learned là phần ghi lại những điều đã làm tốt, chưa tốt và kinh nghiệm cho dự án sau.

---

## 26. PHÂN LOẠI BACKLOG

### 26.1. P0: Bắt buộc để demo

- Backend chạy.
- Database chạy.
- Authentication.
- Project.
- Task.
- Service Request.
- React Native chạy.
- Mobile Login.
- Project Screen.
- Task Screen.
- Service Request Screen.
- API Integration.
- Test luồng chính.

### 26.2. P1: Bắt buộc để hoàn thiện MVP

- Organization.
- User Management.
- File Upload.
- Asset.
- Notification.
- Dashboard.
- Docker Compose.
- CI.
- Logging.
- Test Report.

### 26.3. P2: Nâng cao

- Push Notification thực tế.
- Offline Cache nâng cao.
- Monitoring Dashboard.
- Backup tự động.
- Reporting nâng cao.
- Export Excel hoặc PDF.
- QR tài sản.
- Approval Workflow.
- Timesheet.
- Work Log.

### 26.4. P3: Hướng phát triển

- AI Assistant.
- Chat thời gian thực.
- Video call.
- Microservice.
- Kubernetes Production.
- Multi-region.
- Advanced Analytics.
- Recommendation.
- GPS Tracking.
- Face Recognition.

---

## 27. QUY TẮC CHO AI AGENT

AI Agent phải làm việc theo quy trình:

```text
Đọc tài liệu
→ xác định giai đoạn hiện tại
→ kiểm tra điều kiện đầu vào
→ kiểm tra code hiện có
→ kiểm tra thư viện hiện có
→ nêu kế hoạch và các file sẽ sửa
→ thực hiện một phạm vi nhỏ
→ chạy build và test
→ kiểm tra kết quả
→ cập nhật tài liệu
→ tạo bằng chứng
```

AI Agent không được:

1. Sinh toàn bộ dự án trong một lần.
2. Tự chuyển sang giai đoạn tiếp theo.
3. Tạo code ngoài phạm vi giai đoạn hiện tại.
4. Tạo module chưa có trong tài liệu.
5. Tự thay đổi database.
6. Tự thay đổi API Contract.
7. Tự đổi framework.
8. Tự thêm dependency trùng chức năng.
9. Tự viết lại chức năng mà framework hoặc thư viện ổn định đã giải quyết.
10. Tự xoá code đang hoạt động.
11. Tự sửa nhiều module không liên quan.
12. Đánh dấu hoàn thành khi chưa build.
13. Đánh dấu hoàn thành khi chưa test.
14. Tuyên bố triển khai thành công khi chưa có bằng chứng.
15. Tạo dữ liệu, log hoặc kết quả giả.
16. Viết báo cáo kết quả trước khi có bằng chứng tương ứng.
17. Bỏ qua lỗi compile, migration hoặc test.
18. Hạ điều kiện kiểm thử chỉ để pipeline thành công.
19. Chạy lệnh phá huỷ dữ liệu khi chưa được cho phép.
20. Ghi mật khẩu, token hoặc secret vào source code, log hoặc tài liệu.

Khi phát hiện tài liệu và code mâu thuẫn, AI Agent phải:

1. Dừng thay đổi đối với phạm vi đang mâu thuẫn.
2. Chỉ rõ tài liệu và code liên quan.
3. Giải thích ảnh hưởng.
4. Đề xuất phương án xử lý.
5. Cập nhật tài liệu trước.
6. Chỉ sửa code sau khi quyết định mới được khóa.

Khi phát hiện một thư viện, package hoặc repository đã giải quyết được yêu cầu, AI Agent phải:

1. Kiểm tra project đã sử dụng giải pháp đó chưa.
2. Kiểm tra tài liệu chính thức.
3. Kiểm tra phiên bản và khả năng tương thích.
4. Kiểm tra giấy phép.
5. Kiểm tra tình trạng duy trì.
6. Kiểm tra các vấn đề bảo mật đã biết.
7. Ưu tiên tích hợp giải pháp ổn định thay vì tự viết lại.
8. Ghi lại lý do lựa chọn.
9. Viết kiểm thử sau khi tích hợp.

---

## 28. DEFINITION OF DONE

Definition of Done là tập hợp các điều kiện bắt buộc để một công việc được coi là hoàn thành.

### 28.1. Definition of Done cho mã nguồn

Một chức năng code chỉ được coi là hoàn thành khi:

- Phù hợp phạm vi dự án.
- Thuộc đúng giai đoạn Roadmap.
- Đặt đúng module.
- Đặt đúng Layer.
- Không tạo chức năng trùng.
- Không tạo dependency trùng.
- Code được format.
- Linter không có lỗi nghiêm trọng.
- Backend hoặc mobile build thành công.
- Migration chạy thành công nếu có.
- API đúng với API Contract.
- Permission hoạt động.
- Resource Ownership hoạt động.
- Validation hoạt động.
- Error Handling hoạt động.
- Optimistic Locking hoạt động khi được yêu cầu.
- Unit Test vượt qua.
- Integration Test liên quan vượt qua.
- Security Test liên quan vượt qua.
- Mobile xử lý Loading, Empty và Error.
- Không chứa secret.
- Không còn file tạm không cần thiết.
- Tài liệu được cập nhật.
- OpenAPI được cập nhật nếu API thay đổi.
- Có bằng chứng thực tế.
- Cảnh báo còn lại được ghi rõ.

Không được dùng tiêu chí:

```text
Code đã được viết
```

để kết luận chức năng đã hoàn thành.

### 28.2. Definition of Done cho tài liệu

Một tài liệu chỉ được coi là hoàn thành khi:

- Có tiêu đề và cấu trúc rõ ràng.
- Không bị cắt giữa chừng.
- Không có code fence chưa đóng.
- Heading có cấp độ nhất quán.
- Không có ký tự Markdown bị hỏng.
- Không mâu thuẫn với tài liệu nguồn sự thật khác.
- Thuật ngữ chuyên ngành được giải thích khi cần.
- Nội dung Edux và nội dung bổ sung được phân biệt.
- Không chứa dữ liệu giả không được ghi nhãn.
- Không chứa secret hoặc dữ liệu cá nhân không cần thiết.
- Đã được kiểm tra chính tả và định dạng.
- Dòng kết thúc xác nhận phạm vi của tài liệu vẫn tồn tại.

### 28.3. Definition of Done cho báo cáo

Một báo cáo môn học chỉ được coi là hoàn thành khi:

- Xác định đúng môn.
- Đúng trọng tâm kiến thức của môn.
- Dùng bằng chứng thật từ WorkSphere.
- Không sao chép nguyên báo cáo của môn khác.
- Có giải thích thuật ngữ.
- Có sơ đồ và hình ảnh phù hợp.
- Có mã nguồn quan trọng và phần giải thích.
- Có phần kiểm thử.
- Có kết quả và hạn chế.
- Có nguồn tham khảo hợp lệ.
- Không bịa số liệu.
- Không bịa log.
- Không bịa kết quả triển khai.
- Đúng yêu cầu số trang.
- Phần phụ lục được tách hợp lý.
- Không chép code chỉ để kéo dài báo cáo.

### 28.4. Definition of Done cho slide

Một bộ slide chỉ được coi là hoàn thành khi:

- Đúng môn học.
- Đồng bộ với báo cáo.
- Có cấu trúc trình bày rõ ràng.
- Có hình ảnh hoặc sơ đồ phù hợp.
- Có số liệu đã xác minh.
- Có ảnh sản phẩm thật.
- Không chứa quá nhiều chữ.
- Code chỉ hiển thị đoạn ngắn.
- Có Speaker Notes.
- Có kịch bản demo.
- Không lộ secret hoặc dữ liệu cá nhân.
- Không sử dụng bằng chứng giả.
- Hiển thị đúng trên PowerPoint.
- Không thiếu font hoặc hình ảnh.
- Không có nội dung tràn khỏi slide.

### 28.5. Definition of Done cho triển khai

Một nhiệm vụ triển khai chỉ được coi là hoàn thành khi:

- Image được build thành công.
- Container khởi động thành công.
- Health Check thành công.
- Migration thành công.
- Backend kết nối database.
- API phản hồi.
- Secret không nằm trong image.
- Log không chứa token hoặc mật khẩu.
- Phiên bản được gắn tag.
- Có cấu hình môi trường.
- Có bằng chứng triển khai.
- Có hướng dẫn rollback.
- Có báo cáo lỗi còn lại.
- Không tuyên bố production-ready nếu mới chỉ chạy local.

---

## 29. TỆP BẰNG CHỨNG DỰ KIẾN

Tạo thư mục bằng chứng:

```text
evidence/
├── advanced-programming/
├── mobile-development/
├── project-management/
└── software-deployment/
```

### 29.1. Bằng chứng Kỹ năng lập trình nâng cao

Có thể gồm:

```text
evidence/advanced-programming/
├── architecture/
├── api/
├── database/
├── security/
├── source-code/
├── testing/
└── README.md
```

Bằng chứng tiêu biểu:

- Sơ đồ Modular Monolith.
- Sơ đồ phân lớp.
- Spring Security Configuration.
- JWT Flow.
- Permission Test.
- Workflow Test.
- Repository Test.
- Swagger.
- Migration Result.
- Code Review.

### 29.2. Bằng chứng Phát triển ứng dụng di động

Có thể gồm:

```text
evidence/mobile-development/
├── navigation/
├── screens/
├── components/
├── api-integration/
├── storage/
├── testing/
└── README.md
```

Bằng chứng tiêu biểu:

- Navigation Map.
- Ảnh các màn hình.
- Component Tree.
- Form Validation.
- API Integration.
- Secure Storage.
- Loading, Empty và Error.
- Pagination.
- Component Test.
- Video hoặc ảnh demo.

### 29.3. Bằng chứng Quản lý dự án CNTT

Có thể gồm:

```text
evidence/project-management/
├── charter/
├── scope/
├── wbs/
├── backlog/
├── timeline/
├── raci/
├── risks/
├── meetings/
├── changes/
├── acceptance/
└── README.md
```

Các tài liệu quản lý dự án phải được tạo và cập nhật xuyên suốt dự án, không được tạo ngược toàn bộ sau khi code đã hoàn thành.

Tối thiểu phải có:

- Project Charter.
- Scope Statement.
- Stakeholder Register.
- WBS.
- Product Backlog.
- Timeline.
- RACI Matrix.
- Risk Register.
- Meeting Minutes.
- Weekly Status Report.
- Change Request.
- Acceptance Checklist.
- Lessons Learned.

### 29.4. Bằng chứng Triển khai phần mềm

Có thể gồm:

```text
evidence/software-deployment/
├── git/
├── ci/
├── docker/
├── environments/
├── logging/
├── monitoring/
├── backup/
├── rollback/
└── README.md
```

Bằng chứng tiêu biểu:

- Branch Strategy.
- Pull Request.
- CI Run.
- Test Report.
- Dockerfile.
- Docker Compose.
- Container Health.
- Environment Configuration.
- Logging.
- Monitoring.
- Backup Log.
- Restore Test.
- Rollback Procedure.

### 29.5. Metadata của bằng chứng

Mỗi bằng chứng phải ghi:

```text
Tên bằng chứng
Ngày tạo
Môn liên quan
Giai đoạn Roadmap
Module liên quan
Người thực hiện
Lệnh đã chạy
Kết quả
File hoặc đường dẫn
Cảnh báo còn lại
```

Không đưa vào bằng chứng:

- Password.
- Access token.
- Refresh token.
- API key.
- Private key.
- File `.env` thật.
- Cookie.
- Dữ liệu cá nhân thật.
- Log chứa secret.

---

## 30. CƠ CHẾ THEO DÕI TIẾN ĐỘ

### 30.1. Trạng thái công việc phát triển

Mỗi công việc trong backlog sử dụng một trong các trạng thái:

```text
BACKLOG
READY
IN_PROGRESS
IN_REVIEW
TESTING
DONE
BLOCKED
CANCELLED
```

Ý nghĩa:

- `BACKLOG`: đã ghi nhận nhưng chưa sẵn sàng thực hiện.
- `READY`: đã rõ yêu cầu và có thể bắt đầu.
- `IN_PROGRESS`: đang thực hiện.
- `IN_REVIEW`: đang được review.
- `TESTING`: đang kiểm thử.
- `DONE`: đã đạt Definition of Done.
- `BLOCKED`: bị chặn bởi vấn đề khác.
- `CANCELLED`: đã huỷ.

Không chuyển công việc sang `DONE` nếu chưa đạt Definition of Done.

### 30.2. Thông tin bắt buộc của một công việc

Mỗi Issue hoặc Backlog Item phải có:

```text
Tiêu đề
Mô tả
Môn liên quan
Giai đoạn Roadmap
Độ ưu tiên
Người phụ trách
Điều kiện đầu vào
Acceptance Criteria
Test cần chạy
Bằng chứng cần tạo
Dependency
Rủi ro
Trạng thái
```

Acceptance Criteria là các điều kiện cụ thể để xác nhận chức năng đáp ứng yêu cầu.

### 30.3. Theo dõi theo tuần

Mỗi tuần cần ghi:

- Công việc dự kiến.
- Công việc đã hoàn thành.
- Công việc chưa hoàn thành.
- Lý do chậm.
- Lỗi phát hiện.
- Rủi ro mới.
- Thay đổi phạm vi.
- Kế hoạch tuần sau.
- Bằng chứng đã tạo.

### 30.4. Theo dõi chất lượng

Theo dõi tối thiểu:

- Số Issue mở.
- Số Issue hoàn thành.
- Số bug theo mức độ.
- Tỷ lệ test thành công.
- Số Pull Request.
- Số Pull Request bị yêu cầu sửa.
- Số lần CI thất bại.
- Số lỗi migration.
- Số lỗi tích hợp mobile và backend.
- Số tài liệu chưa hoàn thành.
- Số rủi ro chưa xử lý.

Không được tạo số liệu theo dõi giả.

### 30.5. Theo dõi thay đổi phạm vi

Mọi thay đổi phạm vi phải ghi:

```text
Mã thay đổi
Ngày đề xuất
Người đề xuất
Nội dung thay đổi
Lý do
Ảnh hưởng chức năng
Ảnh hưởng database
Ảnh hưởng API
Ảnh hưởng mobile
Ảnh hưởng tiến độ
Ảnh hưởng kiểm thử
Ảnh hưởng báo cáo
Rủi ro
Quyết định
```

Không triển khai thay đổi phạm vi trước khi quyết định được ghi nhận.

### 30.6. Điểm kiểm soát giữa các giai đoạn

Trước khi chuyển sang giai đoạn mới phải kiểm tra:

1. Đầu ra giai đoạn hiện tại.
2. Điều kiện hoàn thành.
3. Build.
4. Test.
5. Migration.
6. Tài liệu.
7. API Contract.
8. Secret.
9. File tạm.
10. Bằng chứng.
11. Rủi ro còn lại.
12. Quyết định chuyển giai đoạn.

AI Agent không được tự phê duyệt chuyển giai đoạn.

---

## 31. CÁC QUYẾT ĐỊNH ROADMAP ĐÃ KHÓA

- Dự án phát triển theo từng giai đoạn.
- Không sinh toàn bộ dự án trong một lần.
- Authentication được triển khai trước module nghiệp vụ.
- Organization được triển khai trước các chức năng quản trị người dùng.
- Project được triển khai trước Task.
- File Module phải hoàn thiện trước khi Task hoặc Service Request sử dụng attachment.
- Service Request và Asset phải xử lý rõ dependency hai chiều.
- Backend API có test trước khi mobile tích hợp.
- Mobile Authentication hoàn thiện trước màn hình nghiệp vụ.
- Docker local hoàn thiện sau các chức năng MVP chính.
- CI được triển khai trước khi đóng dự án.
- Logging, Monitoring, Backup và Rollback phải có bằng chứng thật.
- Báo cáo sử dụng bằng chứng được thu thập xuyên suốt dự án.
- Tài liệu Quản lý dự án phải được cập nhật trong quá trình phát triển, không tạo ngược sau khi code hoàn thành.
- Slide của bốn môn có trọng tâm riêng.
- AI Agent không tự chuyển giai đoạn.
- Mọi chức năng phải đạt Definition of Done.
- Chức năng P2 và P3 không được ưu tiên trước P0 và P1.
- Thay đổi Roadmap phải được ghi nhận trước khi thực hiện.

Mọi thay đổi đối với thứ tự và phạm vi phát triển phải được cập nhật trong tài liệu này trước khi AI Agent hoặc thành viên nhóm thực hiện.
