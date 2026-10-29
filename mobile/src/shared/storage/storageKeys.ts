/**
 * Centralized Storage Keys and Service Identifiers for WorkSphere Mobile
 */

/**
 * Service and Account identifiers for react-native-keychain (Secure Storage)
 */
export const SECURE_STORAGE_SERVICES = {
  REFRESH_TOKEN: 'worksphere.auth.refresh_token',
} as const;

export const SECURE_STORAGE_ACCOUNTS = {
  REFRESH_TOKEN: 'refresh_token_account',
} as const;

/**
 * Namespaced keys for @react-native-async-storage/async-storage (Local Storage)
 * Non-sensitive data ONLY.
 */
export const LOCAL_STORAGE_KEYS = {
  THEME_PREFERENCE: '@worksphere/theme_preference',
  ONBOARDING_COMPLETED: '@worksphere/onboarding_completed',
} as const;

export type LocalStorageKey =
  (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];
