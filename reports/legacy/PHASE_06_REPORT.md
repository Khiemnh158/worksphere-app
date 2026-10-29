# PHASE 06 REPORT: PROJECT MODULE

## 1. Checkpoint & Bối cảnh
- **Checkpoint cơ sở**: Commit `eda1f51cbbb512fec83ab750a3db442ce9a13fc9` (`docs(agent): checkpoint phase 5 completion`).
- **Phạm vi triển khai**: Giai đoạn 6 - Project Module theo `docs/08_DEVELOPMENT_ROADMAP.md` và `docs/06_API_CONTRACT.md` (mục 11).
- **Ranh giới nghiêm ngặt**:
  - Không triển khai Task Management (Task, Task Assignment, Task Status History) thuộc Phase 7.
  - Không triển khai Comment, File Attachment, Asset, Service Request, Notification, Mobile.
  - Không sửa các gap đã deferred của Phase 5 (`TEMPORARY_PASSWORD_FLOW_GAP`, `TEAM_API_CONTRACT_GAP`).
  - Không tạo thêm Organization entity hay logic multi-tenant.

## 2. Database Audit & Migrations
- Cấu trúc bảng liên quan đến Project đã được định nghĩa hoàn chỉnh trong:
  - `V003__create_project_tables.sql`: các bảng `projects`, `project_members`, `milestones`, `project_status_histories`.
  - `V010__create_deferred_foreign_keys_indexes_and_constraints.sql`: khóa ngoại, chỉ mục `idx_projects_manager_id`, `idx_projects_department_id`, `idx_projects_status`, `idx_projects_planned_end_date`, `uk_projects_code`.
  - `V011__seed_roles_and_permissions.sql`: các permission `PROJECT_READ`, `PROJECT_CREATE`, `PROJECT_UPDATE`, `PROJECT_MEMBER_MANAGE`.
- **Kết luận**: Schema hiện có hoàn toàn đầy đủ, **không tạo migration mới V012**. Giữ nguyên 100% các file migration `V001`-`V011`.

## 3. Nội dung triển khai Phase 6

