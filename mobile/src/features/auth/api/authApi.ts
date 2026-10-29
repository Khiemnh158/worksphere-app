/**
 * Phase 13A: Mobile Authentication API Adapter
 * Transport adapter connecting mobile auth features to backend Spring Boot REST endpoints.
 * Operates purely as a transport adapter:
 * - Does NOT store tokens
 * - Does NOT mutate AuthProvider or navigation state
 * - Does NOT perform automatic retry or refresh
 * - Does NOT log sensitive credentials or payload data
 */

import { apiClient, http } from '../../../shared/api';
import {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  isAuthResponse,
  isRefreshResponse,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshResponse,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UserProfileResponse,
} from './authTypes';

export const authApi = {
  /**
   * Authenticate user with credentials.
   * Public endpoint: skipAuthRefresh is set to true.
   * POST /auth/login
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const data = await http.post<LoginRequest, AuthResponse>(
      '/auth/login',
      request,
      { skipAuthRefresh: true }
    );

    if (!isAuthResponse(data)) {
      throw new Error('Dữ liệu xác thực máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * Rotate refresh token and get a new access token.
   * Public endpoint: skipAuthRefresh is set to true.
   * POST /auth/refresh
   */
  async refresh(request: RefreshTokenRequest): Promise<RefreshResponse> {
    const data = await http.post<RefreshTokenRequest, RefreshResponse>(
      '/auth/refresh',
      request,
      { skipAuthRefresh: true }
    );

    if (!isRefreshResponse(data)) {
      throw new Error('Dữ liệu làm mới phiên máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * Logout current device session.
   * Protected endpoint: backend responds with 204 No Content.
   * POST /auth/logout
   */
  async logout(request: LogoutRequest): Promise<void> {
    await apiClient.post('/auth/logout', request);
  },

  /**
   * Logout all sessions for current user across all devices.
   * Protected endpoint: backend responds with 204 No Content.
   * POST /auth/logout-all
   */
  async logoutAll(): Promise<void> {
    await apiClient.post('/auth/logout-all');
  },

  /**
   * Request password reset instructions.
   * Public endpoint: skipAuthRefresh is set to true.
   * POST /auth/forgot-password
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await http.post<ForgotPasswordRequest, void>(
      '/auth/forgot-password',
      request,
      { skipAuthRefresh: true }
    );
  },

  /**
   * Reset password using reset token.
   * Public endpoint: skipAuthRefresh is set to true.
   * POST /auth/reset-password
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await http.post<ResetPasswordRequest, void>(
      '/auth/reset-password',
      request,
      { skipAuthRefresh: true }
    );
  },

  /**
   * Retrieve current authenticated user profile.
   * Protected endpoint.
   * GET /me
   */
  async getCurrentUser(): Promise<UserProfileResponse> {
    const user = await http.get<UserProfileResponse>('/me');
    if (!user) {
      throw new Error('Không thể tải thông tin hồ sơ người dùng');
    }
    return user;
  },

  /**
   * Update current user profile.
   * Protected endpoint.
   * PUT /me
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UserProfileResponse> {
    const updated = await http.put<UpdateProfileRequest, UserProfileResponse>('/me', request);
    if (!updated) {
      throw new Error('Không thể cập nhật thông tin hồ sơ người dùng');
    }
    return updated;
  },

  /**
   * Change current user password.
   * Protected endpoint.
   * PUT /me/password
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await http.put<ChangePasswordRequest, void>('/me/password', request);
  },
};
