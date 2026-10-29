import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/app/auth/AuthProvider';
import { authApi } from '../../src/features/auth/api/authApi';
import { refreshAccessToken } from '../../src/app/auth/refreshCoordinator';
import { accessTokenStore } from '../../src/shared/storage/accessTokenStore';
import { secureStorage } from '../../src/shared/storage/secureStorage';
import type { AuthUser } from '../../src/features/auth/api/authTypes';

jest.mock('../../src/features/auth/api/authApi');
jest.mock('../../src/app/auth/refreshCoordinator');
jest.mock('../../src/shared/storage/accessTokenStore');
jest.mock('../../src/shared/storage/secureStorage');

describe('AuthProvider Session Bootstrap Lifecycle', () => {
  const mockUser: AuthUser = {
    id: 'user-001',
    username: 'bootstrap.user',
    email: 'bootstrap@worksphere.com',
    fullName: 'Bootstrap User',
    avatarUrl: null,
    department: { id: 'd-1', name: 'Engineering' },
    roles: ['ROLE_USER'],
    permissions: ['VIEW_TASKS'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('no Keychain refresh token -> transitions to UNAUTHENTICATED', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce(null);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
    expect(result.current.initialized).toBe(true);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(authApi.getCurrentUser).not.toHaveBeenCalled();
  });

  test('valid Keychain refresh token -> refresh succeeds -> loads profile -> transitions to AUTHENTICATED', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce('valid-stored-refresh-token');
    (refreshAccessToken as jest.Mock).mockResolvedValueOnce('new-access-token');
    (authApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(secureStorage.getRefreshToken).toHaveBeenCalledTimes(1);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(result.current.sessionState).toBe('AUTHENTICATED');
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.initialized).toBe(true);
  });

  test('terminal refresh failure (401/revoked/invalid) -> clears session and transitions to UNAUTHENTICATED', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce('invalid-token');
    (refreshAccessToken as jest.Mock).mockRejectedValueOnce({
      kind: 'UNAUTHORIZED',
      status: 401,
      message: 'Token expired',
    });

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
    expect(result.current.initialized).toBe(true);
  });

  test('recoverable network error -> retains refresh token in Keychain and exposes retry state', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce('valid-token-offline');
    (refreshAccessToken as jest.Mock).mockRejectedValueOnce({
      kind: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến máy chủ',
    });

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current.sessionState).toBe('INITIALIZING');
    expect(result.current.canRetryBootstrap).toBe(true);
    expect(result.current.lastAuthError).not.toBeNull();
    // Refresh token in Keychain was NOT cleared
    expect(secureStorage.clearRefreshToken).not.toHaveBeenCalled();

    // Now test retryBootstrap succeeds
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce('valid-token-offline');
    (refreshAccessToken as jest.Mock).mockResolvedValueOnce('new-access-token');
    (authApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);

    await act(async () => {
      await result.current.retryBootstrap();
    });

    expect(result.current.sessionState).toBe('AUTHENTICATED');
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.canRetryBootstrap).toBe(false);
  });

  test('recoverable timeout error -> explicit logoutLocal clears Keychain and transitions to UNAUTHENTICATED', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce('valid-token-timeout');
    (refreshAccessToken as jest.Mock).mockRejectedValueOnce({
      kind: 'TIMEOUT',
      message: 'Timeout error',
    });

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current.canRetryBootstrap).toBe(true);

    await act(async () => {
      await result.current.logoutLocal();
    });

    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
  });

  test('unmount safety during bootstrap: no dispatch on unmounted component', async () => {
    let resolveRefresh: any;
    const pendingRefresh = new Promise(resolve => {
      resolveRefresh = resolve;
    });

    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce('token-unmount');
    (refreshAccessToken as jest.Mock).mockReturnValueOnce(pendingRefresh);

    const { unmount } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      unmount();
    });

    await act(async () => {
      resolveRefresh('token');
    });

    // authApi.getCurrentUser should not be called since component unmounted
    expect(authApi.getCurrentUser).not.toHaveBeenCalled();
  });

  test('EXACTLY-ONCE TERMINAL CLEANUP: 3 concurrent 401 failures coalesce into exactly one cleanup execution', async () => {
    const { notifyUnauthorized } = require('../../src/shared/api/apiClient');

    // Mount AuthProvider initialized to AUTHENTICATED
    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialState={{ sessionState: 'AUTHENTICATED', currentUser: mockUser }}>
          {children}
        </AuthProvider>
      ),
    });

    jest.clearAllMocks();

    // Trigger 3 concurrent notifyUnauthorized calls simultaneously
    await act(async () => {
      await Promise.all([
        notifyUnauthorized(),
        notifyUnauthorized(),
        notifyUnauthorized(),
      ]);
    });

    // Verify exactly-once cleanup
    expect(accessTokenStore.clearAccessToken).toHaveBeenCalledTimes(1);
    expect(secureStorage.clearRefreshToken).toHaveBeenCalledTimes(1);
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
  });

  test('SINGLE CLEANUP OWNER: 3 concurrent protected requests fail refresh terminally -> exactly 1 cleanup execution and 1 state transition', async () => {
    const { apiClient, registerTokenRefreshHandler } = require('../../src/shared/api/apiClient');
    const axios = require('axios');

    // Mount AuthProvider initialized to AUTHENTICATED
    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialState={{ sessionState: 'AUTHENTICATED', currentUser: mockUser }}>
          {children}
        </AuthProvider>
      ),
    });

    jest.clearAllMocks();

    // Mock refresh handler to fail terminally (simulating server refresh failure)
    const mockRefresh = jest.fn().mockImplementation(async () => {
      throw new Error('Refresh token expired or revoked on server');
    });
    registerTokenRefreshHandler(mockRefresh);

    const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

    const create401Error = (id: string) => {
      const config = {
        url: `/projects/${id}`,
        method: 'get',
        headers: new axios.AxiosHeaders({ Authorization: 'Bearer expired-token' }),
      } as any;

      return new axios.AxiosError('Unauthorized', '401', config, {}, {
        status: 401,
        data: { success: false, code: 'UNAUTHORIZED', timestamp: '2026-10-19T00:00:00Z' },
        statusText: 'Unauthorized',
        headers: {},
        config,
      } as any);
    };

    // 3 concurrent protected requests receive 401
    let p1Err: any;
    let p2Err: any;
    let p3Err: any;

    await act(async () => {
      const [r1, r2, r3] = await Promise.allSettled([
        responseInterceptorErr(create401Error('1')),
        responseInterceptorErr(create401Error('2')),
        responseInterceptorErr(create401Error('3')),
      ]);
      if (r1.status === 'rejected') p1Err = r1.reason;
      if (r2.status === 'rejected') p2Err = r2.reason;
      if (r3.status === 'rejected') p3Err = r3.reason;
    });

    // All 3 reject consistently with normalized error
    expect(p1Err).toBeDefined();
    expect(p2Err).toBeDefined();
    expect(p3Err).toBeDefined();

    // Assert exact counts:
    // - Token refresh handler called
    expect(mockRefresh).toHaveBeenCalled();
    // - Exactly 1 actual storage cleanup execution from AuthProvider (sole terminal cleanup owner)
    expect(accessTokenStore.clearAccessToken).toHaveBeenCalledTimes(1);
    expect(secureStorage.clearRefreshToken).toHaveBeenCalledTimes(1);
    // - Exactly 1 transition to UNAUTHENTICATED
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
  });
});
