package com.worksphere.identity.application;

import com.worksphere.identity.api.request.AdminUpdateUserRequest;
import com.worksphere.identity.api.request.CreateUserRequest;
import com.worksphere.identity.api.response.UserDirectoryItemResponse;
import com.worksphere.identity.api.response.UserSummaryResponse;
import com.worksphere.identity.domain.Role;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.LoginSessionRepository;
import com.worksphere.identity.infrastructure.persistence.RefreshTokenRepository;
import com.worksphere.identity.infrastructure.persistence.RoleRepository;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.identity.infrastructure.persistence.UserRoleRepository;
import com.worksphere.organization.domain.Department;
import com.worksphere.organization.infrastructure.persistence.DepartmentRepository;
import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import com.worksphere.shared.response.PagedData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserManagementApplicationService {

    private static final Logger log = LoggerFactory.getLogger(UserManagementApplicationService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final DepartmentRepository departmentRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginSessionRepository loginSessionRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementApplicationService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            DepartmentRepository departmentRepository,
            RefreshTokenRepository refreshTokenRepository,
            LoginSessionRepository loginSessionRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.departmentRepository = departmentRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.loginSessionRepository = loginSessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PagedData<UserSummaryResponse> searchUsers(
            String search,
            UUID departmentId,
            String roleCode,
            UserStatus status,
            Pageable pageable
    ) {
        Page<User> page = userRepository.searchUsers(search, departmentId, status, pageable);

        List<UserSummaryResponse> items = page.getContent().stream()
                .filter(u -> {
                    if (roleCode == null || roleCode.isBlank()) {
                        return true;
                    }
                    return u.getRoles().stream().anyMatch(r -> r.getCode().equalsIgnoreCase(roleCode));
                })
                .map(UserSummaryResponse::from)
                .toList();

        return PagedData.from(page, items);
    }

    @Transactional(readOnly = true)
    public PagedData<UserDirectoryItemResponse> searchDirectory(
            String search,
            UUID departmentId,
            Pageable pageable
    ) {
        String normalizedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<User> page = userRepository.searchUsers(normalizedSearch, departmentId, UserStatus.ACTIVE, pageable);

        Set<UUID> departmentIds = page.getContent().stream()
                .map(User::getDepartmentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> departmentNames = departmentIds.isEmpty()
                ? Collections.emptyMap()
                : departmentRepository.findAllById(departmentIds).stream()
                        .collect(Collectors.toMap(Department::getId, Department::getName));

        List<UserDirectoryItemResponse> items = page.getContent().stream()
                .map(u -> new UserDirectoryItemResponse(
                        u.getId(),
                        u.getUsername(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getAvatarFileId() != null ? "/api/v1/files/" + u.getAvatarFileId() + "/download" : null,
                        u.getDepartmentId() != null ? departmentNames.get(u.getDepartmentId()) : null
                ))
                .toList();

        return PagedData.from(page, items);
    }

    @Transactional
    public UserSummaryResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsernameAndDeletedFalse(request.username())) {
            throw new BusinessRuleException("USERNAME_ALREADY_EXISTS", "Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmailAndDeletedFalse(request.email().toLowerCase())) {
            throw new BusinessRuleException("EMAIL_ALREADY_EXISTS", "Email đã tồn tại");
        }

        if (request.departmentId() != null) {
            departmentRepository.findActiveById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("DEPARTMENT_NOT_FOUND", "Phòng ban không tồn tại"));
        }

        Set<Role> roles = new HashSet<>();
        if (request.roleCodes() != null && !request.roleCodes().isEmpty()) {
            roles = roleRepository.findByCodeIn(request.roleCodes());
            if (roles.size() != request.roleCodes().size()) {
                throw new BusinessRuleException("ROLE_NOT_FOUND", "Một hoặc nhiều vai trò không tồn tại");
            }
        } else {
            // Default role EMPLOYEE
            roleRepository.findByCode("EMPLOYEE").ifPresent(roles::add);
        }

        // Generate temporary password (hashed) for PENDING user
        String temporaryPassword = generateSecureRandomPassword();
        String passwordHash = passwordEncoder.encode(temporaryPassword);

        User user = User.create(
                UUID.randomUUID(),
                request.username(),
                request.email(),
                passwordHash,
                request.fullName()
        );

        if (request.phoneNumber() != null) {
            user.updateProfile(request.fullName(), request.phoneNumber());
        }
        if (request.departmentId() != null) {
            user.updateDepartmentId(request.departmentId());
        }

        User saved = userRepository.save(user);

        // Persist UserRole records
        for (Role role : roles) {
            userRoleRepository.save(new com.worksphere.identity.domain.UserRole(
                    saved.getId(),
                    role.getId(),
                    Instant.now(),
                    null
            ));
        }

        user.setRoles(roles);
        log.info("User created by admin. userId={}, username={}", saved.getId(), saved.getUsername());
        return UserSummaryResponse.from(user);
    }

    @Transactional
    public UserSummaryResponse updateUser(UUID userId, AdminUpdateUserRequest request) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Người dùng không tồn tại"));

        if (request.departmentId() != null) {
            departmentRepository.findActiveById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("DEPARTMENT_NOT_FOUND", "Phòng ban không tồn tại"));
        }

        user.adminUpdate(request.fullName(), request.phoneNumber(), request.departmentId());

        if (request.roleCodes() != null) {
            Set<Role> roles = roleRepository.findByCodeIn(request.roleCodes());
            if (roles.size() != request.roleCodes().size()) {
                throw new BusinessRuleException("ROLE_NOT_FOUND", "Một hoặc nhiều vai trò không tồn tại");
            }
            userRoleRepository.deleteByUserId(user.getId());
            userRoleRepository.flush();
            for (Role role : roles) {
                userRoleRepository.save(new com.worksphere.identity.domain.UserRole(
                        user.getId(),
                        role.getId(),
                        Instant.now(),
                        null
                ));
            }
            user.setRoles(roles);
        }

        User saved = userRepository.save(user);
        return UserSummaryResponse.from(user);
    }

    @Transactional
    public void lockUser(UUID userId, String reason) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Người dùng không tồn tại"));

        user.lock();
        userRepository.save(user);

        // Revoke active sessions and refresh tokens per security rules
        refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
        loginSessionRepository.revokeAllActiveByUserId(userId, Instant.now());

        log.info("User locked by admin. userId={}, reason={}", userId, reason);
    }

    @Transactional
    public void unlockUser(UUID userId) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Người dùng không tồn tại"));

        user.unlock();
        userRepository.save(user);

        log.info("User unlocked by admin. userId={}", userId);
    }

    private String generateSecureRandomPassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes) + "Aa1!";
    }
}
