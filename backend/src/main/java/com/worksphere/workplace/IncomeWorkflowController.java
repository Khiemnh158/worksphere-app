package com.worksphere.workplace;

import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workplace/time")
public class IncomeWorkflowController {
    private final IncomeWorkflow service;

    public IncomeWorkflowController(IncomeWorkflow service) {
        this.service = service;
    }

    @PostMapping("/incomes/{id}/commands")
    public ApiResponse<?> command(
            @PathVariable UUID id,
            @RequestBody IncomeWorkflow.Command r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.command(id, r, p);
        return ApiResponse.successNoContent("Đã cập nhật bảng tính");
    }

    @PostMapping("/adjustments/{id}/commands")
    public ApiResponse<?> adjustment(
            @PathVariable UUID id,
            @RequestBody IncomeWorkflow.Command r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.adjustment(id, r, p);
        return ApiResponse.successNoContent("Đã xử lý điều chỉnh; phiếu gốc được giữ");
    }
}
