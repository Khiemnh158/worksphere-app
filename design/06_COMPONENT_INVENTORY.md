# 06. COMPONENT INVENTORY - WORKSPHERE MOBILE

Tài liệu này định nghĩa chi tiết 28 thành phần giao diện (UI Components) dùng chung trong ứng dụng WorkSphere Mobile, làm cơ sở để xây dựng Design System Component Library trên Figma và thư mục `mobile/src/components` trong React Native.

---

## 1. Nhóm Điều hướng và Bố cục Cơ bản

### 1. TopAppBar
- **Mục đích**: Thanh tiêu đề chuẩn đầu màn hình, hỗ trợ nút Back, tiêu đề và nút chức năng (Actions).
- **Props**: `title: string`, `showBack?: boolean`, `onBack?: () => void`, `actions?: ActionItem[]`, `subtitle?: string`.
- **Variants**: Standard (Tiêu đề căn trái), Center (Tiêu đề căn giữa), Large (Tiêu đề lớn mở rộng).
- **States**: Default, Scrolled (Tăng elevation lên Level 2).
- **Accessibility**: Nút back có `accessibilityLabel="Quay lại"`, `accessibilityRole="button"`.
- **Màn hình sử dụng**: Hầu hết các màn hình con (`SCR-PRJ-02`, `SCR-AUTH-03`,...).
- **Figma Component**: `Navigation / TopAppBar`
- **React Native Component**: `<TopAppBar />`

---

### 2. BottomNavigation
- **Mục đích**: Thanh điều hướng dưới chân màn hình gồm 5 tabs chính.
- **Props**: `currentTab: TabKey`, `onSelectTab: (tab: TabKey) => void`, `badges?: Record<TabKey, number>`.
- **Variants**: Default (5 tabs: Dashboard, Dự án, Công việc, Yêu cầu, Thêm).
- **States**: Tab active (Icon + Text màu Primary), Tab inactive (Icon + Text màu TextSecondary).
- **Accessibility**: `accessibilityRole="tablist"`, từng tab có `accessibilityRole="tab"`.
- **Màn hình sử dụng**: Cố định tại khung Main Application (`SCR-MAIN-02`).
- **Figma Component**: `Navigation / BottomNavigation`
- **React Native Component**: `<BottomNavigation />`

---

## 2. Nhóm Nhập liệu và Tương tác (Forms & Inputs)

### 3. AppButton
- **Mục đích**: Nút bấm kích hoạt hành động chính, phụ hoặc nguy hiểm.
- **Props**: `title: string`, `onPress: () => void`, `variant?: 'primary' | 'secondary' | 'outline' | 'danger'`, `loading?: boolean`, `disabled?: boolean`, `icon?: IconName`.
- **Variants**: Primary (Nền Primary, chữ trắng), Secondary (Nền xám nhạt), Outline (Viền border, nền trong), Danger (Nền Error đỏ).
- **States**: Normal, Pressed (Opacity 0.8), Loading (Spinner thay thế chữ), Disabled (Nền disabled xám, không nhận touch).
- **Accessibility**: `accessibilityRole="button"`, `accessibilityState={{ disabled, busy: loading }}`.
- **Màn hình sử dụng**: Toàn bộ màn hình form (`SCR-AUTH-02`, `SCR-PRJ-03`,...).
- **Figma Component**: `Inputs / AppButton`
- **React Native Component**: `<AppButton />`

---

### 4. AppIconButton
- **Mục đích**: Nút bấm icon tinh gọn cho các tác vụ phụ (Back, Search, Filter, Menu).
- **Props**: `icon: IconName`, `onPress: () => void`, `accessibilityLabel: string`, `badgeCount?: number`.
- **Vùng chạm**: Icon 24×24dp đặt trong container đệm tối thiểu 48×48dp.
- **Figma Component**: `Inputs / AppIconButton`
- **React Native Component**: `<AppIconButton />`

---

### 5. AppTextInput
- **Mục đích**: Ô nhập liệu văn bản có nhãn, chú thích và thông báo lỗi.
- **Props**: `label: string`, `value: string`, `onChangeText: (text: string) => void`, `placeholder?: string`, `error?: string`, `helperText?: string`, `required?: boolean`, `multiline?: boolean`.
- **States**: Default (Viền xám), Focused (Viền xanh Primary), Error (Viền đỏ Error), Disabled (Nền xám nhạt).
- **Accessibility**: Gắn nhãn tự động với trường nhập qua `accessibilityLabel`.
- **Figma Component**: `Inputs / AppTextInput`
- **React Native Component**: `<AppTextInput />`

---

