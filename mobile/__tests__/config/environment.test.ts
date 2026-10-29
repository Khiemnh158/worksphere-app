import {
  getEnvironmentConfig,
  setEnvironmentConfig,
  resetEnvironmentConfig,
  normalizeApiBaseUrl,
  CANONICAL_EMULATOR_DEV_BASE_URL,
} from '../../src/shared/config/environment';
import * as nativeEnv from '../../src/shared/config/nativeEnvironment';
import { apiClient } from '../../src/shared/api/apiClient';
import axios, { InternalAxiosRequestConfig } from 'axios';

describe('Environment Configuration', () => {
  const originalDev = (globalThis as any).__DEV__;

  afterEach(() => {
    resetEnvironmentConfig();
    (globalThis as any).__DEV__ = originalDev;
    jest.restoreAllMocks();
  });

  test('resolves canonical emulator dev base URL by default in development', () => {
    (globalThis as any).__DEV__ = true;
    jest.spyOn(nativeEnv, 'getNativeEnvironmentConstants').mockReturnValue({});

    const config = getEnvironmentConfig();
    expect(config.apiBaseUrl).toBe(CANONICAL_EMULATOR_DEV_BASE_URL);
    expect(config.isProduction).toBe(false);
    expect(config.requestTimeoutMs).toBe(15000);
  });

  test('resolves explicit native debug override when provided in development', () => {
    (globalThis as any).__DEV__ = true;
    jest.spyOn(nativeEnv, 'getNativeEnvironmentConstants').mockReturnValue({
      API_BASE_URL: 'http://192.168.1.100:8080',
    });

    const config = getEnvironmentConfig();
    expect(config.apiBaseUrl).toBe('http://192.168.1.100:8080/api/v1');
    expect(config.isProduction).toBe(false);
  });

  test('accepts native release URL when HTTPS in production mode', () => {
    (globalThis as any).__DEV__ = false;
    jest.spyOn(nativeEnv, 'getNativeEnvironmentConstants').mockReturnValue({
      API_BASE_URL: 'https://api.worksphere.internal',
    });

    const config = getEnvironmentConfig();
    expect(config.apiBaseUrl).toBe('https://api.worksphere.internal/api/v1');
    expect(config.isProduction).toBe(true);
  });

  test('rejects native release URL with cleartext HTTP in production mode', () => {
    (globalThis as any).__DEV__ = false;
    jest.spyOn(nativeEnv, 'getNativeEnvironmentConstants').mockReturnValue({
      API_BASE_URL: 'http://insecure.worksphere.internal',
    });

    expect(() => getEnvironmentConfig()).toThrow(
      /Security violation: Production API Base URL must use HTTPS/
    );
  });

  test('rejects missing native configuration in production mode', () => {
    (globalThis as any).__DEV__ = false;
    jest.spyOn(nativeEnv, 'getNativeEnvironmentConstants').mockReturnValue({});

    expect(() => getEnvironmentConfig()).toThrow(
      /Production Environment Configuration missing/
    );
  });

  test('normalizes trailing slashes and ensures single /api/v1 suffix', () => {
    expect(normalizeApiBaseUrl('http://localhost:8080/')).toBe('http://localhost:8080/api/v1');
    expect(normalizeApiBaseUrl('http://localhost:8080/api/v1/')).toBe('http://localhost:8080/api/v1');
    expect(normalizeApiBaseUrl('http://localhost:8080///')).toBe('http://localhost:8080/api/v1');
    expect(normalizeApiBaseUrl('http://localhost:8080///api/v1///')).toBe('http://localhost:8080/api/v1');
    expect(normalizeApiBaseUrl('https://api.worksphere.vn/api/v1', true)).toBe('https://api.worksphere.vn/api/v1');
  });

  test('rejects malformed URLs without valid protocol', () => {
    expect(() => normalizeApiBaseUrl('localhost:8080')).toThrow(/Malformed API Base URL/);
    expect(() => normalizeApiBaseUrl('ftp://example.com')).toThrow(/Malformed API Base URL/);
    expect(() => normalizeApiBaseUrl('')).toThrow(/non-empty string/);
  });

  test('strictly rejects HTTP protocol in production normalization', () => {
    expect(() => normalizeApiBaseUrl('http://insecure.worksphere.vn', true)).toThrow(
      /Security violation: Production API Base URL must use HTTPS/
    );
  });

  test('supports runtime injection for tests and restores state on reset', () => {
    setEnvironmentConfig({
      apiBaseUrl: 'https://test-server.worksphere.internal/',
      isProduction: true,
      requestTimeoutMs: 5000,
    });

    const active = getEnvironmentConfig();
    expect(active.apiBaseUrl).toBe('https://test-server.worksphere.internal/api/v1');
    expect(active.isProduction).toBe(true);
    expect(active.requestTimeoutMs).toBe(5000);

    resetEnvironmentConfig();
    const restored = getEnvironmentConfig();
    expect(restored.apiBaseUrl).toBe(CANONICAL_EMULATOR_DEV_BASE_URL);
  });

  test('prevents runtime downgrade from production to non-production', () => {
    setEnvironmentConfig({
      apiBaseUrl: 'https://api.worksphere.internal',
      isProduction: true,
      requestTimeoutMs: 15000,
    });

    expect(() => {
      setEnvironmentConfig({
        apiBaseUrl: 'http://localhost:8080',
        isProduction: false,
        requestTimeoutMs: 15000,
      });
    }).toThrow(
      /Security violation: Cannot downgrade environment configuration to non-production at runtime/
    );
  });

  test('apiClient dynamic request interceptor picks the latest resolved URL', async () => {
    setEnvironmentConfig({
      apiBaseUrl: 'https://custom-target.worksphere.internal',
      isProduction: true,
      requestTimeoutMs: 8000,
    });

    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const config = {
      headers: new axios.AxiosHeaders(),
    } as InternalAxiosRequestConfig;

    const result = await requestInterceptor(config);
    expect(result.baseURL).toBe('https://custom-target.worksphere.internal/api/v1');
    expect(result.timeout).toBe(8000);
  });
});
