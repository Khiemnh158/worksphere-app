package com.worksphere.project.application;

import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.project.api.request.ChangeProjectStatusRequest;
import com.worksphere.project.api.request.CreateProjectRequest;
import com.worksphere.project.api.request.UpdateProjectRequest;
import com.worksphere.project.api.response.MilestoneResponse;
import com.worksphere.project.api.response.ProjectDetailResponse;
import com.worksphere.project.api.response.ProjectSummaryResponse;
import com.worksphere.project.domain.Milestone;
import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectPriority;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.domain.ProjectStatus;
import com.worksphere.project.domain.ProjectStatusHistory;
import com.worksphere.project.infrastructure.persistence.MilestoneRepository;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.project.infrastructure.persistence.ProjectRepository;
import com.worksphere.project.infrastructure.persistence.ProjectStatusHistoryRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Application service orchestrating Project lifecycle, membership and milestones.
 */
@Service
public class ProjectApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ProjectApplicationService.class);

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final MilestoneRepository milestoneRepository;
    private final ProjectStatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public ProjectApplicationService(
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            MilestoneRepository milestoneRepository,
            ProjectStatusHistoryRepository statusHistoryRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository
    ) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.milestoneRepository = milestoneRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public PagedData<ProjectSummaryResponse> searchProjects(
            String search,
            ProjectStatus status,
            ProjectPriority priority,
            UUID managerId,
            UUID departmentId,
            Pageable pageable
    ) {
        return searchProjects(search, status, priority, managerId, departmentId, pageable, null);
    }

    @Transactional(readOnly = true)
    public PagedData<ProjectSummaryResponse> searchProjects(
            String search,
            ProjectStatus status,
            ProjectPriority priority,
            UUID managerId,
            UUID departmentId,
            Pageable pageable,
            WorkSphereUserPrincipal principal
    ) {
        UUID memberUserId = hasSystemAdminRole(principal) ? null : (principal != null ? principal.userId() : null);

        Page<Project> page = projectRepository.searchProjects(
                search,
                status,
                priority,
                managerId,
                departmentId,
                memberUserId,
                pageable
        );

        List<ProjectSummaryResponse> content = page.getContent().stream()
                .map(project -> {
                    User manager = userRepository.findActiveById(project.getManagerId()).orElse(null);
                    String managerName = manager != null ? manager.getFullName() : "N/A";
                    long memberCount = projectMemberRepository.countByProjectIdAndActiveTrue(project.getId());
                    return ProjectSummaryResponse.from(project, managerName, null, memberCount);
                })
                .toList();

        return PagedData.from(page, content);
    }

    @Transactional
    public ProjectDetailResponse createProject(CreateProjectRequest request, UUID currentUserId) {
        if (projectRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new BusinessRuleException("PROJECT_CODE_ALREADY_EXISTS", "Mã dự án đã tồn tại");
        }

        if (request.departmentId() != null) {
            departmentRepository.findActiveById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("DEPARTMENT_NOT_FOUND", "Phòng ban không tồn tại"));
        }

        // Validate creator as project manager
        User creator = userRepository.findActiveById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Người dùng không tồn tại"));
        if (creator.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessRuleException("USER_NOT_ACTIVE", "Người dùng không ở trạng thái hoạt động");
        }

        UUID projectId = UUID.randomUUID();
        Project project = Project.create(
                projectId,
                request.code(),
                request.name(),
                request.description(),
                currentUserId, // creator is manager
                request.departmentId(),
                request.priority(),
                request.startDate(),
                request.plannedEndDate(),
                currentUserId
        );

        Project saved = projectRepository.save(project);

        // Add creator as PROJECT_MANAGER in project_members
        projectMemberRepository.save(ProjectMember.create(
                UUID.randomUUID(),
                saved.getId(),
                currentUserId,
                ProjectRole.PROJECT_MANAGER,
                currentUserId
        ));

        // Add initial members if provided
        if (request.initialMemberIds() != null) {
            Set<UUID> memberIds = new HashSet<>(request.initialMemberIds());
            for (UUID memberUserId : memberIds) {
                if (memberUserId.equals(currentUserId)) {
                    continue; // already added
                }
                User memberUser = userRepository.findActiveById(memberUserId).orElse(null);
                if (memberUser == null || memberUser.getStatus() != UserStatus.ACTIVE) {
                    throw new BusinessRuleException("PROJECT_MEMBER_INVALID", "Thành viên ban đầu không hợp lệ hoặc không hoạt động");
                }
                projectMemberRepository.save(ProjectMember.create(
                        UUID.randomUUID(),
                        saved.getId(),
                        memberUserId,
                        ProjectRole.MEMBER,
                        currentUserId
                ));
            }
        }

        log.info("Project created. id={}, code={}, managerId={}", saved.getId(), saved.getCode(), saved.getManagerId());
        return getProjectDetail(saved.getId(), currentUserId);
    }

    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectDetail(UUID projectId, WorkSphereUserPrincipal principal) {
        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));

        verifyProjectReadAccess(project.getId(), principal);

        return buildProjectDetailResponse(project, principal != null ? principal.userId() : null);
    }

    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectDetail(UUID projectId, UUID currentUserId) {
        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));

        return buildProjectDetailResponse(project, currentUserId);
    }

    private ProjectDetailResponse buildProjectDetailResponse(Project project, UUID currentUserId) {
        User manager = userRepository.findActiveById(project.getManagerId()).orElse(null);
        String managerName = manager != null ? manager.getFullName() : "N/A";

        Department dept = null;
        if (project.getDepartmentId() != null) {
            dept = departmentRepository.findActiveById(project.getDepartmentId()).orElse(null);
        }

        long memberCount = projectMemberRepository.countByProjectIdAndActiveTrue(project.getId());
        List<MilestoneResponse> milestones = milestoneRepository.findAllByProjectIdOrderByDueDateAsc(project.getId())
                .stream()
                .map(MilestoneResponse::from)
                .toList();

        Set<String> allowedActions = computeAllowedActions(project, currentUserId);

        return ProjectDetailResponse.from(
                project,
                managerName,
                null,
                dept != null ? dept.getId() : null,
                dept != null ? dept.getCode() : null,
                dept != null ? dept.getName() : null,
                memberCount,
                milestones,
                allowedActions
        );
    }

    @Transactional
    public ProjectDetailResponse updateProject(UUID projectId, UpdateProjectRequest request, UUID currentUserId) {
        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));

        if (!Objects.equals(project.getVersion(), request.version())) {
            throw new ObjectOptimisticLockingFailureException(Project.class, projectId);
        }

        project.updateDetails(
                request.name(),
                request.description(),
                request.priority(),
                request.startDate(),
                request.plannedEndDate(),
                currentUserId
        );

        projectRepository.save(project);
        log.info("Project updated. id={}, version={}", projectId, project.getVersion());
        return getProjectDetail(projectId, currentUserId);
    }

    @Transactional
    public ProjectDetailResponse changeProjectStatus(UUID projectId, ChangeProjectStatusRequest request, UUID currentUserId) {
        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));

        if (!Objects.equals(project.getVersion(), request.version())) {
            throw new ObjectOptimisticLockingFailureException(Project.class, projectId);
        }

        ProjectStatus fromStatus = project.getStatus();
        project.changeStatus(request.status(), currentUserId);

        projectRepository.save(project);

        // Record status history in same transaction
        statusHistoryRepository.save(ProjectStatusHistory.create(
                UUID.randomUUID(),
                project.getId(),
                fromStatus,
                request.status(),
                request.reason(),
                currentUserId
        ));

        log.info("Project status changed. id={}, from={}, to={}", projectId, fromStatus, request.status());
        return getProjectDetail(projectId, currentUserId);
    }

    private Set<String> computeAllowedActions(Project project, UUID currentUserId) {
        Set<String> actions = new HashSet<>();
        boolean isManager = project.getManagerId().equals(currentUserId);
        ProjectMember currentMember = projectMemberRepository.findActiveByProjectIdAndUserId(project.getId(), currentUserId).orElse(null);

        if (isManager || (currentMember != null && currentMember.getProjectRole() == ProjectRole.PROJECT_MANAGER)) {
            actions.add("UPDATE");
            actions.add("MANAGE_MEMBERS");
            actions.add("CHANGE_STATUS");
            if (project.getStatus() == ProjectStatus.ACTIVE) {
                actions.add("CREATE_TASK");
                actions.add("CREATE_MILESTONE");
            }
        } else if (currentMember != null && currentMember.getProjectRole() == ProjectRole.TEAM_LEADER) {
            if (project.getStatus() == ProjectStatus.ACTIVE) {
                actions.add("CREATE_TASK");
            }
        }
        return actions;
    }

    private void verifyProjectReadAccess(UUID projectId, WorkSphereUserPrincipal principal) {
        if (principal == null) {
            throw new AccessDeniedException("Yêu cầu xác thực");
        }
        if (hasSystemAdminRole(principal)) {
            return;
        }
        boolean isMember = projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, principal.userId());
        if (!isMember) {
            throw new AccessDeniedException("Bạn không có quyền truy cập dự án này");
        }
    }

    private boolean hasSystemAdminRole(WorkSphereUserPrincipal principal) {
        if (principal == null) {
            return false;
        }
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            boolean hasAdminAuthority = auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ADMIN".equals(a.getAuthority()));
            if (hasAdminAuthority) {
                return true;
            }
        }
        if (principal.user() != null && principal.user().getRoles() != null) {
            try {
                return principal.user().getRoles().stream()
                        .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getCode()));
            } catch (Exception ignored) {
            }
        }
        return false;
    }
}