### 6. PasswordInput
- **Mục đích**: Ô nhập mật khẩu có sẵn nút toggle ẩn/hiện văn bản.
- **Props**: Kế thừa `AppTextInput`, tích hợp sẵn state `isSecureTextEntry`.
- **Figma Component**: `Inputs / PasswordInput`
- **React Native Component**: `<PasswordInput />`

---

### 7. SearchBar
- **Mục đích**: Thanh tìm kiếm tức thời có nút xóa nhanh (Clear).
- **Props**: `value: string`, `onChangeText: (text: string) => void`, `onClear: () => void`, `placeholder?: string`.
- **Figma Component**: `Inputs / SearchBar`
- **React Native Component**: `<SearchBar />`

---

### 8. FilterChip
- **Mục đích**: Nhãn lọc nhỏ cho phép chọn trạng thái hoặc tiêu chí lọc nhanh.
- **Props**: `label: string`, `selected: boolean`, `onPress: () => void`, `count?: number`.
- **States**: Selected (Nền PrimaryContainer, viền xanh), Unselected (Nền SurfaceVariant, viền xám).
- **Figma Component**: `Inputs / FilterChip`
- **React Native Component**: `<FilterChip />`

---

## 3. Nhóm Thẻ và Danh sách (Cards & Lists)

### 9. AppCard
- **Mục đích**: Khung chứa thông tin nâng cao dạng bề mặt nổi (Surface).
- **Props**: `children: ReactNode`, `onPress?: () => void`, `elevation?: number`.
- **Figma Component**: `DataDisplay / AppCard`
- **React Native Component**: `<AppCard />`

---

### 10. ProjectCard
- **Mục đích**: Hiển thị thẻ tóm tắt dự án trong danh sách.
- **Props**: `project: ProjectSummaryResponse`, `onPress: () => void`.
- **Nội dung hiển thị**: Mã dự án, Tên dự án, `StatusBadge`, `PriorityBadge`, Quản lý dự án, `ProgressBar`, Số thành viên.
- **Figma Component**: `Business / ProjectCard`
- **React Native Component**: `<ProjectCard />`

---

### 11. TaskCard
- **Mục đích**: Hiển thị thẻ công việc (*Phục vụ thiết kế Phase 7*).
- **Props**: `title: string`, `priority: string`, `status: string`, `dueDate: string`, `assigneeName?: string`.
- **Figma Component**: `Business / TaskCard`
- **React Native Component**: `<TaskCard />`

---

### 12. MilestoneCard
- **Mục đích**: Thẻ hiển thị mốc tiến độ trong chi tiết dự án.
- **Props**: `name: string`, `dueDate: string`, `status: MilestoneStatus`, `completedAt?: string`.
- **Figma Component**: `Business / MilestoneCard`
- **React Native Component**: `<MilestoneCard />`

---

### 13. MemberRow
- **Mục đích**: Hiển thị hàng thông tin thành viên dự án.
- **Props**: `avatarUrl?: string`, `fullName: string`, `email: string`, `projectRole: ProjectRole`, `onEdit?: () => void`, `onDelete?: () => void`.
- **Figma Component**: `Business / MemberRow`
- **React Native Component**: `<MemberRow />`

---

### 14. MemberAvatar
- **Mục đích**: Ảnh đại diện người dùng, tự động hiển thị chữ cái đầu (Initials) nếu không có ảnh.
- **Props**: `avatarUrl?: string`, `fullName: string`, `size?: 32 | 40 | 64`.
- **Figma Component**: `DataDisplay / MemberAvatar`
- **React Native Component**: `<MemberAvatar />`

---

## 4. Nhóm Trực quan hóa và Chỉ thị Trạng thái (Badges & Indicators)

### 15. StatusBadge
- **Mục đích**: Huy hiệu màu biểu thị trạng thái (DRAFT, ACTIVE, ON_HOLD, COMPLETED, CANCELLED).
- **Props**: `status: string`, `type?: 'project' | 'task' | 'serviceRequest'`.
- **Màu sắc**:
  - `DRAFT` / `PLANNED`: Info Blue (`#0284C7`)
  - `ACTIVE` / `IN_PROGRESS`: Success Green (`#16A34A`)
  - `ON_HOLD` / `WAITING`: Warning Amber (`#D97706`)
  - `COMPLETED` / `CLOSED`: Dark Green (`#047857`)
  - `CANCELLED`: Error Red (`#DC2626`)
- **Figma Component**: `Indicators / StatusBadge`
- **React Native Component**: `<StatusBadge />`

---

### 16. PriorityBadge
- **Mục đích**: Huy hiệu mức độ ưu tiên (LOW, MEDIUM, HIGH, CRITICAL).
- **Props**: `priority: ProjectPriority | TaskPriority`.
- **Màu sắc**:
  - `LOW`: Slate (`#64748B`)
  - `MEDIUM`: Blue (`#2563EB`)
  - `HIGH`: Amber (`#D97706`)
  - `CRITICAL`: Red (`#DC2626`) kèm icon báo động
