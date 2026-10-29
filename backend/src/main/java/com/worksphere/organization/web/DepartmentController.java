package com.worksphere.organization.web;

import com.worksphere.organization.api.request.CreateDepartmentRequest;
import com.worksphere.organization.api.request.UpdateDepartmentRequest;
import com.worksphere.organization.api.response.DepartmentResponse;
import com.worksphere.organization.application.DepartmentApplicationService;
import com.worksphere.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for Department endpoints.
 * Per API Contract sections 17.6, 17.7, 17.8, 17.9.
 */
@RestController
@Tag(name = "Department", description = "Department management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class DepartmentController {

    private final DepartmentApplicationService departmentService;

    public DepartmentController(DepartmentApplicationService departmentService) {
        this.departmentService = departmentService;
    }

    /**
     * GET /api/v1/departments
     * Authenticated users can list active departments.
     */
    @GetMapping("/api/v1/departments")
    @Operation(summary = "Get list of active departments")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getDepartments() {
        List<DepartmentResponse> list = departmentService.getDepartments();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * POST /api/v1/admin/departments
     * Requires DEPARTMENT_MANAGE permission.
     */
    @PostMapping("/api/v1/admin/departments")
    @PreAuthorize("hasAuthority('DEPARTMENT_MANAGE')")
    @Operation(summary = "Create new department")
    public ResponseEntity<ApiResponse<DepartmentResponse>> createDepartment(
            @Valid @RequestBody CreateDepartmentRequest request
    ) {
        DepartmentResponse response = departmentService.createDepartment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/admin/departments/{departmentId}
     * Requires DEPARTMENT_MANAGE permission.
     */
    @PutMapping("/api/v1/admin/departments/{departmentId}")
    @PreAuthorize("hasAuthority('DEPARTMENT_MANAGE')")
    @Operation(summary = "Update department")
    public ResponseEntity<ApiResponse<DepartmentResponse>> updateDepartment(
            @PathVariable UUID departmentId,
            @Valid @RequestBody UpdateDepartmentRequest request
    ) {
        DepartmentResponse response = departmentService.updateDepartment(departmentId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/admin/departments/{departmentId}/deactivate
     * Requires DEPARTMENT_MANAGE permission.
     */
    @PutMapping("/api/v1/admin/departments/{departmentId}/deactivate")
    @PreAuthorize("hasAuthority('DEPARTMENT_MANAGE')")
    @Operation(summary = "Deactivate department")
    public ResponseEntity<ApiResponse<Void>> deactivateDepartment(
            @PathVariable UUID departmentId
    ) {
        departmentService.deactivateDepartment(departmentId);
        return ResponseEntity.ok(ApiResponse.successNoContent("Phòng ban đã được dừng hoạt động"));
    }
}
