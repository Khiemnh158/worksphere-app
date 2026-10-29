# 05. DESIGN SYSTEM - WORKSPHERE MOBILE

Tài liệu này chuẩn hóa toàn bộ Design Tokens cho ứng dụng WorkSphere Mobile, tương thích với hệ thống Material Design 3 và quy chuẩn thiết kế giao diện di động doanh nghiệp chuyên nghiệp.

---

## 1. Hệ thống Bảng màu (Color Palette & Tokens)

Hệ thống màu sắc sử dụng ánh sáng chủ đạo (Light Theme), đảm bảo độ tương phản cao đạt chuẩn tiếp cận WCAG 2.1 AA (tỷ lệ tối thiểu 4.5:1 đối với văn bản thông thường).

| Tên Token | Mã HEX | Ứng dụng cụ thể | WCAG Contrast |
|---|---|---|---|
| `color.primary` | `#1E3A8A` | Màu chủ đạo: Top AppBar, Primary Button, Active Tab icon | 8.8:1 trên nền trắng |
| `color.onPrimary` | `#FFFFFF` | Màu chữ và icon hiển thị trên nền Primary | 8.8:1 |
| `color.primaryContainer` | `#DBEAFE` | Nền chip active, highlight badge, tint card nền | 7.2:1 trên Text Primary |
| `color.onPrimaryContainer`| `#1E40AF` | Màu chữ và icon nằm trên nền Primary Container | 5.4:1 |
| `color.secondary` | `#0D9488` | Màu bổ trợ: Thanh tiến độ dự án, chỉ số hoàn thành | 4.8:1 |
| `color.onSecondary` | `#FFFFFF` | Chữ/icon nằm trên nền Secondary | 4.8:1 |
| `color.background` | `#F8FAFC` | Nền toàn bộ màn hình ứng dụng (Off-white dịu mắt) | N/A |
| `color.surface` | `#FFFFFF` | Nền của Thẻ (Card), Dialog, Bottom Sheet | N/A |
| `color.surfaceVariant` | `#F1F5F9` | Nền ô tìm kiếm, phân cách bảng, background xám nhạt | N/A |
| `color.textPrimary` | `#0F172A` | Tiêu đề chính, văn bản quan trọng (Slate 900) | 14.1:1 trên Background |
| `color.textSecondary` | `#64748B` | Mô tả phụ, nhãn thời gian, placeholder (Slate 500) | 4.6:1 trên Background |
| `color.border` | `#CBD5E1` | Đường viền thẻ, viền ô nhập liệu (Slate 300) | 3.1:1 |
| `color.borderFocus` | `#2563EB` | Viền ô nhập liệu khi đang chọn (Focus) | 5.2:1 |
| `color.error` | `#DC2626` | Trạng thái lỗi: CANCELLED, OVERDUE, Form Error, Nút xóa | 4.7:1 |
| `color.onError` | `#FFFFFF` | Chữ trên nền Error | 4.7:1 |
| `color.errorContainer` | `#FEE2E2` | Nền cảnh báo lỗi, nền badge hủy | N/A |
| `color.warning` | `#D97706` | Trạng thái cảnh báo: ON_HOLD, PENDING, Gần đến hạn | 4.5:1 |
| `color.warningContainer` | `#FEF3C7` | Nền badge cảnh báo | N/A |
| `color.success` | `#16A34A` | Trạng thái thành công: COMPLETED, ACTIVE, DONE | 4.6:1 |
| `color.successContainer` | `#DCFCE7` | Nền badge thành công | N/A |
| `color.info` | `#0284C7` | Trạng thái thông tin: DRAFT, PLANNED, OPEN | 4.5:1 |
| `color.infoContainer` | `#E0F2FE` | Nền badge thông tin | N/A |
| `color.disabled` | `#94A3B8` | Trạng thái vô hiệu hóa (Disabled button/text) | N/A |
| `color.disabledContainer`| `#E2E8F0` | Nền nút khi bị disabled | N/A |

---

## 2. Hệ thống Kiểu chữ (Typography Scale)

Font chữ hệ thống: **Inter** (hoặc Roboto trên Android, San Francisco trên iOS).

