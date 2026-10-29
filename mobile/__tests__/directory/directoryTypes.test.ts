import {
  DIRECTORY_ALLOWED_SORT,
  DIRECTORY_DEFAULT_PAGE,
  DIRECTORY_DEFAULT_PAGE_SIZE,
  isUserDirectoryItem,
  isUserDirectoryPage,
  mapDirectoryError,
  UserDirectoryItem,
} from '../../src/features/directory/api/directoryTypes';
import { PagedData } from '../../src/shared/api';

describe('Phase 14E-G2: directoryTypes & Runtime Guards', () => {
  const validUser: UserDirectoryItem = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    username: 'nguyenvana',
    fullName: 'Nguyễn Văn A',
    email: 'vana@worksphere.com',
    avatarUrl: null,
    departmentName: 'Phòng Kỹ thuật',
  };

  describe('Constants', () => {
    it('defines canonical constants', () => {
      expect(DIRECTORY_ALLOWED_SORT).toBe('fullName,asc');
      expect(DIRECTORY_DEFAULT_PAGE).toBe(0);
      expect(DIRECTORY_DEFAULT_PAGE_SIZE).toBe(20);
    });
  });

  describe('isUserDirectoryItem Guard', () => {
    it('accepts valid user with null avatarUrl', () => {
      expect(isUserDirectoryItem(validUser)).toBe(true);
    });

    it('accepts valid user with string avatarUrl and null departmentName', () => {
      const userWithAvatar = {
        ...validUser,
        avatarUrl: 'https://cdn.worksphere.com/avatars/user1.png',
        departmentName: null,
      };
      expect(isUserDirectoryItem(userWithAvatar)).toBe(true);
    });

    it('accepts valid user when extra unknown fields are present', () => {
      const withExtra = {
        ...validUser,
        extraMeta: 'ignored',
      };
      expect(isUserDirectoryItem(withExtra)).toBe(true);
    });

    it('rejects null and non-object inputs', () => {
      expect(isUserDirectoryItem(null)).toBe(false);
      expect(isUserDirectoryItem(undefined)).toBe(false);
      expect(isUserDirectoryItem('string')).toBe(false);
      expect(isUserDirectoryItem(12345)).toBe(false);
      expect(isUserDirectoryItem([])).toBe(false);
    });

    it('rejects missing or empty required fields', () => {
      expect(isUserDirectoryItem({ ...validUser, id: '' })).toBe(false);
      expect(isUserDirectoryItem({ ...validUser, id: undefined })).toBe(false);
      expect(isUserDirectoryItem({ ...validUser, username: '' })).toBe(false);
      expect(isUserDirectoryItem({ ...validUser, username: 123 })).toBe(false);
      expect(isUserDirectoryItem({ ...validUser, fullName: '' })).toBe(false);
      expect(isUserDirectoryItem({ ...validUser, fullName: null })).toBe(false);
      expect(isUserDirectoryItem({ ...validUser, email: '' })).toBe(false);
      expect(isUserDirectoryItem({ ...validUser, email: false })).toBe(false);
    });

    it('rejects invalid avatarUrl or departmentName types', () => {
      expect(isUserDirectoryItem({ ...validUser, avatarUrl: 12345 })).toBe(false);
      expect(isUserDirectoryItem({ ...validUser, departmentName: true })).toBe(false);
    });
  });

  describe('isUserDirectoryPage Guard', () => {
    const validPage: PagedData<UserDirectoryItem> = {
      items: [validUser],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };

    it('accepts valid PagedData structure', () => {
      expect(isUserDirectoryPage(validPage)).toBe(true);
    });

    it('accepts empty items array', () => {
      expect(
        isUserDirectoryPage({
          ...validPage,
          items: [],
          totalItems: 0,
          totalPages: 0,
        })
      ).toBe(true);
    });

    it('rejects when items contains an invalid item', () => {
      const corruptPage = {
        ...validPage,
        items: [validUser, { id: 'invalid-item' }],
      };
      expect(isUserDirectoryPage(corruptPage)).toBe(false);
    });

    it('rejects missing or wrong pagination properties', () => {
      expect(isUserDirectoryPage(null)).toBe(false);
      expect(isUserDirectoryPage({})).toBe(false);
      expect(isUserDirectoryPage({ ...validPage, page: '0' })).toBe(false);
      expect(isUserDirectoryPage({ ...validPage, size: null })).toBe(false);
      expect(isUserDirectoryPage({ ...validPage, totalItems: undefined })).toBe(false);
      expect(isUserDirectoryPage({ ...validPage, totalPages: '1' })).toBe(false);
      expect(isUserDirectoryPage({ ...validPage, hasNext: null })).toBe(false);
      expect(isUserDirectoryPage({ ...validPage, hasPrevious: 1 })).toBe(false);
      expect(isUserDirectoryPage({ ...validPage, items: 'not-array' })).toBe(false);
    });
  });

  describe('mapDirectoryError', () => {
    it('maps FORBIDDEN to safe forbidden error', () => {
      const error = {
        isAxiosError: true,
        response: { status: 403, data: { message: 'Forbidden access' } },
      };
      const mapped = mapDirectoryError(error);
      expect(mapped.isForbidden).toBe(true);
      expect(mapped.retryable).toBe(false);
      expect(mapped.message).toBe('Bạn không có quyền truy cập danh bạ người dùng.');
    });

    it('maps NETWORK_ERROR and TIMEOUT to retryable network error', () => {
      const netError = {
        isAxiosError: true,
        response: undefined,
      };
      const mapped = mapDirectoryError(netError);
      expect(mapped.isForbidden).toBe(false);
      expect(mapped.retryable).toBe(true);
      expect(mapped.message).toContain('Không thể kết nối đến máy chủ danh bạ');
    });

    it('maps SERVER_ERROR to retryable server error', () => {
      const serverError = {
        isAxiosError: true,
        response: { status: 500, data: { message: 'Internal Server Error' } },
      };
      const mapped = mapDirectoryError(serverError);
      expect(mapped.isForbidden).toBe(false);
      expect(mapped.retryable).toBe(true);
      expect(mapped.message).toBe('Hệ thống máy chủ gặp sự cố khi tải danh bạ. Vui lòng thử lại sau.');
    });

    it('maps generic error to safe fallback', () => {
      const genericError = new Error('Random failure');
      const mapped = mapDirectoryError(genericError);
      expect(mapped.retryable).toBe(true);
      expect(mapped.isForbidden).toBe(false);
      expect(mapped.message).toBe('Không thể tải danh bạ người dùng. Vui lòng thử lại sau.');
    });
  });
});
