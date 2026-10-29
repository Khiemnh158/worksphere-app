# MA TRẬN BỐN MÔN CỦA DỰ ÁN WORKSPHERE

## 1. Mục đích

Tài liệu này xác định cách sử dụng cùng một dự án WorkSphere cho bốn môn học:

1. Kỹ năng lập trình nâng cao.
2. Phát triển ứng dụng di động.
3. Quản lý dự án CNTT.
4. Triển khai phần mềm.

Mỗi môn sử dụng cùng một sản phẩm nhưng phải có:

- Trọng tâm kiến thức riêng.
- Phần mã nguồn minh chứng riêng.
- Sơ đồ minh chứng riêng.
- Kết quả kiểm thử riêng.
- Báo cáo riêng.
- Slide thuyết trình riêng.
- Tiêu chí đánh giá riêng.

Không được sao chép nguyên một báo cáo rồi chỉ đổi tên môn học.

---

## 2. Nguyên tắc sử dụng chung dự án

WorkSphere là một sản phẩm thống nhất gồm:

- Ứng dụng mobile React Native.
- Backend Spring Boot.
- Cơ sở dữ liệu PostgreSQL.
- REST API.
- Xác thực và phân quyền.
- Docker và Docker Compose.
- CI/CD.
- Tài liệu quản lý dự án.
- Kiểm thử.
- Logging và Monitoring.

Mỗi môn chỉ nhấn mạnh một góc nhìn khác nhau của cùng sản phẩm.

```text
Kỹ năng lập trình nâng cao
→ Backend, kiến trúc phần mềm, Spring và bảo mật

Phát triển ứng dụng di động
→ React Native, giao diện, Navigation, State và API

Quản lý dự án CNTT
→ Phạm vi, kế hoạch, tiến độ, nguồn lực và rủi ro

Triển khai phần mềm
→ Git, CI/CD, Docker, môi trường, giám sát và rollback
```

---

## 3. MÔN KỸ NĂNG LẬP TRÌNH NÂNG CAO

### 3.1. Mục tiêu môn học trong dự án

Môn Kỹ năng lập trình nâng cao tập trung xây dựng backend có cấu trúc chuyên nghiệp bằng Java và Spring Boot.

Báo cáo phải thể hiện rõ:

- Kiến trúc Modular Monolith.
- Spring IoC Container.
- Dependency Injection.
- Spring Boot Auto-Configuration.
- Spring MVC.
- RESTful API.
- Spring Data JPA.
- Aspect-Oriented Programming.
- Authentication.
- Authorization.
- JWT.
- Phân quyền theo vai trò và quyền.
- Validation.
- Exception Handling.
- Transaction.
- Optimistic Locking.
- Unit Test.
- Integration Test.

IoC, viết tắt của Inversion of Control, là cơ chế để framework quản lý việc tạo và kết nối các object.

Dependency Injection là cách cung cấp dependency cho một class từ bên ngoài thay vì để class tự tạo dependency.

AOP, viết tắt của Aspect-Oriented Programming, là kỹ thuật tách các xử lý dùng chung như logging, audit hoặc đo thời gian khỏi nghiệp vụ chính.

### 3.2. Module được dùng làm minh chứng

Các module backend quan trọng:

- Identity Module.
- Project Module.
- Task Module.
- Service Request Module.
- Asset Module.
- Notification Module.
- Audit Module.

### 3.3. Chức năng minh chứng chính

### Xác thực và phân quyền

- Đăng nhập.
- Cấp access token.
- Cấp và xoay vòng refresh token.
- Đăng xuất.
- Khoá tài khoản.
- Phân quyền theo Role và Permission.
- Kiểm tra quyền tại Controller hoặc Application Service.

### Quản lý dự án

- Tạo dự án.
- Cập nhật dự án.
- Quản lý thành viên.
- Chuyển trạng thái.
- Optimistic Locking.
- Ghi lịch sử trạng thái.

### Quản lý công việc

- Tạo công việc.
- Tạo công việc con.
- Phân công người thực hiện.
- Kiểm tra thành viên dự án.
- Chuyển trạng thái theo workflow.
- Bình luận và tệp đính kèm.
- Xử lý transaction.