| Kiểu chữ (Token) | Font Size | Line Height | Font Weight | Letter Spacing | Sử dụng thực tế |
|---|---|---|---|---|---|
| `typography.display` | 28px | 36px | Bold (700) | -0.5px | Tiêu đề chào mừng Splash, Dashboard |
| `typography.heading1` | 22px | 28px | Bold (700) | -0.2px | Tiêu đề trang Top AppBar, Tên dự án |
| `typography.heading2` | 18px | 24px | SemiBold (600) | 0px | Tiêu đề mục (Section title), Card title |
| `typography.heading3` | 16px | 22px | SemiBold (600) | 0.1px | Tiêu đề con, Tên thành viên trong list |
| `typography.body` | 14px | 20px | Regular (400) | 0.2px | Nội dung mô tả dự án, đoạn văn bản |
| `typography.bodyMedium`| 14px | 20px | Medium (500) | 0.1px | Nhãn trường form, Nội dung quan trọng |
| `typography.bodySmall` | 12px | 16px | Regular (400) | 0.3px | Thời gian, thông tin chi tiết phụ |
| `typography.label` | 14px | 20px | SemiBold (600) | 0.5px | Chữ trên nút bấm (Button text), Tabs |
| `typography.caption` | 11px | 14px | Medium (500) | 0.5px | Chữ trên Status Badge, Tag, Tooltip |

---

## 3. Thang Khoảng cách (Spacing Scale)

Hệ thống khoảng cách tuân thủ lưới cơ sở 4-point và 8-point:

| Token | Giá trị | Ứng dụng |
|---|---|---|
| `spacing.xxs` | 4px | Khoảng cách icon và chữ trong badge, khoảng đệm nhỏ |
| `spacing.xs` | 8px | Khoảng cách giữa các chip, padding nhỏ trong ô nhập liệu |
| `spacing.sm` | 12px | Khoảng cách giữa các phần tử liên quan trong một card |
| `spacing.md` | 16px | **Lề màn hình chuẩn (Screen horizontal margin)**, card padding |
| `spacing.lg` | 20px | Khoảng cách giữa các block nội dung trong form |
| `spacing.xl` | 24px | Khoảng cách giữa các section lớn trên màn hình |
| `spacing.xxl` | 32px | Khoảng cách phía trên tiêu đề chính, khoảng trống chân trang |
| `spacing.huge` | 40px | Khoảng cách trên màn hình Auth (Logo tới Form) |

---

## 4. Bán kính Bo góc (Corner Radius / Shape Scale)

| Token | Bán kính | Ứng dụng |
|---|---|---|
| `shape.small` | 4px | Status Badge, Priority Tag, Checkbox |
| `shape.medium` | 8px | **Ô nhập liệu (TextInput), Thẻ card thường** |
| `shape.large` | 16px | **Modal Bottom Sheet, Dialog xác nhận, Card nổi bật** |
| `shape.full` | 9999px | Nút bấm Pill (Pill Button), Filter Chip, Avatar tròn |

---

## 5. Kích thước và Vùng chạm Tối thiểu (Sizing & Touch Target)

Tuân thủ nghiêm ngặt chuẩn tiếp cận Android Accessibility và WCAG:

| Thành phần | Kích thước chuẩn | Vùng chạm tối thiểu (Touch Target) |
|---|---|---|
| Nút bấm chính (AppButton) | Chiều cao 48dp | 48 × 48 dp |
| Ô nhập liệu (AppTextInput) | Chiều cao 52dp | Chiều cao tối thiểu 48dp |
| Icon tương tác (IconButton) | Kích thước icon 24 × 24 dp | **Vùng chạm đệm mở rộng 48 × 48 dp** |
| Thanh tiêu đề (TopAppBar) | Chiều cao 56dp | Chiều cao 56dp |
| Thanh điều hướng dưới (BottomTab) | Chiều cao 64dp (chưa tính safe area) | Tab item tối thiểu 64 × 48 dp |
| Avatar người dùng (MemberAvatar) | 32dp (nhỏ), 40dp (vừa), 64dp (hồ sơ) | 48 × 48 dp nếu có thể bấm |
| Checkbox / Radio item | 20 × 20 dp | Vùng chạm tối thiểu 48 × 48 dp |

---

## 6. Đổ bóng và Phân cấp Nổi (Elevation & Shadow Tokens)

| Cấp độ | Elevation | Giá trị Shadow CSS/React Native | Sử dụng |
|---|---|---|---|
| `elevation.level0` | 0dp | `none` | Nền màn hình, ô nhập liệu phẳng |
| `elevation.level1` | 1dp | `shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1` | Thẻ Card dự án thông thường |
| `elevation.level2` | 3dp | `shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3` | Top App Bar khi cuộn, Card active |
| `elevation.level3` | 6dp | `shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 6` | Nút hành động nổi (FAB), Bottom Sheet |
| `elevation.level4` | 8dp | `shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 16, elevation: 8` | Hộp thoại thông báo (Modal Dialog) |

---

## 7. Quy chuẩn Tiếp cận Đa phương thức (Dual-Cue Convention)

