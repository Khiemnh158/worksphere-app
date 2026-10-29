import {
  AuthResponse,
  isAuthDepartment,
  isAuthResponse,
  isAuthUser,
  isRefreshResponse,
  RefreshResponse,
} from '../../src/features/auth/api/authTypes';

describe('Auth Runtime Type Guards', () => {
  const validUser = {
    id: 'user-uuid-1234',
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    avatarUrl: null,
    department: {
      id: 'dept-uuid-5678',
      name: 'Engineering',
    },
    roles: ['ROLE_EMPLOYEE'],
    permissions: ['READ_PROFILE'],
  };

  const validAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token-xyz',
    refreshToken: 'mock-refresh-token-xyz',
    tokenType: 'Bearer',
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 2592000,
    user: validUser,
  };

  const validRefreshResponse: RefreshResponse = {
    accessToken: 'mock-new-access-token-xyz',
    refreshToken: 'mock-new-refresh-token-xyz',
    tokenType: 'Bearer',
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 2592000,
  };

  describe('isAuthDepartment', () => {
    it('accepts valid department object', () => {
      expect(isAuthDepartment({ id: 'dept-1', name: 'HR' })).toBe(true);
    });

    it('rejects null or non-object', () => {
      expect(isAuthDepartment(null)).toBe(false);
      expect(isAuthDepartment(undefined)).toBe(false);
      expect(isAuthDepartment('dept-1')).toBe(false);
    });

    it('rejects missing id or name', () => {
      expect(isAuthDepartment({ id: 'dept-1' })).toBe(false);
      expect(isAuthDepartment({ name: 'HR' })).toBe(false);
      expect(isAuthDepartment({ id: 123, name: 'HR' })).toBe(false);
    });
  });

  describe('isAuthUser', () => {
    it('accepts valid user with department and null avatar', () => {
      expect(isAuthUser(validUser)).toBe(true);
    });

    it('accepts valid user with null department and string avatar', () => {
      const user = { ...validUser, department: null, avatarUrl: 'https://cdn.example.com/a.png' };
      expect(isAuthUser(user)).toBe(true);
    });

    it('accepts valid user with undefined department and undefined avatar', () => {
      const user = {
        id: 'u-1',
        username: 'u1',
        email: 'u1@example.com',
        fullName: 'User 1',
        roles: [],
        permissions: [],
      };
      expect(isAuthUser(user)).toBe(true);
    });

    it('rejects null, undefined, or primitive', () => {
      expect(isAuthUser(null)).toBe(false);
      expect(isAuthUser(undefined)).toBe(false);
      expect(isAuthUser('user-string')).toBe(false);
    });

    it('rejects user with missing required fields', () => {
      expect(isAuthUser({ ...validUser, id: undefined })).toBe(false);
      expect(isAuthUser({ ...validUser, username: 123 })).toBe(false);
      expect(isAuthUser({ ...validUser, email: null })).toBe(false);
      expect(isAuthUser({ ...validUser, fullName: undefined })).toBe(false);
      expect(isAuthUser({ ...validUser, roles: 'ROLE_EMPLOYEE' })).toBe(false);
      expect(isAuthUser({ ...validUser, permissions: null })).toBe(false);
    });

    it('rejects user with non-string role or permission items', () => {
      expect(isAuthUser({ ...validUser, roles: [123] })).toBe(false);
      expect(isAuthUser({ ...validUser, permissions: [true] })).toBe(false);
    });

    it('rejects user with invalid department object', () => {
      expect(isAuthUser({ ...validUser, department: { id: 123 } })).toBe(false);
    });

    it('rejects user with invalid avatarUrl type', () => {
      expect(isAuthUser({ ...validUser, avatarUrl: 12345 })).toBe(false);
    });
  });

  describe('isAuthResponse', () => {
    it('accepts a fully valid AuthResponse', () => {
      expect(isAuthResponse(validAuthResponse)).toBe(true);
    });

    it('accepts AuthResponse with extra harmless fields', () => {
      const extended = { ...validAuthResponse, extraMeta: 'harmless' };
      expect(isAuthResponse(extended)).toBe(true);
    });

    it('rejects null or non-object', () => {
      expect(isAuthResponse(null)).toBe(false);
      expect(isAuthResponse(undefined)).toBe(false);
      expect(isAuthResponse('token')).toBe(false);
    });

    it('rejects missing or empty accessToken', () => {
      expect(isAuthResponse({ ...validAuthResponse, accessToken: '' })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, accessToken: '   ' })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, accessToken: undefined })).toBe(false);
    });

    it('rejects missing or empty refreshToken', () => {
      expect(isAuthResponse({ ...validAuthResponse, refreshToken: '' })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, refreshToken: '   ' })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, refreshToken: undefined })).toBe(false);
    });

    it('rejects invalid tokenType', () => {
      expect(isAuthResponse({ ...validAuthResponse, tokenType: 123 })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, tokenType: undefined })).toBe(false);
    });

    it('rejects invalid accessTokenExpiresIn (0, negative, NaN, non-number)', () => {
      expect(isAuthResponse({ ...validAuthResponse, accessTokenExpiresIn: 0 })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, accessTokenExpiresIn: -10 })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, accessTokenExpiresIn: NaN })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, accessTokenExpiresIn: Infinity })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, accessTokenExpiresIn: '900' })).toBe(false);
    });

    it('rejects invalid refreshTokenExpiresIn', () => {
      expect(isAuthResponse({ ...validAuthResponse, refreshTokenExpiresIn: 0 })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, refreshTokenExpiresIn: -100 })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, refreshTokenExpiresIn: NaN })).toBe(false);
    });

    it('rejects malformed user in AuthResponse', () => {
      expect(isAuthResponse({ ...validAuthResponse, user: null })).toBe(false);
      expect(isAuthResponse({ ...validAuthResponse, user: { id: 'u1' } })).toBe(false);
    });
  });

  describe('isRefreshResponse', () => {
    it('accepts a fully valid RefreshResponse', () => {
      expect(isRefreshResponse(validRefreshResponse)).toBe(true);
    });

    it('rejects null or non-object', () => {
      expect(isRefreshResponse(null)).toBe(false);
      expect(isRefreshResponse(undefined)).toBe(false);
    });

    it('rejects empty or whitespace tokens', () => {
      expect(isRefreshResponse({ ...validRefreshResponse, accessToken: '' })).toBe(false);
      expect(isRefreshResponse({ ...validRefreshResponse, refreshToken: '   ' })).toBe(false);
    });

    it('rejects invalid expiry numbers', () => {
      expect(isRefreshResponse({ ...validRefreshResponse, accessTokenExpiresIn: 0 })).toBe(false);
      expect(isRefreshResponse({ ...validRefreshResponse, refreshTokenExpiresIn: -1 })).toBe(false);
      expect(isRefreshResponse({ ...validRefreshResponse, accessTokenExpiresIn: '900' })).toBe(false);
    });
  });
});
