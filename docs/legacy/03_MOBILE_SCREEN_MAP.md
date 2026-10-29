# BẢN ĐỒ MÀN HÌNH MOBILE WORKSPHERE

## 1. Mục đích

Tài liệu xác định các màn hình của ứng dụng WorkSphere, quyền truy cập, dữ liệu đầu vào và hướng điều hướng.

Không tự ý tạo màn hình mới khi chưa cập nhật tài liệu này.

---

## 2. Cấu trúc điều hướng chính

Ứng dụng sử dụng ba cấp điều hướng:

1. Root Navigator
2. Authentication Navigator
3. Main Application Navigator

Sơ đồ tổng quát:

Root Navigator
├── Splash Screen
├── Authentication Navigator
│   ├── Login Screen
│   └── Forgot Password Screen
└── Main Application Navigator
    ├── Bottom Tab Navigator
    │   ├── Dashboard
    │   ├── Projects
    │   ├── Tasks
    │   ├── Service Requests
    │   └── More
    └── Detail Screens

---

## 3. Root Navigator

### 3.1. Splash Screen

Mục đích:

- Kiểm tra phiên đăng nhập.
- Kiểm tra access token và refresh token.
- Tải cấu hình ứng dụng cơ bản.
- Điều hướng đến Login hoặc Main Application.

Điều hướng:

- Chưa đăng nhập → Login Screen.
- Đã đăng nhập hợp lệ → Dashboard Screen.
- Refresh token không hợp lệ → Login Screen.

Không hiển thị Splash Screen như một tab trong ứng dụng.

---

## 4. Authentication Navigator

### 4.1. Login Screen

Chức năng:

- Nhập email hoặc tên đăng nhập.
- Nhập mật khẩu.
- Ẩn hoặc hiện mật khẩu.
- Gửi yêu cầu đăng nhập.
- Hiển thị lỗi đăng nhập.
- Chuyển đến Quên mật khẩu.

Điều hướng:

- Đăng nhập thành công → Dashboard Screen.
- Chọn Quên mật khẩu → Forgot Password Screen.

### 4.2. Forgot Password Screen

Chức năng:

- Nhập email.
- Gửi yêu cầu đặt lại mật khẩu.
- Hiển thị kết quả gửi yêu cầu.

Điều hướng:

- Quay lại → Login Screen.

---

## 5. Bottom Tab Navigator

Thanh điều hướng dưới gồm năm tab:

1. Dashboard
2. Dự án
3. Công việc
4. Yêu cầu
5. Thêm

Tab Thêm mở các chức năng:

- Tài sản
- Thông báo
- Hồ sơ
- Cài đặt
- Quản trị, nếu có quyền

---

## 6. Dashboard Module

### 6.1. Dashboard Screen

Quyền truy cập:

- Tất cả người dùng đã đăng nhập.

Hiển thị:

- Thông tin chào người dùng.
- Số công việc cần thực hiện.
- Số công việc đang thực hiện.
- Số công việc quá hạn.
- Số yêu cầu dịch vụ đang xử lý.
- Danh sách công việc sắp đến hạn.
- Tiến độ các dự án đang tham gia.
- Thông báo gần nhất.

Điều hướng:

- Chọn dự án → Project Detail Screen.
- Chọn công việc → Task Detail Screen.
- Chọn yêu cầu → Service Request Detail Screen.
- Chọn thông báo → Notification Detail hoặc màn hình liên quan.
- Chọn Xem tất cả → màn hình danh sách tương ứng.

Trạng thái giao diện phải hỗ trợ:

- Loading
- Success
- Empty
- Error
- Refreshing

---

## 7. Project Module

### 7.1. Project List Screen

Quyền truy cập:

- Nhân viên
- Trưởng nhóm
- Quản lý dự án
- Quản trị viên khi được thêm vào dự án

Chức năng:

