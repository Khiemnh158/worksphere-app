package com.worksphere.workplace;

import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/workplace/time")
public class TimeIncomeController {
    private final TimeIncomeService service;

    @GetMapping("/people")
    public ApiResponse<?> people(@AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.people(p));
    }

    @PostMapping("/absences")
    public ApiResponse<?> absence(
            @RequestBody TimeIncomeService.AbsenceInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.absence(r, p);
        return ApiResponse.successNoContent(
                "Đã ghi nhận vắng; người dùng có thể đề nghị kiểm tra lại");
    }

    public TimeIncomeController(TimeIncomeService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<?> overview(
            @RequestParam String period, @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.overview(period, p));
    }

    @PutMapping("/calendar")
    public ApiResponse<?> calendar(
            @RequestBody TimeIncomeService.CalendarInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.configureCalendar(r, p);
        return ApiResponse.successNoContent("Đã lưu lịch công");
    }

    @PostMapping("/imports")
    public ApiResponse<?> imports(
            @RequestBody List<TimeIncomeService.ImportRow> r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.importAttendance(r, p);
        return ApiResponse.successNoContent("Đã nhập công, chờ đối soát");
    }

    @PostMapping("/corrections")
    public ApiResponse<?> correction(
            @RequestBody TimeIncomeService.CorrectionInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.correctionFor(r, p);
        return ApiResponse.successNoContent(
                "Đã gửi đề nghị đối soát thay, chờ người khác kiểm tra");
    }

    @PostMapping("/requests")
    public ApiResponse<?> request(
            @RequestBody TimeIncomeService.TimeInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.request(r, p);
        return ApiResponse.successNoContent("Đã gửi đơn");
    }

    @PostMapping("/records/{id}/review")
    public ApiResponse<?> reviewRecord(
            @PathVariable UUID id,
            @RequestBody TimeIncomeService.Review r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.reviewAttendance(id, r, p);
        return ApiResponse.successNoContent("Đã đối soát bản ghi công");
    }

    @PostMapping("/requests/{id}/review")
    public ApiResponse<?> reviewRequest(
            @PathVariable UUID id,
            @RequestBody TimeIncomeService.Review r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.reviewRequest(id, r, p);
        return ApiResponse.successNoContent("Đã xử lý đơn");
    }

    @PutMapping("/leave-balances")
    public ApiResponse<?> balance(
            @RequestBody TimeIncomeService.BalanceInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.balance(r, p);
        return ApiResponse.successNoContent("Đã cập nhật quỹ nghỉ");
    }

    @GetMapping("/incomes")
    public ApiResponse<?> incomes(
            @RequestParam String period, @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.incomes(period, p));
    }

    @PutMapping("/incomes")
    public ApiResponse<?> configureIncome(
            @RequestBody TimeIncomeService.IncomeInput r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        return ApiResponse.success(service.configureIncome(r, p));
    }

    @PostMapping("/incomes/{id}/lock")
    public ApiResponse<?> lock(
            @PathVariable UUID id,
            @RequestBody TimeIncomeService.Review r,
            @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        service.lockIncome(id, r, p);
        return ApiResponse.successNoContent("Đã chốt phiếu đối soát");
    }
}
