# BÁO CÁO TRIỂN KHAI SUBPHASE 14A: DASHBOARD & PROJECTS CONTRACT FOUNDATION

- **Dự án**: WorkSphere Mobile Client
- **Phân hệ**: Mobile Dashboard + Projects Contract Foundation
- **Thời gian thực hiện**: 19/10/2026
- **Trạng thái**: `PHASE_14A_PASS_READY_FOR_INDEPENDENT_AUDIT`
- **Mã kiểm định**: `PHASE_14A_PASS_PUSHED`

---

## 1. Mục Tiêu & Phạm Vi Triển Khai

Subphase 14A thiết lập nền tảng kiểu dữ liệu, các hàm runtime type guard, bộ chuyển đổi API (transport adapters), cơ chế tuần tự hóa tham số truy vấn (query serializer), ánh xạ lỗi an toàn (presentation-safe error mapper) và khai báo route navigation types cho phân hệ Mobile Dashboard & Projects.

### Phạm Vi Tuân Thủ Tuyệt Đối:
- **Không can thiệp giao diện người dùng**: Giữ nguyên toàn bộ màn hình placeholder (`DashboardScreen.tsx`, `ProjectsScreen.tsx`) cho các subphase 14B và 14C.
- **Không can thiệp Backend / Database**: Không chỉnh sửa mã nguồn backend Spring Boot, không thêm Flyway migration.
- **Không bổ sung thư viện ngoài**: Không cài đặt React Query, Redux, SWR, Lodash hay MSW; tuân thủ nghiêm ngặt chính sách `D-057`.
- **Phân tầng kiến trúc sạch (D-053)**: Tách biệt rõ ràng tầng vận chuyển (transport API adapters), tầng types/guards, và tầng ánh xạ lỗi (error mappers).

---

## 2. Chi Tiết Các Tệp Đã Tạo & Chỉnh Sửa

### 2.1. Feature Dashboard:
1. `mobile/src/features/dashboard/api/dashboardTypes.ts`:
   - Khai báo DTOs: `TaskDashboardSummary`, `ServiceRequestDashboardSummary`, `ProjectDashboardSummary`, `UpcomingTaskItem`, `RecentNotificationItem`, `PersonalDashboardData`.
   - Cung cấp runtime type guards: `isTaskDashboardSummary`, `isServiceRequestDashboardSummary`, `isProjectDashboardSummary`, `isUpcomingTaskItem`, `isRecentNotificationItem`, `isPersonalDashboardResponse`.
2. `mobile/src/features/dashboard/api/dashboardApi.ts`:
   - Adapter `dashboardApi.getMyDashboard()` gọi `GET /dashboard/me` qua client `http.get`, tự động unwrap envelope `ApiResponse` và kiểm tra kiểu qua `isPersonalDashboardResponse`.
3. `mobile/src/features/dashboard/api/index.ts` & `mobile/src/features/dashboard/index.ts`:
   - Re-export toàn bộ types, runtime guards và API adapter.

### 2.2. Feature Projects:
1. `mobile/src/features/projects/api/projectTypes.ts`:
   - Enums: `ProjectStatus`, `ProjectPriority`, `ProjectRole`, `MilestoneStatus` khớp 100% backend domain.
   - Whitelist thuộc tính sắp xếp: `PROJECT_SORT_PROPERTIES` (`createdAt`, `name`, `code`, `startDate`, `plannedEndDate`, `priority`, `status`).
   - Query & Request DTOs: `ProjectListQuery`, `CreateProjectRequest`, `UpdateProjectRequest`, `ChangeProjectStatusRequest`, `AddProjectMemberRequest`, `UpdateProjectMemberRoleRequest`, `CreateMilestoneRequest`.
   - Response DTOs: `ProjectManagerSummary`, `ProjectTaskSummary`, `ProjectDepartmentDetail`, `MilestoneItem`, `ProjectSummary`, `ProjectDetail`, `ProjectMember`.
   - Runtime guards: `isProjectStatus`, `isProjectPriority`, `isProjectRole`, `isMilestoneStatus`, `isProjectManagerSummary`, `isProjectTaskSummary`, `isProjectDepartmentDetail`, `isMilestoneItem`, `isProjectSummary`, `isProjectDetail`, `isProjectMember`.
2. `mobile/src/features/projects/api/projectApi.ts`:
   - Hàm tuần tự hóa `serializeProjectListQuery`: Trim `search` query, bỏ qua chuỗi rỗng/chỉ chứa khoảng trắng, kiểm tra whitelist `sort`, đóng gói filters `status`, `priority`, `managerId`, `departmentId`.
   - Endpoints CRUD:
     - `listProjects(query?: ProjectListQuery): Promise<PagedData<ProjectSummary>>` (`GET /projects`)
     - `createProject(request: CreateProjectRequest): Promise<ProjectDetail>` (`POST /projects`)
     - `getProject(projectId: string): Promise<ProjectDetail>` (`GET /projects/{projectId}`)
     - `updateProject(projectId: string, request: UpdateProjectRequest): Promise<ProjectDetail>` (`PUT /projects/{projectId}`)
     - `changeProjectStatus(projectId: string, request: ChangeProjectStatusRequest): Promise<ProjectDetail>` (`PUT /projects/{projectId}/status`)
     - `listMembers(projectId: string, query?: ...): Promise<PagedData<ProjectMember>>` (`GET /projects/{projectId}/members`)
     - `addProjectMember(projectId: string, request: AddProjectMemberRequest): Promise<ProjectMember>` (`POST /projects/{projectId}/members`)
     - `updateProjectMemberRole(projectId: string, memberId: string, request: UpdateProjectMemberRoleRequest): Promise<ProjectMember>` (`PUT /projects/{projectId}/members/{memberId}`)
     - `removeProjectMember(projectId: string, memberId: string): Promise<void>` (`DELETE /projects/{projectId}/members/{memberId}`)
     - `createMilestone(projectId: string, request: CreateMilestoneRequest): Promise<MilestoneItem>` (`POST /projects/{projectId}/milestones`)
     - `listMilestones(projectId: string): Promise<MilestoneItem[]>` (`GET /projects/{projectId}/milestones`)
