# BÁO CÁO TRIỂN KHAI & VÁ LỖI KIỂM TOÁN PHASE 7: TASK MANAGEMENT BACKEND

## 1. Checkpoint khởi tạo & Vá lỗi

- **Base commit triển khai Phase 7**: `c9702acc1e2b74fb04eb3a29f6e527d158dcd6af` (`docs(agent): checkpoint visual prototype`)
- **Phase 7 Implementation commit**: `abefa44b0d6ec00a28798b74b17b7ecbbb726168` (`feat(task): implement task management module`)
- **Audit Checkpoint**: `d548dcb30327fb80be91e90643db4695b9f76c21` (`docs(agent): expand tool management policy`)
- **Branch**: `main`
- **HEAD equals origin/main**: Xác nhận đúng trước khi thực hiện bản vá
- **Working tree**: Clean trước khi thực hiện bản vá

---

## 2. Phạm vi chuẩn mực (Canonical Scope)

Căn cứ theo:
- `docs/01_PROJECT_SCOPE.md` (Section 3.4)
- `docs/02_USER_ROLES_AND_WORKFLOWS.md` (Section 5)
- `docs/04_SYSTEM_ARCHITECTURE.md` (Section 4 & 5)
- `docs/05_DATABASE_DESIGN.md` (Section 8)
- `docs/06_API_CONTRACT.md` (Section 12)
- `docs/07_FOUR_COURSE_MATRIX.md` (Section 3)
- `docs/08_DEVELOPMENT_ROADMAP.md` (Section 11)
- `docs/09_CODING_STANDARDS.md`
- `docs/10_AI_AGENT_INSTRUCTIONS.md` (Section 10.8)

---

## 3. Quyết định phạm vi Task Comment

- **Căn cứ Roadmap**: `docs/08_DEVELOPMENT_ROADMAP.md` Section 11.2, 11.3 và 11.5 xác nhận Task Comments thuộc phạm vi công việc của Phase 7.
- **Căn cứ API Contract**: `docs/06_API_CONTRACT.md` Section 12.12 - 12.15 định nghĩa đầy đủ 4 endpoints cho bình luận công việc.
- **Căn cứ Database**: Bảng `task_comments` đã có sẵn từ migration `V005__create_task_tables.sql`.
- **Kết luận**: Task Comments được triển khai hoàn chỉnh trong Phase 7 (Entity, Repository, ApplicationService, Controller, Unit & Integration Tests).

---

## 4. Ngoài phạm vi (Out-of-Scope)

- **Task Attachments**: Bảng `task_attachments` giữ nguyên trong DB; không triển khai Entity/Service/API do bị phụ thuộc vào File Module (`stored_files`) được xếp lịch ở Phase 8 (`TASK_ATTACHMENT_DEFERRED_UNTIL_PHASE_08`).
- **React Native / Mobile UI**: Không can thiệp code mobile.
- **Service Request / Asset / Notification / Team API / Dashboard Aggregator**: Giữ nguyên ranh giới đóng của phase.

---

## 5. Ánh xạ cơ sở dữ liệu (Database Mapping)

Mọi entity JPA ánh xạ chính xác 100% cột trong Flyway migrations `V005`, `V010` và `V012`:

1. **`Task`** (`tasks`):
   - `id`: UUID (PK)
   - `project_id`: UUID (FK `projects.id`)
   - `parent_task_id`: UUID (FK `tasks.id`)
   - `milestone_id`: UUID (FK `milestones.id`)
   - `title`: VARCHAR(255)
   - `description`: TEXT
   - `status`: VARCHAR(30)
   - `priority`: VARCHAR(20)
   - `reporter_id`: UUID (FK `users.id`)
   - `start_date`: DATE
   - `due_date`: TIMESTAMP WITH TIME ZONE
   - `completed_at`: TIMESTAMP WITH TIME ZONE
   - `progress_percent`: NUMERIC(5,2)
   - `estimated_minutes`: INTEGER
   - `actual_minutes`: INTEGER
   - `is_deleted`: BOOLEAN
   - `deleted_at`, `deleted_by`: Audit soft delete
   - `created_by`, `updated_by`, `created_at`, `updated_at`: Audit fields
   - `version`: BIGINT (Optimistic Locking)

2. **`TaskAssignment`** (`task_assignments`):
   - `id`: UUID (PK)
   - `task_id`: UUID (FK `tasks.id`)
   - `assignee_id`: UUID (FK `users.id`)
   - `assigned_by`: UUID (FK `users.id`)
   - `assigned_at`: TIMESTAMP WITH TIME ZONE
   - `unassigned_at`: TIMESTAMP WITH TIME ZONE
   - `is_active`: BOOLEAN
   - `uk_task_assignments_active`: Partial Unique Index trên `(task_id, assignee_id) WHERE is_active = TRUE`

