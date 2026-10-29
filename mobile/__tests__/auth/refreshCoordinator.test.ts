import {
  refreshAccessToken,
  resetRefreshCoordinatorForTests,
  refreshTransport,
  invalidateRefreshCoordinator,
  getRefreshGeneration,
} from '../../src/app/auth/refreshCoordinator';
import { resetSessionCredentialCoordinatorForTests } from '../../src/app/auth/sessionCredentialCoordinator';
import { secureStorage } from '../../src/shared/storage/secureStorage';
import { accessTokenStore } from '../../src/shared/storage/accessTokenStore';
import type { RefreshResponse } from '../../src/features/auth/api/authTypes';

jest.mock('../../src/shared/storage/secureStorage');
jest.mock('../../src/shared/storage/accessTokenStore');

describe('Single-Flight RefreshCoordinator', () => {
  const mockRefreshResponse: RefreshResponse = {
    accessToken: 'rotated-access-token-jwt',
    refreshToken: 'rotated-refresh-token-xyz',
    tokenType: 'Bearer',
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 604800,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await resetSessionCredentialCoordinatorForTests();
    resetRefreshCoordinatorForTests();
  });

  test('A. No refresh token in Keychain: throws terminal error without HTTP call and does not clear storage directly', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce(null);
    const postSpy = jest.spyOn(refreshTransport, 'post');

    await expect(refreshAccessToken()).rejects.toThrow(
      'Không tìm thấy phiên đăng nhập trong bộ lưu trữ an toàn'
    );

    expect(secureStorage.getRefreshToken).toHaveBeenCalledTimes(1);
    expect(accessTokenStore.clearAccessToken).not.toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).not.toHaveBeenCalled();
    expect(postSpy).not.toHaveBeenCalled();
  });

  test('B. Single refresh call: reads Keychain, calls transport, stores rotated token, updates memory token', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce('old-refresh-token-123');
    jest.spyOn(refreshTransport, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: mockRefreshResponse,
        timestamp: '2026-10-18T12:00:00Z',
      },
    });
    (secureStorage.setRefreshToken as jest.Mock).mockResolvedValueOnce(undefined);

    const token = await refreshAccessToken();

    expect(token).toBe('rotated-access-token-jwt');
    expect(secureStorage.getRefreshToken).toHaveBeenCalledTimes(1);
    expect(secureStorage.setRefreshToken).toHaveBeenCalledWith('rotated-refresh-token-xyz');
    expect(accessTokenStore.setAccessToken).toHaveBeenCalledWith('rotated-access-token-jwt');
  });

  test('C. Three concurrent refresh calls: executes single in-flight call and shares result', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token-123');

    let resolveHttp: any;
    const pendingHttp = new Promise(resolve => {
      resolveHttp = resolve;
    });

    jest.spyOn(refreshTransport, 'post').mockReturnValueOnce(pendingHttp as any);
    (secureStorage.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

    // Call 3 times simultaneously in same tick
    const p1 = refreshAccessToken();
    const p2 = refreshAccessToken();
    const p3 = refreshAccessToken();

    // Resolve HTTP transport
    resolveHttp({
      data: {
        success: true,
        data: mockRefreshResponse,
        timestamp: '2026-10-18T12:00:00Z',
      },
    });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1).toBe('rotated-access-token-jwt');
    expect(r2).toBe('rotated-access-token-jwt');
    expect(r3).toBe('rotated-access-token-jwt');

    // Exactly one Keychain read and write
    expect(secureStorage.getRefreshToken).toHaveBeenCalledTimes(1);
    expect(secureStorage.setRefreshToken).toHaveBeenCalledTimes(1);
    expect(accessTokenStore.setAccessToken).toHaveBeenCalledTimes(1);
  });

  test('D. Refresh endpoint failure: rejects all callers consistently without clearing storage directly', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token-123');
    jest.spyOn(refreshTransport, 'post').mockRejectedValue(new Error('Refresh token revoked'));

    const p1 = refreshAccessToken();
    const p2 = refreshAccessToken();

    await expect(p1).rejects.toThrow('Refresh token revoked');
    await expect(p2).rejects.toThrow('Refresh token revoked');

    expect(accessTokenStore.clearAccessToken).not.toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).not.toHaveBeenCalled();
    expect(secureStorage.setRefreshToken).not.toHaveBeenCalled();
  });

  test('E. Keychain rotation write failure: clears tokens and rejects queued callers', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token-123');
    jest.spyOn(refreshTransport, 'post').mockResolvedValue({
      data: {
        success: true,
        data: mockRefreshResponse,
        timestamp: '2026-10-18T12:00:00Z',
      },
    });
    (secureStorage.setRefreshToken as jest.Mock).mockRejectedValue(new Error('Keychain hardware locked'));

    await expect(refreshAccessToken()).rejects.toThrow(
      'Không thể lưu trữ khóa phiên làm mới vào phần cứng an toàn'
    );

    // Rollback: clear access token and clear refresh token
    expect(accessTokenStore.clearAccessToken).toHaveBeenCalled();
    expect(secureStorage.clearRefreshToken).toHaveBeenCalled();
    expect(accessTokenStore.setAccessToken).not.toHaveBeenCalled();
  });

  test('F. Subsequent refresh after completion: lock resets and allows new execution', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh-token-123');
    jest.spyOn(refreshTransport, 'post').mockResolvedValue({
      data: {
        success: true,
        data: mockRefreshResponse,
        timestamp: '2026-10-18T12:00:00Z',
      },
    });
    (secureStorage.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

    const first = await refreshAccessToken();
    expect(first).toBe('rotated-access-token-jwt');

    const second = await refreshAccessToken();
    expect(second).toBe('rotated-access-token-jwt');

    expect(secureStorage.getRefreshToken).toHaveBeenCalledTimes(2);
  });

  test('G. STALE REFRESH RACE (Test A): Refresh starts -> invalidated by session replacement -> late refresh aborts without overwriting storage', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token-123');

    let resolveHttp: any;
    let postStarted: () => void = () => {};
    const postStartedPromise = new Promise<void>(resolve => {
      postStarted = resolve;
    });
    const pendingHttp = new Promise(resolve => {
      resolveHttp = resolve;
    });

    jest.spyOn(refreshTransport, 'post').mockImplementation((() => {
      postStarted();
      return pendingHttp;
    }) as any);

    // 1. Refresh flight starts in generation 1
    const refreshFlight = refreshAccessToken();

    // Ensure flight is awaiting network
    await postStartedPromise;

    // 2. User logs in, causing invalidateRefreshCoordinator() to increment generation
    invalidateRefreshCoordinator();
    expect(getRefreshGeneration()).toBe(2);

    // 3. Deferred HTTP transport completes after invalidation
    resolveHttp({
      data: {
        success: true,
        data: mockRefreshResponse,
        timestamp: '2026-10-18T12:00:00Z',
      },
    });

    // 4. Stale refresh flight must reject and MUST NOT commit rotated tokens
    await expect(refreshFlight).rejects.toThrow(
      'Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn'
    );

    expect(secureStorage.setRefreshToken).not.toHaveBeenCalled();
    expect(accessTokenStore.setAccessToken).not.toHaveBeenCalled();
  });

  test('H. STALE REFRESH RACE (Test B): Logout completes during Keychain write window -> post-write check aborts publishing access token', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token-123');

    jest.spyOn(refreshTransport, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: mockRefreshResponse,
        timestamp: '2026-10-18T12:00:00Z',
      },
    });

    // Simulate invalidation right during Keychain write
    (secureStorage.setRefreshToken as jest.Mock).mockImplementationOnce(async () => {
      invalidateRefreshCoordinator();
    });

    const refreshFlight = refreshAccessToken();

    await expect(refreshFlight).rejects.toThrow(
      'Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn'
    );

    // Access token must NOT be committed
    expect(accessTokenStore.setAccessToken).not.toHaveBeenCalled();
  });

  test('I. GENERATION COEXISTENCE (Test C): Generation A invalidated -> Generation B starts -> Flight A does not reset Flight B', async () => {
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token-123');

    let flightAPostStarted: () => void = () => {};
    const flightAPostStartedPromise = new Promise<void>(resolve => {
      flightAPostStarted = resolve;
    });

    let resolveFlightA: (val: any) => void = () => {};
    const pendingHttpA = new Promise(resolve => {
      resolveFlightA = resolve;
    });

    let resolveFlightB: (val: any) => void = () => {};
    const pendingHttpB = new Promise(resolve => {
      resolveFlightB = resolve;
    });

    let flightBPostStarted: () => void = () => {};
    const flightBPostStartedPromise = new Promise<void>(resolve => {
      flightBPostStarted = resolve;
    });

    let callCount = 0;
    jest.spyOn(refreshTransport, 'post').mockImplementation((() => {
      callCount += 1;
      if (callCount === 1) {
        flightAPostStarted();
        return pendingHttpA;
      }
      flightBPostStarted();
      return pendingHttpB;
    }) as any);
    (secureStorage.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

    // Flight A starts in Gen 1
    const flightA = refreshAccessToken();

    // Guarantee Flight A is actively awaiting HTTP
    await flightAPostStartedPromise;

    // Invalidation increments to Gen 2
    invalidateRefreshCoordinator();

    // Flight B starts in Gen 2
    const flightB = refreshAccessToken();

    // Guarantee Flight B is actively awaiting HTTP
    await flightBPostStartedPromise;

    // Flight A completes after invalidation
    resolveFlightA({
      data: {
        success: true,
        data: {
          accessToken: 'token-a-jwt',
          refreshToken: 'refresh-a-xyz',
          tokenType: 'Bearer',
          accessTokenExpiresIn: 900,
          refreshTokenExpiresIn: 604800,
        },
        timestamp: '2026-10-18T12:00:00Z',
      },
    });

    await expect(flightA).rejects.toThrow(
      'Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn'
    );

    // Flight B resolves successfully
    resolveFlightB({
      data: {
        success: true,
        data: {
          accessToken: 'token-b-jwt',
          refreshToken: 'refresh-b-xyz',
          tokenType: 'Bearer',
          accessTokenExpiresIn: 900,
          refreshTokenExpiresIn: 604800,
        },
        timestamp: '2026-10-18T12:00:00Z',
      },
    });

    const resultB = await flightB;
    expect(resultB).toBe('token-b-jwt');
    expect(accessTokenStore.setAccessToken).toHaveBeenCalledWith('token-b-jwt');
  });
});
