package com.worksphere.asset.web;

import com.worksphere.asset.api.request.AssignAssetRequest;
import com.worksphere.asset.api.request.CreateAssetRepairHistoryRequest;
import com.worksphere.asset.api.request.CreateAssetRequest;
import com.worksphere.asset.api.request.ReturnAssetRequest;
import com.worksphere.asset.api.request.UpdateAssetRequest;
import com.worksphere.asset.api.response.AssetAssignmentResponse;
import com.worksphere.asset.api.response.AssetDetailResponse;
import com.worksphere.asset.api.response.AssetRepairHistoryResponse;
import com.worksphere.asset.api.response.AssetSummaryResponse;
import com.worksphere.asset.application.AssetApplicationService;
import com.worksphere.asset.domain.AssetStatus;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Asset, Assignment, and Repair History management.
 * Per 06_API_CONTRACT.md section 14 and D-046.
 */
@RestController
@RequestMapping("/api/v1/assets")
@Tag(name = "Asset", description = "Asset management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AssetController {

    private final AssetApplicationService assetService;

    public AssetController(AssetApplicationService assetService) {
        this.assetService = assetService;
    }

    /**
     * GET /api/v1/assets
     * Scoped list of assets. Requires ASSET_READ permission.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ASSET_READ')")
    @Operation(summary = "Get list of assets with scoped permissions")
    public ResponseEntity<ApiResponse<PagedData<AssetSummaryResponse>>> getAssets(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(required = false) UUID assignedTo,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        PagedData<AssetSummaryResponse> data = assetService.getAssets(
                pageable, search, categoryId, status, assignedTo, principal
        );
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /api/v1/assets/my-assets
     * List of assets assigned to the current authenticated user.
     */
    @GetMapping("/my-assets")
    @Operation(summary = "Get list of assets assigned to current user")
    public ResponseEntity<ApiResponse<PagedData<AssetSummaryResponse>>> getMyAssets(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) AssetStatus status,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        PagedData<AssetSummaryResponse> data = assetService.getMyAssets(
                pageable, search, categoryId, status, principal
        );
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /api/v1/assets/{assetId}
     * Get details of an asset.
     */
    @GetMapping("/{assetId}")
    @PreAuthorize("hasAuthority('ASSET_READ')")
    @Operation(summary = "Get details of an asset")
    public ResponseEntity<ApiResponse<AssetDetailResponse>> getAssetDetail(
            @PathVariable UUID assetId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        AssetDetailResponse detail = assetService.getAssetDetail(assetId, principal);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    /**
     * POST /api/v1/assets
     * Create a new asset. Initial status is always AVAILABLE.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ASSET_MANAGE')")
    @Operation(summary = "Create a new asset")
    public ResponseEntity<ApiResponse<AssetDetailResponse>> createAsset(
            @Valid @RequestBody CreateAssetRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        AssetDetailResponse created = assetService.createAsset(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo tài sản thành công"));
    }

    /**
     * PUT /api/v1/assets/{assetId}
     * Update an asset.
     */
    @PutMapping("/{assetId}")
    @PreAuthorize("hasAuthority('ASSET_MANAGE')")
    @Operation(summary = "Update an asset")
    public ResponseEntity<ApiResponse<AssetDetailResponse>> updateAsset(
            @PathVariable UUID assetId,
            @Valid @RequestBody UpdateAssetRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        AssetDetailResponse updated = assetService.updateAsset(assetId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật tài sản thành công"));
    }

    /**
     * POST /api/v1/assets/{assetId}/assignments
     * Assign an asset to a user.
     */
    @PostMapping("/{assetId}/assignments")
    @PreAuthorize("hasAuthority('ASSET_MANAGE')")
    @Operation(summary = "Assign an asset to a user")
    public ResponseEntity<ApiResponse<AssetAssignmentResponse>> assignAsset(
            @PathVariable UUID assetId,
            @Valid @RequestBody AssignAssetRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        AssetAssignmentResponse assignment = assetService.assignAsset(assetId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(assignment, "Cấp phát tài sản thành công"));
    }

    /**
     * PUT /api/v1/assets/{assetId}/assignments/{assignmentId}/return
     * Return an assigned asset.
     */
    @PutMapping("/{assetId}/assignments/{assignmentId}/return")
    @PreAuthorize("hasAuthority('ASSET_MANAGE')")
    @Operation(summary = "Return an assigned asset")
    public ResponseEntity<ApiResponse<AssetAssignmentResponse>> returnAsset(
            @PathVariable UUID assetId,
            @PathVariable UUID assignmentId,
            @Valid @RequestBody ReturnAssetRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        AssetAssignmentResponse returned = assetService.returnAsset(assetId, assignmentId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(returned, "Thu hồi tài sản thành công"));
    }

    /**
     * POST /api/v1/assets/{assetId}/repair-histories
     * Create an immutable repair history audit record.
     */
    @PostMapping("/{assetId}/repair-histories")
    @PreAuthorize("hasAuthority('ASSET_MANAGE')")
    @Operation(summary = "Create an asset repair history audit record")
    public ResponseEntity<ApiResponse<AssetRepairHistoryResponse>> createRepairHistory(
            @PathVariable UUID assetId,
            @Valid @RequestBody CreateAssetRepairHistoryRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        AssetRepairHistoryResponse record = assetService.createRepairHistory(assetId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(record, "Ghi nhận lịch sử sửa chữa thành công"));
    }

    /**
     * GET /api/v1/assets/{assetId}/repair-histories
     * Get list of repair histories for an asset.
     */
    @GetMapping("/{assetId}/repair-histories")
    @PreAuthorize("hasAuthority('ASSET_READ')")
    @Operation(summary = "Get repair histories for an asset")
    public ResponseEntity<ApiResponse<List<AssetRepairHistoryResponse>>> getRepairHistories(
            @PathVariable UUID assetId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        List<AssetRepairHistoryResponse> list = assetService.getRepairHistories(assetId, principal);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
