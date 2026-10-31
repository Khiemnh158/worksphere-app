package com.worksphere.workplace;

import com.google.zxing.*;
import com.google.zxing.qrcode.QRCodeWriter;
import com.worksphere.identity.application.RecoveryService;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class AttendanceStationService {
    @org.springframework.beans.factory.annotation.Autowired private Clock clock;
    private final JdbcTemplate db;
    private final WorkplaceService access;
    private final RecoveryService secrets;
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    public AttendanceStationService(
            JdbcTemplate db, WorkplaceService access, RecoveryService secrets) {
        this.db = db;
        this.access = access;
        this.secrets = secrets;
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.worksphere.organization.application.ApprovalPolicy authority;

    @org.springframework.beans.factory.annotation.Autowired
    private com.worksphere.organization.application.DepartmentRouting routing;

    public record StationInput(
            String name, Boolean active, String allowedCidrs, String opensAt, String closesAt) {
        public StationInput(String name, Boolean active) {
            this(name, active, null, null, null);
        }
    }

    private void audit(UUID actor, UUID subject, String event) {
        db.update(
                "INSERT INTO workplace_events(id,actor_id,subject_id,event_type,content) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                actor,
                subject,
                event,
                "Cấu hình/chấm công theo thời gian máy chủ");
    }

    private LocalTime time(Object value) {
        return value == null ? null : ((java.sql.Time) value).toLocalTime();
    }

    private Instant stamp(Object value) {
        return ((java.sql.Timestamp) value).toInstant();
    }

    private void stationHours(Map<String, Object> station, Instant now) {
        LocalTime current = now.atZone(ZONE).toLocalTime();
        if (current.isBefore(time(station.get("opens_at")))
                || !current.isBefore(time(station.get("closes_at"))))
            throw bad("Điểm chấm công đang ngoài giờ mở cửa đã cấu hình");
    }

    private void configureStation(UUID id, StationInput r) {
        var row = db.queryForMap("SELECT * FROM attendance_stations WHERE id=? FOR UPDATE", id);
        String networks =
                r.allowedCidrs() == null
                        ? (String) row.get("allowed_cidrs")
                        : AttendanceRules.normalizeNetworks(r.allowedCidrs());
        LocalTime opens, closes;
        try {
            opens = r.opensAt() == null ? time(row.get("opens_at")) : LocalTime.parse(r.opensAt());
            closes =
                    r.closesAt() == null
                            ? time(row.get("closes_at"))
                            : LocalTime.parse(r.closesAt());
        } catch (Exception ex) {
            throw bad("Giờ mở điểm chưa hợp lệ");
        }
        if (opens.isBefore(LocalTime.of(6, 0))
                || closes.isAfter(LocalTime.of(22, 0))
                || !closes.isAfter(opens))
            throw bad("Giờ mở điểm trong 06:00–22:00, kết thúc sau bắt đầu");
        db.update(
                "UPDATE attendance_stations SET allowed_cidrs=?,opens_at=?,closes_at=? WHERE id=?",
                networks,
                java.sql.Time.valueOf(opens),
                java.sql.Time.valueOf(closes),
                id);
    }

    public record Punch(String token, String type) {}

    private BusinessRuleException bad(String m) {
        return new BusinessRuleException("ATTENDANCE_QR_INVALID", m);
    }

    public List<Map<String, Object>> stations(WorkSphereUserPrincipal p) {
        access.requireCapability(access.actor(p), "TIME_REVIEW");
        return db.queryForList("SELECT * FROM attendance_stations ORDER BY created_at");
    }

    public UUID create(StationInput r, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "TIME_REVIEW");
        if (r.name() == null || r.name().isBlank() || r.name().length() > 100)
            throw bad("Tên điểm chấm công chưa hợp lệ");
        UUID id = UUID.randomUUID();
        db.update(
                "INSERT INTO attendance_stations(id,name,created_by) VALUES (?,?,?)",
                id,
                r.name().trim(),
                actor);
        configureStation(id, r);
        audit(actor, id, "ATTENDANCE_STATION_CREATED");
        return id;
    }

    public void state(UUID id, StationInput r, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "TIME_REVIEW");
        configureStation(id, r);
        if (r.active() != null)
            db.update("UPDATE attendance_stations SET is_active=? WHERE id=?", r.active(), id);
        // Configuration changes invalidate outstanding challenges, including reopening a point.
        db.update(
                "UPDATE attendance_qr_challenges SET expires_at=now() WHERE station_id=? AND"
                        + " expires_at>now()",
                id);
        audit(actor, id, "ATTENDANCE_STATION_UPDATED");
    }

    public Map<String, Object> challenge(UUID station, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "TIME_REVIEW");
        var s =
                db.queryForMap(
                        "SELECT * FROM attendance_stations WHERE id=? AND is_active FOR UPDATE",
                        station);
        stationHours(s, Instant.now(clock));
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expires = Instant.now(clock).plusSeconds(40);
        UUID id = UUID.randomUUID();
        db.update(
                "INSERT INTO"
                        + " attendance_qr_challenges(id,station_id,token_hash,issued_by,expires_at)"
                        + " VALUES (?,?,?,?,?)",
                id,
                station,
                secrets.hash(token),
                actor,
                java.sql.Timestamp.from(expires));
        // The token is a short-lived presence challenge, never an authentication credential.
        try {
            var matrix =
                    new QRCodeWriter()
                            .encode(
                                    "worksphere-attendance:" + token,
                                    BarcodeFormat.QR_CODE,
                                    256,
                                    256,
                                    Map.of(EncodeHintType.MARGIN, 4));
            StringBuilder path = new StringBuilder();
            for (int y = 0; y < matrix.getHeight(); y++)
                for (int x = 0; x < matrix.getWidth(); x++)
                    if (matrix.get(x, y))
                        path.append("M").append(x).append(' ').append(y).append("h1v1h-1z");
            String svg =
                    "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 256 256\"><rect"
                            + " width=\"256\" height=\"256\" fill=\"white\"/><path d=\""
                            + path
                            + "\" fill=\"black\"/></svg>";
            return Map.of(
                    "stationName",
                    s.get("name"),
                    "expiresAt",
                    expires,
                    "image",
                    "data:image/svg+xml;base64,"
                            + Base64.getEncoder()
                                    .encodeToString(
                                            svg.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (WriterException e) {
            throw new IllegalStateException(e);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> punches(String period, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        YearMonth month;
        try {
            month = YearMonth.parse(period);
        } catch (Exception e) {
            throw bad("Kỳ công chưa hợp lệ");
        }
        String departments =
                authority.managed(actor, "TIME", true).stream()
                        .map(UUID::toString)
                        .collect(java.util.stream.Collectors.joining(","));
        return db.queryForList(
                "SELECT r.*,u.full_name,u.department_id,s.name station_name FROM attendance_punches"
                    + " r JOIN users u ON u.id=r.user_id JOIN attendance_qr_challenges q ON"
                    + " q.id=r.challenge_id JOIN attendance_stations s ON s.id=q.station_id WHERE"
                    + " r.work_date BETWEEN ? AND ? AND (r.user_id=? OR u.department_id IN (SELECT"
                    + " unnest(string_to_array(?,',')::uuid[])) OR ?) ORDER BY r.recorded_at DESC"
                    + " LIMIT 1000",
                java.sql.Date.valueOf(month.atDay(1)),
                java.sql.Date.valueOf(month.atEndOfMonth()),
                actor,
                departments,
                access.capability(actor, "TIME_REVIEW"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> today(WorkSphereUserPrincipal p) {
        UUID user = access.actor(p);
        Instant now = Instant.now(clock);
        LocalDate date = now.atZone(ZONE).toLocalDate();
        var rows =
                db.queryForList(
                        "SELECT * FROM attendance_punches WHERE user_id=? AND work_date=? ORDER BY"
                                + " recorded_at",
                        user,
                        java.sql.Date.valueOf(date));
        var days =
                db.queryForList(
                        "SELECT * FROM work_calendar WHERE work_date=?",
                        java.sql.Date.valueOf(date));
        Set<String> done = new HashSet<>();
        for (var r : rows) done.add((String) r.get("punch_type"));
        List<String> actions = new ArrayList<>();
        boolean daytime =
                !now.atZone(ZONE).toLocalTime().isBefore(LocalTime.of(6, 0))
                        && now.atZone(ZONE).toLocalTime().isBefore(LocalTime.of(22, 0));
        var ot =
                db.queryForList(
                        "SELECT id,starts_at,ends_at,requested_minutes,approval_mode FROM"
                                + " staff_time_requests WHERE user_id=? AND work_date=? AND"
                                + " request_type='OVERTIME' AND status='APPROVED'",
                        user,
                        java.sql.Date.valueOf(date));
        if (!access.admin(user) && daytime && !days.isEmpty()) {
            if ("NORMAL".equals(days.getFirst().get("day_kind")) && !done.contains("IN"))
                actions.add("IN");
            if (done.contains("IN") && !done.contains("OUT")) actions.add("OUT");
            if (!ot.isEmpty()
                    && !now.isBefore(stamp(ot.getFirst().get("starts_at")))
                    && now.isBefore(stamp(ot.getFirst().get("ends_at")))
                    && !done.contains("OT_IN")) actions.add("OT_IN");
            if (done.contains("OT_IN") && !done.contains("OT_OUT")) actions.add("OT_OUT");
        }
        var result = new LinkedHashMap<String, Object>();
        result.put("serverTime", now);
        result.put("workDate", date);
        result.put("punches", rows);
        result.put("actions", actions);
        result.put("calendar", days.isEmpty() ? null : days.getFirst());
        result.put("overtime", ot);
        int late = 0, early = 0;
        if (!days.isEmpty()) {
            var day = days.getFirst();
            for (var row : rows) {
                if ("IN".equals(row.get("punch_type")))
                    late =
                            AttendanceRules.lateMinutes(
                                    date,
                                    stamp(row.get("recorded_at")),
                                    time(day.get("shift_start")),
                                    ((Number) day.get("late_grace_minutes")).intValue());
                if ("OUT".equals(row.get("punch_type")))
                    early =
                            AttendanceRules.earlyMinutes(
                                    date,
                                    stamp(row.get("recorded_at")),
                                    time(day.get("shift_end")));
            }
        }
        result.put("lateMinutes", late);
        result.put("earlyMinutes", early);
        result.put(
                "status",
                done.contains("OUT")
                        ? "COMPLETED"
                        : done.contains("IN") ? "WORKING" : "NOT_STARTED");
        result.put(
                "message",
                days.isEmpty()
                        ? "Chưa có lịch công; liên hệ người phụ trách"
                        : "Giờ máy chủ · công và OT vẫn cần đối soát");
        return result;
    }

    public Map<String, Object> punch(Punch input, WorkSphereUserPrincipal p) {
        return punch(input, p, "127.0.0.1");
    }

    public Map<String, Object> punch(Punch input, WorkSphereUserPrincipal p, String peerIp) {
        UUID user = access.actor(p);
        if (access.admin(user)) throw bad("Dùng tài khoản nhân viên để chấm công");
        if (input.token() == null
                || input.token().length() > 100
                || !Set.of("IN", "OUT", "OT_IN", "OT_OUT")
                        .contains(Objects.toString(input.type(), "")))
            throw bad("Mã hoặc thao tác không hợp lệ");
        // Lock the point until commit, so closing a point cannot race with accepting a punch.
        var challenges =
                db.queryForList(
                        "SELECT q.*,s.is_active,s.opens_at,s.closes_at,s.allowed_cidrs FROM"
                                + " attendance_qr_challenges q JOIN attendance_stations s ON"
                                + " s.id=q.station_id WHERE q.token_hash=? FOR SHARE OF s",
                        secrets.hash(input.token()));
        if (challenges.isEmpty()) throw bad("QR không hợp lệ");
        var challenge = challenges.getFirst();
        Instant now = Instant.now(clock);
        if (!Boolean.TRUE.equals(challenge.get("is_active"))
                || !stamp(challenge.get("expires_at")).isAfter(now))
            throw bad("QR đã hết hạn hoặc điểm chấm đã đóng");
        stationHours(challenge, now);
        db.queryForMap("SELECT id FROM users WHERE id=? FOR UPDATE", user);
        LocalDate date = now.atZone(ZONE).toLocalDate();
        db.queryForList(
                "SELECT pg_advisory_xact_lock(hashtextextended(?,0))",
                "calendar:" + YearMonth.from(date));
        db.queryForList(
                "SELECT pg_advisory_xact_lock(hashtextextended(?,0))",
                user + ":" + YearMonth.from(date));
        if (db.queryForObject(
                        "SELECT count(*) FROM income_periods WHERE user_id=? AND period=? AND"
                                + " status='LOCKED'",
                        Integer.class,
                        user,
                        YearMonth.from(date).toString())
                > 0) throw bad("Kỳ đã khóa");
        var calendars =
                db.queryForList(
                        "SELECT * FROM work_calendar WHERE work_date=?",
                        java.sql.Date.valueOf(date));
        if (calendars.isEmpty()) throw bad("Chưa có lịch công, liên hệ người phụ trách");
        var calendar = calendars.getFirst();
        var punches =
                db.queryForList(
                        "SELECT * FROM attendance_punches WHERE user_id=? AND work_date=? ORDER BY"
                                + " recorded_at",
                        user,
                        java.sql.Date.valueOf(date));
        if (punches.stream().anyMatch(r -> input.type().equals(r.get("punch_type"))))
            throw bad("Đã ghi nhận thao tác này trong ngày");
        String inType = input.type().startsWith("OT_") ? "OT_IN" : "IN";
        var in =
                punches.stream()
                        .filter(r -> inType.equals(r.get("punch_type")))
                        .findFirst()
                        .orElse(null);
        if (input.type().endsWith("OUT") && in == null)
            throw bad("Chưa có lượt vào tương ứng, cần đề nghị điều chỉnh");
        UUID overtime = null;
        if (input.type().startsWith("OT_")) {
            var requests =
                    db.queryForList(
                            "SELECT * FROM staff_time_requests WHERE user_id=? AND work_date=? AND"
                                    + " request_type='OVERTIME' AND status='APPROVED' FOR UPDATE",
                            user,
                            java.sql.Date.valueOf(date));
            if (requests.isEmpty())
                throw bad("Cần đơn OT đã được duyệt; không cộng OT chỉ vì ra muộn");
            var request = requests.getFirst();
            overtime = (UUID) request.get("id");
            if (input.type().equals("OT_IN")
                    && (now.isBefore(stamp(request.get("starts_at")))
                            || !now.isBefore(stamp(request.get("ends_at")))))
                throw bad("Chưa trong khoảng bắt đầu OT đã duyệt");
            if (in != null && !overtime.equals(in.get("overtime_request_id")))
                throw bad("Lượt OT không thuộc đơn đang duyệt");
        } else if (input.type().equals("IN") && !"NORMAL".equals(calendar.get("day_kind")))
            throw bad("Hôm nay ngoài ca thường; dùng luồng OT đã duyệt");
        String network =
                AttendanceRules.networkStatus(peerIp, (String) challenge.get("allowed_cidrs"));
        if (input.type().equals("OUT")) {
            Instant start = stamp(in.get("recorded_at"));
            if (!now.isAfter(start)) throw bad("Thời gian ra chưa hợp lệ");
            if (!db.queryForList(
                            "SELECT id FROM attendance_records WHERE user_id=? AND work_date=?",
                            user,
                            java.sql.Date.valueOf(date))
                    .isEmpty())
                throw bad("Ngày này đã có nguồn công khác; gửi đề nghị đối soát, không ghi đè");
            int minutes =
                    AttendanceRules.regularMinutes(
                            date,
                            start,
                            now,
                            time(calendar.get("shift_start")),
                            time(calendar.get("shift_end")),
                            ((Number) calendar.get("normal_minutes")).intValue(),
                            ((Number) calendar.get("break_minutes")).intValue(),
                            time(calendar.get("break_start")),
                            time(calendar.get("break_end")));
            db.update(
                    "INSERT INTO"
                        + " attendance_records(id,user_id,work_date,clock_in,clock_out,source_reference,imported_by,regular_minutes,late_minutes,early_minutes,network_review_required)"
                        + " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    UUID.randomUUID(),
                    user,
                    java.sql.Date.valueOf(date),
                    java.sql.Timestamp.from(start),
                    java.sql.Timestamp.from(now),
                    "QR:" + challenge.get("station_id"),
                    challenge.get("issued_by"),
                    minutes,
                    AttendanceRules.lateMinutes(
                            date,
                            start,
                            time(calendar.get("shift_start")),
                            ((Number) calendar.get("late_grace_minutes")).intValue()),
                    AttendanceRules.earlyMinutes(date, now, time(calendar.get("shift_end"))),
                    !network.equals("MATCH") || !"MATCH".equals(in.get("network_status")));
        }
        db.update(
                "INSERT INTO"
                    + " attendance_punches(id,user_id,work_date,punch_type,recorded_at,challenge_id,peer_ip,network_status,overtime_request_id)"
                    + " VALUES (?,?,?,?,?,?,?,?,?)",
                UUID.randomUUID(),
                user,
                java.sql.Date.valueOf(date),
                input.type(),
                java.sql.Timestamp.from(now),
                challenge.get("id"),
                peerIp,
                network,
                overtime);
        if (!network.equals("MATCH")) {
            var staff =
                    db.queryForMap("SELECT department_id,full_name FROM users WHERE id=?", user);
            var managers =
                    db.queryForList(
                            "SELECT manager_id FROM departments WHERE id=?",
                            staff.get("department_id"));
            if (!managers.isEmpty())
                routing.notice(
                        (UUID) managers.getFirst().get("manager_id"),
                        "Cần xác minh mạng chấm công: " + staff.get("full_name"),
                        "ATTENDANCE",
                        null);
        }
        audit(user, user, "ATTENDANCE_" + input.type());
        return Map.of(
                "recordedAt",
                now,
                "type",
                input.type(),
                "networkStatus",
                network,
                "message",
                network.equals("MATCH")
                        ? "Đã lưu lượt chấm; công/OT vẫn cần đối soát"
                        : "Đã lưu lượt chấm kèm cảnh báo mạng; người phụ trách cần xác minh trước"
                                + " khi duyệt");
    }
}
