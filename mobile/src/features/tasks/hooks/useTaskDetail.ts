/**
 * Phase 15C: useTaskDetail Custom Hook
 * Manages task detail loading, error mapping, pull-to-refresh,
 * same-resource deduplication, and cross-resource generation supersession.
 *
 * Concurrency & Invariants:
 * - Request Generation: Monotonically increasing generation number per request.
 *   If route/taskId changes (A -> B), B receives generation > A. Even if A resolves
 *   after B, A's response is discarded because generation !== current.
 * - Deduplication: Concurrent same-tick calls for the SAME taskId share the in-flight promise.
 * - In-flight Ownership: Finally block only clears inFlightPromiseRef if the finished request
 *   matches targetId, preventing newer requests from having their lock prematurely cleared.
 * - Task-ID Transition: Clears prior task data on ID change, setting initialLoading=true to prevent
 *   stale data flash.
 * - Unmount Safety: Checks mountedRef before any state commit.
 * - Refresh Safety: Failed refresh retains existing task data and surfaces refreshError banner.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { taskApi } from '../api/taskApi';
import { TaskDetail } from '../api/taskTypes';
import { mapTaskError, TaskPresentationError } from '../errors/taskErrorMapper';

export interface UseTaskDetailResult {
  task: TaskDetail | null;
  initialLoading: boolean;
  refreshing: boolean;
  error: TaskPresentationError | null;
  refreshError: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  applyTaskUpdate: (updated: TaskDetail) => void;
}

export function useTaskDetail(taskId: string): UseTaskDetailResult {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<TaskPresentationError | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);
  const requestGenerationRef = useRef<number>(0);
  const inFlightPromiseRef = useRef<{ id: string; promise: Promise<void> } | null>(null);

  const executeFetch = useCallback(
    async (targetId: string, isRefresh: boolean): Promise<void> => {
      if (!targetId || targetId.trim().length === 0) {
        return;
      }

      // Check same-resource in-flight deduplication
      if (
        inFlightPromiseRef.current &&
        inFlightPromiseRef.current.id === targetId &&
        !isRefresh
      ) {
        return inFlightPromiseRef.current.promise;
      }

      const generation = ++requestGenerationRef.current;

      if (isRefresh) {
        setRefreshing(true);
        setRefreshError(null);
      } else {
        setInitialLoading(true);
        setError(null);
      }

      let currentPromise: Promise<void> | null = null;
      currentPromise = (async () => {
        try {
          const data = await taskApi.getTaskDetail(targetId);

          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          setTask(data);
          setError(null);
          setRefreshError(null);
        } catch (err: unknown) {
          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          const mapped = mapTaskError(err);
          if (isRefresh) {
            setRefreshError(mapped.message);
          } else {
            setError(mapped);
          }
        } finally {
          if (inFlightPromiseRef.current?.promise === currentPromise) {
            inFlightPromiseRef.current = null;
          }

          if (mountedRef.current && generation === requestGenerationRef.current) {
            if (isRefresh) {
              setRefreshing(false);
            } else {
              setInitialLoading(false);
            }
          }
        }
      })();

      inFlightPromiseRef.current = { id: targetId, promise: currentPromise };
      return currentPromise;
    },
    []
  );

  // Trigger fetch when taskId changes or on initial mount
  useEffect(() => {
    mountedRef.current = true;
    // When target taskId changes, reset task state and initialLoading so stale data is never shown
    setTask(null);
    setError(null);
    setRefreshError(null);
    setInitialLoading(true);

    executeFetch(taskId, false);

    return () => {
      mountedRef.current = false;
      inFlightPromiseRef.current = null;
    };
  }, [taskId, executeFetch]);

  const load = useCallback(() => {
    return executeFetch(taskId, false);
  }, [taskId, executeFetch]);

  const refresh = useCallback(() => {
    return executeFetch(taskId, true);
  }, [taskId, executeFetch]);

  const applyTaskUpdate = useCallback((updated: TaskDetail) => {
    // Supersede any pending in-flight GET requests so stale responses cannot overwrite
    requestGenerationRef.current++;
    inFlightPromiseRef.current = null;
    if (mountedRef.current) {
      setTask(updated);
      setError(null);
      setRefreshError(null);
    }
  }, []);

  return {
    task,
    initialLoading,
    refreshing,
    error,
    refreshError,
    load,
    refresh,
    applyTaskUpdate,
  };
}
