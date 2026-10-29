# WorkSphere Mobile UI/UX Design Baseline

## 1. Giới thiệu và Mục đích

Tài liệu này xác lập bộ quy chuẩn thiết kế giao diện (UI) và trải nghiệm người dùng (UX) chuẩn cho ứng dụng di động **WorkSphere Mobile** (nền tảng React Native, TypeScript).

Mục tiêu của bộ hồ sơ thiết kế:
1. **Quy chuẩn cho đội ngũ Figma**: Cung cấp đầy đủ thông số Layout, Grid, Typography, Colors, Components và User Flows để dựng toàn bộ frame trên Figma đồng nhất, không phải tự suy diễn.
2. **Quy chuẩn cho đội ngũ Mobile (React Native)**: Định nghĩa rõ kiến trúc điều hướng (Navigation), Props, UI States (Loading, Empty, Error, Optimistic Lock Conflict) và ánh xạ API Contract để code chính xác.
3. **Phục vụ học phần Phát triển Ứng dụng Di động**: Cung cấp kịch bản minh họa, kế hoạch chụp màn hình (Screenshot Plan) với chú giải học thuật và dữ liệu mẫu chuẩn cho báo cáo tốt nghiệp/môn học.
4. **Tính nhất quán toàn diện**: Đồng bộ 100% thuật ngữ, vai trò, quyền hạn, mã lỗi và luồng nghiệp vụ giữa Backend (Spring Boot), Database (PostgreSQL), API Contract và Mobile UI.

---

## 2. Nguồn sự thật Canonical và Giới hạn triển khai

Bộ tài liệu được xây dựng tuyệt đối tuân thủ 10 tài liệu canonical của dự án:
- `docs/01_PROJECT_SCOPE.md`
- `docs/02_USER_ROLES_AND_WORKFLOWS.md`
- `docs/03_MOBILE_SCREEN_MAP.md`
- `docs/04_SYSTEM_ARCHITECTURE.md`
- `docs/05_DATABASE_DESIGN.md`
- `docs/06_API_CONTRACT.md`
- `docs/07_FOUR_COURSE_MATRIX.md`
- `docs/08_DEVELOPMENT_ROADMAP.md`
- `docs/09_CODING_STANDARDS.md`
- `docs/10_AI_AGENT_INSTRUCTIONS.md`

### Quy chuẩn Phân định Trạng thái Backend (5 Taxonomy Classes):
- **`IMPLEMENTED_AND_TESTED`**: Các màn hình thuộc Authentication (Phase 4), Organization/Departments/Users (Phase 5), và Project Module (Phase 6) đã có API Backend hoạt động thực tế trên Docker Testcontainers (59/59 tests PASS, Checkstyle 0 violations).
- **`IMPLEMENTED_NOT_FULLY_TESTED`**: Endpoint đã có Controller trong backend nhưng chưa hoàn tất kiểm thử MockMvc endpoint độc lập (`PUT /api/v1/me/password`).
- **`CONTRACT_ONLY_NOT_IMPLEMENTED`**: Các màn hình thuộc Task (Phase 7), Service Request (Phase 8), Asset (Phase 9), Notification (Phase 10) được thiết kế giao diện hoàn chỉnh theo `03_MOBILE_SCREEN_MAP.md` và `06_API_CONTRACT.md`, nhưng backend chưa triển khai.
- **`DESIGN_ONLY_NO_CONTRACT`**: Đề xuất thiết kế giao diện client độc lập, không có endpoint trong hợp đồng.
- **`BLOCKED_BY_GAP`**: Màn hình bị nghẽn bởi khoảng trống kiến trúc đã ghi nhận (`SCR-MAIN-01` Dashboard cá nhân bị nghẽn bởi `DASHBOARD_AGGREGATED_API_GAP`).

