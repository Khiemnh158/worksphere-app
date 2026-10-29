package com.worksphere.identity.infrastructure.persistence;

import com.worksphere.identity.domain.LoginSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for LoginSession entity.
 */
public interface LoginSessionRepository extends JpaRepository<LoginSession, UUID> {

    Optional<LoginSession> findByRefreshTokenId(UUID refreshTokenId);

    @Modifying
    @Query("UPDATE LoginSession ls SET ls.status = 'REVOKED', ls.updatedAt = :now WHERE ls.userId = :userId AND ls.status = 'ACTIVE'")
    int revokeAllActiveByUserId(@Param("userId") UUID userId, @Param("now") java.time.Instant now);
}
