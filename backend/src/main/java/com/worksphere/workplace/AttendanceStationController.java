package com.worksphere.workplace;

import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workplace/attendance")
public class AttendanceStationController {
    private final AttendanceStationService service;

    public AttendanceStationController(AttendanceStationService s) {
        service = s;
    }

    @GetMapping("/stations")
    public ApiResponse<?> list(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.stations(p));
    }

    @PostMapping("/stations")
    public ApiResponse<?> create(
            @RequestBody AttendanceStationService.StationInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.create(r, p));
    }

    @PutMapping("/stations/{id}")
    public ApiResponse<?> state(
            @PathVariable UUID id,
            @RequestBody AttendanceStationService.StationInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.state(id, r, p);
        return ApiResponse.successNoContent("Đã cập nhật điểm chấm công");
    }

    @PostMapping("/stations/{id}/challenge")
    public ApiResponse<?> qr(
            @PathVariable UUID id, @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.challenge(id, p));
    }

    @GetMapping("/today")
    public ApiResponse<?> today(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.today(p));
    }

    @PostMapping("/punches")
    public ApiResponse<?> punch(
            @RequestBody AttendanceStationService.Punch r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p,
            HttpServletRequest request) {
        // Do not trust a client-supplied X-Forwarded-For header as presence evidence.
        return ApiResponse.success(service.punch(r, p, request.getRemoteAddr()));
    }
}
