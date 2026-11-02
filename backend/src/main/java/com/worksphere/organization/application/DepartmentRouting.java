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
    @org.springframework.beans.factory.annotation.Autowired private ApprovalPolicy authority;

    public DepartmentRouting(JdbcTemplate db) {
        this.db = db;
    }

    public boolean manages(UUID departmentId, UUID actor) {
        if (authority != null) return authority.operations(departmentId, actor);
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
        if (authority != null) return authority.managed(actor, "OPERATIONS", false);
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
                            + " status='ACTIVE' AND NOT is_deleted AND NOT activation_required AND"
                            + " (access_ends_at IS NULL OR access_ends_at>now()))",
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

    public void notifyCapability(
            String code, String title, String type, UUID reference, UUID... exclude) {
        for (UUID user :
                db.queryForList(
                        "SELECT c.user_id FROM staff_capabilities c JOIN users u ON u.id=c.user_id"
                            + " WHERE c.capability=? AND u.status='ACTIVE' AND NOT u.is_deleted AND"
                            + " (u.access_ends_at IS NULL OR u.access_ends_at>now())",
                        UUID.class,
                        code))
            if (!Arrays.asList(exclude).contains(user)) notice(user, title, type, reference);
    }

    public void notifyExecutives(
            UUID dept, String title, String type, UUID reference, UUID exclude) {
        for (UUID user :
                db.queryForList(
                        "SELECT a.executive_id FROM department_authority a JOIN users u ON"
                            + " u.id=a.executive_id JOIN staff_capabilities c ON c.user_id=u.id AND"
                            + " c.capability='EXECUTIVE' WHERE a.department_id=? AND"
                            + " u.status='ACTIVE' AND NOT u.is_deleted AND (u.access_ends_at IS"
                            + " NULL OR u.access_ends_at>now())",
                        UUID.class,
                        dept)) if (!user.equals(exclude)) notice(user, title, type, reference);
    }

    public void notifyAdmins(String title, UUID reference) {
        for (UUID user :
                db.queryForList(
                        "SELECT DISTINCT u.id FROM users u JOIN user_roles ur ON ur.user_id=u.id"
                                + " JOIN roles r ON r.id=ur.role_id WHERE r.code='ADMIN' AND"
                                + " u.status='ACTIVE' AND NOT u.is_deleted",
                        UUID.class)) notice(user, title, "ACCESS", reference);
    }

    public void notifyTimeApprovers(UUID dept, UUID subject, UUID reference) {
        UUID manager =
                db.queryForObject(
                        "SELECT manager_id FROM departments WHERE id=?", UUID.class, dept);
        if (subject.equals(manager)) {
            notifyExecutives(
                    dept, "Có đơn của trưởng phòng cần xem xét", "TIME", reference, subject);
            return;
        }
        if (manager != null && !manager.equals(subject))
            notice(manager, "Có đơn công/nghỉ/tăng ca cần xem xét", "TIME", reference);
        for (UUID user :
                db.queryForList(
                        "SELECT delegate_id FROM approval_delegations WHERE department_id=? AND"
                                + " scope='TIME' AND revoked_at IS NULL AND starts_at<=now() AND"
                                + " ends_at>now()",
                        UUID.class,
                        dept))
            if (!user.equals(subject) && authority.delegated(dept, user, "TIME"))
                notice(user, "Có đơn thuộc phạm vi phụ trách thay", "TIME", reference);
    }

    public void notifyManager(UUID dept, String title, UUID request) {
        if (dept != null)
            db.queryForList(
                            "SELECT manager_id FROM departments WHERE id=? AND manager_id IS NOT"
                                    + " NULL",
                            UUID.class,
                            dept)
                    .forEach(id -> notice(id, title, "REQUEST", request));
        if (dept != null)
            for (UUID user :
                    db.queryForList(
                            "SELECT delegate_id FROM approval_delegations WHERE department_id=? AND"
                                + " scope='OPERATIONS' AND revoked_at IS NULL AND starts_at<=now()"
                                + " AND ends_at>now()",
                            UUID.class,
                            dept))
                if (authority.delegated(dept, user, "OPERATIONS"))
                    notice(user, title, "REQUEST", request);
    }
}
