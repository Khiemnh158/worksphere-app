/**
 * Phase 13A: Presentation-Safe Authentication Error Mapper
 * Maps NormalizedApiError into standardized AuthPresentationError for UI display.
 * Strict Security Invariants:
 * - Never reflects tokens, passwords, credentials, or internal stack traces.
 * - Uniform messaging for user-enumeration sensitive codes.
 * - Correct session invalidation flags for terminal refresh failures.
 */

import { NormalizedApiError, normalizeError } from '../../../shared/api';

export type AuthErrorPlacement =
  | 'login'
  | 'password'
  | 'confirmPassword'
  | 'currentPassword'
  | 'newPassword'
  | 'email'
  | 'resetToken'
  | 'form'
  | 'dialog'
  | 'session';

export interface AuthPresentationError {
  message: string;
  placement: AuthErrorPlacement;
  retryable: boolean;
  clearSession: boolean;
  navigateToLogin: boolean;
  traceId?: string;
}

/**
 * Maps any caught error or NormalizedApiError into a presentation-safe AuthPresentationError.
 */
export function mapAuthError(error: unknown): AuthPresentationError {
  const normalized: NormalizedApiError = normalizeError(error);
  const traceId = normalized.traceId;

  // 1. Map explicit backend business error codes
  if (normalized.backendCode) {
    switch (normalized.backendCode) {
      case 'INVALID_CREDENTIALS':
        return {
          message: 'Thông tin đăng nhập không chính xác',
          placement: 'form',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'ACCOUNT_PENDING':
        return {
          message: 'Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên.',
          placement: 'dialog',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'ACCOUNT_LOCKED':
        return {
          message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
          placement: 'dialog',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'ACCOUNT_DISABLED':
        return {
          message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
          placement: 'dialog',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'REFRESH_TOKEN_INVALID':
        return {
          message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
          placement: 'session',
          retryable: false,
          clearSession: true,
          navigateToLogin: true,
          traceId,
        };

      case 'REFRESH_TOKEN_EXPIRED':
        return {
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          placement: 'session',
          retryable: false,
          clearSession: true,
          navigateToLogin: true,
          traceId,
        };

      case 'REFRESH_TOKEN_REVOKED':
        return {
          message: 'Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.',
          placement: 'session',
          retryable: false,
          clearSession: true,
          navigateToLogin: true,
          traceId,
        };

      case 'RESET_TOKEN_INVALID':
        return {
          message: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.',
          placement: 'resetToken',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'RESET_TOKEN_EXPIRED':
        return {
          message: 'Mã đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.',
          placement: 'resetToken',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'CURRENT_PASSWORD_INCORRECT':
        return {
          message: 'Mật khẩu hiện tại không chính xác',
          placement: 'currentPassword',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'NEW_PASSWORD_SAME_AS_CURRENT':
        return {
          message: 'Mật khẩu mới không được trùng mật khẩu hiện tại',
          placement: 'newPassword',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'PASSWORD_CONFIRMATION_MISMATCH':
        return {
          message: 'Mật khẩu xác nhận không khớp',
          placement: 'confirmPassword',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'PASSWORD_POLICY_VIOLATION':
        return {
          message: 'Mật khẩu phải có từ 8 đến 128 ký tự',
          placement: 'newPassword',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'VALIDATION_ERROR':
        return {
          message: normalized.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
          placement: 'form',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };

      case 'USER_NOT_FOUND':
        return {
          message: 'Người dùng không tồn tại',
          placement: 'dialog',
          retryable: false,
          clearSession: false,
          navigateToLogin: false,
          traceId,
        };
    }
  }

  // 2. Map normalized transport error kinds when no specific backend code is matched
  switch (normalized.kind) {
    case 'UNAUTHORIZED':
      return {
        message: 'Yêu cầu xác thực. Vui lòng đăng nhập để tiếp tục.',
        placement: 'session',
        retryable: false,
        clearSession: true,
        navigateToLogin: true,
        traceId,
      };

    case 'FORBIDDEN':
      return {
        message: 'Bạn không có quyền thực hiện thao tác này',
        placement: 'dialog',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId,
      };

    case 'NETWORK_ERROR':
      return {
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
        placement: 'form',
        retryable: true,
        clearSession: false,
        navigateToLogin: false,
        traceId,
      };

    case 'TIMEOUT':
      return {
        message: 'Kết nối mạng quá thời gian chờ. Vui lòng kiểm tra lại đường truyền và thử lại.',
        placement: 'form',
        retryable: true,
        clearSession: false,
        navigateToLogin: false,
        traceId,
      };

    case 'SERVER_ERROR':
      return {
        message: 'Hệ thống máy chủ gặp sự cố xử lý. Vui lòng thử lại sau.',
        placement: 'dialog',
        retryable: true,
        clearSession: false,
        navigateToLogin: false,
        traceId,
      };

    case 'NOT_FOUND':
      return {
        message: 'Tài nguyên yêu cầu không tồn tại hoặc đã bị xóa.',
        placement: 'dialog',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId,
      };

    case 'CONFLICT':
      return {
        message: 'Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.',
        placement: 'dialog',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId,
      };

    case 'VALIDATION_ERROR':
      return {
        message: normalized.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
        placement: 'form',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId,
      };

    default:
      return {
        message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
        placement: 'form',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId,
      };
  }
}
