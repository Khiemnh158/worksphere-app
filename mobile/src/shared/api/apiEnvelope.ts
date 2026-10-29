import { ApiResponse } from './apiTypes';

/**
 * Type guard verifying whether an untrusted payload conforms structurally to ApiResponse<T>.
 */
export function isApiResponse(payload: unknown): payload is ApiResponse<unknown> {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.success === 'boolean' &&
    (typeof candidate.timestamp === 'string' || typeof candidate.timestamp === 'number')
  );
}

/**
 * Checks whether an untrusted payload is an ApiResponse indicating failure.
 */
export function isApiErrorEnvelope(payload: unknown): boolean {
  if (!isApiResponse(payload)) {
    return false;
  }
  return payload.success === false;
}

/**
 * Unwraps data from an ApiResponse envelope.
 * Throws an Error if the envelope indicates failure or is malformed.
 */
export function unwrapApiResponse<T>(envelope: ApiResponse<T>): T | null {
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('Malformed API response: Envelope is null or not an object');
  }

  if (!envelope.success) {
    const errorMsg = envelope.message || 'Yêu cầu không thành công';
    const err = new Error(errorMsg);
    // Attach envelope metadata without exposing raw structures to UI
    (err as unknown as Record<string, unknown>).backendCode = envelope.code;
    (err as unknown as Record<string, unknown>).traceId = envelope.traceId;
    (err as unknown as Record<string, unknown>).fieldErrors = envelope.fieldErrors;
    throw err;
  }

  return envelope.data ?? null;
}
