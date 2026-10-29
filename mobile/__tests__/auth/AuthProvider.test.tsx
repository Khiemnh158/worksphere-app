import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/app/auth/AuthProvider';
import { authApi } from '../../src/features/auth/api/authApi';
import { accessTokenStore } from '../../src/shared/storage/accessTokenStore';
import { secureStorage } from '../../src/shared/storage/secureStorage';
import type { AuthResponse, AuthUser } from '../../src/features/auth/api/authTypes';

// Mock dependencies
jest.mock('../../src/features/auth/api/authApi');
jest.mock('../../src/shared/storage/accessTokenStore');
jest.mock('../../src/shared/storage/secureStorage');

describe('AuthProvider & useAuth hook', () => {
  const mockSampleUser: AuthUser = {
    id: 'user-uuid-123',
    username: 'test.user',
    email: 'test.user@worksphere.com',
    fullName: 'Test User',
    avatarUrl: null,
    department: { id: 'dept-01', name: 'Engineering' },
    roles: ['ROLE_USER'],
    permissions: ['VIEW_TASKS'],
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token-xyz',
    refreshToken: 'mock-refresh-token-abc',
    tokenType: 'Bearer',
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 604800,
    user: mockSampleUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws error when useAuth is consumed outside AuthProvider', async () => {
    // Suppress console.error for expected thrown error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(async () => {
      await renderHook(() => useAuth());
    }).rejects.toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });

  test('bootstrap: clears memory access token and completes initialization to UNAUTHENTICATED', async () => {
    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(accessTokenStore.clearAccessToken).toHaveBeenCalledTimes(1);
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.operationState).toBe('idle');
    expect(result.current.currentUser).toBeNull();
    expect(result.current.initialized).toBe(true);
    expect(result.current.lastAuthError).toBeNull();
  });

  test('login success: executes secure storage sequence and transitions to AUTHENTICATED', async () => {
    (authApi.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
    (secureStorage.setRefreshToken as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    let success = false;
    await act(async () => {
      success = await result.current.login('test.user', 'ValidPassword123');
    });

    expect(success).toBe(true);
    expect(authApi.login).toHaveBeenCalledWith({
      login: 'test.user',
      password: 'ValidPassword123',
    });
    // Keychain write happens first
    expect(secureStorage.setRefreshToken).toHaveBeenCalledWith('mock-refresh-token-abc');
    // Memory access token write happens after Keychain write
    expect(accessTokenStore.setAccessToken).toHaveBeenCalledWith('mock-access-token-xyz');
    expect(result.current.sessionState).toBe('AUTHENTICATED');
    expect(result.current.operationState).toBe('idle');
    expect(result.current.currentUser).toEqual(mockSampleUser);
    expect(result.current.lastAuthError).toBeNull();
  });

  test('login failure on Keychain write: rolls back memory and Keychain, transitions to UNAUTHENTICATED with error', async () => {
    (authApi.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
    (secureStorage.setRefreshToken as jest.Mock).mockRejectedValueOnce(
      new Error('Keychain hardware unavailable')
    );

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    let success = true;
    await act(async () => {
      success = await result.current.login('test.user', 'ValidPassword123');
    });

    expect(success).toBe(false);
    // Verified rollback
    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(accessTokenStore.setAccessToken).not.toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.operationState).toBe('error');
    expect(result.current.currentUser).toBeNull();
    expect(result.current.lastAuthError).not.toBeNull();
  });

  test('login failure on API rejection: leaves storage untouched, transitions to UNAUTHENTICATED with error', async () => {
    const apiError = new Error('Invalid credentials');
    (authApi.login as jest.Mock).mockRejectedValueOnce(apiError);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    let success = true;
    await act(async () => {
      success = await result.current.login('wrong.user', 'WrongPassword123');
    });

    expect(success).toBe(false);
    expect(secureStorage.setRefreshToken).not.toHaveBeenCalled();
    expect(accessTokenStore.setAccessToken).not.toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.operationState).toBe('error');
    expect(result.current.currentUser).toBeNull();
    expect(result.current.lastAuthError).not.toBeNull();
  });

  test('duplicate login guard: ignores duplicate calls while authenticating', async () => {
    let resolveLogin: (res: AuthResponse) => void = () => {};
    const pendingPromise = new Promise<AuthResponse>(resolve => {
      resolveLogin = resolve;
    });
    (authApi.login as jest.Mock).mockReturnValueOnce(pendingPromise);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    let firstPromise: Promise<boolean>;
    let secondPromise: Promise<boolean>;

    await act(async () => {
      firstPromise = result.current.login('user1', 'Password123');
    });

    expect(result.current.operationState).toBe('authenticating');

    // Second call while first is in-flight
    await act(async () => {
      secondPromise = result.current.login('user2', 'Password123');
      const secondResult = await secondPromise;
      expect(secondResult).toBe(false);
    });

    // Resolve first login
    await act(async () => {
      resolveLogin(mockAuthResponse);
      await firstPromise;
    });

    expect(authApi.login).toHaveBeenCalledTimes(1);
    expect(result.current.sessionState).toBe('AUTHENTICATED');
  });

  test('local logout: clears memory access token and keychain refresh token, resets state to UNAUTHENTICATED', async () => {
    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider
          initialState={{
            sessionState: 'AUTHENTICATED',
            operationState: 'idle',
            currentUser: mockSampleUser,
            initialized: true,
          }}
        >
          {children}
        </AuthProvider>
      ),
    });

    await act(async () => {
      await result.current.logoutLocal();
    });

    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
    expect(result.current.operationState).toBe('idle');
  });

  test('local logout: resilient even if Keychain clear throws', async () => {
    (secureStorage.clearRefreshToken as jest.Mock).mockRejectedValueOnce(
      new Error('Keychain reset error')
    );

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider
          initialState={{
            sessionState: 'AUTHENTICATED',
            operationState: 'idle',
            currentUser: mockSampleUser,
            initialized: true,
          }}
        >
          {children}
        </AuthProvider>
      ),
    });

    await act(async () => {
      await result.current.logoutLocal();
    });

    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
    expect(result.current.operationState).toBe('idle');
  });

  test('clearAuthError clears lastAuthError and restores idle operationState', async () => {
    (authApi.login as jest.Mock).mockRejectedValueOnce(new Error('Auth failed'));

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      await result.current.login('user', 'pass');
    });

    expect(result.current.lastAuthError).not.toBeNull();
    expect(result.current.operationState).toBe('error');

    await act(async () => {
      result.current.clearAuthError();
    });

    expect(result.current.lastAuthError).toBeNull();
    expect(result.current.operationState).toBe('idle');
  });

  test('concurrency: simultaneous login calls in the same tick invoke API only once and reject duplicate', async () => {
    let resolveLogin: (res: AuthResponse) => void = () => {};
    const pendingPromise = new Promise<AuthResponse>(resolve => {
      resolveLogin = resolve;
    });
    (authApi.login as jest.Mock).mockReturnValueOnce(pendingPromise);
    (secureStorage.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    let res1Promise: Promise<boolean>;
    let res2Promise: Promise<boolean>;

    await act(async () => {
      // Both called in the exact same synchronous execution block
      res1Promise = result.current.login('user1', 'Password123');
      res2Promise = result.current.login('user2', 'Password123');
    });

    let res1: boolean | undefined;
    let res2: boolean | undefined;

    await act(async () => {
      resolveLogin(mockAuthResponse);
      const [r1, r2] = await Promise.all([res1Promise, res2Promise]);
      res1 = r1;
      res2 = r2;
    });

    expect(authApi.login).toHaveBeenCalledTimes(1);
    expect(res1).toBe(true);
    expect(res2).toBe(false);
    expect(result.current.sessionState).toBe('AUTHENTICATED');
  });

  test('lock release: allows subsequent login call after previous login succeeded', async () => {
    (authApi.login as jest.Mock)
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce(mockAuthResponse);
    (secureStorage.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    let firstSuccess = false;
    await act(async () => {
      firstSuccess = await result.current.login('user1', 'Password123');
    });
    expect(firstSuccess).toBe(true);
    expect(authApi.login).toHaveBeenCalledTimes(1);

    // Logout to return to UNAUTHENTICATED
    await act(async () => {
      await result.current.logoutLocal();
    });
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');

    // Subsequent login after lock was released
    let secondSuccess = false;
    await act(async () => {
      secondSuccess = await result.current.login('user1', 'Password123');
    });
    expect(secondSuccess).toBe(true);
    expect(authApi.login).toHaveBeenCalledTimes(2);
  });

  test('lock release: allows subsequent login call after API rejection', async () => {
    (authApi.login as jest.Mock)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce(mockAuthResponse);
    (secureStorage.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    let firstSuccess = true;
    await act(async () => {
      firstSuccess = await result.current.login('user1', 'Password123');
    });
    expect(firstSuccess).toBe(false);
    expect(result.current.operationState).toBe('error');

    // Subsequent login after failure
    let secondSuccess = false;
    await act(async () => {
      secondSuccess = await result.current.login('user1', 'Password123');
    });
    expect(secondSuccess).toBe(true);
    expect(authApi.login).toHaveBeenCalledTimes(2);
    expect(result.current.sessionState).toBe('AUTHENTICATED');
  });

  test('lock release: allows subsequent login call after Keychain write failure', async () => {
    (authApi.login as jest.Mock)
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce(mockAuthResponse);
    (secureStorage.setRefreshToken as jest.Mock)
      .mockRejectedValueOnce(new Error('Keychain locked'))
      .mockResolvedValueOnce(undefined);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    let firstSuccess = true;
    await act(async () => {
      firstSuccess = await result.current.login('user1', 'Password123');
    });
    expect(firstSuccess).toBe(false);
    expect(result.current.operationState).toBe('error');

    // Subsequent login after failure
    let secondSuccess = false;
    await act(async () => {
      secondSuccess = await result.current.login('user1', 'Password123');
    });
    expect(secondSuccess).toBe(true);
    expect(authApi.login).toHaveBeenCalledTimes(2);
    expect(result.current.sessionState).toBe('AUTHENTICATED');
  });

  test('concurrency: concurrent logoutLocal calls in same tick clear storage only once', async () => {
    let resolveClear: () => void = () => {};
    const pendingClear = new Promise<void>(resolve => {
      resolveClear = resolve;
    });
    (secureStorage.clearRefreshToken as jest.Mock).mockReturnValueOnce(pendingClear);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider
          initialState={{
            sessionState: 'AUTHENTICATED',
            operationState: 'idle',
            currentUser: mockSampleUser,
            initialized: true,
          }}
        >
          {children}
        </AuthProvider>
      ),
    });

    let p1: Promise<void>;
    let p2: Promise<void>;

    await act(async () => {
      // Both invoked in same synchronous block
      p1 = result.current.logoutLocal();
      p2 = result.current.logoutLocal();
    });

    await act(async () => {
      resolveClear();
      await Promise.all([p1, p2]);
    });

    expect(secureStorage.clearRefreshToken).toHaveBeenCalledTimes(1);
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
  });

  test('unmount safety: aborts and rolls back storage when component unmounts while login is in-flight', async () => {
    let resolveLogin: (res: AuthResponse) => void = () => {};
    const pendingPromise = new Promise<AuthResponse>(resolve => {
      resolveLogin = resolve;
    });
    (authApi.login as jest.Mock).mockReturnValueOnce(pendingPromise);
    (secureStorage.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

    const { result, unmount } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    let loginPromise!: Promise<boolean>;
    await act(async () => {
      loginPromise = result.current.login('user1', 'Password123');
    });

    await act(async () => {
      unmount();
    });

    let success: boolean | undefined;
    await act(async () => {
      resolveLogin(mockAuthResponse);
      success = await loginPromise;
    });

    expect(success).toBe(false);
    // Verified memory and keychain cleared on unmounted completion
    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    // Did NOT save tokens or transition to authenticated
    expect(accessTokenStore.setAccessToken).not.toHaveBeenCalled();
    expect(secureStorage.setRefreshToken).not.toHaveBeenCalled();
  });

});
