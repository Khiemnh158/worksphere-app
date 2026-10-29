# Hồ Sơ Công Cụ Và Môi Trường WorkSphere (Environment Tool Registry)

Tài liệu kiểm kê, theo dõi và quản lý công cụ, ứng dụng, môi trường thực thi và quyền hạn trong hệ thống WorkSphere.
Ngày xác minh: 15/10/2026.

---

## 1. Nguyên Tắc Quản Lý Công Cụ

1. **Ưu tiên giải pháp có sẵn**: Trước khi cài đặt mới hoặc tự viết thêm, Agent phải kiểm tra theo thứ tự:
   - WorkSphere đã có script hoặc công cụ tương đương chưa.
   - Hệ điều hành đã có ứng dụng chuẩn phù hợp chưa.
   - Framework/stack hiện tại (Spring Boot, React Native, Testcontainers) có tính năng chính thức chưa.
   - Tài liệu kỹ thuật chính thức có quy trình chuẩn chưa.
   - Có thư viện/package chính thức, được duy trì tốt với license tương thích không.
   - Chỉ tự phát triển thành phần chưa có giải pháp phù hợp.
2. **Kênh cài đặt ưu tiên**:
   - Ưu tiên 1: `winget` với Package ID chính thức.
   - Ưu tiên 2: Bộ cài từ website chính thức của nhà phát hành (Verified Publisher).
   - Ưu tiên 3: Package manager dự án (`mvnw`, `npm`, `gradlew`, Android SDK Manager).
   - Cấm: Website phần mềm bên thứ ba không chính thức, link rút gọn, torrent, repack, crack, keygen, hoặc lệnh `Invoke-Expression` (IEX) tải trực tiếp từ internet.
3. **Phân bổ lưu trữ**:
   - Ưu tiên lưu trữ dữ liệu nặng trên ổ `D:`:
     - `D:\AI\Tools`, `D:\AI\SDK`, `D:\AI\Installers`, `D:\AI\Cache`, `D:\AI\Temp`, `D:\AI\Logs`, `D:\AI\Profiles`
     - Android SDK: `D:\AndroidSDK`
     - Android AVD: `D:\AndroidAVD` (hoặc `C:\Users\dienm\.android\avd`)
     - Docker Data: `D:\DockerData\DockerDesktopWSL`
     - Mã nguồn WorkSphere: `D:\WorkSphere`
   - Phần lõi nhỏ của ứng dụng bắt buộc nằm trên ổ `C:` được chấp nhận, nhưng cache/SDK/images phải trỏ sang `D:` nếu công cụ hỗ trợ.
4. **Xử lý can thiệp của người dùng (User Action Safeguards)**:
   - Agent không tự vượt qua UAC, màn hình đăng nhập tài khoản, thanh toán, điều khoản pháp lý, hay prompt cấp quyền nhạy cảm của hệ điều hành.
   - Khi gặp các tình huống trên, Agent báo trạng thái `BLOCKED_FOR_USER_ACTION`, nêu rõ: Tên ứng dụng, Nhà phát hành, Nguồn tải, Lý do cần, và Thao tác chính xác người dùng cần thực hiện.
5. **Thu thập bằng chứng và bảo mật**:
   - Ảnh chụp kiểm thử tạm thời lưu tại `design/prototype/review-output/` (không commit mặc định).
   - Ảnh chụp được duyệt cho báo cáo lưu tại `reports/screenshots/` với định dạng: `<figure-id>_<screen-id>_<state>_<yyyyMMdd-HHmmss>.png`.
   - Tuyệt đối cấm chụp hoặc ghi lại mật khẩu, token, private key, thông tin cá nhân hoặc ứng dụng ngoài phạm vi WorkSphere.

---

## 2. Danh Mục Kiểm Kê Công Cụ (Tool Registry)

### 2.1. Git
- **Mục đích**: Quản lý mã nguồn phân tán (VCS) cho toàn bộ repository WorkSphere.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `2.55.0.windows.3`
- **Publisher**: Software Freedom Conservancy / Git for Windows
- **Nguồn cài đặt**: winget (`Git.Git`) / Official Installer
- **License**: GNU General Public License v2 (GPLv2)
- **Executable path**: `C:\Program Files\Git\cmd\git.exe`
- **Data path**: `D:\WorkSphere\.git`
- **Cache path**: N/A
- **Config path**: `C:\Users\dienm\.gitconfig`
- **Log path**: `git log` / terminal stdout
- **Cách mở**: CLI Terminal (`git`)
- **Lệnh kiểm tra**: `git --version`, `git status`
- **Quyền Administrator**: Không cần trong thao tác hằng ngày
- **Tích hợp WorkSphere**: Quản lý commit, branch, diff, remote origin, và lịch sử kiểm toán
- **Ghi chú an toàn**: Cấm force push, cấm `git reset --hard`, cấm `git clean -fd`, cấm rebase `main`
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe git`, `winget list --id Git.Git`

---

### 2.2. Java Development Kit (JDK 27)
- **Mục đích**: Môi trường phát triển và thực thi ứng dụng backend Spring Boot.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `27+35-2325` (Oracle Java SE Runtime Environment 27)
- **Publisher**: Oracle Corporation
- **Nguồn cài đặt**: Official Oracle JDK Installer
- **License**: Oracle No-Fee Terms and Conditions (NFTC) / Commercial
- **Executable path**: `D:\Java\bin\java.exe`
- **Data path**: `D:\Java`
- **Cache path**: N/A
- **Config path**: `D:\Java\conf`
- **Log path**: Terminal stdout/stderr
- **Cách mở**: CLI Terminal (`java`)
- **Lệnh kiểm tra**: `java -version`
- **Quyền Administrator**: Không cần khi chạy
- **Tích hợp WorkSphere**: Biên dịch và chạy backend WorkSphere với mục tiêu bytecode Java 21
- **Ghi chú an toàn**: Giữ nguyên mục tiêu Java 21 trong `pom.xml`, không nâng target ngoài tài liệu chuẩn
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe java`, `$env:JAVA_HOME`

---

