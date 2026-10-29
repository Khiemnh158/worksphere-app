package com.worksphere.service_request.application;

import com.worksphere.asset.domain.AssetAssignmentStatus;
import com.worksphere.asset.infrastructure.persistence.AssetAssignmentRepository;
import com.worksphere.asset.infrastructure.persistence.AssetRepository;
import com.worksphere.file.domain.StoredFile;
import com.worksphere.file.domain.StoredFileStatus;
import com.worksphere.file.infrastructure.persistence.StoredFileRepository;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.service_request.api.request.AssignServiceRequestRequest;
import com.worksphere.service_request.api.request.CreateServiceCommentRequest;
import com.worksphere.service_request.api.request.CreateServiceRatingRequest;
import com.worksphere.service_request.api.request.CreateServiceRequestRequest;
import com.worksphere.service_request.api.request.RejectResolutionRequest;
import com.worksphere.service_request.api.request.UpdateServiceRequestRequest;
import com.worksphere.service_request.api.request.UpdateServiceRequestStatusRequest;
import com.worksphere.service_request.api.response.CreateServiceRequestResponse;
import com.worksphere.service_request.api.response.ServiceAttachmentResponse;
import com.worksphere.service_request.api.response.ServiceCommentResponse;
import com.worksphere.service_request.api.response.ServiceRatingResponse;
import com.worksphere.service_request.api.response.ServiceRequestDetailResponse;
import com.worksphere.service_request.api.response.ServiceRequestSummaryResponse;
import com.worksphere.service_request.api.response.ServiceStatusHistoryResponse;
import com.worksphere.service_request.domain.ServiceAssignment;
import com.worksphere.service_request.domain.ServiceAttachment;
import com.worksphere.service_request.domain.ServiceCategory;
import com.worksphere.service_request.domain.ServiceComment;
import com.worksphere.service_request.domain.ServicePriority;
import com.worksphere.service_request.domain.ServiceRating;
import com.worksphere.service_request.domain.ServiceRequest;
import com.worksphere.service_request.domain.ServiceStatus;
import com.worksphere.service_request.domain.ServiceStatusHistory;
import com.worksphere.service_request.infrastructure.persistence.ServiceAssignmentRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceAttachmentRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceCategoryRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceCommentRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceRatingRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceRequestRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceStatusHistoryRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.sql.SQLException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for ServiceRequest operations.
 * Per 02_USER_ROLES_AND_WORKFLOWS.md and 06_API_CONTRACT.md section 13.
 */
@Service
public class ServiceRequestApplicationService {

    private final ServiceRequestAccessPolicy accessPolicy;

    private static final Logger log = LoggerFactory.getLogger(ServiceRequestApplicationService.class);
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ServiceRequestRepository requestRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceAssignmentRepository assignmentRepository;
    private final ServiceCommentRepository commentRepository;
    private final ServiceAttachmentRepository attachmentRepository;
    private final ServiceStatusHistoryRepository historyRepository;
    private final ServiceRatingRepository ratingRepository;
    private final UserRepository userRepository;
    private final StoredFileRepository storedFileRepository;
    private final AssetRepository assetRepository;
    private final AssetAssignmentRepository assetAssignmentRepository;
    private final Clock clock;
    private final com.worksphere.notification.application.NotificationEventDispatcher eventDispatcher;

    public ServiceRequestApplicationService(
            ServiceRequestRepository requestRepository,
            ServiceCategoryRepository categoryRepository,
            ServiceAssignmentRepository assignmentRepository,
            ServiceCommentRepository commentRepository,
            ServiceAttachmentRepository attachmentRepository,
            ServiceStatusHistoryRepository historyRepository,
            ServiceRatingRepository ratingRepository,
            UserRepository userRepository,
            StoredFileRepository storedFileRepository,
            AssetRepository assetRepository,
            AssetAssignmentRepository assetAssignmentRepository,
            Clock clock,
            com.worksphere.notification.application.NotificationEventDispatcher eventDispatcher,
            ServiceRequestAccessPolicy accessPolicy
    ) {
        this.requestRepository = requestRepository;
        this.categoryRepository = categoryRepository;
        this.assignmentRepository = assignmentRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.historyRepository = historyRepository;
        this.ratingRepository = ratingRepository;
        this.userRepository = userRepository;
        this.storedFileRepository = storedFileRepository;
        this.assetRepository = assetRepository;
        this.assetAssignmentRepository = assetAssignmentRepository;
        this.clock = clock;
        this.eventDispatcher = eventDispatcher;
        this.accessPolicy = accessPolicy;
    }

