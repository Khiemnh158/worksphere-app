import { accessTokenStore } from '../../src/shared/storage/accessTokenStore';

describe('AccessTokenStore', () => {
  afterEach(() => {
    accessTokenStore.clearAccessToken();
  });

  test('returns null initially when no token has been set', () => {
    expect(accessTokenStore.getAccessToken()).toBeNull();
  });

  test('stores and retrieves access token in memory', () => {
    accessTokenStore.setAccessToken('mock-jwt-access-token');
    expect(accessTokenStore.getAccessToken()).toBe('mock-jwt-access-token');
  });

  test('clears token cleanly and returns null afterwards', () => {
    accessTokenStore.setAccessToken('sample-token');
    expect(accessTokenStore.getAccessToken()).toBe('sample-token');

    accessTokenStore.clearAccessToken();
    expect(accessTokenStore.getAccessToken()).toBeNull();
  });

  test('allows overwriting with null directly via setAccessToken', () => {
    accessTokenStore.setAccessToken('token-to-overwrite');
    accessTokenStore.setAccessToken(null);
    expect(accessTokenStore.getAccessToken()).toBeNull();
  });
});
