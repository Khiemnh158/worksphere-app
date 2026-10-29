package com.worksphere.organization.application;

import com.worksphere.identity.domain.User;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.domain.Team;
import com.worksphere.organization.domain.TeamMember;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.organization.infrastructure.persistence.TeamMemberRepository;
import com.worksphere.organization.infrastructure.persistence.TeamRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TeamApplicationService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public TeamApplicationService(
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository
    ) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Team createTeam(UUID departmentId, String code, String name, String description, UUID leaderId) {
        if (departmentId != null) {
            Department dept = departmentRepository.findActiveById(departmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("DEPARTMENT_NOT_FOUND", "Phòng ban không tồn tại"));
            if (!dept.isActive()) {
                throw new BusinessRuleException("DEPARTMENT_INACTIVE", "Phòng ban không còn hoạt động");
            }
        }

        if (leaderId != null) {
            User leader = userRepository.findActiveById(leaderId)
                    .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Trưởng nhóm không tồn tại"));
        }

        Team team = Team.create(UUID.randomUUID(), departmentId, code, name, description, leaderId);
        Team saved = teamRepository.save(team);

        if (leaderId != null) {
            TeamMember leaderMember = TeamMember.create(saved.getId(), leaderId, "LEADER");
            teamMemberRepository.save(leaderMember);
        }

        return saved;
    }

    @Transactional
    public TeamMember addMember(UUID teamId, UUID userId, String role) {
        Team team = teamRepository.findActiveById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("TEAM_NOT_FOUND", "Nhóm không tồn tại"));

        if (!team.isActive()) {
            throw new BusinessRuleException("TEAM_INACTIVE", "Nhóm không còn hoạt động");
        }

        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Người dùng không tồn tại"));

        if (teamMemberRepository.existsByTeamIdAndUserIdAndActiveTrue(teamId, userId)) {
            throw new BusinessRuleException("TEAM_MEMBER_EXISTS", "Thành viên đã ở trong nhóm");
        }

        TeamMember member = TeamMember.create(teamId, userId, role);
        return teamMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(UUID teamId, UUID userId) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("TEAM_MEMBER_NOT_FOUND", "Thành viên không thuộc nhóm"));

        member.deactivate();
        teamMemberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public List<Team> getTeamsByDepartment(UUID departmentId) {
        return teamRepository.findByDepartmentId(departmentId);
    }

    @Transactional(readOnly = true)
    public List<TeamMember> getTeamMembers(UUID teamId) {
        return teamMemberRepository.findActiveByTeamId(teamId);
    }
}
