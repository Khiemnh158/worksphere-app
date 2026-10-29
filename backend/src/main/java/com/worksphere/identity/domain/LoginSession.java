package com.worksphere.identity.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for the login_sessions table.
 * Tracks login sessions per device.
 * Per 05_DATABASE_DESIGN.md section 5.7.
 */
@Entity
@Table(name = "login_sessions")
public class LoginSession {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "refresh_token_id")
    private UUID refreshTokenId;

    @Column(name = "device_name", length = 255)
    private String deviceName;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "login_at", nullable = false)
    private Instant loginAt;

    @Column(name = "last_activity_at", nullable = false)
    private Instant lastActivityAt;

    @Column(name = "logout_at")
    private Instant logoutAt;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Session status constants per DB design
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_LOGGED_OUT = "LOGGED_OUT";
    public static final String STATUS_EXPIRED = "EXPIRED";
    public static final String STATUS_REVOKED = "REVOKED";

    protected LoginSession() {
    }

    public static LoginSession create(
            UUID id,
            UUID userId,
            UUID refreshTokenId,
            String deviceName,
            String ipAddress,
            String userAgent
    ) {
        LoginSession session = new LoginSession();
        session.id = id;
        session.userId = userId;
        session.refreshTokenId = refreshTokenId;
        session.deviceName = deviceName;
        session.ipAddress = ipAddress;
        session.userAgent = userAgent;
        session.loginAt = Instant.now();
        session.lastActivityAt = Instant.now();
        session.status = STATUS_ACTIVE;
        session.createdAt = Instant.now();
        session.updatedAt = Instant.now();
        return session;
    }

    public void logout() {
        this.logoutAt = Instant.now();
        this.status = STATUS_LOGGED_OUT;
        this.updatedAt = Instant.now();
    }

    public void revoke() {
        this.status = STATUS_REVOKED;
        this.updatedAt = Instant.now();
    }

    public void updateActivity() {
        this.lastActivityAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void linkRefreshToken(UUID refreshTokenId) {
        this.refreshTokenId = refreshTokenId;
        this.updatedAt = Instant.now();
    }

    public boolean isActive() {
        return STATUS_ACTIVE.equals(status);
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getRefreshTokenId() {
        return refreshTokenId;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Instant getLoginAt() {
        return loginAt;
    }

    public Instant getLastActivityAt() {
        return lastActivityAt;
    }

    public Instant getLogoutAt() {
        return logoutAt;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
