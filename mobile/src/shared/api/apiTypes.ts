/**
 * Canonical API Type Definitions for WorkSphere Mobile
 * Aligned with backend ApiResponse.java and PagedData.java
 */

/**
 * Standard backend response wrapper matching ApiResponse.java
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T | null;
  code?: string | null;
  message?: string | null;
  fieldErrors?: Record<string, string> | null;
  timestamp: string; // ISO-8601 string from backend Instant
  traceId?: string | null;
}

/**
 * Standard backend pagination response matching PagedData.java
 */
export interface PagedData<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Standard pagination and sorting query parameters
 */
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Normalized high-level error classification categories
 */
export type ApiErrorKind =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Standardized client-facing normalized error structure
 */
export interface NormalizedApiError {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  backendCode?: string;
  fieldErrors?: Record<string, string>;
  traceId?: string;
}
