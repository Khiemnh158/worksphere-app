import { mapProjectError } from '../../src/features/projects/errors/projectErrorMapper';
import { NormalizedApiError } from '../../src/shared/api';

describe('Project Error Mapper (mapProjectError)', () => {
  it('maps PROJECT_NOT_FOUND code to safe message and notFound flag', () => {
    const error: NormalizedApiError = {
      kind: 'NOT_FOUND',
      message: 'Project not found with id 123',
      status: 404,
      backendCode: 'PROJECT_NOT_FOUND',
      traceId: 'trace-123',
    };

    const result = mapProjectError(error);

    expect(result.message).toBe('Dự án không tồn tại hoặc đã bị xóa.');
    expect(result.placement).toBe('dialog');
    expect(result.isNotFound).toBe(true);
    expect(result.retryable).toBe(false);
    expect(result.traceId).toBe('trace-123');
  });

  it('maps OPTIMISTIC_LOCK_CONFLICT code to reload prompt and conflict flag', () => {
    const error: NormalizedApiError = {
      kind: 'CONFLICT',
      message: 'Optimistic lock conflict on Project',
      status: 409,
      backendCode: 'OPTIMISTIC_LOCK_CONFLICT',
    };

    const result = mapProjectError(error);

    expect(result.message).toBe(
      'Dữ liệu đã bị cập nhật bởi người khác. Vui lòng tải lại phiên bản mới nhất.'
    );
    expect(result.placement).toBe('dialog');
    expect(result.isConflict).toBe(true);
    expect(result.retryable).toBe(false);
  });

  it('maps PROJECT_CODE_ALREADY_EXISTS code with field errors', () => {
    const error: NormalizedApiError = {
      kind: 'CONFLICT',
      message: 'Code exists',
      status: 409,
      backendCode: 'PROJECT_CODE_ALREADY_EXISTS',
      fieldErrors: { code: 'Mã dự án đã tồn tại' },
    };

    const result = mapProjectError(error);

    expect(result.message).toBe('Mã dự án đã tồn tại trên hệ thống.');
    expect(result.placement).toBe('form');
    expect(result.isConflict).toBe(true);
    expect(result.fieldErrors).toEqual({ code: 'Mã dự án đã tồn tại' });
  });

  it('maps PROJECT_MANAGER_REQUIRED (D-013 invariant) correctly', () => {
    const error: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      message: 'Cannot remove sole PM',
      status: 422,
      backendCode: 'PROJECT_MANAGER_REQUIRED',
    };

    const result = mapProjectError(error);

    expect(result.message).toBe(
      'Không thể xóa hoặc thay đổi vai trò của Project Manager duy nhất của dự án.'
    );
    expect(result.placement).toBe('members');
    expect(result.retryable).toBe(false);
  });

  it('maps status transition errors correctly', () => {
    const invalidTransition: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      message: 'Invalid transition',
      status: 422,
      backendCode: 'PROJECT_STATUS_TRANSITION_INVALID',
    };
    expect(mapProjectError(invalidTransition).message).toBe(
      'Chuyển đổi trạng thái dự án không hợp lệ.'
    );

    const completed: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      message: 'Completed',
      status: 422,
      backendCode: 'PROJECT_ALREADY_COMPLETED',
    };
    expect(mapProjectError(completed).message).toBe(
      'Dự án đã hoàn thành, không thể thay đổi trạng thái.'
    );

    const cancelled: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      message: 'Cancelled',
      status: 422,
      backendCode: 'PROJECT_ALREADY_CANCELLED',
    };
    expect(mapProjectError(cancelled).message).toBe(
      'Dự án đã bị hủy, không thể thay đổi trạng thái.'
    );
  });

  it('maps PROJECT_MEMBER_ALREADY_EXISTS and PROJECT_NOT_ACTIVE', () => {
    const memberExists: NormalizedApiError = {
      kind: 'CONFLICT',
      message: 'Member exists',
      status: 409,
      backendCode: 'PROJECT_MEMBER_ALREADY_EXISTS',
    };
    const memberRes = mapProjectError(memberExists);
    expect(memberRes.message).toBe('Người dùng đã là thành viên của dự án.');
    expect(memberRes.placement).toBe('members');

    const notActive: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      message: 'Not active',
      status: 422,
      backendCode: 'PROJECT_NOT_ACTIVE',
    };
    const notActiveRes = mapProjectError(notActive);
    expect(notActiveRes.message).toBe('Dự án không ở trạng thái hoạt động.');
    expect(notActiveRes.placement).toBe('banner');
  });

  it('maps HTTP 403 Forbidden correctly', () => {
    const forbidden: NormalizedApiError = {
      kind: 'FORBIDDEN',
      message: 'Access Denied',
      status: 403,
    };

    const result = mapProjectError(forbidden);

    expect(result.message).toBe('Bạn không có quyền thực hiện thao tác này.');
    expect(result.isForbidden).toBe(true);
    expect(result.placement).toBe('dialog');
  });

  it('maps network errors with retryable banner', () => {
    const networkError: NormalizedApiError = {
      kind: 'NETWORK_ERROR',
      message: 'Network Error',
    };

    const result = mapProjectError(networkError);

    expect(result.message).toBe('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.');
    expect(result.placement).toBe('banner');
    expect(result.retryable).toBe(true);
  });

  it('maps unexpected raw error safely without leaking internal stack', () => {
    const rawError = new Error('Database column "secret_col" missing in SQL statement');

    const result = mapProjectError(rawError);

    expect(result.message).not.toContain('secret_col');
    expect(result.placement).toBe('dialog');
  });
});
