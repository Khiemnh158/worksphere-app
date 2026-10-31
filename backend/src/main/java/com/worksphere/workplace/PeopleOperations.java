package com.worksphere.workplace;

import com.worksphere.organization.application.*;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
@Transactional
public class PeopleOperations {
    private final JdbcTemplate db;
    private final WorkplaceService access;
    private final ApprovalPolicy policy;
    private final DepartmentRouting routing;

    public PeopleOperations(
            JdbcTemplate db,
            WorkplaceService access,
            ApprovalPolicy policy,
            DepartmentRouting routing) {
        this.db = db;
        this.access = access;
        this.policy = policy;
        this.routing = routing;
    }

    public record Authority(UUID executiveId, String reason) {
}

    public record Delegation(
            UUID departmentId,
            UUID delegateId,
            String scope,
            Instant startsAt,
            Instant endsAt,
            String reason) {
}

    public record CaseInput(UUID userId, Instant effectiveAt, String reason) {
}

    public record Decision(String action, String reason, Long version, UUID userId) {
}

    private BusinessRuleException bad(String m) {
        return new BusinessRuleException("PEOPLE_OPERATION_INVALID", m);
    }

    private String reason(String r) {
        if (r == null || r.isBlank() || r.length() > 2000)
            throw bad("Cần căn cứ từ 1 đến 2000 ký tự");
        return r.trim();
    }

    private Map<String, Object> one(String sql, Object... args) {
        var rows = db.queryForList(sql, args);
        if (rows.isEmpty()) throw bad("Không tìm thấy hồ sơ");
        return rows.getFirst();
    }

    private void version(Map<String, Object> row, Long v) {
        if (v == null || ((Number) row.get("version")).longValue() != v)
            throw new BusinessRuleException(
                    "OPTIMISTIC_LOCK_CONFLICT", "Dữ liệu đã thay đổi, hãy tải lại");
    }

    private void audit(UUID actor, UUID subject, String type, String note) {
        db.update(
                "INSERT INTO workplace_events(id,actor_id,subject_id,event_type,content) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                actor,
                subject,
                type,
                note);
    }

    public Map<String, Object> directory(String query, int page, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        int at = Math.max(0, Math.min(page, 100000));
        String q =
                "%"
                        + (query == null
                                ? ""
                                : query.trim().replace("%", "\\%").replace("_", "\\_"))
                        + "%";
        UUID dept =
                db.queryForObject("SELECT department_id FROM users WHERE id=?", UUID.class, actor);
        var items =
                db.queryForList(
                        "SELECT u.id,u.full_name,u.employee_code,u.job_title,u.department_id,d.name"
                            + " department_name,(u.id=d.manager_id) is_manager FROM users u JOIN"
                            + " departments d ON d.id=u.department_id WHERE u.department_id=? AND"
                            + " u.status='ACTIVE' AND NOT u.is_deleted AND (u.full_name ILIKE ? OR"
                            + " u.employee_code ILIKE ?) AND NOT EXISTS(SELECT 1 FROM user_roles ur"
                            + " JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND"
                            + " r.code='ADMIN') ORDER BY u.full_name,u.id LIMIT 20 OFFSET ?",
                        dept,
                        q,
                        q,
                        at * 20);
        int total =
                db.queryForObject(
                        "SELECT count(*) FROM users u WHERE department_id=? AND status='ACTIVE' AND"
                            + " NOT is_deleted AND (full_name ILIKE ? OR employee_code ILIKE ?) AND"
                            + " NOT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON"
                            + " r.id=ur.role_id WHERE ur.user_id=u.id AND r.code='ADMIN')",
                        Integer.class,
                        dept,
                        q,
                        q);
        var contacts =
                db.queryForList(
                        "SELECT c.id,c.name,d.name department_name FROM service_categories c JOIN"
                            + " departments d ON d.id=c.receiving_department_id WHERE c.is_active"
                            + " AND NOT c.is_deleted AND d.is_active AND NOT d.is_deleted ORDER BY"
                            + " d.name,c.name");
        return Map.of(
                "items", items, "total", total, "page", at, "pageSize", 20, "contacts", contacts);
    }

