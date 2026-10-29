import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CreateProjectScreen } from '../../src/features/projects/screens/CreateProjectScreen';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { departmentApi } from '../../src/features/organization/api/departmentApi';
import { AppProviders } from '../../src/app/providers';

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
  };
});

jest.mock('../../src/features/projects/api/projectApi');
jest.mock('../../src/features/organization/api/departmentApi');
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

describe('CreateProjectScreen (SCR-PRJ-03)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (departmentApi.getDepartments as jest.Mock).mockResolvedValue([
      {
        id: 'dept-1',
        code: 'ENG',
        name: 'Kỹ thuật phần mềm',
        active: true,
      },
    ]);
  });

  const renderScreen = async () => {
    return await render(
      <AppProviders>
        <CreateProjectScreen />
      </AppProviders>
    );
  };

  it('1. renders all required form inputs and initial states', async () => {
    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('screen-create-project')).toBeTruthy();
    expect(getByTestId('create-project-code-input')).toBeTruthy();
    expect(getByTestId('create-project-name-input')).toBeTruthy();
    expect(getByTestId('create-project-description-input')).toBeTruthy();
    expect(getByTestId('create-project-priority-group')).toBeTruthy();
    expect(getByTestId('create-project-start-date-input')).toBeTruthy();
    expect(getByTestId('create-project-planned-end-date-input')).toBeTruthy();
    expect(getByTestId('create-project-department-select')).toBeTruthy();
    expect(getByTestId('btn-open-member-picker')).toBeTruthy();
    expect(getByTestId('btn-create-project-submit')).toBeTruthy();

    expect(getByText('Tạo dự án mới')).toBeTruthy();
  });

  it('2. validates required fields when submitted empty', async () => {
    const { getByTestId, getByText } = await renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-create-project-submit'));
    });

    await waitFor(() => {
      expect(getByText('Mã dự án không được để trống')).toBeTruthy();
      expect(getByText('Tên dự án không được để trống')).toBeTruthy();
    });

    expect(projectApi.createProject).not.toHaveBeenCalled();
  });

  it('3. validates date format and date range', async () => {
    const { getByTestId, getByText } = await renderScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('create-project-code-input'), 'PRJ-TEST');
      fireEvent.changeText(getByTestId('create-project-name-input'), 'Dự án kiểm thử');
      fireEvent.changeText(getByTestId('create-project-start-date-input'), '2026-12-01');
      fireEvent.changeText(getByTestId('create-project-planned-end-date-input'), '2026-10-01');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-create-project-submit'));
    });

    await waitFor(() => {
      expect(getByText('Ngày kết thúc không thể trước ngày bắt đầu')).toBeTruthy();
    });

    expect(projectApi.createProject).not.toHaveBeenCalled();
  });

  it('4. submits successfully and navigates to ProjectDetail', async () => {
    const mockCreatedProject: any = {
      id: 'prj-uuid-12345',
      code: 'PRJ-TEST',
      name: 'Dự án kiểm thử thành công',
    };
    (projectApi.createProject as jest.Mock).mockResolvedValueOnce(mockCreatedProject);

    const { getByTestId } = await renderScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('create-project-code-input'), 'PRJ-TEST');
      fireEvent.changeText(getByTestId('create-project-name-input'), 'Dự án kiểm thử thành công');
      fireEvent.changeText(getByTestId('create-project-description-input'), 'Mô tả dự án');
      fireEvent.changeText(getByTestId('create-project-start-date-input'), '2026-11-01');
      fireEvent.changeText(getByTestId('create-project-planned-end-date-input'), '2026-12-31');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-create-project-submit'));
    });

    await waitFor(() => {
      expect(projectApi.createProject).toHaveBeenCalledWith({
        code: 'PRJ-TEST',
        name: 'Dự án kiểm thử thành công',
        description: 'Mô tả dự án',
        priority: 'MEDIUM',
        startDate: '2026-11-01',
        plannedEndDate: '2026-12-31',
        departmentId: undefined,
        initialMemberIds: undefined,
      });
      expect(mockNavigate).toHaveBeenCalledWith('ProjectDetail', { projectId: 'prj-uuid-12345' });
    });
  });

  it('5. displays error banner when submission fails', async () => {
    (projectApi.createProject as jest.Mock).mockRejectedValueOnce(
      new Error('Mã dự án đã tồn tại trong hệ thống')
    );

    const { getByTestId, getByText } = await renderScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('create-project-code-input'), 'PRJ-DUP');
      fireEvent.changeText(getByTestId('create-project-name-input'), 'Dự án trùng mã');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-create-project-submit'));
    });

    await waitFor(() => {
      expect(getByTestId('create-project-error-banner')).toBeTruthy();
      expect(getByText('Mã dự án đã tồn tại trong hệ thống')).toBeTruthy();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('6. navigates back when header back button is pressed', async () => {
    const { getByTestId } = await renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-create-project-back'));
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
