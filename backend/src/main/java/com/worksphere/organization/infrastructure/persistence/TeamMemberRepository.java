package com.worksphere.organization.infrastructure.persistence;

import com.worksphere.organization.domain.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for TeamMember entity.
 */
public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMember.TeamMemberId> {

    @Query("SELECT tm FROM TeamMember tm WHERE tm.teamId = :teamId AND tm.active = true")
    List<TeamMember> findActiveByTeamId(@Param("teamId") UUID teamId);

    @Query("SELECT tm FROM TeamMember tm WHERE tm.teamId = :teamId AND tm.userId = :userId")
    Optional<TeamMember> findByTeamIdAndUserId(@Param("teamId") UUID teamId, @Param("userId") UUID userId);

    @Query("SELECT tm FROM TeamMember tm WHERE tm.userId = :userId AND tm.active = true")
    List<TeamMember> findActiveByUserId(@Param("userId") UUID userId);

    boolean existsByTeamIdAndUserIdAndActiveTrue(UUID teamId, UUID userId);
}
