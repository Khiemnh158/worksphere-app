package com.worksphere.service_request.application;

import com.worksphere.service_request.api.request.CreateServiceCategoryRequest;
import com.worksphere.service_request.api.request.UpdateServiceCategoryRequest;
import com.worksphere.service_request.api.response.ServiceCategoryResponse;
import com.worksphere.service_request.domain.ServiceCategory;
import com.worksphere.service_request.infrastructure.persistence.ServiceCategoryRepository;
import com.worksphere.service_request.infrastructure.persistence.ServiceRequestRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.response.PagedData;
import java.time.Clock;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for ServiceCategory operations.
 * Per 02_USER_ROLES_AND_WORKFLOWS.md and 06_API_CONTRACT.md section 13.1.
 */
@Service
public class ServiceCategoryApplicationService {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceRequestRepository requestRepository;
    private final Clock clock;

    public ServiceCategoryApplicationService(
            ServiceCategoryRepository categoryRepository,
            ServiceRequestRepository requestRepository,
            Clock clock
    ) {
        this.categoryRepository = categoryRepository;
        this.requestRepository = requestRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<ServiceCategoryResponse> getActiveCategories() {
        return categoryRepository.findAllByActiveTrueAndDeletedFalseOrderByCodeAsc()
                .stream()
                .map(ServiceCategoryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedData<ServiceCategoryResponse> searchCategories(
            String search,
            Boolean active,
            UUID parentId,
            Pageable pageable
    ) {
        Page<ServiceCategory> page = categoryRepository.searchCategories(search, active, parentId, pageable);
        List<ServiceCategoryResponse> items = page.getContent().stream()
                .map(ServiceCategoryResponse::from)
                .toList();
        return PagedData.from(page, items);
    }

    @Transactional(readOnly = true)
    public ServiceCategoryResponse getCategory(UUID id) {
        ServiceCategory category = categoryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_CATEGORY_NOT_FOUND", "Không tìm thấy danh mục dịch vụ"));
        return ServiceCategoryResponse.from(category);
    }

    @Transactional
    public ServiceCategoryResponse createCategory(CreateServiceCategoryRequest request) {
        String normalizedCode = request.code().trim().toUpperCase();
        if (categoryRepository.existsByCodeIgnoreCaseAndDeletedFalse(normalizedCode)) {
            throw new BusinessRuleException(
                    "SERVICE_CATEGORY_CODE_ALREADY_EXISTS",
                    "Mã danh mục dịch vụ đã tồn tại trong hệ thống: " + normalizedCode
            );
        }

        if (request.parentId() != null) {
            ServiceCategory parent = categoryRepository.findByIdAndDeletedFalse(request.parentId())
                    .orElseThrow(() -> new BusinessRuleException(
                            "SERVICE_CATEGORY_PARENT_INVALID",
                            "Danh mục cha không tồn tại hoặc không hợp lệ"
                    ));
            if (!parent.isActive()) {
                throw new BusinessRuleException(
                        "SERVICE_CATEGORY_PARENT_INVALID",
                        "Danh mục cha đang dừng hoạt động"
                );
            }
        }

        boolean initialActive = request.active() != null ? request.active() : true;
        ServiceCategory category = ServiceCategory.create(
                UUID.randomUUID(),
                request.parentId(),
                normalizedCode,
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                request.defaultPriority(),
                initialActive,
                clock.instant()
        );

        ServiceCategory saved = categoryRepository.save(category);
        return ServiceCategoryResponse.from(saved);
    }

    @Transactional
    public ServiceCategoryResponse updateCategory(UUID id, UpdateServiceCategoryRequest request) {
        ServiceCategory category = categoryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_CATEGORY_NOT_FOUND", "Không tìm thấy danh mục dịch vụ"));

        if (!category.getVersion().equals(request.version())) {
            throw new BusinessRuleException(
                    "OPTIMISTIC_LOCK_CONFLICT",
                    "Dữ liệu danh mục đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại dữ liệu."
            );
        }

        if (request.parentId() != null) {
            if (request.parentId().equals(id)) {
                throw new BusinessRuleException(
                        "SERVICE_CATEGORY_CYCLE_DETECTED",
                        "Danh mục không thể làm cha của chính nó"
                );
            }

            ServiceCategory parent = categoryRepository.findByIdAndDeletedFalse(request.parentId())
                    .orElseThrow(() -> new BusinessRuleException(
                            "SERVICE_CATEGORY_PARENT_INVALID",
                            "Danh mục cha không tồn tại hoặc không hợp lệ"
                    ));

            if (!parent.isActive()) {
                throw new BusinessRuleException(
                        "SERVICE_CATEGORY_PARENT_INVALID",
                        "Danh mục cha đang dừng hoạt động"
                );
            }

            // Cycle detection using visited set (no arbitrary depth limit per D-038)
            Set<UUID> visited = new HashSet<>();
            visited.add(id);
            UUID currentParentId = request.parentId();
            while (currentParentId != null) {
                if (visited.contains(currentParentId)) {
                    throw new BusinessRuleException(
                            "SERVICE_CATEGORY_CYCLE_DETECTED",
                            "Phát hiện chu trình trong phân cấp danh mục"
                    );
                }
                visited.add(currentParentId);
                ServiceCategory current = categoryRepository.findByIdAndDeletedFalse(currentParentId).orElse(null);
                if (current == null) {
                    break;
                }
                currentParentId = current.getParentId();
            }
        }

        category.update(
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                request.parentId(),
                request.defaultPriority(),
                request.active(),
                clock.instant()
        );

        ServiceCategory saved = categoryRepository.save(category);
        return ServiceCategoryResponse.from(saved);
    }

    @Transactional
    public void deactivateCategory(UUID id) {
        ServiceCategory category = categoryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_CATEGORY_NOT_FOUND", "Không tìm thấy danh mục dịch vụ"));

        if (!category.isActive()) {
            throw new BusinessRuleException(
                    "SERVICE_CATEGORY_ALREADY_INACTIVE",
                    "Danh mục dịch vụ đã ở trạng thái dừng hoạt động"
            );
        }

        category.deactivate(clock.instant());
        categoryRepository.save(category);
    }

    @Transactional
    public void activateCategory(UUID id) {
        ServiceCategory category = categoryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_CATEGORY_NOT_FOUND", "Không tìm thấy danh mục dịch vụ"));

        if (category.isActive()) {
            throw new BusinessRuleException(
                    "SERVICE_CATEGORY_ALREADY_ACTIVE",
                    "Danh mục dịch vụ đang ở trạng thái hoạt động"
            );
        }

        if (category.getParentId() != null) {
            ServiceCategory parent = categoryRepository.findByIdAndDeletedFalse(category.getParentId()).orElse(null);
            if (parent == null || !parent.isActive()) {
                throw new BusinessRuleException(
                        "SERVICE_CATEGORY_PARENT_INVALID",
                        "Danh mục cha không tồn tại hoặc đang dừng hoạt động"
                );
            }
        }

        category.activate(clock.instant());
        categoryRepository.save(category);
    }
}
