package com.worksphere.identity.api;

import com.worksphere.identity.application.TwoFactorService;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me/two-factor")
public class TwoFactorController {
    private final TwoFactorService service;

    public TwoFactorController(TwoFactorService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<?> status(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.status(p.userId()));
    }

    @PostMapping("/setup")
    public ApiResponse<?> setup(
            @RequestBody TwoFactorService.Input r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.setup(p, r));
    }

    @PostMapping("/enable")
    public ApiResponse<?> enable(
            @RequestBody TwoFactorService.Input r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.enable(p, r));
    }

    @PostMapping("/disable")
    public ApiResponse<?> disable(
            @RequestBody TwoFactorService.Input r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.disable(p, r);
        return ApiResponse.successNoContent("Đã tắt và thu hồi phiên; đăng nhập lại");
    }
}
