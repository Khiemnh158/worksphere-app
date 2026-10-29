import {
  mapServiceRequestError,
} from '../../src/features/serviceRequests/errors/serviceRequestErrorMapper';
import { NormalizedApiError } from '../../src/shared/api';

describe('Service Request Error Mapper (mapServiceRequestError)', () => {
  describe('Specific Backend Business Codes', () => {
    it('maps SERVICE_REQUEST_NOT_FOUND to dialog with isNotFound=true', () => {
      const error: NormalizedApiError = {
        kind: 'NOT_FOUND',
        backendCode: 'SERVICE_REQUEST_NOT_FOUND',
        status: 404,
        message: 'Raw error',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Không tìm thấy yêu cầu dịch vụ');
      expect(result.placement).toBe('dialog');
      expect(result.isNotFound).toBe(true);
      expect(result.retryable).toBe(false);
    });

    it('maps SERVICE_CATEGORY_NOT_FOUND to dialog with isNotFound=true', () => {
      const error: NormalizedApiError = {
        kind: 'NOT_FOUND',
        backendCode: 'SERVICE_CATEGORY_NOT_FOUND',
        status: 404,
        message: 'Category missing',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Không tìm thấy danh mục dịch vụ hoặc danh mục đã dừng hoạt động');
      expect(result.placement).toBe('dialog');
      expect(result.isNotFound).toBe(true);
    });

    it('maps OPTIMISTIC_LOCK_CONFLICT to dialog with isConflict=true', () => {
      const error: NormalizedApiError = {
        kind: 'CONFLICT',
        backendCode: 'OPTIMISTIC_LOCK_CONFLICT',
        status: 409,
        message: 'Row was updated by another transaction',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.');
      expect(result.placement).toBe('dialog');
      expect(result.isConflict).toBe(true);
      expect(result.retryable).toBe(false);
    });

    it('maps SERVICE_STATUS_TRANSITION_INVALID to status placement', () => {
      const error: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'SERVICE_STATUS_TRANSITION_INVALID',
        status: 400,
        message: 'Invalid transition',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Chuyển trạng thái yêu cầu không hợp lệ');
      expect(result.placement).toBe('status');
      expect(result.retryable).toBe(false);
    });

    it('maps SERVICE_RESOLUTION_REQUIRED to status placement', () => {
      const error: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'SERVICE_RESOLUTION_REQUIRED',
        status: 400,
        message: 'Cần cập nhật giải pháp xử lý khi hoàn tất yêu cầu',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Vui lòng nhập giải pháp xử lý trước khi hoàn tất yêu cầu.');
      expect(result.placement).toBe('status');
      expect(result.retryable).toBe(false);
    });

    it('maps SERVICE_ASSIGNEE_REQUIRED to status placement', () => {
      const error: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'SERVICE_ASSIGNEE_REQUIRED',
        status: 400,
        message: 'Yêu cầu cần có người xử lý trước khi chuyển sang trạng thái ASSIGNED',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Yêu cầu cần có người xử lý trước khi chuyển sang trạng thái đã phân công.');
      expect(result.placement).toBe('status');
      expect(result.retryable).toBe(false);
    });

    it('maps INVALID_REQUEST_STATE to banner placement', () => {
      const error: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'INVALID_REQUEST_STATE',
        status: 400,
        message: 'Chỉ có thể cập nhật yêu cầu khi ở trạng thái OPEN',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Chỉ có thể cập nhật yêu cầu khi yêu cầu đang ở trạng thái mở.');
      expect(result.placement).toBe('banner');
      expect(result.retryable).toBe(false);
    });

    it('treats phantom SERVICE_RESOLUTION_COMMENT_REQUIRED as unknown and falls back to safe generic validation', () => {
      const error: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'SERVICE_RESOLUTION_COMMENT_REQUIRED',
        status: 400,
        message: 'Internal exception raw text',
      };

      const result = mapServiceRequestError(error);

      // Must not receive specialized placement="status"
      expect(result.placement).toBe('form');
      // Uses normalized fallback without exposing unverified specialized message
      expect(result.message).toBe('Internal exception raw text');
    });

    it('maps SERVICE_RESOLUTION_REJECTION_FORBIDDEN to dialog with isForbidden=true', () => {
      const error: NormalizedApiError = {
        kind: 'FORBIDDEN',
        backendCode: 'SERVICE_RESOLUTION_REJECTION_FORBIDDEN',
        status: 403,
        message: 'Rejection forbidden',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Bạn không có quyền từ chối kết quả yêu cầu này');
      expect(result.placement).toBe('dialog');
      expect(result.isForbidden).toBe(true);
    });

    it('maps SERVICE_NOT_RESOLVED to dialog', () => {
      const error: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        backendCode: 'SERVICE_NOT_RESOLVED',
        status: 400,
        message: 'Not resolved',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Yêu cầu không còn ở trạng thái đã giải quyết');
      expect(result.placement).toBe('dialog');
    });

    it('maps SERVICE_ALREADY_CLOSED and SERVICE_ALREADY_CANCELLED to dialog', () => {
      const closed = mapServiceRequestError({
        kind: 'VALIDATION_ERROR',
        backendCode: 'SERVICE_ALREADY_CLOSED',
        status: 400,
        message: 'Closed',
      });
      expect(closed.message).toBe('Yêu cầu dịch vụ đã đóng');
      expect(closed.placement).toBe('dialog');

      const cancelled = mapServiceRequestError({
        kind: 'VALIDATION_ERROR',
        backendCode: 'SERVICE_ALREADY_CANCELLED',
        status: 400,
        message: 'Cancelled',
      });
      expect(cancelled.message).toBe('Yêu cầu dịch vụ đã bị hủy');
      expect(cancelled.placement).toBe('dialog');
    });

    it('maps SERVICE_ASSIGNMENT_CONFLICT to assignments placement with isConflict=true', () => {
      const error: NormalizedApiError = {
        kind: 'CONFLICT',
        backendCode: 'SERVICE_ASSIGNMENT_CONFLICT',
        status: 409,
        message: 'Assignment conflict',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Yêu cầu dịch vụ đã được phân công cho người khác');
      expect(result.placement).toBe('assignments');
      expect(result.isConflict).toBe(true);
    });

    it('maps rating error codes correctly', () => {
      const ratingForbidden = mapServiceRequestError({
        kind: 'FORBIDDEN',
        backendCode: 'SERVICE_RATING_FORBIDDEN',
        status: 403,
        message: 'Rating forbidden',
      });
      expect(ratingForbidden.message).toBe('Chỉ người tạo yêu cầu mới có quyền đánh giá');
      expect(ratingForbidden.placement).toBe('rating');
      expect(ratingForbidden.isForbidden).toBe(true);

      const notClosed = mapServiceRequestError({
        kind: 'VALIDATION_ERROR',
        backendCode: 'SERVICE_NOT_CLOSED',
        status: 400,
        message: 'Not closed',
      });
      expect(notClosed.message).toBe('Chỉ có thể đánh giá khi yêu cầu đã đóng');
      expect(notClosed.placement).toBe('rating');

      const ratingExists = mapServiceRequestError({
        kind: 'CONFLICT',
        backendCode: 'SERVICE_RATING_ALREADY_EXISTS',
        status: 409,
        message: 'Rating exists',
      });
      expect(ratingExists.message).toBe('Yêu cầu này đã được đánh giá trước đó');
      expect(ratingExists.placement).toBe('rating');
      expect(ratingExists.isConflict).toBe(true);
    });

    it('maps ASSET_ACCESS_DENIED and USER_INACTIVE correctly', () => {
      const assetDenied = mapServiceRequestError({
        kind: 'FORBIDDEN',
        backendCode: 'ASSET_ACCESS_DENIED',
        status: 403,
        message: 'Asset denied',
      });
      expect(assetDenied.message).toBe('Bạn chỉ được gắn tài sản đang được cấp phát cho chính mình');
      expect(assetDenied.placement).toBe('form');
      expect(assetDenied.isForbidden).toBe(true);

      const userInactive = mapServiceRequestError({
        kind: 'VALIDATION_ERROR',
        backendCode: 'USER_INACTIVE',
        status: 400,
        message: 'Inactive user',
      });
      expect(userInactive.message).toBe('Người xử lý không còn ở trạng thái hoạt động');
      expect(userInactive.placement).toBe('assignments');
    });
  });

  describe('Normalized Kind Fallbacks', () => {
    it('maps generic CONFLICT to dialog with isConflict=true', () => {
      const error: NormalizedApiError = {
        kind: 'CONFLICT',
        status: 409,
        message: 'Conflict',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.');
      expect(result.placement).toBe('dialog');
      expect(result.isConflict).toBe(true);
    });

    it('maps generic NOT_FOUND to dialog with isNotFound=true', () => {
      const error: NormalizedApiError = {
        kind: 'NOT_FOUND',
        status: 404,
        message: 'Not found',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Tài nguyên yêu cầu dịch vụ không tồn tại hoặc đã bị xóa.');
      expect(result.placement).toBe('dialog');
      expect(result.isNotFound).toBe(true);
    });

    it('maps FORBIDDEN to dialog with isForbidden=true', () => {
      const error: NormalizedApiError = {
        kind: 'FORBIDDEN',
        status: 403,
        message: 'Access denied',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Bạn không có quyền thực hiện thao tác này trên yêu cầu dịch vụ.');
      expect(result.placement).toBe('dialog');
      expect(result.isForbidden).toBe(true);
    });

    it('maps UNAUTHORIZED to dialog', () => {
      const error: NormalizedApiError = {
        kind: 'UNAUTHORIZED',
        status: 401,
        message: 'Unauthorized',
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
      expect(result.placement).toBe('dialog');
    });

    it('maps VALIDATION_ERROR with fieldErrors to form placement', () => {
      const error: NormalizedApiError = {
        kind: 'VALIDATION_ERROR',
        status: 400,
        message: 'Validation failed',
        fieldErrors: {
          title: 'Tiêu đề không được để trống',
          description: 'Mô tả không được để trống',
        },
      };

      const result = mapServiceRequestError(error);

      expect(result.message).toBe('Validation failed');
      expect(result.placement).toBe('form');
      expect(result.fieldErrors).toEqual({
        title: 'Tiêu đề không được để trống',
        description: 'Mô tả không được để trống',
      });
    });

    it('maps NETWORK_ERROR and TIMEOUT_ERROR to banner placement with retryable=true', () => {
      const netError: NormalizedApiError = {
        kind: 'NETWORK_ERROR',
        message: 'Network offline',
      };

      const result = mapServiceRequestError(netError);

      expect(result.message).toBe('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      expect(result.placement).toBe('banner');
      expect(result.retryable).toBe(true);
    });

    it('maps SERVER_ERROR to dialog with retryable=true', () => {
      const srvError: NormalizedApiError = {
        kind: 'SERVER_ERROR',
        status: 500,
        message: 'Internal server error',
      };

      const result = mapServiceRequestError(srvError);

      expect(result.message).toBe('Hệ thống đang gặp sự cố khi xử lý yêu cầu dịch vụ. Vui lòng thử lại sau.');
      expect(result.placement).toBe('dialog');
      expect(result.retryable).toBe(true);
    });

    it('preserves traceId across all mapped errors', () => {
      const error: NormalizedApiError = {
        kind: 'SERVER_ERROR',
        status: 500,
        message: 'Error',
        traceId: 'trace-xyz-123',
      };

      const result = mapServiceRequestError(error);

      expect(result.traceId).toBe('trace-xyz-123');
    });
  });
});