3. **`TaskStatusHistory`** (`task_status_histories`):
   - `id`: UUID (PK)
   - `task_id`: UUID (FK `tasks.id`)
   - `from_status`: VARCHAR(30) nullable
   - `to_status`: VARCHAR(30) required
   - `comment`: VARCHAR(1000)
   - `changed_by`: UUID (FK `users.id`)
   - `changed_at`: TIMESTAMP WITH TIME ZONE

4. **`TaskComment`** (`task_comments`):
   - `id`: UUID (PK)
   - `task_id`: UUID (FK `tasks.id`)
   - `author_id`: UUID (FK `users.id`)
   - `content`: TEXT
   - `parent_id`: UUID (FK `task_comments.id`)
   - `is_edited`: BOOLEAN
   - `edited_at`: TIMESTAMP WITH TIME ZONE
   - `is_deleted`: BOOLEAN (Soft delete nội dung)
   - `created_at`, `updated_at`: TIMESTAMP WITH TIME ZONE

---

## 6. Trạng thái Migration & V012

- **V001 đến V011**: Không sửa đổi bất kỳ byte nào.
- **V012 mới**: `V012__add_active_task_assignment_uniqueness.sql` được tạo mới để bổ sung partial unique index cho PostgreSQL:
  ```sql
  CREATE UNIQUE INDEX uk_task_assignments_active
  ON task_assignments(task_id, assignee_id)
  WHERE is_active = TRUE;
  ```
- **Hỗ trợ tương thích môi trường test**: Bổ sung `TaskFlywayConfiguration` để H2 in-memory context test dừng ở target V011 (do H2 không hỗ trợ mệnh đề `WHERE` trong partial index), trong khi PostgreSQL (Testcontainers, dev, staging, prod) thực thi đầy đủ V012.
- **Flyway validation**: PASS 100% trên cả Testcontainers PostgreSQL và test runner.

---

## 7. Các phát hiện kiểm toán & Bản vá kỹ thuật (Audit Findings & Patches)

### 7.1. HIGH: TASK_ASSIGNMENT_CONCURRENCY_RISK (Đã vá)
- **Vấn đề**: Nghiệp vụ cấm 2 active assignment trùng trên cùng task/assignee, nhưng trước đây chỉ kiểm tra bằng `existsByTaskIdAndAssigneeIdAndActiveTrue` ở service layer, tiềm ẩn rủi ro race condition khi có yêu cầu đồng thời.
- **Giải pháp**:
  - Tạo migration `V012__add_active_task_assignment_uniqueness.sql` áp dụng PostgreSQL partial unique index `uk_task_assignments_active`.
  - Trong `TaskApplicationService.createTask` và `assignUsers`, thực hiện `taskAssignmentRepository.saveAndFlush(assignment)` trong khối `try-catch`.
  - Chuyển đổi chính xác `DataIntegrityViolationException` vi phạm `uk_task_assignments_active` thành `BusinessRuleException("TASK_ALREADY_ASSIGNED", ...)` (HTTP 422).
  - Không biến các vi phạm toàn vẹn dữ liệu khác thành duplicate assignment.
- **Kiểm thử**:
  - Xác minh index tồn tại trong `pg_indexes`.
  - Phân công tuần tự trùng bị từ chối với mã `TASK_ALREADY_ASSIGNED`.
  - Reassign sau khi unassign thành công (bản ghi inactive cũ không chặn bản ghi active mới).
  - Phân công đồng thời (concurrent) qua `ExecutorService` 4 luồng chỉ có đúng 1 bản ghi active được commit, các luồng còn lại trả về `TASK_ALREADY_ASSIGNED`.

### 7.2. MEDIUM: TASK_HIERARCHY_DEPTH_POLICY_GAP (Đã vá)
- **Vấn đề**: Code cũ tự ý ném `TASK_PARENT_CYCLE_DETECTED` khi độ sâu cây vượt quá 50 cấp, trong khi canonical docs không quy định giới hạn nghiệp vụ 50 cấp.
- **Giải pháp**:
  - Sử dụng cấu trúc `Set<UUID> visited` để phát hiện vòng lặp phân cấp thực sự (`!visited.add(current)`).
  - Cho phép cây hợp lệ có độ sâu trên 50 cấp kết thúc bình thường khi `current == null`.
  - Chặn chu trình self-parent, chu trình 2 cấp, chu trình 3 cấp bằng mã `TASK_PARENT_CYCLE_DETECTED`.
  - Chặn cha bị soft-deleted (`TASK_NOT_FOUND`).
  - Chặn cha khác dự án (`TASK_PARENT_PROJECT_MISMATCH`).
