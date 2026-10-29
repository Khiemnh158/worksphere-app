package com.worksphere.service_request.web;

import com.worksphere.service_request.api.request.CreateServiceCategoryRequest;
import com.worksphere.service_request.api.request.UpdateServiceCategoryRequest;
import com.worksphere.service_request.api.response.ServiceCategoryResponse;
import com.worksphere.service_request.application.ServiceCategoryApplicationService;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.response.PagedData;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Service Category endpoints.
 * Per 06_API_CONTRACT.md section 13.1.
 */
@RestController
@Tag(name = "Service Category", description = "Service Category management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ServiceCategoryController {

    private final ServiceCategoryApplicationService categoryService;

    public ServiceCategoryController(ServiceCategoryApplicationService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * GET /api/v1/service-categories
     * Returns active categories for authenticated users.
     */
    @GetMapping("/api/v1/service-categories")
    @Operation(summary = "Get list of active service categories")
    public ResponseEntity<ApiResponse<List<ServiceCategoryResponse>>> getActiveCategories() {
        List<ServiceCategoryResponse> list = categoryService.getActiveCategories();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * GET /api/v1/admin/service-categories
     * Requires SERVICE_CATEGORY_MANAGE permission.
     */
    @GetMapping("/api/v1/admin/service-categories")
    @PreAuthorize("hasAuthority('SERVICE_CATEGORY_MANAGE')")
    @Operation(summary = "List service categories for admin with filters and pagination")
    public ResponseEntity<ApiResponse<PagedData<ServiceCategoryResponse>>> searchCategories(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) UUID parentId,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        PagedData<ServiceCategoryResponse> page = categoryService.searchCategories(search, active, parentId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * POST /api/v1/admin/service-categories
     * Requires SERVICE_CATEGORY_MANAGE permission.
     */
    @PostMapping("/api/v1/admin/service-categories")
    @PreAuthorize("hasAuthority('SERVICE_CATEGORY_MANAGE')")
    @Operation(summary = "Create a new service category")
    public ResponseEntity<ApiResponse<ServiceCategoryResponse>> createCategory(
            @Valid @RequestBody CreateServiceCategoryRequest request
    ) {
        ServiceCategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * GET /api/v1/admin/service-categories/{categoryId}
     * Requires SERVICE_CATEGORY_MANAGE permission.
     */
    @GetMapping("/api/v1/admin/service-categories/{categoryId}")
    @PreAuthorize("hasAuthority('SERVICE_CATEGORY_MANAGE')")
    @Operation(summary = "Get details of a service category")
    public ResponseEntity<ApiResponse<ServiceCategoryResponse>> getCategory(
            @PathVariable UUID categoryId
    ) {
        ServiceCategoryResponse response = categoryService.getCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/admin/service-categories/{categoryId}
     * Requires SERVICE_CATEGORY_MANAGE permission.
     */
    @PutMapping("/api/v1/admin/service-categories/{categoryId}")
    @PreAuthorize("hasAuthority('SERVICE_CATEGORY_MANAGE')")
    @Operation(summary = "Update a service category")
    public ResponseEntity<ApiResponse<ServiceCategoryResponse>> updateCategory(
            @PathVariable UUID categoryId,
            @Valid @RequestBody UpdateServiceCategoryRequest request
    ) {
        ServiceCategoryResponse response = categoryService.updateCategory(categoryId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/admin/service-categories/{categoryId}/deactivate
     * Requires SERVICE_CATEGORY_MANAGE permission.
     */
    @PutMapping("/api/v1/admin/service-categories/{categoryId}/deactivate")
    @PreAuthorize("hasAuthority('SERVICE_CATEGORY_MANAGE')")
    @Operation(summary = "Deactivate a service category")
    public ResponseEntity<ApiResponse<Void>> deactivateCategory(
            @PathVariable UUID categoryId
    ) {
        categoryService.deactivateCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.successNoContent("Danh mục dịch vụ đã dừng hoạt động"));
    }

    /**
     * PUT /api/v1/admin/service-categories/{categoryId}/activate
     * Requires SERVICE_CATEGORY_MANAGE permission.
     */
    @PutMapping("/api/v1/admin/service-categories/{categoryId}/activate")
    @PreAuthorize("hasAuthority('SERVICE_CATEGORY_MANAGE')")
    @Operation(summary = "Activate a service category")
    public ResponseEntity<ApiResponse<Void>> activateCategory(
            @PathVariable UUID categoryId
    ) {
        categoryService.activateCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.successNoContent("Danh mục dịch vụ đã được kích hoạt"));
    }
}
