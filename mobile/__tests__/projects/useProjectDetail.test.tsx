import { renderHook, act } from '@testing-library/react-native';
import { useProjectDetail, UseProjectDetailResult } from '../../src/features/projects/hooks/useProjectDetail';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { ProjectDetail } from '../../src/features/projects/api/projectTypes';

jest.mock('../../src/features/projects/api/projectApi');

describe('useProjectDetail Custom Hook', () => {
  const mockProjectDetail1: ProjectDetail = {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'PRJ-001',
    name: 'WorkSphere Platform',
    description: 'Nền tảng quản lý công việc doanh nghiệp',
    status: 'ACTIVE',
    priority: 'HIGH',
    manager: {
      id: '99999999-9999-9999-9999-999999999999',
      fullName: 'Nguyễn Văn A',
      avatarUrl: null,
    },
    department: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      code: 'DEP-IT',
      name: 'Công nghệ thông tin',
    },
    startDate: '2026-09-01',
    plannedEndDate: '2026-12-31',
    actualEndDate: null,
    progressPercent: 65,
    memberCount: 8,
    milestones: [
      {
        id: 'm-1',
        projectId: '11111111-1111-1111-1111-111111111111',
        name: 'Hoàn thành Khảo sát',
        description: 'Khảo sát quy trình',
        dueDate: '2026-10-15',
        completedAt: '2026-10-14T08:00:00Z',
        status: 'COMPLETED',
        createdBy: '99999999-9999-9999-9999-999999999999',
        createdAt: '2026-09-01T08:00:00Z',
        version: 1,
      },
    ],
    recentTasks: [],
    allowedActions: ['UPDATE', 'CHANGE_STATUS'],
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-19T08:00:00Z',
    version: 1,
  };

  const mockProjectDetail2: ProjectDetail = {
    ...mockProjectDetail1,
    id: '22222222-2222-2222-2222-222222222222',
    code: 'PRJ-002',
    name: 'Cloud Infrastructure Upgrade',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. performs initial load on mount with given projectId', async () => {
    let resolvePromise!: (val: ProjectDetail) => void;
    const pendingPromise = new Promise<ProjectDetail>(resolve => {
      resolvePromise = resolve;
    });
    (projectApi.getProject as jest.Mock).mockReturnValueOnce(pendingPromise);

    const { result } = await renderHook(() =>
      useProjectDetail('11111111-1111-1111-1111-111111111111')
    );

    expect(result.current.initialLoading).toBe(true);
    expect(result.current.project).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolvePromise(mockProjectDetail1);
      await pendingPromise;
    });

    expect(projectApi.getProject).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
    expect(result.current.initialLoading).toBe(false);
    expect(result.current.project).toEqual(mockProjectDetail1);
    expect(result.current.error).toBeNull();
  });

  it('2. sets presentation error when initial load fails', async () => {
    let rejectPromise!: (err: unknown) => void;
    const pendingPromise = new Promise<ProjectDetail>((_, reject) => {
      rejectPromise = reject;
    });
    (projectApi.getProject as jest.Mock).mockReturnValueOnce(pendingPromise);

    const { result } = await renderHook(() =>
      useProjectDetail('11111111-1111-1111-1111-111111111111')
    );

    expect(result.current.initialLoading).toBe(true);

    await act(async () => {
      rejectPromise({
        isAxiosError: true,
        response: {
          status: 404,
          data: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
        },
      });
      try {
        await pendingPromise;
      } catch {
        // expected rejection
      }
    });

    expect(result.current.initialLoading).toBe(false);
    expect(result.current.project).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.isNotFound).toBe(true);
    expect(result.current.error?.message).toBe('Dự án không tồn tại hoặc đã bị xóa.');
  });

  it('3. deduplicates same-resource concurrent load calls', async () => {
    let resolvePromise!: (val: ProjectDetail) => void;
    const pendingPromise = new Promise<ProjectDetail>(resolve => {
      resolvePromise = resolve;
    });
    (projectApi.getProject as jest.Mock).mockReturnValue(pendingPromise);

    const { result } = await renderHook(() =>
      useProjectDetail('11111111-1111-1111-1111-111111111111')
    );

    // Call load again while first is in-flight
    await act(async () => {
      result.current.load();
    });

    // Should only have been called once due to same-resource in-flight lock
    expect(projectApi.getProject).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise(mockProjectDetail1);
      await pendingPromise;
    });

    expect(result.current.project).toEqual(mockProjectDetail1);
  });

  it('4. supersedes previous project request when projectId changes (generation guard)', async () => {
    let resolveA!: (val: ProjectDetail) => void;
    const promiseA = new Promise<ProjectDetail>(resolve => {
      resolveA = resolve;
    });

    let resolveB!: (val: ProjectDetail) => void;
    const promiseB = new Promise<ProjectDetail>(resolve => {
      resolveB = resolve;
    });

    (projectApi.getProject as jest.Mock).mockImplementation((id: string) => {
      if (id === 'id-A') return promiseA;
      if (id === 'id-B') return promiseB;
      return Promise.resolve(mockProjectDetail1);
    });

    const { result, rerender } = await renderHook<UseProjectDetailResult, { id: string }>(
      ({ id }: { id: string }) => useProjectDetail(id),
      { initialProps: { id: 'id-A' } }
    );

    expect(projectApi.getProject).toHaveBeenCalledWith('id-A');

    // Route changes to id-B while id-A is still pending
    await rerender({ id: 'id-B' });
    expect(projectApi.getProject).toHaveBeenCalledWith('id-B');

    // Now id-B resolves first
    await act(async () => {
      resolveB(mockProjectDetail2);
      await promiseB;
    });

    expect(result.current.project).toEqual(mockProjectDetail2);

    // Later, stale id-A resolves
    await act(async () => {
      resolveA(mockProjectDetail1);
      await promiseA;
    });

    // State MUST remain id-B (stale A discarded by generation guard)
    expect(result.current.project).toEqual(mockProjectDetail2);
  });

  it('5. preserves existing project when pull-to-refresh fails and sets refreshError', async () => {
    (projectApi.getProject as jest.Mock)
      .mockResolvedValueOnce(mockProjectDetail1)
      .mockRejectedValueOnce(new Error('Network timeout during refresh'));

    const { result } = await renderHook(() =>
      useProjectDetail('11111111-1111-1111-1111-111111111111')
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.project).toEqual(mockProjectDetail1);

    // Trigger refresh
    await act(async () => {
      await result.current.refresh();
    });

    // Existing project data preserved
    expect(result.current.project).toEqual(mockProjectDetail1);
    expect(result.current.refreshError).toBe('Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
    expect(result.current.refreshing).toBe(false);
  });

  it('6. safely unmounts without committing state or leaking listeners', async () => {
    let resolvePromise!: (val: ProjectDetail) => void;
    const pendingPromise = new Promise<ProjectDetail>(resolve => {
      resolvePromise = resolve;
    });
    (projectApi.getProject as jest.Mock).mockReturnValueOnce(pendingPromise);

    const { result, unmount } = await renderHook(() =>
      useProjectDetail('11111111-1111-1111-1111-111111111111')
    );

    // Unmount before response arrives
    await unmount();

    // Now resolve
    await act(async () => {
      resolvePromise(mockProjectDetail1);
      await pendingPromise;
    });

    // Hook unmounted, no error or state updates committed
    expect(result.current.project).toBeNull();
  });
});
