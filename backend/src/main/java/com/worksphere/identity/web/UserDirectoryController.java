package com.worksphere.identity.web;

import com.worksphere.identity.api.response.UserDirectoryItemResponse;
import com.worksphere.identity.application.UserManagementApplicationService;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.response.PagedData;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.UUID;

/**
 * Controller for public workplace user directory endpoints.
 * Provides least-privilege, purpose-scoped human-readable user lookup
 * for authenticated employees per D-062.
 */
@RestController
@RequestMapping("/api/v1/directory/users")
@Tag(name = "User Directory", description = "Public workplace user directory endpoints")
@SecurityRequirement(name = "bearerAuth")
public class UserDirectoryController {

    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of("fullName", "username", "email");

    private final UserManagementApplicationService userManagementService;

    public UserDirectoryController(UserManagementApplicationService userManagementService) {
        this.userManagementService = userManagementService;
    }

    /**
     * GET /api/v1/directory/users
     * Searches active users in the organization directory.
     * Accessible to any authenticated active user.
     */
    @GetMapping
    @Operation(summary = "Search active users in workplace directory")
    public ResponseEntity<ApiResponse<PagedData<UserDirectoryItemResponse>>> searchDirectory(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fullName,asc") String sort
    ) {
        if (page < 0) {
            throw new BusinessRuleException("BAD_REQUEST", "Chỉ số trang không được âm");
        }
        if (size < 1 || size > 100) {
            throw new BusinessRuleException("BAD_REQUEST", "Kích thước trang phải từ 1 đến 100");
        }

        Pageable pageable = parseSort(page, size, sort);
        PagedData<UserDirectoryItemResponse> result = userManagementService.searchDirectory(
                search, departmentId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private Pageable parseSort(int page, int size, String sort) {
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String prop = parts[0].trim();
            if (ALLOWED_SORT_PROPERTIES.contains(prop)) {
                Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;
                return PageRequest.of(page, size, Sort.by(direction, prop));
            }
        }
        return PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "fullName"));
    }
}
