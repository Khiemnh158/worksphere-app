# VAI TRÒ VÀ LUỒNG NGHIỆP VỤ WORKSPHERE

## 1. Mục đích tài liệu

Tài liệu này xác định vai trò, quyền hạn và luồng thao tác chính trong WorkSphere.

Mọi giao diện, API, bảng dữ liệu và chức năng sau này phải tuân theo tài liệu này. Không tự ý thêm trạng thái, vai trò hoặc bước xử lý khi chưa cập nhật tài liệu.

---

## 2. Vai trò người dùng

### 2.0. Phân loại và ánh xạ vai trò

WorkSphere phân biệt ba loại vai trò:
```text
System Role
Project Role
Team Member Role
```

Ánh xạ System Role:
```text
Nhân viên          → EMPLOYEE
Trưởng nhóm        → TEAM_LEADER
Quản lý dự án      → PROJECT_MANAGER
Quản trị viên      → ADMIN
```

System Role là vai trò toàn hệ thống, được lưu thông qua bảng `roles` và `user_roles`.

Project Role là vai trò của người dùng trong một dự án cụ thể, được lưu tại `project_members.project_role`.

Các Project Role:
```text
PROJECT_MANAGER
TEAM_LEADER
MEMBER
OBSERVER
```

Team Member Role là vai trò của người dùng trong một nhóm, được lưu tại `team_members.member_role`.

Các Team Member Role:
```text
LEADER
MEMBER
```

Quy tắc phân biệt:

- System Role không thay thế Project Role.
- Project Role không thay thế System Role.
- Team Member Role chỉ có hiệu lực trong Team tương ứng.
- Một người có System Role `PROJECT_MANAGER` không tự động được quản lý mọi dự án.
- Một người có System Role `TEAM_LEADER` không tự động là Team Leader hoặc Project Team Leader trong mọi phạm vi.
- Người dùng phải có Project Membership đang hoạt động để truy cập dữ liệu riêng của dự án.
- Quyền cuối cùng phải kết hợp System Role, Permission, Project Membership, Project Role, Resource Ownership và trạng thái hiện tại khi phù hợp.
- Backend là nơi quyết định quyền cuối cùng.
- Mobile chỉ ẩn hoặc hiện thao tác để cải thiện trải nghiệm, không thay thế kiểm tra quyền backend.

### 2.1. Nhân viên

Mã System Role:

```text
EMPLOYEE
```

Nhân viên có thể:

- Đăng nhập và đăng xuất.
- Xem, cập nhật hồ sơ cá nhân.
- Xem các dự án đang tham gia.
- Xem công việc được giao.
- Cập nhật tiến độ công việc.
- Bình luận và đính kèm tệp vào công việc.
- Tạo và theo dõi yêu cầu dịch vụ.
- Xem tài sản được cấp.
- Báo hỏng tài sản.
- Nhận và đọc thông báo.

Nhân viên không được:

- Tạo hoặc xoá dự án.
- Quản lý người dùng.
- Tự phân quyền.
- Xem dữ liệu của dự án không tham gia.
- Thay đổi công việc không liên quan.

### 2.2. Trưởng nhóm

Mã System Role:

```text
TEAM_LEADER
```

Trưởng nhóm có toàn bộ quyền của Nhân viên và có thể:

- Tạo công việc trong dự án hoặc nhóm được quản lý.
- Chỉnh sửa công việc do nhóm phụ trách.
- Phân công người thực hiện.
- Tạo công việc con.
- Thiết lập mức độ ưu tiên và thời hạn.
- Theo dõi tiến độ thành viên.
- Xác nhận công việc hoàn thành.
- Xem công việc quá hạn của nhóm.

Trưởng nhóm không được:

- Quản lý người dùng toàn hệ thống.
- Thay đổi vai trò hệ thống.
- Xem hoặc quản lý dự án không được phân công.

### 2.3. Quản lý dự án

Mã System Role:

```text
PROJECT_MANAGER
```

Quản lý dự án có thể:

- Tạo và cập nhật dự án.
- Quản lý thông tin dự án.
- Thêm hoặc loại thành viên khỏi dự án.
- Gán vai trò trong dự án.
- Tạo mốc tiến độ.
- Theo dõi tiến độ tổng thể.
- Tạo, chỉnh sửa và phân công công việc.
- Xem công việc quá hạn.
- Đóng dự án khi hoàn thành.

Quản lý dự án chỉ được quản lý các dự án thuộc phạm vi phụ trách.

### 2.4. Quản trị viên

Mã System Role:

```text
ADMIN
```

Quản trị viên có thể:

- Quản lý tài khoản người dùng.
- Khoá hoặc mở khoá tài khoản.
- Quản lý phòng ban.
- Quản lý vai trò và quyền.
- Quản lý danh mục yêu cầu dịch vụ.
- Quản lý danh mục tài sản.
- Theo dõi nhật ký hoạt động.
- Cấu hình các danh mục dùng chung.

Quản trị viên không tự động trở thành người quản lý mọi dự án. Việc tham gia dự án vẫn phải được gán rõ ràng.

---

### 2.5. Project Role OBSERVER

`OBSERVER` là Project Role chỉ đọc trong một dự án cụ thể.

Điều kiện:

- Người dùng phải có Project Membership đang hoạt động.
- Vai trò `OBSERVER` chỉ có hiệu lực trong dự án đã được gán.
- `OBSERVER` không phải System Role.
- `OBSERVER` không cấp quyền trên dự án khác.

`OBSERVER` được phép:

- Xem thông tin cơ bản của dự án.
- Xem milestone mà API cho phép đọc.
- Xem danh sách và chi tiết task mà API cho phép đọc.
- Xem tiến độ và lịch sử trạng thái theo quyền đọc.
- Nhận thông báo liên quan đến dự án khi được cấu hình.

`OBSERVER` không được phép:

- Tạo hoặc cập nhật dự án.
- Chuyển trạng thái dự án.
- Quản lý thành viên dự án.
- Tạo milestone.
- Tạo, cập nhật hoặc xóa task.
- Phân công hoặc thay đổi người thực hiện task.
- Cập nhật tiến độ task.
- Chuyển trạng thái task.
- Thực hiện thao tác quản trị dự án.

Quy tắc kiểm tra:

```text
Project Membership đang hoạt động
+ Project Role OBSERVER
+ Permission đọc phù hợp
+ phạm vi đúng dự án
```

Việc mobile ẩn nút không thay thế kiểm tra quyền tại backend.

---

### 2.6. Canonical Role-Permission Matrix

Bảng ma trận phân quyền chính thức (Canonical Role-Permission Matrix) quy định toàn bộ 29 quyền hệ thống (được định nghĩa tại migration `V011`) cho 4 System Roles của WorkSphere:

| Permission | ADMIN | PROJECT_MANAGER | TEAM_LEADER | EMPLOYEE | Business relation required | Canonical rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PROFILE_READ` | GRANTED | GRANTED | GRANTED | GRANTED | Bản ghi hồ sơ cá nhân của chính mình (Self profile) | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1; `06_API_CONTRACT.md` 9.1 |
| `PROFILE_UPDATE` | GRANTED | GRANTED | GRANTED | GRANTED | Bản ghi hồ sơ cá nhân của chính mình (Self profile) | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1; `06_API_CONTRACT.md` 9.2 |
| `PROJECT_READ` | GRANTED | GRANTED | GRANTED | GRANTED | Thành viên dự án đang hoạt động (Active Project Member) hoặc phạm vi quản trị canonical của ADMIN | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1 (74), 2.2, 2.3 (131); `06_API_CONTRACT.md` 11.1, 11.3 |
| `PROJECT_CREATE` | GRANTED | GRANTED | NOT_GRANTED | NOT_GRANTED | Phạm vi quản lý dự án (PM/Admin) | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1 (85), 2.3 (126); `06_API_CONTRACT.md` 11.2 |
| `PROJECT_UPDATE` | GRANTED | GRANTED | NOT_GRANTED | NOT_GRANTED | PM phụ trách dự án hoặc Admin | `02_USER_ROLES_AND_WORKFLOWS.md` 2.3 (126, 136); `06_API_CONTRACT.md` 11.4 |
| `PROJECT_MEMBER_MANAGE` | GRANTED | GRANTED | NOT_GRANTED | NOT_GRANTED | PM phụ trách dự án hoặc Admin | `02_USER_ROLES_AND_WORKFLOWS.md` 2.3 (128), 4.3; `06_API_CONTRACT.md` 11.7-11.9 |
| `TASK_READ` | GRANTED | GRANTED | GRANTED | GRANTED | Thành viên dự án, người thực hiện (assignee), hoặc Admin | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1 (75); `06_API_CONTRACT.md` 12.1, 12.3 |
| `TASK_CREATE` | GRANTED | GRANTED | GRANTED | NOT_GRANTED | Thành viên dự án với vai trò PM/Leader trong dự án hoặc nhóm | `02_USER_ROLES_AND_WORKFLOWS.md` 2.2 (101), 2.3 (132), 5.1; `06_API_CONTRACT.md` 12.2, 12.11 |
| `TASK_UPDATE` | GRANTED | GRANTED | GRANTED | GRANTED | Người thực hiện (cập nhật tiến độ), người tạo, Leader/PM dự án, hoặc Admin | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1 (76), 2.2 (102), 2.3 (132); `06_API_CONTRACT.md` 12.4, 12.6 |
| `TASK_DELETE` | GRANTED | GRANTED | NOT_GRANTED | NOT_GRANTED | PM phụ trách dự án hoặc Admin (khi task ở trạng thái TODO và chưa có lịch sử) | `02_USER_ROLES_AND_WORKFLOWS.md` 2.3; `06_API_CONTRACT.md` 12.9 |
| `TASK_ASSIGN` | GRANTED | GRANTED | GRANTED | NOT_GRANTED | Leader/PM phụ trách dự án/nhóm hoặc Admin | `02_USER_ROLES_AND_WORKFLOWS.md` 2.2 (103), 2.3 (132); `06_API_CONTRACT.md` 12.7, 12.8 |
| `TASK_UPDATE_STATUS` | GRANTED | GRANTED | GRANTED | GRANTED | Người thực hiện (chuyển sang IN_PROGRESS, IN_REVIEW), người review/Leader/PM (duyệt sang COMPLETED), hoặc Admin | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1 (76), 5.2; `06_API_CONTRACT.md` 12.5 |
| `SERVICE_REQUEST_READ` | GRANTED | GRANTED | GRANTED | GRANTED | Người tạo (requester), kỹ thuật viên đang xử lý (active assignee), hoặc Admin | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1 (78), 6.1-6.3; `06_API_CONTRACT.md` 13.1, 13.3 |
| `SERVICE_REQUEST_CREATE` | GRANTED | GRANTED | GRANTED | GRANTED | Mọi nhân viên tạo yêu cầu dịch vụ cho chính mình (Self-service requester) | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1 (78), 6.1; `06_API_CONTRACT.md` 13.2 |
| `SERVICE_REQUEST_UPDATE` | GRANTED | GRANTED | GRANTED | GRANTED | Chỉ người tạo (requester) khi yêu cầu ở trạng thái OPEN | `02_USER_ROLES_AND_WORKFLOWS.md` 6.1; `06_API_CONTRACT.md` 13.5 |
| `SERVICE_REQUEST_ASSIGN` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống điều phối dịch vụ trong MVP (System dispatcher) | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4; `06_API_CONTRACT.md` 13.6 |
| `SERVICE_REQUEST_UPDATE_STATUS` | GRANTED | GRANTED | GRANTED | GRANTED | Kỹ thuật viên đang được phân công xử lý (active assignee) hoặc Admin | `02_USER_ROLES_AND_WORKFLOWS.md` 6.2-6.3; `06_API_CONTRACT.md` 13.7 |
| `SERVICE_CATEGORY_MANAGE` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống quản lý danh mục (System category admin) | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4 (152); `06_API_CONTRACT.md` 13.10 |
| `ASSET_READ` | GRANTED | GRANTED | GRANTED | GRANTED | Người được giao tài sản (Assigned asset) hoặc Admin | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1 (79), 7.1; `06_API_CONTRACT.md` 14.1, 14.2 |
| `ASSET_MANAGE` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống quản lý tài sản | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4; `06_API_CONTRACT.md` 14.3-14.4 |
| `ASSET_CATEGORY_MANAGE` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống quản lý danh mục tài sản | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4 (153); `06_API_CONTRACT.md` 14.5 |
| `NOTIFICATION_READ` | GRANTED | GRANTED | GRANTED | GRANTED | Người nhận thông báo (Notification recipient) | `02_USER_ROLES_AND_WORKFLOWS.md` 2.1 (81), 8; `06_API_CONTRACT.md` 15.1 |
| `NOTIFICATION_UPDATE` | GRANTED | GRANTED | GRANTED | GRANTED | Người nhận thông báo (đánh dấu đã đọc) | `02_USER_ROLES_AND_WORKFLOWS.md` 8; `06_API_CONTRACT.md` 15.2-15.3 |
| `USER_READ` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống xem danh sách tài khoản | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4 (148); `06_API_CONTRACT.md` 17.1, 17.2 |
| `USER_MANAGE` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống tạo, cập nhật, khóa tài khoản | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4 (148-149); `06_API_CONTRACT.md` 17.3-17.7 |
| `ROLE_MANAGE` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống quản lý vai trò và phân quyền | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4 (151); `06_API_CONTRACT.md` 17.12 |
| `DEPARTMENT_MANAGE` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống quản lý phòng ban | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4 (150); `06_API_CONTRACT.md` 17.8-17.11 |
| `AUDIT_READ` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống theo dõi nhật ký hoạt động | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4 (154); `06_API_CONTRACT.md` 18.1 |
| `REPORT_READ` | GRANTED | NOT_GRANTED | NOT_GRANTED | NOT_GRANTED | Quản trị viên hệ thống xem báo cáo tổng hợp | `02_USER_ROLES_AND_WORKFLOWS.md` 2.4; `06_API_CONTRACT.md` 19.1-19.4 |

**Quy tắc áp dụng bắt buộc**:
- Permission là cổng kiểm tra toàn cục (`@PreAuthorize("hasAuthority(...)")`).
- Application Service bắt buộc phải tiếp tục kiểm tra quan hệ nghiệp vụ (Business relation: `requester`, `active assignee`, `project membership`, `resource ownership`, `status transition`).
- Không dùng quyền của System Role để bỏ qua các ràng buộc quan hệ nghiệp vụ và trạng thái dữ liệu.

---

## 3. Luồng xác thực người dùng

### 3.1. Đăng nhập

1. Người dùng nhập email hoặc tên đăng nhập và mật khẩu.
2. Ứng dụng kiểm tra dữ liệu đầu vào.
3. Ứng dụng gửi yêu cầu đăng nhập đến backend.
4. Backend kiểm tra tài khoản và mật khẩu.
5. Backend kiểm tra trạng thái tài khoản.
6. Nếu hợp lệ, backend trả access token, refresh token và thông tin người dùng.
7. Ứng dụng lưu token bằng cơ chế lưu trữ an toàn.
8. Ứng dụng chuyển người dùng đến Dashboard.

### 3.2. Làm mới phiên đăng nhập

1. Access token hết hạn.
2. Ứng dụng gửi refresh token đến backend.
3. Backend kiểm tra refresh token.
4. Nếu hợp lệ, backend cấp access token mới.
5. Nếu không hợp lệ, ứng dụng xoá phiên và yêu cầu đăng nhập lại.

### 3.3. Đăng xuất

1. Người dùng chọn đăng xuất.
2. Ứng dụng gửi yêu cầu huỷ phiên đến backend.
3. Ứng dụng xoá token và dữ liệu phiên cục bộ.
4. Ứng dụng chuyển về màn hình đăng nhập.

---

### 3.5. Trạng thái tài khoản người dùng

Tài khoản người dùng sử dụng các trạng thái:
```text
PENDING
ACTIVE
LOCKED
DISABLED
```

Ý nghĩa:

- `PENDING`: tài khoản đã được tạo nhưng chưa hoàn tất bước kích hoạt cần thiết.
- `ACTIVE`: tài khoản đang hoạt động và có thể đăng nhập nếu thông tin xác thực hợp lệ.
- `LOCKED`: tài khoản bị khóa tạm thời và không được đăng nhập.
- `DISABLED`: tài khoản đã bị vô hiệu hóa và không được sử dụng hệ thống.

Các chuyển trạng thái hợp lệ:

```text
PENDING
→ ACTIVE

