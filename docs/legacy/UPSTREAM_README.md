# WorkSphere

> Nền tảng ứng dụng di động hỗ trợ quản lý dự án, công việc, yêu cầu dịch vụ và tài sản nội bộ doanh nghiệp.

---

## 1. Giới thiệu dự án

**WorkSphere** là giải pháp phần mềm quản lý tập trung nội bộ dành cho doanh nghiệp, bao gồm:
- **Ứng dụng di động (Mobile App)**: Xây dựng trên React Native & TypeScript, cung cấp trải nghiệm liền mạch cho nhân viên, trưởng nhóm, quản lý dự án và quản trị viên.
- **Dịch vụ máy chủ (Backend Service)**: Kiến trúc Modular Monolith trên nền tảng Java & Spring Boot, kết nối cơ sở dữ liệu quan hệ PostgreSQL qua RESTful API chuẩn hóa.

Dự án đóng vai trò là đề tài thực nghiệm xuyên suốt cho 4 học phần chuyên ngành:
1. **Kỹ năng lập trình nâng cao**: Kiến trúc Spring Boot Modular Monolith, IoC/DI, AOP, JPA, bảo mật RBAC, JWT, Unit & Integration testing.
2. **Phát triển ứng dụng di động**: Ứng dụng React Native, TypeScript, React Navigation, quản lý State, kết nối REST API, offline/local storage và trải nghiệm UX di động.
3. **Quản lý dự án CNTT**: Quản lý phạm vi (Scope), WBS, Backlog, tiến độ (Milestone/Timeline), quản trị rủi ro (Risk Register), kiểm soát thay đổi và nghiệm thu.
4. **Triển khai phần mềm**: Quản lý mã nguồn với Git monorepo, quy trình CI/CD với GitHub Actions, container hóa bằng Docker & Docker Compose, giám sát và vận hành.

---

## 2. Cấu trúc thư mục Monorepo

Repository được tổ chức theo mô hình Monorepo thống nhất:

```text
WorkSphere/
├── .github/
│   └── workflows/          # CI/CD pipelines (GitHub Actions)
├── backend/                # Mã nguồn Backend Spring Boot (Modular Monolith)
├── mobile/                 # Mã nguồn Mobile React Native (TypeScript)
├── infrastructure/         # Cấu hình Docker, container và hạ tầng cục bộ
├── scripts/                # Kịch bản tự động hóa và kiểm tra môi trường
├── docs/                   # 10 tài liệu canonical - Nguồn sự thật của dự án
│   ├── 01_PROJECT_SCOPE.md
│   ├── 02_USER_ROLES_AND_WORKFLOWS.md
│   ├── 03_MOBILE_SCREEN_MAP.md
│   ├── 04_SYSTEM_ARCHITECTURE.md
│   ├── 05_DATABASE_DESIGN.md
│   ├── 06_API_CONTRACT.md
│   ├── 07_FOUR_COURSE_MATRIX.md
│   ├── 08_DEVELOPMENT_ROADMAP.md
│   ├── 09_CODING_STANDARDS.md
│   └── 10_AI_AGENT_INSTRUCTIONS.md
├── reports/                # Báo cáo học thuật và phân công nhóm
│   └── TEAM_ASSIGNMENT.md
├── .env.example            # Mẫu biến môi trường cục bộ (không chứa secret thật)
├── .gitignore              # Bộ lọc Git chuẩn hóa ngăn lộ thông tin nhạy cảm
└── README.md               # Tài liệu tổng quan dự án
```

---

## 3. Yêu cầu môi trường phát triển (Prerequisites)

Để phát triển và vận hành WorkSphere trên môi trường cục bộ, máy trạm cần cài đặt:

| Thành phần | Phiên bản khuyến nghị | Mục đích |
|---|---|---|
| **Git** | >= 2.40 | Quản lý phiên bản mã nguồn monorepo |
| **Java (JDK)** | 21+ LTS (OpenJDK / Eclipse Temurin) | Môi trường phát triển Backend Spring Boot |
| **Node.js** | >= 20.x LTS | Môi trường runtime cho ứng dụng React Native |
| **npm** | >= 10.x | Trình quản lý package Node.js |
| **Android SDK / Studio** | Android SDK 34+ (API 34/35) | Biên dịch và chạy ứng dụng Android trên máy ảo/thật |
| **Docker & Docker Compose** | Docker Desktop (v24+) | Chạy PostgreSQL và các dịch vụ phụ trợ local |

---

## 4. Hướng dẫn thiết lập môi trường (Giai đoạn 1)

### Bước 1: Kiểm tra môi trường cục bộ
WorkSphere cung cấp script tự động kiểm tra toàn bộ công cụ phát triển:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-env.ps1
```

### Bước 2: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```powershell
Copy-Item .env.example .env
```
> **Lưu ý bảo mật**: Tuyệt đối không commit file `.env` chứa mật khẩu hoặc khóa bảo mật thực tế lên Git repository.

---

## 5. Quy ước đóng góp mã nguồn (Git Workflow)

1. **Nhánh làm việc**:
   - `main`: Nhánh phát hành ổn định, được bảo vệ.
   - `develop`: Nhánh tích hợp chính cho quá trình phát triển.
   - `feature/<issue-id>-<short-description>`: Nhánh phát triển tính năng mới.
   - `fix/<issue-id>-<short-description>`: Nhánh sửa lỗi.
2. **Quy chuẩn Commit Message (Conventional Commits)**:
   - `feat(...)`: Bổ sung tính năng mới.
   - `fix(...)`: Khắc phục lỗi.
   - `docs(...)`: Cập nhật tài liệu.
   - `test(...)`: Bổ sung hoặc cập nhật kiểm thử.
   - `ci(...)`: Thay đổi cấu hình CI/CD.
   - `chore(...)`: Tác vụ bảo trì phụ trợ.

---

## 6. Nguồn sự thật dự án (Canonical Documentation)

Mọi chi tiết kiến trúc, cơ sở dữ liệu, API và lộ trình phát triển được định nghĩa duy nhất tại thư mục [`docs/`](file:///d:/WorkSphere/docs/):
- **Phạm vi & Tính năng**: [01_PROJECT_SCOPE.md](file:///d:/WorkSphere/docs/01_PROJECT_SCOPE.md)
- **Vai trò & Luồng nghiệp vụ**: [02_USER_ROLES_AND_WORKFLOWS.md](file:///d:/WorkSphere/docs/02_USER_ROLES_AND_WORKFLOWS.md)
- **Bản đồ màn hình di động**: [03_MOBILE_SCREEN_MAP.md](file:///d:/WorkSphere/docs/03_MOBILE_SCREEN_MAP.md)
- **Kiến trúc hệ thống**: [04_SYSTEM_ARCHITECTURE.md](file:///d:/WorkSphere/docs/04_SYSTEM_ARCHITECTURE.md)
- **Thiết kế cơ sở dữ liệu**: [05_DATABASE_DESIGN.md](file:///d:/WorkSphere/docs/05_DATABASE_DESIGN.md)
- **Khế ước API (REST API Contract)**: [06_API_CONTRACT.md](file:///d:/WorkSphere/docs/06_API_CONTRACT.md)
- **Ma trận 4 môn học**: [07_FOUR_COURSE_MATRIX.md](file:///d:/WorkSphere/docs/07_FOUR_COURSE_MATRIX.md)
- **Lộ trình phát triển (Roadmap)**: [08_DEVELOPMENT_ROADMAP.md](file:///d:/WorkSphere/docs/08_DEVELOPMENT_ROADMAP.md)
- **Tiêu chuẩn lập trình & Git**: [09_CODING_STANDARDS.md](file:///d:/WorkSphere/docs/09_CODING_STANDARDS.md)
- **Chỉ dẫn AI Agent**: [10_AI_AGENT_INSTRUCTIONS.md](file:///d:/WorkSphere/docs/10_AI_AGENT_INSTRUCTIONS.md)
