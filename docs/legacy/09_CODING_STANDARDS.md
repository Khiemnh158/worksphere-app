# TIÊU CHUẨN VIẾT CODE VÀ GIT WORKFLOW WORKSPHERE

## 1. Mục đích

Tài liệu này xác định tiêu chuẩn viết mã nguồn, tổ chức file, đặt tên, kiểm thử, Git Workflow và quy tắc sửa code của dự án WorkSphere.

Mục tiêu:

- Mã nguồn thống nhất giữa các thành viên.
- Dễ đọc, dễ kiểm thử và dễ bảo trì.
- Hạn chế code trùng lặp.
- Hạn chế lỗi do sửa nhiều module cùng lúc.
- Đảm bảo AI Agent không tự ý thay đổi kiến trúc.
- Tạo lịch sử Git rõ ràng.
- Hỗ trợ Code Review và CI/CD.
- Tạo bằng chứng cho bốn môn học.

Mọi thành viên và AI Agent phải đọc tài liệu này trước khi tạo hoặc sửa mã nguồn.

---

## 2. Nguyên tắc chung

### 2.1. Ưu tiên tính rõ ràng

Code phải dễ đọc hơn là viết ngắn.

Không viết code phức tạp chỉ để giảm số dòng.

Tên class, function, method và variable phải thể hiện đúng mục đích.

Ví dụ tốt:

```java
validateProjectMemberPermission();
calculateProjectProgress();
findActiveTasksByAssignee();
```

Ví dụ không tốt:

```java
check();
calc();
getData();
process();
```

### 2.2. Một thành phần, một trách nhiệm

Mỗi class, function hoặc component chỉ nên có một trách nhiệm chính.

Không tạo một class vừa:

- Kiểm tra quyền.
- Truy vấn database.
- Gửi thông báo.
- Upload file.
- Chuyển đổi response.

Nếu một class làm quá nhiều việc, phải tách thành service hoặc component phù hợp.

Nguyên tắc này được gọi là Single Responsibility Principle, nghĩa là một thành phần chỉ nên có một lý do chính để thay đổi.

### 2.3. Không lặp lại logic

Không sao chép cùng một đoạn code vào nhiều nơi.

Logic dùng chung có thể được đặt vào:

- Shared Utility.
- Domain Service.
- Application Service.
- Custom Hook.
- Reusable Component.
- Validation Schema.
- API Client.

Không tạo abstraction quá sớm cho đoạn code mới xuất hiện một lần.

Abstraction là cách ẩn chi tiết triển khai phía sau một interface, class hoặc function có mục đích rõ ràng.

### 2.4. Code phải có kiểm thử

Code nghiệp vụ quan trọng phải có test.

Không đánh dấu chức năng hoàn thành chỉ vì code đã compile.

Chức năng chỉ hoàn thành khi đạt Definition of Done trong tài liệu Roadmap.

### 2.5. Không tự viết lại giải pháp đã tồn tại

Trước khi tự tạo giải pháp mới phải kiểm tra:

1. Project đã có hàm hoặc module tương tự chưa.
2. Framework có hỗ trợ sẵn không.
3. Có package ổn định và đang được duy trì không.
4. Package có giấy phép phù hợp không.
5. Package có tương thích phiên bản không.
6. Package có tạo rủi ro bảo mật không.

Không tự viết lại:

- JWT parser khi có thư viện ổn định.
- HTTP client khi Axios hoặc Fetch đã đáp ứng.
- Date parser phức tạp khi thư viện hiện tại đã có.
- Form validation engine mới.
- State management library riêng.
- ORM riêng.
- Migration tool riêng.

Không cài nhiều package làm cùng một chức năng.

---

## 3. Quy tắc định dạng file

### 3.1. Encoding

Tất cả file văn bản sử dụng:

```text
UTF-8
```

Không sử dụng encoding cục bộ gây lỗi tiếng Việt.

### 3.2. Kết thúc dòng

Repository ưu tiên:

```text
LF
```

Git có thể được cấu hình để xử lý khác biệt giữa Windows và môi trường CI.

### 3.3. Ký tự cuối file

Mỗi file văn bản phải có một dòng trống ở cuối file.

### 3.4. Khoảng trắng

- Không để khoảng trắng thừa cuối dòng.
- Không dùng Tab và Space lẫn lộn.
- Java sử dụng 4 Space.
- TypeScript và JSON sử dụng 2 Space.
- YAML sử dụng 2 Space.
- Không dùng Tab trong YAML.

### 3.5. Độ dài dòng

Khuyến nghị:

```text
Java: tối đa khoảng 120 ký tự
TypeScript: tối đa khoảng 100 đến 120 ký tự
Markdown: linh hoạt theo nội dung
```

Nếu một dòng quá dài, chia thành nhiều dòng dễ đọc.

---