### 2.3. Maven Wrapper
- **Mục đích**: Công cụ quản lý dependency, build, test và checkstyle tự động cho backend.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `Apache Maven 3.9.16`
- **Publisher**: Apache Software Foundation
- **Nguồn cài đặt**: Maven Wrapper script trong repository
- **License**: Apache License 2.0
- **Executable path**: `D:\WorkSphere\backend\mvnw.cmd`
- **Data path**: `D:\WorkSphere\backend`
- **Cache path**: `C:\Users\dienm\.m2\repository`, `C:\Users\dienm\.m2\wrapper\dists`
- **Config path**: `D:\WorkSphere\backend\.mvn\wrapper\maven-wrapper.properties`
- **Log path**: `D:\WorkSphere\backend\target\`
- **Cách mở**: `.\mvnw.cmd <goals>` trong thư mục `D:\WorkSphere\backend`
- **Lệnh kiểm tra**: `.\mvnw.cmd -v`
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Quản lý vòng đời build, thực thi 90 bài test và kiểm tra quy tắc Checkstyle
- **Ghi chú an toàn**: Không sửa đổi `pom.xml` ngoài phạm vi nhiệm vụ được phân công
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: Kiểm tra `mvnw.cmd` tại `D:\WorkSphere\backend`

---

### 2.4. Node.js
- **Mục đích**: Runtime JavaScript cho môi trường frontend prototype và phát triển React Native mobile.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `v24.19.0` (LTS)
- **Publisher**: OpenJS Foundation
- **Nguồn cài đặt**: winget (`OpenJS.NodeJS.LTS`)
- **License**: MIT License
- **Executable path**: `C:\Program Files\nodejs\node.exe`
- **Data path**: `C:\Program Files\nodejs`
- **Cache path**: `C:\Users\dienm\AppData\Local\npm-cache`
- **Config path**: `C:\Users\dienm\.npmrc`
- **Log path**: Terminal stdout/stderr
- **Cách mở**: CLI Terminal (`node`)
- **Lệnh kiểm tra**: `node -v`
- **Quyền Administrator**: Không cần cho ứng dụng local
- **Tích hợp WorkSphere**: Khởi chạy local server cho prototype và chuẩn bị công cụ cho mobile module
- **Ghi chú an toàn**: Chỉ bind local IP `127.0.0.1`, không mở port public ra ngoài
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe node`, `winget list --id OpenJS.NodeJS.LTS`

---

### 2.5. npm
- **Mục đích**: Trình quản lý package cho Node.js.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `11.17.0`
- **Publisher**: npm, Inc. / GitHub
- **Nguồn cài đặt**: Tích hợp kèm theo Node.js
- **License**: Artistic License 2.0
- **Executable path**: `C:\Program Files\nodejs\npm.cmd`
- **Data path**: `C:\Users\dienm\AppData\Roaming\npm`
- **Cache path**: `C:\Users\dienm\AppData\Local\npm-cache`
- **Config path**: `C:\Users\dienm\.npmrc`
- **Log path**: `C:\Users\dienm\AppData\Local\npm-cache\_logs`
- **Cách mở**: CLI Terminal (`npm`)
- **Lệnh kiểm tra**: `npm -v`
- **Quyền Administrator**: Cần khi cài đặt global package (`-g`), không cần khi cài đặt trong dự án
- **Tích hợp WorkSphere**: Quản lý package phụ trợ cho UI prototype và React Native
- **Ghi chú an toàn**: Luôn kiểm tra bảo mật (npm audit) và tính tương thích của package trước khi đưa vào
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe npm`

---

### 2.6. Python
- **Mục đích**: Runtime cho các script phân tích hoặc tiện ích mở rộng nếu cần.
- **Trạng thái**: `NOT_INSTALLED` (Hiện chỉ có Windows Execution Alias stub)
- **Phiên bản**: N/A
- **Publisher**: Python Software Foundation
- **Nguồn cài đặt**: winget (`Python.Python.3.12`) nếu có nhiệm vụ yêu cầu
- **License**: Python Software Foundation License
- **Executable path**: N/A (`C:\Users\dienm\AppData\Local\Microsoft\WindowsApps\python.exe` là shortcut stub)
- **Data path**: N/A
- **Cache path**: N/A
- **Config path**: N/A
- **Log path**: N/A
- **Cách mở**: N/A
- **Lệnh kiểm tra**: `python --version` (chưa cấu hình bộ cài thực)
- **Quyền Administrator**: Tùy chọn cài đặt
- **Tích hợp WorkSphere**: Chưa tích hợp vào luồng chính
- **Ghi chú an toàn**: Không tự cài đặt nếu chưa có nhiệm vụ được phân công
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe python`

---

### 2.7. Docker Desktop
- **Mục đích**: Quản lý ảo hóa container, chạy Testcontainers, PostgreSQL dev và Jenkins.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `4.94.0` (Docker Engine 29.8.2)
- **Publisher**: Docker, Inc.
- **Nguồn cài đặt**: Microsoft Store (`XP8CBJ40XLBWKX`) / Official Installer
- **License**: Docker Subscription Service Agreement
- **Executable path**: `C:\Program Files\Docker\Docker\Docker Desktop.exe`
- **Data path**: `D:\DockerData\DockerDesktopWSL` (Đã cấu hình trên ổ D)
- **Cache path**: `C:\Users\dienm\AppData\Local\Docker`
- **Config path**: `C:\Users\dienm\AppData\Roaming\Docker\settings.json`
- **Log path**: `C:\Users\dienm\AppData\Local\Docker\log`
- **Cách mở**: Start Menu hoặc ứng dụng nền
- **Lệnh kiểm tra**: `docker info`, `docker --version`
- **Quyền Administrator**: Cần thiết khi cài đặt hoặc cấu hình dịch vụ WSL2/Hyper-V
- **Tích hợp WorkSphere**: Nền tảng chạy Testcontainers cho kiểm thử integration và các dịch vụ dev
- **Ghi chú an toàn**: Tuyệt đối không xóa Docker volumes, image và dữ liệu container không thuộc về WorkSphere
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `Get-Item "C:\Program Files\Docker\Docker\Docker Desktop.exe"`

---

