package com.worksphere.workplace;

import com.worksphere.organization.application.DepartmentRouting;
import com.worksphere.service_request.domain.*;
import com.worksphere.service_request.infrastructure.persistence.*;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class RequestOperations {
    private final JdbcTemplate db;
    private final DepartmentRouting routing;
    private final ServiceRequestRepository requests;
    private final ServiceAssignmentRepository assignments;
    private final ServiceStatusHistoryRepository histories;

    public RequestOperations(
            JdbcTemplate db,
            DepartmentRouting routing,
            ServiceRequestRepository requests,
            ServiceAssignmentRepository assignments,
            ServiceStatusHistoryRepository histories) {
        this.db = db;
        this.routing = routing;
        this.requests = requests;
        this.assignments = assignments;
        this.histories = histories;
    }

    public record Command(String action, String reason, Long version) {}

    public Map<String, Object> meta(UUID id) {
        Map<String, Object> result = new LinkedHashMap<>();
        var cancellation =
                db.queryForList(
                        "SELECT * FROM request_cancellation_reviews WHERE request_id=?", id);
        if (!cancellation.isEmpty()) result.put("cancellation", cancellation.getFirst());
        var handovers =
                db.queryForList(
                        "SELECT h.*,old.full_name previous_name,u.full_name"
                            + " receiver_name,a.assignee_id,a.assigned_at FROM"
                            + " request_handover_reviews h JOIN service_assignments a ON"
                            + " a.id=h.assignment_id JOIN users old ON old.id=h.previous_user_id"
                            + " JOIN users u ON u.id=a.assignee_id WHERE a.request_id=? ORDER BY"
                            + " a.assigned_at",
                        id);
        result.put("handovers", handovers);
        return result;
    }

    public boolean pendingHandover(UUID request, UUID actor) {
        return Boolean.TRUE.equals(
                db.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM request_handover_reviews h JOIN"
                            + " service_assignments a ON a.id=h.assignment_id WHERE a.request_id=?"
                            + " AND a.assignee_id=? AND a.is_active AND h.reviewed_at IS NULL)",
                        Boolean.class,
                        request,
                        actor));
    }

    public void requireReviewed(UUID request, UUID actor) {
        if (pendingHandover(request, actor))
            throw new AccessDeniedException(
                    "Cần ghi nhận rà soát bàn giao trước khi tiếp tục xử lý");
    }

    public void registerHandover(UUID assignment, UUID previous) {
        db.update(
                "INSERT INTO request_handover_reviews(assignment_id,previous_user_id) VALUES (?,?)",
                assignment,
                previous);
    }

    public void terminal(UUID request) {
        db.update(
                "UPDATE request_cancellation_reviews SET state='SUPERSEDED',decided_at=now() WHERE"
                        + " request_id=? AND state='PENDING'",
                request);
    }

    public void addActions(
            ServiceRequest r, WorkSphereUserPrincipal p, Set<String> actions, boolean assignee) {
        if (r.getReceivingDepartmentId() == null) return;
        if (Set.of(ServiceStatus.CLOSED, ServiceStatus.CANCELLED, ServiceStatus.REJECTED)
                .contains(r.getStatus())) return;
        boolean pending =
                Boolean.TRUE.equals(
                        db.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM request_cancellation_reviews WHERE"
                                        + " request_id=? AND state='PENDING')",
                                Boolean.class,
                                r.getId()));
        if (r.getRequesterId().equals(p.userId())
                && r.getStatus() != ServiceStatus.OPEN
                && !pending) actions.add("REQUEST_CANCEL");
        if (routing.manages(r.getReceivingDepartmentId(), p.userId())
                && !r.getRequesterId().equals(p.userId())
                && pending) {
            actions.add("APPROVE_CANCEL");
            actions.add("DENY_CANCEL");
        }
        if (assignee && pendingHandover(r.getId(), p.userId())) {
            actions.removeAll(Set.of("START", "RESOLVE", "WAIT_FOR_USER", "RESUME"));
            actions.add("REVIEW_HANDOVER");
        }
    }

    @Transactional
    public void command(UUID id, Command input, WorkSphereUserPrincipal p) {
        var r =
                requests.findByIdForUpdate(id)
                        .orElseThrow(
                                () ->
                                        new com.worksphere.shared.exception
                                                .ResourceNotFoundException(
                                                "NOT_FOUND", "Không tìm thấy yêu cầu"));
        String action = input.action() == null ? "" : input.action();
        boolean requester = r.getRequesterId().equals(p.userId());
        boolean handler = assignments.existsByRequestIdAndAssigneeIdAndActiveTrue(id, p.userId());
        Set<String> allowed = new HashSet<>();
        addActions(r, p, allowed, handler);
        if (!allowed.contains(action))
            throw new AccessDeniedException("Thao tác không được phép ở bước này");
        if (input.version() == null || !input.version().equals(r.getVersion()))
            throw new BusinessRuleException(
                    "OPTIMISTIC_LOCK_CONFLICT", "Yêu cầu đã thay đổi; vui lòng tải lại");
        String reason = input.reason() == null ? "" : input.reason().trim();
        if (reason.isBlank() || reason.length() > 2000)
            throw new BusinessRuleException("VALIDATION_ERROR", "Cần nội dung từ 1 đến 2000 ký tự");
        ServiceStatus old = r.getStatus();
        switch (action) {
            case "REQUEST_CANCEL" -> {
                db.update(
                        "INSERT INTO request_cancellation_reviews(request_id,state,reason) VALUES"
                            + " (?,'PENDING',?) ON CONFLICT(request_id) DO UPDATE SET"
                            + " state='PENDING',reason=excluded.reason,requested_at=now(),decided_by=NULL,decision_note=NULL,decided_at=NULL",
                        id,
                        reason);
                routing.notifyManager(
                        r.getReceivingDepartmentId(),
                        "Có đề nghị hủy cần xem xét: " + r.getTitle(),
                        id);
            }
            case "APPROVE_CANCEL", "DENY_CANCEL" -> {
                db.update(
                        "UPDATE request_cancellation_reviews SET"
                                + " state=?,decided_by=?,decision_note=?,decided_at=now() WHERE"
                                + " request_id=?",
                        "APPROVE_CANCEL".equals(action) ? "APPROVED" : "REJECTED",
                        p.userId(),
                        reason,
                        id);
                if ("APPROVE_CANCEL".equals(action))
                    r.transitionStatus(ServiceStatus.CANCELLED, p.userId(), Instant.now());
                routing.notice(
                        r.getRequesterId(),
                        "Đề nghị hủy đã được xem xét: " + r.getTitle(),
                        "REQUEST",
                        id);
            }
            case "REVIEW_HANDOVER" -> {
                var assignment = assignments.findByRequestIdAndActiveTrue(id).orElseThrow();
                db.update(
                        "UPDATE request_handover_reviews SET review_note=?,reviewed_at=now() WHERE"
                                + " assignment_id=? AND reviewed_at IS NULL",
                        reason,
                        assignment.getId());
                routing.notifyManager(
                        r.getReceivingDepartmentId(),
                        "Người nhận đã rà soát bàn giao: " + r.getTitle(),
                        id);
            }
            default -> throw new IllegalStateException("Unmapped operation");
        }
        r.touch(p.userId(), Instant.now());
        requests.saveAndFlush(r);
        histories.save(
                ServiceStatusHistory.create(
                        UUID.randomUUID(),
                        id,
                        old,
                        r.getStatus(),
                        action + ": " + reason,
                        p.userId(),
                        Instant.now()));
    }
}