## 4. Quy tắc đặt tên chung

### 4.1. Tên phải có ý nghĩa

Ví dụ tốt:

```text
projectRepository
currentUserId
validateTaskTransition
serviceRequestStatus
```

Ví dụ không tốt:

```text
repo
x
temp
obj
data1
abc
```

Tên ngắn được chấp nhận trong phạm vi nhỏ và có ý nghĩa rõ ràng:

```text
i
j
id
dto
url
api
```

### 4.2. Không dùng từ viết tắt khó hiểu

Có thể sử dụng các từ viết tắt phổ biến:

```text
API
DTO
JWT
URL
HTTP
UUID
SQL
UI
```

Không tự tạo từ viết tắt không được giải thích.

### 4.3. Không đặt tên gây nhầm lẫn

Không nên dùng:

```text
userData
userInfo
userObject
```

nếu có thể dùng tên cụ thể hơn:

```text
currentUserProfile
projectMember
loginUserResponse
```

---

## 5. Tiêu chuẩn Java và Spring Boot

### 5.1. Phiên bản Java

Phiên bản Java phải được khóa trong file build và CI.

Không tự đổi phiên bản Java khi chưa cập nhật:

- Tài liệu kiến trúc.
- Build configuration.
- Dockerfile.
- CI Workflow.
- Hướng dẫn cài đặt.

### 5.2. Quy tắc đặt tên Java

Package dùng chữ thường:

```java
com.worksphere.task.api
com.worksphere.task.application
com.worksphere.task.domain
com.worksphere.task.infrastructure
```

Class và Interface dùng PascalCase:

```java
TaskApplicationService
ProjectController
ServiceRequestRepository
PermissionEvaluator
```

Method và Variable dùng camelCase:

```java
createTask();
findProjectById();
currentUserId;
plannedEndDate;
```

Constant dùng chữ hoa và dấu gạch dưới:

```java
MAX_UPLOAD_SIZE
DEFAULT_PAGE_SIZE
ACCESS_TOKEN_DURATION
```

Enum dùng PascalCase, giá trị enum dùng chữ hoa:

```java
public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    IN_REVIEW,
    COMPLETED,
    CANCELLED
}
```

### 5.3. Hậu tố class

Sử dụng hậu tố rõ ràng:

```text
Controller
ApplicationService
DomainService
Repository
RepositoryImpl
Mapper
Validator
Filter
Interceptor
Configuration
Exception
Request
Response
Command
Query
Event
Listener
```

Ví dụ:

```java
TaskController
TaskApplicationService
TaskTransitionValidator
CreateTaskRequest
TaskDetailResponse
```

### 5.4. Controller

Controller chỉ chịu trách nhiệm:

- Nhận HTTP Request.
- Kiểm tra validation cơ bản.
- Lấy thông tin xác thực cần thiết.
- Gọi Application Service.
- Trả HTTP Response.

Controller không được:

- Truy cập Repository trực tiếp.
- Viết query.
- Chứa transaction nghiệp vụ.
- Tính toán phức tạp.
- Trả JPA Entity trực tiếp.

Ví dụ:

```java
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskApplicationService taskApplicationService;

    @PostMapping
    public ResponseEntity<ApiResponse<TaskDetailResponse>> createTask(
            @Valid @RequestBody CreateTaskRequest request) {

        TaskDetailResponse response =
                taskApplicationService.createTask(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }
}
```

### 5.5. Application Service

Application Service chịu trách nhiệm:

- Điều phối use case.
- Kiểm tra quyền nghiệp vụ.
- Quản lý transaction.
- Gọi Domain Service.
- Gọi Repository.
- Gọi public service của module khác.
- Phát Domain Event khi cần.

Không đặt mọi thao tác vào một service khổng lồ.

Có thể tách theo use case:

```text
CreateTaskUseCase
UpdateTaskUseCase
ChangeTaskStatusUseCase
AssignTaskUseCase
```

### 5.6. Domain

Domain chứa quy tắc nghiệp vụ cốt lõi.

Ví dụ:

```java
public boolean canTransitionTo(TaskStatus targetStatus) {
    return switch (status) {
        case TODO -> targetStatus == TaskStatus.IN_PROGRESS
                || targetStatus == TaskStatus.CANCELLED;
        case IN_PROGRESS -> targetStatus == TaskStatus.IN_REVIEW
                || targetStatus == TaskStatus.CANCELLED;
        case IN_REVIEW -> targetStatus == TaskStatus.COMPLETED
                || targetStatus == TaskStatus.IN_PROGRESS;
        case COMPLETED, CANCELLED -> false;
    };
}
```

Không đặt quy tắc workflow chỉ trong Controller hoặc mobile.

Backend là nơi quyết định cuối cùng.

### 5.7. Repository

Repository Interface đặt trong Domain hoặc Application theo kiến trúc đã khóa.

