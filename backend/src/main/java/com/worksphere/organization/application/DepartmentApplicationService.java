package com.worksphere.organization.application;

import com.worksphere.identity.domain.User;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.organization.api.request.CreateDepartmentRequest;
import com.worksphere.organization.api.request.UpdateDepartmentRequest;
import com.worksphere.organization.api.response.DepartmentResponse;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DepartmentApplicationService {

    @org.springframework.beans.factory.annotation.Autowired
    private com.worksphere.workplace.WorkplaceService governance;

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public DepartmentApplicationService(
            DepartmentRepository departmentRepository, UserRepository userRepository) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDepartments() {
        return departmentRepository.findAllActive().stream().map(DepartmentResponse::from).toList();
    }

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        if (request.managerId() != null)
            throw new BusinessRuleException(
                    "VALIDATION_ERROR", "Tạo phòng trước, gán nhân viên rồi chỉ định trưởng phòng");
        if (departmentRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new BusinessRuleException("DEPARTMENT_CODE_EXISTS", "Mã phòng ban đã tồn tại");
        }

        if (request.parentId() != null) {
            Department parent =
                    departmentRepository
                            .findActiveById(request.parentId())
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "DEPARTMENT_NOT_FOUND",
                                                    "Phòng ban cha không tồn tại"));
            if (!parent.isActive()) {
                throw new BusinessRuleException(
                        "PARENT_DEPARTMENT_INACTIVE", "Phòng ban cha không còn hoạt động");
            }
        }

        if (request.managerId() != null) {
            User manager =
                    userRepository
                            .findActiveById(request.managerId())
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "USER_NOT_FOUND",
                                                    "Người quản lý không tồn tại"));
        }

        Department department =
                Department.create(
                        UUID.randomUUID(),
                        request.code(),
                        request.name(),
                        request.description(),
                        request.parentId(),
                        request.managerId());

        Department saved = departmentRepository.save(department);
        return DepartmentResponse.from(saved);
    }

    @Transactional
    public DepartmentResponse updateDepartment(UUID departmentId, UpdateDepartmentRequest request) {
        Department department =
                departmentRepository
                        .findActiveById(departmentId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "DEPARTMENT_NOT_FOUND", "Phòng ban không tồn tại"));

        if (request.parentId() != null) {
            if (request.parentId().equals(departmentId)) {
                throw new BusinessRuleException(
                        "INVALID_PARENT_DEPARTMENT",
                        "Phòng ban không thể tự làm cha của chính mình");
            }

            Department parent =
                    departmentRepository
                            .findActiveById(request.parentId())
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "DEPARTMENT_NOT_FOUND",
                                                    "Phòng ban cha không tồn tại"));

            // Check for circular hierarchy
            UUID currentParentId = parent.getParentId();
            while (currentParentId != null) {
                if (currentParentId.equals(departmentId)) {
                    throw new BusinessRuleException(
                            "CIRCULAR_DEPARTMENT_HIERARCHY",
                            "Không thể tạo vòng lặp phân cấp phòng ban");
                }
                Department ancestor =
                        departmentRepository.findActiveById(currentParentId).orElse(null);
                currentParentId = ancestor != null ? ancestor.getParentId() : null;
            }
        }

        if (request.managerId() != null) {
            userRepository
                    .findActiveById(request.managerId())
                    .orElseThrow(
                            () ->
                                    new ResourceNotFoundException(
                                            "USER_NOT_FOUND", "Người quản lý không tồn tại"));
        }

        if (governance != null)
            governance.validateDepartmentManager(departmentId, request.managerId());
        department.update(
                request.name(), request.description(), request.parentId(), request.managerId());

        Department updated = departmentRepository.save(department);
        return DepartmentResponse.from(updated);
    }

    @Transactional
    public void deactivateDepartment(UUID departmentId) {
        Department department =
                departmentRepository
                        .findActiveById(departmentId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "DEPARTMENT_NOT_FOUND", "Phòng ban không tồn tại"));

        if (governance != null) governance.validateDepartmentStop(departmentId);
        department.deactivate();
        departmentRepository.save(department);
    }
}