    public void authority(UUID dept, Authority input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        if (!access.admin(actor))
            throw new AccessDeniedException("Cần quản trị để ghi nhận cấu hình theo quyết định");
        if (!policy.executive(input.executiveId()))
            throw bad("Người phụ trách phải có nhiệm vụ Ban lãnh đạo đang hoạt động");
        one("SELECT id FROM departments WHERE id=? AND NOT is_deleted FOR UPDATE", dept);
        db.update(
                "INSERT INTO department_authority(department_id,executive_id,reason,changed_by)"
                    + " VALUES (?,?,?,?) ON CONFLICT(department_id) DO UPDATE SET"
                    + " executive_id=excluded.executive_id,reason=excluded.reason,changed_by=excluded.changed_by,changed_at=now()",
                dept,
                input.executiveId(),
                reason(input.reason()),
                actor);
        audit(actor, dept, "AUTHORITY_CHANGED", input.reason());
    }

    public List<Map<String, Object>> delegations(WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        return db.queryForList(
                "SELECT a.*,d.name department_name,u.full_name delegate_name,g.full_name"
                    + " granted_name FROM approval_delegations a JOIN departments d ON"
                    + " d.id=a.department_id JOIN users u ON u.id=a.delegate_id JOIN users g ON"
                    + " g.id=a.granted_by WHERE a.delegate_id=? OR a.granted_by=? OR (? AND"
                    + " EXISTS(SELECT 1 FROM department_authority x WHERE"
                    + " x.department_id=a.department_id AND x.executive_id=?)) ORDER BY"
                    + " a.created_at DESC LIMIT 200",
                actor,
                actor,
                policy.executive(actor),
                actor);
    }

    public void delegate(Delegation input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        one("SELECT id FROM departments WHERE id=? FOR UPDATE", input.departmentId());
        if (!policy.manager(input.departmentId(), actor)
                && !policy.oversees(input.departmentId(), actor))
            throw new AccessDeniedException(
                    "Chỉ trưởng phòng hoặc lãnh đạo phụ trách được chỉ định thay thế");
        if (!Set.of("OPERATIONS", "TIME").contains(Objects.toString(input.scope(), ""))
                || input.startsAt() == null
                || input.endsAt() == null
                || !input.endsAt().isAfter(input.startsAt())
                || !input.endsAt().isAfter(Instant.now()))
            throw bad("Phạm vi hoặc thời hạn thay thế không hợp lệ");
        routing.requireAssignee(input.departmentId(), input.delegateId());
        if (input.delegateId().equals(actor)
                || policy.manager(input.departmentId(), input.delegateId())
                || access.admin(input.delegateId()))
            throw bad("Chọn người thay thế độc lập, thuộc phòng và không dùng tài khoản Admin");
        if (!db.queryForList(
                        "SELECT id FROM approval_delegations WHERE department_id=? AND scope=? AND"
                                + " revoked_at IS NULL AND starts_at<? AND ends_at>?",
                        input.departmentId(),
                        input.scope(),
                        java.sql.Timestamp.from(input.endsAt()),
                        java.sql.Timestamp.from(input.startsAt()))
                .isEmpty())
            throw bad("Đã có người phụ trách thay trong khoảng này; hãy thu hồi trước");
        UUID id = UUID.randomUUID();
        db.update(
                "INSERT INTO"
                    + " approval_delegations(id,department_id,delegate_id,scope,starts_at,ends_at,granted_by,reason)"
                    + " VALUES (?,?,?,?,?,?,?,?)",
                id,
                input.departmentId(),
                input.delegateId(),
                input.scope(),
                java.sql.Timestamp.from(input.startsAt()),
                java.sql.Timestamp.from(input.endsAt()),
                actor,
                reason(input.reason()));
        audit(actor, id, "DELEGATION_CREATED", input.reason());
        routing.notice(
                input.delegateId(), "Bạn được giao phụ trách thay có thời hạn", "DELEGATION", id);
    }

