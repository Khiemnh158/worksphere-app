package com.worksphere.notification.application;

import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.notification.api.request.UpdateNotificationPreferenceItemRequest;
import com.worksphere.notification.api.request.UpdateNotificationPreferencesRequest;
import com.worksphere.notification.api.response.NotificationPreferenceItemResponse;
import com.worksphere.notification.api.response.NotificationPreferencesResponse;
import com.worksphere.notification.api.response.NotificationResponse;
import com.worksphere.notification.api.response.ReadAllNotificationsResponse;
import com.worksphere.notification.api.response.UnreadCountResponse;
import com.worksphere.notification.domain.Notification;
import com.worksphere.notification.domain.NotificationPreference;
import com.worksphere.notification.domain.NotificationReferenceType;
import com.worksphere.notification.domain.NotificationType;
import com.worksphere.notification.infrastructure.persistence.NotificationPreferenceRepository;
import com.worksphere.notification.infrastructure.persistence.NotificationRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.response.PagedData;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Application service for Notifications and Notification Preferences.
 * Per 06_API_CONTRACT.md Section 15 and reports/DECISIONS.md D-049, D-050.
 */
@Service
public class NotificationApplicationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationApplicationService.class);

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public NotificationApplicationService(
            NotificationRepository notificationRepository,
            NotificationPreferenceRepository preferenceRepository,
            UserRepository userRepository,
            Clock clock
    ) {
        this.notificationRepository = notificationRepository;
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PagedData<NotificationResponse> getNotifications(
            UUID recipientId,
            int page,
            int size,
            Boolean read,
            NotificationType type,
            String sort
    ) {
        Sort sortObj = parseSort(sort);
        int validPage = Math.max(page, 0);
        int validSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(validPage, validSize, sortObj);

        Specification<Notification> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("recipientId"), recipientId));

            if (read != null) {
                predicates.add(cb.equal(root.get("read"), read));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Notification> notificationPage = notificationRepository.findAll(spec, pageable);
        List<NotificationResponse> items = notificationPage.getContent().stream()
                .map(NotificationResponse::from)
                .toList();

        return PagedData.from(notificationPage, items);
    }

    @Transactional
    public void markRead(UUID notificationId, UUID recipientId) {
        if (!notificationRepository.existsByIdAndRecipientId(notificationId, recipientId)) {
            throw new ResourceNotFoundException("NOTIFICATION_NOT_FOUND", "Thông báo không tồn tại");
        }
        notificationRepository.markAsRead(notificationId, recipientId, clock.instant());
    }

    @Transactional
    public ReadAllNotificationsResponse markAllRead(UUID recipientId) {
        int updatedCount = notificationRepository.markAllAsRead(recipientId, clock.instant());
        return new ReadAllNotificationsResponse(updatedCount);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UUID recipientId) {
        long count = notificationRepository.countByRecipientIdAndReadFalse(recipientId);
        return new UnreadCountResponse(count);
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesResponse getPreferences(UUID userId) {
        List<NotificationPreference> existing = preferenceRepository.findAllByUserId(userId);
        Map<NotificationType, NotificationPreference> map = existing.stream()
                .collect(Collectors.toMap(NotificationPreference::getNotificationType, Function.identity()));

        List<NotificationPreferenceItemResponse> items = new ArrayList<>();
        for (NotificationType type : NotificationType.values()) {
            NotificationPreference pref = map.get(type);
            if (pref != null) {
                items.add(new NotificationPreferenceItemResponse(
                        type,
                        pref.isInAppEnabled(),
                        pref.isPushEnabled(),
                        pref.isEmailEnabled()
                ));
            } else {
                items.add(new NotificationPreferenceItemResponse(
                        type,
                        true,
                        true,
                        false
                ));
            }
        }
        return new NotificationPreferencesResponse(items);
    }

    @Transactional
    public void updatePreferences(UUID userId, UpdateNotificationPreferencesRequest request) {
        if (request.preferences() == null || request.preferences().isEmpty()) {
            return;
        }

        Set<NotificationType> seenTypes = new HashSet<>();
        List<ParsedPreferenceItem> parsedItems = new ArrayList<>();

        for (UpdateNotificationPreferenceItemRequest item : request.preferences()) {
            if (item.notificationType() == null || item.notificationType().trim().isEmpty()) {
                throw new BusinessRuleException("NOTIFICATION_TYPE_INVALID", "Loại thông báo không hợp lệ");
            }

            NotificationType type;
            try {
                type = NotificationType.valueOf(item.notificationType().trim());
            } catch (IllegalArgumentException ex) {
                throw new BusinessRuleException("NOTIFICATION_TYPE_INVALID", "Loại thông báo không hợp lệ: " + item.notificationType());
            }

            if (!seenTypes.add(type)) {
                throw new BusinessRuleException(
                        "NOTIFICATION_PREFERENCE_DUPLICATE_TYPE",
                        "Không được chứa các tùy chọn thông báo trùng lặp: " + type
                );
            }

            parsedItems.add(new ParsedPreferenceItem(
                    type,
                    Boolean.TRUE.equals(item.inAppEnabled()),
                    Boolean.TRUE.equals(item.pushEnabled()),
                    Boolean.TRUE.equals(item.emailEnabled())
            ));
        }

        Instant now = clock.instant();
        for (ParsedPreferenceItem item : parsedItems) {
            Optional<NotificationPreference> existingOpt = preferenceRepository.findByUserIdAndNotificationType(userId, item.type());
            if (existingOpt.isPresent()) {
                NotificationPreference existing = existingOpt.get();
                existing.update(item.inApp(), item.push(), item.email(), now);
                preferenceRepository.save(existing);
            } else {
                NotificationPreference newPref = NotificationPreference.create(
                        UUID.randomUUID(),
                        userId,
                        item.type(),
                        item.inApp(),
                        item.push(),
                        item.email(),
                        now
                );
                preferenceRepository.save(newPref);
            }
        }
    }

    /**
     * Idempotently create an in-app notification if recipient has inAppEnabled and is an active user.
     * Returns true if newly created (affected rows = 1), false if duplicate (affected rows = 0) or skipped.
     */
    @Transactional
    public boolean deliverInAppNotification(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            NotificationReferenceType referenceType,
            UUID referenceId,
            String eventKey
    ) {
        Objects.requireNonNull(recipientId, "Recipient id must not be null");
        Objects.requireNonNull(type, "Notification type must not be null");
        Objects.requireNonNull(eventKey, "Event key must not be null");

        // 1. Check recipient user status (must be active and non-deleted)
        Optional<User> recipientUserOpt = userRepository.findById(recipientId);
        if (recipientUserOpt.isEmpty()) {
            log.warn("Recipient user {} not found, skipping notification {}", recipientId, eventKey);
            return false;
        }
        User recipientUser = recipientUserOpt.get();
        if (recipientUser.getStatus() != UserStatus.ACTIVE || recipientUser.isDeleted()) {
            log.info("Recipient user {} is not active or deleted, skipping notification {}", recipientId, eventKey);
            return false;
        }

        // 2. Check recipient in-app preference
        Optional<NotificationPreference> prefOpt = preferenceRepository.findByUserIdAndNotificationType(recipientId, type);
        if (prefOpt.isPresent() && !prefOpt.get().isInAppEnabled()) {
            log.info("Recipient {} has inAppEnabled=false for type {}, skipping notification {}", recipientId, type, eventKey);
            return false;
        }

        // 3. Native idempotent insert
        Instant createdAt = clock.instant();
        int affectedRows = notificationRepository.insertIdempotent(
                UUID.randomUUID(),
                recipientId,
                type.name(),
                title,
                message,
                referenceType != null ? referenceType.name() : null,
                referenceId,
                eventKey,
                createdAt
        );

        if (affectedRows == 1) {
            log.info("In-app notification created. recipientId={}, type={}, eventKey={}", recipientId, type, eventKey);
            return true;
        } else {
            log.info("In-app notification duplicate ignored (idempotent success). recipientId={}, eventKey={}", recipientId, eventKey);
            return false;
        }
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sort.split(",");
        String property = parts[0].trim();
        if (!"createdAt".equalsIgnoreCase(property)) {
            property = "createdAt";
        }
        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) {
            direction = Sort.Direction.ASC;
        }
        return Sort.by(direction, "createdAt");
    }

    private record ParsedPreferenceItem(
            NotificationType type,
            boolean inApp,
            boolean push,
            boolean email
    ) {
    }
}
