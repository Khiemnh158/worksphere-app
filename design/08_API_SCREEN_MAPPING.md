# 08. API - SCREEN MAPPING - WORKSPHERE MOBILE

Tài liệu này lập bảng ánh xạ toàn diện giữa các màn hình ứng dụng di động WorkSphere, thao tác người dùng, đặc tả API Contract ([docs/06_API_CONTRACT.md](file:///d:/WorkSphere/docs/06_API_CONTRACT.md)) và tình trạng thực tế của Backend.

---

## Quy chuẩn Phân loại Trạng thái Backend (5 Taxonomy Classes)

Mọi ánh xạ API - Màn hình được chuẩn hóa theo 5 trạng thái quy định nghiêm ngặt:
1. `IMPLEMENTED_AND_TESTED`: Controller, Application Service, Domain đã hoàn thành và có test tự động (MockMvc / Integration Test) PASS 100%.
2. `IMPLEMENTED_NOT_FULLY_TESTED`: Controller đã hiện diện trong mã nguồn backend, nhưng chưa có bài kiểm thử MockMvc endpoint độc lập.
3. `CONTRACT_ONLY_NOT_IMPLEMENTED`: Endpoint đã được đặc tả chính thức trong [docs/06_API_CONTRACT.md](file:///d:/WorkSphere/docs/06_API_CONTRACT.md), nhưng backend chưa triển khai (thuộc các giai đoạn roadmap tương lai Phase 7 - 10).
4. `DESIGN_ONLY_NO_CONTRACT`: Thao tác thiết kế thuần túy phía client, chưa có trong hợp đồng API.
5. `BLOCKED_BY_GAP`: Thao tác bị nghẽn bởi khoảng trống kiến trúc hoặc canonical gap đã được ghi nhận (ví dụ `DASHBOARD_AGGREGATED_API_GAP`).

---

## Bảng Ánh xạ API - Màn hình (32 Thao tác Người dùng)

| Mã Màn hình | Thao tác Người dùng | Method | Endpoint URL | Quyền hạn (Permission) | Request DTO | Response DTO | HTTP Code Thành công | Mã lỗi Phổ biến | Trạng thái Backend |
|---|---|---|---|---|---|---|---|---|---|
| `SCR-AUTH-01` | Phục hồi phiên khi mở app | `POST` | `/api/v1/auth/refresh` | Không | `RefreshTokenRequest` | `RefreshResponse` | `200 OK` | `INVALID_TOKEN` | `IMPLEMENTED_AND_TESTED` |
| `SCR-AUTH-02` | Bấm Đăng nhập | `POST` | `/api/v1/auth/login` | Không | `LoginRequest` | `AuthResponse` | `200 OK` | `INVALID_CREDENTIALS`, `USER_LOCKED` | `IMPLEMENTED_AND_TESTED` |
| `SCR-AUTH-03` | Yêu cầu quên mật khẩu | `POST` | `/api/v1/auth/forgot-password` | Không | `ForgotPasswordRequest` | `ApiResponse<Void>` | `200 OK` | `VALIDATION_ERROR` | `IMPLEMENTED_AND_TESTED` |
| `SCR-AUTH-04` | Đặt lại mật khẩu mới | `POST` | `/api/v1/auth/reset-password` | Không | `ResetPasswordRequest` | `ApiResponse<Void>` | `200 OK` | `INVALID_TOKEN` | `IMPLEMENTED_AND_TESTED` |
| `SCR-MAIN-01` | Mở Dashboard cá nhân tổng quan | `GET` | `/api/v1/dashboard/me` | Đã đăng nhập | Không | `DashboardMeResponse` | `200 OK` | `INTERNAL_ERROR` | `BLOCKED_BY_GAP` (`DASHBOARD_AGGREGATED_API_GAP`) |
| `SCR-PRJ-01` | Tải danh sách dự án | `GET` | `/api/v1/projects` | `PROJECT_READ` | Query params (page, size, search, filter) | `PagedData<ProjectSummaryResponse>` | `200 OK` | `FORBIDDEN` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-02` | Xem chi tiết dự án | `GET` | `/api/v1/projects/{projectId}` | `PROJECT_READ` | Path param `projectId` | `ProjectDetailResponse` | `200 OK` | `PROJECT_NOT_FOUND` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-03` | Tạo dự án mới | `POST` | `/api/v1/projects` | `PROJECT_CREATE` | `CreateProjectRequest` | `ProjectDetailResponse` | `201 Created` | `PROJECT_CODE_ALREADY_EXISTS`, `PROJECT_DATE_RANGE_INVALID` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-04` | Cập nhật dự án | `PUT` | `/api/v1/projects/{projectId}` | `PROJECT_UPDATE` | `UpdateProjectRequest` | `ProjectDetailResponse` | `200 OK` | `OPTIMISTIC_LOCK_CONFLICT`, `PROJECT_NOT_FOUND` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-05` | Đổi trạng thái dự án | `PUT` | `/api/v1/projects/{projectId}/status` | `PROJECT_UPDATE` | `ChangeProjectStatusRequest` | `ProjectDetailResponse` | `200 OK` | `PROJECT_STATUS_TRANSITION_INVALID`, `OPTIMISTIC_LOCK_CONFLICT` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-06` | Xem danh sách thành viên | `GET` | `/api/v1/projects/{projectId}/members` | `PROJECT_READ` | Query params (page, size, role, active) | `PagedData<ProjectMemberResponse>` | `200 OK` | `PROJECT_NOT_FOUND` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-07` | Thêm thành viên vào dự án | `POST` | `/api/v1/projects/{projectId}/members` | `PROJECT_MEMBER_MANAGE` | `AddProjectMemberRequest` | `ProjectMemberResponse` | `201 Created` | `PROJECT_MEMBER_ALREADY_EXISTS`, `USER_NOT_ACTIVE` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-07` | Đổi vai trò thành viên | `PUT` | `/api/v1/projects/{projectId}/members/{memberId}` | `PROJECT_MEMBER_MANAGE` | `UpdateProjectMemberRoleRequest` | `ProjectMemberResponse` | `200 OK` | `PROJECT_MANAGER_REQUIRED`, `MEMBER_NOT_FOUND` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-07` | Xóa thành viên khỏi dự án | `DELETE`| `/api/v1/projects/{projectId}/members/{memberId}` | `PROJECT_MEMBER_MANAGE` | Path params | `ApiResponse<Void>` | `200 OK` | `PROJECT_MANAGER_REQUIRED` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-08` | Xem danh sách mốc tiến độ | `GET` | `/api/v1/projects/{projectId}/milestones` | `PROJECT_READ` | Path param `projectId` | `List<MilestoneResponse>` | `200 OK` | `PROJECT_NOT_FOUND` | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-09` | Tạo mốc tiến độ mới | `POST` | `/api/v1/projects/{projectId}/milestones` | `PROJECT_UPDATE` | `CreateMilestoneRequest` | `MilestoneResponse` | `201 Created` | `PROJECT_NOT_ACTIVE` | `IMPLEMENTED_AND_TESTED` |
| `SCR-TSK-01` | Xem danh sách công việc | `GET` | `/api/v1/tasks` | `TASK_READ` | Query params | `PagedData<TaskSummaryResponse>` | `200 OK` | `FORBIDDEN` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-TSK-02` | Xem chi tiết công việc | `GET` | `/api/v1/tasks/{taskId}` | `TASK_READ` | Path param `taskId` | `TaskDetailResponse` | `200 OK` | `TASK_NOT_FOUND` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-TSK-03` | Tạo công việc mới | `POST` | `/api/v1/tasks` | `TASK_CREATE` | `CreateTaskRequest` | `TaskDetailResponse` | `201 Created` | `PROJECT_NOT_ACTIVE` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-TSK-04` | Cập nhật công việc | `PUT` | `/api/v1/tasks/{taskId}` | `TASK_UPDATE` | `UpdateTaskRequest` | `TaskDetailResponse` | `200 OK` | `OPTIMISTIC_LOCK_CONFLICT` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-01` | Danh sách yêu cầu dịch vụ | `GET` | `/api/v1/service-requests` | `SERVICE_REQUEST_READ` | Query params | `PagedData<ServiceRequestSummary>` | `200 OK` | `FORBIDDEN` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-02` | Chi tiết yêu cầu dịch vụ | `GET` | `/api/v1/service-requests/{requestId}` | `SERVICE_REQUEST_READ` | Path param `requestId` | `ServiceRequestDetailResponse` | `200 OK` | `SERVICE_REQUEST_NOT_FOUND` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-03` | Từ chối kết quả xử lý | `POST` | `/api/v1/service-requests/{requestId}/reject-resolution` | `SERVICE_REQUEST_READ` | `RejectResolutionRequest` | `ServiceRequestDetailResponse` | `200 OK` | `SERVICE_NOT_RESOLVED`, `OPTIMISTIC_LOCK_CONFLICT` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-04` | Tạo yêu cầu hỗ trợ mới | `POST` | `/api/v1/service-requests` | `SERVICE_REQUEST_CREATE`| `CreateServiceRequest` | `ServiceRequestDetailResponse` | `201 Created` | `VALIDATION_ERROR` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-AST-01` | Xem danh sách tài sản | `GET` | `/api/v1/assets` | `ASSET_READ` | Query params | `PagedData<AssetSummaryResponse>` | `200 OK` | `FORBIDDEN` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-AST-02` | Xem chi tiết tài sản | `GET` | `/api/v1/assets/{assetId}` | `ASSET_READ` | Path param `assetId` | `AssetDetailResponse` | `200 OK` | `ASSET_NOT_FOUND` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-NOT-01` | Danh sách thông báo | `GET` | `/api/v1/notifications` | Đã đăng nhập | Query params | `PagedData<NotificationResponse>` | `200 OK` | `FORBIDDEN` | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-ACC-01` | Lấy thông tin cá nhân | `GET` | `/api/v1/me` | Đã đăng nhập | Không | `UserProfileResponse` | `200 OK` | `UNAUTHORIZED` | `IMPLEMENTED_AND_TESTED` |
| `SCR-ACC-02` | Đổi mật khẩu | `PUT` | `/api/v1/me/password` | Đã đăng nhập | `ChangePasswordRequest` | `ApiResponse<Void>` | `200 OK` | `CURRENT_PASSWORD_INCORRECT` | `IMPLEMENTED_NOT_FULLY_TESTED` |
| `SCR-ACC-04` | Đăng xuất phiên hiện tại | `POST` | `/api/v1/auth/logout` | Đã đăng nhập | `LogoutRequest` | `204 No Content` | `204 No Content` | `UNAUTHORIZED` | `IMPLEMENTED_AND_TESTED` |
| `SCR-ADM-01` | Quản trị người dùng | `GET` | `/api/v1/admin/users` | `USER_READ` / `USER_MANAGE` | Query params | `PagedData<UserSummaryResponse>` | `200 OK` | `FORBIDDEN` | `IMPLEMENTED_AND_TESTED` |
| `SCR-ADM-02` | Quản trị phòng ban | `GET` | `/api/v1/departments` | `DEPARTMENT_READ` | Không | `List<DepartmentResponse>` | `200 OK` | `FORBIDDEN` | `IMPLEMENTED_AND_TESTED` |

---

## Thống kê Tổng hợp Ánh xạ API (API Readiness Summary)

- **Tổng số thao tác / endpoint ánh xạ**: 32 thao tác.
- **`IMPLEMENTED_AND_TESTED`**: 18 thao tác (56.25%) - Sẵn sàng 100% cho tích hợp mobile ngay.
- **`IMPLEMENTED_NOT_FULLY_TESTED`**: 1 thao tác (3.125%) - `PUT /api/v1/me/password` (đã có controller, cần bổ sung test MockMvc ở backend).
- **`CONTRACT_ONLY_NOT_IMPLEMENTED`**: 12 thao tác (37.5%) - Thuộc Task, Service Request, Asset, Notification (chờ Phase 7 - 10).
- **`DESIGN_ONLY_NO_CONTRACT`**: 0 thao tác.
- **`BLOCKED_BY_GAP`**: 1 thao tác (3.125%) - `GET /api/v1/dashboard/me` (vướng `DASHBOARD_AGGREGATED_API_GAP`).
