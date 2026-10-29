# 04. WIREFRAME SPECIFICATION - WORKSPHERE MOBILE

Tài liệu này định nghĩa bố cục khung xương trực quan (Text Wireframes) cho các màn hình then chốt của ứng dụng WorkSphere Mobile, chuẩn hóa theo khổ hiển thị chuẩn thiết bị Android (360 × 800 dp) và hỗ trợ Auto Layout Figma.

---

## 1. Màn hình Đăng nhập (Login Screen - SCR-AUTH-02)

```text
+--------------------------------------------------+
| [Status Bar: 24dp]                               |
+--------------------------------------------------+
|                                                  |
|                  [ Logo WorkSphere ]             |
|              Nền tảng Quản trị Doanh nghiệp     |
|                                                  |
|  [Form Error Banner nếu có lỗi]                  |
|                                                  |
|  Tên đăng nhập hoặc Email *                      |
|  +--------------------------------------------+  |
|  | nguyen.van.a@worksphere.com                |  |
|  +--------------------------------------------+  |
|                                                  |
|  Mật khẩu *                                      |
|  +--------------------------------------------+  |
|  | **********                            [Eye]|  |
|  +--------------------------------------------+  |
|                                                  |
|                          [ Quên mật khẩu? ]      |
|                                                  |
|  +--------------------------------------------+  |
|  |                 ĐĂNG NHẬP                  |  |
|  +--------------------------------------------+  |
|                                                  |
|  [Thông tin phiên bản v1.0.0]                    |
+--------------------------------------------------+
| [Navigation Bar: 16dp]                           |
+--------------------------------------------------+
```

---

## 2. Màn hình Bảng điều khiển (Dashboard Screen - SCR-MAIN-01)
> *Trạng thái Backend: `DESIGN_ONLY_BACKEND_NOT_READY`*

```text
+--------------------------------------------------+
| [Status Bar]                                     |
+--------------------------------------------------+
| [Avatar] Xin chào, Nguyễn Văn A        [Chuông:3]|
| Phòng Công nghệ Thông tin                        |
+--------------------------------------------------+
| [Thống kê nhanh - 3 Cards ngang]                 |
| +-------------+  +-------------+  +------------+ |
| | Cần làm     |  | Đang làm    |  | Quá hạn    | |
| |      5      |  |      3      |  |     2!     | |
| +-------------+  +-------------+  +------------+ |
+--------------------------------------------------+
| DỰ ÁN CỦA BẠN                         [Xem tất cả]
| +----------------------------------------------+ |
| | WS-2026-001 • [ACTIVE]                       | |
| | Triển khai Nền tảng WorkSphere               | |
| | [=======-------------------] 42.5%           | |
| | Quản lý: Trần Thị B • 6 thành viên           | |
| +----------------------------------------------+ |
+--------------------------------------------------+
| CÔNG VIỆC CẦN XỬ LÝ SẮP TỚI           [Xem tất cả]
| [Card Task: Viết API Auth • Hạn: Hôm nay 17:00]  |
| [Card Task: Review PR Mobile • Hạn: 18/10]       |
+--------------------------------------------------+
| [Bottom Tab Navigator: Dashboard | Dự án | Task] |
+--------------------------------------------------+
```

---

## 3. Danh sách Dự án (Project List - SCR-PRJ-01)
> *Trạng thái Backend: `READY`*

