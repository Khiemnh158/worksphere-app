import * as Keychain from 'react-native-keychain';
import { SECURE_STORAGE_SERVICES, SECURE_STORAGE_ACCOUNTS } from './storageKeys';

/**
 * Secure Storage Foundation for WorkSphere Mobile
 * Powered by react-native-keychain.
 *
 * Strict boundary:
 * - Dedicated solely to sensitive token persistence (Refresh Token).
 * - Never store Access Tokens, passwords, user profiles, or configuration URLs.
 * - Zero token logging.
 */
export const secureStorage = {
  /**
   * Retrieves the persisted refresh token.
   * Returns null if no token is stored or if credentials cannot be accessed.
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SECURE_STORAGE_SERVICES.REFRESH_TOKEN,
      });

      if (credentials && credentials.password) {
        return credentials.password;
      }
      return null;
    } catch {
      // Return null safely if Keychain read fails or device is locked
      return null;
    }
  },

  /**
   * Persists the refresh token securely in hardware-backed keystore/keychain.
   * Rejects empty or whitespace-only strings.
   */
  async setRefreshToken(token: string): Promise<void> {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('SecureStorage error: Refresh token must be a non-empty string');
    }

    try {
      await Keychain.setGenericPassword(
        SECURE_STORAGE_ACCOUNTS.REFRESH_TOKEN,
        token.trim(),
        {
          service: SECURE_STORAGE_SERVICES.REFRESH_TOKEN,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Keychain error';
      throw new Error(`SecureStorage write failure: ${message}`);
    }
  },

  /**
   * Removes the refresh token from secure storage.
   * Idempotent operation: does not fail if no credentials exist.
   */
  async clearRefreshToken(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({
        service: SECURE_STORAGE_SERVICES.REFRESH_TOKEN,
      });
    } catch {
      // Idempotent: swallow errors during cleanup
    }
  },
};
