package com.worksphere.organization.application;

import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DepartmentRouting {
    private final JdbcTemplate db;

    public DepartmentRouting(JdbcTemplate db) {
        this.db = db;
    }

    public boolean manages(UUID departmentId, UUID actor) {
        return departmentId != null
                && Boolean.TRUE.equals(
                        db.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM departments d JOIN users u ON"
                                    + " u.id=d.manager_id WHERE d.id=? AND d.manager_id=? AND"
                                    + " d.is_active AND NOT d.is_deleted AND u.status='ACTIVE' AND"
                                    + " NOT u.is_deleted)",
                                Boolean.class,
                                departmentId,
                                actor));
    }

    public List<UUID> managed(UUID actor) {
        return db.queryForList(
                "SELECT id FROM departments WHERE manager_id=? AND is_active AND NOT is_deleted",
                UUID.class,
                actor);
    }

    public UUID route(UUID category) {
        List<UUID> ids =
                db.queryForList(
                        "SELECT receiving_department_id FROM service_categories WHERE id=?",
                        UUID.class,
                        category);
        return ids.isEmpty() ? null : ids.getFirst();
    }

    public void requireReceiving(UUID department) {
        if (department == null) return; // Legacy imported categories remain explicitly unrouted.
        db.queryForList("SELECT id FROM departments WHERE id=? FOR UPDATE", department);
        if (!Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM departments d JOIN users u ON"
                            + " u.id=d.manager_id WHERE d.id=? AND d.is_active AND NOT d.is_deleted"
                            + " AND u.status='ACTIVE' AND NOT u.is_deleted)",
                        Boolean.class,
                        department)))
            throw new BusinessRuleException(
                    "DEPARTMENT_NOT_READY", "Phòng chưa có người phụ trách đang hoạt động");
    }

    public void requireAssignee(UUID department, UUID user) {
        if (!Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM users WHERE id=? AND department_id=? AND"
                                + " status='ACTIVE' AND NOT is_deleted)",
                        Boolean.class,
                        user,
                        department)))
            throw new BusinessRuleException(
                    "ASSIGNEE_DEPARTMENT_MISMATCH",
                    "Người nhận phải đang hoạt động và thuộc phòng tiếp nhận");
    }

    public void requireManager(UUID dept, WorkSphereUserPrincipal p) {
        if (!manages(dept, p.userId()))
            throw new AccessDeniedException("Chỉ người phụ trách phòng này được phân công");
    }

    public void notice(UUID user, String title, String type, UUID ref) {
        String safeTitle =
                title.substring(
                        0,
                        title.offsetByCodePoints(
                                0, Math.min(255, title.codePointCount(0, title.length()))));
        if (user != null)
            db.update(
                    "INSERT INTO workplace_notices(id,user_id,title,reference_type,reference_id)"
                            + " VALUES (?,?,?,?,?)",
                    UUID.randomUUID(),
                    user,
                    safeTitle,
                    type,
                    ref);
    }

    public void notifyManager(UUID dept, String title, UUID request) {
        if (dept != null)
            db.queryForList(
                            "SELECT manager_id FROM departments WHERE id=? AND manager_id IS NOT"
                                    + " NULL",
                            UUID.class,
                            dept)
                    .forEach(id -> notice(id, title, "REQUEST", request));
    }
}
