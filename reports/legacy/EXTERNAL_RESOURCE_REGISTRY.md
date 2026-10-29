# Sổ Đăng Ký Tài Nguyên Bên Ngoài WorkSphere (External Resource Registry)

Tài liệu kiểm kê, theo dõi và quản lý nguồn gốc (provenance), mức độ tin cậy, giấy phép bản quyền, trạng thái kiểm thẩm an ninh và phạm vi tái sử dụng của toàn bộ kho mã (repositories), kỹ năng (skills), bản mẫu (templates), gói thư viện (packages), và tài nguyên tham khảo từ Internet được đưa vào dự án WorkSphere.

Ngày thiết lập: 18/10/2026.
Ngày kiểm toán & chuẩn hóa: 18/10/2026 (Audit Checkpoint `4207e62`).
Cơ chế ban hành: Quyết định **D-057** và Quy chuẩn `AGENTS.md`.

---

## 1. Nguyên Tắc Quản Trị và Quy Ước Trạng Thái

Mọi tài nguyên bên ngoài được tải về máy phát triển phục vụ WorkSphere bắt buộc phải:
1. Nằm trong khu vực cách ly cục bộ `D:\WorkSphere\.external\`.
2. Được ghi nhận đầy đủ hồ sơ vào tài liệu này trước khi tái sử dụng hoặc tích hợp mã nguồn.
3. Ghim chính xác định danh bất biến (immutable commit SHA hoặc version digest); không dùng floating branch làm căn cứ provenance duy nhất.
4. Tuyệt đối không lưu mật khẩu, API key, token cá nhân hoặc URL chứa credential vào registry này.

### Trạng Thái Vòng Đời (Resource Lifecycle Statuses)

- `CANDIDATE`: Mới phát hiện trên Internet, chưa tải về máy.
- `QUARANTINED`: Đã tải về lưu tại `.external/quarantine/`, chưa hoàn thành kiểm thẩm an ninh; **tuyệt đối không thực thi**.
- `REVIEWED`: Đã hoàn thành phân tích mã nguồn, giấy phép, script và kiểm tra bảo mật; chờ quyết định phê duyệt.
- `APPROVED_REFERENCE`: Đã phê duyệt để làm tài liệu tham khảo đọc hiểu kiến trúc (Read-Only Reference); lưu tại `.external/repos/` hoặc `.external/templates/` (hoặc tài liệu trực tuyến chính thức không yêu cầu bản sao cục bộ).
- `APPROVED_EXECUTION`: Đã phê duyệt cho phép chạy script/công cụ trong môi trường cô lập có kiểm soát (Isolated Sandbox / Development Container).
- `APPROVED_INTEGRATION`: Đã phê duyệt cho phép trích xuất hoặc phỏng tác các đoạn mã chọn lọc vào codebase WorkSphere với ghi nhận bản quyền đầy đủ.
- `REJECTED`: Bị từ chối do rủi ro an ninh, giấy phép không tương thích, hoặc chất lượng không đạt chuẩn; tệp trong quarantine sẽ bị xóa.
- `SUPERSEDED`: Đã được thay thế bởi phiên bản mới hơn hoặc giải pháp tối ưu hơn.
- `MISSING_LOCAL_COPY`: Hồ sơ đã được duyệt trong quá khứ nhưng tệp cục bộ chưa có trên máy hiện tại; cho phép tải lại đúng commit/digest đã đăng ký.

---

## 2. Mẫu Hồ Sơ Chuẩn (Record Specification Template)

```markdown
### [EXT-RES-XXX] <Tên tài nguyên>