- **Kiểm thử**:
  - Chuỗi phân cấp hợp lệ sâu 52 cấp được tạo và thêm subtask thành công (HTTP 201).
  - Kiểm thử chu trình tự trỏ, chu trình 2 cấp, chu trình 3 cấp đều bị phát hiện chính xác.

### 7.3. MEDIUM: TASK_COMMENT_AUTHORIZATION_DEVIATION (Đã vá)
- **Vấn đề**: Code cũ cho phép `PROJECT_MANAGER` tự động sửa/xóa bình luận của thành viên khác, vi phạm quy tắc chuẩn mực (chỉ tác giả bình luận hoặc Quản trị viên hệ thống mới có quyền).
- **Giải pháp**:
  - Bỏ quyền can thiệp bình luận của `PROJECT_MANAGER` đối với bình luận của người khác trong `TaskCommentApplicationService`.
  - Tái sử dụng kiểm tra `hasSystemAdminRole(principal)` theo vai trò `ADMIN` hệ thống chuẩn mực.
  - Bình luận cha không tồn tại, đã bị soft-deleted hoặc thuộc task khác bị từ chối với mã `COMMENT_NOT_FOUND` (HTTP 404).
- **Kiểm thử**:
  - Tác giả sửa/xóa bình luận thành công (200 OK).
  - Thành viên khác sửa/xóa bị từ chối (422 FORBIDDEN).
  - `PROJECT_MANAGER` không phải Admin sửa/xóa bình luận của nhân viên bị từ chối (422 FORBIDDEN).
  - Quản trị viên hệ thống (Admin) sửa/xóa bình luận của nhân viên thành công (200 OK).
  - Trả lời bình luận khác task hoặc bình luận đã xóa bị từ chối (404 COMMENT_NOT_FOUND).

### 7.4. MEDIUM: TASK_STATUS_HISTORY_ROLLBACK_TEST_GAP (Đã vá)
- **Vấn đề**: Chưa có integration test chứng minh rollback giao dịch trên cơ sở dữ liệu thật PostgreSQL khi việc ghi lịch sử trạng thái thất bại.
- **Giải pháp**:
  - Bổ sung integration test `testStatusHistoryRollbackOnFailure` thực thi trực tiếp trên Testcontainers PostgreSQL.
  - Truyền comment vượt quá giới hạn lưu trữ của cột (`task_status_histories.comment VARCHAR(1000)`) với 1005 ký tự để kích hoạt lỗi `DataIntegrityViolationException` từ PostgreSQL engine.
  - Kiểm tra trạng thái dữ liệu sau rollback qua query SQL độc lập: `tasks.status` giữ nguyên `TODO`, `tasks.version` giữ nguyên `0`, và số lượng bản ghi lịch sử của task là `0`.
- **Kết quả**: Rollback test PASS 100% trên PostgreSQL thực tế.

### 7.5. DEFERRED: TASK_DELETE_RULE_AMBIGUITY_DEFERRED (Ghi nhận hoãn)
- **Nội dung**: Khái niệm “Business history quan trọng” chưa được các tài liệu canonical định nghĩa đầy đủ. Logic hiện tại chỉ xét lịch sử trạng thái (`TASK_CANNOT_DELETE_HAS_HISTORY`).
- **Quyết định**: Không tự ý thay đổi hành vi xóa trong bản vá này khi chưa có quyết định chuẩn mực từ tài liệu canonical.
- **Ràng buộc**: Phase tiếp theo không được âm thầm thay đổi quy tắc này mà phải chờ quyết định thiết kế chính thức.

---

## 8. Triển khai Task Core

- **Domain Model**: Đóng gói các bất biến nghiệp vụ trong `Task.java`:
  - `create(...)`: Khởi tạo mặc định `TODO`, tiến độ `0%`, kiểm tra ngày bắt đầu không sau hạn chót (`TASK_DATE_RANGE_INVALID`), thời gian ước tính không âm, chặn self-parent.
  - `updateDetails(...)`: Kiểm tra phiên bản dữ liệu (Optimistic Locking), chặn cập nhật khi ở trạng thái kết thúc (`TASK_TERMINAL_STATE`).
  - `changeStatus(...)`: Kiểm tra ma trận chuyển trạng thái hợp lệ, cập nhật tự động `progressPercent = 100%` và `completedAt = now()` khi `COMPLETED`.
  - `updateProgress(...)`: Chặn cập nhật khi `CANCELLED` hoặc `COMPLETED` (`TASK_TERMINAL_STATE`), giới hạn `[0.0, 100.0]` (`TASK_INVALID_PROGRESS`).
  - `softDelete(...)`: Đánh dấu `deleted = true`, ghi nhận người xóa và thời điểm xóa.
