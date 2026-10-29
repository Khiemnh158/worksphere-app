package com.worksphere.task.application;

import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.project.domain.Milestone;
import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.domain.ProjectStatus;
import com.worksphere.project.infrastructure.persistence.MilestoneRepository;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.project.infrastructure.persistence.ProjectRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import com.worksphere.task.api.request.AssignTaskRequest;
import com.worksphere.task.api.request.ChangeTaskStatusRequest;
import com.worksphere.task.api.request.CreateSubtaskRequest;
import com.worksphere.task.api.request.CreateTaskRequest;
import com.worksphere.task.api.request.UpdateTaskProgressRequest;
import com.worksphere.task.api.request.UpdateTaskRequest;
import com.worksphere.task.api.response.TaskCommentResponse;
import com.worksphere.task.api.response.TaskDetailResponse;
import com.worksphere.task.api.response.TaskStatusHistoryResponse;
import com.worksphere.task.api.response.TaskSummaryResponse;
import com.worksphere.task.domain.Task;
import com.worksphere.task.domain.TaskAssignment;
import com.worksphere.task.domain.TaskComment;
import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;
import com.worksphere.task.domain.TaskStatusHistory;
import com.worksphere.task.infrastructure.persistence.TaskAssignmentRepository;
import com.worksphere.task.infrastructure.persistence.TaskAttachmentRepository;
import com.worksphere.task.infrastructure.persistence.TaskCommentRepository;
import com.worksphere.task.infrastructure.persistence.TaskRepository;
import com.worksphere.task.infrastructure.persistence.TaskStatusHistoryRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Application service managing Task lifecycle, assignments, progress, and workflow transitions.
 * Per 06_API_CONTRACT.md section 12, 02_USER_ROLES_AND_WORKFLOWS.md section 5, and 05_DATABASE_DESIGN.md section 8.
 */
@Service
public class TaskApplicationService {

    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of(
            "createdAt", "updatedAt", "dueDate", "startDate", "title", "priority", "status", "progressPercent"
    );

    private final TaskRepository taskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final TaskStatusHistoryRepository statusHistoryRepository;
    private final TaskCommentRepository commentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final MilestoneRepository milestoneRepository;
    private final UserRepository userRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final com.worksphere.notification.application.NotificationEventDispatcher eventDispatcher;

    public TaskApplicationService(
            TaskRepository taskRepository,
            TaskAssignmentRepository taskAssignmentRepository,
            TaskStatusHistoryRepository statusHistoryRepository,
            TaskCommentRepository commentRepository,
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            MilestoneRepository milestoneRepository,
            UserRepository userRepository,
            TaskAttachmentRepository taskAttachmentRepository,
            com.worksphere.notification.application.NotificationEventDispatcher eventDispatcher
    ) {
        this.taskRepository = taskRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.commentRepository = commentRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.milestoneRepository = milestoneRepository;
        this.userRepository = userRepository;
        this.taskAttachmentRepository = taskAttachmentRepository;
        this.eventDispatcher = eventDispatcher;
    }

