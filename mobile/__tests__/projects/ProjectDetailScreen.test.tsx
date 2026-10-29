import React from 'react';
import { render, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import { ProjectDetailScreen } from '../../src/features/projects/screens/ProjectDetailScreen';
import { useProjectDetail } from '../../src/features/projects/hooks/useProjectDetail';
import { ProjectDetail } from '../../src/features/projects/api/projectTypes';
import { AppProviders } from '../../src/app/providers';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('../../src/features/projects/hooks/useProjectDetail');

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      addListener: mockAddListener,
    }),
    useRoute: () => ({
      params: { projectId: '11111111-1111-1111-1111-111111111111' },
    }),
  };
});

describe('ProjectDetailScreen Component', () => {
  const mockProjectDetail: ProjectDetail = {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'PRJ-2026-001',
    name: 'WorkSphere Platform Revamp',
    description: 'Xây dựng nền tảng quản trị công việc doanh nghiệp',
    status: 'ACTIVE',
    priority: 'HIGH',
    manager: {
      id: '99999999-9999-9999-9999-999999999999',
      fullName: 'Nguyễn Văn A',
      avatarUrl: null,
    },
    department: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      code: 'DEP-IT',
      name: 'Công nghệ thông tin',
    },
    startDate: '2026-09-01',
    plannedEndDate: '2026-12-31',
    actualEndDate: null,
    progressPercent: 75,
    memberCount: 8,
    milestones: [
      {
        id: 'm-1',
        projectId: '11111111-1111-1111-1111-111111111111',
        name: 'Hoàn thành Khảo sát',
        description: 'Khảo sát quy trình',
        dueDate: '2026-10-15',
        completedAt: '2026-10-14T08:00:00Z',
        status: 'COMPLETED',
        createdBy: '99999999-9999-9999-9999-999999999999',
        createdAt: '2026-09-01T08:00:00Z',
        version: 1,
      },
      {
        id: 'm-2',
        projectId: '11111111-1111-1111-1111-111111111111',
        name: 'Triển khai MVP',
        description: 'Phát hành bản thử nghiệm',
        dueDate: '2026-11-30',
        completedAt: null,
        status: 'IN_PROGRESS',
        createdBy: '99999999-9999-9999-9999-999999999999',
        createdAt: '2026-09-01T08:00:00Z',
        version: 1,
      },
    ],
    recentTasks: [],
    allowedActions: ['UPDATE', 'CHANGE_STATUS'],
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-19T08:00:00Z',
    version: 1,
  };

  const defaultMockHook = {
    project: mockProjectDetail,
    initialLoading: false,
    refreshing: false,
    error: null,
    refreshError: null,
    load: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddListener.mockReturnValue(jest.fn());
  });

  afterEach(async () => {
    await cleanup();
  });

  it('1. renders loading indicator when initialLoading is true', async () => {
    (useProjectDetail as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      project: null,
      initialLoading: true,
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    expect(getByTestId('project-detail-loading')).toBeTruthy();
    expect(getByText('Đang tải thông tin dự án...')).toBeTruthy();
  });

  it('2. renders error state with retry and goBack on error', async () => {
    const mockLoad = jest.fn();
    (useProjectDetail as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      project: null,
      error: {
        message: 'Dự án không tồn tại hoặc đã bị xóa.',
        placement: 'dialog',
        retryable: false,
        isConflict: false,
        isNotFound: true,
        isForbidden: false,
      },
      load: mockLoad,
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    expect(getByTestId('project-detail-error')).toBeTruthy();
    expect(getByText('Không tìm thấy dự án')).toBeTruthy();
    expect(getByText('Dự án không tồn tại hoặc đã bị xóa.')).toBeTruthy();

    const backBtn = getByTestId('btn-back-from-error');
    fireEvent.press(backBtn);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('3. renders canonical project detail fields correctly', async () => {
    (useProjectDetail as jest.Mock).mockReturnValue(defaultMockHook);

    const { getByText, queryByText, getByTestId } = await render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    expect(getByTestId('screen-project-detail')).toBeTruthy();
    expect(getByText('PRJ-2026-001')).toBeTruthy();
    expect(getByText('WorkSphere Platform Revamp')).toBeTruthy();
    expect(getByText('Xây dựng nền tảng quản trị công việc doanh nghiệp')).toBeTruthy();
    expect(getByText('Công nghệ thông tin')).toBeTruthy();
    expect(getByText('Nguyễn Văn A')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(getByText('01/09/2026')).toBeTruthy();
    expect(getByText('31/12/2026')).toBeTruthy();
    expect(getByText('Đang triển khai')).toBeTruthy();
    expect(getByText('THÀNH VIÊN (8)')).toBeTruthy();

    // Security: never renders raw UUIDs
    expect(queryByText('11111111-1111-1111-1111-111111111111')).toBeNull();
    expect(queryByText('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).toBeNull();
    expect(queryByText('99999999-9999-9999-9999-999999999999')).toBeNull();
  });

  it('4. renders milestone summary items correctly', async () => {
    (useProjectDetail as jest.Mock).mockReturnValue(defaultMockHook);

    const { getByText, getByTestId } = await render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    expect(getByTestId('project-detail-milestones-card')).toBeTruthy();
    expect(getByText('MỐC TIẾN ĐỘ (2)')).toBeTruthy();
    expect(getByText('Hoàn thành Khảo sát')).toBeTruthy();
    expect(getByText('Hạn chót: 15/10/2026')).toBeTruthy();
    expect(getByText('Triển khai MVP')).toBeTruthy();
    expect(getByText('Hạn chót: 30/11/2026')).toBeTruthy();
  });

  it('5. renders empty milestone state when milestones array is empty', async () => {
    (useProjectDetail as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      project: {
        ...mockProjectDetail,
        milestones: [],
      },
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    expect(getByTestId('milestones-empty-text')).toBeTruthy();
    expect(getByText('Chưa có mốc tiến độ nào được thiết lập.')).toBeTruthy();
  });

  it('6. renders non-blocking refresh error banner when refreshError is present', async () => {
    (useProjectDetail as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      refreshError: 'Lỗi làm mới dữ liệu. Vui lòng thử lại.',
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    expect(getByTestId('project-detail-refresh-error')).toBeTruthy();
    expect(getByText('Lỗi làm mới dữ liệu. Vui lòng thử lại.')).toBeTruthy();
    // Project detail itself is still rendered and visible
    expect(getByText('PRJ-2026-001')).toBeTruthy();
  });

  it('7. renders action buttons when allowedActions includes UPDATE and CHANGE_STATUS', async () => {
    (useProjectDetail as jest.Mock).mockReturnValue(defaultMockHook);

    const { getByTestId } = await render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    const editBtn = getByTestId('btn-edit-project');
    expect(editBtn).toBeTruthy();
    fireEvent.press(editBtn);
    expect(mockNavigate).toHaveBeenCalledWith('EditProject', {
      projectId: '11111111-1111-1111-1111-111111111111',
    });

    const statusBtn = getByTestId('btn-change-status');
    expect(statusBtn).toBeTruthy();
  });

  it('8. navigates to ProjectMembers and ProjectMilestones from cards', async () => {
    (useProjectDetail as jest.Mock).mockReturnValue(defaultMockHook);

    const { getByTestId } = await render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    const membersBtn = getByTestId('btn-manage-members');
    fireEvent.press(membersBtn);
    expect(mockNavigate).toHaveBeenCalledWith('ProjectMembers', {
      projectId: '11111111-1111-1111-1111-111111111111',
    });

    const milestonesBtn = getByTestId('btn-view-milestones');
    fireEvent.press(milestonesBtn);
    expect(mockNavigate).toHaveBeenCalledWith('ProjectMilestones', {
      projectId: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('9. hides action buttons when allowedActions is empty', async () => {
    (useProjectDetail as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      project: {
        ...mockProjectDetail,
        allowedActions: [],
      },
    });

    const { queryByTestId } = await render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    expect(queryByTestId('btn-edit-project')).toBeNull();
    expect(queryByTestId('btn-change-status')).toBeNull();
  });

  it('10. focus lifecycle: initial entry does not trigger duplicate refresh, but focus return after Edit triggers authoritative refresh', async () => {
    let focusCb: (() => void) | null = null;
    mockAddListener.mockImplementation((event: string, cb: () => void) => {
      if (event === 'focus') {
        focusCb = cb;
      }
      return jest.fn();
    });

    const mockRefresh = jest.fn();
    (useProjectDetail as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      refresh: mockRefresh,
    });

    render(
      <AppProviders>
        <ProjectDetailScreen />
      </AppProviders>
    );

    // Initial listener registered after render/effects flush
    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalledWith('focus', expect.any(Function));
    });
    expect(focusCb).toBeTruthy();

    // 1. First focus event on screen entry: must NOT trigger refresh (guarded against duplicate initial GET)
    act(() => {
      focusCb!();
    });
    expect(mockRefresh).not.toHaveBeenCalled();

    // 2. Return from Edit (subsequent focus): MUST trigger authoritative refresh to replace stale state
    act(() => {
      focusCb!();
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
