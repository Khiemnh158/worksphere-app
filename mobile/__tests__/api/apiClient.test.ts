import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  apiClient,
  setUnauthorizedHandler,
  notifyUnauthorized,
  http,
} from '../../src/shared/api/apiClient';
import { accessTokenStore } from '../../src/shared/storage/accessTokenStore';
import { resetEnvironmentConfig } from '../../src/shared/config/environment';

describe('ApiClient and Transport Interceptors', () => {
  beforeEach(() => {
    accessTokenStore.clearAccessToken();
    setUnauthorizedHandler(null);
    resetEnvironmentConfig();
  });

  test('injects Bearer token in request header when access token is present', async () => {
    accessTokenStore.setAccessToken('test-access-token-jwt');

    // Inspect request interceptor logic
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const config = {
      headers: new axios.AxiosHeaders(),
    } as InternalAxiosRequestConfig;

    const result = await requestInterceptor(config);
    expect(result.headers.get('Authorization')).toBe('Bearer test-access-token-jwt');
  });

  test('does not add Authorization header when access token is absent', async () => {
    accessTokenStore.clearAccessToken();

    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const config = {
      headers: new axios.AxiosHeaders(),
    } as InternalAxiosRequestConfig;

    const result = await requestInterceptor(config);
    expect(result.headers.get('Authorization')).toBeUndefined();
  });

  test('response interceptor invokes unauthorizedHandler on 401 and rejects normalized error', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);

    const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

    const error401 = new AxiosError('Unauthorized', '401', {} as any, {}, {
      status: 401,
      data: { success: false, message: 'Session expired', timestamp: '2026-10-17T12:00:00Z' },
      statusText: 'Unauthorized',
      headers: {},
      config: {} as any,
    } as AxiosResponse);

    await expect(responseInterceptorErr(error401)).rejects.toMatchObject({
      kind: 'UNAUTHORIZED',
      status: 401,
      message: 'Session expired',
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('response interceptor does not invoke unauthorizedHandler on 403', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);

    const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

    const error403 = new AxiosError('Forbidden', '403', {} as any, {}, {
      status: 403,
      data: { success: false, message: 'Access denied', timestamp: '2026-10-17T12:00:00Z' },
      statusText: 'Forbidden',
      headers: {},
      config: {} as any,
    } as AxiosResponse);

    await expect(responseInterceptorErr(error403)).rejects.toMatchObject({
      kind: 'FORBIDDEN',
      status: 403,
    });

    expect(handler).not.toHaveBeenCalled();
  });

  test('notifyUnauthorized executes safely when no handler is registered', async () => {
    setUnauthorizedHandler(null);
    await expect(notifyUnauthorized()).resolves.toBeUndefined();
  });

  test('notifyUnauthorized does not throw if the registered handler throws', async () => {
    setUnauthorizedHandler(() => {
      throw new Error('Handler internal fault');
    });

    await expect(notifyUnauthorized()).resolves.toBeUndefined();
  });

  test('http helpers unwrap ApiResponse data when present', async () => {
    const mockData = { id: 'proj-1', title: 'WorkSphere' };
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: mockData,
        timestamp: '2026-10-17T12:00:00Z',
      },
    } as AxiosResponse);

    const result = await http.get('/projects');
    expect(result).toEqual(mockData);
  });

  test('http.post forwards skipAuthRefresh in config argument without leaking into request body', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: { ok: true },
        timestamp: '2026-10-18T12:00:00Z',
      },
    } as AxiosResponse);

    const payload = { login: 'user1', password: 'password123' };
    const config: AxiosRequestConfig = { skipAuthRefresh: true };

    const result = await http.post('/auth/login', payload, config);
    expect(result).toEqual({ ok: true });
    expect(postSpy).toHaveBeenCalledWith('/auth/login', payload, { skipAuthRefresh: true });
    expect(payload).not.toHaveProperty('skipAuthRefresh');
  });

  describe('Phase 13C Token Refresh & Retry-Once Interceptor', () => {
    test('protected request 401 triggers single-flight refresh and retries once with new Bearer token', async () => {
      const mockRefresh = jest.fn().mockResolvedValue('new-rotated-access-token');
      const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
      setTokenRefreshHandler(mockRefresh);

      const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

      const requestConfig = {
        url: '/projects',
        method: 'get',
        headers: new axios.AxiosHeaders({
          Authorization: 'Bearer expired-token',
        }),
      } as any;

      const error401 = new AxiosError('Unauthorized', '401', requestConfig, {}, {
        status: 401,
        data: { success: false, code: 'UNAUTHORIZED', timestamp: '2026-10-18T12:00:00Z' },
        statusText: 'Unauthorized',
        headers: {},
        config: requestConfig,
      } as AxiosResponse);

      const requestSpy = jest.spyOn(apiClient, 'request').mockResolvedValueOnce({
        data: { success: true, data: [{ id: '1' }] },
      } as AxiosResponse);

      const result = await responseInterceptorErr(error401);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(requestConfig._retry).toBe(true);
      expect(requestConfig.headers.get('Authorization')).toBe('Bearer new-rotated-access-token');
      expect(requestSpy).toHaveBeenCalledWith(requestConfig);
      expect(result).toEqual({ data: { success: true, data: [{ id: '1' }] } });

      setTokenRefreshHandler(null);
    });

    test('excluded auth endpoints (/auth/login, /auth/refresh, etc.) do NOT trigger refresh on 401', async () => {
      const mockRefresh = jest.fn();
      const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
      setTokenRefreshHandler(mockRefresh);

      const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

      const loginError = new AxiosError('Unauthorized', '401', {
        url: '/auth/login',
        headers: new axios.AxiosHeaders({ Authorization: 'Bearer token' }),
      } as any, {}, {
        status: 401,
        data: { success: false, code: 'INVALID_CREDENTIALS', timestamp: '2026-10-18T12:00:00Z' },
        statusText: 'Unauthorized',
        headers: {},
        config: { url: '/auth/login' } as any,
      } as AxiosResponse);

      await expect(responseInterceptorErr(loginError)).rejects.toMatchObject({
        kind: 'UNAUTHORIZED',
      });

      expect(mockRefresh).not.toHaveBeenCalled();
      setTokenRefreshHandler(null);
    });

    test('request with skipAuthRefresh=true does NOT trigger refresh on 401', async () => {
      const mockRefresh = jest.fn();
      const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
      setTokenRefreshHandler(mockRefresh);

      const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

      const skipError = new AxiosError('Unauthorized', '401', {
        url: '/auth/logout',
        skipAuthRefresh: true,
        headers: new axios.AxiosHeaders({ Authorization: 'Bearer token' }),
      } as any, {}, {
        status: 401,
        data: { success: false, code: 'UNAUTHORIZED', timestamp: '2026-10-18T12:00:00Z' },
        statusText: 'Unauthorized',
        headers: {},
        config: { url: '/auth/logout', skipAuthRefresh: true } as any,
      } as AxiosResponse);

      await expect(responseInterceptorErr(skipError)).rejects.toMatchObject({
        kind: 'UNAUTHORIZED',
      });

      expect(mockRefresh).not.toHaveBeenCalled();
      setTokenRefreshHandler(null);
    });

    test('retried request (_retry=true) that fails with 401 does not refresh again and calls notifyUnauthorized', async () => {
      const mockRefresh = jest.fn();
      const unauthorizedMock = jest.fn();
      const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
      setTokenRefreshHandler(mockRefresh);
      setUnauthorizedHandler(unauthorizedMock);

      const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

      const retryError = new AxiosError('Unauthorized', '401', {
        url: '/projects',
        _retry: true,
        headers: new axios.AxiosHeaders({ Authorization: 'Bearer token' }),
      } as any, {}, {
        status: 401,
        data: { success: false, code: 'UNAUTHORIZED', timestamp: '2026-10-18T12:00:00Z' },
        statusText: 'Unauthorized',
        headers: {},
        config: { url: '/projects', _retry: true } as any,
      } as AxiosResponse);

      await expect(responseInterceptorErr(retryError)).rejects.toMatchObject({
        kind: 'UNAUTHORIZED',
      });

      expect(mockRefresh).not.toHaveBeenCalled();
      expect(unauthorizedMock).toHaveBeenCalledTimes(1);

      setTokenRefreshHandler(null);
      setUnauthorizedHandler(null);
    });

    test('missing Authorization Bearer header does NOT trigger refresh', async () => {
      const mockRefresh = jest.fn();
      const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
      setTokenRefreshHandler(mockRefresh);

      const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

      const noAuthError = new AxiosError('Unauthorized', '401', {
        url: '/public/status',
        headers: new axios.AxiosHeaders(),
      } as any, {}, {
        status: 401,
        data: { success: false, code: 'UNAUTHORIZED', timestamp: '2026-10-18T12:00:00Z' },
        statusText: 'Unauthorized',
        headers: {},
        config: { url: '/public/status' } as any,
      } as AxiosResponse);

      await expect(responseInterceptorErr(noAuthError)).rejects.toMatchObject({
        kind: 'UNAUTHORIZED',
      });

      expect(mockRefresh).not.toHaveBeenCalled();
      setTokenRefreshHandler(null);
    });

    describe('Strict Refresh Eligibility Payload Matrix (A-F)', () => {
      const create401Error = (responseData: unknown) => {
        const config = {
          url: '/projects',
          method: 'get',
          headers: new axios.AxiosHeaders({ Authorization: 'Bearer test-token' }),
        } as any;

        return new AxiosError('Unauthorized', '401', config, {}, {
          status: 401,
          data: responseData,
          statusText: 'Unauthorized',
          headers: {},
          config,
        } as AxiosResponse);
      };

      test('Payload A: Valid envelope with code=UNAUTHORIZED triggers REFRESH', async () => {
        const mockRefresh = jest.fn().mockResolvedValue('token-rotated');
        const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
        setTokenRefreshHandler(mockRefresh);

        const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;
        const reqSpy = jest.spyOn(apiClient, 'request').mockResolvedValueOnce({
          data: { success: true },
        } as AxiosResponse);

        const payloadA = {
          success: false,
          code: 'UNAUTHORIZED',
          timestamp: '2026-10-19T00:00:00Z',
        };

        await responseInterceptorErr(create401Error(payloadA));
        expect(mockRefresh).toHaveBeenCalledTimes(1);
        expect(reqSpy).toHaveBeenCalled();
        reqSpy.mockRestore();

        setTokenRefreshHandler(null);
      });

      test('Payload B: Envelope without code does NOT trigger refresh (NO_REFRESH)', async () => {
        const mockRefresh = jest.fn();
        const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
        setTokenRefreshHandler(mockRefresh);

        const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

        const payloadB = {
          success: false,
          timestamp: '2026-10-19T00:00:00Z',
        };

        await expect(responseInterceptorErr(create401Error(payloadB))).rejects.toMatchObject({
          kind: 'UNAUTHORIZED',
        });
        expect(mockRefresh).not.toHaveBeenCalled();

        setTokenRefreshHandler(null);
      });

      test('Payload C: Plain text unauthorized does NOT trigger refresh (NO_REFRESH)', async () => {
        const mockRefresh = jest.fn();
        const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
        setTokenRefreshHandler(mockRefresh);

        const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

        const payloadC = 'plain unauthorized text';

        await expect(responseInterceptorErr(create401Error(payloadC))).rejects.toMatchObject({
          kind: 'UNAUTHORIZED',
        });
        expect(mockRefresh).not.toHaveBeenCalled();

        setTokenRefreshHandler(null);
      });

      test('Payload D: HTML 401 body does NOT trigger refresh (NO_REFRESH)', async () => {
        const mockRefresh = jest.fn();
        const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
        setTokenRefreshHandler(mockRefresh);

        const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

        const payloadD = '<html><body><h1>401 Unauthorized Gateway</h1></body></html>';

        await expect(responseInterceptorErr(create401Error(payloadD))).rejects.toMatchObject({
          kind: 'UNAUTHORIZED',
        });
        expect(mockRefresh).not.toHaveBeenCalled();

        setTokenRefreshHandler(null);
      });

      test('Payload E: Code is ACCOUNT_LOCKED does NOT trigger refresh (NO_REFRESH)', async () => {
        const mockRefresh = jest.fn();
        const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
        setTokenRefreshHandler(mockRefresh);

        const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

        const payloadE = {
          success: false,
          code: 'ACCOUNT_LOCKED',
          timestamp: '2026-10-19T00:00:00Z',
        };

        await expect(responseInterceptorErr(create401Error(payloadE))).rejects.toMatchObject({
          kind: 'UNAUTHORIZED',
        });
        expect(mockRefresh).not.toHaveBeenCalled();

        setTokenRefreshHandler(null);
      });

      test('Payload F: success=true does NOT trigger refresh (NO_REFRESH)', async () => {
        const mockRefresh = jest.fn();
        const { setTokenRefreshHandler } = require('../../src/shared/api/apiClient');
        setTokenRefreshHandler(mockRefresh);

        const responseInterceptorErr = (apiClient.interceptors.response as any).handlers[0].rejected;

        const payloadF = {
          success: true,
          code: 'UNAUTHORIZED',
          timestamp: '2026-10-19T00:00:00Z',
        };

        await expect(responseInterceptorErr(create401Error(payloadF))).rejects.toMatchObject({
          kind: 'UNAUTHORIZED',
        });
        expect(mockRefresh).not.toHaveBeenCalled();

        setTokenRefreshHandler(null);
      });
    });

    test('HANDLER OWNERSHIP: unregistering previous handler does not remove newer registered handler', async () => {
      const {
        registerUnauthorizedHandler,
        registerTokenRefreshHandler,
      } = require('../../src/shared/api/apiClient');

      const handlerA = jest.fn();
      const handlerB = jest.fn();

      const unregisterA = registerUnauthorizedHandler(handlerA);
      const unregisterB = registerUnauthorizedHandler(handlerB);

      // Unregistering A must NOT remove B
      unregisterA();
      await notifyUnauthorized();

      expect(handlerA).not.toHaveBeenCalled();
      expect(handlerB).toHaveBeenCalledTimes(1);

      // Unregistering B removes B
      unregisterB();
      await notifyUnauthorized();
      expect(handlerB).toHaveBeenCalledTimes(1);

      // Same test for token refresh handler
      const refreshA = jest.fn().mockResolvedValue('token-a');
      const refreshB = jest.fn().mockResolvedValue('token-b');

      const unregisterRefA = registerTokenRefreshHandler(refreshA);
      const unregisterRefB = registerTokenRefreshHandler(refreshB);

      unregisterRefA();
      // Handler B remains active
      unregisterRefB();
    });
  });
});
