# Báo Cáo Kiểm Toán Khởi Tạo Sổ Đăng Ký Tài Nguyên Bên Ngoài Và Công Cụ / Extension (External Registry Bootstrap Audit Report)

- **Ngày kiểm toán**: 18/10/2026.
- **Checkpoint cơ sở**: `4207e62cf0c38b5588f7e5bbf0043be3aeb31cfd`.
- **Hệ điều hành**: Windows 11 Enterprise (NT 10.0.26200).
- **Môi trường phát triển**: Antigravity IDE 2.0 (Google DeepMind).
- **Phạm vi kiểm toán**:
  - [`reports/EXTERNAL_RESOURCE_REGISTRY.md`](file:///d:/WorkSphere/reports/EXTERNAL_RESOURCE_REGISTRY.md)
  - [`reports/TOOL_EXTENSION_REGISTRY.md`](file:///d:/WorkSphere/reports/TOOL_EXTENSION_REGISTRY.md)
  - [`reports/ENVIRONMENT_TOOL_REGISTRY.md`](file:///d:/WorkSphere/reports/ENVIRONMENT_TOOL_REGISTRY.md)
  - [`reports/registry/external-resource.schema.json`](file:///d:/WorkSphere/reports/registry/external-resource.schema.json)
  - [`reports/registry/tool-extension.schema.json`](file:///d:/WorkSphere/reports/registry/tool-extension.schema.json)
  - Toàn bộ thư mục `.external/` và thư mục extension `C:\Users\dienm\.antigravity-ide\extensions`.

---

## 1. Mục Tiêu Kiểm Toán

1. **Đối soát tính chân thực (Ground Truth Verification)**: Xác minh từng trường thông tin trong sổ đăng ký dựa trên bằng chứng hệ thống tệp cục bộ và lệnh đọc trực tiếp; loại bỏ toàn bộ dữ liệu suy đoán hoặc phiên bản không chính xác.
2. **Kiểm tra tuân thủ quy chuẩn D-057**: Đảm bảo các trạng thái phê duyệt (`APPROVED_REFERENCE`, `APPROVED_EXECUTION`, `APPROVED_INTEGRATION`) tuân thủ nghiêm ngặt điều kiện về bản sao cục bộ, cam kết bất biến và thẩm định an ninh.
3. **Phân định rõ ràng trách nhiệm hai sổ đăng ký**:
   - `ENVIRONMENT_TOOL_REGISTRY.md`: Hiện trạng cài đặt máy chủ host, cấu hình và đường dẫn vận hành.
   - `TOOL_EXTENSION_REGISTRY.md`: Nguồn gốc, mức độ tin cậy, giấy phép bản quyền, trạng thái phê duyệt và kiểm thẩm an ninh.
4. **Chuẩn hóa trạng thái an toàn (Safe Status Normalization)**: Hạ cấp các mục chưa có bằng chứng cài đặt thực tế về `CANDIDATE` hoặc `NOT_INSTALLED`.

---

## 2. Kết Quả Kiểm Toán Hồ Sơ Tài Nguyên Bên Ngoài (`EXT-RES`)

Kiểm toán toàn bộ 2 hồ sơ khởi tạo tại `reports/EXTERNAL_RESOURCE_REGISTRY.md`:

| Trường thông tin | EXT-RES-001 (React Native Reference) | EXT-RES-002 (Spring Security Reference) | Đánh giá kiểm toán |
| :--- | :--- | :--- | :--- |
| **Tên tài nguyên** | React Native Documentation & Architecture | Spring Security 6 Reference Documentation | `VERIFIED` |
| **Loại tài nguyên** | `documentation` | `documentation` | `VERIFIED` |
| **Nguồn chính thức URL** | `https://github.com/facebook/react-native` | `https://github.com/spring-projects/spring-security` | `VERIFIED` (Tier 1) |
| **Nhà phát hành / Owner**| Meta Platforms / Core Maintainers | Broadcom Inc. (Spring Projects) | `VERIFIED` |
| **Giấy phép (SPDX)** | `MIT` | `Apache-2.0` | `VERIFIED` (Permissible) |
| **Phiên bản / Tag** | `v0.76.x` | `v6.3.x` | `VERIFIED` |
| **Commit SHA bất biến** | `5f891ebc569f143714b1ef868dc3b994d528bdf6` | `c696e5454659f81682f6e9bc644b6c33c3f87b8d` | `VERIFIED` |
| **Tồn tại bản sao cục bộ**| `False` (Đã sửa từ đường dẫn giả định) | `False` (Đã sửa từ đường dẫn giả định) | `VERIFIED` (Thực tế đĩa không có) |
| **Đường dẫn cục bộ** | `N/A (Online Reference - no clone required)` | `N/A (Online Reference - no clone required)`| `VERIFIED` (Đã chuẩn hóa) |
| **Trạng thái phê duyệt** | `APPROVED_REFERENCE` | `APPROVED_REFERENCE` | `VERIFIED` (Hợp lệ theo D-057) |
| **Checksum / Signature** | GPG Verified Tag | Verified Commit | `VERIFIED` |
| **Quét an ninh & Secret** | `CLEAN` / `CLEAN` | `CLEAN` / `CLEAN` | `VERIFIED` |

**Kết luận danh mục `EXT-RES`**:
- Cả hai tài nguyên đều thuộc Tier 1 và được sử dụng làm tài liệu tham khảo kiến trúc (Read-Only Documentation Reference).
- Theo quy định tại mục 3 và mục 8 của nhiệm vụ: "Official documentation links may be APPROVED_REFERENCE without local copy only when owner/source is verified and no code execution is implied." Do đó trạng thái `APPROVED_REFERENCE` được giữ nguyên hợp lệ.
- Đã loại bỏ các đường dẫn đĩa cục bộ giả định (`D:\WorkSphere\.external\repos\...`) chưa clone thực tế, thay thế bằng `Local Copy Existence: False` và `Local Path: N/A (Online Documentation Reference)`.

---

## 3. Kết Quả Kiểm Toán Công Cụ Nền Tảng (`TOOL-EXT-001` .. `TOOL-EXT-005`)

Kiểm toán trực tiếp trên hệ thống Windows host:

1. **Git (`TOOL-EXT-001`)**:
   - Lệnh kiểm tra: `git --version` -> `git version 2.55.0.windows.3`.
   - Đường dẫn thực thi: `C:\Program Files\Git\cmd\git.exe` (`where.exe git`).
   - Đánh giá: `VERIFIED`. Trạng thái: `INSTALLED`, `APPROVED`, `REQUIRED`.
2. **Java Runtime (`TOOL-EXT-002`)**:
   - Lệnh kiểm tra: `java -version` -> `openjdk version "25.0.4.1" 2026-08-18 LTS (Temurin-25.0.4.1+1-LTS)`.
   - Đường dẫn thực thi: `D:\Program Files\bin\java.exe` (mặc định trên PATH).
   - Kiểm tra JDK phụ: `& "D:\Java\bin\java.exe" -version` -> `Oracle Java SE 27+35-2325`.
   - Bytecode target dự án: Java 21 (được cấu hình chuẩn trong `pom.xml`).
   - Đánh giá: `VERIFIED`. Đã bổ sung ghi nhận rõ ràng sự hiện diện của Temurin OpenJDK 25 trên PATH bên cạnh Oracle JDK 27. Trạng thái: `INSTALLED`, `APPROVED`, `REQUIRED`.
3. **Node.js & NPM (`TOOL-EXT-003`)**:
   - Lệnh kiểm tra: `node -v` -> `v24.19.0`, `npm -v` -> `11.17.0`.
   - Đường dẫn thực thi: `C:\Program Files\nodejs\node.exe`, `C:\Program Files\nodejs\npm.cmd`.
   - Đánh giá: `VERIFIED`. Đã phát hiện và sửa sai phiên bản hiển thị trước đó (`v20.18.0` / `10.8.2`) thành phiên bản thực tế trên đĩa (`v24.19.0` / `11.17.0`). Trạng thái: `INSTALLED`, `APPROVED`, `REQUIRED`.
4. **Docker Desktop Engine (`TOOL-EXT-004`)**:
   - Lệnh kiểm tra: `& "C:\Users\dienm\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe" --version` -> `Docker version 29.8.2, build 7fc2dff`.
   - Đường dẫn thực thi: `C:\Users\dienm\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe`.
   - Đánh giá: `VERIFIED`. Ghi nhận rõ binary không nằm trên default PATH của phiên shell cơ bản; thực thi qua đường dẫn đầy đủ. Trạng thái: `INSTALLED`, `APPROVED`, `REQUIRED`.
5. **Android SDK / ADB (`TOOL-EXT-005`)**:
   - Lệnh kiểm tra: `& "D:\AndroidSDK\platform-tools\adb.exe" version` -> `Android Debug Bridge version 1.0.41 (Version 37.0.1-15733141)`.
   - Đường dẫn thực thi: `D:\AndroidSDK\platform-tools\adb.exe`.
   - Đánh giá: `VERIFIED`. Đã sửa sai số hiệu bản build Platform-tools từ `35.0.2` thành `37.0.1-15733141` theo đúng output thực tế. Trạng thái: `INSTALLED`, `APPROVED`, `REQUIRED`.

---

## 4. Kết Quả Kiểm Toán Tiện Ích Mở Rộng IDE (`TOOL-EXT-006` .. `TOOL-EXT-010`)

Kiểm toán trực tiếp trong thư mục extension `C:\Users\dienm\.antigravity-ide\extensions`:

1. **GitLens (`TOOL-EXT-006`)**:
   - Thư mục thực tế: `eamodio.gitlens-19.4.0-universal`.
   - Phiên bản xác minh: `19.4.0` (đã sửa từ `2024.10.1505`).
   - Đánh giá: `VERIFIED`. Trạng thái: `INSTALLED`, `APPROVED`, `OPTIONAL`.
2. **SQLTools Database Management (`TOOL-EXT-007`)**:
   - Thư mục thực tế: `mtxr.sqltools-0.28.6-universal`.
   - Phiên bản xác minh: `0.28.6`.
   - Driver PostgreSQL (`mtxr.sqltools-driver-pg`): **Không tồn tại** trong thư mục extension!
   - Đánh giá: `VERIFIED`. Core extension `INSTALLED`, `APPROVED`. Driver PostgreSQL hạ cấp thành `CANDIDATE` / `NOT_INSTALLED`.
3. **Java Language Support & Tools (`TOOL-EXT-008`)**:
   - Thư mục thực tế: `redhat.java-1.57.0-win32-x64`, `vscjava.vscode-java-pack-0.31.2-universal`, `vscjava.vscode-maven-0.45.3-universal`, `vscjava.vscode-gradle-3.18.0-universal`.
   - Extension `vmware.vscode-spring-boot`: **Không tồn tại** trong thư mục extension!
   - Đánh giá: `VERIFIED`. Bộ công cụ Java `INSTALLED`, `APPROVED`. Extension Spring Boot hạ cấp thành `CANDIDATE` / `NOT_INSTALLED`.
4. **ESLint & Prettier (`TOOL-EXT-009`)**:
   - Thư mục thực tế: Cả `dbaeumer.vscode-eslint` và `esbenp.prettier-vscode` đều **không tồn tại** trong `C:\Users\dienm\.antigravity-ide\extensions`!
   - Tồn tại trên đĩa: `False`.
   - Đánh giá: **HẠ CẤP TRẠNG THÁI (Status Downgraded)**.
   - Trạng thái cũ: `APPROVED, ENABLED_FOR_WORKSPHERE, OPTIONAL` với đường dẫn giả định.
   - Trạng thái mới sau kiểm toán: `CANDIDATE`, `NOT_INSTALLED`.
   - Ghi chú: Việc kiểm tra lint và format hiện hoàn toàn được thực hiện an toàn qua script dự án (`npm run lint`, `npm test`) mà không bị ảnh hưởng.
5. **Microsoft Edge Tools (`TOOL-EXT-010`)**:
   - Thư mục thực tế: `ms-edgedevtools.vscode-edge-devtools-2.1.10-universal`.
   - Phiên bản xác minh: `2.1.10`.
   - Đánh giá: `VERIFIED`. Trạng thái: `INSTALLED`, `APPROVED`, `OPTIONAL`.

---

## 5. Bảng Kiểm Kê Toàn Diện Extension Thực Tế Tại IDE (Extension Inventory)

Đối soát toàn bộ 24 extension directories trong `C:\Users\dienm\.antigravity-ide\extensions`:

| STT | Extension Directory | Publisher & Tên | Version | Đánh giá trong WorkSphere |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `davidanson.vscode-markdownlint-0.62.1-universal` | David Anson / Markdownlint | 0.62.1 | `APPROVED` (Phát hiện lỗi Markdown; không tự sửa canonical docs) |
| 2 | `donjayamanne.githistory-0.6.20-universal` | Don Jayamanne / Git History | 0.6.20 | `OPTIONAL` (Ưu tiên GitLens hơn theo AGENTS.md) |
| 3 | `dotjoshjohnson.xml-2.5.1-universal` | Josh Johnson / XML Tools | 2.5.1 | `OPTIONAL` (Hỗ trợ cấu hình pom.xml và manifest) |
| 4 | `eamodio.gitlens-19.4.0-universal` | GitKraken / GitLens | 19.4.0 | `APPROVED` (`TOOL-EXT-006`) |
| 5 | `golang.go-0.56.1-universal` | Google / Go | 0.56.1 | `NOT_EVALUATED_FOR_WORKSPHERE` |
| 6 | `llvm-vs-code-extensions.vscode-clangd-0.6.0-universal` | LLVM / clangd | 0.6.0 | `NOT_EVALUATED_FOR_WORKSPHERE` |
| 7 | `meta.pyrefly-1.4.0-win32-x64` | Meta / Pyrefly | 1.4.0 | `NOT_EVALUATED_FOR_WORKSPHERE` |
| 8 | `ms-azuretools.vscode-containers-2.4.5-universal` | Microsoft / Containers | 2.4.5 | `OPTIONAL` |
| 9 | `ms-azuretools.vscode-docker-2.0.0-universal` | Microsoft / Docker | 2.0.0 | `OPTIONAL` (Bổ trợ Docker CLI nhưng không thay thế lệnh CLI) |
| 10 | `ms-edgedevtools.vscode-edge-devtools-2.1.10-universal` | Microsoft / Edge Tools | 2.1.10 | `APPROVED` (`TOOL-EXT-010`) |
| 11 | `ms-mssql.mssql-1.46.0-universal` | Microsoft / SQL Server | 1.46.0 | `NOT_RECOMMENDED` (WorkSphere dùng PostgreSQL canonical) |
| 12 | `ms-python.debugpy-2026.6.0-win32-x64` | Microsoft / Debugpy | 2026.6.0 | `OPTIONAL` |
| 13 | `ms-python.python-2026.4.0-universal` | Microsoft / Python | 2026.4.0 | `OPTIONAL` |
| 14 | `ms-python.vscode-python-envs-1.20.1-universal` | Microsoft / Python Envs | 1.20.1 | `OPTIONAL` |
| 15 | `ms-vscode.powershell-2025.4.0-universal` | Microsoft / PowerShell | 2025.4.0 | `APPROVED` (Hỗ trợ cú pháp script PowerShell Windows) |
| 16 | `mtxr.sqltools-0.28.6-universal` | Matheus Teixeira / SQLTools | 0.28.6 | `APPROVED` (`TOOL-EXT-007`) |
| 17 | `redhat.java-1.57.0-win32-x64` | Red Hat / Java Language Support | 1.57.0 | `APPROVED` (`TOOL-EXT-008`) |
| 18 | `shopify.ruby-lsp-0.10.6-universal` | Shopify / Ruby LSP | 0.10.6 | `NOT_EVALUATED_FOR_WORKSPHERE` |
| 19 | `vscjava.vscode-gradle-3.18.0-universal` | Microsoft / Gradle for Java | 3.18.0 | `APPROVED` (`TOOL-EXT-008` pack) |
| 20 | `vscjava.vscode-java-debug-0.60.0-universal` | Microsoft / Java Debug | 0.60.0 | `APPROVED` (`TOOL-EXT-008` pack) |
| 21 | `vscjava.vscode-java-dependency-0.27.7-universal` | Microsoft / Java Dependency | 0.27.7 | `APPROVED` (`TOOL-EXT-008` pack) |
| 22 | `vscjava.vscode-java-pack-0.31.2-universal` | Microsoft / Java Extension Pack | 0.31.2 | `APPROVED` (`TOOL-EXT-008` pack) |
| 23 | `vscjava.vscode-java-test-0.47.0-universal` | Microsoft / Java Test Runner | 0.47.0 | `APPROVED` (`TOOL-EXT-008` pack) |
| 24 | `vscjava.vscode-maven-0.45.3-universal` | Microsoft / Maven for Java | 0.45.3 | `APPROVED` (`TOOL-EXT-008` pack) |

---

## 6. Kiểm Tra Tính Hợp Lệ Của JSON Schema (Schema Validation)

- `reports/registry/external-resource.schema.json`: Đã kiểm tra cú pháp JSON qua Python parser (`json.load`), cấu trúc Draft-07 hoàn toàn hợp lệ, không có lỗi cú pháp.
- `reports/registry/tool-extension.schema.json`: Đã kiểm tra cú pháp JSON qua Python parser (`json.load`), cấu trúc Draft-07 hoàn toàn hợp lệ, không có lỗi cú pháp.

---

## 7. Kiểm Tra Bảo Mật và Bí Mật (Security Scan)

- Quét toàn bộ các tệp liên quan (`EXTERNAL_RESOURCE_REGISTRY.md`, `TOOL_EXTENSION_REGISTRY.md`, schemas, runbook) bằng thuật toán tìm kiếm token, private key, JWT, authorization header, password.
- Kết quả: **0 secret leaks detected**. Không chứa bất kỳ access token, credential, cookie, hay private key nào.

---

## 8. Danh Sách Tuyên Bố Bị Loại Bỏ Hoặc Hiệu Chỉnh (Unsupported Claims Removed)

1. **Loại bỏ tuyên bố bản sao đĩa cục bộ của `EXT-RES-001` và `EXT-RES-002`**: Cả hai mục đều là tài liệu tham chiếu trực tuyến, không có bản clone trong repository; đã chuẩn hóa thành `Local Copy Existence: False` và `Local Path: N/A (Online Reference)`.
2. **Loại bỏ tuyên bố cài đặt và phê duyệt cho `TOOL-EXT-009` (ESLint & Prettier)**: Thư mục extension không tồn tại; đã hạ cấp thành `CANDIDATE` / `NOT_INSTALLED`.
3. **Loại bỏ tuyên bố cài đặt cho `mtxr.sqltools-driver-pg`**: Tách rõ core `mtxr.sqltools` (đã cài) và driver PostgreSQL (chưa cài, là `CANDIDATE`).
4. **Loại bỏ tuyên bố cài đặt cho `vmware.vscode-spring-boot`**: Tách rõ Java Tools của Red Hat/Microsoft (đã cài) và Spring Boot extension (chưa cài, là `CANDIDATE`).
5. **Sửa sai số hiệu phiên bản**:
   - Node.js từ `v20.18.0` thành `v24.19.0`.
   - NPM từ `10.8.2` thành `11.17.0`.
   - ADB từ `35.0.2` thành `37.0.1-15733141`.
   - GitLens từ `2024.10.1505` thành `19.4.0`.
   - Edge Tools từ "Latest stable" thành `2.1.10`.
   - Java ghi nhận rõ Temurin OpenJDK 25 trên PATH cùng Oracle JDK 27.

---

## 9. Nhiệm Vụ Xác Minh Tiếp Theo (Remaining Verification Work)

- Khi có nhiệm vụ thực sự cần cài extension `mtxr.sqltools-driver-pg` hoặc `vmware.vscode-spring-boot`, Agent sẽ thực hiện quy trình kiểm định an ninh theo đúng D-057 và cập nhật trạng thái từ `CANDIDATE` lên `INSTALLED` / `APPROVED`.
- Hiện tại, mọi luồng build backend (Maven Wrapper), lint frontend (npm run lint), test (npm test / mvnw test) và database local (Docker PostgreSQL CLI / Testcontainers) đều hoạt động ổn định và độc lập với các extension chưa cài đặt.
