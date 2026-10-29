# 02. SCREEN INVENTORY - WORKSPHERE MOBILE

Tài liệu này xác định danh mục toàn bộ các màn hình của ứng dụng WorkSphere Mobile theo đúng [docs/03_MOBILE_SCREEN_MAP.md](file:///d:/WorkSphere/docs/03_MOBILE_SCREEN_MAP.md), đối chiếu chi tiết với trạng thái Backend thực tế đến Phase 6.

---

## Phân loại Artifacts Giao diện & Thống kê

Danh mục bao gồm chính xác **42 UI Artifacts** được phân định cấu trúc rõ ràng:
- **Full Screen (Màn hình độc lập)**: **37 màn hình** (Splash, Auth, Dashboard, Lists, Details, Forms, Management).
- **Modal / Bottom Sheet / Dialog**: **4 thành phần** (`SCR-PRJ-05` Change Status Sheet, `SCR-PRJ-07` Member Sheet, `SCR-SRV-03` Reject Sheet, `SCR-ACC-04` Logout Dialog).
- **Navigator / Layout Container**: **1 bộ khung** (`SCR-MAIN-02` Bottom Tab Navigation).
- **Tổng số UI Artifacts**: **42 artifacts**.

---

## Bảng Tổng hợp Màn hình & Tình trạng Backend

| Mã Screen | Tên Màn hình / Artifact | Phân loại UI | Phân hệ (Module) | Độ ưu tiên | Backend Readiness |
|---|---|---|---|---|---|
| `SCR-AUTH-01` | Splash Screen | Full Screen | Authentication | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-AUTH-02` | Login Screen | Full Screen | Authentication | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-AUTH-03` | Forgot Password Screen | Full Screen | Authentication | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-AUTH-04` | Reset Password Screen | Full Screen | Authentication | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-MAIN-01` | Dashboard Screen | Full Screen | Main Application | P0 | `BLOCKED_BY_GAP` (`DASHBOARD_AGGREGATED_API_GAP`) |
| `SCR-MAIN-02` | Bottom Tab Navigation | Navigator Layout | Main Application | P0 | `CLIENT_NAVIGATOR` |
| `SCR-MAIN-03` | More Menu Screen | Full Screen | Main Application | P0 | `CLIENT_LAYOUT` |
| `SCR-PRJ-01` | Project List Screen | Full Screen | Project | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-02` | Project Detail Screen | Full Screen | Project | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-03` | Create Project Screen | Full Screen | Project | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-04` | Edit Project Screen | Full Screen | Project | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-05` | Change Status Modal Sheet | Bottom Sheet | Project | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-06` | Project Member List Screen | Full Screen | Project | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-07` | Add / Edit Project Member Sheet | Bottom Sheet | Project | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-08` | Milestone List Screen | Full Screen | Project | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-PRJ-09` | Create Milestone Screen | Full Screen | Project | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-TSK-01` | Task List Screen | Full Screen | Task | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-TSK-02` | Task Detail Screen | Full Screen | Task | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-TSK-03` | Create Task Screen | Full Screen | Task | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-TSK-04` | Edit Task Screen | Full Screen | Task | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-TSK-05` | Subtask List Screen | Full Screen | Task | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-TSK-06` | Task Comments Screen | Full Screen | Task | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-01` | Service Request List Screen | Full Screen | Service Request | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-02` | Service Request Detail Screen | Full Screen | Service Request | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-03` | Reject Resolution Sheet | Bottom Sheet | Service Request | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-04` | Create Service Request Screen | Full Screen | Service Request | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-05` | Service Request Comments | Full Screen | Service Request | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-SRV-06` | Service Rating Screen | Full Screen | Service Request | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-AST-01` | Asset List Screen | Full Screen | Asset | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-AST-02` | Asset Detail Screen | Full Screen | Asset | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-AST-03` | Create Asset Screen | Full Screen | Asset | P1 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-AST-04` | Edit Asset Screen | Full Screen | Asset | P1 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-AST-05` | Asset Assignment Screen | Full Screen | Asset | P1 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-AST-06` | Return Asset Screen | Full Screen | Asset | P1 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-NOT-01` | Notification List Screen | Full Screen | Notification | P0 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |
| `SCR-ACC-01` | Profile Screen | Full Screen | Account | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-ACC-02` | Change Password Screen | Full Screen | Account | P0 | `IMPLEMENTED_NOT_FULLY_TESTED` |
| `SCR-ACC-03` | Settings Screen | Full Screen | Account | P0 | `CLIENT_LAYOUT` |
| `SCR-ACC-04` | Logout Confirm Dialog | Dialog | Account | P0 | `IMPLEMENTED_AND_TESTED` |
| `SCR-ADM-01` | User Management Screen | Full Screen | Admin | P1 | `IMPLEMENTED_AND_TESTED` |
| `SCR-ADM-02` | Department Management Screen| Full Screen | Admin | P1 | `IMPLEMENTED_AND_TESTED` |
| `SCR-ADM-03` | Category Management Screen | Full Screen | Admin | P1 | `CONTRACT_ONLY_NOT_IMPLEMENTED` |

---

## 1. Authentication Module

### SCR-AUTH-01: Splash Screen
- **Mục tiêu**: Kiểm tra tính hợp lệ của phiên đăng nhập (Token restore), điều hướng vào ứng dụng.
- **Quyền hạn**: Mọi người dùng / Thiết bị.
- **Dữ liệu**: `refreshToken` lưu tại Secure Storage.
- **API Endpoint**: `POST /api/v1/auth/refresh`
- **Nav Input**: Không.
- **Nav Output**: `SCR-AUTH-02` (nếu không có token / hết hạn) hoặc `SCR-MAIN-01` (nếu hợp lệ).
- **Primary Action**: Tự động chuyển màn hình sau khi kiểm tra xong.
- **Secondary Action**: Không.
- **Components**: Logo thương hiệu, Loading Spinner, Version text.
- **Trạng thái UI**:
  - *Loading*: Spinner quay dưới logo.
  - *Error*: Không hiển thị lỗi tại Splash, âm thầm chuyển về Login kèm thông báo nếu cần.
- **Accessibility**: Accessibility role `progressbar`, label: "Đang tải cấu hình ứng dụng".
- **Acceptance Criteria**: Thời gian splash không vượt quá 1.5s trong điều kiện mạng bình thường.
- **Backend Readiness**: `READY`.

---

### SCR-AUTH-02: Login Screen
- **Mục tiêu**: Xác thực người dùng bằng Tên đăng nhập/Email và Mật khẩu.
- **Quyền hạn**: Khách / Người dùng chưa xác thực.
- **Dữ liệu**: Username/Email, Password.
- **API Endpoint**: `POST /api/v1/auth/login`
- **Nav Input**: Không.
- **Nav Output**: `SCR-MAIN-01` (Thành công), `SCR-AUTH-03` (Bấm quên mật khẩu).
- **Primary Action**: Bấm nút "Đăng nhập".
- **Secondary Action**: Bấm liên kết "Quên mật khẩu?".
- **Components**: `AppTextInput` (username), `PasswordInput` (toggle ẩn/hiện mật khẩu), `AppButton` (Primary submit), `FormErrorSummary`.
- **Validation**:
  - Username/Email: Không được để trống.
  - Password: Không được để trống, tối thiểu 6 ký tự.
- **Trạng thái UI**:
  - *Loading*: Nút Đăng nhập chuyển thành spinner, khóa các ô nhập.
  - *Error*: HTTP 401 ném `INVALID_CREDENTIALS` -> Hiển thị cảnh báo "Thông tin đăng nhập không chính xác".
  - *Locked*: HTTP 422 `USER_LOCKED` -> Hiển thị cảnh báo "Tài khoản của bạn đã bị khóa".
- **Accessibility**: Trường mật khẩu hỗ trợ toggle ẩn hiện có đọc nhãn accessibility cho TalkBack/VoiceOver.
- **Acceptance Criteria**: Đăng nhập thành công lưu token an toàn vào keychain và chuyển ngay đến Dashboard.
- **Backend Readiness**: `READY`.

---

### SCR-AUTH-03: Forgot Password Screen
- **Mục tiêu**: Tiếp nhận yêu cầu đặt lại mật khẩu qua email công ty.
- **Quyền hạn**: Người dùng chưa đăng nhập.
- **Dữ liệu**: Email.
- **API Endpoint**: `POST /api/v1/auth/forgot-password`
- **Nav Input**: Không.
- **Nav Output**: Quay lại `SCR-AUTH-02` hoặc mở `SCR-AUTH-04` (khi có token).
- **Primary Action**: Bấm nút "Gửi hướng dẫn".
- **Secondary Action**: Bấm "Quay lại đăng nhập".
- **Components**: `TopAppBar` (Back button), `AppTextInput` (email), `AppButton`.
- **Validation**: Email đúng định dạng regex email.
- **Trạng thái UI**:
  - *Success*: Hiển thị banner thành công "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi trong ít phút".
- **Backend Readiness**: `READY`.

---

## 2. Main Application Module

### SCR-MAIN-01: Dashboard Screen
- **Mục tiêu**: Trung tâm điều phối hiển thị tổng quan công việc, dự án tham gia, yêu cầu cần xử lý.
- **Quyền hạn**: Tất cả người dùng đã đăng nhập.
- **Dữ liệu**: Thống kê task (todo, inProgress, overdue), dự án active, yêu cầu dịch vụ.
- **API Endpoint**: `GET /api/v1/dashboard` (Dự kiến theo API Contract section 10).
- **Nav Input**: Không.
- **Nav Output**: Chạm vào thẻ chuyển đến `SCR-PRJ-02`, `SCR-TSK-02`, `SCR-SRV-02`.
- **Components**: `TopAppBar` (Greeting + Avatar + Chuông thông báo), Metric summary cards, Horizontal project carousel, Upcoming task list, PullToRefresh.
- **Trạng thái UI**:
  - *Loading*: Skeleton layout dạng cards.
  - *Empty*: Hiển thị minh họa "Bạn không có công việc nào cần xử lý hôm nay".
  - *Error*: Báo lỗi tải dữ liệu kèm nút "Thử lại".
- **Backend Readiness**: `DESIGN_ONLY_BACKEND_NOT_READY` (Endpoint aggregated `/api/v1/dashboard` thuộc Phase 7+; hiện tại mobile có thể ghép từ `/api/v1/projects`).

---

### SCR-MAIN-02: Bottom Tab Navigation
- **Mục tiêu**: Thanh điều hướng chính cố định dưới chân màn hình.
- **Cấu trúc 5 Tabs**:
  1. **Dashboard** (Icon: ViewDashboard) -> `SCR-MAIN-01`
  2. **Dự án** (Icon: FolderMultiple) -> `SCR-PRJ-01`
  3. **Công việc** (Icon: CheckboxMarkedCircleOutline) -> `SCR-TSK-01`
  4. **Yêu cầu** (Icon: Headphones) -> `SCR-SRV-01`
  5. **Thêm** (Icon: DotsHorizontal) -> `SCR-MAIN-03`
- **Quy tắc UI**: Chiều cao 64dp, hỗ trợ Safe Area Android/iOS, có badge số lượng trên tab Công việc và Yêu cầu.

---

### SCR-MAIN-03: More Menu Screen
- **Mục tiêu**: Cung cấp lối tắt đến các tính năng phụ và phân hệ quản trị.
- **Quyền hạn**: Tất cả người dùng (hiển thị mục Admin tùy permission).
- **Các mục danh sách**:
  - Tài sản của tôi -> `SCR-AST-01`
  - Thông báo hệ thống -> `SCR-NOT-01`
  - Hồ sơ & Bảo mật -> `SCR-ACC-01`
  - Cài đặt ứng dụng -> `SCR-ACC-03`
  - *Khu vực Quản trị (Chỉ hiện khi có `USER_READ` / `DEPARTMENT_MANAGE`)*:
    - Quản lý người dùng -> `SCR-ADM-01`
    - Quản lý phòng ban -> `SCR-ADM-02`
- **Backend Readiness**: `READY`.

---

## 3. Project Module (Phase 6 - Hoàn toàn READY)

### SCR-PRJ-01: Project List Screen
- **Mục tiêu**: Xem danh sách toàn bộ các dự án được phép xem, tìm kiếm và lọc trạng thái.
- **Quyền hạn**: `PROJECT_READ`.
- **API Endpoint**: `GET /api/v1/projects?page={page}&size={size}&sort={sort}&search={search}&status={status}&priority={priority}`
- **Nav Input**: Không.
- **Nav Output**: Chọn thẻ dự án -> `SCR-PRJ-02`; Bấm nút tạo (nếu có `PROJECT_CREATE`) -> `SCR-PRJ-03`.
- **Components**: `TopAppBar` (Tiêu đề + nút tìm kiếm), SearchBar, FilterChips (`Tất cả`, `Đang chạy`, `Bản nháp`, `Tạm dừng`), FlatList dự án (`ProjectCard`), FAB "Tạo dự án" (Quản lý dự án).
- **Trạng thái UI**:
  - *Loading*: 4 Skeleton cards nhấp nháy.
  - *Empty*: "Không tìm thấy dự án nào phù hợp với bộ lọc".
  - *Error*: Card báo lỗi kèm nút "Tải lại".
  - *Refreshing*: Kéo xuống để làm mới.
- **Backend Readiness**: `READY`.

---

### SCR-PRJ-02: Project Detail Screen
- **Mục tiêu**: Xem toàn diện thông tin dự án, tiến độ %, các mốc quan trọng và thao tác điều hành.
- **Quyền hạn**: `PROJECT_READ`.
- **API Endpoint**: `GET /api/v1/projects/{projectId}`
- **Nav Input**: `projectId` (UUID).
- **Nav Output**:
  - Bấm "Xem thành viên" -> `SCR-PRJ-06`
  - Bấm "Xem mốc tiến độ" -> `SCR-PRJ-08`
  - Bấm "Chỉnh sửa" -> `SCR-PRJ-04`
  - Bấm "Đổi trạng thái" -> Mở Modal `SCR-PRJ-05`
- **Components**: `TopAppBar` (Nút back + Menu options), Thẻ thông tin dự án (Mã, Tên, Phòng ban, Quản lý), `ProgressBar` tiến độ, `StatusBadge`, `PriorityBadge`, Danh sách Milestones tóm tắt, Danh sách thành viên avatar group.
- **Quy tắc phân quyền (allowedActions)**:
  - Chỉ hiện nút Chỉnh sửa nếu `allowedActions` chứa `UPDATE`.
  - Chỉ hiện nút Đổi trạng thái nếu `allowedActions` chứa `CHANGE_STATUS`.
  - Chỉ hiện nút Quản lý thành viên nếu `allowedActions` chứa `MANAGE_MEMBERS`.
- **Backend Readiness**: `READY`.

---

### SCR-PRJ-03: Create Project Screen
- **Mục tiêu**: Khởi tạo dự án mới (Luôn ở trạng thái `DRAFT`).
- **Quyền hạn**: `PROJECT_CREATE`.
- **API Endpoint**: `POST /api/v1/projects`
- **Dữ liệu**: `code`, `name`, `description`, `priority`, `startDate`, `plannedEndDate`, `departmentId`, `initialMemberIds`.
- **Validation**:
  - `code`: Bắt buộc, 3-50 ký tự.
  - `name`: Bắt buộc, 3-200 ký tự.
  - `plannedEndDate`: Phải sau hoặc cùng ngày `startDate`.
- **Kết quả**: Thành công điều hướng vào `SCR-PRJ-02` của dự án vừa tạo với trạng thái `DRAFT`.
- **Backend Readiness**: `READY`.

---

### SCR-PRJ-04: Edit Project Screen
- **Mục tiêu**: Cập nhật thông tin dự án đang có.
- **Quyền hạn**: `PROJECT_UPDATE`.
- **API Endpoint**: `PUT /api/v1/projects/{projectId}`
- **Dữ liệu bắt buộc**: `name`, `description`, `priority`, `startDate`, `plannedEndDate`, `version`.
- **Xử lý Optimistic Lock**:
  - Gửi kèm `version`. Nếu server trả HTTP 409 `OPTIMISTIC_LOCK_CONFLICT`: Hiển thị thông báo "Dữ liệu đã bị cập nhật bởi người khác. Vui lòng tải lại phiên bản mới nhất." kèm nút "Tải lại dữ liệu".
- **Backend Readiness**: `READY`.

---

### SCR-PRJ-05: Change Project Status Modal Sheet
- **Mục tiêu**: Chuyển đổi trạng thái vòng đời dự án theo ma trận hợp lệ.
- **Quyền hạn**: `PROJECT_UPDATE` (và `allowedActions` có `CHANGE_STATUS`).
- **API Endpoint**: `PUT /api/v1/projects/{projectId}/status`
- **Dữ liệu**: `status`, `reason`, `version`.
- **Ma trận trạng thái hiển thị**:
  - Đang `DRAFT` -> Chỉ cho phép chọn `ACTIVE` hoặc `CANCELLED`.
  - Đang `ACTIVE` -> Chỉ cho phép chọn `ON_HOLD`, `COMPLETED`, hoặc `CANCELLED`.
  - Đang `ON_HOLD` -> Chỉ cho phép chọn `ACTIVE` hoặc `CANCELLED`.
  - Không cho chọn trạng thái không hợp lệ.
- **Backend Readiness**: `READY`.

---

### SCR-PRJ-06: Project Member List Screen
- **Mục tiêu**: Xem danh sách thành viên dự án, phân cấp vai trò.
- **Quyền hạn**: `PROJECT_READ`.
- **API Endpoint**: `GET /api/v1/projects/{projectId}/members`
- **Components**: Danh sách thành viên `MemberRow` (Avatar, Tên, Email, Vai trò `ProjectRole`, Badge hoạt động), FAB "Thêm thành viên" (chỉ hiện khi có `PROJECT_MEMBER_MANAGE`).
- **Backend Readiness**: `READY`.

---

### SCR-PRJ-07: Add / Edit Project Member Sheet
- **Mục tiêu**: Thêm người dùng vào dự án hoặc cập nhật vai trò (`PROJECT_MANAGER`, `TEAM_LEADER`, `MEMBER`, `OBSERVER`).
- **Quyền hạn**: `PROJECT_MEMBER_MANAGE`.
- **API Endpoint**:
  - Thêm: `POST /api/v1/projects/{projectId}/members`
  - Sửa: `PUT /api/v1/projects/{projectId}/members/{memberId}`
  - Xóa: `DELETE /api/v1/projects/{projectId}/members/{memberId}`
- **Bảo toàn bất biến Project Manager (D-013)**:
  - Khi xóa hoặc đổi vai trò của thành viên đang là `PROJECT_MANAGER` duy nhất -> Backend ném `PROJECT_MANAGER_REQUIRED`.
  - Mobile bắt lỗi và hiển thị rõ: "Không thể giáng cấp/xóa Project Manager duy nhất của dự án".
- **Backend Readiness**: `READY`.

---

### SCR-PRJ-08: Milestone List Screen & SCR-PRJ-09: Create Milestone
- **Mục tiêu**: Quản lý các mốc quan trọng của dự án.
- **Quyền hạn**: `PROJECT_READ` (Xem) / `PROJECT_UPDATE` (Tạo).
- **API Endpoint**: `GET`, `POST` trên `/api/v1/projects/{projectId}/milestones`.
- **Backend Readiness**: `READY`.

---

## 4. Task Module (Phase 7 - `DESIGN_ONLY_BACKEND_NOT_READY`)

Các màn hình dưới đây tuân thủ mục 8 trong `03_MOBILE_SCREEN_MAP.md`, được thiết kế UI hoàn chỉnh nhưng gắn nhãn chờ Backend Phase 7:

- **`SCR-TSK-01: Task List Screen`**: Danh sách công việc phân loại theo tab (Cần làm, Đang làm, Hoàn thành), lọc theo độ ưu tiên (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), hạn chót.
- **`SCR-TSK-02: Task Detail Screen`**: Chi tiết tiêu đề, mô tả, người thực hiện, thời hạn, danh sách subtasks, lịch sử trạng thái, khu vực bình luận.
- **`SCR-TSK-03: Create Task Screen`**: Biểu mẫu nhập tiêu đề, chọn dự án, người thực hiện, mốc tiến độ, ngày bắt đầu/kết thúc.
- **`SCR-TSK-04: Edit Task Screen`**: Sửa nội dung và trạng thái công việc kèm Optimistic Lock version.
- **`SCR-TSK-05: Subtask List Screen`**: Danh sách checklist công việc con dạng checkbox hoàn thành.
- **`SCR-TSK-06: Task Comments Screen`**: Khung chat thảo luận trong task, hỗ trợ đính kèm hình ảnh.

---

## 5. Service Request Module (Phase 8 - `DESIGN_ONLY_BACKEND_NOT_READY`)

- **`SCR-SRV-01: Service Request List Screen`**: Danh sách yêu cầu hỗ trợ người dùng tạo hoặc được phân công.
- **`SCR-SRV-02: Service Request Detail Screen`**: Chi tiết yêu cầu, trạng thái (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`, `CANCELLED`).
- **`SCR-SRV-03: Reject Resolution Sheet`**: Theo quy chuẩn `03_MOBILE_SCREEN_MAP.md` mục 9.2:
  - Chỉ hiển thị khi trạng thái là `RESOLVED` và người xem là người tạo (Requester).
  - Cho phép nhập lý do (tối đa 1000 ký tự) để chuyển trạng thái yêu cầu quay lại `IN_PROGRESS`.
- **`SCR-SRV-04: Create Service Request Screen`**: Tạo yêu cầu mới (Danh mục IT, Thiết bị, Hành chính).
- **`SCR-SRV-05: Service Request Comments`**: Thảo luận giữa người yêu cầu và kỹ thuật viên.
- **`SCR-SRV-06: Service Rating Screen`**: Đánh giá số sao (1-5 sao) và nhận xét khi yêu cầu đã `CLOSED`.

---

## 6. Asset Module (Phase 9 - `DESIGN_ONLY_BACKEND_NOT_READY`)

- **`SCR-AST-01: Asset List Screen (P0)`**: Nhân viên xem danh sách thiết bị/tài sản được công ty cấp phát (Laptop, Màn hình, Thẻ ra vào).
- **`SCR-AST-02: Asset Detail Screen (P0)`**: Xem thông số thiết bị, ngày cấp, hạn bảo hành, lịch sử bàn giao; nút "Báo hỏng" điều hướng sang `SCR-SRV-04`.
- **`SCR-AST-03 -> SCR-AST-06 (P1)`**: Chức năng quản trị tài sản (Thêm mới, sửa, cấp phát cho nhân viên, thu hồi) dành cho người có quyền `ASSET_MANAGE`.

---

## 7. Notification Module (Phase 10 - `DESIGN_ONLY_BACKEND_NOT_READY`)

- **`SCR-NOT-01: Notification List Screen`**: Danh sách thông báo chia theo mục (Tất cả / Chưa đọc). Chạm vào thông báo điều hướng sâu đến Dự án, Công việc hoặc Yêu cầu tương ứng.

---

## 8. Account & Admin Module

### SCR-ACC-01: Profile Screen
- **Mục tiêu**: Xem thông tin nhân viên, phòng ban, vai trò, email.
- **API Endpoint**: `GET /api/v1/me`
- **Backend Readiness**: `READY`.

### SCR-ACC-02: Change Password Screen
- **Mục tiêu**: Đổi mật khẩu tài khoản đang đăng nhập.
- **API Endpoint**: `PUT /api/v1/me/password`
- **Backend Readiness**: `READY`.

### SCR-ACC-03: Settings Screen & SCR-ACC-04: Logout Dialog
- **Mục tiêu**: Cài đặt thông báo, phiên bản ứng dụng, xác nhận đăng xuất và xóa phiên.
- **API Endpoint**: `POST /api/v1/auth/logout`
- **Backend Readiness**: `READY`.

### SCR-ADM-01: User Management Screen (P1)
- **Mục tiêu**: Quản trị viên xem danh sách nhân sự, trạng thái tài khoản (`ACTIVE`, `PENDING`, `LOCKED`), khóa/mở khóa tài khoản.
- **API Endpoint**: `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/{id}/lock`, `PUT /api/v1/admin/users/{id}/unlock`.
- **Backend Readiness**: `READY` (Hoàn thành từ Phase 5).

### SCR-ADM-02: Department Management Screen (P1)
- **Mục tiêu**: Quản trị viên xem và quản lý danh sách phòng ban.
- **API Endpoint**: `GET /api/v1/departments`, `POST /api/v1/admin/departments`, `PUT /api/v1/admin/departments/{id}`.
- **Backend Readiness**: `READY` (Hoàn thành từ Phase 5).
