# Sổ Đăng Ký Công Cụ Và Tiện Ích Mở Rộng WorkSphere (Tool & Extension Registry)

Tài liệu quản lý, theo dõi nguồn gốc, chữ ký số, đường dẫn thực thi, quyền hạn và trạng thái kiểm định của toàn bộ công cụ CLI, ứng dụng phát triển, tiện ích mở rộng (Antigravity IDE / VS Code Extensions) và driver được sử dụng trong dự án WorkSphere.

Ngày thiết lập: 18/10/2026.
Ngày kiểm toán & chuẩn hóa: 18/10/2026 (Audit Checkpoint `4207e62`).
Cơ chế ban hành: Quyết định **D-057** và các quy định tại `AGENTS.md`.
Liên kết tham chiếu: Kế thừa và đồng bộ hóa với [`reports/ENVIRONMENT_TOOL_REGISTRY.md`](file:///d:/WorkSphere/reports/ENVIRONMENT_TOOL_REGISTRY.md).

---

## 1. Nguyên Tắc Quản Trị Công Cụ và Extension

1. **Phân biệt trách nhiệm giữa hai sổ đăng ký**:
   - [`reports/ENVIRONMENT_TOOL_REGISTRY.md`](file:///d:/WorkSphere/reports/ENVIRONMENT_TOOL_REGISTRY.md): Quản lý môi trường máy chủ phát triển (host environment), đường dẫn vận hành và hiện trạng cài đặt thực tế.
   - [`reports/TOOL_EXTENSION_REGISTRY.md`](file:///d:/WorkSphere/reports/TOOL_EXTENSION_REGISTRY.md): Quản lý nguồn gốc (provenance), mức độ tin cậy, giấy phép bản quyền, trạng thái phê duyệt (approval) và kiểm thẩm an ninh cho công cụ và extension.
2. **Quy chuẩn trạng thái vòng đời**:
   - `INSTALLED`: Đã cài trên hệ điều hành host hoặc IDE.
   - `NOT_INSTALLED`: Chưa cài đặt trên hệ thống cục bộ.
   - `ENABLED`: Đang được bật trong môi trường thực thi.
   - `ENABLED_FOR_WORKSPHERE`: Đã kích hoạt cho workspace WorkSphere.
   - `APPROVED`: Đã qua kiểm tra bảo mật, giấy phép và được duyệt sử dụng.
   - `REQUIRED`: Công cụ bắt buộc phải có để thực hiện nhiệm vụ theo canonical docs.
   - `OPTIONAL`: Công cụ bổ trợ, có thể dùng khi cần thiết.
   - `CANDIDATE`: Ứng viên tiềm năng nhưng chưa được cài đặt hoặc chưa hoàn tất kiểm thẩm an ninh.
   - `DEPRECATED`: Không còn khuyến khích sử dụng; đang chờ thay thế.
   - `REJECTED`: Bị cấm sử dụng trong WorkSphere do vi phạm chính sách bảo mật/giấy phép.
   - `QUARANTINED`: Đang nằm trong khu cách ly `.external/quarantine/tools/` hoặc `extensions/` để kiểm định.
3. **Quy tắc kiểm toán sự thật (Ground Truth Verification)**:
   - Một extension/tool chỉ được coi là `INSTALLED` khi có bằng chứng thư mục/executable thực tế trên đĩa.
   - Việc extension được cài đặt không đồng nghĩa với việc được `APPROVED`.
   - Extension không tồn tại trên đĩa bắt buộc phải gán `CANDIDATE` hoặc `NOT_INSTALLED`; tuyệt đối không bịa đặt trạng thái `INSTALLED` hay `APPROVED`.

---

## 2. Mẫu Hồ Sơ Chuẩn (Tool & Extension Template)

```markdown
### [TOOL-EXT-XXX] <Tên công cụ hoặc Extension>

- **Registry ID**: `TOOL-EXT-XXX`
- **Phân loại (Category)**: `tool` | `application` | `cli` | `extension` | `driver`
- **Tên sản phẩm**: <Tên hiển thị>
- **Extension ID** (nếu là extension): `<publisher>.<name>`
- **Publisher / Nhà phát hành**: <Tên đơn vị>
- **Nguồn tải chính thức**: <URL trang chủ hoặc Marketplace>
- **Phiên bản xác minh**: <Version thực tế kiểm tra>
- **Hình thức cài đặt**: `portable` | `installer` | `winget` | `marketplace` | `package_manager` | `builtin`
- **Mã băm SHA-256**: <Checksum nếu tải offline>
- **Chữ ký số Authenticode**: `VALID_OFFICIAL` | `UNSIGNED` | `SELF_SIGNED` | `NOT_APPLICABLE`
- **Đường dẫn tệp thực thi / VSIX**: `<Executable or VSIX path>`
- **Tồn tại trên máy cục bộ (Local Existence)**: `True` | `False`
- **Đường dẫn dữ liệu (Data Path)**: `<Path>`
- **Đường dẫn bộ đệm (Cache Path)**: `<Path>`
- **Đường dẫn cấu hình (Config Path)**: `<Path>`
- **Đường dẫn nhật ký (Log Path)**: `<Path>`
- **Yêu cầu quyền Administrator**: `Có` | `Không`
- **Tác động biến môi trường PATH**: `Không` | `Bổ sung đường dẫn ...`
- **Dịch vụ chạy ngầm / Background Tasks**: `Không` | `Tên service ...`
- **Điểm cuối mạng (Network Endpoints)**: `Offline-only` | `Localhost only` | `Endpoints ...`
- **Yêu cầu Workspace Trust**: `Có` | `Không`
- **Giấy phép (License)**: `<SPDX identifier>`
- **Trạng thái (Status)**: `INSTALLED` | `NOT_INSTALLED` | `ENABLED` | `ENABLED_FOR_WORKSPHERE` | `APPROVED` | `REQUIRED` | `OPTIONAL` | `CANDIDATE` | `DEPRECATED` | `REJECTED` | `QUARANTINED`
- **Lệnh kiểm tra (Verification)**: `<Command>`
- **Quy trình gỡ bỏ / Phục hồi**: `<Command or steps>`
- **Mục đích phục vụ WorkSphere**: <Mô tả nghiệp vụ>
- **Ngày xác minh gần nhất**: YYYY-MM-DD
- **Ghi chú**: ...
```

---

## 3. Danh Mục Công Cụ Nền Tảng (Core Platform Tools)

### [TOOL-EXT-001] Git for Windows

- **Registry ID**: `TOOL-EXT-001`
- **Phân loại**: `cli`
- **Tên sản phẩm**: Git for Windows
- **Publisher**: Software Freedom Conservancy
- **Nguồn tải chính thức**: `https://git-scm.com/download/win` / winget (`Git.Git`)
- **Phiên bản xác minh**: `2.55.0.windows.3` (Xác minh qua `git --version`)
- **Hình thức cài đặt**: `installer`
- **Chữ ký số Authenticode**: `VALID_OFFICIAL`
- **Đường dẫn tệp thực thi**: `C:\Program Files\Git\cmd\git.exe`
- **Tồn tại trên máy cục bộ**: `True`
- **Đường dẫn dữ liệu**: `D:\WorkSphere\.git`
- **Đường dẫn cấu hình**: `C:\Users\dienm\.gitconfig`
- **Yêu cầu quyền Administrator**: Không khi chạy
- **Tác động biến môi trường PATH**: Đã tích hợp trong User PATH
- **Dịch vụ chạy ngầm**: Không
- **Điểm cuối mạng**: `https://github.com/c06-prog/WorkSphere.git`
- **Giấy phép**: `GPL-2.0-only`
- **Trạng thái**: `REQUIRED`, `APPROVED`, `INSTALLED`
- **Lệnh kiểm tra**: `git --version`, `git status`
- **Quy trình gỡ bỏ**: `winget uninstall Git.Git`
- **Mục đích phục vụ WorkSphere**: Quản lý phiên bản, lịch sử kiểm toán, commit, diff và đồng bộ GitHub.
- **Ngày xác minh gần nhất**: 2026-10-18

---

### [TOOL-EXT-002] Java Development Kit (JDK 25 Active / JDK 27 Installed, Target Bytecode Java 21)

- **Registry ID**: `TOOL-EXT-002`
- **Phân loại**: `tool`
- **Tên sản phẩm**: OpenJDK Temurin 25 / Oracle JDK 27 (Bytecode Target Java 21)
- **Publisher**: Eclipse Adoptium (Temurin) / Oracle Corporation
- **Nguồn tải chính thức**: `https://adoptium.net/` / `https://www.oracle.com/java/technologies/downloads/`
- **Phiên bản xác minh**:
  - Runtime mặc định trên PATH: `Temurin-25.0.4.1+1-LTS` (OpenJDK 64-Bit Server VM, path `D:\Program Files\bin\java.exe`)
  - Runtime phụ cài đặt: Oracle JDK `27+35-2325` (path `D:\Java\bin\java.exe`)
  - Runtime Android Studio: OpenJDK `25.0.3` (path `D:\Android\jbr`)
  - Mục tiêu biên dịch (Target bytecode): `Java 21` (cấu hình chuẩn trong `backend/pom.xml`)
- **Hình thức cài đặt**: `installer`
- **Chữ ký số Authenticode**: `VALID_OFFICIAL`
- **Đường dẫn tệp thực thi**: `D:\Program Files\bin\java.exe` (Default PATH), `D:\Java\bin\java.exe`
- **Tồn tại trên máy cục bộ**: `True`
- **Đường dẫn dữ liệu**: `D:\Java`, `D:\Program Files`
- **Yêu cầu quyền Administrator**: Không khi chạy
- **Tác động biến môi trường PATH**: Đã tích hợp trong PATH
- **Giấy phép**: `GPL-2.0-with-classpath-exception` (Temurin) / `NFTC` (Oracle)
- **Trạng thái**: `REQUIRED`, `APPROVED`, `INSTALLED`
- **Lệnh kiểm tra**: `java -version`, `& "D:\Java\bin\java.exe" -version`
- **Quy trình gỡ bỏ**: Windows Settings -> Installed Apps
- **Mục đích phục vụ WorkSphere**: Biên dịch và chạy backend Spring Boot Modular Monolith.
- **Ngày xác minh gần nhất**: 2026-10-18

---

### [TOOL-EXT-003] Node.js and NPM

- **Registry ID**: `TOOL-EXT-003`
- **Phân loại**: `tool`
- **Tên sản phẩm**: Node.js JavaScript Runtime & NPM Package Manager
- **Publisher**: OpenJS Foundation
- **Nguồn tải chính thức**: `https://nodejs.org/` / winget (`OpenJS.NodeJS.LTS`)
- **Phiên bản xác minh**: Node.js `v24.19.0` (LTS) / NPM `11.17.0` (Xác minh thực tế qua `node -v` và `npm -v`)
- **Hình thức cài đặt**: `installer`
- **Chữ ký số Authenticode**: `VALID_OFFICIAL`
- **Đường dẫn tệp thực thi**: `C:\Program Files\nodejs\node.exe`, `C:\Program Files\nodejs\npm.cmd`
- **Tồn tại trên máy cục bộ**: `True`
- **Đường dẫn bộ đệm**: `C:\Users\dienm\AppData\Local\npm-cache`
- **Yêu cầu quyền Administrator**: Không khi chạy
- **Tác động biến môi trường PATH**: Đã tích hợp trong System/User PATH
- **Giấy phép**: `MIT`
- **Trạng thái**: `REQUIRED`, `APPROVED`, `INSTALLED`
- **Lệnh kiểm tra**: `node -v`, `npm -v`
- **Quy trình gỡ bỏ**: `winget uninstall OpenJS.NodeJS.LTS`
- **Mục đích phục vụ WorkSphere**: Môi trường Metro Bundler, React Native CLI, Jest, TypeScript compiler và linter cho ứng dụng di động.
- **Ngày xác minh gần nhất**: 2026-10-18

---

### [TOOL-EXT-004] Docker Desktop Engine

- **Registry ID**: `TOOL-EXT-004`
- **Phân loại**: `application`
- **Tên sản phẩm**: Docker Desktop Community (Docker Engine, Compose, CLI)
- **Publisher**: Docker Inc.
- **Nguồn tải chính thức**: `https://www.docker.com/products/docker-desktop/`
- **Phiên bản xác minh**: Docker Desktop `4.94.0`, Docker Engine `29.8.2, build 7fc2dff` (Xác minh qua direct binary invocation)
- **Hình thức cài đặt**: `installer`
- **Chữ ký số Authenticode**: `VALID_OFFICIAL`
- **Đường dẫn tệp thực thi**: `C:\Users\dienm\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe`
- **Tồn tại trên máy cục bộ**: `True`
- **Đường dẫn dữ liệu**: `D:\DockerData\DockerDesktopWSL`
- **Yêu cầu quyền Administrator**: Khi cài đặt và khởi động service
- **Tác động biến môi trường PATH**: Chưa có trong default session PATH; thực thi qua đường dẫn đầy đủ hoặc qua Docker Desktop wrapper
- **Dịch vụ chạy ngầm**: `com.docker.service`, WSL2 backend
- **Điểm cuối mạng**: `127.0.0.1:5432` (`worksphere-dev-pg`), `127.0.0.1:8088` (`jenkins-lts`)
- **Giấy phép**: `Docker Subscription Service Agreement` (Personal / Academic)
- **Trạng thái**: `REQUIRED`, `APPROVED`, `INSTALLED`
- **Lệnh kiểm tra**: `& "C:\Users\dienm\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe" version`
- **Quy trình gỡ bỏ**: Windows Settings -> Installed Apps
- **Mục đích phục vụ WorkSphere**: Chạy PostgreSQL container phát triển (`worksphere-dev-pg`), Jenkins CI/CD và Testcontainers integration tests.
- **Ngày xác minh gần nhất**: 2026-10-18

---

### [TOOL-EXT-005] Android SDK Platform-Tools & Android Emulator

- **Registry ID**: `TOOL-EXT-005`
- **Phân loại**: `tool`
- **Tên sản phẩm**: Android SDK Platform-Tools (ADB) & Emulator
- **Publisher**: Google LLC
- **Nguồn tải chính thức**: Android Studio / Google Android SDK Command-Line Tools
- **Phiên bản xác minh**: ADB `1.0.41` (Platform Tools Version `37.0.1-15733141`), Emulator API 35 (Android 15)
- **Hình thức cài đặt**: `portable` / SDK Manager
- **Đường dẫn tệp thực thi**: `D:\AndroidSDK\platform-tools\adb.exe`, `D:\AndroidSDK\emulator\emulator.exe`
- **Tồn tại trên máy cục bộ**: `True`
- **Đường dẫn dữ liệu**: `D:\AndroidSDK`, `D:\AndroidAVD`
- **Yêu cầu quyền Administrator**: Không khi chạy
- **Tác động biến môi trường PATH**: `ANDROID_HOME=D:\AndroidSDK`; CLI gọi qua đường dẫn trực tiếp hoặc sau khi nạp PATH
- **Điểm cuối mạng**: `127.0.0.1:5554`, `10.0.2.2` (host bridge từ máy ảo)
- **Giấy phép**: `Android Software Development Kit License`
- **Trạng thái**: `REQUIRED`, `APPROVED`, `INSTALLED`
- **Lệnh kiểm tra**: `& "D:\AndroidSDK\platform-tools\adb.exe" version`, `& "D:\AndroidSDK\platform-tools\adb.exe" devices`
- **Mục đích phục vụ WorkSphere**: Cài đặt APK debug, kiểm thử native hardware Keystore/AsyncStorage, thu logcat và kiểm thử UI hồi quy trên Android Emulator.
- **Ngày xác minh gần nhất**: 2026-10-18

---

## 4. Danh Mục Extension Cho Antigravity IDE (Verified IDE Extensions)

### [TOOL-EXT-006] Extension: GitLens — Git supercharged

- **Registry ID**: `TOOL-EXT-006`
- **Phân loại**: `extension`
- **Tên sản phẩm**: GitLens — Git supercharged
- **Extension ID**: `eamodio.gitlens`
- **Publisher**: GitKraken
- **Nguồn tải chính thức**: Visual Studio Code Marketplace
- **Phiên bản xác minh**: `19.4.0` (Xác minh tại `C:\Users\dienm\.antigravity-ide\extensions\eamodio.gitlens-19.4.0-universal`)
- **Hình thức cài đặt**: `marketplace`
- **Đường dẫn cài đặt**: `C:\Users\dienm\.antigravity-ide\extensions\eamodio.gitlens-19.4.0-universal`
- **Tồn tại trên máy cục bộ**: `True`
- **Yêu cầu quyền Administrator**: Không
- **Yêu cầu Workspace Trust**: Không
- **Giấy phép**: `MIT` / Proprietary Cloud Features (Chỉ dùng Local Git Features)
- **Trạng thái**: `APPROVED`, `ENABLED_FOR_WORKSPHERE`, `OPTIONAL`
- **Mục đích phục vụ WorkSphere**: Kiểm toán commit blame từng dòng, kiểm tra lịch sử revision và đối soát tác giả mà không làm thay đổi Git state.
- **Ngày xác minh gần nhất**: 2026-10-18

---

### [TOOL-EXT-007] Extension: SQLTools Database Management

- **Registry ID**: `TOOL-EXT-007`
- **Phân loại**: `extension`
- **Tên sản phẩm**: SQLTools Database Management
- **Extension ID**: `mtxr.sqltools`
- **Publisher**: Matheus Teixeira
- **Nguồn tải chính thức**: Visual Studio Code Marketplace
- **Phiên bản xác minh**: `0.28.6` (Xác minh tại `C:\Users\dienm\.antigravity-ide\extensions\mtxr.sqltools-0.28.6-universal`)
- **Hình thức cài đặt**: `marketplace`
- **Đường dẫn cài đặt**: `C:\Users\dienm\.antigravity-ide\extensions\mtxr.sqltools-0.28.6-universal`
- **Tồn tại trên máy cục bộ**: `True`
- **Yêu cầu quyền Administrator**: Không
- **Yêu cầu Workspace Trust**: Có
- **Giấy phép**: `MIT`
- **Trạng thái**: `APPROVED`, `ENABLED_FOR_WORKSPHERE`, `OPTIONAL`
- **Lưu ý kiểm toán**: Extension driver `mtxr.sqltools-driver-pg` hiện **CHƯA CÀI ĐẶT** trong thư mục extension của IDE (phân loại là `CANDIDATE` / `NOT_INSTALLED`). Hiện tại việc tương tác database tiếp tục sử dụng PostgreSQL CLI/psql hoặc Testcontainers an toàn.
- **Mục đích phục vụ WorkSphere**: Khảo sát schema PostgreSQL canonical khi driver tương thích được cài đặt.
- **Ngày xác minh gần nhất**: 2026-10-18

---

### [TOOL-EXT-008] Extension: Language Support for Java & Java Tools

- **Registry ID**: `TOOL-EXT-008`
- **Phân loại**: `extension`
- **Tên sản phẩm**: Language Support for Java (by Red Hat) & Java Extension Pack
- **Extension ID**: `redhat.java`, `vscjava.vscode-java-pack`, `vscjava.vscode-maven`, `vscjava.vscode-gradle`
- **Publisher**: Red Hat / Microsoft
- **Nguồn tải chính thức**: Visual Studio Code Marketplace
- **Phiên bản xác minh**: `redhat.java-1.57.0`, `vscjava.vscode-java-pack-0.31.2`, `vscjava.vscode-maven-0.45.3`, `vscjava.vscode-gradle-3.18.0`
- **Hình thức cài đặt**: `marketplace`
- **Đường dẫn cài đặt**: `C:\Users\dienm\.antigravity-ide\extensions\redhat.java-1.57.0-win32-x64`
- **Tồn tại trên máy cục bộ**: `True`
- **Yêu cầu quyền Administrator**: Không
- **Yêu cầu Workspace Trust**: Có
- **Giấy phép**: `EPL-2.0` / `MIT`
- **Trạng thái**: `APPROVED`, `ENABLED_FOR_WORKSPHERE`, `OPTIONAL`
- **Lưu ý kiểm toán**: Extension `vmware.vscode-spring-boot` hiện **CHƯA CÀI ĐẶT** trên máy cục bộ (phân loại là `CANDIDATE` / `NOT_INSTALLED`).
- **Mục đích phục vụ WorkSphere**: Phân tích cú pháp, language server, hỗ trợ refactor an toàn và nhận diện cấu trúc Spring Boot Modular Monolith.
- **Ngày xác minh gần nhất**: 2026-10-18

---

### [TOOL-EXT-009] Extension: ESLint & Prettier for React Native

- **Registry ID**: `TOOL-EXT-009`
- **Phân loại**: `extension`
- **Tên sản phẩm**: ESLint & Prettier Code Formatter Extensions
- **Extension ID**: `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`
- **Publisher**: Microsoft / Prettier
- **Nguồn tải chính thức**: Visual Studio Code Marketplace
- **Phiên bản xác minh**: N/A (Chưa cài đặt trong IDE)
- **Hình thức cài đặt**: `marketplace`
- **Đường dẫn cài đặt**: `None (Not installed in C:\Users\dienm\.antigravity-ide\extensions)`
- **Tồn tại trên máy cục bộ**: `False`
- **Yêu cầu quyền Administrator**: Không
- **Giấy phép**: `MIT`
- **Trạng thái**: `CANDIDATE`, `NOT_INSTALLED` (Đã hạ cấp từ `APPROVED` do không có bản cài trên máy host)
- **Lưu ý kiểm toán**: Việc kiểm tra quy tắc mã nguồn và định dạng hiện tại hoàn toàn được đảm bảo thông qua Node CLI của dự án (`npm run lint`, `npm test`) mà không phụ thuộc vào extension IDE.
- **Mục đích phục vụ WorkSphere**: Ứng viên hỗ trợ lint trực tiếp trên editor khi được cài đặt.
- **Ngày xác minh gần nhất**: 2026-10-18

---

### [TOOL-EXT-010] Extension: Microsoft Edge Tools for VS Code

- **Registry ID**: `TOOL-EXT-010`
- **Phân loại**: `extension`
- **Tên sản phẩm**: Microsoft Edge Tools for VS Code
- **Extension ID**: `ms-edgedevtools.vscode-edge-devtools`
- **Publisher**: Microsoft Corporation
- **Nguồn tải chính thức**: Visual Studio Code Marketplace
- **Phiên bản xác minh**: `2.1.10` (Xác minh tại `C:\Users\dienm\.antigravity-ide\extensions\ms-edgedevtools.vscode-edge-devtools-2.1.10-universal`)
- **Hình thức cài đặt**: `marketplace`
- **Đường dẫn cài đặt**: `C:\Users\dienm\.antigravity-ide\extensions\ms-edgedevtools.vscode-edge-devtools-2.1.10-universal`
- **Tồn tại trên máy cục bộ**: `True`
- **Yêu cầu quyền Administrator**: Không
- **Giấy phép**: `MIT`
- **Trạng thái**: `APPROVED`, `ENABLED_FOR_WORKSPHERE`, `OPTIONAL`
- **Mục đích phục vụ WorkSphere**: Kiểm thử hiển thị, viewport responsive (360x800, 411x914) và accessibility cho prototype HTML5/CSS3.
- **Ngày xác minh gần nhất**: 2026-10-18

---

## 5. Kiểm Kê Toàn Bộ Extension Thực Tế Tại `C:\Users\dienm\.antigravity-ide\extensions`

Bảng đối soát đầy đủ toàn bộ 24 extension directories được phát hiện trên máy phát triển:

| Thư mục / Extension Identifier | Publisher / Name | Phiên bản | Tình trạng trong WorkSphere |
| :--- | :--- | :--- | :--- |
| `davidanson.vscode-markdownlint-0.62.1-universal` | David Anson / Markdownlint | `0.62.1` | `APPROVED` (Phát hiện lỗi Markdown; không tự ý sửa canonical docs) |
| `donjayamanne.githistory-0.6.20-universal` | Don Jayamanne / Git History | `0.6.20` | `OPTIONAL` (Ưu tiên GitLens hơn theo AGENTS.md) |
| `dotjoshjohnson.xml-2.5.1-universal` | Josh Johnson / XML Tools | `2.5.1` | `OPTIONAL` (Hỗ trợ cấu hình `pom.xml` và `AndroidManifest.xml`) |
| `eamodio.gitlens-19.4.0-universal` | GitKraken / GitLens | `19.4.0` | `APPROVED` (`TOOL-EXT-006`) |
| `golang.go-0.56.1-universal` | Go Team at Google / Go | `0.56.1` | `NOT_EVALUATED_FOR_WORKSPHERE` (Ngoài phạm vi dự án) |
| `llvm-vs-code-extensions.vscode-clangd-0.6.0-universal` | LLVM / clangd | `0.6.0` | `NOT_EVALUATED_FOR_WORKSPHERE` (Ngoài phạm vi dự án) |
| `meta.pyrefly-1.4.0-win32-x64` | Meta / Pyrefly | `1.4.0` | `NOT_EVALUATED_FOR_WORKSPHERE` (Ngoài phạm vi dự án) |
| `ms-azuretools.vscode-containers-2.4.5-universal` | Microsoft / Containers | `2.4.5` | `OPTIONAL` (Hỗ trợ container discovery) |
| `ms-azuretools.vscode-docker-2.0.0-universal` | Microsoft / Docker | `2.0.0` | `OPTIONAL` (Bổ trợ Docker CLI nhưng không thay thế lệnh CLI) |
| `ms-edgedevtools.vscode-edge-devtools-2.1.10-universal` | Microsoft / Edge Tools | `2.1.10` | `APPROVED` (`TOOL-EXT-010`) |
| `ms-mssql.mssql-1.46.0-universal` | Microsoft / SQL Server | `1.46.0` | `NOT_RECOMMENDED` (WorkSphere dùng PostgreSQL chuẩn; mssql chỉ dùng khi có yêu cầu riêng) |
| `ms-python.debugpy-2026.6.0-win32-x64` | Microsoft / Debugpy | `2026.6.0` | `OPTIONAL` (Hỗ trợ chạy Python scratch scripts) |
| `ms-python.python-2026.4.0-universal` | Microsoft / Python | `2026.4.0` | `OPTIONAL` (Hỗ trợ Python automation scripts) |
| `ms-python.vscode-python-envs-1.20.1-universal` | Microsoft / Python Envs | `1.20.1` | `OPTIONAL` |
| `ms-vscode.powershell-2025.4.0-universal` | Microsoft / PowerShell | `2025.4.0` | `APPROVED` (Hỗ trợ cú pháp script PowerShell Windows) |
| `mtxr.sqltools-0.28.6-universal` | Matheus Teixeira / SQLTools | `0.28.6` | `APPROVED` (`TOOL-EXT-007`) |
| `redhat.java-1.57.0-win32-x64` | Red Hat / Java Language Support | `1.57.0` | `APPROVED` (`TOOL-EXT-008`) |
| `shopify.ruby-lsp-0.10.6-universal` | Shopify / Ruby LSP | `0.10.6` | `NOT_EVALUATED_FOR_WORKSPHERE` (Ngoài phạm vi dự án) |
| `vscjava.vscode-gradle-3.18.0-universal` | Microsoft / Gradle for Java | `3.18.0` | `APPROVED` (`TOOL-EXT-008` pack) |
| `vscjava.vscode-java-debug-0.60.0-universal` | Microsoft / Java Debug | `0.60.0` | `APPROVED` (`TOOL-EXT-008` pack) |
| `vscjava.vscode-java-dependency-0.27.7-universal` | Microsoft / Java Dependency | `0.27.7` | `APPROVED` (`TOOL-EXT-008` pack) |
| `vscjava.vscode-java-pack-0.31.2-universal` | Microsoft / Java Extension Pack | `0.31.2` | `APPROVED` (`TOOL-EXT-008` pack) |
| `vscjava.vscode-java-test-0.47.0-universal` | Microsoft / Java Test Runner | `0.47.0` | `APPROVED` (`TOOL-EXT-008` pack) |
| `vscjava.vscode-maven-0.45.3-universal` | Microsoft / Maven for Java | `0.45.3` | `APPROVED` (`TOOL-EXT-008` pack) |

---

## 6. Nhật Ký Cập Nhật (Registry Changelog)

| Ngày | Registry ID | Loại | Trạng thái | Đơn vị thực hiện | Quyết định / Căn cứ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-10-18 | `TOOL-EXT-001` .. `TOOL-EXT-005` | Core CLI & Tools | `APPROVED` | WorkSphere Agent | Chuẩn hóa danh mục công cụ nền tảng WorkSphere (D-020, D-057) |
| 2026-10-18 | `TOOL-EXT-006` .. `TOOL-EXT-010` | IDE Extensions | `APPROVED` | WorkSphere Agent | Chuẩn hóa danh mục Extension Antigravity IDE (D-034, D-057) |
| 2026-10-18 | `TOOL-EXT-001` .. `TOOL-EXT-010` | Tools & Extensions | Audit & Sửa sai | WorkSphere Agent | Đối soát hệ thống đĩa: chuẩn hóa version Node/NPM/ADB/GitLens/Edge; hạ cấp ESLint/Prettier sang CANDIDATE; tách rõ SQLTools Driver và Spring Boot chưa cài đặt. |
