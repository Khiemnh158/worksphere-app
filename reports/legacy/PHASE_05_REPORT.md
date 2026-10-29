# PHASE 05 REPORT: ORGANIZATION VÀ USER MANAGEMENT

## 1. Checkpoint & Bối cảnh
- **Checkpoint cơ sở**: Commit `5034cafc45755cba39857f651cecaf0fea50b60d`
- **Xử lý xung đột thiết kế**: Báo cáo `DOMAIN_DESIGN_CONFLICT` đã được người dùng chỉ định giải quyết bằng **Phương án A**:
  - Triển khai Phase 5 theo `docs/08_DEVELOPMENT_ROADMAP.md` (Organization và User Management).
  - Nghiêm cấm triển khai bất kỳ thành phần nào của Project (thuộc Phase 6).
  - Đính chính phạm vi Organization: "Organization Module" là tên mô-đun nghiệp vụ nội bộ của một tổ chức duy nhất. Không tồn tại bảng `organizations`, không có thực thể `Organization`, không có `organization_id`, không có tenant isolation hay multi-tenant.

## 2. Database Schema Audit
- Tiến hành audit các bảng `users`, `roles`, `permissions`, `user_roles`, `departments`, `teams`, `team_members` trong `V001__create_identity_tables.sql`, `V002__create_organization_tables.sql`, `V010__create_deferred_foreign_keys_indexes_and_constraints.sql`, `V011__seed_roles_and_permissions.sql`.
- **Kết luận**: Các migration từ `V001` đến `V011` đã có đầy đủ cấu trúc bảng, khóa chính, khóa ngoại, ràng buộc duy nhất và chỉ mục cần thiết cho Phase 5.
- **Migration mới**: Không tạo thêm migration nào (không tạo `V012`). Giữ nguyên 100% các file migration hiện có.

## 3. Nội dung triển khai Phase 5

### A. Department
- **Domain**: `Department` (`departments` table):
  - Ánh xạ đầy đủ PK `id`, `code`, `name`, `description`, `parent_department_id`, `manager_id`, `is_active`, `is_deleted`, audit fields và `@Version Long version`.
- **Repository**: `DepartmentRepository` (`findActiveById`, `findActiveByCode`, `existsByCodeAndDeletedFalse`, `findAllActiveRootDepartments`).
- **Application Service**: `DepartmentApplicationService`:
  - CRUD Department.
  - Kiểm tra duplicate code.
  - Kiểm tra tồn tại và tính hợp lệ của manager (user phải tồn tại, chưa bị xóa và có trạng thái `ACTIVE`).
  - Kiểm tra parent department: Chặn self-parent và chặn circular hierarchy.
  - Deactivate department với validation nghiệp vụ.
- **Web API**: `DepartmentController`:
  - `GET /api/v1/departments` (Yêu cầu authenticated user, trả về danh sách phòng ban active dạng cây/danh sách).
  - `POST /api/v1/admin/departments` (`DEPARTMENT_MANAGE`).
  - `PUT /api/v1/admin/departments/{id}` (`DEPARTMENT_MANAGE`).
  - `PUT /api/v1/admin/departments/{id}/deactivate` (`DEPARTMENT_MANAGE`).

### B. Team & Team Member
- **Domain**:
  - `Team` (`teams` table): ánh xạ `id`, `department_id`, `leader_id`, `code`, `name`, `description`, `is_active`, `is_deleted`, `@Version Long version`.
  - `TeamMember` (`team_members` table): `@IdClass(TeamMemberId.class)` ánh xạ composite key `(team_id, user_id)`, `role_in_team`, `joined_at`.
- **Repositories**: `TeamRepository`, `TeamMemberRepository`.
- **Application Service**: `TeamApplicationService`:
  - Tạo/cập nhật team, gán team leader, thêm/xóa thành viên trong team, ngăn chặn trùng lặp thành viên.