- **Figma Component**: `Indicators / PriorityBadge`
- **React Native Component**: `<PriorityBadge />`

---

### 17. ProgressBar
- **Mục đích**: Thanh đo tỷ lệ phần trăm tiến độ hoàn thành (0 - 100%).
- **Props**: `percent: number`, `showLabel?: boolean`, `color?: string`.
- **Figma Component**: `Indicators / ProgressBar`
- **React Native Component**: `<ProgressBar />`

---

## 5. Nhóm Trạng thái Giao diện Toàn cục (Feedback & States)

### 18. LoadingState
- **Mục đích**: Hiển thị vòng xoay đang tải nội dung toàn màn hình.
- **Props**: `message?: string`.
- **Figma Component**: `Feedback / LoadingState`
- **React Native Component**: `<LoadingState />`

---

### 19. SkeletonCard
- **Mục đích**: Khung placeholder giả lập giao diện đang tải (Shimmer effect).
- **Props**: `type?: 'project' | 'task' | 'member'`.
- **Figma Component**: `Feedback / SkeletonCard`
- **React Native Component**: `<SkeletonCard />`

---

### 20. EmptyState
- **Mục đích**: Hiển thị khi danh sách hoặc nội dung rỗng.
- **Props**: `icon?: IconName`, `title: string`, `description: string`, `actionTitle?: string`, `onAction?: () => void`.
- **Figma Component**: `Feedback / EmptyState`
- **React Native Component**: `<EmptyState />`

---

### 21. ErrorState
- **Mục đích**: Màn hình/khung báo lỗi tải dữ liệu thất bại hoặc lỗi máy chủ.
- **Props**: `title?: string`, `message: string`, `onRetry?: () => void`.
- **Figma Component**: `Feedback / ErrorState`
- **React Native Component**: `<ErrorState />`

---

### 22. OfflineBanner
- **Mục đích**: Dải băng màu cam báo thiết bị đang mất mạng.
- **Props**: `message?: string`.
- **Figma Component**: `Feedback / OfflineBanner`
- **React Native Component**: `<OfflineBanner />`

---

### 23. PermissionDeniedState
- **Mục đích**: Hiển thị thông báo người dùng không có quyền truy cập vào màn hình.
- **Props**: `requiredPermission?: string`, `onBack?: () => void`.
- **Figma Component**: `Feedback / PermissionDeniedState`
- **React Native Component**: `<PermissionDeniedState />`

---

### 24. PaginationFooter
- **Mục đích**: Phần đuôi danh sách hiển thị Loading khi cuộn tải trang tiếp (Load more) hoặc báo "Đã tải hết dữ liệu".
- **Props**: `loadingMore: boolean`, `hasMore: boolean`.
- **Figma Component**: `Feedback / PaginationFooter`
- **React Native Component**: `<PaginationFooter />`

---

## 6. Nhóm Hộp thoại và Thông báo Nổi (Modals & Overlays)

### 25. ConfirmDialog
- **Mục đích**: Hộp thoại hỏi xác nhận trước khi thực hiện hành động quan trọng (Xóa thành viên, Đăng xuất).
- **Props**: `visible: boolean`, `title: string`, `message: string`, `confirmText?: string`, `cancelText?: string`, `onConfirm: () => void`, `onCancel: () => void`, `isDanger?: boolean`.
- **Figma Component**: `Overlays / ConfirmDialog`
- **React Native Component**: `<ConfirmDialog />`

---

### 26. AppBottomSheet
- **Mục đích**: Khung vuốt từ dưới lên (Modal Bottom Sheet) cho các form nhanh (Đổi trạng thái, Thêm thành viên).
- **Props**: `visible: boolean`, `onClose: () => void`, `title: string`, `children: ReactNode`.
- **Figma Component**: `Overlays / AppBottomSheet`
- **React Native Component**: `<AppBottomSheet />`

---

### 27. Snackbar
- **Mục đích**: Thanh thông báo nhanh xuất hiện ở đáy màn hình và tự biến mất sau 3 giây.
- **Props**: `visible: boolean`, `message: string`, `type?: 'success' | 'error' | 'info'`, `actionTitle?: string`, `onAction?: () => void`.
- **Figma Component**: `Overlays / Snackbar`
- **React Native Component**: `<Snackbar />`

---

### 28. FormErrorSummary
- **Mục đích**: Hộp tổng hợp lỗi validation đầu form khi người dùng submit không hợp lệ.
- **Props**: `errors: string[]`.
- **Figma Component**: `Feedback / FormErrorSummary`
- **React Native Component**: `<FormErrorSummary />`
