# Báo Cáo Kiểm Toán Role-Permission Seed Và Thẩm Quyền Phân Quyền Phase 9

**Mã tài liệu**: `ROLE_PERMISSION_AUDIT`
**Ngày thực hiện**: 16/10/2026
**Phạm vi**: Toàn bộ hệ thống cơ sở dữ liệu, Flyway migrations, luồng xác thực JWT, mã nguồn kiểm thử và tài liệu canonical liên quan đến vai trò và quyền hạn (Roles & Permissions).

---

## 1. Mục Đích & Bối Cảnh

Trong quá trình chuẩn bị triển khai Giai đoạn 9 (Service Request Module), việc kiểm tra tính sẵn sàng của hệ thống phân quyền là bắt buộc nhằm:
1. Xác minh thực trạng dữ liệu của bảng `role_permissions` trên cả migration sạch và cơ sở dữ liệu đang chạy.
2. Kiểm tra xem các endpoint được bảo vệ bởi `@PreAuthorize("hasAuthority(...)")` có hoạt động được trên môi trường production hay không nếu chỉ dựa vào migration hiện hữu.
3. Làm rõ sự khác biệt giữa hành vi kiểm thử (test fixtures) và hành vi thực tế khi chạy ứng dụng thật.
4. Xác lập ma trận phân quyền canonical và nhận diện các khoảng trống (gaps) chặn việc triển khai Phase 9.

---

## 2. Kiểm Tra Kiểm Kê Schema & Flyway Migrations

