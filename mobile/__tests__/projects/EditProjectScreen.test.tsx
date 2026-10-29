import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { EditProjectScreen } from '../../src/features/projects/screens/EditProjectScreen';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { AppProviders } from '../../src/app/providers';
import { ProjectDetail } from '../../src/features/projects/api/projectTypes';

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
      params: { projectId: 'project-uuid-1' },
    }),
  };
});

jest.mock('../../src/features/projects/api/projectApi');

describe('EditProjectScreen (SCR-PRJ-04)', () => {
  const mockProject: ProjectDetail = {
    id: 'project-uuid-1',
    code: 'PRJ-2026-001',
    name: 'Tên dự án ban đầu',
    description: 'Mô tả ban đầu',
    status: 'ACTIVE',
    priority: 'HIGH',
    manager: {
      id: 'manager-1',
      fullName: 'Nguyễn Văn A',
      avatarUrl: null,
    },
    department: {
      id: 'dept-1',
      code: 'ENG',
      name: 'Kỹ thuật phần mềm',
    },
    startDate: '2026-09-01',
    plannedEndDate: '2026-12-31',
    actualEndDate: null,
    progressPercent: 50,
    memberCount: 5,
    milestones: [],
    recentTasks: [],
    allowedActions: ['UPDATE', 'CHANGE_STATUS'],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    version: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (projectApi.getProject as jest.Mock).mockResolvedValue(mockProject);
  });

  const renderScreen = async () => {
    return await render(
      <AppProviders>
        <EditProjectScreen />
      </AppProviders>
    );
  };

  it('1. loads authoritative data and renders prefilled inputs and read-only fields', async () => {
    const { getByTestId, getByText } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-edit-project')).toBeTruthy();
      expect(getByText('Chỉnh sửa dự án')).toBeTruthy();
    });

    expect(projectApi.getProject).toHaveBeenCalledWith('project-uuid-1');

    // Read-only fields
    expect(getByTestId('edit-project-code-readonly')).toBeTruthy();
    expect(getByText('PRJ-2026-001')).toBeTruthy();
    expect(getByTestId('edit-project-department-readonly')).toBeTruthy();
    expect(getByText('Kỹ thuật phần mềm (ENG)')).toBeTruthy();

    // Prefilled inputs
    expect(getByTestId('edit-project-name-input').props.value).toBe('Tên dự án ban đầu');
    expect(getByTestId('edit-project-description-input').props.value).toBe('Mô tả ban đầu');
    expect(getByTestId('edit-project-start-date-input').props.value).toBe('2026-09-01');
    expect(getByTestId('edit-project-planned-end-date-input').props.value).toBe('2026-12-31');
  });

  it('2. validates required project name', async () => {
    const { getByTestId, getByText } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-edit-project')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('edit-project-name-input'), '');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-edit-project-submit'));
    });

    await waitFor(() => {
      expect(getByText('Tên dự án không được để trống')).toBeTruthy();
    });

    expect(projectApi.updateProject).not.toHaveBeenCalled();
  });

  it('3. submits updated details with version and navigates back', async () => {
    (projectApi.updateProject as jest.Mock).mockResolvedValueOnce({
      ...mockProject,
      name: 'Tên dự án đã sửa',
      version: 4,
    });

    const { getByTestId } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-edit-project')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('edit-project-name-input'), 'Tên dự án đã sửa');
      fireEvent.changeText(getByTestId('edit-project-description-input'), 'Mô tả mới');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-edit-project-submit'));
    });

    await waitFor(() => {
      expect(projectApi.updateProject).toHaveBeenCalledWith('project-uuid-1', {
        name: 'Tên dự án đã sửa',
        description: 'Mô tả mới',
        priority: 'HIGH',
        startDate: '2026-09-01',
        plannedEndDate: '2026-12-31',
        version: 3,
      });
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  it('4. displays conflict prompt on 409 OPTIMISTIC_LOCK_CONFLICT and offers reload', async () => {
    (projectApi.updateProject as jest.Mock).mockRejectedValueOnce({
      status: 409,
      code: 'OPTIMISTIC_LOCK_CONFLICT',
      message: 'Dữ liệu đã bị thay đổi',
    });

    const { getByTestId, getByText } = await renderScreen();

    await waitFor(() => {
      expect(getByTestId('screen-edit-project')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-edit-project-submit'));
    });

    await waitFor(() => {
      expect(getByTestId('edit-project-error-banner')).toBeTruthy();
      expect(getByText('Dữ liệu dự án đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.')).toBeTruthy();
      expect(getByTestId('btn-reload-conflict-data')).toBeTruthy();
    });

    // Clicking reload calls getProject again
    await act(async () => {
      fireEvent.press(getByTestId('btn-reload-conflict-data'));
    });

    expect(projectApi.getProject).toHaveBeenCalledTimes(2);
  });
});