- Xem danh sách dự án được phép truy cập.
- Tìm kiếm theo tên.
- Lọc theo trạng thái.
- Làm mới danh sách.
- Phân trang.

Điều hướng:

- Chọn dự án → Project Detail Screen.
- Chọn Tạo dự án → Create Project Screen.

Nút Tạo dự án chỉ hiển thị cho:

- Quản lý dự án

### 7.2. Project Detail Screen

Dữ liệu đầu vào:

- projectId

Hiển thị:

- Tên dự án.
- Mô tả.
- Trạng thái.
- Ngày bắt đầu.
- Ngày kết thúc dự kiến.
- Tỷ lệ hoàn thành.
- Thành viên.
- Mốc tiến độ.
- Công việc gần đây.

Điều hướng:

- Chọn thành viên → Project Member List Screen.
- Chọn công việc → Task Detail Screen.
- Chọn Chỉnh sửa → Edit Project Screen.
- Chọn Thêm thành viên → Add Project Member Screen.

### 7.3. Create Project Screen

Quyền truy cập:

- Quản lý dự án

Trường dữ liệu:

- Tên dự án.
- Mô tả.
- Ngày bắt đầu.
- Ngày kết thúc dự kiến.
- Thành viên ban đầu.

Kết quả:

- Tạo thành công → Project Detail Screen.
- Thất bại → giữ dữ liệu biểu mẫu và hiển thị lỗi.

### 7.4. Edit Project Screen

Dữ liệu đầu vào:

- projectId

Quyền truy cập:

- Quản lý của dự án tương ứng

Cho phép:

- Sửa tên.
- Sửa mô tả.
- Sửa ngày dự kiến.
- Thay đổi trạng thái theo luồng hợp lệ.

### 7.5. Project Member List Screen

Dữ liệu đầu vào:

- projectId

Hiển thị:

- Danh sách thành viên.
- Vai trò trong dự án.
- Phòng ban.
- Trạng thái tài khoản.

### 7.6. Add Project Member Screen

Dữ liệu đầu vào:

- projectId

Quyền truy cập:

- Quản lý dự án

Chức năng:

- Tìm người dùng.
- Chọn vai trò trong dự án.
- Thêm thành viên.
- Không cho thêm trùng thành viên.

---

## 8. Task Module

### 8.1. Task List Screen

Quyền truy cập:

- Tất cả người dùng đã đăng nhập

Chức năng:

- Xem công việc liên quan.
- Tìm kiếm.
- Lọc theo dự án.
- Lọc theo trạng thái.
- Lọc theo mức độ ưu tiên.
- Lọc công việc quá hạn.
- Phân trang.

Điều hướng:

- Chọn công việc → Task Detail Screen.
- Chọn Tạo công việc → Create Task Screen.

Nút Tạo công việc chỉ hiển thị cho:

- Trưởng nhóm
- Quản lý dự án

### 8.2. Task Detail Screen

Dữ liệu đầu vào:

- taskId

Hiển thị:

- Tiêu đề.
- Mô tả.
- Dự án.
- Người thực hiện.
- Người tạo.
- Trạng thái.
- Mức độ ưu tiên.
- Thời hạn.
- Công việc con.
- Bình luận.
- Tệp đính kèm.
- Lịch sử trạng thái.

Cho phép:

- Cập nhật trạng thái nếu có quyền.
- Thêm bình luận.
- Thêm tệp đính kèm.
- Mở công việc con.
- Chỉnh sửa công việc nếu có quyền.

### 8.3. Create Task Screen

Quyền truy cập:

- Trưởng nhóm
- Quản lý dự án

Trường dữ liệu:

- Tiêu đề.
- Mô tả.
- Dự án.
- Người thực hiện.
- Mức độ ưu tiên.
- Thời hạn.
- Công việc cha, nếu có.

### 8.4. Edit Task Screen

Dữ liệu đầu vào:

- taskId

Quyền truy cập:

- Trưởng nhóm của nhóm liên quan
- Quản lý dự án tương ứng