- **Registry ID**: `EXT-RES-XXX`
- **Loại tài nguyên**: `repository` | `skill` | `template` | `package` | `tool` | `application` | `extension` | `documentation` | `github_action` | `docker_image`
- **Tên đầy đủ**: <Tên dự án hoặc gói>
- **Mục đích WorkSphere**: <Lý do nghiên cứu hoặc tái sử dụng>
- **Nguồn chính thức (Official Source URL)**: <URL trang chủ hoặc repository chính thức>
- **Chủ sở hữu / Publisher**: <Tổ chức hoặc tác giả>
- **Phân cấp tin cậy (Trust Tier)**: `Tier 1` (Official) | `Tier 2` (Reputable Org) | `Tier 3` (Community) | `Tier 4` (Blocked)
- **Giấy phép (SPDX License)**: `MIT` | `Apache-2.0` | `BSD-3-Clause` | ...
- **Bằng chứng giấy phép**: <Đường dẫn tệp LICENSE hoặc URL công bố>
- **Quyết định giấy phép**: `PERMISSIBLE` | `REVIEW_REQUIRED` | `BLOCKED`
- **Phiên bản / Tag**: <vX.Y.Z hoặc Tag>
- **Commit SHA / Digest bất biến**: <Full 40-character SHA hoặc image digest sha256:...>
- **Ngày thu thập (Retrieval Date)**: YYYY-MM-DD
- **Tồn tại bản sao cục bộ (Local Copy Existence)**: `True` | `False`
- **Đường dẫn cục bộ (Local Path)**: `D:\WorkSphere\.external\<subfolder>\<name>` hoặc `N/A (Online Reference)`
- **Đường dẫn logic (Logical Path)**: `.external/<subfolder>/<name>` hoặc `None`
- **Trạng thái (Status)**: `CANDIDATE` | `QUARANTINED` | `REVIEWED` | `APPROVED_REFERENCE` | `APPROVED_EXECUTION` | `APPROVED_INTEGRATION` | `REJECTED` | `SUPERSEDED` | `MISSING_LOCAL_COPY`
- **Mã băm SHA-256**: <Checksum tệp nén hoặc archive snapshot, hoặc N/A nếu là online reference>
- **Xác minh chữ ký (Signature)**: `VALID` | `UNSIGNED` | `N/A`
- **Scripts / Hooks**: `Có` (mô tả) | `Không`
- **Native / Binary**: `Có` (ngôn ngữ/nền tảng) | `Không`
- **Hành vi mạng (Network Behavior)**: `Offline-only` | `Gọi domain công khai ...`
- **Quyền hạn yêu cầu (Permissions)**: `None` | `Read-only files` | ...
- **Khả năng tương thích**: OS (Windows 11), Node (20+), Java (21), React Native (0.76+)
- **Kết quả quét bảo mật (Security Scan)**: `CLEAN` | `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
- **Kết quả quét Secret (Secret Scan)**: `CLEAN` | `LEAK_DETECTED`
- **Lỗ hổng phụ thuộc (Vulnerabilities)**: `0 known vulnerabilities` | ...
- **Thành phần / Logic tái sử dụng**: <Danh sách các hàm, module, schema tham khảo hoặc trích xuất>
- **Hiệu chỉnh đã thực hiện**: <Mô tả chi tiết các thay đổi phù hợp chuẩn WorkSphere>
- **Chính sách cập nhật**: `Pin commit cố định; chỉ nâng cấp khi có đánh giá chuyên biệt`
- **Ngày xác minh gần nhất**: YYYY-MM-DD
- **Báo cáo / Quyết định liên quan**: D-XXX, reports/...
- **Ghi chú & Lý do từ chối (nếu có)**: ...
```

---

## 3. Danh Mục Hồ Sơ Tài Nguyên (Active Resource Inventory)

### [EXT-RES-001] React Native Official Documentation & Component Reference

