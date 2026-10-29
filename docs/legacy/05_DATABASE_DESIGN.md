# THIẾT KẾ CƠ SỞ DỮ LIỆU WORKSPHERE

## 1. Mục đích

Tài liệu này xác định các bảng dữ liệu, trường dữ liệu, quan hệ, enum, index và quy tắc toàn vẹn dữ liệu của WorkSphere.

Mục tiêu:

- Thống nhất cấu trúc dữ liệu trước khi viết backend.
- Hạn chế thay đổi database trong quá trình phát triển.
- Ngăn việc tạo bảng hoặc trường dữ liệu trùng lặp.
- Đảm bảo các module có ranh giới rõ ràng.
- Hỗ trợ truy vết lịch sử và kiểm thử.
- Làm căn cứ tạo database migration.

Không tự ý thêm bảng, xoá bảng, đổi tên trường hoặc thay đổi quan hệ nếu chưa cập nhật tài liệu này.

---

## 2. Công nghệ và quy ước

### 2.1. Công nghệ

- Hệ quản trị cơ sở dữ liệu: PostgreSQL.
- Database migration: Flyway.
- ORM: Spring Data JPA và Hibernate.
- Kiểu định danh chính: UUID.
- Múi giờ lưu trữ: UTC.
- Thời gian trao đổi qua API: ISO-8601.

UUID là chuỗi định danh gần như duy nhất, phù hợp cho hệ thống có nhiều module và khó đoán hơn ID tăng dần.

Migration là file quản lý từng thay đổi cấu trúc cơ sở dữ liệu theo phiên bản.

### 2.2. Quy tắc đặt tên

- Tên bảng dùng chữ thường và dấu gạch dưới.
- Tên bảng sử dụng dạng số nhiều khi phù hợp.
- Tên cột dùng chữ thường và dấu gạch dưới.
- Khoá chính có tên `id`.
- Khoá ngoại có hậu tố `_id`.
- Bảng liên kết phải thể hiện rõ hai đối tượng được liên kết.
- Tên index bắt đầu bằng `idx_`.
- Tên unique constraint bắt đầu bằng `uk_`.
- Tên foreign key bắt đầu bằng `fk_`.
- Tên check constraint bắt đầu bằng `chk_`.

Ví dụ:

```text
users
project_members
service_requests
task_status_histories
```

---

## 3. Trường dùng chung

Phần lớn bảng nghiệp vụ sử dụng các trường:

```text
id              UUID
created_at      TIMESTAMP WITH TIME ZONE
updated_at      TIMESTAMP WITH TIME ZONE
created_by      UUID, có thể null
updated_by      UUID, có thể null
version         BIGINT
```

Ý nghĩa:

- `created_at`: thời điểm tạo.
- `updated_at`: thời điểm cập nhật gần nhất.
- `created_by`: người tạo dữ liệu.
- `updated_by`: người cập nhật gần nhất.
- `version`: hỗ trợ Optimistic Locking.

Optimistic Locking là cơ chế ngăn hai người cùng sửa một bản ghi và vô tình ghi đè dữ liệu của nhau.

Không phải bảng nào cũng bắt buộc có `created_by` và `updated_by`. Các bảng hệ thống như refresh token hoặc login session có thể dùng trường riêng phù hợp hơn.

---

## 4. Quy tắc xoá dữ liệu

### 4.1. Soft Delete

Các bảng nghiệp vụ quan trọng không xoá vật lý ngay mà sử dụng:

```text
is_deleted      BOOLEAN DEFAULT FALSE
deleted_at      TIMESTAMP WITH TIME ZONE, có thể null
deleted_by      UUID, có thể null
```

Áp dụng cho:

- users
- departments
- teams
- projects
- tasks
- service_categories
- service_requests
- asset_categories
- assets

Soft Delete là đánh dấu dữ liệu đã bị xoá nhưng vẫn giữ bản ghi để truy vết.

### 4.2. Không dùng Soft Delete

Các bảng liên kết hoặc dữ liệu phiên có thể xoá vật lý khi không còn cần thiết:

- user_roles
- role_permissions
- project_members
- team_members
- refresh_tokens
- login_sessions
- notification_preferences

### 4.3. Dữ liệu lịch sử

Không xoá vật lý:

- audit_logs
- project_status_histories
- task_status_histories
- service_status_histories
- asset_assignment_histories
- asset_repair_histories

---

## 5. IDENTITY MODULE

### 5.1. Bảng `users`

Mục đích:

Lưu tài khoản và thông tin cơ bản của người dùng.

Các trường:

```text
id                  UUID PRIMARY KEY
department_id       UUID NULL
username            VARCHAR(50) NOT NULL
email               VARCHAR(255) NOT NULL
password_hash       VARCHAR(255) NOT NULL
full_name           VARCHAR(150) NOT NULL
phone_number        VARCHAR(20) NULL
avatar_file_id      UUID NULL
status              VARCHAR(30) NOT NULL
last_login_at       TIMESTAMP WITH TIME ZONE NULL
password_changed_at TIMESTAMP WITH TIME ZONE NULL
is_deleted          BOOLEAN NOT NULL DEFAULT FALSE
deleted_at          TIMESTAMP WITH TIME ZONE NULL
deleted_by          UUID NULL
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
version             BIGINT NOT NULL DEFAULT 0
```

Giá trị `status`:

```text
PENDING
ACTIVE
LOCKED
DISABLED
```

Ràng buộc:

- `username` là duy nhất khi chưa bị xoá.
- `email` là duy nhất khi chưa bị xoá.
- Email được chuẩn hoá thành chữ thường trước khi lưu.
- Không lưu mật khẩu dạng văn bản thuần.
- Người dùng `LOCKED` hoặc `DISABLED` không được đăng nhập.

Index:

```text
idx_users_department_id
idx_users_status
idx_users_full_name
uk_users_username
uk_users_email
```

### 5.2. Bảng `roles`

Mục đích:

Lưu vai trò hệ thống.

Các trường:

```text
id              UUID PRIMARY KEY
code            VARCHAR(50) NOT NULL UNIQUE
name            VARCHAR(100) NOT NULL
description     VARCHAR(500) NULL
is_system       BOOLEAN NOT NULL DEFAULT FALSE
is_active       BOOLEAN NOT NULL DEFAULT TRUE
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

Vai trò mặc định:

```text
EMPLOYEE
TEAM_LEADER
PROJECT_MANAGER
ADMIN
```

### 5.3. Bảng `permissions`

Mục đích:

Lưu quyền chi tiết của hệ thống.

Các trường:

```text
id              UUID PRIMARY KEY
code            VARCHAR(100) NOT NULL UNIQUE
name            VARCHAR(150) NOT NULL
module          VARCHAR(50) NOT NULL
description     VARCHAR(500) NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

Ví dụ permission:

```text
PROJECT_CREATE
PROJECT_UPDATE
PROJECT_MEMBER_MANAGE
TASK_CREATE
TASK_ASSIGN
TASK_UPDATE_STATUS
SERVICE_REQUEST_ASSIGN
ASSET_MANAGE
USER_MANAGE
```

### 5.4. Bảng `user_roles`

Mục đích:

Liên kết người dùng và vai trò.

Các trường:

```text
user_id         UUID NOT NULL
role_id         UUID NOT NULL
assigned_at     TIMESTAMP WITH TIME ZONE NOT NULL
assigned_by     UUID NULL
```

Khoá chính kết hợp:

```text
PRIMARY KEY (user_id, role_id)
```

Không cho phép gán trùng một vai trò cho cùng người dùng.

### 5.5. Bảng `role_permissions`

Mục đích:

Liên kết vai trò và quyền.

Các trường:

```text
role_id         UUID NOT NULL
permission_id   UUID NOT NULL
assigned_at     TIMESTAMP WITH TIME ZONE NOT NULL
```

Khoá chính kết hợp:

```text
PRIMARY KEY (role_id, permission_id)
```

### 5.6. Bảng `refresh_tokens`

Mục đích:

Quản lý refresh token và khả năng thu hồi phiên.

Các trường:

```text
id              UUID PRIMARY KEY
user_id         UUID NOT NULL
token_hash      VARCHAR(255) NOT NULL UNIQUE
device_name     VARCHAR(255) NULL
ip_address      VARCHAR(64) NULL
user_agent      VARCHAR(500) NULL
issued_at       TIMESTAMP WITH TIME ZONE NOT NULL
expires_at      TIMESTAMP WITH TIME ZONE NOT NULL
revoked_at      TIMESTAMP WITH TIME ZONE NULL
replaced_by_id  UUID NULL
```

Quy tắc:

- Chỉ lưu hash của refresh token.
- Không lưu refresh token nguyên bản.
- Token hết hạn hoặc đã thu hồi không được sử dụng.
- Khi đổi token có thể lưu token thay thế trong `replaced_by_id`.

### 5.7. Bảng `login_sessions`

Mục đích:

Theo dõi phiên đăng nhập của người dùng trên từng thiết bị.

Các trường:

```text
id                  UUID PRIMARY KEY
user_id             UUID NOT NULL
refresh_token_id    UUID NULL
device_name         VARCHAR(255) NULL
ip_address          VARCHAR(64) NULL
user_agent          VARCHAR(500) NULL
login_at            TIMESTAMP WITH TIME ZONE NOT NULL
last_activity_at    TIMESTAMP WITH TIME ZONE NOT NULL
logout_at           TIMESTAMP WITH TIME ZONE NULL
status              VARCHAR(30) NOT NULL
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
```

Giá trị `status`:

```text
ACTIVE
LOGGED_OUT
EXPIRED
REVOKED
```

Quan hệ:

```text
login_sessions.user_id → users.id
login_sessions.refresh_token_id → refresh_tokens.id
```

Index:

```text
idx_login_sessions_user_id
idx_login_sessions_refresh_token_id
idx_login_sessions_status
idx_login_sessions_last_activity_at
```

Quy tắc:

- Mỗi phiên thuộc một người dùng.
- Phiên LOGGED_OUT, EXPIRED hoặc REVOKED không được dùng để làm mới token.
- Khi đăng xuất, ghi logout_at và chuyển trạng thái LOGGED_OUT.
- Khi khoá tài khoản hoặc đăng xuất tất cả thiết bị, phiên đang hoạt động phải bị thu hồi.
- Không lưu access token hoặc refresh token nguyên bản.

### 5.8. Bảng `password_reset_tokens`

Mục đích:

Lưu token đặt lại mật khẩu theo cách an toàn, có thời hạn và chỉ được sử dụng một lần.

Các trường:

```text
id              UUID PRIMARY KEY
user_id         UUID NOT NULL
token_hash      VARCHAR(255) NOT NULL UNIQUE
requested_at    TIMESTAMP WITH TIME ZONE NOT NULL
expires_at      TIMESTAMP WITH TIME ZONE NOT NULL
used_at         TIMESTAMP WITH TIME ZONE NULL
revoked_at      TIMESTAMP WITH TIME ZONE NULL
request_ip      VARCHAR(64) NULL
user_agent      VARCHAR(500) NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

Quan hệ:

```text
password_reset_tokens.user_id
→ users.id
```

Quy tắc:

- Chỉ lưu hash của reset token, không lưu token nguyên bản.
- Reset token phải có thời hạn sử dụng ngắn.
- Reset token chỉ được sử dụng một lần.
- Token có `used_at` không được sử dụng lại.
- Token có `revoked_at` không được sử dụng.
- Token có `expires_at` nhỏ hơn hoặc bằng thời điểm hiện tại được coi là hết hạn.
- Khi tạo token mới, hệ thống có thể thu hồi các token chưa sử dụng trước đó của cùng người dùng.
- Không ghi token nguyên bản vào log, audit log hoặc response sau thời điểm cấp token ban đầu.
- Backend phải trả cùng một thông báo cho email tồn tại và email không tồn tại trong luồng quên mật khẩu.
- Việc đặt lại mật khẩu thành công phải thu hồi các phiên đăng nhập hoặc refresh token theo chính sách bảo mật của hệ thống.

Index:

```text
idx_password_reset_tokens_user_id
idx_password_reset_tokens_expires_at
uk_password_reset_tokens_token_hash
```

Quy trình sử dụng:

```text
Người dùng gửi email
→ Backend tạo reset token ngẫu nhiên
→ Backend lưu token_hash
→ Token nguyên bản được gửi qua kênh đặt lại mật khẩu
→ Người dùng gửi resetToken và mật khẩu mới
→ Backend hash resetToken để tìm bản ghi
→ Backend kiểm tra hết hạn, used_at và revoked_at
→ Backend cập nhật mật khẩu
→ Backend ghi used_at
→ Backend thu hồi phiên đăng nhập theo chính sách
```

Token nguyên bản chỉ được trả hoặc gửi qua kênh đặt lại mật khẩu tại thời điểm token được tạo. Database chỉ lưu `token_hash`.

### 5.9. Bảng `idempotent_requests`

Mục đích:

Lưu kết quả xử lý theo `Idempotency-Key` để tránh tạo trùng dữ liệu khi request được gửi lại.

Các trường:

```text
id                  UUID PRIMARY KEY
user_id             UUID NOT NULL
idempotency_key     VARCHAR(100) NOT NULL
http_method         VARCHAR(10) NOT NULL
request_path        VARCHAR(500) NOT NULL
request_hash        VARCHAR(64) NOT NULL
status              VARCHAR(30) NOT NULL
response_status     INTEGER NULL
response_body       JSONB NULL
resource_type       VARCHAR(100) NULL
resource_id         UUID NULL
locked_at           TIMESTAMP WITH TIME ZONE NULL
completed_at        TIMESTAMP WITH TIME ZONE NULL
expires_at          TIMESTAMP WITH TIME ZONE NOT NULL
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
```

Giá trị `status`:

```text
PROCESSING
COMPLETED
FAILED
EXPIRED
```

Quan hệ:

```text
idempotent_requests.user_id → users.id
```

Unique Constraint:

```text
UNIQUE (user_id, idempotency_key)
```

Index:

```text
uk_idempotent_requests_user_key
idx_idempotent_requests_user_id
idx_idempotent_requests_status
idx_idempotent_requests_expires_at
idx_idempotent_requests_resource
```

Quy tắc:

- Cùng key và cùng request hash trả lại kết quả trước đó.
- Cùng key nhưng request hash khác trả IDEMPOTENCY_KEY_REUSED.
- Request đang PROCESSING không được xử lý trùng đồng thời.
- Không lưu password, token, secret hoặc file binary trong response_body.
- Bản ghi hết hạn có thể được dọn định kỳ.
- Bảng này không thay thế transaction nghiệp vụ.

## 6. ORGANIZATION MODULE

### 6.1. Bảng `departments`

Mục đích:

Quản lý phòng ban.

Các trường:

```text
id              UUID PRIMARY KEY
parent_id       UUID NULL
code            VARCHAR(50) NOT NULL
name            VARCHAR(150) NOT NULL
description     VARCHAR(500) NULL
manager_id      UUID NULL
is_active       BOOLEAN NOT NULL DEFAULT TRUE
is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
deleted_at      TIMESTAMP WITH TIME ZONE NULL
deleted_by      UUID NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
version         BIGINT NOT NULL DEFAULT 0
```

Quan hệ:

- Một phòng ban có thể có phòng ban cha.
- Một phòng ban có thể có người quản lý.
- Một phòng ban có nhiều người dùng.

Ràng buộc:

- `code` là duy nhất.
- Phòng ban không được có chính nó làm cha.
- Không tạo vòng lặp trong cây phòng ban.

### 6.2. Bảng `teams`

Mục đích:

Quản lý nhóm làm việc.

Các trường:

```text
id              UUID PRIMARY KEY
department_id   UUID NULL
code            VARCHAR(50) NOT NULL
name            VARCHAR(150) NOT NULL
description     VARCHAR(500) NULL
leader_id       UUID NULL
is_active       BOOLEAN NOT NULL DEFAULT TRUE
is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
deleted_at      TIMESTAMP WITH TIME ZONE NULL
deleted_by      UUID NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
version         BIGINT NOT NULL DEFAULT 0
```

### 6.3. Bảng `team_members`

Mục đích:

Liên kết người dùng và nhóm.

Các trường:

```text
team_id         UUID NOT NULL
user_id         UUID NOT NULL
member_role     VARCHAR(30) NOT NULL
joined_at       TIMESTAMP WITH TIME ZONE NOT NULL
left_at         TIMESTAMP WITH TIME ZONE NULL
is_active       BOOLEAN NOT NULL DEFAULT TRUE
```

Giá trị `member_role`:

```text
LEADER
MEMBER
```

Khoá duy nhất:

```text
UNIQUE (team_id, user_id)
```

---

## 7. PROJECT MODULE

### 7.1. Bảng `projects`

Mục đích:

Lưu thông tin dự án.

Các trường:

```text
id                  UUID PRIMARY KEY
code                VARCHAR(50) NOT NULL
name                VARCHAR(200) NOT NULL
description         TEXT NULL
manager_id          UUID NOT NULL
department_id       UUID NULL
status              VARCHAR(30) NOT NULL
priority            VARCHAR(20) NOT NULL
start_date          DATE NULL
planned_end_date    DATE NULL
actual_end_date     DATE NULL
progress_percent    NUMERIC(5,2) NOT NULL DEFAULT 0
is_deleted          BOOLEAN NOT NULL DEFAULT FALSE
deleted_at          TIMESTAMP WITH TIME ZONE NULL
deleted_by          UUID NULL
created_by          UUID NOT NULL
updated_by          UUID NULL
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
version             BIGINT NOT NULL DEFAULT 0
```

Giá trị `status`:

```text
DRAFT
ACTIVE
ON_HOLD
COMPLETED
CANCELLED
```

Giá trị `priority`:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Ràng buộc:

```text
progress_percent >= 0
progress_percent <= 100
planned_end_date >= start_date
```

Quy tắc:

- Dự án `COMPLETED` hoặc `CANCELLED` không tạo công việc mới.
- `actual_end_date` được ghi khi dự án hoàn thành.
- `progress_percent` ưu tiên được tính từ công việc, không nhập tuỳ ý.

Index:

```text
uk_projects_code
idx_projects_manager_id
idx_projects_department_id
idx_projects_status
idx_projects_planned_end_date
```

### 7.2. Bảng `project_members`

Mục đích:

Quản lý thành viên dự án.

Các trường:

```text
id              UUID PRIMARY KEY
project_id      UUID NOT NULL
user_id         UUID NOT NULL
project_role    VARCHAR(50) NOT NULL
joined_at       TIMESTAMP WITH TIME ZONE NOT NULL
left_at         TIMESTAMP WITH TIME ZONE NULL
is_active       BOOLEAN NOT NULL DEFAULT TRUE
created_by      UUID NOT NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

Giá trị `project_role`:

```text
PROJECT_MANAGER
TEAM_LEADER
MEMBER
OBSERVER
```

Phân loại vai trò:

- `project_role` là vai trò của người dùng trong một dự án cụ thể.
- `project_role` không phải System Role trong bảng `roles`.
- System Role và Project Role được kiểm tra ở hai phạm vi khác nhau.
- Một người có System Role `PROJECT_MANAGER` không tự động được quản lý mọi dự án.
- Người dùng phải có Project Membership đang hoạt động và Project Role phù hợp trong dự án đang truy cập.
- Việc System Role và Project Role cùng dùng mã `PROJECT_MANAGER` hoặc `TEAM_LEADER` không làm thay đổi phạm vi kiểm tra quyền.

Quyền của Project Role `OBSERVER`:

- Được xem thông tin cơ bản của dự án khi Project Membership đang hoạt động.
- Được xem milestone, task và dữ liệu dự án mà API cho phép đọc.
- Không được tạo hoặc cập nhật dự án.
- Không được chuyển trạng thái dự án.
- Không được quản lý thành viên dự án.
- Không được tạo milestone.
- Không được tạo, cập nhật, xoá hoặc phân công task.
- Không được cập nhật tiến độ hoặc trạng thái task.
- Không được thực hiện thao tác quản trị dự án.
- Mobile phải ẩn các thao tác không được phép.
- Việc mobile ẩn nút không thay thế kiểm tra quyền tại backend.

Quy tắc kiểm tra quyền đối với dữ liệu dự án:

```text
System Role
+ Permission
+ Project Membership
+ Project Role
+ Resource Ownership khi phù hợp
+ Current State
```

