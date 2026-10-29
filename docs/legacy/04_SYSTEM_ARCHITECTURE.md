# KIẾN TRÚC HỆ THỐNG WORKSPHERE

## 1. Mục đích

Tài liệu này xác định kiến trúc tổng thể, cấu trúc repository, các module nghiệp vụ, nguyên tắc phụ thuộc và công nghệ cốt lõi của WorkSphere.

Mọi mã nguồn, cơ sở dữ liệu, API, kiểm thử và cấu hình triển khai phải tuân theo tài liệu này.

Không tự ý:

- Đổi framework.
- Tách hệ thống thành microservice.
- Thêm module nghiệp vụ ngoài phạm vi.
- Thay đổi cấu trúc repository.
- Thêm dependency trùng chức năng.
- Cho phép module truy cập trực tiếp dữ liệu nội bộ của module khác.

---

## 2. Kiến trúc tổng thể

WorkSphere sử dụng kiến trúc client-server gồm:

1. Ứng dụng di động React Native.
2. Backend Spring Boot.
3. Cơ sở dữ liệu PostgreSQL.
4. Dịch vụ lưu trữ tệp.
5. Hệ thống container và CI/CD.

Sơ đồ tổng quát:

```text
React Native Mobile Application
              |
              | HTTPS + REST API + JSON
              |
              v
Spring Boot Modular Monolith
              |
       -----------------
       |               |
       v               v
PostgreSQL       File Storage
       |
       v
Backup and Monitoring
```

Ứng dụng mobile không được kết nối trực tiếp đến cơ sở dữ liệu.

Mọi dữ liệu nghiệp vụ phải đi qua REST API của backend.

---

## 3. Kiến trúc backend

Backend sử dụng kiến trúc Modular Monolith.

Modular Monolith là một ứng dụng backend được triển khai như một hệ thống duy nhất, nhưng mã nguồn được chia thành các module nghiệp vụ độc lập và có ranh giới rõ ràng.

Lựa chọn này giúp:

- Dễ xây dựng và triển khai hơn microservice.
- Dễ quản lý transaction.
- Dễ kiểm thử và debug.
- Phù hợp với quy mô nhóm sinh viên.
- Vẫn đảm bảo cấu trúc chuyên nghiệp.
- Có thể tách module thành microservice trong tương lai.

Transaction là một nhóm thao tác dữ liệu phải cùng thành công hoặc cùng thất bại. Ví dụ, khi tạo công việc và phân công người thực hiện, nếu bước phân công thất bại thì công việc không được tạo dở dang.

---

## 4. Các module backend

### 4.1. Identity Module

Trách nhiệm:

- Quản lý tài khoản người dùng.
- Đăng nhập và đăng xuất.
- Access token và refresh token.
- Vai trò và quyền.
- Đổi mật khẩu.
- Khoá hoặc mở khoá tài khoản.
- Quản lý phiên đăng nhập.

Dữ liệu chính:

- User
- Role
- Permission
- UserRole
- RolePermission
- RefreshToken
- LoginSession

### 4.2. Organization Module

Trách nhiệm:

- Quản lý phòng ban.
- Quản lý nhóm làm việc.
- Quản lý thành viên nhóm.
- Quản lý cơ cấu tổ chức.

Dữ liệu chính:

- Department
- Team
- TeamMember

### 4.3. Project Module

Trách nhiệm:

- Quản lý dự án.
- Quản lý thành viên dự án.
- Quản lý vai trò trong dự án.
- Quản lý mốc tiến độ.
- Quản lý trạng thái dự án.
- Tính toán tiến độ tổng thể.

Dữ liệu chính:

- Project
- ProjectMember
- ProjectRole
- Milestone
- ProjectStatusHistory

### 4.4. Task Module

Trách nhiệm:

- Quản lý công việc.
- Quản lý công việc con.
- Phân công người thực hiện.
- Quản lý trạng thái.
- Quản lý mức độ ưu tiên.
- Quản lý bình luận.
- Quản lý tệp đính kèm.
- Ghi lịch sử thay đổi.

Dữ liệu chính:

- Task
- TaskAssignment
- TaskComment
- TaskAttachment
- TaskStatusHistory

### 4.5. Service Request Module