    public void revokeDelegation(UUID id, Decision input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        var row = one("SELECT * FROM approval_delegations WHERE id=? FOR UPDATE", id);
        if (!policy.manager((UUID) row.get("department_id"), actor)
                && !policy.oversees((UUID) row.get("department_id"), actor))
            throw new AccessDeniedException("Không có quyền thu hồi chỉ định này");
        db.update("UPDATE approval_delegations SET revoked_at=now() WHERE id=?", id);
        audit(actor, id, "DELEGATION_REVOKED", reason(input.reason()));
    }

    public List<Map<String, Object>> cases(WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        return db.queryForList(
                "SELECT c.*,u.full_name,u.department_id,d.name department_name FROM personnel_cases"
                        + " c JOIN users u ON u.id=c.user_id LEFT JOIN departments d ON"
                        + " d.id=u.department_id WHERE c.user_id=? OR c.created_by=? OR ? OR"
                        + " EXISTS(SELECT 1 FROM departments m WHERE m.id=u.department_id AND"
                        + " m.manager_id=?) OR EXISTS(SELECT 1 FROM department_authority a WHERE"
                        + " a.department_id=u.department_id AND a.executive_id=? AND ?) ORDER BY"
                        + " c.created_at DESC LIMIT 200",
                actor,
                actor,
                access.capability(actor, "HR_MANAGE"),
                actor,
                actor,
                policy.executive(actor));
    }

    public UUID createCase(CaseInput input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        var subject =
                one("SELECT * FROM users WHERE id=? AND NOT is_deleted FOR UPDATE", input.userId());
        if (!actor.equals(input.userId())
                && !policy.manager((UUID) subject.get("department_id"), actor)
                && !access.capability(actor, "HR_MANAGE"))
            throw new AccessDeniedException("Chỉ bản thân, trưởng phòng hoặc HR được đề nghị");
        if (input.effectiveAt() == null || !input.effectiveAt().isAfter(Instant.now()))
            throw bad(
                    "Cần mốc ngừng truy cập ở tương lai để kiểm tra/phê duyệt; khóa khẩn cấp dùng"
                            + " quy trình bảo mật");
        if ("DISABLED".equals(subject.get("status")) || access.admin(input.userId()))
            throw bad(
                    "Tài khoản đã ngừng hoạt động hoặc là tài khoản quản trị; xử lý quản trị theo"
                            + " đầu mối riêng");
        UUID id = UUID.randomUUID();
        db.update(
                "INSERT INTO personnel_cases(id,user_id,created_by,reason,effective_at) VALUES"
                        + " (?,?,?,?,?)",
                id,
                input.userId(),
                actor,
                reason(input.reason()),
                java.sql.Timestamp.from(input.effectiveAt()));
        audit(actor, id, "PERSONNEL_CREATED", input.reason());
        routing.notifyCapability(
                "HR_MANAGE", "Có đề nghị nhân sự cần kiểm tra", "PERSONNEL", id, input.userId());
        return id;
    }