Backend là nơi đưa ra quyết định quyền cuối cùng.

Ràng buộc:

```text
UNIQUE (project_id, user_id)
```

### 7.3. Bảng `milestones`

Mục đích:

Quản lý mốc tiến độ của dự án.

Các trường:

```text
id              UUID PRIMARY KEY
project_id      UUID NOT NULL
name            VARCHAR(200) NOT NULL
description     TEXT NULL
due_date        DATE NOT NULL
completed_at    TIMESTAMP WITH TIME ZONE NULL
status          VARCHAR(30) NOT NULL
created_by      UUID NOT NULL
updated_by      UUID NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
version         BIGINT NOT NULL DEFAULT 0
```

Giá trị `status`:

```text
PLANNED
IN_PROGRESS
COMPLETED
OVERDUE
CANCELLED
```

### 7.4. Bảng `project_status_histories`

Mục đích:

Lưu lịch sử thay đổi trạng thái dự án.

Các trường:

```text
id              UUID PRIMARY KEY
project_id      UUID NOT NULL
from_status     VARCHAR(30) NULL
to_status       VARCHAR(30) NOT NULL
reason          VARCHAR(1000) NULL
changed_by      UUID NOT NULL
changed_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

---

## 8. TASK MODULE

### 8.1. Bảng `tasks`

Mục đích:

Quản lý công việc và công việc con.

Các trường:

```text
id                  UUID PRIMARY KEY
project_id          UUID NOT NULL
parent_task_id      UUID NULL
milestone_id        UUID NULL
title               VARCHAR(255) NOT NULL
description         TEXT NULL
status              VARCHAR(30) NOT NULL
priority            VARCHAR(20) NOT NULL
reporter_id         UUID NOT NULL
start_date          DATE NULL
due_date            TIMESTAMP WITH TIME ZONE NULL
completed_at        TIMESTAMP WITH TIME ZONE NULL
progress_percent    NUMERIC(5,2) NOT NULL DEFAULT 0
estimated_minutes   INTEGER NULL
actual_minutes      INTEGER NULL
is_deleted          BOOLEAN NOT NULL DEFAULT FALSE
deleted_at          TIMESTAMP WITH TIME ZONE NULL
deleted_by          UUID NULL
created_by          UUID NOT NULL
updated_by          UUID NULL
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
version             BIGINT NOT NULL DEFAULT 0
```

Giá trị `status`:

```text
TODO
IN_PROGRESS
IN_REVIEW
COMPLETED
CANCELLED
```

Giá trị `priority`:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Ràng buộc:

```text
progress_percent >= 0
progress_percent <= 100
estimated_minutes >= 0
actual_minutes >= 0
parent_task_id <> id
```

Quy tắc:

- Công việc con phải thuộc cùng dự án với công việc cha.
- Không cho phép tạo vòng lặp cha con.
- Task `COMPLETED` có `progress_percent = 100`.
- Task `CANCELLED` không được cập nhật tiến độ.
- `completed_at` được ghi khi chuyển sang `COMPLETED`.

Index:

```text
idx_tasks_project_id
idx_tasks_parent_task_id
idx_tasks_status
idx_tasks_priority
idx_tasks_due_date
idx_tasks_reporter_id
idx_tasks_project_status
```

### 8.2. Bảng `task_assignments`

Mục đích:

Quản lý người được giao thực hiện công việc.

Các trường:

```text
id              UUID PRIMARY KEY
task_id         UUID NOT NULL
assignee_id     UUID NOT NULL
assigned_by     UUID NOT NULL
assigned_at     TIMESTAMP WITH TIME ZONE NOT NULL
unassigned_at   TIMESTAMP WITH TIME ZONE NULL
is_active       BOOLEAN NOT NULL DEFAULT TRUE
```

Ràng buộc:

- Một người chỉ có một phân công đang hoạt động trên cùng công việc.
- Người được giao phải là thành viên đang hoạt động của dự án.

### 8.3. Bảng `task_comments`

Mục đích:

Lưu bình luận công việc.

Các trường:

```text
id              UUID PRIMARY KEY
task_id         UUID NOT NULL
author_id       UUID NOT NULL
content         TEXT NOT NULL
parent_id       UUID NULL
is_edited       BOOLEAN NOT NULL DEFAULT FALSE
edited_at       TIMESTAMP WITH TIME ZONE NULL
is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

Ràng buộc:

- Nội dung không được rỗng.
- Bình luận trả lời phải thuộc cùng một công việc.

### 8.4. Bảng `task_attachments`

Mục đích:

Liên kết công việc với tệp.

Các trường:

```text
id              UUID PRIMARY KEY
task_id         UUID NOT NULL
file_id         UUID NOT NULL
uploaded_by     UUID NOT NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

Ràng buộc:

```text
UNIQUE (task_id, file_id)
```

### 8.5. Bảng `task_status_histories`

Mục đích:

Lưu lịch sử thay đổi trạng thái công việc.

Các trường:

```text
id              UUID PRIMARY KEY
task_id         UUID NOT NULL
from_status     VARCHAR(30) NULL
to_status       VARCHAR(30) NOT NULL
comment         VARCHAR(1000) NULL
changed_by      UUID NOT NULL
changed_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

---

## 9. SERVICE REQUEST MODULE

### 9.1. Bảng `service_categories`

Mục đích:

Quản lý danh mục yêu cầu dịch vụ.

Các trường:

```text
id                  UUID PRIMARY KEY
parent_id           UUID NULL
code                VARCHAR(50) NOT NULL
name                VARCHAR(150) NOT NULL
description         VARCHAR(500) NULL
default_priority    VARCHAR(20) NOT NULL
is_active           BOOLEAN NOT NULL DEFAULT TRUE
is_deleted          BOOLEAN NOT NULL DEFAULT FALSE
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
version             BIGINT NOT NULL DEFAULT 0
```

Ví dụ danh mục:

```text
IT_SUPPORT
HUMAN_RESOURCES
ADMINISTRATION
FACILITY
ACCESS_REQUEST
PURCHASING
MAINTENANCE
```

### 9.2. Bảng `service_requests`

Mục đích:

Lưu yêu cầu dịch vụ nội bộ.

Các trường:

```text
id                  UUID PRIMARY KEY
request_number      VARCHAR(30) NOT NULL
category_id         UUID NOT NULL
requester_id        UUID NOT NULL
asset_id            UUID NULL
title               VARCHAR(255) NOT NULL
description         TEXT NOT NULL
priority            VARCHAR(20) NOT NULL
status              VARCHAR(30) NOT NULL
resolved_at         TIMESTAMP WITH TIME ZONE NULL
closed_at           TIMESTAMP WITH TIME ZONE NULL
cancelled_at        TIMESTAMP WITH TIME ZONE NULL
is_deleted          BOOLEAN NOT NULL DEFAULT FALSE
created_by          UUID NOT NULL
updated_by          UUID NULL
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
version             BIGINT NOT NULL DEFAULT 0
```

