package com.worksphere.organization.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity for team_members table.
 * Per 05_DATABASE_DESIGN.md section 6.3 and V002 migration.
 */
@Entity
@Table(name = "team_members")
@IdClass(TeamMember.TeamMemberId.class)
public class TeamMember {

    @Id
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "member_role", nullable = false, length = 30)
    private String memberRole;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    protected TeamMember() {
    }

    public static TeamMember create(UUID teamId, UUID userId, String memberRole) {
        TeamMember tm = new TeamMember();
        tm.teamId = teamId;
        tm.userId = userId;
        tm.memberRole = memberRole != null ? memberRole : "MEMBER";
        tm.joinedAt = Instant.now();
        tm.active = true;
        return tm;
    }

    public void deactivate() {
        this.active = false;
        this.leftAt = Instant.now();
    }

    public void updateRole(String memberRole) {
        this.memberRole = memberRole;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getMemberRole() {
        return memberRole;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public Instant getLeftAt() {
        return leftAt;
    }

    public boolean isActive() {
        return active;
    }

    public static class TeamMemberId implements Serializable {
        private UUID teamId;
        private UUID userId;

        public TeamMemberId() {
        }

        public TeamMemberId(UUID teamId, UUID userId) {
            this.teamId = teamId;
            this.userId = userId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            TeamMemberId that = (TeamMemberId) o;
            return Objects.equals(teamId, that.teamId) && Objects.equals(userId, that.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(teamId, userId);
        }
    }
}
