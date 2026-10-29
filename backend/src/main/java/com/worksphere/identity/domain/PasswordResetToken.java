package com.worksphere.identity.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for the password_reset_tokens table.
 * Only hash is stored. Tokens are single-use with expiry.
 * Per 05_DATABASE_DESIGN.md section 5.8.
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    private String tokenHash;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "request_ip", length = 64)
    private String requestIp;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected PasswordResetToken() {
    }

    public static PasswordResetToken create(
            UUID id,
            UUID userId,
            String tokenHash,
            Instant expiresAt,
            String requestIp,
            String userAgent
    ) {
        PasswordResetToken token = new PasswordResetToken();
        token.id = id;
        token.userId = userId;
        token.tokenHash = tokenHash;
        token.requestedAt = Instant.now();
        token.expiresAt = expiresAt;
        token.requestIp = requestIp;
        token.userAgent = userAgent;
        token.createdAt = Instant.now();
        return token;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isUsed() {
        return usedAt != null;
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isValid() {
        return !isExpired() && !isUsed() && !isRevoked();
    }

    public void markUsed() {
        this.usedAt = Instant.now();
    }

    public void revoke() {
        this.revokedAt = Instant.now();
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public String getRequestIp() {
        return requestIp;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
