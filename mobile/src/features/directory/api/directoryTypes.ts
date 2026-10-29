/**
 * Phase 14E-G2: Mobile User Directory Types & Runtime Guards
 * Aligned with backend UserDirectoryItemResponse.java and architecture decision D-062.
 *
 * Strict Privacy & Data Minimization Invariants:
 * - Exactly contains: id, username, fullName, email, avatarUrl, departmentName.
 * - Does NOT contain phone numbers, roles, permissions, lifecycle status, or security metadata.
 * - Never includes transport dates.
 */

import { NormalizedApiError, normalizeError, PagedData } from '../../../shared/api';

/**
 * Public workplace contact card for human-readable user selection.
 */
export interface UserDirectoryItem {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  departmentName: string | null;
}

/**
 * Query parameters for searching active directory users.
 */
export interface UserDirectoryQuery {
  page?: number;
  size?: number;
  search?: string;
  departmentId?: string;
  sort?: string;
}

export const DIRECTORY_ALLOWED_SORT = 'fullName,asc';
export const DIRECTORY_DEFAULT_PAGE_SIZE = 20;
export const DIRECTORY_DEFAULT_PAGE = 0;

/**
 * Runtime type guard validating whether an untrusted payload conforms to UserDirectoryItem.
 * Unknown extra fields are ignored; missing or wrongly typed required fields reject.
 */
export function isUserDirectoryItem(payload: unknown): payload is UserDirectoryItem {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  const hasValidId = typeof candidate.id === 'string' && candidate.id.trim().length > 0;
  const hasValidUsername = typeof candidate.username === 'string' && candidate.username.trim().length > 0;
  const hasValidFullName = typeof candidate.fullName === 'string' && candidate.fullName.trim().length > 0;
  const hasValidEmail = typeof candidate.email === 'string' && candidate.email.trim().length > 0;
  const hasValidAvatar = candidate.avatarUrl === null || typeof candidate.avatarUrl === 'string';
  const hasValidDept = candidate.departmentName === null || typeof candidate.departmentName === 'string';

  return (
    hasValidId &&
    hasValidUsername &&
    hasValidFullName &&
    hasValidEmail &&
    hasValidAvatar &&
    hasValidDept
  );
}

/**
 * Runtime type guard validating whether an untrusted payload conforms to PagedData<UserDirectoryItem>.
 */
export function isUserDirectoryPage(payload: unknown): payload is PagedData<UserDirectoryItem> {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  if (
    !Array.isArray(candidate.items) ||
    typeof candidate.page !== 'number' ||
    typeof candidate.size !== 'number' ||
    typeof candidate.totalItems !== 'number' ||
    typeof candidate.totalPages !== 'number' ||
    typeof candidate.hasNext !== 'boolean' ||
    typeof candidate.hasPrevious !== 'boolean'
  ) {
    return false;
  }

  return candidate.items.every(isUserDirectoryItem);
}

/**
 * Normalized presentation error for user directory views.
 */
export interface DirectoryPresentationError {
  message: string;
  retryable: boolean;
  isForbidden: boolean;
  traceId?: string;
}

/**
 * Maps any caught error or NormalizedApiError into a presentation-safe DirectoryPresentationError.
 */
export function mapDirectoryError(error: unknown): DirectoryPresentationError {
  const normalized: NormalizedApiError = normalizeError(error);
  const traceId = normalized.traceId;

  switch (normalized.kind) {
    case 'FORBIDDEN':
      return {
        message: 'Bạn không có quyền truy cập danh bạ người dùng.',
        retryable: false,
        isForbidden: true,
        traceId,
      };

    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return {
        message: 'Không thể kết nối đến máy chủ danh bạ. Vui lòng kiểm tra kết nối mạng và thử lại.',
        retryable: true,
        isForbidden: false,
        traceId,
      };

    case 'SERVER_ERROR':
      return {
        message: 'Hệ thống máy chủ gặp sự cố khi tải danh bạ. Vui lòng thử lại sau.',
        retryable: true,
        isForbidden: false,
        traceId,
      };

    default:
      return {
        message: 'Không thể tải danh bạ người dùng. Vui lòng thử lại sau.',
        retryable: true,
        isForbidden: false,
        traceId,
      };
  }
}
