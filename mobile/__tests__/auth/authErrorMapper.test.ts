import { mapAuthError } from '../../src/features/auth/errors/authErrorMapper';
import { NormalizedApiError } from '../../src/shared/api';

describe('Auth Error Mapper', () => {
  describe('Explicit Backend Error Codes', () => {
    it('maps INVALID_CREDENTIALS safely without user enumeration', () => {
      const err: NormalizedApiError = {
        kind: 'UNAUTHORIZED',
        backendCode: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password',
        traceId: 'trace-auth-001',
      };
      const result = mapAuthError(err);
      expect(result).toEqual({
        message: 'Thông tin đăng nhập không chính xác',
        placement: 'form',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId: 'trace-auth-001',
      });
    });

    it('maps ACCOUNT_PENDING to dialog without clearing session', () => {
      const err: NormalizedApiError = {
        kind: 'FORBIDDEN',
        backendCode: 'ACCOUNT_PENDING',
        message: 'Account is pending activation',
      };
      const result = mapAuthError(err);
      expect(result).toEqual({
        message: 'Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên.',
        placement: 'dialog',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId: undefined,
      });
    });

    it('maps ACCOUNT_LOCKED to dialog', () => {
      const err: NormalizedApiError = {
        kind: 'FORBIDDEN',
        backendCode: 'ACCOUNT_LOCKED',
        message: 'Account is locked',
      };
      const result = mapAuthError(err);
      expect(result).toEqual({
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
        placement: 'dialog',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId: undefined,
      });
    });

    it('maps ACCOUNT_DISABLED to dialog', () => {
      const err: NormalizedApiError = {
        kind: 'FORBIDDEN',
        backendCode: 'ACCOUNT_DISABLED',
        message: 'Account is disabled',
      };
      const result = mapAuthError(err);
      expect(result).toEqual({
        message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        placement: 'dialog',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId: undefined,
      });
    });

    it('maps terminal refresh token errors to session invalidation', () => {
      const refreshCodes = [
        'REFRESH_TOKEN_INVALID',
        'REFRESH_TOKEN_EXPIRED',
        'REFRESH_TOKEN_REVOKED',
      ];

      for (const code of refreshCodes) {
        const err: NormalizedApiError = {
          kind: 'UNAUTHORIZED',
          backendCode: code,
          message: 'Refresh failed',
        };
        const result = mapAuthError(err);
        expect(result.placement).toBe('session');
        expect(result.clearSession).toBe(true);
        expect(result.navigateToLogin).toBe(true);
        expect(result.retryable).toBe(false);
      }
    });

    it('maps reset token errors to resetToken placement', () => {
      const errInvalid: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'RESET_TOKEN_INVALID',
        message: 'Token invalid',
      };
      expect(mapAuthError(errInvalid)).toEqual({
        message: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.',
        placement: 'resetToken',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId: undefined,
      });

      const errExpired: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'RESET_TOKEN_EXPIRED',
        message: 'Token expired',
      };
      expect(mapAuthError(errExpired)).toEqual({
        message: 'Mã đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.',
        placement: 'resetToken',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId: undefined,
      });
    });

    it('maps password modification backend codes to exact field placements', () => {
      const currentErr: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'CURRENT_PASSWORD_INCORRECT',
        message: 'Wrong password',
      };
      expect(mapAuthError(currentErr).placement).toBe('currentPassword');
      expect(mapAuthError(currentErr).message).toBe('Mật khẩu hiện tại không chính xác');

      const sameErr: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'NEW_PASSWORD_SAME_AS_CURRENT',
        message: 'Same as old',
      };
      expect(mapAuthError(sameErr).placement).toBe('newPassword');
      expect(mapAuthError(sameErr).message).toBe('Mật khẩu mới không được trùng mật khẩu hiện tại');

      const mismatchErr: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'PASSWORD_CONFIRMATION_MISMATCH',
        message: 'Mismatch',
      };
      expect(mapAuthError(mismatchErr).placement).toBe('confirmPassword');
      expect(mapAuthError(mismatchErr).message).toBe('Mật khẩu xác nhận không khớp');

      const policyErr: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'PASSWORD_POLICY_VIOLATION',
        message: 'Policy error',
      };
      expect(mapAuthError(policyErr).placement).toBe('newPassword');
      expect(mapAuthError(policyErr).message).toBe('Mật khẩu phải có từ 8 đến 128 ký tự');
    });

    it('maps USER_NOT_FOUND to dialog', () => {
      const err: NormalizedApiError = {
        kind: 'NOT_FOUND',
        backendCode: 'USER_NOT_FOUND',
        message: 'User not found',
      };
      const result = mapAuthError(err);
      expect(result.placement).toBe('dialog');
      expect(result.message).toBe('Người dùng không tồn tại');
    });
  });

  describe('Normalized Transport Kinds (Without Backend Codes)', () => {
    it('maps general UNAUTHORIZED to session with navigateToLogin = true', () => {
      const err: NormalizedApiError = {
        kind: 'UNAUTHORIZED',
        message: 'Unauthorized',
      };
      const result = mapAuthError(err);
      expect(result).toEqual({
        message: 'Yêu cầu xác thực. Vui lòng đăng nhập để tiếp tục.',
        placement: 'session',
        retryable: false,
        clearSession: true,
        navigateToLogin: true,
        traceId: undefined,
      });
    });

    it('maps FORBIDDEN to dialog', () => {
      const err: NormalizedApiError = {
        kind: 'FORBIDDEN',
        message: 'Access denied',
      };
      const result = mapAuthError(err);
      expect(result.placement).toBe('dialog');
      expect(result.retryable).toBe(false);
      expect(result.clearSession).toBe(false);
    });

    it('maps NETWORK_ERROR and TIMEOUT as retryable form errors', () => {
      const netErr: NormalizedApiError = {
        kind: 'NETWORK_ERROR',
        message: 'Network offline',
      };
      const netResult = mapAuthError(netErr);
      expect(netResult.retryable).toBe(true);
      expect(netResult.placement).toBe('form');
      expect(netResult.clearSession).toBe(false);

      const timeoutErr: NormalizedApiError = {
        kind: 'TIMEOUT',
        message: 'Timeout exceeded',
      };
      const timeoutResult = mapAuthError(timeoutErr);
      expect(timeoutResult.retryable).toBe(true);
      expect(timeoutResult.placement).toBe('form');
    });

    it('maps SERVER_ERROR as retryable dialog error', () => {
      const serverErr: NormalizedApiError = {
        kind: 'SERVER_ERROR',
        message: 'Internal server error 500',
      };
      const result = mapAuthError(serverErr);
      expect(result.retryable).toBe(true);
      expect(result.placement).toBe('dialog');
      expect(result.clearSession).toBe(false);
    });

    it('maps UNKNOWN_ERROR safely to form', () => {
      const result = mapAuthError(new Error('unexpected error'));
      expect(result.placement).toBe('form');
      expect(result.retryable).toBe(false);
      expect(result.clearSession).toBe(false);
    });
  });

  describe('TraceId and Non-exposure Invariants', () => {
    it('preserves traceId when provided in the error envelope', () => {
      const result = mapAuthError({
        kind: 'SERVER_ERROR',
        message: 'Internal Error',
        traceId: 'req-trace-xyz-987',
      });
      expect(result.traceId).toBe('req-trace-xyz-987');
    });

    it('never reflects raw credentials, tokens or passwords', () => {
      const sensitivePassword = 'SUPER_SECRET_RAW_PASSWORD_123';
      const result = mapAuthError(new Error(`Failed with ${sensitivePassword}`));
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain(sensitivePassword);
    });
  });
});
