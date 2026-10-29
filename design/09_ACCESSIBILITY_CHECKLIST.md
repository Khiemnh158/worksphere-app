# 09. ACCESSIBILITY CHECKLIST - WORKSPHERE MOBILE

Tài liệu này xác lập bộ tiêu chuẩn và danh mục kiểm tra khả năng tiếp cận (Accessibility - a11y) cho WorkSphere Mobile, đảm bảo tuân thủ tiêu chuẩn quốc tế **WCAG 2.1 Level AA** và quy chuẩn Android Accessibility / Apple Human Interface Guidelines.

---

## 1. Vùng chạm và Kích thước Tương tác (Touch Target)

- [ ] **Kích thước tối thiểu 48 × 48 dp**: Tất cả các phần tử có thể chạm (Button, IconButton, Tab, Chip, Checkbox, Radio, Link) đều có vùng chạm thực tế tối thiểu 48 × 48 dp.
- [ ] **Khoảng đệm cho Icon nhỏ**: Đối với icon kích thước 20×20dp hoặc 24×24dp, container bao quanh (`hitSlop` hoặc `padding`) phải mở rộng đủ 48×48dp để người dùng ngón tay lớn hoặc run tay không bị bấm trượt.
- [ ] **Khoảng cách giữa các nút**: Khoảng cách tối thiểu giữa 2 phần tử tương tác liền kề là 8dp (`spacing.xs`) để tránh chạm nhầm.

---

## 2. Màu sắc và Độ tương phản (Color & Contrast)

- [ ] **Tỷ lệ tương phản chữ thông thường (Body Text)**: Tỷ lệ tương phản giữa màu chữ và màu nền đạt tối thiểu **4.5:1** (Ví dụ: `color.textPrimary` `#0F172A` trên nền `#FFFFFF` đạt 14.1:1).
- [ ] **Tỷ lệ tương phản chữ lớn và UI Controls**: Tỷ lệ tương phản đạt tối thiểu **3.0:1** cho tiêu đề từ 18px Bold trở lên và đường viền ô nhập liệu (`color.borderFocus` `#2563EB` đạt 5.2:1).
- [ ] **Không sử dụng màu sắc làm chỉ thị duy nhất**:
  - Không chỉ dùng màu đỏ để báo lỗi mà luôn đi kèm **Icon cảnh báo** và **Dòng chữ thông báo lỗi**.
  - Các trạng thái Badge (DRAFT, ACTIVE, COMPLETED, CANCELLED) phải luôn có chữ hiển thị rõ ràng bên trong, không chỉ hiển thị chấm tròn màu.
  - Mức độ ưu tiên CRITICAL luôn có icon chuông/cảnh báo đi kèm màu đỏ.

---

## 3. Trình đọc màn hình (Screen Reader - TalkBack & VoiceOver)

- [ ] **`accessibilityRole` chính xác**:
  - Nút bấm: `accessibilityRole="button"`
  - Ô nhập liệu: `accessibilityRole="none"` (mặc định cho TextInput) hoặc tương đương
  - Thanh tab: `accessibilityRole="tablist"` và `accessibilityRole="tab"`
  - Liên kết: `accessibilityRole="link"`
  - Hình ảnh: `accessibilityRole="image"`
  - Thanh tiến độ: `accessibilityRole="progressbar"`, cung cấp giá trị `accessibilityValue={{ min: 0, max: 100, now: 45, text: "45 phần trăm" }}`.
- [ ] **`accessibilityLabel` có nghĩa**:
  - Nút đóng: `accessibilityLabel="Đóng hộp thoại"` (thay vì đọc là "X").
  - Nút quay lại: `accessibilityLabel="Quay lại danh sách"` (thay vì đọc là "Arrow back").
  - Nút ẩn/hiện mật khẩu: `accessibilityLabel="Hiện mật khẩu"` / `accessibilityLabel="Ẩn mật khẩu"`.
- [ ] **`accessibilityHint` hướng dẫn thao tác phụ**:
  - Nút card dự án: `accessibilityHint="Chạm hai lần để xem chi tiết dự án"`.
- [ ] **Thông báo thay đổi động (Live Regions)**:
  - Khi có lỗi submit form hoặc lỗi Optimistic Lock: Sử dụng `accessibilityLiveRegion="assertive"` để trình đọc màn hình ngắt lời và đọc ngay thông báo lỗi cho người khiếm thị.
  - Khi trạng thái chuyển sang Loading: `accessibilityLiveRegion="polite"` thông báo "Đang xử lý, vui lòng chờ".

---

## 4. Hành vi Bàn phím và Biểu mẫu (Keyboard & Forms)

- [ ] **Liên kết nhãn và ô nhập (Input Labeling)**: Mọi trường `AppTextInput` đều có nhãn hiển thị rõ ràng bên trên ô nhập.
- [ ] **Thông báo lỗi liên kết trực tiếp**: Trường bị lỗi validation phải có thông báo lỗi nằm ngay bên dưới và liên kết với accessibility error (`accessibilityErrorMessage`).
- [ ] **Đóng bàn phím khi chạm ngoài**: Sử dụng `TouchableWithoutFeedback` bọc màn hình để gọi `Keyboard.dismiss()` khi chạm vào khoảng trống.
- [ ] **Bàn phím không che trường nhập**: Sử dụng `KeyboardAvoidingView` trên toàn bộ màn hình form để đảm bảo ô nhập liệu và nút bấm chính luôn nằm trên bàn phím ảo.
- [ ] **Thứ tự Focus (Focus Order)**: Thứ tự di chuyển con trỏ tuần tự từ trên xuống dưới, từ trái sang phải, tuân thủ đúng logic đọc văn bản.

---

## 5. Hộp thoại và Modal Bottom Sheet

- [ ] **Bẫy Focus (Focus Trap)**: Khi mở Bottom Sheet hoặc ConfirmDialog, con trỏ Screen Reader chỉ di chuyển bên trong hộp thoại, không lọt ra nội dung mờ phía sau.
- [ ] **Khả năng đóng dễ dàng**: Cho phép người dùng đóng Sheet/Dialog bằng cách bấm nút Hủy, nút đóng góc phải, hoặc cử chỉ Back phần cứng của Android.
- [ ] **Khôi phục Focus**: Khi đóng hộp thoại, con trỏ Screen Reader tự động quay lại nút bấm ban đầu vừa kích hoạt nó.

---

## 6. Phóng to chữ và Tỷ lệ Động (Dynamic Text Scaling)

- [ ] **Hỗ trợ Font Scaling hệ điều hành**:
  - Giao diện không bị vỡ hoặc mất chữ khi người dùng bật cỡ chữ lớn (Text Zoom lên đến 150% - 200%).
  - Các container không hard-code chiều cao cố định đối với các khối chứa đoạn văn bản (Sử dụng `minHeight` thay vì `height`).
- [ ] **Xử lý tràn văn bản (Text Overflow)**: Tiêu đề dài sử dụng `numberOfLines={2}` kèm `ellipsizeMode="tail"`.
