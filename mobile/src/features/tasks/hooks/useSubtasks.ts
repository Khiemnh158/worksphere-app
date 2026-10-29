/**
 * Phase 15F: useSubtasks Custom Hook (SCR-TSK-05)
 * Manages loading, refresh, deduplication, and error mapping for subtasks of a parent task.
 *
 * Concurrency & Invariants:
 * - Request Generation: Monotonically increasing generation number per request.
 * - Same-resource deduplication for concurrent load() invocations.
 * - In-flight ownership: finally block only clears promise if it matches current fetch.
 * - Retains existing subtasks on pull-to-refresh error, surfacing non-blocking refreshError.
 * - Unmount safety: checks mountedRef before committing any state updates.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { taskApi } from '../api/taskApi';
import { TaskDetail, TaskSummary } from '../api/taskTypes';
import { mapTaskError, TaskPresentationError } from '../errors/taskErrorMapper';

export interface UseSubtasksResult {
  subtasks: TaskSummary[];
  loading: boolean;
  refreshing: boolean;
  error: TaskPresentationError | null;
  refreshError: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  addSubtask: (created: TaskSummary | TaskDetail) => void;
}

export function useSubtasks(parentTaskId: string): UseSubtasksResult {
  const [subtasks, setSubtasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

      // In-flight deduplication for same task ID
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
        setLoading(true);
        setError(null);
      }

      let currentPromise: Promise<void> | null = null;
      currentPromise = (async () => {
        try {
          const list = await taskApi.getSubtasks(targetId);

          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          setSubtasks(list);
          setError(null);
          setRefreshError(null);
        } catch (err: unknown) {
          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          const presentationErr = mapTaskError(err);
          if (isRefresh) {
            setRefreshError(presentationErr.message);
          } else {
            setError(presentationErr);
          }
        } finally {
          if (mountedRef.current && generation === requestGenerationRef.current) {
            if (isRefresh) {
              setRefreshing(false);
            } else {
              setLoading(false);
            }
          }

          if (inFlightPromiseRef.current?.promise === currentPromise) {
            inFlightPromiseRef.current = null;
          }
        }
      })();

      inFlightPromiseRef.current = { id: targetId, promise: currentPromise };
      return currentPromise;
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    setSubtasks([]);
    setLoading(true);
    setError(null);
    setRefreshError(null);

    executeFetch(parentTaskId, false);

    return () => {
      mountedRef.current = false;
    };
  }, [parentTaskId, executeFetch]);

  const load = useCallback(async (): Promise<void> => {
    return executeFetch(parentTaskId, false);
  }, [parentTaskId, executeFetch]);

  const refresh = useCallback(async (): Promise<void> => {
    return executeFetch(parentTaskId, true);
  }, [parentTaskId, executeFetch]);

  const addSubtask = useCallback((created: TaskSummary | TaskDetail) => {
    // Invalidate any older in-flight GET request before committing mutation result
    requestGenerationRef.current++;
    inFlightPromiseRef.current = null;
    setLoading(false);
    setError(null);

    setSubtasks(prev => {
      // If already present, don't duplicate
      if (prev.some(t => t.id === created.id)) {
        return prev;
      }

      const summary: TaskSummary = {
        id: created.id,
        project: created.project,
        title: created.title,
        status: created.status,
        priority: created.priority,
        progressPercent: created.progressPercent,
        assignees: created.assignees,
        overdue: false,
        subtaskCount: 'subtaskCount' in created ? (created.subtaskCount ?? 0) : ((created as TaskDetail).subtasks?.length ?? 0),
        completedSubtaskCount: 'completedSubtaskCount' in created ? (created.completedSubtaskCount ?? 0) : 0,
        commentCount: 'commentCount' in created ? (created.commentCount ?? 0) : ((created as TaskDetail).recentComments?.length ?? 0),
        attachmentCount: 'attachmentCount' in created ? (created.attachmentCount ?? 0) : ((created as TaskDetail).attachments?.length ?? 0),
        updatedAt: created.updatedAt,
      };

      return [summary, ...prev];
    });
  }, []);

  return {
    subtasks,
    loading,
    refreshing,
    error,
    refreshError,
    load,
    refresh,
    addSubtask,
  };
}
