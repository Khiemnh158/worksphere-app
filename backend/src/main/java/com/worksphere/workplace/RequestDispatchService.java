package com.worksphere.workplace;

import com.worksphere.organization.application.DepartmentRouting;
import com.worksphere.service_request.domain.*;
import com.worksphere.service_request.infrastructure.persistence.*;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.security.WorkSphereUserPrincipal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class RequestDispatchService {
    private final ServiceRequestRepository requests;
    private final ServiceCategoryRepository categories;
    private final ServiceStatusHistoryRepository histories;
    private final ServiceAssignmentRepository assignments;
    private final DepartmentRouting routing;

    public RequestDispatchService(
            ServiceRequestRepository requests,
            ServiceCategoryRepository categories,
            ServiceStatusHistoryRepository histories,
            ServiceAssignmentRepository assignments,
            DepartmentRouting routing) {
        this.requests = requests;
        this.categories = categories;
        this.histories = histories;
        this.assignments = assignments;
        this.routing = routing;
    }

    public record Dispatch(String action, UUID categoryId, String reason, Long version) {}

    @Transactional
    public void dispatch(UUID id, Dispatch input, WorkSphereUserPrincipal p) {
        var r =
                requests.findByIdForUpdate(id)
                        .orElseThrow(
                                () ->
                                        new com.worksphere.shared.exception
                                                .ResourceNotFoundException(
                                                "NOT_FOUND", "Không tìm thấy yêu cầu"));
        routing.requireManager(r.getReceivingDepartmentId(), p);
        if (input.version() == null || !input.version().equals(r.getVersion()))
            throw new BusinessRuleException(
                    "OPTIMISTIC_LOCK_CONFLICT", "Yêu cầu vừa thay đổi; vui lòng tải lại");
        if (assignments.findByRequestIdAndActiveTrue(id).isPresent()
                || !Set.of(ServiceStatus.OPEN, ServiceStatus.WAITING_FOR_USER)
                        .contains(r.getStatus()))
            throw new BusinessRuleException(
                    "INVALID_REQUEST_STATE", "Chỉ điều phối yêu cầu chưa giao người xử lý");
        String reason = input.reason() == null ? "" : input.reason().trim();
        if (reason.isBlank() || reason.length() > 1000)
            throw new BusinessRuleException("VALIDATION_ERROR", "Cần lý do từ 1 đến 1000 ký tự");
        ServiceStatus old = r.getStatus(), next = old;
        switch (input.action() == null ? "" : input.action()) {
            case "TRANSFER" -> {
                if (input.categoryId() == null)
                    throw new BusinessRuleException(
                            "VALIDATION_ERROR", "Chọn loại yêu cầu ở phòng nhận");
                var category =
                        categories
                                .findByIdAndDeletedFalse(input.categoryId())
                                .orElseThrow(
                                        () ->
                                                new BusinessRuleException(
                                                        "VALIDATION_ERROR",
                                                        "Loại yêu cầu không tồn tại"));
                if (!category.isActive()
                        || category.getReceivingDepartmentId() == null
                        || category.getReceivingDepartmentId().equals(r.getReceivingDepartmentId()))
                    throw new BusinessRuleException(
                            "VALIDATION_ERROR", "Chọn loại yêu cầu đang nhận ở phòng khác");
                routing.requireReceiving(category.getReceivingDepartmentId());
                r.updateContent(
                        r.getTitle(),
                        r.getDescription(),
                        r.getPriority(),
                        category.getId(),
                        r.getAssetId(),
                        p.userId(),
                        Instant.now());
                r.routeTo(category.getReceivingDepartmentId());
                next = ServiceStatus.OPEN;
                routing.notifyManager(
                        r.getReceivingDepartmentId(), "Yêu cầu chuyển đến: " + r.getTitle(), id);
            }
            case "DECLINE" -> next = ServiceStatus.REJECTED;
            case "DISPATCH_INFO" -> {
                if (old != ServiceStatus.OPEN)
                    throw new BusinessRuleException(
                            "INVALID_REQUEST_STATE", "Yêu cầu đã chờ bổ sung");
                next = ServiceStatus.WAITING_FOR_USER;
            }
            case "DISPATCH_RESUME" -> {
                if (old != ServiceStatus.WAITING_FOR_USER)
                    throw new BusinessRuleException(
                            "INVALID_REQUEST_STATE", "Yêu cầu chưa chờ bổ sung");
                next = ServiceStatus.OPEN;
            }
            default -> throw new BusinessRuleException("VALIDATION_ERROR", "Thao tác không hợp lệ");
        }
        r.transitionStatus(next, p.userId(), Instant.now());
        requests.saveAndFlush(r);
        histories.save(
                ServiceStatusHistory.create(
                        UUID.randomUUID(),
                        id,
                        old,
                        next,
                        input.action() + ": " + reason,
                        p.userId(),
                        Instant.now()));
        routing.notice(r.getRequesterId(), "Cập nhật yêu cầu: " + r.getTitle(), "REQUEST", id);
    }
}
