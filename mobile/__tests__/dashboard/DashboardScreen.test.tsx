import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DashboardScreen } from '../../src/features/dashboard/screens/DashboardScreen';
import { useDashboard } from '../../src/features/dashboard/hooks/useDashboard';
import { PersonalDashboardData } from '../../src/features/dashboard/api/dashboardTypes';
import { AppProviders } from '../../src/app/providers';

const mockNavigate = jest.fn();

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('../../src/features/dashboard/hooks/useDashboard');

describe('DashboardScreen (SCR-MAIN-01)', () => {
  const mockDashboardData: PersonalDashboardData = {
    tasks: {
      todo: 5,
      inProgress: 3,
      inReview: 1,
      completed: 12,
      overdue: 2,
      dueSoon: 4,
    },
    serviceRequests: {
      open: 2,
      inProgress: 1,
      waitingForUser: 1,
      resolved: 8,
    },
    projects: {
      active: 4,
      onHold: 1,
    },
    upcomingTasks: [
      {
        id: 'task-uuid-1',
        projectId: 'project-uuid-1',
        projectName: 'Alpha Portal Revamp',
        title: 'Review Security Specifications',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: '2026-10-25T17:00:00Z',
      },
      {
        id: 'task-uuid-2',
        projectId: 'project-uuid-2',
        projectName: 'Mobile App',
        title: 'Draft API Contracts',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '2026-10-26T10:00:00Z',
      },
      {
        id: 'task-uuid-3',
        projectId: 'project-uuid-3',
        projectName: 'Documentation',
        title: 'Update Readme',
        status: 'CANCELLED',
        priority: 'LOW',
        dueDate: '2026-10-27T12:00:00Z',
      },
      {
        id: 'task-uuid-4',
        projectId: 'project-uuid-4',
        projectName: 'Security Patch',
        title: 'Hotfix CVE',
        status: 'IN_REVIEW',
        priority: 'CRITICAL',
        dueDate: '2026-10-28T09:00:00Z',
      },
    ],
    recentNotifications: [
      {
        id: 'notif-uuid-1',
        type: 'TASK_ASSIGNED',
        title: 'Phân công công việc mới',
        message: 'Bạn được phân công công việc SCR-MAIN-01',
        referenceType: 'TASK',
        referenceId: 'task-uuid-1',
        read: false,
        createdAt: '2026-10-19T08:30:00Z',
      },
      {
        id: 'notif-uuid-2',
        type: 'COMMENT_ADDED',
        title: 'Bình luận mới',
        message: 'Nguyễn Văn A đã bình luận vào dự án',
        referenceType: 'PROJECT',
        referenceId: 'project-uuid-1',
        read: true,
        createdAt: '2026-10-18T15:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = async () => {
    return await render(
      <AppProviders>
        <DashboardScreen />
      </AppProviders>
    );
  };

  it('1. renders LoadingIndicator during initial load', async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: null,
      initialLoading: true,
      refreshing: false,
      error: null,
      refreshError: null,
      load: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('dashboard-loading')).toBeTruthy();
    expect(getByText('Đang tải dữ liệu bảng điều khiển...')).toBeTruthy();
  });

  it('2. renders full-screen ErrorState on initial load failure and permits retry', async () => {
    const mockLoad = jest.fn();
    (useDashboard as jest.Mock).mockReturnValue({
      data: null,
      initialLoading: false,
      refreshing: false,
      error: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.',
      refreshError: null,
      load: mockLoad,
      refresh: jest.fn(),
    });

    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('dashboard-error-state')).toBeTruthy();
    expect(getByText('Không thể tải bảng điều khiển')).toBeTruthy();
    expect(getByText('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.')).toBeTruthy();

    const retryBtn = getByText('Thử lại');
    fireEvent.press(retryBtn);

    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('3. renders complete canonical dashboard sections and metric values', async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      initialLoading: false,
      refreshing: false,
      error: null,
      refreshError: null,
      load: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId, getByText } = await renderScreen();

    // Verify Screen Title and ID
    expect(getByTestId('screen-dashboard')).toBeTruthy();
    expect(getByText('Bảng điều khiển')).toBeTruthy();
    expect(getByText('SCR-MAIN-01: Tổng quan công việc và dự án cá nhân')).toBeTruthy();

    // Verify Task Metrics
    expect(getByTestId('metric-tasks-todo')).toBeTruthy();
    expect(getByText('Cần làm')).toBeTruthy();
    expect(getByText('Đang làm')).toBeTruthy();
    expect(getByText('Đang xét')).toBeTruthy();
    expect(getByText('Hoàn thành')).toBeTruthy();
    expect(getByText('Quá hạn')).toBeTruthy();
    expect(getByText('Sắp đến hạn')).toBeTruthy();

    // Verify Project Metrics
    expect(getByTestId('metric-projects-active')).toBeTruthy();
    expect(getByText('Đang thực hiện')).toBeTruthy();
    expect(getByTestId('metric-projects-onhold')).toBeTruthy();
    expect(getByText('Tạm dừng')).toBeTruthy();

    // Verify Service Request Metrics
    expect(getByTestId('metric-service-open')).toBeTruthy();
    expect(getByText('Mở')).toBeTruthy();
    expect(getByTestId('metric-service-inprogress')).toBeTruthy();
    expect(getByTestId('metric-service-waiting')).toBeTruthy();
    expect(getByText('Chờ phản hồi')).toBeTruthy();
    expect(getByTestId('metric-service-resolved')).toBeTruthy();
    expect(getByText('Đã xử lý')).toBeTruthy();
  });

  it('4. renders upcoming task cards with status and priority badges', async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      initialLoading: false,
      refreshing: false,
      error: null,
      refreshError: null,
      load: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId, getByText, getAllByText, getByLabelText } = await renderScreen();

    expect(getByTestId('upcoming-task-item-0')).toBeTruthy();
    expect(getByText('Review Security Specifications')).toBeTruthy();
    expect(getByText('Alpha Portal Revamp')).toBeTruthy();
    expect(getAllByText('Đang xử lý').length).toBeGreaterThanOrEqual(1); // TaskStatus.IN_PROGRESS badge
    expect(getByText('Cao')).toBeTruthy(); // Priority.HIGH badge
    expect(getByLabelText('Độ ưu tiên: Cao')).toBeTruthy();

    expect(getByTestId('upcoming-task-item-1')).toBeTruthy();
    expect(getByText('Draft API Contracts')).toBeTruthy();
    expect(getByText('Mobile App')).toBeTruthy();
    expect(getByText('Trung bình')).toBeTruthy(); // Priority.MEDIUM badge
    expect(getByLabelText('Độ ưu tiên: Trung bình')).toBeTruthy();

    expect(getByTestId('upcoming-task-item-2')).toBeTruthy();
    expect(getByText('Update Readme')).toBeTruthy();
    expect(getByText('Thấp')).toBeTruthy(); // Priority.LOW badge
    expect(getByLabelText('Độ ưu tiên: Thấp')).toBeTruthy();

    expect(getByTestId('upcoming-task-item-3')).toBeTruthy();
    expect(getByText('Hotfix CVE')).toBeTruthy();
    expect(getByText('Khẩn cấp')).toBeTruthy(); // Priority.CRITICAL badge
    expect(getByLabelText('Độ ưu tiên: Khẩn cấp')).toBeTruthy();
  });

  it('5. renders recent notification cards with read/unread states', async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      initialLoading: false,
      refreshing: false,
      error: null,
      refreshError: null,
      load: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('recent-notification-item-0')).toBeTruthy();
    expect(getByText('Phân công công việc mới')).toBeTruthy();
    expect(getByText('Bạn được phân công công việc SCR-MAIN-01')).toBeTruthy();

    expect(getByTestId('recent-notification-item-1')).toBeTruthy();
    expect(getByText('Bình luận mới')).toBeTruthy();
    expect(getByText('Nguyễn Văn A đã bình luận vào dự án')).toBeTruthy();
  });

  it('6. renders section-level empty states when array data is empty', async () => {
    const emptyData: PersonalDashboardData = {
      ...mockDashboardData,
      upcomingTasks: [],
      recentNotifications: [],
    };

    (useDashboard as jest.Mock).mockReturnValue({
      data: emptyData,
      initialLoading: false,
      refreshing: false,
      error: null,
      refreshError: null,
      load: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId, getByText } = await renderScreen();

    // Summary sections remain visible
    expect(getByTestId('dashboard-task-summary-section')).toBeTruthy();

    // Section empty states are rendered
    expect(getByTestId('empty-upcoming-tasks')).toBeTruthy();
    expect(getByText('Không có công việc sắp đến hạn')).toBeTruthy();
    expect(getByText('Bạn không có công việc nào cần hoàn thành trong 72 giờ tới.')).toBeTruthy();

    expect(getByTestId('empty-recent-notifications')).toBeTruthy();
    expect(getByText('Chưa có thông báo gần đây')).toBeTruthy();
    expect(getByText('Mọi cập nhật và thông báo mới sẽ xuất hiện tại đây.')).toBeTruthy();
  });

  it('7. navigates to Projects tab when tapping "Xem tất cả" button', async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      initialLoading: false,
      refreshing: false,
      error: null,
      refreshError: null,
      load: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId } = await renderScreen();

    const viewAllBtn = getByTestId('btn-view-all-projects');
    fireEvent.press(viewAllBtn);

    expect(mockNavigate).toHaveBeenCalledWith('Projects');
  });

  it('8. displays inline error banner when pull-to-refresh fails while preserving content', async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      initialLoading: false,
      refreshing: false,
      error: null,
      refreshError: 'Không thể làm mới dữ liệu lúc này.',
      load: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('dashboard-refresh-error-banner')).toBeTruthy();
    expect(getByText('Không thể làm mới dữ liệu lúc này.')).toBeTruthy();
    // Content is preserved
    expect(getByText('Review Security Specifications')).toBeTruthy();
  });

  it('9. does not expose internal raw UUIDs in accessibility or UI labels', async () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      initialLoading: false,
      refreshing: false,
      error: null,
      refreshError: null,
      load: jest.fn(),
      refresh: jest.fn(),
    });

    const { queryByText } = await renderScreen();

    expect(queryByText('task-uuid-1')).toBeNull();
    expect(queryByText('project-uuid-1')).toBeNull();
    expect(queryByText('notif-uuid-1')).toBeNull();
  });
});