### 8.5. Subtask List Screen

Dữ liệu đầu vào:

- parentTaskId

Chức năng:

- Xem các công việc con.
- Tạo công việc con.
- Mở chi tiết công việc con.

### 8.6. Task Comment Screen

Dữ liệu đầu vào:

- taskId

Chức năng:

- Xem danh sách bình luận.
- Thêm bình luận.
- Đính kèm tệp.
- Hiển thị thời gian và người bình luận.

---

## 9. Service Request Module

### 9.1. Service Request List Screen

Quyền truy cập:

- Tất cả người dùng đã đăng nhập

Chức năng:

- Xem yêu cầu do người dùng tạo.
- Xem yêu cầu được giao xử lý nếu có quyền.
- Tìm kiếm.
- Lọc theo danh mục.
- Lọc theo trạng thái.
- Lọc theo độ ưu tiên.
- Phân trang.

Điều hướng:

- Chọn yêu cầu → Service Request Detail Screen.
- Chọn Tạo yêu cầu → Create Service Request Screen.

### 9.2. Service Request Detail Screen

Dữ liệu đầu vào:

- requestId

Hiển thị:

- Mã yêu cầu.
- Tiêu đề.
- Nội dung.
- Người yêu cầu.
- Người xử lý.
- Danh mục.
- Mức độ ưu tiên.
- Trạng thái.
- Tài sản liên quan.
- Bình luận.
- Tệp đính kèm.
- Lịch sử trạng thái.
- Đánh giá sau xử lý.

#### Từ chối kết quả xử lý

Mục đích:

Cho phép người tạo yêu cầu thông báo rằng kết quả xử lý chưa giải quyết được vấn đề.

Điều kiện hiển thị:

```text
Service Request đang ở trạng thái RESOLVED
+ người dùng hiện tại là requester
+ allowedActions chứa REJECT_RESOLUTION
```

Không hiển thị thao tác này khi yêu cầu ở trạng thái:

```text
OPEN
ASSIGNED
IN_PROGRESS
WAITING_FOR_USER
CLOSED
CANCELLED
```

Thành phần giao diện:

- Nút `Từ chối kết quả`.
- Hộp thoại xác nhận.
- Trường nhập lý do.
- Bộ đếm số ký tự.
- Nút `Hủy`.
- Nút `Xác nhận từ chối`.
- Trạng thái đang gửi.
- Thông báo lỗi.
- Thông báo thành công.

Quy tắc nhập liệu:

```text
reason: bắt buộc
reason: sau khi trim không được rỗng
reason: tối đa 1000 ký tự
```

Luồng thao tác:

```text
Người dùng mở Service Request Detail
→ yêu cầu đang RESOLVED
→ bấm Từ chối kết quả
→ nhập reason
→ xác nhận
→ mobile gửi request
→ backend kiểm tra requester, version và trạng thái
→ thành công: tải lại Service Request Detail
→ trạng thái hiển thị thành IN_PROGRESS
```

API:

```http
POST /service-requests/{requestId}/reject-resolution
```

Request:

```json
{
  "reason": "Sự cố vẫn còn xảy ra",
  "version": 3
}
```

Xử lý response thành công:

- Đóng hộp thoại.
- Hiển thị thông báo thành công.
- Cập nhật hoặc tải lại dữ liệu chi tiết.
- Hiển thị trạng thái mới `IN_PROGRESS`.
- Không tạo Service Request mới.
- Không tự điều hướng sang màn hình Create Service Request.

Xử lý lỗi:

```text
SERVICE_RESOLUTION_REJECTION_FORBIDDEN
→ thông báo người dùng không phải requester hoặc không có quyền thực hiện

SERVICE_NOT_RESOLVED
→ thông báo yêu cầu không còn ở trạng thái RESOLVED và tải lại dữ liệu

SERVICE_ALREADY_CLOSED
→ thông báo yêu cầu đã đóng và tải lại dữ liệu

SERVICE_ALREADY_CANCELLED
→ thông báo yêu cầu đã bị hủy và tải lại dữ liệu

OPTIMISTIC_LOCK_CONFLICT
→ thông báo dữ liệu đã được cập nhật bởi người khác và tải lại phiên bản mới

NETWORK_ERROR
→ giữ nguyên reason để người dùng có thể thử lại
```

