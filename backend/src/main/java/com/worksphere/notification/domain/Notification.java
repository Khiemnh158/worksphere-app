package com.worksphere.notification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA entity representing a delivered in-app notification.
 * Per 05_DATABASE_DESIGN.md Section 8.8 and V008/V017 migrations.
 */
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    private UUID id;

    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private NotificationType type;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "message", nullable = false, length = 2000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", length = 50)
    private NotificationReferenceType referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "event_key", nullable = false, length = 255)
    private String eventKey;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Notification() {
    }

    public static Notification create(
            UUID id,
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            NotificationReferenceType referenceType,
            UUID referenceId,
            String eventKey,
            Instant createdAt
    ) {
        Objects.requireNonNull(id, "Notification id must not be null");
        Objects.requireNonNull(recipientId, "Recipient id must not be null");
        Objects.requireNonNull(type, "Notification type must not be null");
        Objects.requireNonNull(title, "Title must not be null");
        Objects.requireNonNull(message, "Message must not be null");
        Objects.requireNonNull(eventKey, "Event key must not be null");
        Objects.requireNonNull(createdAt, "Created at must not be null");

        Notification notification = new Notification();
        notification.id = id;
        notification.recipientId = recipientId;
        notification.type = type;
        notification.title = title;
        notification.message = message;
        notification.referenceType = referenceType;
        notification.referenceId = referenceId;
        notification.eventKey = eventKey;
        notification.read = false;
        notification.readAt = null;
        notification.createdAt = createdAt;
        return notification;
    }

    public void markRead(Instant at) {
        if (!this.read) {
            this.read = true;
            this.readAt = at;
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getRecipientId() {
        return recipientId;
    }

    public NotificationType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public NotificationReferenceType getReferenceType() {
        return referenceType;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public String getEventKey() {
        return eventKey;
    }

    public boolean isRead() {
        return read;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