    public void caseCommand(UUID id, Decision input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        var row =
                one(
                        "SELECT c.*,u.department_id FROM personnel_cases c JOIN users u ON"
                                + " u.id=c.user_id WHERE c.id=? FOR UPDATE OF c",
                        id);
        version(row, input.version());
        String note = reason(input.reason()), action = Objects.toString(input.action(), "");
        UUID user = (UUID) row.get("user_id"), dept = (UUID) row.get("department_id");
        String status = (String) row.get("status");
        switch (action) {
            case "SUBMIT" -> {
                access.requireCapability(actor, "HR_MANAGE");
                if (!"DRAFT".equals(status) || actor.equals(user))
                    throw bad("HR độc lập kiểm tra hồ sơ nháp");
                db.update(
                        "UPDATE personnel_cases SET"
                            + " status='SUBMITTED',checked_by=?,decision_reference=?,version=version+1"
                            + " WHERE id=?",
                        actor,
                        note,
                        id);
            }
            case "APPROVE", "REJECT" -> {
                if (!policy.oversees(dept, actor)
                        || actor.equals(user)
                        || actor.equals(row.get("created_by"))
                        || actor.equals(row.get("checked_by")))
                    throw new AccessDeniedException(
                            "Cần lãnh đạo phụ trách độc lập; hồ sơ của chính lãnh đạo phải có căn"
                                    + " cứ ngoài ứng dụng");
                if (!"SUBMITTED".equals(status)) throw bad("Hồ sơ chưa chờ duyệt");
                db.update(
                        "UPDATE personnel_cases SET"
                            + " status=?,approved_by=?,approved_at=now(),decision_reference=decision_reference||E'\n"
                            + "'||?,version=version+1 WHERE id=?",
                        action.equals("APPROVE") ? "APPROVED" : "REJECTED",
                        actor,
                        note,
                        id);
                if (action.equals("APPROVE")) {
                    db.update(
                            "UPDATE users SET access_ends_at=?,version=version+1 WHERE id=?",
                            row.get("effective_at"),
                            user);
                    UUID req = UUID.randomUUID();
                    db.update(
                            "INSERT INTO"
                                + " access_requests(id,created_by,user_id,request_type,reason,status,approved_by,personnel_case_id)"
                                + " VALUES (?,?,?,'OFFBOARD',?,'APPROVED',?,?)",
                            req,
                            actor,
                            user,
                            note,
                            actor,
                            id);
                    routing.notifyAdmins("Có quyết định thu hồi truy cập cần theo dõi", req);
                }
            }
            case "HANDOVER_DONE" -> {
                if (!policy.operations(dept, actor) && !policy.oversees(dept, actor))
                    throw new AccessDeniedException("Cần người quản lý phụ trách");
                if (actor.equals(user) || !"APPROVED".equals(status))
                    throw bad("Không tự xác nhận bàn giao hoặc chưa phê duyệt");
                access.checkHandoverComplete(user);
                db.update(
                        "UPDATE personnel_cases SET handover_done=true,version=version+1 WHERE"
                                + " id=?",
                        id);
            }
            case "PAYROLL_DONE" -> {
                if (((java.sql.Timestamp) row.get("effective_at"))
                        .toInstant()
                        .isAfter(Instant.now()))
                    throw bad("Chưa đến mốc kết thúc để xác nhận đối soát cuối cùng");
                access.requireCapability(actor, "PAYROLL_MANAGE");
                if (actor.equals(user) || !"APPROVED".equals(status))
                    throw bad("Cần đối soát độc lập sau phê duyệt");
                db.update(
                        "UPDATE personnel_cases SET payroll_done=true,version=version+1 WHERE id=?",
                        id);
            }
            case "CLOSE" -> {
                access.requireCapability(actor, "HR_MANAGE");
                if (actor.equals(user)
                        || !"APPROVED".equals(status)
                        || !Boolean.TRUE.equals(row.get("handover_done"))
                        || !Boolean.TRUE.equals(row.get("access_done"))
                        || !Boolean.TRUE.equals(row.get("payroll_done")))
                    throw bad("Còn đầu việc chưa hoàn tất");
                db.update(
                        "UPDATE personnel_cases SET status='CLOSED',closed_by=?,version=version+1"
                                + " WHERE id=?",
                        actor,
                        id);
            }
            default -> throw bad("Thao tác hồ sơ không hợp lệ");
        }
        if (action.equals("SUBMIT"))
            routing.notifyExecutives(dept, "Có hồ sơ nhân sự chờ phê duyệt", "PERSONNEL", id, user);
        if (Set.of("APPROVE", "REJECT").contains(action) && row.get("checked_by") != null)
            routing.notice(
                    (UUID) row.get("checked_by"),
                    "Hồ sơ nhân sự đã có quyết định",
                    "PERSONNEL",
                    id);
        audit(actor, id, "PERSONNEL_" + action, note);
        routing.notice(user, "Hồ sơ nhân sự đã được cập nhật", "PERSONNEL", id);
    }