    @Transactional(readOnly = true)
    public PagedData<TaskSummaryResponse> getTasks(
            String search,
            UUID projectId,
            UUID parentTaskId,
            UUID assigneeId,
            UUID reporterId,
            TaskStatus status,
            TaskPriority priority,
            Boolean overdue,
            Instant dueFrom,
            Instant dueTo,
            Pageable pageable,
            WorkSphereUserPrincipal principal
    ) {
        Pageable validatedPageable = validatePageable(pageable);

        Specification<Task> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), searchPattern),
                        cb.like(cb.lower(root.get("description")), searchPattern)
                ));
            }
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (parentTaskId != null) {
                predicates.add(cb.equal(root.get("parentTaskId"), parentTaskId));
            }
            if (reporterId != null) {
                predicates.add(cb.equal(root.get("reporterId"), reporterId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (dueFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dueDate"), dueFrom));
            }
            if (dueTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dueDate"), dueTo));
            }
            if (overdue != null && overdue) {
                Instant now = Instant.now();
                predicates.add(cb.and(
                        cb.isNotNull(root.get("dueDate")),
                        cb.lessThan(root.get("dueDate"), now),
                        root.get("status").in(TaskStatus.COMPLETED, TaskStatus.CANCELLED).not()
                ));
            }
            if (assigneeId != null) {
                Subquery<UUID> subquery = query.subquery(UUID.class);
                Root<TaskAssignment> assignmentRoot = subquery.from(TaskAssignment.class);
                subquery.select(assignmentRoot.get("taskId"))
                        .where(
                                cb.equal(assignmentRoot.get("assigneeId"), assigneeId),
                                cb.isTrue(assignmentRoot.get("active"))
                        );
                predicates.add(root.get("id").in(subquery));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Task> page = taskRepository.findAll(spec, validatedPageable);
        if (page.isEmpty()) {
            return PagedData.from(page, Collections.emptyList());
        }

        List<TaskSummaryResponse> responses = mapToTaskSummaries(page.getContent());
        return PagedData.from(page, responses);
    }

    @Transactional
    public TaskDetailResponse createTask(CreateTaskRequest request, WorkSphereUserPrincipal principal) {
        Project project = projectRepository.findActiveById(request.projectId())
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));

        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new BusinessRuleException("TASK_PROJECT_NOT_ACTIVE", "Chỉ có thể tạo công việc cho dự án đang hoạt động");
        }

        verifyProjectMemberOrAdmin(project.getId(), principal);

        if (request.milestoneId() != null) {
            Milestone milestone = milestoneRepository.findById(request.milestoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("MILESTONE_NOT_FOUND", "Milestone không tồn tại"));
            if (!milestone.getProjectId().equals(project.getId())) {
                throw new BusinessRuleException("TASK_PARENT_PROJECT_MISMATCH", "Milestone không thuộc dự án này");
            }
        }

        if (request.parentTaskId() != null) {
            validateParentHierarchy(null, request.parentTaskId(), project.getId());
        }

        validateAssignees(request.assigneeIds(), project.getId());

        UUID taskId = UUID.randomUUID();
        Task task = Task.create(
                taskId,
                project.getId(),
                request.parentTaskId(),
                request.milestoneId(),
                request.title(),
                request.description(),
                request.priority(),
                principal.userId(),
                request.startDate(),
                request.dueDate(),
                request.estimatedMinutes(),
                principal.userId()
        );

        Task savedTask = taskRepository.save(task);

        if (request.assigneeIds() != null) {
            try {
                for (UUID assigneeId : request.assigneeIds()) {
                    TaskAssignment assignment = TaskAssignment.create(
                            UUID.randomUUID(),
                            savedTask.getId(),
                            assigneeId,
                            principal.userId()
                    );
                    taskAssignmentRepository.saveAndFlush(assignment);
                    eventDispatcher.onTaskAssigned(savedTask.getId(), assignment.getId(), assigneeId, principal.userId(), savedTask.getTitle());
                }
            } catch (DataIntegrityViolationException ex) {
                if (isTaskAssignmentUniqueViolation(ex)) {
                    throw new BusinessRuleException("TASK_ALREADY_ASSIGNED", "Người dùng đã được phân công công việc này");
                }
                throw ex;
            }
        }

        return getTaskDetail(savedTask.getId(), principal);
    }

    @Transactional(readOnly = true)
    public TaskDetailResponse getTaskDetail(UUID taskId, WorkSphereUserPrincipal principal) {
        Task task = findTaskOrThrow(taskId);
        verifyProjectAccess(task.getProjectId(), principal);

        Project project = projectRepository.findById(task.getProjectId()).orElse(null);
        Milestone milestone = task.getMilestoneId() != null
                ? milestoneRepository.findById(task.getMilestoneId()).orElse(null)
                : null;
        Task parentTask = task.getParentTaskId() != null
                ? taskRepository.findByIdAndDeletedFalse(task.getParentTaskId()).orElse(null)
                : null;

        User reporter = userRepository.findById(task.getReporterId()).orElse(null);

        List<TaskAssignment> assignments = taskAssignmentRepository.findByTaskIdAndActiveTrue(taskId);
        Set<UUID> assigneeUserIds = assignments.stream().map(TaskAssignment::getAssigneeId).collect(Collectors.toSet());
        Map<UUID, User> assigneeUsers = userRepository.findAllById(assigneeUserIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<TaskDetailResponse.AssigneeDetail> assigneeDetails = assignments.stream()
                .map(a -> {
                    User u = assigneeUsers.get(a.getAssigneeId());
                    String name = u != null ? u.getFullName() : "Unknown";
                    return new TaskDetailResponse.AssigneeDetail(a.getId(), a.getAssigneeId(), name, null, a.getAssignedAt());
                })
                .toList();

        List<Task> subtasks = taskRepository.findByParentTaskIdAndDeletedFalse(taskId);
        List<TaskSummaryResponse> subtaskSummaries = mapToTaskSummaries(subtasks);

        List<TaskComment> recentComments = commentRepository.findTop5ByTaskIdAndDeletedFalseOrderByCreatedAtDesc(taskId);
        Set<UUID> commentAuthorIds = recentComments.stream().map(TaskComment::getAuthorId).collect(Collectors.toSet());
        Map<UUID, User> commentAuthors = userRepository.findAllById(commentAuthorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        List<TaskCommentResponse> commentResponses = recentComments.stream()
                .map(c -> {
                    User u = commentAuthors.get(c.getAuthorId());
                    String authorName = u != null ? u.getFullName() : "Unknown";
                    return new TaskCommentResponse(
                            c.getId(),
                            c.getTaskId(),
                            new TaskCommentResponse.AuthorInfo(c.getAuthorId(), authorName, null),
                            c.getContent(),
                            c.getParentId(),
                            c.isEdited(),
                            c.getEditedAt(),
                            c.getCreatedAt()
                    );
                })
                .toList();

        List<TaskStatusHistory> histories = statusHistoryRepository.findByTaskIdOrderByChangedAtDesc(taskId);
        Set<UUID> historyActorIds = histories.stream().map(TaskStatusHistory::getChangedBy).collect(Collectors.toSet());
        Map<UUID, User> historyActors = userRepository.findAllById(historyActorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        List<TaskStatusHistoryResponse> statusHistoryResponses = histories.stream()
                .map(h -> {
                    User u = historyActors.get(h.getChangedBy());
                    String actorName = u != null ? u.getFullName() : "Unknown";
                    return new TaskStatusHistoryResponse(
                            h.getId(),
                            h.getTaskId(),
                            h.getFromStatus(),
                            h.getToStatus(),
                            h.getComment(),
                            new TaskStatusHistoryResponse.ActorInfo(h.getChangedBy(), actorName, null),
                            h.getChangedAt()
                    );
                })
                .toList();

        Set<String> allowedActions = computeAllowedActions(task, principal, assignments);

        return new TaskDetailResponse(
                task.getId(),
                project != null ? new TaskDetailResponse.ProjectBrief(project.getId(), project.getCode(), project.getName()) : null,
                task.getParentTaskId(),
                parentTask != null ? new TaskDetailResponse.ParentTaskBrief(parentTask.getId(), parentTask.getTitle()) : null,
                task.getMilestoneId(),
                milestone != null ? new TaskDetailResponse.MilestoneBrief(milestone.getId(), milestone.getName()) : null,
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getProgressPercent(),
                task.getStartDate(),
                task.getDueDate(),
                task.getCompletedAt(),
                task.getEstimatedMinutes(),
                task.getActualMinutes(),
                reporter != null ? new TaskDetailResponse.ReporterDetail(reporter.getId(), reporter.getFullName(), null) : null,
                assigneeDetails,
                subtaskSummaries,
                commentResponses,
                Collections.emptyList(),
                statusHistoryResponses,
                allowedActions,
                task.getCreatedAt(),
                task.getUpdatedAt(),
                task.getVersion()
        );
    }

    @Transactional
    public TaskDetailResponse updateTask(UUID taskId, UpdateTaskRequest request, WorkSphereUserPrincipal principal) {
        Task task = findTaskOrThrow(taskId);
        verifyOptimisticLock(task, request.version());

        if (task.getStatus().isTerminal()) {
            throw new BusinessRuleException("TASK_TERMINAL_STATE", "Không thể cập nhật công việc ở trạng thái kết thúc (" + task.getStatus() + ")");
        }

        verifyCanUpdateTask(task, principal);

        task.updateDetails(
                request.title(),
                request.description(),
                request.priority(),
                request.startDate(),
                request.dueDate(),
                request.estimatedMinutes(),
                principal.userId()
        );

        taskRepository.save(task);
        return getTaskDetail(taskId, principal);
    }

    @Transactional
    public TaskDetailResponse changeStatus(UUID taskId, ChangeTaskStatusRequest request, WorkSphereUserPrincipal principal) {
        Task task = findTaskOrThrow(taskId);
        verifyOptimisticLock(task, request.version());

        TaskStatus currentStatus = task.getStatus();
        TaskStatus newStatus = request.status();

        if (currentStatus.isTerminal()) {
            throw new BusinessRuleException("TASK_TERMINAL_STATE", "Công việc đã ở trạng thái kết thúc không thể thay đổi trạng thái");
        }

        if (currentStatus == TaskStatus.IN_REVIEW && newStatus == TaskStatus.IN_PROGRESS) {
            if (request.comment() == null || request.comment().trim().isEmpty()) {
                throw new BusinessRuleException("VALIDATION_ERROR", "Cần nhập lý do khi chuyển công việc từ kiểm tra về lại đang thực hiện");
            }
        }

        verifyCanChangeStatus(task, currentStatus, newStatus, principal);

        task.changeStatus(newStatus, request.comment(), principal.userId());
        taskRepository.save(task);

        TaskStatusHistory history = TaskStatusHistory.create(
                UUID.randomUUID(),
                task.getId(),
                currentStatus,
                newStatus,
                request.comment(),
                principal.userId()
        );
        statusHistoryRepository.save(history);

        eventDispatcher.onTaskStatusChanged(
                task.getId(),
                history.getId(),
                newStatus,
                principal.userId(),
                task.getTitle(),
                task.getProjectId(),
                task.getReporterId()
        );

        return getTaskDetail(taskId, principal);
    }

    @Transactional
    public TaskDetailResponse updateProgress(UUID taskId, UpdateTaskProgressRequest request, WorkSphereUserPrincipal principal) {
        Task task = findTaskOrThrow(taskId);
        verifyOptimisticLock(task, request.version());

        verifyCanUpdateProgress(task, principal);

        task.updateProgress(request.progressPercent(), principal.userId());
        taskRepository.save(task);

        return getTaskDetail(taskId, principal);
    }

    @Transactional
    public void deleteTask(UUID taskId, WorkSphereUserPrincipal principal) {
        Task task = findTaskOrThrow(taskId);
        verifyCanDeleteTask(task, principal);

        if (statusHistoryRepository.existsByTaskId(taskId)) {
            throw new BusinessRuleException("TASK_CANNOT_DELETE_HAS_HISTORY",
                    "Không thể xóa công việc đã có lịch sử thay đổi trạng thái. Vui lòng chuyển sang trạng thái hủy.");
        }

        task.softDelete(principal.userId());
        taskRepository.save(task);
    }

    @Transactional
    public TaskDetailResponse assignUsers(UUID taskId, AssignTaskRequest request, WorkSphereUserPrincipal principal) {
        Task task = findTaskOrThrow(taskId);
        verifyCanAssign(task, principal);

        validateAssignees(request.assigneeIds(), task.getProjectId());

        try {
            for (UUID assigneeId : request.assigneeIds()) {
                if (taskAssignmentRepository.existsByTaskIdAndAssigneeIdAndActiveTrue(taskId, assigneeId)) {
                    throw new BusinessRuleException("TASK_ALREADY_ASSIGNED", "Người dùng đã được phân công công việc này");
                }

                TaskAssignment assignment = TaskAssignment.create(
                        UUID.randomUUID(),
                        taskId,
                        assigneeId,
                        principal.userId()
                );
                taskAssignmentRepository.saveAndFlush(assignment);
                eventDispatcher.onTaskAssigned(task.getId(), assignment.getId(), assigneeId, principal.userId(), task.getTitle());
            }
        } catch (DataIntegrityViolationException ex) {
            if (isTaskAssignmentUniqueViolation(ex)) {
                throw new BusinessRuleException("TASK_ALREADY_ASSIGNED", "Người dùng đã được phân công công việc này");
            }
            throw ex;
        }

        return getTaskDetail(taskId, principal);
    }

    @Transactional
    public TaskDetailResponse unassignUser(UUID taskId, UUID assignmentId, WorkSphereUserPrincipal principal) {
        Task task = findTaskOrThrow(taskId);
        verifyCanAssign(task, principal);

        TaskAssignment assignment = taskAssignmentRepository.findByIdAndTaskId(assignmentId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("ASSIGNMENT_NOT_FOUND", "Không tìm thấy phân công công việc"));

        if (!assignment.isActive()) {
            throw new ResourceNotFoundException("ASSIGNMENT_NOT_FOUND", "Phân công đã được gỡ trước đó");
        }

        assignment.unassign();
        taskAssignmentRepository.save(assignment);

        return getTaskDetail(taskId, principal);
    }

    @Transactional
    public TaskDetailResponse createSubtask(UUID parentTaskId, CreateSubtaskRequest request, WorkSphereUserPrincipal principal) {
        Task parent = findTaskOrThrow(parentTaskId);

        Project project = projectRepository.findActiveById(parent.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));

        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new BusinessRuleException("TASK_PROJECT_NOT_ACTIVE", "Chỉ có thể tạo công việc cho dự án đang hoạt động");
        }

        verifyProjectMemberOrAdmin(project.getId(), principal);

        CreateTaskRequest createRequest = new CreateTaskRequest(
                parent.getProjectId(),
                parentTaskId,
                request.milestoneId(),
                request.title(),
                request.description(),
                request.priority(),
                request.assigneeIds(),
                request.startDate(),
                request.dueDate(),
                request.estimatedMinutes()
        );

        return createTask(createRequest, principal);
    }

    @Transactional(readOnly = true)
    public List<TaskSummaryResponse> getSubtasks(UUID parentTaskId, WorkSphereUserPrincipal principal) {
        Task parent = findTaskOrThrow(parentTaskId);
        verifyProjectAccess(parent.getProjectId(), principal);

        List<Task> subtasks = taskRepository.findByParentTaskIdAndDeletedFalse(parentTaskId);
        return mapToTaskSummaries(subtasks);
    }

    public void validateParentHierarchy(UUID taskId, UUID parentTaskId, UUID projectId) {
        if (parentTaskId == null) {
            return;
        }
        if (taskId != null && taskId.equals(parentTaskId)) {
            throw new BusinessRuleException("TASK_PARENT_CYCLE_DETECTED", "Công việc không thể làm cha của chính nó");
        }

        Set<UUID> visited = new HashSet<>();
        if (taskId != null) {
            visited.add(taskId);
        }

        UUID current = parentTaskId;
        while (current != null) {
            if (!visited.add(current)) {
                throw new BusinessRuleException("TASK_PARENT_CYCLE_DETECTED", "Phát hiện vòng lặp phân cấp công việc");
            }
            Task ancestor = taskRepository.findById(current)
                    .orElseThrow(() -> new ResourceNotFoundException("TASK_NOT_FOUND", "Công việc cha không tồn tại"));
            if (ancestor.isDeleted()) {
                throw new ResourceNotFoundException("TASK_NOT_FOUND", "Công việc cha không tồn tại");
            }
            if (!ancestor.getProjectId().equals(projectId)) {
                throw new BusinessRuleException("TASK_PARENT_PROJECT_MISMATCH", "Công việc cha và con phải thuộc cùng một dự án");
            }
            current = ancestor.getParentTaskId();
        }
    }

    private boolean isTaskAssignmentUniqueViolation(DataIntegrityViolationException ex) {
        Throwable cause = ex.getRootCause();
        String message = cause != null ? cause.getMessage() : ex.getMessage();
        return message != null && (message.contains("uk_task_assignments_active") || message.contains("task_assignments"));
    }

    private void validateAssignees(List<UUID> assigneeIds, UUID projectId) {
        if (assigneeIds == null || assigneeIds.isEmpty()) {
            return;
        }
        for (UUID assigneeId : assigneeIds) {
            User user = userRepository.findById(assigneeId).orElse(null);
            if (user == null || user.isDeleted() || user.getStatus() != UserStatus.ACTIVE) {
                throw new BusinessRuleException("TASK_ASSIGNEE_NOT_PROJECT_MEMBER",
                        "Người được giao việc phải là thành viên đang hoạt động của dự án");
            }
            boolean isMember = projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, assigneeId);
            if (!isMember) {
                throw new BusinessRuleException("TASK_ASSIGNEE_NOT_PROJECT_MEMBER",
                        "Người được giao việc phải là thành viên đang hoạt động của dự án");
            }
        }
    }

    private List<TaskSummaryResponse> mapToTaskSummaries(List<Task> tasks) {
        if (tasks.isEmpty()) {
            return Collections.emptyList();
        }

        Set<UUID> projectIds = tasks.stream().map(Task::getProjectId).collect(Collectors.toSet());
        Map<UUID, Project> projectMap = projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getId, Function.identity()));

        Set<UUID> taskIds = tasks.stream().map(Task::getId).collect(Collectors.toSet());
        List<TaskAssignment> allAssignments = taskAssignmentRepository.findByTaskIdInAndActiveTrue(taskIds);

        Set<UUID> userIds = new HashSet<>();
        tasks.forEach(t -> userIds.add(t.getReporterId()));
        allAssignments.forEach(a -> userIds.add(a.getAssigneeId()));

        Map<UUID, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        Map<UUID, List<TaskAssignment>> assignmentMap = allAssignments.stream()
                .collect(Collectors.groupingBy(TaskAssignment::getTaskId));

        Map<UUID, Long> attachmentCountMap = taskAttachmentRepository.countByTaskIdIn(taskIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));

        Instant now = Instant.now();

        return tasks.stream().map(task -> {
            Project p = projectMap.get(task.getProjectId());
            TaskSummaryResponse.ProjectBrief pBrief = p != null
                    ? new TaskSummaryResponse.ProjectBrief(p.getId(), p.getCode(), p.getName())
                    : null;

            User reporter = userMap.get(task.getReporterId());
            TaskSummaryResponse.ReporterSummary repSummary = reporter != null
                    ? new TaskSummaryResponse.ReporterSummary(reporter.getId(), reporter.getFullName())
                    : null;

            List<TaskAssignment> tAssignments = assignmentMap.getOrDefault(task.getId(), Collections.emptyList());
            List<TaskSummaryResponse.AssigneeSummary> assignees = tAssignments.stream()
                    .map(a -> {
                        User u = userMap.get(a.getAssigneeId());
                        String name = u != null ? u.getFullName() : "Unknown";
                        return new TaskSummaryResponse.AssigneeSummary(a.getAssigneeId(), name, null);
                    })
                    .toList();

            boolean isOverdue = task.getDueDate() != null
                    && task.getDueDate().isBefore(now)
                    && !task.getStatus().isTerminal();

            long subtaskCount = taskRepository.countByParentTaskIdAndDeletedFalse(task.getId());
            long completedSubtasks = taskRepository.countByParentTaskIdAndStatusAndDeletedFalse(task.getId(), TaskStatus.COMPLETED);
            long commentCount = commentRepository.countByTaskIdAndDeletedFalse(task.getId());
            long attachmentCount = attachmentCountMap.getOrDefault(task.getId(), 0L);

            return new TaskSummaryResponse(
                    task.getId(),
                    pBrief,
                    task.getParentTaskId(),
                    task.getTitle(),
                    task.getStatus(),
                    task.getPriority(),
                    task.getProgressPercent(),
                    assignees,
                    repSummary,
                    task.getDueDate(),
                    isOverdue,
                    (int) subtaskCount,
                    (int) completedSubtasks,
                    (int) commentCount,
                    (int) attachmentCount,
                    task.getUpdatedAt()
            );
        }).toList();
    }

    private Set<String> computeAllowedActions(
            Task task,
            WorkSphereUserPrincipal principal,
            List<TaskAssignment> assignments
    ) {
        Set<String> actions = new HashSet<>();
        if (principal == null) {
            return actions;
        }

        boolean isAdmin = hasSystemAdminRole(principal);
        Optional<ProjectMember> memberOpt = projectMemberRepository.findActiveByProjectIdAndUserId(task.getProjectId(), principal.userId());
        boolean isPM = memberOpt.isPresent() && memberOpt.get().getProjectRole() == ProjectRole.PROJECT_MANAGER;
        boolean isTL = memberOpt.isPresent() && memberOpt.get().getProjectRole() == ProjectRole.TEAM_LEADER;
        boolean isAssignee = assignments.stream().anyMatch(a -> a.getAssigneeId().equals(principal.userId()));
        boolean isReporter = task.getReporterId().equals(principal.userId());

        actions.add("ADD_COMMENT");

        if (!task.getStatus().isTerminal()) {
            if (isAdmin || isPM || isTL || isReporter) {
                actions.add("UPDATE");
            }
            if (isAdmin || isPM || isTL || isAssignee) {
                actions.add("UPDATE_PROGRESS");
            }
            actions.add("UPDATE_STATUS");

            if (isAdmin || isPM || isTL) {
                actions.add("ASSIGN");
                actions.add("UNASSIGN");
                actions.add("CREATE_SUBTASK");
            }
        }

        if (task.getStatus() == TaskStatus.TODO && (isAdmin || isPM)) {
            if (!statusHistoryRepository.existsByTaskId(task.getId())) {
                actions.add("DELETE");
            }
        }

        return actions;
    }

    private void verifyOptimisticLock(Task task, Long version) {
        if (!Objects.equals(task.getVersion(), version)) {
            throw new ObjectOptimisticLockingFailureException(Task.class, task.getId());
        }
    }

    private Task findTaskOrThrow(UUID taskId) {
        return taskRepository.findByIdAndDeletedFalse(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("TASK_NOT_FOUND", "Công việc không tồn tại"));
    }

    private void verifyProjectAccess(UUID projectId, WorkSphereUserPrincipal principal) {
        if (principal == null) {
            throw new BusinessRuleException("FORBIDDEN", "Yêu cầu xác thực");
        }
        if (hasSystemAdminRole(principal)) {
            return;
        }
        boolean isMember = projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, principal.userId());
        if (!isMember) {
            throw new BusinessRuleException("FORBIDDEN", "Người dùng không thuộc dự án này");
        }
    }

    private void verifyProjectMemberOrAdmin(UUID projectId, WorkSphereUserPrincipal principal) {
        if (principal == null) {
            throw new BusinessRuleException("FORBIDDEN", "Yêu cầu xác thực");
        }
        if (hasSystemAdminRole(principal)) {
            return;
        }
        boolean isMember = projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, principal.userId());
        if (!isMember) {
            throw new BusinessRuleException("FORBIDDEN", "Người dùng không phải thành viên dự án này");
        }
    }

    private void verifyCanUpdateTask(Task task, WorkSphereUserPrincipal principal) {
        if (hasSystemAdminRole(principal) || task.getReporterId().equals(principal.userId())) {
            return;
        }
        Optional<ProjectMember> member = projectMemberRepository.findActiveByProjectIdAndUserId(task.getProjectId(), principal.userId());
        if (member.isPresent() && (member.get().getProjectRole() == ProjectRole.PROJECT_MANAGER || member.get().getProjectRole() == ProjectRole.TEAM_LEADER)) {
            return;
        }
        throw new BusinessRuleException("FORBIDDEN", "Không có quyền cập nhật công việc");
    }

    private void verifyCanChangeStatus(Task task, TaskStatus current, TaskStatus target, WorkSphereUserPrincipal principal) {
        if (hasSystemAdminRole(principal)) {
            return;
        }

        Optional<ProjectMember> memberOpt = projectMemberRepository.findActiveByProjectIdAndUserId(task.getProjectId(), principal.userId());
        boolean isPMOrTL = memberOpt.isPresent() && (memberOpt.get().getProjectRole() == ProjectRole.PROJECT_MANAGER
                || memberOpt.get().getProjectRole() == ProjectRole.TEAM_LEADER);

        boolean isAssignee = taskAssignmentRepository.existsByTaskIdAndAssigneeIdAndActiveTrue(task.getId(), principal.userId());

        if (target == TaskStatus.COMPLETED) {
            if (!isPMOrTL) {
                throw new BusinessRuleException("FORBIDDEN",
                        "Người thực hiện không được tự duyệt hoàn thành công việc. Cần Quản lý dự án hoặc Trưởng nhóm kiểm tra.");
            }
            return;
        }

        if (current == TaskStatus.IN_REVIEW && target == TaskStatus.IN_PROGRESS) {
            if (!isPMOrTL) {
                throw new BusinessRuleException("FORBIDDEN", "Chỉ Quản lý dự án hoặc Trưởng nhóm mới có quyền từ chối kết quả kiểm tra");
            }
            return;
        }

        if (target == TaskStatus.CANCELLED) {
            if (!isPMOrTL) {
                throw new BusinessRuleException("FORBIDDEN", "Chỉ Quản lý dự án hoặc Trưởng nhóm mới có quyền hủy công việc");
            }
            return;
        }

        if (!isAssignee && !isPMOrTL) {
            throw new BusinessRuleException("FORBIDDEN", "Không có quyền chuyển trạng thái công việc này");
        }
    }

    private void verifyCanUpdateProgress(Task task, WorkSphereUserPrincipal principal) {
        if (hasSystemAdminRole(principal)) {
            return;
        }
        boolean isAssignee = taskAssignmentRepository.existsByTaskIdAndAssigneeIdAndActiveTrue(task.getId(), principal.userId());
        if (isAssignee) {
            return;
        }
        Optional<ProjectMember> memberOpt = projectMemberRepository.findActiveByProjectIdAndUserId(task.getProjectId(), principal.userId());
        if (memberOpt.isPresent() && (memberOpt.get().getProjectRole() == ProjectRole.PROJECT_MANAGER
                || memberOpt.get().getProjectRole() == ProjectRole.TEAM_LEADER)) {
            return;
        }
        throw new BusinessRuleException("FORBIDDEN", "Không có quyền cập nhật tiến độ công việc");
    }

    private void verifyCanAssign(Task task, WorkSphereUserPrincipal principal) {
        if (hasSystemAdminRole(principal)) {
            return;
        }
        Optional<ProjectMember> memberOpt = projectMemberRepository.findActiveByProjectIdAndUserId(task.getProjectId(), principal.userId());
        if (memberOpt.isPresent() && (memberOpt.get().getProjectRole() == ProjectRole.PROJECT_MANAGER
                || memberOpt.get().getProjectRole() == ProjectRole.TEAM_LEADER)) {
            return;
        }
        throw new BusinessRuleException("FORBIDDEN", "Không có quyền phân công công việc này");
    }

    private void verifyCanDeleteTask(Task task, WorkSphereUserPrincipal principal) {
        if (hasSystemAdminRole(principal)) {
            return;
        }
        Optional<ProjectMember> memberOpt = projectMemberRepository.findActiveByProjectIdAndUserId(task.getProjectId(), principal.userId());
        if (memberOpt.isPresent() && memberOpt.get().getProjectRole() == ProjectRole.PROJECT_MANAGER) {
            return;
        }
        throw new BusinessRuleException("FORBIDDEN", "Chỉ Quản lý dự án hoặc Quản trị viên mới có quyền xóa công việc");
    }

    private boolean hasSystemAdminRole(WorkSphereUserPrincipal principal) {
        if (principal == null || principal.user() == null || principal.user().getRoles() == null) {
            return false;
        }
        return principal.user().getRoles().stream()
                .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getCode()));
    }

    private Pageable validatePageable(Pageable pageable) {
        if (pageable.getSort().isSorted()) {
            for (Sort.Order order : pageable.getSort()) {
                if (!ALLOWED_SORT_PROPERTIES.contains(order.getProperty())) {
                    throw new BusinessRuleException("VALIDATION_ERROR",
                            "Trường sắp xếp không hợp lệ: " + order.getProperty() + ". Các trường hợp lệ: " + ALLOWED_SORT_PROPERTIES);
                }
            }
            return pageable;
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
