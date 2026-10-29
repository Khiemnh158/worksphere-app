/**
 * Phase 14E-G2: Mobile User Directory API Adapter
 * Connects mobile directory queries to backend Spring Boot directory endpoint:
 * GET /api/v1/directory/users
 */

import { http, PagedData } from '../../../shared/api';
import {
  DIRECTORY_ALLOWED_SORT,
  DIRECTORY_DEFAULT_PAGE,
  DIRECTORY_DEFAULT_PAGE_SIZE,
  isUserDirectoryPage,
  UserDirectoryItem,
  UserDirectoryQuery,
} from './directoryTypes';

/**
 * Builds deterministic query parameters for directory user search.
 * - Enforces default page=0 and size=20.
 * - Whitelists sort to fullName,asc.
 * - Trims outer whitespace from search; omits if empty or whitespace-only.
 * - Omits departmentId if empty or undefined.
 */
export function serializeDirectoryQuery(
  query?: UserDirectoryQuery
): Record<string, string | number> {
  const page =
    typeof query?.page === 'number' && query.page >= 0
      ? query.page
      : DIRECTORY_DEFAULT_PAGE;

  const size =
    typeof query?.size === 'number' && query.size > 0
      ? query.size
      : DIRECTORY_DEFAULT_PAGE_SIZE;

  const params: Record<string, string | number> = {
    page,
    size,
    sort: DIRECTORY_ALLOWED_SORT,
  };

  if (typeof query?.search === 'string') {
    const trimmed = query.search.trim();
    if (trimmed.length > 0) {
      params.search = trimmed;
    }
  }

  if (typeof query?.departmentId === 'string') {
    const trimmedDept = query.departmentId.trim();
    if (trimmedDept.length > 0) {
      params.departmentId = trimmedDept;
    }
  }

  return params;
}

export const directoryApi = {
  /**
   * GET /directory/users
   * Searches active users in the workplace directory.
   */
  async searchUsers(query?: UserDirectoryQuery): Promise<PagedData<UserDirectoryItem>> {
    const params = serializeDirectoryQuery(query);
    const data = await http.get<PagedData<UserDirectoryItem>>('/directory/users', {
      params,
    });

    if (!isUserDirectoryPage(data)) {
      throw new Error('Dữ liệu danh bạ người dùng máy chủ trả về không hợp lệ');
    }

    return data;
  },
};