### Tổng hợp Artifacts Giao diện (UI Inventory Summary):
- **Full Screen (Màn hình độc lập)**: 37 màn hình.
- **Modal / Bottom Sheet / Dialog**: 4 thành phần (`SCR-PRJ-05`, `SCR-PRJ-07`, `SCR-SRV-03`, `SCR-ACC-04`).
- **Navigator / Layout Container**: 1 bộ khung (`SCR-MAIN-02`).
- **Tổng số UI Artifacts**: 42 artifacts.

---

## 3. Cấu trúc Tài liệu Thiết kế

Bộ hồ sơ UI/UX Design Baseline bao gồm 13 tài liệu chuyên biệt:

| STT | Tài liệu | Mô tả nội dung |
|---|---|---|
| 01 | [01_USER_FLOW.md](./01_USER_FLOW.md) | 11 luồng thao tác người dùng từ khởi động đến kết thúc |
| 02 | [02_SCREEN_INVENTORY.md](./02_SCREEN_INVENTORY.md) | Danh mục 42 UI artifacts, quyền hạn, dữ liệu và trạng thái |
| 03 | [03_NAVIGATION_MAP.md](./03_NAVIGATION_MAP.md) | Bản đồ điều hướng, Root/Auth/Main Navigator và Deep Link Proposal |
| 04 | [04_WIREFRAME_SPEC.md](./04_WIREFRAME_SPEC.md) | Đặc tả bố cục khung xương chi tiết cho từng màn hình |
| 05 | [05_DESIGN_SYSTEM.md](./05_DESIGN_SYSTEM.md) | Bảng màu HEX, Typography, Spacing, Shapes, Elevation, Android 15 Edge-to-Edge |
| 06 | [06_COMPONENT_INVENTORY.md](./06_COMPONENT_INVENTORY.md) | Thư viện 28 components dùng chung, Props, Variants, Accessibility |
| 07 | [07_UI_STATE_MATRIX.md](./07_UI_STATE_MATRIX.md) | Ma trận 12 trạng thái UI (Loading, Empty, Conflict, Error, ...) |
| 08 | [08_API_SCREEN_MAPPING.md](./08_API_SCREEN_MAPPING.md) | Bảng ánh xạ 32 thao tác Screen - User Action - API Endpoint - 5 Readiness |
| 09 | [09_ACCESSIBILITY_CHECKLIST.md](./09_ACCESSIBILITY_CHECKLIST.md) | Tiêu chuẩn tiếp cận WCAG 2.1 AA, Touch target, Screen Reader |
| 10 | [10_FIGMA_IMPLEMENTATION_GUIDE.md](./10_FIGMA_IMPLEMENTATION_GUIDE.md) | Hướng dẫn dựng file Figma, Grid, Auto Layout, Components, Export |
| 11 | [11_DESIGN_REVIEW_CHECKLIST.md](./11_DESIGN_REVIEW_CHECKLIST.md) | Tiêu chí nghiệm thu thiết kế trước khi bàn giao lập trình |
| 12 | [12_REPORT_SCREENSHOT_PLAN.md](./12_REPORT_SCREENSHOT_PLAN.md) | Kế hoạch chụp ảnh minh họa chuẩn học thuật cho báo cáo môn học |
| 13 | [13_MOBILE_TEST_LAB_GUIDE.md](./13_MOBILE_TEST_LAB_GUIDE.md) | Hướng dẫn phòng lab kiểm thử mobile: ADB, Emulator, Docker, Screenshots, Automation Policy |

---

## 4. Tiêu chuẩn tham chiếu

- **Google Material Design 3**: Áp dụng triết lý màu sắc, hierarchy, surface elevation, component anatomy.
- **React Navigation v6/v7**: Cấu trúc RootStack, AuthStack, BottomTabNavigator, ModalStack.
- **React Native Accessibility**: WAI-ARIA roles, accessibilityLabel, accessibilityHint, accessibilityLiveRegion.
- **Android Material Guidelines & Android 15 Edge-to-Edge**: Kích thước vùng chạm tối thiểu 48 x 48 dp, 4-column layout grid, Safe Area insets handling.
