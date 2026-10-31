import axios from 'axios';
import {
  apiClient,
  setTokenRefreshHandler,
  setUnauthorizedHandler,
} from '../../src/shared/api/apiClient';
import { accessTokenStore } from '../../src/shared/storage/accessTokenStore';
import { invalidateSessionCredentials } from '../../src/app/auth/sessionCredentialCoordinator';
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const envelope = {
  success: false,
  code: 'UNAUTHORIZED',
  timestamp: '2026-10-30T00:00:00Z',
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => {
    resolve = r;
  });
  return { promise, resolve };
}
describe('mobile session boundary', () => {
  afterEach(() => {
    setTokenRefreshHandler(null);
    setUnauthorizedHandler(null);
    accessTokenStore.clearAccessToken();
    invalidateSessionCredentials();
  });
  test('late successful response after logout is discarded', async () => {
    const result = deferred<any>();
    accessTokenStore.setAccessToken('old-token');
    const adapter = jest.fn((_config: any) => result.promise);
    const request = apiClient.get('/workplace/work', { adapter });
    await Promise.resolve();
    await Promise.resolve();
    invalidateSessionCredentials();
    accessTokenStore.clearAccessToken();
    result.resolve({
      data: { secret: 'old' },
      config: adapter.mock.calls[0][0],
      status: 200,
      statusText: 'OK',
      headers: {},
    });
    await expect(request).rejects.toMatchObject({
      backendCode: 'STALE_SESSION',
    });
  });
  test('an old mutation cannot replay under a newly signed-in account after refresh returns', async () => {
    const refresh = deferred<string>();
    const started = deferred<void>();
    const notify = jest.fn();
    setUnauthorizedHandler(notify);
    accessTokenStore.setAccessToken('old-token');
    setTokenRefreshHandler(async () => {
      started.resolve();
      return refresh.promise;
    });
    const adapter = jest.fn(async (config: any) => {
      throw new axios.AxiosError(
        'expired',
        '401',
        config,
        {},
        { config, status: 401, statusText: '', headers: {}, data: envelope },
      );
    });
    const request = apiClient.post(
      '/workplace/work/w/commands',
      { action: 'SUBMIT' },
      { adapter },
    );
    await started.promise;
    invalidateSessionCredentials();
    accessTokenStore.setAccessToken('new-account-token');
    refresh.resolve('late-old-token');
    await expect(request).rejects.toMatchObject({
      backendCode: 'STALE_SESSION',
    });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(notify).not.toHaveBeenCalled();
    expect(accessTokenStore.getAccessToken()).toBe('new-account-token');
  });
  test('temporary refresh network outage does not log out the current account', async () => {
    const notify = jest.fn();
    setUnauthorizedHandler(notify);
    accessTokenStore.setAccessToken('old-token');
    setTokenRefreshHandler(async () => {
      throw new axios.AxiosError('Network Error', 'ERR_NETWORK');
    });
    const adapter = async (config: any) => {
      throw new axios.AxiosError(
        'expired',
        '401',
        config,
        {},
        { config, status: 401, statusText: '', headers: {}, data: envelope },
      );
    };
    await expect(
      apiClient.get('/workplace/context', { adapter }),
    ).rejects.toMatchObject({ kind: 'NETWORK_ERROR' });
    expect(notify).not.toHaveBeenCalled();
  });
});
