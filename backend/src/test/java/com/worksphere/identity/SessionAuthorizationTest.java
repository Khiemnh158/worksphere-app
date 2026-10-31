package com.worksphere.identity;

import com.worksphere.identity.domain.LoginSession;
import com.worksphere.identity.domain.User;
import com.worksphere.identity.domain.UserStatus;
import com.worksphere.identity.infrastructure.persistence.LoginSessionRepository;
import com.worksphere.identity.infrastructure.persistence.UserRepository;
import com.worksphere.shared.security.JwtAuthenticationFilter;
import com.worksphere.shared.security.JwtService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class SessionAuthorizationTest {
    private final UUID userId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final JwtService jwt = mock(JwtService.class);
    private final UserRepository users = mock(UserRepository.class);
    private final LoginSessionRepository sessions = mock(LoginSessionRepository.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwt, users, sessions);

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
    }

    private User fixture() {
        Claims claims = mock(Claims.class);
        when(jwt.validateAndParseToken("signed-test-token")).thenReturn(claims);
        when(claims.getSubject()).thenReturn(userId.toString());
        when(claims.get("sessionId", String.class)).thenReturn(sessionId.toString());
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(user.getRoles()).thenReturn(Set.of());
        when(users.findActiveById(userId)).thenReturn(Optional.of(user));
        return user;
    }

    private void request(boolean authenticated) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/me");
        request.addHeader("Authorization", "Bearer signed-test-token");
        AtomicInteger downstream = new AtomicInteger();
        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> {
            downstream.incrementAndGet();
            assertThat(SecurityContextHolder.getContext().getAuthentication() != null).isEqualTo(authenticated);
        });
        assertThat(downstream.get()).isEqualTo(1);
    }

    private LoginSession activeSession(UUID owner) {
        LoginSession session = LoginSession.create(sessionId, owner, null, "test", "127.0.0.1", "JUnit");
        when(sessions.findById(sessionId)).thenReturn(Optional.of(session));
        return session;
    }

    @Test
    void activeOwnedSessionAuthenticates() throws Exception {
        fixture(); activeSession(userId); request(true);
    }

    @Test
    void loggedOutSessionRejectsUnexpiredAccessToken() throws Exception {
        fixture(); activeSession(userId).logout(); request(false);
    }

    @Test
    void revokedSessionRejectsUnexpiredAccessToken() throws Exception {
        fixture(); activeSession(userId).revoke(); request(false);
    }

    @Test
    void nonexistentSessionRejectsSignedToken() throws Exception {
        fixture(); request(false);
    }

    @Test
    void sessionFromAnotherUserCannotAuthenticate() throws Exception {
        fixture(); activeSession(UUID.randomUUID()); request(false);
    }

    @ParameterizedTest
    @EnumSource(value = UserStatus.class, names = {"LOCKED", "DISABLED", "PENDING"})
    void inactiveAccountCannotAuthenticateEvenWithActiveSession(UserStatus status) throws Exception {
        User user = fixture(); when(user.getStatus()).thenReturn(status); activeSession(userId); request(false);
    }

    @Test
    void unlockingAccountDoesNotReviveRevokedSession() throws Exception {
        fixture(); activeSession(userId).revoke(); request(false);
    }
}
