# Kế Hoạch Tiền Kiểm & Vận Hành Di Trú Dữ Liệu Flyway V013

**Mã tài liệu**: `V013_SERVICE_ASSIGNMENT_UNIQUENESS_PLAN`
**Đối tượng áp dụng**: Kỹ sư vận hành hệ thống (DevOps / SRE / Database Administrator) và Backend Developers Phase 9
**Phạm vi áp dụng**: Mọi môi trường cơ sở dữ liệu PostgreSQL (Dev, Staging, Production) trước và trong khi áp dụng bản di trú `V013__add_service_request_assignment_invariants.sql` trong Phase 9.

---

## A. Bối cảnh & Mục tiêu

Trong thiết kế hệ thống WorkSphere ([02_USER_ROLES_AND_WORKFLOWS.md](file:///D:/WorkSphere/docs/02_USER_ROLES_AND_WORKFLOWS.md) Section 6.3, [05_DATABASE_DESIGN.md](file:///D:/WorkSphere/docs/05_DATABASE_DESIGN.md) Section 9.3, và [06_API_CONTRACT.md](file:///D:/WorkSphere/docs/06_API_CONTRACT.md) Section 13.4/13.6):
- Mỗi yêu cầu dịch vụ (Service Request) tại một thời điểm chỉ có tối đa **MỘT** kỹ thuật viên/người xử lý đang hoạt động (`cardinality = 0..1`).
- Nếu chỉ kiểm tra ở tầng Application Service, race condition giữa hai giao dịch đồng thời có thể dẫn đến việc cùng chèn 2 bản ghi `is_active = TRUE` vào bảng `service_assignments`.
- Để ngăn ngừa race condition, cơ sở dữ liệu PostgreSQL bắt buộc phải là hàng rào toàn vẹn cuối cùng.

Bản di trú `V013` (dự kiến triển khai trong Phase 9) sẽ tạo partial unique index:

```sql
CREATE UNIQUE INDEX uk_service_assignments_one_active
ON service_assignments(request_id)
WHERE is_active = TRUE;
```

> [!IMPORTANT]
> **Điểm khác biệt cốt lõi so với V012 (Task Assignment)**:
> - Trong Task Module, công việc cho phép nhiều người cùng thực hiện nên partial unique index là `(task_id, assignee_id) WHERE is_active = TRUE`.
> - Trong Service Request Module, mỗi yêu cầu chỉ có duy nhất 1 người xử lý tại một thời điểm. Nếu đặt index theo cặp `(request_id, assignee_id)` thì hai kỹ thuật viên khác nhau (User A và User B) vẫn có thể cùng active đồng thời trên cùng một request. Do đó, index bắt buộc phải chỉ đặt trên `request_id` với điều kiện `WHERE is_active = TRUE`.

---

## B. Đánh giá rủi ro & Cơ chế an toàn (Fail-Safe)

- **Rủi ro dừng di trú**: Nếu cơ sở dữ liệu đích đã tồn tại bất kỳ `request_id` nào có từ hai bản ghi `is_active = TRUE` trở lên, câu lệnh tạo unique index của PostgreSQL sẽ thất bại ngay lập tức với mã lỗi `23505` (`duplicate key value violates unique constraint`).
- **Cơ chế an toàn (Fail-Safe)**:
  - Bản di trú `V013` tuyệt đối **không** tự động xóa (`DELETE`), không tự động cập nhật (`UPDATE`), và không tự ý tắt (`is_active = false`) các bản ghi phân công hiện hữu.
  - Khi gặp vi phạm trùng lặp, Flyway tự động rollback toàn bộ giao dịch của migration V013. Dữ liệu cơ sở dữ liệu được bảo toàn nguyên vẹn 100%.

---

## C. Truy vấn tiền kiểm chỉ đọc (Read-Only Pre-Flight Query)

Trước khi chạy Flyway migration V013 trên môi trường staging hoặc production, DBA/DevOps **bắt buộc** thực thi truy vấn tiền kiểm sau:

```sql
SELECT
    request_id,
    COUNT(*) AS active_count,
    ARRAY_AGG(id ORDER BY assigned_at, id) AS assignment_ids,
    ARRAY_AGG(assignee_id ORDER BY assigned_at, id) AS assignee_ids
FROM service_assignments
WHERE is_active = TRUE
GROUP BY request_id
HAVING COUNT(*) > 1
ORDER BY active_count DESC, request_id;
```

---

## D. Điều kiện tiếp tục triển khai (Go / No-Go Decision Gate)

- **Kịch bản A (GO - Đủ điều kiện)**:
  - Kết quả preflight trả về **`0` dòng** (`0 rows`).
  - Hệ thống an toàn để áp dụng `V013__add_service_request_assignment_invariants.sql`.
- **Kịch bản B (NO-GO - Dừng triển khai ngay lập tức)**:
  - Kết quả preflight trả về **từ `1` dòng trở lên**.
  - **Hành động bắt buộc**:
    1. Dừng ngay tiến trình deployment/migration.
    2. Xuất danh sách `request_id`, `assignment_ids`, `assignee_ids` gửi cho người có thẩm quyền nghiệp vụ (Business Owner / Lead).
    3. Tuyệt đối không tự ý quyết định giữ lại assignee nào.
    4. Chỉ thực hiện điều chỉnh dữ liệu bằng script có chữ ký phê duyệt của Business Owner trước khi chạy lại preflight.

---

## E. Giao thức Khóa và Reassignment tại tầng Application Service

Để bảo đảm không gây xung đột với partial unique index khi chuyển giao người xử lý:

1. **Khóa bản ghi phối hợp (Coordination Row Lock)**:
   - Sử dụng `ServiceRequestRepository.findByIdForUpdate(requestId)` với `@Lock(LockModeType.PESSIMISTIC_WRITE)` và `jakarta.persistence.lock.timeout` = 5000 (hoặc native `SELECT ... FOR UPDATE`).
   - Khóa bản ghi `ServiceRequest` thay vì `service_assignments` vì bản ghi assignment có thể chưa tồn tại khi yêu cầu mới được tạo.
2. **Thứ tự giao dịch (Transaction Ordering)**:
   - Luôn khóa `ServiceRequest` trước, sau đó mới truy vấn/thao tác `service_assignments` để loại bỏ triệt để nguy cơ deadlock chéo bảng.
3. **Nguyên tắc an toàn khi giữ lock**:
   - Tuyệt đối không thực hiện thao tác File I/O, gửi email, push notification hay gọi network bên ngoài trong khi đang giữ pessimistic lock. Các tác vụ này phải được đẩy sang xử lý bất đồng bộ sau khi giao dịch đã commit.
4. **Kiểm tra quyền actor**:
   - Xác thực actor có permission `SERVICE_REQUEST_ASSIGN`.
5. **Kiểm tra idempotent**:
   - Nếu `newAssigneeId` trùng với active assignee hiện tại, trả về kết quả hiện tại mà không tạo thêm bản ghi trùng lặp.
6. **Deactivate phân công cũ**:
   - `oldAssignment.setActive(false);`
   - `oldAssignment.setUnassignedAt(serverClock.instant());`
   - Gọi `saveAndFlush(oldAssignment);` để cập nhật trạng thái xuống DB và giải phóng slot active trong partial unique index.
7. **Tạo phân công mới**:
   - Khởi tạo `ServiceAssignment` mới với `is_active = true`, `assigned_at = serverClock.instant()`, `assigned_by = principal.userId()`.
   - Lưu qua repository: `saveAndFlush(newAssignment);`.
8. **Hàng rào Database cuối cùng**:
   - Partial unique index `uk_service_assignments_one_active` bảo đảm không bao giờ có 2 active assignment đồng thời ngay cả khi có tranh chấp ngoài luồng khóa.

---

## F. Xử lý lỗi vi phạm Partial Unique Index & Khoảng trống mã lỗi

1. **Bắt và ánh xạ ngoại lệ vi phạm constraint**:
   - Khi constraint `uk_service_assignments_one_active` bị vi phạm, hệ thống phải:
     - Duyệt chuỗi nguyên nhân ngoại lệ (`SQLException` cause chain).
     - Kiểm tra SQLState bắt buộc phải là `23505` (`unique_violation`).
     - Tên constraint phải khớp chính xác `uk_service_assignments_one_active`.
     - Cấm dùng kiểm tra lỏng lẻo `message.contains("service_assignments")`.
     - Không được ánh xạ các lỗi Foreign Key (`23503`) hay Not Null (`23502`) thành lỗi xung đột phân công.
     - Toàn bộ transaction phải rollback ngay lập tức.
2. **Đề xuất thiết kế mã lỗi nghiệp vụ**:
   - **Tên mã lỗi**: `SERVICE_ASSIGNMENT_CONFLICT`
   - **HTTP Status**: `409 Conflict`
   - **Thông điệp tiếng Việt**: "Yêu cầu dịch vụ đang được phân công đồng thời hoặc trạng thái phân công đã thay đổi. Vui lòng tải lại dữ liệu và thử lại."
   - **Phân biệt ranh giới**:
     - *Khác với lỗi validation* (HTTP 400 `VALIDATION_ERROR`): Định dạng request và assigneeId hoàn toàn hợp lệ về mặt cú pháp.
     - *Khác với lỗi optimistic lock* (HTTP 409 `OPTIMISTIC_LOCK_CONFLICT`): Phát sinh do vi phạm unique index trên bảng con `service_assignments`, không phải do lệch version trên `service_requests`.
     - *Khác với lỗi assignee không tồn tại/không hoạt động*: Trả về `USER_NOT_FOUND` (404) hoặc `USER_INACTIVE` (400).
3. **Quy tắc Governance & Trạng thái hiện tại**:
   - Tài liệu [06_API_CONTRACT.md](file:///D:/WorkSphere/docs/06_API_CONTRACT.md) Section 13.6 và 20.6 đã được cập nhật chính thức với mã lỗi `SERVICE_ASSIGNMENT_CONFLICT` (HTTP 409 Conflict).
   - Theo quy tắc `AGENTS.md` và [10_AI_AGENT_INSTRUCTIONS.md](file:///D:/WorkSphere/docs/10_AI_AGENT_INSTRUCTIONS.md), mã lỗi này đã hoàn tất canonical patch và sẵn sàng sử dụng khi triển khai Phase 9.
   - **`SERVICE_ASSIGNMENT_ERROR_CODE_GAP` ĐÃ ĐƯỢC GIẢI QUYẾT**.
4. **Tách biệt phạm vi di trú (Migration Decoupling)**:
   - Bản di trú `V013__add_service_request_assignment_invariants.sql` đã được tạo, phục vụ việc tạo partial unique index `uk_service_assignments_one_active`.
   - Seed dữ liệu `role_permissions` được tách riêng sang bản di trú `V014__seed_role_permissions.sql` và đã được kiểm thử thành công trên clean database Testcontainers (74 canonical mappings).
