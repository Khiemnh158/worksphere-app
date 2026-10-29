package com.worksphere.asset.application;

import com.worksphere.asset.api.request.CreateAssetCategoryRequest;
import com.worksphere.asset.api.request.UpdateAssetCategoryRequest;
import com.worksphere.asset.api.response.AssetCategoryResponse;
import com.worksphere.asset.domain.AssetCategory;
import com.worksphere.asset.infrastructure.persistence.AssetCategoryRepository;
import com.worksphere.asset.infrastructure.persistence.AssetRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.response.PagedData;
import jakarta.persistence.criteria.Predicate;
import java.sql.SQLException;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for managing Asset Categories.
 * Per 06_API_CONTRACT.md section 14.0 and D-046.
 */
@Service
public class AssetCategoryApplicationService {

    private static final Logger log = LoggerFactory.getLogger(AssetCategoryApplicationService.class);

    private final AssetCategoryRepository categoryRepository;
    private final AssetRepository assetRepository;
    private final Clock clock;

    public AssetCategoryApplicationService(
            AssetCategoryRepository categoryRepository,
            AssetRepository assetRepository,
            Clock clock
    ) {
        this.categoryRepository = categoryRepository;
        this.assetRepository = assetRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AssetCategoryResponse> getActiveCategories(String search) {
        Specification<AssetCategory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));
            predicates.add(cb.isTrue(root.get("active")));
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate codeLike = cb.like(cb.lower(root.get("code")), searchPattern);
                predicates.add(cb.or(nameLike, codeLike));
            }
            query.orderBy(cb.asc(root.get("name")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return categoryRepository.findAll(spec).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedData<AssetCategoryResponse> getAdminCategories(Pageable pageable, String search, Boolean active) {
        Specification<AssetCategory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate codeLike = cb.like(cb.lower(root.get("code")), searchPattern);
                predicates.add(cb.or(nameLike, codeLike));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AssetCategory> page = categoryRepository.findAll(spec, pageable);
        List<AssetCategoryResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PagedData.from(page, content);
    }

    @Transactional(readOnly = true)
    public AssetCategoryResponse getCategory(UUID id) {
        AssetCategory category = categoryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_CATEGORY_NOT_FOUND",
                        "Không tìm thấy loại tài sản"));
        return toResponse(category);
    }

    @Transactional
    public AssetCategoryResponse createCategory(CreateAssetCategoryRequest request) {
        String normalizedCode = request.code().trim().toUpperCase();
        if (!normalizedCode.matches("^[A-Z0-9_]{2,50}$")) {
            throw new BusinessRuleException("BAD_REQUEST",
                    "Mã loại tài sản chỉ chứa chữ cái, chữ số và dấu gạch dưới (2-50 ký tự)");
        }

        if (categoryRepository.existsByCode(normalizedCode)) {
            throw new BusinessRuleException("ASSET_CATEGORY_CODE_ALREADY_EXISTS",
                    "Mã loại tài sản đã tồn tại trong hệ thống");
        }

        boolean active = request.active() != null ? request.active() : true;
        AssetCategory category = AssetCategory.create(
                UUID.randomUUID(),
                normalizedCode,
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                active,
                clock.instant()
        );

        try {
            AssetCategory saved = categoryRepository.saveAndFlush(category);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            handleDataIntegrityViolation(ex);
            throw ex;
        }
    }

    @Transactional
    public AssetCategoryResponse updateCategory(UUID id, UpdateAssetCategoryRequest request) {
        AssetCategory category = categoryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_CATEGORY_NOT_FOUND",
                        "Không tìm thấy loại tài sản"));

        category.update(
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                request.active(),
                clock.instant()
        );

        AssetCategory saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    @Transactional
    public AssetCategoryResponse deactivateCategory(UUID id) {
        AssetCategory category = categoryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_CATEGORY_NOT_FOUND",
                        "Không tìm thấy loại tài sản"));

        if (!category.isActive()) {
            throw new BusinessRuleException("ASSET_CATEGORY_ALREADY_INACTIVE",
                    "Loại tài sản đã ở trạng thái dừng hoạt động");
        }

        // In-use check: Cannot deactivate if any non-deleted asset references this category (including RETIRED)
        if (assetRepository.existsByCategoryIdAndDeletedFalse(id)) {
            throw new BusinessRuleException("ASSET_CATEGORY_IN_USE",
                    "Không thể dừng hoạt động loại tài sản đang được sử dụng bởi các tài sản trong hệ thống");
        }

        category.deactivate(clock.instant());
        AssetCategory saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    @Transactional
    public AssetCategoryResponse activateCategory(UUID id) {
        AssetCategory category = categoryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("ASSET_CATEGORY_NOT_FOUND",
                        "Không tìm thấy loại tài sản"));

        if (category.isActive()) {
            throw new BusinessRuleException("ASSET_CATEGORY_ALREADY_ACTIVE",
                    "Loại tài sản đang ở trạng thái hoạt động");
        }

        category.activate(clock.instant());
        AssetCategory saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    private void handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Throwable cause = ex.getRootCause();
        if (cause instanceof SQLException sqlEx) {
            String sqlState = sqlEx.getSQLState();
            if ("23505".equals(sqlState)) {
                String constraint = extractConstraintName(sqlEx);
                if (constraint.contains("uk_asset_categories_code")) {
                    throw new BusinessRuleException("ASSET_CATEGORY_CODE_ALREADY_EXISTS",
                            "Mã loại tài sản đã tồn tại trong hệ thống");
                }
            }
        }
    }

    private String extractConstraintName(SQLException sqlEx) {
        try {
            java.lang.reflect.Method getServerErrorMessage = sqlEx.getClass().getMethod("getServerErrorMessage");
            Object serverError = getServerErrorMessage.invoke(sqlEx);
            if (serverError != null) {
                java.lang.reflect.Method getConstraint = serverError.getClass().getMethod("getConstraint");
                Object constraint = getConstraint.invoke(serverError);
                if (constraint != null) {
                    return constraint.toString();
                }
            }
        } catch (Exception ignored) {
            // Fall back to message
        }
        String message = sqlEx.getMessage();
        return message != null ? message : "";
    }

    private AssetCategoryResponse toResponse(AssetCategory category) {
        return new AssetCategoryResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt(),
                category.getVersion()
        );
    }
}