```text
+--------------------------------------------------+
| [Status Bar]                                     |
+--------------------------------------------------+
| [Top App Bar] DỰ ÁN                    [Tìm kiếm]|
+--------------------------------------------------+
| [Search Bar] Nhập tên hoặc mã dự án...       [x] |
+--------------------------------------------------+
| [Filter Chips] (Tất cả*) [Đang chạy] [Bản nháp]  |
+--------------------------------------------------+
| [Pull to Refresh Indicator nếu đang vuốt]        |
|                                                  |
| +----------------------------------------------+ |
| | PRJ-2026-001               [Badge: DRAFT]    | |
| | Xây dựng Nền tảng Doanh nghiệp WorkSphere   | |
| | Ưu tiên: [HIGH] • Quản lý: Nguyễn Văn A      | |
| | Thời gian: 01/09/2026 - 31/12/2026           | |
| | Tiến độ: [0.0%]                              | |
| | [===------------------------] 0%             | |
| | Thành viên: 2 người                          | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | PRJ-2026-002               [Badge: ACTIVE]   | |
| | Nâng cấp Hạ tầng Cloud & CI/CD               | |
| | Ưu tiên: [CRITICAL] • Quản lý: Lê Văn C      | |
| | Tiến độ: [===================] 75%           | |
| | Thành viên: 8 người                          | |
| +----------------------------------------------+ |
|                                                  |
|                                     [ + FAB ]    |
+--------------------------------------------------+
| [Bottom Tab: Dashboard | (Dự án*) | Tasks | ...] |
+--------------------------------------------------+
```

---

## 4. Chi tiết Dự án (Project Detail - SCR-PRJ-02)
> *Trạng thái Backend: `READY`*

```text
+--------------------------------------------------+
| [< Back]  PRJ-2026-001                  [Menu : ]|
+--------------------------------------------------+
| WorkSphere Platform Implementation               |
| Mã: PRJ-2026-001  •  Phòng: IT                   |
|                                                  |
| Trạng thái: [Badge: ACTIVE]    Ưu tiên: [HIGH]   |
|                                                  |
| [Nút Đổi Trạng thái]       [Nút Chỉnh sửa]       |
+--------------------------------------------------+
| TIẾN ĐỘ DỰ ÁN                                    |
| [==============-----------------] 45.0%          |
| Ngày bắt đầu: 01/09/2026   Kết thúc: 31/12/2026  |
| Ngày thực tế: Đang triển khai                    |
+--------------------------------------------------+
| THÀNH VIÊN (6)                        [Quản lý >]|
| [Avatar A] [Avatar B] [Avatar C] [Avatar D] (+2) |
+--------------------------------------------------+
| MỐC TIẾN ĐỘ (Milestones)              [Xem hết >]|
| • Mốc 1: Hoàn thành Khảo sát (15/10) [COMPLETED] |
| • Mốc 2: Triển khai MVP (30/11)      [PLANNED]   |
| • Mốc 3: Go-Live (31/12)             [PLANNED]   |
+--------------------------------------------------+
| CÔNG VIỆC GẦN ĐÂY                     [Xem hết >]|
| [Task item: Tạo migration bảng projects - DONE]  |
| [Task item: Viết Controller Project - IN_PROG]   |
+--------------------------------------------------+
```

---

## 5. Modal Đổi Trạng thái Dự án (Change Status Sheet - SCR-PRJ-05)
> *Trạng thái Backend: `READY`*