ACTIVE
→ LOCKED

LOCKED
→ ACTIVE

ACTIVE
→ DISABLED

LOCKED
→ DISABLED
```

#### Kích hoạt tài khoản

Luồng kích hoạt:

```text
Quản trị viên tạo tài khoản
→ tài khoản ở trạng thái PENDING
→ người dùng hoàn tất bước kích hoạt hoặc thiết lập mật khẩu
→ backend kiểm tra dữ liệu hợp lệ
→ tài khoản chuyển sang ACTIVE
```

Quy tắc:

- Tài khoản `PENDING` không được sử dụng đầy đủ các chức năng yêu cầu đăng nhập.
- Backend phải kiểm tra trạng thái tài khoản trước khi cấp access token và refresh token.
- Không chuyển tài khoản sang `ACTIVE` nếu bước kích hoạt bắt buộc chưa hoàn thành.
- Việc kích hoạt phải được ghi nhận để phục vụ truy vết.

#### Khóa tài khoản

Luồng khóa:

```text
ACTIVE
→ LOCKED
```

Quy tắc:

- Tài khoản `LOCKED` không được đăng nhập.
- Access token và refresh token đang hoạt động phải bị thu hồi hoặc mất hiệu lực theo chính sách bảo mật.
- Khóa tài khoản không xóa User, Role, Project Membership hoặc lịch sử nghiệp vụ.
- Chỉ người có quyền `USER_MANAGE` được khóa tài khoản.
- Backend phải trả mã lỗi `ACCOUNT_LOCKED` khi tài khoản bị khóa cố đăng nhập.

#### Mở khóa tài khoản

Luồng mở khóa:

```text
LOCKED
→ ACTIVE
```

Quy tắc:

- Chỉ người có quyền `USER_MANAGE` được mở khóa tài khoản.
- Mở khóa không tự khôi phục refresh token cũ.
- Người dùng phải đăng nhập lại để nhận phiên đăng nhập mới.
- Việc mở khóa phải được ghi nhận để phục vụ truy vết.

#### Vô hiệu hóa tài khoản

Các luồng vô hiệu hóa:

```text
ACTIVE
→ DISABLED

