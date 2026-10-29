package com.worksphere.notification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA entity representing a user's notification preferences.
 * Per 05_DATABASE_DESIGN.md Section 8.8 and V008 migration.
 */
@Entity
@Table(
        name = "notification_preferences",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_notification_preferences",
                columnNames = {"user_id", "notification_type"}
        )
)
public class NotificationPreference {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private NotificationType notificationType;

    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled;

    @Column(name = "push_enabled", nullable = false)
    private boolean pushEnabled;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected NotificationPreference() {
    }

    public static NotificationPreference create(
            UUID id,
            UUID userId,
            NotificationType notificationType,
            boolean inAppEnabled,
            boolean pushEnabled,
            boolean emailEnabled,
            Instant updatedAt
    ) {
        Objects.requireNonNull(id, "NotificationPreference id must not be null");
        Objects.requireNonNull(userId, "User id must not be null");
        Objects.requireNonNull(notificationType, "Notification type must not be null");
        Objects.requireNonNull(updatedAt, "Updated at must not be null");

        NotificationPreference pref = new NotificationPreference();
        pref.id = id;
        pref.userId = userId;
        pref.notificationType = notificationType;
        pref.inAppEnabled = inAppEnabled;
        pref.pushEnabled = pushEnabled;
        pref.emailEnabled = emailEnabled;
        pref.updatedAt = updatedAt;
        return pref;
    }

    public void update(boolean inAppEnabled, boolean pushEnabled, boolean emailEnabled, Instant updatedAt) {
        this.inAppEnabled = inAppEnabled;
        this.pushEnabled = pushEnabled;
        this.emailEnabled = emailEnabled;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }

    public boolean isInAppEnabled() {
        return inAppEnabled;
    }

    public boolean isPushEnabled() {
        return pushEnabled;
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