### 2.8. Docker CLI
- **Mục đích**: Giao diện dòng lệnh tương tác với Docker Engine.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `29.8.2, build 7fc2dff`
- **Publisher**: Docker, Inc.
- **Nguồn cài đặt**: Đi kèm Docker Desktop
- **License**: Apache License 2.0
- **Executable path**: `C:\Users\dienm\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe`
- **Data path**: N/A
- **Cache path**: N/A
- **Config path**: `C:\Users\dienm\.docker\config.json`
- **Log path**: Terminal stdout/stderr
- **Cách mở**: CLI Terminal (`docker`)
- **Lệnh kiểm tra**: `docker --version`, `docker ps`
- **Quyền Administrator**: Không cần khi user thuộc nhóm `docker-users`
- **Tích hợp WorkSphere**: Kiểm tra trạng thái container, khởi động container dev
- **Ghi chú an toàn**: Chỉ điều khiển các container liên quan trực tiếp đến WorkSphere
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe docker`

---

### 2.9. PostgreSQL Container (`worksphere-dev-pg`)
- **Mục đích**: Cơ sở dữ liệu PostgreSQL phát triển local cho backend WorkSphere.
- **Trạng thái**: `INSTALLED` (Container đang ở trạng thái `Exited`, sẵn sàng khởi động khi cần)
- **Phiên bản**: `PostgreSQL 15` (Image: `postgres:15-alpine`)
- **Publisher**: PostgreSQL Global Development Group / Docker Official
- **Nguồn cài đặt**: Docker Hub
- **License**: PostgreSQL License
- **Executable path**: Docker Container runtime
- **Data path**: Docker container volume
- **Cache path**: N/A
- **Config path**: Thiết lập tham số khi chạy container / `postgresql.conf`
- **Log path**: `docker logs worksphere-dev-pg`
- **Cách mở**: `docker start worksphere-dev-pg`
- **Lệnh kiểm tra**: `docker ps -a --filter "name=worksphere-dev-pg"`
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Cung cấp cổng kết nối 5432 cho backend dev
- **Ghi chú an toàn**: Không xóa container và volume của `worksphere-dev-pg`
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `docker ps -a`

---

### 2.10. Jenkins Container (`jenkins-lts`)
- **Mục đích**: Máy chủ tự động hóa tích hợp liên tục (CI/CD).
- **Trạng thái**: `INSTALLED` (Container đang chạy liên tục - `Up`)
- **Phiên bản**: Jenkins LTS (Image: `jenkins/jenkins:lts-jdk21`)
- **Publisher**: Jenkins Project
- **Nguồn cài đặt**: Docker Hub
- **License**: MIT License
- **Executable path**: Docker Container runtime
- **Data path**: Docker volume container
- **Cache path**: N/A
- **Config path**: Jenkins Home bên trong container
- **Log path**: `docker logs jenkins-lts`
- **Cách mở**: Truy cập trình duyệt tại `http://localhost:8080`
- **Lệnh kiểm tra**: `docker ps --filter "name=jenkins-lts"`
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Máy chủ quản trị CI/CD
- **Ghi chú an toàn**: Cấm tuyệt đối: Không xóa, không sửa, không dừng container `jenkins-lts`
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `docker ps`

---

### 2.11. Android Studio
- **Mục đích**: Môi trường phát triển tích hợp (IDE) chính thức cho ứng dụng Android và quản lý SDK.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `2026.2`
- **Publisher**: Google LLC
- **Nguồn cài đặt**: winget (`Google.AndroidStudio`) / Official Installer
- **License**: Apache License 2.0 / Android SDK License
- **Executable path**: `D:\Android\bin\studio64.exe`
- **Data path**: `D:\Android`
- **Cache path**: `C:\Users\dienm\AppData\Local\Google\AndroidStudio2026.2`
- **Config path**: `C:\Users\dienm\AppData\Roaming\Google\AndroidStudio2026.2`
- **Log path**: `C:\Users\dienm\AppData\Local\Google\AndroidStudio2026.2\log`
- **Cách mở**: `Start-Process "D:\Android\bin\studio64.exe"` hoặc Start Menu
- **Lệnh kiểm tra**: `Test-Path "D:\Android\bin\studio64.exe"`
- **Quyền Administrator**: Không cần khi chạy
- **Tích hợp WorkSphere**: Mở dự án mobile Android, quản lý SDK và Emulator
- **Ghi chú an toàn**: Không sửa đổi cấu hình lõi IDE ngoài phạm vi dự án
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe /r D:\Android studio64.exe`

---

### 2.12. Android SDK
- **Mục đích**: Bộ công cụ phát triển phần mềm cho hệ điều hành Android phục vụ Phase 12 mobile initialization.
- **Trạng thái**: `INSTALLED`
- **Android SDK Root**: `D:\AndroidSDK` (Được gán biến môi trường `$env:ANDROID_HOME`)
- **Installed Platforms**:
  - `platforms/android-35` (Android 15, API 35)
  - `platforms/android-37.0` (Android API 37, Revision 2 - template compileSdk 37)
- **Installed Build-Tools**:
  - `build-tools/36.0.0`
  - `build-tools/37.0.0` (Template prerequisite cho React Native 0.88.0)
- **Installed NDK**:
  - `ndk/27.1.12297006` (NDK Side-by-side 27.1.12297006 - template ndkVersion)
- **Installed Platform-Tools**: `37.0.1` (`adb` 1.0.41)
- **Installed Command-line Tools**: `cmdline-tools/latest` (v23.0.0)
- **Node / npm Baseline**: Node `v24.19.0`, npm `11.17.0` (Node 24.x baseline tương thích `react-native@0.88.0` engine `^24.3.0`)
- **Gradle JVM Candidates**:
  - `D:\Android\jbr` (OpenJDK 25.0.3, Android Studio JBR - khuyến nghị cho Android build)
  - `D:\Java` (Oracle JDK 27 - Launcher JVM 27)
- **Publisher**: Google LLC
- **Nguồn cài đặt**: Android SDK Manager (`D:\AndroidSDK\cmdline-tools\latest\bin\sdkmanager.bat`)
- **License**: Android Software Development Kit License (`D:\AndroidSDK\licenses\android-sdk-license`)
- **Executable path**: `D:\AndroidSDK\cmdline-tools\latest\bin\sdkmanager.bat`
- **Data path**: `D:\AndroidSDK`
- **Cache path**: `D:\AndroidSDK\.temp`
- **Config path**: `C:\Users\dienm\.android`
- **Log path**: N/A
- **Cách mở**: Quản lý qua `sdkmanager` CLI hoặc Android Studio SDK Manager
- **Lệnh kiểm tra & xác minh**:
  ```powershell
  Get-ChildItem "D:\AndroidSDK\build-tools"
  Get-ChildItem "D:\AndroidSDK\platforms"
  Get-ChildItem "D:\AndroidSDK\ndk"
  $env:JAVA_HOME = "D:\Android\jbr"
  & "D:\AndroidSDK\cmdline-tools\latest\bin\sdkmanager.bat" --list_installed
  ```
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Biên dịch, liên kết NDK và đóng gói ứng dụng React Native cho nền tảng Android trong Phase 12
- **Ghi chú an toàn**: Cấm xóa hoặc di chuyển thư mục `D:\AndroidSDK`
- **Ngày xác minh**: 17/10/2026
- **Cách tìm lại**: `$env:ANDROID_HOME`, `D:\AndroidSDK`

---

### 2.13. ADB (Android Debug Bridge)
- **Mục đích**: Cầu nối giao tiếp, cài đặt và gỡ lỗi thiết bị/máy ảo Android.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `1.0.41` (Platform tools 37.0.1-15733141)
- **Publisher**: Google LLC
- **Nguồn cài đặt**: Android SDK Platform-Tools
- **License**: Apache License 2.0
- **Executable path**: `D:\AndroidSDK\platform-tools\adb.exe`
- **Data path**: N/A
- **Cache path**: N/A
- **Config path**: N/A
- **Log path**: `adb logcat` output
- **Cách mở**: CLI Terminal (`adb`)
- **Lệnh kiểm tra**: `D:\AndroidSDK\platform-tools\adb.exe version`, `adb devices`
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Tương tác với emulator `emulator-5554`, cài APK, thu logcat, chụp ảnh màn hình
- **Ghi chú an toàn**: Chỉ điều khiển thiết bị serial đã xác minh (`emulator-5554`), cấm can thiệp thiết bị lạ
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe adb`, `D:\AndroidSDK\platform-tools\adb.exe`

