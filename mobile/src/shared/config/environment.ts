/**
 * Environment Configuration Foundation for WorkSphere Mobile
 *
 * Rules:
 * - In Development (__DEV__): defaults to Android emulator local backend (http://10.0.2.2:18120/api/v1).
 * - In Production: HTTPS is strictly required. No fallback domain is invented.
 * - Base URL is normalized: trailing slashes stripped, /api/v1 guaranteed exactly once.
 * - Runtime injectable for unit and integration testing.
 */

import { getNativeEnvironmentConstants } from './nativeEnvironment';

declare const process: { env?: Record<string, string | undefined> } | undefined;

export interface EnvironmentConfig {
  apiBaseUrl: string;
  isProduction: boolean;
  requestTimeoutMs: number;
}

export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
export const CANONICAL_EMULATOR_DEV_BASE_URL = 'http://10.0.2.2:18120/api/v1';

let activeConfigOverride: EnvironmentConfig | null = null;

/**
 * Normalizes an API base URL:
 * - Strips trailing whitespace and slashes.
 * - Ensures valid URL format.
 * - Validates HTTPS policy for production environments.
 * - Ensures path ends with '/api/v1' exactly once.
 */
export function normalizeApiBaseUrl(
  rawUrl: string,
  isProduction: boolean = false,
): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('API Base URL must be a non-empty string');
  }

  const trimmed = rawUrl.trim();

  // Basic protocol validation
  const lower = trimmed.toLowerCase();
  const isHttps = lower.startsWith('https://');
  const isHttp = lower.startsWith('http://');

  if (!isHttps && !isHttp) {
    throw new Error(
      `Malformed API Base URL: Must begin with http:// or https://: "${trimmed}"`,
    );
  }

  if (isProduction && !isHttps) {
    throw new Error(
      `Security violation: Production API Base URL must use HTTPS: "${trimmed}"`,
    );
  }

  // Remove duplicate slashes in the path portion while preserving protocol
  const protocolIndex = trimmed.indexOf('://');
  const protocol = trimmed.slice(0, protocolIndex + 3);
  const rest = trimmed.slice(protocolIndex + 3);
  const pathCleaned = rest.replace(/\/+/g, '/').replace(/\/+$/, '');

  let sanitized = `${protocol}${pathCleaned}`;

  // Ensure /api/v1 suffix appears exactly once
  const apiV1Regex = /\/api\/v1$/i;
  if (!apiV1Regex.test(sanitized)) {
    sanitized = `${sanitized}/api/v1`;
  }

  return sanitized;
}

/**
 * Resolves current environment configuration.
 * - Checks active test/runtime override first.
 * - In Development (__DEV__): uses native build URL if set, otherwise defaults to canonical emulator URL.
 * - In Production: requires native build-time HTTPS URL. Throws error if missing or non-HTTPS.
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  if (activeConfigOverride) {
    return activeConfigOverride;
  }

  const isDev =
    typeof __DEV__ !== 'undefined'
      ? Boolean(__DEV__)
      : typeof process !== 'undefined' &&
        process?.env?.NODE_ENV !== 'production';

  const nativeConstants = getNativeEnvironmentConstants();
  const nativeUrl = nativeConstants.API_BASE_URL?.trim();

  if (isDev) {
    const devUrl =
      nativeUrl && nativeUrl.length > 0
        ? normalizeApiBaseUrl(nativeUrl, false)
        : CANONICAL_EMULATOR_DEV_BASE_URL;

    return {
      apiBaseUrl: devUrl,
      isProduction: false,
      requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    };
  }

  // In production, native build-time URL is required
  if (nativeUrl && nativeUrl.length > 0) {
    const prodUrl = normalizeApiBaseUrl(nativeUrl, true);
    return {
      apiBaseUrl: prodUrl,
      isProduction: true,
      requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    };
  }

  // In production without native URL and without runtime override: fail safely
  throw new Error(
    'Production Environment Configuration missing: Explicit HTTPS API Base URL must be configured at native build time.',
  );
}

/**
 * Sets an explicit environment configuration (used in tests or dynamic app bootstrap).
 * Enforces that production environments cannot be downgraded to non-production at runtime.
 */
export function setEnvironmentConfig(config: EnvironmentConfig): void {
  const currentIsDev =
    typeof __DEV__ !== 'undefined'
      ? Boolean(__DEV__)
      : typeof process !== 'undefined' &&
        process?.env?.NODE_ENV !== 'production';

  if (
    (!currentIsDev || activeConfigOverride?.isProduction) &&
    !config.isProduction
  ) {
    throw new Error(
      'Security violation: Cannot downgrade environment configuration to non-production at runtime in a production build.',
    );
  }

  const normalizedUrl = normalizeApiBaseUrl(
    config.apiBaseUrl,
    config.isProduction,
  );
  activeConfigOverride = {
    ...config,
    apiBaseUrl: normalizedUrl,
  };
}

/**
 * Resets environment configuration to initial state (for test cleanup).
 */
export function resetEnvironmentConfig(): void {
  activeConfigOverride = null;
}
