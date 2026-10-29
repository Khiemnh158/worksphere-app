import { AxiosError, AxiosResponse } from 'axios';
import { normalizeError, isNormalizedApiError } from '../../src/shared/api/apiError';
import { ApiResponse } from '../../src/shared/api/apiTypes';

describe('ApiError Normalization', () => {
  function createAxiosError(
    status?: number,
    data?: ApiResponse<null>,
    code?: string,
    message: string = 'Request failed'
  ): AxiosError {
    const error = new AxiosError(message, code) as AxiosError;
    if (status) {
      error.response = {
        status,
        data,
        statusText: 'Error',
        headers: {},
        config: {} as any,
      } as AxiosResponse;
    }
    return error;
  }

  test('maps network connection failure (no response) to NETWORK_ERROR', () => {
    const error = createAxiosError(undefined, undefined, 'ERR_NETWORK', 'Network Error');
    const normalized = normalizeError(error);

    expect(normalized.kind).toBe('NETWORK_ERROR');
    expect(normalized.message).toContain('Không thể kết nối');
  });

  test('maps timeout failure (ECONNABORTED) to TIMEOUT', () => {
    const error = createAxiosError(undefined, undefined, 'ECONNABORTED', 'timeout of 15000ms exceeded');
    const normalized = normalizeError(error);

    expect(normalized.kind).toBe('TIMEOUT');
    expect(normalized.message).toContain('quá thời gian chờ');
  });

  test('maps 401 response to UNAUTHORIZED and extracts backend message', () => {
    const envelope: ApiResponse<null> = {
      success: false,
      data: null,
      code: 'AUTH_TOKEN_EXPIRED',
      message: 'Token đã hết hạn',
      traceId: 'TRACE-401',
      timestamp: '2026-10-17T12:00:00Z',
    };
    const error = createAxiosError(401, envelope);
    const normalized = normalizeError(error);

    expect(normalized.kind).toBe('UNAUTHORIZED');
    expect(normalized.status).toBe(401);
    expect(normalized.backendCode).toBe('AUTH_TOKEN_EXPIRED');
    expect(normalized.traceId).toBe('TRACE-401');
    expect(normalized.message).toBe('Token đã hết hạn');
  });

  test('maps 403 response to FORBIDDEN', () => {
    const error = createAxiosError(403);
    const normalized = normalizeError(error);

    expect(normalized.kind).toBe('FORBIDDEN');
    expect(normalized.status).toBe(403);
  });

  test('maps 404 response to NOT_FOUND', () => {
    const error = createAxiosError(404);
    const normalized = normalizeError(error);

    expect(normalized.kind).toBe('NOT_FOUND');
    expect(normalized.status).toBe(404);
  });

  test('maps 409 response to CONFLICT', () => {
    const error = createAxiosError(409);
    const normalized = normalizeError(error);

    expect(normalized.kind).toBe('CONFLICT');
    expect(normalized.status).toBe(409);
  });

  test('maps 400 validation error with fieldErrors to VALIDATION_ERROR', () => {
    const envelope: ApiResponse<null> = {
      success: false,
      data: null,
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu không hợp lệ',
      fieldErrors: { email: 'Email không đúng định dạng', password: 'Quá ngắn' },
      timestamp: '2026-10-17T12:00:00Z',
    };
    const error = createAxiosError(400, envelope);
    const normalized = normalizeError(error);

    expect(normalized.kind).toBe('VALIDATION_ERROR');
    expect(normalized.status).toBe(400);
    expect(normalized.fieldErrors).toEqual({
      email: 'Email không đúng định dạng',
      password: 'Quá ngắn',
    });
  });

  test('maps 500 response to SERVER_ERROR without leaking raw details', () => {
    const error = createAxiosError(500);
    const normalized = normalizeError(error);

    expect(normalized.kind).toBe('SERVER_ERROR');
    expect(normalized.status).toBe(500);
    expect(normalized.message).toContain('Hệ thống máy chủ');
  });

  test('isNormalizedApiError identifies valid normalized error objects', () => {
    const normalized = normalizeError(new Error('Simple error'));
    expect(isNormalizedApiError(normalized)).toBe(true);
    expect(isNormalizedApiError({ kind: 'INVALID', message: 'test' })).toBe(false);
    expect(isNormalizedApiError(null)).toBe(false);
  });
});