---

### 2.14. Android Emulator
- **Mục đích**: Máy ảo Android phục vụ kiểm thử giao diện và hành vi ứng dụng mobile.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `37.2.12.0` (build_id 16428233)
- **Publisher**: Google LLC / Android Open Source Project
- **Nguồn cài đặt**: Android SDK Emulator
- **License**: GPLv2 / Android SDK License
- **Executable path**: `D:\AndroidSDK\emulator\emulator.exe`
- **Data path**: `D:\AndroidAVD` (và `C:\Users\dienm\.android\avd`)
- **Cache path**: `C:\Users\dienm\.android\cache`
- **Config path**: `C:\Users\dienm\.android\avd\*.avd\config.ini`
- **Log path**: `D:\AndroidSDK\emulator\emulator.log`
- **Cách mở**: `D:\AndroidSDK\emulator\emulator.exe -avd <name>`
- **Lệnh kiểm tra**: `D:\AndroidSDK\emulator\emulator.exe -version`
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Chạy thiết bị ảo `emulator-5554` (Android 15, API 35) để kiểm thử
- **Ghi chú an toàn**: Cấm xóa AVD, cấm factory-reset máy ảo
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `Get-Item "D:\AndroidSDK\emulator\emulator.exe"`

---

### 2.15. Gradle
- **Mục đích**: Hệ thống tự động hóa build cho các dự án Android/Java.
- **Trạng thái**: `AVAILABLE_NOT_CONFIGURED` (Không cài đặt Gradle global; các dự án sử dụng Gradle Wrapper `gradlew.bat` cục bộ)
- **Phiên bản**: Theo từng phiên bản Wrapper của dự án
- **Publisher**: Gradle Inc.
- **Nguồn cài đặt**: Gradle Wrapper đi kèm project
- **License**: Apache License 2.0
- **Executable path**: `gradlew.bat` trong thư mục project
- **Data path**: `C:\Users\dienm\.gradle`
- **Cache path**: `C:\Users\dienm\.gradle\caches`
- **Config path**: `C:\Users\dienm\.gradle\gradle.properties`
- **Log path**: Build logs trong `build/reports`
- **Cách mở**: `.\gradlew.bat <tasks>`
- **Lệnh kiểm tra**: `where.exe gradle`
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Sẽ sử dụng để build ứng dụng React Native Android khi module mobile khởi chạy
- **Ghi chú an toàn**: Ưu tiên dùng Gradle Wrapper của dự án thay vì cài đặt global
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe gradle`

---

### 2.16. Microsoft Edge
- **Mục đích**: Trình duyệt web desktop dùng để xác minh trực quan Prototype và tài liệu UI/UX.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `155.0.4283.45`
- **Publisher**: Microsoft Corporation
- **Nguồn cài đặt**: Thành phần mặc định của Windows
- **License**: Microsoft Software License Terms
- **Executable path**: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- **Data path**: `C:\Users\dienm\AppData\Local\Microsoft\Edge\User Data`
- **Cache path**: `C:\Users\dienm\AppData\Local\Microsoft\Edge\User Data\Default\Cache`
- **Config path**: Edge Settings
- **Log path**: Edge Crashpad logs
- **Cách mở**: Chạy browser automation với profile tạm riêng (`--user-data-dir`)
- **Lệnh kiểm tra**: `(Get-Item "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe").VersionInfo.ProductVersion`
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Kiểm thử layout responsive, DOM, console errors của prototype mobile trên các viewport thực tế
- **Ghi chú an toàn**: Tuyệt đối không đọc cookie, lịch sử, profile cá nhân; luôn dùng profile tạm thời
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: Registry `HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe`

---

### 2.17. PowerShell Environment
- **Mục đích**: Môi trường shell và script thực thi lệnh tự động trên Windows.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: Windows PowerShell 5.1 / PowerShell Engine
- **Publisher**: Microsoft Corporation
- **Nguồn cài đặt**: Tích hợp sẵn trong Windows
- **License**: Microsoft Windows EULA
- **Executable path**: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
- **Data path**: `D:\WorkSphere`
- **Cache path**: N/A
- **Config path**: `$PROFILE`
- **Log path**: Windows Event Log
- **Cách mở**: CLI Terminal
- **Lệnh kiểm tra**: `$PSVersionTable.PSVersion`
- **Quyền Administrator**: Không dùng trừ khi có yêu cầu đặc thù và được phê duyệt
- **Tích hợp WorkSphere**: Thực thi các lệnh build, kiểm thử, quản lý tiến trình, Git và Docker
- **Ghi chú an toàn**: Cấm chạy các lệnh tải script trực tiếp từ web không xác thực
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe powershell`

---

### 2.18. Antigravity IDE
- **Mục đích**: Môi trường phát triển Agentic AI Pair-Programming cho dự án WorkSphere.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: 2.0 (Google Antigravity Agentic IDE)
- **Publisher**: Google DeepMind
- **Nguồn cài đặt**: Google internal installation
- **License**: Proprietary
- **Executable path**: IDE application binary
- **Data path**: `C:\Users\dienm\.gemini\antigravity-ide`
- **Cache path**: `C:\Users\dienm\.gemini\antigravity-ide\brain`
- **Config path**: `C:\Users\dienm\.gemini\config`
- **Log path**: `C:\Users\dienm\.gemini\antigravity-ide\conversations`
- **Cách mở**: Mở ứng dụng Antigravity IDE
- **Lệnh kiểm tra**: Kiểm tra đường dẫn thư mục `C:\Users\dienm\.gemini\antigravity-ide`
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Nền tảng điều phối, phân tích, tạo diff, và hỗ trợ phát triển dự án
- **Ghi chú an toàn**: Tuân thủ tuyệt đối quy tắc bảo mật repository và tài liệu chuẩn mực
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: App Data Directory `C:\Users\dienm\.gemini\antigravity-ide`

