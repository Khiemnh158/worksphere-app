package com.worksphere.asset.web;

import com.worksphere.asset.api.request.CreateAssetCategoryRequest;
import com.worksphere.asset.api.request.UpdateAssetCategoryRequest;
import com.worksphere.asset.api.response.AssetCategoryResponse;
import com.worksphere.asset.application.AssetCategoryApplicationService;
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
 * REST Controller for Asset Category endpoints.
 * Per 06_API_CONTRACT.md section 14.0 and D-046.
 */
@RestController
@Tag(name = "Asset Category", description = "Asset Category management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AssetCategoryController {

    private final AssetCategoryApplicationService categoryService;

    public AssetCategoryController(AssetCategoryApplicationService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * GET /api/v1/asset-categories
     * Returns active categories for authenticated users.
     */
    @GetMapping("/api/v1/asset-categories")
    @Operation(summary = "Get list of active asset categories")
    public ResponseEntity<ApiResponse<List<AssetCategoryResponse>>> getActiveCategories(
            @RequestParam(required = false) String search
    ) {
        List<AssetCategoryResponse> list = categoryService.getActiveCategories(search);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * GET /api/v1/admin/asset-categories
     * Paginated list of asset categories for admin.
     */
    @GetMapping("/api/v1/admin/asset-categories")
    @PreAuthorize("hasAuthority('ASSET_CATEGORY_MANAGE')")
    @Operation(summary = "Get paginated list of asset categories for admin")
    public ResponseEntity<ApiResponse<PagedData<AssetCategoryResponse>>> getAdminCategories(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active
    ) {
        PagedData<AssetCategoryResponse> paged = categoryService.getAdminCategories(pageable, search, active);
        return ResponseEntity.ok(ApiResponse.success(paged));
    }

    /**
     * POST /api/v1/admin/asset-categories
     * Create an asset category.
     */
    @PostMapping("/api/v1/admin/asset-categories")
    @PreAuthorize("hasAuthority('ASSET_CATEGORY_MANAGE')")
    @Operation(summary = "Create an asset category")
    public ResponseEntity<ApiResponse<AssetCategoryResponse>> createCategory(
            @Valid @RequestBody CreateAssetCategoryRequest request
    ) {
        AssetCategoryResponse created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo loại tài sản thành công"));
    }

    /**
     * GET /api/v1/admin/asset-categories/{categoryId}
     * Get detail of an asset category.
     */
    @GetMapping("/api/v1/admin/asset-categories/{categoryId}")
    @PreAuthorize("hasAuthority('ASSET_CATEGORY_MANAGE')")
    @Operation(summary = "Get detail of an asset category")
    public ResponseEntity<ApiResponse<AssetCategoryResponse>> getCategory(
            @PathVariable UUID categoryId
    ) {
        AssetCategoryResponse category = categoryService.getCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    /**
     * PUT /api/v1/admin/asset-categories/{categoryId}
     * Update an asset category.
     */
    @PutMapping("/api/v1/admin/asset-categories/{categoryId}")
    @PreAuthorize("hasAuthority('ASSET_CATEGORY_MANAGE')")
    @Operation(summary = "Update an asset category")
    public ResponseEntity<ApiResponse<AssetCategoryResponse>> updateCategory(
            @PathVariable UUID categoryId,
            @Valid @RequestBody UpdateAssetCategoryRequest request
    ) {
        AssetCategoryResponse updated = categoryService.updateCategory(categoryId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật loại tài sản thành công"));
    }

    /**
     * PUT /api/v1/admin/asset-categories/{categoryId}/deactivate
     * Deactivate an asset category.
     */
    @PutMapping("/api/v1/admin/asset-categories/{categoryId}/deactivate")
    @PreAuthorize("hasAuthority('ASSET_CATEGORY_MANAGE')")
    @Operation(summary = "Deactivate an asset category")
    public ResponseEntity<ApiResponse<AssetCategoryResponse>> deactivateCategory(
            @PathVariable UUID categoryId
    ) {
        AssetCategoryResponse deactivated = categoryService.deactivateCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success(deactivated, "Dừng hoạt động loại tài sản thành công"));
    }

    /**
     * PUT /api/v1/admin/asset-categories/{categoryId}/activate
     * Re-activate an asset category.
     */
    @PutMapping("/api/v1/admin/asset-categories/{categoryId}/activate")
    @PreAuthorize("hasAuthority('ASSET_CATEGORY_MANAGE')")
    @Operation(summary = "Activate an asset category")
    public ResponseEntity<ApiResponse<AssetCategoryResponse>> activateCategory(
            @PathVariable UUID categoryId
    ) {
        AssetCategoryResponse activated = categoryService.activateCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success(activated, "Kích hoạt lại loại tài sản thành công"));
    }
}
