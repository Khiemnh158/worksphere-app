import { mapTaskError } from '../../src/features/tasks/errors/taskErrorMapper';
import { NormalizedApiError } from '../../src/shared/api';

describe('Task Error Mapper (mapTaskError)', () => {
  it('maps TASK_NOT_FOUND to dialog placement with isNotFound=true', () => {
    const error: NormalizedApiError = {
      kind: 'NOT_FOUND',
      backendCode: 'TASK_NOT_FOUND',
      status: 404,
      message: 'Raw task not found error',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Công việc không tồn tại hoặc đã bị xóa.');
    expect(result.placement).toBe('dialog');
    expect(result.isNotFound).toBe(true);
    expect(result.retryable).toBe(false);
  });

  it('maps OPTIMISTIC_LOCK_CONFLICT to dialog with isConflict=true without relying on message string', () => {
    const error: NormalizedApiError = {
      kind: 'CONFLICT',
      backendCode: 'OPTIMISTIC_LOCK_CONFLICT',
      status: 409,
      message: 'Row was updated or deleted by another transaction',
    };

    const result = mapTaskError(error);

    expect(result.isConflict).toBe(true);
    expect(result.placement).toBe('dialog');
    expect(result.message).toContain('Vui lòng tải lại phiên bản mới nhất');
    expect(result.retryable).toBe(false);
  });

  it('maps TASK_TERMINAL_STATE to banner placement with safe message', () => {
    const error: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      backendCode: 'TASK_TERMINAL_STATE',
      status: 422,
      message: 'Terminal state',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Công việc đã ở trạng thái kết thúc, không thể chỉnh sửa.');
    expect(result.placement).toBe('banner');
    expect(result.retryable).toBe(false);
  });

  it('maps TASK_INVALID_STATUS_TRANSITION to status placement', () => {
    const error: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      backendCode: 'TASK_INVALID_STATUS_TRANSITION',
      status: 422,
      message: 'Cannot transition',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Không thể chuyển trạng thái công việc theo luồng này.');
    expect(result.placement).toBe('status');
  });

  it('maps TASK_CANNOT_DELETE_HAS_HISTORY to dialog placement', () => {
    const error: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      backendCode: 'TASK_CANNOT_DELETE_HAS_HISTORY',
      status: 422,
      message: 'Cannot delete with history',
    };

    const result = mapTaskError(error);

    expect(result.message).toContain('Không thể xóa công việc đã có lịch sử thay đổi trạng thái');
    expect(result.placement).toBe('dialog');
  });

  it('maps TASK_ASSIGNEE_NOT_PROJECT_MEMBER to assignments placement with fieldErrors', () => {
    const error: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      backendCode: 'TASK_ASSIGNEE_NOT_PROJECT_MEMBER',
      status: 422,
      fieldErrors: { assigneeIds: 'Invalid member' },
      message: 'Not a member',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Người dùng được chọn không phải là thành viên hoạt động của dự án.');
    expect(result.placement).toBe('assignments');
    expect(result.fieldErrors).toEqual({ assigneeIds: 'Invalid member' });
  });

  it('maps TASK_ALREADY_ASSIGNED to assignments placement', () => {
    const error: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      backendCode: 'TASK_ALREADY_ASSIGNED',
      status: 422,
      message: 'Already assigned',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Người dùng đã được phân công công việc này.');
    expect(result.placement).toBe('assignments');
  });

  it('maps TASK_PARENT_CYCLE_DETECTED to form placement', () => {
    const error: NormalizedApiError = {
      kind: 'VALIDATION_ERROR',
      backendCode: 'TASK_PARENT_CYCLE_DETECTED',
      status: 422,
      message: 'Cycle detected',
    };

    const result = mapTaskError(error);

    expect(result.message).toContain('Công việc không thể làm cha của chính nó');
    expect(result.placement).toBe('form');
  });

  it('maps TASK_INVALID_PROGRESS and TASK_DATE_RANGE_INVALID to form placement', () => {
    const progressError = mapTaskError({
      kind: 'VALIDATION_ERROR',
      backendCode: 'TASK_INVALID_PROGRESS',
      status: 422,
      message: 'Invalid progress',
    });
    expect(progressError.message).toBe('Tiến độ công việc phải nằm trong khoảng từ 0% đến 100%.');
    expect(progressError.placement).toBe('form');

    const dateError = mapTaskError({
      kind: 'VALIDATION_ERROR',
      backendCode: 'TASK_DATE_RANGE_INVALID',
      status: 422,
      message: 'Date range invalid',
    });
    expect(dateError.message).toBe('Ngày bắt đầu không được sau ngày đến hạn.');
    expect(dateError.placement).toBe('form');
  });

  it('maps ASSIGNMENT_NOT_FOUND to assignments placement with isNotFound=true', () => {
    const error: NormalizedApiError = {
      kind: 'NOT_FOUND',
      backendCode: 'ASSIGNMENT_NOT_FOUND',
      status: 404,
      message: 'Assignment not found',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Phân công công việc không tồn tại hoặc đã bị gỡ trước đó.');
    expect(result.placement).toBe('assignments');
    expect(result.isNotFound).toBe(true);
  });

  it('maps FORBIDDEN to dialog with isForbidden=true', () => {
    const error: NormalizedApiError = {
      kind: 'FORBIDDEN',
      backendCode: 'FORBIDDEN',
      status: 403,
      message: 'Forbidden',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Bạn không có quyền thực hiện thao tác này.');
    expect(result.placement).toBe('dialog');
    expect(result.isForbidden).toBe(true);
  });

  it('maps network errors as retryable', () => {
    const error: NormalizedApiError = {
      kind: 'NETWORK_ERROR',
      message: 'Network error',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền.');
    expect(result.retryable).toBe(true);
    expect(result.placement).toBe('general');
  });

  it('maps timeout errors as retryable', () => {
    const error: NormalizedApiError = {
      kind: 'TIMEOUT',
      message: 'timeout of 10000ms exceeded',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Kết nối quá thời gian chờ. Vui lòng thử lại.');
    expect(result.retryable).toBe(true);
    expect(result.placement).toBe('general');
  });

  it('maps HTTP 500 server error as retryable and suppresses raw SQL or stack traces', () => {
    const error: NormalizedApiError = {
      kind: 'SERVER_ERROR',
      status: 500,
      message: 'Internal server error: PSQLException: relation does not exist at ...',
    };

    const result = mapTaskError(error);

    expect(result.message).toBe('Hệ thống đang gặp sự cố. Vui lòng thử lại sau.');
    expect(result.message).not.toContain('PSQLException');
    expect(result.retryable).toBe(true);
    expect(result.placement).toBe('general');
  });

  it('provides safe fallback for unknown error', () => {
    const result = mapTaskError(new Error('Unknown crash'));

    expect(result.message).toBe('Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
    expect(result.retryable).toBe(true);
  });
});