Trạng thái giao diện bắt buộc:

- `Idle`: chưa mở hộp thoại.
- `Editing`: đang nhập reason.
- `Submitting`: khóa nút xác nhận và hiển thị loading.
- `Success`: đóng hộp thoại và tải lại dữ liệu.
- `Error`: hiển thị lỗi nhưng giữ nguyên reason.

Quy tắc bảo mật:

- Mobile chỉ hiển thị nút dựa trên `allowedActions` và ownership đã biết.
- Mobile không tự quyết định requester cuối cùng.
- Mobile không tự chuyển trạng thái dữ liệu nếu API chưa thành công.
- Backend là nơi kiểm tra Resource Ownership và quyết định chuyển `RESOLVED → IN_PROGRESS`.
- Không log nội dung reason nếu log có thể chứa thông tin nhạy cảm.

Accessibility:

- Nút phải có accessibility label `Từ chối kết quả xử lý`.
- Trường reason phải có label và error message được Screen Reader đọc.
- Không chỉ dùng màu để biểu diễn trạng thái lỗi.

### 9.3. Create Service Request Screen

Trường dữ liệu:

- Danh mục.
- Tiêu đề.
- Nội dung.
- Mức độ ưu tiên.
- Tài sản liên quan, nếu có.
- Ảnh hoặc tệp đính kèm.

Kết quả:

- Tạo thành công → Service Request Detail Screen.
- Thất bại → giữ bản nháp và hiển thị lỗi.

### 9.4. Service Request Comment Screen

Dữ liệu đầu vào:

- requestId

Chức năng:

- Xem trao đổi.
- Thêm bình luận.
- Đính kèm hình ảnh.
- Làm mới dữ liệu.

### 9.5. Service Rating Screen

Dữ liệu đầu vào:

- requestId

Điều kiện truy cập:

- Yêu cầu ở trạng thái CLOSED.
- Người đánh giá là người tạo yêu cầu.
- Yêu cầu chưa được đánh giá.

Trường dữ liệu:

- Số sao.
- Nội dung nhận xét.

---

## 10. Asset Module

### 10.0. Phạm vi và mức ưu tiên

Phân loại:

```text
Asset List Screen   → P0
Asset Detail Screen → P0
Create Asset Screen → P1
Edit Asset Screen   → P1
Asset Assignment    → P1
Return Asset        → P1
```

Quy tắc:

- P0 phục vụ nhân viên xem tài sản được cấp và báo hỏng.
- P1 phục vụ người có quyền `ASSET_MANAGE`.
- Các màn hình P1 chỉ được triển khai sau khi luồng mobile cốt lõi đã ổn định.
- Mobile ẩn màn hình và thao tác P1 khi người dùng không có quyền.
- Backend vẫn là nơi kiểm tra quyền cuối cùng.
- Không đưa chức năng quản trị tài sản vào luồng chính của người dùng thông thường.

### 10.1. Asset List Screen

Quyền truy cập:

- Tất cả người dùng đã đăng nhập

Nhân viên chỉ xem:

- Tài sản đang được giao cho bản thân.

Quản trị viên có thể xem:

- Toàn bộ tài sản.

Chức năng:

- Danh sách tài sản.
- Tìm kiếm.
- Lọc theo loại.
- Lọc theo trạng thái.

### 10.2. Asset Detail Screen

Dữ liệu đầu vào:

- assetId

Hiển thị:

- Mã tài sản.
- Tên tài sản.
- Loại tài sản.
- Trạng thái.
- Người đang sử dụng.
- Ngày cấp phát.
- Lịch sử sửa chữa.
- Yêu cầu dịch vụ liên quan.

