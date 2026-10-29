package com.worksphere.workplace;

import com.worksphere.identity.domain.*;
import com.worksphere.identity.infrastructure.persistence.*;
import com.worksphere.organization.application.DepartmentRouting;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

/** Department operations. Project/task APIs remain available for inherited projects. */
@Service
@Transactional
public class WorkplaceService {
    private final JdbcTemplate db;
    private final DepartmentRouting routing;
    private final UserRepository users;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;
    private final PasswordEncoder encoder;
    private final LoginSessionRepository sessions;
    private final RefreshTokenRepository refresh;

    public WorkplaceService(
            JdbcTemplate db,
            DepartmentRouting routing,
            UserRepository users,
            RoleRepository roles,
            UserRoleRepository userRoles,
            PasswordEncoder encoder,
            LoginSessionRepository sessions,
            RefreshTokenRepository refresh) {
        this.db = db;
        this.routing = routing;
        this.users = users;
        this.roles = roles;
        this.userRoles = userRoles;
        this.encoder = encoder;
        this.sessions = sessions;
        this.refresh = refresh;
    }

    public record WorkInput(
            UUID departmentId,
            String title,
            String description,
            String priority,
            UUID assigneeId,
            Instant dueAt) {}

    public record Command(
            Long version,
            String action,
            String content,
            Integer progress,
            UUID userId,
            List<UUID> fileIds) {}

    public record DepartmentInput(
            String code,
            String name,
            String description,
            UUID managerId,
            boolean active,
            Long version) {}

    public record StaffInput(
            String username,
            String email,
            String fullName,
            UUID departmentId,
            String role,
            String password) {}

    public record StaffChange(
            UUID departmentId,
            String role,
            List<String> capabilities,
            Long version,
            String reason) {}

    public record RouteInput(UUID departmentId, Long version) {}

