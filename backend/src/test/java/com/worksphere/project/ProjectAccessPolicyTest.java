package com.worksphere.project;

import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.project.application.ProjectAccessPolicy;
import com.worksphere.project.domain.ProjectMember;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProjectAccessPolicyTest {
    private final UUID actor = UUID.randomUUID();
    private final UUID project = UUID.randomUUID();
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ProjectAccessPolicy policy = new ProjectAccessPolicy(members);

    @BeforeEach
    void before() {
        login(UserStatus.ACTIVE, "PROJECT_READ", "PROJECT_UPDATE", "PROJECT_MEMBER_MANAGE");
        when(members.findActiveByProjectIdAndUserId(project, actor)).thenReturn(Optional.empty());
    }

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
    }

    private void login(UserStatus status, String... permissions) {
        User user = mock(User.class);
        when(user.getId()).thenReturn(actor);
        when(user.getStatus()).thenReturn(status);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new WorkSphereUserPrincipal(user), null,
                Arrays.stream(permissions).map(SimpleGrantedAuthority::new).toList()));
    }

    private void membership(ProjectRole role) {
        when(members.findActiveByProjectIdAndUserId(project, actor)).thenReturn(Optional.of(
                ProjectMember.create(UUID.randomUUID(), project, actor, role, actor)));
    }

    @Test
    void globalManagerPermissionDoesNotAllowMutatingOtherProjects() {
        assertThatThrownBy(() -> policy.requireManage(project, actor, "PROJECT_UPDATE"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void projectManagerCanManageOnlyTheirOwnProject() {
        membership(ProjectRole.PROJECT_MANAGER);
        policy.requireManage(project, actor, "PROJECT_UPDATE");
        assertThat(policy.canManage(UUID.randomUUID(), "PROJECT_UPDATE")).isFalse();
    }

    @Test
    void regularMemberCannotManageMemberships() {
        membership(ProjectRole.MEMBER);
        assertThatThrownBy(() -> policy.requireManage(project, actor, "PROJECT_MEMBER_MANAGE"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void teamLeaderIsNotAutomaticallyProjectManager() {
        membership(ProjectRole.TEAM_LEADER);
        assertThat(policy.canManage(project, "PROJECT_UPDATE")).isFalse();
    }

    @Test
    void projectRoleDoesNotInventMissingPermission() {
        membership(ProjectRole.PROJECT_MANAGER);
        login(UserStatus.ACTIVE, "PROJECT_READ");
        assertThat(policy.canManage(project, "PROJECT_UPDATE")).isFalse();
    }

    @Test
    void callerCannotSubstituteAnotherActorId() {
        membership(ProjectRole.PROJECT_MANAGER);
        assertThatThrownBy(() -> policy.requireManage(project, UUID.randomUUID(), "PROJECT_UPDATE"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void activeAdminCanManageWithoutMembershipWhenPermissionGranted() {
        login(UserStatus.ACTIVE, "ROLE_ADMIN", "PROJECT_UPDATE");
        policy.requireManage(project, actor, "PROJECT_UPDATE");
    }

    @Test
    void adminStillNeedsPermission() {
        login(UserStatus.ACTIVE, "ROLE_ADMIN");
        assertThat(policy.canManage(project, "PROJECT_UPDATE")).isFalse();
    }

    @Test
    void disabledAccountAndAnonymousCallerAreDenied() {
        login(UserStatus.DISABLED, "ROLE_ADMIN", "PROJECT_UPDATE");
        assertThatThrownBy(policy::currentPrincipal).isInstanceOf(AccessDeniedException.class);
        SecurityContextHolder.clearContext();
        assertThatThrownBy(policy::currentPrincipal).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void readRequiresActiveMembershipEvenWhenReadPermissionExists() {
        assertThatThrownBy(() -> policy.requireRead(project, actor)).isInstanceOf(AccessDeniedException.class);
        when(members.existsByProjectIdAndUserIdAndActiveTrue(project, actor)).thenReturn(true);
        policy.requireRead(project, actor);
    }
}
