package com.worksphere.workplace;

import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/workplace")
public class PeopleController {
    private final PeopleOperations people;

    public PeopleController(PeopleOperations people) {
        this.people = people;
    }

    @GetMapping("/directory")
    public ApiResponse<?> directory(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(people.directory(search, page, p));
    }

    @PutMapping("/departments/{id}/authority")
    public ApiResponse<?> authority(
            @PathVariable UUID id,
            @RequestBody PeopleOperations.Authority r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        people.authority(id, r, p);
        return ApiResponse.successNoContent("Đã ghi nhận lãnh đạo phụ trách");
    }

    @GetMapping("/delegations")
    public ApiResponse<?> delegations(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(people.delegations(p));
    }

    @PostMapping("/delegations")
    public ApiResponse<?> delegate(
            @RequestBody PeopleOperations.Delegation r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        people.delegate(r, p);
        return ApiResponse.successNoContent("Đã chỉ định phụ trách thay");
    }

    @PostMapping("/delegations/{id}/revoke")
    public ApiResponse<?> revoke(
            @PathVariable UUID id,
            @RequestBody PeopleOperations.Decision r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        people.revokeDelegation(id, r, p);
        return ApiResponse.successNoContent("Đã thu hồi chỉ định");
    }

    @GetMapping("/personnel")
    public ApiResponse<?> cases(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(people.cases(p));
    }

    @PostMapping("/personnel")
    public ApiResponse<?> createCase(
            @RequestBody PeopleOperations.CaseInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(people.createCase(r, p));
    }

    @PostMapping("/personnel/{id}/commands")
    public ApiResponse<?> caseCommand(
            @PathVariable UUID id,
            @RequestBody PeopleOperations.Decision r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        people.caseCommand(id, r, p);
        return ApiResponse.successNoContent("Đã cập nhật hồ sơ nhân sự");
    }

    public record AccessInput(UUID userId, String type, String reason) {
}

    @GetMapping("/access-requests")
    public ApiResponse<?> accessRequests(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(people.accessRequests(p));
    }

    @PostMapping("/access-requests")
    public ApiResponse<?> requestAccess(
            @RequestBody AccessInput r, @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(people.requestAccess(r.userId(), r.type(), r.reason(), p));
    }

    @PostMapping("/access-requests/{id}/commands")
    public ApiResponse<?> accessCommand(
            @PathVariable UUID id,
            @RequestBody PeopleOperations.Decision r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        people.accessCommand(id, r, p);
        return ApiResponse.successNoContent("Đã cập nhật yêu cầu quản trị");
    }
}
