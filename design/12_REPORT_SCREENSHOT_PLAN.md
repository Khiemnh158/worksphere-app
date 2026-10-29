# 12. REPORT SCREENSHOT PLAN - WORKSPHERE MOBILE

Tài liệu này xác lập kế hoạch chi tiết về danh mục hình ảnh giao diện cần trích xuất (từ Figma hoặc ứng dụng thực nghiệm), nhằm phục vụ báo cáo học thuật và slide thuyết trình cho môn học **Phát triển Ứng dụng Di động** (Mobile Application Development).

---

## 1. Mục đích và Quy chuẩn Trích xuất Hình ảnh

- **Độ phân giải**: Tối thiểu 2x (720 × 1600 px) định dạng PNG rõ nét, không bị nhòe vỡ khi in ấn hoặc chiếu slide.
- **Khung thiết bị (Device Mockup)**: Khung viền điện thoại Android viền mỏng bo góc thẩm mỹ.
- **Dữ liệu mẫu**: Sử dụng dữ liệu thực tế đã được seed trong hệ thống backend (Người dùng admin, PM, dự án WS-2026-001,...), không dùng dữ liệu "lorem ipsum" hoặc chữ vô nghĩa.

---

## 2. Kế hoạch Chi tiết Danh mục Hình ảnh Báo cáo

### Hình 1: Màn hình Đăng nhập (Login Screen)
- **Figure ID**: `HÌNH 4.1`
- **Tên hình**: Giao diện Đăng nhập hệ thống WorkSphere Mobile
- **Màn hình**: `SCR-AUTH-02: Login Screen`
- **Trạng thái**: `SUCCESS` (Form sẵn sàng nhập liệu)
- **Dữ liệu mẫu**:
  - Tên đăng nhập: `nguyen.van.a@worksphere.com`
  - Mật khẩu: `••••••••••••` (ẩn ký tự, icon con mắt đang đóng)
- **Nội dung thuyết minh trong báo cáo**:
  - Trình bày kiến trúc phân lớp giao diện với logo thương hiệu và form đăng nhập.
  - Phân tích cơ chế bảo mật: Che giấu mật khẩu, kiểm tra hợp lệ tại client trước khi gửi request tới API `POST /api/v1/auth/login`.

---

### Hình 2: Báo lỗi Xác thực Đăng nhập
- **Figure ID**: `HÌNH 4.2`
- **Tên hình**: Phản hồi lỗi khi thông tin đăng nhập không chính xác
- **Màn hình**: `SCR-AUTH-02: Login Screen`
- **Trạng thái**: `ERROR` (HTTP 401 Unauthorized)
- **Dữ liệu mẫu**: Dòng cảnh báo màu đỏ `#DC2626`: *"Thông tin đăng nhập không chính xác hoặc tài khoản không tồn tại"*.
- **Nội dung thuyết minh trong báo cáo**:
  - Minh họa việc bắt mã lỗi `INVALID_CREDENTIALS` từ backend Spring Boot và chuyển đổi thành thông điệp tiếng Việt thân thiện, không lộ thông tin người dùng có tồn tại hay không vì lý do bảo mật.

---

### Hình 3: Màn hình Bảng điều khiển Tổng quan (Dashboard)
- **Figure ID**: `HÌNH 4.3`
- **Tên hình**: Giao diện Bảng điều khiển trung tâm (Dashboard)
- **Màn hình**: `SCR-MAIN-01: Dashboard Screen`
- **Trạng thái**: `SUCCESS`
- **Dữ liệu mẫu**:
  - Lời chào: *"Xin chào, Nguyễn Văn A • Phòng CNTT"*
  - 3 Thẻ thống kê: Cần làm (5), Đang làm (3), Quá hạn (2)
  - Thẻ dự án: *"WS-2026-001 • Xây dựng Nền tảng WorkSphere (45.0%)"*
