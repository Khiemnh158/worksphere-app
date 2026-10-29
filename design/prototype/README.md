# WorkSphere Mobile - Visual Prototype & Review Studio

Tài liệu hướng dẫn trải nghiệm, vận hành và nghiệm thu bản mẫu trực quan (**Visual Prototype**) cho ứng dụng di động WorkSphere Mobile trước khi chuyển sang lập trình React Native.

---

## 1. Mục đích của Visual Prototype

Bản mẫu trực quan này được xây dựng nhằm:
1. **Trực quan hóa thiết kế trước khi code**: Giúp người đánh giá (reviewer, giảng viên, team lập trình) tương tác thực tế với bố cục, phân cấp thị giác, màu sắc và typography theo đúng chuẩn [design/05_DESIGN_SYSTEM.md](file:///d:/WorkSphere/design/05_DESIGN_SYSTEM.md).
2. **Kiểm chứng 12 trạng thái giao diện**: Xác minh đầy đủ các trạng thái `SUCCESS`, `LOADING`, `SKELETON`, `EMPTY`, `ERROR`, `OFFLINE`, `REFRESHING`, `LOADING_MORE`, `PERMISSION_DENIED`, `VALIDATION_ERROR`, `SUBMITTING`, và `OPTIMISTIC_LOCK_CONFLICT` theo đúng [design/07_UI_STATE_MATRIX.md](file:///d:/WorkSphere/design/07_UI_STATE_MATRIX.md).
3. **Minh họa quy tắc bất biến hệ thống**: Trình diễn xử lý trực quan cảnh báo xung đột phiên bản dữ liệu (HTTP 409 Conflict) và ngăn chặn xóa/giáng cấp Project Manager duy nhất (Quy tắc bất biến D-013).
4. **Không phụ thuộc backend thật**: Sử dụng bộ dữ liệu mẫu cục bộ độc lập tại `data/sample-data.js`, hoàn toàn không gọi API bên ngoài, không yêu cầu cài đặt framework nặng.

---

## 2. Cách mở và Trải nghiệm Prototype

### Cách 1: Mở trực tiếp bằng Trình duyệt Web
Bạn có thể mở trực tiếp file `index.html` bằng bất kỳ trình duyệt hiện đại nào (Chrome, Edge, Firefox):
```text
file:///D:/WorkSphere/design/prototype/index.html
```

### Cách 2: Chạy qua Local HTTP Server (Node.js)
Trong terminal tại thư mục gốc dự án:
```powershell
node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{let p=path.join('design/prototype',req.url==='/'?'index.html':req.url);fs.readFile(p,(e,d)=>{if(e){res.writeHead(404);res.end('Not found');}else{let ext=path.extname(p);res.writeHead(200,{'Content-Type':ext==='.css'?'text/css':ext==='.js'?'application/javascript':'text/html'});res.end(d);}});}).listen(8088,()=>console.log('Prototype running at http://localhost:8088'));"
```
Mở trình duyệt truy cập: `http://localhost:8088`

---

## 3. Khung nhìn Thiết bị và Khả năng Tương thích

Bản mẫu hỗ trợ hai khung nhìn chuẩn tham chiếu theo môi trường kiểm thử thực tế:
- **Khung nhìn chuẩn tham chiếu (Default Viewport)**: **411 × 914 dp**
  - Tương ứng với thiết bị máy ảo Android Emulator đã xác thực: `emulator-5554` (Android 15, API Level 35, 1080 × 2400 pixels, mật độ 420 dpi).
  - Tích hợp mô phỏng thanh trạng thái Android 15 Edge-to-Edge và thanh điều hướng cử chỉ (Gesture Navigation Inset).
- **Khung nhìn kiểm tra co giãn (Responsive Viewport)**: **360 × 800 dp**
  - Đại diện cho các dòng máy Android màn hình tiêu chuẩn (Small/Medium).
  - Chuyển đổi linh hoạt thông qua nút bấm trên Bảng điều khiển Review.

---

## 4. Bảng Ánh xạ Duy nhất Màn hình & Artifacts (Unified Artifact Mapping)

Bảng đối chiếu chuẩn hóa duy nhất giữa Prototype ID và Screen ID của hệ thống tài liệu thiết kế ([design/02_SCREEN_INVENTORY.md](file:///d:/WorkSphere/design/02_SCREEN_INVENTORY.md) & [docs/03_MOBILE_SCREEN_MAP.md](file:///d:/WorkSphere/docs/03_MOBILE_SCREEN_MAP.md)):

| Prototype ID | Screen ID | Tên màn hình | Loại artifact | Backend readiness | API dependency | Backend Controller |
|---|---|---|---|---|---|---|
| `CORE-01` | `SCR-AUTH-02` | Đăng nhập | Full Screen | `IMPLEMENTED_AND_TESTED` | `POST /api/v1/auth/login` | `AuthController` |
| `CORE-02` | `SCR-MAIN-01` | Tổng quan Dashboard | Full Screen | `BLOCKED_BY_GAP` | `GET /api/v1/dashboard/me` | None (`DASHBOARD_AGGREGATED_API_GAP`) |
| `CORE-03` | `SCR-PRJ-01` | Danh sách Dự án | Full Screen | `IMPLEMENTED_AND_TESTED` | `GET /api/v1/projects` | `ProjectController` |
| `CORE-04` | `SCR-PRJ-02` | Chi tiết Dự án | Full Screen | `IMPLEMENTED_AND_TESTED` | `GET /api/v1/projects/{projectId}` | `ProjectController` |
| `CORE-05` | `SCR-PRJ-05` | Đổi trạng thái Dự án | Bottom Sheet | `IMPLEMENTED_AND_TESTED` | `PUT /api/v1/projects/{projectId}/status` | `ProjectController` |
| `CORE-06` | `SCR-PRJ-06` | Thành viên Dự án | Full Screen | `IMPLEMENTED_AND_TESTED` | `GET /api/v1/projects/{projectId}/members` | `ProjectController` |
| `CORE-07` | `SCR-PRJ-08` | Mốc tiến độ | Full Screen | `IMPLEMENTED_AND_TESTED` | `GET /api/v1/projects/{projectId}/milestones` | `ProjectController` |
| `CORE-08` | `SCR-PRJ-09` | Tạo mốc mới | Full Screen | `IMPLEMENTED_AND_TESTED` | `POST /api/v1/projects/{projectId}/milestones` | `ProjectController` |
| `CORE-09` | `SCR-ACC-01` | Hồ sơ cá nhân | Full Screen | `IMPLEMENTED_AND_TESTED` | `GET /api/v1/me` | `MeController` |
| `CORE-10` | `SCR-ACC-02` | Đổi mật khẩu | Full Screen | `IMPLEMENTED_NOT_FULLY_TESTED` | `PUT /api/v1/me/password` | `MeController` |
| `CORE-11` | `SCR-MAIN-03` | Thêm / Cài đặt | Full Screen | `CLIENT_LAYOUT` | None (Client navigation) | Client Navigator (`SCR-MAIN-02`) |
| `CORE-12` | `SCR-ACC-04` | Hộp thoại Đăng xuất | Dialog | `IMPLEMENTED_AND_TESTED` | `POST /api/v1/auth/logout` | `AuthController` |
| `MODAL-OPT-LOCK` | N/A | Xung đột Khóa lạc quan | Dialog | `IMPLEMENTED_AND_TESTED` | `PUT /api/v1/projects/{id}` (409) | `ProjectController` |
| `MODAL-PM-GUARD` | N/A | Cảnh báo PM cuối cùng | Dialog | `IMPLEMENTED_AND_TESTED` | Quy tắc bất biến hệ thống D-013 | `ProjectController` |

> [!NOTE]
> **Controller Name Audit**: Kiểm tra mã nguồn thực tế tại `backend/src/main/java/com/worksphere/project/web` xác nhận toàn bộ các endpoint Dự án, Thành viên dự án và Mốc tiến độ (Milestone) đều nằm tập trung trong một REST controller duy nhất là `ProjectController.java`. Không tồn tại các class `ProjectMemberController` hay `MilestoneController` độc lập.

---

## 5. Phân định Trạng thái Giao diện (UI State Classification)

Để đảm bảo tính chính xác và không gây hiểu nhầm các trạng thái là các route màn hình riêng biệt:

- **11 Page-level UI States**:
  1. `SUCCESS`: Dữ liệu tải thành công, hiển thị toàn bộ thành phần giao diện.
  2. `LOADING`: Trạng thái spinner quay toàn màn hình / khối dữ liệu.
  3. `SKELETON`: Khung xương shimmer gradient thay thế các thẻ trong thời gian chờ.
  4. `EMPTY`: Danh sách trống dữ liệu kèm hình minh họa và nút gọi hành động.
  5. `ERROR`: Lỗi máy chủ (HTTP 500) hoặc lỗi mạng kèm nút thử lại (Retry).
  6. `OFFLINE`: Biểu ngữ (banner) cảnh báo ngoại tuyến, dữ liệu đọc từ cache.
  7. `REFRESHING`: Kéo xuống để làm mới (Pull-to-refresh) với spinner đầu trang.
  8. `LOADING_MORE`: Tải thêm phân trang ở cuối danh sách (Infinite scroll spinner).
  9. `PERMISSION_DENIED`: Lỗi 403 Forbidden kèm hướng dẫn liên hệ Admin.
  10. `VALIDATION_ERROR`: Form nhập liệu có trường lỗi (viền đỏ, thông báo lỗi bên dưới).
  11. `SUBMITTING`: Nút bấm chuyển sang spinner đang gửi yêu cầu và vô hiệu hóa form.

- **4 Modal / Dialog Components & States**:
  1. `CORE-05` (`SCR-PRJ-05`): Bottom sheet chuyển trạng thái dự án theo máy trạng thái.
  2. `CORE-12` (`SCR-ACC-04`): Dialog xác nhận đăng xuất người dùng khỏi ứng dụng.
  3. `MODAL-OPT-LOCK` (`OPTIMISTIC_LOCK_CONFLICT`): Dialog xuất hiện trên màn hình hiện tại khi phát hiện xung đột version (HTTP 409), không phải là full-screen route.
  4. `MODAL-PM-GUARD` (`final-pm-alert`): Dialog cảnh báo ngăn chặn vi phạm quy tắc bất biến D-013.

- **Tổng số Review States**: **12 trạng thái UI Matrix** được hỗ trợ tương tác và mô phỏng trên Review Panel.

---

## 6. Dữ liệu Mẫu (Sample Data Policy)

- Toàn bộ dữ liệu nằm trong file `data/sample-data.js` mang nhãn **DỮ LIỆU MINH HỌA**.
- Sử dụng các tên giả định thuần túy học thuật: *Nguyễn An*, *Trần Bình*, *Lê Minh*, *Phạm Thu*.
- Mã dự án mẫu: `WS-MOBILE`, `WS-BACKEND`, `SEC-AUDIT-Q4`, `HR-PORTAL`.
- Tuyệt đối không chứa tài khoản thật, mật khẩu thật, JWT token thật hoặc bất kỳ thông tin cá nhân nhạy cảm nào.

---

## 7. Review Artifacts & Screenshot Policy

- Các ảnh screenshot tại `review-output/*.png` là tài liệu kiểm thử trực quan cục bộ (review artifacts), được loại trừ qua `review-output/.gitignore` để không làm phình dung lượng git repository.
- Ảnh chính thức sử dụng cho báo cáo học phần môn học sẽ được chọn lọc và sao chép có kiểm soát vào `reports/screenshots/` trong nhiệm vụ được phê duyệt sau.