---

### 2.19. Gemini Account Status
- **Mục đích**: Trạng thái kết nối tài khoản trí tuệ nhân tạo phục vụ hỗ trợ lập trình.
- **Trạng thái**: `ENABLED`
- **Phiên bản**: N/A
- **Publisher**: Google LLC
- **Nguồn cài đặt**: Google Cloud / AI Authentication
- **License**: Google Cloud Terms of Service
- **Executable path**: N/A
- **Data path**: N/A
- **Cache path**: N/A
- **Config path**: `C:\Users\dienm\.gemini`
- **Log path**: N/A
- **Cách mở**: Tự động thông qua IDE session
- **Lệnh kiểm tra**: Kiểm tra trạng thái session IDE (chỉ ghi nhận trạng thái hoạt động)
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Phân tích ngữ cảnh, kiểm tra mã nguồn, đối chiếu tài liệu canonical
- **Ghi chú an toàn**: Tuyệt đối không ghi nhận credential, email cá nhân, token hay API key vào hồ sơ
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: Quản lý phiên trong Antigravity IDE

---

### 2.20. Visual Studio Code (VS Code)
- **Mục đích**: Trình soạn thảo mã nguồn phụ trợ trên máy trạm.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `1.141.0` (x64)
- **Publisher**: Microsoft Corporation
- **Nguồn cài đặt**: Standalone / Custom installation tại `D:\VSCode`
- **License**: Microsoft Software License
- **Executable path**: `D:\VSCode\bin\code.cmd` (Core binary: `D:\VSCode\Code.exe`)
- **Data path**: `D:\VSCode`
- **Cache path**: `C:\Users\dienm\AppData\Roaming\Code\Cache`
- **Config path**: `C:\Users\dienm\AppData\Roaming\Code\User\settings.json`
- **Log path**: `C:\Users\dienm\AppData\Roaming\Code\logs`
- **Cách mở**: `D:\VSCode\bin\code.cmd` hoặc `code .`
- **Lệnh kiểm tra**: `D:\VSCode\bin\code.cmd --version`
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Soạn thảo và tra cứu mã nguồn nhanh
- **Ghi chú an toàn**: Không tự thay đổi extension hay cài extension lạ ngoài danh mục được duyệt
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe code`, `D:\VSCode\bin\code.cmd`

---

### 2.21. winget (Windows Package Manager)
- **Mục đích**: Trình quản lý gói phần mềm chính thức của Windows.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `v1.29.380`
- **Publisher**: Microsoft Corporation
- **Nguồn cài đặt**: Windows App Installer
- **License**: MIT License
- **Executable path**: `C:\Users\dienm\AppData\Local\Microsoft\WindowsApps\winget.exe`
- **Data path**: `C:\Users\dienm\AppData\Local\Packages\Microsoft.DesktopAppInstaller_8wekyb3d8bbwe`
- **Cache path**: `C:\Users\dienm\AppData\Local\Temp\WinGet`
- **Config path**: `C:\Users\dienm\AppData\Local\Packages\Microsoft.DesktopAppInstaller_8wekyb3d8bbwe\LocalState\settings.json`
- **Log path**: `C:\Users\dienm\AppData\Local\Packages\Microsoft.DesktopAppInstaller_8wekyb3d8bbwe\LocalState\DiagOutputDir`
- **Cách mở**: CLI Terminal (`winget`)
- **Lệnh kiểm tra**: `winget --version`
- **Quyền Administrator**: Cần khi cài đặt ứng dụng phạm vi toàn máy (Machine Scope)
- **Tích hợp WorkSphere**: Kênh cài đặt công cụ ưu tiên số 1 khi có nhu cầu được phê duyệt
- **Ghi chú an toàn**: Phải kiểm tra chính xác Package ID và Publisher trước khi gọi `winget install`
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe winget`

---

### 2.22. Chocolatey
- **Mục đích**: Trình quản lý gói phần mềm bên thứ ba cho Windows.
- **Trạng thái**: `NOT_INSTALLED`
- **Phiên bản**: N/A
- **Publisher**: Chocolatey Software, Inc.
- **Nguồn cài đặt**: N/A
- **License**: Apache License 2.0
- **Executable path**: N/A
- **Data path**: N/A
- **Cache path**: N/A
- **Config path**: N/A
- **Log path**: N/A
- **Cách mở**: N/A
- **Lệnh kiểm tra**: `where.exe choco` (không tìm thấy)
- **Quyền Administrator**: Cần khi cài đặt
- **Tích hợp WorkSphere**: N/A (Được winget thay thế hoàn toàn)
- **Ghi chú an toàn**: Ưu tiên sử dụng winget chính thức; không tự động cài Chocolatey nếu chưa có nhu cầu bắt buộc
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe choco`

---

### 2.23. Scoop
- **Mục đích**: Trình cài đặt dòng lệnh cấp người dùng cho Windows.
- **Trạng thái**: `NOT_INSTALLED`
- **Phiên bản**: N/A
- **Publisher**: Scoop Community
- **Nguồn cài đặt**: N/A
- **License**: MIT License
- **Executable path**: N/A
- **Data path**: N/A
- **Cache path**: N/A
- **Config path**: N/A
- **Log path**: N/A
- **Cách mở**: N/A
- **Lệnh kiểm tra**: `where.exe scoop` (không tìm thấy)
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: N/A
- **Ghi chú an toàn**: Không tự cài đặt nếu chưa có nhiệm vụ yêu cầu
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `where.exe scoop`

---

### 2.24. Java 21 Validation Runtime (Docker `eclipse-temurin:21-jdk`)
- **Mục đích**: Môi trường container thực thi kiểm thử chuẩn hóa bytecode Java 21 cho backend WorkSphere theo Roadmap.
- **Trạng thái**: `INSTALLED` (Docker Image đã tải về local)
- **Host Java**: Oracle JDK 27 (`27+35-2325`, `D:\Java\bin\java.exe`)
- **Java 21 trên Windows Host**: `NOT_FOUND` / `NOT_INSTALLED` (không cài trực tiếp lên Windows để tránh can thiệp biến môi trường hệ thống)
- **Project Target**: Java 21 (`pom.xml` cấu hình `<java.version>21</java.version>`, tương đương `javac -release 21`)
- **Maven Wrapper**: `Apache Maven 3.9.16`
- **Spring Boot**: `4.1.1`
- **Docker Java 21 Image**: `eclipse-temurin:21-jdk`
- **Phiên bản Runtime Container**: `Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS)`
- **Image Digest**: `sha256:f9bf7e9fe2f9bc4657537c1a7e20c768f0c3bafca41598263be4714783dd62eb`
- **Jenkins CI/CD**: `jenkins/jenkins:lts-jdk21` đang chạy, cấu hình JDK 21
- **Lệnh kiểm tra & xác minh**:
  ```powershell
  docker run --rm `
    -v "D:\WorkSphere\backend:/workspace" `
    -v "C:\Users\dienm\.m2:/root/.m2" `
    -w /workspace `
    eclipse-temurin:21-jdk `
    sh -c "java -version && sh ./mvnw -v"
  ```
