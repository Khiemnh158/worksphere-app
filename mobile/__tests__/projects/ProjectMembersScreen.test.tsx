import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { ProjectMembersScreen } from '../../src/features/projects/screens/ProjectMembersScreen';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { renderWithProviders } from '../test-utils';
import { ProjectMember } from '../../src/features/projects/api/projectTypes';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: { projectId: 'project-1' },
    }),
  };
});

jest.mock('../../src/features/projects/api/projectApi');
jest.mock('../../src/features/directory/hooks/useUserDirectory', () => ({
  useUserDirectory: () => ({
    users: [],
    loading: false,
    initialLoading: false,
    refreshing: false,
    loadingMore: false,
    error: null,
    search: '',
    setSearch: jest.fn(),
    refresh: jest.fn(),
    loadMore: jest.fn(),
    retry: jest.fn(),
    reset: jest.fn(),
  }),
}));

describe('ProjectMembersScreen (SCR-PRJ-06 & SCR-PRJ-07)', () => {
  const mockMemberPM: ProjectMember = {
    id: 'mem-pm',
    projectId: 'project-1',
    userId: 'user-pm',
    fullName: 'Trưởng Dự Án',
    email: 'pm@worksphere.com',
    avatarUrl: null,
    projectRole: 'PROJECT_MANAGER',
    joinedAt: '2026-09-01T00:00:00Z',
    leftAt: null,
    active: true,
  };

  const mockMemberDev: ProjectMember = {
    id: 'mem-dev',
    projectId: 'project-1',
    userId: 'user-dev',
    fullName: 'Lập Trình Viên',
    email: 'dev@worksphere.com',
    avatarUrl: null,
    projectRole: 'MEMBER',
    joinedAt: '2026-09-02T00:00:00Z',
    leftAt: null,
    active: true,
  };

  const mockProjectDetail = {
    id: 'project-1',
    code: 'PRJ-1',
    name: 'Test Project',
    description: 'Test Desc',
    status: 'ACTIVE' as const,
    priority: 'HIGH' as const,
    manager: { id: 'user-pm', fullName: 'Trưởng Dự Án', avatarUrl: null },
    department: null,
    startDate: '2026-09-01',
    plannedEndDate: '2026-12-31',
    actualEndDate: null,
    progressPercent: 50,
    memberCount: 2,
    milestones: [],
    allowedActions: ['UPDATE', 'MANAGE_MEMBERS', 'CREATE_MILESTONE'],
    version: 1,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (projectApi.getProject as jest.Mock).mockResolvedValue(mockProjectDetail);
    (projectApi.listMembers as jest.Mock).mockResolvedValue({
      items: [mockMemberPM, mockMemberDev],
      page: 0,
      size: 100,
      totalItems: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });
  });

  const renderScreen = async () => {
    return await renderWithProviders(<ProjectMembersScreen />);
  };

  it('1. loads and renders member list with roles and contact information', async () => {
    const { getByTestId, getByText } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-project-members')).toBeTruthy();
      expect(getByText('Thành viên dự án (2)')).toBeTruthy();
    });

    expect(getByTestId('member-item-mem-pm')).toBeTruthy();
    expect(getByText('Trưởng Dự Án')).toBeTruthy();
    expect(getByText('pm@worksphere.com')).toBeTruthy();
    expect(getByText('Quản lý dự án')).toBeTruthy();

    expect(getByTestId('member-item-mem-dev')).toBeTruthy();
    expect(getByText('Lập Trình Viên')).toBeTruthy();
    expect(getByText('dev@worksphere.com')).toBeTruthy();
  });

  it('2. filters members list when role filter chip is clicked', async () => {
    const { getByTestId } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-project-members')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('filter-role-project_manager'));
    });

    expect(projectApi.listMembers).toHaveBeenCalledWith('project-1', expect.objectContaining({
      role: 'PROJECT_MANAGER',
    }));
  });

  it('3. updates member role and reflects change in local state', async () => {
    (projectApi.updateProjectMemberRole as jest.Mock).mockResolvedValueOnce({
      ...mockMemberDev,
      projectRole: 'TEAM_LEADER',
    });

    const { getByTestId } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('member-item-mem-dev')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-edit-role-mem-dev'));
    });

    await waitFor(() => {
      expect(getByTestId('modal-edit-role')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('radio-role-edit-team_leader'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-edit-role'));
    });

    await waitFor(() => {
      expect(projectApi.updateProjectMemberRole).toHaveBeenCalledWith(
        'project-1',
        'mem-dev',
        { projectRole: 'TEAM_LEADER' }
      );
      expect(getByTestId('member-role-mem-dev').props.children).toBe('Trưởng nhóm');
    });
  });

  it('4. D-013 Invariant: displays error and retains PM role when backend rejects demoting last PM', async () => {
    (projectApi.updateProjectMemberRole as jest.Mock).mockRejectedValueOnce(
      new Error('Không thể giáng cấp Project Manager duy nhất của dự án')
    );

    const { getByTestId, getByText } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('member-item-mem-pm')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-edit-role-mem-pm'));
    });

    await waitFor(() => {
      expect(getByTestId('modal-edit-role')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('radio-role-edit-member'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-edit-role'));
    });

    await waitFor(() => {
      expect(getByTestId('members-action-error-banner')).toBeTruthy();
      expect(getByText('Không thể giáng cấp Project Manager duy nhất của dự án')).toBeTruthy();
      // PM role must NOT be mutated
      expect(getByTestId('member-role-mem-pm').props.children).toBe('Quản lý dự án');
    });
  });

  it('5. removes member when confirmed in ConfirmationDialog', async () => {
    (projectApi.removeProjectMember as jest.Mock).mockResolvedValueOnce(undefined);

    const { getByTestId, queryByTestId } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('member-item-mem-dev')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-remove-member-mem-dev'));
    });

    await waitFor(() => {
      expect(getByTestId('dialog-confirm-remove-member')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('dialog-confirm-remove-member-confirm-btn'));
    });

    await waitFor(() => {
      expect(projectApi.removeProjectMember).toHaveBeenCalledWith('project-1', 'mem-dev');
      expect(queryByTestId('member-item-mem-dev')).toBeNull();
    });
  });

  it('6. D-013 Invariant: displays error and keeps member in list when removing last PM is rejected', async () => {
    (projectApi.removeProjectMember as jest.Mock).mockRejectedValueOnce(
      new Error('Không thể xoá Project Manager duy nhất của dự án')
    );

    const { getByTestId, getByText } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('member-item-mem-pm')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-remove-member-mem-pm'));
    });

    await waitFor(() => {
      expect(getByTestId('dialog-confirm-remove-member')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('dialog-confirm-remove-member-confirm-btn'));
    });

    await waitFor(() => {
      expect(getByTestId('members-action-error-banner')).toBeTruthy();
      expect(getByText('Không thể xoá Project Manager duy nhất của dự án')).toBeTruthy();
      // Last PM must still be in list
      expect(getByTestId('member-item-mem-pm')).toBeTruthy();
    });
  });

  it('7. direct route without MANAGE_MEMBERS: renders read-only member list and hides all mutation controls', async () => {
    (projectApi.getProject as jest.Mock).mockResolvedValue({
      ...mockProjectDetail,
      allowedActions: ['UPDATE', 'CREATE_TASK'], // No MANAGE_MEMBERS
    });

    const { getByTestId, queryByTestId, getByText } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-project-members')).toBeTruthy();
      expect(getByText('Thành viên dự án (2)')).toBeTruthy();
    });

    // Read list remains visible
    expect(getByTestId('member-item-mem-pm')).toBeTruthy();
    expect(getByTestId('member-item-mem-dev')).toBeTruthy();

    // All mutation controls must be completely absent
    expect(queryByTestId('btn-add-member')).toBeNull();
    expect(queryByTestId('btn-edit-role-mem-dev')).toBeNull();
    expect(queryByTestId('btn-remove-member-mem-dev')).toBeNull();
    expect(queryByTestId('btn-edit-role-mem-pm')).toBeNull();
    expect(queryByTestId('btn-remove-member-mem-pm')).toBeNull();
  });

  it('8. direct route with MANAGE_MEMBERS: renders mutation controls for members', async () => {
    (projectApi.getProject as jest.Mock).mockResolvedValue({
      ...mockProjectDetail,
      allowedActions: ['MANAGE_MEMBERS'],
    });

    const { getByTestId } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-project-members')).toBeTruthy();
    });

    expect(getByTestId('btn-add-member')).toBeTruthy();
    expect(getByTestId('btn-edit-role-mem-dev')).toBeTruthy();
    expect(getByTestId('btn-remove-member-mem-dev')).toBeTruthy();
  });

  it('9. capability loading fail-closed: mutation controls absent while ProjectDetail is loading', async () => {
    // getProject never resolves immediately
    (projectApi.getProject as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { getByTestId, queryByTestId } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-project-members')).toBeTruthy();
    });

    // Fails closed from first render: no mutation buttons
    expect(queryByTestId('btn-add-member')).toBeNull();
    expect(queryByTestId('btn-edit-role-mem-dev')).toBeNull();
    expect(queryByTestId('btn-remove-member-mem-dev')).toBeNull();
  });

  it('10. capability fetch error fail-closed: mutation controls absent if ProjectDetail fetch fails', async () => {
    (projectApi.getProject as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { getByTestId, queryByTestId, getByText } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-project-members')).toBeTruthy();
      expect(getByText('Thành viên dự án (2)')).toBeTruthy();
    });

    // Member list still renders (read-only)
    expect(getByTestId('member-item-mem-pm')).toBeTruthy();

    // Mutation controls fail-closed
    expect(queryByTestId('btn-add-member')).toBeNull();
    expect(queryByTestId('btn-edit-role-mem-dev')).toBeNull();
    expect(queryByTestId('btn-remove-member-mem-dev')).toBeNull();
  });
});
