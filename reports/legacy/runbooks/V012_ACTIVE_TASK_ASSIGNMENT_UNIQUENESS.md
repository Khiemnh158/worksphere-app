# Runbook Tiền Kiểm & Vận Hành Di Trú Dữ Liệu Flyway V012

**Mã tài liệu**: `V012_ACTIVE_TASK_ASSIGNMENT_UNIQUENESS`
**Đối tượng áp dụng**: Kỹ sư vận hành hệ thống (DevOps / SRE / Database Administrator)
**Phạm vi áp dụng**: Mọi môi trường cơ sở dữ liệu PostgreSQL (Dev, Staging, Production) trước và trong khi áp dụng bản di trú `V012__add_active_task_assignment_uniqueness.sql`.

---

## A. Mục tiêu

Bản di trú `V012` tạo partial unique index `uk_task_assignments_active` trên cơ sở dữ liệu PostgreSQL:

```sql
CREATE UNIQUE INDEX uk_task_assignments_active
ON task_assignments(task_id, assignee_id)
WHERE is_active = TRUE;
```

**Mục tiêu kỹ thuật**:
- Đảm bảo tính toàn vẹn dữ liệu ở mức database engine.
- Chỉ cho phép tối đa **một** bản ghi phân công đang hoạt động (`is_active = TRUE`) cho mỗi cặp `(task_id, assignee_id)`.
- Vẫn cho phép lưu trữ không giới hạn các bản ghi phân công trong quá khứ đã hết hiệu lực (`is_active = FALSE`) phục vụ truy vết lịch sử (audit trail).

---

## B. Đánh giá rủi ro & Cơ chế an toàn (Fail-Safe)

- **Rủi ro dừng di trú**: Nếu cơ sở dữ liệu đích đã tồn tại bất kỳ cặp `(task_id, assignee_id)` nào có từ hai bản ghi `is_active = TRUE` trở lên, câu lệnh tạo unique index của PostgreSQL sẽ thất bại ngay lập tức với mã lỗi `23505` (`duplicate key value violates unique constraint`).
- **Cơ chế an toàn (Fail-Safe)**:
  - Bản di trú `V012` hoàn toàn **không** chứa lệnh tự động xóa (`DELETE`), không tự động cập nhật (`UPDATE`), và không tự ý thay đổi dữ liệu phân công hiện hữu.
  - Khi gặp lỗi trùng lặp dữ liệu, Flyway sẽ tự động rollback toàn bộ giao dịch của migration V012. Cơ sở dữ liệu và toàn bộ dữ liệu phân công hiện tại được bảo toàn 100%, không bị mất mát hay suy giảm tính nhất quán.

---

## C. Truy vấn tiền kiểm chỉ đọc (Read-Only Pre-Flight Query)

Trước khi kích hoạt pipeline triển khai hoặc chạy lệnh Flyway migrate, DBA/DevOps **bắt buộc** thực thi truy vấn tiền kiểm chỉ đọc sau trên database PostgreSQL đích:

```sql
SELECT
    task_id,
    assignee_id,
    COUNT(*) AS active_count,
    ARRAY_AGG(id ORDER BY assigned_at, id) AS assignment_ids
FROM task_assignments
WHERE is_active = TRUE
GROUP BY task_id, assignee_id
HAVING COUNT(*) > 1
ORDER BY active_count DESC, task_id, assignee_id;
```

---

## D. Điều kiện tiếp tục triển khai (Go / No-Go Decision Gate)

- **Kịch bản A (GO - Tiếp tục)**:
  - Kết quả truy vấn trả về **`0` dòng** (Empty result / `0 rows`).
  - Đủ điều kiện an toàn để thực hiện migration V012 theo quy trình tại Mục H.
- **Kịch bản B (NO-GO - Dừng triển khai ngay lập tức)**:
  - Kết quả truy vấn trả về **từ `1` dòng trở lên**.
  - **DỪNG DEPLOYMENT NGAY LẬP TỨC**.
  - **TUYỆT ĐỐI KHÔNG** tự ý chạy script xóa dữ liệu tự động hoặc tự ý đổi trạng thái `is_active = FALSE`.
  - Báo cáo sự cố dữ liệu cho Người có thẩm quyền nghiệp vụ (Product Owner / Project Manager / Lead) để xác định chính xác bản ghi phân công nào cần giữ lại.

---

## E. Thu thập bằng chứng dữ liệu (Evidence Collection)

Trước khi bất kỳ thao tác xử lý dữ liệu nào được phê duyệt diễn ra, người vận hành phải xuất toàn bộ bản ghi vi phạm ra tệp phục vụ lưu trữ kiểm toán:

```sql
COPY (
    SELECT *
    FROM task_assignments
    WHERE is_active = TRUE
      AND (task_id, assignee_id) IN (
          SELECT task_id, assignee_id
          FROM task_assignments
          WHERE is_active = TRUE
          GROUP BY task_id, assignee_id
          HAVING COUNT(*) > 1
      )
    ORDER BY task_id, assignee_id, assigned_at, id
) TO STDOUT WITH CSV HEADER;
```

*(Lưu ý: Không lưu trữ tệp xuất dữ liệu chứa thông tin nhạy cảm ở các thư mục công khai hoặc thư mục mã nguồn git).*

---

## F. Quy trình xử lý dữ liệu trùng lặp (Deduplication Remediation Workflow)