- **Nội dung thuyết minh trong báo cáo**:
  - Trình bày bố cục hiển thị thông tin đa chiều (Dashboard Metrics), giúp người dùng nắm bắt khối lượng công việc ngay khi vừa vào ứng dụng.
  - Giới thiệu thanh điều hướng 5 tab (Bottom Navigation Bar) tuân thủ Material Design.

---

### Hình 4: Danh sách Dự án (Project List)
- **Figure ID**: `HÌNH 4.4`
- **Tên hình**: Giao diện Danh sách Dự án với bộ lọc trạng thái
- **Màn hình**: `SCR-PRJ-01: Project List Screen`
- **Trạng thái**: `SUCCESS`
- **Dữ liệu mẫu**:
  - Filter chip "Đang chạy" được chọn.
  - Danh sách hiển thị 3 thẻ dự án (`PRJ-2026-001`, `PRJ-2026-002`, `PRJ-2026-003`).
  - Mỗi thẻ hiển thị rõ: Tên, Mã, Badge Trạng thái, Badge Độ ưu tiên, Thanh tiến độ ProgressBar, Avatar người quản lý.
- **Nội dung thuyết minh trong báo cáo**:
  - Phân tích cơ chế phân trang (Pagination), tìm kiếm trực tiếp và lọc dữ liệu qua query params gửi tới endpoint `GET /api/v1/projects`.

---

### Hình 5: Trạng thái Tải dữ liệu Dự án (Skeleton Loading)
- **Figure ID**: `HÌNH 4.5`
- **Tên hình**: Hiệu ứng Skeleton Loading khi đang nạp danh sách dự án
- **Màn hình**: `SCR-PRJ-01: Project List Screen`
- **Trạng thái**: `LOADING`
- **Dữ liệu mẫu**: 3 khung `SkeletonCard` nhấp nháy mô phỏng cấu trúc thẻ dự án.
- **Nội dung thuyết minh trong báo cáo**:
  - Giải thích việc áp dụng Skeleton Shimmer thay vì Spinner tròn truyền thống để giảm cảm giác chờ đợi và giữ vững cấu trúc layout trực quan cho người dùng.

---

### Hình 6: Trạng thái Danh sách Rỗng (Empty State)
- **Figure ID**: `HÌNH 4.6`
- **Tên hình**: Giao diện khi không có dự án nào thỏa mãn bộ lọc
- **Màn hình**: `SCR-PRJ-01: Project List Screen`
- **Trạng thái**: `EMPTY`
- **Dữ liệu mẫu**: Hình minh họa thư mục rỗng, dòng chữ *"Không tìm thấy dự án nào phù hợp"*, nút phụ *"Đặt lại bộ lọc"*.
- **Nội dung thuyết minh trong báo cáo**:
  - Phân tích trải nghiệm người dùng tích cực (Positive UX): Không để màn hình trống trơn mà luôn đưa ra hành động khắc phục cho người dùng.

---

### Hình 7: Chi tiết Dự án (Project Detail)
- **Figure ID**: `HÌNH 4.7`
- **Tên hình**: Màn hình Chi tiết Dự án và Phân quyền Thao tác
- **Màn hình**: `SCR-PRJ-02: Project Detail Screen`
- **Trạng thái**: `SUCCESS`
- **Dữ liệu mẫu**:
  - Dự án: `PRJ-2026-001 - Xây dựng Nền tảng WorkSphere`
  - Tiến độ: `45.0%`
  - Các nút hành động hiển thị: `[Đổi trạng thái]`, `[Chỉnh sửa]`, `[Quản lý thành viên]` (Dựa trên `allowedActions`).
  - Danh sách mốc tiến độ (Milestones): Mốc 1 (Hoàn thành), Mốc 2 (Đang làm).
- **Nội dung thuyết minh trong báo cáo**:
  - Trình bày kiến trúc bảo mật hướng quyền (Permission-based UI): Mobile tự động hiển thị hoặc ẩn các nút thao tác nghiệp vụ dựa trên trường `allowedActions` được backend tính toán độc lập.

---