### 2.1. Tìm kiếm các câu lệnh DDL và DML trong `backend`
- `CREATE TABLE role_permissions`: Định nghĩa tại [V001__create_identity_tables.sql](file:///D:/WorkSphere/backend/src/main/resources/db/migration/V001__create_identity_tables.sql#L52-L61). Bảng gồm 3 cột: `role_id` (UUID), `permission_id` (UUID), `assigned_at` (TIMESTAMP WITH TIME ZONE), khóa chính `PRIMARY KEY (role_id, permission_id)`.
- `INSERT INTO roles`: Xuất hiện duy nhất tại [V011__seed_roles_and_permissions.sql](file:///D:/WorkSphere/backend/src/main/resources/db/migration/V011__seed_roles_and_permissions.sql#L34-L38), seed 4 role hệ thống:
  - `EMPLOYEE`
  - `TEAM_LEADER`
  - `PROJECT_MANAGER`
  - `ADMIN`
- `INSERT INTO permissions`: Xuất hiện duy nhất tại [V011__seed_roles_and_permissions.sql](file:///D:/WorkSphere/backend/src/main/resources/db/migration/V011__seed_roles_and_permissions.sql#L2-L31), seed 29 permissions chuẩn.
- `INSERT INTO role_permissions`:
  - **Trong toàn bộ thư mục `src/main` và `db/migration`**: **KHÔNG CÓ BẤT KỲ CÂU LỆNH NÀO** (0 kết quả).
  - **Trong thư mục `src/test`**: Xuất hiện tại 5 file test: `AdminUserMockMvcTest`, `DepartmentMockMvcTest`, `ProjectMockMvcTest`, `TaskAttachmentMockMvcTest`, `TaskMockMvcTest`.
- Tìm kiếm `CommandLineRunner`, `ApplicationRunner`, `data.sql`, `import.sql`: **0 kết quả**. Không có cơ chế khởi tạo dữ liệu ngầm nào ngoài Flyway.

---

## 3. Kết Quả Kiểm Toán Cơ Sở Dữ Liệu Sạch (Clean Database Audit)

### 3.1. Quy trình thực hiện
1. Khởi tạo database audit tạm `worksphere_audit_temp` trên PostgreSQL 15 container (`worksphere-dev-pg`).
2. Thực thi toàn bộ 12 bản di trú từ `V001` đến `V012` theo đúng thứ tự.
3. Truy vấn đếm số lượng bản ghi:
   ```sql
   SELECT 'roles' AS tbl, COUNT(*) FROM roles
   UNION ALL
   SELECT 'permissions', COUNT(*) FROM permissions
   UNION ALL
   SELECT 'role_permissions', COUNT(*) FROM role_permissions;
   ```
4. Thực thi truy vấn kết hợp:
   ```sql
   SELECT r.code AS role_code, p.code AS permission_code
   FROM role_permissions rp
   JOIN roles r ON r.id = rp.role_id
   JOIN permissions p ON p.id = rp.permission_id
   ORDER BY r.code, p.code;
   ```
5. Xóa bỏ database `worksphere_audit_temp`.

### 3.2. Bằng chứng thực tế
- Số lượng bản ghi:
  - `roles`: **4** dòng
  - `permissions`: **29** dòng
  - `role_permissions`: **0 dòng** (hoàn toàn rỗng)
- Kết quả truy vấn kết hợp: **`0 rows`**.
- **Kết luận**: **`ROLE_PERMISSION_SEED_GAP_CONFIRMED`**. Sau khi chạy toàn bộ migrations từ V001 đến V012 trên một cơ sở dữ liệu sạch, không có bất kỳ quyền hạn nào được liên kết với bất kỳ vai trò nào.

---

## 4. Kết Quả Kiểm Toán Cơ Sở Dữ Liệu Development (`worksphere-dev-pg`)

- Đã truy vấn cơ sở dữ liệu `worksphere` trên container `worksphere-dev-pg`.
- Bảng `roles` chưa tồn tại trong database này (môi trường dev cục bộ chưa áp dụng Flyway, các bảng chỉ được tạo qua Testcontainers trong test suite).
- Không có dữ liệu seed thủ công, không có cơ chế khởi tạo ẩn.
- Khẳng định tính nhất quán giữa migration và runtime: Không có sự can thiệp dữ liệu ngoài migration.

---

## 5. Phân Tích Luồng Xác Thực Quyền Hạn (JWT Authority Flow)

Khảo sát chi tiết mã nguồn: [User.java](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/identity/domain/User.java), [Role.java](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/identity/domain/Role.java), [JwtService.java](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/shared/security/JwtService.java), [JwtAuthenticationFilter.java](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/shared/security/JwtAuthenticationFilter.java), và [SecurityConfig.java](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/shared/config/SecurityConfig.java):

1. **Nội dung Access Token**:
   - `JwtService.generateAccessToken(userId, sessionId)` chỉ đóng gói hai claim: `subject = userId` và `sessionId`.
   - Token **không** chứa thông tin roles hay permissions.
2. **Tái tạo Principal trên mỗi Request**:
   - `JwtAuthenticationFilter` giải mã `userId` từ token và truy vấn cơ sở dữ liệu: `userRepository.findActiveById(userId)`.
   - Nạp danh sách vai trò qua `user.getRoles()`.
3. **Cơ chế xây dựng GrantedAuthority (`buildAuthorities`)**:
   ```java
   for (Role role : user.getRoles()) {
       if (role.isActive()) {
           authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getCode()));
           for (Permission permission : role.getPermissions()) {
               authorities.add(new SimpleGrantedAuthority(permission.getCode()));
           }
       }
   }
   ```
   - Vai trò được gán tiền tố `ROLE_` (ví dụ: `ROLE_ADMIN`, `ROLE_EMPLOYEE`).
   - Quyền hạn nghiệp vụ **không** có tiền tố (ví dụ: `SERVICE_REQUEST_ASSIGN`, `TASK_ASSIGN`, `USER_MANAGE`).
4. **Hậu quả khi `role_permissions` trống**:
   - Vì bảng `role_permissions` có 0 dòng, `role.getPermissions()` trả về tập rỗng (`empty Set`).
   - `authorities` của người dùng chỉ chứa duy nhất các quyền dạng vai trò `ROLE_<ROLE_CODE>`, **không có bất kỳ permission nghiệp vụ nào**.
5. **Kiểm tra `@PreAuthorize` và Admin Bypass**:
   - Tất cả các endpoint nghiệp vụ trong hệ thống đều bảo vệ bằng: `@PreAuthorize("hasAuthority('PERMISSION_CODE')")`.
   - Trong `SecurityConfig` và toàn bộ mã nguồn, **hoàn toàn không có cơ chế bypass đặc quyền cho Admin** (không có `RoleHierarchy`, không có `hasRole('ADMIN')` cho phép bỏ qua kiểm tra permission).
   - **Hệ quả thực tế**: Trên môi trường thực tế (production/staging), ngay cả tài khoản có vai trò `ADMIN` cũng sẽ bị Spring Security từ chối với mã lỗi **HTTP 403 Forbidden** trên mọi endpoint yêu cầu permission nghiệp vụ!

---

## 6. Kiểm Toán Mã Nguồn Kiểm Thử (Test Fixture Audit)

Tại sao toàn bộ 170/170 tests hiện tại vẫn PASS và không phát hiện ra lỗi này?

### 6.1. Bằng chứng che giấu từ test fixtures
Khảo sát các file kiểm thử:
- `AdminUserMockMvcTest.java` (dòng 115-118):
  ```java
  jdbcTemplate.update(
      "INSERT INTO role_permissions (role_id, permission_id, assigned_at) " +
      "SELECT ?, id, now() FROM permissions ON CONFLICT DO NOTHING",
      adminRoleId);
  ```
- `DepartmentMockMvcTest.java` (dòng 113-116):
  Tương tự, test tự động gán toàn bộ quyền trong bảng `permissions` cho `adminRoleId` thông qua `jdbcTemplate`.
- `ProjectMockMvcTest.java` (dòng 164-167 & 180-184):
  Test tự động gán toàn bộ permissions cho `adminRoleId`, và gán thủ công `PROJECT_READ`, `PROJECT_CREATE`, `PROJECT_UPDATE`, `PROJECT_MEMBER_MANAGE` cho `pmRoleId`.
- `TaskMockMvcTest.java` (dòng 216-248):
  Test tự động gán toàn bộ permissions cho `adminRoleId`, và gán danh sách permissions cho `pmRoleId` và `empRoleId`.
- `TaskAttachmentMockMvcTest.java` (dòng 253-257):
  Phương thức trợ giúp `assignRole(userId, roleCode)` tự động chèn mọi quyền trong bảng `permissions` vào `role_permissions` cho role đó.

### 6.2. Kết luận kiểm thử
- **`TEST_AUTHORITY_FIXTURE_MASKS_SEED_GAP`**: Các bài kiểm thử integration/MockMvc không sử dụng dữ liệu seed từ migration mà tự ý chèn dữ liệu liên kết vào `role_permissions` trong pha `@BeforeEach`.
- Do đó, các bài test hiện tại **không phải là bằng chứng** chứng minh hệ thống phân quyền sẽ hoạt động khi triển khai ứng dụng thực tế.

---

## 7. Ma Trận Phân Quyền Canonical & Đánh Giá Khoảng Trống (Canonical Matrix)

### 7.1. Đối chiếu tài liệu canonical
- Khảo sát các tài liệu:
  - [02_USER_ROLES_AND_WORKFLOWS.md](file:///D:/WorkSphere/docs/02_USER_ROLES_AND_WORKFLOWS.md) Section 2 (Nhân viên, Trưởng nhóm, Quản lý dự án, Quản trị viên).
  - [05_DATABASE_DESIGN.md](file:///D:/WorkSphere/docs/05_DATABASE_DESIGN.md) Section 5 & 18.
  - [06_API_CONTRACT.md](file:///D:/WorkSphere/docs/06_API_CONTRACT.md) Section 20.2 & các section endpoint.
- **Phát hiện**:
  - Tài liệu canonical mô tả trách nhiệm và hành vi của từng vai trò bằng văn xuôi nghiệp vụ, đồng thời chỉ định permission cần thiết cho từng endpoint REST API.
  - **Tuy nhiên, không có bất kỳ tài liệu canonical nào cung cấp bảng ma trận ánh xạ chính thức 1-1 giữa 4 System Roles và 29 Permissions.**
  - Đơn cử:
    - Quyền `SERVICE_REQUEST_ASSIGN`: Canonical chỉ định endpoint phân công yêu cầu dịch vụ cần permission `SERVICE_REQUEST_ASSIGN`, nhưng trong Section 2 của `02_USER_ROLES_AND_WORKFLOWS.md`, không có System Role nào (kể cả `TEAM_LEADER` hay `ADMIN`) được ghi nhận có quyền này.
    - Vai trò `TEAM_LEADER` chỉ được cấp quyền phân công công việc dự án/nhóm (`TASK_ASSIGN`), không được cấp quyền phân công yêu cầu dịch vụ (`SERVICE_REQUEST_ASSIGN`).
- **Ghi nhận**: **`ROLE_PERMISSION_CANONICAL_MATRIX_GAP`**. Hệ thống thiếu ma trận phân quyền canonical toàn diện làm căn cứ viết migration seed.

---

## 8. Thẩm Quyền Cho Giai Đoạn 9 (Service Request Permissions)

Chi tiết 6 quyền hạn liên quan đến Module Yêu cầu Dịch vụ:

| Permission | Endpoint Sử Dụng | Role Được Cấp (Canonical) | Quan Hệ Nghiệp Vụ Bổ Sung | Ghi Chú An Toàn |
| :--- | :--- | :--- | :--- | :--- |
| `SERVICE_CATEGORY_MANAGE` | `GET/POST/PUT/PATCH /admin/service-categories/**` | `ADMIN` (`02_USER_ROLES_AND_WORKFLOWS.md` 2.4, `03_MOBILE_SCREEN_MAP.md` 1098) | Quản trị hệ thống | Không cấp cho Employee/PM/Leader |
| `SERVICE_REQUEST_CREATE` | `POST /service-requests` | `EMPLOYEE`, `TEAM_LEADER`, `PROJECT_MANAGER`, `ADMIN` (`02_...` 2.1) | Requester | Mọi nhân viên đều được tạo yêu cầu |
| `SERVICE_REQUEST_READ` | `GET /service-requests`, `GET /service-requests/{id}` | Tất cả các role có liên quan | Requester, Active Assignee, hoặc Admin | Nhân viên chỉ đọc request của mình hoặc được giao xử lý |
| `SERVICE_REQUEST_UPDATE` | `PUT /service-requests/{id}` | Requester (`06_API_CONTRACT.md` 13.5) | Chỉ người tạo (`requester`) khi status = `OPEN` | Không cho phép người khác sửa nội dung |
| `SERVICE_REQUEST_UPDATE_STATUS` | `PUT /service-requests/{id}/status` | Active Assignee (`02_...` 6.3, `06_...` 13.7) | Kỹ thuật viên đang xử lý hoặc Admin | Yêu cầu kiểm tra active assignment |
| `SERVICE_REQUEST_ASSIGN` | `POST /service-requests/{id}/assignments` | **CHƯA ĐƯỢC CẤP CHO BẤT KỲ ROLE NÀO** | Cần người có thẩm quyền điều phối dịch vụ | **`SERVICE_AUTHORIZATION_MAPPING_GAP`** |

---

## 9. Đề Xuất Mã Lỗi Xung Đột Phân Công (Assignment Conflict Error)

- **Mã lỗi chuẩn**: `SERVICE_ASSIGNMENT_CONFLICT`
- **HTTP Status**: `409 Conflict`
- **Thông điệp**: "Yêu cầu dịch vụ đang được phân công đồng thời hoặc trạng thái phân công đã thay đổi. Vui lòng tải lại dữ liệu và thử lại."
- **Điều kiện phát sinh**:
  - Vi phạm partial unique index `uk_service_assignments_one_active` (SQLState `23505`).
  - Hoặc xung đột khóa row coordination lock trên `ServiceRequest`.
- **Ranh giới phân biệt**:
  - Không dùng cho Assignee không tồn tại / inactive (`USER_NOT_FOUND` / `USER_INACTIVE`).
  - Không dùng cho Actor thiếu quyền (`ACCESS_DENIED`).
  - Không dùng cho Version mismatch trên `ServiceRequest` (vẫn dùng `OPTIMISTIC_LOCK_CONFLICT`).
- **Ghi nhận**: **`CANONICAL_PATCH_REQUIRED`** và **`SERVICE_ASSIGNMENT_ERROR_CODE_GAP`**. Theo governance, mã lỗi này không được đưa vào production code trước khi cập nhật tài liệu `06_API_CONTRACT.md`.

---

## 10. Kế Hoạch Di Trú CSDL Cho Phase 9 (Migration Plan)

Đánh giá giữa hai phương án:
- **Phương án A**: Gộp cả unique index `uk_service_assignments_one_active` và seed `role_permissions` vào `V013`.
- **Phương án B (Khuyến nghị)**: Tách riêng:
  - `V013__add_service_request_assignment_invariants.sql`: Tạo partial unique index bảo vệ concurrency của Service Request Assignment.
  - `V014__seed_role_permissions.sql`: Seed dữ liệu liên kết vai trò và quyền hạn sau khi ma trận phân quyền canonical được phê duyệt chính thức.

### Đánh giá kỹ thuật:
1. **Phạm vi module (Domain Decoupling)**: `V013` thuộc phạm vi nghiệp vụ Service Request. Seed `role_permissions` thuộc phạm vi Identity & Access Control của toàn hệ thống. Việc gộp sẽ làm lẫn lộn ranh giới module.
2. **Nguy cơ tắc nghẽn (Blocking Risk)**: `ROLE_PERMISSION_CANONICAL_MATRIX_GAP` đòi hỏi người dùng / Product Owner phê duyệt ma trận toàn diện 4 roles × 29 permissions. Nếu gộp vào `V013`, việc triển khai schema của Phase 9 sẽ bị chặn hoàn toàn.
3. **Tính độc lập khi rollback**: Nếu seed `role_permissions` cần điều chỉnh trong tương lai, việc tách riêng migration giúp kiểm soát phiên bản và rollback an toàn mà không ảnh hưởng đến cấu trúc bảng `service_assignments`.
4. **Idempotency**: `V014` sẽ sử dụng cú pháp `INSERT INTO role_permissions ... ON CONFLICT (role_id, permission_id) DO NOTHING`.

---

## 11. Tổng Hợp Các Gaps Chặn Phase 9 Implementation

1. **`ROLE_PERMISSION_SEED_GAP_CONFIRMED`**: Bảng `role_permissions` có 0 dòng trong migration sạch. Mọi endpoint `@PreAuthorize("hasAuthority(...)")` sẽ trả về 403 trên production. [ĐÃ KHẮC PHỤC QUA V014]
2. **`TEST_AUTHORITY_FIXTURE_MASKS_SEED_GAP`**: Các bài kiểm thử trước đây tự chèn quyền trong `@BeforeEach`, che giấu khoảng trống seed trong production. [ĐÃ KHẮC PHỤC QUA RolePermissionSeedIntegrationTest]
3. **`ROLE_PERMISSION_CANONICAL_MATRIX_GAP`**: Tài liệu canonical chưa có ma trận gán quyền chính thức cho 4 System Roles. [ĐÃ KHẮC PHỤC QUA Section 2.6 trong 02_USER_ROLES_AND_WORKFLOWS.md]
4. **`SERVICE_AUTHORIZATION_MAPPING_GAP`**: Quyền `SERVICE_REQUEST_ASSIGN` tồn tại nhưng chưa có vai trò nào được cấp theo canonical docs. [ĐÃ KHẮC PHỤC QUA VIỆC CẤP CHO ADMIN TRONG MVP]
5. **`SERVICE_ASSIGNMENT_ERROR_CODE_GAP`**: Mã lỗi `SERVICE_ASSIGNMENT_CONFLICT` (HTTP 409) cần được bổ sung vào `06_API_CONTRACT.md`. [ĐÃ KHẮC PHỤC QUA BẢN VÁ CANONICAL 06_API_CONTRACT.md]
6. **`SERVICE_ASSIGNMENT_CONCURRENCY_SCHEMA_GAP`**: Đã giải quyết bằng migration `V013__add_service_request_assignment_invariants.sql`.

---

## 12. Kết Quả Khắc Phục Nền Tảng (Remediation Execution)

1. **Vá tài liệu Canonical**:
   - `02_USER_ROLES_AND_WORKFLOWS.md`: Bổ sung Section 2.6 (Canonical Role-Permission Matrix) cho 29 permissions và 4 roles (ADMIN=29, PM=19, LEADER=14, EMP=12).
   - `06_API_CONTRACT.md`: Cập nhật Section 13.6 và Section 20.6 với mã lỗi chuẩn `SERVICE_ASSIGNMENT_CONFLICT` (HTTP 409 Conflict).
2. **Hiện thực di trú CSDL Flyway**:
   - `V013__add_service_request_assignment_invariants.sql`: Tạo partial unique index `uk_service_assignments_one_active` trên `service_assignments(request_id) WHERE is_active = TRUE`.
   - `V014__seed_role_permissions.sql`: Chèn 74 bản ghi liên kết quyền hạn chính thức bằng cú pháp idempotent `ON CONFLICT (role_id, permission_id) DO NOTHING`.
3. **Kiểm thử tích hợp phân quyền sạch**:
   - Tạo bài test mới `RolePermissionSeedIntegrationTest.java` chạy trên PostgreSQL Testcontainers sạch.
   - Luồng kiểm thử: người dùng đăng nhập qua `/api/v1/auth/login`, nhận JWT thật và gọi các endpoint bảo vệ bằng `@PreAuthorize` mà không dùng bất kỳ câu lệnh fixture chèn quyền nào.
   - Kết quả: 7/7 kịch bản kiểm thử PASS, toàn bộ 177/177 bài test của repository PASS, 0 lỗi Checkstyle.
4. **Kết luận**: Nền tảng phân quyền và các canonical blockers đã được giải quyết toàn diện, sẵn sàng cho nhiệm vụ lập kế hoạch và triển khai Phase 9.

---

## 13. Kiểm Toán Cuối Cùng & Vá Phạm Vi Đọc Project (Project Read Scoping Remediation)

- **Vấn đề phát hiện**: Global authority `PROJECT_READ` được cấp cho toàn bộ 4 roles (V015), nhưng tầng ứng dụng Project trước đó chưa kiểm tra quan hệ thành viên dự án (`project_members.is_active = true`), dẫn tới rò rỉ dữ liệu giữa các nhân viên không thuộc dự án.
- **Biện pháp khắc phục**:
  1. `ProjectRepository`: Bổ sung điều kiện JPQL `EXISTS` kiểm tra thành viên active ở cấp database (`WHERE (:memberUserId IS NULL OR EXISTS (SELECT 1 FROM ProjectMember pm WHERE pm.projectId = p.id AND pm.userId = :memberUserId AND pm.active = true))`) cho cả `searchProjects` và `countQuery`, bảo toàn phân trang, tìm kiếm và sắp xếp.
  2. `ProjectApplicationService`, `ProjectMemberApplicationService`, `MilestoneApplicationService`: Kiểm tra quyền quản trị tối cao của `ADMIN` (xem toàn hệ thống theo canonical); đối với người dùng không phải ADMIN (kể cả PM, Leader, Employee), bắt buộc phải là active member (`pm.is_active = true`), nếu không từ chối truy cập với HTTP 403 `ACCESS_DENIED`.
  3. `ProjectController`: Nhận `@AuthenticationPrincipal WorkSphereUserPrincipal` và truyền vào các service method.
  4. Bổ sung 5 kịch bản kiểm thử tích hợp đầy đủ trong `RolePermissionSeedIntegrationTest.java` (đăng nhập thật, JWT thật, PostgreSQL Testcontainers) chứng minh: Active Employee/Leader xem được; Unrelated/Inactive member bị từ chối 403; Multi-project scoping chỉ trả project hợp lệ với count query chính xác; Admin xem toàn bộ, PM bị giới hạn theo membership.
  5. Toàn bộ 183/183 test PASS, Checkstyle 0 lỗi.