Repository Implementation đặt trong Infrastructure.

Không tạo method mơ hồ:

```java
findData();
getList();
querySomething();
```

Dùng tên rõ ràng:

```java
findActiveTasksByProjectId();
existsActiveAssignmentByTaskIdAndUserId();
findVisibleProjectsForUser();
```

Không dùng Native SQL nếu JPQL hoặc Specification đáp ứng tốt.

Native SQL chỉ được dùng khi:

- Có lý do về hiệu năng hoặc độ phức tạp.
- Có test.
- Có chú thích giải thích.
- Đã kiểm tra trên PostgreSQL.

### 5.8. Entity và DTO

Không trả JPA Entity trực tiếp qua API.

Phải chuyển Entity thành Response DTO.

Không bind Request DTO trực tiếp vào Entity nếu có thể làm lộ field không được phép sửa.

Ví dụ:

```java
public record CreateTaskRequest(
        @NotNull UUID projectId,
        @NotBlank @Size(max = 255) String title,
        String description,
        @NotNull TaskPriority priority,
        Set<UUID> assigneeIds,
        Instant dueDate
) {
}
```

Record là kiểu dữ liệu Java ngắn gọn, phù hợp với DTO bất biến.

### 5.9. Mapper

Mapper chỉ chuyển đổi dữ liệu.

Mapper không chứa:

- Query database.
- Kiểm tra quyền.
- Gửi thông báo.
- Transaction.
- Workflow.

Có thể sử dụng mapper thủ công hoặc thư viện mapping sau khi đánh giá dependency.

### 5.10. Validation

Request DTO sử dụng Bean Validation:

```java
@NotNull
@NotBlank
@Size
@Email
@Min
@Max
@Positive
@Pattern
```

Nghiệp vụ phức tạp phải kiểm tra trong Application hoặc Domain Layer.

Không dựa hoàn toàn vào validation của mobile.

### 5.11. Exception

Sử dụng exception có mục đích rõ ràng:

```java
ResourceNotFoundException
AccessDeniedException
BusinessRuleException
OptimisticLockConflictException
InvalidStateTransitionException
```

Không sử dụng:

```java
throw new RuntimeException("Error");
```

Global Exception Handler phải chuyển exception thành Error Response chuẩn.

Không trả message kỹ thuật trực tiếp cho mobile.

### 5.12. Transaction

Đặt `@Transactional` tại Application Service hoặc Use Case.

Không đặt transaction tại Controller.

Không giữ transaction mở khi:

- Gọi dịch vụ mạng chậm.
- Upload file lớn.
- Xử lý không liên quan database.

Dùng:

```java
@Transactional(readOnly = true)
```

cho use case chỉ đọc khi phù hợp.

### 5.13. Optional

Không gọi:

```java
optional.get();
```

khi chưa xác nhận dữ liệu tồn tại.

Ưu tiên:

```java
repository.findById(id)
        .orElseThrow(
                () -> new ResourceNotFoundException("Task not found")
        );
```

### 5.14. Null

Không dùng `null` tuỳ tiện.

Phải xác định field nào có thể null trong:

- Database Design.
- DTO.
- API Contract.
- TypeScript Type.

Không trả danh sách null. Danh sách không có phần tử phải trả:

```json
[]
```

### 5.15. Logging Java

Không dùng:

```java
System.out.println();
```

Sử dụng logging framework:

```java
log.info(
        "Task created. taskId={}, projectId={}, actorId={}",
        taskId,
        projectId,
        actorId
);
```

Không log:

- Password.
- Access token.
- Refresh token.
- Secret.
- Nội dung file.
- Thông tin nhạy cảm không cần thiết.

### 5.16. Comment Java

Comment giải thích lý do, không lặp lại code.

Không tốt:

```java
// Increase count by one
count++;
```

Tốt:

```java
// The initial request has already been executed before this method.
retryCount++;
```

Không comment code cũ. Xoá code không dùng và sử dụng Git để xem lịch sử.

---

## 6. Tiêu chuẩn React Native và TypeScript

### 6.1. Quy tắc đặt tên

Component và Screen dùng PascalCase:

```text
LoginScreen
TaskDetailScreen
ProjectCard
StatusBadge
```

Hook bắt đầu bằng `use`:

```text
useAuth
useTasks
useProjectDetail
useCreateServiceRequest
```

Function và Variable dùng camelCase:

```text
handleSubmit
loadNextPage
selectedProjectId
isRefreshing
```

Type và Interface dùng PascalCase:

```text
Task
TaskDetail
CreateTaskRequest
RootStackParamList
```

Constant toàn cục dùng chữ hoa và dấu gạch dưới:

```text
DEFAULT_PAGE_SIZE
MAX_UPLOAD_FILE_SIZE
ACCESS_TOKEN_KEY
```