Điều hướng:

- Chọn Báo hỏng → Create Service Request Screen.
- Chọn yêu cầu liên quan → Service Request Detail Screen.

---

#### Thao tác quản trị P1

Khi người dùng có `ASSET_MANAGE` và `allowedActions` phù hợp, Asset Detail có thể hiển thị:

- Sửa tài sản.
- Cấp phát tài sản khi trạng thái là `AVAILABLE`.
- Thu hồi tài sản khi có assignment đang hoạt động.

Các thao tác điều hướng:

```text
Sửa tài sản
→ Edit Asset Screen
→ truyền assetId

Cấp phát tài sản
→ Asset Assignment Screen
→ truyền assetId

Thu hồi tài sản
→ Return Asset Screen
→ truyền assetId và assignmentId
```

Không hiển thị các thao tác này cho người dùng thông thường.

### 10.3. Create Asset Screen

Mức ưu tiên:

```text
P1
```

Quyền hiển thị:

```text
ASSET_MANAGE
```

Mục đích:

Cho phép người có quyền tạo tài sản mới trong hệ thống.

Dữ liệu đầu vào:

```text
categoryId
assetCode
name
serialNumber
purchaseDate
purchasePrice
warrantyExpiryDate
description
```

Thành phần giao diện:

- Dropdown loại tài sản.
- Trường mã tài sản.
- Trường tên tài sản.
- Trường serial number.
- Date Picker ngày mua.
- Trường giá mua.
- Date Picker ngày hết hạn bảo hành.
- Trường mô tả.
- Nút Hủy.
- Nút Tạo tài sản.
- Loading khi submit.
- Lỗi validation theo từng field.

API tải loại tài sản:

```http
GET /asset-categories
```

API tạo tài sản:

```http
POST /assets
```

Quy tắc:

- `categoryId`, `assetCode` và `name` là bắt buộc.
- Không hard-code danh sách loại tài sản.
- Không cho submit nhiều lần.
- Giữ dữ liệu form khi API thất bại.
- Thành công thì điều hướng đến Asset Detail của tài sản vừa tạo.
- Không truyền toàn bộ Asset object qua navigation, chỉ truyền `assetId`.

### 10.4. Edit Asset Screen

Mức ưu tiên:

```text
P1
```

Quyền hiển thị:

```text
ASSET_MANAGE
```

Dữ liệu điều hướng:

```text
assetId
```

Luồng tải dữ liệu:

```text
Nhận assetId
→ gọi GET /assets/{assetId}
→ hiển thị dữ liệu mới nhất
→ người dùng chỉnh sửa
→ gửi version hiện tại
```

API cập nhật:

```http
PUT /assets/{assetId}
```

Quy tắc:

- Không truyền toàn bộ Asset object qua navigation.
- Form phải có Loading, Error và Retry.
- Request cập nhật phải gửi `version`.
- Khi gặp `OPTIMISTIC_LOCK_CONFLICT`, thông báo dữ liệu đã thay đổi và tải lại bản mới.
- Không ghi đè dữ liệu khi version không khớp.
- Giữ dữ liệu form nếu lỗi mạng.
- Thành công thì quay lại Asset Detail và refresh dữ liệu.

### 10.5. Asset Assignment Screen

Mức ưu tiên:

```text
P1
```

Quyền hiển thị:

```text
ASSET_MANAGE
```

Điều kiện hiển thị:

- Tài sản đang ở trạng thái `AVAILABLE`.
- Người dùng có quyền `ASSET_MANAGE`.
- `allowedActions` chứa thao tác cấp phát tương ứng nếu API trả dữ liệu này.

Dữ liệu điều hướng:

```text
assetId
```

Dữ liệu đầu vào:

```text
userId
assignedAt
expectedReturnAt
note
```

API:

```http
POST /assets/{assetId}/assignments
```

Quy tắc:

- Không cấp phát tài sản đang `ASSIGNED`, `MAINTENANCE`, `BROKEN` hoặc `RETIRED`.
- Người nhận phải được chọn từ nguồn dữ liệu hợp lệ, không nhập UUID thủ công.
- Không submit nhiều lần.
- API cấp phát phải sử dụng `Idempotency-Key` nếu API Contract yêu cầu.
- Thành công thì tải lại Asset Detail.
- Mobile không tự đổi trạng thái tài sản trước khi API thành công.
- Backend kiểm tra quyền và trạng thái cuối cùng.

Xử lý lỗi:

- Tài sản không còn khả dụng: thông báo và tải lại dữ liệu.
- Người dùng nhận tài sản không hợp lệ: hiển thị lỗi.
- Idempotency conflict: không gửi lại tự động vô hạn.
- Network error: giữ nguyên dữ liệu đã nhập.

### 10.6. Return Asset Screen

Mức ưu tiên:

```text
P1
```

Quyền hiển thị:

```text
ASSET_MANAGE
```

Điều kiện hiển thị:

- Tài sản đang có assignment hoạt động.
- Người dùng có quyền `ASSET_MANAGE`.
- Có `assignmentId` hợp lệ.

Dữ liệu điều hướng:

```text
assetId
assignmentId
```

Dữ liệu đầu vào:

```text
returnedAt
condition
note
version
```

API:

```http
PUT /assets/{assetId}/assignments/{assignmentId}/return
```

Quy tắc:

- Không cho trả lại assignment đã kết thúc.
- Phải gửi `version` khi API yêu cầu Optimistic Locking.
- Điều kiện tài sản sau khi trả phải được chọn từ giá trị API hỗ trợ.
- Mobile không tự đặt tài sản về `AVAILABLE` trước khi API thành công.
- Thành công thì quay về Asset Detail và tải lại dữ liệu.
- Khi gặp conflict, hiển thị lỗi và tải dữ liệu mới nhất.
- Backend kiểm tra assignment đang hoạt động và quyền cuối cùng.

## 11. Notification Module

### 11.1. Notification List Screen

Quyền truy cập:

- Tất cả người dùng đã đăng nhập

Chức năng:

- Xem danh sách thông báo.
- Phân biệt đã đọc và chưa đọc.
- Đánh dấu một thông báo đã đọc.
- Đánh dấu tất cả đã đọc.
- Làm mới danh sách.
- Phân trang.

Khi chọn thông báo:

- Thông báo dự án → Project Detail Screen.
- Thông báo công việc → Task Detail Screen.
- Thông báo yêu cầu → Service Request Detail Screen.
- Thông báo tài sản → Asset Detail Screen.

---

## 12. Profile và Settings Module

### 12.1. Profile Screen

Hiển thị:

- Ảnh đại diện.
- Họ tên.
- Email.
- Phòng ban.
- Vai trò.
- Số điện thoại.

Cho phép:

- Cập nhật thông tin được phép.
- Đổi mật khẩu.
- Đăng xuất.

### 12.2. Change Password Screen

Trường dữ liệu:

- Mật khẩu hiện tại.
- Mật khẩu mới.
- Xác nhận mật khẩu mới.

### 12.3. Settings Screen

Cho phép:

- Bật hoặc tắt một số loại thông báo.
- Chọn giao diện sáng hoặc tối nếu được triển khai.
- Xem phiên bản ứng dụng.
- Xem chính sách sử dụng.
- Đăng xuất.

---

## 13. Admin Module

Các màn hình quản trị không hiển thị cho người dùng không có quyền ADMIN.

### 13.0. Phạm vi và mức ưu tiên

Mức ưu tiên:

```text
P1
```

Admin Module không thuộc Mobile Core P0.

Các màn hình Admin Mobile:

```text
User Management Screen       → P1
Department Management Screen → P1
Category Management Screen   → P1
```