### Yêu cầu dịch vụ

- Tạo yêu cầu.
- Phân công người xử lý.
- Cập nhật trạng thái.
- Đánh giá dịch vụ.
- Liên kết với tài sản.
- Ghi lịch sử xử lý.

### 3.4. Mã nguồn nên đưa vào báo cáo

Chỉ đưa những đoạn quan trọng và có giải thích:

- Cấu hình Spring Security.
- JWT Authentication Filter.
- Token Service.
- Refresh Token Rotation.
- Permission Checker.
- Project Application Service.
- Task Status Transition Validator.
- Service Request Workflow.
- Global Exception Handler.
- Request Validation.
- Repository Query tiêu biểu.
- Audit Aspect.
- Transaction nghiệp vụ.
- Optimistic Locking.
- Unit Test.
- Integration Test.

Không chép toàn bộ source code vào phần nội dung chính.

Các file dài có thể đưa vào phụ lục.

### 3.5. Sơ đồ nên có

- Sơ đồ kiến trúc Modular Monolith.
- Sơ đồ phân lớp một module.
- Class Diagram cho Project và Task.
- Sequence Diagram đăng nhập.
- Sequence Diagram tạo công việc.
- Sequence Diagram cập nhật trạng thái.
- Sơ đồ Role và Permission.
- Sơ đồ xử lý Exception.
- Sơ đồ Transaction.

### 3.6. Kiểm thử cần trình bày

- Unit Test cho workflow trạng thái.
- Unit Test cho permission.
- Integration Test cho Repository.
- API Test cho Controller.
- Security Test cho endpoint.
- Test refresh token.
- Test Optimistic Locking.
- Test validation.
- Test transaction rollback.

### 3.7. Trọng tâm báo cáo

Báo cáo phải trả lời:

- Vì sao chọn Modular Monolith?
- Spring IoC và Dependency Injection được áp dụng ở đâu?
- AOP được dùng cho chức năng nào?
- Các module giao tiếp với nhau như thế nào?
- Backend kiểm tra quyền ra sao?
- JWT và refresh token hoạt động như thế nào?
- Làm thế nào tránh ghi đè dữ liệu khi nhiều người cùng sửa?
- Làm thế nào xử lý lỗi thống nhất?
- Code được kiểm thử như thế nào?

### 3.8. Trọng tâm slide thuyết trình

Slide môn Kỹ năng lập trình nâng cao ưu tiên:

1. Bài toán kỹ thuật.
2. Kiến trúc backend.
3. Cấu trúc module.
4. Spring IoC và Dependency Injection.
5. REST API.
6. JPA và PostgreSQL.
7. Authentication và JWT.
8. Authorization.
9. AOP và Audit.
10. Workflow trạng thái.
11. Kiểm thử.
12. Demo backend hoặc Swagger.
13. Kết quả.
14. Hướng phát triển.

---

## 4. MÔN PHÁT TRIỂN ỨNG DỤNG DI ĐỘNG

### 4.1. Mục tiêu môn học trong dự án

Môn Phát triển ứng dụng di động tập trung xây dựng ứng dụng WorkSphere bằng React Native và TypeScript.

Báo cáo phải nhấn mạnh:

- Component-based UI.
- JSX.
- Props.
- State.
- Hooks.
- Navigation.
- Truyền dữ liệu giữa màn hình.
- Form Validation.
- Danh sách dữ liệu.
- REST API.
- CRUD.
- Local Storage.
- Secure Storage.
- Loading State.
- Empty State.
- Error State.
- Refreshing State.
- Pagination.
- Trải nghiệm người dùng trên thiết bị di động.

Component-based UI là cách chia giao diện thành các thành phần nhỏ có thể tái sử dụng.

Props là dữ liệu component cha truyền cho component con.

State là dữ liệu có thể thay đổi trong quá trình component hoạt động.

### 4.2. Feature được dùng làm minh chứng

- Authentication.
- Dashboard.
- Projects.
- Tasks.
- Service Requests.
- Assets.
- Notifications.
- Profile.
- Settings.