### 6.2. Không dùng `any` tuỳ tiện

Ưu tiên dùng `unknown`, sau đó kiểm tra kiểu.

```typescript
function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}
```

Nếu bắt buộc dùng `any`, phải có lý do và giới hạn phạm vi nhỏ nhất.

### 6.3. Component

Component phải:

- Có trách nhiệm rõ ràng.
- Nhận Props có kiểu.
- Không gọi API trực tiếp khi đã có Hook hoặc Service.
- Không chứa logic nghiệp vụ phức tạp.
- Không đọc token trực tiếp.
- Có thể kiểm thử.

Ví dụ:

```typescript
type TaskCardProps = {
  task: TaskListItem;
  onPress: (taskId: string) => void;
};

export function TaskCard({
  task,
  onPress,
}: TaskCardProps): React.ReactElement {
  return (
    <Pressable onPress={() => onPress(task.id)}>
      <Text>{task.title}</Text>
      <StatusBadge status={task.status} />
    </Pressable>
  );
}
```

### 6.4. Screen

Screen chịu trách nhiệm:

- Nhận Navigation Parameter.
- Gọi Feature Hook.
- Kết nối các component.
- Điều phối trạng thái giao diện.
- Điều hướng.

Screen không được:

- Tự xây Authorization Header.
- Tự đọc Secure Storage.
- Tự viết logic refresh token.
- Tự nối URL API.
- Tự parse response khác chuẩn.

### 6.5. Hook

Custom Hook được dùng để đóng gói:

- State.
- API Query.
- Mutation.
- Pagination.
- Refresh.
- Logic tái sử dụng.

Hook không nên trả quá nhiều chi tiết nội bộ không cần thiết cho Screen.

### 6.6. API Service

Mỗi feature có API Service hoặc API Hook rõ ràng.

```typescript
export const taskApi = {
  getTasks: async (
    params: TaskListParams,
  ): Promise<PageResponse<TaskListItem>> => {
    const response =
      await httpClient.get<ApiResponse<PageResponse<TaskListItem>>>(
        '/tasks',
        { params },
      );

    return response.data.data;
  },
};
```

Không tạo nhiều HTTP Client khác nhau.

Không hard-code Base URL trong từng feature.

### 6.7. Navigation

Navigation Parameter phải có TypeScript Type:

```typescript
export type RootStackParamList = {
  Dashboard: undefined;
  ProjectDetail: {
    projectId: string;
  };
  TaskDetail: {
    taskId: string;
  };
  ServiceRequestDetail: {
    requestId: string;
  };
};
```

Không truyền toàn bộ object lớn qua Navigation.

Ưu tiên chỉ truyền ID:

```typescript
navigation.navigate('TaskDetail', {
  taskId: task.id,
});
```

Màn hình đích tải dữ liệu mới nhất từ API.

### 6.8. State

Phân biệt:

- Server State.
- Global Client State.
- Local Screen State.

Không lưu toàn bộ API Response vào Global State nếu công cụ Server State đã quản lý.

Không lưu form tạm thời trong Global State nếu chỉ một màn hình sử dụng.

### 6.9. Form

Form phải:

- Có validation.
- Hiển thị lỗi từng field.
- Ngăn submit nhiều lần.
- Giữ dữ liệu khi request thất bại.
- Hiển thị trạng thái đang gửi.
- Có giới hạn ký tự.
- Có keyboard type phù hợp.

Backend vẫn phải validation lại.

### 6.10. Trạng thái giao diện

Màn hình dữ liệu động phải xử lý:

```text
Loading
Success
Empty
Error
Refreshing
Loading More
```

Không để màn hình trống mà không giải thích.

### 6.11. Error Handling

Mobile phải phân biệt:

- Validation Error.
- Authentication Error.
- Permission Error.
- Not Found.
- Conflict.
- Business Error.
- Network Error.
- Server Error.

Không hiển thị stack trace hoặc message kỹ thuật cho người dùng.

### 6.12. Token

Access token và refresh token phải dùng Secure Storage.

Không lưu token trong:

- AsyncStorage thông thường.
- Source code.
- Log.
- URL.
- Error message.
- Công cụ debug state.

HTTP Client xử lý token tập trung.

Phải ngăn nhiều request đồng thời cùng thực hiện refresh token.

### 6.13. Style

Không viết style lớn trực tiếp trong JSX.

Ưu tiên:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

Màu sắc, spacing, font size và radius sử dụng Theme Token.

Không hard-code cùng một màu trong nhiều file.

### 6.14. Accessibility

Thành phần tương tác quan trọng cần:

- Label rõ ràng.
- Vùng bấm đủ lớn.
- Tương phản màu phù hợp.
- Không chỉ dùng màu để thể hiện trạng thái.
- Hỗ trợ Screen Reader ở mức phù hợp.

### 6.15. Performance