Mobile Core P0 phải được hoàn thành trước:

```text
Authentication
Dashboard
Project
Task
Service Request
Asset List
Asset Detail
Notification
Profile
```

Quy tắc:

- Chỉ triển khai Admin Module sau khi Mobile Core P0 hoạt động ổn định.
- Mobile Core P0 phải đạt Definition of Done trước khi ưu tiên Admin Module.
- Admin Module không được chặn việc trình diễn nghiệp vụ mobile cốt lõi.
- Admin Module chỉ hiển thị khi người dùng có permission phù hợp.
- System Role `ADMIN` không thay thế permission của từng endpoint.
- Mobile chỉ ẩn hoặc hiện màn hình để cải thiện trải nghiệm.
- Backend là nơi kiểm tra quyền cuối cùng.
- Không đưa Admin Module vào Main Tab của người dùng thông thường.
- Admin Module có thể được truy cập từ More hoặc Settings khi có quyền.
- Không tạo ứng dụng mobile quản trị riêng trong MVP.

### 13.1. User Management Screen

Mức ưu tiên:

```text
P1
```

- Xem danh sách người dùng.
- Tìm kiếm và lọc.
- Khoá hoặc mở khoá.
- Xem chi tiết người dùng.

### 13.2. Department Management Screen

Mức ưu tiên:

```text
P1
```

- Xem phòng ban.
- Tạo và cập nhật phòng ban.
- Ngừng hoạt động phòng ban.

### 13.3. Category Management Screen

Mức ưu tiên:

```text
P1
```

- Quản lý danh mục yêu cầu.
- Quản lý loại tài sản.
- Quản lý các danh mục dùng chung.

---

### 13.4. Quy tắc truy cập Admin Module

User Management Screen yêu cầu ít nhất một trong các permission:

```text
USER_READ
USER_MANAGE
```

Các thao tác tạo, cập nhật, khóa hoặc mở khóa người dùng yêu cầu:

```text
USER_MANAGE
```

Người chỉ có `USER_READ` được xem dữ liệu được phép nhưng không được thực hiện thao tác yêu cầu `USER_MANAGE`.

Department Management Screen yêu cầu:

```text
DEPARTMENT_MANAGE
```

Category Management Screen sử dụng permission theo loại danh mục:

```text
Danh mục yêu cầu dịch vụ
→ SERVICE_CATEGORY_MANAGE

Loại tài sản
→ ASSET_CATEGORY_MANAGE
```

Quy tắc hiển thị:

- Không sử dụng duy nhất System Role `ADMIN` để thay thế permission.
- Mobile dùng permission để quyết định hiển thị màn hình, tab và nút thao tác.
- Backend phải kiểm tra permission tại từng endpoint.
- Backend là nơi quyết định quyền cuối cùng.
- `SERVICE_CATEGORY_MANAGE` không thay thế `SERVICE_REQUEST_ASSIGN`.
- `ASSET_CATEGORY_MANAGE` không thay thế `ASSET_MANAGE`.
- Không hiển thị User Management nếu người dùng không có `USER_READ` hoặc `USER_MANAGE`.
- Không hiển thị Department Management nếu người dùng không có `DEPARTMENT_MANAGE`.
- Không hiển thị Category Management nếu người dùng không có ít nhất một permission quản lý danh mục.
- Nếu người dùng chỉ có `SERVICE_CATEGORY_MANAGE`, chỉ hiển thị phần danh mục yêu cầu dịch vụ.
- Nếu người dùng chỉ có `ASSET_CATEGORY_MANAGE`, chỉ hiển thị phần loại tài sản.
- Không lưu permission từ phiên đăng nhập cũ sau khi đăng xuất.
- Sau khi đăng nhập hoặc refresh thông tin người dùng, mobile phải cập nhật permission hiện tại.
- Mobile không được tự cấp permission hoặc suy luận quyền chỉ từ tên role.