### 4.3. Chức năng minh chứng chính

### Xác thực

- Màn hình đăng nhập.
- Kiểm tra form.
- Gọi API đăng nhập.
- Lưu token an toàn.
- Tự động refresh token.
- Đăng xuất.

### Navigation

- Root Navigator.
- Authentication Navigator.
- Main Navigator.
- Bottom Tab Navigator.
- Stack Navigator.
- Điều hướng sâu từ thông báo đến màn hình chi tiết.

### Danh sách dữ liệu

- Danh sách dự án.
- Danh sách công việc.
- Danh sách yêu cầu.
- Danh sách tài sản.
- Danh sách thông báo.
- Tìm kiếm.
- Lọc.
- Phân trang.
- Pull to Refresh.

### Biểu mẫu

- Tạo dự án.
- Tạo công việc.
- Tạo yêu cầu dịch vụ.
- Cập nhật hồ sơ.
- Đổi mật khẩu.
- Bình luận.
- Đánh giá dịch vụ.

### Trạng thái giao diện

Mọi màn hình dữ liệu phải thể hiện:

- Loading.
- Success.
- Empty.
- Error.
- Refreshing.
- Loading More.

### 4.4. Mã nguồn nên đưa vào báo cáo

- Root Navigation.
- Bottom Tab Navigation.
- Navigation Type Definition.
- HTTP Client.
- Token Interceptor.
- Refresh Token Logic.
- Secure Storage Service.
- Custom Hook tải dữ liệu.
- Query hoặc API Hook.
- Form Validation.
- Project Card.
- Task Card.
- Status Badge.
- Danh sách phân trang.
- Loading State.
- Empty State.
- Error State.
- Create Task Screen.
- Service Request Form.
- Unit Test cho utility hoặc hook.
- Component Test tiêu biểu.

Interceptor là logic chạy trước hoặc sau mỗi HTTP request, thường dùng để thêm token hoặc xử lý lỗi xác thực.

### 4.5. Sơ đồ nên có

- Sơ đồ Navigation.
- Sơ đồ cấu trúc feature.
- Sơ đồ luồng đăng nhập.
- Sơ đồ gọi API.
- Sơ đồ refresh token.
- Sơ đồ quản lý state.
- Sơ đồ luồng tạo công việc.
- Wireframe các màn hình chính.
- User Flow.
- Component Tree của một màn hình tiêu biểu.

Wireframe là bản phác thảo bố cục giao diện trước khi hoàn thiện thiết kế.

### 4.6. Kiểm thử cần trình bày

- Validation biểu mẫu.
- Điều hướng màn hình.
- Loading State.
- Empty State.
- Error State.
- Pull to Refresh.
- Pagination.
- API success.
- API failure.
- Token hết hạn.
- Mất kết nối mạng.
- Component rendering.
- Người dùng không có quyền không thấy thao tác bị cấm.

### 4.7. Trọng tâm báo cáo

Báo cáo phải trả lời:

- Ứng dụng được chia component như thế nào?
- Navigation được tổ chức ra sao?
- Dữ liệu được truyền giữa màn hình như thế nào?
- Server State và Local State được phân biệt ra sao?
- Ứng dụng gọi API như thế nào?
- Token được lưu an toàn như thế nào?
- Ứng dụng xử lý mất mạng và lỗi API ra sao?
- Danh sách lớn được phân trang như thế nào?
- Giao diện hỗ trợ loading, empty và error như thế nào?
- Component nào được tái sử dụng?

### 4.8. Trọng tâm slide thuyết trình

Slide môn Phát triển ứng dụng di động ưu tiên:

1. Bài toán sử dụng mobile.
2. Đối tượng sử dụng.
3. Danh sách chức năng.
4. User Flow.
5. Navigation.
6. Kiến trúc mobile.
7. Component-based UI.
8. API Integration.
9. Local và Secure Storage.
10. Loading, Empty và Error State.
11. Các màn hình chính.
12. Demo ứng dụng.
13. Kiểm thử.
14. Kết quả.
15. Hướng phát triển.

---

