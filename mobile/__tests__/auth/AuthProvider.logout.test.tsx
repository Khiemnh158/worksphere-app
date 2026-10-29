import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/app/auth/AuthProvider';
import { authApi } from '../../src/features/auth/api/authApi';
import { accessTokenStore } from '../../src/shared/storage/accessTokenStore';
import { secureStorage } from '../../src/shared/storage/secureStorage';
import type { AuthUser } from '../../src/features/auth/api/authTypes';

jest.mock('../../src/features/auth/api/authApi');
jest.mock('../../src/app/auth/refreshCoordinator');
jest.mock('../../src/shared/storage/accessTokenStore');
jest.mock('../../src/shared/storage/secureStorage');

describe('AuthProvider Remote Logout & Session Teardown', () => {
  const mockUser: AuthUser = {
    id: 'user-logout-01',
    username: 'logout.user',
    email: 'logout@worksphere.com',
    fullName: 'Logout User',
    avatarUrl: null,
    department: { id: 'd-1', name: 'Engineering' },
    roles: ['ROLE_USER'],
    permissions: ['VIEW_TASKS'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('remote logout success: calls authApi.logout with refreshToken, clears storage, transitions to UNAUTHENTICATED', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
    (accessTokenStore.getAccessToken as jest.Mock).mockReturnValue('valid-access-token');
    (authApi.logout as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider
          initialState={{
            sessionState: 'AUTHENTICATED',
            operationState: 'idle',
            currentUser: mockUser,
            initialized: true,
          }}
        >
          {children}
        </AuthProvider>
      ),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(authApi.logout).toHaveBeenCalledWith({
      refreshToken: 'valid-refresh-token',
    });
    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
  });

  test('remote logout network/server failure: still completes local teardown and transitions to UNAUTHENTICATED', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
    (accessTokenStore.getAccessToken as jest.Mock).mockReturnValue('valid-access-token');
    (authApi.logout as jest.Mock).mockRejectedValueOnce(new Error('Network error on logout'));

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider
          initialState={{
            sessionState: 'AUTHENTICATED',
            operationState: 'idle',
            currentUser: mockUser,
            initialized: true,
          }}
        >
          {children}
        </AuthProvider>
      ),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
  });

  test('remote logout when tokens absent: skips remote API call safely and completes local teardown', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);
    (accessTokenStore.getAccessToken as jest.Mock).mockReturnValue(null);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider
          initialState={{
            sessionState: 'AUTHENTICATED',
            operationState: 'idle',
            currentUser: mockUser,
            initialized: true,
          }}
        >
          {children}
        </AuthProvider>
      ),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(authApi.logout).not.toHaveBeenCalled();
    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
  });

  test('duplicate remote logout in same tick: invokes API only once and releases lock', async () => {
    let resolveLogout: any;
    const pendingLogout = new Promise<void>(resolve => {
      resolveLogout = resolve;
    });

    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
    (accessTokenStore.getAccessToken as jest.Mock).mockReturnValue('valid-access-token');
    (authApi.logout as jest.Mock).mockReturnValueOnce(pendingLogout);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider
          initialState={{
            sessionState: 'AUTHENTICATED',
            operationState: 'idle',
            currentUser: mockUser,
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
      p1 = result.current.logout();
      p2 = result.current.logout();
    });

    await act(async () => {
      resolveLogout();
      await Promise.all([p1, p2]);
    });

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
  });

  test('logoutAll: calls authApi.logoutAll and performs complete local session cleanup', async () => {
    (accessTokenStore.getAccessToken as jest.Mock).mockReturnValue('valid-access-token');
    (authApi.logoutAll as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider
          initialState={{
            sessionState: 'AUTHENTICATED',
            operationState: 'idle',
            currentUser: mockUser,
            initialized: true,
          }}
        >
          {children}
        </AuthProvider>
      ),
    });

    await act(async () => {
      await result.current.logoutAll?.();
    });

    expect(authApi.logoutAll).toHaveBeenCalledTimes(1);
    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(result.current.sessionState).toBe('UNAUTHENTICATED');
    expect(result.current.currentUser).toBeNull();
  });
});
