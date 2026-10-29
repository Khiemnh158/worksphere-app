# API CONTRACT WORKSPHERE

## 1. Mục đích

Tài liệu này là cam kết giao tiếp giữa ứng dụng mobile và backend WorkSphere.

Tài liệu xác định:

- Đường dẫn API.
- Phương thức HTTP.
- Quyền truy cập.
- Dữ liệu gửi lên.
- Dữ liệu trả về.
- Quy tắc phân trang.
- Quy tắc lọc và sắp xếp.
- Mã lỗi.
- Quy tắc xác thực.
- Quy tắc upload tệp.
- Quy tắc chống gửi yêu cầu trùng.

Mobile và backend phải tuân theo cùng tài liệu này.

Không tự ý:

- Đổi tên endpoint.
- Đổi tên field.
- Đổi kiểu dữ liệu.
- Thêm field bắt buộc.
- Đổi cấu trúc response.
- Đổi mã trạng thái nghiệp vụ.
- Trả JPA Entity trực tiếp.
- Bỏ kiểm tra quyền tại backend.

---

## 2. Quy ước chung

### 2.1. Base URL

Môi trường local:

```text
http://localhost:8080/api/v1
```

Android Emulator truy cập backend trên máy phát triển:

```text
http://10.0.2.2:8080/api/v1
```

Thiết bị thật trong cùng mạng nội bộ:

```text
http://<IP-máy-phát-triển>:8080/api/v1
```

Môi trường staging:

```text
https://staging-api.worksphere.example/api/v1
```

Môi trường production:

```text
https://api.worksphere.example/api/v1
```

Các tên miền `example` chỉ là placeholder và phải được thay bằng cấu hình thật khi triển khai.

### 2.2. Content Type

Request và response JSON sử dụng:

```http
Content-Type: application/json
Accept: application/json
```

Upload tệp sử dụng:

```http
Content-Type: multipart/form-data
```

### 2.3. Kiểu ngày giờ

Thời điểm sử dụng ISO-8601 và UTC:

```text
2026-09-28T08:30:00Z
```

Ngày không có thời gian:

```text
2026-09-28
```

Mobile chịu trách nhiệm chuyển thời gian UTC sang múi giờ thiết bị để hiển thị.

### 2.4. Định danh

Tất cả ID chính sử dụng UUID dưới dạng chuỗi:

```text
550e8400-e29b-41d4-a716-446655440000
```

### 2.5. Ngôn ngữ field

Tên field API sử dụng tiếng Anh và kiểu `camelCase`.

Ví dụ:

```text
fullName
createdAt
plannedEndDate
projectId
```

`camelCase` là cách viết từ đầu tiên bằng chữ thường và viết hoa chữ cái đầu của các từ tiếp theo.

---

## 3. Xác thực request

Các API bảo vệ phải có header:

```http
Authorization: Bearer <access-token>
```

Không truyền access token trong:

- Query parameter.
- Request body.
- URL.
- Log.
- Tên file.
- Local Storage không bảo mật.

Nếu access token hết hạn, backend trả:

```http
401 Unauthorized
```

với mã lỗi:

```text
ACCESS_TOKEN_EXPIRED
```

Mobile dùng refresh token để xin access token mới rồi thử lại request đúng một lần.

Nếu làm mới token thất bại, mobile xoá phiên và chuyển về màn hình đăng nhập.

---

## 4. Header chuẩn

### 4.1. Header request

```http
Authorization: Bearer <access-token>
Content-Type: application/json
Accept: application/json
X-Request-Id: <UUID>
X-Client-Version: 1.0.0
X-Platform: android
```

Trong đó:

- `X-Request-Id`: mã do client tạo để truy vết request.
- `X-Client-Version`: phiên bản ứng dụng mobile.
- `X-Platform`: `android` hoặc `ios`.

### 4.2. Header response

```http
X-Request-Id: <UUID>
X-Trace-Id: <trace-id>
```

`traceId` giúp tìm request trong log backend.

---

## 5. Cấu trúc response chuẩn

### 5.1. Response thành công đơn

```json
{
  "success": true,
  "data": {},
  "message": null,
  "timestamp": "2026-09-28T08:30:00Z",
  "traceId": "01J8TRACEEXAMPLE"
}
```

### 5.2. Response thành công không có dữ liệu

```json
{
  "success": true,
  "data": null,
  "message": "Thao tác thành công",
  "timestamp": "2026-09-28T08:30:00Z",
  "traceId": "01J8TRACEEXAMPLE"
}
```

### 5.3. Response danh sách phân trang

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 0,
    "size": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrevious": false
  },
  "message": null,
  "timestamp": "2026-09-28T08:30:00Z",
  "traceId": "01J8TRACEEXAMPLE"
}
```

### 5.4. Response lỗi

```json
{
  "success": false,
  "data": null,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "fieldErrors": {
    "email": "Email không đúng định dạng"
  },
  "timestamp": "2026-09-28T08:30:00Z",
  "traceId": "01J8TRACEEXAMPLE"
}
```

Không trả:

- Stack trace.
- Tên class nội bộ.
- Câu SQL.
- Password hash.
- Token.
- Secret.
- Đường dẫn file nội bộ.

---

## 6. HTTP Status Code

### 6.1. Thành công

```text
200 OK
201 Created
204 No Content
```

Sử dụng:

- `200`: đọc hoặc cập nhật thành công.
- `201`: tạo dữ liệu thành công.
- `204`: xoá hoặc thao tác thành công nhưng không cần body.

### 6.2. Lỗi phía client

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
413 Payload Too Large
415 Unsupported Media Type
422 Unprocessable Entity
429 Too Many Requests
```

Ý nghĩa:

- `400`: request sai định dạng.
- `401`: chưa xác thực hoặc token không hợp lệ.
- `403`: đã xác thực nhưng không có quyền.
- `404`: không tìm thấy dữ liệu hoặc không được phép biết dữ liệu tồn tại.
- `409`: xung đột dữ liệu.
- `413`: file hoặc request quá lớn.
- `415`: loại nội dung không hỗ trợ.
- `422`: request đúng cấu trúc nhưng vi phạm quy tắc nghiệp vụ.
- `429`: gửi quá nhiều request.

### 6.3. Lỗi phía server

```text
500 Internal Server Error
503 Service Unavailable
```

Không sử dụng `500` cho lỗi validation hoặc lỗi nghiệp vụ dự kiến.

---

## 7. Phân trang, tìm kiếm và sắp xếp

### 7.1. Query parameter chuẩn

```text
page=0
size=20
sort=createdAt,desc
search=keyword
```

### 7.2. Giới hạn

```text
page >= 0
1 <= size <= 100
```

### 7.3. Sắp xếp

Chỉ cho phép sắp xếp theo danh sách field được backend định nghĩa.

Không dùng trực tiếp tên field bất kỳ do client gửi vào câu SQL.

### 7.4. Tìm kiếm

Từ khoá tìm kiếm phải:

- Được trim.
- Có giới hạn độ dài.
- Không được nối trực tiếp vào SQL.
- Được xử lý bằng parameter binding.

---

## 8. AUTHENTICATION API

### 8.1. Đăng nhập

```http
POST /auth/login
```

Quyền:

```text
PUBLIC
```

Request:

```json
{
  "login": "user@example.com",
  "password": "UserPassword",
  "deviceName": "Samsung Galaxy A54"
}
```

Validation:

```text
login: bắt buộc, tối đa 255 ký tự
password: bắt buộc, từ 8 đến 128 ký tự
deviceName: không bắt buộc, tối đa 255 ký tự
```

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "accessToken": "access-token",
    "refreshToken": "refresh-token",
    "tokenType": "Bearer",
    "accessTokenExpiresIn": 900,
    "refreshTokenExpiresIn": 2592000,
    "user": {
      "id": "UUID",
      "username": "nvcuong",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn Cường",
      "avatarUrl": null,
      "department": {
        "id": "UUID",
        "name": "Phòng Công nghệ"
      },
      "roles": [
        "EMPLOYEE"
      ],
      "permissions": [
        "PROFILE_READ",
        "PROFILE_UPDATE",
        "PROJECT_READ",
        "TASK_READ"
      ]
    }
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

Lỗi có thể xảy ra:

```text
INVALID_CREDENTIALS
ACCOUNT_PENDING
ACCOUNT_LOCKED
ACCOUNT_DISABLED
RATE_LIMIT_EXCEEDED
```

Không cho biết email hay username có tồn tại hay không khi đăng nhập thất bại.

### 8.2. Làm mới access token

```http
POST /auth/refresh
```

Quyền:

```text
PUBLIC_WITH_REFRESH_TOKEN
```

Request:

