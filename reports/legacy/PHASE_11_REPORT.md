# Báo Cáo Hoàn Thành Phase 11: Notification và Personal Dashboard

## 1. Thông Tin Chung & Checkpoint
- **Repository**: `D:\WorkSphere`
- **Initial Checkpoint**: `c4bd8362c040d968a087898322780b0495fd6ff4` (`docs(design): harden phase 11 event and query policies`)
- **Hardening Checkpoint**: `766d747ef4a429b3be5f7caccefca332fe304cbb` (`feat(notification): implement notification and personal dashboard`)
- **Phạm vi triển khai**: Backend Java 21 / Spring Boot Modular Monolith.
- **Quyết định kiến trúc & canonical nền tảng**: D-049 (Notification Idempotency & Transaction Safety) và D-050 (Event Matrix, Recipient Resolution & Dashboard Policies).

## 2. Di Trú Cơ Sở Dữ Liệu V017
- **Tập tin**: `backend/src/main/resources/db/migration/V017__add_notification_idempotency_and_query_indexes.sql`
- **Các bước thực thi**:
  1. Thêm cột nullable: `ALTER TABLE notifications ADD COLUMN event_key VARCHAR(255);`
  2. Controlled deterministic backfill: `UPDATE notifications SET event_key = 'LEGACY_MIGRATION:' || id::text WHERE event_key IS NULL;`
  3. Validate no null qua PL/pgSQL block (báo lỗi nếu còn bất kỳ bản ghi nào null).
  4. Đổi sang NOT NULL: `ALTER TABLE notifications ALTER COLUMN event_key SET NOT NULL;`
  5. Tạo unique constraint phục vụ idempotency: `CREATE UNIQUE INDEX uk_notifications_recipient_event ON notifications(recipient_id, event_key);`
  6. Tạo composite query index: `CREATE INDEX idx_notifications_recipient_created_at ON notifications(recipient_id, created_at DESC);`
  7. Giữ nguyên 3 chỉ mục sẵn có: `idx_notifications_recipient_id`, `idx_notifications_recipient_read`, `idx_notifications_created_at`.
- **Preflight & Kiểm thử**: V017 migration test đã kiểm chứng việc chạy sạch từ V001 đến V017, validate thành công, backfill các hàng legacy đúng format `LEGACY_MIGRATION:{id}`, bảo toàn 100% các cột nghiệp vụ cũ (title, message, reference fields, read status, timestamps), không có collision, chống trùng lặp theo `(recipient_id, event_key)` với mã lỗi Postgres `23505`, cho phép các recipient khác nhau có cùng `event_key`, và bảo toàn rollback transactional DDL/DML khi gặp lỗi preflight trên môi trường PostgreSQL Testcontainers.

## 3. Notification Domain & Idempotency
- **Domain Entities & Enums**:
  - `Notification`: Mapping chính xác bảng `notifications` (`id`, `recipientId`, `type`, `title`, `message`, `referenceType`, `referenceId`, `isRead`, `readAt`, `eventKey`, `createdAt`). Thực thể bất biến ngoài `read`/`readAt`.
  - `NotificationPreference`: Mapping bảng `notification_preferences` (`id`, `userId`, `notificationType`, `inAppEnabled`, `pushEnabled`, `emailEnabled`, `updatedAt`).
  - `NotificationType`: 8 giá trị canonical (`PROJECT_MEMBER_ADDED`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `TASK_DUE_SOON`, `TASK_OVERDUE`, `SERVICE_REQUEST_ASSIGNED`, `SERVICE_REQUEST_UPDATED`, `COMMENT_ADDED`).
  - `NotificationReferenceType`: `PROJECT`, `TASK`, `SERVICE_REQUEST`, `ASSET`.
- **Native Idempotent Insertion**:
  - Sử dụng native SQL với mệnh đề `ON CONFLICT (recipient_id, event_key) DO NOTHING`.
  - Phương thức `insertIdempotent` trả về số dòng bị ảnh hưởng: `1` là tạo mới thành công; `0` là trùng lặp đã tồn tại (idempotent success).
  - Không ném exception trùng lặp, không kích hoạt rollback-only cho transaction nguồn.
  - Các lỗi database thực sự khác không bị nuốt và sẽ rollback transaction nguồn đúng theo quy tắc D-049.