1. **Nguyên tắc bất biến**:
   - Không cung cấp và không sử dụng lệnh `DELETE` tự động.
   - Không tự phán đoán hoặc lựa chọn bản ghi để giữ lại khi chưa có quyết định bằng văn bản từ người có thẩm quyền.
2. **Yêu cầu tuân thủ trước khi can thiệp**:
   - Phải có bản sao lưu (Database Backup / Snapshot) được xác thực trước khi can thiệp.
   - Phải mở Ticket / Change Request được duyệt bởi cấp quản lý tương ứng.
   - Mọi câu lệnh cập nhật bắt buộc thực thi trong khối giao dịch (`BEGIN ... COMMIT`).
   - Ghi nhận thống kê số lượng dòng bị tác động trước và sau khi thực thi.
3. **Quy chuẩn kỹ thuật khi xử lý bản ghi dư thừa**:
   - Đối với các bản ghi phân công trùng lặp được chỉ định ngừng hiệu lực:
     - Giữ nguyên bản ghi trong bảng `task_assignments` để bảo toàn lịch sử.
     - Cập nhật `is_active = FALSE`.
     - Cập nhật thời điểm gỡ phân công: `unassigned_at = NOW()`.
   - Mẫu cấu trúc giao dịch xử lý có kiểm soát:
     ```sql
     BEGIN;

     -- Khử trùng lặp có chủ đích theo danh sách ID đã được phê duyệt trong Change Request
     UPDATE task_assignments
     SET is_active = FALSE,
         unassigned_at = NOW()
     WHERE id IN ('<assignment_id_1>', '<assignment_id_2>')
       AND is_active = TRUE;

     -- Kiểm tra số dòng cập nhật khớp chính xác với phê duyệt trước khi commit
     COMMIT;
     ```

---

## G. Xác minh sau xử lý (Post-Remediation Verification)

Sau khi xử lý, thực thi lại truy vấn tiền kiểm tại Mục C:

```sql
SELECT
    task_id,
    assignee_id,
    COUNT(*) AS active_count,
    ARRAY_AGG(id ORDER BY assigned_at, id) AS assignment_ids
FROM task_assignments
WHERE is_active = TRUE
GROUP BY task_id, assignee_id
HAVING COUNT(*) > 1
ORDER BY active_count DESC, task_id, assignee_id;
```

**Điều kiện bắt buộc**: Kết quả trả về phải là **`0` dòng**. Nếu vẫn còn dữ liệu, không được chuyển sang bước tiếp theo.

---

## H. Thực thi Migration V012

Khi điều kiện tiền kiểm đạt 0 dòng trùng lặp, tiến hành áp dụng migration:

1. **Chạy di trú**:
   - Kích hoạt qua lệnh Flyway migrate của ứng dụng hoặc CI/CD pipeline:
     ```bash
     ./mvnw flyway:migrate
     ```
2. **Kiểm tra tính toàn vẹn**:
   - Chạy lệnh kiểm tra checksum:
     ```bash
     ./mvnw flyway:validate
     ```
3. **Xác nhận index trong PostgreSQL catalog**:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE schemaname = 'public'
     AND tablename = 'task_assignments'
     AND indexname = 'uk_task_assignments_active';
   ```
   **Kết quả kỳ vọng**:
   `indexname`: `uk_task_assignments_active`
   `indexdef`: `CREATE UNIQUE INDEX uk_task_assignments_active ON public.task_assignments USING btree (task_id, assignee_id) WHERE (is_active = true)`

---

## I. Kiểm tra nghiệp vụ sau Migration (Smoke Validation)

Thực hiện kiểm tra nhanh hành vi của constraint trên cơ sở dữ liệu:
1. **Chặn trùng lặp active**: Thử tạo 2 bản ghi active cho cùng một task và người dùng -> Database từ chối bản ghi thứ 2 với mã lỗi `23505`.
2. **Hỗ trợ tái phân công (Reassign)**: Đối với người dùng đã bị gỡ phân công (`is_active = FALSE`), cho phép phân công lại thành công với bản ghi mới có `is_active = TRUE`.
3. **Không mất mát dữ liệu**: Số lượng bản ghi trong `task_assignments` trước và sau di trú không thay đổi.
4. **Bảng lịch sử Flyway**: Bảng `flyway_schema_history` ghi nhận bản ghi version `012` với trạng thái `success = TRUE`.

---

## J. Quy trình Rollback & Ứng phó sự cố (Rollback Strategy)

1. **Trong trường hợp deployment thất bại do phát hiện dữ liệu trùng**:
   - Giao dịch Flyway V012 tự động rollback. Bảng `flyway_schema_history` chưa ghi nhận version 012 ở trạng thái thành công.
   - Database vẫn duy trì hoạt động bình thường ở phiên bản `V011`.
   - Thực hiện quy trình xử lý dữ liệu tại Mục F, sau đó chạy lại migrate.
2. **Trong trường hợp cần rollback sau khi V012 đã apply thành công**:
   - **Cấm tuyệt đối**: Không tự ý chạy lệnh `DROP INDEX uk_task_assignments_active;` trực tiếp trên production nếu chưa có quy trình Change Management và phê duyệt chính thức.
   - Nếu thực sự cần gỡ bỏ constraint do yêu cầu khẩn cấp, thao tác phải được thực hiện thông qua migration kế tiếp hoặc script có kiểm soát trong cửa sổ bảo trì (maintenance window).
