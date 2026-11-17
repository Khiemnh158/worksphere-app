package com.worksphere.workplace;

import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/workplace")
public class WorkplaceController {
    private final WorkplaceService service;
    @org.springframework.beans.factory.annotation.Autowired private RequestOperations operations;

    @PostMapping("/requests/{id}/operations")
    public ApiResponse<?> operation(
            @PathVariable UUID id,
            @RequestBody RequestOperations.Command command,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        operations.command(id, command, p);
        return ApiResponse.successNoContent("Đã cập nhật yêu cầu");
    }

    @PutMapping("/work/{id}")
    public ApiResponse<?> editWork(
            @PathVariable UUID id,
            @RequestBody WorkplaceService.WorkEdit r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.editWork(id, r, p));
    }

    @org.springframework.beans.factory.annotation.Autowired private RequestDispatchService dispatch;

    @PostMapping("/requests/{id}/dispatch")
    public ApiResponse<?> dispatch(
            @PathVariable UUID id,
            @RequestBody RequestDispatchService.Dispatch r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        dispatch.dispatch(id, r, p);
        return ApiResponse.successNoContent("Đã điều phối yêu cầu");
    }

    @GetMapping("/hr-staff")
    public ApiResponse<?> hrStaff(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.hrStaff(p));
    }

    @GetMapping("/requests")
    public ApiResponse<?> requests(
            @RequestParam(defaultValue = "mine") String scope,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "") String search,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.requests(scope, page, search, p));
    }

    public WorkplaceController(WorkplaceService service) {
        this.service = service;
    }

    @GetMapping("/context")
    public ApiResponse<?> context(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.context(p));
    }

    @GetMapping("/work")
    public ApiResponse<?> work(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.work(p));
    }

    @PostMapping("/work")
    public ApiResponse<?> createWork(
            @RequestBody WorkplaceService.WorkInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.createWork(r, p));
    }

    @GetMapping("/work/{id}")
    public ApiResponse<?> detail(
            @PathVariable UUID id, @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.detail(id, p));
    }

    @PostMapping("/work/{id}/commands")
    public ApiResponse<?> command(
            @PathVariable UUID id,
            @RequestBody WorkplaceService.Command r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.command(id, r, p));
    }

    @PostMapping("/departments")
    public ApiResponse<?> createDepartment(
            @RequestBody WorkplaceService.DepartmentInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.department(null, r, p));
    }

    @PutMapping("/departments/{id}")
    public ApiResponse<?> updateDepartment(
            @PathVariable UUID id,
            @RequestBody WorkplaceService.DepartmentInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.department(id, r, p));
    }

    @GetMapping("/staff")
    public ApiResponse<?> staff(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.staff(p));
    }

    @PostMapping("/staff")
    public ApiResponse<?> createStaff(
            @RequestBody WorkplaceService.StaffInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.createStaff(r, p));
    }

    @PutMapping("/staff/{id}")
    public ApiResponse<?> changeStaff(
            @PathVariable UUID id,
            @RequestBody WorkplaceService.StaffChange r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.changeStaff(id, r, p);
        return ApiResponse.successNoContent("Đã cập nhật quyền và phòng ban");
    }

    @PostMapping("/staff/{id}/state")
    public ApiResponse<?> accountState(
            @PathVariable UUID id,
            @RequestBody WorkplaceService.Command r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.accountState(id, r, p);
        return ApiResponse.successNoContent("Đã cập nhật trạng thái tài khoản");
    }

    @GetMapping("/categories")
    public ApiResponse<?> categories(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.categories(p));
    }

    @PutMapping("/categories/{id}/route")
    public ApiResponse<?> route(
            @PathVariable UUID id,
            @RequestBody WorkplaceService.RouteInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.route(id, r, p);
        return ApiResponse.successNoContent(
                "Đã cấu hình phòng nhận; yêu cầu cũ giữ nguyên phòng đã tiếp nhận");
    }

    @GetMapping("/notices")
    public ApiResponse<?> notices(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.notices(p));
    }

    @PutMapping("/notices/{id}/read")
    public ApiResponse<?> read(
            @PathVariable UUID id, @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.readNotice(id, p);
        return ApiResponse.successNoContent("Đã đọc");
    }

    @GetMapping("/audit")
    public ApiResponse<?> audit(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.audit(p));
    }
}
