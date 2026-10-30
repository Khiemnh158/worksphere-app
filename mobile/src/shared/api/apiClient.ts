import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getEnvironmentConfig } from '../config/environment';
import { accessTokenStore } from '../storage/accessTokenStore';
import { normalizeError } from './apiError';
import { isApiResponse, unwrapApiResponse } from './apiEnvelope';
import { getSessionCredentialGeneration } from '../../app/auth/sessionCredentialCoordinator';

export type UnauthorizedHandler = () => void | Promise<void>;
export type TokenRefreshHandler = () => Promise<string>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let tokenRefreshHandler: TokenRefreshHandler | null = null;

/**
 * Registers the global 401 Unauthorized callback with ownership protection.
 * Returns an unregister function that only clears the handler if it is still the active one.
 */
export function registerUnauthorizedHandler(
  handler: UnauthorizedHandler,
): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

/**
 * Registers the token refresh coordinator handler with ownership protection.
 * Returns an unregister function that only clears the handler if it is still the active one.
 */
export function registerTokenRefreshHandler(
  handler: TokenRefreshHandler,
): () => void {
  tokenRefreshHandler = handler;
  return () => {
    if (tokenRefreshHandler === handler) {
      tokenRefreshHandler = null;
    }
  };
}

/**
 * Injects or clears the global 401 Unauthorized callback.
 * Kept for backward compatibility.
 */
export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  unauthorizedHandler = handler;
}

/**
 * Injects or clears the token refresh coordinator handler.
 * Kept for backward compatibility.
 */
export function setTokenRefreshHandler(
  handler: TokenRefreshHandler | null,
): void {
  tokenRefreshHandler = handler;
}

/**
 * Triggers the registered unauthorized handler if present.
 * Safe against handler throwing errors.
 */
export async function notifyUnauthorized(): Promise<void> {
  if (unauthorizedHandler) {
    try {
      await unauthorizedHandler();
    } catch {
      // Handler failure must not crash transport flow
    }
  }
}

const NON_REFRESHABLE_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/logout',
  '/auth/logout-all',
  '/auth/activate',
];

function assertCurrentSession(config?: AxiosRequestConfig): void {
  if (
    config?._sessionGeneration !== undefined &&
    config._sessionGeneration !== getSessionCredentialGeneration()
  ) {
    throw {
      kind: 'UNKNOWN_ERROR',
      backendCode: 'STALE_SESSION',
      message: 'Phiên đã thay đổi. Vui lòng tải lại dữ liệu.',
    };
  }
}

/**
 * Checks if a failed 401 response is eligible for automatic token refresh and retry.
 */
function isEligibleForRefresh(error: any): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) {
    return false;
  }

  const config = error.config;
  if (!config) {
    return false;
  }

  // If already retried or explicitly instructed to skip auth refresh
  if (config._retry || config.skipAuthRefresh) {
    return false;
  }

  // Must have carried an Authorization Bearer header
  const authHeader =
    config.headers?.Authorization || config.headers?.get?.('Authorization');
  if (
    !authHeader ||
    typeof authHeader !== 'string' ||
    !authHeader.startsWith('Bearer ')
  ) {
    return false;
  }

  // Must not be an excluded authentication endpoint
  const url = config.url || '';
  if (NON_REFRESHABLE_ENDPOINTS.some(excluded => url.includes(excluded))) {
    return false;
  }

  // Response data must be a valid ApiResponse failure envelope with code 'UNAUTHORIZED'
  const responseData = error.response.data;
  if (
    !isApiResponse(responseData) ||
    responseData.success !== false ||
    responseData.code !== 'UNAUTHORIZED'
  ) {
    return false;
  }

  return true;
}

/**
 * Creates and configures the Axios transport client.
 */
function createApiClient(): AxiosInstance {
  const instance = axios.create({
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  // Request Interceptor: Injects Bearer token if present in in-memory store
  instance.interceptors.request.use(
    config => {
      // Dynamically resolve base URL and timeout from environment config
      const env = getEnvironmentConfig();
      if (!config.baseURL) {
        config.baseURL = env.apiBaseUrl;
      }
      if (!config.timeout) {
        config.timeout = env.requestTimeoutMs;
      }

      const token = accessTokenStore.getAccessToken();
      assertCurrentSession(config);
      if (
        token &&
        !NON_REFRESHABLE_ENDPOINTS.some(ep => config.url?.includes(ep))
      ) {
        config._sessionGeneration ??= getSessionCredentialGeneration();
        config.headers.set('Authorization', `Bearer ${token}`);
      } else if (token && config.url?.includes('/auth/logout')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }

      return config;
    },
    error => Promise.reject(normalizeError(error)),
  );

  // Response Interceptor: Intercepts 401, attempts single-flight refresh and retries once
  instance.interceptors.response.use(
    response => {
      assertCurrentSession(response.config);
      return response;
    },
    async error => {
      assertCurrentSession(error.config);
      if (isEligibleForRefresh(error) && tokenRefreshHandler) {
        const originalConfig = error.config;
        originalConfig._retry = true;

        try {
          const newAccessToken = await tokenRefreshHandler();
          assertCurrentSession(originalConfig);
          if (originalConfig.headers) {
            if (typeof originalConfig.headers.set === 'function') {
              originalConfig.headers.set(
                'Authorization',
                `Bearer ${newAccessToken}`,
              );
            } else {
              originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
            }
          }
          return await instance.request(originalConfig);
        } catch (refreshOrRetryError) {
          // Refresh failed or retry failed with 401: trigger session invalidation once
          assertCurrentSession(originalConfig);
          if (normalizeError(refreshOrRetryError).kind === 'UNAUTHORIZED') {
            await notifyUnauthorized();
          }
          return Promise.reject(normalizeError(refreshOrRetryError));
        }
      }

      // If 401 was received and either not eligible for refresh or retry 401 failed
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // If it was already a retried request or a protected request with no refresh handler
        const config = error.config;
        const url = config?.url;
        const isAuthEndpoint = url
          ? NON_REFRESHABLE_ENDPOINTS.some(ep => url.includes(ep))
          : false;
        if (!isAuthEndpoint && (config?._retry || !tokenRefreshHandler)) {
          await notifyUnauthorized();
        }
      }

      return Promise.reject(normalizeError(error));
    },
  );

  return instance;
}

export const apiClient: AxiosInstance = createApiClient();

/**
 * Typed HTTP Request Helpers with Automatic ApiResponse Envelope Unwrapping
 */
export const http = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T | null> {
    const response: AxiosResponse<unknown> = await apiClient.get(url, config);
    if (isApiResponse(response.data)) {
      return unwrapApiResponse<T>(response.data as any);
    }
    return response.data as T;
  },

  async post<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig,
  ): Promise<TResponse | null> {
    const response: AxiosResponse<unknown> = await apiClient.post(
      url,
      data,
      config,
    );
    if (isApiResponse(response.data)) {
      return unwrapApiResponse<TResponse>(response.data as any);
    }
    return response.data as TResponse;
  },

  async put<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig,
  ): Promise<TResponse | null> {
    const response: AxiosResponse<unknown> = await apiClient.put(
      url,
      data,
      config,
    );
    if (isApiResponse(response.data)) {
      return unwrapApiResponse<TResponse>(response.data as any);
    }
    return response.data as TResponse;
  },

  async delete<TResponse>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<TResponse | null> {
    const response: AxiosResponse<unknown> = await apiClient.delete(
      url,
      config,
    );
    if (isApiResponse(response.data)) {
      return unwrapApiResponse<TResponse>(response.data as any);
    }
    return response.data as TResponse;
  },
};