Trạng thái giao diện:

- `Loading`: đang tải thông tin permission hoặc dữ liệu quản trị.
- `Content`: người dùng có permission và dữ liệu tải thành công.
- `Empty`: có quyền nhưng chưa có dữ liệu.
- `Error`: tải dữ liệu thất bại.
- `Forbidden`: backend trả lỗi không có quyền.
- `Refreshing`: đang tải lại dữ liệu.

Xử lý lỗi quyền:

```text
HTTP 401
→ xóa phiên khi refresh token không còn hợp lệ
→ điều hướng về Login

HTTP 403
→ không xóa phiên
→ hiển thị thông báo không có quyền
→ ẩn thao tác không còn được phép
→ tải lại thông tin permission khi phù hợp
```

Việc mobile ẩn màn hình hoặc nút không thay thế kiểm tra quyền của backend.

## 14. Dữ liệu điều hướng

Các màn hình chỉ nhận ID tối thiểu qua Navigation.

Ví dụ:

- Project Detail nhận projectId.
- Task Detail nhận taskId.
- Service Request Detail nhận requestId.
- Asset Detail nhận assetId.

Không truyền toàn bộ object lớn giữa các màn hình.

Màn hình đích phải tải dữ liệu mới nhất từ API bằng ID.

---

## 15. Trạng thái giao diện bắt buộc

Mỗi màn hình có dữ liệu động phải xử lý:

### Loading

Dữ liệu đang được tải.

### Success

Dữ liệu tải thành công.

### Empty

API thành công nhưng không có dữ liệu.

### Error

API thất bại hoặc mất kết nối.

### Refreshing

Người dùng đang kéo để làm mới dữ liệu.

### Loading More

Danh sách đang tải trang tiếp theo.

Không hiển thị màn hình trống mà không giải thích trạng thái.

---

## 16. Thành phần giao diện tái sử dụng

Các component dự kiến:

- AppButton
- AppTextInput
- PasswordInput
- SearchBar
- FilterChip
- StatusBadge
- PriorityBadge
- UserAvatar
- ProjectCard
- TaskCard
- ServiceRequestCard
- AssetCard
- NotificationItem
- EmptyState
- ErrorState
- LoadingIndicator
- ConfirmationDialog
- AttachmentPicker
- PaginationFooter

Không tạo nhiều component khác nhau có cùng mục đích.

---

## 17. Quy tắc màn hình

- Mỗi màn hình chỉ chịu trách nhiệm cho một nhóm nghiệp vụ rõ ràng.
- Không gọi API trực tiếp trong component giao diện nếu đã có service hoặc hook.
- Không lưu token trong biến giao diện.
- Không hiển thị nút nếu người dùng không có quyền.
- Backend vẫn phải kiểm tra quyền dù nút đã bị ẩn.
- Form phải kiểm tra dữ liệu trước khi gửi.
- Khi gửi form, phải ngăn người dùng bấm nhiều lần.
- Thông báo lỗi phải dễ hiểu.
- Danh sách dài phải sử dụng phân trang hoặc tải thêm.
- Màn hình chi tiết phải có thao tác làm mới.
- Khi dữ liệu thay đổi, màn hình trước phải được cập nhật phù hợp.





Giải thích một số thuật ngữ
Navigator là thành phần quản lý việc chuyển đổi giữa các màn hình.
Root Navigator là bộ điều hướng cao nhất, quyết định hiển thị màn hình đăng nhập hay ứng dụng chính.
Bottom Tab Navigator là thanh chuyển mục nằm ở cạnh dưới ứng dụng.
Stack Navigator quản lý các màn hình theo dạng chồng lớp, ví dụ danh sách → chi tiết → chỉnh sửa.
Component là thành phần giao diện có thể tái sử dụng.
Hook là hàm React đóng gói trạng thái hoặc logic dùng chung.
Pull to refresh là thao tác kéo danh sách xuống để tải lại dữ liệu.