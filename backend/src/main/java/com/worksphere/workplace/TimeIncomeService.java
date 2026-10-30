package com.worksphere.workplace;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.organization.application.DepartmentRouting;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.*;
import java.time.*;
import java.util.*;

/** Day-shift attendance and gross work-pay reconciliation. Never invents salary/calendar data. */
@Service
@Transactional
public class TimeIncomeService {
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    @org.springframework.beans.factory.annotation.Autowired private Clock clock;
    private final JdbcTemplate db;

    @org.springframework.beans.factory.annotation.Autowired
    private com.worksphere.organization.application.ApprovalPolicy authority;

    @org.springframework.beans.factory.annotation.Autowired
    private AttendanceStationService attendanceStation;

    private final WorkplaceService access;
    private final DepartmentRouting routing;

    public TimeIncomeService(JdbcTemplate db, WorkplaceService access, DepartmentRouting routing) {
        this.db = db;
        this.access = access;
        this.routing = routing;
    }

    public record CalendarInput(
            String period,
            List<Integer> weekdays,
            String shiftStart,
            String shiftEnd,
            int breakMinutes,
            List<LocalDate> holidays,
            String breakStart,
            String breakEnd,
            Integer lateGraceMinutes) {}

    public record ImportRow(
            UUID userId,
            LocalDate workDate,
            Instant clockIn,
            Instant clockOut,
            int regularMinutes,
            String sourceReference) {}

    public record TimeInput(
            String requestType,
            LocalDate workDate,
            Instant startsAt,
            Instant endsAt,
            int requestedMinutes,
            String reason,
            String exceptionReason) {
        public TimeInput(
                String type,
                LocalDate day,
                Instant start,
                Instant end,
                int minutes,
                String reason) {
            this(type, day, start, end, minutes, reason, null);
        }
    }

    public record Review(
            String action,
            String reason,
            Integer actualMinutes,
            Long version,
            Boolean acknowledgeNetwork,
            String exceptionReason) {}

    public record BalanceInput(UUID userId, int year, int allowanceMinutes, String reason) {}

    public record IncomeInput(
            UUID userId,
            String period,
            BigDecimal monthlyWorkPay,
            LocalDate employmentFrom,
            LocalDate employmentTo,
            Long version) {}

    private BusinessRuleException bad(String message) {
        return new BusinessRuleException("VALIDATION_ERROR", message);
    }

    private Map<String, Object> one(String query, Object... args) {
        var rows = db.queryForList(query, args);
        if (rows.isEmpty()) throw bad("Chưa có dữ liệu cần thiết");
        return rows.getFirst();
    }

    private String reason(String value) {
        if (value == null || value.isBlank() || value.length() > 2000)
            throw bad("Cần lý do từ 1 đến 2000 ký tự");
        return value.trim();
    }

    private void version(Map<String, Object> row, Long v) {
        if (v == null || ((Number) row.get("version")).longValue() != v)
            throw new BusinessRuleException(
                    "OPTIMISTIC_LOCK_CONFLICT", "Dữ liệu vừa thay đổi. Vui lòng tải lại.");
    }

    private java.sql.Timestamp stamp(Instant t) {
        return java.sql.Timestamp.from(t);
    }

    private Instant instant(Object value) {
        return ((java.sql.Timestamp) value).toInstant();
    }

    private void audit(UUID actor, UUID subject, String type) {
        db.update(
                "INSERT INTO workplace_events(id,actor_id,subject_id,event_type,content) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                actor,
                subject,
                type,
                "Thao tác có hồ sơ nghiệp vụ riêng");
    }

    private YearMonth period(String value) {
        try {
            var month = YearMonth.parse(value);
            if (month.getYear() < 2000 || month.getYear() > 2100)
                throw new IllegalArgumentException();
            return month;
        } catch (Exception e) {
            throw bad("Kỳ công theo định dạng YYYY-MM, từ năm 2000 đến 2100");
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> people(WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        if (access.admin(actor))
            throw new AccessDeniedException(
                    "Dùng không gian quản trị tài khoản; đây là nhân sự nghiệp vụ");
        boolean specialist =
                access.capability(actor, "PAYROLL_MANAGE")
                        || access.capability(actor, "TIME_REVIEW")
                        || access.capability(actor, "HR_MANAGE");
        var depts = new java.util.HashSet<>(authority.managed(actor, "OPERATIONS", true));
        depts.addAll(authority.managed(actor, "TIME", true));
        String scope =
                depts.stream()
                        .map(UUID::toString)
                        .collect(java.util.stream.Collectors.joining(","));
        return db.queryForList(
                "SELECT id,full_name,status,department_id FROM users u WHERE NOT is_deleted AND"
                        + " (id=? OR ? OR department_id IN (SELECT"
                        + " unnest(string_to_array(?,',')::uuid[]))) AND NOT EXISTS(SELECT 1 FROM"
                        + " user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND"
                        + " r.code='ADMIN') ORDER BY full_name LIMIT 1000",
                actor,
                specialist,
                scope);
    }

    private void lockPeriod(UUID user, LocalDate day) {
        // Serialize all mutations of a user's monthly ledger, including first payroll creation.
        db.queryForList(
                "SELECT pg_advisory_xact_lock(hashtextextended(?,0))",
                user + ":" + YearMonth.from(day));
        if (Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM income_periods WHERE user_id=? AND period=?"
                                + " AND status='LOCKED')",
                        Boolean.class,
                        user,
                        YearMonth.from(day).toString())))
            throw bad("Kỳ đã chốt; không thay đổi dữ liệu nguồn của phiếu đã chốt");
    }

    private void calendarLock(YearMonth month) {
        db.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", "calendar:" + month);
    }

    private Map<String, Object> day(LocalDate day) {
        return one("SELECT * FROM work_calendar WHERE work_date=?", java.sql.Date.valueOf(day));
    }

