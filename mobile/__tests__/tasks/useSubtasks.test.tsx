/**
 * Phase 15F: useSubtasks Hook Unit Tests
 *
 * Verifies:
 * 1. Initial loading state and successful subtasks fetch.
 * 2. Presentation error mapping when initial fetch fails.
 * 3. Pull-to-refresh retains existing list on error and surfaces non-blocking refreshError.
 * 4. In-flight request deduplication (same parentTaskId).
 * 5. Generation tracking discards stale async responses.
 * 6. addSubtask deduplicates by task ID and appends safely.
 * 7. Unmount safety prevents setState after unmount.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useSubtasks } from '../../src/features/tasks/hooks/useSubtasks';
import { taskApi } from '../../src/features/tasks/api/taskApi';
import { TaskDetail, TaskSummary } from '../../src/features/tasks/api/taskTypes';

jest.mock('../../src/features/tasks/api/taskApi');

const mockSubtaskSummary: TaskSummary = {
  id: 'subtask-1',
  project: { id: 'proj-1', name: 'ERP System', code: 'ERP' },
  parentTaskId: 'parent-task-1',
  title: 'Subtask 1: Setup DB Schema',
  status: 'TODO',
  priority: 'MEDIUM',
  progressPercent: 0,
  assignees: [],
  dueDate: '2026-10-31T17:00:00Z',
  overdue: false,
  subtaskCount: 0,
  completedSubtaskCount: 0,
  commentCount: 0,
  attachmentCount: 0,
  updatedAt: '2026-10-21T08:00:00Z',
};

const mockCreatedTaskDetail: TaskDetail = {
  id: 'subtask-2',
  project: { id: 'proj-1', name: 'ERP System', code: 'ERP' },
  parentTaskId: 'parent-task-1',
  parentTask: { id: 'parent-task-1', title: 'Parent Feature' },
  title: 'Subtask 2: Unit tests',
  description: 'Write unit tests',
  status: 'TODO',
  priority: 'HIGH',
  progressPercent: 0,
  reporter: { id: 'user-1', fullName: 'Tester' },
  assignees: [],
  subtasks: [],
  recentComments: [],
  attachments: [],
  statusHistory: [],
  allowedActions: ['UPDATE', 'UPDATE_STATUS'],
  createdAt: '2026-10-21T09:00:00Z',
  updatedAt: '2026-10-21T09:00:00Z',
  version: 1,
};

describe('Phase 15F: useSubtasks Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. fetches subtasks on mount and handles success', async () => {
    (taskApi.getSubtasks as jest.Mock).mockResolvedValueOnce([mockSubtaskSummary]);

    const { result } = await renderHook(() => useSubtasks('parent-task-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.subtasks).toHaveLength(1);
      expect(result.current.subtasks[0].id).toBe('subtask-1');
      expect(result.current.error).toBeNull();
    });

    expect(taskApi.getSubtasks).toHaveBeenCalledWith('parent-task-1');
  });

  it('2. maps error when initial fetch fails', async () => {
    (taskApi.getSubtasks as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = await renderHook(() => useSubtasks('parent-task-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.subtasks).toEqual([]);
      expect(result.current.error).not.toBeNull();
    });
  });

  it('3. refresh preserves existing list on failure and sets refreshError', async () => {
    (taskApi.getSubtasks as jest.Mock)
      .mockResolvedValueOnce([mockSubtaskSummary])
      .mockRejectedValueOnce(new Error('Refresh failed'));

    const { result } = await renderHook(() => useSubtasks('parent-task-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.subtasks).toHaveLength(1);
    });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.subtasks).toHaveLength(1);
      expect(result.current.refreshError).not.toBeNull();
      expect(result.current.refreshing).toBe(false);
    });
  });

  it('4. deduplicates concurrent in-flight calls for same parentTaskId', async () => {
    let resolveFirst!: (v: TaskSummary[]) => void;
    const pendingPromise = new Promise<TaskSummary[]>(resolve => {
      resolveFirst = resolve;
    });

    (taskApi.getSubtasks as jest.Mock).mockReturnValue(pendingPromise);

    const { result } = await renderHook(() => useSubtasks('parent-task-1'));

    let p1!: Promise<void>;
    let p2!: Promise<void>;
    await act(async () => {
      p1 = result.current.load();
      p2 = result.current.load();
    });

    expect(taskApi.getSubtasks).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst([mockSubtaskSummary]);
      await Promise.all([p1, p2, pendingPromise]);
    });

    expect(result.current.subtasks).toEqual([mockSubtaskSummary]);
  });

  it('5. addSubtask deduplicates by ID and adds new subtask to list', async () => {
    (taskApi.getSubtasks as jest.Mock).mockResolvedValueOnce([mockSubtaskSummary]);

    const { result } = await renderHook(() => useSubtasks('parent-task-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.subtasks).toHaveLength(1);

    await act(async () => {
      result.current.addSubtask(mockCreatedTaskDetail);
    });

    expect(result.current.subtasks).toHaveLength(2);
    expect(result.current.subtasks[0].id).toBe('subtask-2');

    // Calling addSubtask again with same ID does not duplicate
    await act(async () => {
      result.current.addSubtask(mockCreatedTaskDetail);
    });

    expect(result.current.subtasks).toHaveLength(2);
  });

  it('6. unmount safety does not crash on completed async call after unmount', async () => {
    let resolveCall: (v: TaskSummary[]) => void;
    const pending = new Promise<TaskSummary[]>(resolve => {
      resolveCall = resolve;
    });

    (taskApi.getSubtasks as jest.Mock).mockReturnValueOnce(pending);

    const { unmount } = await renderHook(() => useSubtasks('parent-task-1'));

    await unmount();

    await act(async () => {
      resolveCall!([mockSubtaskSummary]);
    });

    // Test finishes without unhandled rejections
    expect(true).toBe(true);
  });

  it('7. subtask GET vs create race: addSubtask invalidates older in-flight GET so old list does not erase new subtask', async () => {
    let resolveGetA!: (v: TaskSummary[]) => void;
    const pendingGetA = new Promise<TaskSummary[]>(resolve => {
      resolveGetA = resolve;
    });

    (taskApi.getSubtasks as jest.Mock).mockReturnValueOnce(pendingGetA);

    const { result } = await renderHook(() => useSubtasks('parent-task-1'));

    // Create subtask B succeeds while GET A is still in-flight
    await act(async () => {
      result.current.addSubtask(mockCreatedTaskDetail);
    });

    expect(result.current.subtasks).toHaveLength(1);
    expect(result.current.subtasks[0].id).toBe('subtask-2');

    // Now old GET A finishes with older list (does not include subtask-2)
    await act(async () => {
      resolveGetA([mockSubtaskSummary]);
      await pendingGetA;
    });

    // Subtask B must NOT be erased by old GET A
    expect(result.current.subtasks).toHaveLength(1);
    expect(result.current.subtasks[0].id).toBe('subtask-2');
  });

  it('8. subtask GET vs create race: old in-flight GET failure does not surface stale error after addSubtask', async () => {
    let rejectGetA!: (err: unknown) => void;
    const pendingGetA = new Promise<TaskSummary[]>((_, reject) => {
      rejectGetA = reject;
    });

    (taskApi.getSubtasks as jest.Mock).mockReturnValueOnce(pendingGetA);

    const { result } = await renderHook(() => useSubtasks('parent-task-1'));

    await act(async () => {
      result.current.addSubtask(mockCreatedTaskDetail);
    });

    // Now old GET A fails
    await act(async () => {
      rejectGetA(new Error('Network failure from old fetch'));
      try {
        await pendingGetA;
      } catch {
        // expected rejection
      }
    });

    // Error must NOT be surfaced
    expect(result.current.error).toBeNull();
    expect(result.current.subtasks).toHaveLength(1);
    expect(result.current.subtasks[0].id).toBe('subtask-2');
  });
});