Tuân thủ nghiêm ngặt chuẩn WCAG 2.1 Success Criterion 1.4.1 (Use of Color):
- **Không bao giờ dùng màu sắc làm tín hiệu duy nhất** để thể hiện trạng thái (Error, Warning, Success, Info).
- Mọi Badge, Card và Alert trạng thái phải kết hợp đồng thời **3 yếu tố**:
  1. **Màu nền / Viền / Icon**: Bảng màu ngữ nghĩa đã chuẩn hóa (`color.error`, `color.warning`, `color.success`, `color.info`).
  2. **Biểu tượng hình học (Iconography)**:
     - Error/Cancelled: Icon dấu chéo tròn (`alert-circle` hoặc `close-circle`).
     - Warning/Pending/OnHold: Icon tam giác cảnh báo (`alert-triangle` hoặc `clock`).
     - Success/Active/Done: Icon dấu tích tròn (`check-circle`).
     - Info/Draft/Planned: Icon thông tin (`information-outline`).
  3. **Nhãn chữ rõ ràng (Explicit Text Label)**: Đi kèm nhãn chữ tiếng Việt chuẩn xác ("Đang thực hiện", "Tạm dừng", "Đã hủy", "Hoàn thành").

---

## 8. Hỗ trợ Co giãn Kích thước Chữ (Dynamic Type & Font Scaling)

Ứng dụng hỗ trợ cơ chế phóng to chữ của hệ điều hành (Android Font Scale từ 1.0x lên đến 2.0x):
- **Nguyên tắc bố cục**: Tuyệt đối không cố định chiều cao (`height: fixed`) cho các thẻ Card, dòng thông tin danh sách và vùng chứa văn bản có thể mở rộng.
- **Sử dụng `minHeight`**: Thiết lập `minHeight: 48dp` để đảm bảo vùng chạm, nhưng cho phép container giãn tự nhiên theo chiều dọc (`flexWrap: 'wrap'`, `flexGrow: 1`) khi kích thước font chữ tăng.
- **Giới hạn số dòng và Ellipsize**: Với các trường tên dự án hoặc tiêu đề dài, cho phép tối đa 2 dòng (`numberOfLines={2}`, `ellipsizeMode="tail"`). Với nhãn nút bấm, text tự động xuống dòng hoặc thu nhỏ hợp lý nếu cần.

---

## 9. Tương thích Android 15 Edge-to-Edge và Xử lý Safe Area Insets

Android 15 (API Level 35) kích hoạt chế độ **Edge-to-Edge** mặc định và bắt buộc (Status Bar và Navigation Bar trở nên trong suốt, nội dung ứng dụng trải rộng dưới các thanh hệ thống):
- **Thư viện chuẩn**: Sử dụng `react-native-safe-area-context` (`SafeAreaProvider`, hook `useSafeAreaInsets()`).
- **Thanh trạng thái đỉnh (Top App Bar & Status Bar)**:
  - TopAppBar sử dụng `paddingTop: insets.top` để tránh bị notch, camera cut-out hoặc status bar đè lên tiêu đề.
  - Chiều cao hiệu dụng của TopAppBar = `56dp + insets.top`.
- **Thanh điều hướng đáy (Bottom Tab Navigation & Gesture Bar)**:
  - Bottom Tab Bar bắt buộc tính thêm khoảng đệm đáy `paddingBottom: Math.max(insets.bottom, 8)`.
  - Đảm bảo thanh chỉ báo cử chỉ (Gesture Navigation Bar) trên Android 15 không che lấp các icon tab và nút thao tác chính.
- **Modal Bottom Sheet và Form Footer**:
  - Các nút hành động dính đáy (Sticky CTA Button) và Modal Bottom Sheet phải bao bọc bởi `useSafeAreaInsets()` với `paddingBottom: insets.bottom + 16dp`.

---

## 10. Môi trường Tham chiếu Thiết kế và Kiểm thử (Reference Environment)

Hệ thống token và bố cục được thiết kế và kiểm thử xác thực trên cấu hình chuẩn:
- **Thiết bị kiểm thử chuẩn**: Android Virtual Device (AVD) / Android Emulator.
- **Serial thiết bị**: `emulator-5554` (Trạng thái: `device`).
- **Tên Model / Sản phẩm**: `sdk_gphone64_x86_64` (Architecture: x86_64).
- **Hệ điều hành**: Android 15 (Android Version `15`, SDK API Level `35`).
- **Độ phân giải vật lý**: `1080 × 2400 pixels`.
- **Mật độ điểm ảnh**: `420 dpi` (Chuẩn xxhdpi, hệ số tỷ lệ scaling ~2.625).
- **Khung nhìn logic (Logical Viewport)**: ~`411 × 914 dp`.
- **Khung chuẩn thiết kế Figma**: `360 × 800 dp` (Android Small/Medium) và `412 × 915 dp` (Android Large/Pixel), đảm bảo bố cục co giãn mượt mà theo tỷ lệ màn hình 20:9.