3. `mobile/src/features/projects/errors/projectErrorMapper.ts`:
   - Ánh xạ mã lỗi backend:
     - `PROJECT_NOT_FOUND` $\rightarrow$ Thông báo không tìm thấy, `isNotFound: true`.
     - `OPTIMISTIC_LOCK_CONFLICT` (HTTP 409) $\rightarrow$ Thông báo dữ liệu đã bị cập nhật, `isConflict: true`, hướng dẫn tải lại dữ liệu mới nhất.
     - `PROJECT_CODE_ALREADY_EXISTS` $\rightarrow$ `isConflict: true`, kèm fieldErrors.
     - `PROJECT_MANAGER_REQUIRED` $\rightarrow$ Bảo toàn bất biến D-013, không thể xóa hoặc hạ vai trò của PM duy nhất.
     - `PROJECT_STATUS_TRANSITION_INVALID`, `PROJECT_ALREADY_COMPLETED`, `PROJECT_ALREADY_CANCELLED` $\rightarrow$ Thông báo lỗi chuyển trạng thái tiếng Việt thân thiện.
     - `PROJECT_MEMBER_ALREADY_EXISTS`, `PROJECT_NOT_ACTIVE`, `MILESTONE_NOT_FOUND`, `VALIDATION_ERROR`.
     - Lỗi mạng (`NETWORK_ERROR`, `TIMEOUT`) $\rightarrow$ Banner kèm nút thử lại (`retryable: true`).
     - Lỗi không xác định $\rightarrow$ Fallback an toàn, tuyệt đối không làm lộ chuỗi SQL hoặc stack trace nội bộ.
4. `mobile/src/features/projects/api/index.ts`, `mobile/src/features/projects/errors/index.ts`, `mobile/src/features/projects/index.ts`:
   - Re-export toàn bộ module.

### 2.3. App Navigation Types:
- `mobile/src/app/navigation/types.ts`:
  - Bổ sung 5 routes của phân hệ dự án vào `MainTabParamList`:
    - `ProjectDetail: { projectId: string }`
    - `CreateProject: undefined`
    - `EditProject: { projectId: string }`
    - `ProjectMembers: { projectId: string }`
    - `ProjectMilestones: { projectId: string }`
  - Chỉ nhận chuỗi UUID nguyên thủy (`projectId: string`), không truyền object qua route params.

---

## 3. Bằng Chứng Xác Minh & Kiểm Thử

### 3.1. Static Code Analysis (ESLint & TypeScript Compiler)
- **`npm run lint`**:
  ```text
  > WorkSphereMobile@0.0.1 lint
  > eslint .
  Exit code: 0 (No lint errors or warnings)
  ```
- **`npm run typecheck`**:
  ```text
  > WorkSphereMobile@0.0.1 typecheck
  > tsc --noEmit
  Exit code: 0 (Strict TypeScript check PASS)
  ```

### 3.2. Unit Tests (Jest)
- Thêm mới 5 test suites chuyên biệt cho Phase 14A:
  - `mobile/__tests__/dashboard/dashboardTypes.test.ts`
  - `mobile/__tests__/dashboard/dashboardApi.test.ts`
  - `mobile/__tests__/projects/projectTypes.test.ts`
  - `mobile/__tests__/projects/projectApi.test.ts`
  - `mobile/__tests__/projects/projectErrorMapper.test.ts`
- **Kết quả thực thi `npm test -- --runInBand`**:
  ```text
  Test Suites: 43 passed, 43 total
  Tests:       379 passed, 379 total
  Snapshots:   0 total
  Time:        16.21 s
  Ran all test suites.
  Exit code: 0
  ```
  *(Tăng từ 38 suites / 325 tests lên 43 suites / 379 tests, đạt 100% PASS)*

### 3.3. Android Native Compilation
- Lệnh: `.\gradlew.bat assembleDebug --no-daemon`
- Môi trường: `JAVA_HOME=D:\Android\jbr`, `ANDROID_HOME=D:\AndroidSDK`
- **Kết quả**:
  ```text
  BUILD SUCCESSFUL in 1m 32s
  203 actionable tasks: 16 executed, 187 up-to-date
  Exit code: 0
  ```

---

## 4. Trạng Thái Chuyển Giao & Bước Tiếp Theo

1. Subphase 14A đã hoàn tất đầy đủ mọi yêu cầu về DTOs, Type Guards, Adapters, Error Mapping, Serialization, và Navigation Types.
2. Sẵn sàng cho **Independent Audit Phase 14A**.
3. Sau khi Independent Audit đạt PASS, tiến hành Subphase 14B: Triển khai giao diện Personal Dashboard (`SCR-MAIN-01`).
