/**
 * Phase 14A: Presentation-Safe Project Error Mapper
 * Maps NormalizedApiError into standardized ProjectPresentationError for UI display.
 * Strict Security Invariants:
 * - Never reflects internal stack traces or raw database exceptions.
 * - Handles optimistic lock conflict (HTTP 409 OPTIMISTIC_LOCK_CONFLICT) with reload prompt.
 * - Handles sole project manager invariant D-013 (PROJECT_MANAGER_REQUIRED).
 * - Maps Vietnamese user-friendly messages for project validation and status transition errors.
 */

import { NormalizedApiError, normalizeError } from '../../../shared/api';

export type ProjectErrorPlacement =
  | 'form'
  | 'dialog'
  | 'banner'
  | 'status'
  | 'members'
  | 'milestones'
  | 'general';

export interface ProjectPresentationError {
  message: string;
  placement: ProjectErrorPlacement;
  retryable: boolean;
  isConflict: boolean;
  isNotFound: boolean;
  isForbidden: boolean;
  fieldErrors?: Record<string, string>;
  traceId?: string;
}

/**
 * Maps any caught error or NormalizedApiError into a presentation-safe ProjectPresentationError.
 */
export function mapProjectError(error: unknown): ProjectPresentationError {
  const normalized: NormalizedApiError = normalizeError(error);
  const traceId = normalized.traceId;
  const fieldErrors = normalized.fieldErrors;

  // 1. Map explicit backend business error codes
  if (normalized.backendCode) {
    switch (normalized.backendCode) {
      case 'PROJECT_NOT_FOUND':
        return {
          message: 'Dự án không tồn tại hoặc đã bị xóa.',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: true,
          isForbidden: false,
          traceId,
        };

      case 'OPTIMISTIC_LOCK_CONFLICT':
        return {
          message: 'Dữ liệu đã bị cập nhật bởi người khác. Vui lòng tải lại phiên bản mới nhất.',
          placement: 'dialog',
          retryable: false,
          isConflict: true,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'PROJECT_CODE_ALREADY_EXISTS':
        return {
          message: 'Mã dự án đã tồn tại trên hệ thống.',
          placement: 'form',
          retryable: false,
          isConflict: true,
          isNotFound: false,
          isForbidden: false,
          fieldErrors,
          traceId,
        };

      case 'PROJECT_STATUS_TRANSITION_INVALID':
        return {
          message: 'Chuyển đổi trạng thái dự án không hợp lệ.',
          placement: 'status',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'PROJECT_ALREADY_COMPLETED':
        return {
          message: 'Dự án đã hoàn thành, không thể thay đổi trạng thái.',
          placement: 'status',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'PROJECT_ALREADY_CANCELLED':
        return {
          message: 'Dự án đã bị hủy, không thể thay đổi trạng thái.',
          placement: 'status',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'PROJECT_MANAGER_REQUIRED':
        return {
          message: 'Không thể xóa hoặc thay đổi vai trò của Project Manager duy nhất của dự án.',
          placement: 'members',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'PROJECT_MEMBER_ALREADY_EXISTS':
        return {
          message: 'Người dùng đã là thành viên của dự án.',
          placement: 'members',
          retryable: false,
          isConflict: true,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'PROJECT_NOT_ACTIVE':
        return {
          message: 'Dự án không ở trạng thái hoạt động.',
          placement: 'banner',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'MILESTONE_NOT_FOUND':
        return {
          message: 'Mốc tiến độ không tồn tại hoặc đã bị xóa.',
          placement: 'milestones',
          retryable: false,
          isConflict: false,
          isNotFound: true,
          isForbidden: false,
          traceId,
        };

      case 'VALIDATION_ERROR':
        return {
          message: normalized.message || 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.',
          placement: 'form',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          fieldErrors,
          traceId,
        };

      default:
        break;
    }
  }

  // 2. Map HTTP Status Codes
  if (normalized.status) {
    switch (normalized.status) {
      case 403:
        return {
          message: 'Bạn không có quyền thực hiện thao tác này.',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: true,
          traceId,
        };

      case 404:
        return {
          message: 'Dự án không tồn tại hoặc đã bị xóa.',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: true,
          isForbidden: false,
          traceId,
        };

      case 409:
        return {
          message: normalized.message || 'Dữ liệu bị xung đột. Vui lòng làm mới trang.',
          placement: 'dialog',
          retryable: false,
          isConflict: true,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 422:
        return {
          message: normalized.message || 'Dữ liệu xử lý không hợp lệ.',
          placement: 'form',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          fieldErrors,
          traceId,
        };

      default:
        break;
    }
  }

  // 3. Map High-Level ApiErrorKind Categories
  switch (normalized.kind) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return {
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.',
        placement: 'banner',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    case 'FORBIDDEN':
      return {
        message: 'Bạn không có quyền thực hiện thao tác này.',
        placement: 'dialog',
        retryable: false,
        isConflict: false,
        isNotFound: false,
        isForbidden: true,
        traceId,
      };

    case 'NOT_FOUND':
      return {
        message: 'Dự án không tồn tại hoặc đã bị xóa.',
        placement: 'dialog',
        retryable: false,
        isConflict: false,
        isNotFound: true,
        isForbidden: false,
        traceId,
      };

    case 'CONFLICT':
      return {
        message: 'Dữ liệu bị xung đột. Vui lòng làm mới trang.',
        placement: 'dialog',
        retryable: false,
        isConflict: true,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    case 'VALIDATION_ERROR':
      return {
        message: normalized.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
        placement: 'form',
        retryable: false,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        fieldErrors,
        traceId,
      };

    case 'SERVER_ERROR':
      return {
        message: 'Đã xảy ra lỗi trên hệ thống máy chủ. Vui lòng thử lại sau.',
        placement: 'dialog',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    default:
      return {
        message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
        placement: 'dialog',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };
  }
}