    @Transactional
    public CreateServiceRequestResponse createRequest(CreateServiceRequestRequest request, WorkSphereUserPrincipal principal) {
        ServiceCategory category = categoryRepository.findByIdAndDeletedFalse(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_CATEGORY_NOT_FOUND", "Không tìm thấy danh mục dịch vụ"));

        if (!category.isActive()) {
            throw new BusinessRuleException("SERVICE_CATEGORY_NOT_FOUND", "Danh mục dịch vụ đang dừng hoạt động");
        }

        int currentYear = LocalDate.ofInstant(clock.instant(), BUSINESS_ZONE).getYear();
        requestRepository.acquireRequestNumberLock(currentYear);
        String prefix = "SR-" + currentYear + "-%";
        int nextSeq = requestRepository.getNextSequenceForPrefix(prefix);
        String requestNumber = String.format("SR-%d-%06d", currentYear, nextSeq);

        UUID requestId = UUID.randomUUID();
        validateAttachmentFiles(request.attachmentFileIds(), principal);

        if (request.assetId() != null) {
            validateAssetForRequest(request.assetId(), principal);
        }

        ServicePriority priority = request.priority() != null ? request.priority() : category.getDefaultPriority();
        ServiceRequest sr = ServiceRequest.create(
                requestId,
                requestNumber,
                category.getId(),
                principal.userId(),
                request.assetId(),
                request.title().trim(),
                request.description().trim(),
                priority,
                principal.userId(),
                clock.instant()
        );

        ServiceRequest saved = requestRepository.save(sr);
        attachFiles(saved.getId(), request.attachmentFileIds());

        ServiceStatusHistory initialHistory = ServiceStatusHistory.create(
                UUID.randomUUID(),
                requestId,
                null,
                ServiceStatus.OPEN,
                "Yêu cầu dịch vụ được tạo",
                principal.userId(),
                clock.instant()
        );
        historyRepository.save(initialHistory);

        return new CreateServiceRequestResponse(saved.getId(), saved.getRequestNumber(), saved.getStatus());
    }

    @Transactional(readOnly = true)
    public PagedData<ServiceRequestSummaryResponse> searchRequests(
            WorkSphereUserPrincipal principal,
            UUID categoryId,
            UUID requesterId,
            UUID assigneeId,
            UUID assetId,
            ServiceStatus status,
            ServicePriority priority,
            Instant createdFrom,
            Instant createdTo,
            String search,
            Pageable pageable
    ) {
        Specification<ServiceRequest> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));