## 4. Notification Preferences & Logic Bỏ Qua
- `GET /api/v1/notification-preferences`:
  - Trả về danh sách đầy đủ 8 loại notification canonical.
  - Các dòng chưa được cấu hình sẽ dùng giá trị mặc định: `inAppEnabled=true`, `pushEnabled=true`, `emailEnabled=false`.
- `PUT /api/v1/notification-preferences`:
  - Upsert theo từng cặp `(userId, notificationType)`.
  - Kiểm tra duplicate type trong payload -> `NOTIFICATION_PREFERENCE_DUPLICATE_TYPE`, mã HTTP 400.
  - Kiểm tra invalid type -> `NOTIFICATION_TYPE_INVALID`, mã HTTP 400.
  - User chỉ được phép chỉnh sửa preference của chính mình.
- **Hành vi khi `inAppEnabled=false`**:
  - Không chèn dòng thông báo vào `notifications`.
  - Không lưu pending event, không backfill sau khi bật lại.
  - Thao tác nghiệp vụ nguồn vẫn thành công trọn vẹn.
  - Các cờ `pushEnabled` và `emailEnabled` chỉ lưu cấu hình, không gây side-effect trong Phase 11.

## 5. Tích Hợp Nguồn Sự Kiện (Event Integrations)
Mọi tích hợp đều tuân thủ loại trừ tác nhân (actor exclusion) và deduplication danh sách người nhận:
1. **Project Member Added**:
   - Event Key: `PROJECT_MEMBER_ADDED:{projectId}:{membershipId}`
   - Recipient: `memberId` (loại trừ actor).
2. **Task Assigned**:
   - Event Key: `TASK_ASSIGNED:{taskId}:{assignmentId}`
   - Recipient: Active assignee mới (loại trừ actor).
3. **Task Status Changed**:
   - Event Key: `TASK_STATUS_CHANGED:{taskId}:{statusHistoryId}` (sử dụng immutable `TaskStatusHistory.id`).
   - Recipients: Active assignee, task creator/reporter, và các active project members có ProjectRole `PROJECT_MANAGER` hoặc `TEAM_LEADER` thuộc cùng dự án (loại trừ actor).
4. **Task Public Comment**:
   - Event Key: `COMMENT_ADDED:TASK:{commentId}`
   - Recipients: Active assignee, task reporter, project PM và TL (loại trừ actor).
5. **Service Request Assigned**:
   - Event Key: `SERVICE_REQUEST_UPDATED:{requestId}:ASSIGNED:{assignmentId}`
   - Recipient: Active assignee mới (loại trừ actor).
6. **Service Request Status Changed**:
   - Event Key: `SERVICE_REQUEST_UPDATED:{requestId}:{statusHistoryId}`
   - Recipient: Requester (loại trừ actor).
7. **Service Request Public Comment**:
   - Event Key: `COMMENT_ADDED:SERVICE_REQUEST:{commentId}`
   - Recipients: Requester, active assignee, admin (loại trừ actor). Ghi chú nội bộ (internal note) không thông báo cho requester.
8. **Asset Assigned**:
   - Event Key: `ASSET_ASSIGNED:{assetId}:{assignmentId}`
   - Recipient: `assignedTo` user (loại trừ actor).

## 6. Deadline Scanner & Keyset Pagination
- **Cấu hình**:
  - `worksphere.notification.scheduling.enabled` (mặc định `true` cho production, `false` cho test profile).
  - `worksphere.notification.task-deadline-scan-delay: PT15M`.
  - `worksphere.notification.task-deadline-batch-size: 100`.
- **Thực thi an toàn & Chống Starvation**:
  - Tích hợp PostgreSQL advisory transaction lock: `pg_try_advisory_xact_lock(1101, 1)`. Nếu false, bỏ qua chu kỳ mà không báo lỗi và không block phiên làm việc khác.
  - Toàn bộ chu kỳ quét được bao bọc trong một transaction duy nhất bao trùm từ lúc lấy lock, duyệt keyset pages, chèn thông báo và commit.
  - Phân trang Keyset pagination (`dueDate ASC, id ASC`) với cursor `(lastDueDate, lastTaskId)` giúp duyệt tuần tự toàn bộ danh sách task hợp lệ kể cả khi tổng số task vượt quá `batchSize`, triệt tiêu hoàn toàn nguy cơ starvation (`DEADLINE_SCANNER_BATCH_STARVATION_RISK`).
  - Chỉ quét các task chưa hoàn thành (loại trừ `COMPLETED`, `CANCELLED` và task bị xóa).
  - Tự động sinh `TASK_DUE_SOON:{taskId}:{dueAtEpochMilli}` (theo chuẩn canonical: `now <= dueDate < now + 72 hours` với strict upper comparison `dueDate.isBefore(threshold)`) và `TASK_OVERDUE:{taskId}:{dueAtEpochMilli}` (`dueDate < now`).
  - Injected `Clock` cho phép kiểm thử thời gian deterministic và dùng chung giá trị `now` thống nhất trong cả chu kỳ.