Danh sách dài sử dụng:

- FlatList.
- Pagination.
- Stable Key.
- Memoisation khi thực sự cần.

Không dùng ScrollView cho danh sách lớn.

Không dùng `useMemo` và `useCallback` cho mọi thứ một cách máy móc.

---

## 7. Tiêu chuẩn SQL và Migration

Migration Flyway đặt tên:

```text
V001__create_identity_tables.sql
V002__create_organization_tables.sql
```

Sau khi migration đã chạy trên môi trường dùng chung:

- Không sửa nội dung migration.
- Không đổi tên migration.
- Không xoá migration.
- Tạo migration mới để sửa schema.

SQL phải:

- Dùng tên bảng và cột đúng Database Design.
- Dùng constraint rõ ràng.
- Dùng index có mục đích.
- Không nối input người dùng vào SQL.
- Được kiểm thử trên PostgreSQL.

Seed chỉ dùng cho:

- Role.
- Permission.
- Danh mục hệ thống tối thiểu.

Không hard-code:

- Mật khẩu quản trị.
- Token.
- Dữ liệu cá nhân thật.
- Secret.

---

## 8. Tiêu chuẩn REST API

API phải tuân theo 06_API_CONTRACT.md.

Quy tắc:

- Base path là `/api/v1`.
- Resource dùng danh từ.
- URL dùng chữ thường và dấu gạch ngang.
- Request và response dùng DTO.
- Danh sách lớn phải phân trang.
- Thời gian dùng ISO-8601.
- ID dùng UUID.
- Không trả Entity.
- Không trả stack trace.
- Backend phải kiểm tra quyền.
- Backend phải kiểm tra phạm vi dữ liệu.
- Mã lỗi phải ổn định.
- OpenAPI phải đồng bộ với code.

---

## 9. Tiêu chuẩn bảo mật

### 9.1. Secret

Không commit:

- Password.
- JWT Secret.
- Refresh Token.
- API Key.
- Private Key.
- Database URL có mật khẩu.
- File `.env` thật.

Chỉ commit:

```text
.env.example
```

với giá trị giả.

### 9.2. Password

- Hash bằng thuật toán mạnh.
- Không tự viết thuật toán hash.
- Không log password.
- Không trả password qua API.
- Có Password Policy.

### 9.3. Authorization

Không chỉ kiểm tra Role.

Phải kết hợp khi cần:

```text
Role
Permission
Resource Ownership
Project Membership
Current State
```

Có quyền `TASK_UPDATE` chưa đủ nếu người dùng không được truy cập dự án chứa Task.

### 9.4. Input và Output

Mọi input từ client đều không đáng tin cậy.

Phải:

- Validation.
- Giới hạn độ dài.
- Kiểm tra Enum.
- Kiểm tra UUID.
- Kiểm tra File.
- Chuẩn hoá dữ liệu.
- Dùng Parameter Binding.

Không trả:

- Password Hash.
- Token Hash.
- Internal Path.
- SQL Message.
- Stack Trace.
- Secret.
- Dữ liệu không có quyền.

---

## 10. Tiêu chuẩn kiểm thử

### 10.1. Tên test

Tên test phải mô tả điều kiện, hành động và kết quả.

Java:

```java
@Test
void shouldRejectTaskCompletionWhenCurrentStatusIsTodo() {
}
```

TypeScript:

```typescript
it('shows validation error when title is empty', () => {
});
```

### 10.2. Arrange, Act, Assert

Test nên có ba phần:

```text
Arrange: chuẩn bị dữ liệu
Act: thực hiện hành động
Assert: kiểm tra kết quả
```

### 10.3. Test độc lập

- Test không phụ thuộc thứ tự chạy.
- Test tự chuẩn bị dữ liệu.
- Không dùng database production.
- Không gọi API production.
- Không tạo test luôn PASS giả.
- Không giảm điều kiện test để Pipeline xanh.

### 10.4. Các loại test

- Unit Test.
- Integration Test.
- API Test.
- Security Test.
- Component Test.
- Screen Test.
- End-to-End Test.
- Regression Test.

---

## 11. Git Workflow

### 11.1. Nhánh chính

```text
main
develop
```

`main` chứa phiên bản ổn định hoặc Release.

Không commit trực tiếp vào `main`.

`develop` chứa code đã tích hợp cho giai đoạn phát triển.

### 11.2. Nhánh làm việc

```text
feature/<issue-id>-<short-description>
fix/<issue-id>-<short-description>
hotfix/<issue-id>-<short-description>
docs/<issue-id>-<short-description>
refactor/<issue-id>-<short-description>
test/<issue-id>-<short-description>
chore/<issue-id>-<short-description>
```

Ví dụ:

```text
feature/42-task-status-workflow
fix/58-refresh-token-loop
docs/12-update-api-contract
test/66-project-security-tests
```