- **Kết quả xác minh (15/10/2026)**:
  - `java -version`: OpenJDK 21.0.12.1 LTS PASS
  - `mvnw -v`: Apache Maven 3.9.16 PASS
  - `checkstyle:check`: 0 violations PASS
  - Unit tests (`TaskTest`, `TaskWorkflowTest`): 16/16 PASS
  - H2 Context test (`BackendApplicationTests`): 1/1 PASS
- **Quyền Administrator**: Không cần
- **Tích hợp WorkSphere**: Đóng vai trò môi trường đối chuẩn Java 21 mà không cần cài đặt JDK mới lên máy chủ Windows
- **Ghi chú an toàn**: Không lưu thông tin xác thực hoặc credential vào hồ sơ
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `docker images eclipse-temurin:21-jdk`

---

### 2.25. Microsoft Edge
- **Mục đích**: Trình duyệt web chuẩn trên Windows host, phục vụ kiểm thử web UI, prototype, Jenkins UI, responsive/accessibility testing, và headless automation.
- **Trạng thái**: `INSTALLED`
- **Phiên bản**: `155.0.4283.45`
- **Publisher**: Microsoft Corporation
- **Nguồn cài đặt**: Windows default / Microsoft Edge Installer
- **License**: Microsoft Software License Terms (Proprietary)
- **Executable path**: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- **Headless capability**: Sẵn sàng (`--headless=new`)
- **Test Profile path**: `D:\AI\Profiles\Edge\WorkSphere`
- **Cache path**: `D:\AI\Cache\Edge`
- **Temp path**: `D:\AI\Temp\Edge`
- **Screenshot paths**:
  - Ảnh tạm: `design/prototype/review-output/`
  - Ảnh báo cáo: `reports/screenshots/`
- **Cách mở**: CLI / PowerShell (`Start-Process`) hoặc Antigravity browser automation
- **Lệnh kiểm tra**: `(Get-Item "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe").VersionInfo`
- **Lệnh mở headless mẫu**:
  ```powershell
  & "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
    --headless=new `
    --user-data-dir="D:\AI\Profiles\Edge\WorkSphere" `
    --dump-dom "http://127.0.0.1:8080"
  ```
- **Quyền Administrator**: Không cần khi chạy
- **Tích hợp WorkSphere**: Kiểm thử giao diện web prototype, tài liệu, Jenkins UI và web application tương lai
- **Ghi chú an toàn**:
  - Nghiêm cấm can thiệp profile Edge cá nhân của người dùng (cookie, password, history, extension, tài khoản).
  - Nghiêm cấm đóng cửa sổ Edge cá nhân của người dùng.
  - Cấm lưu trữ profile, cache, downloads vào repository `D:\WorkSphere`.
  - Kiểm tra bảo mật screenshot (không chụp password, token, Authorization header, cookie).
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `Test-Path "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`

---

### 2.26. Microsoft Edge WebDriver (msedgedriver)
- **Mục đích**: Driver tự động hóa trình duyệt Microsoft Edge theo chuẩn W3C WebDriver.
- **Trạng thái**: `NOT_INSTALLED` (Sẵn sàng cài đặt theo nhu cầu tác vụ thực tế)
- **Phiên bản**: `155.x` (tương thích phiên bản Edge `155.0.4283.45` khi được cài)
- **Publisher**: Microsoft Corporation
- **Nguồn cài đặt dự kiến**: Official Microsoft Edge WebDriver Portal (`https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/`)
- **License**: Microsoft Software License Terms
- **Executable path dự kiến**: `D:\AI\Tools\EdgeWebDriver\155.0.4283.45\msedgedriver.exe`
- **Data / Profile path**: `D:\AI\Profiles\Edge\WorkSphere`
- **Log path**: `D:\AI\Logs\msedgedriver.log`
- **Cách mở**: CLI / Automation runner
- **Lệnh kiểm tra**: `where.exe msedgedriver` hoặc kiểm tra đường dẫn tại `D:\AI\Tools\EdgeWebDriver`
- **Quyền Administrator**: Không cần khi chạy
- **Tích hợp WorkSphere**: Tự động hóa kiểm thử E2E khi có yêu cầu chuyên sâu
- **Ghi chú an toàn**: Không commit `msedgedriver.exe` vào Git repository; không tải WebDriver từ nguồn thứ ba không chính thức
- **Ngày xác minh**: 15/10/2026
- **Cách tìm lại**: `Test-Path "D:\AI\Tools\EdgeWebDriver"`

---

## 3. ANTIGRAVITY IDE EXTENSIONS INVENTORY & AUTHORIZATION

Vị trí lưu trữ extensions Antigravity IDE:
`C:\Users\dienm\.antigravity-ide\extensions`
File manifest:
`C:\Users\dienm\.antigravity-ide\extensions\extensions.json`

---

### 3.1. markdownlint
- **Extension Name**: markdownlint
- **Extension ID**: `davidanson.vscode-markdownlint`
- **Publisher**: DavidAnson
- **Phiên bản**: `0.62.1`
- **Trạng thái**: `INSTALLED` / `ENABLED`
- **Marketplace / Nguồn**: Antigravity / VS Code Marketplace (Gallery)
- **License**: MIT License
- **Install Location**: `C:\Users\dienm\.antigravity-ide\extensions\davidanson.vscode-markdownlint-0.62.1-universal`
- **Mục đích trong WorkSphere**: Phát hiện lỗi định dạng Markdown, kiểm tra quy chuẩn tài liệu kỹ thuật, báo cáo và tài liệu dự án.
- **Command / Feature được dùng**: Linter hiển thị diagnostics trong editor; `markdownlint.fixAll`.
- **Dữ liệu / Quyền truy cập**: Chỉ đọc file Markdown đang mở hoặc trong workspace; không gửi dữ liệu ra ngoài.
- **Ghi chú an toàn**: Không tự động sửa nội dung các tài liệu canonical ngoài phạm vi task được phân công.
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\davidanson.vscode-markdownlint-0.62.1-universal"`
- **Ngày xác minh**: 16/10/2026

