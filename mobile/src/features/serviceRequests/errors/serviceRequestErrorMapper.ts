/**
 * Phase 16A: Presentation-Safe Service Request Error Mapper
 * Maps NormalizedApiError into standardized ServiceRequestPresentationError for UI display.
 * Strict Security Invariants:
 * - Never reflects internal stack traces or raw database exceptions.
 * - Handles optimistic lock conflict (HTTP 409 OPTIMISTIC_LOCK_CONFLICT) with reload flag.
 * - Maps Vietnamese user-friendly messages for service request validation, status transitions,
 *   assignments, and rating rules per Decision D-065 and 06_API_CONTRACT.md section 13.
 */

import { NormalizedApiError, normalizeError } from '../../../shared/api';

export type ServiceRequestErrorPlacement =
  | 'form'
  | 'dialog'
  | 'banner'
  | 'status'
  | 'assignments'
  | 'comments'
  | 'rating'
  | 'general';

export interface ServiceRequestPresentationError {
  message: string;
  placement: ServiceRequestErrorPlacement;
  retryable: boolean;
  isConflict: boolean;
  isNotFound: boolean;
  isForbidden: boolean;
  fieldErrors?: Record<string, string>;
  traceId?: string;
}

/**
 * Maps any caught error or NormalizedApiError into a presentation-safe ServiceRequestPresentationError.
 */
export function mapServiceRequestError(error: unknown): ServiceRequestPresentationError {
  const normalized: NormalizedApiError = normalizeError(error);
  const traceId = normalized.traceId;
  const fieldErrors = normalized.fieldErrors;

  // 1. Map explicit backend business error codes
  if (normalized.backendCode) {
    switch (normalized.backendCode) {
      case 'SERVICE_REQUEST_NOT_FOUND':
        return {
          message: 'Không tìm thấy yêu cầu dịch vụ',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: true,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_CATEGORY_NOT_FOUND':
        return {
          message: 'Không tìm thấy danh mục dịch vụ hoặc danh mục đã dừng hoạt động',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: true,
          isForbidden: false,
          traceId,
        };

      case 'OPTIMISTIC_LOCK_CONFLICT':
        return {
          message: 'Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.',
          placement: 'dialog',
          retryable: false,
          isConflict: true,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_STATUS_TRANSITION_INVALID':
        return {
          message: 'Chuyển trạng thái yêu cầu không hợp lệ',
          placement: 'status',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_RESOLUTION_REQUIRED':
        return {
          message: 'Vui lòng nhập giải pháp xử lý trước khi hoàn tất yêu cầu.',
          placement: 'status',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_ASSIGNEE_REQUIRED':
        return {
          message: 'Yêu cầu cần có người xử lý trước khi chuyển sang trạng thái đã phân công.',
          placement: 'status',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'INVALID_REQUEST_STATE':
        return {
          message: 'Chỉ có thể cập nhật yêu cầu khi yêu cầu đang ở trạng thái mở.',
          placement: 'banner',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_RESOLUTION_REJECTION_FORBIDDEN':
        return {
          message: 'Bạn không có quyền từ chối kết quả yêu cầu này',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: true,
          traceId,
        };

      case 'SERVICE_NOT_RESOLVED':
        return {
          message: 'Yêu cầu không còn ở trạng thái đã giải quyết',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_ALREADY_CLOSED':
        return {
          message: 'Yêu cầu dịch vụ đã đóng',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_ALREADY_CANCELLED':
        return {
          message: 'Yêu cầu dịch vụ đã bị hủy',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_ASSIGNMENT_CONFLICT':
        return {
          message: 'Yêu cầu dịch vụ đã được phân công cho người khác',
          placement: 'assignments',
          retryable: false,
          isConflict: true,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_RATING_FORBIDDEN':
        return {
          message: 'Chỉ người tạo yêu cầu mới có quyền đánh giá',
          placement: 'rating',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: true,
          traceId,
        };

      case 'SERVICE_NOT_CLOSED':
        return {
          message: 'Chỉ có thể đánh giá khi yêu cầu đã đóng',
          placement: 'rating',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'SERVICE_RATING_ALREADY_EXISTS':
        return {
          message: 'Yêu cầu này đã được đánh giá trước đó',
          placement: 'rating',
          retryable: false,
          isConflict: true,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'ASSET_ACCESS_DENIED':
        return {
          message: 'Bạn chỉ được gắn tài sản đang được cấp phát cho chính mình',
          placement: 'form',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: true,
          traceId,
        };

      case 'USER_INACTIVE':
        return {
          message: 'Người xử lý không còn ở trạng thái hoạt động',
          placement: 'assignments',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      default:
        // Other business codes fall through to category handling
        break;
    }
  }

  // 2. Map based on normalized error kind
  switch (normalized.kind) {
    case 'CONFLICT':
      return {
        message: 'Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.',
        placement: 'dialog',
        retryable: false,
        isConflict: true,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    case 'NOT_FOUND':
      return {
        message: 'Tài nguyên yêu cầu dịch vụ không tồn tại hoặc đã bị xóa.',
        placement: 'dialog',
        retryable: false,
        isConflict: false,
        isNotFound: true,
        isForbidden: false,
        traceId,
      };

    case 'FORBIDDEN':
      return {
        message: 'Bạn không có quyền thực hiện thao tác này trên yêu cầu dịch vụ.',
        placement: 'dialog',
        retryable: false,
        isConflict: false,
        isNotFound: false,
        isForbidden: true,
        traceId,
      };

    case 'UNAUTHORIZED':
      return {
        message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
        placement: 'dialog',
        retryable: false,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    case 'VALIDATION_ERROR':
      return {
        message: normalized.message || 'Dữ liệu yêu cầu dịch vụ không hợp lệ. Vui lòng kiểm tra lại.',
        placement: 'form',
        retryable: false,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        fieldErrors,
        traceId,
      };

    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return {
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
        placement: 'banner',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    case 'SERVER_ERROR':
      return {
        message: 'Hệ thống đang gặp sự cố khi xử lý yêu cầu dịch vụ. Vui lòng thử lại sau.',
        placement: 'dialog',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    default:
      return {
        message: 'Đã có lỗi xảy ra khi xử lý yêu cầu dịch vụ. Vui lòng thử lại.',
        placement: 'general',
        retryable: false,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };
  }
}
