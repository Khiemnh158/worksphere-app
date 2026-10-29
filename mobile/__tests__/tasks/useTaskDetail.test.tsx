/**
 * Phase 15C: useTaskDetail Unit & Concurrency Tests
 *
 * Test Scenarios:
 * 1. Initial query on mount with exact taskId.
 * 2. Successful task detail resolution.
 * 3. Initial error mapping and retry recovery.
 * 4. Pull-to-refresh success replaces task data.
 * 5. Pull-to-refresh failure retains existing task data and sets refreshError.
 * 6. Same-ID concurrent load calls share in-flight promise (exactly 1 API call).
 * 7. Cross-ID supersession: Request Task A, switch to Task B, B resolves first, A resolves later -> Task B retained.
 * 8. Stale failure: Request Task A, switch to Task B, B succeeds, A rejects later -> no stale error, Task B retained.
 * 9. Unmount safety: pending request resolving or rejecting after unmount causes no state update.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { taskApi } from '../../src/features/tasks/api/taskApi';
import { TaskDetail } from '../../src/features/tasks/api/taskTypes';
import { useTaskDetail } from '../../src/features/tasks/hooks/useTaskDetail';

jest.mock('../../src/features/tasks/api/taskApi');

describe('Phase 15C: useTaskDetail Custom Hook', () => {
  const mockTaskA: TaskDetail = {
    id: 'task-uuid-1',
    project: {
      id: 'project-uuid-1',
      name: 'WorkSphere Mobile App',
      code: 'WS-MOB',
    },
    parentTaskId: null,
    parentTask: null,
    milestoneId: null,
    milestone: null,
    title: 'Xây dựng giao diện danh sách công việc',
    description: 'Chi tiết mô tả công việc A',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    progressPercent: 65,
    startDate: '2026-10-01T00:00:00Z',
    dueDate: '2026-10-25T00:00:00Z',
    completedAt: null,
    estimatedMinutes: 480,
    actualMinutes: 300,
    reporter: {
      id: 'user-reporter-1',
      fullName: 'Trần Quản Lý',
      avatarUrl: null,
    },
    assignees: [
      {
        assignmentId: 'assign-uuid-1',
        id: 'user-assignee-1',
        fullName: 'Nguyễn Văn Dev',
        avatarUrl: null,
        assignedAt: '2026-10-02T08:00:00Z',
      },
    ],
    subtasks: [],
    recentComments: [],
    attachments: [],
    statusHistory: [
      {
        id: 'history-1',
        taskId: 'task-uuid-1',
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
        comment: 'Bắt đầu triển khai',
        changedBy: {
          id: 'user-assignee-1',
          fullName: 'Nguyễn Văn Dev',
          avatarUrl: null,
        },
        changedAt: '2026-10-02T08:30:00Z',
      },
    ],
    allowedActions: ['UPDATE', 'UPDATE_STATUS', 'UPDATE_PROGRESS'],
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-02T08:30:00Z',
    version: 2,
  };

  const mockTaskB: TaskDetail = {
    ...mockTaskA,
    id: 'task-uuid-2',
    title: 'Viết tài liệu API',
    description: 'Mô tả công việc B',
    status: 'TODO',
    priority: 'MEDIUM',
    progressPercent: 0,
    version: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. performs initial query on mount with exact taskId', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTaskA);

    const { result } = await renderHook(() => useTaskDetail('task-uuid-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(taskApi.getTaskDetail).toHaveBeenCalledTimes(1);
    expect(taskApi.getTaskDetail).toHaveBeenCalledWith('task-uuid-1');
    expect(result.current.initialLoading).toBe(false);
    expect(result.current.task).toEqual(mockTaskA);
    expect(result.current.error).toBeNull();
    expect(result.current.refreshError).toBeNull();
  });

  it('2. sets presentation error on initial failure and recovers on retry', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 404,
        data: { code: 'TASK_NOT_FOUND', message: 'Không tìm thấy công việc.' },
      },
    });

    const { result } = await renderHook(() => useTaskDetail('task-uuid-not-found'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.initialLoading).toBe(false);
    expect(result.current.task).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.isNotFound).toBe(true);

    // Retry recovery
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTaskA);

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.task).toEqual(mockTaskA);
  });

  it('3. pull-to-refresh preserves task data during refresh and replaces on success', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTaskA);

    const { result } = await renderHook(() => useTaskDetail('task-uuid-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.task).toEqual(mockTaskA);

    const updatedTaskA: TaskDetail = {
      ...mockTaskA,
      progressPercent: 90,
      version: 3,
    };

    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(updatedTaskA);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.task).toEqual(updatedTaskA);
    expect(result.current.refreshing).toBe(false);
    expect(result.current.refreshError).toBeNull();
  });

  it('4. pull-to-refresh preserves task data when refresh fails and sets refreshError', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTaskA);

    const { result } = await renderHook(() => useTaskDetail('task-uuid-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.task).toEqual(mockTaskA);

    (taskApi.getTaskDetail as jest.Mock).mockRejectedValueOnce(
      new Error('Network error on refresh')
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.task).toEqual(mockTaskA);
    expect(result.current.refreshing).toBe(false);
    expect(result.current.refreshError).not.toBeNull();
  });

  it('5. same-ID concurrent load calls share in-flight promise (exactly 1 API call)', async () => {
    let resolveTask!: (val: TaskDetail) => void;
    const pendingPromise = new Promise<TaskDetail>(res => {
      resolveTask = res;
    });

    (taskApi.getTaskDetail as jest.Mock).mockReturnValue(pendingPromise);

    const { result } = await renderHook(() => useTaskDetail('task-uuid-1'));

    // Fire duplicate concurrent loads synchronously
    let p1!: Promise<void>;
    let p2!: Promise<void>;
    await act(async () => {
      p1 = result.current.load();
      p2 = result.current.load();
    });

    // Should only issue 1 API call for initial mount (and identical promise shared)
    expect(taskApi.getTaskDetail).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveTask(mockTaskA);
      await Promise.all([p1, p2, pendingPromise]);
    });

    expect(result.current.task).toEqual(mockTaskA);
  });

  it('6. cross-ID supersession: Task B resolves first, slower Task A does not overwrite B', async () => {
    let resolveA!: (val: TaskDetail) => void;
    const promiseA = new Promise<TaskDetail>(res => {
      resolveA = res;
    });

    let resolveB!: (val: TaskDetail) => void;
    const promiseB = new Promise<TaskDetail>(res => {
      resolveB = res;
    });

    (taskApi.getTaskDetail as jest.Mock).mockImplementation((id: string) => {
      if (id === 'task-uuid-1') return promiseA;
      if (id === 'task-uuid-2') return promiseB;
      return Promise.resolve(mockTaskA);
    });

    const { result, rerender } = await renderHook<any, { id: string }>(
      ({ id }: { id: string }) => useTaskDetail(id),
      {
        initialProps: { id: 'task-uuid-1' },
      }
    );

    expect(taskApi.getTaskDetail).toHaveBeenCalledWith('task-uuid-1');

    // Switch route / taskId to task-uuid-2
    await rerender({ id: 'task-uuid-2' });

    expect(taskApi.getTaskDetail).toHaveBeenCalledWith('task-uuid-2');

    // Resolve B first
    await act(async () => {
      resolveB(mockTaskB);
      await promiseB;
    });

    expect(result.current.task).toEqual(mockTaskB);

    // Resolve A later
    await act(async () => {
      resolveA(mockTaskA);
      await promiseA;
    });

    // Stale Task A must NOT overwrite Task B!
    expect(result.current.task).toEqual(mockTaskB);
  });

  it('7. stale failure: old Task A rejecting does not overwrite successful Task B', async () => {
    let rejectA!: (err: unknown) => void;
    const promiseA = new Promise<TaskDetail>((_, rej) => {
      rejectA = rej;
    });

    (taskApi.getTaskDetail as jest.Mock).mockImplementation((id: string) => {
      if (id === 'task-uuid-1') return promiseA;
      if (id === 'task-uuid-2') return Promise.resolve(mockTaskB);
      return Promise.resolve(mockTaskA);
    });

    const { result, rerender } = await renderHook<any, { id: string }>(
      ({ id }: { id: string }) => useTaskDetail(id),
      {
        initialProps: { id: 'task-uuid-1' },
      }
    );

    // Switch to Task B
    await rerender({ id: 'task-uuid-2' });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.task).toEqual(mockTaskB);
    expect(result.current.error).toBeNull();

    // Reject old Task A
    await act(async () => {
      rejectA(new Error('Network failure for old task A'));
      try {
        await promiseA;
      } catch {
        // Expected
      }
      await Promise.resolve();
    });

    // Stale error must NOT be shown
    expect(result.current.task).toEqual(mockTaskB);
    expect(result.current.error).toBeNull();
  });

  it('8. unmount safety: does not update state after unmount', async () => {
    let resolveTask!: (val: TaskDetail) => void;
    const pendingPromise = new Promise<TaskDetail>(res => {
      resolveTask = res;
    });

    (taskApi.getTaskDetail as jest.Mock).mockReturnValue(pendingPromise);

    const { result, unmount } = await renderHook(() => useTaskDetail('task-uuid-1'));

    await unmount();

    await act(async () => {
      resolveTask(mockTaskA);
      await pendingPromise;
    });

    // Successful unmount without warning or state update crash
    expect(taskApi.getTaskDetail).toHaveBeenCalledTimes(1);
    expect(result.current.task).toBeNull();
  });

  it('9. applyTaskUpdate immediately updates task state and supersedes pending in-flight GET requests', async () => {
    let resolveGetA!: (val: TaskDetail) => void;
    const pendingGetA = new Promise<TaskDetail>(res => {
      resolveGetA = res;
    });
    (taskApi.getTaskDetail as jest.Mock).mockReturnValueOnce(pendingGetA);

    const { result } = await renderHook(() => useTaskDetail('task-uuid-1'));

    expect(result.current.initialLoading).toBe(true);

    const mutationResult: TaskDetail = {
      ...mockTaskA,
      title: 'Tiêu đề sau mutation B',
      status: 'IN_REVIEW',
      version: 3,
    };

    // Apply mutation B before GET A resolves
    await act(async () => {
      result.current.applyTaskUpdate(mutationResult);
    });

    expect(result.current.task?.title).toBe('Tiêu đề sau mutation B');
    expect(result.current.task?.status).toBe('IN_REVIEW');
    expect(result.current.task?.version).toBe(3);

    // Now GET A resolves with stale data
    await act(async () => {
      resolveGetA(mockTaskA);
      await pendingGetA;
    });

    // Stale GET A must NOT overwrite mutation result
    expect(result.current.task?.title).toBe('Tiêu đề sau mutation B');
    expect(result.current.task?.status).toBe('IN_REVIEW');
    expect(result.current.task?.version).toBe(3);
  });

  it('10. in-flight ownership race: applyTaskUpdate followed by GET C does not have C lock prematurely cleared when GET A completes', async () => {
    let resolveGetA!: (val: TaskDetail) => void;
    const pendingGetA = new Promise<TaskDetail>(res => {
      resolveGetA = res;
    });
    (taskApi.getTaskDetail as jest.Mock).mockReturnValueOnce(pendingGetA);

    const { result } = await renderHook(() => useTaskDetail('task-uuid-1'));

    // Apply mutation B while GET A is still in flight
    const mutationResult: TaskDetail = {
      ...mockTaskA,
      title: 'Đã cập nhật sau mutation B',
      version: 3,
    };
    await act(async () => {
      result.current.applyTaskUpdate(mutationResult);
    });

    // Now start a fresh GET C (e.g. user manually requests load or refresh)
    let resolveGetC!: (val: TaskDetail) => void;
    const pendingGetC = new Promise<TaskDetail>(res => {
      resolveGetC = res;
    });
    (taskApi.getTaskDetail as jest.Mock).mockReturnValueOnce(pendingGetC);

    let loadCPromise: Promise<void> = result.current.load();

    // Now old GET A completes
    await act(async () => {
      resolveGetA(mockTaskA);
      await pendingGetA;
    });

    // An additional load() while GET C is pending should be deduplicated
    const dupPromise = result.current.load();

    // taskApi.getTaskDetail was called: once for A, once for C. Total: 2 calls (not 3)
    expect(taskApi.getTaskDetail).toHaveBeenCalledTimes(2);

    // Resolve C
    const resultC: TaskDetail = {
      ...mockTaskA,
      title: 'Dữ liệu mới từ C',
      version: 4,
    };
    await act(async () => {
      resolveGetC(resultC);
      await pendingGetC;
      await loadCPromise;
      await dupPromise;
    });

    expect(result.current.task?.title).toBe('Dữ liệu mới từ C');
    expect(result.current.task?.version).toBe(4);
  });

  it('11. preserves version chain across successive applyTaskUpdate mutations (v2 -> v3 -> v4)', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTaskA); // version 2

    const { result } = await renderHook(() => useTaskDetail('task-uuid-1'));
    await waitFor(() => {
      expect(result.current.task?.version).toBe(2);
    });

    // Mutation 1: status change returns version 3
    const v3Task: TaskDetail = {
      ...mockTaskA,
      version: 3,
      status: 'IN_REVIEW',
    };
    await act(async () => {
      result.current.applyTaskUpdate(v3Task);
    });
    expect(result.current.task?.version).toBe(3);
    expect(result.current.task?.status).toBe('IN_REVIEW');

    // Mutation 2: progress change returns version 4, chained from version 3
    const v4Task: TaskDetail = {
      ...v3Task,
      version: 4,
      progressPercent: 100,
    };
    await act(async () => {
      result.current.applyTaskUpdate(v4Task);
    });
    expect(result.current.task?.version).toBe(4);
    expect(result.current.task?.progressPercent).toBe(100);
  });
});
