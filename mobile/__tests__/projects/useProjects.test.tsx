import { renderHook, act } from '@testing-library/react-native';
import { useProjects } from '../../src/features/projects/hooks/useProjects';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { PagedData } from '../../src/shared/api';
import { ProjectSummary } from '../../src/features/projects/api/projectTypes';

jest.mock('../../src/features/projects/api/projectApi');

describe('useProjects Custom Hook', () => {
  const mockProject1: ProjectSummary = {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'PRJ-001',
    name: 'WorkSphere Platform',
    description: 'Nền tảng quản lý công việc',
    status: 'ACTIVE',
    priority: 'HIGH',
    manager: {
      id: '99999999-9999-9999-9999-999999999999',
      fullName: 'Nguyễn Văn A',
      avatarUrl: null,
    },
    startDate: '2026-09-01',
    plannedEndDate: '2026-12-31',
    progressPercent: 65,
    memberCount: 8,
    taskSummary: {
      total: 20,
      completed: 13,
      overdue: 1,
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-19T08:00:00Z',
  };

  const mockProject2: ProjectSummary = {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'PRJ-002',
    name: 'Cloud Infrastructure',
    description: 'Hạ tầng điện toán đám mây',
    status: 'DRAFT',
    priority: 'MEDIUM',
    manager: {
      id: '88888888-8888-8888-8888-888888888888',
      fullName: 'Trần Thị B',
      avatarUrl: null,
    },
    startDate: '2026-10-01',
    plannedEndDate: '2027-03-31',
    progressPercent: 10,
    memberCount: 3,
    taskSummary: {
      total: 10,
      completed: 1,
      overdue: 0,
    },
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-19T08:00:00Z',
  };

  const mockPagedDataPage0: PagedData<ProjectSummary> = {
    items: [mockProject1],
    page: 0,
    size: 20,
    totalItems: 2,
    totalPages: 2,
    hasNext: true,
    hasPrevious: false,
  };

  const mockPagedDataPage1: PagedData<ProjectSummary> = {
    items: [mockProject2],
    page: 1,
    size: 20,
    totalItems: 2,
    totalPages: 2,
    hasNext: false,
    hasPrevious: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. performs initial query on mount with explicit page=0, size=20, sort=createdAt,desc', async () => {
    let resolvePromise!: (val: PagedData<ProjectSummary>) => void;
    const pendingPromise = new Promise<PagedData<ProjectSummary>>(resolve => {
      resolvePromise = resolve;
    });
    (projectApi.listProjects as jest.Mock).mockReturnValueOnce(pendingPromise);

    const { result } = await renderHook(() => useProjects());

    expect(result.current.initialLoading).toBe(true);

    await act(async () => {
      resolvePromise(mockPagedDataPage0);
      await pendingPromise;
    });

    expect(projectApi.listProjects).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      sort: 'createdAt,desc',
      search: undefined,
      status: undefined,
    });
    expect(result.current.initialLoading).toBe(false);
    expect(result.current.projects).toEqual([mockProject1]);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.page).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('2. sets error state when initial query fails', async () => {
    let rejectPromise!: (err: unknown) => void;
    const pendingPromise = new Promise<PagedData<ProjectSummary>>((_, reject) => {
      rejectPromise = reject;
    });
    (projectApi.listProjects as jest.Mock).mockReturnValueOnce(pendingPromise);

    const { result } = await renderHook(() => useProjects());

    expect(result.current.initialLoading).toBe(true);

    await act(async () => {
      rejectPromise({
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Lỗi mạng hoặc không thể kết nối đến máy chủ.' },
        },
      });
      try {
        await pendingPromise;
      } catch {
        // expected rejection
      }
    });

    expect(result.current.initialLoading).toBe(false);
    expect(result.current.projects).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });

  it('3. debounces search input by 300ms before issuing replace query', async () => {
    (projectApi.listProjects as jest.Mock).mockResolvedValue(mockPagedDataPage0);

    const { result } = await renderHook(() => useProjects());

    await act(async () => {
      await Promise.resolve();
    });

    expect(projectApi.listProjects).toHaveBeenCalledTimes(1);

    // Type into search
    await act(async () => {
      result.current.setSearch('WorkSphere');
    });

    expect(result.current.search).toBe('WorkSphere');
    // Before debounce duration elapses, no additional network request is made
    expect(projectApi.listProjects).toHaveBeenCalledTimes(1);

    // Wait for 300ms debounce timer to fire
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 350));
    });

    expect(projectApi.listProjects).toHaveBeenCalledTimes(2);
    expect(projectApi.listProjects).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      sort: 'createdAt,desc',
      search: 'WorkSphere',
      status: undefined,
    });
  });

  it('4. resets page to 0 and replaces items when status filter changes', async () => {
    (projectApi.listProjects as jest.Mock).mockResolvedValue(mockPagedDataPage0);

    const { result } = await renderHook(() => useProjects());

    await act(async () => {
      await Promise.resolve();
    });

    expect(projectApi.listProjects).toHaveBeenCalledTimes(1);

    // Change status filter to ACTIVE
    await act(async () => {
      result.current.setStatusFilter('ACTIVE');
      await Promise.resolve();
    });

    expect(projectApi.listProjects).toHaveBeenCalledTimes(2);
    expect(projectApi.listProjects).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      sort: 'createdAt,desc',
      search: undefined,
      status: 'ACTIVE',
    });
  });

  it('5. loads next page on loadMore and appends deduplicated items', async () => {
    (projectApi.listProjects as jest.Mock)
      .mockResolvedValueOnce(mockPagedDataPage0)
      .mockResolvedValueOnce(mockPagedDataPage1);

    const { result } = await renderHook(() => useProjects());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.projects).toEqual([mockProject1]);
    expect(result.current.hasNext).toBe(true);

    // Call loadMore
    await act(async () => {
      await result.current.loadMore();
    });

    expect(projectApi.listProjects).toHaveBeenCalledTimes(2);
    expect(projectApi.listProjects).toHaveBeenLastCalledWith({
      page: 1,
      size: 20,
      sort: 'createdAt,desc',
      search: undefined,
      status: undefined,
    });

    expect(result.current.projects).toEqual([mockProject1, mockProject2]);
    expect(result.current.page).toBe(1);
    expect(result.current.hasNext).toBe(false);
    expect(result.current.loadingMore).toBe(false);
  });

  it('6. discards stale append result if search/filter query changed before page append arrives', async () => {
    let resolveAppend!: (val: PagedData<ProjectSummary>) => void;
    const appendPromise = new Promise<PagedData<ProjectSummary>>(resolve => {
      resolveAppend = resolve;
    });

    const completedPage0: PagedData<ProjectSummary> = {
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };

    (projectApi.listProjects as jest.Mock).mockImplementation((params: { page: number; status?: string }) => {
      if (params.page === 1) {
        return appendPromise;
      }
      if (params.status === 'COMPLETED') {
        return Promise.resolve(completedPage0);
      }
      return Promise.resolve(mockPagedDataPage0);
    });

    const { result } = await renderHook(() => useProjects());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.projects).toEqual([mockProject1]);

    // Start loadMore (requests page 1 -> pending appendPromise)
    await act(async () => {
      result.current.loadMore();
    });

    // While append is in-flight, user changes filter to COMPLETED
    await act(async () => {
      result.current.setStatusFilter('COMPLETED');
      await Promise.resolve();
    });

    // Verify filter changed and completedPage0 replaced items
    expect(result.current.projects).toEqual([]);
    expect(result.current.statusFilter).toBe('COMPLETED');

    // Now old append resolves
    await act(async () => {
      resolveAppend(mockPagedDataPage1);
      await Promise.resolve();
    });

    // Stale page 1 must NOT be appended into the COMPLETED query results
    expect(result.current.projects).toEqual([]);
    expect(result.current.statusFilter).toBe('COMPLETED');
  });

  it('7. preserves existing list and sets paginationError when page N>0 fails', async () => {
    (projectApi.listProjects as jest.Mock)
      .mockResolvedValueOnce(mockPagedDataPage0)
      .mockRejectedValueOnce(new Error('Page 1 timeout'));

    const { result } = await renderHook(() => useProjects());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.projects).toEqual([mockProject1]);

    await act(async () => {
      await result.current.loadMore();
    });

    // Existing list preserved
    expect(result.current.projects).toEqual([mockProject1]);
    expect(result.current.paginationError).not.toBeNull();
    expect(result.current.loadingMore).toBe(false);
  });

  it('8. preserves existing list when pull-to-refresh fails', async () => {
    (projectApi.listProjects as jest.Mock)
      .mockResolvedValueOnce(mockPagedDataPage0)
      .mockRejectedValueOnce(new Error('Refresh failed'));

    const { result } = await renderHook(() => useProjects());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.projects).toEqual([mockProject1]);

    await act(async () => {
      await result.current.refresh();
    });

    // Existing list preserved
    expect(result.current.projects).toEqual([mockProject1]);
    expect(result.current.refreshError).toBe('Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
    expect(result.current.refreshing).toBe(false);
  });

  it('9. clearFilters clears search, timer, and status filter', async () => {
    (projectApi.listProjects as jest.Mock).mockResolvedValue(mockPagedDataPage0);

    const { result } = await renderHook(() => useProjects());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      result.current.setSearch('keyword');
      result.current.setStatusFilter('ACTIVE');
    });

    expect(result.current.search).toBe('keyword');
    expect(result.current.statusFilter).toBe('ACTIVE');

    await act(async () => {
      result.current.clearFilters();
    });

    expect(result.current.search).toBe('');
    expect(result.current.statusFilter).toBeUndefined();
  });
});
