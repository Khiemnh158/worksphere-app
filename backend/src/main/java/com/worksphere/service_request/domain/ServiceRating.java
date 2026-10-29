package com.worksphere.service_request.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for service_ratings table.
 * Per 05_DATABASE_DESIGN.md section 9.7 and V007 migration.
 */
@Entity
@Table(name = "service_ratings")
public class ServiceRating {

    @Id
    private UUID id;

    @Column(name = "request_id", nullable = false, unique = true)
    private UUID requestId;

    @Column(name = "rated_by", nullable = false)
    private UUID ratedBy;

    @Column(name = "score", nullable = false)
    private short score;

    @Column(name = "comment", length = 2000)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ServiceRating() {
    }

    public static ServiceRating create(
            UUID id,
            UUID requestId,
            UUID ratedBy,
            int score,
            String comment,
            Instant now
    ) {
        ServiceRating rating = new ServiceRating();
        rating.id = id != null ? id : UUID.randomUUID();
        rating.requestId = requestId;
        rating.ratedBy = ratedBy;
        rating.score = (short) score;
        rating.comment = comment;
        rating.createdAt = now != null ? now : Instant.now();
        rating.updatedAt = rating.createdAt;
        return rating;
    }

    public UUID getId() {
        return id;
    }

    public UUID getRequestId() {
        return requestId;
    }

    public UUID getRatedBy() {
        return ratedBy;
    }

    public short getScore() {
        return score;
    }

    public String getComment() {
        return comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