Không dùng tên mơ hồ:

```text
my-branch
test
cuong
new
final
final-final
```

### 11.3. Một nhánh, một mục tiêu

Không đưa nhiều chức năng không liên quan vào cùng một nhánh.

Trước khi mở Pull Request:

- Cập nhật từ `develop`.
- Giải quyết conflict.
- Chạy test.
- Kiểm tra diff.
- Xoá file tạm.
- Kiểm tra secret.
- Cập nhật tài liệu.

---

## 12. Commit Message

Sử dụng Conventional Commits:

```text
<type>(<scope>): <description>
```

Các loại:

```text
feat
fix
docs
style
refactor
test
build
ci
chore
perf
revert
```

Ví dụ:

```text
feat(task): add task status transition validation
fix(auth): prevent concurrent refresh token requests
docs(api): update service request contract
test(project): add access control integration tests
ci(backend): run migration tests in pull requests
```

Không dùng:

```text
update
fix bug
done
final
code mới
```

Một commit phải:

- Chứa thay đổi liên quan.
- Không chứa file tạm.
- Không chứa secret.
- Không trộn format toàn repository với chức năng nghiệp vụ.
- Build được khi có thể.

---

## 13. Pull Request

Pull Request phải có:

```markdown
## Mục tiêu

Mô tả vấn đề hoặc chức năng.

## Thay đổi

- Danh sách thay đổi chính.

## File hoặc module ảnh hưởng

- task
- notification
- docs

## Cách kiểm thử

1. Lệnh đã chạy.
2. Test case đã kiểm tra.
3. Kết quả.

## API hoặc database thay đổi

- Có hoặc Không.
- Nếu có, liên kết tài liệu và migration.

## Ảnh hưởng mobile/backend

Mô tả ảnh hưởng.

## Checklist

- [ ] Code build thành công
- [ ] Test vượt qua
- [ ] Tài liệu cập nhật
- [ ] Không có secret
- [ ] Không có file tạm
- [ ] Migration an toàn
- [ ] API Contract đồng bộ
```

Pull Request chỉ được merge khi:

- CI thành công.
- Review hoàn thành.
- Conflict được xử lý.
- Test đã chạy.
- Tài liệu được cập nhật.
- Không có cảnh báo nghiêm trọng.

---

## 14. Git Ignore

File `.gitignore` phải ngăn các tệp sinh tự động, dữ liệu cục bộ và thông tin bí mật bị đưa vào Git.

Nội dung tối thiểu:

```gitignore
# Environment
.env
.env.*
!.env.example

# Java and Spring Boot
backend/target/
*.class
*.jar
*.war

# Node.js
node_modules/
mobile/node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# React Native Android
mobile/android/.gradle/
mobile/android/app/build/
mobile/android/build/
mobile/android/local.properties

# React Native iOS
mobile/ios/Pods/
mobile/ios/build/
mobile/ios/DerivedData/

# Test and coverage
coverage/
test-results/
*.exec

# Logs
logs/
*.log

# IDE
.idea/
*.iml
.vscode/settings.json

# Operating system
.DS_Store
Thumbs.db

# Secrets and keys
*.pem
*.key
*.p12
*.pfx
*.jks
*.keystore

# Local databases and storage
uploads/
data/
*.db
*.sqlite
*.sqlite3

# Temporary files
*.tmp
*.temp
*.swp
*.swo
~$*
```

Quy tắc:

- Không commit file `.env` thật.
- Chỉ commit `.env.example` chứa tên biến và giá trị giả.
- Không commit private key, credential hoặc khoá ký ứng dụng.
- Không commit `node_modules` hoặc thư mục build.
- Không commit file upload hoặc database cục bộ.
- Không ignore toàn bộ `.vscode` nếu dự án cần chia sẻ extension recommendation hoặc task an toàn.
- Nếu secret đã từng được commit, thêm secret vào `.gitignore` không xoá secret khỏi lịch sử Git.
- Secret bị lộ phải được thu hồi và thay mới.

## 15. Dependency Management

Trước khi cài dependency phải kiểm tra:

1. Framework đã có chức năng tương tự chưa.
2. Project đã có dependency cùng chức năng chưa.
3. Package còn được duy trì không.
4. Có tài liệu chính thức không.
5. Có lỗ hổng nghiêm trọng không.
6. Có tương thích phiên bản không.
7. License có phù hợp không.
8. Có làm tăng kích thước mobile đáng kể không.
9. Có yêu cầu quyền thiết bị không.
10. Có phương án gỡ bỏ không.

Không cài hàng loạt package chỉ để thử.

Không thêm dependency rồi bỏ code nhưng quên gỡ dependency.

Không xoá lock file không có lý do.

Pull Request có dependency mới phải ghi:

