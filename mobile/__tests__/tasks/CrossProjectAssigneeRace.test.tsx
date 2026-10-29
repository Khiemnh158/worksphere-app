/**
 * Phase 15D: Cross-Project Candidate Race & Invalidation Tests
 * Enforces D-063 Invariant: TASK_CREATE_CROSS_PROJECT_ASSIGNEE_LEAK prevention.
 *
 * Test Scenario:
 * 1. Project A selected.
 * 2. Members request for Project A is in-flight (pending).
 * 3. User switches to Project B before A resolves.
 * 4. Members request for Project B is issued.
 * 5. B resolves first: Project B members displayed.
 * 6. Older request for A resolves later: Project A members MUST be discarded (generation guard).
 * 7. In CreateTaskScreen: selecting Project A with selected assignees, then changing to B,
 *    MUST synchronously clear all selected assignees.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ProjectMemberAssigneePickerModal } from '../../src/features/tasks/components/ProjectMemberAssigneePickerModal';
import { CreateTaskScreen } from '../../src/features/tasks/screens/CreateTaskScreen';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { ProjectMember, ProjectSummary } from '../../src/features/projects/api/projectTypes';
import { AppProviders } from '../../src/app/providers';
import { AuthContext } from '../../src/app/auth/AuthProvider';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('../../src/features/projects/api/projectApi');
jest.mock('../../src/features/tasks/api/taskApi');

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: undefined,
    }),
  };
});

describe('Cross-Project Candidate Race & Invalidation (Phase 15D)', () => {
  const membersA: ProjectMember[] = [
    {
      id: 'member-A1',
      projectId: 'proj-A',
      userId: 'user-A1',
      fullName: 'Nguyễn Thành Viên Dự Án A',
      email: 'a1@worksphere.com',
      avatarUrl: null,
      projectRole: 'MEMBER',
      joinedAt: '2026-01-01T00:00:00Z',
      leftAt: null,
      active: true,
    },
  ];

  const membersB: ProjectMember[] = [
    {
      id: 'member-B1',
      projectId: 'proj-B',
      userId: 'user-B1',
      fullName: 'Trần Kỹ Sư Dự Án B',
      email: 'b1@worksphere.com',
      avatarUrl: null,
      projectRole: 'TEAM_LEADER',
      joinedAt: '2026-02-01T00:00:00Z',
      leftAt: null,
      active: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. supersedes older in-flight Project A candidates when switching to Project B', async () => {
    let resolveA!: (val: any) => void;
    const promiseA = new Promise(res => {
      resolveA = res;
    });

    let resolveB!: (val: any) => void;
    const promiseB = new Promise(res => {
      resolveB = res;
    });

    (projectApi.listMembers as jest.Mock).mockImplementation((projectId: string) => {
      if (projectId === 'proj-A') return promiseA;
      if (projectId === 'proj-B') return promiseB;
      return Promise.resolve({ items: [], hasNext: false });
    });

    // Mount picker with Project A
    const { getByText, queryByText, rerender } = await render(
      <AppProviders>
        <ProjectMemberAssigneePickerModal
          visible={true}
          projectId="proj-A"
          selectedUserIds={[]}
          onConfirm={jest.fn()}
          onClose={jest.fn()}
        />
      </AppProviders>
    );

    await waitFor(() => {
      expect(projectApi.listMembers).toHaveBeenCalledWith('proj-A', expect.any(Object));
    });

    // While A is still pending, route/modal props change to Project B
    await rerender(
      <AppProviders>
        <ProjectMemberAssigneePickerModal
          visible={true}
          projectId="proj-B"
          selectedUserIds={[]}
          onConfirm={jest.fn()}
          onClose={jest.fn()}
        />
      </AppProviders>
    );

    await waitFor(() => {
      expect(projectApi.listMembers).toHaveBeenCalledWith('proj-B', expect.any(Object));
    });

    // Now resolve B first
    await act(async () => {
      resolveB({
        items: membersB,
        page: 0,
        size: 50,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
      await promiseB;
    });

    // B candidates displayed
    await waitFor(() => {
      expect(getByText('Trần Kỹ Sư Dự Án B')).toBeTruthy();
      expect(queryByText('Nguyễn Thành Viên Dự Án A')).toBeNull();
    });

    // Later, stale Project A response arrives
    await act(async () => {
      resolveA({
        items: membersA,
        page: 0,
        size: 50,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
      await promiseA;
    });

    // Project B candidates MUST remain, stale A discarded by generation guard!
    await waitFor(() => {
      expect(getByText('Trần Kỹ Sư Dự Án B')).toBeTruthy();
      expect(queryByText('Nguyễn Thành Viên Dự Án A')).toBeNull();
    });
  });

  it('2. CreateTaskScreen synchronously clears selected assignees when Project changes', async () => {
    const projectA: ProjectSummary = {
      id: 'proj-A',
      code: 'PRJ-A',
      name: 'Dự án Alpha',
      description: null,
      status: 'ACTIVE',
      priority: 'HIGH',
      manager: { id: 'mgr-1', fullName: 'Quản Lý', avatarUrl: null },
      startDate: '2026-01-01',
      plannedEndDate: '2026-12-31',
      progressPercent: 10,
      memberCount: 5,
      taskSummary: { total: 5, completed: 1, overdue: 0 },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const projectB: ProjectSummary = {
      ...projectA,
      id: 'proj-B',
      code: 'PRJ-B',
      name: 'Dự án Beta',
    };

    (projectApi.listProjects as jest.Mock).mockResolvedValue({
      items: [projectA, projectB],
      page: 0,
      size: 100,
      totalItems: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });

    (projectApi.listMembers as jest.Mock).mockImplementation((projectId: string) => {
      if (projectId === 'proj-A') {
        return Promise.resolve({
          items: membersA,
          page: 0,
          size: 50,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        });
      }
      return Promise.resolve({
        items: membersB,
        page: 0,
        size: 50,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    });

    const authContextValue: any = {
      currentUser: {
        id: 'user-task-creator',
        fullName: 'Task Creator',
        email: 'creator@worksphere.com',
        username: 'taskcreator',
        roles: ['PROJECT_MANAGER'],
        permissions: ['TASK_CREATE'],
      },
      initialized: true,
      sessionState: 'AUTHENTICATED',
    };

    const { getByTestId, getByText, queryByText } = await render(
      <AppProviders>
        <AuthContext.Provider value={authContextValue}>
          <CreateTaskScreen />
        </AuthContext.Provider>
      </AppProviders>
    );

    // 1. Select Project A
    fireEvent.press(getByTestId('btn-open-project-selector'));
    await waitFor(() => {
      expect(getByText('[PRJ-A]')).toBeTruthy();
    });
    fireEvent.press(getByTestId('project-option-proj-A'));
    await waitFor(() => {
      expect(getByTestId('project-option-proj-A').props.accessibilityState.selected).toBe(true);
    });
    fireEvent.press(getByTestId('btn-confirm-project-select'));

    await waitFor(() => {
      expect(getByText('[PRJ-A] Dự án Alpha')).toBeTruthy();
    });

    // 2. Select Assignee from Project A
    fireEvent.press(getByTestId('btn-open-assignee-picker'));
    await waitFor(() => {
      expect(getByText('Nguyễn Thành Viên Dự Án A')).toBeTruthy();
    });
    fireEvent.press(getByTestId('assignee-option-user-A1'));
    await waitFor(() => {
      expect(getByTestId('assignee-option-user-A1').props.accessibilityState.checked).toBe(true);
    });
    fireEvent.press(getByTestId('btn-confirm-assignee-select'));

    await waitFor(() => {
      expect(getByText('Nguyễn Thành Viên Dự Án A')).toBeTruthy();
    });

    // 3. User switches to Project B
    fireEvent.press(getByTestId('btn-open-project-selector'));
    await waitFor(() => {
      expect(getByText('[PRJ-B]')).toBeTruthy();
    });
    fireEvent.press(getByTestId('project-option-proj-B'));
    await waitFor(() => {
      expect(getByTestId('project-option-proj-B').props.accessibilityState.selected).toBe(true);
    });
    fireEvent.press(getByTestId('btn-confirm-project-select'));

    await waitFor(() => {
      expect(getByText('[PRJ-B] Dự án Beta')).toBeTruthy();
    });

    // Invariant: Selected assignee from Project A MUST be cleared synchronously!
    expect(queryByText('Nguyễn Thành Viên Dự Án A')).toBeNull();
    expect(getByText('Chưa phân công người thực hiện')).toBeTruthy();
  });
});