```text
+--------------------------------------------------+
|                                                  |
|                  (Màn hình mờ nền)               |
|                                                  |
| +----------------------------------------------+ |
| | [ Thanh kéo Handle Sheet ]                   | |
| | THAY ĐỔI TRẠNG THÁI DỰ ÁN                    | |
| | Trạng thái hiện tại: [ DRAFT ]               | |
| |                                              | |
| | Chọn trạng thái tiếp theo:                   | |
| | (o) ACTIVE - Bắt đầu triển khai chính thức   | |
| | ( ) CANCELLED - Hủy dự án                    | |
| |                                              | |
| | Lý do thay đổi (Không bắt buộc)              | |
| | +------------------------------------------+ | |
| | | Đã phê duyệt ngân sách và nhân sự        | | |
| | +------------------------------------------+ | |
| |                                              | |
| | [ Hủy ]                   [ Xác nhận đổi ]   | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

---

## 6. Màn hình Quản lý Thành viên Dự án (SCR-PRJ-06)
> *Trạng thái Backend: `READY`*

```text
+--------------------------------------------------+
| [< Back]  THÀNH VIÊN DỰ ÁN            [Tìm kiếm] |
+--------------------------------------------------+
| Tổng số: 3 thành viên đang hoạt động             |
|                                                  |
| +----------------------------------------------+ |
| | [Avatar] Nguyễn Văn A (Bạn)                  | |
| | nguyen.a@worksphere.com                      | |
| | Vai trò: [PROJECT_MANAGER]  [Tag: Quản lý]   | |
| | Tham gia: 01/09/2026                         | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | [Avatar] Trần Thị B                          | |
| | tran.b@worksphere.com                        | |
| | Vai trò: [TEAM_LEADER]                       | |
| | Tham gia: 05/09/2026                 [Sửa/Xóa] |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | [Avatar] Lê Văn C                            | |
| | le.c@worksphere.com                          | |
| | Vai trò: [MEMBER]                            | |
| | Tham gia: 10/09/2026                 [Sửa/Xóa] |
| +----------------------------------------------+ |
|                                                  |
|                                   [ + Thêm PM ]  |
+--------------------------------------------------+
```

---

## 7. Chi tiết Yêu cầu Dịch vụ & Sheet Từ chối kết quả (SCR-SRV-02 & SCR-SRV-03)
> *Trạng thái Backend: `DESIGN_ONLY_BACKEND_NOT_READY`*

```text
+--------------------------------------------------+
| [< Back]  REQ-2026-089                 [Menu : ] |
+--------------------------------------------------+
| SỰ CỐ MÁY IN TẦNG 3 KHÔNG KẾT NỐI MẠNG          |
| Danh mục: Cơ sở vật chất   Ưu tiên: [MEDIUM]     |
| Trạng thái: [Badge: RESOLVED]                    |
|                                                  |
| [Hộp cảnh báo: Kỹ thuật viên đã báo hoàn thành]  |
| "Đã thay cáp mạng và cấu hình lại IP máy in."    |
|                                                  |
| +----------------------------------------------+ |
| |          [ TỪ CHỐI KẾT QUẢ XỬ LÝ ]           | |
| +----------------------------------------------+ |
| (Nút chỉ hiển thị cho người tạo yêu cầu)        |
+--------------------------------------------------+
|                                                  |
| >>> KHI BẤM "TỪ CHỐI KẾT QUẢ", MỞ SHEET:        |
| +----------------------------------------------+ |
| | [Handle]                                     | |
| | TỪ CHỐI KẾT QUẢ XỬ LÝ                        | |
| | Vui lòng nêu rõ lý do sự cố chưa được xử lý: | |
| | +------------------------------------------+ | |
| | | Đã thử in lại nhưng đèn mạng vẫn báo đỏ, | | |
| | | máy tính vẫn báo Offline...              | | |
| | +------------------------------------------+ | |
| | Ký tự: 68/1000                               | |
| |                                              | |
| | [ Hủy bỏ ]          [ Xác nhận gửi lại ]     | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

---

## 8. Màn hình Báo Xung đột Optimistic Lock (State Overlay)

```text
+--------------------------------------------------+
|                                                  |
|          +----------------------------+          |
|          |    [ Icon Cảnh báo Vàng ]  |          |
|          |                            |          |
|          |     DỮ LIỆU ĐÃ THAY ĐỔI    |          |
|          |                            |          |
|          | Thông tin dự án vừa được   |          |
|          | cập nhật bởi người quản lý |          |
|          | khác. Vui lòng tải lại     |          |
|          | để nhận phiên bản mới nhất.|          |
|          |                            |          |
|          |  [ TẢI LẠI DỮ LIỆU MỚI ]   |          |
|          |                            |          |
|          |      [ Đóng thông báo ]    |          |
|          +----------------------------+          |
|                                                  |
+--------------------------------------------------+
```
