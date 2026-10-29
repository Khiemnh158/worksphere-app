import * as Keychain from 'react-native-keychain';
import { secureStorage } from '../../src/shared/storage/secureStorage';
import { SECURE_STORAGE_SERVICES, SECURE_STORAGE_ACCOUNTS } from '../../src/shared/storage/storageKeys';

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
  },
}));

describe('SecureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('setRefreshToken persists token under dedicated service identifier', async () => {
    (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true);

    await secureStorage.setRefreshToken('secure-refresh-token-123');

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      SECURE_STORAGE_ACCOUNTS.REFRESH_TOKEN,
      'secure-refresh-token-123',
      {
        service: SECURE_STORAGE_SERVICES.REFRESH_TOKEN,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      }
    );
  });

  test('setRefreshToken rejects empty or whitespace-only token', async () => {
    await expect(secureStorage.setRefreshToken('')).rejects.toThrow(
      /Refresh token must be a non-empty string/
    );
    await expect(secureStorage.setRefreshToken('   ')).rejects.toThrow(
      /Refresh token must be a non-empty string/
    );
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
  });

  test('getRefreshToken returns token string when credentials exist', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
      username: SECURE_STORAGE_ACCOUNTS.REFRESH_TOKEN,
      password: 'stored-refresh-token-xyz',
      service: SECURE_STORAGE_SERVICES.REFRESH_TOKEN,
    });

    const token = await secureStorage.getRefreshToken();
    expect(token).toBe('stored-refresh-token-xyz');
    expect(Keychain.getGenericPassword).toHaveBeenCalledWith({
      service: SECURE_STORAGE_SERVICES.REFRESH_TOKEN,
    });
  });

  test('getRefreshToken returns null when no credentials stored', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

    const token = await secureStorage.getRefreshToken();
    expect(token).toBeNull();
  });

  test('getRefreshToken returns null safely if Keychain read throws', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValue(new Error('Keystore locked'));

    const token = await secureStorage.getRefreshToken();
    expect(token).toBeNull();
  });

  test('clearRefreshToken resets credentials under dedicated service identifier', async () => {
    (Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(true);

    await secureStorage.clearRefreshToken();
    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: SECURE_STORAGE_SERVICES.REFRESH_TOKEN,
    });
  });

  test('clearRefreshToken is idempotent and does not throw on error', async () => {
    (Keychain.resetGenericPassword as jest.Mock).mockRejectedValue(new Error('Reset failed'));

    await expect(secureStorage.clearRefreshToken()).resolves.toBeUndefined();
  });
});