- Tên dependency.
- Mục đích.
- Phiên bản.
- Nguồn tài liệu.
- License.
- Các phương án thay thế.
- Rủi ro.
- Ảnh hưởng bảo mật hoặc kích thước.

---

## 16. Quy tắc Refactor

Refactor là thay đổi cấu trúc code mà không đổi hành vi bên ngoài.

Refactor phải:

- Có test bảo vệ hành vi cũ.
- Không trộn nhiều chức năng mới.
- Không đổi API Contract âm thầm.
- Không đổi database âm thầm.
- Không xoá code đang sử dụng.
- Có lý do rõ ràng.
- Có phạm vi nhỏ khi có thể.

Không refactor toàn repository chỉ vì sở thích cá nhân.

---

## 17. Quy tắc sửa lỗi

Khi sửa bug:

1. Tái hiện lỗi.
2. Xác định điều kiện gây lỗi.
3. Tìm nguyên nhân gốc.
4. Viết test mô tả lỗi khi phù hợp.
5. Sửa phạm vi nhỏ nhất.
6. Chạy test liên quan.
7. Chạy Regression Test.
8. Kiểm tra module liên quan.
9. Cập nhật tài liệu nếu hành vi thay đổi.
10. Ghi bằng chứng.

Không chỉ che lỗi ở giao diện nếu nguyên nhân nằm ở backend.

Không bắt exception rồi bỏ qua:

```java
try {
    process();
} catch (Exception ignored) {
}
```

Không dùng fallback giả làm dữ liệu chính xác.

---

## 18. Quy tắc xử lý TODO

TODO phải có Issue hoặc lý do:

```java
// TODO(#123): Replace local file storage before staging deployment.
```

Không dùng:

```java
// TODO: fix later
```

Không dùng TODO để bỏ qua:

- Validation.
- Permission.
- Security.
- Test bắt buộc.
- Migration.

Trước Release phải kiểm tra toàn bộ TODO.

---

## 19. Code Review Checklist

### 19.1. Kiến trúc

- Đúng module.
- Đúng Layer.
- Không truy cập dữ liệu nội bộ module khác.
- Không tạo Dependency Cycle.
- Không phá cấu trúc repository.

### 19.2. Nghiệp vụ

- Đúng Workflow.
- Đúng trạng thái.
- Đúng Permission.
- Đúng Ownership.
- Đúng Transaction.
- Đúng Optimistic Locking.

### 19.3. API

- Đúng Endpoint.
- Đúng Request và Response.
- Đúng HTTP Status.
- Đúng mã lỗi.
- Có Validation.
- Có Pagination.
- Không trả Entity.

### 19.4. Database

- Có Migration.
- Không sửa Migration cũ.
- Có Constraint.
- Có Index phù hợp.
- Không dùng Cascade nguy hiểm.
- Không làm mất dữ liệu.

### 19.5. Mobile

- Có TypeScript Type.
- Không dùng `any` tuỳ tiện.
- Có Loading, Empty và Error.
- Không gọi HTTP trực tiếp trong Screen.
- Navigation chỉ truyền ID.
- Token được lưu an toàn.
- Không hard-code URL.

### 19.6. Test

- Test có ý nghĩa.
- Test không luôn PASS giả.
- Test không phụ thuộc thứ tự.
- Có test lỗi.
- Có test Permission.
- Có test Workflow.

### 19.7. Security

- Không có Secret.
- Không log Token.
- Không lộ dữ liệu.
- Input được Validation.
- Output được kiểm soát.
- File được kiểm tra.

---

## 20. Quy tắc dành cho AI Agent

Trước khi viết hoặc sửa code, AI Agent phải:

1. Đọc tài liệu liên quan.
2. Xác định giai đoạn hiện tại trong Roadmap.
3. Xác định Module và Layer.
4. Kiểm tra code hiện có.
5. Kiểm tra Dependency hiện có.
6. Tìm giải pháp hoặc Package ổn định đã có.
7. Xác định file cần sửa.
8. Xác định test cần thêm.
9. Nêu ảnh hưởng.
10. Chỉ thực hiện phạm vi được giao.

AI Agent không được:

- Sinh toàn bộ project trong một lần.
- Tạo module ngoài tài liệu.
- Đổi Framework.
- Đổi API Contract.
- Đổi database khi chưa có Migration.
- Tạo Endpoint trùng.
- Tạo Component trùng.
- Tạo HTTP Client mới khi đã có.
- Thêm Dependency trùng chức năng.
- Xoá code đang hoạt động mà chưa kiểm tra.
- Sửa file không liên quan.
- Hạ điều kiện test để test PASS.
- Bỏ qua lỗi compile.
- Bắt Exception rồi bỏ qua.
- Hard-code Token, Password hoặc URL môi trường.
- Tạo bằng chứng giả.
- Tuyên bố Test, Build hoặc Deployment thành công khi chưa thực hiện.

