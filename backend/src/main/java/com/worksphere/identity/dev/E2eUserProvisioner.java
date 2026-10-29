package com.worksphere.identity.dev;

import com.worksphere.identity.domain.Role;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserRole;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.RoleRepository;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.identity.infrastructure.persistence.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;

/**
 * Development-only provisioner for dedicated E2E test accounts.
 *
 * Security & Operational Invariants:
 * - Strictly guarded by @Profile("dev") and @ConditionalOnProperty("worksphere.dev.e2e-user.enabled").
 * - Disabled by default.
 * - Credential values are injected exclusively from external environment variables outside Git.
 * - Zero logging of passwords, tokens, usernames, or emails.
 * - Assigns least-privilege role EMPLOYEE with ACTIVE status.
 * - Idempotent execution (skips gracefully if the dedicated account already exists).
 * - Never active in production.
 */
@Component
@Profile("dev")
@ConditionalOnProperty(name = "worksphere.dev.e2e-user.enabled", havingValue = "true", matchIfMissing = false)
public class E2eUserProvisioner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(E2eUserProvisioner.class);

    private static final String ROLE_EMPLOYEE = "EMPLOYEE";
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 128;
    private static final int MIN_USERNAME_LENGTH = 3;
    private static final int MAX_USERNAME_LENGTH = 50;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    private final boolean enabled;
    private final String login;
    private final String username;
    private final String email;
    private final String password;
    private final String fullName;

    public E2eUserProvisioner(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${worksphere.dev.e2e-user.enabled:false}") boolean enabled,
            @Value("${worksphere.dev.e2e-user.login:}") String login,
            @Value("${worksphere.dev.e2e-user.username:}") String username,
            @Value("${worksphere.dev.e2e-user.email:}") String email,
            @Value("${worksphere.dev.e2e-user.password:}") String password,
            @Value("${worksphere.dev.e2e-user.full-name:E2E Test User}") String fullName
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.login = login != null ? login.trim() : "";
        this.username = username != null ? username.trim() : "";
        this.email = email != null ? email.trim() : "";
        this.password = password != null ? password : "";
        this.fullName = fullName != null && !fullName.trim().isEmpty() ? fullName.trim() : "E2E Test User";
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("E2E user provisioning disabled.");
            return;
        }

        validatePasswordPolicy(password);

        IdentityDetails identity = resolveAndValidateIdentity(login, username, email);

        Optional<User> existingByUsername = userRepository.findActiveByUsernameOrEmail(identity.username());
        Optional<User> existingByEmail = userRepository.findActiveByEmail(identity.email());

        if (existingByUsername.isPresent() && existingByEmail.isPresent()) {
            User userByU = existingByUsername.get();
            User userByE = existingByEmail.get();

            if (userByU.getId().equals(userByE.getId())) {
                log.info("E2E test account already exists. Provisioning skipped.");
                ensureEmployeeRoleAttached(userByU);
                return;
            } else {
                log.warn("E2E test account collision: username and email belong to distinct existing accounts.");
                throw new IllegalStateException("E2E user provisioning aborted: account collision detected");
            }
        }

        if (existingByUsername.isPresent() || existingByEmail.isPresent()) {
            log.warn("E2E test account collision: username or email already assigned to another account.");
            throw new IllegalStateException("E2E user provisioning aborted: account collision detected");
        }

        Role employeeRole = roleRepository.findByCode(ROLE_EMPLOYEE)
                .orElseThrow(() -> new IllegalStateException(
                        "E2E user provisioning failed: canonical role " + ROLE_EMPLOYEE + " not found in database"));

        UUID newUserId = UUID.randomUUID();
        String encodedPassword = passwordEncoder.encode(password);

        User newUser = User.create(
                newUserId,
                identity.username(),
                identity.email(),
                encodedPassword,
                fullName
        );

        newUser.lock();
        newUser.unlock();

        User savedUser = userRepository.save(newUser);

        UserRole userRole = new UserRole(savedUser.getId(), employeeRole.getId(), Instant.now(), null);
        userRoleRepository.save(userRole);

        savedUser.setRoles(new HashSet<>(Collections.singleton(employeeRole)));
        userRepository.save(savedUser);

        log.info("Dedicated E2E test account provisioned successfully with ACTIVE status and least-privilege role.");
    }

    private void validatePasswordPolicy(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            log.error("E2E user provisioning failed: password property is missing or empty.");
            throw new IllegalStateException("E2E user provisioning failed: password is required");
        }
        if (rawPassword.length() < MIN_PASSWORD_LENGTH || rawPassword.length() > MAX_PASSWORD_LENGTH) {
            log.error("E2E user provisioning failed: password length policy violation.");
            throw new IllegalStateException("E2E user provisioning failed: password must be between "
                    + MIN_PASSWORD_LENGTH + " and " + MAX_PASSWORD_LENGTH + " characters");
        }
    }

    private IdentityDetails resolveAndValidateIdentity(String rawLogin, String rawUsername, String rawEmail) {
        String resolvedUsername = rawUsername;
        String resolvedEmail = rawEmail;

        if (resolvedUsername.isEmpty() || resolvedEmail.isEmpty()) {
            if (!rawLogin.isEmpty()) {
                if (rawLogin.contains("@")) {
                    resolvedEmail = rawLogin.toLowerCase();
                    String localPart = rawLogin.substring(0, rawLogin.indexOf('@'));
                    resolvedUsername = sanitizeUsername(localPart);
                } else {
                    resolvedUsername = rawLogin;
                    resolvedEmail = (rawLogin + "@worksphere.local").toLowerCase();
                }
            }
        }

        if (resolvedUsername.isEmpty()) {
            log.error("E2E user provisioning failed: username could not be resolved from configuration.");
            throw new IllegalStateException("E2E user provisioning failed: username or login is required");
        }
        if (resolvedEmail.isEmpty()) {
            log.error("E2E user provisioning failed: email could not be resolved from configuration.");
            throw new IllegalStateException("E2E user provisioning failed: email or login is required");
        }

        if (resolvedUsername.length() < MIN_USERNAME_LENGTH || resolvedUsername.length() > MAX_USERNAME_LENGTH) {
            log.error("E2E user provisioning failed: username length policy violation.");
            throw new IllegalStateException("E2E user provisioning failed: username must be between "
                    + MIN_USERNAME_LENGTH + " and " + MAX_USERNAME_LENGTH + " characters");
        }

        if (!resolvedEmail.contains("@") || resolvedEmail.indexOf('@') >= resolvedEmail.lastIndexOf('.')) {
            log.error("E2E user provisioning failed: email format validation failure.");
            throw new IllegalStateException("E2E user provisioning failed: invalid email format");
        }

        return new IdentityDetails(resolvedUsername, resolvedEmail.toLowerCase());
    }

    private String sanitizeUsername(String input) {
        String sanitized = input.replaceAll("[^a-zA-Z0-9_.-]", "_");
        if (sanitized.length() < MIN_USERNAME_LENGTH) {
            sanitized = sanitized + "_user";
        }
        if (sanitized.length() > MAX_USERNAME_LENGTH) {
            sanitized = sanitized.substring(0, MAX_USERNAME_LENGTH);
        }
        return sanitized;
    }

    private void ensureEmployeeRoleAttached(User user) {
        boolean hasEmployee = user.getRoles().stream()
                .anyMatch(r -> ROLE_EMPLOYEE.equalsIgnoreCase(r.getCode()));
        if (!hasEmployee) {
            roleRepository.findByCode(ROLE_EMPLOYEE).ifPresent(role -> {
                userRoleRepository.save(new UserRole(user.getId(), role.getId(), Instant.now(), null));
            });
        }
    }

    public record IdentityDetails(String username, String email) {
    }
}
