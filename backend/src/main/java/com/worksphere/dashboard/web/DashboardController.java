package com.worksphere.dashboard.web;

import com.worksphere.dashboard.api.response.PersonalDashboardResponse;
import com.worksphere.dashboard.application.DashboardApplicationService;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for Personal Dashboard API.
 * Per 06_API_CONTRACT.md Section 10.1.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Personal Dashboard APIs")
public class DashboardController {

    private final DashboardApplicationService dashboardService;

    public DashboardController(DashboardApplicationService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * 10.1. Dashboard cá nhân
     * GET /dashboard/me
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get personal dashboard metrics and projections")
    public ResponseEntity<ApiResponse<PersonalDashboardResponse>> getPersonalDashboard(
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        PersonalDashboardResponse response = dashboardService.getPersonalDashboard(principal.userId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
