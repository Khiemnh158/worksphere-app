import { isApiResponse, isApiErrorEnvelope, unwrapApiResponse } from '../../src/shared/api/apiEnvelope';
import { ApiResponse } from '../../src/shared/api/apiTypes';

describe('ApiEnvelope', () => {
  test('isApiResponse validates valid response envelope structure', () => {
    const validEnvelope: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: 'item-1' },
      timestamp: '2026-10-17T12:00:00Z',
    };
    expect(isApiResponse(validEnvelope)).toBe(true);

    expect(isApiResponse(null)).toBe(false);
    expect(isApiResponse('not an object')).toBe(false);
    expect(isApiResponse({ success: 'yes' })).toBe(false);

    // Backend omits data when null due to @JsonInclude(JsonInclude.Include.NON_NULL)
    expect(isApiResponse({ success: false, timestamp: '2026-10-17T12:00:00Z', message: 'Error' })).toBe(true);
  });

  test('isApiErrorEnvelope identifies failed API response envelopes', () => {
    const errorEnvelope: ApiResponse<null> = {
      success: false,
      data: null,
      code: 'RESOURCE_NOT_FOUND',
      message: 'Không tìm thấy tài nguyên',
      timestamp: '2026-10-17T12:00:00Z',
    };
    expect(isApiErrorEnvelope(errorEnvelope)).toBe(true);

    const successEnvelope: ApiResponse<string> = {
      success: true,
      data: 'ok',
      timestamp: '2026-10-17T12:00:00Z',
    };
    expect(isApiErrorEnvelope(successEnvelope)).toBe(false);
  });

  test('unwrapApiResponse returns data payload on success', () => {
    const envelope: ApiResponse<{ name: string }> = {
      success: true,
      data: { name: 'WorkSphere Mobile' },
      timestamp: '2026-10-17T12:00:00Z',
    };
    expect(unwrapApiResponse(envelope)).toEqual({ name: 'WorkSphere Mobile' });
  });

  test('unwrapApiResponse supports null data payload when operation permits', () => {
    const envelope: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Thành công',
      timestamp: '2026-10-17T12:00:00Z',
    };
    expect(unwrapApiResponse(envelope)).toBeNull();
  });

  test('unwrapApiResponse throws on failure envelope and preserves metadata', () => {
    const failureEnvelope: ApiResponse<null> = {
      success: false,
      data: null,
      code: 'TASK_LOCKED',
      message: 'Công việc đang bị khóa',
      traceId: 'TRACE-001',
      fieldErrors: { status: 'Invalid transition' },
      timestamp: '2026-10-17T12:00:00Z',
    };

    expect(() => unwrapApiResponse(failureEnvelope)).toThrow('Công việc đang bị khóa');

    try {
      unwrapApiResponse(failureEnvelope);
    } catch (err: any) {
      expect(err.backendCode).toBe('TASK_LOCKED');
      expect(err.traceId).toBe('TRACE-001');
      expect(err.fieldErrors).toEqual({ status: 'Invalid transition' });
    }
  });

  test('unwrapApiResponse throws if input is malformed or null', () => {
    expect(() => unwrapApiResponse(null as any)).toThrow(/Malformed API response/);
  });
});
