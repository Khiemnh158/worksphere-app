/**
 * Phase 14E: useProjectMembers Custom Hook
 * Manages project member listing, role filtering, pagination, refresh, and state mutations.
 *
 * Invariants:
 * - Generation supersession on projectId / filter changes.
 * - Deduplication of concurrent fetches for the same query.
 * - Unmount safety checking mountedRef.
 * - Refresh failure retains existing members list.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { projectApi } from '../api/projectApi';
import { ProjectMember, ProjectRole } from '../api/projectTypes';
import { mapProjectError, ProjectPresentationError } from '../errors/projectErrorMapper';

export interface UseProjectMembersResult {
  members: ProjectMember[];
  initialLoading: boolean;
  refreshing: boolean;
  error: ProjectPresentationError | null;
  refreshError: string | null;
  roleFilter: ProjectRole | undefined;
  setRoleFilter: (role?: ProjectRole) => void;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  updateLocalMember: (memberId: string, updated: Partial<ProjectMember>) => void;
  removeLocalMember: (memberId: string) => void;
  addLocalMember: (member: ProjectMember) => void;
}

export function useProjectMembers(projectId: string): UseProjectMembersResult {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<ProjectPresentationError | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<ProjectRole | undefined>(undefined);

  const mountedRef = useRef<boolean>(true);
  const requestGenerationRef = useRef<number>(0);
  const inFlightPromiseRef = useRef<Promise<void> | null>(null);

  const fetchMembers = useCallback(
    async (isRefresh: boolean, role?: ProjectRole): Promise<void> => {
      if (!projectId || projectId.trim().length === 0) {
        return;
      }

      if (inFlightPromiseRef.current && !isRefresh) {
        return inFlightPromiseRef.current;
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
          const res = await projectApi.listMembers(projectId, {
            role,
            size: 100, // retrieve full team for management view
          });

          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          setMembers(res.items);
          setError(null);
          setRefreshError(null);
        } catch (err: unknown) {
          if (!mountedRef.current || generation !== requestGenerationRef.current) {
            return;
          }

          const presentationError = mapProjectError(err);
          if (isRefresh) {
            setRefreshError(presentationError.message);
          } else {
            setError(presentationError);
          }
        } finally {
          if (mountedRef.current && generation === requestGenerationRef.current) {
            setInitialLoading(false);
            setRefreshing(false);
          }
          inFlightPromiseRef.current = null;
        }
      })();

      inFlightPromiseRef.current = fetchPromise;
      return fetchPromise;
    },
    [projectId]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchMembers(false, roleFilter);

    return () => {
      mountedRef.current = false;
      inFlightPromiseRef.current = null;
    };
  }, [fetchMembers, roleFilter]);

  const load = useCallback(() => fetchMembers(false, roleFilter), [fetchMembers, roleFilter]);
  const refresh = useCallback(() => fetchMembers(true, roleFilter), [fetchMembers, roleFilter]);

  const updateLocalMember = useCallback((memberId: string, updated: Partial<ProjectMember>) => {
    setMembers(prev =>
      prev.map(m => (m.id === memberId ? { ...m, ...updated } : m))
    );
  }, []);

  const removeLocalMember = useCallback((memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }, []);

  const addLocalMember = useCallback((member: ProjectMember) => {
    setMembers(prev => [member, ...prev.filter(m => m.id !== member.id)]);
  }, []);

  return {
    members,
    initialLoading,
    refreshing,
    error,
    refreshError,
    roleFilter,
    setRoleFilter,
    load,
    refresh,
    updateLocalMember,
    removeLocalMember,
    addLocalMember,
  };
}
