import {
  getSessionCredentialGeneration,
  invalidateSessionCredentials,
  commitLoginCredentials,
  commitRefreshedCredentials,
  clearSessionCredentials,
  clearAccessTokenForBootstrap,
  resetSessionCredentialCoordinatorForTests,
} from '../../src/app/auth/sessionCredentialCoordinator';
import { secureStorage } from '../../src/shared/storage/secureStorage';
import { accessTokenStore } from '../../src/shared/storage/accessTokenStore';

// In-memory mock storage state to verify final values
let mockKeychainToken: string | null = null;
let mockMemoryAccessToken: string | null = null;

jest.mock('../../src/shared/storage/secureStorage', () => ({
  secureStorage: {
    getRefreshToken: jest.fn(async () => mockKeychainToken),
    setRefreshToken: jest.fn(async (token: string) => {
      mockKeychainToken = token;
    }),
    clearRefreshToken: jest.fn(async () => {
      mockKeychainToken = null;
    }),
  },
}));

jest.mock('../../src/shared/storage/accessTokenStore', () => ({
  accessTokenStore: {
    getAccessToken: jest.fn(() => mockMemoryAccessToken),
    setAccessToken: jest.fn((token: string | null) => {
      mockMemoryAccessToken = token;
    }),
    clearAccessToken: jest.fn(() => {
      mockMemoryAccessToken = null;
    }),
  },
}));

describe('sessionCredentialCoordinator', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockKeychainToken = null;
    mockMemoryAccessToken = null;
    await resetSessionCredentialCoordinatorForTests();
  });

  test('1. DETERMINISTIC LOGIN-WINS TEST: Delayed refresh A loses to login B, final state is B', async () => {
    // Initial generation is 1
    const genRefreshA = getSessionCredentialGeneration();
    expect(genRefreshA).toBe(1);

    // Gate to hold refresh commit inside the queue
    let releaseRefreshA: () => void = () => {};
    const refreshGatePromise = new Promise<void>(resolve => {
      releaseRefreshA = resolve;
    });

    // Mock secureStorage.setRefreshToken to pause when called with token-a
    (secureStorage.setRefreshToken as jest.Mock).mockImplementation(async (token: string) => {
      if (token === 'refresh-token-a') {
        await refreshGatePromise;
      }
      mockKeychainToken = token;
    });

    // 1. Refresh A begins commit in Gen 1
    const refreshPromise = commitRefreshedCredentials(genRefreshA, 'refresh-token-a', 'access-token-a');

    // 2. User logs in: invalidates generation and increments to Gen 2
    const genLoginB = invalidateSessionCredentials();
    expect(genLoginB).toBe(2);

    // 3. Login B commits credentials in Gen 2
    // Because refresh A is currently waiting at the Keychain write gate inside the queue,
    // Login B enters the serialized queue behind it.
    const loginPromise = commitLoginCredentials(genLoginB, 'refresh-token-b', 'access-token-b');

    // 4. Release refresh A's gate
    releaseRefreshA();

    // 5. Refresh A detects that generation is stale after Keychain write (or pre-commit) and rejects
    await expect(refreshPromise).rejects.toThrow(
      'Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn'
    );

    // 6. Login B completes successfully
    await loginPromise;

    // 7. Verify final states: Winner is login B!
    expect(mockKeychainToken).toBe('refresh-token-b');
    expect(mockMemoryAccessToken).toBe('access-token-b');
    expect(secureStorage.getRefreshToken).toBeDefined();
    expect(accessTokenStore.getAccessToken()).toBe('access-token-b');
  });

  test('2. DETERMINISTIC LOGOUT-WINS TEST: Delayed refresh A loses to logout, final state is null', async () => {
    const genRefreshA = getSessionCredentialGeneration();

    let releaseRefreshA: () => void = () => {};
    const refreshGatePromise = new Promise<void>(resolve => {
      releaseRefreshA = resolve;
    });

    (secureStorage.setRefreshToken as jest.Mock).mockImplementation(async (token: string) => {
      if (token === 'refresh-token-a') {
        await refreshGatePromise;
      }
      mockKeychainToken = token;
    });

    // 1. Refresh A starts in Gen 1
    const refreshPromise = commitRefreshedCredentials(genRefreshA, 'refresh-token-a', 'access-token-a');

    // 2. Logout invalidates generation
    invalidateSessionCredentials();

    // 3. Logout clear is enqueued
    const logoutPromise = clearSessionCredentials();

    // 4. Release refresh A
    releaseRefreshA();

    // 5. Refresh A must reject as stale
    await expect(refreshPromise).rejects.toThrow(
      'Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn'
    );

    // 6. Logout clear completes
    await logoutPromise;

    // 7. Final Keychain and memory storage must be null
    expect(mockKeychainToken).toBeNull();
    expect(mockMemoryAccessToken).toBeNull();
  });

  test('3. FAILURE RECOVERY TEST: A throws -> queue remains usable -> B succeeds', async () => {
    const currentGen = getSessionCredentialGeneration();

    // Make Keychain throw on first write
    (secureStorage.setRefreshToken as jest.Mock).mockRejectedValueOnce(
      new Error('Keychain hardware locked')
    );

    // Transaction A fails
    await expect(
      commitLoginCredentials(currentGen, 'refresh-fail', 'access-fail')
    ).rejects.toThrow('Keychain hardware locked');

    // Storage is clean after failure
    expect(mockMemoryAccessToken).toBeNull();

    // Transaction B succeeds immediately afterwards through the same queue
    await commitLoginCredentials(currentGen, 'refresh-success', 'access-success');

    expect(mockKeychainToken).toBe('refresh-success');
    expect(mockMemoryAccessToken).toBe('access-success');
  });

  test('4. BOOTSTRAP CLEANUP TEST: clears memory access token while preserving Keychain refresh token', async () => {
    mockKeychainToken = 'persisted-refresh-token';
    mockMemoryAccessToken = 'stale-access-token';

    const currentGen = getSessionCredentialGeneration();

    // Enqueue clearAccessTokenForBootstrap
    await clearAccessTokenForBootstrap(currentGen);

    // In-memory access token cleared
    expect(mockMemoryAccessToken).toBeNull();
    // Keychain refresh token retained intact
    expect(mockKeychainToken).toBe('persisted-refresh-token');
  });
});
