import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProjectsScreen } from '../../src/features/projects/screens/ProjectsScreen';
import { useProjects } from '../../src/features/projects/hooks/useProjects';
import { AuthContext } from '../../src/app/auth/AuthProvider';
import { AppProviders } from '../../src/app/providers';
import { ProjectSummary } from '../../src/features/projects/api/projectTypes';

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

jest.mock('../../src/features/projects/hooks/useProjects');

describe('ProjectsScreen (SCR-PRJ-01)', () => {
  const mockProject1: ProjectSummary = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    code: 'PRJ-2026-001',
    name: 'WorkSphere Platform',
    description: 'Nền tảng quản lý dự án',
    status: 'ACTIVE',
    priority: 'HIGH',
    manager: {
      id: 'e92d4fae-7dec-11d0-a765-00a0c91e6bf7',
      fullName: 'Nguyễn Văn A',
      avatarUrl: null,
    },
    startDate: '2026-09-01',
    plannedEndDate: '2026-12-31',
    progressPercent: 75,
    memberCount: 8,
    taskSummary: {
      total: 30,
      completed: 22,
      overdue: 1,
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-19T08:00:00Z',
  };

  const defaultMockHookReturn = {
    projects: [mockProject1],
    totalItems: 1,
    initialLoading: false,
    refreshing: false,
    loadingMore: false,
    hasNext: false,
    page: 0,
    error: null,
    paginationError: null,
    refreshError: null,
    search: '',
    setSearch: jest.fn(),
    statusFilter: undefined,
    setStatusFilter: jest.fn(),
    loadInitial: jest.fn(),
    refresh: jest.fn(),
    loadMore: jest.fn(),
    retryPagination: jest.fn(),
    clearFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreenWithAuth = async (permissions: string[] = ['PROJECT_READ']) => {
    const authContextValue: any = {
      currentUser: {
        id: 'user-1',
        fullName: 'Admin User',
        email: 'admin@worksphere.com',
        username: 'admin',
        roles: ['PROJECT_MANAGER'],
        permissions,
      },
    };

    return await render(
      <AppProviders>
        <AuthContext.Provider value={authContextValue}>
          <ProjectsScreen />
        </AuthContext.Provider>
      </AppProviders>
    );
  };

  it('1. renders loading indicator when initialLoading is true', async () => {
    (useProjects as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      projects: [],
      initialLoading: true,
    });

    const { getByTestId, getByText } = await renderScreenWithAuth();

    expect(getByTestId('projects-loading')).toBeTruthy();
    expect(getByText('Đang tải danh sách dự án...')).toBeTruthy();
  });

  it('2. renders ErrorState with retry button when initial query fails', async () => {
    const mockLoadInitial = jest.fn();
    (useProjects as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      projects: [],
      error: {
        message: 'Lỗi kết nối máy chủ',
        placement: 'dialog',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
      },
      loadInitial: mockLoadInitial,
    });

    const { getByTestId, getByText } = await renderScreenWithAuth();

    expect(getByTestId('projects-initial-error')).toBeTruthy();
    expect(getByText('Lỗi kết nối máy chủ')).toBeTruthy();

    const retryBtn = getByText('Thử lại');
    fireEvent.press(retryBtn);

    expect(mockLoadInitial).toHaveBeenCalledTimes(1);
  });

  it('3. renders project list with header and cards', async () => {
    (useProjects as jest.Mock).mockReturnValue(defaultMockHookReturn);

    const { getByTestId, getByText } = await renderScreenWithAuth();

    expect(getByTestId('screen-projects')).toBeTruthy();
    expect(getByText('Dự án')).toBeTruthy();
    expect(getByText('PRJ-2026-001')).toBeTruthy();
    expect(getByText('WorkSphere Platform')).toBeTruthy();
  });

  it('4. navigates to ProjectDetail with exact projectId param when project card is pressed in 14D', async () => {
    (useProjects as jest.Mock).mockReturnValue(defaultMockHookReturn);

    const { getByTestId } = await renderScreenWithAuth();

    const card = getByTestId('project-card-prj-2026-001');
    expect(card).toBeTruthy();

    fireEvent.press(card);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('ProjectDetail', {
      projectId: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    });
  });

  it('5. renders Create Project button and navigates to CreateProject when user has PROJECT_CREATE permission', async () => {
    (useProjects as jest.Mock).mockReturnValue(defaultMockHookReturn);

    const { getByTestId } = await renderScreenWithAuth(['PROJECT_READ', 'PROJECT_CREATE']);

    const createBtn = getByTestId('btn-create-project');
    expect(createBtn).toBeTruthy();

    fireEvent.press(createBtn);
    expect(mockNavigate).toHaveBeenCalledWith('CreateProject');
  });

  it('5b. hides Create Project button when user lacks PROJECT_CREATE permission', async () => {
    (useProjects as jest.Mock).mockReturnValue(defaultMockHookReturn);

    const { queryByTestId } = await renderScreenWithAuth(['PROJECT_READ']);

    expect(queryByTestId('btn-create-project')).toBeNull();
  });

  it('6. exposes exact canonical status filter chips (Tất cả, Đang chạy, Bản nháp, Tạm dừng)', async () => {
    (useProjects as jest.Mock).mockReturnValue(defaultMockHookReturn);

    const { getByTestId, queryByTestId, getByText } = await renderScreenWithAuth();

    expect(getByTestId('filter-chip-all')).toBeTruthy();
    expect(getByTestId('filter-chip-active')).toBeTruthy();
    expect(getByTestId('filter-chip-draft')).toBeTruthy();
    expect(getByTestId('filter-chip-on_hold')).toBeTruthy();

    expect(getByText('Tất cả')).toBeTruthy();
    expect(getByText('Đang chạy')).toBeTruthy();
    expect(getByText('Bản nháp')).toBeTruthy();
    expect(getByText('Tạm dừng')).toBeTruthy();

    // COMPLETED is excluded from primary status filter chips per canonical wireframe
    expect(queryByTestId('filter-chip-completed')).toBeNull();
  });

  it('7. displays filter-specific empty state when query returns no results', async () => {
    const mockClearFilters = jest.fn();
    (useProjects as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      projects: [],
      search: 'nonexistent',
      clearFilters: mockClearFilters,
    });

    const { getByTestId, getByText } = await renderScreenWithAuth();

    expect(getByTestId('projects-empty-filtered')).toBeTruthy();
    expect(getByText('Không tìm thấy dự án phù hợp')).toBeTruthy();

    const clearBtn = getByText('Xóa bộ lọc');
    fireEvent.press(clearBtn);

    expect(mockClearFilters).toHaveBeenCalledTimes(1);
  });

  it('8. displays no-projects empty state when user has no projects at all', async () => {
    (useProjects as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      projects: [],
      search: '',
      statusFilter: undefined,
    });

    const { getByTestId, getByText } = await renderScreenWithAuth();

    expect(getByTestId('projects-empty-all')).toBeTruthy();
    expect(getByText('Bạn chưa tham gia dự án nào')).toBeTruthy();
  });

  it('9. displays non-blocking refresh error banner when refreshError exists', async () => {
    (useProjects as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      refreshError: 'Không thể làm mới danh sách lúc này',
    });

    const { getByTestId, getByText } = await renderScreenWithAuth();

    expect(getByTestId('projects-refresh-error-banner')).toBeTruthy();
    expect(getByText('Không thể làm mới danh sách lúc này')).toBeTruthy();
    // Projects remain displayed
    expect(getByText('PRJ-2026-001')).toBeTruthy();
  });

  it('10. renders footer pagination error with retry button', async () => {
    const mockRetryPagination = jest.fn();
    (useProjects as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      paginationError: {
        message: 'Lỗi tải trang kế tiếp',
        placement: 'dialog',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
      },
      retryPagination: mockRetryPagination,
    });

    const { getByTestId, getByText } = await renderScreenWithAuth();

    expect(getByTestId('projects-pagination-error')).toBeTruthy();
    expect(getByText('Lỗi tải trang kế tiếp')).toBeTruthy();

    const retryBtn = getByTestId('btn-retry-pagination');
    fireEvent.press(retryBtn);

    expect(mockRetryPagination).toHaveBeenCalledTimes(1);
  });
});
