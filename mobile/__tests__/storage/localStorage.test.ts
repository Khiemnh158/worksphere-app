import AsyncStorage from '@react-native-async-storage/async-storage';
import { localStorage } from '../../src/shared/storage/localStorage';
import { LOCAL_STORAGE_KEYS, LocalStorageKey } from '../../src/shared/storage/storageKeys';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('LocalStorage Hardening with Strict Key Policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // A. Theme preference key set/get/remove
  test('A. manages theme preference key set, get, and remove', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('system');

    await localStorage.setString(LOCAL_STORAGE_KEYS.THEME_PREFERENCE, 'system');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(LOCAL_STORAGE_KEYS.THEME_PREFERENCE, 'system');

    const result = await localStorage.getString(LOCAL_STORAGE_KEYS.THEME_PREFERENCE);
    expect(result).toBe('system');

    await localStorage.remove(LOCAL_STORAGE_KEYS.THEME_PREFERENCE);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(LOCAL_STORAGE_KEYS.THEME_PREFERENCE);
  });

  // B. Onboarding key set/get/remove
  test('B. manages onboarding completed key set, get, and remove', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

    await localStorage.setString(LOCAL_STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(LOCAL_STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');

    const result = await localStorage.getString(LOCAL_STORAGE_KEYS.ONBOARDING_COMPLETED);
    expect(result).toBe('true');

    await localStorage.remove(LOCAL_STORAGE_KEYS.ONBOARDING_COMPLETED);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(LOCAL_STORAGE_KEYS.ONBOARDING_COMPLETED);
  });

  // C. Runtime rejection of arbitrary keys
  test('C. strictly rejects non-allowlisted arbitrary keys at runtime', async () => {
    const unallowedKeys = [
      '@worksphere/jwt',
      '@worksphere/session',
      '@worksphere/credentials',
      '@worksphere/authorPreference',
      '@worksphere/custom',
    ];

    for (const key of unallowedKeys) {
      // Cast to LocalStorageKey simulating untyped JS caller
      const invalidKey = key as unknown as LocalStorageKey;

      await expect(localStorage.getString(invalidKey)).rejects.toThrow(
        'LocalStorage security violation: Key is not allowlisted.'
      );
      await expect(localStorage.setString(invalidKey, 'val')).rejects.toThrow(
        'LocalStorage security violation: Key is not allowlisted.'
      );
      await expect(localStorage.remove(invalidKey)).rejects.toThrow(
        'LocalStorage security violation: Key is not allowlisted.'
      );
      await expect(localStorage.getJson(invalidKey, v => v)).rejects.toThrow(
        'LocalStorage security violation: Key is not allowlisted.'
      );
    }
  });

  // D. Demonstrates old false-positive elimination
  test('D. rejects authorPreference solely because it is not allowlisted, without substring false-positives', async () => {
    const authorPrefKey = '@worksphere/authorPreference' as unknown as LocalStorageKey;

    await expect(localStorage.getString(authorPrefKey)).rejects.toThrow(
      'LocalStorage security violation: Key is not allowlisted.'
    );
    // Does not leak key or mention obsolete "auth" substring rule
    try {
      await localStorage.getString(authorPrefKey);
    } catch (err: any) {
      expect(err.message).toBe('LocalStorage security violation: Key is not allowlisted.');
      expect(err.message).not.toContain('authorPreference');
      expect(err.message).not.toContain('auth');
    }
  });

  // E. Missing item -> null
  test('E. returns null when item does not exist in storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const stringResult = await localStorage.getString(LOCAL_STORAGE_KEYS.THEME_PREFERENCE);
    expect(stringResult).toBeNull();

    const jsonResult = await localStorage.getJson(
      LOCAL_STORAGE_KEYS.THEME_PREFERENCE,
      val => val
    );
    expect(jsonResult).toBeNull();
  });

  // F. Malformed JSON -> returns null
  test('F. returns null safely when stored data contains malformed JSON', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{malformed-json');

    const result = await localStorage.getJson(
      LOCAL_STORAGE_KEYS.THEME_PREFERENCE,
      val => val
    );
    expect(result).toBeNull();
  });

  // G. Valid JSON + parser
  test('G. parses valid JSON using an explicit parser function', async () => {
    interface ThemeConfig {
      mode: 'light' | 'dark';
      highContrast: boolean;
    }

    const payload: ThemeConfig = { mode: 'dark', highContrast: true };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(payload));

    const parseThemeConfig = (raw: unknown): ThemeConfig => {
      if (typeof raw !== 'object' || raw === null) {
        throw new Error('Not an object');
      }
      const c = raw as Record<string, unknown>;
      if (c.mode !== 'light' && c.mode !== 'dark') {
        throw new Error('Invalid mode');
      }
      return {
        mode: c.mode,
        highContrast: Boolean(c.highContrast),
      };
    };

    const result = await localStorage.getJson(
      LOCAL_STORAGE_KEYS.THEME_PREFERENCE,
      parseThemeConfig
    );
    expect(result).toEqual(payload);
  });

  // H. Parser rejects invalid shape -> returns null
  test('H. returns null when parser throws due to invalid schema/shape', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ mode: 'invalid-mode' }));

    const strictParser = (raw: unknown) => {
      const c = raw as Record<string, unknown>;
      if (c.mode !== 'light' && c.mode !== 'dark') {
        throw new Error('Schema validation failed');
      }
      return c;
    };

    const result = await localStorage.getJson(
      LOCAL_STORAGE_KEYS.THEME_PREFERENCE,
      strictParser
    );
    expect(result).toBeNull();
  });

  test('setJson serializes value to JSON and persists to AsyncStorage', async () => {
    await localStorage.setJson(LOCAL_STORAGE_KEYS.THEME_PREFERENCE, { theme: 'dark' });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      LOCAL_STORAGE_KEYS.THEME_PREFERENCE,
      JSON.stringify({ theme: 'dark' })
    );
  });
});
