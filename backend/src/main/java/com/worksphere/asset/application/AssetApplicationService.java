package com.worksphere.asset.application;

import com.worksphere.asset.api.request.AssignAssetRequest;
import com.worksphere.asset.api.request.CreateAssetRepairHistoryRequest;
import com.worksphere.asset.api.request.CreateAssetRequest;
import com.worksphere.asset.api.request.ReturnAssetRequest;
import com.worksphere.asset.api.request.UpdateAssetRequest;
import com.worksphere.asset.api.response.AssetAssignmentResponse;
import com.worksphere.asset.api.response.AssetDetailResponse;
import com.worksphere.asset.api.response.AssetRepairHistoryResponse;
import com.worksphere.asset.api.response.AssetSummaryResponse;
import com.worksphere.asset.domain.Asset;
import com.worksphere.asset.domain.AssetAssignment;
import com.worksphere.asset.domain.AssetAssignmentStatus;
import com.worksphere.asset.domain.AssetCategory;
import com.worksphere.asset.domain.AssetRepairHistory;
import com.worksphere.asset.domain.AssetStatus;
import com.worksphere.asset.infrastructure.persistence.AssetAssignmentRepository;
import com.worksphere.asset.infrastructure.persistence.AssetCategoryRepository;
import com.worksphere.asset.infrastructure.persistence.AssetRepairHistoryRepository;
import com.worksphere.asset.infrastructure.persistence.AssetRepository;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.service_request.domain.ServiceAssignment;
import com.worksphere.service_request.domain.ServiceRequest;
import com.worksphere.service_request.infrastructure.persistence.ServiceRequestRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.lang.reflect.Method;
import java.sql.SQLException;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for managing Assets, Assignments, and Repair Histories.
 * Per 06_API_CONTRACT.md section 14 and D-046.
 */
@Service
public class AssetApplicationService {

    private static final Logger log = LoggerFactory.getLogger(AssetApplicationService.class);

    private final AssetRepository assetRepository;
    private final AssetCategoryRepository categoryRepository;
    private final AssetAssignmentRepository assignmentRepository;
    private final AssetRepairHistoryRepository repairHistoryRepository;
    private final UserRepository userRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final Clock clock;
    private final com.worksphere.notification.application.NotificationEventDispatcher eventDispatcher;

    public AssetApplicationService(
            AssetRepository assetRepository,
            AssetCategoryRepository categoryRepository,
            AssetAssignmentRepository assignmentRepository,
            AssetRepairHistoryRepository repairHistoryRepository,
            UserRepository userRepository,
            ServiceRequestRepository serviceRequestRepository,
            Clock clock,
            com.worksphere.notification.application.NotificationEventDispatcher eventDispatcher
    ) {
        this.assetRepository = assetRepository;
        this.categoryRepository = categoryRepository;
        this.assignmentRepository = assignmentRepository;
        this.repairHistoryRepository = repairHistoryRepository;
        this.userRepository = userRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.clock = clock;
        this.eventDispatcher = eventDispatcher;
    }

    @Transactional(readOnly = true)
    public PagedData<AssetSummaryResponse> getAssets(
            Pageable pageable,
            String search,
            UUID categoryId,
            AssetStatus status,
            UUID assignedTo,
            WorkSphereUserPrincipal principal
    ) {
        Specification<Asset> spec = buildAssetSpecification(search, categoryId, status, assignedTo, principal, false);
        return executeSummaryQuery(spec, pageable);
    }

    @Transactional(readOnly = true)
    public PagedData<AssetSummaryResponse> getMyAssets(
            Pageable pageable,
            String search,
            UUID categoryId,
            AssetStatus status,
            WorkSphereUserPrincipal principal
    ) {
        Specification<Asset> spec = buildAssetSpecification(search, categoryId, status, null, principal, true);
        return executeSummaryQuery(spec, pageable);
    }

