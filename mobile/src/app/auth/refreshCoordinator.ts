import axios, { AxiosInstance } from 'axios';
import { getEnvironmentConfig } from '../../shared/config/environment';
import { isApiResponse, unwrapApiResponse } from '../../shared/api/apiEnvelope';
import { isRefreshResponse, RefreshResponse, RefreshTokenRequest } from '../../features/auth/api/authTypes';
import { secureStorage } from '../../shared/storage/secureStorage';

/**
 * Module-private dedicated refresh HTTP transport client.
 * Isolated from apiClient:
 * - NO Authorization Bearer token header attached
 * - NO 401 refresh interceptor (cannot recurse into itself)
 * - NO global unauthorized callback invocation
 * - Fixed 15,000ms timeout or environment timeout
 * - Pure JSON Accept & Content-Type
 * - Never logs requests, responses, or tokens
 */
function createRefreshTransport(): AxiosInstance {
  const instance = axios.create({
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(config => {
    const env = getEnvironmentConfig();
    if (!config.baseURL) {
      config.baseURL = env.apiBaseUrl;
    }
    if (!config.timeout) {
      config.timeout = env.requestTimeoutMs;
    }
    return config;
  });

  return instance;
}

export const refreshTransport: AxiosInstance = createRefreshTransport();

/**
 * Dedicated raw transport call to POST /auth/refresh.
 * Unwraps ApiResponse<RefreshResponse> and validates payload.
 */
export async function executeRefreshCall(refreshToken: string): Promise<RefreshResponse> {
  const requestPayload: RefreshTokenRequest = { refreshToken };
  const response = await refreshTransport.post('/auth/refresh', requestPayload);

  let data = response.data;
  if (isApiResponse(data)) {
    data = unwrapApiResponse<RefreshResponse>(data as any);
  }

  if (!isRefreshResponse(data)) {
    throw new Error('Dữ liệu làm mới phiên máy chủ trả về không hợp lệ');
  }

  return data;
}

import {
  getSessionCredentialGeneration,
  commitRefreshedCredentials,
  invalidateSessionCredentials,
} from './sessionCredentialCoordinator';

// Re-export generation and invalidation helpers so existing callers remain valid
export const getRefreshGeneration = getSessionCredentialGeneration;
export const invalidateRefreshCoordinator = invalidateSessionCredentials;

/**
 * Module-private shared promise for single-flight concurrency.
 * All concurrent 401 requests share this exact promise.
 */
let refreshPromise: Promise<string> | null = null;
let activeFlightGeneration = 0;

/**
 * Coordinates single-flight access token refresh with generation-based staleness protection.
 *
 * Flow:
 * 1. Captures current credential generation.
 * 2. If a valid refreshPromise is already in-flight for this generation, returns it directly.
 * 3. Reads existing refreshToken from Keychain (secureStorage).
 * 4. Calls dedicated refresh transport.
 * 5. Before enqueuing credential commit: verifies generation is still current.
 * 6. Commits rotated tokens through serialized sessionCredentialCoordinator.
 * 7. Resets refreshPromise in finally block ONLY IF it still belongs to this flight.
 */
export async function refreshAccessToken(expectedGeneration?: number): Promise<string> {
  const flightGeneration = expectedGeneration ?? getSessionCredentialGeneration();

  if (refreshPromise && activeFlightGeneration === flightGeneration) {
    return refreshPromise;
  }

  activeFlightGeneration = flightGeneration;
  const currentFlightPromise = (async () => {
    const currentRefreshToken = await secureStorage.getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('Không tìm thấy phiên đăng nhập trong bộ lưu trữ an toàn');
    }

    // Verify generation before making network call
    if (getSessionCredentialGeneration() !== flightGeneration) {
      throw new Error('Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn');
    }

    const response: RefreshResponse = await executeRefreshCall(currentRefreshToken);

    // Pre-queue generation check
    if (getSessionCredentialGeneration() !== flightGeneration) {
      throw new Error('Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn');
    }

    // Serialized credential commit through sessionCredentialCoordinator
    try {
      await commitRefreshedCredentials(flightGeneration, response.refreshToken, response.accessToken);
    } catch (commitError) {
      if (
        commitError instanceof Error &&
        commitError.message === 'Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn'
      ) {
        throw commitError;
      }
      throw new Error('Không thể lưu trữ khóa phiên làm mới vào phần cứng an toàn');
    }

    return response.accessToken;
  })();

  refreshPromise = currentFlightPromise;

  try {
    return await currentFlightPromise;
  } finally {
    if (refreshPromise === currentFlightPromise) {
      refreshPromise = null;
    }
  }
}

/**
 * Test helper to reset internal in-flight promise and generation.
 */
export function resetRefreshCoordinatorForTests(): void {
  refreshPromise = null;
  activeFlightGeneration = 0;
}