Giá trị `priority`:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Giá trị `status`:

```text
OPEN
ASSIGNED
IN_PROGRESS
WAITING_FOR_USER
RESOLVED
CLOSED
CANCELLED
```

Ràng buộc:

- `request_number` là duy nhất.
- `title` và `description` không được rỗng.
- Chỉ yêu cầu `RESOLVED` mới chuyển sang `CLOSED`.
- Yêu cầu `CLOSED` hoặc `CANCELLED` không cập nhật nội dung nghiệp vụ thông thường.

Index:

```text
uk_service_requests_request_number
idx_service_requests_requester_id
idx_service_requests_category_id
idx_service_requests_asset_id
idx_service_requests_status
idx_service_requests_priority
idx_service_requests_created_at
```

### 9.3. Bảng `service_assignments`

Mục đích:

Quản lý người xử lý yêu cầu dịch vụ.

Các trường:

```text
id              UUID PRIMARY KEY
request_id      UUID NOT NULL
assignee_id     UUID NOT NULL
assigned_by     UUID NOT NULL
assigned_at     TIMESTAMP WITH TIME ZONE NOT NULL
unassigned_at   TIMESTAMP WITH TIME ZONE NULL
is_active       BOOLEAN NOT NULL DEFAULT TRUE
```

### 9.4. Bảng `service_comments`

Mục đích:

Lưu trao đổi trong yêu cầu dịch vụ.

Các trường:

```text
id              UUID PRIMARY KEY
request_id      UUID NOT NULL
author_id       UUID NOT NULL
content         TEXT NOT NULL
is_internal     BOOLEAN NOT NULL DEFAULT FALSE
is_edited       BOOLEAN NOT NULL DEFAULT FALSE
edited_at       TIMESTAMP WITH TIME ZONE NULL
is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

`is_internal` dùng cho ghi chú chỉ người xử lý hoặc quản trị viên được xem.

### 9.5. Bảng `service_attachments`

Mục đích:

Liên kết yêu cầu dịch vụ với tệp.

Các trường:

```text
id              UUID PRIMARY KEY
request_id      UUID NOT NULL
file_id         UUID NOT NULL
uploaded_by     UUID NOT NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

### 9.6. Bảng `service_status_histories`

Mục đích:

Lưu lịch sử trạng thái yêu cầu.

Các trường:

```text
id              UUID PRIMARY KEY
request_id      UUID NOT NULL
from_status     VARCHAR(30) NULL
to_status       VARCHAR(30) NOT NULL
comment         VARCHAR(1000) NULL
changed_by      UUID NOT NULL
changed_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

### 9.7. Bảng `service_ratings`

Mục đích:

Lưu đánh giá sau khi yêu cầu hoàn tất.

Các trường:

```text
id              UUID PRIMARY KEY
request_id      UUID NOT NULL UNIQUE
rated_by        UUID NOT NULL
score           SMALLINT NOT NULL
comment         VARCHAR(2000) NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

Ràng buộc:

```text
score >= 1
score <= 5
```

Quy tắc:

- Chỉ người tạo yêu cầu được đánh giá.
- Chỉ yêu cầu `CLOSED` được đánh giá.
- Mỗi yêu cầu chỉ có một đánh giá.

---

## 10. ASSET MODULE

### 10.1. Bảng `asset_categories`

Mục đích:

Quản lý loại tài sản.

Các trường:

```text
id              UUID PRIMARY KEY
code            VARCHAR(50) NOT NULL
name            VARCHAR(150) NOT NULL
description     VARCHAR(500) NULL
is_active       BOOLEAN NOT NULL DEFAULT TRUE
is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
version         BIGINT NOT NULL DEFAULT 0
```

### 10.2. Bảng `assets`

Mục đích:

Lưu thông tin tài sản.

Các trường:

```text
id                  UUID PRIMARY KEY
asset_code          VARCHAR(50) NOT NULL
category_id         UUID NOT NULL
name                VARCHAR(200) NOT NULL
description         TEXT NULL
serial_number       VARCHAR(150) NULL
manufacturer        VARCHAR(150) NULL
model               VARCHAR(150) NULL
purchase_date       DATE NULL
purchase_price      NUMERIC(18,2) NULL
warranty_end_date   DATE NULL
status              VARCHAR(30) NOT NULL
location            VARCHAR(255) NULL
is_deleted          BOOLEAN NOT NULL DEFAULT FALSE
deleted_at          TIMESTAMP WITH TIME ZONE NULL
deleted_by          UUID NULL
created_by          UUID NOT NULL
updated_by          UUID NULL
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
version             BIGINT NOT NULL DEFAULT 0
```

Giá trị `status`:

```text
AVAILABLE
ASSIGNED
MAINTENANCE
BROKEN
RETIRED
```

Ràng buộc:

- `asset_code` là duy nhất.
- `serial_number` là duy nhất khi có giá trị.
- `purchase_price >= 0`.
- Tài sản `RETIRED` không được cấp phát lại.

Index:

```text
uk_assets_asset_code
uk_assets_serial_number
idx_assets_category_id
idx_assets_status
idx_assets_name
```

### 10.3. Bảng `asset_assignments`

Mục đích:

Quản lý việc cấp phát tài sản.

Các trường:

```text
id              UUID PRIMARY KEY
asset_id        UUID NOT NULL
assigned_to     UUID NOT NULL
assigned_by     UUID NOT NULL
assigned_at     TIMESTAMP WITH TIME ZONE NOT NULL
expected_return_at TIMESTAMP WITH TIME ZONE NULL
returned_at     TIMESTAMP WITH TIME ZONE NULL
return_condition VARCHAR(500) NULL
status          VARCHAR(30) NOT NULL
notes           VARCHAR(1000) NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
version         BIGINT NOT NULL DEFAULT 0
```

Giá trị `status`:

```text
ACTIVE
RETURNED
LOST
DAMAGED
```

Quy tắc:

- Một tài sản chỉ có tối đa một cấp phát `ACTIVE`.
- Chỉ tài sản `AVAILABLE` mới được cấp phát.
- Khi cấp phát thành công, tài sản chuyển sang `ASSIGNED`.
- Khi trả thành công, tài sản chuyển về `AVAILABLE` hoặc trạng thái phù hợp với tình trạng trả.

### 10.4. Bảng `asset_repair_histories`

Mục đích:

Lưu lịch sử sửa chữa hoặc bảo trì tài sản.

Các trường:

```text
id                  UUID PRIMARY KEY
asset_id            UUID NOT NULL
service_request_id  UUID NULL
repair_type         VARCHAR(50) NOT NULL
description         TEXT NOT NULL
vendor_name         VARCHAR(255) NULL
cost                NUMERIC(18,2) NULL
started_at          TIMESTAMP WITH TIME ZONE NOT NULL
completed_at        TIMESTAMP WITH TIME ZONE NULL
result              VARCHAR(1000) NULL
created_by          UUID NOT NULL
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
```