### A. Project Domain & Repository
- **Domain**:
  - [Project](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/domain/Project.java): Ánh xạ bảng `projects` với PK UUID, `code`, `name`, `description`, `manager_id`, `department_id`, `status` (`ProjectStatus`: `DRAFT`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`), `priority` (`ProjectPriority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `start_date`, `planned_end_date`, `actual_end_date`, `progress_percent`, `is_deleted`, audit fields và `@Version Long version`.
  - Ban đầu khi tạo, dự án luôn ở trạng thái `DRAFT` theo API Contract 11.2.
  - Hỗ trợ Optimistic Locking (`version`) và kiểm tra ràng buộc `planned_end_date >= start_date`.
- **Repository**:
  - [ProjectRepository](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/infrastructure/persistence/ProjectRepository.java): Hỗ trợ tìm kiếm phân trang an toàn `searchProjects(...)` lọc theo `search` (code/name), `status`, `priority`, `managerId`, `departmentId`, loại trừ soft-delete (`deleted = false`).

### B. Project Member
- **Domain**:
  - [ProjectMember](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/domain/ProjectMember.java): Ánh xạ bảng `project_members` với `project_id`, `user_id`, `project_role` (`ProjectRole`: `PROJECT_MANAGER`, `TEAM_LEADER`, `MEMBER`, `OBSERVER`), `joined_at`, `left_at`, `is_active`.
- **Repository**:
  - [ProjectMemberRepository](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/infrastructure/persistence/ProjectMemberRepository.java): Quản lý quan hệ thành viên, đếm số lượng thành viên active, đếm số Project Manager active để đảm bảo không xóa Project Manager duy nhất.

### C. Milestone
- **Domain**:
  - [Milestone](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/domain/Milestone.java): Ánh xạ bảng `milestones` với `project_id`, `name`, `description`, `due_date`, `completed_at`, `status` (`MilestoneStatus`: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `CANCELLED`), `@Version version`.
- **Repository**:
  - [MilestoneRepository](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/infrastructure/persistence/MilestoneRepository.java): Lấy danh sách mốc tiến độ theo dự án sắp xếp theo ngày đến hạn (`due_date ASC`).

### D. Project Status History & Workflow
- **Domain & Repository**:
  - [ProjectStatusHistory](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/domain/ProjectStatusHistory.java) & [ProjectStatusHistoryRepository](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/infrastructure/persistence/ProjectStatusHistoryRepository.java).
- **Workflow chuyển trạng thái**:
  - `DRAFT -> ACTIVE`, `DRAFT -> CANCELLED`
  - `ACTIVE -> ON_HOLD`, `ACTIVE -> COMPLETED`, `ACTIVE -> CANCELLED`
  - `ON_HOLD -> ACTIVE`, `ON_HOLD -> CANCELLED`
  - Các bước chuyển không hợp lệ (ví dụ: `DRAFT -> COMPLETED`, `DRAFT -> ON_HOLD`) bị từ chối với lỗi `PROJECT_STATUS_TRANSITION_INVALID`.
  - Dự án đã `COMPLETED` hoặc `CANCELLED` bị từ chối chuyển trạng thái tiếp (`PROJECT_ALREADY_COMPLETED`, `PROJECT_ALREADY_CANCELLED`).
  - Lịch sử thay đổi trạng thái được ghi tự động trong cùng một transaction.

### E. Application Services
- [ProjectApplicationService](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/application/ProjectApplicationService.java):
  - Tìm kiếm dự án có phân trang, tính toán số lượng thành viên active.
  - Tạo dự án mới (luôn ở trạng thái `DRAFT`), tự động thêm người tạo làm `PROJECT_MANAGER` trong `project_members`, thêm các thành viên ban đầu hợp lệ.
  - Lấy chi tiết dự án kèm danh sách `milestones` và `allowedActions` cho client.
  - Cập nhật thông tin dự án có kiểm tra Optimistic Locking (`OPTIMISTIC_LOCK_CONFLICT`).
  - Đổi trạng thái dự án và ghi log lịch sử.
- [ProjectMemberApplicationService](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/application/ProjectMemberApplicationService.java):
  - Lấy danh sách thành viên phân trang.
  - Thêm thành viên mới (chặn duplicate membership `PROJECT_MEMBER_ALREADY_EXISTS`, kiểm tra user active, kiểm tra project active/draft).
  - Cập nhật vai trò thành viên dự án (`project_role`).
  - Xóa thành viên khỏi dự án (ngăn chặn xóa `PROJECT_MANAGER` duy nhất `PROJECT_MANAGER_REQUIRED`).
- [MilestoneApplicationService](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/application/MilestoneApplicationService.java):
  - Tạo và liệt kê milestone cho dự án.

### F. REST Web API
- [ProjectController](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/web/ProjectController.java):
  - `GET /api/v1/projects` (`PROJECT_READ`)
  - `POST /api/v1/projects` (`PROJECT_CREATE`)
  - `GET /api/v1/projects/{projectId}` (`PROJECT_READ`)
  - `PUT /api/v1/projects/{projectId}` (`PROJECT_UPDATE`)
  - `PUT /api/v1/projects/{projectId}/status` (`PROJECT_UPDATE`)
  - `GET /api/v1/projects/{projectId}/members` (`PROJECT_READ`)
  - `POST /api/v1/projects/{projectId}/members` (`PROJECT_MEMBER_MANAGE`)
  - `PUT /api/v1/projects/{projectId}/members/{memberId}` (`PROJECT_MEMBER_MANAGE`)
  - `DELETE /api/v1/projects/{projectId}/members/{memberId}` (`PROJECT_MEMBER_MANAGE`)
  - `POST /api/v1/projects/{projectId}/milestones` (`PROJECT_UPDATE`)
  - `GET /api/v1/projects/{projectId}/milestones` (`PROJECT_READ`)
- [GlobalExceptionHandler](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/shared/exception/GlobalExceptionHandler.java):
  - Bổ sung xử lý `ObjectOptimisticLockingFailureException` trả về HTTP 409 Conflict với error code `OPTIMISTIC_LOCK_CONFLICT` theo đúng API Contract.

## 4. Bản vá LAST_PROJECT_MANAGER_INVARIANT_GAP
- **Vấn đề phát hiện qua Audit**: Phương thức `updateMemberRole` trong `ProjectMemberApplicationService` cho phép giáng cấp `PROJECT_MANAGER` duy nhất của dự án thành `TEAM_LEADER`, `MEMBER` hoặc `OBSERVER`, làm mất đi người quản lý duy nhất.
- **Giải pháp khắc phục**:
  - Trong [ProjectMemberApplicationService.java](file:///D:/WorkSphere/backend/src/main/java/com/worksphere/project/application/ProjectMemberApplicationService.java):
    - Kiểm tra nếu thành viên đang active, vai trò hiện tại là `PROJECT_MANAGER`, vai trò mới khác `PROJECT_MANAGER`, và số lượng `PROJECT_MANAGER` active của dự án `<= 1` thì từ chối ngay với ngoại lệ `BusinessRuleException("PROJECT_MANAGER_REQUIRED", "Không thể giáng cấp Project Manager duy nhất của dự án")`.
    - Không chặn khi giữ nguyên vai trò `PROJECT_MANAGER` hoặc khi dự án vẫn còn ít nhất một `PROJECT_MANAGER` active khác.
- **Kiểm thử bổ sung**:
  - `updateMemberRole_shouldFailWhenDemotingSoleProjectManager`: Giáng cấp PM duy nhất bị từ chối với HTTP 422 `PROJECT_MANAGER_REQUIRED`, vai trò trong DB không đổi (PASS).
  - `updateMemberRole_shouldSucceedWhenAnotherProjectManagerExists`: Giáng cấp PM khi còn PM khác thành công, vai trò mới được lưu, dự án còn 1 active PM (PASS).
  - `updateMemberRole_shouldSucceedWhenKeepingSameProjectManagerRole`: Cập nhật giữ nguyên vai trò `PROJECT_MANAGER` không bị chặn (PASS).

## 5. Kết quả Kiểm thử & Xác thực
- **Checkstyle**: 0 Checkstyle violations (`.\mvnw.cmd checkstyle:check "-Dcheckstyle.config.location=checkstyle.xml"` exit code 0).
- **Integration Test MockMvc**:
  - [ProjectMockMvcTest](file:///D:/WorkSphere/backend/src/test/java/com/worksphere/project/ProjectMockMvcTest.java): 15/15 tests PASS trên PostgreSQL Testcontainers.
    - `getProjects_shouldReturnEmptyListInitially` (PASS)
    - `getProjects_shouldFailWhenUnauthenticated` (401 PASS)
    - `getProjects_shouldFailWhenMissingPermission` (403 PASS)
    - `createProject_shouldSucceedAndInitializeAsDraft` (201, status=DRAFT, initial members PASS)
    - `createProject_shouldFailWhenCodeAlreadyExists` (409/422 PASS)
    - `createProject_shouldFailWhenEndDateBeforeStartDate` (422 PASS)
    - `updateProject_shouldSucceed` (200 PASS)
    - `updateProject_shouldFailWhenOptimisticLockConflict` (409 OPTIMISTIC_LOCK_CONFLICT PASS)
    - `changeProjectStatus_shouldSucceedAndRecordHistory` (DRAFT -> ACTIVE + history recorded PASS)
    - `changeProjectStatus_shouldFailWhenInvalidTransition` (DRAFT -> COMPLETED rejected PASS)
    - `projectMembers_crudWorkflow` (Add, duplicate rejection, list, update role, protect last PM on delete, remove employee PASS)
    - `milestones_crudWorkflow` (Create milestone, list milestones PASS)
    - `updateMemberRole_shouldFailWhenDemotingSoleProjectManager` (422 PROJECT_MANAGER_REQUIRED PASS)
    - `updateMemberRole_shouldSucceedWhenAnotherProjectManagerExists` (200 PASS)
    - `updateMemberRole_shouldSucceedWhenKeepingSameProjectManagerRole` (200 PASS)
- **Hồi quy toàn bộ Test Suite**:
  - `com.worksphere.BackendApplicationTests`: 1 test
  - `com.worksphere.MigrationIntegrationTest`: 1 test
  - `com.worksphere.identity.AuthIntegrationTest`: 11 tests
  - `com.worksphere.identity.AuthMockMvcTest`: 16 tests
  - `com.worksphere.identity.AdminUserMockMvcTest`: 7 tests
  - `com.worksphere.organization.DepartmentMockMvcTest`: 8 tests
  - `com.worksphere.project.ProjectMockMvcTest`: 15 tests
  - **Tổng cộng**: **59/59 tests PASS**, 0 Failures, 0 Errors, 0 Skipped, BUILD SUCCESS, exit code 0.
- **Secret Scan**: Không phát hiện mật khẩu plaintext, token hay credentials lộ trong repository.
- **Tài liệu Canonical & Migration**: 10 file tài liệu canonical và Flyway `V001`-`V011` không bị thay đổi.
- **Ghi chú kỹ thuật**: Giao dịch thay đổi trạng thái và ghi log lịch sử nằm trong cùng `@Transactional`; cơ chế rollback khi xảy ra lỗi dựa trên quản lý transaction của Spring Framework.