    public List<Map<String, Object>> accessRequests(WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        return db.queryForList(
                "SELECT a.*,u.full_name FROM access_requests a JOIN users u ON u.id=a.user_id WHERE"
                        + " a.created_by=? OR a.user_id=? OR ? OR (? AND EXISTS(SELECT 1 FROM"
                        + " department_authority d WHERE d.department_id=u.department_id AND"
                        + " d.executive_id=?)) ORDER BY a.created_at DESC LIMIT 200",
                actor,
                actor,
                access.admin(actor),
                policy.executive(actor),
                actor);
    }

    public UUID requestAccess(UUID user, String type, String note, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        var target = one("SELECT department_id FROM users WHERE id=? AND NOT is_deleted", user);
        if (!actor.equals(user)
                && !policy.manager((UUID) target.get("department_id"), actor)
                && !access.capability(actor, "HR_MANAGE"))
            throw new AccessDeniedException("Không có quyền đề nghị cho người này");
        if (!Set.of("LOCK", "UNLOCK", "CHANGE_ACCESS").contains(type))
            throw bad("Loại đề nghị không hợp lệ");
        UUID id = UUID.randomUUID();
        db.update(
                "INSERT INTO access_requests(id,created_by,user_id,request_type,reason) VALUES"
                        + " (?,?,?,?,?)",
                id,
                actor,
                user,
                type,
                reason(note));
        audit(actor, id, "ACCESS_REQUESTED", note);
        routing.notifyExecutives(
                (UUID) target.get("department_id"),
                "Có đề nghị truy cập chờ xem xét",
                "ACCESS",
                id,
                user);
        return id;
    }

    public void accessCommand(UUID id, Decision input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        var row =
                one(
                        "SELECT a.*,u.department_id FROM access_requests a JOIN users u ON"
                                + " u.id=a.user_id WHERE a.id=? FOR UPDATE OF a",
                        id);
        version(row, input.version());
        String note = reason(input.reason());
        UUID user = (UUID) row.get("user_id");
        String action = Objects.toString(input.action(), "");
        if (Set.of("APPROVE", "REJECT").contains(action)) {
            if (!policy.oversees((UUID) row.get("department_id"), actor)
                    || actor.equals(user)
                    || actor.equals(row.get("created_by")))
                throw new AccessDeniedException("Cần lãnh đạo phụ trách độc lập");
            if (!"PENDING".equals(row.get("status"))) throw bad("Hồ sơ không chờ phê duyệt");
            db.update(
                    "UPDATE access_requests SET status=?,approved_by=?,version=version+1 WHERE"
                            + " id=?",
                    action.equals("APPROVE") ? "APPROVED" : "REJECTED",
                    actor,
                    id);
        } else if ("EXECUTE".equals(action)) {
            if (!access.admin(actor) || !"APPROVED".equals(row.get("status")))
                throw new AccessDeniedException("Quản trị thực hiện hồ sơ đã duyệt");
            String type = (String) row.get("request_type");
            if (type.equals("OFFBOARD")) {
                var c =
                        one(
                                "SELECT * FROM personnel_cases WHERE id=?",
                                row.get("personnel_case_id"));
                if (((java.sql.Timestamp) c.get("effective_at")).toInstant().isAfter(Instant.now()))
                    throw bad("Chưa đến mốc hiệu lực; truy cập sẽ tự hết hạn ở mốc đã duyệt");
                db.update("UPDATE users SET status='DISABLED',version=version+1 WHERE id=?", user);
                db.update("DELETE FROM staff_capabilities WHERE user_id=?", user);
                db.update(
                        "UPDATE personnel_cases SET access_done=true,version=version+1 WHERE id=?",
                        c.get("id"));
            } else if (type.equals("LOCK") || type.equals("UNLOCK")) {
                var u = one("SELECT version FROM users WHERE id=?", user);
                access.accountState(
                        user,
                        new WorkplaceService.Command(
                                ((Number) u.get("version")).longValue(),
                                type,
                                note,
                                null,
                                null,
                                null),
                        p);
            } else
                throw bad(
                        "Đổi quyền tại Tài khoản & quyền theo căn cứ được phê duyệt, sau đó dùng"
                                + " COMPLETE");
            revokeSessions(user);
            db.update(
                    "UPDATE access_requests SET status='DONE',processed_by=?,version=version+1"
                            + " WHERE id=?",
                    actor,
                    id);
        } else if ("COMPLETE".equals(action)) {
            if (!access.admin(actor)
                    || !"APPROVED".equals(row.get("status"))
                    || !"CHANGE_ACCESS".equals(row.get("request_type")))
                throw new AccessDeniedException("Chỉ hoàn tất hồ sơ đổi quyền đã duyệt");
            db.update(
                    "UPDATE access_requests SET status='DONE',processed_by=?,version=version+1"
                            + " WHERE id=?",
                    actor,
                    id);
        } else throw bad("Thao tác quản trị không hợp lệ");
        if (action.equals("APPROVE")) routing.notifyAdmins("Có đề nghị quản trị đã phê duyệt", id);
        audit(actor, id, "ACCESS_" + action, note);
        routing.notice(user, "Đề nghị truy cập đã cập nhật", "ACCESS", id);
    }