            if (!hasSystemAdminRole(principal)) {
                UUID callerId = principal.userId();
                Subquery<Integer> sub = query.subquery(Integer.class);
                Root<ServiceAssignment> sa = sub.from(ServiceAssignment.class);
                sub.select(cb.literal(1))
                        .where(
                                cb.equal(sa.get("requestId"), root.get("id")),
                                cb.equal(sa.get("assigneeId"), callerId),
                                cb.isTrue(sa.get("active"))
                        );
                predicates.add(cb.or(
                        cb.equal(root.get("requesterId"), callerId),
                        cb.exists(sub)
                ));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }
            if (requesterId != null) {
                predicates.add(cb.equal(root.get("requesterId"), requesterId));
            }
            if (assigneeId != null) {
                Subquery<Integer> sub = query.subquery(Integer.class);
                Root<ServiceAssignment> sa = sub.from(ServiceAssignment.class);
                sub.select(cb.literal(1))
                        .where(
                                cb.equal(sa.get("requestId"), root.get("id")),
                                cb.equal(sa.get("assigneeId"), assigneeId),
                                cb.isTrue(sa.get("active"))
                        );
                predicates.add(cb.exists(sub));
            }
            if (assetId != null) {
                predicates.add(cb.equal(root.get("assetId"), assetId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (createdFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), createdFrom));
            }
            if (createdTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), createdTo));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("requestNumber")), pattern),
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ServiceRequest> page = requestRepository.findAll(spec, pageable);

        if (page.isEmpty()) {
            return PagedData.from(page, Collections.emptyList());
        }

        Set<UUID> categoryIds = page.getContent().stream()
                .map(ServiceRequest::getCategoryId)
                .collect(Collectors.toSet());
        Map<UUID, ServiceCategory> categoryMap = categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(ServiceCategory::getId, Function.identity()));

        Set<UUID> requestIds = page.getContent().stream()
                .map(ServiceRequest::getId)
                .collect(Collectors.toSet());
        List<ServiceAssignment> activeAssignments = assignmentRepository.findAllByRequestIdInAndActiveTrue(requestIds);
        Map<UUID, ServiceAssignment> assignmentMap = activeAssignments.stream()
                .collect(Collectors.toMap(ServiceAssignment::getRequestId, Function.identity(), (a, b) -> a));

        Set<UUID> userIds = new HashSet<>();
        page.getContent().forEach(sr -> userIds.add(sr.getRequesterId()));
        activeAssignments.forEach(sa -> userIds.add(sa.getAssigneeId()));
        Map<UUID, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<ServiceRequestSummaryResponse> items = page.getContent().stream().map(sr -> {
            ServiceCategory cat = categoryMap.get(sr.getCategoryId());
            User reqUser = userMap.get(sr.getRequesterId());
            ServiceAssignment sa = assignmentMap.get(sr.getId());
            User assignUser = sa != null ? userMap.get(sa.getAssigneeId()) : null;

            return new ServiceRequestSummaryResponse(
                    sr.getId(),
                    sr.getRequestNumber(),
                    sr.getCategoryId(),
                    cat != null ? cat.getName() : null,
                    sr.getRequesterId(),
                    reqUser != null ? reqUser.getFullName() : null,
                    sa != null ? sa.getAssigneeId() : null,
                    assignUser != null ? assignUser.getFullName() : null,
                    sr.getTitle(),
                    sr.getPriority(),
                    sr.getStatus(),
                    sr.getCreatedAt(),
                    sr.getUpdatedAt()
            );
        }).toList();

        return PagedData.from(page, items);
    }

    @Transactional(readOnly = true)
    public ServiceRequestDetailResponse getRequestDetail(UUID requestId, WorkSphereUserPrincipal principal) {
        ServiceRequest sr = requestRepository.findByIdAndDeletedFalse(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu dịch vụ"));

        verifyRequestAccess(sr, principal);

        ServiceCategory category = categoryRepository.findById(sr.getCategoryId()).orElse(null);
        User requester = userRepository.findById(sr.getRequesterId()).orElse(null);
        Optional<ServiceAssignment> activeAssignmentOpt = assignmentRepository.findByRequestIdAndActiveTrue(requestId);
        User assignee = activeAssignmentOpt.flatMap(sa -> userRepository.findById(sa.getAssigneeId())).orElse(null);

        List<ServiceAttachment> attachments = attachmentRepository.findAllByRequestIdOrderByCreatedAtAsc(requestId);
        List<ServiceAttachmentResponse> attachmentResponses = buildAttachmentResponses(attachments);

        boolean includeInternal = hasSystemAdminRole(principal)
                || (activeAssignmentOpt.isPresent() && activeAssignmentOpt.get().getAssigneeId().equals(principal.userId()));

        List<ServiceComment> comments = includeInternal
                ? commentRepository.findAllByRequestIdAndDeletedFalseOrderByCreatedAtAsc(requestId)
                : commentRepository.findAllByRequestIdAndInternalFalseAndDeletedFalseOrderByCreatedAtAsc(requestId);

        Set<UUID> commentAuthorIds = comments.stream().map(ServiceComment::getAuthorId).collect(Collectors.toSet());
        Map<UUID, User> authorMap = userRepository.findAllById(commentAuthorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<ServiceCommentResponse> commentResponses = comments.stream().map(c -> {
            User author = authorMap.get(c.getAuthorId());
            return new ServiceCommentResponse(
                    c.getId(),
                    c.getRequestId(),
                    c.getAuthorId(),
                    author != null ? author.getFullName() : null,
                    c.getContent(),
                    c.isInternal(),
                    c.isEdited(),
                    c.getEditedAt(),
                    c.getCreatedAt(),
                    c.getUpdatedAt()
            );
        }).toList();

        List<ServiceStatusHistory> histories = historyRepository.findAllByRequestIdOrderByChangedAtAsc(requestId);
        Set<UUID> historyUserIds = histories.stream().map(ServiceStatusHistory::getChangedBy).collect(Collectors.toSet());
        Map<UUID, User> historyUserMap = userRepository.findAllById(historyUserIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<ServiceStatusHistoryResponse> historyResponses = histories.stream().map(h -> {
            User user = historyUserMap.get(h.getChangedBy());
            return new ServiceStatusHistoryResponse(
                    h.getId(),
                    h.getRequestId(),
                    h.getFromStatus(),
                    h.getToStatus(),
                    h.getComment(),
                    h.getChangedBy(),
                    user != null ? user.getFullName() : null,
                    h.getChangedAt()
            );
        }).toList();

        ServiceRatingResponse ratingResponse = ratingRepository.findByRequestId(requestId)
                .map(r -> {
                    User rater = userRepository.findById(r.getRatedBy()).orElse(null);
                    return new ServiceRatingResponse(
                            r.getId(),
                            r.getRequestId(),
                            r.getRatedBy(),
                            rater != null ? rater.getFullName() : null,
                            r.getScore(),
                            r.getComment(),
                            r.getCreatedAt()
                    );
                }).orElse(null);

        Set<String> allowedActions = computeAllowedActions(sr, principal, activeAssignmentOpt.isPresent());

        return new ServiceRequestDetailResponse(
                sr.getId(),
                sr.getRequestNumber(),
                category != null ? new ServiceRequestDetailResponse.CategoryBrief(category.getId(), category.getCode(), category.getName()) : null,
                requester != null ? new ServiceRequestDetailResponse.UserBrief(requester.getId(), requester.getFullName(), requester.getEmail()) : null,
                (activeAssignmentOpt.isPresent() && assignee != null)
                        ? new ServiceRequestDetailResponse.AssigneeBrief(activeAssignmentOpt.get().getId(), assignee.getId(), assignee.getFullName(), assignee.getEmail(), activeAssignmentOpt.get().getAssignedAt())
                        : null,
                null,
                sr.getTitle(),
                sr.getDescription(),
                sr.getPriority(),
                sr.getStatus(),
                sr.getResolvedAt(),
                sr.getClosedAt(),
                sr.getCancelledAt(),
                attachmentResponses,
                commentResponses,
                historyResponses,
                ratingResponse,
                allowedActions,
                sr.getCreatedAt(),
                sr.getUpdatedAt(),
                sr.getVersion()
        );
    }

    @Transactional
    public ServiceRequestDetailResponse updateRequest(UUID requestId, UpdateServiceRequestRequest request, WorkSphereUserPrincipal principal) {
        ServiceRequest sr = requestRepository.findByIdAndDeletedFalse(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu dịch vụ"));

        if (!sr.getRequesterId().equals(principal.userId())) {
            throw new AccessDeniedException("Chỉ người tạo mới có quyền cập nhật nội dung yêu cầu");
        }

        if (sr.getStatus() != ServiceStatus.OPEN) {
            throw new BusinessRuleException("INVALID_REQUEST_STATE", "Chỉ có thể cập nhật yêu cầu khi ở trạng thái OPEN");
        }

        if (!sr.getVersion().equals(request.version())) {
            throw new BusinessRuleException("OPTIMISTIC_LOCK_CONFLICT", "Dữ liệu yêu cầu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.");
        }

        UUID categoryId = sr.getCategoryId();
        if (request.categoryId() != null && !request.categoryId().equals(sr.getCategoryId())) {
            ServiceCategory cat = categoryRepository.findByIdAndDeletedFalse(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("SERVICE_CATEGORY_NOT_FOUND", "Không tìm thấy danh mục dịch vụ"));
            if (!cat.isActive()) {
                throw new BusinessRuleException("SERVICE_CATEGORY_NOT_FOUND", "Danh mục dịch vụ đang dừng hoạt động");
            }
            categoryId = cat.getId();
        }

        if (request.assetId() != null) {
            validateAssetForRequest(request.assetId(), principal);
        }

        sr.updateContent(
                request.title().trim(),
                request.description().trim(),
                request.priority(),
                categoryId,
                request.assetId(),
                principal.userId(),
                clock.instant()
        );

        requestRepository.save(sr);
        return getRequestDetail(requestId, principal);
    }

    @Transactional
    public void assignRequest(UUID requestId, AssignServiceRequestRequest request, WorkSphereUserPrincipal principal) {
        ServiceRequest sr = requestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu dịch vụ"));

        if (sr.getStatus() == ServiceStatus.CLOSED || sr.getStatus() == ServiceStatus.CANCELLED) {
            throw new BusinessRuleException("INVALID_REQUEST_STATE", "Không thể phân công yêu cầu đã kết thúc");
        }
        if (sr.getRequesterId().equals(request.assigneeId())) {
            throw new BusinessRuleException("INVALID_REQUEST_STATE", "Người gửi không được tự xử lý yêu cầu của mình");
        }

        User assignee = userRepository.findById(request.assigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Không tìm thấy người xử lý"));

        if (assignee.getStatus() != com.worksphere.identity.domain.UserStatus.ACTIVE || assignee.isDeleted()) {
            throw new BusinessRuleException("USER_INACTIVE", "Người xử lý đang không ở trạng thái hoạt động");
        }

        Optional<ServiceAssignment> activeAssignmentOpt = assignmentRepository.findByRequestIdAndActiveTrue(requestId);
        if (activeAssignmentOpt.isPresent() && activeAssignmentOpt.get().getAssigneeId().equals(request.assigneeId())) {
            return;
        }

        if (activeAssignmentOpt.isPresent()) {
            ServiceAssignment old = activeAssignmentOpt.get();
            old.deactivate(clock.instant());
            assignmentRepository.saveAndFlush(old);
        }

        ServiceAssignment newAssignment = ServiceAssignment.create(
                UUID.randomUUID(),
                requestId,
                request.assigneeId(),
                principal.userId(),
                clock.instant()
        );

        try {
            assignmentRepository.saveAndFlush(newAssignment);
            eventDispatcher.onServiceRequestAssigned(requestId, newAssignment.getId(), request.assigneeId(), principal.userId(), sr.getTitle());
        } catch (DataIntegrityViolationException ex) {
            handleAssignmentConflict(ex);
        }

        if (sr.getStatus() == ServiceStatus.OPEN) {
            sr.transitionStatus(ServiceStatus.ASSIGNED, principal.userId(), clock.instant());
            requestRepository.save(sr);

            ServiceStatusHistory history = ServiceStatusHistory.create(
                    UUID.randomUUID(),
                    requestId,
                    ServiceStatus.OPEN,
                    ServiceStatus.ASSIGNED,
                    "Phân công người xử lý: " + assignee.getFullName(),
                    principal.userId(),
                    clock.instant()
            );
            historyRepository.save(history);
        }
    }

    @Transactional
    public void updateStatus(UUID requestId, UpdateServiceRequestStatusRequest request, WorkSphereUserPrincipal principal) {
        ServiceRequest sr = requestRepository.findByIdAndDeletedFalse(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu dịch vụ"));

        boolean isAdmin = hasSystemAdminRole(principal);
        boolean isActiveAssignee = assignmentRepository.existsByRequestIdAndAssigneeIdAndActiveTrue(requestId, principal.userId());

        boolean isRequester = sr.getRequesterId().equals(principal.userId());
        if (!isAdmin && !isActiveAssignee && !isRequester) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật trạng thái yêu cầu này");
        }

        if (sr.getStatus() == ServiceStatus.CLOSED) {
            throw new BusinessRuleException("SERVICE_ALREADY_CLOSED", "Yêu cầu đã đóng, không thể thay đổi trạng thái");
        }

        if (sr.getStatus() == ServiceStatus.CANCELLED) {
            throw new BusinessRuleException("SERVICE_ALREADY_CANCELLED", "Yêu cầu đã huỷ, không thể thay đổi trạng thái");
        }

        if (!sr.getStatus().canTransitionTo(request.status())) {
            throw new BusinessRuleException(
                    "SERVICE_STATUS_TRANSITION_INVALID",
                    "Chuyển đổi trạng thái không hợp lệ từ " + sr.getStatus() + " sang " + request.status()
            );
        }

        if (!accessPolicy.canTransition(sr.getStatus(), request.status(), isRequester, isActiveAssignee, isAdmin)) {
            throw new AccessDeniedException("Bạn không có quyền thực hiện bước này trong quy trình hỗ trợ");
        }

        if (request.status() == ServiceStatus.RESOLVED) {
            if (request.comment() == null || request.comment().trim().isEmpty()) {
                throw new BusinessRuleException("SERVICE_RESOLUTION_REQUIRED", "Cần cập nhật giải pháp xử lý khi hoàn tất yêu cầu");
            }
        }

        if (request.status() == ServiceStatus.ASSIGNED) {
            boolean hasAssignee = assignmentRepository.findByRequestIdAndActiveTrue(requestId).isPresent();
            if (!hasAssignee) {
                throw new BusinessRuleException("SERVICE_ASSIGNEE_REQUIRED", "Yêu cầu cần có người xử lý trước khi chuyển sang trạng thái ASSIGNED");
            }
        }

        if (!sr.getVersion().equals(request.version())) {
            throw new BusinessRuleException("OPTIMISTIC_LOCK_CONFLICT", "Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.");
        }

        ServiceStatus oldStatus = sr.getStatus();
        sr.transitionStatus(request.status(), principal.userId(), clock.instant());
        requestRepository.save(sr);

        ServiceStatusHistory history = ServiceStatusHistory.create(
                UUID.randomUUID(),
                requestId,
                oldStatus,
                request.status(),
                request.comment() != null ? request.comment().trim() : null,
                principal.userId(),
                clock.instant()
        );
        historyRepository.save(history);
        eventDispatcher.onServiceRequestStatusChanged(requestId, history.getId(), request.status(), principal.userId(), sr.getTitle(), sr.getRequesterId());
    }

    @Transactional
    public ServiceRequestDetailResponse rejectResolution(UUID requestId, RejectResolutionRequest request, WorkSphereUserPrincipal principal) {
        ServiceRequest sr = requestRepository.findByIdAndDeletedFalse(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu dịch vụ"));

        if (!sr.getRequesterId().equals(principal.userId())) {
            throw new BusinessRuleException(
                    "SERVICE_RESOLUTION_REJECTION_FORBIDDEN",
                    "Chỉ người tạo yêu cầu mới có quyền từ chối kết quả xử lý"
            );
        }

        if (sr.getStatus() == ServiceStatus.CLOSED) {
            throw new BusinessRuleException("SERVICE_ALREADY_CLOSED", "Yêu cầu đã đóng, không thể từ chối kết quả");
        }

        if (sr.getStatus() == ServiceStatus.CANCELLED) {
            throw new BusinessRuleException("SERVICE_ALREADY_CANCELLED", "Yêu cầu đã huỷ, không thể từ chối kết quả");
        }

        if (sr.getStatus() != ServiceStatus.RESOLVED) {
            throw new BusinessRuleException("SERVICE_NOT_RESOLVED", "Yêu cầu chưa ở trạng thái RESOLVED");
        }

        if (request.reason() == null || request.reason().trim().isEmpty()) {
            throw new BusinessRuleException("VALIDATION_ERROR", "Lý do từ chối không được để trống");
        }

        if (!sr.getVersion().equals(request.version())) {
            throw new BusinessRuleException("OPTIMISTIC_LOCK_CONFLICT", "Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.");
        }

        sr.transitionStatus(ServiceStatus.IN_PROGRESS, principal.userId(), clock.instant());
        requestRepository.save(sr);

        ServiceStatusHistory history = ServiceStatusHistory.create(
                UUID.randomUUID(),
                requestId,
                ServiceStatus.RESOLVED,
                ServiceStatus.IN_PROGRESS,
                request.reason().trim(),
                principal.userId(),
                clock.instant()
        );
        historyRepository.save(history);

        // Side effect notification deferred per canonical and prompt instruction
        log.info("NOTIFICATION_SIDE_EFFECT_DEFERRED: Service Request {} resolution rejected by {}", requestId, principal.userId());

        return getRequestDetail(requestId, principal);
    }

    @Transactional(readOnly = true)
    public PagedData<ServiceCommentResponse> getComments(UUID requestId, Pageable pageable, WorkSphereUserPrincipal principal) {
        ServiceRequest sr = requestRepository.findByIdAndDeletedFalse(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu dịch vụ"));

        verifyRequestAccess(sr, principal);

        boolean includeInternal = hasSystemAdminRole(principal)
                || assignmentRepository.existsByRequestIdAndAssigneeIdAndActiveTrue(requestId, principal.userId());

        Page<ServiceComment> commentPage = includeInternal
                ? commentRepository.findAllByRequestIdAndDeletedFalse(requestId, pageable)
                : commentRepository.findAllByRequestIdAndInternalFalseAndDeletedFalse(requestId, pageable);

        if (commentPage.isEmpty()) {
            return PagedData.from(commentPage, Collections.emptyList());
        }

        Set<UUID> authorIds = commentPage.getContent().stream().map(ServiceComment::getAuthorId).collect(Collectors.toSet());
        Map<UUID, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<ServiceCommentResponse> responses = commentPage.getContent().stream().map(c -> {
            User author = authorMap.get(c.getAuthorId());
            return new ServiceCommentResponse(
                    c.getId(),
                    c.getRequestId(),
                    c.getAuthorId(),
                    author != null ? author.getFullName() : null,
                    c.getContent(),
                    c.isInternal(),
                    c.isEdited(),
                    c.getEditedAt(),
                    c.getCreatedAt(),
                    c.getUpdatedAt()
            );
        }).toList();

        return PagedData.from(commentPage, responses);
    }

    @Transactional
    public ServiceCommentResponse createComment(UUID requestId, CreateServiceCommentRequest request, WorkSphereUserPrincipal principal) {
        ServiceRequest sr = requestRepository.findByIdAndDeletedFalse(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu dịch vụ"));

        verifyRequestAccess(sr, principal);

        boolean isInternal = Boolean.TRUE.equals(request.isInternal());
        boolean canCreateInternal = hasSystemAdminRole(principal)
                || assignmentRepository.existsByRequestIdAndAssigneeIdAndActiveTrue(requestId, principal.userId());

        if (isInternal && !canCreateInternal) {
            throw new AccessDeniedException("Người tạo yêu cầu không có quyền tạo ghi chú nội bộ");
        }

        validateAttachmentFiles(request.attachmentFileIds(), principal);
        attachFiles(requestId, request.attachmentFileIds());

        ServiceComment comment = ServiceComment.create(
                UUID.randomUUID(),
                requestId,
                principal.userId(),
                request.content().trim(),
                isInternal,
                clock.instant()
        );
        ServiceComment saved = commentRepository.save(comment);

        UUID activeAssigneeId = assignmentRepository.findByRequestIdAndActiveTrue(requestId)
                .map(ServiceAssignment::getAssigneeId)
                .orElse(null);
        eventDispatcher.onServiceRequestCommentAdded(
                requestId,
                saved.getId(),
                principal.userId(),
                sr.getTitle(),
                sr.getRequesterId(),
                saved.isInternal(),
                activeAssigneeId
        );

        User author = userRepository.findById(principal.userId()).orElse(null);
        return new ServiceCommentResponse(
                saved.getId(),
                saved.getRequestId(),
                saved.getAuthorId(),
                author != null ? author.getFullName() : null,
                saved.getContent(),
                saved.isInternal(),
                saved.isEdited(),
                saved.getEditedAt(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }

    @Transactional
    public ServiceRatingResponse rateRequest(UUID requestId, CreateServiceRatingRequest request, WorkSphereUserPrincipal principal) {
        ServiceRequest sr = requestRepository.findByIdAndDeletedFalse(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu dịch vụ"));

        if (!sr.getRequesterId().equals(principal.userId())) {
            throw new BusinessRuleException(
                    "SERVICE_RATING_FORBIDDEN",
                    "Chỉ người tạo yêu cầu mới có quyền đánh giá chất lượng dịch vụ"
            );
        }

        if (sr.getStatus() != ServiceStatus.CLOSED) {
            throw new BusinessRuleException("SERVICE_NOT_CLOSED", "Chỉ có thể đánh giá yêu cầu dịch vụ khi đã ở trạng thái CLOSED");
        }

        if (ratingRepository.existsByRequestId(requestId)) {
            throw new BusinessRuleException("SERVICE_RATING_ALREADY_EXISTS", "Yêu cầu dịch vụ này đã được đánh giá trước đó");
        }

        ServiceRating rating = ServiceRating.create(
                UUID.randomUUID(),
                requestId,
                principal.userId(),
                request.score(),
                request.comment() != null ? request.comment().trim() : null,
                clock.instant()
        );

        try {
            ratingRepository.saveAndFlush(rating);
        } catch (DataIntegrityViolationException ex) {
            handleRatingConflict(ex);
        }

        User rater = userRepository.findById(principal.userId()).orElse(null);
        return new ServiceRatingResponse(
                rating.getId(),
                rating.getRequestId(),
                rating.getRatedBy(),
                rater != null ? rater.getFullName() : null,
                rating.getScore(),
                rating.getComment(),
                rating.getCreatedAt()
        );
    }

    private void validateAttachmentFiles(List<UUID> fileIds, WorkSphereUserPrincipal principal) {
        if (fileIds == null || fileIds.isEmpty()) {
            return;
        }

        Set<UUID> uniqueFileIds = new HashSet<>(fileIds);
        if (uniqueFileIds.size() != fileIds.size()) {
            throw new BusinessRuleException("VALIDATION_ERROR", "Danh sách tệp đính kèm chứa mã tệp trùng lặp");
        }

        boolean isAdmin = hasSystemAdminRole(principal);

        for (UUID fileId : fileIds) {
            StoredFile file = storedFileRepository.findById(fileId)
                    .orElseThrow(() -> new ResourceNotFoundException("FILE_NOT_FOUND", "Tệp đính kèm không tồn tại: " + fileId));

            if (file.getStatus() != StoredFileStatus.ACTIVE) {
                throw new BusinessRuleException("FILE_NOT_FOUND", "Tệp đính kèm không còn hoạt động hoặc đã bị xoá");
            }

            if (!file.getStoragePath().startsWith("SERVICE_ATTACHMENT/")) {
                throw new BusinessRuleException("FILE_TYPE_NOT_ALLOWED", "Mục đích sử dụng của tệp không phải là SERVICE_ATTACHMENT");
            }

            if (!isAdmin && !file.getUploadedBy().equals(principal.userId())) {
                throw new BusinessRuleException("FILE_ACCESS_DENIED", "Bạn chỉ có thể đính kèm tệp do chính mình tải lên");
            }

            if (attachmentRepository.existsByFileId(fileId)) {
                throw new BusinessRuleException("VALIDATION_ERROR", "Tệp đã được đính kèm vào một yêu cầu dịch vụ khác");
            }
        }
    }

    private void attachFiles(UUID requestId, List<UUID> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) {
            return;
        }
        for (UUID fileId : fileIds) {
            StoredFile file = storedFileRepository.findById(fileId).orElseThrow();
            ServiceAttachment attachment = ServiceAttachment.create(
                    UUID.randomUUID(),
                    requestId,
                    fileId,
                    file.getUploadedBy(),
                    clock.instant()
            );
            attachmentRepository.save(attachment);
        }
    }

    private List<ServiceAttachmentResponse> buildAttachmentResponses(List<ServiceAttachment> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return Collections.emptyList();
        }

        List<ServiceAttachmentResponse> responses = new ArrayList<>();
        for (ServiceAttachment att : attachments) {
            StoredFile file = storedFileRepository.findById(att.getFileId()).orElse(null);
            if (file != null && file.getStatus() == StoredFileStatus.ACTIVE) {
                responses.add(new ServiceAttachmentResponse(
                        file.getId(),
                        file.getOriginalName(),
                        file.getMimeType(),
                        file.getSizeBytes(),
                        "/api/v1/files/" + file.getId() + "/download",
                        att.getUploadedBy(),
                        att.getCreatedAt()
                ));
            }
        }
        return responses;
    }

    private void verifyRequestAccess(ServiceRequest request, WorkSphereUserPrincipal principal) {
        if (hasSystemAdminRole(principal)) {
            return;
        }

        if (request.getRequesterId().equals(principal.userId())) {
            return;
        }

        boolean isAssignee = assignmentRepository.existsByRequestIdAndAssigneeIdAndActiveTrue(
                request.getId(), principal.userId()
        );
        if (isAssignee) {
            return;
        }

        throw new AccessDeniedException("Bạn không có quyền truy cập yêu cầu dịch vụ này");
    }

    private Set<String> computeAllowedActions(ServiceRequest request, WorkSphereUserPrincipal principal, boolean hasActiveAssignee) {
        Set<String> actions = new HashSet<>();
        boolean isAdmin = hasSystemAdminRole(principal);
        boolean isRequester = request.getRequesterId().equals(principal.userId());
        boolean isActiveAssignee = assignmentRepository.existsByRequestIdAndAssigneeIdAndActiveTrue(
                request.getId(), principal.userId()
        );

        if (isAdmin && request.getStatus() != ServiceStatus.CLOSED && request.getStatus() != ServiceStatus.CANCELLED) {
            actions.add("ASSIGN");
        }

        if (isRequester) {
            if (request.getStatus() == ServiceStatus.OPEN) {
                actions.add("UPDATE");
                if (accessPolicy.canTransition(request.getStatus(), ServiceStatus.CANCELLED, isRequester, isActiveAssignee, isAdmin)) {
                    actions.add("CANCEL");
                }
            } else if (request.getStatus() == ServiceStatus.RESOLVED) {
                actions.add("REJECT_RESOLUTION");
                if (accessPolicy.canTransition(request.getStatus(), ServiceStatus.CLOSED, isRequester, isActiveAssignee, isAdmin)) {
                    actions.add("CONFIRM");
                }
            } else if (request.getStatus() == ServiceStatus.CLOSED) {
                if (!ratingRepository.existsByRequestId(request.getId())) {
                    actions.add("RATE");
                }
            }
        }

        if (isAdmin || isActiveAssignee) {
            switch (request.getStatus()) {
                case ASSIGNED -> actions.add("START");
                case IN_PROGRESS -> {
                    actions.add("WAIT_FOR_USER");
                    actions.add("RESOLVE");
                }
                case WAITING_FOR_USER -> actions.add("RESUME");
                default -> {}
            }
        }

        if (isAdmin || isRequester || isActiveAssignee) {
            actions.add("COMMENT");
        }

        return actions;
    }

    private void handleAssignmentConflict(DataIntegrityViolationException ex) {
        Throwable cause = ex.getCause();
        while (cause != null) {
            if (cause instanceof SQLException sqlEx) {
                if ("23505".equals(sqlEx.getSQLState())
                        && sqlEx.getMessage() != null
                        && sqlEx.getMessage().contains("uk_service_assignments_one_active")) {
                    throw new BusinessRuleException(
                            "SERVICE_ASSIGNMENT_CONFLICT",
                            "Yêu cầu dịch vụ đang được phân công đồng thời hoặc trạng thái phân công đã thay đổi. Vui lòng tải lại dữ liệu và thử lại."
                    );
                }
            }
            cause = cause.getCause();
        }
        throw ex;
    }

    private void handleRatingConflict(DataIntegrityViolationException ex) {
        Throwable cause = ex.getCause();
        while (cause != null) {
            if (cause instanceof SQLException sqlEx) {
                if ("23505".equals(sqlEx.getSQLState())
                        && sqlEx.getMessage() != null
                        && (sqlEx.getMessage().contains("service_ratings_request_id_key")
                                || (sqlEx.getMessage().contains("service_ratings") && sqlEx.getMessage().contains("request_id")))) {
                    throw new BusinessRuleException(
                            "SERVICE_RATING_ALREADY_EXISTS",
                            "Yêu cầu dịch vụ này đã được đánh giá trước đó"
                    );
                }
            }
            cause = cause.getCause();
        }
        throw ex;
    }

    private void validateAssetForRequest(UUID assetId, WorkSphereUserPrincipal principal) {
        if (!assetRepository.existsById(assetId)
                || !assetRepository.findByIdAndDeletedFalse(assetId).isPresent()) {
            throw new ResourceNotFoundException("ASSET_NOT_FOUND", "Không tìm thấy tài sản liên kết");
        }

        if (hasSystemAdminRole(principal)) {
            return;
        }

        boolean isAssignedToCaller = assetAssignmentRepository.existsByAssetIdAndAssignedToAndStatus(
                assetId, principal.userId(), AssetAssignmentStatus.ACTIVE
        );
        if (!isAssignedToCaller) {
            throw new BusinessRuleException("ASSET_ACCESS_DENIED",
                    "Bạn chỉ được gắn tài sản đang được cấp phát cho chính mình");
        }
    }

    private boolean hasSystemAdminRole(WorkSphereUserPrincipal principal) {
        if (principal == null || principal.user() == null || principal.user().getRoles() == null) {
            return false;
        }
        return principal.user().getRoles().stream()
                .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getCode()));
    }
}