```json
{
  "refreshToken": "refresh-token"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "tokenType": "Bearer",
    "accessTokenExpiresIn": 900,
    "refreshTokenExpiresIn": 2592000
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

Refresh token được xoay vòng. Token cũ bị thu hồi sau khi token mới được cấp.

Lỗi:

```text
REFRESH_TOKEN_INVALID
REFRESH_TOKEN_EXPIRED
REFRESH_TOKEN_REVOKED
SESSION_NOT_FOUND
ACCOUNT_LOCKED
ACCOUNT_DISABLED
```

### 8.3. Đăng xuất phiên hiện tại

```http
POST /auth/logout
```

Quyền:

```text
AUTHENTICATED
```

Request:

```json
{
  "refreshToken": "refresh-token"
}
```

Response:

```http
204 No Content
```

### 8.4. Đăng xuất tất cả thiết bị

```http
POST /auth/logout-all
```

Quyền:

```text
AUTHENTICATED
```

Response:

```http
204 No Content
```

### 8.5. Yêu cầu đặt lại mật khẩu

```http
POST /auth/forgot-password
```

Quyền:

```text
PUBLIC
```

Request:

```json
{
  "email": "user@example.com"
}
```

Response luôn không tiết lộ tài khoản có tồn tại:

```json
{
  "success": true,
  "data": null,
  "message": "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.",
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

### 8.6. Đặt lại mật khẩu

```http
POST /auth/reset-password
```

Request:

```json
{
  "resetToken": "reset-token",
  "newPassword": "NewSecurePassword",
  "confirmPassword": "NewSecurePassword"
}
```

Lỗi:

```text
RESET_TOKEN_INVALID
RESET_TOKEN_EXPIRED
PASSWORD_CONFIRMATION_MISMATCH
PASSWORD_POLICY_VIOLATION
```

---

## 9. PROFILE API

### 9.1. Lấy thông tin người dùng hiện tại

```http
GET /me
```

Quyền:

```text
AUTHENTICATED
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "UUID",
    "username": "nvcuong",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn Cường",
    "phoneNumber": "0900000000",
    "avatarUrl": null,
    "status": "ACTIVE",
    "department": {
      "id": "UUID",
      "code": "IT",
      "name": "Phòng Công nghệ"
    },
    "roles": [
      "EMPLOYEE"
    ],
    "permissions": [
      "PROFILE_READ",
      "PROFILE_UPDATE"
    ],
    "createdAt": "ISO-8601",
    "lastLoginAt": "ISO-8601"
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

### 9.2. Cập nhật hồ sơ

```http
PUT /me
```

Quyền:

```text
PROFILE_UPDATE
```

Request:

```json
{
  "fullName": "Nguyễn Văn Cường",
  "phoneNumber": "0900000000",
  "avatarFileId": "UUID"
}
```

Người dùng không được tự đổi:

- Username.
- Email nếu hệ thống chưa có quy trình xác minh.
- Department.
- Role.
- Permission.
- Status.

### 9.3. Đổi mật khẩu

```http
PUT /me/password
```

Quyền:

```text
AUTHENTICATED
```

Request:

```json
{
  "currentPassword": "CurrentPassword",
  "newPassword": "NewSecurePassword",
  "confirmPassword": "NewSecurePassword"
}
```

Lỗi:

```text
CURRENT_PASSWORD_INCORRECT
PASSWORD_CONFIRMATION_MISMATCH
PASSWORD_POLICY_VIOLATION
NEW_PASSWORD_SAME_AS_CURRENT
```

---

## 10. DASHBOARD API

### 10.1. Dashboard cá nhân

```http
GET /dashboard/me
```

Quyền:

```text
AUTHENTICATED
```

Quy tắc phân quyền và phạm vi dữ liệu:
- Endpoint luôn trả về Dashboard cá nhân cho mọi vai trò (kể cả `ADMIN`).
- `tasks`: Chỉ đếm các công việc đang có phân công hoạt động trực tiếp cho người dùng hiện tại qua bảng `task_assignments`: `EXISTS (SELECT 1 FROM task_assignments ta WHERE ta.task_id = t.id AND ta.assignee_id = :principalId AND ta.is_active = TRUE)` và `t.is_deleted = false`. Cả phần task summary và `upcomingTasks` đều sử dụng cùng phạm vi active assignment này. Không đếm toàn bộ công việc của dự án chỉ vì người dùng có vai trò PM hay Admin.
- `serviceRequests`: Đếm các yêu cầu dịch vụ do người dùng tạo (`sr.requester_id = :principalId`) HOẶC đang được phân công xử lý trực tiếp qua bảng `service_assignments`: `EXISTS (SELECT 1 FROM service_assignments sa WHERE sa.request_id = sr.id AND sa.assignee_id = :principalId AND sa.is_active = TRUE)` và `sr.is_deleted = false`. Sử dụng `COUNT(DISTINCT sr.id)` để tuyệt đối không đếm trùng lặp nếu người dùng vừa là người tạo vừa là người xử lý.
- `projects`: Chỉ đếm các dự án không bị xóa mềm (`p.is_deleted = false`) mà người dùng hiện tại đang là thành viên hoạt động (`EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = :principalId AND pm.is_active = TRUE)`). `ADMIN` tại `/dashboard/me` không bypass điều kiện thành viên này. Trạng thái dự án: `active` tương ứng `p.status = 'ACTIVE'`, `onHold` tương ứng `p.status = 'ON_HOLD'`.
- `recentNotifications`: Chỉ trả về thông báo gửi cho chính người dùng (`recipient_id = principal.userId`).
- Nếu cần Dashboard quản trị toàn hệ thống, tính năng sẽ được thiết kế ở endpoint riêng biệt và không đưa vào `/dashboard/me`.

Quy tắc thời gian (Time Policy):
- Sử dụng bean `java.time.Clock` được inject trong hệ thống; mọi tính toán dựa trên `Instant` UTC.
- `overdue`: `due_date < now` và `status NOT IN ('COMPLETED', 'CANCELLED')`.
- `dueSoon`: `now <= due_date < now + 72 hours` (ngưỡng 72 giờ tính từ thời điểm hiện tại) và `status NOT IN ('COMPLETED', 'CANCELLED')`.
- `overdue` và `dueSoon` là hai tập hợp không giao nhau (không đếm trùng).

Quy tắc Projection danh sách:
- `upcomingTasks`: Danh sách tối đa 5 công việc (Top 5) sắp đến hạn của người dùng, sử dụng cùng phạm vi active assignment như summary, chỉ lấy task thuộc nhóm `dueSoon` (`now <= due_date < now + 72 hours`), loại trừ task đã kết thúc (`status NOT IN ('COMPLETED', 'CANCELLED')`) và task đã xóa mềm (`is_deleted = false`), sắp xếp theo `dueDate ASC`, tie-breaker `id ASC`.
- `recentNotifications`: Danh sách tối đa 5 thông báo (Top 5) mới nhất của người dùng (`recipient_id = principal.userId`), sắp xếp theo `createdAt DESC`, tie-breaker `id DESC`.
- Khi không có dữ liệu, trả về mảng rỗng `[]`.

Response:

```json
{
  "success": true,
  "data": {
    "tasks": {
      "todo": 5,
      "inProgress": 3,
      "inReview": 1,
      "completed": 12,
      "overdue": 2,
      "dueSoon": 3
    },
    "serviceRequests": {
      "open": 2,
      "inProgress": 1,
      "waitingForUser": 0,
      "resolved": 3
    },
    "projects": {
      "active": 3,
      "onHold": 1
    },
    "upcomingTasks": [
      {
        "id": "UUID",
        "projectId": "UUID",
        "projectName": "WorkSphere Mobile App",
        "title": "Hoàn thiện màn hình Dashboard",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "dueDate": "2026-10-18T17:00:00Z"
      }
    ],
    "recentNotifications": [
      {
        "id": "UUID",
        "type": "TASK_ASSIGNED",
        "title": "Bạn được giao công việc mới",
        "message": "Xây dựng màn hình đăng nhập",
        "referenceType": "TASK",
        "referenceId": "UUID",
        "read": false,
        "createdAt": "2026-10-16T14:30:00Z"
      }
    ]
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

### 10.2. Dashboard dự án

```http
GET /projects/{projectId}/dashboard
```

Quyền:

```text
PROJECT_READ
```

Điều kiện:

- Người dùng là thành viên dự án.
- Hoặc có quyền quản trị phù hợp.

Trạng thái triển khai:

```text
PROJECT_DASHBOARD_PROJECTION_DEFERRED
```

- Endpoint này được giữ làm placeholder contract và hoãn triển khai trong Phase 11.
- Phase 11 tập trung hoàn thiện Personal Dashboard (`GET /dashboard/me`). Không tạo controller stub hay trả payload giả lập trong Phase 11.

---

## 11. PROJECT API

### 11.1. Lấy danh sách dự án

```http
GET /projects
```

Quyền:

```text
PROJECT_READ
```

Query parameter:

```text
page
size
sort
search
status
priority
managerId
departmentId
```

Response item:

```json
{
  "id": "UUID",
  "code": "WS-2026-001",
  "name": "WorkSphere Implementation",
  "description": "Triển khai nền tảng WorkSphere",
  "status": "ACTIVE",
  "priority": "HIGH",
  "manager": {
    "id": "UUID",
    "fullName": "Nguyễn Văn A",
    "avatarUrl": null
  },
  "startDate": "2026-09-01",
  "plannedEndDate": "2026-12-31",
  "progressPercent": 42.5,
  "memberCount": 6,
  "taskSummary": {
    "total": 30,
    "completed": 12,
    "overdue": 2
  },
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

Backend chỉ trả dự án người dùng được phép xem.

### 11.2. Tạo dự án

```http
POST /projects
```

Quyền:

```text
PROJECT_CREATE
```

Request:

```json
{
  "code": "WS-2026-001",
  "name": "WorkSphere Implementation",
  "description": "Triển khai nền tảng WorkSphere",
  "priority": "HIGH",
  "startDate": "2026-09-01",
  "plannedEndDate": "2026-12-31",
  "departmentId": "UUID",
  "initialMemberIds": [
    "UUID",
    "UUID"
  ]
}
```

Validation:

```text
code: bắt buộc, 3 đến 50 ký tự
name: bắt buộc, 3 đến 200 ký tự
description: tối đa theo giới hạn backend
plannedEndDate không nhỏ hơn startDate
initialMemberIds không được trùng
```

Response `201 Created` trả Project Detail.

Lỗi:

```text
PROJECT_CODE_ALREADY_EXISTS
PROJECT_DATE_RANGE_INVALID
PROJECT_MEMBER_INVALID
DEPARTMENT_NOT_FOUND
```

#### Trạng thái khởi tạo

Project mới được tạo ở trạng thái:

```text
DRAFT
```

Quy tắc:

- Client không được tự chọn trạng thái khởi tạo trong request tạo Project.
- Request `POST /projects` không chứa field `status`.
- Backend luôn gán trạng thái `DRAFT` cho Project mới.
- Project `DRAFT` chưa được coi là đang triển khai.
- Response tạo Project phải trả trạng thái `DRAFT`.
- Mobile phải hiển thị trạng thái do backend trả về.
- Mobile không được tự đổi `DRAFT` thành `ACTIVE`.
- Project chỉ được chuyển sang `ACTIVE` thông qua endpoint cập nhật trạng thái.
- Không tạo Task nghiệp vụ chính thức trong Project `DRAFT` nếu nghiệp vụ yêu cầu Project phải hoạt động.

### 11.3. Chi tiết dự án

```http
GET /projects/{projectId}
```

Quyền:

```text
PROJECT_READ
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "UUID",
    "code": "WS-2026-001",
    "name": "WorkSphere Implementation",
    "description": "Triển khai nền tảng WorkSphere",
    "status": "ACTIVE",
    "priority": "HIGH",
    "manager": {
      "id": "UUID",
      "fullName": "Nguyễn Văn A",
      "avatarUrl": null
    },
    "department": {
      "id": "UUID",
      "code": "IT",
      "name": "Phòng Công nghệ"
    },
    "startDate": "2026-09-01",
    "plannedEndDate": "2026-12-31",
    "actualEndDate": null,
    "progressPercent": 42.5,
    "memberCount": 6,
    "milestones": [],
    "recentTasks": [],
    "allowedActions": [
      "UPDATE",
      "MANAGE_MEMBERS",
      "CREATE_TASK"
    ],
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601",
    "version": 1
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

`allowedActions` hỗ trợ mobile hiển thị đúng thao tác, nhưng backend vẫn phải kiểm tra quyền khi request được gửi.

### 11.4. Cập nhật dự án

```http
PUT /projects/{projectId}
```

Quyền:

```text
PROJECT_UPDATE
```

Request:

```json
{
  "name": "WorkSphere Enterprise",
  "description": "Mô tả cập nhật",
  "priority": "CRITICAL",
  "startDate": "2026-09-01",
  "plannedEndDate": "2027-01-15",
  "version": 1
}
```

Nếu version cũ, trả:

```http
409 Conflict
```

Mã lỗi:

```text
OPTIMISTIC_LOCK_CONFLICT
```

### 11.5. Thay đổi trạng thái dự án

```http
PUT /projects/{projectId}/status
```

Quyền:

```text
PROJECT_UPDATE
```

Request:

```json
{
  "status": "ON_HOLD",
  "reason": "Chờ phê duyệt ngân sách",
  "version": 2
}
```

Backend phải kiểm tra workflow trạng thái.

Lỗi:

```text
PROJECT_STATUS_TRANSITION_INVALID
PROJECT_ALREADY_COMPLETED
PROJECT_ALREADY_CANCELLED
```

#### Kích hoạt Project

Chuyển trạng thái hợp lệ:

```text
DRAFT
→ ACTIVE
```

Quyền:

```text
PROJECT_UPDATE
```

Điều kiện:

- Project hiện tại phải ở trạng thái `DRAFT`.
- Người gọi phải có quyền `PROJECT_UPDATE`.
- Người gọi phải có Project Membership và Project Role phù hợp.
- Request phải gửi `version` hiện tại.
- Project phải có dữ liệu bắt buộc hợp lệ trước khi kích hoạt.
- Backend phải kiểm tra Optimistic Locking.
- Backend phải ghi Project Status History.

Request minh họa:

```json
{
  "status": "ACTIVE",
  "reason": "Dự án đã đủ điều kiện bắt đầu",
  "version": 1
}
```

Response:

```text
200 OK
```

Response trả Project Detail đã cập nhật với trạng thái `ACTIVE`.

Mã lỗi:

```text
PROJECT_NOT_DRAFT
PROJECT_ACTIVATION_FORBIDDEN
OPTIMISTIC_LOCK_CONFLICT
```

Quy tắc:

- Không được chuyển Project trực tiếp từ `DRAFT` sang `COMPLETED`.
- Không được chuyển Project trực tiếp từ `DRAFT` sang `ON_HOLD`.
- Không được bỏ qua Project Status History.
- Mobile chỉ hiển thị thao tác kích hoạt khi permission hoặc `allowedActions` cho phép.
- Mobile không tự chuyển trạng thái trước khi API thành công.
- Backend là nơi quyết định chuyển trạng thái cuối cùng.

### 11.6. Danh sách thành viên dự án

```http
GET /projects/{projectId}/members
```

Quyền:

```text
PROJECT_READ
```

Query:

```text
page
size
search
role
active
```

### 11.7. Thêm thành viên dự án

```http
POST /projects/{projectId}/members
```

Quyền:

```text
PROJECT_MEMBER_MANAGE
```

Request:

```json
{
  "userId": "UUID",
  "projectRole": "MEMBER"
}
```

Lỗi:

```text
PROJECT_MEMBER_ALREADY_EXISTS
USER_NOT_ACTIVE
PROJECT_NOT_ACTIVE
```

### 11.8. Cập nhật vai trò thành viên

```http
PUT /projects/{projectId}/members/{memberId}
```

Request:

```json
{
  "projectRole": "TEAM_LEADER"
}
```

### 11.9. Xoá thành viên dự án

```http
DELETE /projects/{projectId}/members/{memberId}
```

Quyền:

```text
PROJECT_MEMBER_MANAGE
```

Không cho xoá Project Manager cuối cùng của dự án.

Lỗi:

```text
PROJECT_MANAGER_REQUIRED
PROJECT_MEMBER_HAS_ACTIVE_ASSIGNMENTS
```

### 11.10. Tạo milestone

```http
POST /projects/{projectId}/milestones
```

Quyền:

```text
PROJECT_UPDATE
```

Request:

```json
{
  "name": "Hoàn thành MVP",
  "description": "Hoàn thành các chức năng MVP",
  "dueDate": "2026-11-30"
}
```

### 11.11. Danh sách milestone

```http
GET /projects/{projectId}/milestones
```

Quyền:

```text
PROJECT_READ
```

---

## 12. TASK API

### 12.1. Danh sách công việc

```http
GET /tasks
```

Quyền:

```text
TASK_READ
```

Query:

```text
page
size
sort
search
projectId
parentTaskId
assigneeId
reporterId
status
priority
overdue
dueFrom
dueTo
```

Response item:

```json
{
  "id": "UUID",
  "project": {
    "id": "UUID",
    "code": "WS-2026-001",
    "name": "WorkSphere Implementation"
  },
  "parentTaskId": null,
  "title": "Xây dựng màn hình đăng nhập",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "progressPercent": 50,
  "assignees": [
    {
      "id": "UUID",
      "fullName": "Nguyễn Văn B",
      "avatarUrl": null
    }
  ],
  "reporter": {
    "id": "UUID",
    "fullName": "Nguyễn Văn A"
  },
  "dueDate": "ISO-8601",
  "overdue": false,
  "subtaskCount": 3,
  "completedSubtaskCount": 1,
  "commentCount": 4,
  "attachmentCount": 2,
  "updatedAt": "ISO-8601"
}
```

### 12.2. Tạo công việc

```http
POST /tasks
```

Quyền:

```text
TASK_CREATE
```

Request:

```json
{
  "projectId": "UUID",
  "parentTaskId": null,
  "milestoneId": "UUID",
  "title": "Xây dựng màn hình đăng nhập",
  "description": "Tạo giao diện và kết nối API đăng nhập",
  "priority": "HIGH",
  "assigneeIds": [
    "UUID"
  ],
  "startDate": "2026-09-28",
  "dueDate": "2026-10-05T17:00:00Z",
  "estimatedMinutes": 960
}
```

Lỗi:

```text
TASK_PROJECT_NOT_ACTIVE
TASK_ASSIGNEE_NOT_PROJECT_MEMBER
TASK_PARENT_PROJECT_MISMATCH
TASK_PARENT_CYCLE_DETECTED
TASK_DATE_RANGE_INVALID
```

### 12.3. Chi tiết công việc

```http
GET /tasks/{taskId}
```

Quyền:

```text
TASK_READ
```

Response gồm:

- Thông tin task.
- Project cơ bản.
- Người tạo.
- Người được giao.
- Subtask.
- Bình luận gần đây.
- Tệp đính kèm.
- Lịch sử trạng thái.
- Allowed actions.
- Version.

### 12.4. Cập nhật công việc

```http
PUT /tasks/{taskId}
```

Quyền:

```text
TASK_UPDATE
```

Request:

```json
{
  "title": "Xây dựng và kiểm thử màn hình đăng nhập",
  "description": "Giao diện, validation và API",
  "priority": "HIGH",
  "startDate": "2026-09-28",
  "dueDate": "2026-10-06T17:00:00Z",
  "estimatedMinutes": 1200,
  "version": 2
}
```

### 12.5. Cập nhật trạng thái công việc

```http
PUT /tasks/{taskId}/status
```

Quyền:

```text
TASK_UPDATE_STATUS
```

Request:

```json
{
  "status": "IN_REVIEW",
  "comment": "Đã hoàn thành và gửi kiểm tra",
  "version": 3
}
```

Backend phải kiểm tra:

- Người gọi có quyền.
- Trạng thái chuyển hợp lệ.
- Người gọi có liên quan tới công việc.
- Task chưa bị xoá hoặc huỷ.

### 12.6. Cập nhật tiến độ

```http
PUT /tasks/{taskId}/progress
```

Quyền:

```text
TASK_UPDATE
```

Request:

```json
{
  "progressPercent": 75,
  "version": 4
}
```

Quy tắc:

- Progress từ 0 đến 100.
- Task hoàn thành phải là 100.
- Task huỷ không cập nhật progress.

### 12.7. Phân công người thực hiện

```http
POST /tasks/{taskId}/assignments
```

Quyền:

```text
TASK_ASSIGN
```

Request:

```json
{
  "assigneeIds": [
    "UUID",
    "UUID"
  ]
}
```

### 12.8. Gỡ phân công

```http
DELETE /tasks/{taskId}/assignments/{assignmentId}
```

Quyền:

```text
TASK_ASSIGN
```

### 12.9. Xoá công việc

```http
DELETE /tasks/{taskId}
```

Quyền:

```text
TASK_DELETE
```

Thực hiện Soft Delete.

Không cho xoá task đã có lịch sử nghiệp vụ quan trọng nếu quy tắc yêu cầu chỉ huỷ trạng thái.

### 12.10. Lấy danh sách công việc con

```http
GET /tasks/{taskId}/subtasks
```

### 12.11. Tạo công việc con

```http
POST /tasks/{taskId}/subtasks
```

Request tương tự tạo task nhưng không cần truyền `parentTaskId`.

### 12.12. Danh sách bình luận công việc

```http
GET /tasks/{taskId}/comments
```

Query:

```text
page
size
sort=createdAt,asc
```

### 12.13. Thêm bình luận công việc

```http
POST /tasks/{taskId}/comments
```

Request:

```json
{
  "content": "Đã hoàn thành phần giao diện.",
  "parentCommentId": null,
  "attachmentFileIds": [
    "UUID"
  ]
}
```

### 12.14. Chỉnh sửa bình luận

```http
PUT /tasks/{taskId}/comments/{commentId}
```

Chỉ tác giả hoặc quản trị viên phù hợp được sửa.

### 12.15. Xoá bình luận

```http
DELETE /tasks/{taskId}/comments/{commentId}
```

Thực hiện Soft Delete nội dung bình luận.

---

## 13. SERVICE REQUEST API

### 13.1. Danh sách danh mục dịch vụ

```http
GET /service-categories
```

Quyền:

```text
AUTHENTICATED
```

Chỉ trả danh mục đang hoạt động.

#### 13.1.1. Danh sách toàn bộ danh mục dịch vụ dành cho quản trị

```http
GET /admin/service-categories
```

Quyền:

```text
SERVICE_CATEGORY_MANAGE
```

Query parameter:

```text
page
size
search
active
parentId
sort
```

Quy tắc:

- API hỗ trợ phân trang.
- Có thể lọc theo trạng thái hoạt động.
- Có thể lọc theo danh mục cha.
- Người dùng thông thường vẫn chỉ sử dụng `GET /service-categories`.
- API thông thường chỉ trả danh mục đang hoạt động.
- API quản trị có thể trả cả danh mục đang hoạt động và đã dừng hoạt động.

#### 13.1.2. Tạo danh mục dịch vụ

```http
POST /admin/service-categories
```

Quyền:

```text
SERVICE_CATEGORY_MANAGE
```

Request:

```json
{
  "parentId": null,
  "code": "IT_SUPPORT",
  "name": "Hỗ trợ công nghệ thông tin",
  "description": "Các yêu cầu hỗ trợ kỹ thuật",
  "defaultPriority": "MEDIUM",
  "active": true
}
```

Validation:

```text
code: bắt buộc, từ 2 đến 50 ký tự
code: chỉ chứa chữ hoa, chữ số và dấu gạch dưới
code: duy nhất trong hệ thống
name: bắt buộc, tối đa 150 ký tự
description: không bắt buộc, tối đa 500 ký tự
defaultPriority: LOW, MEDIUM, HIGH hoặc CRITICAL
parentId: nếu có thì danh mục cha phải tồn tại
parentId: không được tạo chu trình danh mục
```

Response:

```text
201 Created
```

#### 13.1.3. Chi tiết danh mục dịch vụ dành cho quản trị

```http
GET /admin/service-categories/{categoryId}
```

Quyền:

```text
SERVICE_CATEGORY_MANAGE
```

Response tối thiểu:

```json
{
  "id": "UUID",
  "parentId": null,
  "code": "IT_SUPPORT",
  "name": "Hỗ trợ công nghệ thông tin",
  "description": "Các yêu cầu hỗ trợ kỹ thuật",
  "defaultPriority": "MEDIUM",
  "active": true,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "version": 1
}
```

#### 13.1.4. Cập nhật danh mục dịch vụ

```http
PUT /admin/service-categories/{categoryId}
```

Quyền:

```text
SERVICE_CATEGORY_MANAGE
```

Request:

```json
{
  "parentId": null,
  "name": "Hỗ trợ CNTT",
  "description": "Mô tả cập nhật",
  "defaultPriority": "HIGH",
  "active": true,
  "version": 1
}
```

Quy tắc:

- Không cho phép thay đổi `code` qua endpoint cập nhật.
- Phải kiểm tra Optimistic Locking bằng `version`.
- Không cho phép danh mục làm cha của chính nó.
- Không cho phép tạo chu trình trong cây danh mục.

Response:

```text
200 OK
```

#### 13.1.5. Dừng hoạt động danh mục dịch vụ

```http
PUT /admin/service-categories/{categoryId}/deactivate
```

Quyền:

```text
SERVICE_CATEGORY_MANAGE
```

Quy tắc:

- Không xoá vật lý danh mục.
- Danh mục đã được sử dụng vẫn được giữ để truy vết.
- Danh mục đã dừng hoạt động không xuất hiện trong danh sách dành cho người dùng thông thường.

Response:

```text
200 OK
```

#### 13.1.6. Kích hoạt lại danh mục dịch vụ

```http
PUT /admin/service-categories/{categoryId}/activate
```

Quyền:

```text
SERVICE_CATEGORY_MANAGE
```

Quy tắc:

- Chỉ kích hoạt lại danh mục đang không hoạt động.
- Danh mục cha, nếu có, phải tồn tại.

Response:

```text
200 OK
```

### 13.2. Danh sách yêu cầu dịch vụ

```http
GET /service-requests
```

Quyền:

```text
SERVICE_REQUEST_READ
```

Query:

```text
page
size
sort
search
categoryId
requesterId
assigneeId
assetId
status
priority
createdFrom
createdTo
```

Người dùng thông thường chỉ xem:

- Yêu cầu do bản thân tạo.
- Yêu cầu được phân công xử lý.
- Yêu cầu được quyền quản lý.

### 13.3. Tạo yêu cầu dịch vụ

```http
POST /service-requests
```

Quyền:

```text
SERVICE_REQUEST_CREATE
```

Request:

```json
{
  "categoryId": "UUID",
  "title": "Máy tính không kết nối được mạng",
  "description": "Thiết bị mất kết nối từ sáng nay.",
  "priority": "HIGH",
  "assetId": "UUID",
  "attachmentFileIds": [
    "UUID"
  ]
}
```

Response `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": "UUID",
    "requestNumber": "SR-2026-000001",
    "status": "OPEN"
  },
  "message": "Yêu cầu đã được tạo",
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

Số yêu cầu được backend tự sinh.

### 13.4. Chi tiết yêu cầu

```http
GET /service-requests/{requestId}
```

Response gồm:

- Thông tin yêu cầu.
- Người tạo.
- Người xử lý.
- Danh mục.
- Tài sản liên quan.
- Bình luận gần đây.
- Tệp đính kèm.
- Lịch sử.
- Rating nếu có.
- Allowed actions.
- Version.

### 13.5. Cập nhật yêu cầu

```http
PUT /service-requests/{requestId}
```

Quyền:

```text
SERVICE_REQUEST_UPDATE
```

Người tạo chỉ được cập nhật khi trạng thái cho phép.

### 13.6. Phân công người xử lý

```http
POST /service-requests/{requestId}/assignments
```

Quyền:

```text
SERVICE_REQUEST_ASSIGN
```

Request:

```json
{
  "assigneeId": "UUID"
}
```

Lỗi:

```text
SERVICE_REQUEST_NOT_FOUND
USER_NOT_FOUND
USER_INACTIVE
SERVICE_ASSIGNMENT_CONFLICT
```

Trường hợp lỗi `SERVICE_ASSIGNMENT_CONFLICT` (HTTP `409 Conflict`):
- Thông điệp: "Yêu cầu dịch vụ đang được phân công đồng thời hoặc trạng thái phân công đã thay đổi. Vui lòng tải lại dữ liệu và thử lại."
- Phát sinh khi:
  - Partial unique index `uk_service_assignments_one_active` bị vi phạm.
  - Hoặc transaction phát hiện assignment state đã thay đổi trong lúc phân công.
- Không dùng khi:
  - Assignee không tồn tại (`USER_NOT_FOUND`).
  - Assignee inactive (`USER_INACTIVE`).
  - Actor thiếu quyền (`ACCESS_DENIED` / `FORBIDDEN`).
  - Request không tồn tại (`SERVICE_REQUEST_NOT_FOUND`).
  - ServiceRequest version mismatch (vẫn sử dụng `OPTIMISTIC_LOCK_CONFLICT`).

### 13.7. Cập nhật trạng thái yêu cầu

```http
PUT /service-requests/{requestId}/status
```

Quyền:

```text
SERVICE_REQUEST_UPDATE_STATUS
```

Request:

```json
{
  "status": "RESOLVED",
  "comment": "Đã cấu hình lại kết nối mạng.",
  "version": 3
}
```

Lỗi:

```text
SERVICE_STATUS_TRANSITION_INVALID
SERVICE_ASSIGNEE_REQUIRED
SERVICE_RESOLUTION_REQUIRED
SERVICE_ALREADY_CLOSED
```

Backend phải làm rõ rằng endpoint:

```http
PUT /service-requests/{requestId}/status
```

chỉ dành cho người xử lý hoặc người có quyền `SERVICE_REQUEST_UPDATE_STATUS`.

Người tạo yêu cầu không sử dụng endpoint cập nhật trạng thái chung để từ chối kết quả xử lý.

#### 13.7.1. Từ chối kết quả xử lý

```http
POST /service-requests/{requestId}/reject-resolution
```

Quyền:

```text
AUTHENTICATED
```

Điều kiện quyền truy cập:

- Người gọi phải là chính `requester` của yêu cầu.
- Backend phải kiểm tra Resource Ownership.
- Người xử lý không sử dụng endpoint này để tự mở lại yêu cầu.

Request:

```json
{
  "reason": "Sự cố vẫn còn xảy ra",
  "version": 3
}
```

Validation:

```text
reason: bắt buộc
reason: sau khi trim không được rỗng
reason: tối đa 1000 ký tự
version: bắt buộc
```

Điều kiện nghiệp vụ:

- Yêu cầu phải đang ở trạng thái `RESOLVED`.
- Yêu cầu chưa ở trạng thái `CLOSED`.
- Yêu cầu chưa ở trạng thái `CANCELLED`.
- Người gọi phải là người tạo yêu cầu.
- `version` phải khớp dữ liệu hiện tại.

Hành vi:

```text
RESOLVED
→ IN_PROGRESS
```

Backend phải:

- Ghi `service_status_histories`.
- Lưu `reason` trong lịch sử chuyển trạng thái.
- Không tạo Service Request mới.
- Gửi thông báo cho người xử lý đang hoạt động.
- Cập nhật `updatedAt`, `updatedBy` và `version`.

Response:

```text
200 OK
```

Response trả Service Request Detail đã cập nhật.

Mã lỗi:

```text
SERVICE_RESOLUTION_REJECTION_FORBIDDEN
SERVICE_NOT_RESOLVED
SERVICE_ALREADY_CLOSED
SERVICE_ALREADY_CANCELLED
OPTIMISTIC_LOCK_CONFLICT
```

### 13.8. Danh sách bình luận

```http
GET /service-requests/{requestId}/comments
```

### 13.9. Thêm bình luận

```http
POST /service-requests/{requestId}/comments
```

Request:

```json
{
  "content": "Vấn đề vẫn còn xảy ra.",
  "attachmentFileIds": [
    "UUID"
  ]
}
```

Mobile không được gửi giá trị `isInternal=true` nếu không có quyền.

### 13.10. Đánh giá dịch vụ

```http
POST /service-requests/{requestId}/rating
```

Quyền:

```text
Người tạo yêu cầu
```

Request:

```json
{
  "score": 5,
  "comment": "Xử lý nhanh và rõ ràng."
}
```

Lỗi:

```text
SERVICE_NOT_CLOSED
SERVICE_RATING_ALREADY_EXISTS
SERVICE_RATING_FORBIDDEN
```

---

## 14. ASSET API

### 14.0.1. Danh sách loại tài sản đang hoạt động

```http
GET /asset-categories
```

Quyền:

```text
AUTHENTICATED
```

Query parameter:

```text
search
active
```

Quy tắc:

- Mặc định chỉ trả loại tài sản đang hoạt động.
- API phục vụ dropdown tạo tài sản và bộ lọc danh sách tài sản.
- Không bắt buộc phân trang trong MVP nếu số lượng danh mục nhỏ.

### 14.0.2. Danh sách quản trị loại tài sản

```http
GET /admin/asset-categories
```

Quyền:

```text
ASSET_CATEGORY_MANAGE
```

Query parameter:

```text
page
size
search
active
sort
```

### 14.0.3. Tạo loại tài sản

```http
POST /admin/asset-categories
```

Quyền:

```text
ASSET_CATEGORY_MANAGE
```

Request:

```json
{
  "code": "LAPTOP",
  "name": "Máy tính xách tay",
  "description": "Thiết bị máy tính xách tay",
  "active": true
}
```

Validation:

```text
code: bắt buộc, từ 2 đến 50 ký tự
code: chỉ chứa chữ hoa, chữ số và dấu gạch dưới
code: duy nhất trong hệ thống
name: bắt buộc, tối đa 150 ký tự
description: không bắt buộc, tối đa 500 ký tự
```

Response:

```text
201 Created
```

### 14.0.4. Chi tiết loại tài sản dành cho quản trị

```http
GET /admin/asset-categories/{categoryId}
```

Quyền:

```text
ASSET_CATEGORY_MANAGE
```

Response tối thiểu:

```json
{
  "id": "UUID",
  "code": "LAPTOP",
  "name": "Máy tính xách tay",
  "description": "Thiết bị máy tính xách tay",
  "active": true,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "version": 1
}
```

### 14.0.5. Cập nhật loại tài sản

```http
PUT /admin/asset-categories/{categoryId}
```

Quyền:

```text
ASSET_CATEGORY_MANAGE
```

Request:

```json
{
  "name": "Máy tính xách tay",
  "description": "Mô tả cập nhật",
  "active": true,
  "version": 1
}
```

Quy tắc:

- Không cho phép đổi `code` qua endpoint cập nhật.
- Phải kiểm tra Optimistic Locking bằng `version`.

Response:

```text
200 OK
```

### 14.0.6. Dừng hoạt động loại tài sản

```http
PUT /admin/asset-categories/{categoryId}/deactivate
```

Quyền:

```text
ASSET_CATEGORY_MANAGE
```

Quy tắc:

- Không xoá vật lý loại tài sản.
- Không cho phép dừng hoạt động (`deactivate`) nếu tồn tại bất kỳ tài sản nào chưa bị xóa mềm (`is_deleted = false`) đang tham chiếu đến loại tài sản này (`ASSET_CATEGORY_IN_USE`, HTTP 400).
- Tài sản ở trạng thái `RETIRED` vẫn là dữ liệu chưa xóa mềm và vẫn được tính là đang sử dụng (in-use).
- Loại tài sản đã dừng hoạt động (`active = false`) vẫn được hiển thị đầy đủ thông tin trong lịch sử và chi tiết tài sản đã tạo trước đó.
- Loại tài sản đã dừng hoạt động không xuất hiện trong dropdown thông thường và không được chọn để tạo mới hoặc cập nhật tài sản khác (`ASSET_CATEGORY_ALREADY_INACTIVE`, HTTP 400).

Response:

```text
200 OK
```

### 14.0.7. Kích hoạt lại loại tài sản

```http
PUT /admin/asset-categories/{categoryId}/activate
```

Quyền:

```text
ASSET_CATEGORY_MANAGE
```

Response:

```text
200 OK
```

### 14.1. Danh sách tài sản

```http
GET /assets
```

Quyền:

```text
ASSET_READ
```

Query:

```text
page
size
sort
search
categoryId
status
assignedTo
```

Người dùng thông thường chỉ xem tài sản được cấp cho bản thân.

### 14.2. Tài sản của tôi

```http
GET /assets/my-assets
```

Quyền:

```text
AUTHENTICATED
```

### 14.3. Chi tiết tài sản

```http
GET /assets/{assetId}
```

Quyền:

```text
ASSET_READ
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "UUID",
    "assetCode": "LAP-00001",
    "name": "Laptop Dell Latitude",
    "category": {
      "id": "UUID",
      "code": "LAPTOP",
      "name": "Máy tính xách tay"
    },
    "serialNumber": "SERIAL-EXAMPLE",
    "manufacturer": "Dell",
    "model": "Latitude",
    "status": "ASSIGNED",
    "location": "Văn phòng",
    "warrantyEndDate": "2028-09-30",
    "currentAssignment": {
      "assignedTo": {
        "id": "UUID",
        "fullName": "Nguyễn Văn Cường"
      },
      "assignedAt": "ISO-8601"
    },
    "repairHistories": [],
    "relatedServiceRequests": [],
    "version": 1
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

### 14.4. Tạo tài sản

```http
POST /assets
```

Quyền:

```text
ASSET_MANAGE
```

Request:

```json
{
  "assetCode": "LAP-00001",
  "categoryId": "UUID",
  "name": "Laptop Dell Latitude 5420",
  "description": "Thiết bị cấp phát cho kỹ sư phần mềm",
  "serialNumber": "SN-DELL-987654",
  "manufacturer": "Dell",
  "model": "Latitude 5420",
  "purchaseDate": "2026-01-15",
  "purchasePrice": 25000000.00,
  "warrantyEndDate": "2029-01-15",
  "location": "Văn phòng Tầng 3"
}
```

Validation:

```text
assetCode: bắt buộc, từ 2 đến 50 ký tự, định dạng ^[A-Z0-9][A-Z0-9_-]{1,49}$, duy nhất toàn hệ thống
categoryId: bắt buộc, UUID của loại tài sản đang hoạt động (is_active = true)
name: bắt buộc, tối đa 200 ký tự
description: không bắt buộc, text
serialNumber: không bắt buộc, tối đa 150 ký tự, duy nhất trong hệ thống khi có giá trị
manufacturer: không bắt buộc, tối đa 150 ký tự
model: không bắt buộc, tối đa 150 ký tự
purchaseDate: không bắt buộc, định dạng YYYY-MM-DD
purchasePrice: không bắt buộc, số thực lớn hơn hoặc bằng 0
warrantyEndDate: không bắt buộc, định dạng YYYY-MM-DD
location: không bắt buộc, tối đa 255 ký tự
```

Quy tắc nghiệp vụ:

- Trạng thái khởi tạo của tài sản mới luôn mặc định là `AVAILABLE`.
- Client không được phép tự chỉ định trạng thái khác hoặc gán người nhận trong request tạo mới.
- Việc phân công tài sản cho người dùng bắt buộc thực hiện độc lập qua endpoint `POST /assets/{assetId}/assignments`.

Response:

```text
201 Created
```

```json
{
  "success": true,
  "data": {
    "id": "UUID",
    "assetCode": "LAP-00001",
    "name": "Laptop Dell Latitude 5420",
    "category": {
      "id": "UUID",
      "code": "LAPTOP",
      "name": "Máy tính xách tay"
    },
    "serialNumber": "SN-DELL-987654",
    "manufacturer": "Dell",
    "model": "Latitude 5420",
    "status": "AVAILABLE",
    "location": "Văn phòng Tầng 3",
    "warrantyEndDate": "2029-01-15",
    "currentAssignment": null,
    "repairHistories": [],
    "relatedServiceRequests": [],
    "version": 0
  },
  "message": "Tạo tài sản thành công",
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

### 14.5. Cập nhật tài sản

```http
PUT /assets/{assetId}
```

Quyền:

```text
ASSET_MANAGE
```

Request:

```json
{
  "categoryId": "UUID",
  "name": "Laptop Dell Latitude 5420 (Cập nhật)",
  "description": "Đã nâng cấp RAM lên 32GB",
  "serialNumber": "SN-DELL-987654",
  "manufacturer": "Dell",
  "model": "Latitude 5420",
  "purchaseDate": "2026-01-15",
  "purchasePrice": 27000000.00,
  "warrantyEndDate": "2029-01-15",
  "status": "AVAILABLE",
  "location": "Văn phòng Tầng 4",
  "version": 0
}
```

Quy tắc:

- Không cho phép chỉnh sửa `assetCode` (mã tài sản là bất biến sau khi tạo).
- Không cho phép gán hoặc thay đổi người nhận tài sản qua endpoint này (phải sử dụng endpoint cấp phát / trả tài sản chuyên biệt).
- Cập nhật trạng thái `status` qua endpoint này chỉ được phép đối với các trạng thái kho lưu giữ (`AVAILABLE`, `MAINTENANCE`, `BROKEN`, `RETIRED`) tuân thủ ma trận chuyển đổi trạng thái hợp lệ.
- Chuyển đổi trạng thái không thuộc ma trận chuyển đổi hợp lệ trả về HTTP 400 `ASSET_STATUS_TRANSITION_INVALID`.
- Cấm tuyệt đối chuyển sang `ASSIGNED` qua endpoint này.
- Cấm tuyệt đối chuyển khỏi `ASSIGNED` khi tài sản đang có phân công hoạt động (`ACTIVE`).
- Bắt buộc kiểm tra Optimistic Locking bằng `version`.

Response:

```text
200 OK
```

### 14.6. Cấp phát tài sản

```http
POST /assets/{assetId}/assignments
```

Quyền:

```text
ASSET_MANAGE
```

Request:

```json
{
  "assignedTo": "UUID",
  "expectedReturnAt": null,
  "notes": "Cấp phát phục vụ công việc."
}
```

Quy tắc:

- Chỉ tài sản đang ở trạng thái `AVAILABLE` mới được cấp phát. Nếu tài sản ở trạng thái khác, trả về HTTP 400 `ASSET_NOT_AVAILABLE`.
- Nếu tài sản đã có phân công đang hoạt động theo kiểm tra nghiệp vụ, trả về HTTP 400 `ASSET_ALREADY_ASSIGNED`.
- Phân công thành công chuyển trạng thái tài sản sang `ASSIGNED`.
- Tại một thời điểm, mỗi tài sản chỉ có tối đa duy nhất 1 phân công hoạt động (`status = 'ACTIVE'`).
- Không hỗ trợ chuyển giao (reassign) trực tiếp sang người khác; bắt buộc thực hiện thủ tục trả tài sản cũ trước khi cấp phát cho người mới.
- Khóa hàng `Asset` bằng `PESSIMISTIC_WRITE` phối hợp tuần tự hóa các yêu cầu cạnh tranh. Nếu xảy ra xung đột vi phạm ràng buộc phân công duy nhất tại cơ sở dữ liệu, trả về HTTP 409 `ASSET_ASSIGNMENT_CONFLICT`. Không có lỗi HTTP 500.

Response:

```text
201 Created
```

### 14.7. Trả tài sản

```http
PUT /assets/{assetId}/assignments/{assignmentId}/return
```

Quyền:

```text
ASSET_MANAGE
```

Request:

```json
{
  "returnCondition": "Thiết bị hoạt động bình thường",
  "resultingAssetStatus": "AVAILABLE",
  "version": 2
}
```

Quy tắc:

- Chỉ áp dụng đối với phân công đang ở trạng thái `ACTIVE`. Nếu phân công đã kết thúc, trả về HTTP 400 `ASSET_ASSIGNMENT_NOT_ACTIVE`.
- Trả thành công chuyển trạng thái phân công sang `RETURNED`, ghi nhận `returned_at` và `return_condition`. Trạng thái tài sản chuyển sang `resultingAssetStatus`.
- Vòng đời phân công được hỗ trợ trong Phase 10 (Supported assignment lifecycle):
  `ACTIVE -> RETURNED`
- Giá trị dự trữ schema, không mở qua API Phase 10 (Schema-reserved values, not exposed by Phase 10 API):
  `LOST`, `DAMAGED`
  (Quy trình xử lý phân công thất thoát/hư hỏng hoãn lại theo `ASSET_ASSIGNMENT_LOST_DAMAGED_WORKFLOW_DEFERRED`).

Response:

```text
200 OK
```

### 14.8. Báo hỏng tài sản

Không tạo endpoint báo hỏng riêng.

Mobile điều hướng đến tạo yêu cầu dịch vụ và truyền:

```text
assetId
category phù hợp
```

Backend tạo Service Request có liên kết tài sản.

### 14.9. Lịch sử sửa chữa và bảo trì tài sản

Lịch sử sửa chữa là **AUDIT RECORD** dùng để ghi nhận sự kiện sửa chữa, bảo dưỡng, kiểm định hoặc nâng cấp thiết bị; không phải workflow điều phối hay state machine quản lý tiến độ.
Phase 10 không quản lý vòng đời chuyển trạng thái "đang sửa → hoàn thành" của ticket sửa chữa (nếu nghiệp vụ yêu cầu, hoãn sang phase/canonical patch tiếp theo). Không tự động sinh bản ghi từ Service Request.

#### 14.9.1. Ghi nhận lịch sử sửa chữa

```http
POST /assets/{assetId}/repair-histories
```

Quyền:

```text
ASSET_MANAGE
```

Request:

```json
{
  "serviceRequestId": "UUID",
  "repairType": "REPAIR",
  "description": "Thay bàn phím và bảo dưỡng quạt tản nhiệt",
  "vendorName": "Trung tâm bảo hành Dell",
  "cost": 1500000.00,
  "startedAt": "2026-10-10T08:00:00Z",
  "completedAt": "2026-10-12T17:00:00Z",
  "result": "Thiết bị hoạt động tốt sau khi thay thế linh kiện"
}
```

Validation:

```text
repairType: bắt buộc, thuộc một trong: MAINTENANCE, REPAIR, INSPECTION, UPGRADE
description: bắt buộc, text mô tả chi tiết nội dung bảo dưỡng/sửa chữa
serviceRequestId: không bắt buộc, nếu có phải là UUID của yêu cầu dịch vụ hợp lệ liên kết cùng assetId
vendorName: không bắt buộc, tối đa 255 ký tự
cost: không bắt buộc, số thực lớn hơn hoặc bằng 0
startedAt: bắt buộc, mốc thời gian ISO-8601
completedAt: không bắt buộc, nếu có phải lớn hơn hoặc bằng startedAt
result: không bắt buộc, tối đa 1000 ký tự
```

Quy tắc:

- Bản ghi lịch sử sửa chữa là **AUDIT RECORD** bất biến ghi nhận sự kiện thực tế; không hỗ trợ cập nhật (PUT) hoặc xóa (DELETE) sau khi tạo trong MVP.
- Quản trị viên (`ADMIN` / `ASSET_MANAGE`) chủ động tạo bản ghi qua endpoint này.
- `serviceRequestId` không bắt buộc; dùng để tham chiếu đến yêu cầu dịch vụ liên quan nếu có.
- `completedAt` không bắt buộc; nếu có phải lớn hơn hoặc bằng `startedAt`.
- Không tự động tạo bản ghi từ Service Request lifecycle.

Response:

```text
201 Created
```

#### 14.9.2. Danh sách lịch sử sửa chữa của tài sản

```http
GET /assets/{assetId}/repair-histories
```

Quyền:

```text
ASSET_READ
```

Quy tắc truy cập:

- Quản trị viên (`ADMIN`) có quyền xem lịch sử sửa chữa của bất kỳ tài sản nào.
- Người dùng thông thường chỉ có quyền xem lịch sử sửa chữa nếu tài sản đang được cấp phát cho chính mình (`assignedTo = currentUserId`). Nếu không, trả về HTTP 403 Forbidden (`ASSET_ACCESS_DENIED`).

Response:

```text
200 OK
```

```json
{
  "success": true,
  "data": [
    {
      "id": "UUID",
      "assetId": "UUID",
      "serviceRequestId": "UUID",
      "repairType": "REPAIR",
      "description": "Thay bàn phím và bảo dưỡng quạt tản nhiệt",
      "vendorName": "Trung tâm bảo hành Dell",
      "cost": 1500000.00,
      "startedAt": "2026-10-10T08:00:00Z",
      "completedAt": "2026-10-12T17:00:00Z",
      "result": "Thiết bị hoạt động tốt sau khi thay thế linh kiện",
      "createdBy": "UUID",
      "createdAt": "ISO-8601"
    }
  ],
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

---

## 15. NOTIFICATION API

Mô hình phân phối Phase 11:
- Hệ thống trung tâm thông báo nội bộ (In-app Database Notification Center).
- Không tích hợp Push Notification thực tế (FCM/APNs) và Email delivery trong Phase 11. Các thuộc tính `pushEnabled` và `emailEnabled` được lưu trữ tùy chọn nhưng chưa kích hoạt kênh gửi ngoài.
- Client sử dụng `referenceType` và `referenceId` từ item thông báo để điều hướng trực tiếp (deep link) đến màn hình chi tiết đối tượng liên quan (Project, Task, Service Request, Asset). Không có endpoint riêng `GET /notifications/{id}`.

### 15.1. Danh sách thông báo

```http
GET /notifications
```

Quyền:

```text
NOTIFICATION_READ
```

Query:

```text
page
size
read
type
sort=createdAt,desc
```

Quy tắc phân quyền:
- Chỉ trả về danh sách thông báo gửi cho chính người dùng hiện tại (`recipient_id = principal.userId`).

Response item:

```json
{
  "id": "UUID",
  "type": "TASK_ASSIGNED",
  "title": "Bạn được giao công việc mới",
  "message": "Xây dựng màn hình đăng nhập",
  "referenceType": "TASK",
  "referenceId": "UUID",
  "read": false,
  "createdAt": "ISO-8601"
}
```

### 15.2. Đánh dấu đã đọc

```http
PUT /notifications/{notificationId}/read
```

Quyền:

```text
NOTIFICATION_UPDATE
```

Quy tắc xử lý và bảo mật:
- Người dùng chỉ có quyền đánh dấu đã đọc thông báo của chính mình.
- Nếu `notificationId` không tồn tại HOẶC thuộc về người dùng khác, API trả về HTTP 404 với mã lỗi `NOTIFICATION_NOT_FOUND` (không trả về 403 để tránh lộ sự tồn tại của thông báo giữa các người dùng).
- Thao tác mang tính lũy đẳng (idempotent): Nếu thông báo đã ở trạng thái đã đọc (`is_read = true`), API vẫn trả về HTTP 200 OK thành công.

Response:

```json
{
  "success": true,
  "data": null,
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

### 15.3. Đánh dấu tất cả đã đọc

```http
PUT /notifications/read-all
```

Quyền:

```text
NOTIFICATION_UPDATE
```

Quy tắc xử lý:
- Cập nhật toàn bộ thông báo có `is_read = false` của người dùng hiện tại sang `is_read = true` và ghi nhận `read_at`.
- Thao tác mang tính lũy đẳng (idempotent): Nếu không có thông báo nào chưa đọc, API vẫn trả về HTTP 200 OK thành công với `updatedCount = 0`.

Response:

```json
{
  "success": true,
  "data": {
    "updatedCount": 5
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

### 15.4. Số thông báo chưa đọc

```http
GET /notifications/unread-count
```

Quyền:

```text
NOTIFICATION_READ
```

Response:

```json
{
  "success": true,
  "data": {
    "count": 5
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

### 15.5. Tuỳ chọn thông báo

```http
GET /notification-preferences
PUT /notification-preferences
```

Quyền:

```text
AUTHENTICATED
```

#### GET /notification-preferences

Trả về danh sách cấu hình nhận thông báo của người dùng hiện tại cho toàn bộ 8 loại thông báo canonical:
`PROJECT_MEMBER_ADDED`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `TASK_DUE_SOON`, `TASK_OVERDUE`, `SERVICE_REQUEST_UPDATED`, `COMMENT_ADDED`, `ASSET_ASSIGNED`.

Nếu chưa có bản ghi trong CSDL cho một loại thông báo, hệ thống tự động trả về giá trị mặc định:
- `inAppEnabled`: `true`
- `pushEnabled`: `true`
- `emailEnabled`: `false`

Response:

```json
{
  "success": true,
  "data": {
    "preferences": [
      {
        "notificationType": "TASK_ASSIGNED",
        "inAppEnabled": true,
        "pushEnabled": true,
        "emailEnabled": false
      }
    ]
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

#### PUT /notification-preferences

Cập nhật danh sách cấu hình nhận thông báo của người dùng hiện tại (upsert theo `(user_id, notification_type)`).

Request cập nhật:

```json
{
  "preferences": [
    {
      "notificationType": "TASK_ASSIGNED",
      "inAppEnabled": true,
      "pushEnabled": true,
      "emailEnabled": false
    }
  ]
}
```

Validation:
- `notificationType` phải thuộc danh mục canonical. Nếu không hợp lệ, trả về HTTP 400 `NOTIFICATION_TYPE_INVALID`.
- Không được chứa các phần tử có `notificationType` trùng lặp trong cùng request. Nếu trùng lặp, trả về HTTP 400 `NOTIFICATION_PREFERENCE_DUPLICATE_TYPE`.
- `pushEnabled` và `emailEnabled` chỉ lưu trữ tùy chọn; không tạo delivery side-effect trong Phase 11.

Response:

```json
{
  "success": true,
  "data": null,
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

---

## 16. FILE API

### 16.1. Upload tệp

```http
POST /files
```

Quyền:

```text
AUTHENTICATED
```

Content Type:

```http
multipart/form-data
```

Form field:

```text
file
purpose
```

Giá trị `purpose`:

```text
AVATAR
TASK_ATTACHMENT
SERVICE_ATTACHMENT
PROJECT_DOCUMENT
```

Response `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": "UUID",
    "originalName": "screenshot.png",
    "mimeType": "image/png",
    "sizeBytes": 245678,
    "downloadUrl": "/api/v1/files/UUID/download",
    "createdAt": "ISO-8601"
  },
  "message": null,
  "timestamp": "ISO-8601",
  "traceId": "string"
}
```

Quy tắc:

- Kiểm tra MIME type.
- Kiểm tra phần mở rộng.
- Giới hạn dung lượng.
- Không dùng tên gốc làm tên lưu thật.
- Không tin MIME type do client gửi.
- File chưa được liên kết có thể bị dọn sau một khoảng thời gian.

### 16.2. Download tệp

```http
GET /files/{fileId}/download
```

Backend phải kiểm tra quyền truy cập dữ liệu đang liên kết với tệp.

### 16.3. Xoá tệp chưa liên kết

```http
DELETE /files/{fileId}
```

Chỉ người tải lên hoặc quản trị viên phù hợp được xoá.

Không cho xoá tệp đang được dữ liệu nghiệp vụ sử dụng.

---

## 17. ADMIN API

### 17.1. Danh sách người dùng

```http
GET /admin/users
```

Quyền:

```text
USER_READ
```

Query:

```text
page
size
search
departmentId
role
status
```

### 17.2. Tạo người dùng

```http
POST /admin/users
```

Quyền:

```text
USER_MANAGE
```

Request:

```json
{
  "username": "nvcuong",
  "email": "user@example.com",
  "fullName": "Nguyễn Văn Cường",
  "phoneNumber": "0900000000",
  "departmentId": "UUID",
  "roleCodes": [
    "EMPLOYEE"
  ]
}
```

Không nhận password cố định từ mobile nếu hệ thống sử dụng quy trình kích hoạt tài khoản.

### 17.3. Cập nhật người dùng

```http
PUT /admin/users/{userId}
```

Quyền:

```text
USER_MANAGE
```

### 17.4. Khoá tài khoản

```http
PUT /admin/users/{userId}/lock
```

Request:

```json
{
  "reason": "Vi phạm chính sách tài khoản"
}
```

### 17.5. Mở khoá tài khoản

```http
PUT /admin/users/{userId}/unlock
```

### 17.6. Danh sách phòng ban

```http
GET /departments
```

Quyền:

```text
AUTHENTICATED
```

### 17.7. Tạo phòng ban

```http
POST /admin/departments
```

Quyền:

```text
DEPARTMENT_MANAGE
```

### 17.8. Cập nhật phòng ban

```http
PUT /admin/departments/{departmentId}
```

### 17.9. Dừng hoạt động phòng ban

```http
PUT /admin/departments/{departmentId}/deactivate
```

Không xoá vật lý phòng ban đã có người dùng hoặc dữ liệu lịch sử.

---

## 18. AUDIT API

### 18.1. Danh sách audit log

```http
GET /admin/audit-logs
```

Quyền:

```text
AUDIT_READ
```

Query:

```text
page
size
actorId
module
action
entityType
entityId
traceId
createdFrom
createdTo
```

Không trả dữ liệu bí mật trong `oldValues` hoặc `newValues`.

---

## 19. REPORTING API

### 19.1. Báo cáo công việc

```http
GET /reports/tasks
```

Quyền:

```text
REPORT_READ
```

Query:

```text
projectId
departmentId
assigneeId
from
to
```

### 19.2. Báo cáo dự án

```http
GET /reports/projects
```

### 19.3. Báo cáo yêu cầu dịch vụ

```http
GET /reports/service-requests
```

### 19.4. Báo cáo tài sản

```http
GET /reports/assets
```

API báo cáo trả JSON trong MVP.

Xuất Excel hoặc PDF thuộc phần mở rộng nếu thời gian cho phép.

---

## 20. Mã lỗi chuẩn

### 20.1. Xác thực

```text
INVALID_CREDENTIALS
ACCESS_TOKEN_MISSING
ACCESS_TOKEN_INVALID
ACCESS_TOKEN_EXPIRED
REFRESH_TOKEN_INVALID
REFRESH_TOKEN_EXPIRED
REFRESH_TOKEN_REVOKED
SESSION_NOT_FOUND
ACCOUNT_PENDING
ACCOUNT_LOCKED
ACCOUNT_DISABLED
CURRENT_PASSWORD_INCORRECT
PASSWORD_POLICY_VIOLATION
PASSWORD_CONFIRMATION_MISMATCH
```

### 20.2. Phân quyền

```text
ACCESS_DENIED
PERMISSION_REQUIRED
PROJECT_ACCESS_DENIED
TASK_ACCESS_DENIED
SERVICE_REQUEST_ACCESS_DENIED
ASSET_ACCESS_DENIED
FILE_ACCESS_DENIED
```

Các permission quản lý danh mục được API sử dụng:

```text
SERVICE_CATEGORY_MANAGE
ASSET_CATEGORY_MANAGE
```

Quy tắc đối với `ROLE_MANAGE`:

- `ROLE_MANAGE` được giữ là permission dự phòng.
- MVP không cung cấp endpoint quản lý role động.
- Role hệ thống được seed cố định.
- Không tạo API `/admin/roles` trong MVP.

### 20.3. Dữ liệu chung

```text
VALIDATION_ERROR
RESOURCE_NOT_FOUND
RESOURCE_ALREADY_EXISTS
OPTIMISTIC_LOCK_CONFLICT
DATA_INTEGRITY_VIOLATION
INVALID_REQUEST_STATE
RATE_LIMIT_EXCEEDED
```

```text
IDEMPOTENCY_KEY_MISSING
IDEMPOTENCY_KEY_INVALID
IDEMPOTENCY_KEY_REUSED
IDEMPOTENCY_REQUEST_IN_PROGRESS
IDEMPOTENCY_RECORD_EXPIRED
```

### 20.4. Dự án

```text
PROJECT_NOT_FOUND
PROJECT_CODE_ALREADY_EXISTS
PROJECT_NOT_ACTIVE
PROJECT_ALREADY_COMPLETED
PROJECT_ALREADY_CANCELLED
PROJECT_STATUS_TRANSITION_INVALID
PROJECT_DATE_RANGE_INVALID
PROJECT_MEMBER_ALREADY_EXISTS
PROJECT_MEMBER_NOT_FOUND
PROJECT_MANAGER_REQUIRED
PROJECT_MEMBER_HAS_ACTIVE_ASSIGNMENTS
```

### 20.5. Công việc

```text
TASK_NOT_FOUND
TASK_PROJECT_NOT_ACTIVE
TASK_STATUS_TRANSITION_INVALID
TASK_ASSIGNEE_NOT_PROJECT_MEMBER
TASK_PARENT_PROJECT_MISMATCH
TASK_PARENT_CYCLE_DETECTED
TASK_DATE_RANGE_INVALID
TASK_ALREADY_COMPLETED
TASK_ALREADY_CANCELLED
TASK_PROGRESS_INVALID
```

### 20.6. Yêu cầu dịch vụ

```text
SERVICE_REQUEST_NOT_FOUND
SERVICE_CATEGORY_NOT_FOUND
SERVICE_STATUS_TRANSITION_INVALID
SERVICE_ASSIGNEE_REQUIRED
SERVICE_ASSIGNMENT_CONFLICT
SERVICE_RESOLUTION_REQUIRED
SERVICE_ALREADY_CLOSED
SERVICE_RATING_ALREADY_EXISTS
SERVICE_RATING_FORBIDDEN
SERVICE_NOT_CLOSED
```

```text
SERVICE_CATEGORY_CODE_ALREADY_EXISTS
SERVICE_CATEGORY_PARENT_INVALID
SERVICE_CATEGORY_CYCLE_DETECTED
SERVICE_CATEGORY_IN_USE
SERVICE_CATEGORY_ALREADY_INACTIVE
SERVICE_CATEGORY_ALREADY_ACTIVE
SERVICE_RESOLUTION_REJECTION_FORBIDDEN
SERVICE_NOT_RESOLVED
SERVICE_ALREADY_CANCELLED
```

### 20.7. Tài sản

```text
ASSET_NOT_FOUND
ASSET_ACCESS_DENIED
ASSET_CODE_ALREADY_EXISTS
ASSET_SERIAL_ALREADY_EXISTS
ASSET_NOT_AVAILABLE
ASSET_ALREADY_ASSIGNED
ASSET_ASSIGNMENT_CONFLICT
ASSET_ASSIGNMENT_NOT_FOUND
ASSET_ASSIGNMENT_NOT_ACTIVE
ASSET_STATUS_TRANSITION_INVALID
ASSET_RETIRED
ASSET_IN_MAINTENANCE
ASSET_BROKEN
ASSET_REPAIR_HISTORY_NOT_FOUND
```

```text
ASSET_CATEGORY_NOT_FOUND
ASSET_CATEGORY_CODE_ALREADY_EXISTS
ASSET_CATEGORY_IN_USE
ASSET_CATEGORY_ALREADY_INACTIVE
ASSET_CATEGORY_ALREADY_ACTIVE
```

### 20.8. Tệp

```text
FILE_NOT_FOUND
FILE_EMPTY
FILE_TOO_LARGE
FILE_TYPE_NOT_ALLOWED
FILE_EXTENSION_NOT_ALLOWED
FILE_UPLOAD_FAILED
FILE_ALREADY_LINKED
FILE_ACCESS_DENIED
```

### 20.9. Thông báo

```text
NOTIFICATION_NOT_FOUND
NOTIFICATION_TYPE_INVALID
NOTIFICATION_PREFERENCE_DUPLICATE_TYPE
```

---

## 21. Idempotency

Idempotency giúp ngăn việc tạo dữ liệu trùng khi người dùng bấm nhiều lần hoặc khi mobile gửi lại request do lỗi mạng.

Các API tạo dữ liệu quan trọng phải hỗ trợ header:

```http
Idempotency-Key: <UUID>
```

Áp dụng cho:

```text
POST /projects
POST /tasks
POST /service-requests
POST /files
POST /assets/{assetId}/assignments
```

Backend sử dụng bảng `idempotent_requests` đã được định nghĩa trong Database Design.

Quy trình:

```text
Client tạo Idempotency-Key
→ Backend xác thực người dùng
→ Backend chuẩn hoá request
→ Backend tạo request_hash
→ Backend tìm bản ghi theo user_id và idempotency_key
→ Nếu chưa có, tạo trạng thái PROCESSING
→ Thực hiện transaction nghiệp vụ
→ Lưu response đã lọc
→ Chuyển trạng thái sang COMPLETED
→ Request gửi lại nhận kết quả đã lưu
```

Quy tắc:

- Key phải là UUID hợp lệ.
- Key được ràng buộc với người dùng đã xác thực.
- Cùng người dùng, cùng key và cùng request hash trả kết quả đã lưu.
- Cùng người dùng và cùng key nhưng request hash khác trả `409 Conflict`.
- Bản ghi đang `PROCESSING` trả `409 Conflict`.
- Bản ghi hết hạn không được dùng để trả response cũ.
- Idempotency không thay thế transaction.
- Không lưu password, access token, refresh token, secret hoặc nội dung file nhị phân trong `response_body`.
- Với upload file, chỉ lưu metadata response cần thiết.
- Response phải được lọc dữ liệu nhạy cảm trước khi lưu.
- Một key không được tái sử dụng cho endpoint khác.
- Mobile không tự retry vô hạn.

Các trường hợp lỗi:

```text
Thiếu header:
HTTP 400
IDEMPOTENCY_KEY_MISSING

Key không đúng định dạng:
HTTP 400
IDEMPOTENCY_KEY_INVALID

Cùng key nhưng request hash khác:
HTTP 409
IDEMPOTENCY_KEY_REUSED

Request trước đang xử lý:
HTTP 409
IDEMPOTENCY_REQUEST_IN_PROGRESS

Bản ghi đã hết hạn:
HTTP 409
IDEMPOTENCY_RECORD_EXPIRED
```

## 22. Optimistic Locking

Các request cập nhật dữ liệu quan trọng phải gửi `version`.

Ví dụ:

```json
{
  "name": "Tên mới",
  "version": 3
}
```

Nếu version trong database khác version request, backend trả:

```http
409 Conflict
```

Mã lỗi:

```text
OPTIMISTIC_LOCK_CONFLICT
```

Mobile phải:

1. Thông báo dữ liệu đã được người khác cập nhật.
2. Tải lại dữ liệu mới nhất.
3. Không tự động ghi đè.

---

## 23. Quy tắc DELETE

Soft Delete trong Database Design không đồng nghĩa rằng mọi resource phải có endpoint HTTP DELETE.

### 23.1. Các endpoint DELETE có trong MVP

```text
DELETE /tasks/{taskId}
DELETE /tasks/{taskId}/assignments/{assignmentId}
DELETE /tasks/{taskId}/comments/{commentId}
DELETE /projects/{projectId}/members/{memberId}
DELETE /files/{fileId}
```

Quy tắc:

- Task sử dụng Soft Delete hoặc bị từ chối xoá nếu đã có lịch sử nghiệp vụ quan trọng.
- Assignment được xoá hoặc kết thúc theo quy tắc dữ liệu liên kết.
- Bình luận sử dụng Soft Delete nội dung.
- Project Member chỉ được xoá khi không vi phạm quy tắc thành viên dự án.
- File chỉ được xoá khi chưa liên kết với dữ liệu nghiệp vụ.

### 23.2. Resource không có endpoint DELETE trong MVP

Không tạo endpoint DELETE cho:

```text
Project
Service Request
Asset
User
Department
Service Category
Asset Category
```

Các resource này sử dụng trạng thái hoặc hành động nghiệp vụ:

```text
Project          → CANCELLED
Service Request  → CANCELLED hoặc CLOSED
Asset            → RETIRED
User             → LOCKED hoặc DISABLED
Department       → deactivate
Service Category → deactivate
Asset Category   → deactivate
```

### 23.3. Dữ liệu không được xoá

Không xoá:

- Audit Log.
- Project Status History.
- Task Status History.
- Service Status History.
- Asset Repair History.
- Dữ liệu đã dùng cho báo cáo hoặc truy vết.
- Dữ liệu cần giữ theo chính sách kiểm toán.

### 23.4. Quy tắc triển khai

- Backend quyết định có cho phép xoá hay không.
- Mobile không được suy luận rằng resource có Soft Delete thì chắc chắn có endpoint DELETE.
- Không xoá vật lý dữ liệu nghiệp vụ quan trọng chỉ để xử lý lỗi.
- Không dùng Cascade Delete tuỳ tiện.
- Không tự thêm endpoint DELETE ngoài API Contract.

## 24. Quy tắc upload tệp

Giới hạn MVP đề xuất:

```text
Ảnh: tối đa 10 MB mỗi file
PDF: tối đa 20 MB mỗi file
Tài liệu văn phòng: tối đa 20 MB mỗi file
Tối đa 5 file trong một thao tác nghiệp vụ
```

Định dạng đề xuất:

```text
image/jpeg
image/png
image/webp
application/pdf
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

Backend phải:

- Kiểm tra chữ ký file khi phù hợp.
- Không chỉ tin tên file.
- Không cho phép thực thi file.
- Không cho phép đường dẫn trong tên file.
- Tạo tên lưu mới.
- Ghi checksum.
- Kiểm tra quyền khi download.

---

## 25. Quy tắc retry trên mobile

Mobile chỉ tự retry các request đọc dữ liệu khi lỗi mạng tạm thời.

Không tự động retry vô hạn.

Request thay đổi dữ liệu chỉ retry khi:

- Có `Idempotency-Key`.
- Hoặc chắc chắn thao tác có tính idempotent.

Số lần retry đề xuất:

```text
Tối đa 2 lần
```

Không retry tự động khi:

```text
400
401 sau khi refresh thất bại
403
404
409
422
```

Có thể retry có kiểm soát khi:

```text
408
429
500
502
503
504
```

Phải áp dụng thời gian chờ tăng dần.

---

## 26. Quy tắc cache mobile

Có thể cache:

- Danh mục dịch vụ.
- Danh sách dự án gần đây.
- Danh sách công việc gần đây.
- Thông báo gần đây.
- Thông tin hồ sơ tối thiểu.
- Bộ lọc người dùng đã chọn.

Không cache lâu dài:

- Permission quan trọng mà không xác minh lại.
- Password.
- Access token trong storage không an toàn.
- Refresh token trong storage không an toàn.
- Audit log.
- Dữ liệu nhạy cảm không cần thiết.

Khi mutation thành công, mobile phải làm mới hoặc vô hiệu cache liên quan.

---

## 27. Quy tắc dành cho AI Agent

AI Agent phải:

1. Đọc tài liệu này trước khi viết Controller, API Service hoặc mobile hook.
2. Không đổi endpoint khi chưa cập nhật tài liệu.
3. Không đổi tên field khi chưa cập nhật tài liệu.
4. Không trả JPA Entity trực tiếp.
5. Không tạo cấu trúc response riêng ngoài chuẩn.
6. Không trả `200 OK` cho mọi loại lỗi.
7. Không dùng `500` cho lỗi validation hoặc nghiệp vụ dự kiến.
8. Phải kiểm tra quyền tại backend.
9. Không chỉ dựa vào việc ẩn nút trên mobile.
10. Phải kiểm tra phạm vi dữ liệu của người dùng.
11. Phải dùng DTO cho request và response.
12. Phải thêm validation.
13. Phải viết test cho endpoint.
14. Phải kiểm tra workflow khi đổi trạng thái.
15. Phải dùng version cho dữ liệu có Optimistic Locking.
16. Phải dùng phân trang cho danh sách lớn.
17. Không ghi token hoặc secret vào log.
18. Không đưa stack trace về mobile.
19. Không tự tạo API trùng chức năng.
20. Không tạo API mới trước khi kiểm tra endpoint hiện có.
21. Không tự thêm dependency HTTP, validation hoặc mapping trùng chức năng.
22. Khi thay API phải kiểm tra ảnh hưởng mobile.
23. Khi thay mobile API service phải kiểm tra contract backend.
24. Không đánh dấu hoàn thành nếu chưa chạy test.
25. Phải cập nhật OpenAPI cùng mã nguồn.

---

## 28. Các quyết định API đã khóa

- Base path là `/api/v1`.
- API sử dụng JSON.
- Tên field sử dụng `camelCase`.
- ID sử dụng UUID dạng chuỗi.
- Thời gian sử dụng ISO-8601.
- Token truyền qua Authorization Bearer header.
- Response dùng cấu trúc chuẩn.
- Danh sách sử dụng phân trang.
- Endpoint được bảo vệ phải kiểm tra quyền tại backend.
- API thay đổi dữ liệu quan trọng sử dụng version.
- API tạo dữ liệu quan trọng hỗ trợ Idempotency-Key.
- Upload tệp sử dụng multipart/form-data.
- Backend không trả stack trace.
- Backend không trả JPA Entity trực tiếp.
- Backend không tiết lộ dữ liệu người dùng không có quyền.
- Mobile chỉ truyền ID tối thiểu khi điều hướng.
- OpenAPI phải đồng bộ với code thật.
- Mã lỗi phải ổn định để mobile xử lý.
- Không đổi API Contract âm thầm.

Mọi thay đổi đối với API phải được cập nhật trong tài liệu này trước khi sửa backend hoặc mobile.