Trách nhiệm:

- Quản lý yêu cầu dịch vụ.
- Quản lý danh mục yêu cầu.
- Phân công người xử lý.
- Quản lý bình luận.
- Quản lý tệp đính kèm.
- Quản lý trạng thái yêu cầu.
- Quản lý đánh giá kết quả.

Dữ liệu chính:

- ServiceRequest
- ServiceCategory
- ServiceAssignment
- ServiceComment
- ServiceAttachment
- ServiceStatusHistory
- ServiceRating

### 4.6. Asset Module

Trách nhiệm:

- Quản lý tài sản.
- Quản lý loại tài sản.
- Quản lý cấp phát tài sản.
- Quản lý lịch sử sử dụng.
- Quản lý lịch sử sửa chữa.
- Liên kết tài sản với yêu cầu dịch vụ.

Dữ liệu chính:

- Asset
- AssetCategory
- AssetAssignment
- AssetRepairHistory

### 4.7. Notification Module

Trách nhiệm:

- Tạo thông báo.
- Trả danh sách thông báo.
- Quản lý trạng thái đã đọc.
- Liên kết thông báo đến dữ liệu nghiệp vụ.

Dữ liệu chính:

- Notification
- NotificationPreference

### 4.8. File Module

Trách nhiệm:

- Upload tệp.
- Download tệp.
- Kiểm tra loại tệp.
- Kiểm tra dung lượng.
- Lưu metadata của tệp.
- Kiểm soát quyền truy cập tệp.

Dữ liệu chính:

- StoredFile

Metadata là thông tin mô tả tệp, ví dụ tên gốc, loại tệp, kích thước, người tải lên và thời điểm tải lên.

### 4.9. Audit Module

Trách nhiệm:

- Ghi lịch sử hành động.
- Ghi thay đổi trạng thái.
- Ghi thao tác quản trị.
- Hỗ trợ truy vết lỗi và sự cố.

Dữ liệu chính:

- AuditLog

### 4.10. Reporting Module

Trách nhiệm:

- Cung cấp Dashboard.
- Thống kê dự án.
- Thống kê công việc.
- Thống kê yêu cầu dịch vụ.
- Thống kê tài sản.
- Xuất báo cáo.

Reporting Module chỉ đọc dữ liệu cần thiết và không được tự thay đổi dữ liệu nghiệp vụ.

---

## 5. Kiến trúc phân lớp trong mỗi module

Mỗi module backend sử dụng bốn lớp:

```text
API Layer
Application Layer
Domain Layer
Infrastructure Layer
```

### 5.1. API Layer

Chứa:

- REST Controller.
- Request DTO.
- Response DTO.
- Validation đầu vào.
- Chuyển đổi HTTP request và response.

API Layer không chứa nghiệp vụ phức tạp.

DTO là object dùng để nhận hoặc trả dữ liệu qua API. DTO giúp hệ thống không trả trực tiếp cấu trúc bảng database cho ứng dụng mobile.

### 5.2. Application Layer

Chứa:

- Use case.
- Application service.
- Điều phối luồng nghiệp vụ.
- Transaction boundary.
- Kiểm tra quyền nghiệp vụ.
- Gọi repository và các module liên quan.

Use case là một trường hợp sử dụng cụ thể, ví dụ tạo dự án, phân công công việc hoặc đóng yêu cầu dịch vụ.

### 5.3. Domain Layer

Chứa:

- Entity nghiệp vụ.
- Value Object.
- Domain rule.
- Domain service.
- Enum trạng thái.
- Domain event khi cần thiết.

Domain Layer không phụ thuộc Spring Controller hoặc cơ sở dữ liệu cụ thể.

Entity là đối tượng nghiệp vụ có định danh, ví dụ User, Project hoặc Task.

Value Object là đối tượng được xác định bằng giá trị thay vì định danh, ví dụ khoảng thời gian hoặc địa chỉ email.

### 5.4. Infrastructure Layer

Chứa:

- JPA Entity nếu được tách khỏi Domain Entity.
- Repository implementation.
- Database query.
- File storage implementation.
- Security implementation.
- Cấu hình tích hợp bên ngoài.

---

## 6. Nguyên tắc phụ thuộc backend

