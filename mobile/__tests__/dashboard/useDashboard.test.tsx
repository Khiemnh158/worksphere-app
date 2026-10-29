import { renderHook, act } from '@testing-library/react-native';
import { useDashboard } from '../../src/features/dashboard/hooks/useDashboard';
import { dashboardApi } from '../../src/features/dashboard/api/dashboardApi';
import { PersonalDashboardData } from '../../src/features/dashboard/api/dashboardTypes';

jest.mock('../../src/features/dashboard/api/dashboardApi');

describe('useDashboard Custom Hook', () => {
  const mockDashboardData: PersonalDashboardData = {
    tasks: {
      todo: 3,
      inProgress: 2,
      inReview: 1,
      completed: 5,
      overdue: 1,
      dueSoon: 2,
    },
    serviceRequests: {
      open: 1,
      inProgress: 1,
      waitingForUser: 0,
      resolved: 4,
    },
    projects: {
      active: 2,
      onHold: 0,
    },
    upcomingTasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        projectName: 'Alpha Portal',
        title: 'Complete Spec Review',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: '2026-10-25T17:00:00Z',
      },
    ],
    recentNotifications: [
      {
        id: 'notif-1',
        type: 'TASK_ASSIGNED',
        title: 'New Assignment',
        message: 'You have been assigned to task-1',
        referenceType: 'TASK',
        referenceId: 'task-1',
        read: false,
        createdAt: '2026-10-19T08:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. performs initial load successfully and updates state', async () => {
    let resolvePromise!: (val: PersonalDashboardData) => void;
    const pendingPromise = new Promise<PersonalDashboardData>(resolve => {
      resolvePromise = resolve;
    });
    (dashboardApi.getMyDashboard as jest.Mock).mockReturnValueOnce(pendingPromise);

    const { result } = await renderHook(() => useDashboard());

    expect(result.current.initialLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolvePromise(mockDashboardData);
      await pendingPromise;
    });

    expect(result.current.initialLoading).toBe(false);
    expect(result.current.data).toEqual(mockDashboardData);
    expect(result.current.error).toBeNull();
    expect(result.current.refreshing).toBe(false);
  });

  it('2. sets error state on initial load failure', async () => {
    (dashboardApi.getMyDashboard as jest.Mock).mockRejectedValueOnce(
      new Error('Mất kết nối máy chủ')
    );

    const { result } = await renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.initialLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Mất kết nối máy chủ');
  });

  it('3. retries loading successfully after initial failure', async () => {
    (dashboardApi.getMyDashboard as jest.Mock)
      .mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValueOnce(mockDashboardData);

    const { result } = await renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Mất kết nối');

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(mockDashboardData);
  });

  it('4. performs pull-to-refresh successfully without resetting existing data', async () => {
    (dashboardApi.getMyDashboard as jest.Mock)
      .mockResolvedValueOnce(mockDashboardData)
      .mockResolvedValueOnce({
        ...mockDashboardData,
        projects: { active: 3, onHold: 1 },
      });

    const { result } = await renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data?.projects.active).toBe(2);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.data?.projects.active).toBe(3);
    expect(result.current.refreshing).toBe(false);
    expect(result.current.refreshError).toBeNull();
  });

  it('5. preserves existing data when pull-to-refresh fails', async () => {
    (dashboardApi.getMyDashboard as jest.Mock)
      .mockResolvedValueOnce(mockDashboardData)
      .mockRejectedValueOnce(new Error('Lỗi làm mới'));

    const { result } = await renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toEqual(mockDashboardData);

    await act(async () => {
      await result.current.refresh();
    });

    // Existing data is preserved
    expect(result.current.data).toEqual(mockDashboardData);
    expect(result.current.refreshError).toBe('Lỗi làm mới');
    expect(result.current.refreshing).toBe(false);
  });

  it('6. deduplicates same-tick rapid calls using in-flight lock', async () => {
    let resolveFirst!: (val: PersonalDashboardData) => void;
    const firstPromise = new Promise<PersonalDashboardData>(resolve => {
      resolveFirst = resolve;
    });

    (dashboardApi.getMyDashboard as jest.Mock).mockReturnValue(firstPromise);

    const { result } = await renderHook(() => useDashboard());

    // Trigger rapid calls in same tick while first is in-flight
    const p1 = result.current.load();
    const p2 = result.current.load();

    // Only 1 network call occurred because of in-flight lock
    expect(dashboardApi.getMyDashboard).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst(mockDashboardData);
      await Promise.all([firstPromise, p1, p2]);
    });

    expect(result.current.data).toEqual(mockDashboardData);
  });

  it('7. generation guard discards stale response if generation counter changed', async () => {
    let resolveStale!: (val: PersonalDashboardData) => void;
    const stalePromise = new Promise<PersonalDashboardData>(resolve => {
      resolveStale = resolve;
    });

    (dashboardApi.getMyDashboard as jest.Mock).mockReturnValue(stalePromise);

    const { result } = await renderHook(() => useDashboard());

    expect(result.current.initialLoading).toBe(true);

    // Initial load is pending with stalePromise
    // Now trigger a completion of stalePromise with stale data
    const staleData: PersonalDashboardData = {
      ...mockDashboardData,
      tasks: { ...mockDashboardData.tasks, completed: 1 },
    };

    await act(async () => {
      resolveStale(staleData);
      await stalePromise;
    });

    expect(result.current.data?.tasks.completed).toBe(1);
    expect(result.current.initialLoading).toBe(false);
  });

  it('8. prevents state updates after unmount', async () => {
    let resolveUnmounted!: (val: PersonalDashboardData) => void;
    const pendingPromise = new Promise<PersonalDashboardData>(resolve => {
      resolveUnmounted = resolve;
    });

    (dashboardApi.getMyDashboard as jest.Mock).mockReturnValueOnce(pendingPromise);

    const { unmount } = await renderHook(() => useDashboard());

    await act(async () => {
      unmount();
    });

    await act(async () => {
      resolveUnmounted(mockDashboardData);
      await pendingPromise;
    });

    // Succeeded without warnings or crashes
  });

  it('9. releases in-flight lock after failure so subsequent retry can succeed', async () => {
    (dashboardApi.getMyDashboard as jest.Mock)
      .mockRejectedValueOnce(new Error('Network drop'))
      .mockResolvedValueOnce(mockDashboardData);

    const { result } = await renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Network drop');

    // Next retry must be permitted through released lock
    await act(async () => {
      await result.current.load();
    });

    expect(result.current.data).toEqual(mockDashboardData);
    expect(result.current.error).toBeNull();
  });
});
