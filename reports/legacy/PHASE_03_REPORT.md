# BÁO CÁO GIAI ĐOẠN 3: VALIDATION MIGRATION VÀ DATABASE

## 1. Checkpoint Git
- Commit bắt đầu: `d629385` (feat(database): add initial Flyway migrations).

## 2. Thông tin Môi trường
- **Java version**: 27 (Máy host) / 21 (POM properties)
- **Maven version**: 3.9.16
- **Spring Boot version**: 4.1.1
- **PostgreSQL version**: 15.19
- **Flyway version**: 12.4.0

## 3. Kết quả Test Database
- **H2 Test Result**: H2 Test (`BackendApplicationTests`) vượt qua thành công, đảm bảo Unit Test cơ bản không bị ảnh hưởng.
- **PostgreSQL Test Result**: `MigrationIntegrationTest` dùng Testcontainers (postgres:15-alpine) đã PASS, exit code `0`.

## 4. Kết quả Migration (Flyway)
- **Migration detected**: 11
- **Migration applied**: 11
- **Danh sách V001 đến V011**:
  - V001__create_identity_tables.sql
  - V002__create_organization_tables.sql
  - V003__create_project_tables.sql
  - V004__create_file_tables.sql
  - V005__create_task_tables.sql
  - V006__create_asset_tables.sql
  - V007__create_service_request_tables.sql
  - V008__create_notification_tables.sql
  - V009__create_audit_tables.sql
  - V010__create_deferred_foreign_keys_indexes_and_constraints.sql
  - V011__seed_roles_and_permissions.sql
- **Schema version cuối**: v011

## 5. PostgreSQL Schema Validation
- **Danh sách bảng** (37 bảng sinh ra): `users`, `roles`, `permissions`, `tasks`, `projects`, `service_requests`, `assets`, `departments`... cùng các bảng mapping và audit.
- **Deferred Foreign Key**:
  - `fk_users_department` (users -> departments)
  - `fk_departments_manager` (departments -> users)
  - `fk_asset_repair_histories_request` (asset_repair_histories -> service_requests)
- **Constraint và Index validation**: Unique Constraints, Indexes được sinh chính xác trên PostgreSQL thông qua metadata schema.

## 6. Seed Data Validation
- **Seed Role**: EMPLOYEE, TEAM_LEADER, PROJECT_MANAGER, ADMIN.
- **Seed Permission**: 29 permissions tổng cộng, có chứa `SERVICE_CATEGORY_MANAGE`, `ASSET_CATEGORY_MANAGE`.

## 7. Code Quality & Security
- **Secret scan**: Không phát hiện hard-code credentials hay `.env` bị lộ. Username/Password dùng trong Integration test (Testcontainers) là an toàn.
- **Build result**: `BUILD SUCCESS`
- **Test result**: Tests run: 2, Failures: 0, Errors: 0, Skipped: 0.

## 8. Lỗi và Khắc phục
- **Lỗi đã sửa**: Thiếu Testcontainers cho PostgreSQL Integration Test. Đã cập nhật `pom.xml` và viết lại `MigrationIntegrationTest.java`.
- **Lỗi còn lại**: Không có.

## 9. Git Commit & Push
- Report này được add vào commit validation `test(database): validate migrations on PostgreSQL` và push lên `origin main`.
