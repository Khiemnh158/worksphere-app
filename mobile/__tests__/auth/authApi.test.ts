import { authApi } from '../../src/features/auth/api/authApi';
import {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RefreshResponse,
  UserProfileResponse,
} from '../../src/features/auth/api/authTypes';
import { apiClient, http } from '../../src/shared/api';

jest.mock('../../src/shared/api', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  apiClient: {
    post: jest.fn(),
  },
}));

describe('Auth API Adapter (authApi)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-uuid-1',
    username: 'john.doe',
    email: 'john.doe@worksphere.local',
    fullName: 'John Doe',
    avatarUrl: null,
    department: {
      id: 'dept-uuid-1',
      name: 'Engineering',
    },
    roles: ['ROLE_EMPLOYEE'],
    permissions: ['READ_PROFILE'],
  };

  const validAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token-123',
    refreshToken: 'mock-refresh-token-456',
    tokenType: 'Bearer',
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 2592000,
    user: mockUser,
  };

  const validRefreshResponse: RefreshResponse = {
    accessToken: 'mock-new-access-token-789',
    refreshToken: 'mock-new-refresh-token-012',
    tokenType: 'Bearer',
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 2592000,
  };

  const mockUserProfile: UserProfileResponse = {
    id: 'user-uuid-1',
    username: 'john.doe',
    email: 'john.doe@worksphere.local',
    fullName: 'John Doe',
    phoneNumber: '0901234567',
    avatarUrl: null,
    status: 'ACTIVE',
    department: {
      id: 'dept-uuid-1',
      code: 'ENG',
      name: 'Engineering',
    },
    roles: ['ROLE_EMPLOYEE'],
    permissions: ['READ_PROFILE'],
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-10-18T10:00:00Z',
  };

  describe('login', () => {
    const loginReq: LoginRequest = {
      login: 'john.doe',
      password: 'password123',
      deviceName: 'Pixel 8 Pro',
    };

    it('posts to /auth/login with skipAuthRefresh: true and returns valid AuthResponse', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce(validAuthResponse);

      const result = await authApi.login(loginReq);

      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith('/auth/login', loginReq, { skipAuthRefresh: true });
      expect(result).toEqual(validAuthResponse);
    });

    it('rejects and throws if response does not conform to AuthResponse guard', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce({ invalid: 'payload' });

      await expect(authApi.login(loginReq)).rejects.toThrow(
        'Dữ liệu xác thực máy chủ trả về không hợp lệ'
      );
    });

    it('propagates transport error as rejected promise', async () => {
      const networkError = new Error('Network error');
      (http.post as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(authApi.login(loginReq)).rejects.toThrow('Network error');
    });
  });

  describe('refresh', () => {
    const refreshReq: RefreshTokenRequest = {
      refreshToken: 'mock-refresh-token-456',
    };

    it('posts to /auth/refresh with skipAuthRefresh: true and returns valid RefreshResponse', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce(validRefreshResponse);

      const result = await authApi.refresh(refreshReq);

      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith('/auth/refresh', refreshReq, { skipAuthRefresh: true });
      expect(result).toEqual(validRefreshResponse);
    });

    it('rejects and throws if response does not conform to RefreshResponse guard', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce({ accessToken: '' });

      await expect(authApi.refresh(refreshReq)).rejects.toThrow(
        'Dữ liệu làm mới phiên máy chủ trả về không hợp lệ'
      );
    });
  });

  describe('logout and logoutAll', () => {
    it('logout calls apiClient.post with /auth/logout and returns void (handles 204)', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ status: 204 });

      await authApi.logout({ refreshToken: 'token-xyz' });

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'token-xyz' });
    });

    it('logoutAll calls apiClient.post with /auth/logout-all and returns void', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ status: 204 });

      await authApi.logoutAll();

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout-all');
    });
  });

  describe('forgotPassword and resetPassword', () => {
    it('forgotPassword posts to /auth/forgot-password with skipAuthRefresh: true', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce(null);

      await authApi.forgotPassword({ email: 'user@worksphere.local' });

      expect(http.post).toHaveBeenCalledWith(
        '/auth/forgot-password',
        { email: 'user@worksphere.local' },
        { skipAuthRefresh: true }
      );
    });

    it('resetPassword posts to /auth/reset-password with skipAuthRefresh: true', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce(null);

      const resetReq = {
        resetToken: 'valid-reset-token',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      await authApi.resetPassword(resetReq);

      expect(http.post).toHaveBeenCalledWith(
        '/auth/reset-password',
        resetReq,
        { skipAuthRefresh: true }
      );
    });
  });

  describe('getCurrentUser, updateProfile, changePassword', () => {
    it('getCurrentUser gets /me and returns user profile', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce(mockUserProfile);

      const result = await authApi.getCurrentUser();

      expect(http.get).toHaveBeenCalledWith('/me');
      expect(result).toEqual(mockUserProfile);
    });

    it('getCurrentUser throws if server returns null', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce(null);

      await expect(authApi.getCurrentUser()).rejects.toThrow(
        'Không thể tải thông tin hồ sơ người dùng'
      );
    });

    it('updateProfile puts /me and returns updated profile', async () => {
      (http.put as jest.Mock).mockResolvedValueOnce(mockUserProfile);

      const updateReq = { fullName: 'John Doe Updated', phoneNumber: '0987654321' };
      const result = await authApi.updateProfile(updateReq);

      expect(http.put).toHaveBeenCalledWith('/me', updateReq);
      expect(result).toEqual(mockUserProfile);
    });

    it('updateProfile throws if server returns null', async () => {
      (http.put as jest.Mock).mockResolvedValueOnce(null);

      await expect(authApi.updateProfile({ fullName: 'John Doe' })).rejects.toThrow(
        'Không thể cập nhật thông tin hồ sơ người dùng'
      );
    });

    it('changePassword puts /me/password', async () => {
      (http.put as jest.Mock).mockResolvedValueOnce(null);

      const changeReq = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };
      await authApi.changePassword(changeReq);

      expect(http.put).toHaveBeenCalledWith('/me/password', changeReq);
    });
  });
});