## 5. MÔN QUẢN LÝ DỰ ÁN CNTT

### 5.1. Mục tiêu môn học trong dự án

Môn Quản lý dự án CNTT tập trung vào quá trình lập kế hoạch, tổ chức, theo dõi và kiểm soát dự án WorkSphere.

Báo cáo không tập trung trình bày chi tiết code.

Báo cáo phải nhấn mạnh:

- Business Case.
- Project Charter.
- Stakeholder.
- Scope Management.
- Requirement Management.
- Work Breakdown Structure.
- Product Backlog.
- Timeline.
- Milestone.
- Resource Management.
- Communication Management.
- Risk Management.
- Quality Management.
- Change Management.
- Acceptance.
- Project Closure.

Business Case là tài liệu giải thích vì sao dự án cần được thực hiện và lợi ích dự kiến.

Project Charter là tài liệu chính thức khởi động dự án, xác định mục tiêu, phạm vi sơ bộ và quyền hạn.

Stakeholder là cá nhân hoặc tổ chức có ảnh hưởng hoặc bị ảnh hưởng bởi dự án.

### 5.2. Tài liệu minh chứng chính

- Project Charter.
- Business Case.
- Stakeholder Register.
- Scope Statement.
- Requirement List.
- Work Breakdown Structure.
- Product Backlog.
- Sprint Plan.
- Timeline.
- Milestone Plan.
- RACI Matrix.
- Resource Plan.
- Communication Plan.
- Risk Register.
- Quality Plan.
- Change Request.
- Meeting Minutes.
- Weekly Status Report.
- Acceptance Checklist.
- Lessons Learned.
- Project Closure Report.

### 5.3. Phạm vi quản lý

Project Scope phải phân biệt:

### Trong phạm vi

- Mobile React Native.
- Backend Spring Boot.
- PostgreSQL.
- Authentication.
- Project.
- Task.
- Service Request.
- Asset.
- Notification.
- Docker Compose.
- Kiểm thử.
- Tài liệu.

### Ngoài phạm vi

- AI Assistant.
- Chat thời gian thực.
- Video call.
- Microservice.
- Kubernetes trong MVP.
- Thanh toán.
- Nhận diện khuôn mặt.
- GPS Tracking.
- Multi-region Deployment.

### 5.4. Work Breakdown Structure dự kiến

```text
1. Quản lý dự án
2. Phân tích yêu cầu
3. Thiết kế hệ thống
4. Thiết kế cơ sở dữ liệu
5. Thiết kế API
6. Thiết kế giao diện mobile
7. Xây dựng backend
8. Xây dựng mobile
9. Tích hợp hệ thống
10. Kiểm thử
11. Triển khai
12. Viết tài liệu
13. Nghiệm thu
14. Đóng dự án
```

Mỗi nhóm lớn phải được phân rã thành Work Package nhỏ hơn.

Work Package là đơn vị công việc đủ nhỏ để giao trách nhiệm, ước lượng và theo dõi.

### 5.5. Ma trận RACI

Các vai trò dự án có thể gồm:

- Project Manager.
- Backend Developer.
- Mobile Developer.
- Tester.
- DevOps.
- Documentation Owner.
- Reviewer.

RACI gồm:

- Responsible: người trực tiếp thực hiện.
- Accountable: người chịu trách nhiệm cuối cùng.
- Consulted: người được tham vấn.
- Informed: người cần được thông báo.

### 5.6. Quản lý rủi ro

Các rủi ro tiêu biểu:

- Phạm vi quá lớn.
- Thành viên thiếu kinh nghiệm.
- API và mobile không đồng nhất.
- Thay đổi yêu cầu.
- Chậm tiến độ.
- Lỗi tích hợp.
- Database thay đổi nhiều.
- Dependency không tương thích.
- Thiếu thiết bị kiểm thử.
- Mất dữ liệu.
- Thành viên không hoàn thành nhiệm vụ.
- Báo cáo hoàn thành muộn.

Mỗi rủi ro phải có:

- Mã.
- Mô tả.
- Xác suất.
- Mức ảnh hưởng.
- Mức độ ưu tiên.
- Người phụ trách.
- Biện pháp phòng ngừa.
- Kế hoạch ứng phó.
- Trạng thái.

