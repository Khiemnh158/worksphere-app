# 10. FIGMA IMPLEMENTATION GUIDE - WORKSPHERE MOBILE

Tài liệu này cung cấp hướng dẫn từng bước cho nhóm thiết kế UI/UX để dựng toàn bộ giao diện WorkSphere Mobile trên Figma một cách chuyên nghiệp, sẵn sàng bàn giao cho đội ngũ lập trình React Native (Dev Mode Handoff) và trích xuất hình ảnh phục vụ báo cáo học phần.

---

## 1. Thiết lập File và Cấu hình Frame

### 1.1. Khổ màn hình chuẩn (Artboard / Frame Size)
- **Thiết bị mục tiêu**: Android Standard Phone.
- **Kích thước Frame**: **360 × 800 dp** (hoặc chuẩn iOS iPhone 14/15: 390 × 844 dp).
- **Màu nền Frame (Canvas Background)**: `#F8FAFC` (`color.background`).

### 1.2. Hệ thống Lưới (Layout Grid - 4 Columns)
Áp dụng cho mọi màn hình chính:
- **Loại lưới**: Columns (Cột dọc).
- **Số lượng cột (Count)**: **4 columns**.
- **Lề trái/phải (Margin)**: **16 dp** (`spacing.md`).
- **Khoảng cách giữa các cột (Gutter)**: **16 dp** (`spacing.md`).

---

## 2. Cấu trúc Trang (Page Structure) trong File Figma

Nhóm thiết kế cần chia nhỏ file Figma thành các trang chuyên biệt theo cấu trúc:

```text
WorkSphere_Mobile_Design_v1.0.fig
├── 🎨 Cover & Release Notes
├── 📐 Design Tokens (Colors, Typography, Elevation, Spacing)
├── 🧩 Component Library (Atom, Molecule, Organism)
├── 📱 01_Authentication (Splash, Login, ForgotPass, ResetPass)
├── 📱 02_Main_Dashboard (Dashboard, BottomNav, MoreMenu)
├── 📱 03_Project_Module (List, Detail, Create, Edit, Members, Milestones, StatusSheet)
├── 📱 04_Task_Module [DESIGN ONLY] (List, Detail, Create, Subtasks, Comments)
├── 📱 05_Service_Request [DESIGN ONLY] (List, Detail, RejectSheet, Create, Comments)
├── 📱 06_Asset_Module [DESIGN ONLY] (List, Detail, P1 Screens)
├── 📱 07_Account_Settings (Profile, ChangePass, Settings, LogoutDialog)
├── ⚠️ UI_States_Gallery (Loading Skeletons, Empty, Error, Optimistic Lock Conflict)
└── 🚀 Interactive Prototype (Luồng liên kết có thể chạy thử)
```

---

## 3. Quy chuẩn Auto Layout và Constraints

- **100% Sử dụng Auto Layout**:
  - Không vẽ các phần tử tự do (absolute positioning) trừ các nút nổi (FAB) hoặc badge góc.
  - Sử dụng Auto Layout ngang (`Horizontal`) cho hàng thành viên, avatar group, header.
  - Sử dụng Auto Layout dọc (`Vertical`) cho toàn bộ màn hình, danh sách thẻ và form nhập liệu.
- **Thiết lập Resizing chuẩn**:
  - Khung nội dung màn hình: `Fill container` theo chiều ngang, `Hug contents` hoặc cuộn theo chiều dọc.
  - Thẻ Card dự án: `Fill container` để tự động co giãn khi kích thước màn hình thay đổi.
  - Nút bấm: Chiều cao cố định `Fixed height = 48dp`, chiều rộng `Fill container` (đối với nút form) hoặc `Hug contents` (đối với chip/nút phụ).

---

## 4. Quy ước Đặt tên (Naming Conventions)

Tuân thủ quy tắc dấu gạch chéo `/` để Figma tự động phân nhóm Component:

```text
Category / ComponentName / Variant / State

Ví dụ thực tế:
Inputs / AppButton / Primary / Default
Inputs / AppButton / Primary / Loading
Inputs / AppButton / Primary / Disabled
Inputs / AppTextInput / Default / Normal
Inputs / AppTextInput / Default / Focused
Inputs / AppTextInput / Default / Error
Indicators / StatusBadge / Project / ACTIVE
Indicators / StatusBadge / Project / DRAFT
Indicators / PriorityBadge / HIGH
Business / ProjectCard / Default
Business / MemberRow / Active
Feedback / SkeletonCard / Project
```

---

## 5. Quy chuẩn Thiết lập Nguyên mẫu Tương tác (Prototyping)

Khi liên kết các màn hình trên Figma để trình diễn:
1. **Chuyển tab chính**:
   - Chạm vào tab icon tại BottomNav -> `Navigate to` màn hình tương ứng.
   - Hiệu ứng: `Instant` (tức thì).
2. **Mở Chi tiết Dự án**:
   - Chạm vào thẻ `ProjectCard` -> `Navigate to` `SCR-PRJ-02: Project Detail`.
   - Hiệu ứng: `Push (from right)` hoặc `Smart Animate`, thời gian 250ms, Easing: `Ease Out`.
3. **Mở Modal Bottom Sheet (Đổi trạng thái, Thêm thành viên, Từ chối kết quả)**:
   - Chạm vào nút đổi trạng thái -> `Open overlay`.
   - Vị trí: `Bottom Center`.
   - Bật tùy chọn: `Close when clicking outside`, `Add background blur/overlay (Black 50%)`.
   - Hiệu ứng: `Move in (from bottom)`, 200ms.

---

## 6. Hướng dẫn Bàn giao Lập trình (Dev Mode Handoff)

- Toàn bộ màu sắc và kiểu chữ phải liên kết với **Figma Styles / Variables** (ví dụ: `color.primary`, `typography.body`), không để mã màu HEX hoặc font size trôi nổi (detached).
- Gắn chú thích (Annotation) tại các nút bấm:
  - Chỉ rõ quyền hạn yêu cầu (`PROJECT_CREATE`, `PROJECT_UPDATE`, `PROJECT_MEMBER_MANAGE`).
  - Ghi chú API Endpoint tương ứng (Ví dụ: `PUT /api/v1/projects/{id}/status`).
- Đánh dấu trạng thái màn hình rõ ràng:
  - Màn hình đã có Backend: Gắn tag xanh `[BACKEND_READY]`.
  - Màn hình thiết kế chờ Phase 7+: Gắn tag vàng cam `[DESIGN_ONLY]`.

---

## 7. Tiêu chuẩn Xuất ảnh (Export PNG) cho Báo cáo Học phần

Để đưa hình ảnh vào tài liệu học thuật (Word/LaTeX/Slides):
- **Định dạng**: PNG chất lượng cao.
- **Tỷ lệ trích xuất (Scale)**: **`2x`** (hoặc `3x`) để không bị vỡ hạt khi in ấn.
- **Quy tắc đặt tên file**:
  `FIG_{MãMànHình}_{TênMànHình}_{TrạngThái}.png`
  - Ví dụ:
    - `FIG_01_SCR-AUTH-02_Login_Default.png`
    - `FIG_02_SCR-PRJ-01_ProjectList_Success.png`
    - `FIG_03_SCR-PRJ-02_ProjectDetail_Success.png`
    - `FIG_04_SCR-PRJ-05_ChangeStatus_Modal.png`
    - `FIG_05_SCR-PRJ-04_EditProject_Conflict409.png`
- **Màu nền khi xuất**: Giữ nguyên nền trắng/off-white của frame, bo góc 16dp và đổ bóng nhẹ (Device Mockup) nếu dùng cho slide thuyết trình.
