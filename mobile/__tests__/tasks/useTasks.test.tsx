/**
 * Phase 15B: useTasks Hook Tests
 * Rigorous tests covering:
 * - Base queries, pagination, and retry
 * - Search debouncing with fake timers (299ms vs 300ms, trims, resets)
 * - Query race conditions with deferred promises (latest-query-wins)
 * - Stale failure rejection
 * - Stale append rejection
 * - Deduplication preserving backend order
 * - Refresh success and error retention
 * - Same-tick duplicate loadMore locking
 */

import { renderHook, act } from '@testing-library/react-native';
import { useTasks, DEFAULT_SORT, PAGE_SIZE } from '../../src/features/tasks/hooks/useTasks';
import { taskApi } from '../../src/features/tasks/api/taskApi';
import { PagedData } from '../../src/shared/api';
import { TaskSummary } from '../../src/features/tasks/api/taskTypes';

jest.mock('../../src/features/tasks/api/taskApi');

describe('useTasks Custom Hook', () => {
  const mockTaskA: TaskSummary = {
    id: '11111111-1111-1111-1111-111111111111',
    project: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      code: 'PRJ-01',
      name: 'WorkSphere Mobile',
    },
    title: 'Implement Task List Screen',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    progressPercent: 60,
    assignees: [
      {
        id: 'user-1',
        fullName: 'Nguyễn Văn A',
        avatarUrl: null,
      },
    ],
    reporter: {
      id: 'user-0',
      fullName: 'Trần Văn Lead',
    },
    dueDate: '2026-11-20T00:00:00Z',
    overdue: false,
    subtaskCount: 3,
    completedSubtaskCount: 1,
    commentCount: 2,
    attachmentCount: 0,
    updatedAt: '2026-10-20T10:00:00Z',
  };

  const mockTaskB: TaskSummary = {
    id: '22222222-2222-2222-2222-222222222222',
    project: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      code: 'PRJ-01',
      name: 'WorkSphere Mobile',
    },
    title: 'Integrate Task Filter Chips',
    status: 'TODO',
    priority: 'MEDIUM',
    progressPercent: 0,
    assignees: [],
    dueDate: '2026-11-25T00:00:00Z',
    overdue: false,
    subtaskCount: 0,
    completedSubtaskCount: 0,
    commentCount: 0,
    attachmentCount: 0,
    updatedAt: '2026-10-20T11:00:00Z',
  };

  const mockTaskBUpdated: TaskSummary = {
    ...mockTaskB,
    title: 'Integrate Task Filter Chips (Updated)',
    progressPercent: 25,
  };

  const mockTaskC: TaskSummary = {
    id: '33333333-3333-3333-3333-333333333333',
    project: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      code: 'PRJ-02',
      name: 'Backend API',
    },
    title: 'Review Task API Endpoints',
    status: 'IN_REVIEW',
    priority: 'CRITICAL',
    progressPercent: 90,
    assignees: [
      {
        id: 'user-2',
        fullName: 'Lê Văn C',
        avatarUrl: null,
      },
    ],
    dueDate: '2026-10-15T00:00:00Z',
    overdue: true,
    subtaskCount: 2,
    completedSubtaskCount: 2,
    commentCount: 5,
    attachmentCount: 1,
    updatedAt: '2026-10-20T12:00:00Z',
  };

  const page0Data: PagedData<TaskSummary> = {
    items: [mockTaskA],
    page: 0,
    size: PAGE_SIZE,
    totalItems: 2,
    totalPages: 2,
    hasNext: true,
    hasPrevious: false,
  };

  const page1Data: PagedData<TaskSummary> = {
    items: [mockTaskB],
    page: 1,
    size: PAGE_SIZE,
    totalItems: 2,
    totalPages: 2,
    hasNext: false,
    hasPrevious: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('1. Base Queries & Pagination', () => {
    it('issues exact initial query on mount (page=0, size=20, sort=createdAt,desc)', async () => {
      let resolvePromise!: (val: PagedData<TaskSummary>) => void;
      const pendingPromise = new Promise<PagedData<TaskSummary>>(resolve => {
        resolvePromise = resolve;
      });
      (taskApi.listTasks as jest.Mock).mockReturnValueOnce(pendingPromise);

      const { result } = await renderHook(() => useTasks());

      expect(result.current.initialLoading).toBe(true);

      await act(async () => {
        resolvePromise(page0Data);
        await pendingPromise;
      });

      expect(taskApi.listTasks).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        sort: DEFAULT_SORT,
        search: undefined,
        status: undefined,
        priority: undefined,
        projectId: undefined,
      });

      expect(result.current.initialLoading).toBe(false);
      expect(result.current.tasks).toEqual([mockTaskA]);
      expect(result.current.totalItems).toBe(2);
      expect(result.current.page).toBe(0);
      expect(result.current.hasNext).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('sets presentation error on initial query failure and recovers on retry', async () => {
      let rejectPromise!: (err: unknown) => void;
      const pendingPromise = new Promise<PagedData<TaskSummary>>((_, reject) => {
        rejectPromise = reject;
      });
      (taskApi.listTasks as jest.Mock).mockReturnValueOnce(pendingPromise);

      const { result } = await renderHook(() => useTasks());

      expect(result.current.initialLoading).toBe(true);

      await act(async () => {
        rejectPromise({
          isAxiosError: true,
          response: {
            status: 403,
            data: { code: 'TASK_ACCESS_DENIED', message: 'Bạn không có quyền truy cập.' },
          },
        });
        try {
          await pendingPromise;
        } catch {
          // Expected
        }
      });

      expect(result.current.initialLoading).toBe(false);
      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.isForbidden).toBe(true);

      // Retry initial
      (taskApi.listTasks as jest.Mock).mockResolvedValueOnce(page0Data);

      await act(async () => {
        await result.current.loadInitial();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.tasks).toEqual([mockTaskA]);
    });

    it('appends next page on loadMore and marks hasNext false when exhausted', async () => {
      (taskApi.listTasks as jest.Mock)
        .mockResolvedValueOnce(page0Data)
        .mockResolvedValueOnce(page1Data);

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.tasks).toEqual([mockTaskA]);
      expect(result.current.hasNext).toBe(true);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(taskApi.listTasks).toHaveBeenCalledTimes(2);
      expect(taskApi.listTasks).toHaveBeenLastCalledWith({
        page: 1,
        size: 20,
        sort: DEFAULT_SORT,
        search: undefined,
        status: undefined,
        priority: undefined,
        projectId: undefined,
      });

      expect(result.current.tasks).toEqual([mockTaskA, mockTaskB]);
      expect(result.current.page).toBe(1);
      expect(result.current.hasNext).toBe(false);

      // Calling loadMore again when hasNext is false issues no request
      await act(async () => {
        await result.current.loadMore();
      });

      expect(taskApi.listTasks).toHaveBeenCalledTimes(2);
    });

    it('locks same-tick duplicate loadMore calls issuing only 1 API call', async () => {
      let resolveAppend!: (val: PagedData<TaskSummary>) => void;
      const appendPromise = new Promise<PagedData<TaskSummary>>(resolve => {
        resolveAppend = resolve;
      });

      (taskApi.listTasks as jest.Mock)
        .mockResolvedValueOnce(page0Data)
        .mockReturnValueOnce(appendPromise);

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        await Promise.resolve();
      });

      // Fire two loadMore calls simultaneously
      await act(async () => {
        result.current.loadMore();
        result.current.loadMore();
      });

      expect(taskApi.listTasks).toHaveBeenCalledTimes(2); // Initial (1) + loadMore (1)

      await act(async () => {
        resolveAppend(page1Data);
        await Promise.resolve();
      });

      expect(result.current.tasks).toEqual([mockTaskA, mockTaskB]);
    });

    it('preserves existing tasks and sets paginationError when page N>0 fails, then recovers on retry', async () => {
      (taskApi.listTasks as jest.Mock)
        .mockResolvedValueOnce(page0Data)
        .mockRejectedValueOnce(new Error('Network error on page 1'))
        .mockResolvedValueOnce(page1Data);

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.loadMore();
      });

      // Tasks preserved
      expect(result.current.tasks).toEqual([mockTaskA]);
      expect(result.current.paginationError).not.toBeNull();
      expect(result.current.loadingMore).toBe(false);

      // Retry pagination
      await act(async () => {
        await result.current.retryPagination();
      });

      expect(result.current.paginationError).toBeNull();
      expect(result.current.tasks).toEqual([mockTaskA, mockTaskB]);
    });

    it('pull-to-refresh preserves existing tasks during refresh and replaces on success', async () => {
      const refreshedPage0: PagedData<TaskSummary> = {
        ...page0Data,
        items: [mockTaskC],
      };

      (taskApi.listTasks as jest.Mock)
        .mockResolvedValueOnce(page0Data)
        .mockResolvedValueOnce(refreshedPage0);

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.tasks).toEqual([mockTaskA]);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.tasks).toEqual([mockTaskC]);
      expect(result.current.refreshError).toBeNull();
      expect(result.current.refreshing).toBe(false);
    });

    it('pull-to-refresh preserves existing tasks when refresh fails', async () => {
      (taskApi.listTasks as jest.Mock)
        .mockResolvedValueOnce(page0Data)
        .mockRejectedValueOnce(new Error('Server error on refresh'));

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.tasks).toEqual([mockTaskA]);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.tasks).toEqual([mockTaskA]);
      expect(result.current.refreshError).not.toBeNull();
      expect(result.current.refreshing).toBe(false);
    });
  });

  describe('2. Search Debouncing with Fake Timers', () => {
    it('does not issue search request at 299ms, but issues request at 300ms', async () => {
      (taskApi.listTasks as jest.Mock).mockResolvedValue(page0Data);

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(taskApi.listTasks).toHaveBeenCalledTimes(1);

      // User types 'Alpha'
      await act(async () => {
        result.current.setSearch('Alpha');
        jest.advanceTimersByTime(0);
      });

      expect(result.current.search).toBe('Alpha');

      // Fast-forward 299ms
      await act(async () => {
        jest.advanceTimersByTime(299);
        await Promise.resolve();
      });

      // Still only initial call
      expect(taskApi.listTasks).toHaveBeenCalledTimes(1);

      // Fast-forward remaining 1ms (total 300ms)
      await act(async () => {
        jest.advanceTimersByTime(1);
        await Promise.resolve();
      });

      expect(taskApi.listTasks).toHaveBeenCalledTimes(2);
      expect(taskApi.listTasks).toHaveBeenLastCalledWith({
        page: 0,
        size: 20,
        sort: DEFAULT_SORT,
        search: 'Alpha',
        status: undefined,
        priority: undefined,
        projectId: undefined,
      });
    });

    it('trims outer whitespace, preserves internal spaces, and omits whitespace-only searches', async () => {
      (taskApi.listTasks as jest.Mock).mockResolvedValue(page0Data);

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      // 1. Search with outer whitespace & internal space: '  Task   List  '
      await act(async () => {
        result.current.setSearch('  Task   List  ');
        jest.advanceTimersByTime(300);
        await Promise.resolve();
      });

      expect(taskApi.listTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'Task   List',
        })
      );

      // 2. Whitespace-only search: '    '
      await act(async () => {
        result.current.setSearch('    ');
        jest.advanceTimersByTime(300);
        await Promise.resolve();
      });

      expect(taskApi.listTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: undefined,
        })
      );
    });

    it('new search replaces pending debounce timer and resets page to 0', async () => {
      (taskApi.listTasks as jest.Mock).mockResolvedValue(page0Data);

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      await act(async () => {
        result.current.setSearch('First');
        jest.advanceTimersByTime(200);
      });

      // Replace search before 300ms elapses
      await act(async () => {
        result.current.setSearch('Second');
        jest.advanceTimersByTime(200);
      });

      // Only initial call so far
      expect(taskApi.listTasks).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      // Called with 'Second', never with 'First'
      expect(taskApi.listTasks).toHaveBeenCalledTimes(2);
      expect(taskApi.listTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'Second',
        })
      );
    });

    it('cleans up debounce timer on unmount', async () => {
      (taskApi.listTasks as jest.Mock).mockResolvedValue(page0Data);

      const { result, unmount } = await renderHook(() => useTasks());

      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      await act(async () => {
        result.current.setSearch('Unmounting');
      });

      unmount();
      jest.advanceTimersByTime(350);

      // No second request after unmount
      expect(taskApi.listTasks).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Concurrency & Latest-Query-Wins', () => {
    it('query race condition: Query B resolving first supersedes slower Query A', async () => {
      let resolveA!: (val: PagedData<TaskSummary>) => void;
      const promiseA = new Promise<PagedData<TaskSummary>>(resolve => {
        resolveA = resolve;
      });

      let resolveB!: (val: PagedData<TaskSummary>) => void;
      const promiseB = new Promise<PagedData<TaskSummary>>(resolve => {
        resolveB = resolve;
      });

      (taskApi.listTasks as jest.Mock).mockImplementation((params: { status?: string }) => {
        if (params?.status === 'TODO') {
          return promiseA;
        }
        if (params?.status === 'IN_REVIEW') {
          return promiseB;
        }
        return Promise.resolve(page0Data);
      });

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(taskApi.listTasks).toHaveBeenCalledTimes(1);

      // Start Query A by changing status filter to TODO
      await act(async () => {
        result.current.setStatusFilter('TODO');
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      // Start Query B by changing status filter to IN_REVIEW
      await act(async () => {
        result.current.setStatusFilter('IN_REVIEW');
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(taskApi.listTasks).toHaveBeenCalledTimes(3);

      // Resolve B first
      await act(async () => {
        resolveB({
          ...page0Data,
          items: [mockTaskB],
        });
        await promiseB;
      });

      expect(result.current.tasks).toEqual([mockTaskB]);

      // Resolve A later
      await act(async () => {
        resolveA({
          ...page0Data,
          items: [mockTaskA],
        });
        await promiseA;
      });

      // Stale Query A must NOT overwrite Query B!
      expect(result.current.tasks).toEqual([mockTaskB]);
    });

    it('stale failure: old Query A rejecting does not overwrite successful Query B', async () => {
      let rejectA!: (err: unknown) => void;
      const promiseA = new Promise<PagedData<TaskSummary>>((_, reject) => {
        rejectA = reject;
      });

      const dataB: PagedData<TaskSummary> = {
        ...page0Data,
        items: [mockTaskB],
      };

      (taskApi.listTasks as jest.Mock).mockImplementation((params: { status?: string }) => {
        if (params?.status === 'TODO') {
          return promiseA;
        }
        if (params?.status === 'IN_REVIEW') {
          return Promise.resolve(dataB);
        }
        return Promise.resolve(page0Data);
      });

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      // Start Query A (will be rejected later)
      await act(async () => {
        result.current.setStatusFilter('TODO');
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      // Start Query B (resolves successfully)
      await act(async () => {
        result.current.setStatusFilter('IN_REVIEW');
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(result.current.tasks).toEqual([mockTaskB]);
      expect(result.current.error).toBeNull();

      // Query A rejects now
      await act(async () => {
        rejectA(new Error('Old Query A failed'));
        try {
          await promiseA;
        } catch {
          // Expected
        }
        await Promise.resolve();
      });

      // B is retained, no error banner
      expect(result.current.tasks).toEqual([mockTaskB]);
      expect(result.current.error).toBeNull();
    });

    it('stale append: page 1 of Query A resolving after Query B is discarded', async () => {
      let resolveAppendA!: (val: PagedData<TaskSummary>) => void;
      const appendPromiseA = new Promise<PagedData<TaskSummary>>(resolve => {
        resolveAppendA = resolve;
      });

      const dataB: PagedData<TaskSummary> = {
        ...page0Data,
        items: [mockTaskC],
      };

      (taskApi.listTasks as jest.Mock).mockImplementation((params: { page: number; status?: string }) => {
        if (params.page === 1) {
          return appendPromiseA;
        }
        if (params.status === 'IN_REVIEW') {
          return Promise.resolve(dataB);
        }
        return Promise.resolve(page0Data);
      });

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(result.current.tasks).toEqual([mockTaskA]);

      // Trigger loadMore on Query A
      await act(async () => {
        result.current.loadMore();
      });

      // Before append resolves, user switches status to IN_REVIEW (Query B)
      await act(async () => {
        result.current.setStatusFilter('IN_REVIEW');
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(result.current.tasks).toEqual([mockTaskC]);

      // Now old Query A page 1 resolves
      await act(async () => {
        resolveAppendA(page1Data);
        await Promise.resolve();
      });

      // Stale page 1 must NOT be merged into Query B results
      expect(result.current.tasks).toEqual([mockTaskC]);
    });

    it('deduplication: merges pages and updates existing tasks by id while preserving order', async () => {
      const page0: PagedData<TaskSummary> = {
        items: [mockTaskA, mockTaskB],
        page: 0,
        size: 20,
        totalItems: 3,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
      };

      const page1: PagedData<TaskSummary> = {
        items: [mockTaskBUpdated, mockTaskC],
        page: 1,
        size: 20,
        totalItems: 3,
        totalPages: 2,
        hasNext: false,
        hasPrevious: true,
      };

      (taskApi.listTasks as jest.Mock)
        .mockResolvedValueOnce(page0)
        .mockResolvedValueOnce(page1);

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(result.current.tasks).toEqual([mockTaskA, mockTaskB]);

      await act(async () => {
        await result.current.loadMore();
      });

      // Deduplicated: mockTaskB is updated in place, mockTaskC is appended
      expect(result.current.tasks).toEqual([mockTaskA, mockTaskBUpdated, mockTaskC]);
    });
  });

  describe('4. Filters & Reset', () => {
    it('updates priority filter and resets search and status on clearFilters', async () => {
      (taskApi.listTasks as jest.Mock).mockResolvedValue(page0Data);

      const { result } = await renderHook(() => useTasks());

      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      await act(async () => {
        result.current.setPriorityFilter('CRITICAL');
        result.current.setStatusFilter('TODO');
        result.current.setSearch('Bug');
      });

      expect(result.current.priorityFilter).toBe('CRITICAL');
      expect(result.current.statusFilter).toBe('TODO');
      expect(result.current.search).toBe('Bug');

      await act(async () => {
        result.current.clearFilters();
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(result.current.priorityFilter).toBeUndefined();
      expect(result.current.statusFilter).toBeUndefined();
      expect(result.current.search).toBe('');
    });
  });
});
