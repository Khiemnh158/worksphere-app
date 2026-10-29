import { directoryApi, serializeDirectoryQuery } from '../../src/features/directory/api/directoryApi';
import { UserDirectoryItem } from '../../src/features/directory/api/directoryTypes';
import { http, PagedData } from '../../src/shared/api';

jest.mock('../../src/shared/api', () => {
  const actual = jest.requireActual('../../src/shared/api');
  return {
    ...actual,
    http: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
  };
});

describe('Phase 14E-G2: directoryApi Adapter', () => {
  const mockUser: UserDirectoryItem = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    username: 'nguyenvana',
    fullName: 'Nguyễn Văn A',
    email: 'vana@worksphere.com',
    avatarUrl: null,
    departmentName: 'Phòng Kỹ thuật',
  };

  const mockPagedData: PagedData<UserDirectoryItem> = {
    items: [mockUser],
    page: 0,
    size: 20,
    totalItems: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('serializeDirectoryQuery', () => {
    it('applies canonical defaults when query is undefined', () => {
      const params = serializeDirectoryQuery();
      expect(params).toEqual({
        page: 0,
        size: 20,
        sort: 'fullName,asc',
      });
    });

    it('preserves valid custom page and size while enforcing canonical sort', () => {
      const params = serializeDirectoryQuery({
        page: 2,
        size: 50,
        sort: 'invalidSortField',
      });
      expect(params).toEqual({
        page: 2,
        size: 50,
        sort: 'fullName,asc',
      });
    });

    it('trims outer whitespace from search parameter', () => {
      const params = serializeDirectoryQuery({
        search: '   nguyen van a   ',
      });
      expect(params.search).toBe('nguyen van a');
    });

    it('omits search when empty or whitespace only', () => {
      const paramsEmpty = serializeDirectoryQuery({ search: '' });
      expect(paramsEmpty.search).toBeUndefined();

      const paramsWhitespace = serializeDirectoryQuery({ search: '     ' });
      expect(paramsWhitespace.search).toBeUndefined();
    });

    it('trims and includes departmentId when provided, omits when blank', () => {
      const paramsWithDept = serializeDirectoryQuery({
        departmentId: '  dept-uuid-1234  ',
      });
      expect(paramsWithDept.departmentId).toBe('dept-uuid-1234');

      const paramsWithBlankDept = serializeDirectoryQuery({
        departmentId: '   ',
      });
      expect(paramsWithBlankDept.departmentId).toBeUndefined();
    });
  });

  describe('directoryApi.searchUsers', () => {
    it('calls GET /directory/users with serialized params and returns valid PagedData', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce(mockPagedData);

      const result = await directoryApi.searchUsers({
        search: 'Nguyen',
        page: 1,
        size: 20,
      });

      expect(http.get).toHaveBeenCalledWith('/directory/users', {
        params: {
          page: 1,
          size: 20,
          sort: 'fullName,asc',
          search: 'Nguyen',
        },
      });
      expect(result).toEqual(mockPagedData);
    });

    it('throws safe contract error when server returns malformed payload', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce({
        items: [{ id: 123, invalid: true }],
        page: 'invalid',
      });

      await expect(directoryApi.searchUsers()).rejects.toThrow(
        'Dữ liệu danh bạ người dùng máy chủ trả về không hợp lệ'
      );
    });

    it('throws safe contract error when server returns null data', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce(null);

      await expect(directoryApi.searchUsers()).rejects.toThrow(
        'Dữ liệu danh bạ người dùng máy chủ trả về không hợp lệ'
      );
    });
  });
});