    UUID actor(WorkSphereUserPrincipal p) {
        if (p == null
                || p.user() == null
                || !Boolean.TRUE.equals(
                        db.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM users WHERE id=? AND status='ACTIVE'"
                                        + " AND NOT is_deleted)",
                                Boolean.class,
                                p.userId())))
            throw new AccessDeniedException("Tài khoản không hoạt động");
        return p.userId();
    }

    public boolean admin(UUID id) {
        return Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id"
                                + " WHERE ur.user_id=? AND r.code='ADMIN' AND r.is_active)",
                        Boolean.class,
                        id));
    }

    private void requireAdmin(UUID id) {
        if (!admin(id)) throw new AccessDeniedException("Cần quyền quản trị hệ thống");
    }

    public boolean capability(UUID id, String code) {
        return Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM staff_capabilities WHERE user_id=? AND"
                                + " capability=?)",
                        Boolean.class,
                        id,
                        code));
    }

    public void requireCapability(UUID id, String code) {
        if (!capability(id, code))
            throw new AccessDeniedException("Bạn chưa được cấp quyền xử lý nghiệp vụ này");
    }

    private String text(String value, int max, String label) {
        if (value == null || value.isBlank() || value.trim().length() > max)
            throw invalid(label + " không hợp lệ (tối đa " + max + " ký tự)");
        return value.trim();
    }

    private BusinessRuleException invalid(String message) {
        return new BusinessRuleException("VALIDATION_ERROR", message);
    }

    private Map<String, Object> one(String sql, Object... args) {
        var rows = db.queryForList(sql, args);
        if (rows.isEmpty())
            throw new com.worksphere.shared.exception.ResourceNotFoundException(
                    "NOT_FOUND", "Không tìm thấy dữ liệu");
        return rows.getFirst();
    }

    private UUID uuid(Map<String, Object> r, String key) {
        return (UUID) r.get(key);
    }

    private void version(Map<String, Object> r, Long v) {
        if (v == null || ((Number) r.get("version")).longValue() != v)
            throw new BusinessRuleException(
                    "OPTIMISTIC_LOCK_CONFLICT",
                    "Dữ liệu vừa thay đổi. Vui lòng tải lại trước khi thao tác.");
    }

    private void audit(UUID actor, UUID subject, String type, String content) {
        db.update(
                "INSERT INTO workplace_events(id,actor_id,subject_id,event_type,content) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                actor,
                subject,
                type,
                content);
    }

    private void event(UUID work, UUID actor, String type, String content) {
        db.update(
                "INSERT INTO work_events(id,work_id,actor_id,event_type,content) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                work,
                actor,
                type,
                content);
    }

    private void requireMember(UUID dept, UUID user) {
        routing.requireAssignee(dept, user);
    }

    private void requireReady(UUID dept) {
        routing.requireReceiving(dept);
    }

    private void requireManager(UUID dept, UUID id) {
        db.queryForList("SELECT id FROM departments WHERE id=? FOR UPDATE", dept);
        if (!routing.manages(dept, id))
            throw new AccessDeniedException("Chỉ trưởng phòng phụ trách được thực hiện");
    }

    private static final String WORK_SELECT =
            "SELECT w.*,d.name department_name,u.full_name assignee_name,r.full_name reviewer_name"
                    + " FROM department_work w JOIN departments d ON d.id=w.department_id LEFT JOIN"
                    + " users u ON u.id=w.assignee_id JOIN users r ON r.id=w.reviewer_id ";

    @Transactional(readOnly = true)
    public Map<String, Object> context(WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put(
                "user",
                one(
                        "SELECT"
                            + " u.id,u.username,u.email,u.full_name,u.department_id,u.status,u.version,d.name"
                            + " department_name FROM users u LEFT JOIN departments d ON"
                            + " d.id=u.department_id WHERE u.id=?",
                        id));
        result.put("admin", admin(id));
        result.put("managedDepartments", routing.managed(id));
        result.put(
                "capabilities",
                db.queryForList(
                        "SELECT capability FROM staff_capabilities WHERE user_id=?",
                        String.class,
                        id));
        result.put(
                "departments",
                db.queryForList(
                        "SELECT d.*,u.full_name manager_name FROM departments d LEFT JOIN users u"
                                + " ON u.id=d.manager_id WHERE NOT d.is_deleted ORDER BY d.name"));
        result.put(
                "people",
                db.queryForList(
                        "SELECT id,full_name,department_id,status FROM users WHERE NOT is_deleted"
                                + " AND status='ACTIVE' ORDER BY full_name"));
        result.put(
                "categories",
                db.queryForList(
                        "SELECT c.id,c.code,c.name,c.version,c.receiving_department_id,d.name"
                            + " department_name FROM service_categories c JOIN departments d ON"
                            + " d.id=c.receiving_department_id JOIN users m ON m.id=d.manager_id"
                            + " WHERE NOT c.is_deleted AND c.is_active AND d.is_active AND NOT"
                            + " d.is_deleted AND m.status='ACTIVE' AND NOT m.is_deleted ORDER BY"
                            + " c.name"));
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> work(WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        return db.queryForList(
                WORK_SELECT
                        + "WHERE w.assignee_id=? OR w.reviewer_id=? OR EXISTS(SELECT 1 FROM"
                        + " departments md WHERE md.id=w.department_id AND md.manager_id=? AND"
                        + " md.is_active AND NOT md.is_deleted) ORDER BY w.due_at,w.created_at"
                        + " DESC",
                id,
                id,
                id);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> requests(
            String scope, int page, String search, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        page = Math.min(Math.max(0, page), 1000000);
        int offset = page * 20;
        String filter;
        if ("mine".equals(scope)) filter = "r.requester_id=?";
        else if ("assigned".equals(scope)) filter = "a.assignee_id=?";
        else if ("queue".equals(scope))
            filter =
                    "EXISTS(SELECT 1 FROM departments md WHERE md.id=r.receiving_department_id AND"
                            + " md.manager_id=? AND md.is_active AND NOT md.is_deleted)";
        else throw invalid("Phạm vi yêu cầu không hợp lệ");
        String from =
                " FROM service_requests r JOIN service_categories c ON c.id=r.category_id LEFT JOIN"
                    + " departments d ON d.id=r.receiving_department_id JOIN users u ON"
                    + " u.id=r.requester_id LEFT JOIN service_assignments a ON a.request_id=r.id"
                    + " AND a.is_active LEFT JOIN users handler ON handler.id=a.assignee_id WHERE"
                    + " NOT r.is_deleted AND "
                        + filter
                        + " AND (lower(r.title) LIKE ? OR lower(r.request_number) LIKE ?)";
        String term = "%" + (search == null ? "" : search.trim().toLowerCase(Locale.ROOT)) + "%";
        long total = db.queryForObject("SELECT count(*)" + from, Long.class, id, term, term);
        var items =
                db.queryForList(
                        "SELECT"
                            + " r.id,r.request_number,r.title,r.description,r.status,r.priority,r.created_at,r.receiving_department_id,c.name"
                            + " category_name,d.name department_name,u.full_name"
                            + " requester_name,handler.full_name assignee_name,handler.status"
                            + " assignee_status"
                                + from
                                + " ORDER BY r.created_at DESC,r.id LIMIT 20 OFFSET ?",
                        id,
                        term,
                        term,
                        offset);
        return Map.of(
                "items",
                items,
                "totalItems",
                total,
                "page",
                Math.max(0, page),
                "hasNext",
                offset + 20 < total,
                "hasPrevious",
                page > 0);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detail(UUID work, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        var row = one(WORK_SELECT + "WHERE w.id=?", work);
        boolean manager = routing.manages(uuid(row, "department_id"), id),
                assignee = id.equals(uuid(row, "assignee_id")),
                reviewer = id.equals(uuid(row, "reviewer_id"));
        if (!manager && !assignee && !reviewer)
            throw new AccessDeniedException("Công việc ngoài phạm vi của bạn");
        Set<String> actions = new LinkedHashSet<>();
        String status = (String) row.get("status");
        if (!"COMPLETED".equals(status)) {
            actions.add("COMMENT");
            if (manager) actions.add("EDIT");
            if (manager
                    && !"REVIEW".equals(status)
                    && db.queryForList(
                                    "SELECT id FROM work_handovers WHERE work_id=? AND accepted_at"
                                            + " IS NULL",
                                    work)
                            .isEmpty()) actions.add("HANDOVER");
            if (assignee && "ASSIGNED".equals(status)) actions.add("START");
            if (assignee && "IN_PROGRESS".equals(status)) {
                actions.add("PROGRESS");
                actions.add("SUBMIT");
            }
            if (reviewer && !assignee && "REVIEW".equals(status)) {
                actions.add("APPROVE");
                actions.add("RETURN");
            }
            if (assignee && "HANDOVER".equals(status)) actions.add("ACCEPT_HANDOVER");
        }
        row.put("allowedActions", actions);
        row.put(
                "attachments",
                db.queryForList(
                        "SELECT f.id,f.original_name,f.size_bytes FROM department_work_files a JOIN"
                                + " stored_files f ON f.id=a.file_id WHERE a.work_id=? AND"
                                + " f.status='ACTIVE' ORDER BY a.created_at",
                        work));
        row.put(
                "events",
                db.queryForList(
                        "SELECT e.*,u.full_name actor_name FROM work_events e JOIN users u ON"
                                + " u.id=e.actor_id WHERE work_id=? ORDER BY e.created_at,e.id",
                        work));
        row.put(
                "handovers",
                db.queryForList(
                        "SELECT h.*,f.full_name from_name,t.full_name to_name FROM work_handovers h"
                                + " LEFT JOIN users f ON f.id=h.from_user_id JOIN users t ON"
                                + " t.id=h.to_user_id WHERE work_id=? ORDER BY created_at",
                        work));
        return row;
    }

    public Map<String, Object> createWork(WorkInput input, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        requireManager(input.departmentId(), id);
        requireReady(input.departmentId());
        requireMember(input.departmentId(), input.assigneeId());
        if (id.equals(input.assigneeId()))
            throw invalid("Không tự giao và tự nghiệm thu; cần người quản lý khác phụ trách");
        if (input.dueAt() == null || input.dueAt().isBefore(Instant.now()))
            throw invalid("Hạn công việc phải ở tương lai");
        if (!Set.of("LOW", "MEDIUM", "HIGH", "URGENT")
                .contains(input.priority() == null ? "" : input.priority()))
            throw invalid("Ưu tiên không hợp lệ");
        UUID work = UUID.randomUUID();
        db.update(
                "INSERT INTO"
                    + " department_work(id,department_id,title,description,priority,assignee_id,reviewer_id,due_at,created_by)"
                    + " VALUES (?,?,?,?,?,?,?,?,?)",
                work,
                input.departmentId(),
                text(input.title(), 255, "Tiêu đề"),
                text(input.description(), 10000, "Nội dung"),
                input.priority(),
                input.assigneeId(),
                id,
                java.sql.Timestamp.from(input.dueAt()),
                id);
        event(work, id, "CREATED", "Giao công việc");
        routing.notice(input.assigneeId(), "Công việc mới: " + input.title(), "WORK", work);
        return detail(work, p);
    }

    public Map<String, Object> command(UUID work, Command input, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        var initial = one("SELECT department_id FROM department_work WHERE id=?", work);
        db.queryForList(
                "SELECT id FROM departments WHERE id=? FOR UPDATE", initial.get("department_id"));
        var row = one("SELECT * FROM department_work WHERE id=? FOR UPDATE", work);
        version(row, input.version());
        var visible = detail(work, p);
        @SuppressWarnings("unchecked")
        Set<String> allowed = (Set<String>) visible.get("allowedActions");
        if (input.action() == null || !allowed.contains(input.action()))
            throw new AccessDeniedException("Thao tác không được phép ở trạng thái hiện tại");
        String status = (String) row.get("status"), next = status;
        String note = input.content() == null ? "" : input.content().trim();
        if (note.length() > 10000) throw invalid("Nội dung quá dài");
        switch (input.action()) {
            case "EDIT" -> throw invalid("Dùng biểu mẫu chỉnh sửa công việc");
            case "START" -> next = "IN_PROGRESS";
            case "COMMENT" -> note = text(note, 10000, "Trao đổi");
            case "PROGRESS" -> {
                if (input.progress() == null || input.progress() < 0 || input.progress() > 100)
                    throw invalid("Tiến độ từ 0 đến 100");
                db.update(
                        "UPDATE department_work SET progress=? WHERE id=?", input.progress(), work);
                note = "Tiến độ " + input.progress() + "%. " + note;
            }
            case "SUBMIT" -> {
                note = text(note, 10000, "Kết quả thực hiện");
                next = "REVIEW";
                routing.notice(
                        uuid(row, "reviewer_id"),
                        "Cần kiểm tra: " + row.get("title"),
                        "WORK",
                        work);
            }
            case "APPROVE" -> {
                next = "COMPLETED";
                db.update("UPDATE department_work SET progress=100 WHERE id=?", work);
                routing.notice(
                        uuid(row, "assignee_id"),
                        "Đã nghiệm thu: " + row.get("title"),
                        "WORK",
                        work);
            }
            case "RETURN" -> {
                note = text(note, 10000, "Lý do yêu cầu làm lại");
                next = "IN_PROGRESS";
                routing.notice(
                        uuid(row, "assignee_id"), "Cần làm lại: " + row.get("title"), "WORK", work);
            }
            case "HANDOVER" -> {
                requireMember(uuid(row, "department_id"), input.userId());
                if (input.userId().equals(uuid(row, "assignee_id"))
                        || input.userId().equals(uuid(row, "reviewer_id")))
                    throw invalid("Chọn người nhận khác người đang giữ việc và người nghiệm thu");
                if (!db.queryForList(
                                "SELECT id FROM work_handovers WHERE work_id=? AND accepted_at IS"
                                        + " NULL",
                                work)
                        .isEmpty()) throw invalid("Bàn giao trước chưa được xác nhận");
                note = text(note, 10000, "Nội dung bàn giao");
                db.update(
                        "INSERT INTO"
                            + " work_handovers(id,work_id,from_user_id,to_user_id,assigned_by,progress_snapshot)"
                            + " VALUES (?,?,?,?,?,?)",
                        UUID.randomUUID(),
                        work,
                        row.get("assignee_id") == null
                                ? row.get("previous_assignee_id")
                                : row.get("assignee_id"),
                        input.userId(),
                        id,
                        row.get("progress"));
                db.update(
                        "UPDATE department_work SET assignee_id=? WHERE id=?",
                        input.userId(),
                        work);
                next = "HANDOVER";
                routing.notice(
                        input.userId(), "Bàn giao cần rà soát: " + row.get("title"), "WORK", work);
            }
            case "ACCEPT_HANDOVER" -> {
                note = text(note, 10000, "Ghi nhận rà soát và phần việc tiếp tục");
                if (db.update(
                                "UPDATE work_handovers SET review_note=?,accepted_at=now() WHERE"
                                        + " work_id=? AND to_user_id=? AND accepted_at IS NULL",
                                note,
                                work,
                                id)
                        != 1) throw invalid("Không có bàn giao đang chờ bạn");
                next = "IN_PROGRESS";
                routing.notice(
                        uuid(row, "reviewer_id"),
                        "Đã tiếp nhận bàn giao: " + row.get("title"),
                        "WORK",
                        work);
            }
            default -> throw invalid("Thao tác không hợp lệ");
        }
        if (input.fileIds() != null)
            for (UUID file : input.fileIds()) {
                var stored = one("SELECT * FROM stored_files WHERE id=? FOR UPDATE", file);
                if (!id.equals(stored.get("uploaded_by"))
                        || !"ACTIVE".equals(stored.get("status"))
                        || !String.valueOf(stored.get("storage_path"))
                                .startsWith("TASK_ATTACHMENT/"))
                    throw new AccessDeniedException("Chỉ đính kèm tệp công việc do bạn tải lên");
                if (Boolean.TRUE.equals(
                        db.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM task_attachments WHERE file_id=?) OR"
                                    + " EXISTS(SELECT 1 FROM service_attachments WHERE file_id=?)"
                                    + " OR EXISTS(SELECT 1 FROM department_work_files WHERE"
                                    + " file_id=?)",
                                Boolean.class,
                                file,
                                file,
                                file))) throw invalid("Tệp đã được gắn vào công việc/yêu cầu");
                db.update(
                        "INSERT INTO department_work_files(work_id,file_id,uploaded_by) VALUES"
                                + " (?,?,?)",
                        work,
                        file,
                        id);
            }
        db.update(
                "UPDATE department_work SET status=?,version=version+1,updated_at=now() WHERE id=?",
                next,
                work);
        event(work, id, input.action(), note.isBlank() ? "Bắt đầu thực hiện" : note);
        return detail(work, p);
    }

    public record WorkEdit(
            String title,
            String description,
            String priority,
            Instant dueAt,
            String reason,
            Long version) {}

    public Map<String, Object> editWork(UUID work, WorkEdit input, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        var initial = one("SELECT department_id FROM department_work WHERE id=?", work);
        db.queryForList(
                "SELECT id FROM departments WHERE id=? FOR UPDATE", initial.get("department_id"));
        var row = one("SELECT * FROM department_work WHERE id=? FOR UPDATE", work);
        requireManager(uuid(row, "department_id"), id);
        version(row, input.version());
        if ("COMPLETED".equals(row.get("status"))) throw invalid("Công việc đã hoàn tất");
        if (input.dueAt() == null) throw invalid("Cần hạn công việc");
        if (!Set.of("LOW", "MEDIUM", "HIGH", "URGENT")
                .contains(input.priority() == null ? "" : input.priority()))
            throw invalid("Ưu tiên không hợp lệ");
        String reason = text(input.reason(), 1000, "Lý do thay đổi");
        db.update(
                "UPDATE department_work SET"
                    + " title=?,description=?,priority=?,due_at=?,version=version+1,updated_at=now()"
                    + " WHERE id=?",
                text(input.title(), 255, "Tiêu đề"),
                text(input.description(), 10000, "Nội dung"),
                input.priority(),
                java.sql.Timestamp.from(input.dueAt()),
                work);
        event(
                work,
                id,
                "EDIT",
                "Hạn cũ: " + row.get("due_at") + "; hạn mới: " + input.dueAt() + ". " + reason);
        routing.notice(
                uuid(row, "assignee_id"), "Cập nhật công việc: " + input.title(), "WORK", work);
        return detail(work, p);
    }

    public Map<String, Object> department(
            UUID department, DepartmentInput input, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        requireAdmin(id);
        String name = text(input.name(), 150, "Tên phòng");
        if (department == null) {
            String code = text(input.code(), 50, "Mã phòng").toUpperCase(Locale.ROOT);
            if (!code.matches("[A-Z0-9_-]{2,50}"))
                throw invalid("Mã phòng gồm chữ, số, dấu gạch; tối thiểu 2 ký tự");
            if (!db.queryForList("SELECT id FROM departments WHERE upper(code)=?", code).isEmpty())
                throw invalid("Mã phòng đã tồn tại");
            if (input.managerId() != null)
                throw invalid("Tạo phòng trước, sau đó gán nhân viên và chỉ định trưởng phòng");
            department = UUID.randomUUID();
            db.update(
                    "INSERT INTO"
                        + " departments(id,code,name,description,is_active,is_deleted,created_at,updated_at,version)"
                        + " VALUES (?,?,?,?,?,false,now(),now(),0)",
                    department,
                    code,
                    name,
                    input.description(),
                    input.active());
        } else {
            var old =
                    one(
                            "SELECT * FROM departments WHERE id=? AND NOT is_deleted FOR UPDATE",
                            department);
            version(old, input.version());
            if (input.managerId() != null) requireMember(department, input.managerId());
            boolean changing = !Objects.equals(old.get("manager_id"), input.managerId());
            if ((!input.active() || input.managerId() == null) && hasDepartmentOpenWork(department))
                throw invalid(
                        "Cần bàn giao công việc và yêu cầu đang mở trước khi dừng phòng hoặc bỏ"
                                + " trưởng phòng");
            if (changing && input.managerId() != null) {
                db.update(
                        "UPDATE department_work SET"
                                + " reviewer_id=?,version=version+1,updated_at=now() WHERE"
                                + " department_id=? AND status<>'COMPLETED'",
                        input.managerId(),
                        department);
                routing.notice(
                        input.managerId(),
                        "Bạn được chỉ định phụ trách phòng " + name,
                        "DEPARTMENT",
                        department);
            }
            db.update(
                    "UPDATE departments SET"
                        + " name=?,description=?,manager_id=?,is_active=?,version=version+1,updated_at=now()"
                        + " WHERE id=?",
                    name,
                    input.description(),
                    input.managerId(),
                    input.active(),
                    department);
        }
        audit(id, department, "DEPARTMENT_CHANGED", name);
        return one("SELECT * FROM departments WHERE id=?", department);
    }

    private boolean hasDepartmentOpenWork(UUID dept) {
        return Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM department_work WHERE department_id=? AND"
                            + " status<>'COMPLETED') OR EXISTS(SELECT 1 FROM service_requests WHERE"
                            + " receiving_department_id=? AND status NOT IN"
                            + " ('CLOSED','CANCELLED','REJECTED') AND NOT is_deleted)",
                        Boolean.class,
                        dept,
                        dept));
    }

    public void validateDepartmentStop(UUID department) {
        db.queryForList("SELECT id FROM departments WHERE id=? FOR UPDATE", department);
        if (hasDepartmentOpenWork(department))
            throw invalid("Cần bàn giao công việc và yêu cầu đang mở trước khi dừng phòng");
    }

    public void validateDepartmentManager(UUID department, UUID manager) {
        if (manager != null) requireMember(department, manager);
        var old = one("SELECT manager_id FROM departments WHERE id=?", department);
        if (!Objects.equals(old.get("manager_id"), manager) && hasDepartmentOpenWork(department))
            throw invalid(
                    "Dùng cổng phòng ban để chuyển đồng thời trách nhiệm kiểm tra công việc cho"
                            + " trưởng phòng mới");
    }

    public void validateStaffTransfer(UUID target) {
        requireNoResponsibilities(target);
        db.update("DELETE FROM staff_capabilities WHERE user_id=?", target);
    }

    public void validateLegacyRoles(UUID target, java.util.List<String> roles) {
        if (roles.stream().noneMatch(r -> "ADMIN".equalsIgnoreCase(r))) validateLegacyLock(target);
    }

    public void validateLegacyLock(UUID target) {
        guardLastAdmin(target);
        var auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication();
        if (auth != null
                && auth.getPrincipal() instanceof WorkSphereUserPrincipal principal
                && principal.userId().equals(target))
            throw invalid("Không tự khóa tài khoản trong phiên hiện tại");
    }

    public List<Map<String, Object>> staff(WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        requireAdmin(id);
        var result =
                db.queryForList(
                        "SELECT"
                            + " u.id,u.username,u.email,u.full_name,u.department_id,u.status,u.version,d.name"
                            + " department_name FROM users u LEFT JOIN departments d ON"
                            + " d.id=u.department_id WHERE NOT u.is_deleted ORDER BY u.full_name");
        for (var row : result) {
            row.put(
                    "roles",
                    db.queryForList(
                            "SELECT r.code FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE"
                                    + " ur.user_id=?",
                            String.class,
                            row.get("id")));
            row.put(
                    "capabilities",
                    db.queryForList(
                            "SELECT capability FROM staff_capabilities WHERE user_id=?",
                            String.class,
                            row.get("id")));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> hrStaff(WorkSphereUserPrincipal p) {
        requireCapability(actor(p), "HR_MANAGE");
        return db.queryForList(
                "SELECT u.id,u.full_name,u.status,u.version,d.name department_name FROM users u"
                        + " LEFT JOIN departments d ON d.id=u.department_id WHERE NOT u.is_deleted"
                        + " ORDER BY u.full_name");
    }

    public UUID createStaff(StaffInput input, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        requireAdmin(id);
        String username = text(input.username(), 50, "Tên đăng nhập");
        String email = text(input.email(), 255, "Email").toLowerCase(Locale.ROOT);
        if (!username.matches("[a-zA-Z0-9._-]{3,50}")
                || !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+"))
            throw invalid("Tên đăng nhập hoặc email không hợp lệ");
        validatePassword(input.password());
        if (!db.queryForList(
                        "SELECT id FROM users WHERE lower(username)=lower(?) OR lower(email)=?",
                        username,
                        email)
                .isEmpty()) throw invalid("Tên đăng nhập hoặc email đã tồn tại");
        if (input.departmentId() != null) activeDepartment(input.departmentId());
        Role role = roles.findByCode(validRole(input.role())).orElseThrow();
        User user =
                User.create(
                        UUID.randomUUID(),
                        username,
                        email,
                        encoder.encode(input.password()),
                        text(input.fullName(), 150, "Họ tên"));
        user.updateDepartmentId(input.departmentId());
        user.lock();
        user.unlock();
        users.saveAndFlush(user);
        userRoles.saveAndFlush(new UserRole(user.getId(), role.getId(), Instant.now(), id));
        audit(id, user.getId(), "USER_CREATED", "Tạo tài khoản và cấp vai trò " + role.getCode());
        if (input.departmentId() != null)
            routing.notifyManager(input.departmentId(), "Nhân viên mới: " + input.fullName(), null);
        return user.getId();
    }

    private String validRole(String role) {
        if (!Set.of("ADMIN", "EMPLOYEE").contains(role == null ? "" : role))
            throw invalid(
                    "Vai trò web là EMPLOYEE hoặc ADMIN; trưởng phòng được chỉ định tại phòng ban");
        return role;
    }

    private void activeDepartment(UUID dept) {
        var row = one("SELECT * FROM departments WHERE id=? AND NOT is_deleted", dept);
        if (!Boolean.TRUE.equals(row.get("is_active"))) throw invalid("Phòng đã ngừng hoạt động");
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 12 || password.length() > 128)
            throw invalid("Mật khẩu từ 12 đến 128 ký tự");
    }

    public void changeStaff(UUID target, StaffChange input, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        requireAdmin(id);
        var user = one("SELECT * FROM users WHERE id=? AND NOT is_deleted FOR UPDATE", target);
        version(user, input.version());
        if (input.departmentId() != null) activeDepartment(input.departmentId());
        if (!Objects.equals(user.get("department_id"), input.departmentId())) {
            requireNoResponsibilities(target);
            db.update("DELETE FROM staff_capabilities WHERE user_id=?", target);
        }
        String role = validRole(input.role());
        if (id.equals(target) && !"ADMIN".equals(role))
            throw invalid("Không tự thu hồi quyền quản trị trong phiên hiện tại");
        if (!"ADMIN".equals(role)) guardLastAdmin(target);
        List<String> caps = input.capabilities() == null ? List.of() : input.capabilities();
        if (!Set.of("HR_MANAGE", "TIME_REVIEW", "PAYROLL_MANAGE").containsAll(caps))
            throw invalid("Quyền chuyên trách không hợp lệ");
        db.update("DELETE FROM staff_capabilities WHERE user_id=?", target);
        for (String cap : new HashSet<>(caps))
            db.update(
                    "INSERT INTO staff_capabilities(user_id,capability,granted_by) VALUES (?,?,?)",
                    target,
                    cap,
                    id);
        db.update("DELETE FROM user_roles WHERE user_id=?", target);
        db.update(
                "INSERT INTO user_roles(user_id,role_id,assigned_at,assigned_by) SELECT"
                        + " ?,id,now(),? FROM roles WHERE code=?",
                target,
                id,
                role);
        db.update(
                "UPDATE users SET department_id=?,version=version+1,updated_at=now() WHERE id=?",
                input.departmentId(),
                target);
        audit(id, target, "ACCESS_CHANGED", text(input.reason(), 1000, "Lý do thay đổi quyền"));
        routing.notice(target, "Thông tin phòng ban/quyền của bạn đã thay đổi", "ACCOUNT", target);
        if (input.departmentId() != null)
            routing.notifyManager(input.departmentId(), "Cập nhật nhân sự trong phòng", null);
    }

    private void guardLastAdmin(UUID target) {
        db.queryForList("SELECT id FROM roles WHERE code='ADMIN' FOR UPDATE");
        if (admin(target)
                && db.queryForObject(
                                "SELECT count(*) FROM users u JOIN user_roles ur ON ur.user_id=u.id"
                                    + " JOIN roles r ON r.id=ur.role_id WHERE r.code='ADMIN' AND"
                                    + " u.status='ACTIVE' AND NOT u.is_deleted",
                                Integer.class)
                        <= 1) throw invalid("Phải giữ ít nhất một quản trị viên hoạt động");
    }

    private void requireNoResponsibilities(UUID target) {
        if (Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM staff_time_requests WHERE user_id=? AND"
                                + " (status='PENDING' OR (request_type='OVERTIME' AND"
                                + " status='APPROVED')))",
                        Boolean.class,
                        target)))
            throw invalid("Cần xử lý các đơn công/nghỉ/tăng ca đang chờ trước khi chuyển phòng");
        if (Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM departments WHERE manager_id=? AND is_active"
                                + " AND NOT is_deleted)",
                        Boolean.class,
                        target))) throw invalid("Cần chỉ định trưởng phòng thay thế trước");
        if (Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM department_work WHERE (assignee_id=? OR"
                            + " reviewer_id=?) AND status<>'COMPLETED') OR EXISTS(SELECT 1 FROM"
                            + " service_assignments a JOIN service_requests r ON r.id=a.request_id"
                            + " WHERE a.assignee_id=? AND a.is_active AND r.status NOT IN"
                            + " ('CLOSED','CANCELLED','REJECTED') AND NOT r.is_deleted)",
                        Boolean.class,
                        target,
                        target,
                        target)))
            throw invalid("Cần chuyển công việc/yêu cầu đang giữ trước khi chuyển phòng");
    }

    public void accountState(UUID target, Command input, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        var user = one("SELECT * FROM users WHERE id=? AND NOT is_deleted FOR UPDATE", target);
        version(user, input.version());
        if (id.equals(target)) throw invalid("Không tự thay đổi trạng thái tài khoản của mình");
        String reason = text(input.content(), 2000, "Căn cứ/lý do");
        switch (input.action() == null ? "" : input.action()) {
            case "LOCK" -> {
                requireAdmin(id);
                guardLastAdmin(target);
                db.update(
                        "UPDATE users SET status='LOCKED',version=version+1,updated_at=now() WHERE"
                                + " id=? AND status<>'DISABLED'",
                        target);
            }
            case "UNLOCK" -> {
                requireAdmin(id);
                if (!"LOCKED".equals(user.get("status")))
                    throw invalid("Chỉ mở khóa tài khoản đang khóa");
                db.update(
                        "UPDATE users SET status='ACTIVE',version=version+1,updated_at=now() WHERE"
                                + " id=?",
                        target);
            }
            case "DISABLE" -> {
                requireCapability(id, "HR_MANAGE");
                guardLastAdmin(target);
                if (!db.queryForList(
                                "SELECT id FROM departments WHERE manager_id=? AND is_active AND"
                                        + " NOT is_deleted",
                                target)
                        .isEmpty()) throw invalid("Cần chỉ định người phụ trách phòng thay thế");
                if (Boolean.TRUE.equals(
                        db.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM projects WHERE manager_id=? AND NOT"
                                    + " is_deleted AND status NOT IN ('COMPLETED','CANCELLED')) OR"
                                    + " EXISTS(SELECT 1 FROM task_assignments a JOIN tasks t ON"
                                    + " t.id=a.task_id WHERE a.assignee_id=? AND a.is_active AND"
                                    + " NOT t.is_deleted AND t.status NOT IN"
                                    + " ('COMPLETED','CANCELLED'))",
                                Boolean.class,
                                target,
                                target)))
                    throw invalid(
                            "Cần bàn giao trách nhiệm dự án/công việc kế thừa trước khi ngừng tài"
                                    + " khoản");
                for (var work :
                        db.queryForList(
                                "SELECT * FROM department_work WHERE assignee_id=? AND"
                                        + " status<>'COMPLETED' FOR UPDATE",
                                target)) {
                    if ("HANDOVER".equals(work.get("status")))
                        throw invalid("Cần xử lý bàn giao đang chờ của người nghỉ trước");
                    db.update(
                            "UPDATE department_work SET"
                                + " previous_assignee_id=assignee_id,assignee_id=NULL,status='HANDOVER',version=version+1,updated_at=now()"
                                + " WHERE id=?",
                            work.get("id"));
                    event(
                            uuid(work, "id"),
                            id,
                            "OFFBOARDING",
                            "Người phụ trách ngừng làm việc. " + reason);
                    routing.notice(
                            uuid(work, "reviewer_id"),
                            "Cần chọn người tiếp nhận: " + work.get("title"),
                            "WORK",
                            uuid(work, "id"));
                }
                // Preserve assignment/history; department manager sees tickets in their queue and
                // reassigns.
                db.update(
                        "UPDATE users SET status='DISABLED',version=version+1,updated_at=now()"
                                + " WHERE id=?",
                        target);
                db.update("DELETE FROM staff_capabilities WHERE user_id=?", target);
                if (user.get("department_id") != null)
                    routing.notifyManager(
                            uuid(user, "department_id"),
                            "Nhân viên đã ngừng làm việc; kiểm tra hàng đợi cần bàn giao",
                            null);
            }
            default -> throw invalid("Thao tác tài khoản không hợp lệ");
        }
        sessions.revokeAllActiveByUserId(target, Instant.now());
        refresh.revokeAllByUserId(target, Instant.now());
        audit(id, target, "ACCOUNT_" + input.action(), reason);
    }

    public void route(UUID category, RouteInput input, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        requireAdmin(id);
        if (input.departmentId() == null) throw invalid("Chọn phòng tiếp nhận");
        activeDepartment(input.departmentId());
        var row =
                one(
                        "SELECT * FROM service_categories WHERE id=? AND NOT is_deleted FOR UPDATE",
                        category);
        version(row, input.version());
        db.update(
                "UPDATE service_categories SET"
                    + " receiving_department_id=?,version=version+1,updated_at=now() WHERE id=?",
                input.departmentId(),
                category);
        audit(id, category, "CATEGORY_ROUTED", "Phòng nhận " + input.departmentId());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> categories(WorkSphereUserPrincipal p) {
        requireAdmin(actor(p));
        return db.queryForList(
                "SELECT * FROM service_categories WHERE NOT is_deleted ORDER BY name");
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> notices(WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        return db.queryForList(
                "SELECT id,title,reference_type,reference_id,read_at,created_at FROM"
                    + " workplace_notices WHERE user_id=? UNION ALL SELECT"
                    + " id,title,reference_type,reference_id,read_at,created_at FROM notifications"
                    + " WHERE recipient_id=? ORDER BY created_at DESC LIMIT 200",
                id,
                id);
    }

    public void readNotice(UUID notice, WorkSphereUserPrincipal p) {
        UUID id = actor(p);
        int n =
                db.update(
                        "UPDATE workplace_notices SET read_at=COALESCE(read_at,now()) WHERE id=?"
                                + " AND user_id=?",
                        notice,
                        id);
        n +=
                db.update(
                        "UPDATE notifications SET read_at=COALESCE(read_at,now()),is_read=true"
                                + " WHERE id=? AND recipient_id=?",
                        notice,
                        id);
        if (n == 0) throw new AccessDeniedException("Thông báo ngoài phạm vi");
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> audit(WorkSphereUserPrincipal p) {
        requireAdmin(actor(p));
        return db.queryForList(
                "SELECT e.id,e.actor_id,e.subject_id,e.event_type,e.created_at,CASE WHEN"
                    + " e.event_type='ACCOUNT_DISABLE' THEN 'Hồ sơ nhân sự thuộc quyền chuyên"
                    + " trách' ELSE e.content END content,u.full_name actor_name FROM"
                    + " workplace_events e JOIN users u ON u.id=e.actor_id WHERE e.event_type NOT"
                    + " LIKE 'TIME_%' AND e.event_type NOT LIKE 'HR_%' AND e.event_type NOT LIKE"
                    + " 'PAYROLL_%' ORDER BY created_at DESC LIMIT 200");
    }
}