- **Phân trang & Tìm kiếm**: `TaskApplicationService.getTasks` hỗ trợ tìm kiếm full-text theo tiêu đề/mô tả, lọc theo `projectId`, `parentTaskId`, `assigneeId` (dùng JPA criteria subquery), `reporterId`, `status`, `priority`, `overdue`, `dueFrom`, `dueTo`.
- **Sorting Whitelist**: Giới hạn nghiêm ngặt các trường sắp xếp được phép: `createdAt`, `updatedAt`, `dueDate`, `startDate`, `title`, `priority`, `status`, `progressPercent`. Từ chối các trường ngoài danh sách bằng `VALIDATION_ERROR`.

---

## 9. Triển khai Task Assignment & Partial Index

- **Phân công (`assignUsers`)**:
  - Assignee phải là người dùng đang hoạt động (`ACTIVE`, `is_deleted = false`).
  - Assignee phải là thành viên hoạt động (`active = true`) trong dự án của công việc (`TASK_ASSIGNEE_NOT_PROJECT_MEMBER`).
  - Chặn phân công trùng lặp đang có hiệu lực (`TASK_ALREADY_ASSIGNED`) bằng cả kiểm tra fail-fast ở service và chốt chặn partial unique index `uk_task_assignments_active`.
  - Ghi nhận `assignedBy` từ `principal.userId()`, `assignedAt = Instant.now()`.
- **Gỡ phân công (`unassignUser`)**:
  - Ghi nhận `unassignedAt = Instant.now()`, cập nhật `is_active = false`.
  - Kiểm tra đúng cặp `taskId` và `assignmentId`.
  - Bản ghi inactive không cản trở việc phân công lại thành viên đó cho công việc trong tương lai.

---

## 10. Triển khai Status History & Rollback An toàn

- **Giao dịch nguyên khối (`@Transactional`)**: Mọi thao tác cập nhật trạng thái công việc đều ghi nhận bản ghi vào `task_status_histories` trong cùng một transaction.
- **Dữ liệu lịch sử**: `fromStatus`, `toStatus`, `comment`, `changedBy` (từ authenticated principal), `changedAt` (server time).
- **Quy tắc xóa an toàn**: Không cho phép xóa mềm công việc đã có lịch sử thay đổi trạng thái (`TASK_CANNOT_DELETE_HAS_HISTORY`); yêu cầu chuyển sang `CANCELLED`.
- **Bảo đảm tính toàn vẹn**: Khi việc ghi lịch sử gặp lỗi, giao dịch cơ sở dữ liệu bị rollback hoàn toàn, không có trạng thái hay phiên bản công việc nào bị commit dở dang.

---

## 11. Triển khai Task Comment

- **Tạo bình luận (`createComment`)**: Kiểm tra quyền truy cập dự án, kiểm tra bình luận cha (nếu có phản hồi) phải cùng thuộc công việc và chưa bị xóa.
- **Sửa bình luận (`updateComment`)**: Chỉ tác giả hoặc Quản trị viên hệ thống mới có quyền chỉnh sửa (`FORBIDDEN`). Cập nhật cờ `is_edited = true` và `edited_at = now()`.
- **Xóa bình luận (`deleteComment`)**: Chỉ tác giả hoặc Quản trị viên hệ thống mới có quyền xóa (`FORBIDDEN`). Thực hiện soft-delete `is_deleted = true`.
- **Ẩn bình luận đã xóa**: Danh sách bình luận chỉ trả về các bình luận `deleted = false`.

---

## 12. Ma trận Workflow (Task Workflow Matrix)

| Trạng thái hiện tại | Trạng thái đích | Hợp lệ? | Điều kiện & Vai trò |
|---|---|---|---|
| TODO | IN_PROGRESS | Hợp lệ | Assignee, PM, TL, Admin |
| IN_PROGRESS | IN_REVIEW | Hợp lệ | Assignee, PM, TL, Admin |
| IN_REVIEW | COMPLETED | Hợp lệ | **Chỉ PM, TL, Admin** (Assignee tự duyệt bị chặn `FORBIDDEN`). Tiến độ tự chuyển 100%, completedAt được ghi |
| IN_REVIEW | IN_PROGRESS | Hợp lệ | **Chỉ PM, TL, Admin**. Bắt buộc nhập `comment` lý do từ chối (`VALIDATION_ERROR`) |
| TODO | CANCELLED | Hợp lệ | PM, TL, Admin |
| IN_PROGRESS | CANCELLED | Hợp lệ | PM, TL, Admin |
| TODO | COMPLETED | **Bị chặn** | Bỏ qua bước kiểm tra (`TASK_INVALID_STATUS_TRANSITION`) |
| IN_PROGRESS | COMPLETED | **Bị chặn** | Bỏ qua bước kiểm tra (`TASK_INVALID_STATUS_TRANSITION`) |
| COMPLETED | * (bất kỳ) | **Bị chặn** | Trạng thái kết thúc (`TASK_TERMINAL_STATE`) |
| CANCELLED | * (bất kỳ) | **Bị chặn** | Trạng thái kết thúc (`TASK_TERMINAL_STATE`) |