LOCKED
→ DISABLED
```

Quy tắc:

- Tài khoản `DISABLED` không được đăng nhập.
- Toàn bộ refresh token và phiên đăng nhập đang hoạt động phải bị thu hồi.
- Vô hiệu hóa không xóa dữ liệu nghiệp vụ hoặc lịch sử của người dùng.
- Không được xóa vật lý tài khoản chỉ để ngăn đăng nhập.
- Chỉ người có quyền `USER_MANAGE` được vô hiệu hóa tài khoản.
- Backend phải trả mã lỗi `ACCOUNT_DISABLED` khi tài khoản bị vô hiệu hóa cố đăng nhập.
- Việc kích hoạt lại tài khoản `DISABLED` không thuộc workflow mặc định của MVP và phải có quyết định nghiệp vụ riêng trước khi bổ sung.

#### Quy tắc đăng nhập theo trạng thái

```text
PENDING  → từ chối đăng nhập đầy đủ, trả ACCOUNT_PENDING
ACTIVE   → cho phép tiếp tục xác thực
LOCKED   → từ chối đăng nhập, trả ACCOUNT_LOCKED
DISABLED → từ chối đăng nhập, trả ACCOUNT_DISABLED
```

Mobile chỉ hiển thị thông báo phù hợp từ mã lỗi. Backend là nơi kiểm tra trạng thái và quyết định có cấp token hay không.

## 4. Luồng quản lý dự án

### 4.1. Tạo dự án

1. Quản lý dự án chọn tạo dự án.
2. Nhập tên, mô tả, ngày bắt đầu và ngày kết thúc dự kiến.
3. Chọn thành viên tham gia.
4. Hệ thống kiểm tra dữ liệu.
5. Hệ thống tạo dự án với trạng thái DRAFT.
6. Quản lý dự án kích hoạt dự án.
7. Dự án chuyển sang trạng thái ACTIVE.
8. Thành viên nhận thông báo.

### 4.2. Trạng thái dự án

Dự án sử dụng các trạng thái:

- DRAFT: Bản nháp.
- ACTIVE: Đang thực hiện.
- ON_HOLD: Tạm dừng.
- COMPLETED: Hoàn thành.
- CANCELLED: Đã huỷ.

Luồng chuyển trạng thái hợp lệ:

DRAFT → ACTIVE  
ACTIVE → ON_HOLD  
ON_HOLD → ACTIVE  
ACTIVE → COMPLETED  
DRAFT → CANCELLED  
ACTIVE → CANCELLED  
ON_HOLD → CANCELLED

Dự án COMPLETED hoặc CANCELLED không được tạo thêm công việc mới.

### 4.3. Thêm thành viên dự án

1. Quản lý dự án mở danh sách thành viên.
2. Chọn người dùng cần thêm.
3. Chọn vai trò trong dự án.
4. Hệ thống kiểm tra người dùng có đang hoạt động không.
5. Hệ thống thêm thành viên.
6. Người dùng nhận thông báo.

---

## 5. Luồng quản lý công việc

### 5.1. Tạo công việc

1. Trưởng nhóm hoặc Quản lý dự án chọn tạo công việc.
2. Nhập tiêu đề và mô tả.
3. Chọn dự án.
4. Chọn người thực hiện.
5. Chọn mức độ ưu tiên.
6. Chọn thời hạn.
7. Có thể thêm công việc con và tệp đính kèm.
8. Hệ thống kiểm tra dữ liệu.
9. Hệ thống tạo công việc.
10. Người được giao nhận thông báo.

### 5.2. Trạng thái công việc

Công việc sử dụng các trạng thái:

- TODO: Cần thực hiện.
- IN_PROGRESS: Đang thực hiện.
- IN_REVIEW: Chờ kiểm tra.
- COMPLETED: Hoàn thành.
- CANCELLED: Đã huỷ.

Luồng chuyển trạng thái hợp lệ:

TODO → IN_PROGRESS  
IN_PROGRESS → IN_REVIEW  
IN_REVIEW → COMPLETED  
IN_REVIEW → IN_PROGRESS  
TODO → CANCELLED  
IN_PROGRESS → CANCELLED

Nhân viên không được tự chuyển trực tiếp từ TODO sang COMPLETED.

#### Quy tắc bắt buộc qua bước review

Mọi Task hoàn thành theo workflow chuẩn phải đi qua trạng thái `IN_REVIEW`.

Các chuyển trạng thái hợp lệ:

```text
TODO
→ IN_PROGRESS

