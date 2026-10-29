/**
 * Phase 14E-G2: useUserDirectory Custom Hook
 * Manages user directory search, 300ms debouncing, pagination, pull-to-refresh,
 * and latest-query-wins concurrency.
 *
 * Concurrency & Invariant Model:
 * - Query Generation: Monotonically increasing generation number. Every new effective query
 *   (debounced search change, department filter change, refresh, retry) increments generation.
 * - Append Protection: Page N > 0 requests capture current generation and query snapshot;
 *   stale append responses are discarded if query changed before append response arrived.
 * - Deduplication: When merging pages, items are deduplicated by user id preserving backend order.
 * - Lifecycle Gating: When enabled is false (e.g. picker modal closed), requests are suspended
 *   and pending debounce timers are cleared.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { directoryApi } from '../api/directoryApi';
import {
  DIRECTORY_ALLOWED_SORT,
  DIRECTORY_DEFAULT_PAGE_SIZE,
  DirectoryPresentationError,
  mapDirectoryError,
  UserDirectoryItem,
} from '../api/directoryTypes';

export interface UseUserDirectoryOptions {
  departmentId?: string;
  initialSearch?: string;
  enabled?: boolean;
}

export interface UseUserDirectoryResult {
  users: UserDirectoryItem[];
  totalItems: number;
  initialLoading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  page: number;
  error: DirectoryPresentationError | null;
  paginationError: DirectoryPresentationError | null;
  search: string;
  debouncedSearch: string;
  setSearch: (text: string) => void;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  retryPagination: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useUserDirectory(options?: UseUserDirectoryOptions): UseUserDirectoryResult {
  const enabled = options?.enabled ?? true;
  const departmentId = options?.departmentId;
  const initialSearch = options?.initialSearch ?? '';

  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);

  const [initialLoading, setInitialLoading] = useState<boolean>(enabled);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<DirectoryPresentationError | null>(null);
  const [paginationError, setPaginationError] = useState<DirectoryPresentationError | null>(null);

  // Raw user input in search box
  const [search, setSearchState] = useState<string>(initialSearch);
  // Effective debounced search parameter sent to backend
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);

  const mountedRef = useRef<boolean>(true);
  const queryGenerationRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paginationLockRef = useRef<boolean>(false);

  // Keep latest state in ref for asynchronous query evaluation
  const queryStateRef = useRef({
    debouncedSearch,
    departmentId,
    page,
    hasNext,
    users,
    enabled,
  });
  queryStateRef.current = {
    debouncedSearch,
    departmentId,
    page,
    hasNext,
    users,
    enabled,
  };

  /**
   * Executes a replace query (page = 0) with the provided search and department.
   * Discards stale responses via queryGenerationRef.
   */
  const executeReplaceQuery = useCallback(
    async (
      activeSearch: string,
      activeDepartmentId: string | undefined,
      isRefresh: boolean
    ): Promise<void> => {
      const generation = ++queryGenerationRef.current;
      paginationLockRef.current = false;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
        setError(null);
      }
      setPaginationError(null);

      const trimmedSearch = activeSearch.trim();

      try {
        const response = await directoryApi.searchUsers({
          page: 0,
          size: DIRECTORY_DEFAULT_PAGE_SIZE,
          sort: DIRECTORY_ALLOWED_SORT,
          search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
          departmentId:
            typeof activeDepartmentId === 'string' && activeDepartmentId.trim().length > 0
              ? activeDepartmentId.trim()
              : undefined,
        });

        if (!mountedRef.current || generation !== queryGenerationRef.current) {
          return;
        }

        setUsers(response.items);
        setTotalItems(response.totalItems);
        setPage(response.page);
        setHasNext(response.hasNext);
        setError(null);
        setPaginationError(null);
      } catch (err: unknown) {
        if (!mountedRef.current || generation !== queryGenerationRef.current) {
          return;
        }

        const mapped = mapDirectoryError(err);
        setError(mapped);
      } finally {
        if (mountedRef.current && generation === queryGenerationRef.current) {
          if (isRefresh) {
            setRefreshing(false);
          } else {
            setInitialLoading(false);
          }
        }
      }
    },
    []
  );

  /**
   * Appends next page (page + 1) for the current active query.
   */
  const executeAppendQuery = useCallback(async (): Promise<void> => {
    const {
      debouncedSearch: currentSearch,
      departmentId: currentDept,
      page: currentPage,
      hasNext: canAppend,
      enabled: isEnabled,
    } = queryStateRef.current;

    if (!isEnabled || !canAppend || paginationLockRef.current) {
      return;
    }

    paginationLockRef.current = true;
    setLoadingMore(true);
    setPaginationError(null);

    const generation = queryGenerationRef.current;
    const nextPage = currentPage + 1;
    const trimmedSearch = currentSearch.trim();

    try {
      const response = await directoryApi.searchUsers({
        page: nextPage,
        size: DIRECTORY_DEFAULT_PAGE_SIZE,
        sort: DIRECTORY_ALLOWED_SORT,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
        departmentId:
          typeof currentDept === 'string' && currentDept.trim().length > 0
            ? currentDept.trim()
            : undefined,
      });

      if (!mountedRef.current || generation !== queryGenerationRef.current) {
        return;
      }

      setUsers(prevUsers => {
        // Merge & deduplicate by user id, preserving original ordering
        const existingIds = new Set(prevUsers.map(u => u.id));
        const newItems: UserDirectoryItem[] = [];

        // Replace any already present item with fresh response payload
        const updatedPrev = prevUsers.map(u => {
          const fresh = response.items.find(item => item.id === u.id);
          return fresh ?? u;
        });

        for (const item of response.items) {
          if (!existingIds.has(item.id)) {
            newItems.push(item);
          }
        }

        return [...updatedPrev, ...newItems];
      });

      setTotalItems(response.totalItems);
      setPage(response.page);
      setHasNext(response.hasNext);
      setPaginationError(null);
    } catch (err: unknown) {
      if (!mountedRef.current || generation !== queryGenerationRef.current) {
        return;
      }

      setPaginationError(mapDirectoryError(err));
    } finally {
      paginationLockRef.current = false;
      if (mountedRef.current && generation === queryGenerationRef.current) {
        setLoadingMore(false);
      }
    }
  }, []);

  /**
   * Search input with 300ms debounce
   */
  const setSearch = useCallback((text: string) => {
    setSearchState(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  /**
   * Triggers query replacement whenever debounced search or department changes,
   * provided the hook is currently enabled.
   */
  useEffect(() => {
    if (!enabled) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    executeReplaceQuery(debouncedSearch, departmentId, false);
  }, [enabled, debouncedSearch, departmentId, executeReplaceQuery]);

  /**
   * Manual retry of initial query
   */
  const retry = useCallback(() => {
    if (!enabled) {
      return Promise.resolve();
    }
    return executeReplaceQuery(debouncedSearch, departmentId, false);
  }, [enabled, debouncedSearch, departmentId, executeReplaceQuery]);

  /**
   * Pull-to-refresh
   */
  const refresh = useCallback(() => {
    if (!enabled) {
      return Promise.resolve();
    }
    return executeReplaceQuery(debouncedSearch, departmentId, true);
  }, [enabled, debouncedSearch, departmentId, executeReplaceQuery]);

  /**
   * Load more pagination
   */
  const loadMore = useCallback(() => {
    if (!enabled || initialLoading || refreshing || loadingMore || !hasNext || !!error) {
      return Promise.resolve();
    }
    return executeAppendQuery();
  }, [enabled, initialLoading, refreshing, loadingMore, hasNext, error, executeAppendQuery]);

  /**
   * Retry failed pagination append
   */
  const retryPagination = useCallback(() => {
    if (!enabled) {
      return Promise.resolve();
    }
    return executeAppendQuery();
  }, [enabled, executeAppendQuery]);

  /**
   * Clears state and cancels timers
   */
  const reset = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setUsers([]);
    setTotalItems(0);
    setPage(0);
    setHasNext(false);
    setError(null);
    setPaginationError(null);
    setSearchState('');
    setDebouncedSearch('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    users,
    totalItems,
    initialLoading,
    refreshing,
    loadingMore,
    hasNext,
    page,
    error,
    paginationError,
    search,
    debouncedSearch,
    setSearch,
    loadMore,
    retry,
    retryPagination,
    refresh,
    reset,
  };
}
