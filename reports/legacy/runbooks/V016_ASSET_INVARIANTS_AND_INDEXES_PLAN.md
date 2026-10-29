# Kế Hoạch Tiền Kiểm & Vận Hành Di Trú Dữ Liệu Flyway V016

**Mã tài liệu**: `V016_ASSET_INVARIANTS_AND_INDEXES_PLAN`
**Đối tượng áp dụng**: Kỹ sư vận hành hệ thống (DevOps / SRE / Database Administrator) và Backend Developers Phase 10
**Phạm vi áp dụng**: Mọi môi trường cơ sở dữ liệu PostgreSQL (Dev, Staging, Production) trước và trong khi áp dụng bản di trú `V016__add_asset_assignment_and_category_invariants.sql` trong Phase 10.

---

## A. Bối cảnh & Mục tiêu

Trong thiết kế hệ thống WorkSphere ([02_USER_ROLES_AND_WORKFLOWS.md](file:///D:/WorkSphere/docs/02_USER_ROLES_AND_WORKFLOWS.md) Section 7.3, [05_DATABASE_DESIGN.md](file:///D:/WorkSphere/docs/05_DATABASE_DESIGN.md) Section 10.1 & 10.3, và [06_API_CONTRACT.md](file:///D:/WorkSphere/docs/06_API_CONTRACT.md) Section 14):
1. **Bất biến phân công tài sản (Asset Assignment Invariant)**:
   - Mỗi tài sản (Asset) tại một thời điểm chỉ có tối đa **MỘT** phân công đang hoạt động (`active cardinality = 0..1`, tương ứng `status = 'ACTIVE'`).
   - Nếu chỉ dựa vào kiểm tra ở tầng Application Service, tình trạng tương tranh (race condition) giữa hai request cấp phát đồng thời có thể dẫn đến việc cùng tạo 2 bản ghi `status = 'ACTIVE'` trên cùng một `asset_id`.
   - Cơ sở dữ liệu PostgreSQL bắt buộc phải là hàng rào toàn vẹn cuối cùng thông qua Partial Unique Index:
     ```sql
     CREATE UNIQUE INDEX uk_asset_assignments_one_active
     ON asset_assignments(asset_id)
     WHERE status = 'ACTIVE';
     ```
2. **Tính duy nhất của mã loại tài sản (Category Code Invariant)**:
   - Bảng `asset_categories` được khởi tạo trong `V006` có cột `code VARCHAR(50) NOT NULL` nhưng chưa có ràng buộc duy nhất (Unique Index/Constraint).
   - Theo chuẩn quản trị, mã loại tài sản phải là duy nhất toàn cầu (kể cả với bản ghi đã soft-delete) để bảo đảm tính toàn vẹn của audit trail:
     ```sql
     CREATE UNIQUE INDEX uk_asset_categories_code
     ON asset_categories(code);
     ```
3. **Chỉ mục tăng tốc truy vấn (Query Performance Indexes)**:
   - Truy vấn tài sản của tôi (`GET /assets/my-assets`) và kiểm tra phân quyền truy cập Non-Admin dựa trên `assigned_to` của bảng `asset_assignments`.
   - Cần bổ sung các chỉ mục:
     ```sql
     CREATE INDEX idx_asset_assignments_assigned_to ON asset_assignments(assigned_to);
     CREATE INDEX idx_asset_assignments_asset_id ON asset_assignments(asset_id);
     ```

---

## B. Đánh giá rủi ro & Cơ chế an toàn (Fail-Safe)

- **Rủi ro dừng di trú**:
  - Nếu cơ sở dữ liệu đích đã tồn tại bất kỳ `asset_id` nào có từ 2 bản ghi `status = 'ACTIVE'` trở lên, câu lệnh tạo unique index sẽ thất bại với mã lỗi PostgreSQL `23505` (`duplicate key value violates unique constraint`).
  - Nếu bảng `asset_categories` đã tồn tại dữ liệu trùng mã `code`, câu lệnh tạo unique index trên `asset_categories` sẽ thất bại với mã lỗi `23505`.
- **Cơ chế an toàn (Fail-Safe)**:
  - Bản di trú `V016` tuyệt đối **không** tự động xóa (`DELETE`), không tự động cập nhật (`UPDATE`), và không tự ý thay đổi trạng thái hoặc đổi tên mã của các bản ghi hiện hữu.
  - Khi gặp vi phạm trùng lặp, Flyway tự động rollback toàn bộ giao dịch của migration V016. Dữ liệu cơ sở dữ liệu được bảo toàn nguyên vẹn 100%.

---

## C. Truy vấn tiền kiểm chỉ đọc (Read-Only Pre-Flight Queries)

Trước khi chạy Flyway migration V016 trên môi trường staging hoặc production, DBA/DevOps **bắt buộc** thực thi các truy vấn tiền kiểm sau:

### 1. Tiền kiểm phân công hoạt động trùng lặp:
```sql
SELECT
    asset_id,
    COUNT(*) AS active_count,
    ARRAY_AGG(id ORDER BY assigned_at, id) AS assignment_ids,
    ARRAY_AGG(assigned_to ORDER BY assigned_at, id) AS assigned_users
FROM asset_assignments
WHERE status = 'ACTIVE'
GROUP BY asset_id
HAVING COUNT(*) > 1
ORDER BY active_count DESC, asset_id;
```

### 2. Tiền kiểm mã loại tài sản trùng lặp chính xác:
```sql
SELECT
    code,
    COUNT(*) AS count,
    ARRAY_AGG(id ORDER BY id) AS category_ids
FROM asset_categories
GROUP BY code
HAVING COUNT(*) > 1
ORDER BY count DESC, code;
```

### 3. Tiền kiểm mã loại tài sản trùng lặp sau chuẩn hóa (Case-Insensitive & Trim):
```sql
SELECT
    UPPER(TRIM(code)) AS normalized_code,
    COUNT(*) AS count,
    ARRAY_AGG(id ORDER BY id) AS category_ids,
    ARRAY_AGG(code ORDER BY code) AS source_codes
FROM asset_categories
GROUP BY UPPER(TRIM(code))
HAVING COUNT(*) > 1
ORDER BY count DESC, normalized_code;
```

---

## D. Điều kiện tiếp tục triển khai (Go / No-Go Decision Gate)

- **Kịch bản A (GO - Đủ điều kiện)**:
  - Cả 3 truy vấn tiền kiểm đều trả về **`0` dòng** (`0 rows`).
  - Hệ thống an toàn để áp dụng `V016__add_asset_assignment_and_category_invariants.sql`.
- **Kịch bản B (NO-GO - Dừng triển khai ngay lập tức)**:
  - Bất kỳ truy vấn nào trả về **từ `1` dòng trở lên**.
  - **Hành động bắt buộc**:
    1. Dừng ngay tiến trình deployment/migration.
    2. Xuất danh sách vi phạm gửi cho người có thẩm quyền nghiệp vụ (Business Owner / Lead).
    3. Tuyệt đối không tự ý quyết định giữ lại assignment nào hoặc đổi tên category nào.
    4. Chỉ thực hiện điều chỉnh dữ liệu bằng script có chữ ký phê duyệt của Business Owner trước khi chạy lại preflight.

---

## E. Nội dung bản di trú dự kiến (`V016`)

```sql
-- ============================================================================
-- V016: Add Asset Assignment and Category Invariants and Indexes
-- Per docs/05_DATABASE_DESIGN.md Section 10 & reports/DECISIONS.md D-046
-- ============================================================================

-- 1. Partial Unique Index: Exactly one ACTIVE assignment per asset
CREATE UNIQUE INDEX uk_asset_assignments_one_active
ON asset_assignments(asset_id)
WHERE status = 'ACTIVE';

-- 2. Unique Index: Category code uniqueness (Toàn cục vĩnh viễn)
CREATE UNIQUE INDEX uk_asset_categories_code
ON asset_categories(code);

-- 3. Query Performance Indexes
CREATE INDEX idx_asset_assignments_assigned_to
ON asset_assignments(assigned_to);

CREATE INDEX idx_asset_assignments_asset_id
ON asset_assignments(asset_id);
```

> **Lưu ý về Category Code Uniqueness**:
> - Ràng buộc duy nhất là toàn cục vĩnh viễn trên cột `code`.
> - Do Application Service chuẩn hóa tự động uppercase và trim trước khi lưu, việc tiền kiểm normalized duplicate (`UPPER(TRIM(code))`) là bắt buộc để ngăn chặn các dữ liệu cũ xung đột sau này.
> - Bản di trú `V016` tuyệt đối **không** tự động chạy lệnh UPDATE để uppercase dữ liệu cũ, bảo toàn tính bất biến lịch sử.

---

## F. Giao thức Khóa và Ngữ Nghĩa Tương Tranh (Concurrency Semantics)

1. **Khóa bản ghi phối hợp (Row Coordination Lock)**:
   - Khi cấp phát hoặc thu hồi tài sản, service bắt buộc khóa bản ghi `Asset` bằng `AssetRepository.findByIdForUpdate(assetId)` với `@Lock(LockModeType.PESSIMISTIC_WRITE)` và timeout 5000ms.
2. **Tuần tự hóa và Kiểm tra trạng thái nghiệp vụ (Serialization & Pre-checks)**:
   - Hai request cấp phát đồng thời trên cùng tài sản sẽ được tuần tự hóa bởi `PESSIMISTIC_WRITE` row lock trên `Asset`.
   - Request đến sau thấy tài sản đã chuyển khỏi `AVAILABLE` (hoặc đã có phân công đang hoạt động) sẽ bị từ chối bằng mã lỗi nghiệp vụ phù hợp:
     - `ASSET_NOT_AVAILABLE` (HTTP 400): Khi trạng thái tài sản khác `AVAILABLE`.
     - `ASSET_ALREADY_ASSIGNED` (HTTP 400): Khi phát hiện tài sản đã có active assignment theo kiểm tra nghiệp vụ.
3. **Thứ tự giao dịch (Transaction Ordering)**:
   - Luôn khóa `Asset` trước, sau đó mới truy vấn / ghi bản ghi `asset_assignments` để loại bỏ nguy cơ deadlock.
4. **Không hỗ trợ chuyển giao trực tiếp (No Direct Reassignment)**:
   - Không cho phép gọi assign đè khi tài sản đang `ASSIGNED`.
   - Quy trình bắt buộc: Thu hồi tài sản cũ qua `PUT .../return` -> Tài sản về `AVAILABLE` -> Cấp phát cho người mới qua `POST .../assignments`.
5. **Hàng rào bảo vệ CSDL sau cùng (Database Invariant Guard)**:
   - Nếu xảy ra xung đột tương tranh ở mức database khiến 2 transaction đồng thời cùng cố gắng insert bản ghi `status = 'ACTIVE'`, partial unique index `uk_asset_assignments_one_active` sẽ chặn đứng giao dịch thứ hai.
   - Exception mapping bắt lỗi PostgreSQL SQLState `23505` với tên constraint `uk_asset_assignments_one_active`, chuyển thành `ConflictException("ASSET_ASSIGNMENT_CONFLICT", ...)` với mã HTTP 409 Conflict.
6. **Nguyên tắc không HTTP 500 & Kiểm thử tương tranh**:
   - Mọi tình huống tranh chấp tài nguyên phân công đều phải trả về mã lỗi có kiểm soát (HTTP 400 hoặc HTTP 409), tuyệt đối không để lộ HTTP 500 Internal Server Error.
   - Sau mọi tương tranh, cơ sở dữ liệu luôn bảo đảm đúng duy nhất 1 phân công ở trạng thái `ACTIVE`.
   - Không ép buộc bộ kiểm thử đồng thời Phase 10 phải luôn trả về đúng 1 success (200) + 1 conflict (409) (tùy thuộc vào thời điểm lock của DB, kết quả có thể là serialized 200 + 400 hoặc 200 + 409).

---

## G. Truy vấn xác minh sau di trú (Post-Migration Verification)

Sau khi Flyway áp dụng `V016`, thực thi câu lệnh sau để xác nhận 4 chỉ mục/ràng buộc đã hiện diện và có hiệu lực đầy đủ:

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('asset_assignments', 'asset_categories')
  AND indexname IN (
    'uk_asset_assignments_one_active',
    'uk_asset_categories_code',
    'idx_asset_assignments_assigned_to',
    'idx_asset_assignments_asset_id'
  )
ORDER BY tablename, indexname;
```

**Kỳ vọng**: Trả về chính xác 4 dòng tương ứng với 4 index được khai báo trong DDL.

---

## H. Kế hoạch Khôi phục và Ghi chú Vận hành (Rollback & Operational Notes)

1. **Khôi phục thủ công khi cần khẩn cấp (Emergency Rollback DDL)**:
   - Nếu cần thu hồi các index do yêu cầu vận hành đặc biệt (chỉ thực hiện khi có phê duyệt):
     ```sql
     DROP INDEX IF EXISTS uk_asset_assignments_one_active;
     DROP INDEX IF EXISTS uk_asset_categories_code;
     DROP INDEX IF EXISTS idx_asset_assignments_assigned_to;
     DROP INDEX IF EXISTS idx_asset_assignments_asset_id;
     ```
2. **Quy tắc bất biến Flyway**:
   - Tuyệt đối không sửa đổi, không xóa các file migration đã được áp dụng trong bảng `flyway_schema_history`.
   - Mọi điều chỉnh schema trong tương lai phải được thực hiện thông qua bản migration mới với số hiệu kế tiếp.