IN_PROGRESS
→ IN_REVIEW

IN_REVIEW
→ COMPLETED

IN_REVIEW
→ IN_PROGRESS

TODO
→ CANCELLED

IN_PROGRESS
→ CANCELLED
```

Các chuyển trạng thái không hợp lệ:

```text
TODO
→ COMPLETED

TODO
→ IN_REVIEW

IN_PROGRESS
→ COMPLETED

COMPLETED
→ IN_PROGRESS

COMPLETED
→ IN_REVIEW

CANCELLED
→ TODO

CANCELLED
→ IN_PROGRESS
```

Quy tắc áp dụng:

- Không vai trò nào được chuyển trực tiếp Task từ `IN_PROGRESS` sang `COMPLETED`.
- `PROJECT_MANAGER`, `TEAM_LEADER` và `ADMIN` cũng phải tuân thủ bước `IN_REVIEW`.
- Người thực hiện chuyển Task từ `IN_PROGRESS` sang `IN_REVIEW` khi đã hoàn thành phần việc.
- Người có quyền review chuyển Task từ `IN_REVIEW` sang `COMPLETED` khi kết quả đạt yêu cầu.
- Nếu kết quả chưa đạt, người review chuyển Task từ `IN_REVIEW` về `IN_PROGRESS`.
- Chuyển sang `CANCELLED` phải có quyền phù hợp và lý do nghiệp vụ.
- Task ở trạng thái `COMPLETED` hoặc `CANCELLED` là trạng thái kết thúc trong MVP.
- Task ở trạng thái kết thúc không được tiếp tục cập nhật tiến độ hoặc chuyển trạng thái.
- Không được bỏ qua workflow chỉ vì người dùng có System Role cao hơn.
- Backend phải kiểm tra Permission, Project Membership, Project Role và Current State.
- Mobile chỉ hiển thị các thao tác được backend cho phép thông qua permission hoặc `allowedActions`.
- Backend là nơi quyết định chuyển trạng thái cuối cùng.

Phân quyền thao tác:

```text
Assignee hoặc người có TASK_UPDATE_STATUS
→ IN_PROGRESS
→ IN_REVIEW

Người có quyền review phù hợp
→ IN_REVIEW
→ COMPLETED

Người có quyền review phù hợp
→ IN_REVIEW
→ IN_PROGRESS

