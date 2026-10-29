# 11. DESIGN REVIEW CHECKLIST - WORKSPHERE MOBILE

Tài liệu này xác lập bộ tiêu chí nghiệm thu thiết kế UI/UX (Design Review & Acceptance Checklist) trước khi đội ngũ thiết kế bàn giao cho đội ngũ lập trình viên React Native hoặc bảo vệ đồ án môn học.

---

## 1. Kiểm tra Tính Tuân thủ Nguồn Sự Thật Canonical

- [ ] **Khớp 100% với `docs/03_MOBILE_SCREEN_MAP.md`**: Không tự tiện phát minh màn hình mới hoặc gộp các màn hình độc lập trái với cấu trúc 3 cấp điều hướng.
- [ ] **Khớp 100% với `docs/06_API_CONTRACT.md`**:
  - Tên các trường trong Form và Chi tiết khớp hoàn toàn với DTO Request/Response (Ví dụ: `code`, `name`, `startDate`, `plannedEndDate`, `priority`, `status`, `version`).
  - Request `POST /projects` không có trường chọn trạng thái (Status luôn khởi tạo `DRAFT`).
  - Ma trận đổi trạng thái dự án tại `SCR-PRJ-05` chỉ hiển thị các bước chuyển hợp lệ theo mục 11.5.
- [ ] **Phân định rõ trạng thái Backend**:
  - Các màn hình Phase 4, 5, 6 được gắn nhãn `READY`.
  - Các màn hình Task, Service Request, Asset, Notification được gắn nhãn `DESIGN_ONLY_BACKEND_NOT_READY`. Không tuyên bố là Backend đã hoàn thiện.

---

## 2. Kiểm tra Đầy đủ 4 Trạng thái Giao diện Cơ bản (4 Essential States)

Mỗi màn hình bắt buộc phải có thiết kế cho ít nhất 4 trạng thái:
- [ ] **Loading State**: Có thiết kế Skeleton Shimmer hoặc Spinner khi đang tải dữ liệu ban đầu.
- [ ] **Success / Content State**: Giao diện hiển thị khi có dữ liệu bình thường.
- [ ] **Empty State**: Thiết kế khi danh sách rỗng (có hình minh họa + thông điệp + nút hành động tạo mới nếu có quyền).
- [ ] **Error State**: Thiết kế khi gặp lỗi mạng hoặc lỗi máy chủ (có thông báo rõ ràng + nút Thử lại).

---

## 3. Kiểm tra Phân quyền và Bảo mật (Security & Permission Gating)

- [ ] **Bảo toàn bất biến Project Manager (Decision D-013)**:
  - Thiết kế màn hình thành viên và hộp thoại sửa vai trò hiển thị rõ ràng thông báo lỗi khi người dùng cố gắng xóa hoặc giáng cấp Project Manager duy nhất còn lại (`PROJECT_MANAGER_REQUIRED`).
- [ ] **Ẩn/Hiện nút theo `allowedActions`**:
  - Nút "Chỉnh sửa dự án" chỉ hiện khi `allowedActions` có `UPDATE`.
  - Nút "Đổi trạng thái" chỉ hiện khi `allowedActions` có `CHANGE_STATUS`.
  - Nút "Thêm thành viên" chỉ hiện khi `allowedActions` có `MANAGE_MEMBERS`.
- [ ] **Màn hình từ chối quyền (403 Forbidden)**: Có thiết kế `PermissionDeniedState` thay vì để trắng màn hình.
- [ ] **Bảo mật mật khẩu**:
  - Ô mật khẩu luôn mặc định ẩn ký tự (`••••••••`).
  - Nút ẩn/hiện mật khẩu hoạt động tốt.
  - Không hiển thị token hay thông tin nhạy cảm trên giao diện.

---

## 4. Kiểm tra Xử lý Tình huống Biên (Edge Cases & Resilience)

- [ ] **Xung đột phiên bản (Optimistic Lock Conflict - HTTP 409)**:
  - Có thiết kế hộp thoại chuyên biệt khi gặp xung đột phiên bản.
  - Thông báo thân thiện, có nút "Tải lại dữ liệu mới", không lộ stack trace.
- [ ] **Ngoại tuyến (Offline Handling)**:
  - Có thiết kế `OfflineBanner` màu vàng cam.
  - Nút submit biểu mẫu bị vô hiệu hóa khi mất mạng kèm tooltip giải thích.
- [ ] **Tràn văn bản (Text Overflow)**:
  - Tên dự án dài hoặc mô tả nhiều dòng được cắt tỉa 2 dòng kèm `...`.
  - Không bị tràn layout ngang hoặc che khuất nút thao tác.
- [ ] **Xử lý số lượng lớn (Pagination)**:
  - Danh sách hỗ trợ cuộn phân trang vô tận, có thiết kế `PaginationFooter`.

---

## 5. Kiểm tra Chuẩn Khả năng Tiếp cận (Accessibility Review)

- [ ] Vùng chạm của tất cả các nút tương tác đạt tối thiểu **48 × 48 dp**.
- [ ] Độ tương phản màu chữ chính đạt tối thiểu **4.5:1**.
- [ ] Các Badge trạng thái có đầy đủ chữ kèm icon, không chỉ dùng màu.
- [ ] Các trường form có gắn nhãn rõ ràng, thông báo lỗi liên kết đúng vị trí.

---

## 6. Tiêu chí Ký duyệt Bàn giao (Handoff Approval)

| Hạng mục kiểm tra | Trọng số | Kết quả đánh giá | Trạng thái |
|---|---|---|---|
| Tính toàn vẹn theo Canonical Docs | 30% | 100% khớp Screen Map & API Contract | ĐẠT |
| Đầy đủ Design System & Components | 25% | Đủ 28 components, bảng màu HEX, Typography | ĐẠT |
| Đầy đủ Ma trận Trạng thái (UI States) | 20% | Đủ 12 states (Loading, Empty, Conflict,...) | ĐẠT |
| Tiêu chuẩn Tiếp cận (Accessibility a11y) | 15% | Đạt WCAG 2.1 AA, Touch target >= 48dp | ĐẠT |
| Kế hoạch Chụp ảnh Báo cáo Môn học | 10% | Đủ 15 hình minh họa kèm kịch bản dữ liệu | ĐẠT |