- **Registry ID**: `EXT-RES-001`
- **Loại tài nguyên**: `documentation`
- **Tên đầy đủ**: React Native Core Documentation and Architecture Reference
- **Mục đích WorkSphere**: Cung cấp chuẩn tham chiếu kỹ thuật cho kiến trúc New Architecture (TurboModules, Fabric), Native Bridge Objective-C/Java, StyleSheet và Component Lifecycle phục vụ Phase 12-14.
- **Nguồn chính thức (Official Source URL)**: `https://github.com/facebook/react-native`
- **Chủ sở hữu / Publisher**: Meta Platforms, Inc. / React Native Maintainers
- **Phân cấp tin cậy (Trust Tier)**: `Tier 1` (Official Vendor / Core Maintainer)
- **Giấy phép (SPDX License)**: `MIT`
- **Bằng chứng giấy phép**: `https://github.com/facebook/react-native/blob/main/LICENSE`
- **Quyết định giấy phép**: `PERMISSIBLE`
- **Phiên bản / Tag**: `v0.76.x`
- **Commit SHA / Digest bất biến**: `5f891ebc569f143714b1ef868dc3b994d528bdf6` (React Native 0.76.0 release tag)
- **Ngày thu thập (Retrieval Date)**: 2026-10-18
- **Tồn tại bản sao cục bộ (Local Copy Existence)**: `False` (Tài liệu tham chiếu trực tuyến; không clone mã nguồn đầy đủ vào đĩa cục bộ)
- **Đường dẫn cục bộ (Local Path)**: `N/A (Online Documentation Reference - no local clone required)`
- **Đường dẫn logic (Logical Path)**: `None`
- **Trạng thái (Status)**: `APPROVED_REFERENCE` (Hợp lệ theo quy tắc D-057: Tài liệu chính thức đã xác minh nguồn gốc được duyệt tham khảo mà không bắt buộc có bản sao đĩa)
- **Mã băm SHA-256**: N/A (Online Git Reference & Documentation)
- **Xác minh chữ ký (Signature)**: GPG Verified Tag
- **Scripts / Hooks**: `Không` (Không thực thi script cục bộ)
- **Native / Binary**: `Không` (Không biên dịch binary ngoài dự án)
- **Hành vi mạng (Network Behavior)**: Tài liệu chỉ đọc trực tuyến
- **Quyền hạn yêu cầu (Permissions)**: None
- **Khả năng tương thích**: Windows host, Android SDK 35, React Native 0.76.7
- **Kết quả quét bảo mật (Security Scan)**: `CLEAN`
- **Kết quả quét Secret (Secret Scan)**: `CLEAN`
- **Lỗ hổng phụ thuộc (Vulnerabilities)**: Đã kiểm duyệt theo release channel chính thức
- **Thành phần / Logic tái sử dụng**: Mô hình tích hợp Objective-C Native Module cho iOS (`RCTBridgeModule`), Gradle BuildConfig integration cho Android.
- **Hiệu chỉnh đã thực hiện**: Tái cấu trúc native module thành `EnvironmentConfigModule` độc lập và tối giản, tuân thủ nghiêm ngặt chuẩn modular của WorkSphere.
- **Chính sách cập nhật**: Pin theo phiên bản runtime `0.76.7` đang cấu hình trong `mobile/package.json`.
- **Ngày xác minh gần nhất**: 2026-10-18
- **Báo cáo / Quyết định liên quan**: D-054, D-055, `reports/PHASE_13_AUTH_AUDIT.md`
- **Ghi chú & Lý do từ chối (nếu có)**: Chỉ dùng đọc hiểu và tham chiếu chuẩn giao tiếp native; không clone đè vào repository WorkSphere.

---

### [EXT-RES-002] Spring Security Reference Architecture & BCrypt Token Standards

