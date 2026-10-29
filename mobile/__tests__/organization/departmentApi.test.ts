import { departmentApi } from '../../src/features/organization/api/departmentApi';
import { http } from '../../src/shared/api';

jest.mock('../../src/shared/api', () => ({
  http: {
    get: jest.fn(),
  },
}));

describe('departmentApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches departments successfully', async () => {
    const mockData = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        code: 'TECH',
        name: 'Phòng Công nghệ',
        active: true,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        code: 'HR',
        name: 'Phòng Nhân sự',
        active: true,
      },
    ];

    (http.get as jest.Mock).mockResolvedValueOnce(mockData);

    const result = await departmentApi.getDepartments();

    expect(http.get).toHaveBeenCalledWith('/departments');
    expect(result).toEqual(mockData);
  });

  it('throws error when data shape is invalid', async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({ invalid: true });

    await expect(departmentApi.getDepartments()).rejects.toThrow(
      'Dữ liệu phòng ban trả về không hợp lệ'
    );
  });
});