### Hình 8: Hộp thoại Đổi Trạng thái Dự án (Status Transition Sheet)
- **Figure ID**: `HÌNH 4.8`
- **Tên hình**: Modal Bottom Sheet chuyển đổi trạng thái vòng đời dự án
- **Màn hình**: `SCR-PRJ-05: Change Status Sheet`
- **Trạng thái**: `SUCCESS` / `INTERACTION`
- **Dữ liệu mẫu**:
  - Trạng thái hiện tại: `DRAFT`
  - Các lựa chọn khả dụng: `ACTIVE (Kích hoạt)` và `CANCELLED (Hủy)`
  - Ô nhập lý do thay đổi.
- **Nội dung thuyết minh trong báo cáo**:
  - Phân tích việc hiện thực hóa ma trận trạng thái nghiệp vụ (FSM - Finite State Machine) tại mục 4.2 của tài liệu `02_USER_ROLES_AND_WORKFLOWS.md`, ngăn chặn việc chọn sai trạng thái ngay từ giao diện.

---

### Hình 9: Xử lý Xung đột Khóa Lạc quan (Optimistic Lock Conflict)
- **Figure ID**: `HÌNH 4.9`
- **Tên hình**: Thông báo Xung đột Phiên bản (HTTP 409 Conflict)
- **Màn hình**: `SCR-PRJ-04: Edit Project Screen`
- **Trạng thái**: `OPTIMISTIC_LOCK_CONFLICT`
- **Dữ liệu mẫu**:
  - Icon cảnh báo tam giác vàng.
  - Hộp thoại: *"Dữ liệu đã thay đổi: Thông tin dự án vừa được cập nhật bởi một người quản lý khác. Vui lòng tải lại phiên bản mới nhất."*
  - Nút bấm: `[TẢI LẠI DỮ LIỆU MỚI]`.
- **Nội dung thuyết minh trong báo cáo**:
  - Phân tích cơ chế bảo toàn dữ liệu trong môi trường phân tán (Concurrency Control): Ứng dụng gửi kèm trường `@Version`, khi backend ném `ObjectOptimisticLockingFailureException` (HTTP 409), mobile không crash và không ghi đè, mà hướng dẫn người dùng làm mới dữ liệu an toàn.

---

### Hình 10: Quản lý Thành viên & Ngăn chặn Giáng cấp PM Duy nhất
- **Figure ID**: `HÌNH 4.10`
- **Tên hình**: Danh sách Thành viên và Cảnh báo vi phạm bất biến Project Manager
- **Màn hình**: `SCR-PRJ-06` & `SCR-PRJ-07`
- **Trạng thái**: `VALIDATION_ERROR` / `BUSINESS_RULE_REJECTED`
- **Dữ liệu mẫu**:
  - Danh sách hiển thị: Nguyễn Văn A (`PROJECT_MANAGER`), Trần Thị B (`MEMBER`).
  - Hộp thoại thông báo khi cố gắng đổi vai trò của Nguyễn Văn A: *"Không thể giáng cấp/xóa Project Manager duy nhất của dự án (Mã lỗi: PROJECT_MANAGER_REQUIRED)"*.
- **Nội dung thuyết minh trong báo cáo**:
  - Minh chứng cho việc tuân thủ quy tắc bất biến dự án (Decision `D-013`): Dự án luôn phải duy trì ít nhất một người quản lý chịu trách nhiệm chính.

---

### Hình 11: Tạo Mốc Tiến độ Dự án (Create Milestone)
- **Figure ID**: `HÌNH 4.11`
- **Tên hình**: Biểu mẫu Tạo Mốc Tiến độ Dự án
- **Màn hình**: `SCR-PRJ-09: Create Milestone Screen`
- **Trạng thái**: `SUCCESS` (Form nhập liệu)
- **Dữ liệu mẫu**: Tên mốc: *"Hoàn thành kiểm thử tích hợp Mobile"*, Hạn chót: `30/11/2026`.
- **Nội dung thuyết minh trong báo cáo**:
  - Thuyết minh việc tích hợp DatePicker native của hệ điều hành để người dùng chọn ngày tháng trực quan, tránh lỗi định dạng ngày giờ ISO-8601.