- **API Contract Gap**: Theo mục 7 hướng dẫn và `docs/06_API_CONTRACT.md`, hiện tại contract chưa định nghĩa controller endpoint cho Team & TeamMember, vì vậy không tự phát minh REST path; chỉ đóng gói tầng Domain và Application Service.

### C. User Management
- **Domain**: Bổ sung các phương thức nghiệp vụ trong `User` entity: `adminUpdate()`, `lock()`, `unlock()`, `updateDepartmentId()`, `setRoles()`.
- **User Roles Mapping**: Tạo `UserRole` (`user_roles` table) và `UserRoleRepository` để quản lý các bản ghi liên kết user-role kèm thời điểm `assigned_at`.
- **Repository**: Bổ sung `searchUsers(...)` hỗ trợ tìm kiếm phân trang theo từ khóa, departmentId, status, soft-delete filter; bổ sung `findByCodeIn` và `findByCode` trong `RoleRepository`.
- **Application Service**: `UserManagementApplicationService`:
  - Tìm kiếm người dùng phân trang an toàn (`PagedData<UserSummaryResponse>`).
  - Tạo người dùng mới với trạng thái ban đầu `PENDING`, mật khẩu ngẫu nhiên tạm thời được mã hóa qua BCrypt.
  - Cập nhật thông tin người dùng và phân quyền (Roles).
  - Khóa tài khoản (`lockUser`): chuyển trạng thái `LOCKED`, đồng thời lập tức thu hồi toàn bộ phiên đăng nhập (`loginSessionRepository.revokeAllActiveByUserId`) và refresh token (`refreshTokenRepository.revokeAllByUserId`).
  - Mở khóa tài khoản (`unlockUser`): chuyển trạng thái từ `LOCKED` về `ACTIVE`.
- **Web API**: `AdminUserController`:
  - `GET /api/v1/admin/users` (`USER_READ`).
  - `POST /api/v1/admin/users` (`USER_MANAGE`).
  - `PUT /api/v1/admin/users/{userId}` (`USER_MANAGE`).
  - `PUT /api/v1/admin/users/{userId}/lock` (`USER_MANAGE`).
  - `PUT /api/v1/admin/users/{userId}/unlock` (`USER_MANAGE`).

### D. Bảo mật & Authorization
- Áp dụng triệt để kiểm tra quyền (`hasAuthority('USER_READ')`, `hasAuthority('USER_MANAGE')`, `hasAuthority('DEPARTMENT_MANAGE')`).
- Không để lộ mật khẩu, `password_hash`, token hash trong bất kỳ API response nào.

## 4. Kết quả Kiểm thử & Xác thực
- **Checkstyle**: 0 Checkstyle violations.
- **Integration Test MockMvc**:
  - `DepartmentMockMvcTest`: 8/8 tests PASS (tạo, cập nhật, lấy danh sách, kiểm tra quyền 403, duplicate code 409, phân cấp vòng lặp 400, deactivate).
  - `AdminUserMockMvcTest`: 7/7 tests PASS (tìm kiếm user, kiểm tra USER_READ, tạo user, trùng lặp username, cập nhật user, khóa user, mở khóa user).
  - Các test cũ của Phase 2, Phase 3, Phase 4: toàn bộ 29 tests cũ đều PASS.
- **Tổng số tests**: **44/44 tests PASS**, Failures: 0, Errors: 0, Skipped: 0.
- **Kết quả Maven**:
  ```text
  [INFO] Tests run: 44, Failures: 0, Errors: 0, Skipped: 0
  [INFO] BUILD SUCCESS
  [INFO] Total time: 55.678 s
  ```
- **Secret Scan**: Không phát hiện mật khẩu, private key, token hay file `.env` thật trong repository.
- **Canonical Docs & Migrations**: Không thay đổi bất kỳ file nào trong `docs/` hay `V001`-`V011`.
- **Phạm vi Phase 6**: Tuyệt đối không tạo bất kỳ code nào liên quan đến Project, Milestone, Project Member hay Task.
