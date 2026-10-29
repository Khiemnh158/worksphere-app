/**
 * Phase 15B: useTasks Custom Hook
 * Manages task list querying, 300ms search debouncing, status and priority filters,
 * pagination, pull-to-refresh, and latest-query-wins concurrency.
 *
 * Concurrency & Invariants:
 * - Query Generation: Monotonically increasing generation number. Every new effective query
 *   (debounced search change, filter change, pull-to-refresh) increments generation.
 * - Append Protection: Page N > 0 requests capture current generation; stale append responses
 *   are discarded if query changed before append response arrived.
 * - Deduplication: When merging pages, items are deduplicated by id preserving backend order.
 * - Stale Failure Rejection: A rejected stale query does not overwrite fresh data or set errors.
 * - Synchronous Pagination Lock: Two same-tick loadMore calls issue exactly one API request.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { taskApi } from '../api/taskApi';
import { TaskPriority, TaskStatus, TaskSummary } from '../api/taskTypes';
import { mapTaskError, TaskPresentationError } from '../errors/taskErrorMapper';

export const PAGE_SIZE = 20;
export const DEFAULT_SORT = 'createdAt,desc';

export interface UseTasksOptions {
  projectId?: string;
  initialStatus?: TaskStatus;
  initialPriority?: TaskPriority;
  initialSort?: string;
}

export interface UseTasksResult {
  tasks: TaskSummary[];
  totalItems: number;
  initialLoading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  page: number;
  error: TaskPresentationError | null;
  paginationError: TaskPresentationError | null;
  refreshError: string | null;
  search: string;
  setSearch: (text: string) => void;
  statusFilter: TaskStatus | undefined;
  setStatusFilter: (status: TaskStatus | undefined) => void;
  priorityFilter: TaskPriority | undefined;
  setPriorityFilter: (priority: TaskPriority | undefined) => void;
  loadInitial: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retryPagination: () => Promise<void>;
  clearFilters: () => void;
}

export function useTasks(options?: UseTasksOptions): UseTasksResult {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<TaskPresentationError | null>(null);
  const [paginationError, setPaginationError] = useState<TaskPresentationError | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Raw user input in search box
  const [search, setSearchState] = useState<string>('');
  // Effective debounced search parameter sent to backend
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilterState] = useState<TaskStatus | undefined>(options?.initialStatus);
  const [priorityFilter, setPriorityFilterState] = useState<TaskPriority | undefined>(options?.initialPriority);

  const sort = options?.initialSort ?? DEFAULT_SORT;
  const projectId = options?.projectId;

  const mountedRef = useRef<boolean>(true);
  const queryGenerationRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paginationLockRef = useRef<boolean>(false);

  // Keep latest state in ref for asynchronous query evaluation
  const queryStateRef = useRef({
    debouncedSearch,
    statusFilter,
    priorityFilter,
    sort,
    projectId,
    page,
    hasNext,
    tasks,
  });
  queryStateRef.current = {
    debouncedSearch,
    statusFilter,
    priorityFilter,
    sort,
    projectId,
    page,
    hasNext,
    tasks,
  };

  /**
   * Executes a replace query (page = 0) with the provided search and filters.
   * Discards stale responses via queryGenerationRef.
   */
  const executeReplaceQuery = useCallback(
    async (
      activeSearch: string,
      activeStatus: TaskStatus | undefined,
      activePriority: TaskPriority | undefined,
      isRefresh: boolean
    ): Promise<void> => {
      const generation = ++queryGenerationRef.current;
      paginationLockRef.current = false;

      if (isRefresh) {
        setRefreshing(true);
        setRefreshError(null);
      } else {
        setInitialLoading(true);
        setError(null);
      }
      setPaginationError(null);

      const trimmedSearch = activeSearch.trim();

      try {
        const response = await taskApi.listTasks({
          page: 0,
          size: PAGE_SIZE,
          sort,
          search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
          status: activeStatus,
          priority: activePriority,
          projectId: projectId || undefined,
        });

        if (!mountedRef.current || generation !== queryGenerationRef.current) {
          return;
        }

        setTasks(response.items);
        setTotalItems(response.totalItems);
        setPage(response.page);
        setHasNext(response.hasNext);
        setError(null);
        setPaginationError(null);
        setRefreshError(null);
      } catch (err: unknown) {
        if (!mountedRef.current || generation !== queryGenerationRef.current) {
          return;
        }

        const mapped = mapTaskError(err);
        if (isRefresh) {
          setRefreshError(mapped.message);
        } else {
          setError(mapped);
        }
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
    [sort, projectId]
  );

  /**
   * Appends next page (page + 1) for the current active query.
   */
  const executeAppendQuery = useCallback(async (): Promise<void> => {
    const {
      debouncedSearch: currentSearch,
      statusFilter: currentStatus,
      priorityFilter: currentPriority,
      page: currentPage,
      hasNext: canAppend,
    } = queryStateRef.current;

    if (!canAppend || paginationLockRef.current) {
      return;
    }

    paginationLockRef.current = true;
    setLoadingMore(true);
    setPaginationError(null);

    const generation = queryGenerationRef.current;
    const nextPage = currentPage + 1;
    const trimmedSearch = currentSearch.trim();

    try {
      const response = await taskApi.listTasks({
        page: nextPage,
        size: PAGE_SIZE,
        sort,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
        status: currentStatus,
        priority: currentPriority,
        projectId: projectId || undefined,
      });

      if (!mountedRef.current || generation !== queryGenerationRef.current) {
        return;
      }

      setTasks(prevTasks => {
        // Merge & deduplicate by task id, preserving original ordering
        const existingIds = new Set(prevTasks.map(t => t.id));
        const newItems: TaskSummary[] = [];

        // Replace any already present item with updated payload
        const updatedPrev = prevTasks.map(t => {
          const fresh = response.items.find(item => item.id === t.id);
          return fresh ?? t;
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

      setPaginationError(mapTaskError(err));
    } finally {
      paginationLockRef.current = false;
      if (mountedRef.current && generation === queryGenerationRef.current) {
        setLoadingMore(false);
      }
    }
  }, [sort, projectId]);

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
   * Status filter setter resets page and issues replace query
   */
  const setStatusFilter = useCallback((newStatus: TaskStatus | undefined) => {
    setStatusFilterState(newStatus);
  }, []);

  /**
   * Priority filter setter resets page and issues replace query
   */
  const setPriorityFilter = useCallback((newPriority: TaskPriority | undefined) => {
    setPriorityFilterState(newPriority);
  }, []);

  /**
   * Triggers query replacement whenever debounced search or filters change.
   */
  useEffect(() => {
    executeReplaceQuery(debouncedSearch, statusFilter, priorityFilter, false);
  }, [debouncedSearch, statusFilter, priorityFilter, executeReplaceQuery]);

  /**
   * Manual load / retry initial
   */
  const loadInitial = useCallback(() => {
    return executeReplaceQuery(debouncedSearch, statusFilter, priorityFilter, false);
  }, [debouncedSearch, statusFilter, priorityFilter, executeReplaceQuery]);

  /**
   * Pull-to-refresh
   */
  const refresh = useCallback(() => {
    return executeReplaceQuery(debouncedSearch, statusFilter, priorityFilter, true);
  }, [debouncedSearch, statusFilter, priorityFilter, executeReplaceQuery]);

  /**
   * Load more pagination
   */
  const loadMore = useCallback(() => {
    if (initialLoading || refreshing || loadingMore || !hasNext || !!error) {
      return Promise.resolve();
    }
    return executeAppendQuery();
  }, [initialLoading, refreshing, loadingMore, hasNext, error, executeAppendQuery]);

  /**
   * Retry pagination
   */
  const retryPagination = useCallback(() => {
    return executeAppendQuery();
  }, [executeAppendQuery]);

  /**
   * Clear all filters and search
   */
  const clearFilters = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setSearchState('');
    setDebouncedSearch('');
    setStatusFilterState(undefined);
    setPriorityFilterState(undefined);
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
    tasks,
    totalItems,
    initialLoading,
    refreshing,
    loadingMore,
    hasNext,
    page,
    error,
    paginationError,
    refreshError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    loadInitial,
    refresh,
    loadMore,
    retryPagination,
    clearFilters,
  };
}