---

### Hình 12: Màn hình Từ chối Kết quả Xử lý Dịch vụ (Reject Resolution)
- **Figure ID**: `HÌNH 4.12`
- **Tên hình**: Màn hình Chi tiết Yêu cầu và Bottom Sheet Từ chối Kết quả
- **Màn hình**: `SCR-SRV-02` & `SCR-SRV-03: Reject Resolution Sheet`
- **Trạng thái**: `DESIGN_ONLY_BACKEND_NOT_READY`
- **Dữ liệu mẫu**: Yêu cầu ở trạng thái `RESOLVED`, người tạo bấm "Từ chối kết quả", nhập lý do: *"Máy in vẫn báo lỗi đèn đỏ, chưa kết nối được"* (Ký tự: 52/1000).
- **Nội dung thuyết minh trong báo cáo**:
  - Thuyết minh quy trình phản hồi chất lượng dịch vụ nội bộ theo mục 9.2 của `03_MOBILE_SCREEN_MAP.md`, cho phép chuyển đổi trạng thái linh hoạt từ `RESOLVED` quay lại `IN_PROGRESS`.

---

### Hình 13: Màn hình Hồ sơ Cá nhân và Đổi Mật khẩu
- **Figure ID**: `HÌNH 4.13`
- **Tên hình**: Giao diện Hồ sơ Người dùng và Bảo mật tài khoản
- **Màn hình**: `SCR-ACC-01: Profile Screen`
- **Trạng thái**: `SUCCESS`
- **Dữ liệu mẫu**: Avatar, Họ tên: Nguyễn Văn A, Email: `nguyen.a@worksphere.com`, Phòng ban: `Phòng CNTT`, Vai trò: `PROJECT_MANAGER`.
- **Nội dung thuyết minh trong báo cáo**:
  - Thuyết minh việc gọi API `GET /api/v1/me` và `PUT /api/v1/me/password` để người dùng tự quản lý thông tin tài khoản cá nhân.

---

### Hình 14: Xử lý Khi Mất Kết nối Mạng (Offline Mode)
- **Figure ID**: `HÌNH 4.14`
- **Tên hình**: Giao diện ứng dụng trong trạng thái Ngoại tuyến
- **Màn hình**: `SCR-PRJ-01: Project List Screen`
- **Trạng thái**: `OFFLINE`
- **Dữ liệu mẫu**: Dải băng màu cam `#D97706` phía trên: *"Bạn đang ngoại tuyến. Dữ liệu hiển thị từ bộ nhớ đệm."*
- **Nội dung thuyết minh trong báo cáo**:
  - Phân tích khả năng chống chịu sự cố mạng (Fault Tolerance) của ứng dụng di động: Sử dụng cơ chế cache cục bộ và NetInfo để cảnh báo người dùng thay vì báo lỗi gián đoạn ứng dụng.

---

### Hình 15: Màn hình Từ chối Truy cập (Permission Denied)
- **Figure ID**: `HÌNH 4.15`
- **Tên hình**: Phản hồi khi người dùng không đủ quyền truy cập tính năng
- **Màn hình**: `PermissionDeniedState`
- **Trạng thái**: `PERMISSION_DENIED` (HTTP 403 Forbidden)
- **Dữ liệu mẫu**: Icon ổ khóa màu đỏ xám, thông điệp: *"Bạn không có quyền xem dữ liệu này. Vui lòng liên hệ Quản trị viên để được cấp quyền."*, nút bấm *"Quay lại"*.
- **Nội dung thuyết minh trong báo cáo**:
  - Trình bày kiến trúc phân quyền RBAC (Role-Based Access Control) chặt chẽ giữa Backend và Mobile, chứng minh tính bảo mật đa tầng của hệ thống.