Sau khi sửa code, AI Agent phải:

1. Liệt kê file đã sửa.
2. Chạy Formatter hoặc Linter.
3. Build phần liên quan.
4. Chạy test liên quan.
5. Kiểm tra Git Diff.
6. Kiểm tra Secret.
7. Kiểm tra file tạm.
8. Cập nhật tài liệu nếu cần.
9. Ghi lỗi còn lại.
10. Không tự chuyển giai đoạn.

Nếu yêu cầu mâu thuẫn tài liệu, AI Agent phải:

1. Dừng thay đổi liên quan.
2. Chỉ ra mâu thuẫn.
3. Đề xuất phương án.
4. Cập nhật tài liệu trước.
5. Chỉ sửa code sau khi quyết định được khóa.

---

### 20.1. Chế độ áp dụng bản vá đã thiết kế sẵn

Khi nhiệm vụ đã cung cấp file, anchor, nội dung giữ, xoá, thay, thêm và validation, AI Agent chỉ được thực hiện đúng bản vá. Nếu anchor thiếu hoặc bị trùng, AI Agent phải dừng, không chọn vị trí gần giống và không sửa file.

AI Agent không được tự thêm field, endpoint, bảng, permission, workflow, dependency hoặc sửa lỗi ngoài phạm vi.

### 20.2. Kiểm soát backup

- Chỉ tạo đúng số backup được chỉ định.
- Backup phải được tạo trước khi sửa và không được chỉnh sửa.
- Backup không phải nguồn sự thật.
- Nếu thao tác thất bại, khôi phục từ backup của nhiệm vụ rồi dừng.

### 20.3. Kiểm tra giải pháp có sẵn trước khi tự viết

Ưu tiên theo thứ tự:

```text
Code hiện có trong WorkSphere
→ thành phần dùng chung đã có
→ chức năng tích hợp của framework
→ package chính thức
→ package ổn định
→ repository mẫu chính thức
→ tự triển khai
```

Trước khi tái sử dụng package hoặc repository phải kiểm tra License, phiên bản, tình trạng duy trì, bảo mật, khả năng tương thích, dependency kéo theo và kiểm thử. Không sao chép mù quáng toàn bộ repository bên ngoài.

## 21. Tiêu chuẩn bằng chứng

Mỗi chức năng quan trọng phải có bằng chứng phù hợp:

- Commit.
- Pull Request.
- Test Result.
- Swagger hoặc API Screenshot.
- Mobile Screenshot.
- Log.
- Migration.
- Docker Container.
- CI Run.
- Báo cáo lỗi.
- Sơ đồ.
- Tài liệu.

Bằng chứng phải ghi:

```text
Tên chức năng
Ngày thực hiện
Module
Môn liên quan
Người thực hiện
Lệnh đã chạy
Kết quả
File hoặc đường dẫn
Cảnh báo còn lại
```

Không đưa vào bằng chứng:

- Password.
- Token.
- Secret.
- Dữ liệu cá nhân thật.
- File `.env`.
- Private Key.
- Log chứa thông tin nhạy cảm.

---

## 22. Các quyết định đã khóa

- Java dùng chuẩn đặt tên Java.
- TypeScript không dùng `any` tuỳ tiện.
- Controller không gọi Repository trực tiếp.
- Không trả Entity qua API.
- Backend kiểm tra Permission.
- Mobile không quyết định quyền cuối cùng.
- Screen không gọi HTTP Client trực tiếp.
- Navigation chỉ truyền ID tối thiểu.
- Migration quản lý database.
- Migration đã áp dụng không được sửa.
- Git dùng Branch theo mục tiêu.
- Commit dùng Conventional Commits.
- Pull Request phải có Test và tài liệu liên quan.
- Không commit trực tiếp vào `main`.
- Không commit Secret.
- Không cài Dependency trùng chức năng.
- Không tự viết lại giải pháp ổn định đã tồn tại.
- Mỗi thay đổi phải có phạm vi rõ ràng.
- AI Agent không tự chuyển giai đoạn.
- Một chức năng chỉ hoàn thành khi đạt Definition of Done.

- Khi bản vá đã được thiết kế sẵn, AI Agent chỉ thực hiện đúng bản vá.
- AI Agent dừng nếu không tìm thấy anchor chính xác.
- AI Agent không tự sửa lỗi ngoài phạm vi.
- Backup không phải nguồn sự thật của dự án.
- Trước khi tự viết phải kiểm tra code, framework, package và repository phù hợp đã tồn tại.
- Không sao chép repository bên ngoài khi chưa kiểm tra License, phiên bản, bảo mật và khả năng tương thích.
Mọi thay đổi đối với tiêu chuẩn code, Git Workflow hoặc quy trình AI Agent phải được cập nhật trong tài liệu này trước khi áp dụng vào source code.