Giá trị `repair_type`:

```text
MAINTENANCE
REPAIR
INSPECTION
UPGRADE
```

Ràng buộc:

```text
cost >= 0
completed_at >= started_at
```

---

## 11. NOTIFICATION MODULE

### 11.1. Bảng `notifications`

Mục đích:

Lưu thông báo của người dùng.

Các trường:

```text
id              UUID PRIMARY KEY
recipient_id    UUID NOT NULL
event_key       VARCHAR(255) NOT NULL
type            VARCHAR(50) NOT NULL
title           VARCHAR(255) NOT NULL
message         VARCHAR(2000) NOT NULL
reference_type  VARCHAR(50) NULL
reference_id    UUID NULL
is_read         BOOLEAN NOT NULL DEFAULT FALSE
read_at         TIMESTAMP WITH TIME ZONE NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

Ví dụ `type`:

```text
PROJECT_MEMBER_ADDED
TASK_ASSIGNED
TASK_STATUS_CHANGED
TASK_DUE_SOON
TASK_OVERDUE
SERVICE_REQUEST_UPDATED
COMMENT_ADDED
ASSET_ASSIGNED
```

Ví dụ `reference_type`:

```text
PROJECT
TASK
SERVICE_REQUEST
ASSET
```

Ràng buộc:

```text
CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
UNIQUE (recipient_id, event_key) (uk_notifications_recipient_event)
```

Index:

```text
idx_notifications_recipient_id (recipient_id)
idx_notifications_recipient_read (recipient_id, is_read)
idx_notifications_created_at (created_at)
uk_notifications_recipient_event (recipient_id, event_key) [Bổ sung qua V017]
idx_notifications_recipient_created_at (recipient_id, created_at DESC) [Bổ sung qua V017]
```

*Đánh giá chỉ mục Phase 11*:
- Giữ nguyên toàn bộ 3 chỉ mục hiện hữu từ V010 (`idx_notifications_recipient_id`, `idx_notifications_recipient_read`, `idx_notifications_created_at`).
- V017 bổ sung `uk_notifications_recipient_event` và `idx_notifications_recipient_created_at`.
- Chưa bổ sung index phức hợp `(recipient_id, is_read, created_at DESC)` trong Phase 11 để tránh tối ưu hóa phỏng đoán trước khi có dữ liệu đo đạc query plan thực tế.

### 11.2. Bảng `notification_preferences`

Mục đích:

Lưu tuỳ chọn nhận thông báo.

Các trường:

```text
id                  UUID PRIMARY KEY
user_id             UUID NOT NULL
notification_type   VARCHAR(50) NOT NULL
in_app_enabled      BOOLEAN NOT NULL DEFAULT TRUE
push_enabled        BOOLEAN NOT NULL DEFAULT TRUE
email_enabled       BOOLEAN NOT NULL DEFAULT FALSE
updated_at          TIMESTAMP WITH TIME ZONE NOT NULL
```

Ràng buộc:

```text
UNIQUE (user_id, notification_type)
```

*Ghi chú về phân phối, cơ chế chèn và lưu trữ Phase 11*:
- Phase 11 sử dụng In-app Database Notification Center.
- Cơ chế chèn CSDL: Sử dụng PostgreSQL native `INSERT ... ON CONFLICT (recipient_id, event_key) DO NOTHING`. Trả về `1` (thành công) hoặc `0` (lũy đẳng/duplicate success), không dùng bắt lỗi unique violation làm control flow.
- Nếu `in_app_enabled = false` tại thời điểm sự kiện, hệ thống bỏ qua và không tạo bản ghi thông báo; không giữ hàng đợi pending và không backfill khi bật lại tùy chọn.
- `push_enabled` và `email_enabled` lưu trữ tùy chọn người dùng cho các pha tương lai; chưa tạo side-effect gửi push/email ở Phase 11.
- Không tự động xóa hoặc lập lịch dọn dẹp thông báo trong Phase 11 (`NOTIFICATION_RETENTION_CLEANUP_DEFERRED`).

---

## 12. FILE MODULE

### 12.1. Bảng `stored_files`

Mục đích:

Lưu metadata của tệp.

Các trường:

```text
id                  UUID PRIMARY KEY
original_name       VARCHAR(255) NOT NULL
stored_name         VARCHAR(255) NOT NULL
storage_path        VARCHAR(1000) NOT NULL
mime_type           VARCHAR(150) NOT NULL
extension           VARCHAR(20) NULL
size_bytes          BIGINT NOT NULL
checksum_sha256     VARCHAR(64) NOT NULL
uploaded_by         UUID NOT NULL
status              VARCHAR(30) NOT NULL
created_at          TIMESTAMP WITH TIME ZONE NOT NULL
deleted_at          TIMESTAMP WITH TIME ZONE NULL
```

Giá trị `status`:

```text
ACTIVE
QUARANTINED
DELETED
```

Ràng buộc:

```text
size_bytes > 0
```

Quy tắc:

- Không dùng `original_name` làm tên lưu thực tế.
- `stored_name` phải được hệ thống tạo.
- Không lưu nội dung file trực tiếp trong bảng này.
- File phải được kiểm tra loại và dung lượng trước khi lưu.
- Download file phải kiểm tra quyền truy cập dữ liệu liên quan.

Checksum SHA-256 là mã đại diện cho nội dung file, dùng để kiểm tra file có bị thay đổi hoặc trùng lặp hay không.

---

## 13. AUDIT MODULE

### 13.1. Bảng `audit_logs`

Mục đích:

Ghi lại các hành động quan trọng.

Các trường:

```text
id              UUID PRIMARY KEY
actor_id        UUID NULL
action          VARCHAR(100) NOT NULL
module          VARCHAR(50) NOT NULL
entity_type     VARCHAR(100) NULL
entity_id       UUID NULL
description     VARCHAR(2000) NULL
old_values      JSONB NULL
new_values      JSONB NULL
ip_address      VARCHAR(64) NULL
user_agent      VARCHAR(500) NULL
trace_id        VARCHAR(100) NULL
created_at      TIMESTAMP WITH TIME ZONE NOT NULL
```

Quy tắc:

- Không ghi mật khẩu.
- Không ghi access token.
- Không ghi refresh token.
- Không ghi dữ liệu tệp nhị phân.
- Dữ liệu nhạy cảm phải được che trước khi lưu.
- Audit log không được sửa bởi người dùng thông thường.

JSONB là kiểu dữ liệu JSON được PostgreSQL tối ưu cho lưu trữ và truy vấn.

Index:

```text
idx_audit_logs_actor_id
idx_audit_logs_module
idx_audit_logs_entity
idx_audit_logs_action
idx_audit_logs_created_at
idx_audit_logs_trace_id
```

---

## 14. Quan hệ chính giữa các bảng

```text
departments
    └── users

departments
    └── teams
          └── team_members
                └── users