### 5.7. Quản lý thay đổi

Mọi thay đổi phạm vi sử dụng Change Request.

Change Request phải ghi:

- Nội dung thay đổi.
- Lý do.
- Lợi ích.
- Ảnh hưởng phạm vi.
- Ảnh hưởng tiến độ.
- Ảnh hưởng chi phí.
- Ảnh hưởng chất lượng.
- Rủi ro.
- Quyết định phê duyệt hoặc từ chối.

Không thêm chức năng trực tiếp vào code trước khi thay đổi được đánh giá.

### 5.8. Bằng chứng dự án

- Repository commit.
- Issue.
- Pull Request.
- Project Board.
- Sprint Backlog.
- Biên bản họp.
- Báo cáo tuần.
- Biểu đồ tiến độ.
- Test Report.
- Deployment Record.
- Acceptance Record.

### 5.9. Trọng tâm báo cáo

Báo cáo phải trả lời:

- Vì sao dự án cần được thực hiện?
- Mục tiêu SMART là gì?
- Ai là Stakeholder?
- Phạm vi gồm và không gồm những gì?
- Công việc được phân rã như thế nào?
- Nguồn lực được phân công ra sao?
- Tiến độ được theo dõi như thế nào?
- Các rủi ro chính là gì?
- Thay đổi được kiểm soát như thế nào?
- Chất lượng được kiểm soát ra sao?
- Dự án được nghiệm thu như thế nào?

SMART là nguyên tắc đặt mục tiêu cụ thể, đo lường được, khả thi, phù hợp và có thời hạn.

### 5.10. Trọng tâm slide thuyết trình

Slide môn Quản lý dự án CNTT ưu tiên:

1. Bối cảnh.
2. Business Case.
3. Mục tiêu dự án.
4. Stakeholder.
5. Phạm vi.
6. WBS.
7. Timeline.
8. Milestone.
9. RACI.
10. Nguồn lực.
11. Risk Register.
12. Communication Plan.
13. Change Management.
14. Quality Control.
15. Tiến độ thực tế.
16. Kết quả.
17. Lessons Learned.
18. Kết luận.

---

## 6. MÔN TRIỂN KHAI PHẦN MỀM

### 6.1. Mục tiêu môn học trong dự án

Môn Triển khai phần mềm tập trung vào quá trình quản lý mã nguồn, kiểm thử tự động, đóng gói, triển khai và vận hành WorkSphere.

Báo cáo phải nhấn mạnh:

- Source Code Management.
- Git.
- Branch Strategy.
- Pull Request.
- Code Review.
- Continuous Integration.
- Continuous Delivery.
- Docker.
- Docker Compose.
- Infrastructure as Code.
- Environment Configuration.
- Secret Management.
- Health Check.
- Logging.
- Monitoring.
- Backup.
- Rollback.

Continuous Integration, viết tắt CI, là quá trình tự động kiểm tra code mỗi khi có thay đổi.

Continuous Delivery, viết tắt CD, là quá trình tự động chuẩn bị hoặc triển khai phiên bản phần mềm.

Infrastructure as Code là cách quản lý hạ tầng bằng file cấu hình hoặc code.

### 6.2. Cấu trúc repository dùng làm minh chứng

```text
WorkSphere/
├── mobile/
├── backend/
├── infrastructure/
├── scripts/
├── docs/
├── .github/workflows/
├── docker-compose.yml
├── .gitignore
└── README.md
```

### 6.3. Git Workflow

Đề xuất:

```text
main
develop
feature/*
fix/*
release/*
hotfix/*
```

Quy tắc:

- Không commit trực tiếp vào `main`.
- Feature phát triển trên nhánh riêng.
- Merge qua Pull Request.
- Pull Request phải được review.
- CI phải chạy trước khi merge.
- Commit message phải có ý nghĩa.
- Không commit secret.
- Không commit file build lớn.
- Không commit `.env` thật.

### 6.4. CI Pipeline

Pipeline tối thiểu:

```text
Checkout source
→ Set up Java và Node.js
→ Restore dependency cache
→ Backend compile
→ Backend unit test
→ Backend integration test
→ Mobile lint
→ Mobile type check
→ Mobile test
→ Security scan cơ bản
→ Build artifact
→ Build Docker image
```

### 6.5. Docker

Container dự kiến:

- Backend.
- PostgreSQL.
- File Storage nếu cần.
- Monitoring nếu triển khai.

Dockerfile backend cần:

- Multi-stage build.
- Chạy bằng user không phải root nếu phù hợp.
- Không chứa secret.
- Có health check hoặc endpoint health.
- Image có version tag.
- Tối ưu layer cache.

Multi-stage build là kỹ thuật sử dụng nhiều giai đoạn trong Dockerfile để image cuối nhỏ hơn và không chứa công cụ build không cần thiết.

### 6.6. Docker Compose

Docker Compose local có thể gồm:

```text
backend
postgres
file-storage
monitoring
```

Yêu cầu:

- Có network riêng.
- Có volume lưu dữ liệu.
- Có health check.
- Backend chờ database sẵn sàng.
- Secret không hard-code.
- Có file `.env.example`.
- Không commit `.env` thật.

### 6.7. Environment

Các môi trường:

- Local.
- Test.
- Staging.
- Production.

Mỗi môi trường có:

- Database riêng.
- Secret riêng.
- Log level phù hợp.
- URL phù hợp.
- Cấu hình được quản lý ngoài source code.

### 6.8. Health Check

Backend cung cấp thông tin:

- Application startup.
- Database connectivity.
- File storage connectivity.
- Readiness.
- Liveness.

Readiness cho biết ứng dụng đã sẵn sàng nhận request chưa.

Liveness cho biết tiến trình ứng dụng còn hoạt động hay cần được khởi động lại.

### 6.9. Logging và Monitoring

Logging cần:

- Timestamp.
- Log level.
- Trace ID.
- Request ID.
- Endpoint.
- Trạng thái response.
- Thời gian xử lý.
- Thông tin lỗi phù hợp.

Không ghi:

- Password.
- Access token.
- Refresh token.
- Secret.
- Nội dung nhạy cảm.

Monitoring theo dõi:

- CPU.
- Memory.
- Request count.
- Error rate.
- Response time.
- Database connection.
- Health status.

### 6.10. Backup và Rollback

Backup:

- Backup PostgreSQL.
- Backup file storage.
- Xác định lịch backup.
- Kiểm tra khả năng phục hồi.

Rollback:

- Giữ image phiên bản trước.
- Có release tag.
- Có migration strategy.
- Có hướng dẫn quay lại phiên bản trước.
- Không rollback database tuỳ tiện nếu có dữ liệu mới.

### 6.11. Bằng chứng nên đưa vào báo cáo

- Branch Strategy.
- Pull Request.
- CI Workflow.
- CI log thành công.
- Unit Test Result.
- Dockerfile.
- Docker Compose.
- Container đang chạy.
- Health Check.
- Image tag.
- Environment configuration.
- Logging.
- Monitoring Dashboard.
- Deployment Record.
- Rollback Procedure.
- Backup Procedure.

### 6.12. Trọng tâm báo cáo

Báo cáo phải trả lời:

- Mã nguồn được quản lý như thế nào?
- Nhánh Git được sử dụng ra sao?
- Code được kiểm tra trước khi merge như thế nào?
- CI Pipeline gồm những bước nào?
- Phần mềm được đóng gói bằng Docker ra sao?
- Các container kết nối như thế nào?
- Cấu hình môi trường được tách ra sao?
- Secret được bảo vệ như thế nào?
- Ứng dụng được giám sát như thế nào?
- Khi deployment lỗi thì rollback ra sao?
- Dữ liệu được backup và phục hồi như thế nào?

### 6.13. Trọng tâm slide thuyết trình

Slide môn Triển khai phần mềm ưu tiên:

1. Kiến trúc triển khai.
2. Repository.
3. Git Workflow.
4. Pull Request.
5. CI Pipeline.
6. Automated Test.
7. Dockerfile.
8. Docker Compose.
9. Environment.
10. Secret Management.
11. Health Check.
12. Logging.
13. Monitoring.
14. Backup.
15. Rollback.
16. Demo pipeline.
17. Kết quả.
18. Hướng phát triển Kubernetes.

---

## 7. MA TRẬN CHỨC NĂNG VÀ MÔN HỌC

| Chức năng | Kỹ năng lập trình nâng cao | Phát triển ứng dụng di động | Quản lý dự án CNTT | Triển khai phần mềm |
|---|---|---|---|---|
| Đăng nhập | Spring Security, JWT | Form, Secure Storage, Navigation | Quản lý quyền truy cập | Secret, log, health |
| Dự án | Domain, JPA, transaction | Danh sách và chi tiết | Scope, WBS, milestone | CI và deployment |
| Công việc | Workflow, validation | CRUD, state, pagination | Backlog, tiến độ | Test và pipeline |
| Yêu cầu dịch vụ | Module nghiệp vụ | Form, ảnh, API | Issue management | Logging và monitoring |
| Tài sản | Entity và relation | Danh sách, chi tiết | Resource management | Backup dữ liệu |
| Thông báo | Event và service | Badge, deep link | Communication plan | Monitoring |
| File | Security và storage | Upload trên mobile | Document management | Volume và backup |
| Audit | AOP và logging | Không phải trọng tâm | Traceability | Centralised logging |
| Dashboard | Query và reporting | Data visualisation | Progress reporting | Metrics |
| Phân quyền | Role và Permission | Ẩn hiện thao tác | RACI và trách nhiệm | Security configuration |

---

## 8. MA TRẬN BẰNG CHỨNG

### 8.1. Kỹ năng lập trình nâng cao

Bằng chứng bắt buộc:

- Source backend.
- API documentation.
- Database migration.
- Security configuration.
- Unit test.
- Integration test.
- Swagger.
- Sequence Diagram.
- Class Diagram.
- Mã nguồn tiêu biểu.

### 8.2. Phát triển ứng dụng di động

Bằng chứng bắt buộc:

- Source React Native.
- Danh sách màn hình.
- Navigation Map.
- Component Tree.
- API Service.
- Form Validation.
- Local hoặc Secure Storage.
- Loading, Empty và Error State.
- Mobile Test.
- Ảnh hoặc video demo ứng dụng.

### 8.3. Quản lý dự án CNTT

Bằng chứng bắt buộc:

- Project Charter.
- Scope Statement.
- WBS.
- Timeline.
- Backlog.
- RACI.
- Risk Register.
- Meeting Minutes.
- Weekly Report.
- Change Request.
- Acceptance Checklist.

### 8.4. Triển khai phần mềm

Bằng chứng bắt buộc:

- Git Repository.
- Branch.
- Pull Request.
- CI Workflow.
- Test Result.
- Dockerfile.
- Docker Compose.
- Environment File mẫu.
- Health Check.
- Logging.
- Monitoring.
- Backup và Rollback.

---

## 9. QUY TẮC VIẾT BÁO CÁO

### 9.1. Nội dung dùng chung

Có thể sử dụng lại có kiểm soát:

- Giới thiệu sản phẩm.
- Bài toán thực tế.
- Tổng quan chức năng.
- Đối tượng sử dụng.
- Kiến trúc tổng thể.
- Kết quả chung.

Không sao chép nguyên văn toàn bộ giữa các báo cáo.

### 9.2. Nội dung riêng từng môn

### Kỹ năng lập trình nâng cao

Tập trung backend, Spring, kiến trúc, bảo mật và kiểm thử.

### Phát triển ứng dụng di động

Tập trung React Native, UI, Navigation, State, API và trải nghiệm.

### Quản lý dự án CNTT

Tập trung phạm vi, kế hoạch, tiến độ, nguồn lực, rủi ro và chất lượng.

### Triển khai phần mềm

Tập trung Git, CI/CD, Docker, môi trường, logging, monitoring và rollback.

### 9.3. Code trong báo cáo

Được phép đưa code quan trọng vào báo cáo nhưng phải:

- Có mục tiêu rõ ràng.
- Có giải thích.
- Có chú thích.
- Không chép file quá dài.
- Không dùng code chỉ để tăng số trang.
- Đoạn code dài đưa vào phụ lục.
- Có đường dẫn đến repository.

### 9.4. Số trang báo cáo

Nếu yêu cầu từ 60 đến 70 trang, nội dung chính có thể phân bổ:

```text
Mở đầu: 3 đến 5 trang
Khảo sát và yêu cầu: 6 đến 8 trang
Cơ sở lý thuyết: 8 đến 10 trang
Phân tích và thiết kế: 12 đến 15 trang
Cài đặt: 15 đến 18 trang
Kiểm thử: 5 đến 7 trang
Kết quả: 3 đến 5 trang
Kết luận: 2 đến 3 trang
```

Phụ lục có thể chứa:

- Code quan trọng.
- API.
- Database.
- Test Case.
- Cấu hình deployment.
- Hướng dẫn cài đặt.

---

## 10. QUY TẮC TẠO SLIDE

Mỗi bộ slide phải:

- Dùng cùng nhận diện sản phẩm WorkSphere.
- Có màu sắc và logo nhất quán.
- Không dùng cùng nội dung cho cả bốn môn.
- Nhấn mạnh đúng kiến thức của môn.
- Có sơ đồ.
- Có hình ảnh sản phẩm.
- Có số liệu kết quả.
- Có demo hoặc kịch bản demo.
- Không đưa quá nhiều chữ lên một slide.
- Code chỉ hiển thị đoạn ngắn.
- Nội dung chi tiết đưa vào Speaker Notes.

---

## 11. QUY TẮC DÀNH CHO AI AGENT

AI Agent phải:

1. Xác định người dùng đang làm việc cho môn nào.
2. Đọc phần tương ứng trong tài liệu này.
3. Không viết bốn báo cáo giống nhau.
4. Không tạo slide chung rồi chỉ đổi tên môn.
5. Khi viết code phải xác định code là bằng chứng cho môn nào.
6. Khi viết báo cáo phải ưu tiên thuật ngữ và nội dung của môn đó.
7. Khi tạo slide phải chọn sơ đồ và hình ảnh phù hợp với môn.
8. Phân biệt nội dung Edux và kiến thức bổ sung.
9. Không tuyên bố nội dung thuộc Edux nếu không có trong Knowledge Pack.
10. Không tự thêm chức năng chỉ để làm báo cáo dài.
11. Không sao chép code dài mà không giải thích.
12. Không tạo số liệu hoặc bằng chứng giả.
13. Không tuyên bố kiểm thử thành công nếu chưa chạy test.
14. Không tuyên bố deployment thành công nếu chưa có log hoặc bằng chứng.
15. Không viết nội dung quản lý dự án như báo cáo kỹ thuật.
16. Không viết báo cáo mobile chỉ tập trung backend.
17. Không viết báo cáo deployment chỉ mô tả chức năng ứng dụng.
18. Mọi báo cáo phải liên kết kiến thức môn học với bằng chứng thật trong WorkSphere.

---

## 12. CÁC QUYẾT ĐỊNH ĐÃ KHÓA

- Một dự án WorkSphere được sử dụng cho bốn môn.
- Mỗi môn có báo cáo riêng.
- Mỗi môn có slide riêng.
- Mỗi môn có trọng tâm và bằng chứng riêng.
- Code được dùng chung nhưng cách phân tích khác nhau.
- Không tạo bốn sản phẩm rời rạc.
- Không thay đổi chức năng chỉ để phù hợp một báo cáo.
- Mọi kiến thức phải gắn với chức năng hoặc bằng chứng thật.
- Báo cáo không được chứa bằng chứng giả.
- Nội dung từ Edux phải được phân biệt với nội dung bổ sung.
- AI Agent phải đọc tài liệu dự án trước khi tạo code, báo cáo hoặc slide.

Mọi thay đổi về cách sử dụng dự án cho bốn môn phải được cập nhật trong tài liệu này trước khi viết báo cáo hoặc tạo slide.