---

### 3.2. SQL Server (mssql)
- **Extension Name**: SQL Server (mssql)
- **Extension ID**: `ms-mssql.mssql`
- **Publisher**: Microsoft (`ms-mssql`)
- **Phiên bản**: `1.46.0`
- **Trạng thái**: `INSTALLED` / `STANDBY` (Không dùng làm công cụ chính cho WorkSphere)
- **Marketplace / Nguồn**: Antigravity / VS Code Marketplace (Gallery)
- **License**: Microsoft Software License Terms
- **Install Location**: `C:\Users\dienm\.antigravity-ide\extensions\ms-mssql.mssql-1.46.0-universal`
- **Mục đích trong WorkSphere**: Giữ nguyên phục vụ các dự án khác nếu người dùng cần.
- **Chính sách WorkSphere**: SQL Server (mssql) đã cài và được phép sử dụng khi một nhiệm vụ WorkSphere cụ thể chứng minh cần thiết. PostgreSQL vẫn là database canonical và mặc định của WorkSphere. "Không ưu tiên" không đồng nghĩa với "cấm sử dụng". Tuyệt đối không tự chuyển schema, Flyway migration hoặc runtime database sang SQL Server; không sửa migration PostgreSQL chỉ để tương thích mssql.
- **Dữ liệu / Quyền truy cập**: Kết nối database theo connection profile.
- **Ghi chú an toàn**: Tuyệt đối không lưu mật khẩu SQL Server vào repository hoặc workspace settings được Git theo dõi.
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\ms-mssql.mssql-1.46.0-universal"`
- **Ngày xác minh**: 16/10/2026

---

### 3.3. SQLTools
- **Extension Name**: SQLTools - Database management for VSCode
- **Extension ID**: `mtxr.sqltools`
- **Publisher**: Matheus Teixeira (`mtxr`)
- **Phiên bản**: `0.28.6`
- **Trạng thái**: `INSTALLED` / `ENABLED`
- **Marketplace / Nguồn**: Antigravity / VS Code Marketplace (Gallery)
- **License**: MIT License
- **Install Location**: `C:\Users\dienm\.antigravity-ide\extensions\mtxr.sqltools-0.28.6-universal`
- **Mục đích trong WorkSphere**: Khảo sát, truy vấn kiểm tra dữ liệu PostgreSQL dev/test (`worksphere-dev-pg` hoặc Testcontainers) thông qua PostgreSQL driver phù hợp (`@sqltools/driver-pg` nếu được cài đặt).
- **Command / Feature được dùng**: SQL query execution, connection manager, schema viewer.
- **Dữ liệu / Quyền truy cập**: Truy vấn cơ sở dữ liệu được cấu hình.
- **Ghi chú an toàn**: Chỉ chạy query chỉ đọc khi khảo sát/audit; chỉ ghi vào database test/dev được chỉ định; tuyệt đối không lưu credentials vào repository, Git-tracked settings hay connection export.
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\mtxr.sqltools-0.28.6-universal"`
- **Ngày xác minh**: 16/10/2026

---

### 3.4. XML Tools
- **Extension Name**: XML Tools
- **Extension ID**: `dotjoshjohnson.xml`
- **Publisher**: Josh Johnson (`DotJoshJohnson`)
- **Phiên bản**: `2.5.1`
- **Trạng thái**: `INSTALLED` / `ENABLED`
- **Marketplace / Nguồn**: Antigravity / VS Code Marketplace (Gallery)
- **License**: MIT License
- **Install Location**: `C:\Users\dienm\.antigravity-ide\extensions\dotjoshjohnson.xml-2.5.1-universal`
- **Mục đích trong WorkSphere**: Xem, format, kiểm tra cấu trúc file XML (Maven `pom.xml`, checkstyle config, Android manifest).
- **Command / Feature được dùng**: `xmlTools.formatXml`, XML Tree View, XPath evaluation.
- **Dữ liệu / Quyền truy cập**: Đọc/ghi file XML trong workspace.
- **Ghi chú an toàn**: Chỉ format file thuộc phạm vi task; không thay đổi cấu hình ngoài chỉ định.
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\dotjoshjohnson.xml-2.5.1-universal"`
- **Ngày xác minh**: 16/10/2026

---

### 3.5. Docker & Containers
- **Extension Name**: Docker / Containers
- **Extension ID**: `ms-azuretools.vscode-docker` / `ms-azuretools.vscode-containers`
- **Publisher**: Microsoft (`ms-azuretools`)
- **Phiên bản**: Docker `2.0.0`, Containers `2.4.5`
- **Trạng thái**: `INSTALLED` / `ENABLED`
- **Marketplace / Nguồn**: Antigravity / VS Code Marketplace (Gallery)
- **License**: MIT License
- **Install Location**:
  - `C:\Users\dienm\.antigravity-ide\extensions\ms-azuretools.vscode-docker-2.0.0-universal`
  - `C:\Users\dienm\.antigravity-ide\extensions\ms-azuretools.vscode-containers-2.4.5-universal`
- **Mục đích trong WorkSphere**: Bổ trợ theo dõi container, images, volumes của PostgreSQL, Jenkins, và Testcontainers.
- **Command / Feature được dùng**: Container view, container logs, inspect container.
- **Dữ liệu / Quyền truy cập**: Tương tác với Docker daemon cục bộ.
- **Ghi chú an toàn**: Là công cụ quan sát bổ trợ; không dùng trạng thái hiển thị của extension để thay thế các lệnh kiểm tra và validation bắt buộc bằng Docker CLI (`docker ps`, `docker inspect`).
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\ms-azuretools.vscode-docker-2.0.0-universal"`
- **Ngày xác minh**: 16/10/2026

---