users
    ├── user_roles
    │       └── roles
    │               └── role_permissions
    │                       └── permissions
    ├── refresh_tokens
    ├── login_sessions
    ├── password_reset_tokens
    └── idempotent_requests

projects
    ├── project_members
    │     └── users
    ├── milestones
    ├── project_status_histories
    └── tasks
          ├── task_assignments
          │     └── users
          ├── task_comments
          ├── task_attachments
          │     └── stored_files
          └── task_status_histories

service_categories
    └── service_requests
          ├── service_assignments
          │     └── users
          ├── service_comments
          ├── service_attachments
          │     └── stored_files
          ├── service_status_histories
          └── service_ratings

asset_categories
    └── assets
          ├── asset_assignments
          │     └── users
          ├── asset_repair_histories
          └── service_requests

users
    └── notifications
```

---

## 15. Quy tắc Foreign Key

Foreign Key là ràng buộc đảm bảo bản ghi được tham chiếu phải tồn tại.

Quy tắc xoá:

### RESTRICT

Không cho xoá bản ghi cha khi còn dữ liệu đang tham chiếu.

Áp dụng cho:

- users đang có project hoặc task.
- projects đang có task.
- assets đang có cấp phát hoạt động.
- service_categories đang được sử dụng.

### CASCADE

Khi xoá bản ghi cha thì tự xoá bảng liên kết không còn ý nghĩa.

Chỉ áp dụng có kiểm soát cho:

- user_roles khi xoá vật lý user thử nghiệm.
- role_permissions khi xoá role thử nghiệm.
- notification_preferences khi xoá user thử nghiệm.

Không dùng CASCADE tuỳ tiện cho dữ liệu nghiệp vụ chính.

### SET NULL

Khi bản ghi được tham chiếu không còn sử dụng, giữ bản ghi hiện tại nhưng đặt khoá ngoại thành null.

Có thể áp dụng cho:

- avatar_file_id.
- asset_id trong yêu cầu dịch vụ.
- milestone_id trong task.
- manager_id trong phòng ban.

---

## 16. Index

Index giúp database tìm dữ liệu nhanh hơn nhưng làm tăng chi phí khi ghi dữ liệu.

Cần tạo index cho:

- Khoá ngoại thường xuyên truy vấn.
- Trạng thái thường xuyên lọc.
- Ngày đến hạn.
- Người được giao.
- Người yêu cầu.
- Mã nghiệp vụ.
- Email và tên đăng nhập.
- Thời gian tạo khi sắp xếp danh sách.

Không tạo index cho mọi cột.

Các truy vấn danh sách phải được kiểm tra bằng kế hoạch thực thi khi dữ liệu đủ lớn.

---

## 17. Quy tắc phân trang

Các API danh sách phải sử dụng phân trang.

Giá trị mặc định:

```text
page = 0
size = 20
```

Giới hạn:

```text
size tối thiểu = 1
size tối đa = 100
```

Cho phép sắp xếp trên các trường đã được kiểm soát.

Không đưa trực tiếp tên cột do người dùng gửi vào câu SQL.

Danh sách cần phân trang:

- Người dùng.
- Dự án.
- Công việc.
- Yêu cầu dịch vụ.
- Tài sản.
- Thông báo.
- Audit log.

---

## 18. Quy tắc dữ liệu thời gian

- Database lưu thời gian theo UTC.
- Backend trả thời gian theo ISO-8601.
- Mobile chuyển đổi sang múi giờ thiết bị khi hiển thị.
- Date không có thời gian dùng kiểu `DATE`.
- Thời điểm cụ thể dùng `TIMESTAMP WITH TIME ZONE`.
- Không lưu ngày giờ dưới dạng chuỗi tuỳ ý.
- Không dùng thời gian của mobile làm thời gian chính thức cho nghiệp vụ quan trọng.

---

## 19. Quy tắc dữ liệu tiền tệ

Các giá trị tiền sử dụng:

```text
NUMERIC(18,2)
```

Áp dụng cho:

- purchase_price.
- repair cost.

Không dùng kiểu số thực `FLOAT` hoặc `DOUBLE` cho tiền.

---

## 20. Quy tắc bảo mật dữ liệu

- Mật khẩu chỉ lưu dưới dạng hash mạnh.
- Refresh token chỉ lưu token hash.
- Không lưu access token.
- Không ghi token vào audit log.
- Không trả password hash qua API.
- Không đưa thông tin nhạy cảm vào thông báo lỗi.
- API phải lọc dữ liệu theo quyền người dùng.
- Query không được chỉ dựa vào ID mà bỏ qua phạm vi truy cập.
- File phải kiểm tra quyền trước khi tải.
- Audit log chỉ cho người có quyền phù hợp truy cập.
- Dữ liệu mẫu không sử dụng thông tin cá nhân thật.

---

## 21. Quy tắc toàn vẹn nghiệp vụ

### 21.1. Dự án

- Người quản lý dự án phải là người dùng đang hoạt động.
- Thành viên dự án không được thêm trùng.
- Dự án hoàn thành hoặc huỷ không tạo task mới.
- Ngày kết thúc dự kiến không nhỏ hơn ngày bắt đầu.

### 21.2. Công việc

- Task phải thuộc một dự án.
- Người được giao phải thuộc dự án.
- Task con phải thuộc cùng dự án với task cha.
- Không tạo chu trình task cha con.
- Task hoàn thành phải có tiến độ 100%.
- Task huỷ không tiếp tục cập nhật tiến độ.
- Chuyển trạng thái phải tuân theo workflow.

### 21.3. Yêu cầu dịch vụ

- Người tạo yêu cầu phải là người dùng hoạt động.
- Yêu cầu đóng phải đã được xử lý.
- Đánh giá chỉ thực hiện sau khi đóng.
- Người đánh giá phải là người tạo yêu cầu.
- Mỗi yêu cầu chỉ có một đánh giá.

### 21.4. Tài sản

- Mỗi tài sản chỉ có một cấp phát đang hoạt động.
- Tài sản nghỉ sử dụng không được cấp phát.
- Tài sản đang bảo trì hoặc bị hỏng không được cấp phát.
- Khi báo hỏng tài sản, yêu cầu dịch vụ phải liên kết đúng tài sản.

---

## 22. Dữ liệu khởi tạo

Migration ban đầu cần tạo các vai trò:

```text
EMPLOYEE
TEAM_LEADER
PROJECT_MANAGER
ADMIN
```

Tạo các quyền tối thiểu:

```text
PROFILE_READ
PROFILE_UPDATE

PROJECT_READ
PROJECT_CREATE
PROJECT_UPDATE
PROJECT_MEMBER_MANAGE

TASK_READ
TASK_CREATE
TASK_UPDATE
TASK_DELETE
TASK_ASSIGN
TASK_UPDATE_STATUS

