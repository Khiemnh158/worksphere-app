/**
 * Phase 15A: Presentation-Safe Task Error Mapper
 * Maps NormalizedApiError into standardized TaskPresentationError for UI display.
 * Strict Security Invariants:
 * - Never reflects internal stack traces or raw database exceptions.
 * - Handles optimistic lock conflict (HTTP 409 OPTIMISTIC_LOCK_CONFLICT) with reload prompt.
 * - Maps Vietnamese user-friendly messages for task validation, status transitions, and assignment rules.
 */

import { NormalizedApiError, normalizeError } from '../../../shared/api';

export type TaskErrorPlacement =
  | 'form'
  | 'dialog'
  | 'banner'
  | 'status'
  | 'assignments'
  | 'subtasks'
  | 'comments'
  | 'general';

export interface TaskPresentationError {
  message: string;
  placement: TaskErrorPlacement;
  retryable: boolean;
  isConflict: boolean;
  isNotFound: boolean;
  isForbidden: boolean;
  fieldErrors?: Record<string, string>;
  traceId?: string;
}

/**
 * Maps any caught error or NormalizedApiError into a presentation-safe TaskPresentationError.
 */
export function mapTaskError(error: unknown): TaskPresentationError {
  const normalized: NormalizedApiError = normalizeError(error);
  const traceId = normalized.traceId;
  const fieldErrors = normalized.fieldErrors;

  // 1. Map explicit backend business error codes
  if (normalized.backendCode) {
    switch (normalized.backendCode) {
      case 'TASK_NOT_FOUND':
        return {
          message: 'Công việc không tồn tại hoặc đã bị xóa.',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: true,
          isForbidden: false,
          traceId,
        };

      case 'TASK_TERMINAL_STATE':
        return {
          message: 'Công việc đã ở trạng thái kết thúc, không thể chỉnh sửa.',
          placement: 'banner',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'TASK_INVALID_STATUS_TRANSITION':
        return {
          message: 'Không thể chuyển trạng thái công việc theo luồng này.',
          placement: 'status',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'TASK_CANNOT_DELETE_HAS_HISTORY':
        return {
          message:
            'Không thể xóa công việc đã có lịch sử thay đổi trạng thái. Vui lòng chuyển sang trạng thái hủy.',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'TASK_PROJECT_NOT_ACTIVE':
        return {
          message: 'Chỉ có thể tạo hoặc cập nhật công việc cho dự án đang hoạt động.',
          placement: 'banner',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'TASK_PARENT_CYCLE_DETECTED':
        return {
          message: 'Công việc không thể làm cha của chính nó hoặc gây vòng lặp phân cấp.',
          placement: 'form',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          fieldErrors,
          traceId,
        };

      case 'TASK_PARENT_PROJECT_MISMATCH':
        return {
          message: 'Công việc cha và công việc con phải thuộc cùng một dự án.',
          placement: 'form',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          fieldErrors,
          traceId,
        };

      case 'TASK_ASSIGNEE_NOT_PROJECT_MEMBER':
        return {
          message: 'Người dùng được chọn không phải là thành viên hoạt động của dự án.',
          placement: 'assignments',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          fieldErrors,
          traceId,
        };

      case 'TASK_ALREADY_ASSIGNED':
        return {
          message: 'Người dùng đã được phân công công việc này.',
          placement: 'assignments',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'TASK_INVALID_PROGRESS':
        return {
          message: 'Tiến độ công việc phải nằm trong khoảng từ 0% đến 100%.',
          placement: 'form',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          fieldErrors,
          traceId,
        };

      case 'TASK_DATE_RANGE_INVALID':
        return {
          message: 'Ngày bắt đầu không được sau ngày đến hạn.',
          placement: 'form',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: false,
          fieldErrors,
          traceId,
        };

      case 'ASSIGNMENT_NOT_FOUND':
        return {
          message: 'Phân công công việc không tồn tại hoặc đã bị gỡ trước đó.',
          placement: 'assignments',
          retryable: false,
          isConflict: false,
          isNotFound: true,
          isForbidden: false,
          traceId,
        };

      case 'OPTIMISTIC_LOCK_CONFLICT':
        return {
          message:
            'Dữ liệu công việc đã bị cập nhật bởi người khác. Vui lòng tải lại phiên bản mới nhất.',
          placement: 'dialog',
          retryable: false,
          isConflict: true,
          isNotFound: false,
          isForbidden: false,
          traceId,
        };

      case 'FORBIDDEN':
      case 'ACCESS_DENIED':
        return {
          message: 'Bạn không có quyền thực hiện thao tác này.',
          placement: 'dialog',
          retryable: false,
          isConflict: false,
          isNotFound: false,
          isForbidden: true,
          traceId,
        };

      case 'VALIDATION_ERROR':
        return {
          message: 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.',
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

  // 2. Map normalized error kinds
  switch (normalized.kind) {
    case 'NETWORK_ERROR':
      return {
        message: 'Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền.',
        placement: 'general',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    case 'TIMEOUT':
      return {
        message: 'Kết nối quá thời gian chờ. Vui lòng thử lại.',
        placement: 'general',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
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
        message: 'Không tìm thấy thông tin công việc yêu cầu.',
        placement: 'dialog',
        retryable: false,
        isConflict: false,
        isNotFound: true,
        isForbidden: false,
        traceId,
      };

    case 'CONFLICT':
      return {
        message:
          'Dữ liệu công việc đã bị cập nhật bởi người khác. Vui lòng tải lại phiên bản mới nhất.',
        placement: 'dialog',
        retryable: false,
        isConflict: true,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    case 'VALIDATION_ERROR':
      return {
        message: 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.',
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
        message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
        placement: 'general',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
        traceId,
      };

    default:
      break;
  }

  // 3. Fallback for unknown error
  return {
    message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
    placement: 'general',
    retryable: true,
    isConflict: false,
    isNotFound: false,
    isForbidden: false,
    traceId,
  };
}
