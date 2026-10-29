package com.worksphere.project.web;

import com.worksphere.project.api.request.AddProjectMemberRequest;
import com.worksphere.project.api.request.ChangeProjectStatusRequest;
import com.worksphere.project.api.request.CreateMilestoneRequest;
import com.worksphere.project.api.request.CreateProjectRequest;
import com.worksphere.project.api.request.UpdateProjectMemberRoleRequest;
import com.worksphere.project.api.request.UpdateProjectRequest;
import com.worksphere.project.api.response.MilestoneResponse;
import com.worksphere.project.api.response.ProjectDetailResponse;
import com.worksphere.project.api.response.ProjectMemberResponse;
import com.worksphere.project.api.response.ProjectSummaryResponse;
import com.worksphere.project.application.MilestoneApplicationService;
import com.worksphere.project.application.ProjectApplicationService;
import com.worksphere.project.application.ProjectMemberApplicationService;
import com.worksphere.project.domain.ProjectPriority;
import com.worksphere.project.domain.ProjectRole;
import com.worksphere.project.domain.ProjectStatus;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Project Management.
 * Implements 06_API_CONTRACT.md section 11.
 */
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectApplicationService projectApplicationService;
    private final ProjectMemberApplicationService projectMemberApplicationService;
    private final MilestoneApplicationService milestoneApplicationService;

    public ProjectController(
            ProjectApplicationService projectApplicationService,
            ProjectMemberApplicationService projectMemberApplicationService,
            MilestoneApplicationService milestoneApplicationService
    ) {
        this.projectApplicationService = projectApplicationService;
        this.projectMemberApplicationService = projectMemberApplicationService;
        this.milestoneApplicationService = milestoneApplicationService;
    }

    /**
     * 11.1. Lấy danh sách dự án
     * GET /projects
     */
    @GetMapping
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public ResponseEntity<ApiResponse<PagedData<ProjectSummaryResponse>>> getProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) ProjectPriority priority,
            @RequestParam(required = false) UUID managerId,
            @RequestParam(required = false) UUID departmentId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && sort.contains(",")) {
            String[] parts = sort.split(",");
            Sort.Direction direction = parts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            String property = parts[0].trim();
            // Whitelist sort fields
            if (List.of("createdAt", "name", "code", "startDate", "plannedEndDate", "priority", "status").contains(property)) {
                sortObj = Sort.by(direction, property);
            }
        }
        Pageable pageable = PageRequest.of(page, size, sortObj);

        PagedData<ProjectSummaryResponse> result = projectApplicationService.searchProjects(
                search,
                status,
                priority,
                managerId,
                departmentId,
                pageable,
                principal
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 11.2. Tạo dự án
     * POST /projects
     */
    @PostMapping
    @PreAuthorize("hasAuthority('PROJECT_CREATE')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        ProjectDetailResponse response = projectApplicationService.createProject(request, principal.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * 11.3. Chi tiết dự án
     * GET /projects/{projectId}
     */
    @GetMapping("/{projectId}")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> getProjectDetail(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        ProjectDetailResponse response = projectApplicationService.getProjectDetail(projectId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 11.4. Cập nhật dự án
     * PUT /projects/{projectId}
     */
    @PutMapping("/{projectId}")
    @PreAuthorize("hasAuthority('PROJECT_UPDATE')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> updateProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        ProjectDetailResponse response = projectApplicationService.updateProject(projectId, request, principal.userId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 11.5. Thay đổi trạng thái dự án
     * PUT /projects/{projectId}/status
     */
    @PutMapping("/{projectId}/status")
    @PreAuthorize("hasAuthority('PROJECT_UPDATE')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> changeProjectStatus(
            @PathVariable UUID projectId,
            @Valid @RequestBody ChangeProjectStatusRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        ProjectDetailResponse response = projectApplicationService.changeProjectStatus(projectId, request, principal.userId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 11.6. Danh sách thành viên dự án
     * GET /projects/{projectId}/members
     */
    @GetMapping("/{projectId}/members")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public ResponseEntity<ApiResponse<PagedData<ProjectMemberResponse>>> getProjectMembers(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) ProjectRole role,
            @RequestParam(required = false) Boolean active,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "joinedAt"));
        PagedData<ProjectMemberResponse> result = projectMemberApplicationService.getMembers(projectId, role, active, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 11.7. Thêm thành viên dự án
     * POST /projects/{projectId}/members
     */
    @PostMapping("/{projectId}/members")
    @PreAuthorize("hasAuthority('PROJECT_MEMBER_MANAGE')")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> addProjectMember(
            @PathVariable UUID projectId,
            @Valid @RequestBody AddProjectMemberRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        ProjectMemberResponse response = projectMemberApplicationService.addMember(projectId, request, principal.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * 11.8. Cập nhật vai trò thành viên
     * PUT /projects/{projectId}/members/{memberId}
     */
    @PutMapping("/{projectId}/members/{memberId}")
    @PreAuthorize("hasAuthority('PROJECT_MEMBER_MANAGE')")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> updateProjectMemberRole(
            @PathVariable UUID projectId,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateProjectMemberRoleRequest request
    ) {
        ProjectMemberResponse response = projectMemberApplicationService.updateMemberRole(projectId, memberId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 11.9. Xoá thành viên dự án
     * DELETE /projects/{projectId}/members/{memberId}
     */
    @DeleteMapping("/{projectId}/members/{memberId}")
    @PreAuthorize("hasAuthority('PROJECT_MEMBER_MANAGE')")
    public ResponseEntity<ApiResponse<Void>> removeProjectMember(
            @PathVariable UUID projectId,
            @PathVariable UUID memberId
    ) {
        projectMemberApplicationService.removeMember(projectId, memberId);
        return ResponseEntity.ok(ApiResponse.successNoContent("Thành viên đã được xóa khỏi dự án"));
    }

    /**
     * 11.10. Tạo milestone
     * POST /projects/{projectId}/milestones
     */
    @PostMapping("/{projectId}/milestones")
    @PreAuthorize("hasAuthority('PROJECT_UPDATE')")
    public ResponseEntity<ApiResponse<MilestoneResponse>> createMilestone(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateMilestoneRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        MilestoneResponse response = milestoneApplicationService.createMilestone(projectId, request, principal.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * 11.11. Danh sách milestone
     * GET /projects/{projectId}/milestones
     */
    @GetMapping("/{projectId}/milestones")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public ResponseEntity<ApiResponse<List<MilestoneResponse>>> getMilestones(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal
    ) {
        List<MilestoneResponse> response = milestoneApplicationService.getMilestones(projectId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
