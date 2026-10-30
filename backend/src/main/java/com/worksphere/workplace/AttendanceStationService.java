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

    public record StationInput(String name, Boolean active) {
}

    public record Punch(String token, String type) {
}

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
        return id;
    }

    public void state(UUID id, StationInput r, WorkSphereUserPrincipal p) {
        access.requireCapability(access.actor(p), "TIME_REVIEW");
        if (r.active() == null) throw bad("Cần trạng thái điểm");
        db.update("UPDATE attendance_stations SET is_active=? WHERE id=?", r.active(), id);
    }

    public Map<String, Object> challenge(UUID station, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "TIME_REVIEW");
        var s =
                db.queryForMap(
                        "SELECT * FROM attendance_stations WHERE id=? AND is_active FOR UPDATE",
                        station);
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expires = Instant.now().plusSeconds(40);
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

    public Map<String, Object> punch(Punch input, WorkSphereUserPrincipal p) {
        UUID user = access.actor(p);
        if (access.admin(user)) throw bad("Dùng tài khoản nhân viên để chấm công");
        if (input.token() == null
                || input.token().length() > 100
                || !Set.of("IN", "OUT").contains(Objects.toString(input.type(), "")))
            throw bad("Mã hoặc thao tác không hợp lệ");
        var list =
                db.queryForList(
                        "SELECT q.*,s.is_active FROM attendance_qr_challenges q JOIN"
                            + " attendance_stations s ON s.id=q.station_id WHERE q.token_hash=?",
                        secrets.hash(input.token()));
        if (list.isEmpty()) throw bad("QR không hợp lệ");
        var q = list.getFirst();
        if (!Boolean.TRUE.equals(q.get("is_active"))
                || !((java.sql.Timestamp) q.get("expires_at")).toInstant().isAfter(Instant.now()))
            throw bad("QR đã hết hạn hoặc điểm chấm đã đóng");
        db.queryForMap("SELECT id FROM users WHERE id=? FOR UPDATE", user);
        LocalDate date = LocalDate.now(ZONE);
        Instant now = Instant.now();
        var calendar =
                db.queryForList(
                        "SELECT * FROM work_calendar WHERE work_date=?",
                        java.sql.Date.valueOf(date));
        if (calendar.isEmpty()) throw bad("Chưa có lịch công, liên hệ người phụ trách");
        var month = YearMonth.from(date).toString();
        db.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", user + ":" + month);
        if (db.queryForObject(
                        "SELECT count(*) FROM income_periods WHERE user_id=? AND period=? AND"
                                + " status='LOCKED'",
                        Integer.class,
                        user,
                        month)
                > 0) throw bad("Kỳ đã khóa");
        if (!db.queryForList(
                        "SELECT id FROM attendance_punches WHERE user_id=? AND work_date=? AND"
                                + " punch_type=?",
                        user,
                        java.sql.Date.valueOf(date),
                        input.type())
                .isEmpty()) throw bad("Đã ghi nhận thao tác này trong ngày");
        var ins =
                db.queryForList(
                        "SELECT * FROM attendance_punches WHERE user_id=? AND work_date=? AND"
                                + " punch_type='IN'",
                        user,
                        java.sql.Date.valueOf(date));
        if (input.type().equals("OUT") && ins.isEmpty())
            throw bad("Chưa có lượt vào, cần đề nghị điều chỉnh");
        db.update(
                "INSERT INTO"
                    + " attendance_punches(id,user_id,work_date,punch_type,recorded_at,challenge_id)"
                    + " VALUES (?,?,?,?,?,?)",
                UUID.randomUUID(),
                user,
                java.sql.Date.valueOf(date),
                input.type(),
                java.sql.Timestamp.from(now),
                q.get("id"));
        if (input.type().equals("OUT")) {
            Instant start = ((java.sql.Timestamp) ins.getFirst().get("recorded_at")).toInstant();
            if (!now.isAfter(start)) throw bad("Thời gian ra chưa hợp lệ");
            var c = calendar.getFirst();
            Instant
                    shiftStart =
                            date.atTime(((java.sql.Time) c.get("shift_start")).toLocalTime())
                                    .atZone(ZONE)
                                    .toInstant(),
                    shiftEnd =
                            date.atTime(((java.sql.Time) c.get("shift_end")).toLocalTime())
                                    .atZone(ZONE)
                                    .toInstant();
            long overlap =
                    Math.max(
                            0,
                            Duration.between(
                                            start.isAfter(shiftStart) ? start : shiftStart,
                                            now.isBefore(shiftEnd) ? now : shiftEnd)
                                    .toMinutes());
            int minutes =
                    (int)
                            Math.max(
                                    0,
                                    Math.min(
                                            ((Number) c.get("normal_minutes")).intValue(),
                                            overlap
                                                    - ((Number) c.get("break_minutes"))
                                                            .intValue()));
            db.update(
                    "INSERT INTO"
                        + " attendance_records(id,user_id,work_date,clock_in,clock_out,source_reference,imported_by,regular_minutes)"
                        + " VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id,work_date) DO NOTHING",
                    UUID.randomUUID(),
                    user,
                    java.sql.Date.valueOf(date),
                    java.sql.Timestamp.from(start),
                    java.sql.Timestamp.from(now),
                    "QR:" + q.get("station_id"),
                    q.get("issued_by"),
                    minutes);
        }
        return Map.of(
                "recordedAt",
                now,
                "type",
                input.type(),
                "message",
                "Đã lưu lượt chấm bằng thời gian máy chủ; công vẫn cần đối soát");
    }
}
