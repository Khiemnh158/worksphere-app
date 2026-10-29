import { authReducer, initialAuthState } from '../../src/app/auth/authReducer';
import type { AuthState } from '../../src/app/auth/authTypes';
import type { AuthUser } from '../../src/features/auth/api/authTypes';
import type { AuthPresentationError } from '../../src/features/auth/errors/authErrorMapper';

describe('authReducer State Machine', () => {
  const sampleUser: AuthUser = {
    id: 'user-uuid-001',
    username: 'dien.mai',
    email: 'dien.mai@worksphere.com',
    fullName: 'Dien Mai',
    avatarUrl: null,
    department: { id: 'dept-01', name: 'Engineering' },
    roles: ['ROLE_USER'],
    permissions: ['VIEW_PROJECTS', 'VIEW_TASKS'],
  };

  const sampleError: AuthPresentationError = {
    message: 'Thông tin đăng nhập không chính xác',
    placement: 'form',
    retryable: false,
    clearSession: false,
    navigateToLogin: false,
    traceId: 'tr-test-123',
  };

  test('initial state matches specification invariants', () => {
    expect(initialAuthState).toEqual({
      sessionState: 'INITIALIZING',
      operationState: 'idle',
      currentUser: null,
      initialized: false,
      lastAuthError: null,
    });
  });

  test('INITIALIZATION_COMPLETED_UNAUTHENTICATED transitions from INITIALIZING to UNAUTHENTICATED', () => {
    const nextState = authReducer(initialAuthState, {
      type: 'INITIALIZATION_COMPLETED_UNAUTHENTICATED',
    });

    expect(nextState).toEqual({
      sessionState: 'UNAUTHENTICATED',
      operationState: 'idle',
      currentUser: null,
      initialized: true,
      lastAuthError: null,
    });
  });

  test('LOGIN_STARTED sets operationState to authenticating and clears previous error', () => {
    const stateWithError: AuthState = {
      ...initialAuthState,
      sessionState: 'UNAUTHENTICATED',
      lastAuthError: sampleError,
      initialized: true,
    };

    const nextState = authReducer(stateWithError, { type: 'LOGIN_STARTED' });

    expect(nextState.operationState).toBe('authenticating');
    expect(nextState.lastAuthError).toBeNull();
    expect(nextState.sessionState).toBe('UNAUTHENTICATED');
  });

  test('LOGIN_SUCCEEDED transitions to AUTHENTICATED with user and clears errors', () => {
    const authenticatingState: AuthState = {
      sessionState: 'UNAUTHENTICATED',
      operationState: 'authenticating',
      currentUser: null,
      initialized: true,
      lastAuthError: null,
    };

    const nextState = authReducer(authenticatingState, {
      type: 'LOGIN_SUCCEEDED',
      payload: { user: sampleUser },
    });

    expect(nextState).toEqual({
      sessionState: 'AUTHENTICATED',
      operationState: 'idle',
      currentUser: sampleUser,
      initialized: true,
      lastAuthError: null,
    });
  });

  test('LOGIN_FAILED transitions to UNAUTHENTICATED with error payload', () => {
    const authenticatingState: AuthState = {
      sessionState: 'UNAUTHENTICATED',
      operationState: 'authenticating',
      currentUser: null,
      initialized: true,
      lastAuthError: null,
    };

    const nextState = authReducer(authenticatingState, {
      type: 'LOGIN_FAILED',
      payload: { error: sampleError },
    });

    expect(nextState).toEqual({
      sessionState: 'UNAUTHENTICATED',
      operationState: 'error',
      currentUser: null,
      initialized: true,
      lastAuthError: sampleError,
    });
  });

  test('LOGOUT_STARTED sets operationState to signingOut', () => {
    const authenticatedState: AuthState = {
      sessionState: 'AUTHENTICATED',
      operationState: 'idle',
      currentUser: sampleUser,
      initialized: true,
      lastAuthError: null,
    };

    const nextState = authReducer(authenticatedState, { type: 'LOGOUT_STARTED' });

    expect(nextState.operationState).toBe('signingOut');
    expect(nextState.sessionState).toBe('AUTHENTICATED');
    expect(nextState.currentUser).toEqual(sampleUser);
  });

  test('LOGOUT_COMPLETED resets state to UNAUTHENTICATED and clears user and errors', () => {
    const signingOutState: AuthState = {
      sessionState: 'AUTHENTICATED',
      operationState: 'signingOut',
      currentUser: sampleUser,
      initialized: true,
      lastAuthError: null,
    };

    const nextState = authReducer(signingOutState, { type: 'LOGOUT_COMPLETED' });

    expect(nextState).toEqual({
      sessionState: 'UNAUTHENTICATED',
      operationState: 'idle',
      currentUser: null,
      initialized: true,
      lastAuthError: null,
    });
  });

  test('CLEAR_AUTH_ERROR clears lastAuthError and resets error operationState to idle', () => {
    const errorState: AuthState = {
      sessionState: 'UNAUTHENTICATED',
      operationState: 'error',
      currentUser: null,
      initialized: true,
      lastAuthError: sampleError,
    };

    const nextState = authReducer(errorState, { type: 'CLEAR_AUTH_ERROR' });

    expect(nextState.lastAuthError).toBeNull();
    expect(nextState.operationState).toBe('idle');
  });

  test('CLEAR_AUTH_ERROR preserves non-error operationState', () => {
    const state: AuthState = {
      sessionState: 'AUTHENTICATED',
      operationState: 'idle',
      currentUser: sampleUser,
      initialized: true,
      lastAuthError: sampleError,
    };

    const nextState = authReducer(state, { type: 'CLEAR_AUTH_ERROR' });
    expect(nextState.lastAuthError).toBeNull();
    expect(nextState.operationState).toBe('idle');
  });

  test('unknown action leaves state unchanged', () => {
    const state = { ...initialAuthState };
    const nextState = authReducer(state, { type: 'UNKNOWN_ACTION' } as unknown as any);
    expect(nextState).toBe(state);
  });

  test('SECURITY INVARIANT: AuthState never contains access token, refresh token, or password', () => {
    const state = authReducer(initialAuthState, {
      type: 'LOGIN_SUCCEEDED',
      payload: { user: sampleUser },
    });

    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('accessToken');
    expect(serialized).not.toContain('refreshToken');
    expect(serialized).not.toContain('password');
  });
});
