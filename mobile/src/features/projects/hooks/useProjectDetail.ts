/**
 * Phase 14D: useProjectDetail Custom Hook
 * Manages project detail loading, error handling, pull-to-refresh,
 * same-resource deduplication, and different-resource generation supersession.
 *
 * Concurrency & Invariants:
 * - Request Generation: Monotonically increasing generation number per request.
 *   If route/projectId changes (A -> B), B receives generation > A. Even if A resolves
 *   after B, A's response is discarded because generation !== current.
 * - Deduplication: Concurrent same-tick calls for the SAME projectId share the in-flight promise.
 * - Unmount Safety: Checks mountedRef before any state commit.
 * - Refresh Safety: Failed refresh retains existing project data and surfaces refreshError banner.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { projectApi } from '../api/projectApi';
import { ProjectDetail } from '../api/projectTypes';
import { mapProjectError, ProjectPresentationError } from '../errors/projectErrorMapper';

export interface UseProjectDetailResult {
  project: ProjectDetail | null;
  initialLoading: boolean;
  refreshing: boolean;
  error: ProjectPresentationError | null;
  refreshError: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProjectDetail(projectId: string): UseProjectDetailResult {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<ProjectPresentationError | null>(null);
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

      const fetchPromise = (async () => {
        try {
          const data = await projectApi.getProject(targetId);

          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          setProject(data);
          setError(null);
          setRefreshError(null);
        } catch (err: unknown) {
          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          const mapped = mapProjectError(err);
          if (isRefresh) {
            setRefreshError(mapped.message);
          } else {
            setError(mapped);
          }
        } finally {
          if (inFlightPromiseRef.current?.id === targetId) {
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

      inFlightPromiseRef.current = { id: targetId, promise: fetchPromise };
      return fetchPromise;
    },
    []
  );

  // Trigger fetch when projectId changes or on initial mount
  useEffect(() => {
    mountedRef.current = true;
    // When target projectId changes, reset project state and initialLoading so stale data is never shown
    setProject(null);
    setError(null);
    setRefreshError(null);
    setInitialLoading(true);

    executeFetch(projectId, false);

    return () => {
      mountedRef.current = false;
      inFlightPromiseRef.current = null;
    };
  }, [projectId, executeFetch]);

  const load = useCallback(() => {
    return executeFetch(projectId, false);
  }, [projectId, executeFetch]);

  const refresh = useCallback(() => {
    return executeFetch(projectId, true);
  }, [projectId, executeFetch]);

  return {
    project,
    initialLoading,
    refreshing,
    error,
    refreshError,
    load,
    refresh,
  };
}
