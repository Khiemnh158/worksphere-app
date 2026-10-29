/**
 * Phase 14B: useDashboard Custom Hook
 * Connects mobile Dashboard Screen (SCR-MAIN-01) to dashboardApi.getMyDashboard().
 *
 * Core Guarantees:
 * - Single-flight request deduplication: At most one dashboard network request is active at any time.
 *   Concurrent load/refresh calls share the active request; a new request starts only after the current flight settles.
 * - Generation and mounted guards defensively prevent stale/lifecycle state commits.
 * - Initial loading vs pull-to-refresh separation: failure during pull-to-refresh preserves existing data.
 * - Lock release after success, network failure, timeout, or malformed response rejection.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { dashboardApi, PersonalDashboardData } from '../api';

export interface UseDashboardResult {
  data: PersonalDashboardData | null;
  initialLoading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshError: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<PersonalDashboardData | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);
  const generationRef = useRef<number>(0);
  const inFlightPromiseRef = useRef<Promise<void> | null>(null);
  const dataRef = useRef<PersonalDashboardData | null>(null);

  // Sync ref with state
  dataRef.current = data;

  const fetchDashboard = useCallback(async (isRefresh: boolean) => {
    // Deduplication lock: return existing in-flight operation if one is running
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    const currentGeneration = ++generationRef.current;

    if (isRefresh) {
      setRefreshing(true);
      setRefreshError(null);
    } else {
      // If we already have data, don't flash initial loading indicator
      if (!dataRef.current) {
        setInitialLoading(true);
      }
      setError(null);
    }

    const execute = async () => {
      try {
        const result = await dashboardApi.getMyDashboard();

        // Stale or unmounted guard
        if (!mountedRef.current || currentGeneration !== generationRef.current) {
          return;
        }

        setData(result);
        setError(null);
        setRefreshError(null);
      } catch (err: unknown) {
        if (!mountedRef.current || currentGeneration !== generationRef.current) {
          return;
        }

        const safeMessage =
          err instanceof Error && err.message
            ? err.message
            : 'Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại.';

        if (isRefresh) {
          // Preserve existing data during refresh failure
          setRefreshError(safeMessage);
        } else {
          // If initial load or explicit retry without data
          if (!dataRef.current) {
            setError(safeMessage);
          } else {
            setRefreshError(safeMessage);
          }
        }
      } finally {
        inFlightPromiseRef.current = null;
        if (mountedRef.current && currentGeneration === generationRef.current) {
          if (isRefresh) {
            setRefreshing(false);
          } else {
            setInitialLoading(false);
          }
        }
      }
    };

    const promise = execute();
    inFlightPromiseRef.current = promise;
    return promise;
  }, []);

  const load = useCallback(() => {
    return fetchDashboard(false);
  }, [fetchDashboard]);

  const refresh = useCallback(() => {
    return fetchDashboard(true);
  }, [fetchDashboard]);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return {
    data,
    initialLoading,
    refreshing,
    error,
    refreshError,
    load,
    refresh,
  };
}