Hướng phụ thuộc:

```text
API
 |
 v
Application
 |
 v
Domain
 ^
 |
Infrastructure
```

Quy tắc:

- API được gọi Application.
- Application được sử dụng Domain.
- Infrastructure triển khai interface do Domain hoặc Application định nghĩa.
- Domain không phụ thuộc API.
- Domain không phụ thuộc trực tiếp Infrastructure.
- Controller không truy cập Repository trực tiếp.
- Controller không trả JPA Entity trực tiếp.
- Module không truy cập bảng nội bộ của module khác bằng Repository của module đó.
- Giao tiếp giữa các module phải qua public service hoặc contract đã xác định.

Repository là lớp chịu trách nhiệm đọc và ghi dữ liệu nhưng không chứa quy tắc nghiệp vụ chính.

---

## 7. Cấu trúc backend dự kiến

```text
backend/
├── pom.xml
├── Dockerfile
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── worksphere/
│   │   │           ├── WorkSphereApplication.java
│   │   │           ├── shared/
│   │   │           │   ├── config/
│   │   │           │   ├── exception/
│   │   │           │   ├── security/
│   │   │           │   ├── pagination/
│   │   │           │   ├── response/
│   │   │           │   └── util/
│   │   │           ├── identity/
│   │   │           ├── organization/
│   │   │           ├── project/
│   │   │           ├── task/
│   │   │           ├── service_request/
│   │   │           ├── asset/
│   │   │           ├── notification/
│   │   │           ├── file/
│   │   │           ├── audit/
│   │   │           └── reporting/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-test.yml
│   │       ├── application-prod.yml
│   │       └── db/
│   │           └── migration/
│   └── test/
│       └── java/
│           └── com/
│               └── worksphere/
```

Cấu trúc bên trong một module:

```text
task/
├── api/
│   ├── TaskController.java
│   ├── request/
│   └── response/
├── application/
│   ├── TaskApplicationService.java
│   ├── command/
│   └── query/
├── domain/
│   ├── Task.java
│   ├── TaskStatus.java
│   ├── TaskPriority.java
│   ├── TaskRepository.java
│   └── service/
└── infrastructure/
    ├── persistence/
    ├── mapper/
    └── configuration/
```

---

## 8. Kiến trúc ứng dụng mobile

Ứng dụng mobile sử dụng React Native và TypeScript.

Cấu trúc mobile được chia theo feature thay vì chia toàn bộ project chỉ theo loại file.

Feature-based structure nghĩa là mỗi nhóm chức năng có màn hình, component, API hook và kiểu dữ liệu riêng.

```text
mobile/
├── package.json
├── tsconfig.json
├── app.json
├── src/
│   ├── app/
│   │   ├── navigation/
│   │   ├── providers/
│   │   └── store/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── serviceRequests/
│   │   ├── assets/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── admin/
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── storage/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── theme/
│   │   ├── validation/
│   │   └── utils/
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
└── tests/
```

Cấu trúc của một feature:

```text
features/tasks/
├── api/
├── components/
├── hooks/
├── screens/
├── types/
├── validation/
└── index.ts
```

---

## 9. Nguyên tắc phụ thuộc mobile

```text
Screen
  |
  v
Feature Hook
  |
  v
API Service
  |
  v
HTTP Client
```

Quy tắc:

- Screen không gọi trực tiếp thư viện HTTP.
- Screen không tự đọc hoặc ghi token.
- API Service không hiển thị thông báo giao diện.
- Component tái sử dụng không phụ thuộc nghiệp vụ cụ thể.
- Feature chỉ truy cập API thuộc phạm vi của feature.
- Mọi kiểu dữ liệu API phải có TypeScript type.
- Không dùng kiểu `any` nếu không có lý do được ghi chú.
- Navigation parameter phải có kiểu dữ liệu rõ ràng.
- Không truyền toàn bộ object lớn qua Navigation.
- Không lưu dữ liệu nhạy cảm bằng cơ chế lưu trữ không an toàn.

Hook là hàm React dùng để đóng gói trạng thái hoặc logic có thể tái sử dụng.

---

## 10. Quản lý trạng thái mobile

Phân biệt ba loại trạng thái.