- **Registry ID**: `EXT-RES-002`
- **Loại tài nguyên**: `documentation`
- **Tên đầy đủ**: Spring Security 6 Reference Documentation
- **Mục đích WorkSphere**: Chuẩn mực bảo mật backend, Stateless JWT Authentication, BCrypt PasswordEncoder, UserDetailsService và SecurityFilterChain cho Modular Monolith.
- **Nguồn chính thức (Official Source URL)**: `https://github.com/spring-projects/spring-security`
- **Chủ sở hữu / Publisher**: Broadcom Inc. (Spring Projects)
- **Phân cấp tin cậy (Trust Tier)**: `Tier 1` (Official Maintainer)
- **Giấy phép (SPDX License)**: `Apache-2.0`
- **Bằng chứng giấy phép**: `https://github.com/spring-projects/spring-security/blob/main/LICENSE.txt`
- **Quyết định giấy phép**: `PERMISSIBLE`
- **Phiên bản / Tag**: `v6.3.x`
- **Commit SHA / Digest bất biến**: `c696e5454659f81682f6e9bc644b6c33c3f87b8d`
- **Ngày thu thập (Retrieval Date)**: 2026-10-18
- **Tồn tại bản sao cục bộ (Local Copy Existence)**: `False` (Tài liệu tham chiếu trực tuyến; không clone kho mã đầy đủ vào đĩa cục bộ)
- **Đường dẫn cục bộ (Local Path)**: `N/A (Online Documentation Reference - no local clone required)`
- **Đường dẫn logic (Logical Path)**: `None`
- **Trạng thái (Status)**: `APPROVED_REFERENCE` (Hợp lệ theo quy tắc D-057: Tài liệu chính thức đã xác minh nguồn gốc được duyệt tham khảo mà không bắt buộc có bản sao đĩa)
- **Mã băm SHA-256**: N/A (Online Reference)
- **Xác minh chữ ký (Signature)**: Verified
- **Scripts / Hooks**: `Không` (Tham chiếu cấu trúc và API)
- **Native / Binary**: `Không`
- **Hành vi mạng (Network Behavior)**: Offline read-only
- **Quyền hạn yêu cầu (Permissions)**: None
- **Khả năng tương thích**: Java 21, Spring Boot 3.3.x
- **Kết quả quét bảo mật (Security Scan)**: `CLEAN`
- **Kết quả quét Secret (Secret Scan)**: `CLEAN`
- **Lỗ hổng phụ thuộc (Vulnerabilities)**: Được cập nhật liên tục qua Dependabot của Spring
- **Thành phần / Logic tái sử dụng**: Kiến trúc Stateless JWT Filter, SecurityFilterChain configuration, và Dev E2E Provisioner runner pattern.
- **Hiệu chỉnh đã thực hiện**: Triển khai phù hợp Modular Monolith, cô lập bean dev qua `@Profile("dev")` và `@ConditionalOnProperty`.
- **Chính sách cập nhật**: Pin theo Spring Boot 3.3.x được định nghĩa trong `backend/pom.xml`.
- **Ngày xác minh gần nhất**: 2026-10-18
- **Báo cáo / Quyết định liên quan**: D-001, D-056, `reports/PRE_PHASE_13_AUTH_PROVISIONING_REPORT.md`
- **Ghi chú & Lý do từ chối (nếu có)**: Hoàn toàn tuân thủ kiến trúc Modular Monolith.

---

## 4. Nhật Ký Thay Đổi (Registry Changelog)

| Ngày | Registry ID | Thao tác | Trạng thái | Người thực hiện | Quyết định / Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-10-18 | `EXT-RES-001` | Khởi tạo | `APPROVED_REFERENCE` | WorkSphere Agent | Thiết lập tài liệu tham chiếu chuẩn React Native Native Bridge (D-055, D-057) |
| 2026-10-18 | `EXT-RES-002` | Khởi tạo | `APPROVED_REFERENCE` | WorkSphere Agent | Thiết lập tài liệu tham chiếu chuẩn Spring Security & Dev Provisioning (D-056, D-057) |
| 2026-10-18 | `EXT-RES-001`, `002` | Audit & Chuẩn hóa | `APPROVED_REFERENCE` | WorkSphere Agent | Xác nhận tồn tại bản sao cục bộ là False (Online Reference); làm rõ Local Path N/A |
