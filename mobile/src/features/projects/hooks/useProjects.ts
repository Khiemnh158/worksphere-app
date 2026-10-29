/**
 * Phase 14C: useProjects Custom Hook
 * Manages project list querying, 300ms search debouncing, pagination, pull-to-refresh,
 * and latest-query-wins concurrency.
 *
 * Concurrency Model:
 * - Query Generation: Monotonically increasing generation number. Every new effective query
 *   (debounced search change, filter change, sort change, pull-to-refresh) increments generation.
 * - Append Protection: Page N > 0 requests capture current generation and query snapshot;
 *   stale append responses are discarded if query changed before append response arrived.
 * - Deduplication: When merging pages, items are deduplicated by id preserving backend order.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { projectApi } from '../api/projectApi';
import { ProjectPriority, ProjectStatus, ProjectSummary } from '../api/projectTypes';
import { mapProjectError, ProjectPresentationError } from '../errors/projectErrorMapper';

export const PAGE_SIZE = 20;
export const DEFAULT_SORT = 'createdAt,desc';

export interface UseProjectsOptions {
  initialStatus?: ProjectStatus;
  initialPriority?: ProjectPriority;
  initialSort?: string;
}

export interface UseProjectsResult {
  projects: ProjectSummary[];
  totalItems: number;
  initialLoading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  page: number;
  error: ProjectPresentationError | null;
  paginationError: ProjectPresentationError | null;
  refreshError: string | null;
  search: string;
  setSearch: (text: string) => void;
  statusFilter: ProjectStatus | undefined;
  setStatusFilter: (status: ProjectStatus | undefined) => void;
  loadInitial: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retryPagination: () => Promise<void>;
  clearFilters: () => void;
}

export function useProjects(options?: UseProjectsOptions): UseProjectsResult {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<ProjectPresentationError | null>(null);
  const [paginationError, setPaginationError] = useState<ProjectPresentationError | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Raw user input in search box
  const [search, setSearchState] = useState<string>('');
  // Effective debounced search parameter sent to backend
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilterState] = useState<ProjectStatus | undefined>(options?.initialStatus);
  const sort = options?.initialSort ?? DEFAULT_SORT;

  const mountedRef = useRef<boolean>(true);
  const queryGenerationRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paginationLockRef = useRef<boolean>(false);

  // Keep latest state in ref for asynchronous query evaluation
  const queryStateRef = useRef({
    debouncedSearch,
    statusFilter,
    sort,
    page,
    hasNext,
    projects,
  });
  queryStateRef.current = {
    debouncedSearch,
    statusFilter,
    sort,
    page,
    hasNext,
    projects,
  };

  /**
   * Executes a replace query (page = 0) with the provided search and filter.
   * Discards stale responses via queryGenerationRef.
   */
  const executeReplaceQuery = useCallback(
    async (
      activeSearch: string,
      activeStatus: ProjectStatus | undefined,
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
        const response = await projectApi.listProjects({
          page: 0,
          size: PAGE_SIZE,
          sort,
          search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
          status: activeStatus,
        });

        if (!mountedRef.current || generation !== queryGenerationRef.current) {
          return;
        }

        setProjects(response.items);
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

        const mapped = mapProjectError(err);
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
    [sort]
  );

  /**
   * Appends next page (page + 1) for the current active query.
   */
  const executeAppendQuery = useCallback(async (): Promise<void> => {
    const { debouncedSearch: currentSearch, statusFilter: currentStatus, page: currentPage, hasNext: canAppend } =
      queryStateRef.current;

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
      const response = await projectApi.listProjects({
        page: nextPage,
        size: PAGE_SIZE,
        sort,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
        status: currentStatus,
      });

      if (!mountedRef.current || generation !== queryGenerationRef.current) {
        return;
      }

      setProjects(prevProjects => {
        // Merge & deduplicate by project id, preserving original ordering
        const existingIds = new Set(prevProjects.map(p => p.id));
        const newItems: ProjectSummary[] = [];

        // Replace any already present item with updated payload
        const updatedPrev = prevProjects.map(p => {
          const fresh = response.items.find(item => item.id === p.id);
          return fresh ?? p;
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

      setPaginationError(mapProjectError(err));
    } finally {
      paginationLockRef.current = false;
      if (mountedRef.current && generation === queryGenerationRef.current) {
        setLoadingMore(false);
      }
    }
  }, [sort]);

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
  const setStatusFilter = useCallback((newStatus: ProjectStatus | undefined) => {
    setStatusFilterState(newStatus);
  }, []);

  /**
   * Triggers query replacement whenever debounced search or status filter changes.
   */
  useEffect(() => {
    executeReplaceQuery(debouncedSearch, statusFilter, false);
  }, [debouncedSearch, statusFilter, executeReplaceQuery]);

  /**
   * Manual load / retry initial
   */
  const loadInitial = useCallback(() => {
    return executeReplaceQuery(debouncedSearch, statusFilter, false);
  }, [debouncedSearch, statusFilter, executeReplaceQuery]);

  /**
   * Pull-to-refresh
   */
  const refresh = useCallback(() => {
    return executeReplaceQuery(debouncedSearch, statusFilter, true);
  }, [debouncedSearch, statusFilter, executeReplaceQuery]);

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
    projects,
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
    loadInitial,
    refresh,
    loadMore,
    retryPagination,
    clearFilters,
  };
}
