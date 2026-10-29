/**
 * Phase 15F: useTaskComments Custom Hook (SCR-TSK-06)
 * Manages paginated comment list, appending, pull-to-refresh, in-memory updates, and deletions.
 *
 * Concurrency & Invariants:
 * - Monotonically increasing requestGenerationRef prevents stale page overwrites.
 * - Synchronous paginationLockRef prevents duplicate page fetching while in flight.
 * - Append deduplication by comment.id.
 * - Preserves existing comments on pull-to-refresh error, surfacing non-blocking refreshError.
 * - Unmount safety via mountedRef.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { taskApi } from '../api/taskApi';
import { TaskComment } from '../api/taskTypes';
import { mapTaskError, TaskPresentationError } from '../errors/taskErrorMapper';

export interface UseTaskCommentsResult {
  comments: TaskComment[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  error: TaskPresentationError | null;
  refreshError: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  addComment: (comment: TaskComment) => void;
  updateCommentInList: (commentId: string, updated: TaskComment) => void;
  removeCommentFromList: (commentId: string) => void;
}

const PAGE_SIZE = 20;

export function useTaskComments(taskId: string): UseTaskCommentsResult {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [error, setError] = useState<TaskPresentationError | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);
  const requestGenerationRef = useRef<number>(0);
  const paginationLockRef = useRef<boolean>(false);
  const inFlightPromiseRef = useRef<{ page: number; promise: Promise<void> } | null>(null);

  const fetchPage = useCallback(
    async (targetTaskId: string, pageNum: number, mode: 'initial' | 'refresh' | 'append'): Promise<void> => {
      if (!targetTaskId || targetTaskId.trim().length === 0) {
        return;
      }

      if (paginationLockRef.current && mode === 'append') {
        return;
      }

      paginationLockRef.current = true;
      const generation = ++requestGenerationRef.current;

      if (mode === 'initial') {
        setLoading(true);
        setError(null);
      } else if (mode === 'refresh') {
        setRefreshing(true);
        setRefreshError(null);
      } else if (mode === 'append') {
        setLoadingMore(true);
      }

      let currentPromise: Promise<void> | null = null;
      currentPromise = (async () => {
        try {
          const pageData = await taskApi.getComments(targetTaskId, pageNum, PAGE_SIZE);

          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          if (mode === 'append') {
            setComments(prev => {
              const existingIds = new Set(prev.map(c => c.id));
              const newItems = pageData.items.filter(c => !existingIds.has(c.id));
              return [...prev, ...newItems];
            });
          } else {
            setComments(pageData.items);
          }

          setCurrentPage(pageData.page);
          setHasNext(pageData.hasNext);
          setError(null);
          setRefreshError(null);
        } catch (err: unknown) {
          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          const presentationErr = mapTaskError(err);
          if (mode === 'refresh') {
            setRefreshError(presentationErr.message);
          } else if (mode === 'initial') {
            setError(presentationErr);
          }
        } finally {
          if (mountedRef.current && generation === requestGenerationRef.current) {
            if (mode === 'initial') setLoading(false);
            if (mode === 'refresh') setRefreshing(false);
            if (mode === 'append') setLoadingMore(false);
          }
          if (inFlightPromiseRef.current?.promise === currentPromise) {
            inFlightPromiseRef.current = null;
          }
          paginationLockRef.current = false;
        }
      })();

      inFlightPromiseRef.current = { page: pageNum, promise: currentPromise };
      return currentPromise;
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    setComments([]);
    setCurrentPage(0);
    setHasNext(false);

    fetchPage(taskId, 0, 'initial');

    return () => {
      mountedRef.current = false;
    };
  }, [taskId, fetchPage]);

  const load = useCallback(async (): Promise<void> => {
    return fetchPage(taskId, 0, 'initial');
  }, [taskId, fetchPage]);

  const refresh = useCallback(async (): Promise<void> => {
    return fetchPage(taskId, 0, 'refresh');
  }, [taskId, fetchPage]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasNext || loading || refreshing || loadingMore || paginationLockRef.current) {
      return;
    }
    return fetchPage(taskId, currentPage + 1, 'append');
  }, [taskId, hasNext, loading, refreshing, loadingMore, currentPage, fetchPage]);

  const addComment = useCallback((newComment: TaskComment) => {
    // Invalidate any older in-flight list fetches before committing created comment
    requestGenerationRef.current++;
    inFlightPromiseRef.current = null;
    paginationLockRef.current = false;
    setLoading(false);
    setError(null);

    setComments(prev => {
      if (prev.some(c => c.id === newComment.id)) {
        return prev;
      }
      return [...prev, newComment];
    });
  }, []);

  const updateCommentInList = useCallback((commentId: string, updated: TaskComment) => {
    // Invalidate any older in-flight list fetches before committing updated comment
    requestGenerationRef.current++;
    inFlightPromiseRef.current = null;

    setComments(prev => prev.map(c => (c.id === commentId ? updated : c)));
  }, []);

  const removeCommentFromList = useCallback((commentId: string) => {
    // Invalidate any older in-flight list fetches before committing removal
    requestGenerationRef.current++;
    inFlightPromiseRef.current = null;

    setComments(prev => prev.filter(c => c.id !== commentId));
  }, []);

  return {
    comments,
    loading,
    refreshing,
    loadingMore,
    hasNext,
    error,
    refreshError,
    load,
    refresh,
    loadMore,
    addComment,
    updateCommentInList,
    removeCommentFromList,
  };
}
