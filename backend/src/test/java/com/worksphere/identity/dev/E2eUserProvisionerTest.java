package com.worksphere.identity.dev;

import com.worksphere.identity.domain.Role;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserRole;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.RoleRepository;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.identity.infrastructure.persistence.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class E2eUserProvisionerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private Role employeeRole;

    @BeforeEach
    void setUp() {
        employeeRole = mock(Role.class);
        lenient().when(employeeRole.getId()).thenReturn(UUID.randomUUID());
        lenient().when(employeeRole.getCode()).thenReturn("EMPLOYEE");
    }

    @Test
    @DisplayName("A. When disabled by default, provisioner does not perform any repository operations")
    void shouldDoNothingWhenDisabled() {
        E2eUserProvisioner provisioner = new E2eUserProvisioner(
                userRepository,
                roleRepository,
                userRoleRepository,
                passwordEncoder,
                false,
                "some_login",
                "some_user",
                "user@test.local",
                "Password123!",
                "Test User"
        );

        provisioner.run(new DefaultApplicationArguments());

        verifyNoInteractions(userRepository, roleRepository, userRoleRepository, passwordEncoder);
    }

    @Test
    @DisplayName("B. When enabled but login and username/email are missing, fails safely without credentials")
    void shouldFailSafelyWhenLoginMissing() {
        E2eUserProvisioner provisioner = new E2eUserProvisioner(
                userRepository,
                roleRepository,
                userRoleRepository,
                passwordEncoder,
                true,
                "",
                "",
                "",
                "Password123!",
                "Test User"
        );

        assertThatThrownBy(() -> provisioner.run(new DefaultApplicationArguments()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("username or login is required");

        verifyNoInteractions(userRepository, userRoleRepository);
    }

    @Test
    @DisplayName("C. When enabled but password is empty, fails safely")
    void shouldFailSafelyWhenPasswordEmpty() {
        E2eUserProvisioner provisioner = new E2eUserProvisioner(
                userRepository,
                roleRepository,
                userRoleRepository,
                passwordEncoder,
                true,
                "e2e_login",
                "e2e_login",
                "e2e@worksphere.local",
                "",
                "Test User"
        );

        assertThatThrownBy(() -> provisioner.run(new DefaultApplicationArguments()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("password is required");

        verifyNoInteractions(userRepository, userRoleRepository);
    }

    @Test
    @DisplayName("C2. When password length is less than 8 characters, fails safely")
    void shouldFailSafelyWhenPasswordTooShort() {
        E2eUserProvisioner provisioner = new E2eUserProvisioner(
                userRepository,
                roleRepository,
                userRoleRepository,
                passwordEncoder,
                true,
                "e2e_login",
                "e2e_login",
                "e2e@worksphere.local",
                "short",
                "Test User"
        );

        assertThatThrownBy(() -> provisioner.run(new DefaultApplicationArguments()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("password must be between 8 and 128 characters");

        verifyNoInteractions(userRepository, userRoleRepository);
    }

    @Test
    @DisplayName("D. When account does not exist, creates one active user with hashed password and EMPLOYEE role")
    void shouldCreateNewActiveUserWithEmployeeRole() {
        when(userRepository.findActiveByUsernameOrEmail("e2e_test")).thenReturn(Optional.empty());
        when(userRepository.findActiveByEmail("e2e@worksphere.local")).thenReturn(Optional.empty());
        when(roleRepository.findByCode("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
        when(passwordEncoder.encode("SecureE2ePass123!")).thenReturn("hashed_secure_pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        E2eUserProvisioner provisioner = new E2eUserProvisioner(
                userRepository,
                roleRepository,
                userRoleRepository,
                passwordEncoder,
                true,
                "",
                "e2e_test",
                "e2e@worksphere.local",
                "SecureE2ePass123!",
                "Dedicated E2E User"
        );

        provisioner.run(new DefaultApplicationArguments());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).save(userCaptor.capture());
        User createdUser = userCaptor.getAllValues().get(0);

        assertThat(createdUser.getUsername()).isEqualTo("e2e_test");
        assertThat(createdUser.getEmail()).isEqualTo("e2e@worksphere.local");
        assertThat(createdUser.getPasswordHash()).isEqualTo("hashed_secure_pass");
        assertThat(createdUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(createdUser.getFullName()).isEqualTo("Dedicated E2E User");

        ArgumentCaptor<UserRole> roleCaptor = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository).save(roleCaptor.capture());
        assertThat(roleCaptor.getValue().getUserId()).isEqualTo(createdUser.getId());
        assertThat(roleCaptor.getValue().getRoleId()).isEqualTo(employeeRole.getId());
    }

    @Test
    @DisplayName("D2. Resolves username and email correctly from WORKSPHERE_E2E_LOGIN when individual fields are omitted")
    void shouldResolveIdentityFromLoginString() {
        when(userRepository.findActiveByUsernameOrEmail("nvcuong")).thenReturn(Optional.empty());
        when(userRepository.findActiveByEmail("nvcuong@company.vn")).thenReturn(Optional.empty());
        when(roleRepository.findByCode("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        E2eUserProvisioner provisioner = new E2eUserProvisioner(
                userRepository,
                roleRepository,
                userRoleRepository,
                passwordEncoder,
                true,
                "nvcuong@company.vn",
                "",
                "",
                "Password123!",
                "Nguyen Van Cuong"
        );

        provisioner.run(new DefaultApplicationArguments());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).save(userCaptor.capture());
        User createdUser = userCaptor.getAllValues().get(0);

        assertThat(createdUser.getUsername()).isEqualTo("nvcuong");
        assertThat(createdUser.getEmail()).isEqualTo("nvcuong@company.vn");
        assertThat(createdUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("E & H. When dedicated E2E account already exists, skips gracefully and ensures idempotency")
    void shouldSkipGracefullyWhenAccountAlreadyExists() {
        UUID existingUserId = UUID.randomUUID();
        User existingUser = mock(User.class);
        when(existingUser.getId()).thenReturn(existingUserId);
        when(existingUser.getRoles()).thenReturn(Collections.singleton(employeeRole));

        when(userRepository.findActiveByUsernameOrEmail("e2e_test")).thenReturn(Optional.of(existingUser));
        when(userRepository.findActiveByEmail("e2e@worksphere.local")).thenReturn(Optional.of(existingUser));

        E2eUserProvisioner provisioner = new E2eUserProvisioner(
                userRepository,
                roleRepository,
                userRoleRepository,
                passwordEncoder,
                true,
                "",
                "e2e_test",
                "e2e@worksphere.local",
                "Password123!",
                "Test User"
        );

        provisioner.run(new DefaultApplicationArguments());

        verify(userRepository, never()).save(any(User.class));
        verify(userRoleRepository, never()).save(any(UserRole.class));
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("F. When an existing account conflicts with username or email, fails safely without modifying data")
    void shouldFailSafelyWhenAccountCollides() {
        User existingUser = mock(User.class);
        when(userRepository.findActiveByUsernameOrEmail("e2e_test")).thenReturn(Optional.of(existingUser));
        when(userRepository.findActiveByEmail("e2e@worksphere.local")).thenReturn(Optional.empty());

        E2eUserProvisioner provisioner = new E2eUserProvisioner(
                userRepository,
                roleRepository,
                userRoleRepository,
                passwordEncoder,
                true,
                "",
                "e2e_test",
                "e2e@worksphere.local",
                "Password123!",
                "Test User"
        );

        assertThatThrownBy(() -> provisioner.run(new DefaultApplicationArguments()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("account collision detected");

        verify(userRepository, never()).save(any(User.class));
        verify(userRoleRepository, never()).save(any(UserRole.class));
    }

    @Test
    @DisplayName("G. In production profile or when property is false, provisioner bean is not loaded")
    void shouldNotLoadBeanInProductionOrWhenDisabled() {
        new org.springframework.boot.test.context.runner.ApplicationContextRunner()
                .withUserConfiguration(E2eUserProvisioner.class)
                .withPropertyValues("worksphere.dev.e2e-user.enabled=false")
                .withSystemProperties("spring.profiles.active=dev")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(E2eUserProvisioner.class);
                });

        new org.springframework.boot.test.context.runner.ApplicationContextRunner()
                .withUserConfiguration(E2eUserProvisioner.class)
                .withPropertyValues("worksphere.dev.e2e-user.enabled=true")
                .withSystemProperties("spring.profiles.active=prod")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(E2eUserProvisioner.class);
                });
    }
}