SERVICE_REQUEST_READ
SERVICE_REQUEST_CREATE
SERVICE_REQUEST_UPDATE
SERVICE_REQUEST_ASSIGN
SERVICE_REQUEST_UPDATE_STATUS
SERVICE_CATEGORY_MANAGE

ASSET_READ
ASSET_MANAGE
ASSET_CATEGORY_MANAGE

NOTIFICATION_READ
NOTIFICATION_UPDATE

USER_READ
USER_MANAGE
ROLE_MANAGE
DEPARTMENT_MANAGE

AUDIT_READ
REPORT_READ
```

Tài khoản quản trị ban đầu không được hard-code mật khẩu trong migration.

Mật khẩu quản trị ban đầu phải được cung cấp qua biến môi trường hoặc cơ chế khởi tạo an toàn.

Hard-code nghĩa là ghi trực tiếp một giá trị cố định vào source code hoặc file migration.

---

## 23. Thứ tự migration dự kiến

```text
V001__create_identity_tables.sql
V002__create_organization_tables.sql
V003__create_project_tables.sql
V004__create_file_tables.sql
V005__create_task_tables.sql
V006__create_asset_tables.sql
V007__create_service_request_tables.sql
V008__create_notification_tables.sql
V009__create_audit_tables.sql
V010__create_deferred_foreign_keys_indexes_and_constraints.sql
V011__seed_roles_and_permissions.sql
```

`V001__create_identity_tables.sql` tạo đủ các bảng sau:

```text
users
roles
permissions
user_roles
role_permissions
refresh_tokens
login_sessions
password_reset_tokens
idempotent_requests
```

### 23.1. Thứ tự phụ thuộc giữa các migration

Thứ tự phụ thuộc chính:

```text
Identity
→ Organization
→ Project
→ File
→ Task
→ Asset
→ Service Request
→ Notification
→ Audit
→ Deferred Foreign Keys, Indexes và Constraints
→ Seed
```

File Module phải được tạo trước Task Module vì bảng `task_attachments` có trường `file_id` tham chiếu đến bảng `stored_files`.

Các Foreign Key có quan hệ vòng hoặc tham chiếu đến bảng được tạo ở migration sau không được đặt ngay trong migration tạo bảng ban đầu.

Các Foreign Key sau phải được trì hoãn đến:

```text
V010__create_deferred_foreign_keys_indexes_and_constraints.sql
```

Danh sách Foreign Key trì hoãn tối thiểu:

```text
users.department_id
→ departments.id

departments.manager_id
→ users.id

asset_repair_histories.service_request_id
→ service_requests.id
```

Giải thích:

- `users.department_id` không thể tạo đầy đủ trong `V001` vì bảng `departments` chỉ được tạo trong `V002`.
- `departments.manager_id` tham chiếu ngược về bảng `users`, tạo quan hệ vòng giữa Identity Module và Organization Module.
- `asset_repair_histories.service_request_id` không thể tạo trong `V006` vì bảng `service_requests` chỉ được tạo trong `V007`.
- `task_attachments.file_id` có thể được tạo trực tiếp trong `V005` vì bảng `stored_files` đã được tạo trước trong `V004`.

Khi tạo các bảng ban đầu:

- `users.department_id` được khai báo là cột UUID nhưng chưa tạo Foreign Key trong `V001`.
- `departments.manager_id` được khai báo là cột UUID nhưng chưa tạo Foreign Key trong `V002`.
- `asset_repair_histories.service_request_id` được khai báo là cột UUID nhưng chưa tạo Foreign Key trong `V006`.
- Ba Foreign Key trên được bổ sung trong `V010`.
- Các index liên quan được tạo sau khi Foreign Key đã được bổ sung thành công.

Các migration đã được áp dụng trên môi trường dùng chung không được đổi tên hoặc sửa nội dung. Thứ tự trên áp dụng khi dự án bắt đầu tạo migration lần đầu hoặc khi database chưa được chia sẻ.

Tên migration không được thay đổi sau khi migration đã được chạy trên môi trường dùng chung.

Nếu cần sửa cấu trúc, tạo migration mới thay vì sửa migration cũ.

---

## 24. Những bảng chưa triển khai trong MVP

Các bảng dưới đây chưa tạo trong giai đoạn đầu:

- sprints
- backlog_items
- project_risks
- approval_requests
- approval_steps
- work_logs
- timesheets
- push_notification_devices
- chat_rooms
- chat_messages
- asset_audits
- sla_policies
- escalation_rules

Các bảng này thuộc giai đoạn mở rộng và chỉ được bổ sung sau khi cập nhật phạm vi dự án.

---

## 25. Quy tắc dành cho AI Agent

AI Agent phải tuân thủ:

1. Đọc tài liệu này trước khi tạo Entity hoặc migration.
2. Không tự thêm bảng ngoài tài liệu.
3. Không tự đổi tên bảng hoặc cột.
4. Không thay UUID bằng ID tăng dần.
5. Không tạo quan hệ hai chiều JPA nếu không thực sự cần.
6. Không dùng cascade toàn bộ một cách tuỳ tiện.
7. Không trả JPA Entity trực tiếp qua API.
8. Không dùng `ddl-auto=create` hoặc `ddl-auto=update` trên môi trường dùng chung.
9. Mọi thay đổi database phải có migration.
10. Không sửa migration đã được áp dụng.
11. Phải tạo index cho foreign key và truy vấn quan trọng.
12. Phải viết kiểm thử repository cho truy vấn phức tạp.
13. Phải kiểm tra workflow trước khi đổi trạng thái.
14. Phải dùng transaction cho nghiệp vụ thay đổi nhiều bảng.
15. Không lưu mật khẩu, token hoặc secret dạng văn bản thuần.
16. Không xoá dữ liệu lịch sử.
17. Không tự thêm dữ liệu mẫu vào production.
18. Khi phát hiện thiết kế chưa đủ, phải cập nhật tài liệu trước khi sửa code.

---

## 26. Các quyết định database đã khóa

- PostgreSQL là cơ sở dữ liệu chính.
- UUID là kiểu định danh chính.
- Flyway quản lý migration.
- Thời gian lưu theo UTC.
- Hibernate không tự ý cập nhật schema ngoài môi trường thử nghiệm cá nhân.
- Dữ liệu nghiệp vụ quan trọng sử dụng Soft Delete khi phù hợp.
- Bảng lịch sử không bị xoá vật lý.
- JWT token không được lưu nguyên bản.
- Refresh token chỉ lưu dưới dạng hash.
- File lưu ngoài database, database chỉ lưu metadata.
- Audit log không chứa secret.
- Tiền sử dụng NUMERIC, không dùng FLOAT.
- API danh sách phải phân trang.
- Trạng thái được lưu bằng mã tiếng Anh cố định.
- Mobile không được quyết định quyền truy cập.
- Backend chịu trách nhiệm bảo vệ dữ liệu.

Mọi thay đổi đối với các quyết định trên phải được cập nhật trong tài liệu trước khi tạo migration hoặc sửa Entity.