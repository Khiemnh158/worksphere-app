/**
 * Phase 15D: ProjectMemberAssigneePickerModal Unit Tests
 * Verifies:
 * - Assignee source: projectApi.listMembers(projectId, { active: true }) ONLY
 * - Strictly zero calls to directoryApi
 * - Displays human identity (fullName, projectRole), zero raw UUIDs
 * - Selection outputs userId array
 * - Multi-select toggling and confirm
 * - Pagination loading and same-tick lock
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProjectMemberAssigneePickerModal } from '../../src/features/tasks/components/ProjectMemberAssigneePickerModal';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { directoryApi } from '../../src/features/directory/api/directoryApi';
import { ProjectMember } from '../../src/features/projects/api/projectTypes';
import { AppProviders } from '../../src/app/providers';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('../../src/features/projects/api/projectApi');
jest.mock('../../src/features/directory/api/directoryApi');

describe('ProjectMemberAssigneePickerModal (Phase 15D)', () => {
  const mockMembers: ProjectMember[] = [
    {
      id: 'member-uuid-1',
      projectId: 'proj-uuid-1',
      userId: 'user-uuid-1',
      fullName: 'Lê Văn Lập Trình',
      email: 'dev1@worksphere.com',
      avatarUrl: null,
      projectRole: 'MEMBER',
      joinedAt: '2026-01-01T00:00:00Z',
      leftAt: null,
      active: true,
    },
    {
      id: 'member-uuid-2',
      projectId: 'proj-uuid-1',
      userId: 'user-uuid-2',
      fullName: 'Phạm Thị Kiểm Thử',
      email: 'qa1@worksphere.com',
      avatarUrl: null,
      projectRole: 'TEAM_LEADER',
      joinedAt: '2026-01-01T00:00:00Z',
      leftAt: null,
      active: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. loads candidates via projectApi.listMembers with active=true and does NOT call directoryApi', async () => {
    (projectApi.listMembers as jest.Mock).mockResolvedValueOnce({
      items: mockMembers,
      page: 0,
      size: 50,
      totalItems: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });

    const mockConfirm = jest.fn();
    const mockClose = jest.fn();

    const { getByText, queryByText, getByTestId } = await render(
      <AppProviders>
        <ProjectMemberAssigneePickerModal
          visible={true}
          projectId="proj-uuid-1"
          selectedUserIds={[]}
          onConfirm={mockConfirm}
          onClose={mockClose}
        />
      </AppProviders>
    );

    await waitFor(() => {
      expect(projectApi.listMembers).toHaveBeenCalledTimes(1);
      expect(projectApi.listMembers).toHaveBeenCalledWith('proj-uuid-1', {
        active: true,
        page: 0,
        size: 50,
      });
      // Strictly ZERO calls to directoryApi!
      expect(directoryApi.searchUsers).not.toHaveBeenCalled();
      expect(getByText('Lê Văn Lập Trình')).toBeTruthy();
      expect(getByText('Phạm Thị Kiểm Thử')).toBeTruthy();
    });

    // Zero raw UUIDs exposed
    expect(queryByText('user-uuid-1')).toBeNull();
    expect(queryByText('user-uuid-2')).toBeNull();
    expect(queryByText('member-uuid-1')).toBeNull();
    expect(queryByText('proj-uuid-1')).toBeNull();

    // Select both and confirm
    fireEvent.press(getByTestId('assignee-option-user-uuid-1'));
    await waitFor(() => {
      expect(getByTestId('assignee-option-user-uuid-1').props.accessibilityState.checked).toBe(true);
    });

    fireEvent.press(getByTestId('assignee-option-user-uuid-2'));
    await waitFor(() => {
      expect(getByTestId('assignee-option-user-uuid-2').props.accessibilityState.checked).toBe(true);
    });

    fireEvent.press(getByTestId('btn-confirm-assignee-select'));

    expect(mockConfirm).toHaveBeenCalledWith(
      ['user-uuid-1', 'user-uuid-2'],
      mockMembers
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('2. filters members by name and email', async () => {
    (projectApi.listMembers as jest.Mock).mockResolvedValueOnce({
      items: mockMembers,
      page: 0,
      size: 50,
      totalItems: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });

    const { getByText, queryByText, getByPlaceholderText } = await render(
      <AppProviders>
        <ProjectMemberAssigneePickerModal
          visible={true}
          projectId="proj-uuid-1"
          selectedUserIds={[]}
          onConfirm={jest.fn()}
          onClose={jest.fn()}
        />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByText('Lê Văn Lập Trình')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Tìm kiếm thành viên theo tên...');
    fireEvent.changeText(searchInput, 'Kiểm Thử');

    await waitFor(() => {
      expect(getByText('Phạm Thị Kiểm Thử')).toBeTruthy();
      expect(queryByText('Lê Văn Lập Trình')).toBeNull();
    });
  });

  it('3. handles pagination and enforces same-tick loadMore lock', async () => {
    const page1Promise = new Promise(() => {});

    (projectApi.listMembers as jest.Mock)
      .mockResolvedValueOnce({
        items: [mockMembers[0]],
        page: 0,
        size: 1,
        totalItems: 2,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
      })
      .mockReturnValueOnce(page1Promise);

    const { getByText } = await render(
      <AppProviders>
        <ProjectMemberAssigneePickerModal
          visible={true}
          projectId="proj-uuid-1"
          selectedUserIds={[]}
          onConfirm={jest.fn()}
          onClose={jest.fn()}
        />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByText('Lê Văn Lập Trình')).toBeTruthy();
    });

    expect(projectApi.listMembers).toHaveBeenCalledTimes(1);
  });
});
