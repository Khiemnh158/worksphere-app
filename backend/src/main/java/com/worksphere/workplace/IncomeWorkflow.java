package com.worksphere.workplace;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional
public class IncomeWorkflow {
    @org.springframework.beans.factory.annotation.Autowired
    private com.worksphere.organization.application.DepartmentRouting routing;

    private final JdbcTemplate db;
    private final WorkplaceService access;
    private final TimeIncomeService income;

    public IncomeWorkflow(JdbcTemplate db, WorkplaceService access, TimeIncomeService income) {
        this.db = db;
        this.access = access;
        this.income = income;
    }

    public record Command(String action, String reason, Long version, BigDecimal amount) {
}

    private BusinessRuleException bad(String m) {
        return new BusinessRuleException("INCOME_WORKFLOW_INVALID", m);
    }

    public void command(UUID id, Command input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        var row = db.queryForMap("SELECT * FROM income_periods WHERE id=? FOR UPDATE", id);
        String note = Objects.toString(input.reason(), "").trim();
        if (note.isEmpty() || note.length() > 2000) throw bad("Cần căn cứ từ 1 đến 2000 ký tự");
        if (input.version() == null || input.version() != ((Number) row.get("version")).longValue())
            throw new BusinessRuleException("OPTIMISTIC_LOCK_CONFLICT", "Hãy tải lại bảng tính");
        String action = Objects.toString(input.action(), "");
        String state = (String) row.get("approval_state");
        if (actor.equals(row.get("user_id")))
            throw new AccessDeniedException("Không tự xử lý bảng tính của mình");
        switch (action) {
            case "SUBMIT" -> {
                access.requireCapability(actor, "PAYROLL_MANAGE");
                if (!"DRAFT".equals(state)) throw bad("Chỉ gửi bảng nháp");
                var result = income.calculate(row);
                if (!Boolean.TRUE.equals(result.get("ready"))
                        || ((Number) result.get("pendingItems")).intValue() != 0)
                    throw bad("Chưa đủ dữ liệu để gửi duyệt");
                try {
                    db.update(
                            "UPDATE income_periods SET"
                                + " approval_state='SUBMITTED',submitted_by=?,snapshot=?,approval_reason=?,version=version+1"
                                + " WHERE id=?",
                            actor,
                            new ObjectMapper().writeValueAsString(result),
                            note,
                            id);
                } catch (Exception e) {
                    if (e instanceof RuntimeException r) throw r;
                    throw new IllegalStateException(e);
                }
            }
            case "APPROVE" -> {
                access.requireCapability(actor, "PAYROLL_APPROVE");
                if (!"SUBMITTED".equals(state)
                        || actor.equals(row.get("submitted_by"))
                        || actor.equals(row.get("configured_by")))
                    throw bad("Cần người kiểm tra độc lập, khác người lập và gửi");
                db.update(
                        "UPDATE income_periods SET"
                            + " approval_state='APPROVED',approved_by=?,approval_reason=?,version=version+1"
                            + " WHERE id=?",
                        actor,
                        note,
                        id);
            }
            case "RETURN" -> {
                access.requireCapability(actor, "PAYROLL_APPROVE");
                if (!Set.of("SUBMITTED", "APPROVED").contains(state)
                        || "LOCKED".equals(row.get("status")))
                    throw bad("Phiếu đã phát hành phải dùng điều chỉnh bổ sung");
                db.update(
                        "UPDATE income_periods SET"
                            + " approval_state='DRAFT',approved_by=NULL,submitted_by=NULL,snapshot=NULL,approval_reason=?,version=version+1"
                            + " WHERE id=?",
                        note,
                        id);
            }
            case "ADJUST" -> {
                access.requireCapability(actor, "PAYROLL_MANAGE");
                if (!"LOCKED".equals(row.get("status"))
                        || input.amount() == null
                        || input.amount().signum() == 0
                        || input.amount().abs().compareTo(new BigDecimal("1000000000000")) > 0)
                    throw bad(
                            "Điều chỉnh cần phiếu đã phát hành và số chênh lệch hợp lệ; không dùng"
                                    + " để phạt tiền");
                db.update(
                        "INSERT INTO income_adjustments(id,income_id,created_by,reason,amount)"
                                + " VALUES (?,?,?,?,?)",
                        UUID.randomUUID(),
                        id,
                        actor,
                        note,
                        input.amount());
                db.update("UPDATE income_periods SET version=version+1 WHERE id=?", id);
            }
            default -> throw bad("Thao tác bảng tính không hợp lệ");
        }
        if (action.equals("SUBMIT"))
            routing.notifyCapability(
                    "PAYROLL_APPROVE",
                    "Có bảng tính lương chờ kiểm tra",
                    "INCOME",
                    id,
                    actor,
                    (UUID) row.get("user_id"));
        if (Set.of("APPROVE", "RETURN").contains(action) && row.get("submitted_by") != null)
            routing.notice(
                    (UUID) row.get("submitted_by"),
                    "Bảng tính lương đã được xem xét",
                    "INCOME",
                    id);
        db.update(
                "INSERT INTO workplace_events(id,actor_id,subject_id,event_type,content) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                actor,
                id,
                "INCOME_" + action,
                note);
    }

    public void adjustment(UUID id, Command input, WorkSphereUserPrincipal p) {
        UUID actor = access.actor(p);
        access.requireCapability(actor, "PAYROLL_APPROVE");
        var row =
                db.queryForMap(
                        "SELECT a.*,i.user_id FROM income_adjustments a JOIN income_periods i ON"
                                + " i.id=a.income_id WHERE a.id=? FOR UPDATE OF a",
                        id);
        if (actor.equals(row.get("user_id")) || actor.equals(row.get("created_by")))
            throw new AccessDeniedException("Cần người kiểm tra độc lập");
        if (input.version() == null
                || input.version() != ((Number) row.get("version")).longValue()
                || !"PENDING".equals(row.get("status")))
            throw bad("Điều chỉnh đã thay đổi hoặc đã xử lý");
        if (!Set.of("APPROVE", "REJECT").contains(Objects.toString(input.action(), ""))
                || input.reason() == null
                || input.reason().isBlank()
                || input.reason().length() > 2000) throw bad("Cần lựa chọn và căn cứ");
        db.update(
                "UPDATE income_adjustments SET"
                        + " status=?,approved_by=?,approval_note=?,version=version+1 WHERE id=?",
                input.action().equals("APPROVE") ? "APPROVED" : "REJECTED",
                actor,
                input.reason(),
                id);
        db.update(
                "INSERT INTO workplace_events(id,actor_id,subject_id,event_type,content) VALUES"
                        + " (?,?,?,?,?)",
                UUID.randomUUID(),
                actor,
                id,
                "INCOME_ADJUSTMENT",
                input.reason());
    }
}