### 10.1. Server State

Dữ liệu lấy từ backend:

- Dự án.
- Công việc.
- Yêu cầu dịch vụ.
- Tài sản.
- Thông báo.

Server State phải hỗ trợ:

- Cache.
- Loading.
- Error.
- Refresh.
- Pagination.
- Đồng bộ lại sau khi mutation.

Mutation là thao tác thay đổi dữ liệu, ví dụ tạo, sửa hoặc xoá.

### 10.2. Global Client State

Dữ liệu dùng trong toàn ứng dụng:

- Thông tin người dùng đăng nhập.
- Trạng thái phiên.
- Theme.
- Tuỳ chọn ứng dụng.

### 10.3. Local Screen State

Dữ liệu chỉ dùng trong một màn hình:

- Nội dung biểu mẫu.
- Tab đang chọn.
- Dialog đang mở.
- Bộ lọc tạm thời.

Không đưa mọi trạng thái vào Global State.

---

## 11. REST API

Backend cung cấp REST API và trả dữ liệu JSON.

Base path:

```text
/api/v1
```

Ví dụ:

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{projectId}
PUT    /api/v1/projects/{projectId}

GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/{taskId}
PUT    /api/v1/tasks/{taskId}
DELETE /api/v1/tasks/{taskId}

GET    /api/v1/service-requests
POST   /api/v1/service-requests
GET    /api/v1/service-requests/{requestId}
PUT    /api/v1/service-requests/{requestId}

GET    /api/v1/assets
GET    /api/v1/assets/{assetId}

GET    /api/v1/notifications
PUT    /api/v1/notifications/{notificationId}/read
```

API contract chi tiết sẽ được định nghĩa trong tài liệu riêng.

---

## 12. Cấu trúc response API

Response thành công cho một đối tượng:

```json
{
  "success": true,
  "data": {},
  "message": null,
  "timestamp": "ISO-8601"
}
```

Response danh sách phân trang:

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 0,
    "size": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasNext": false
  },
  "message": null,
  "timestamp": "ISO-8601"
}
```

Response lỗi:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "fieldErrors": {},
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

`traceId` là mã giúp tìm một yêu cầu cụ thể trong log backend.

Không trả stack trace kỹ thuật cho ứng dụng mobile.

---

## 13. Cơ sở dữ liệu

Sử dụng PostgreSQL.

Nguyên tắc:

- Mỗi bảng có khoá chính.
- Dùng foreign key phù hợp.
- Có index cho cột tìm kiếm và liên kết thường xuyên.
- Có `created_at` và `updated_at`.
- Dữ liệu cần truy vết sử dụng soft delete hoặc trạng thái hoạt động.
- Không lưu mật khẩu dạng văn bản thuần.
- Migration database phải được quản lý bằng công cụ migration.
- Không chỉnh database production thủ công.

Soft delete là đánh dấu bản ghi đã bị xoá thay vì xoá vật lý ngay khỏi database.

Migration là file mô tả thay đổi cấu trúc database theo từng phiên bản.

---

## 14. Xác thực và phân quyền

Sử dụng:

- Spring Security.
- JWT access token.
- Refresh token.
- Role-Based Access Control.
- Permission check tại backend.

Luồng:

```text
Mobile đăng nhập
→ Backend xác thực
→ Trả access token và refresh token
→ Mobile lưu token an toàn
→ Mobile gửi access token trong request
→ Backend kiểm tra token và quyền
→ Backend trả dữ liệu được phép
```

Quy tắc:

- Access token có thời hạn ngắn.
- Refresh token có thời hạn dài hơn.
- Refresh token có thể bị thu hồi.
- Mọi API nghiệp vụ phải kiểm tra quyền.
- Không tin role do mobile tự gửi.
- Không đưa mật khẩu hoặc token vào log.
- Token không được lưu trong source code.

Role-Based Access Control là cơ chế phân quyền dựa trên vai trò, ví dụ Nhân viên, Trưởng nhóm, Quản lý dự án và Quản trị viên.

---

## 15. Quản lý tệp

Phiên bản đầu hỗ trợ:

- Ảnh.
- PDF.
- Tài liệu văn phòng phổ biến khi cần.

Quy tắc:

- Kiểm tra MIME type.
- Kiểm tra phần mở rộng.
- Giới hạn dung lượng.
- Đổi tên file khi lưu.
- Không dùng trực tiếp tên file người dùng gửi.
- Kiểm tra quyền trước khi download.
- Chỉ lưu metadata trong database.
- Nội dung file được lưu trong file storage.

MIME type là giá trị mô tả loại nội dung của file, ví dụ `image/png` hoặc `application/pdf`.

---

## 16. Logging và Audit

Logging dùng cho:

- Lỗi hệ thống.
- Thời gian xử lý API.
- Thông tin vận hành.
- Trace request.

Audit dùng cho:

- Đăng nhập.
- Khoá tài khoản.
- Tạo hoặc cập nhật dự án.
- Thay đổi trạng thái công việc.
- Thay đổi trạng thái yêu cầu.
- Cấp phát tài sản.
- Hành động quản trị.

Không ghi vào log:

- Mật khẩu.
- Access token.
- Refresh token.
- Nội dung nhạy cảm không cần thiết.

Logging là ghi thông tin vận hành kỹ thuật.

Audit là ghi lại hành động nghiệp vụ để biết ai đã làm gì và vào thời điểm nào.

---

## 17. Kiểm thử

### 17.1. Backend

- Unit test cho Domain và Application Service.
- Integration test cho Repository.
- API test cho Controller.
- Security test cho quyền truy cập.
- Test luồng chuyển trạng thái.

### 17.2. Mobile

- Unit test cho hàm xử lý.
- Component test cho component quan trọng.
- Screen test cho luồng chính.
- Kiểm tra trạng thái loading, empty và error.
- Kiểm tra Navigation parameter.

### 17.3. End-to-End

Các luồng quan trọng cần kiểm thử:

- Đăng nhập.
- Tạo dự án.
- Tạo và phân công công việc.
- Cập nhật trạng thái công việc.
- Tạo yêu cầu dịch vụ.
- Đóng yêu cầu dịch vụ.
- Báo hỏng tài sản.
- Đọc thông báo.

End-to-End test là kiểm thử toàn bộ luồng từ giao diện, API đến database.

---

## 18. Cấu trúc repository

Sử dụng monorepo cho phiên bản bài tập lớn.

Monorepo là một repository chứa nhiều thành phần của cùng sản phẩm.

```text
WorkSphere/
├── docs/
├── mobile/
├── backend/
├── infrastructure/
├── scripts/
├── .github/
│   └── workflows/
├── .gitignore
├── docker-compose.yml
├── README.md
└── LICENSE
```

Ý nghĩa:

- `docs`: tài liệu dự án.
- `mobile`: ứng dụng React Native.
- `backend`: Spring Boot API.
- `infrastructure`: Docker, deployment và monitoring.
- `scripts`: script hỗ trợ phát triển.
- `.github/workflows`: CI/CD.
- `docker-compose.yml`: chạy môi trường local.

---

## 19. Môi trường hệ thống

Hệ thống có tối thiểu bốn môi trường.

### 19.1. Local

Dùng trên máy lập trình viên.

### 19.2. Test

Dùng cho kiểm thử tự động.

### 19.3. Staging

Dùng để kiểm thử gần giống production.

### 19.4. Production

Dùng cho phiên bản chính thức.

Cấu hình bí mật phải đi qua environment variable hoặc secret manager.

Không commit:

- Mật khẩu database.
- JWT secret.
- Token dịch vụ.
- File `.env` thật.
- Khoá riêng tư.

Environment variable là biến cấu hình nằm ngoài source code.

Secret manager là công cụ quản lý thông tin bí mật như mật khẩu và token.

---

## 20. Triển khai ban đầu

Giai đoạn đầu sử dụng Docker Compose để chạy:

- Backend.
- PostgreSQL.
- File storage nếu cần.
- Monitoring nếu được triển khai.

Kubernetes thuộc giai đoạn mở rộng của môn Triển khai phần mềm, không phải điều kiện để MVP mobile hoạt động.

Docker Compose là công cụ giúp chạy đồng thời nhiều container bằng một file cấu hình.

---

## 21. Quy tắc dependency

Trước khi cài một dependency mới phải:

1. Kiểm tra project đã có thư viện làm cùng chức năng chưa.
2. Kiểm tra tài liệu chính thức.
3. Kiểm tra thư viện còn được duy trì không.
4. Kiểm tra giấy phép.
5. Kiểm tra tương thích phiên bản.
6. Ghi lại lý do sử dụng.
7. Không cài nhiều thư viện trùng chức năng.

Không tự viết lại chức năng mà thư viện ổn định đã giải quyết tốt, trừ khi có yêu cầu học tập hoặc bảo mật rõ ràng.

Dependency là thư viện bên ngoài được dự án sử dụng.

---

## 22. Quy tắc dành cho AI Agent

Trước khi sửa code, AI Agent phải:

1. Đọc tài liệu trong thư mục `docs`.
2. Xác định module liên quan.
3. Tìm code hoặc dependency hiện có.
4. Không tạo chức năng trùng.
5. Không đổi API contract tuỳ ý.
6. Không đổi database nếu chưa có migration.
7. Không thêm dependency khi chưa kiểm tra.
8. Viết hoặc cập nhật test.
9. Nêu rõ file sẽ sửa.
10. Kiểm tra ảnh hưởng đến mobile, backend và deployment.
11. Không tự ý triển khai chức năng ngoài MVP.
12. Không đánh dấu hoàn thành khi chưa chạy kiểm thử.
13. Không sửa nhiều module không liên quan trong cùng một nhiệm vụ.
14. Không xoá code đang hoạt động nếu chưa có phương án thay thế.
15. Không tự ý đổi tên entity, API, bảng hoặc trạng thái nghiệp vụ.
16. Phải ưu tiên sử dụng giải pháp, package hoặc repository ổn định đã tồn tại thay vì tự viết lại từ đầu.
17. Khi dùng thuật ngữ chuyên ngành trong báo cáo phải có phần giải thích phù hợp.
18. Khi viết báo cáo cho từng môn phải nhấn mạnh đúng kiến thức của môn đó.
19. Không tạo dữ liệu giả mà không ghi rõ đó là dữ liệu thử nghiệm.
20. Không đưa mật khẩu, token hoặc secret vào source code, log hoặc báo cáo.

---

## 23. Các quyết định kiến trúc đã khóa

- Mobile: React Native và TypeScript.
- Backend: Java và Spring Boot.
- Database: PostgreSQL.
- API: REST API sử dụng JSON.
- Authentication: JWT và Refresh Token.
- Authorization: Role và Permission.
- Backend architecture: Modular Monolith.
- Mobile architecture: Feature-based structure.
- Repository: Monorepo.
- Local deployment: Docker Compose.
- Database migration: công cụ migration của backend.
- API documentation: OpenAPI hoặc Swagger.
- Source control: Git.
- Dependency mới phải được kiểm tra trước khi cài.
- Mobile không kết nối trực tiếp database.
- Backend là nơi kiểm tra quyền và quy tắc nghiệp vụ.
- Controller không truy cập Repository trực tiếp.
- Không trả JPA Entity trực tiếp qua API.
- Không triển khai microservice trong MVP.
- Không triển khai Kubernetes trước khi MVP hoạt động ổn định.

Mọi thay đổi đối với các quyết định trên phải được cập nhật trong tài liệu trước khi sửa code.




Giải thích thuật ngữ chính
Client-server: ứng dụng mobile là client gửi yêu cầu; backend là server xử lý dữ liệu.
Modular Monolith: một backend duy nhất nhưng được chia thành module có ranh giới rõ.
Domain: phần mô tả nghiệp vụ cốt lõi, ví dụ quy tắc chuyển trạng thái công việc.
Infrastructure: phần kết nối database, file storage hoặc hệ thống bên ngoài.
Monorepo: một Git repository chứa mobile, backend, tài liệu và triển khai.
Environment variable: giá trị cấu hình nằm ngoài source code, thường dùng cho mật khẩu hoặc secret.
DTO: object dùng để nhận hoặc trả dữ liệu qua API, tránh trả thẳng entity database.
Migration: file quản lý từng thay đổi của cấu trúc cơ sở dữ liệu.
Trace ID: mã truy vết một request xuyên suốt log hệ thống.