## 7. Personal Dashboard API
- **Endpoint**: `GET /api/v1/dashboard/me` (Chỉ triển khai endpoint này; không tạo stub hay triển khai Project Dashboard `GET /projects/{projectId}/dashboard`).
- **Phạm vi truy vấn & Aggregation SQL**:
  - Sử dụng native SQL projections trực tiếp trong PostgreSQL, không load entity đầy đủ.
  - `tasks`: Tổng hợp trạng thái theo assignment đang hoạt động của principal (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `overdue`, `dueSoon`).
  - `serviceRequests`: Tổng hợp theo requester HOẶC active assignee (`OPEN`, `IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`), sử dụng `COUNT(DISTINCT sr.id)` chống đếm trùng khi vừa là requester vừa là assignee.
  - `projects`: Tổng hợp theo membership đang hoạt động (`ACTIVE`, `ON_HOLD`). Kể cả user có role ADMIN toàn cục vẫn chỉ thấy dự án mình tham gia khi gọi endpoint cá nhân `/dashboard/me`.
  - `upcomingTasks`: Top 5 task sắp tới hạn (`dueSoon`), sắp xếp `due_date ASC, id ASC`.
  - `recentNotifications`: Top 5 thông báo mới nhất của người dùng, sắp xếp `created_at DESC, id DESC`.

## 8. Kết Quả Kiểm Thử & Xác Minh
- **Kiểm thử Phase 11 (38 tests PASS)**:
  - `V017MigrationTest`: 5 tests PASS (clean migrate, validate, backfill, unique constraint 23505, data preservation, preflight failure transactional DDL/DML rollback).
  - `NotificationMockMvcTest`: 6 tests PASS (own notifications, unread count, mark read idempotent, mark all read, permissions).
  - `NotificationPreferenceMockMvcTest`: 5 tests PASS (default preferences, upsert, validation duplicate/invalid type).
  - `NotificationIdempotencyAndScannerTest`: 7 tests PASS (idempotent duplicate ignore, preference disabling, scanner overdue/duesoon, keyset pagination starvation prevention with 25 tasks, advisory lock contention skip, strict due-soon boundary checks).
  - `SourceNotificationIntegrationTest`: 10 tests PASS (project member, task assign/status/comment, service request assign/comment, asset assign, actor exclusion, public SR comment actor scenarios, source transaction rollback on Task status change failure, source transaction rollback on Asset assignment failure, duplicate idempotent non-rollback).
  - `DashboardMockMvcTest`: 5 tests PASS (task summary, upcoming tasks top 5, service request distinct, project membership scoping, notifications top 5).
- **Hồi quy toàn bộ hệ thống**:
  - Tổng số tests: **298 / 298 PASS** (exit code 0, BUILD SUCCESS).
  - Checkstyle: **0 violations** (`mvnw checkstyle:check`).
  - Migrations: V001 đến V017 hợp lệ hoàn toàn. Không có V018.

## 9. Các Kênh & Chức Năng Deferred
Tuân thủ nghiêm ngặt phạm vi Phase 11, các chức năng sau được bảo toàn hoãn lại:
- `NOTIFICATION_RETENTION_CLEANUP_DEFERRED`: Dọn dẹp thông báo cũ theo thời gian.
- `PROJECT_DASHBOARD_PROJECTION_DEFERRED`: Dashboard theo dự án (`GET /projects/{projectId}/dashboard`).
- `SERVICE_REQUEST_INTERNAL_NOTE_NOTIFICATION_DEFERRED`: Thông báo cho note nội bộ.
- Push Notification (FCM/APNs), Email delivery, WebSocket/SSE.
- Message Broker (Kafka/RabbitMQ) và Redis Cache.
- Mobile client (React Native).
- Phase 12 (Reporting, Analytics, Export).
