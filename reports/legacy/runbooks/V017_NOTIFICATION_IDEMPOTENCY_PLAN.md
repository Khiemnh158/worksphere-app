# Kế Hoạch Tiền Kiểm & Vận Hành Di Trú Dữ Liệu Flyway V017

**Mã tài liệu**: `V017_NOTIFICATION_IDEMPOTENCY_PLAN`  
**Đối tượng áp dụng**: Kỹ sư vận hành hệ thống (DevOps / SRE / Database Administrator) và Backend Developers Phase 11  
**Phạm vi áp dụng**: Mọi môi trường cơ sở dữ liệu PostgreSQL (Dev, Staging, Production) trước và trong khi áp dụng bản di trú `V017__add_notification_idempotency_and_query_indexes.sql` trong Phase 11.  

---

## A. Bối cảnh & Mục tiêu

Trong kiến trúc hệ thống WorkSphere ([02_USER_ROLES_AND_WORKFLOWS.md](file:///D:/WorkSphere/docs/02_USER_ROLES_AND_WORKFLOWS.md) Section 8, [05_DATABASE_DESIGN.md](file:///D:/WorkSphere/docs/05_DATABASE_DESIGN.md) Section 11, và [06_API_CONTRACT.md](file:///D:/WorkSphere/docs/06_API_CONTRACT.md) Section 15):

1. **Bất biến lũy đẳng thông báo (Notification Idempotency Invariant)**:
   - Một sự kiện nghiệp vụ (Business Event) chỉ được phép tạo tối đa **MỘT** thông báo cho mỗi người nhận (Recipient).
   - Nếu client retry do timeout mạng hoặc người dùng nhấn lặp lại, thao tác tạo thông báo không được phép ghi đúp dữ liệu.
   - Cơ sở dữ liệu PostgreSQL là hàng rào toàn vẹn cuối cùng thông qua ràng buộc duy nhất trên cặp `(recipient_id, event_key)`:
     ```sql
     CREATE UNIQUE INDEX uk_notifications_recipient_event
     ON notifications(recipient_id, event_key);
     ```
2. **Chỉ mục tăng tốc phân trang sắp xếp mới nhất (Query Performance Index)**:
   - Truy vấn danh sách thông báo `GET /notifications` yêu cầu sắp xếp mặc định theo thời gian giảm dần (`sort=createdAt,desc`) và Dashboard Top 5 `recentNotifications`.
   - Để tránh Filesort khi bảng `notifications` đạt khối lượng lớn, cần bổ sung composite index:
     ```sql
     CREATE INDEX idx_notifications_recipient_created_at
     ON notifications(recipient_id, created_at DESC);
     ```
3. **Đánh giá chỉ mục hiện hữu**:
   - `idx_notifications_recipient_id`: Giữ nguyên để phục vụ các truy vấn lọc đơn giản theo recipient.
   - `idx_notifications_recipient_read`: Giữ nguyên để tăng tốc đếm `unread-count` (`WHERE recipient_id = :userId AND is_read = false`).
   - `idx_notifications_created_at`: Giữ nguyên để phục vụ truy vấn theo mốc thời gian hệ thống.
   - Tuyệt đối không drop bất kỳ index cũ nào trong MVP khi chưa đo đạc Execution Plan thực tế.

---

## B. Đánh giá rủi ro & Cơ chế Backfill dữ liệu có kiểm soát (Controlled Deterministic Data Backfill)

1. **Rủi ro khi thêm cột `NOT NULL`**:
   - Nếu bảng `notifications` đã có dữ liệu hiện hữu, câu lệnh `ALTER TABLE notifications ADD COLUMN event_key VARCHAR(255) NOT NULL;` sẽ lập tức thất bại.
   - Do đó, quy trình di trú V017 được phân loại chính xác là: **`CONTROLLED DETERMINISTIC DATA BACKFILL`** (thực hiện cập nhật dữ liệu xác định có kiểm soát, không tuyên bố là zero data modification).
2. **Quy trình di trú an toàn nhiều bước (Multi-Step Safe Migration)**:
   - **Bước 1**: Thêm cột `event_key VARCHAR(255) NULL` (cho phép NULL ban đầu).
   - **Bước 2**: Thực hiện backfill xác định (deterministic backfill) cho các dòng dữ liệu cũ nếu có:
     ```sql
     UPDATE notifications
     SET event_key = 'LEGACY_MIGRATION:' || id::text
     WHERE event_key IS NULL;
     ```
     Do `id` là khóa chính UUID duy nhất toàn cục, tiền tố `LEGACY_MIGRATION:` kết hợp với `id` bảo đảm 100% không bao giờ xảy ra va chạm (zero collision).
   - **Bước 3**: Ép buộc ràng buộc `NOT NULL`:
     ```sql
     ALTER TABLE notifications ALTER COLUMN event_key SET NOT NULL;
     ```
   - **Bước 4**: Tạo Unique Index `uk_notifications_recipient_event` trên `(recipient_id, event_key)`.
   - **Bước 5**: Tạo Composite Index `idx_notifications_recipient_created_at` trên `(recipient_id, created_at DESC)`.
3. **Cơ chế rollback an toàn của Flyway**:
   - PostgreSQL hỗ trợ transactional DDL/DML. Toàn bộ kịch bản migration V017 được bao bọc trong một transaction duy nhất. Nếu bất kỳ bước nào gặp lỗi, toàn bộ thay đổi sẽ rollback tức thì, giữ nguyên hiện trạng CSDL trước V017.

---

## C. Truy vấn tiền kiểm và hậu kiểm chỉ đọc (Read-Only Verification Queries)

Trước và trong khi chạy Flyway migration V017, DBA/DevOps bắt buộc thực thi các truy vấn sau:

### 1. Tiền kiểm số lượng bản ghi tổng thể:
```sql
SELECT COUNT(*) AS total_notifications FROM notifications;
```
*(Nếu kết quả = 0: Môi trường hoàn toàn sạch, migration áp dụng tức thời).*

### 2. Tiền kiểm số lượng bản ghi chưa có `event_key`:
```sql
SELECT COUNT(*) AS null_event_keys
FROM notifications
WHERE event_key IS NULL;
```

### 3. Hậu kiểm sau khi add cột và chạy lệnh backfill (Expected: 0):
```sql
SELECT COUNT(*) AS remaining_null_keys
FROM notifications
WHERE event_key IS NULL;
```
*(Bắt buộc kết quả = 0 trước khi thực thi `ALTER COLUMN event_key SET NOT NULL`).*

### 4. Hậu kiểm va chạm khóa trùng lặp (Collision Check - Expected: 0 rows):
```sql
SELECT
    recipient_id,
    event_key,
    COUNT(*) AS duplicate_count
FROM notifications
GROUP BY recipient_id, event_key
HAVING COUNT(*) > 1;
```
*(Bắt buộc kết quả trả về 0 dòng - không có trùng lặp trước khi tạo Unique Index).*

### 5. Tiền kiểm trạng thái chỉ mục hiện hữu:
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'notifications';
```

---

## D. Kịch bản di trú dự kiến (`V017__add_notification_idempotency_and_query_indexes.sql`)

*(Kịch bản này sẽ được tạo thành file migration chính thức trong Phase 11 implementation task)*:

```sql
-- Step 1: Add nullable event_key column
ALTER TABLE notifications
ADD COLUMN event_key VARCHAR(255);

-- Step 2: Backfill existing rows with deterministic legacy keys
UPDATE notifications
SET event_key = 'LEGACY_MIGRATION:' || id::text
WHERE event_key IS NULL;

-- Step 3: Enforce NOT NULL constraint
ALTER TABLE notifications
ALTER COLUMN event_key SET NOT NULL;

-- Step 4: Create Unique Index for Idempotency
CREATE UNIQUE INDEX uk_notifications_recipient_event
ON notifications(recipient_id, event_key);

-- Step 5: Create Composite Index for Paginated Query Performance
CREATE INDEX idx_notifications_recipient_created_at
ON notifications(recipient_id, created_at DESC);
```

---

## E. Tiêu chuẩn nghiệm thu & Quyết định triển khai (Go / No-Go)

- **GO**:
  1. Tiền kiểm xác nhận không có trùng lặp `(recipient_id, event_key)`.
  2. Bảng `notifications` áp dụng thành công V017 trong transaction của Flyway.
  3. `uk_notifications_recipient_event` và `idx_notifications_recipient_created_at` hiển thị đầy đủ trong `pg_indexes`.
  4. Test suite backend vượt qua 100%.
- **NO-GO**:
  1. Tiền kiểm phát hiện trùng lặp dữ liệu không thể backfill tự động.
  2. Giao dịch migration thất bại và rollback.
  3. Khi gặp tình trạng NO-GO, giữ nguyên hiện trạng CSDL và báo cáo ngay cho Tech Lead.