    private void active(UUID user) {
        if (!Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM users WHERE id=? AND status='ACTIVE' AND NOT"
                                + " is_deleted)",
                        Boolean.class,
                        user))) throw bad("Nhân viên không hoạt động");
    }

    private void eligibleHistorical(UUID user, Instant end) {
        var row =
                one("SELECT status,access_ends_at FROM users WHERE id=? AND NOT is_deleted", user);
        if (access.admin(user) || "PENDING".equals(row.get("status")) || end == null)
            throw bad("Hồ sơ nhân viên chưa hợp lệ");
        if (!"ACTIVE".equals(row.get("status")) && row.get("access_ends_at") == null)
            throw bad("Cần mốc kết thúc đã xác nhận trước khi đối soát tài khoản không hoạt động");
        if (row.get("access_ends_at") != null && end.isAfter(instant(row.get("access_ends_at"))))
            throw bad("Khoảng công vượt mốc kết thúc đã xác nhận");
    }

    private long interval(LocalDate date, Instant start, Instant end) {
        if (date == null
                || start == null
                || end == null
                || !end.isAfter(start)
                || !start.atZone(ZONE).toLocalDate().equals(date)
                || !end.atZone(ZONE).toLocalDate().equals(date))
            throw bad("Bản đầu hỗ trợ khoảng thời gian trong cùng một ngày");
        if (start.atZone(ZONE).toLocalTime().isBefore(LocalTime.of(6, 0))
                || end.atZone(ZONE).toLocalTime().isAfter(LocalTime.of(22, 0)))
            throw bad("Ca đêm cần chính sách riêng; bản đối soát này chỉ hỗ trợ 06:00–22:00");
        return Duration.between(start, end).toMinutes();
    }

    private boolean reviewer(UUID actor, UUID department) {
        return routing.manages(department, actor) || access.capability(actor, "TIME_REVIEW");
    }

    public void configureCalendar(CalendarInput input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "TIME_REVIEW");
        YearMonth month = period(input.period());
        calendarLock(month);
        if (Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM income_periods WHERE period=? AND"
                                + " status='LOCKED')",
                        Boolean.class,
                        month.toString())))
            throw bad("Đã có phiếu chốt trong tháng; không đổi lịch nguồn");
        if (input.weekdays() == null
                || input.weekdays().isEmpty()
                || !Set.of(1, 2, 3, 4, 5, 6, 7).containsAll(input.weekdays())
                || input.weekdays().size() > 6) throw bad("Chọn tối đa 6 ngày làm việc mỗi tuần");
        LocalTime start, end;
        try {
            start = LocalTime.parse(input.shiftStart());
            end = LocalTime.parse(input.shiftEnd());
        } catch (Exception ex) {
            throw bad("Giờ làm việc không hợp lệ");
        }
        int minutes = (int) Duration.between(start, end).toMinutes() - input.breakMinutes();
        if (start.isBefore(LocalTime.of(6, 0))
                || end.isAfter(LocalTime.of(22, 0))
                || minutes <= 0
                || minutes > 480
                || input.breakMinutes() < 0)
            throw bad("Ca ban ngày có thời gian làm việc từ 1 đến 480 phút");
        LocalTime breakStart = null, breakEnd = null;
        try {
            if (input.breakMinutes() > 0) {
                breakStart = LocalTime.parse(input.breakStart());
                breakEnd = LocalTime.parse(input.breakEnd());
                if (breakStart.isBefore(start)
                        || breakEnd.isAfter(end)
                        || !breakEnd.isAfter(breakStart)
                        || Duration.between(breakStart, breakEnd).toMinutes()
                                != input.breakMinutes()) throw new IllegalArgumentException();
            }
        } catch (Exception ex) {
            throw bad("Khoảng nghỉ cụ thể phải nằm trong ca và bằng số phút nghỉ đã chọn");
        }
        int grace = input.lateGraceMinutes() == null ? 0 : input.lateGraceMinutes();
        if (grace < 0 || grace > 120)
            throw bad("Dung sai đi muộn từ 0 đến 120 phút, không thay đổi phút công thực tế");
        Set<LocalDate> holidays =
                new HashSet<>(input.holidays() == null ? List.of() : input.holidays());
        if (holidays.stream().anyMatch(d -> !YearMonth.from(d).equals(month)))
            throw bad("Ngày lễ phải thuộc kỳ đang cấu hình");
        // Avoid reinterpreting attendance/approvals after they have been recorded.
        if (Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM attendance_records WHERE work_date BETWEEN ?"
                            + " AND ?) OR EXISTS(SELECT 1 FROM staff_time_requests WHERE work_date"
                            + " BETWEEN ? AND ?)",
                        Boolean.class,
                        java.sql.Date.valueOf(month.atDay(1)),
                        java.sql.Date.valueOf(month.atEndOfMonth()),
                        java.sql.Date.valueOf(month.atDay(1)),
                        java.sql.Date.valueOf(month.atEndOfMonth()))))
            throw bad(
                    "Tháng đã có công/đơn. Giữ lịch hiện tại để không đổi ý nghĩa dữ liệu đã ghi"
                            + " nhận");
        for (int n = 1; n <= month.lengthOfMonth(); n++) {
            LocalDate date = month.atDay(n);
            boolean scheduled = input.weekdays().contains(date.getDayOfWeek().getValue());
            String kind = holidays.contains(date) ? "HOLIDAY" : scheduled ? "NORMAL" : "WEEKLY_OFF";
            boolean hasPunch =
                    db.queryForObject(
                            "SELECT EXISTS(SELECT 1 FROM attendance_punches WHERE work_date=?)",
                            Boolean.class,
                            java.sql.Date.valueOf(date));
            if (hasPunch) {
                var old =
                        one(
                                "SELECT * FROM work_calendar WHERE work_date=?",
                                java.sql.Date.valueOf(date));
                if (!kind.equals(old.get("day_kind"))
                        || ((Number) old.get("normal_minutes")).intValue()
                                != (scheduled ? minutes : 0)
                        || !java.sql.Time.valueOf(start).equals(old.get("shift_start"))
                        || !java.sql.Time.valueOf(end).equals(old.get("shift_end"))
                        || ((Number) old.get("break_minutes")).intValue() != input.breakMinutes()
                        || old.get("break_start") != null
                                && (!java.sql.Time.valueOf(breakStart)
                                                .equals(old.get("break_start"))
                                        || !java.sql.Time.valueOf(breakEnd)
                                                .equals(old.get("break_end")))
                        || ((Number) old.get("late_grace_minutes")).intValue() != grace)
                    throw bad(
                            "Ngày đã có lượt quét; chỉ bổ sung khoảng nghỉ còn thiếu, không đổi"
                                    + " lịch nguồn");
            }
            db.update(
                    "INSERT INTO"
                        + " work_calendar(work_date,day_kind,normal_minutes,shift_start,shift_end,break_minutes,configured_by,break_start,break_end,late_grace_minutes)"
                        + " VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(work_date) DO UPDATE SET"
                        + " day_kind=excluded.day_kind,normal_minutes=excluded.normal_minutes,shift_start=excluded.shift_start,shift_end=excluded.shift_end,break_minutes=excluded.break_minutes,configured_by=excluded.configured_by,configured_at=now(),break_start=excluded.break_start,break_end=excluded.break_end,late_grace_minutes=excluded.late_grace_minutes",
                    java.sql.Date.valueOf(date),
                    kind,
                    scheduled ? minutes : 0,
                    java.sql.Time.valueOf(start),
                    java.sql.Time.valueOf(end),
                    input.breakMinutes(),
                    actor,
                    breakStart == null ? null : java.sql.Time.valueOf(breakStart),
                    breakEnd == null ? null : java.sql.Time.valueOf(breakEnd),
                    grace);
        }
        audit(actor, null, "TIME_CALENDAR_CONFIGURED");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> overview(String monthText, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        YearMonth month = period(monthText);
        var first = java.sql.Date.valueOf(month.atDay(1));
        var last = java.sql.Date.valueOf(month.atEndOfMonth());
        String scope =
                "(r.user_id=? OR u.department_id IN (SELECT unnest(string_to_array(?,',')::uuid[]))"
                        + " OR ?)";
        String reviewDepartments =
                authority.managed(actor, "TIME", true).stream()
                        .map(UUID::toString)
                        .collect(java.util.stream.Collectors.joining(","));
        boolean specialist = access.capability(actor, "TIME_REVIEW");
        Map<String, Object> result =
                Map.of(
                        "calendar",
                        db.queryForList(
                                "SELECT * FROM work_calendar WHERE work_date BETWEEN ? AND ? ORDER"
                                        + " BY work_date",
                                first,
                                last),
                        "attendance",
                        db.queryForList(
                                "SELECT r.*,u.full_name,u.department_id FROM attendance_records r"
                                    + " JOIN users u ON u.id=r.user_id WHERE r.work_date BETWEEN ?"
                                    + " AND ? AND "
                                        + scope
                                        + " ORDER BY r.work_date DESC,u.full_name",
                                first,
                                last,
                                actor,
                                reviewDepartments,
                                specialist),
                        "requests",
                        db.queryForList(
                                "SELECT r.*,u.full_name,u.department_id FROM staff_time_requests r"
                                    + " JOIN users u ON u.id=r.user_id WHERE r.work_date BETWEEN ?"
                                    + " AND ? AND (r.user_id=? OR r.department_id IN (SELECT"
                                    + " unnest(string_to_array(?,',')::uuid[])) OR ?) ORDER BY"
                                    + " r.created_at DESC",
                                first,
                                last,
                                actor,
                                reviewDepartments,
                                specialist),
                        "absences",
                        db.queryForList(
                                "SELECT a.*,u.full_name FROM attendance_absences a JOIN users u ON"
                                        + " u.id=a.user_id WHERE a.work_date BETWEEN ? AND ? AND"
                                        + " a.revoked_at IS NULL AND (a.user_id=? OR ? OR"
                                        + " u.department_id IN (SELECT"
                                        + " unnest(string_to_array(?,',')::uuid[])))",
                                first,
                                last,
                                actor,
                                specialist,
                                reviewDepartments),
                        "balances",
                        db.queryForList(
                                "SELECT b.*,u.full_name FROM paid_leave_balances b JOIN users u ON"
                                    + " u.id=b.user_id WHERE b.leave_year=? AND (b.user_id=? OR ?)",
                                month.getYear(),
                                actor,
                                access.capability(actor, "HR_MANAGE")));
        for (String kind : List.of("attendance", "requests"))
            for (var r : (List<Map<String, Object>>) result.get(kind))
                r.put(
                        "canReview",
                        !actor.equals(r.get("submitted_by"))
                                && authority.time(
                                        (UUID) r.get("department_id"),
                                        (UUID) r.get("user_id"),
                                        actor));
        var extended = new LinkedHashMap<>(result);
        extended.put("punches", attendanceStation.punches(monthText, p));
        extended.put("today", attendanceStation.today(p));
        return extended;
    }

    public void importAttendance(List<ImportRow> rows, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "TIME_REVIEW");
        if (rows == null
                || rows.isEmpty()
                || rows.size() > 200
                || rows.stream().anyMatch(Objects::isNull))
            throw bad("Nhập từ 1 đến 200 bản ghi mỗi lượt");
        for (ImportRow row :
                rows.stream()
                        .sorted(Comparator.comparing(r -> r.userId() + ":" + r.workDate()))
                        .toList()) {
            if (row.clockOut() == null || row.clockOut().isAfter(Instant.now(clock)))
                throw bad("Không nhập công cho thời điểm chưa xảy ra");
            eligibleHistorical(row.userId(), row.clockOut());
            long duration = interval(row.workDate(), row.clockIn(), row.clockOut());
            YearMonth month = YearMonth.from(row.workDate());
            calendarLock(month);
            lockPeriod(row.userId(), row.workDate());
            var calendar = day(row.workDate());
            if (row.regularMinutes() < 0
                    || row.regularMinutes() > duration
                    || row.regularMinutes() > ((Number) calendar.get("normal_minutes")).intValue())
                throw bad("Số phút công vượt khoảng ghi nhận hoặc lịch làm việc");
            String source = reason(row.sourceReference());
            if (source.length() > 255) throw bad("Mã nguồn tối đa 255 ký tự");
            var previous =
                    db.queryForList(
                            "SELECT id FROM attendance_records WHERE user_id=? AND work_date=?",
                            row.userId(),
                            java.sql.Date.valueOf(row.workDate()));
            if (!previous.isEmpty())
                throw bad("Ngày công đã có; dùng yêu cầu bổ sung công thay vì ghi đè");
            UUID id = UUID.randomUUID();
            db.update(
                    "INSERT INTO"
                        + " attendance_records(id,user_id,work_date,clock_in,clock_out,regular_minutes,source_reference,imported_by)"
                        + " VALUES (?,?,?,?,?,?,?,?)",
                    id,
                    row.userId(),
                    java.sql.Date.valueOf(row.workDate()),
                    stamp(row.clockIn()),
                    stamp(row.clockOut()),
                    row.regularMinutes(),
                    source,
                    actor);
            audit(actor, id, "TIME_IMPORTED");
        }
    }

    public void request(TimeInput input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        submitRequest(input, actor, actor);
    }

    public record CorrectionInput(
            UUID userId,
            LocalDate workDate,
            Instant startsAt,
            Instant endsAt,
            int requestedMinutes,
            String reason) {}

    public void correctionFor(CorrectionInput r, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "TIME_REVIEW");
        if (actor.equals(r.userId()))
            throw new AccessDeniedException("Đơn của bản thân dùng luồng cá nhân");
        eligibleHistorical(r.userId(), r.endsAt());
        submitRequest(
                new TimeInput(
                        "TIME_CORRECTION",
                        r.workDate(),
                        r.startsAt(),
                        r.endsAt(),
                        r.requestedMinutes(),
                        r.reason()),
                actor,
                r.userId());
    }

    private void submitRequest(TimeInput input, UUID actor, UUID subject) {
        var user = one("SELECT department_id FROM users WHERE id=?", subject);
        UUID department = (UUID) user.get("department_id");
        if (department == null) throw bad("Bạn chưa được gán phòng ban");
        routing.requireReceiving(department);
        long duration = interval(input.workDate(), input.startsAt(), input.endsAt());
        calendarLock(YearMonth.from(input.workDate()));
        lockPeriod(subject, input.workDate());
        var calendar = day(input.workDate());
        if (!Set.of("LEAVE_PAID", "LEAVE_UNPAID", "OVERTIME", "TIME_CORRECTION")
                .contains(input.requestType() == null ? "" : input.requestType()))
            throw bad("Loại đơn không hợp lệ");
        if ("TIME_CORRECTION".equals(input.requestType())
                && input.endsAt().isAfter(Instant.now(clock)))
            throw bad("Chỉ bổ sung công cho thời gian đã xảy ra");
        if (input.requestedMinutes() <= 0
                || input.requestedMinutes() > duration
                || (!"OVERTIME".equals(input.requestType())
                        && input.requestedMinutes()
                                > ((Number) calendar.get("normal_minutes")).intValue()))
            throw bad("Thời lượng đề nghị không phù hợp với lịch");
        if (input.requestType().startsWith("LEAVE") && !"NORMAL".equals(calendar.get("day_kind")))
            throw bad("Đơn nghỉ áp dụng cho ngày làm việc bình thường");
        if ("OVERTIME".equals(input.requestType()) && "NORMAL".equals(calendar.get("day_kind"))) {
            var shiftStart = ((java.sql.Time) calendar.get("shift_start")).toLocalTime();
            var shiftEnd = ((java.sql.Time) calendar.get("shift_end")).toLocalTime();
            if (input.startsAt().atZone(ZONE).toLocalTime().isBefore(shiftEnd)
                    && input.endsAt().atZone(ZONE).toLocalTime().isAfter(shiftStart))
                throw bad("Khoảng tăng ca không được chồng lên ca làm bình thường");
        }
        if (Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM staff_time_requests WHERE user_id=? AND"
                                + " work_date=? AND request_type=? AND (status='PENDING' OR"
                                + " (request_type<>'TIME_CORRECTION' AND status<>'REJECTED')))",
                        Boolean.class,
                        subject,
                        java.sql.Date.valueOf(input.workDate()),
                        input.requestType())))
            throw bad("Đã có đơn cùng loại trong ngày đang được xử lý");
        if ("OVERTIME".equals(input.requestType())
                && !input.startsAt().isAfter(Instant.now(clock))
                && (input.exceptionReason() == null
                        || input.exceptionReason().trim().length() < 10))
            throw bad(
                    "OT phát sinh sau giờ bắt đầu cần giải trình ngoại lệ ít nhất 10 ký tự và người"
                            + " khác phê duyệt");
        if (input.exceptionReason() != null && input.exceptionReason().length() > 2000)
            throw bad("Giải trình tối đa 2000 ký tự");
        UUID id = UUID.randomUUID();
        db.update(
                "INSERT INTO"
                    + " staff_time_requests(id,user_id,department_id,request_type,work_date,starts_at,ends_at,requested_minutes,reason,submitted_by)"
                    + " VALUES (?,?,?,?,?,?,?,?,?,?)",
                id,
                subject,
                department,
                input.requestType(),
                java.sql.Date.valueOf(input.workDate()),
                stamp(input.startsAt()),
                stamp(input.endsAt()),
                input.requestedMinutes(),
                reason(input.reason()),
                actor);
        routing.notifyTimeApprovers(department, subject, id);
        if (input.exceptionReason() != null)
            db.update(
                    "UPDATE staff_time_requests SET exception_reason=? WHERE id=?",
                    input.exceptionReason().trim(),
                    id);
        audit(actor, id, "TIME_REQUEST_CREATED");
    }

    public void reviewAttendance(UUID record, Review input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        var row =
                one(
                        "SELECT r.*,u.department_id FROM attendance_records r JOIN users u ON"
                                + " u.id=r.user_id WHERE r.id=?",
                        record);
        UUID user = (UUID) row.get("user_id");
        if (actor.equals(row.get("submitted_by"))
                || !authority.time((UUID) row.get("department_id"), user, actor))
            throw new AccessDeniedException("Không tự duyệt công hoặc duyệt ngoài phạm vi");
        calendarLock(YearMonth.from(((java.sql.Date) row.get("work_date")).toLocalDate()));
        lockPeriod(user, ((java.sql.Date) row.get("work_date")).toLocalDate());
        row =
                one(
                        "SELECT r.*,u.department_id FROM attendance_records r JOIN users u ON"
                                + " u.id=r.user_id WHERE r.id=? FOR UPDATE OF r",
                        record);
        version(row, input.version());
        if (!"PENDING".equals(row.get("status"))) throw bad("Bản ghi đã được đối soát");
        if (!Set.of("APPROVE", "REJECT").contains(input.action() == null ? "" : input.action()))
            throw bad("Thao tác không hợp lệ");
        if ("APPROVE".equals(input.action())
                && Boolean.TRUE.equals(row.get("network_review_required"))
                && !Boolean.TRUE.equals(input.acknowledgeNetwork()))
            throw bad("Cần xác nhận đã kiểm tra cảnh báo mạng trước khi duyệt công");
        if ("APPROVE".equals(input.action())
                && Boolean.TRUE.equals(
                        db.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM staff_time_requests WHERE user_id=?"
                                        + " AND work_date=? AND request_type IN"
                                        + " ('LEAVE_PAID','LEAVE_UNPAID') AND status='APPROVED' AND"
                                        + " starts_at<? AND ends_at>?)",
                                Boolean.class,
                                user,
                                row.get("work_date"),
                                row.get("clock_out"),
                                row.get("clock_in"))))
            throw bad("Bản ghi công chồng lên đơn nghỉ đã duyệt; cần đối soát lại");
        db.update(
                "UPDATE attendance_records SET"
                    + " status=?,reviewed_by=?,review_note=?,reviewed_at=now(),version=version+1"
                    + " WHERE id=?",
                "APPROVE".equals(input.action()) ? "APPROVED" : "REJECTED",
                actor,
                reason(input.reason()),
                record);
        audit(actor, record, "TIME_REVIEWED");
    }

    public void reviewRequest(UUID request, Review input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        var row = one("SELECT * FROM staff_time_requests WHERE id=?", request);
        UUID user = (UUID) row.get("user_id");
        LocalDate date = ((java.sql.Date) row.get("work_date")).toLocalDate();
        if (actor.equals(row.get("submitted_by"))
                || !authority.time((UUID) row.get("department_id"), user, actor))
            throw new AccessDeniedException("Không tự duyệt đơn hoặc duyệt ngoài phạm vi");
        calendarLock(YearMonth.from(date));
        lockPeriod(user, date);
        row = one("SELECT * FROM staff_time_requests WHERE id=? FOR UPDATE", request);
        version(row, input.version());
        String note = reason(input.reason()), type = (String) row.get("request_type");
        int minutes = ((Number) row.get("requested_minutes")).intValue();
        if ("CONFIRM".equals(input.action())) {
            if (instant(row.get("ends_at")).isAfter(Instant.now(clock)))
                throw bad("Chưa đến thời điểm xác nhận thực tế tăng ca");
            if (!"OVERTIME".equals(type)
                    || !"APPROVED".equals(row.get("status"))
                    || input.actualMinutes() == null
                    || input.actualMinutes() < 0
                    || input.actualMinutes() > minutes)
                throw bad("Chỉ xác nhận thời gian thực tế của đơn tăng ca đã duyệt");
            if (input.actualMinutes() > 0) {
                var scans =
                        db.queryForList(
                                "SELECT * FROM attendance_punches WHERE overtime_request_id=? ORDER"
                                        + " BY recorded_at",
                                request);
                if (!scans.isEmpty()) {
                    var otIn =
                            scans.stream()
                                    .filter(r -> "OT_IN".equals(r.get("punch_type")))
                                    .findFirst()
                                    .orElseThrow(() -> bad("Thiếu lượt bắt đầu OT"));
                    var otOut =
                            scans.stream()
                                    .filter(r -> "OT_OUT".equals(r.get("punch_type")))
                                    .findFirst()
                                    .orElseThrow(() -> bad("Thiếu lượt kết thúc OT"));
                    long measured =
                            AttendanceRules.overlap(
                                    instant(otIn.get("recorded_at")),
                                    instant(otOut.get("recorded_at")),
                                    instant(row.get("starts_at")),
                                    instant(row.get("ends_at")));
                    if (input.actualMinutes() > measured)
                        throw bad("Số phút OT vượt thời gian thực tế trong khoảng đã duyệt");
                    if (scans.stream().anyMatch(r -> !"MATCH".equals(r.get("network_status")))
                            && !Boolean.TRUE.equals(input.acknowledgeNetwork()))
                        throw bad("Cần xác minh cảnh báo mạng của các lượt OT");
                } else {
                    var attendance =
                            one(
                                    "SELECT * FROM attendance_records WHERE user_id=? AND"
                                            + " work_date=? AND status='APPROVED'",
                                    user,
                                    java.sql.Date.valueOf(date));
                    if (instant(attendance.get("clock_in")).isAfter(instant(row.get("starts_at")))
                            || instant(attendance.get("clock_out"))
                                    .isBefore(instant(row.get("ends_at"))))
                        throw bad(
                                "Khoảng tăng ca chưa được bản ghi công xác nhận đầy đủ; cần bổ sung"
                                        + " công trước");
                }
            }
            db.update(
                    "UPDATE staff_time_requests SET"
                        + " status='CONFIRMED',actual_minutes=?,reviewed_by=?,review_note=?,reviewed_at=now(),version=version+1"
                        + " WHERE id=?",
                    input.actualMinutes(),
                    actor,
                    note,
                    request);
        } else {
            if (!"PENDING".equals(row.get("status"))
                    || !Set.of("APPROVE", "REJECT")
                            .contains(input.action() == null ? "" : input.action()))
                throw bad("Đơn đã được xử lý hoặc thao tác không hợp lệ");
            boolean approve = "APPROVE".equals(input.action());
            if (approve && "OVERTIME".equals(type)) {
                boolean prior =
                        instant(row.get("starts_at")).isAfter(Instant.now(clock))
                                && row.get("exception_reason") == null;
                if (!prior
                        && (input.exceptionReason() == null
                                || input.exceptionReason().trim().length() < 10))
                    throw bad("Duyệt OT sau giờ bắt đầu cần ghi căn cứ ngoại lệ ít nhất 10 ký tự");
                if (input.exceptionReason() != null && input.exceptionReason().length() > 2000)
                    throw bad("Căn cứ ngoại lệ quá dài");
                db.update(
                        "UPDATE staff_time_requests SET"
                            + " approval_mode=?,exception_reason=COALESCE(?,exception_reason) WHERE"
                            + " id=?",
                        prior ? "PRIOR" : "EXCEPTION",
                        prior ? null : input.exceptionReason().trim(),
                        request);
            }
            if (approve && "LEAVE_PAID".equals(type)) {
                db.queryForList(
                        "SELECT pg_advisory_xact_lock(hashtextextended(?,0))",
                        "leave:" + user + ":" + date.getYear());
                var balance =
                        one(
                                "SELECT * FROM paid_leave_balances WHERE user_id=? AND leave_year=?"
                                        + " FOR UPDATE",
                                user,
                                date.getYear());
                int used =
                        db.queryForObject(
                                "SELECT COALESCE(sum(requested_minutes),0) FROM staff_time_requests"
                                        + " WHERE user_id=? AND request_type='LEAVE_PAID' AND"
                                        + " status='APPROVED' AND extract(year from work_date)=?",
                                Integer.class,
                                user,
                                date.getYear());
                if (used + minutes > ((Number) balance.get("allowance_minutes")).intValue())
                    throw bad("Chưa đủ quỹ nghỉ hưởng lương được nhân sự xác nhận");
            }
            if (approve
                    && type.startsWith("LEAVE")
                    && Boolean.TRUE.equals(
                            db.queryForObject(
                                    "SELECT EXISTS(SELECT 1 FROM attendance_records WHERE user_id=?"
                                        + " AND work_date=? AND status='APPROVED' AND clock_in<?"
                                        + " AND clock_out>?)",
                                    Boolean.class,
                                    user,
                                    java.sql.Date.valueOf(date),
                                    row.get("ends_at"),
                                    row.get("starts_at"))))
                throw bad("Đơn nghỉ chồng lên bản ghi công đã xác nhận; cần đối soát lại");
            if (approve
                    && type.startsWith("LEAVE")
                    && Boolean.TRUE.equals(
                            db.queryForObject(
                                    "SELECT EXISTS(SELECT 1 FROM staff_time_requests WHERE"
                                        + " user_id=? AND work_date=? AND request_type IN"
                                        + " ('LEAVE_PAID','LEAVE_UNPAID') AND status='APPROVED')",
                                    Boolean.class,
                                    user,
                                    java.sql.Date.valueOf(date))))
                throw bad("Ngày này đã có đơn nghỉ được duyệt");
            if (approve && "TIME_CORRECTION".equals(type)) {
                if (Boolean.TRUE.equals(
                        db.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM staff_time_requests WHERE user_id=?"
                                        + " AND work_date=? AND request_type IN"
                                        + " ('LEAVE_PAID','LEAVE_UNPAID') AND status='APPROVED' AND"
                                        + " starts_at<? AND ends_at>?)",
                                Boolean.class,
                                user,
                                java.sql.Date.valueOf(date),
                                row.get("ends_at"),
                                row.get("starts_at")))) {
                    throw bad("Bổ sung công chồng lên đơn nghỉ đã duyệt; cần đối soát lại");
                }
                var previous =
                        db.queryForList(
                                "SELECT * FROM attendance_records WHERE user_id=? AND work_date=?"
                                        + " FOR UPDATE",
                                user,
                                java.sql.Date.valueOf(date));
                if (Boolean.TRUE.equals(
                        db.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM staff_time_requests WHERE user_id=?"
                                        + " AND work_date=? AND request_type='OVERTIME' AND"
                                        + " status='CONFIRMED' AND (starts_at<? OR ends_at>?))",
                                Boolean.class,
                                user,
                                java.sql.Date.valueOf(date),
                                row.get("starts_at"),
                                row.get("ends_at"))))
                    throw bad(
                            "Điều chỉnh sẽ làm mất căn cứ tăng ca đã xác nhận; cần xử lý hồ sơ tăng"
                                    + " ca trước");
                db.update(
                        "UPDATE attendance_absences SET revoked_at=now() WHERE user_id=? AND"
                                + " work_date=? AND revoked_at IS NULL",
                        user,
                        java.sql.Date.valueOf(date));
                String old =
                        previous.isEmpty()
                                ? "Chưa có bản ghi"
                                : previous.getFirst().get("clock_in")
                                        + " / "
                                        + previous.getFirst().get("clock_out");
                db.update(
                        "INSERT INTO"
                            + " attendance_records(id,user_id,work_date,clock_in,clock_out,regular_minutes,source_reference,imported_by,status,reviewed_by,review_note,reviewed_at)"
                            + " VALUES (?,?,?,?,?,?,?,?,'APPROVED',?,?,now()) ON"
                            + " CONFLICT(user_id,work_date) DO UPDATE SET"
                            + " clock_in=excluded.clock_in,clock_out=excluded.clock_out,regular_minutes=excluded.regular_minutes,status='APPROVED',reviewed_by=excluded.reviewed_by,review_note=excluded.review_note,reviewed_at=now(),version=attendance_records.version+1",
                        UUID.randomUUID(),
                        user,
                        java.sql.Date.valueOf(date),
                        row.get("starts_at"),
                        row.get("ends_at"),
                        minutes,
                        "CORRECTION:" + request,
                        actor,
                        actor,
                        "Trước: " + old + ". " + note);
            }
            db.update(
                    "UPDATE staff_time_requests SET"
                        + " status=?,reviewed_by=?,review_note=?,reviewed_at=now(),version=version+1"
                        + " WHERE id=?",
                    approve ? "APPROVED" : "REJECTED",
                    actor,
                    note,
                    request);
        }
        routing.notice(user, "Đơn công/nghỉ/tăng ca đã được cập nhật", "TIME", request);
        audit(actor, request, "TIME_REQUEST_REVIEWED");
    }

    public record AbsenceInput(UUID userId, LocalDate workDate, int absentMinutes, String reason) {}

    public void absence(AbsenceInput input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        var user =
                one(
                        "SELECT department_id FROM users WHERE id=? AND NOT is_deleted",
                        input.userId());
        if (!authority.time((UUID) user.get("department_id"), input.userId(), actor))
            throw new AccessDeniedException("Không tự xác nhận vắng hoặc xử lý ngoài phạm vi");
        if (input.workDate() == null || !input.workDate().isBefore(LocalDate.now(ZONE)))
            throw bad("Chỉ xác nhận vắng sau khi ngày công kết thúc");
        calendarLock(YearMonth.from(input.workDate()));
        lockPeriod(input.userId(), input.workDate());
        var calendar = day(input.workDate());
        int normal = ((Number) calendar.get("normal_minutes")).intValue();
        int covered =
                db.queryForObject(
                        "SELECT (SELECT COALESCE(sum(regular_minutes),0) FROM attendance_records"
                            + " WHERE user_id=? AND work_date=? AND status='APPROVED')+(SELECT"
                            + " COALESCE(sum(requested_minutes),0) FROM staff_time_requests WHERE"
                            + " user_id=? AND work_date=? AND request_type IN"
                            + " ('LEAVE_PAID','LEAVE_UNPAID') AND status='APPROVED')",
                        Integer.class,
                        input.userId(),
                        java.sql.Date.valueOf(input.workDate()),
                        input.userId(),
                        java.sql.Date.valueOf(input.workDate()));
        if (!"NORMAL".equals(calendar.get("day_kind"))
                || input.absentMinutes() <= 0
                || covered + input.absentMinutes() > normal)
            throw bad("Số phút vắng vượt phần công chưa được xác nhận");
        db.update(
                "INSERT INTO"
                    + " attendance_absences(user_id,work_date,absent_minutes,confirmed_by,reason)"
                    + " VALUES (?,?,?,?,?) ON CONFLICT(user_id,work_date) DO UPDATE SET"
                    + " absent_minutes=excluded.absent_minutes,confirmed_by=excluded.confirmed_by,reason=excluded.reason,confirmed_at=now(),revoked_at=NULL",
                input.userId(),
                java.sql.Date.valueOf(input.workDate()),
                input.absentMinutes(),
                actor,
                reason(input.reason()));
        routing.notice(
                input.userId(),
                "Ngày công có ghi nhận vắng. Bạn có thể gửi đề nghị kiểm tra lại.",
                "TIME",
                null);
        audit(actor, input.userId(), "TIME_ABSENCE_CONFIRMED");
    }

    public void balance(BalanceInput input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "HR_MANAGE");
        reason(input.reason());
        active(input.userId());
        if (actor.equals(input.userId()))
            throw new AccessDeniedException("Không tự thay đổi quỹ nghỉ của mình");
        if (input.year() < 2000
                || input.year() > 2100
                || input.allowanceMinutes() < 0
                || input.allowanceMinutes() > 366 * 480) throw bad("Quỹ nghỉ không hợp lệ");
        db.queryForList(
                "SELECT pg_advisory_xact_lock(hashtextextended(?,0))",
                "leave:" + input.userId() + ":" + input.year());
        int used =
                db.queryForObject(
                        "SELECT COALESCE(sum(requested_minutes),0) FROM staff_time_requests WHERE"
                            + " user_id=? AND request_type='LEAVE_PAID' AND status='APPROVED' AND"
                            + " extract(year from work_date)=?",
                        Integer.class,
                        input.userId(),
                        input.year());
        if (input.allowanceMinutes() < used) throw bad("Quỹ mới nhỏ hơn số phút nghỉ đã duyệt");
        db.update(
                "INSERT INTO"
                    + " paid_leave_balances(user_id,leave_year,allowance_minutes,configured_by)"
                    + " VALUES (?,?,?,?) ON CONFLICT(user_id,leave_year) DO UPDATE SET"
                    + " allowance_minutes=excluded.allowance_minutes,configured_by=excluded.configured_by",
                input.userId(),
                input.year(),
                input.allowanceMinutes(),
                actor);
        audit(actor, input.userId(), "HR_LEAVE_BALANCE_CHANGED");
    }

    public UUID configureIncome(IncomeInput input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "PAYROLL_MANAGE");
        YearMonth month = period(input.period());
        calendarLock(month);
        lockPeriod(input.userId(), month.atDay(1));
        if (input.monthlyWorkPay() == null
                || input.monthlyWorkPay().signum() <= 0
                || input.monthlyWorkPay().compareTo(new BigDecimal("1000000000000")) > 0)
            throw bad("Cần mức lương công việc hợp lệ");
        if (input.employmentFrom() == null
                || input.employmentTo() == null
                || !YearMonth.from(input.employmentFrom()).equals(month)
                || !YearMonth.from(input.employmentTo()).equals(month)
                || input.employmentTo().isBefore(input.employmentFrom()))
            throw bad("Khoảng tính hưởng phải nằm trong tháng");
        if (access.admin(input.userId()))
            throw bad(
                    "Tài khoản quản trị kỹ thuật không có bảng lương nghiệp vụ; dùng hồ sơ nhân"
                            + " viên tương ứng");
        one("SELECT id FROM users WHERE id=? AND NOT is_deleted", input.userId());
        var old =
                db.queryForList(
                        "SELECT * FROM income_periods WHERE user_id=? AND period=? FOR UPDATE",
                        input.userId(),
                        month.toString());
        UUID id;
        if (old.isEmpty()) {
            id = UUID.randomUUID();
            db.update(
                    "INSERT INTO"
                        + " income_periods(id,user_id,period,monthly_work_pay,employment_from,employment_to,configured_by)"
                        + " VALUES (?,?,?,?,?,?,?)",
                    id,
                    input.userId(),
                    month.toString(),
                    input.monthlyWorkPay(),
                    java.sql.Date.valueOf(input.employmentFrom()),
                    java.sql.Date.valueOf(input.employmentTo()),
                    actor);
        } else {
            var row = old.getFirst();
            version(row, input.version());
            if (!"DRAFT".equals(row.get("approval_state")))
                throw bad("Bảng tính đã gửi kiểm tra; cần trả lại trước khi sửa");
            id = (UUID) row.get("id");
            db.update(
                    "UPDATE income_periods SET"
                        + " monthly_work_pay=?,employment_from=?,employment_to=?,configured_by=?,version=version+1"
                        + " WHERE id=?",
                    input.monthlyWorkPay(),
                    java.sql.Date.valueOf(input.employmentFrom()),
                    java.sql.Date.valueOf(input.employmentTo()),
                    actor,
                    id);
        }
        audit(actor, id, "PAYROLL_CONFIGURED");
        return id;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> incomes(String value, WorkSphereUserPrincipal p) {
        return incomeRows(value, p, false);
    }

    public List<Map<String, Object>> personalIncomes(String value, WorkSphereUserPrincipal p) {
        return incomeRows(value, p, true);
    }

    private List<Map<String, Object>> incomeRows(
            String value, WorkSphereUserPrincipal p, boolean personal) {
        UUID actor = access.actor(p);
        String month = period(value).toString();
        boolean payroll =
                !personal
                        && (access.capability(actor, "PAYROLL_MANAGE")
                                || access.capability(actor, "PAYROLL_APPROVE"));
        var rows =
                db.queryForList(
                        "SELECT i.*,u.full_name FROM income_periods i JOIN users u ON"
                                + " u.id=i.user_id WHERE period=? AND ((i.user_id=? AND"
                                + " i.approval_state='PUBLISHED') OR ?) ORDER BY u.full_name",
                        month,
                        actor,
                        payroll);
        for (var row : rows) {
            row.put("calculation", calculate(row));
            row.put(
                    "adjustments",
                    db.queryForList(
                            "SELECT a.*,u.full_name created_name FROM income_adjustments a JOIN"
                                    + " users u ON u.id=a.created_by WHERE income_id=? AND (? OR"
                                    + " a.status='APPROVED') ORDER BY a.created_at",
                            row.get("id"),
                            !personal));
        }
        return rows;
    }

    Map<String, Object> calculate(Map<String, Object> row) {
        if ("LOCKED".equals(row.get("status"))) {
            try {
                return new ObjectMapper()
                        .readValue(
                                (String) row.get("snapshot"),
                                new com.fasterxml.jackson.core.type.TypeReference<
                                        Map<String, Object>>() {});
            } catch (Exception e) {
                throw bad("Không đọc được phiếu chốt");
            }
        }
        UUID user = (UUID) row.get("user_id");
        YearMonth month = period((String) row.get("period"));
        LocalDate from = ((java.sql.Date) row.get("employment_from")).toLocalDate(),
                to = ((java.sql.Date) row.get("employment_to")).toLocalDate();
        var calendar =
                db.queryForList(
                        "SELECT * FROM work_calendar WHERE work_date BETWEEN ? AND ? ORDER BY"
                                + " work_date",
                        java.sql.Date.valueOf(month.atDay(1)),
                        java.sql.Date.valueOf(month.atEndOfMonth()));
        if (calendar.size() != month.lengthOfMonth())
            return Map.of("ready", false, "message", "Chưa cấu hình đủ lịch công của tháng");
        int standard =
                calendar.stream()
                        .mapToInt(d -> ((Number) d.get("normal_minutes")).intValue())
                        .sum();
        if (standard == 0)
            return Map.of("ready", false, "message", "Tháng chưa có ngày công chuẩn");
        int paid = 0, otMinutes = 0, missingDays = 0;
        BigDecimal weightedOt = BigDecimal.ZERO;
        List<Map<String, Object>> details = new ArrayList<>();
        for (var day : calendar) {
            LocalDate date = ((java.sql.Date) day.get("work_date")).toLocalDate();
            if (date.isBefore(from) || date.isAfter(to)) continue;
            int normal = ((Number) day.get("normal_minutes")).intValue();
            String kind = (String) day.get("day_kind");
            int attended =
                    db.queryForObject(
                            "SELECT COALESCE(sum(regular_minutes),0) FROM attendance_records WHERE"
                                    + " user_id=? AND work_date=? AND status='APPROVED'",
                            Integer.class,
                            user,
                            java.sql.Date.valueOf(date));
            int leave =
                    db.queryForObject(
                            "SELECT COALESCE(sum(requested_minutes),0) FROM staff_time_requests"
                                + " WHERE user_id=? AND work_date=? AND request_type='LEAVE_PAID'"
                                + " AND status='APPROVED'",
                            Integer.class,
                            user,
                            java.sql.Date.valueOf(date));
            int unpaid =
                    db.queryForObject(
                            "SELECT COALESCE(sum(requested_minutes),0) FROM staff_time_requests"
                                + " WHERE user_id=? AND work_date=? AND request_type='LEAVE_UNPAID'"
                                + " AND status='APPROVED'",
                            Integer.class,
                            user,
                            java.sql.Date.valueOf(date));
            int absent =
                    db.queryForObject(
                            "SELECT COALESCE(sum(absent_minutes),0) FROM attendance_absences WHERE"
                                    + " user_id=? AND work_date=? AND revoked_at IS NULL",
                            Integer.class,
                            user,
                            java.sql.Date.valueOf(date));
            if ("NORMAL".equals(kind) && attended + leave + unpaid + absent < normal) missingDays++;
            int credit =
                    "HOLIDAY".equals(kind)
                            ? normal
                            : Math.min(Math.max(0, normal - unpaid - absent), attended + leave);
            paid += credit;
            int overtime =
                    db.queryForObject(
                            "SELECT COALESCE(sum(actual_minutes),0) FROM staff_time_requests WHERE"
                                    + " user_id=? AND work_date=? AND request_type='OVERTIME' AND"
                                    + " status='CONFIRMED'",
                            Integer.class,
                            user,
                            java.sql.Date.valueOf(date));
            BigDecimal factor =
                    new BigDecimal(
                            "HOLIDAY".equals(kind)
                                    ? "3.0"
                                    : "WEEKLY_OFF".equals(kind) ? "2.0" : "1.5");
            otMinutes += overtime;
            weightedOt = weightedOt.add(factor.multiply(BigDecimal.valueOf(overtime)));
            details.add(
                    Map.of(
                            "date",
                            date.toString(),
                            "kind",
                            kind,
                            "paidMinutes",
                            credit,
                            "overtimeMinutes",
                            overtime,
                            "factor",
                            factor));
        }
        BigDecimal pay = (BigDecimal) row.get("monthly_work_pay"),
                base =
                        pay.multiply(BigDecimal.valueOf(paid))
                                .divide(BigDecimal.valueOf(standard), 0, RoundingMode.HALF_UP),
                ot =
                        pay.multiply(weightedOt)
                                .divide(BigDecimal.valueOf(standard), 0, RoundingMode.HALF_UP);
        int pending =
                db.queryForObject(
                        "SELECT (SELECT count(*) FROM attendance_records WHERE user_id=? AND"
                            + " work_date BETWEEN ? AND ? AND status='PENDING')+(SELECT count(*)"
                            + " FROM staff_time_requests WHERE user_id=? AND work_date BETWEEN ?"
                            + " AND ? AND (status='PENDING' OR (request_type='OVERTIME' AND"
                            + " status='APPROVED')))",
                        Integer.class,
                        user,
                        java.sql.Date.valueOf(from),
                        java.sql.Date.valueOf(to),
                        user,
                        java.sql.Date.valueOf(from),
                        java.sql.Date.valueOf(to));
        return Map.of(
                "ready",
                true,
                "standardMinutes",
                standard,
                "paidMinutes",
                paid,
                "overtimeMinutes",
                otMinutes,
                "basePay",
                base,
                "overtimePay",
                ot,
                "grossEstimate",
                base.add(ot),
                "pendingItems",
                pending + missingDays,
                "missingDays",
                missingDays,
                "days",
                details);
    }

    public void lockIncome(UUID income, Review input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "PAYROLL_MANAGE");
        var initial = one("SELECT * FROM income_periods WHERE id=?", income);
        YearMonth month = period((String) initial.get("period"));
        calendarLock(month);
        lockPeriod((UUID) initial.get("user_id"), month.atDay(1));
        var row = one("SELECT * FROM income_periods WHERE id=? FOR UPDATE", income);
        version(row, input.version());
        if (actor.equals(row.get("user_id")))
            throw new AccessDeniedException("Không tự chốt phiếu thu nhập của mình");
        if (!"APPROVED".equals(row.get("approval_state"))
                || row.get("approved_by") == null
                || actor.equals(row.get("approved_by")))
            throw bad("Cần người phê duyệt độc lập trước khi phát hành phiếu");
        reason(input.reason());
        if (!LocalDate.now(ZONE).isAfter(month.atEndOfMonth()))
            throw bad("Chỉ chốt khi tháng đã kết thúc");
        var result = calculate(row);
        if (!Boolean.TRUE.equals(result.get("ready"))
                || ((Number) result.get("pendingItems")).intValue() != 0)
            throw bad("Còn thiếu lịch công hoặc hồ sơ chờ xác nhận");
        try {
            if (!new ObjectMapper()
                    .readTree((String) row.get("snapshot"))
                    .equals(
                            new ObjectMapper()
                                    .readTree(new ObjectMapper().writeValueAsString(result))))
                throw bad("Nguồn công thay đổi sau khi duyệt; cần trả lại và duyệt lại");
            db.update(
                    "UPDATE income_periods SET"
                        + " status='LOCKED',approval_state='PUBLISHED',snapshot=?,locked_by=?,locked_at=now(),version=version+1"
                        + " WHERE id=?",
                    new ObjectMapper().writeValueAsString(result),
                    actor,
                    income);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        routing.notice(
                (UUID) row.get("user_id"), "Phiếu đối soát thu nhập đã chốt", "INCOME", income);
        audit(actor, income, "PAYROLL_LOCKED");
    }
}