---

## 13. Phân quyền và Kiểm tra bảo mật (Authorization)

1. **Global Permissions** (Kiểm tra bằng `@PreAuthorize` tại Controller theo Seed `V011`):
   - `TASK_READ`: Xem danh sách, chi tiết task, subtask, bình luận.
   - `TASK_CREATE`: Tạo task, tạo subtask.
   - `TASK_UPDATE`: Cập nhật chi tiết task, cập nhật tiến độ.
   - `TASK_UPDATE_STATUS`: Cập nhật trạng thái task.
   - `TASK_ASSIGN`: Phân công hoặc gỡ phân công người thực hiện.
   - `TASK_DELETE`: Xóa mềm task.
2. **Business Context Rules** (Kiểm tra tại Service layer):
   - Người gọi thao tác phải là thành viên đang hoạt động của dự án chứa công việc (hoặc có vai trò Admin hệ thống).
   - Identity an toàn: Toàn bộ `actorId` được trích xuất từ `principal.userId()`, tuyệt đối không tin cậy dữ liệu do client gửi lên.
   - Bình luận: Chỉ tác giả hoặc System Administrator mới được sửa/xóa bình luận.

---

## 14. Danh sách API Endpoints (Section 12 API Contract)

| Phương thức | Đường dẫn | Quyền yêu cầu | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/tasks` | `TASK_READ` | Danh sách công việc có lọc, tìm kiếm, phân trang |
| `POST` | `/api/v1/tasks` | `TASK_CREATE` | Tạo công việc mới (HTTP 201) |
| `GET` | `/api/v1/tasks/{taskId}` | `TASK_READ` | Chi tiết công việc và allowedActions |
| `PUT` | `/api/v1/tasks/{taskId}` | `TASK_UPDATE` | Cập nhật thông tin công việc (Optimistic Lock) |
| `PUT` | `/api/v1/tasks/{taskId}/status` | `TASK_UPDATE_STATUS` | Chuyển trạng thái công việc và ghi lịch sử |
| `PUT` | `/api/v1/tasks/{taskId}/progress` | `TASK_UPDATE` | Cập nhật tiến độ hoàn thành (0% - 100%) |
| `DELETE` | `/api/v1/tasks/{taskId}` | `TASK_DELETE` | Xóa mềm công việc (chặn khi có lịch sử) |
| `POST` | `/api/v1/tasks/{taskId}/assignments` | `TASK_ASSIGN` | Phân công người thực hiện |
| `DELETE` | `/api/v1/tasks/{taskId}/assignments/{assignmentId}` | `TASK_ASSIGN` | Gỡ phân công người thực hiện |
| `GET` | `/api/v1/tasks/{taskId}/subtasks` | `TASK_READ` | Danh sách công việc con |
| `POST` | `/api/v1/tasks/{taskId}/subtasks` | `TASK_CREATE` | Tạo công việc con (HTTP 201) |
| `GET` | `/api/v1/tasks/{taskId}/comments` | `TASK_READ` | Danh sách bình luận công việc |
| `POST` | `/api/v1/tasks/{taskId}/comments` | `TASK_READ` | Thêm bình luận (HTTP 201) |
| `PUT` | `/api/v1/tasks/{taskId}/comments/{commentId}` | `TASK_READ` | Chỉnh sửa bình luận (Tác giả/Admin) |
| `DELETE` | `/api/v1/tasks/{taskId}/comments/{commentId}` | `TASK_READ` | Xóa mềm bình luận (Tác giả/Admin) |

---

## 15. Kết quả kiểm thử (Test Coverage)

### A. Kiểm thử đơn vị (Unit Tests)
- `com.worksphere.task.TaskTest`: 6 tests **PASS**
  - Khởi tạo hợp lệ với TODO và 0% tiến độ.
  - Từ chối tiêu đề trống (`VALIDATION_ERROR`).
  - Từ chối ngày bắt đầu sau hạn chót (`TASK_DATE_RANGE_INVALID`).
  - Từ chối thời gian ước tính âm (`VALIDATION_ERROR`).
  - Từ chối self-parent (`TASK_PARENT_CYCLE_DETECTED`).
  - Xóa mềm thiết lập cờ `is_deleted = true`.
- `com.worksphere.task.TaskWorkflowTest`: 10 tests **PASS**
  - Chuyển trạng thái hợp lệ: `TODO -> IN_PROGRESS -> IN_REVIEW -> COMPLETED`.
  - Cập nhật tiến độ 100% và thời điểm hoàn thành khi `COMPLETED`.
  - Từ chối duyệt `IN_REVIEW -> IN_PROGRESS` (quay về sửa).
  - Hủy công việc từ `TODO` và từ `IN_PROGRESS`.
  - Chặn chuyển trực tiếp `TODO -> COMPLETED`.
  - Chặn chuyển trực tiếp `IN_PROGRESS -> COMPLETED`.
  - Chặn thao tác khi đã `COMPLETED` (terminal state).
  - Chặn thao tác khi đã `CANCELLED` (terminal state).
  - Chặn cập nhật tiến độ khi `CANCELLED`.
  - Chặn cập nhật tiến độ khi `COMPLETED`.
  - Chặn tiến độ ngoài khoảng `[0, 100]`.

### B. Kiểm thử tích hợp (PostgreSQL Testcontainers Integration Tests)
- `com.worksphere.task.TaskMockMvcTest`: 25 tests **PASS**
  1. Tạo công việc thành công (HTTP 201).
  2. Chặn tạo công việc trên dự án không ACTIVE (`TASK_PROJECT_NOT_ACTIVE`).
  3. Chặn phân công người không thuộc dự án (`TASK_ASSIGNEE_NOT_PROJECT_MEMBER`).
  4. Chặn khoảng thời gian không hợp lệ (`TASK_DATE_RANGE_INVALID`).
  5. Lấy danh sách công việc với bộ lọc và phân trang.
  6. Lấy chi tiết công việc với allowedActions.
  7. Cập nhật công việc và kiểm soát xung đột phiên bản (`OPTIMISTIC_LOCK_CONFLICT`).
  8. Toàn bộ vòng đời workflow và ghi nhận status history.
  9. Assignee không được tự duyệt hoàn thành (`FORBIDDEN`).
  10. Từ chối kiểm tra bắt buộc nhập lý do (`VALIDATION_ERROR`).
  11. Chặn chuyển tắt sang hoàn thành (`TASK_INVALID_STATUS_TRANSITION`).
  12. Phân công thành viên và chặn phân công trùng lặp (`TASK_ALREADY_ASSIGNED`).
  13. Tạo và liệt kê công việc con, kiểm tra phân cấp.
  14. Ràng buộc xóa công việc: chặn khi có lịch sử (`TASK_CANNOT_DELETE_HAS_HISTORY`), cho phép khi chưa có lịch sử.
  15. Bảo mật: từ chối 401 khi không có token, 403 khi thiếu quyền.
  16. **[MỚI]** Xác minh partial unique index `uk_task_assignments_active` tồn tại trên PostgreSQL.
  17. **[MỚI]** Từ chối phân công trùng lặp tuần tự bằng `TASK_ALREADY_ASSIGNED`.
  18. **[MỚI]** Cho phép phân công lại sau khi đã gỡ (bản ghi inactive cũ không gây conflict).
  19. **[MỚI]** Phân công đồng thời qua đa luồng (`ExecutorService`) chỉ commit đúng 1 bản ghi active trên PostgreSQL.
  20. **[MỚI]** Phát hiện chu trình phân cấp: self-parent, chu trình 2 cấp và chu trình 3 cấp đều ném `TASK_PARENT_CYCLE_DETECTED`.
  21. **[MỚI]** Chuỗi phân cấp hợp lệ sâu 52 cấp vượt qua bình thường mà không bị báo lỗi chu trình giả.
  22. **[MỚI]** Xác thực công việc cha: từ chối cha đã bị soft-deleted và cha thuộc dự án khác.
  23. **[MỚI]** Phân quyền bình luận: tác giả và Admin sửa/xóa thành công; PM không phải Admin bị từ chối 422 FORBIDDEN.
  24. **[MỚI]** Xác thực bình luận cha: từ chối bình luận cha thuộc task khác hoặc đã bị xóa mềm.
  25. **[MỚI]** Rollback giao dịch: lỗi khi insert status history (tràn độ dài comment) rollback hoàn toàn task status, version và history trên PostgreSQL.

---

## 16. Tổng hợp kiểm thử toàn bộ hệ thống (Regression Suite)

### 16.1. Kiểm thử toàn diện trên Host JDK 27 (với Testcontainers PostgreSQL)
- **Tổng số tests**: **100/100 PASS**
  - `com.worksphere.BackendApplicationTests`: 1 test PASS
  - `com.worksphere.MigrationIntegrationTest`: 1 test PASS (chạy Flyway V001-V012 trên PostgreSQL)
  - `com.worksphere.identity.AuthIntegrationTest`: 11 tests PASS
  - `com.worksphere.identity.AuthMockMvcTest`: 16 tests PASS
  - `com.worksphere.identity.AdminUserMockMvcTest`: 7 tests PASS
  - `com.worksphere.organization.DepartmentMockMvcTest`: 8 tests PASS
  - `com.worksphere.project.ProjectMockMvcTest`: 15 tests PASS
  - `com.worksphere.task.TaskMockMvcTest`: 25 tests PASS (bao gồm 10 tests mới của bản vá)
  - `com.worksphere.task.TaskTest`: 6 tests PASS
  - `com.worksphere.task.TaskWorkflowTest`: 10 tests PASS
- **Failures**: 0 | **Errors**: 0 | **Skipped**: 0
- **Build Status**: **BUILD SUCCESS**
- **Thời gian chạy**: ~1m 37s

### 16.2. Kiểm chuẩn môi trường Java 21 (Docker `eclipse-temurin:21-jdk`)
Thực thi kiểm chuẩn độc lập trong container Java 21 chính thức để xác minh tính tương thích bytecode Java 21 theo Roadmap:
- **Image**: `eclipse-temurin:21-jdk` (Digest: `sha256:f9bf7e9fe2f9bc4657537c1a7e20c768f0c3bafca41598263be4714783dd62eb`)
- **Runtime**: `Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS)`, Apache Maven `3.9.16`
- **Lệnh thực thi**:
  ```powershell
  # Checkstyle trên Java 21
  docker run --rm -v "D:\WorkSphere\backend:/workspace" -v "C:\Users\dienm\.m2:/root/.m2" -w /workspace eclipse-temurin:21-jdk sh -c "sh ./mvnw checkstyle:check -Dcheckstyle.config.location=checkstyle.xml"

  # Unit tests trên Java 21
  docker run --rm -v "D:\WorkSphere\backend:/workspace" -v "C:\Users\dienm\.m2:/root/.m2" -w /workspace eclipse-temurin:21-jdk sh -c "sh ./mvnw test -Dtest=TaskTest,TaskWorkflowTest"

  # H2 context load test trên Java 21
  docker run --rm -v "D:\WorkSphere\backend:/workspace" -v "C:\Users\dienm\.m2:/root/.m2" -w /workspace eclipse-temurin:21-jdk sh -c "sh ./mvnw test -Dtest=BackendApplicationTests"
  ```
- **Kết quả**:
  - `javac [debug parameters release 21]`: Biên dịch 110 tệp mã nguồn **PASS**.
  - Checkstyle: **0 violations PASS**.
  - Unit tests: **16/16 tests PASS** (`TaskTest`: 6, `TaskWorkflowTest`: 10).
  - H2 Context test: `BackendApplicationTests` **1/1 test PASS** (Flyway V001-V011 trên H2 engine hoạt động chính xác qua `TaskFlywayConfiguration`).
- **Ghi chú hạ tầng**: Container Java 21 tạm thời không mount Docker socket để bảo đảm an toàn hệ thống (không kích hoạt Docker-in-Docker phức tạp). Do đó, các bài test integration phụ thuộc Testcontainers PostgreSQL được thực thi trên host suite.

---

## 17. Kiểm tra tuân thủ Checkstyle & Secret Scan

- **Checkstyle**: 0 violations (`checkstyle:check` exit code 0 trên cả Host JDK 27 và Container Java 21).
- **Secret scan**: 0 secret, token, mật khẩu, private key hay file `.env` thật nào bị commit.
- **Tài liệu chuẩn mực**: `docs/` 100% không bị sửa đổi.
- **Migrations cơ sở dữ liệu**: `V001` - `V011` 100% không bị sửa đổi; chỉ thêm migration mới `V012`.
- **Visual Prototype & Mobile**: 100% không bị sửa đổi.

---

## 18. V012 Pre-Flight Runbook & Thử nghiệm Dữ liệu Lịch sử

- **Runbook vận hành**: Đã lập tài liệu hướng dẫn tiền kiểm và xử lý dữ liệu trùng lặp tại:
  `reports/runbooks/V012_ACTIVE_TASK_ASSIGNMENT_UNIQUENESS.md`
- **Kết quả thử nghiệm thực tế trên PostgreSQL**:
  - Kịch bản dữ liệu trùng lặp active (`is_active = TRUE`): Migration V012 dừng lại ngay lập tức và an toàn với lỗi `23505` (`duplicate key value violates unique constraint "uk_task_assignments_active"`), rollback toàn bộ giao dịch, bảo toàn nguyên vẹn 100% dữ liệu.
  - Kịch bản dữ liệu hợp lệ: Migration V012 hoàn tất thành công trong 0.021s, index partial hoạt động chuẩn xác, chặn trùng lặp active mới và cho phép tái phân công sau khi inactive.

---

## 19. Đánh giá Cấu hình TaskFlywayConfiguration

- **Cơ chế**: Sử dụng `FlywayConfigurationCustomizer` kiểm tra `conn.getMetaData().getDatabaseProductName()`.
  - Trên H2 database: đặt `target = V011` để tránh lỗi cú pháp `WHERE` partial index.
  - Trên PostgreSQL (dev, staging, testcontainers, prod): không can thiệp, di trú đầy đủ đến `V012`.
- **Kiểm chứng thực tế**:
  - H2 test (`BackendApplicationTests`): PASS trên cả Java 27 và Java 21.
  - PostgreSQL dev container (`worksphere-dev-pg`): Migrate thành công lên V012.
  - PostgreSQL testcontainers: Migrate thành công lên V012.
- **Kết luận**: Không gây rủi ro che giấu hoặc bỏ qua V012 trên môi trường PostgreSQL production.

---

## 20. Nợ kỹ thuật ghi nhận (Technical Debt - Low)

1. **`TASK_FLYWAY_CONFIGURATION_MODULE_LOCATION_LOW`**:
   - `TaskFlywayConfiguration` hiện đặt trong `com.worksphere.task.infrastructure`. Về mặt kiến trúc, cấu hình đa cơ sở dữ liệu này phù hợp hơn khi đặt trong module hạ tầng dùng chung (`com.worksphere.shared.infrastructure`). Sẽ chuyển vị trí trong đợt refactor sau mà không cần sửa đổi trong Phase 7.
2. **`DATA_INTEGRITY_ERROR_MAPPING_FALLBACK_LOW`**:
   - Phương thức `isTaskAssignmentUniqueViolation` có điều kiện fallback `message.contains("task_assignments")`. Trong tương lai, khuyến nghị duyệt chuỗi nguyên nhân `SQLException`, kiểm tra mã lỗi PostgreSQL `23505` và so sánh chính xác tên constraint `uk_task_assignments_active`.
3. **`TEMPORARY_PASSWORD_FLOW_GAP`**: Chưa có flow kích hoạt mật khẩu tạm (deferred).
4. **`TEAM_API_CONTRACT_GAP`**: API Team chưa xuất hiện trong Section 12 (deferred).
5. **`DASHBOARD_AGGREGATED_API_GAP`**: API Dashboard tổng hợp (deferred).
6. **`TASK_ATTACHMENT_DEFERRED_UNTIL_PHASE_08`**: Đính kèm tệp cho task chờ module File / `stored_files` ở Phase 8.
7. **`TASK_DELETE_RULE_AMBIGUITY_DEFERRED`**: Định nghĩa “Business history quan trọng” chưa đầy đủ trong canonical docs; giữ logic hiện tại xét status history, cấm thay đổi ngầm trong các phase tiếp theo.

---

## 21. Danh sách tệp sửa đổi & tạo mới trong bản vá Phase 7

### Tệp tạo mới:
1. `backend/src/main/resources/db/migration/V012__add_active_task_assignment_uniqueness.sql`
2. `backend/src/main/java/com/worksphere/task/infrastructure/TaskFlywayConfiguration.java`
3. `reports/runbooks/V012_ACTIVE_TASK_ASSIGNMENT_UNIQUENESS.md`

### Tệp sửa đổi:
1. `backend/src/main/java/com/worksphere/task/application/TaskApplicationService.java`
2. `backend/src/main/java/com/worksphere/task/application/TaskCommentApplicationService.java`
3. `backend/src/test/java/com/worksphere/task/TaskMockMvcTest.java`
4. `reports/PHASE_07_REPORT.md`
5. `reports/ENVIRONMENT_TOOL_REGISTRY.md`

---

## 22. Kết luận & Trạng thái hoàn tất

Toàn bộ các yêu cầu kiểm toán, kiểm chuẩn Java 21 trên Docker, runbook tiền kiểm V012 và bảo toàn bất biến nghiệp vụ Phase 7 đã hoàn thành đầy đủ.

**PHASE_07_OPERATIONAL_GATES_PASS_PUSHED**
