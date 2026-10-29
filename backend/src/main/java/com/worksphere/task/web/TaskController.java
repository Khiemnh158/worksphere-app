package com.worksphere.task.web;

import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import com.worksphere.task.api.request.AssignTaskRequest;
import com.worksphere.task.api.request.ChangeTaskStatusRequest;
import com.worksphere.task.api.request.CreateSubtaskRequest;
import com.worksphere.task.api.request.CreateTaskCommentRequest;
import com.worksphere.task.api.request.CreateTaskRequest;
import com.worksphere.task.api.request.UpdateTaskCommentRequest;
import com.worksphere.task.api.request.UpdateTaskProgressRequest;
import com.worksphere.task.api.request.UpdateTaskRequest;
import com.worksphere.task.api.response.TaskCommentResponse;
import com.worksphere.task.api.response.TaskDetailResponse;
import com.worksphere.task.api.response.TaskSummaryResponse;
import com.worksphere.task.application.TaskApplicationService;
import com.worksphere.task.application.TaskCommentApplicationService;
import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Task Management.
 * Implements 06_API_CONTRACT.md section 12.
 */
@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskApplicationService taskApplicationService;
    private final TaskCommentApplicationService commentApplicationService;

    public TaskController(
            TaskApplicationService taskApplicationService,
            TaskCommentApplicationService commentApplicationService
    ) {
        this.taskApplicationService = taskApplicationService;
        this.commentApplicationService = commentApplicationService;
    }

    /**
     * 12.1. Danh sách công việc
     * GET /tasks
     */
    @GetMapping
    @PreAuthorize("hasAuthority('TASK_READ')")
    public ResponseEntity<ApiResponse<PagedData<TaskSummaryResponse>>> getTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID parentTaskId,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) UUID reporterId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(required = false) Instant dueFrom,
            @RequestParam(required = false) Instant dueTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        Pageable pageable = parseSort(page, size, sort);
        PagedData<TaskSummaryResponse> result = taskApplicationService.getTasks(
                search, projectId, parentTaskId, assigneeId, reporterId,
                status, priority, overdue, dueFrom, dueTo, pageable, principal
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 12.2. Tạo công việc
     * POST /tasks
     */
    @PostMapping
    @PreAuthorize("hasAuthority('TASK_CREATE')")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskDetailResponse response = taskApplicationService.createTask(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * 12.3. Chi tiết công việc
     * GET /tasks/{taskId}
     */
    @GetMapping("/{taskId}")
    @PreAuthorize("hasAuthority('TASK_READ')")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> getTaskDetail(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskDetailResponse response = taskApplicationService.getTaskDetail(taskId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 12.4. Cập nhật công việc
     * PUT /tasks/{taskId}
     */
    @PutMapping("/{taskId}")
    @PreAuthorize("hasAuthority('TASK_UPDATE')")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> updateTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskDetailResponse response = taskApplicationService.updateTask(taskId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 12.5. Cập nhật trạng thái công việc
     * PUT /tasks/{taskId}/status
     */
    @PutMapping("/{taskId}/status")
    @PreAuthorize("hasAuthority('TASK_UPDATE_STATUS')")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> changeTaskStatus(
            @PathVariable UUID taskId,
            @Valid @RequestBody ChangeTaskStatusRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskDetailResponse response = taskApplicationService.changeStatus(taskId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 12.6. Cập nhật tiến độ
     * PUT /tasks/{taskId}/progress
     */
    @PutMapping("/{taskId}/progress")
    @PreAuthorize("hasAuthority('TASK_UPDATE')")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> updateTaskProgress(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskProgressRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskDetailResponse response = taskApplicationService.updateProgress(taskId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 12.7. Phân công người thực hiện
     * POST /tasks/{taskId}/assignments
     */
    @PostMapping("/{taskId}/assignments")
    @PreAuthorize("hasAuthority('TASK_ASSIGN')")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> assignUsers(
            @PathVariable UUID taskId,
            @Valid @RequestBody AssignTaskRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskDetailResponse response = taskApplicationService.assignUsers(taskId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 12.8. Gỡ phân công
     * DELETE /tasks/{taskId}/assignments/{assignmentId}
     */
    @DeleteMapping("/{taskId}/assignments/{assignmentId}")
    @PreAuthorize("hasAuthority('TASK_ASSIGN')")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> unassignUser(
            @PathVariable UUID taskId,
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskDetailResponse response = taskApplicationService.unassignUser(taskId, assignmentId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 12.9. Xoá công việc
     * DELETE /tasks/{taskId}
     */
    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasAuthority('TASK_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        taskApplicationService.deleteTask(taskId, principal);
        return ResponseEntity.ok(ApiResponse.successNoContent("Công việc đã được xóa thành công"));
    }

    /**
     * 12.10. Lấy danh sách công việc con
     * GET /tasks/{taskId}/subtasks
     */
    @GetMapping("/{taskId}/subtasks")
    @PreAuthorize("hasAuthority('TASK_READ')")
    public ResponseEntity<ApiResponse<List<TaskSummaryResponse>>> getSubtasks(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        List<TaskSummaryResponse> response = taskApplicationService.getSubtasks(taskId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 12.11. Tạo công việc con
     * POST /tasks/{taskId}/subtasks
     */
    @PostMapping("/{taskId}/subtasks")
    @PreAuthorize("hasAuthority('TASK_CREATE')")
    public ResponseEntity<ApiResponse<TaskDetailResponse>> createSubtask(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateSubtaskRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskDetailResponse response = taskApplicationService.createSubtask(taskId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * 12.12. Danh sách bình luận công việc
     * GET /tasks/{taskId}/comments
     */
    @GetMapping("/{taskId}/comments")
    @PreAuthorize("hasAuthority('TASK_READ')")
    public ResponseEntity<ApiResponse<PagedData<TaskCommentResponse>>> getComments(
            @PathVariable UUID taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,asc") String sort,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        Pageable pageable = parseSort(page, size, sort);
        PagedData<TaskCommentResponse> response = commentApplicationService.getComments(taskId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 12.13. Thêm bình luận công việc
     * POST /tasks/{taskId}/comments
     */
    @PostMapping("/{taskId}/comments")
    @PreAuthorize("hasAuthority('TASK_READ')")
    public ResponseEntity<ApiResponse<TaskCommentResponse>> createComment(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateTaskCommentRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskCommentResponse response = commentApplicationService.createComment(taskId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * 12.14. Chỉnh sửa bình luận
     * PUT /tasks/{taskId}/comments/{commentId}
     */
    @PutMapping("/{taskId}/comments/{commentId}")
    @PreAuthorize("hasAuthority('TASK_READ')")
    public ResponseEntity<ApiResponse<TaskCommentResponse>> updateComment(
            @PathVariable UUID taskId,
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateTaskCommentRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        TaskCommentResponse response = commentApplicationService.updateComment(taskId, commentId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 12.15. Xoá bình luận
     * DELETE /tasks/{taskId}/comments/{commentId}
     */
    @DeleteMapping("/{taskId}/comments/{commentId}")
    @PreAuthorize("hasAuthority('TASK_READ')")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable UUID taskId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        commentApplicationService.deleteComment(taskId, commentId, principal);
        return ResponseEntity.ok(ApiResponse.successNoContent("Bình luận đã được xóa thành công"));
    }

    private Pageable parseSort(int page, int size, String sort) {
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String prop = parts[0].trim();
            Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
            return PageRequest.of(page, size, Sort.by(direction, prop));
        }
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
