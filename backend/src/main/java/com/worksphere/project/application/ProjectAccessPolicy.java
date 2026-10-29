package com.worksphere.project.application;

import com.worksphere.identity.domain.UserStatus;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Server-side scope checks shared by project mutations and advertised actions. */
@Component
public class ProjectAccessPolicy {
    private final ProjectMemberRepository members;

    public ProjectAccessPolicy(ProjectMemberRepository members) {
        this.members = members;
    }

    public WorkSphereUserPrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || !(auth.getPrincipal() instanceof WorkSphereUserPrincipal principal)
                || principal.user().getStatus() != UserStatus.ACTIVE) {
            throw new AccessDeniedException("Yêu cầu tài khoản đang hoạt động");
        }
        return principal;
    }

    public void requireActor(UUID actorId) {
        if (!currentPrincipal().userId().equals(actorId)) {
            throw new AccessDeniedException("Người thực hiện không khớp phiên đăng nhập");
        }
    }

    public boolean isAdmin() {
        currentPrincipal();
        return hasAuthority("ROLE_ADMIN");
    }

    public boolean hasAuthority(String permission) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(authority -> permission.equals(authority.getAuthority()));
    }

    public void requireRead(UUID projectId, UUID actorId) {
        requireActor(actorId);
        if (!hasAuthority("PROJECT_READ") || (!isAdmin()
                && !members.existsByProjectIdAndUserIdAndActiveTrue(projectId, actorId))) {
            throw new AccessDeniedException("Bạn không có quyền truy cập dự án này");
        }
    }

    public boolean canManage(UUID projectId, String permission) {
        WorkSphereUserPrincipal principal = currentPrincipal();
        return hasAuthority(permission) && (isAdmin() || members
                .findActiveByProjectIdAndUserId(projectId, principal.userId())
                .filter(member -> member.getProjectRole() == ProjectRole.PROJECT_MANAGER).isPresent());
    }

    public void requireManage(UUID projectId, UUID actorId, String permission) {
        requireActor(actorId);
        if (!canManage(projectId, permission)) {
            throw new AccessDeniedException("Bạn không có quyền quản lý dự án này");
        }
    }
}
