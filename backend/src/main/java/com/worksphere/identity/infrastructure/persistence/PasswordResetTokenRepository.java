package com.worksphere.identity.infrastructure.persistence;

import com.worksphere.identity.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for PasswordResetToken entity.
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.revokedAt = :now WHERE prt.userId = :userId AND prt.usedAt IS NULL AND prt.revokedAt IS NULL")
    int revokeAllUnusedByUserId(@Param("userId") UUID userId, @Param("now") java.time.Instant now);
}