### 3.6. Git History
- **Extension Name**: Git History
- **Extension ID**: `donjayamanne.githistory`
- **Publisher**: Don Jayamanne (`donjayamanne`)
- **Phiên bản**: `0.6.20`
- **Trạng thái**: `INSTALLED` / `ENABLED`
- **Marketplace / Nguồn**: Antigravity / VS Code Marketplace (Gallery)
- **License**: MIT License
- **Install Location**: `C:\Users\dienm\.antigravity-ide\extensions\donjayamanne.githistory-0.6.20-universal`
- **Mục đích trong WorkSphere**: Xem log commit và lịch sử file trực quan.
- **Command / Feature được dùng**: `git.viewHistory`, file history comparison.
- **Dữ liệu / Quyền truy cập**: Đọc Git repository cục bộ.
- **Ghi chú an toàn**: Có chức năng chồng lấn với GitLens. Khi cần so sánh commit/blame sâu, GitLens được ưu tiên sử dụng.
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\donjayamanne.githistory-0.6.20-universal"`
- **Ngày xác minh**: 16/10/2026

---

### 3.7. GitLens — Git supercharged
- **Extension Name**: GitLens — Git supercharged
- **Extension ID**: `eamodio.gitlens`
- **Publisher**: GitKraken (`GitKraken` / `eamodio`)
- **Phiên bản**: `19.4.0`
- **Trạng thái**: `INSTALLED` / `ENABLED` (Được ưu tiên hàng đầu cho Git inspection)
- **Marketplace / Nguồn**: Antigravity / VS Code Marketplace (Gallery)
- **License**: GitKraken End User License Agreement / Open Core
- **Install Location**: `C:\Users\dienm\.antigravity-ide\extensions\eamodio.gitlens-19.4.0-universal`
- **Mục đích trong WorkSphere**: Kiểm tra Git history, file blame thời gian thực, revision navigation, commit comparison, inspect stashes và branches.
- **Command / Feature được dùng**: Current line blame, file history, revision comparison, GitLens sidebar.
- **Dữ liệu / Quyền truy cập**: Đọc cấu trúc Git repository `D:\WorkSphere`.
- **Ghi chú an toàn**: Được ưu tiên hơn Git History. Không đăng nhập tài khoản đám mây của bên thứ ba nếu có yêu cầu; không upload source lên dịch vụ ngoài.
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\eamodio.gitlens-19.4.0-universal"`
- **Ngày xác minh**: 16/10/2026

---

### 3.8. Microsoft Edge Tools for VS Code
- **Extension Name**: Microsoft Edge Tools for VS Code
- **Extension ID**: `ms-edgedevtools.vscode-edge-devtools`
- **Publisher**: Microsoft (`ms-edgedevtools`)
- **Phiên bản**: `2.1.10`
- **Trạng thái**: `INSTALLED` / `ENABLED` (Được ưu tiên cho Web/Prototype/UI debugging)
- **Marketplace / Nguồn**: Antigravity / VS Code Marketplace (Gallery)
- **License**: MIT License
- **Install Location**: `C:\Users\dienm\.antigravity-ide\extensions\ms-edgedevtools.vscode-edge-devtools-2.1.10-universal`
- **Mục đích trong WorkSphere**: Debug giao diện web prototype, tài liệu web, Jenkins UI, kiểm tra DOM, CSS, console log, network requests, và responsive viewport trực tiếp trong IDE.
- **Command / Feature được dùng**: Edge DevTools panel, screencast, element inspection, network inspection, console.
- **Dữ liệu / Quyền truy cập**: Tương tác với instance Edge được khởi chạy phục vụ kiểm thử (gắn với profile riêng `D:\AI\Profiles\Edge\WorkSphere`).
- **Ghi chú an toàn**: Nghiêm cấm kết nối vào cửa sổ Edge cá nhân của người dùng; chỉ kết nối instance Edge test do Agent hoặc extension khởi chạy; không thu thập cookie/token cá nhân.
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\ms-edgedevtools.vscode-edge-devtools-2.1.10-universal"`
- **Ngày xác minh**: 16/10/2026

---

### 3.9. PowerShell
- **Extension Name**: PowerShell
- **Extension ID**: `ms-vscode.powershell`
- **Publisher**: Microsoft (`ms-vscode`)
- **Phiên bản**: `2025.4.0`
- **Trạng thái**: `INSTALLED` / `ENABLED`
- **Marketplace / Nguồn**: Antigravity / VS Code Marketplace (Gallery)
- **License**: MIT License
- **Install Location**: `C:\Users\dienm\.antigravity-ide\extensions\ms-vscode.powershell-2025.4.0-universal`
- **Mục đích trong WorkSphere**: Hỗ trợ cú pháp, intellisense, linting cho các script PowerShell automation (`scratch/*.ps1`, preflight scripts).
- **Command / Feature được dùng**: PowerShell Integrated Console, PSScriptAnalyzer integration.
- **Dữ liệu / Quyền truy cập**: Đọc/ghi các file script PowerShell.
- **Ghi chú an toàn**: Tuân thủ chính sách bảo vệ workspace; không chạy script không rõ nguồn gốc.
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\ms-vscode.powershell-2025.4.0-universal"`
- **Ngày xác minh**: 16/10/2026

---

### 3.10. Java Extension Suite
- **Gồm các extensions chính thức**:
  - `redhat.java` (Language Support for Java by Red Hat, v1.57.0)
  - `vscjava.vscode-java-pack` (Extension Pack for Java, v0.31.2)
  - `vscjava.vscode-java-debug` (Debugger for Java, v0.60.0)
  - `vscjava.vscode-java-dependency` (Project Manager for Java, v0.27.6)
  - `vscjava.vscode-java-test` (Test Runner for Java, v0.47.0)
  - `vscjava.vscode-maven` (Maven for Java, v0.45.3)
  - `vscjava.vscode-gradle` (Gradle for Java, v3.18.0)
- **Publisher**: Red Hat / Microsoft (`vscjava`)
- **Trạng thái**: `INSTALLED` / `ENABLED`
- **Install Location**: `C:\Users\dienm\.antigravity-ide\extensions\vscjava.*`, `redhat.java-*`
- **Mục đích trong WorkSphere**: Cung cấp Language Server, navigation, test runner, và debug hỗ trợ backend Spring Boot Java 21.
- **Ghi chú an toàn**: Là công cụ hỗ trợ phát triển; chất lượng mã nguồn cuối cùng (quality gates) vẫn bắt buộc kiểm chứng bằng CLI (`./mvnw clean test`, `mvnw checkstyle:check`).
- **Cách kiểm tra lại**: `Test-Path "C:\Users\dienm\.antigravity-ide\extensions\redhat.java-1.57.0-win32-x64"`
- **Ngày xác minh**: 16/10/2026