    @org.springframework.beans.factory.annotation.Value(
            "${worksphere.people.scheduling.enabled:true}")
    private boolean scheduledEnabled;

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 5000)
    public void scheduled() {
        if (scheduledEnabled) enforceDue();
    }

    public void enforceDue() {
        for (var row :
                db.queryForList(
                        "SELECT c.user_id,c.approved_by,c.id FROM personnel_cases c JOIN users u ON"
                            + " u.id=c.user_id WHERE c.status='APPROVED' AND c.effective_at<=now()"
                            + " AND u.status<>'DISABLED' FOR UPDATE OF u SKIP LOCKED LIMIT 100")) {
            UUID user = (UUID) row.get("user_id");
            db.update("UPDATE users SET status='DISABLED',version=version+1 WHERE id=?", user);
            db.update(
                    "UPDATE approval_delegations SET revoked_at=now() WHERE delegate_id=? AND"
                            + " revoked_at IS NULL",
                    user);
            db.update("DELETE FROM staff_capabilities WHERE user_id=?", user);
            db.update(
                    "UPDATE work_handovers SET cancelled_at=now() WHERE to_user_id=? AND"
                            + " accepted_at IS NULL AND cancelled_at IS NULL",
                    user);
            for (var work :
                    db.queryForList(
                            "SELECT id,reviewer_id,title FROM department_work WHERE assignee_id=?"
                                    + " AND status NOT IN ('COMPLETED','CANCELLED') FOR UPDATE",
                            user)) {
                db.update(
                        "UPDATE department_work SET"
                            + " previous_assignee_id=assignee_id,assignee_id=NULL,status='HANDOVER',version=version+1,updated_at=now()"
                            + " WHERE id=?",
                        work.get("id"));
                db.update(
                        "INSERT INTO work_events(id,work_id,actor_id,event_type,content) VALUES"
                                + " (?,?,?,?,?)",
                        UUID.randomUUID(),
                        work.get("id"),
                        row.get("approved_by"),
                        "OFFBOARDING_EFFECTIVE",
                        "Hệ thống thực hiện mốc hiệu lực của hồ sơ đã phê duyệt; giữ tiến độ và đưa"
                                + " vào hàng chờ bàn giao");
                routing.notice(
                        (UUID) work.get("reviewer_id"),
                        "Cần bố trí người tiếp nhận: " + work.get("title"),
                        "WORK",
                        (UUID) work.get("id"));
            }
            revokeSessions(user);
            audit(
                    (UUID) row.get("approved_by"),
                    (UUID) row.get("id"),
                    "OFFBOARDING_EFFECTIVE",
                    "Tự động thu hồi theo quyết định đã duyệt; quản trị kiểm tra và xác nhận hoàn"
                            + " tất truy cập");
        }
    }

    private void revokeSessions(UUID user) {
        db.update(
                "UPDATE login_sessions SET logout_at=now(),status='REVOKED' WHERE user_id=? AND"
                        + " status='ACTIVE'",
                user);
        db.update(
                "UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=? AND revoked_at IS NULL",
                user);
    }
}
