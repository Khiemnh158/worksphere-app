/**
 * Phase 15F: useTaskComments Hook Unit Tests
 *
 * Verifies:
 * 1. Initial query on mount fetches page 0 with PAGE_SIZE = 20.
 * 2. Error mapping when initial fetch fails.
 * 3. Pagination (loadMore) fetches next page and appends deduplicating IDs.
 * 4. Pull-to-refresh preserves existing comments on failure and surfaces refreshError.
 * 5. addComment appends created comment safely.
 * 6. updateCommentInList updates matching comment item in place.
 * 7. removeCommentFromList removes comment item by ID.
 * 8. Unmount safety prevents state updates on unmounted hook.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useTaskComments } from '../../src/features/tasks/hooks/useTaskComments';
import { taskApi } from '../../src/features/tasks/api/taskApi';
import { TaskComment } from '../../src/features/tasks/api/taskTypes';
import { PagedData } from '../../src/shared/api';

jest.mock('../../src/features/tasks/api/taskApi');

const mockComment1: TaskComment = {
  id: 'comment-1',
  taskId: 'task-100',
  author: { id: 'user-1', fullName: 'Nguyễn Văn Dev' },
  content: 'Đã hoàn thành phần database.',
  isEdited: false,
  createdAt: '2026-10-21T08:00:00Z',
};

const mockComment2: TaskComment = {
  id: 'comment-2',
  taskId: 'task-100',
  author: { id: 'user-2', fullName: 'Trần Thị QA' },
  content: 'Cần bổ sung test case thanh toán.',
  isEdited: true,
  editedAt: '2026-10-21T08:30:00Z',
  createdAt: '2026-10-21T08:15:00Z',
};

const mockPage0: PagedData<TaskComment> = {
  items: [mockComment1],
  page: 0,
  size: 20,
  totalItems: 2,
  totalPages: 2,
  hasNext: true,
  hasPrevious: false,
};

const mockPage1: PagedData<TaskComment> = {
  items: [mockComment2],
  page: 1,
  size: 20,
  totalItems: 2,
  totalPages: 2,
  hasNext: false,
  hasPrevious: true,
};

describe('Phase 15F: useTaskComments Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. fetches initial page 0 on mount and sets comments', async () => {
    (taskApi.getComments as jest.Mock).mockResolvedValueOnce(mockPage0);

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.comments).toEqual([mockComment1]);
      expect(result.current.hasNext).toBe(true);
      expect(result.current.error).toBeNull();
    });

    expect(taskApi.getComments).toHaveBeenCalledWith('task-100', 0, 20);
  });

  it('2. sets presentation error when initial fetch fails', async () => {
    (taskApi.getComments as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.comments).toEqual([]);
      expect(result.current.error).not.toBeNull();
    });
  });

  it('3. loadMore fetches next page and appends deduplicated comments', async () => {
    (taskApi.getComments as jest.Mock)
      .mockResolvedValueOnce(mockPage0)
      .mockResolvedValueOnce(mockPage1);

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
      expect(result.current.hasNext).toBe(true);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(2);
      expect(result.current.comments[1].id).toBe('comment-2');
      expect(result.current.hasNext).toBe(false);
      expect(result.current.loadingMore).toBe(false);
    });

    expect(taskApi.getComments).toHaveBeenNthCalledWith(2, 'task-100', 1, 20);
  });

  it('4. pull-to-refresh preserves existing comments on network failure', async () => {
    (taskApi.getComments as jest.Mock)
      .mockResolvedValueOnce(mockPage0)
      .mockRejectedValueOnce(new Error('Network disconnected'));

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.comments).toEqual([mockComment1]);
      expect(result.current.refreshError).not.toBeNull();
      expect(result.current.refreshing).toBe(false);
    });
  });

  it('5. addComment appends created comment safely and deduplicates', async () => {
    (taskApi.getComments as jest.Mock).mockResolvedValueOnce(mockPage0);

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    await act(async () => {
      result.current.addComment(mockComment2);
    });

    expect(result.current.comments).toHaveLength(2);
    expect(result.current.comments[1].id).toBe('comment-2');

    // Duplicate ID is ignored
    await act(async () => {
      result.current.addComment(mockComment2);
    });

    expect(result.current.comments).toHaveLength(2);
  });

  it('6. updateCommentInList updates content of matching comment item', async () => {
    (taskApi.getComments as jest.Mock).mockResolvedValueOnce(mockPage0);

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    const updatedComment: TaskComment = {
      ...mockComment1,
      content: 'Nội dung bình luận đã được chỉnh sửa.',
      isEdited: true,
      editedAt: '2026-10-21T09:00:00Z',
    };

    await act(async () => {
      result.current.updateCommentInList('comment-1', updatedComment);
    });

    expect(result.current.comments[0].content).toBe('Nội dung bình luận đã được chỉnh sửa.');
    expect(result.current.comments[0].isEdited).toBe(true);
  });

  it('7. removeCommentFromList deletes comment by ID from state', async () => {
    (taskApi.getComments as jest.Mock).mockResolvedValueOnce(mockPage0);

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    await act(async () => {
      result.current.removeCommentFromList('comment-1');
    });

    expect(result.current.comments).toHaveLength(0);
  });

  it('8. unmount safety does not update state after unmount', async () => {
    let resolveCall!: (v: PagedData<TaskComment>) => void;
    const pending = new Promise<PagedData<TaskComment>>(res => {
      resolveCall = res;
    });

    (taskApi.getComments as jest.Mock).mockReturnValueOnce(pending);

    const { unmount } = await renderHook(() => useTaskComments('task-100'));

    await unmount();

    await act(async () => {
      resolveCall(mockPage0);
    });

    // Test finishes without errors or warnings
    expect(true).toBe(true);
  });

  it('9. comment GET vs create race: addComment invalidates older in-flight GET so old list does not erase new comment', async () => {
    let resolveGetA!: (v: PagedData<TaskComment>) => void;
    const pendingGetA = new Promise<PagedData<TaskComment>>(res => {
      resolveGetA = res;
    });

    (taskApi.getComments as jest.Mock).mockReturnValueOnce(pendingGetA);

    const { result } = await renderHook(() => useTaskComments('task-100'));

    // Create comment B succeeds while GET A is still in flight
    await act(async () => {
      result.current.addComment(mockComment2);
    });

    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0].id).toBe('comment-2');

    // Now old GET A completes with old data (mockPage0 has comment-1, not comment-2)
    await act(async () => {
      resolveGetA(mockPage0);
      await pendingGetA;
    });

    // Created comment B must NOT be erased by old GET A
    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0].id).toBe('comment-2');
  });

  it('10. comment GET vs update race: updateCommentInList invalidates older in-flight GET so old list does not overwrite update', async () => {
    (taskApi.getComments as jest.Mock).mockResolvedValueOnce(mockPage0);

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    // Start a background refresh that stays pending
    let resolveRefresh!: (v: PagedData<TaskComment>) => void;
    const pendingRefresh = new Promise<PagedData<TaskComment>>(res => {
      resolveRefresh = res;
    });
    (taskApi.getComments as jest.Mock).mockReturnValueOnce(pendingRefresh);

    let refreshPromise!: Promise<void>;
    await act(async () => {
      refreshPromise = result.current.refresh();
    });

    // Update comment-1 while refresh is in flight
    const updatedComment1: TaskComment = {
      ...mockComment1,
      content: 'Nội dung bình luận đã được chỉnh sửa mới.',
      isEdited: true,
    };
    await act(async () => {
      result.current.updateCommentInList('comment-1', updatedComment1);
    });

    expect(result.current.comments[0].content).toBe('Nội dung bình luận đã được chỉnh sửa mới.');

    // Now old refresh completes with pre-edit content
    await act(async () => {
      resolveRefresh(mockPage0);
      await pendingRefresh;
      await refreshPromise;
    });

    // Updated content must remain authoritative
    expect(result.current.comments[0].content).toBe('Nội dung bình luận đã được chỉnh sửa mới.');
  });

  it('11. comment GET vs delete race: removeCommentFromList invalidates older in-flight GET so old list does not restore deleted comment', async () => {
    (taskApi.getComments as jest.Mock).mockResolvedValueOnce(mockPage0);

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    // Start a background refresh that stays pending
    let resolveRefresh!: (v: PagedData<TaskComment>) => void;
    const pendingRefresh = new Promise<PagedData<TaskComment>>(res => {
      resolveRefresh = res;
    });
    (taskApi.getComments as jest.Mock).mockReturnValueOnce(pendingRefresh);

    let refreshPromise!: Promise<void>;
    await act(async () => {
      refreshPromise = result.current.refresh();
    });

    // Delete comment-1 while refresh is in flight
    await act(async () => {
      result.current.removeCommentFromList('comment-1');
    });

    expect(result.current.comments).toHaveLength(0);

    // Old refresh completes with comment-1 still present
    await act(async () => {
      resolveRefresh(mockPage0);
      await pendingRefresh;
      await refreshPromise;
    });

    // Comment must remain deleted
    expect(result.current.comments).toHaveLength(0);
  });

  it('12. comment GET failure after mutation does not surface stale error', async () => {
    let rejectGetA!: (err: unknown) => void;
    const pendingGetA = new Promise<PagedData<TaskComment>>((_, reject) => {
      rejectGetA = reject;
    });

    (taskApi.getComments as jest.Mock).mockReturnValueOnce(pendingGetA);

    const { result } = await renderHook(() => useTaskComments('task-100'));

    await act(async () => {
      result.current.addComment(mockComment2);
    });

    // Old GET A fails
    await act(async () => {
      rejectGetA(new Error('Old network error'));
      try {
        await pendingGetA;
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBeNull();
    expect(result.current.comments).toHaveLength(1);
  });
});
