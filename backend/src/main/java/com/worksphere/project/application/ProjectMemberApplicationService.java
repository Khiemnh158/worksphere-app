package com.worksphere.project.application;

import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.project.api.request.AddProjectMemberRequest;
import com.worksphere.project.api.request.UpdateProjectMemberRoleRequest;
import com.worksphere.project.api.response.ProjectMemberResponse;
import com.worksphere.project.domain.Project;
import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.domain.ProjectStatus;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.project.infrastructure.persistence.ProjectRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Application service managing project members.
 */
@Service
public class ProjectMemberApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ProjectMemberApplicationService.class);

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ProjectAccessPolicy accessPolicy;
    private final com.worksphere.notification.application.NotificationEventDispatcher eventDispatcher;

    public ProjectMemberApplicationService(
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            UserRepository userRepository,
            com.worksphere.notification.application.NotificationEventDispatcher eventDispatcher,
            ProjectAccessPolicy accessPolicy
    ) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.eventDispatcher = eventDispatcher;
        this.accessPolicy = accessPolicy;
    }

    @Transactional(readOnly = true)
    public PagedData<ProjectMemberResponse> getMembers(
            UUID projectId,
            ProjectRole role,
            Boolean active,
            Pageable pageable
    ) {
        return getMembers(projectId, role, active, pageable, null);
    }

    @Transactional(readOnly = true)
    public PagedData<ProjectMemberResponse> getMembers(
            UUID projectId,
            ProjectRole role,
            Boolean active,
            Pageable pageable,
            WorkSphereUserPrincipal principal
    ) {
        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));

        accessPolicy.requireRead(project.getId(), principal != null ? principal.userId() : null);

        Page<ProjectMember> page = projectMemberRepository.searchMembers(project.getId(), role, active, pageable);

        List<ProjectMemberResponse> content = page.getContent().stream()
                .map(pm -> {
                    User user = userRepository.findActiveById(pm.getUserId()).orElse(null);
                    String name = user != null ? user.getFullName() : "N/A";
                    String email = user != null ? user.getEmail() : "N/A";
                    return ProjectMemberResponse.from(pm, name, email, null);
                })
                .toList();

        return PagedData.from(page, content);
    }

    @Transactional
    public ProjectMemberResponse addMember(UUID projectId, AddProjectMemberRequest request, UUID currentUserId) {
        Project project = projectRepository.findActiveByIdForUpdate(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));
        accessPolicy.requireManage(projectId, currentUserId, "PROJECT_MEMBER_MANAGE");

        if (project.getStatus() != ProjectStatus.ACTIVE && project.getStatus() != ProjectStatus.DRAFT) {
            throw new BusinessRuleException("PROJECT_NOT_ACTIVE", "Dự án không ở trạng thái hoạt động");
        }

        User user = userRepository.findActiveById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Người dùng không tồn tại"));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessRuleException("USER_NOT_ACTIVE", "Người dùng không ở trạng thái hoạt động");
        }

        if (projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, request.userId())) {
            throw new BusinessRuleException("PROJECT_MEMBER_ALREADY_EXISTS", "Người dùng đã là thành viên của dự án");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, request.userId())
                .map(existing -> {
                    existing.updateRole(request.projectRole());
                    return existing;
                })
                .orElseGet(() -> ProjectMember.create(
                        UUID.randomUUID(),
                        projectId,
                        request.userId(),
                        request.projectRole(),
                        currentUserId
                ));

        ProjectMember saved = projectMemberRepository.save(member);
        eventDispatcher.onProjectMemberAdded(projectId, saved.getId(), saved.getUserId(), currentUserId, project.getName());
        log.info("Project member added. projectId={}, userId={}, role={}", projectId, request.userId(), request.projectRole());
        return ProjectMemberResponse.from(saved, user.getFullName(), user.getEmail(), null);
    }

    @Transactional
    public ProjectMemberResponse updateMemberRole(UUID projectId, UUID memberId, UpdateProjectMemberRoleRequest request, UUID currentUserId) {
        projectRepository.findActiveByIdForUpdate(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));
        accessPolicy.requireManage(projectId, currentUserId, "PROJECT_MEMBER_MANAGE");

        ProjectMember member = projectMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("MEMBER_NOT_FOUND", "Thành viên dự án không tồn tại"));

        if (!member.getProjectId().equals(projectId)) {
            throw new BusinessRuleException("INVALID_PROJECT_MEMBER", "Thành viên không thuộc dự án này");
        }

        // Rule: Không cho giáng cấp Project Manager cuối cùng của dự án
        if (member.isActive()
                && member.getProjectRole() == ProjectRole.PROJECT_MANAGER
                && request.projectRole() != ProjectRole.PROJECT_MANAGER) {
            long pmCount = projectMemberRepository.countByProjectIdAndProjectRoleAndActiveTrue(
                    projectId, ProjectRole.PROJECT_MANAGER);
            if (pmCount <= 1) {
                throw new BusinessRuleException("PROJECT_MANAGER_REQUIRED",
                        "Không thể giáng cấp Project Manager duy nhất của dự án");
            }
        }

        member.updateRole(request.projectRole());
        ProjectMember saved = projectMemberRepository.save(member);

        User user = userRepository.findActiveById(member.getUserId()).orElse(null);
        String name = user != null ? user.getFullName() : "N/A";
        String email = user != null ? user.getEmail() : "N/A";

        log.info("Project member role updated. memberId={}, newRole={}", memberId, request.projectRole());
        return ProjectMemberResponse.from(saved, name, email, null);
    }

    @Transactional
    public void removeMember(UUID projectId, UUID memberId, UUID currentUserId) {
        projectRepository.findActiveByIdForUpdate(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("PROJECT_NOT_FOUND", "Dự án không tồn tại"));
        accessPolicy.requireManage(projectId, currentUserId, "PROJECT_MEMBER_MANAGE");

        ProjectMember member = projectMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("MEMBER_NOT_FOUND", "Thành viên dự án không tồn tại"));

        if (!member.getProjectId().equals(projectId)) {
            throw new BusinessRuleException("INVALID_PROJECT_MEMBER", "Thành viên không thuộc dự án này");
        }

        // Rule: Không cho xoá Project Manager cuối cùng của dự án per 06_API_CONTRACT.md section 11.9
        if (member.getProjectRole() == ProjectRole.PROJECT_MANAGER) {
            long pmCount = projectMemberRepository.countByProjectIdAndProjectRoleAndActiveTrue(projectId, ProjectRole.PROJECT_MANAGER);
            if (pmCount <= 1) {
                throw new BusinessRuleException("PROJECT_MANAGER_REQUIRED", "Không thể xoá Project Manager duy nhất của dự án");
            }
        }

        member.deactivate();
        projectMemberRepository.save(member);
        log.info("Project member removed. projectId={}, memberId={}", projectId, memberId);
    }

}
