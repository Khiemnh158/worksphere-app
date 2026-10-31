package com.worksphere.service_request.web;

import com.worksphere.service_request.api.request.AssignServiceRequestRequest;
import com.worksphere.service_request.api.request.CreateServiceCommentRequest;
import com.worksphere.service_request.api.request.CreateServiceRatingRequest;
import com.worksphere.service_request.api.request.CreateServiceRequestRequest;
import com.worksphere.service_request.api.request.RejectResolutionRequest;
import com.worksphere.service_request.api.request.UpdateServiceRequestRequest;
import com.worksphere.service_request.api.request.UpdateServiceRequestStatusRequest;
import com.worksphere.service_request.api.response.CreateServiceRequestResponse;
import com.worksphere.service_request.api.response.ServiceCommentResponse;
import com.worksphere.service_request.api.response.ServiceRatingResponse;
import com.worksphere.service_request.api.response.ServiceRequestDetailResponse;
import com.worksphere.service_request.api.response.ServiceRequestSummaryResponse;
import com.worksphere.service_request.application.ServiceRequestApplicationService;
import com.worksphere.service_request.domain.ServicePriority;
import com.worksphere.service_request.domain.ServiceStatus;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.response.PagedData;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/** REST Controller for Service Request management. Per 06_API_CONTRACT.md section 13. */
@RestController
@RequestMapping("/api/v1/service-requests")
@Tag(name = "Service Request", description = "Service Request management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ServiceRequestController {

    private static final Set<String> ALLOWED_SORT_PROPERTIES =
            Set.of("createdAt", "updatedAt", "priority", "status", "requestNumber", "title");

    private final ServiceRequestApplicationService serviceRequestService;

    public ServiceRequestController(ServiceRequestApplicationService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    /** GET /api/v1/service-requests Requires SERVICE_REQUEST_READ permission. */
    @GetMapping
    @PreAuthorize("hasAuthority('SERVICE_REQUEST_READ')")
    @Operation(summary = "Search and list service requests with query-level scoping")
    public ResponseEntity<ApiResponse<PagedData<ServiceRequestSummaryResponse>>> getRequests(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID requesterId,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) UUID assetId,
            @RequestParam(required = false) ServiceStatus status,
            @RequestParam(required = false) ServicePriority priority,
            @RequestParam(required = false) Instant createdFrom,
            @RequestParam(required = false) Instant createdTo,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        Pageable pageable = parseSort(page, size, sort);
        PagedData<ServiceRequestSummaryResponse> result =
                serviceRequestService.searchRequests(
                        principal,
                        categoryId,
                        requesterId,
                        assigneeId,
                        assetId,
                        status,
                        priority,
                        createdFrom,
                        createdTo,
                        search,
                        pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** POST /api/v1/service-requests Requires SERVICE_REQUEST_CREATE permission. */
    @PostMapping
    @PreAuthorize("hasAuthority('SERVICE_REQUEST_CREATE')")
    @Operation(summary = "Create a new service request")
    public ResponseEntity<ApiResponse<CreateServiceRequestResponse>> createRequest(
            @Valid @RequestBody CreateServiceRequestRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        CreateServiceRequestResponse response =
                serviceRequestService.createRequest(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * GET /api/v1/service-requests/{requestId} Requires SERVICE_REQUEST_READ permission and
     * relation check.
     */
    @GetMapping("/{requestId}")
    @PreAuthorize("hasAuthority('SERVICE_REQUEST_READ')")
    @Operation(summary = "Get detailed service request information")
    public ResponseEntity<ApiResponse<ServiceRequestDetailResponse>> getRequestDetail(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        ServiceRequestDetailResponse response =
                serviceRequestService.getRequestDetail(requestId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/service-requests/{requestId} Requires SERVICE_REQUEST_UPDATE permission and
     * requester ownership when status is OPEN.
     */
    @PutMapping("/{requestId}")
    @PreAuthorize("hasAuthority('SERVICE_REQUEST_UPDATE')")
    @Operation(summary = "Update an OPEN service request")
    public ResponseEntity<ApiResponse<ServiceRequestDetailResponse>> updateRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody UpdateServiceRequestRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        ServiceRequestDetailResponse response =
                serviceRequestService.updateRequest(requestId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/service-requests/{requestId}/assignments Requires SERVICE_REQUEST_ASSIGN
     * permission.
     */
    @PostMapping("/{requestId}/assignments")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Assign a service request to a handler")
    public ResponseEntity<ApiResponse<Void>> assignRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody AssignServiceRequestRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        serviceRequestService.assignRequest(requestId, request, principal);
        return ResponseEntity.ok(ApiResponse.successNoContent("Phân công người xử lý thành công"));
    }

    /**
     * PUT /api/v1/service-requests/{requestId}/status Requires SERVICE_REQUEST_UPDATE_STATUS
     * permission.
     */
    @PutMapping("/{requestId}/status")
    @PreAuthorize("hasAuthority('SERVICE_REQUEST_UPDATE_STATUS')")
    @Operation(summary = "Update service request workflow status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable UUID requestId,
            @Valid @RequestBody UpdateServiceRequestStatusRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        serviceRequestService.updateStatus(requestId, request, principal);
        return ResponseEntity.ok(ApiResponse.successNoContent("Cập nhật trạng thái thành công"));
    }

    /**
     * POST /api/v1/service-requests/{requestId}/reject-resolution Available to authenticated
     * requester for RESOLVED requests.
     */
    @PostMapping("/{requestId}/reject-resolution")
    @Operation(summary = "Reject resolution of a service request")
    public ResponseEntity<ApiResponse<ServiceRequestDetailResponse>> rejectResolution(
            @PathVariable UUID requestId,
            @Valid @RequestBody RejectResolutionRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        ServiceRequestDetailResponse response =
                serviceRequestService.rejectResolution(requestId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/v1/service-requests/{requestId}/comments Requires SERVICE_REQUEST_READ permission.
     */
    @GetMapping("/{requestId}/comments")
    @PreAuthorize("hasAuthority('SERVICE_REQUEST_READ')")
    @Operation(summary = "List comments for a service request")
    public ResponseEntity<ApiResponse<PagedData<ServiceCommentResponse>>> getComments(
            @PathVariable UUID requestId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,asc") String sort,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        Pageable pageable = parseSort(page, size, sort);
        PagedData<ServiceCommentResponse> response =
                serviceRequestService.getComments(requestId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/service-requests/{requestId}/comments Available to authenticated actors with
     * access to request.
     */
    @PostMapping("/{requestId}/comments")
    @Operation(summary = "Add a comment to a service request")
    public ResponseEntity<ApiResponse<ServiceCommentResponse>> createComment(
            @PathVariable UUID requestId,
            @Valid @RequestBody CreateServiceCommentRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        ServiceCommentResponse response =
                serviceRequestService.createComment(requestId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/service-requests/{requestId}/rating Available to requester for CLOSED requests.
     */
    @PostMapping("/{requestId}/rating")
    @Operation(summary = "Submit rating for a closed service request")
    public ResponseEntity<ApiResponse<ServiceRatingResponse>> rateRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody CreateServiceRatingRequest request,
            @AuthenticationPrincipal WorkSphereUserPrincipal principal) {
        ServiceRatingResponse response =
                serviceRequestService.rateRequest(requestId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    private Pageable parseSort(int page, int size, String sort) {
        int boundedSize = Math.min(Math.max(1, size), 100);
        int boundedPage = Math.max(0, page);

        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String prop = parts[0].trim();
            if (ALLOWED_SORT_PROPERTIES.contains(prop)) {
                Sort.Direction direction =
                        parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                                ? Sort.Direction.DESC
                                : Sort.Direction.ASC;
                return PageRequest.of(boundedPage, boundedSize, Sort.by(direction, prop));
            }
        }
        return PageRequest.of(boundedPage, boundedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