Người có TASK_UPDATE_STATUS và quyền trên dự án
→ TODO hoặc IN_PROGRESS
→ CANCELLED
```

Nếu không xác định được người có quyền review từ Permission và Project Role hiện tại, backend phải từ chối thao tác thay vì tự cho phép.

### 5.3. Cập nhật tiến độ

1. Người thực hiện mở chi tiết công việc.
2. Chọn bắt đầu thực hiện.
3. Công việc chuyển từ TODO sang IN_PROGRESS.
4. Người thực hiện cập nhật mô tả hoặc bình luận.
5. Khi hoàn thành phần việc, người thực hiện gửi kiểm tra.
6. Công việc chuyển sang IN_REVIEW.
7. Trưởng nhóm hoặc Quản lý dự án kiểm tra.
8. Nếu đạt yêu cầu, công việc chuyển sang COMPLETED.
9. Nếu chưa đạt, công việc quay lại IN_PROGRESS.

### 5.4. Công việc quá hạn

Công việc được xác định quá hạn khi:

- Chưa ở trạng thái COMPLETED hoặc CANCELLED.
- Thời điểm hiện tại lớn hơn thời hạn công việc.

Hệ thống phải:

- Hiển thị cảnh báo.
- Đánh dấu công việc quá hạn.
- Thông báo cho người thực hiện và người quản lý.

---

## 6. Luồng yêu cầu dịch vụ

### 6.1. Tạo yêu cầu

1. Nhân viên chọn tạo yêu cầu dịch vụ.
2. Chọn danh mục yêu cầu.
3. Nhập tiêu đề và nội dung.
4. Chọn mức độ ưu tiên.
5. Có thể chọn tài sản liên quan.
6. Có thể đính kèm hình ảnh hoặc tệp.
7. Gửi yêu cầu.
8. Hệ thống tạo yêu cầu với trạng thái OPEN.
9. Người dùng nhận mã yêu cầu.

### 6.2. Trạng thái yêu cầu dịch vụ

- OPEN: Mới tạo.
- ASSIGNED: Đã phân công.
- IN_PROGRESS: Đang xử lý.
- WAITING_FOR_USER: Chờ người yêu cầu phản hồi.
- RESOLVED: Đã xử lý.
- CLOSED: Đã đóng.
- CANCELLED: Đã huỷ.

Luồng chuyển trạng thái hợp lệ:

OPEN → ASSIGNED  
ASSIGNED → IN_PROGRESS  
IN_PROGRESS → WAITING_FOR_USER  
WAITING_FOR_USER → IN_PROGRESS  
IN_PROGRESS → RESOLVED  
RESOLVED → CLOSED  
RESOLVED → IN_PROGRESS  
OPEN → CANCELLED

### 6.3. Hoàn tất yêu cầu

1. Người xử lý cập nhật giải pháp.
2. Yêu cầu chuyển sang RESOLVED.
3. Nhân viên nhận thông báo.
4. Nhân viên xác nhận kết quả.
5. Yêu cầu chuyển sang CLOSED.
6. Nhân viên có thể đánh giá chất lượng xử lý.

Nếu nhân viên từ chối kết quả, yêu cầu quay lại IN_PROGRESS.

---

## 7. Luồng quản lý tài sản

### 7.1. Xem tài sản được giao

1. Nhân viên mở mục Tài sản của tôi.
2. Ứng dụng tải danh sách tài sản đang được giao.
3. Nhân viên chọn một tài sản.
4. Ứng dụng hiển thị thông tin, tình trạng và lịch sử liên quan.

### 7.2. Báo hỏng tài sản

1. Nhân viên mở chi tiết tài sản.
2. Chọn Báo hỏng.
3. Nhập mô tả sự cố.
4. Có thể đính kèm hình ảnh.
5. Hệ thống tạo yêu cầu dịch vụ liên kết với tài sản.
6. Nhân viên theo dõi trạng thái trong mục Yêu cầu dịch vụ.

### 7.3. Trạng thái tài sản

- AVAILABLE: Sẵn sàng.
- ASSIGNED: Đã cấp phát.
- MAINTENANCE: Đang bảo trì.
- BROKEN: Bị hỏng.
- RETIRED: Ngừng sử dụng.

Tài sản RETIRED không được cấp phát lại.

---

## 8. Luồng thông báo

### 8.1. Mô hình phân phối và giao dịch

- **Mô hình phân phối**: Hệ thống thông báo nội bộ trong ứng dụng (In-app Database Notification Center).
- Không triển khai Push Notification thực tế (FCM/APNs), Email delivery, WebSocket/SSE hay message broker ngoài trong MVP.
- Tùy chọn thông báo (`notification_preferences`): Thuộc tính `inAppEnabled` được thực thi trực tiếp tại backend khi tạo thông báo; các thuộc tính `pushEnabled` và `emailEnabled` được lưu trữ/cập nhật qua API nhưng không tạo side effect phân phối trong Phase 11.
- **Quy tắc khi tùy chọn bị tắt (`inAppEnabled = false`)**:
  - Nếu tại thời điểm phát sinh sự kiện, người nhận có `inAppEnabled = false` cho loại thông báo tương ứng, hệ thống sẽ bỏ qua và không tạo bản ghi trong bảng `notifications`.
  - Sự kiện được coi là đã xử lý xong theo cấu hình hiện tại của người dùng.
  - Hệ thống không lưu trạng thái chờ (pending event) và không thực hiện backfill thông báo khi người dùng bật lại tùy chọn sau này.
- **Mô hình giao dịch**: Bản ghi thông báo được tạo và ghi vào CSDL trong cùng transaction với sự kiện nghiệp vụ gốc. Nếu thao tác ghi thông báo thất bại do lỗi hệ thống nghiêm trọng, toàn bộ transaction nghiệp vụ sẽ rollback để bảo đảm tính toàn vẹn dữ liệu.

### 8.2. Ma trận sự kiện và người nhận thông báo (Event & Recipient Matrix)

| Sự kiện nghiệp vụ | Thao tác nguồn thực tế | Người nhận (Recipient) | Loại trừ Actor | Loại thông báo (`type`) | `referenceType` | `referenceId` | Mẫu tiêu đề | Mẫu nội dung | Định dạng `eventKey` | Thời điểm kích hoạt |
|---|---|---|---|---|---|---|---|---|---|---|
| Thêm thành viên dự án | `POST /api/v1/projects/{projectId}/members` | Thành viên vừa được thêm (`userId`) | Loại trừ nếu actor == recipient | `PROJECT_MEMBER_ADDED` | `PROJECT` | `projectId` | Bạn đã được thêm vào dự án | Bạn đã được thêm vào dự án {projectName} | `PROJECT_MEMBER_ADDED:{projectId}:{memberId}` | Cùng transaction thêm member |
| Giao công việc | `POST /api/v1/tasks` (kèm assignee) hoặc `POST /api/v1/tasks/{taskId}/assignments` | Người được giao việc (`assigneeId`) | Loại trừ nếu actor tự giao việc cho chính mình | `TASK_ASSIGNED` | `TASK` | `taskId` | Bạn được giao công việc mới | Bạn đã được phân công công việc: {taskTitle} | `TASK_ASSIGNED:{taskId}:{assignmentId}` | Cùng transaction giao task |
| Thay đổi trạng thái công việc | `PUT /api/v1/tasks/{taskId}/status` | Active assignee, Reporter, PM/Leader dự án đang hoạt động (deduplicated) | Loại trừ actor thực hiện thao tác | `TASK_STATUS_CHANGED` | `TASK` | `taskId` | Công việc thay đổi trạng thái | Công việc {taskTitle} đã chuyển sang trạng thái {status} | `TASK_STATUS_CHANGED:{taskId}:{statusHistoryId}` | Cùng transaction đổi trạng thái |
| Công việc sắp đến hạn | Quét định kỳ (Scheduler Scanner) | Người được giao việc (`assigneeId`) | Không áp dụng (hệ thống) | `TASK_DUE_SOON` | `TASK` | `taskId` | Công việc sắp đến hạn | Công việc {taskTitle} sẽ đến hạn vào {dueDate} | `TASK_DUE_SOON:{taskId}:{dueAtEpochMilli}` | Batch scheduler (chỉ gửi 1 lần/cửa sổ 72h) |
| Công việc quá hạn | Quét định kỳ (Scheduler Scanner) | Người được giao việc (`assigneeId`) | Không áp dụng (hệ thống) | `TASK_OVERDUE` | `TASK` | `taskId` | Công việc quá hạn | Công việc {taskTitle} đã quá hạn hoàn thành | `TASK_OVERDUE:{taskId}:{dueAtEpochMilli}` | Batch scheduler (chỉ gửi 1 lần khi quá hạn) |
| Phân công yêu cầu dịch vụ | `POST /api/v1/service-requests/{requestId}/assignments` | Kỹ thuật viên được phân công (`assigneeId`) | Loại trừ nếu actor == recipient | `SERVICE_REQUEST_UPDATED` | `SERVICE_REQUEST` | `requestId` | Bạn được phân công yêu cầu dịch vụ | Bạn được phân công xử lý yêu cầu: {requestTitle} | `SERVICE_REQUEST_UPDATED:{requestId}:ASSIGNED:{assignmentId}` | Cùng transaction phân công |
| Cập nhật trạng thái yêu cầu dịch vụ | `PUT /api/v1/service-requests/{requestId}/status` (RESOLVED, v.v.) | Người tạo yêu cầu (`requesterId`) | Loại trừ nếu actor == recipient | `SERVICE_REQUEST_UPDATED` | `SERVICE_REQUEST` | `requestId` | Yêu cầu dịch vụ được cập nhật | Yêu cầu {requestTitle} đã chuyển sang trạng thái {status} | `SERVICE_REQUEST_UPDATED:{requestId}:{statusHistoryId}` | Cùng transaction đổi trạng thái |
| Cấp phát tài sản | `POST /api/v1/assets/{assetId}/assignments` | Nhân viên nhận tài sản (`assignedTo`) | Loại trừ nếu actor == recipient | `ASSET_ASSIGNED` | `ASSET` | `assetId` | Bạn được cấp phát tài sản | Bạn đã được cấp phát tài sản: {assetName} ({assetCode}) | `ASSET_ASSIGNED:{assetId}:{assignmentId}` | Cùng transaction cấp phát tài sản |
| Bình luận công khai Task | `POST /api/v1/tasks/{taskId}/comments` | Active assignee, Reporter, PM/Leader dự án hoạt động (deduplicated) | Loại trừ actor tạo bình luận | `COMMENT_ADDED` | `TASK` | `taskId` | Có bình luận mới | {actorName} đã bình luận trên công việc: {taskTitle} | `COMMENT_ADDED:TASK:{commentId}` | Cùng transaction tạo bình luận |
| Bình luận công khai Service Request | `POST /api/v1/service-requests/{requestId}/comments` (`isInternal=false`) | Phía đối diện (Requester hoặc Active Assignee; nếu Admin thì gửi cả hai) | Loại trừ actor tạo bình luận | `COMMENT_ADDED` | `SERVICE_REQUEST` | `requestId` | Có bình luận mới | {actorName} đã bình luận trên yêu cầu: {requestTitle} | `COMMENT_ADDED:SERVICE_REQUEST:{commentId}` | Cùng transaction tạo bình luận |

*Quy tắc nghiệp vụ chi tiết*:
- **Ghi chú nội bộ (Internal Notes) của Service Request (`isInternal=true`)**: Tuyệt đối không gửi thông báo cho requester. Trong Phase 11, thông báo nội bộ cho kỹ thuật viên được hoãn lại.
- **Không phát tán toàn bộ thành viên dự án**: Thay đổi trạng thái task hoặc bình luận task không gửi broadcast cho toàn bộ thành viên dự án mà chỉ gửi cho nhóm có liên quan mật thiết (active assignee, reporter, PM/Leader có quyền review).
- **Độ dài eventKey**: Mọi chuỗi `eventKey` đều sử dụng UUID hoặc Long timestamp, bảo đảm độ dài luôn $\le 255$ ký tự.

### 8.3. Thuật toán xác định người nhận khi đổi trạng thái công việc (Task Status Recipient Resolution)

1. Thu thập danh sách `recipientIds`:
   - Active assignee từ `task_assignments` (`task_id = :taskId AND is_active = TRUE`).
   - Task reporter từ `tasks.reporter_id`.
   - Các thành viên dự án đang hoạt động (`project_members.project_id = :projectId AND is_active = TRUE`) có vai trò dự án `project_role IN ('PROJECT_MANAGER', 'TEAM_LEADER')`.
2. Loại bỏ các giá trị trùng lặp (Deduplicate Set).
3. Loại trừ actor thực hiện thao tác (`principal.userId()`).
4. Với từng recipient, kiểm tra tùy chọn `inAppEnabled` cho loại `TASK_STATUS_CHANGED`. Nếu `false`, bỏ qua.
5. Chèn thông báo cho các recipient còn lại bằng câu lệnh chèn lũy đẳng an toàn.

### 8.4. Cơ chế chèn lũy đẳng an toàn (Idempotent Native Insert Semantics)

- Tuyệt đối **không** dùng cơ chế bắt ngoại lệ vi phạm ràng buộc duy nhất (`PSQLException: duplicate key`) làm luồng điều khiển trong transaction nghiệp vụ, vì điều này có thể đánh dấu transaction là `rollback-only`.
- Sử dụng câu lệnh chèn native an toàn của PostgreSQL:
  ```sql
  INSERT INTO notifications (
      id, recipient_id, event_key, type, title, message,
      reference_type, reference_id, is_read, created_at
  )
  VALUES (...)
  ON CONFLICT (recipient_id, event_key) DO NOTHING;
  ```
- Phương thức repository trả về số dòng bị ảnh hưởng (`affected rows`):
  - `1`: Thông báo mới được tạo thành công.
  - `0`: Sự kiện đã tồn tại trước đó; hệ thống ghi nhận là thành công lũy đẳng (`idempotent success`), không ném lỗi và không rollback nghiệp vụ gốc.
- Các lỗi CSDL thực sự khác (mất kết nối, lỗi kiểu dữ liệu) vẫn làm rollback transaction nghiệp vụ gốc theo đúng chính sách D-049.

### 8.5. Chính sách quét hạn định kỳ (Scheduler Scanner Policy)

- **Các loại thông báo xử lý**: `TASK_DUE_SOON` và `TASK_OVERDUE`.
- **Cấu hình chu kỳ quét**: `worksphere.notification.task-deadline-scan-delay` (mặc định: `PT15M` - 15 phút).
- **Cấu hình kích thước lô**: `worksphere.notification.task-deadline-batch-size` (mặc định: `100`).
- **Thứ tự xử lý ổn định**: `ORDER BY t.due_date ASC, t.id ASC`.
- **Điều phối đa thực thể (Multi-Instance Coordination)**:
  - Sử dụng PostgreSQL transaction advisory lock với module key riêng biệt `1101`:
    ```sql
    SELECT pg_try_advisory_xact_lock(1101, 1);
    ```
  - Nếu không lấy được khóa (do một instance khác đang thực thi vòng quét), instance hiện tại lập tức bỏ qua vòng quét mà không phát sinh lỗi.
- **Môi trường kiểm thử**: Vô hiệu hóa scheduler tự động (`@Scheduled`). Kiểm thử tích hợp gọi trực tiếp scanner service với bean `Clock` cố định.

### 8.6. Thao tác và quyền truy cập

- **Xem danh sách**: Người dùng chỉ xem được danh sách thông báo của chính mình qua `GET /notifications` (`recipient_id = principal.userId`).
- **Xem chi tiết (Deep Link Navigation)**: Ứng dụng mobile sử dụng `referenceType` và `referenceId` trong payload thông báo để điều hướng trực tiếp đến màn hình chi tiết của đối tượng nghiệp vụ tương ứng (Project, Task, Service Request, Asset). Hệ thống không mở endpoint riêng `GET /notifications/{id}`.
- **Đánh dấu đã đọc**: `PUT /notifications/{id}/read` mang tính lũy đẳng. Nếu thông báo không tồn tại hoặc thuộc về người dùng khác, hệ thống trả về HTTP 404 `NOTIFICATION_NOT_FOUND` để bảo mật thông tin.
- **Đánh dấu tất cả đã đọc**: `PUT /notifications/read-all` cập nhật toàn bộ thông báo chưa đọc của chính principal.
- **Đếm số lượng chưa đọc**: `GET /notifications/unread-count` đếm các thông báo có `is_read = false` của chính principal.
- **Tùy chọn thông báo**: Quản lý tùy chọn nhận thông báo qua `GET` và `PUT /notification-preferences`.

### 8.7. Chính sách lưu trữ (Retention Policy)

- Trong Phase 11, thông báo đã đọc được lưu trữ vô thời hạn. Không tự động xóa vật lý, không có endpoint lưu trữ/archive, và không có scheduler dọn dẹp (`NOTIFICATION_RETENTION_CLEANUP_DEFERRED`).

---

## 9. Quy tắc nghiệp vụ chung

- Mọi thao tác quan trọng phải kiểm tra quyền tại backend.
- Ứng dụng mobile không được là nơi duy nhất kiểm tra quyền.
- Dữ liệu đã có lịch sử hoạt động không được xoá vật lý tuỳ tiện.
- Tệp tải lên phải được kiểm tra loại và dung lượng.
- Người dùng bị khoá không được đăng nhập.
- Chỉ thành viên dự án mới được xem dữ liệu nội bộ của dự án.
- Mọi thay đổi trạng thái phải được ghi lịch sử.
- Thời gian tạo và cập nhật phải do backend quản lý.
- API danh sách phải hỗ trợ phân trang.
- Thao tác thất bại phải trả thông báo lỗi rõ ràng.







Giải thích nhanh các thuật ngữ
Workflow, hay luồng nghiệp vụ, là chuỗi bước từ lúc người dùng bắt đầu một thao tác đến khi thao tác kết thúc.
Backend là phần máy chủ chịu trách nhiệm xử lý dữ liệu, quyền truy cập và quy tắc nghiệp vụ.
Token là chuỗi xác thực ứng dụng sử dụng để chứng minh người dùng đã đăng nhập.
Phân trang là chia danh sách lớn thành từng trang nhỏ, thay vì tải toàn bộ dữ liệu một lần.
Xoá vật lý là xoá hẳn bản ghi khỏi cơ sở dữ liệu. Với dữ liệu cần truy vết, hệ thống thường chỉ đánh dấu đã xoá hoặc ngừng hoạt động.