    @Transactional(readOnly = true)
    public AssetDetailResponse getAssetDetail(UUID id, WorkSphereUserPrincipal principal) {
        Asset asset = assetRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_NOT_FOUND", "Không tìm thấy tài sản"));

        boolean isAdmin = hasSystemAdminRole(principal);
        boolean isActiveAssignee = assignmentRepository.existsByAssetIdAndAssignedToAndStatus(
                id, principal.userId(), AssetAssignmentStatus.ACTIVE
        );

        if (!isAdmin && !isActiveAssignee) {
            throw new BusinessRuleException("ASSET_ACCESS_DENIED", "Bạn không có quyền truy cập tài sản này");
        }

        AssetCategory category = categoryRepository.findById(asset.getCategoryId()).orElse(null);
        AssetDetailResponse.CategoryBrief categoryBrief = category != null
                ? new AssetDetailResponse.CategoryBrief(category.getId(), category.getCode(), category.getName())
                : null;

        Optional<AssetAssignment> activeAssignment = assignmentRepository.findFirstByAssetIdAndStatus(
                id, AssetAssignmentStatus.ACTIVE
        );

        AssetDetailResponse.AssignmentBrief assignmentBrief = null;
        if (activeAssignment.isPresent()) {
            AssetAssignment aa = activeAssignment.get();
            User assigneeUser = userRepository.findById(aa.getAssignedTo()).orElse(null);
            User assignerUser = userRepository.findById(aa.getAssignedBy()).orElse(null);
            assignmentBrief = new AssetDetailResponse.AssignmentBrief(
                    aa.getId(),
                    assigneeUser != null
                            ? new AssetDetailResponse.UserBrief(assigneeUser.getId(), assigneeUser.getFullName())
                            : new AssetDetailResponse.UserBrief(aa.getAssignedTo(), "Unknown"),
                    assignerUser != null
                            ? new AssetDetailResponse.UserBrief(assignerUser.getId(), assignerUser.getFullName())
                            : new AssetDetailResponse.UserBrief(aa.getAssignedBy(), "Unknown"),
                    aa.getAssignedAt(),
                    aa.getExpectedReturnAt(),
                    aa.getNotes()
            );
        }

        List<AssetRepairHistoryResponse> repairHistories = repairHistoryRepository
                .findByAssetIdOrderByStartedAtDesc(id).stream()
                .map(this::toRepairHistoryResponse)
                .toList();

        List<AssetDetailResponse.ServiceRequestBrief> relatedServiceRequests = Collections.emptyList();
        // Populate service requests if repository supports finding by assetId
        Specification<ServiceRequest> srSpec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.isFalse(root.get("deleted")));
            preds.add(cb.equal(root.get("assetId"), id));
            if (!isAdmin) {
                UUID callerId = principal.userId();
                Subquery<Integer> sub = query.subquery(Integer.class);
                Root<ServiceAssignment> sa = sub.from(ServiceAssignment.class);
                sub.select(cb.literal(1))
                        .where(
                                cb.equal(sa.get("requestId"), root.get("id")),
                                cb.equal(sa.get("assigneeId"), callerId),
                                cb.isTrue(sa.get("active"))
                        );
                preds.add(cb.or(
                        cb.equal(root.get("requesterId"), callerId),
                        cb.exists(sub)
                ));
            }
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(preds.toArray(new Predicate[0]));
        };
        relatedServiceRequests = serviceRequestRepository.findAll(srSpec).stream()
                .map(sr -> new AssetDetailResponse.ServiceRequestBrief(
                        sr.getId(),
                        sr.getRequestNumber(),
                        sr.getTitle(),
                        sr.getStatus().name()
                ))
                .toList();

        return new AssetDetailResponse(
                asset.getId(),
                asset.getAssetCode(),
                asset.getName(),
                categoryBrief,
                asset.getDescription(),
                asset.getSerialNumber(),
                asset.getManufacturer(),
                asset.getModel(),
                asset.getPurchaseDate(),
                asset.getPurchasePrice(),
                asset.getStatus(),
                asset.getLocation(),
                asset.getWarrantyEndDate(),
                assignmentBrief,
                repairHistories,
                relatedServiceRequests,
                asset.getCreatedAt(),
                asset.getUpdatedAt(),
                asset.getVersion()
        );
    }

    @Transactional
    public AssetDetailResponse createAsset(CreateAssetRequest request, WorkSphereUserPrincipal principal) {
        String normalizedCode = request.assetCode().trim().toUpperCase();
        if (!normalizedCode.matches("^[A-Z0-9][A-Z0-9_-]{1,49}$")) {
            throw new BusinessRuleException("BAD_REQUEST",
                    "Mã tài sản phải bắt đầu bằng chữ hoa hoặc số, chỉ chứa chữ hoa, số, gạch ngang và gạch dưới (2-50 ký tự)");
        }

        if (assetRepository.existsByAssetCode(normalizedCode)) {
            throw new BusinessRuleException("ASSET_CODE_ALREADY_EXISTS", "Mã tài sản đã tồn tại trong hệ thống");
        }

        String serialNumber = request.serialNumber() != null && !request.serialNumber().isBlank()
                ? request.serialNumber().trim()
                : null;
        if (serialNumber != null && assetRepository.existsBySerialNumber(serialNumber)) {
            throw new BusinessRuleException("ASSET_SERIAL_ALREADY_EXISTS", "Số serial đã tồn tại trong hệ thống");
        }

        AssetCategory category = categoryRepository.findByIdAndDeletedFalse(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_CATEGORY_NOT_FOUND",
                        "Không tìm thấy loại tài sản"));

        if (!category.isActive()) {
            throw new BusinessRuleException("ASSET_CATEGORY_ALREADY_INACTIVE",
                    "Loại tài sản đang dừng hoạt động");
        }

        Asset asset = Asset.create(
                UUID.randomUUID(),
                normalizedCode,
                request.categoryId(),
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                serialNumber,
                request.manufacturer() != null ? request.manufacturer().trim() : null,
                request.model() != null ? request.model().trim() : null,
                request.purchaseDate(),
                request.purchasePrice(),
                request.warrantyEndDate(),
                request.location() != null ? request.location().trim() : null,
                principal.userId(),
                clock.instant()
        );

        try {
            Asset saved = assetRepository.saveAndFlush(asset);
            return getAssetDetail(saved.getId(), principal);
        } catch (DataIntegrityViolationException ex) {
            handleAssetDataIntegrityViolation(ex);
            throw ex;
        }
    }

    @Transactional
    public AssetDetailResponse updateAsset(UUID id, UpdateAssetRequest request, WorkSphereUserPrincipal principal) {
        Asset asset = assetRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_NOT_FOUND", "Không tìm thấy tài sản"));

        if (request.categoryId() != null && !request.categoryId().equals(asset.getCategoryId())) {
            AssetCategory category = categoryRepository.findByIdAndDeletedFalse(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("ASSET_CATEGORY_NOT_FOUND",
                            "Không tìm thấy loại tài sản"));
            if (!category.isActive()) {
                throw new BusinessRuleException("ASSET_CATEGORY_ALREADY_INACTIVE",
                        "Loại tài sản đang dừng hoạt động");
            }
        }

        String serialNumber = request.serialNumber() != null && !request.serialNumber().isBlank()
                ? request.serialNumber().trim()
                : null;
        if (serialNumber != null && assetRepository.existsBySerialNumberAndIdNot(serialNumber, id)) {
            throw new BusinessRuleException("ASSET_SERIAL_ALREADY_EXISTS", "Số serial đã tồn tại trong hệ thống");
        }

        if (request.status() != null && request.status() != asset.getStatus()) {
            if (asset.getStatus() == AssetStatus.ASSIGNED) {
                if (assignmentRepository.existsByAssetIdAndStatus(id, AssetAssignmentStatus.ACTIVE)) {
                    throw new BusinessRuleException("ASSET_STATUS_TRANSITION_INVALID",
                            "Tài sản đang có phân công hoạt động, không thể thay đổi trạng thái qua cập nhật chung");
                }
            }
        }

        asset.update(
                request.categoryId(),
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                serialNumber,
                request.manufacturer() != null ? request.manufacturer().trim() : null,
                request.model() != null ? request.model().trim() : null,
                request.purchaseDate(),
                request.purchasePrice(),
                request.warrantyEndDate(),
                request.status(),
                request.location() != null ? request.location().trim() : null,
                principal.userId(),
                clock.instant()
        );

        try {
            Asset saved = assetRepository.saveAndFlush(asset);
            return getAssetDetail(saved.getId(), principal);
        } catch (DataIntegrityViolationException ex) {
            handleAssetDataIntegrityViolation(ex);
            throw ex;
        }
    }

    @Transactional
    public AssetAssignmentResponse assignAsset(
            UUID id,
            AssignAssetRequest request,
            WorkSphereUserPrincipal principal
    ) {
        Asset asset = assetRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_NOT_FOUND", "Không tìm thấy tài sản"));

        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            if (assignmentRepository.existsByAssetIdAndStatus(id, AssetAssignmentStatus.ACTIVE)) {
                throw new BusinessRuleException("ASSET_ALREADY_ASSIGNED",
                        "Tài sản đã được cấp phát cho người dùng khác");
            }
            throw new BusinessRuleException("ASSET_NOT_AVAILABLE",
                    "Tài sản không ở trạng thái sẵn sàng để cấp phát");
        }

        if (assignmentRepository.existsByAssetIdAndStatus(id, AssetAssignmentStatus.ACTIVE)) {
            throw new BusinessRuleException("ASSET_ALREADY_ASSIGNED",
                    "Tài sản đã có phân công đang hoạt động");
        }

        User targetUser = userRepository.findById(request.assignedTo())
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND",
                        "Không tìm thấy người nhận bàn giao"));

        if (targetUser.getStatus() != UserStatus.ACTIVE || targetUser.isDeleted()) {
            throw new BusinessRuleException("USER_NOT_ACTIVE", "Người nhận bàn giao đang dừng hoạt động");
        }

        AssetAssignment assignment = AssetAssignment.create(
                UUID.randomUUID(),
                id,
                request.assignedTo(),
                principal.userId(),
                clock.instant(),
                request.expectedReturnAt(),
                request.notes() != null ? request.notes().trim() : null,
                clock.instant()
        );

        asset.assign(principal.userId(), clock.instant());

        try {
            AssetAssignment saved = assignmentRepository.saveAndFlush(assignment);
            assetRepository.saveAndFlush(asset);
            eventDispatcher.onAssetAssigned(
                    asset.getId(),
                    saved.getId(),
                    request.assignedTo(),
                    principal.userId(),
                    asset.getName(),
                    asset.getAssetCode()
            );
            return toAssignmentResponse(saved, targetUser, principal.user());
        } catch (DataIntegrityViolationException ex) {
            handleAssignmentConflict(ex);
            throw ex;
        }
    }

    @Transactional
    public AssetAssignmentResponse returnAsset(
            UUID id,
            UUID assignmentId,
            ReturnAssetRequest request,
            WorkSphereUserPrincipal principal
    ) {
        Asset asset = assetRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_NOT_FOUND", "Không tìm thấy tài sản"));

        AssetAssignment assignment = assignmentRepository.findByIdAndAssetId(assignmentId, id)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_ASSIGNMENT_NOT_FOUND",
                        "Không tìm thấy thông tin phân công của tài sản này"));

        if (assignment.getStatus() != AssetAssignmentStatus.ACTIVE) {
            throw new BusinessRuleException("ASSET_ASSIGNMENT_NOT_ACTIVE",
                    "Phân công không ở trạng thái hoạt động");
        }

        AssetStatus resultingStatus = request.resultingAssetStatus();
        if (resultingStatus == AssetStatus.ASSIGNED) {
            throw new BusinessRuleException("ASSET_STATUS_TRANSITION_INVALID",
                    "Không thể chọn trạng thái ASSIGNED khi trả tài sản");
        }

        assignment.markReturned(
                request.returnCondition() != null ? request.returnCondition().trim() : null,
                clock.instant()
        );
        asset.returnAsset(resultingStatus, principal.userId(), clock.instant());

        AssetAssignment saved = assignmentRepository.saveAndFlush(assignment);
        assetRepository.saveAndFlush(asset);

        User assignee = userRepository.findById(saved.getAssignedTo()).orElse(null);
        User assigner = userRepository.findById(saved.getAssignedBy()).orElse(null);
        return toAssignmentResponse(saved, assignee, assigner);
    }

    @Transactional
    public AssetRepairHistoryResponse createRepairHistory(
            UUID assetId,
            CreateAssetRepairHistoryRequest request,
            WorkSphereUserPrincipal principal
    ) {
        Asset asset = assetRepository.findByIdAndDeletedFalse(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_NOT_FOUND", "Không tìm thấy tài sản"));

        if (request.serviceRequestId() != null) {
            ServiceRequest sr = serviceRequestRepository.findByIdAndDeletedFalse(request.serviceRequestId())
                    .orElseThrow(() -> new ResourceNotFoundException("SERVICE_REQUEST_NOT_FOUND",
                            "Không tìm thấy yêu cầu dịch vụ liên kết"));
            if (sr.getAssetId() != null && !sr.getAssetId().equals(assetId)) {
                throw new BusinessRuleException("ASSET_STATUS_TRANSITION_INVALID",
                        "Yêu cầu dịch vụ không thuộc về tài sản này");
            }
        }

        if (request.completedAt() != null && request.completedAt().isBefore(request.startedAt())) {
            throw new BusinessRuleException("ASSET_STATUS_TRANSITION_INVALID",
                    "Thời gian hoàn thành phải lớn hơn hoặc bằng thời gian bắt đầu");
        }

        AssetRepairHistory history = AssetRepairHistory.create(
                UUID.randomUUID(),
                assetId,
                request.serviceRequestId(),
                request.repairType(),
                request.description().trim(),
                request.vendorName() != null ? request.vendorName().trim() : null,
                request.cost(),
                request.startedAt(),
                request.completedAt(),
                request.result() != null ? request.result().trim() : null,
                principal.userId(),
                clock.instant()
        );

        AssetRepairHistory saved = repairHistoryRepository.saveAndFlush(history);
        return toRepairHistoryResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AssetRepairHistoryResponse> getRepairHistories(
            UUID assetId,
            WorkSphereUserPrincipal principal
    ) {
        Asset asset = assetRepository.findByIdAndDeletedFalse(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_NOT_FOUND", "Không tìm thấy tài sản"));

        boolean isAdmin = hasSystemAdminRole(principal);
        boolean isActiveAssignee = assignmentRepository.existsByAssetIdAndAssignedToAndStatus(
                assetId, principal.userId(), AssetAssignmentStatus.ACTIVE
        );

        if (!isAdmin && !isActiveAssignee) {
            throw new BusinessRuleException("ASSET_ACCESS_DENIED",
                    "Bạn không có quyền xem lịch sử sửa chữa của tài sản này");
        }

        return repairHistoryRepository.findByAssetIdOrderByStartedAtDesc(assetId).stream()
                .map(this::toRepairHistoryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public void validateAssetForServiceRequest(UUID assetId, WorkSphereUserPrincipal principal) {
        Asset asset = assetRepository.findByIdAndDeletedFalse(assetId)
                .orElseThrow(() -> new BusinessRuleException("ASSET_NOT_FOUND", "Không tìm thấy tài sản"));

        if (hasSystemAdminRole(principal)) {
            return;
        }

        boolean isActiveAssignee = assignmentRepository.existsByAssetIdAndAssignedToAndStatus(
                assetId, principal.userId(), AssetAssignmentStatus.ACTIVE
        );
        if (!isActiveAssignee) {
            throw new BusinessRuleException("ASSET_ACCESS_DENIED",
                    "Bạn chỉ được gắn tài sản đang được cấp phát cho chính mình");
        }
    }

    private Specification<Asset> buildAssetSpecification(
            String search,
            UUID categoryId,
            AssetStatus status,
            UUID assignedTo,
            WorkSphereUserPrincipal principal,
            boolean forceMyAssets
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));

            boolean isAdmin = hasSystemAdminRole(principal);

            if (forceMyAssets || !isAdmin) {
                // Must be actively assigned to current user
                Subquery<Integer> subquery = query.subquery(Integer.class);
                Root<AssetAssignment> aaRoot = subquery.from(AssetAssignment.class);
                subquery.select(cb.literal(1))
                        .where(
                                cb.equal(aaRoot.get("assetId"), root.get("id")),
                                cb.equal(aaRoot.get("assignedTo"), principal.userId()),
                                cb.equal(aaRoot.get("status"), AssetAssignmentStatus.ACTIVE)
                        );
                predicates.add(cb.exists(subquery));
            } else if (assignedTo != null) {
                // Admin querying specific assignee
                Subquery<Integer> subquery = query.subquery(Integer.class);
                Root<AssetAssignment> aaRoot = subquery.from(AssetAssignment.class);
                subquery.select(cb.literal(1))
                        .where(
                                cb.equal(aaRoot.get("assetId"), root.get("id")),
                                cb.equal(aaRoot.get("assignedTo"), assignedTo),
                                cb.equal(aaRoot.get("status"), AssetAssignmentStatus.ACTIVE)
                        );
                predicates.add(cb.exists(subquery));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("assetCode")), pattern),
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("serialNumber")), pattern),
                        cb.like(cb.lower(root.get("manufacturer")), pattern),
                        cb.like(cb.lower(root.get("model")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private PagedData<AssetSummaryResponse> executeSummaryQuery(Specification<Asset> spec, Pageable pageable) {
        Page<Asset> page = assetRepository.findAll(spec, pageable);
        if (page.isEmpty()) {
            return PagedData.from(page, Collections.emptyList());
        }

        Set<UUID> assetIds = page.getContent().stream().map(Asset::getId).collect(Collectors.toSet());
        Set<UUID> categoryIds = page.getContent().stream().map(Asset::getCategoryId).collect(Collectors.toSet());

        Map<UUID, AssetCategory> categoryMap = categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(AssetCategory::getId, Function.identity()));

        Map<UUID, AssetAssignment> activeAssignmentMap = assignmentRepository
                .findByAssetIdInAndStatus(assetIds, AssetAssignmentStatus.ACTIVE).stream()
                .collect(Collectors.toMap(AssetAssignment::getAssetId, Function.identity(), (a, b) -> a));

        Set<UUID> userIds = activeAssignmentMap.values().stream()
                .map(AssetAssignment::getAssignedTo)
                .collect(Collectors.toSet());
        Map<UUID, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<AssetSummaryResponse> content = page.getContent().stream().map(asset -> {
            AssetCategory cat = categoryMap.get(asset.getCategoryId());
            AssetSummaryResponse.CategoryBrief catBrief = cat != null
                    ? new AssetSummaryResponse.CategoryBrief(cat.getId(), cat.getCode(), cat.getName())
                    : null;

            AssetAssignment assignment = activeAssignmentMap.get(asset.getId());
            AssetSummaryResponse.UserBrief assigneeBrief = null;
            Instant assignedAt = null;
            if (assignment != null) {
                User assigneeUser = userMap.get(assignment.getAssignedTo());
                assigneeBrief = assigneeUser != null
                        ? new AssetSummaryResponse.UserBrief(assigneeUser.getId(), assigneeUser.getFullName())
                        : new AssetSummaryResponse.UserBrief(assignment.getAssignedTo(), "Unknown");
                assignedAt = assignment.getAssignedAt();
            }

            return new AssetSummaryResponse(
                    asset.getId(),
                    asset.getAssetCode(),
                    asset.getName(),
                    catBrief,
                    asset.getSerialNumber(),
                    asset.getManufacturer(),
                    asset.getModel(),
                    asset.getStatus(),
                    asset.getLocation(),
                    asset.getWarrantyEndDate(),
                    assigneeBrief,
                    assignedAt,
                    asset.getVersion()
            );
        }).toList();

        return PagedData.from(page, content);
    }

    private void handleAssignmentConflict(DataIntegrityViolationException ex) {
        Throwable cause = ex.getCause();
        while (cause != null) {
            if (cause instanceof SQLException sqlEx) {
                if ("23505".equals(sqlEx.getSQLState())) {
                    String constraint = extractConstraintName(sqlEx);
                    if (constraint.contains("uk_asset_assignments_one_active")) {
                        throw new BusinessRuleException(
                                "ASSET_ASSIGNMENT_CONFLICT",
                                "Tài sản đang được cấp phát đồng thời hoặc trạng thái phân công đã thay đổi"
                        );
                    }
                }
            }
            cause = cause.getCause();
        }
    }

    private void handleAssetDataIntegrityViolation(DataIntegrityViolationException ex) {
        Throwable cause = ex.getCause();
        while (cause != null) {
            if (cause instanceof SQLException sqlEx) {
                String sqlState = sqlEx.getSQLState();
                if ("23505".equals(sqlState)) {
                    String constraint = extractConstraintName(sqlEx);
                    if (constraint.contains("uk_assets_asset_code")) {
                        throw new BusinessRuleException("ASSET_CODE_ALREADY_EXISTS",
                                "Mã tài sản đã tồn tại trong hệ thống");
                    }
                    if (constraint.contains("uk_assets_serial_number")) {
                        throw new BusinessRuleException("ASSET_SERIAL_ALREADY_EXISTS",
                                "Số serial đã tồn tại trong hệ thống");
                    }
                }
            }
            cause = cause.getCause();
        }
    }

    private String extractConstraintName(SQLException sqlEx) {
        try {
            Method getServerErrorMessage = sqlEx.getClass().getMethod("getServerErrorMessage");
            Object serverError = getServerErrorMessage.invoke(sqlEx);
            if (serverError != null) {
                Method getConstraint = serverError.getClass().getMethod("getConstraint");
                Object constraint = getConstraint.invoke(serverError);
                if (constraint != null) {
                    return constraint.toString();
                }
            }
        } catch (Exception ignored) {
            // Fall back to SQL exception message
        }
        String msg = sqlEx.getMessage();
        return msg != null ? msg : "";
    }

    private AssetAssignmentResponse toAssignmentResponse(
            AssetAssignment assignment,
            User assignee,
            User assigner
    ) {
        AssetAssignmentResponse.UserBrief assigneeBrief = assignee != null
                ? new AssetAssignmentResponse.UserBrief(assignee.getId(), assignee.getFullName())
                : new AssetAssignmentResponse.UserBrief(assignment.getAssignedTo(), "Unknown");
        AssetAssignmentResponse.UserBrief assignerBrief = assigner != null
                ? new AssetAssignmentResponse.UserBrief(assigner.getId(), assigner.getFullName())
                : new AssetAssignmentResponse.UserBrief(assignment.getAssignedBy(), "Unknown");

        return new AssetAssignmentResponse(
                assignment.getId(),
                assignment.getAssetId(),
                assigneeBrief,
                assignerBrief,
                assignment.getAssignedAt(),
                assignment.getExpectedReturnAt(),
                assignment.getReturnedAt(),
                assignment.getReturnCondition(),
                assignment.getStatus(),
                assignment.getNotes(),
                assignment.getVersion()
        );
    }

    private AssetRepairHistoryResponse toRepairHistoryResponse(AssetRepairHistory history) {
        return new AssetRepairHistoryResponse(
                history.getId(),
                history.getAssetId(),
                history.getServiceRequestId(),
                history.getRepairType(),
                history.getDescription(),
                history.getVendorName(),
                history.getCost(),
                history.getStartedAt(),
                history.getCompletedAt(),
                history.getResult(),
                history.getCreatedBy(),
                history.getCreatedAt()
        );
    }

    private boolean hasSystemAdminRole(WorkSphereUserPrincipal principal) {
        if (principal == null || principal.user() == null || principal.user().getRoles() == null) {
            return false;
        }
        return principal.user().getRoles().stream()
                .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getCode()));
    }
}
