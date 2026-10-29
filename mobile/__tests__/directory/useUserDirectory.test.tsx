import { act, renderHook } from '@testing-library/react-native';
import { directoryApi } from '../../src/features/directory/api/directoryApi';
import { UserDirectoryItem } from '../../src/features/directory/api/directoryTypes';
import { useUserDirectory } from '../../src/features/directory/hooks/useUserDirectory';
import { PagedData } from '../../src/shared/api';

jest.mock('../../src/features/directory/api/directoryApi');

describe('Phase 14E-G2: useUserDirectory Hook', () => {
  const user1: UserDirectoryItem = {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'user_one',
    fullName: 'User One',
    email: 'user1@worksphere.com',
    avatarUrl: null,
    departmentName: 'Phòng Kỹ thuật',
  };

  const user2: UserDirectoryItem = {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'user_two',
    fullName: 'User Two',
    email: 'user2@worksphere.com',
    avatarUrl: null,
    departmentName: 'Phòng Nhân sự',
  };

  const page0Data: PagedData<UserDirectoryItem> = {
    items: [user1],
    page: 0,
    size: 20,
    totalItems: 2,
    totalPages: 2,
    hasNext: true,
    hasPrevious: false,
  };

  const page1Data: PagedData<UserDirectoryItem> = {
    items: [user2],
    page: 1,
    size: 20,
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

  it('1. performs initial query on mount with explicit page=0, size=20, sort=fullName,asc', async () => {
    let resolvePromise!: (val: PagedData<UserDirectoryItem>) => void;
    const pending = new Promise<PagedData<UserDirectoryItem>>(res => {
      resolvePromise = res;
    });
    (directoryApi.searchUsers as jest.Mock).mockReturnValueOnce(pending);

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current.initialLoading).toBe(true);

    await act(async () => {
      resolvePromise(page0Data);
      await pending;
    });

    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(1);
    expect(directoryApi.searchUsers).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      sort: 'fullName,asc',
      search: undefined,
      departmentId: undefined,
    });
    expect(result.current.initialLoading).toBe(false);
    expect(result.current.users).toEqual([user1]);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.page).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('2. does not query if enabled is false', async () => {
    const { result } = await renderHook(() => useUserDirectory({ enabled: false }));

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(directoryApi.searchUsers).not.toHaveBeenCalled();
    expect(result.current.initialLoading).toBe(false);
    expect(result.current.users).toEqual([]);
  });

  it('3. debounces search input by 300ms (299ms no request, 300ms triggers request)', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValue(page0Data);

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(1);

    // Type in search
    await act(async () => {
      result.current.setSearch('Alice');
      jest.advanceTimersByTime(0);
    });

    expect(result.current.search).toBe('Alice');
    expect(result.current.debouncedSearch).toBe('');
    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(1);

    // Advance 299ms -> still no request
    await act(async () => {
      jest.advanceTimersByTime(299);
      await Promise.resolve();
    });
    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(1);

    // Advance 1ms more -> 300ms total -> debounced search updates and triggers request
    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(result.current.debouncedSearch).toBe('Alice');
    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(2);
    expect(directoryApi.searchUsers).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      sort: 'fullName,asc',
      search: 'Alice',
      departmentId: undefined,
    });
  });

  it('4. cancels previous debounce timer on rapid keystrokes', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValue(page0Data);

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.setSearch('A');
      jest.advanceTimersByTime(150);
    });

    await act(async () => {
      result.current.setSearch('Al');
      jest.advanceTimersByTime(150);
    });

    await act(async () => {
      result.current.setSearch('Ali');
    });

    // Advance 300ms from last keystroke
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(2);
    expect(directoryApi.searchUsers).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      sort: 'fullName,asc',
      search: 'Ali',
      departmentId: undefined,
    });
  });

  it('5. clears debounce timer on unmount', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValue(page0Data);

    const { result, unmount } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    await act(async () => {
      result.current.setSearch('Test');
    });

    await act(async () => {
      unmount();
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    // Should only have initial call, never the debounced one
    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(1);
  });

  it('6. latest-query-wins: discards stale response from earlier query', async () => {
    let resolveA!: (val: PagedData<UserDirectoryItem>) => void;
    let resolveB!: (val: PagedData<UserDirectoryItem>) => void;

    const promiseA = new Promise<PagedData<UserDirectoryItem>>(res => {
      resolveA = res;
    });
    const promiseB = new Promise<PagedData<UserDirectoryItem>>(res => {
      resolveB = res;
    });

    (directoryApi.searchUsers as jest.Mock).mockImplementation((params: { search?: string }) => {
      if (params?.search === 'QueryA') {
        return promiseA;
      }
      if (params?.search === 'QueryB') {
        return promiseB;
      }
      return Promise.resolve(page0Data);
    });

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    // Search QueryA starts
    await act(async () => {
      result.current.setSearch('QueryA');
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    // Search QueryB starts
    await act(async () => {
      result.current.setSearch('QueryB');
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(3);

    // Resolve B first
    await act(async () => {
      resolveB({
        ...page0Data,
        items: [user2],
      });
      await promiseB;
    });

    expect(result.current.users).toEqual([user2]);

    // Resolve A later -> must NOT overwrite B
    await act(async () => {
      resolveA({
        ...page0Data,
        items: [user1],
      });
      await promiseA;
    });

    expect(result.current.users).toEqual([user2]);
  });

  it('7. stale failure: older failing query does not overwrite newer successful query', async () => {
    let rejectA!: (err: unknown) => void;
    let resolveB!: (val: PagedData<UserDirectoryItem>) => void;

    const promiseA = new Promise<PagedData<UserDirectoryItem>>((_, rej) => {
      rejectA = rej;
    });
    const promiseB = new Promise<PagedData<UserDirectoryItem>>(res => {
      resolveB = res;
    });

    (directoryApi.searchUsers as jest.Mock).mockImplementation((params: { search?: string }) => {
      if (params?.search === 'QueryA') {
        return promiseA;
      }
      if (params?.search === 'QueryB') {
        return promiseB;
      }
      return Promise.resolve(page0Data);
    });

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    // Start QueryA
    await act(async () => {
      result.current.setSearch('QueryA');
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    // Start QueryB
    await act(async () => {
      result.current.setSearch('QueryB');
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    // Resolve B successfully
    await act(async () => {
      resolveB({
        ...page0Data,
        items: [user2],
      });
      await promiseB;
    });

    expect(result.current.error).toBeNull();
    expect(result.current.users).toEqual([user2]);

    // Reject A later
    await act(async () => {
      rejectA(new Error('Network failure'));
      try {
        await promiseA;
      } catch {
        // expected
      }
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.users).toEqual([user2]);
  });

  it('8. loadMore appends next page and updates hasNext/page', async () => {
    (directoryApi.searchUsers as jest.Mock)
      .mockResolvedValueOnce(page0Data)
      .mockResolvedValueOnce(page1Data);

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current.users).toEqual([user1]);
    expect(result.current.hasNext).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(2);
    expect(directoryApi.searchUsers).toHaveBeenLastCalledWith({
      page: 1,
      size: 20,
      sort: 'fullName,asc',
      search: undefined,
      departmentId: undefined,
    });
    expect(result.current.users).toEqual([user1, user2]);
    expect(result.current.page).toBe(1);
    expect(result.current.hasNext).toBe(false);
  });

  it('9. does nothing when loadMore is called and hasNext is false', async () => {
    (directoryApi.searchUsers as jest.Mock).mockResolvedValueOnce({
      ...page0Data,
      hasNext: false,
    });

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(1);
  });

  it('10. duplicate loadMore calls while loadingMore=true trigger only one network request', async () => {
    let resolveAppend!: (val: PagedData<UserDirectoryItem>) => void;
    const appendPromise = new Promise<PagedData<UserDirectoryItem>>(res => {
      resolveAppend = res;
    });

    (directoryApi.searchUsers as jest.Mock).mockImplementation((params: { page?: number }) => {
      if (params?.page === 1) {
        return appendPromise;
      }
      return Promise.resolve(page0Data);
    });

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    // Fire loadMore twice synchronously
    let p1!: Promise<void>;
    let p2!: Promise<void>;
    await act(async () => {
      p1 = result.current.loadMore();
      p2 = result.current.loadMore();
    });

    expect(directoryApi.searchUsers).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveAppend(page1Data);
      await Promise.all([p1, p2]);
    });
  });

  it('11. stale append: discards append response if search changed while append was in flight', async () => {
    let resolveAppend!: (val: PagedData<UserDirectoryItem>) => void;
    const appendPromise = new Promise<PagedData<UserDirectoryItem>>(res => {
      resolveAppend = res;
    });

    (directoryApi.searchUsers as jest.Mock).mockImplementation((params: { page?: number; search?: string }) => {
      if (params?.page === 1) {
        return appendPromise;
      }
      if (params?.search === 'BrandNew') {
        return Promise.resolve({ ...page0Data, items: [user2] });
      }
      return Promise.resolve(page0Data);
    });

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    // Start append
    let appendCallPromise!: Promise<void>;
    await act(async () => {
      appendCallPromise = result.current.loadMore();
    });

    // While append is in flight, user searches new keyword
    await act(async () => {
      result.current.setSearch('BrandNew');
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.users).toEqual([user2]);

    // Now append finishes -> must be discarded
    await act(async () => {
      resolveAppend(page1Data);
      await appendCallPromise;
    });

    expect(result.current.users).toEqual([user2]);
  });

  it('12. preserves existing users when pagination fails and allows retry', async () => {
    (directoryApi.searchUsers as jest.Mock)
      .mockResolvedValueOnce(page0Data)
      .mockRejectedValueOnce(new Error('Network error on page 1'))
      .mockResolvedValueOnce(page1Data);

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current.users).toEqual([user1]);

    // Load more fails
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.users).toEqual([user1]);
    expect(result.current.paginationError).not.toBeNull();

    // Retry pagination succeeds
    await act(async () => {
      await result.current.retryPagination();
    });

    expect(result.current.paginationError).toBeNull();
    expect(result.current.users).toEqual([user1, user2]);
  });

  it('13. deduplication: updates existing user in place preserving original position', async () => {
    const updatedUser1: UserDirectoryItem = {
      ...user1,
      fullName: 'User One (Updated)',
    };

    (directoryApi.searchUsers as jest.Mock)
      .mockResolvedValueOnce(page0Data)
      .mockResolvedValueOnce({
        ...page1Data,
        items: [updatedUser1, user2],
      });

    const { result } = await renderHook(() => useUserDirectory());

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[0]).toEqual(updatedUser1);
    expect(result.current.users[1]).toEqual(user2);
  });
});
