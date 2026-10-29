import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_STORAGE_KEYS, LocalStorageKey } from './storageKeys';

/**
 * Local Storage Foundation for WorkSphere Mobile
 * Powered by @react-native-async-storage/async-storage
 *
 * Strict policy:
 * - Non-sensitive data ONLY (e.g., UI preferences, theme mode, flags).
 * - Strict allowlist: Only keys defined in LOCAL_STORAGE_KEYS are permitted.
 * - Substring blacklists are eliminated to avoid false positives and false negatives.
 * - JSON parse requires explicit parser callback (no unchecked type casts).
 */

const ALLOWED_LOCAL_STORAGE_KEYS = new Set<string>(Object.values(LOCAL_STORAGE_KEYS));

function assertAllowedKey(key: string): asserts key is LocalStorageKey {
  if (!ALLOWED_LOCAL_STORAGE_KEYS.has(key)) {
    throw new Error('LocalStorage security violation: Key is not allowlisted.');
  }
}

export const localStorage = {
  async getString(key: LocalStorageKey): Promise<string | null> {
    assertAllowedKey(key);
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setString(key: LocalStorageKey, value: string): Promise<void> {
    assertAllowedKey(key);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown storage error';
      throw new Error(`LocalStorage setItem failure: ${message}`);
    }
  },

  async remove(key: LocalStorageKey): Promise<void> {
    assertAllowedKey(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Idempotent
    }
  },

  /**
   * Retrieves and safely parses JSON from AsyncStorage using an explicit parser.
   * If value is missing, JSON parse fails, or parser rejects/throws, returns null.
   */
  async getJson<T>(
    key: LocalStorageKey,
    parser: (value: unknown) => T
  ): Promise<T | null> {
    assertAllowedKey(key);
    const raw = await this.getString(key);
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return parser(parsed);
    } catch {
      return null;
    }
  },

  async setJson<T>(key: LocalStorageKey, value: T): Promise<void> {
    assertAllowedKey(key);
    const serialized = JSON.stringify(value);
    await this.setString(key, serialized);
  },
};
