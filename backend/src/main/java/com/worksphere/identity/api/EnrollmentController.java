package com.worksphere.identity.api;

import com.worksphere.identity.application.RecoveryService;
import com.worksphere.shared.response.ApiResponse;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import com.worksphere.workplace.WorkplaceService;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class EnrollmentController {
    private final RecoveryService recovery;
    private final WorkplaceService access;
    private final JdbcTemplate db;

    public EnrollmentController(
            RecoveryService recovery, WorkplaceService access, JdbcTemplate db) {
        this.recovery = recovery;
        this.access = access;
        this.db = db;
    }

    @PostMapping("/api/v1/auth/activate")
    public ApiResponse<?> activate(@RequestBody RecoveryService.Complete r) {
        recovery.complete(r, "ACTIVATE");
        return ApiResponse.successNoContent("Đã kích hoạt. Vui lòng đăng nhập.");
    }

    @PostMapping("/api/v1/workplace/staff/{id}/invite")
    @Transactional
    public ApiResponse<?> invite(
            @PathVariable UUID id, @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        if (!access.admin(p.userId())) throw new AccessDeniedException("Cần quản trị");
        var u = db.queryForMap("SELECT * FROM users WHERE id=? FOR UPDATE", id);
        if (!"PENDING".equals(u.get("status")))
            throw new AccessDeniedException(
                    "Chỉ phát hành lại kích hoạt cho tài khoản chưa hoạt động");
        recovery.issue(id, "ACTIVATE");
        return ApiResponse.successNoContent("Đã xếp thư kích hoạt");
    }

    public record Batch(List<WorkplaceService.StaffInput> rows, boolean preview) {}

    @PostMapping("/api/v1/workplace/staff/import")
    @Transactional
    public ApiResponse<?> batch(
            @RequestBody Batch input, @AuthenticationPrincipal WorkSphereUserPrincipal p) {
        if (!access.admin(p.userId())) throw new AccessDeniedException("Cần quản trị");
        if (input.rows() == null || input.rows().isEmpty() || input.rows().size() > 200)
            throw new IllegalArgumentException("Danh sách cần từ 1 đến 200 dòng");
        Set<String> names = new HashSet<>(), emails = new HashSet<>();
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < input.rows().size(); i++) {
            var r = input.rows().get(i);
            List<String> errors = new ArrayList<>();
            String username = Objects.toString(r.username(), "").trim(),
                    email = Objects.toString(r.email(), "").trim().toLowerCase(Locale.ROOT);
            if (!username.matches("[A-Za-z0-9._-]{3,50}")
                    || !names.add(username.toLowerCase(Locale.ROOT)))
                errors.add("Tên đăng nhập sai hoặc trùng trong tệp");
            if (!email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+") || !emails.add(email))
                errors.add("Email sai hoặc trùng trong tệp");
            if (r.fullName() == null || r.fullName().isBlank() || r.fullName().length() > 150)
                errors.add("Họ tên chưa hợp lệ");
            if (!Set.of("EMPLOYEE", "ADMIN").contains(Objects.toString(r.role(), "")))
                errors.add("Quyền hệ thống chưa hợp lệ");
            if (r.departmentId() != null
                    && db.queryForObject(
                                    "SELECT count(*) FROM departments WHERE id=? AND is_active AND"
                                            + " NOT is_deleted",
                                    Integer.class,
                                    r.departmentId())
                            != 1) errors.add("Phòng không hoạt động");
            if (db.queryForObject(
                            "SELECT count(*) FROM users WHERE lower(username)=lower(?) OR"
                                    + " lower(email)=?",
                            Integer.class,
                            username,
                            email)
                    > 0) errors.add("Tài khoản hoặc email đã tồn tại");
            result.add(
                    Map.of("line", i + 1, "username", username, "email", email, "errors", errors));
        }
        boolean valid = result.stream().allMatch(x -> ((List<?>) x.get("errors")).isEmpty());
        if (input.preview() || !valid)
            return ApiResponse.success(Map.of("valid", valid, "preview", true, "rows", result));
        List<UUID> ids = new ArrayList<>();
        for (var r : input.rows()) ids.add(access.createStaff(r, p));
        return ApiResponse.success(Map.of("valid", true, "preview", false, "createdIds", ids));
    }
}
