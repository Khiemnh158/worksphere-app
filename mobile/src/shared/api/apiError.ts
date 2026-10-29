import axios from 'axios';
import { ApiErrorKind, NormalizedApiError } from './apiTypes';
import { isApiResponse } from './apiEnvelope';

/**
 * Normalizes any caught error (Axios, Network, Runtime, or Backend envelope) into NormalizedApiError.
 * Ensures security: tokens, passwords, raw stack traces, and internal SQL details are never exposed.
 */
export function normalizeError(error: unknown): NormalizedApiError {
  // If already normalized, return as is
  if (isNormalizedApiError(error)) {
    return error;
  }

  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    let backendCode: string | undefined;
    let traceId: string | undefined;
    let fieldErrors: Record<string, string> | undefined;
    let envelopeMessage: string | undefined;

    if (isApiResponse(responseData)) {
      backendCode = responseData.code ?? undefined;
      traceId = responseData.traceId ?? undefined;
      envelopeMessage = responseData.message ?? undefined;
      if (responseData.fieldErrors && typeof responseData.fieldErrors === 'object') {
        fieldErrors = responseData.fieldErrors as Record<string, string>;
      }
    }

    // Network disconnection / No response received
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        return {
          kind: 'TIMEOUT',
          message: 'Kết nối mạng quá thời gian chờ. Vui lòng kiểm tra lại đường truyền và thử lại.',
        };
      }
      return {
        kind: 'NETWORK_ERROR',
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
      };
    }

    // Categorization by HTTP Status
    switch (status) {
      case 401:
        return {
          kind: 'UNAUTHORIZED',
          status: 401,
          backendCode,
          traceId,
          message: envelopeMessage || 'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
        };
      case 403:
        return {
          kind: 'FORBIDDEN',
          status: 403,
          backendCode,
          traceId,
          message: envelopeMessage || 'Bạn không có quyền thực hiện thao tác này.',
        };
      case 404:
        return {
          kind: 'NOT_FOUND',
          status: 404,
          backendCode,
          traceId,
          message: envelopeMessage || 'Tài nguyên yêu cầu không tồn tại hoặc đã bị xóa.',
        };
      case 409:
        return {
          kind: 'CONFLICT',
          status: 409,
          backendCode,
          traceId,
          message: envelopeMessage || 'Dữ liệu đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang.',
        };
      case 400:
      case 422:
        return {
          kind: 'VALIDATION_ERROR',
          status,
          backendCode,
          traceId,
          fieldErrors,
          message: envelopeMessage || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường nhập liệu.',
        };
      default:
        if (status && status >= 500) {
          return {
            kind: 'SERVER_ERROR',
            status,
            backendCode,
            traceId,
            message: envelopeMessage || 'Hệ thống máy chủ gặp sự cố xử lý. Vui lòng thử lại sau.',
          };
        }
        return {
          kind: 'UNKNOWN_ERROR',
          status,
          backendCode,
          traceId,
          message: envelopeMessage || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
        };
    }
  }

  // Handle standard JavaScript Error
  if (error instanceof Error) {
    const customProps = error as unknown as Record<string, unknown>;
    const traceId = typeof customProps.traceId === 'string' ? customProps.traceId : undefined;
    const backendCode = typeof customProps.backendCode === 'string' ? customProps.backendCode : undefined;
    const fieldErrors = typeof customProps.fieldErrors === 'object' && customProps.fieldErrors !== null
      ? (customProps.fieldErrors as Record<string, string>)
      : undefined;

    return {
      kind: 'UNKNOWN_ERROR',
      message: error.message || 'Đã có lỗi xảy ra',
      traceId,
      backendCode,
      fieldErrors,
    };
  }

  // Fallback for non-Error thrown objects
  return {
    kind: 'UNKNOWN_ERROR',
    message: 'Đã xảy ra lỗi không mong muốn.',
  };
}

/**
 * Type guard for NormalizedApiError.
 */
export function isNormalizedApiError(obj: unknown): obj is NormalizedApiError {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const candidate = obj as Record<string, unknown>;
  const validKinds: ApiErrorKind[] = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'VALIDATION_ERROR',
    'SERVER_ERROR',
    'UNKNOWN_ERROR',
  ];
  return (
    typeof candidate.kind === 'string' &&
    validKinds.includes(candidate.kind as ApiErrorKind) &&
    typeof candidate.message === 'string'
  );
}
