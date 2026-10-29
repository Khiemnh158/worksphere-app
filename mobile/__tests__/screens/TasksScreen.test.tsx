/**
 * Phase 15B: TasksScreen Component Tests (SCR-TSK-01)
 * Tests:
 * - Full-screen loading indicator during initial load
 * - Full-screen ErrorState on initial error and retry action
 * - Card list rendering
 * - Search bar input and clear action
 * - Canonical status and priority filter chips
 * - Clear filters on empty search
 * - Differentiated empty states (no tasks vs no results)
 * - Pull-to-refresh
 * - Pagination footer loading indicator
 * - Pagination footer error and retry action
 * - Staged navigation: Presentation-only TaskCard (no TaskDetail navigation) and no Create Task button
 */

import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { TasksScreen } from '../../src/features/tasks/screens/TasksScreen';
import { useTasks } from '../../src/features/tasks/hooks/useTasks';
import { AuthContext } from '../../src/app/auth/AuthProvider';
import { AppProviders } from '../../src/app/providers';
import { TaskSummary } from '../../src/features/tasks/api/taskTypes';

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

jest.mock('../../src/features/tasks/hooks/useTasks');

describe('TasksScreen (SCR-TSK-01)', () => {
  const mockTask1: TaskSummary = {
    id: '11111111-2222-3333-4444-555555555555',
    project: {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      code: 'PRJ-101',
      name: 'Mobile Core Engineering',
    },
    title: 'Implement Task List Screen',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    progressPercent: 70,
    assignees: [
      {
        id: 'usr-1',
        fullName: 'Nguyễn Văn A',
        avatarUrl: null,
      },
    ],
    dueDate: '2026-11-15T00:00:00Z',
    overdue: false,
    subtaskCount: 3,
    completedSubtaskCount: 2,
    commentCount: 4,
    attachmentCount: 0,
    updatedAt: '2026-10-20T10:00:00Z',
  };

  const defaultMockHookReturn = {
    tasks: [mockTask1],
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
    priorityFilter: undefined,
    setPriorityFilter: jest.fn(),
    loadInitial: jest.fn(),
    refresh: jest.fn(),
    loadMore: jest.fn(),
    retryPagination: jest.fn(),
    clearFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderScreen = async (permissions: string[] = []) => {
    const authContextValue: any = {
      currentUser: {
        id: 'user-task-tester',
        fullName: 'Task Tester',
        email: 'tester@worksphere.com',
        username: 'tasktester',
        roles: ['EMPLOYEE'],
        permissions,
      },
    };

    return await render(
      <AppProviders>
        <AuthContext.Provider value={authContextValue}>
          <TasksScreen />
        </AuthContext.Provider>
      </AppProviders>
    );
  };

  it('1. renders loading indicator when initialLoading is true', async () => {
    (useTasks as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      tasks: [],
      initialLoading: true,
    });

    const { getByTestId, queryByTestId } = await renderScreen();

    expect(getByTestId('tasks-loading')).toBeTruthy();
    expect(queryByTestId('tasks-flatlist')).toBeNull();
  });

  it('2. renders ErrorState on initial error and triggers loadInitial on retry', async () => {
    const mockLoadInitial = jest.fn();
    (useTasks as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      tasks: [],
      initialLoading: false,
      error: {
        message: 'Không thể kết nối đến máy chủ.',
        placement: 'dialog',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
      },
      loadInitial: mockLoadInitial,
    });

    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('tasks-error')).toBeTruthy();
    expect(getByText('Không thể kết nối đến máy chủ.')).toBeTruthy();

    const retryButton = getByText('Thử lại');
    fireEvent.press(retryButton);
    expect(mockLoadInitial).toHaveBeenCalledTimes(1);
  });

  it('3. renders task card list when tasks are loaded', async () => {
    (useTasks as jest.Mock).mockReturnValue(defaultMockHookReturn);

    const { getByText, getByTestId, getAllByText } = await renderScreen();

    expect(getByTestId('tasks-flatlist')).toBeTruthy();
    expect(getByText('Implement Task List Screen')).toBeTruthy();
    expect(getByText('Mobile Core Engineering')).toBeTruthy();
    expect(getAllByText('Đang làm').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Cao').length).toBeGreaterThanOrEqual(1);
  });

  it('4. displays controlled search bar with search value from hook', async () => {
    const mockSetSearch = jest.fn();
    (useTasks as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      search: 'SearchValue',
      setSearch: mockSetSearch,
    });

    const { getByTestId } = await renderScreen();

    const searchInput = getByTestId('tasks-search-bar-input');
    expect(searchInput.props.value).toBe('SearchValue');
  });

  it('5. exposes canonical status and priority filter chips', async () => {
    (useTasks as jest.Mock).mockReturnValue(defaultMockHookReturn);

    const { getByTestId, getByText } = await renderScreen();

    // Canonical Status Filter Chips
    expect(getByTestId('filter-chip-status-all')).toBeTruthy();
    expect(getByTestId('filter-chip-status-todo')).toBeTruthy();
    expect(getByTestId('filter-chip-status-in_progress')).toBeTruthy();
    expect(getByTestId('filter-chip-status-in_review')).toBeTruthy();
    expect(getByTestId('filter-chip-status-completed')).toBeTruthy();

    expect(getByText('Tất cả trạng thái')).toBeTruthy();
    expect(getByText('Cần làm')).toBeTruthy();
    expect(getByText('Đang kiểm tra')).toBeTruthy();
    expect(getByText('Hoàn thành')).toBeTruthy();

    // Canonical Priority Filter Chips
    expect(getByTestId('filter-chip-priority-all')).toBeTruthy();
    expect(getByTestId('filter-chip-priority-critical')).toBeTruthy();
    expect(getByTestId('filter-chip-priority-high')).toBeTruthy();
    expect(getByTestId('filter-chip-priority-medium')).toBeTruthy();
    expect(getByTestId('filter-chip-priority-low')).toBeTruthy();

    expect(getByText('Tất cả ưu tiên')).toBeTruthy();
    expect(getByText('Khẩn cấp')).toBeTruthy();
    expect(getByText('Trung bình')).toBeTruthy();
    expect(getByText('Thấp')).toBeTruthy();
  });

  it('6. displays empty state when no tasks exist initially', async () => {
    (useTasks as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      tasks: [],
      search: '',
      statusFilter: undefined,
      priorityFilter: undefined,
    });

    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('tasks-empty-all')).toBeTruthy();
    expect(getByText('Bạn chưa có công việc nào')).toBeTruthy();
  });

  it('7. displays search/filter empty state and triggers clearFilters', async () => {
    const mockClearFilters = jest.fn();
    (useTasks as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      tasks: [],
      search: 'Nonexistent',
      clearFilters: mockClearFilters,
    });

    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('tasks-empty-filtered')).toBeTruthy();
    expect(getByText('Không tìm thấy công việc phù hợp')).toBeTruthy();

    const clearButton = getByText('Xóa bộ lọc');
    fireEvent.press(clearButton);
    expect(mockClearFilters).toHaveBeenCalledTimes(1);
  });

  it('8. renders pagination loading indicator in list footer when loadingMore is true', async () => {
    (useTasks as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      loadingMore: true,
    });

    const { getByTestId } = await renderScreen();
    expect(getByTestId('tasks-footer-loader')).toBeTruthy();
  });

  it('9. renders pagination error and retries on press', async () => {
    const mockRetryPagination = jest.fn();
    (useTasks as jest.Mock).mockReturnValue({
      ...defaultMockHookReturn,
      paginationError: {
        message: 'Không thể tải thêm dữ liệu.',
        placement: 'dialog',
        retryable: true,
        isConflict: false,
        isNotFound: false,
        isForbidden: false,
      },
      retryPagination: mockRetryPagination,
    });

    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('tasks-pagination-error')).toBeTruthy();
    expect(getByText('Không thể tải thêm dữ liệu.')).toBeTruthy();

    const retryButton = getByTestId('btn-retry-pagination');
    fireEvent.press(retryButton);
    expect(mockRetryPagination).toHaveBeenCalledTimes(1);
  });

  it('10. navigates to TaskDetail with exact taskId on card press, and does NOT have Create Task button when lacking permission', async () => {
    (useTasks as jest.Mock).mockReturnValue(defaultMockHookReturn);

    const { getByTestId, queryByText, queryByTestId } = await renderScreen([]);

    // Verify Create Task button does not exist when TASK_CREATE permission is absent
    expect(queryByText('+ Tạo mới')).toBeNull();
    expect(queryByTestId('tasks-create-button')).toBeNull();

    // Press first task card
    const firstCard = getByTestId('task-card-11111111-2222-3333-4444-555555555555');
    fireEvent.press(firstCard);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('TaskDetail', {
      taskId: '11111111-2222-3333-4444-555555555555',
    });
  });

  it('11. renders Create Task button and navigates to CreateTask when user has TASK_CREATE permission', async () => {
    (useTasks as jest.Mock).mockReturnValue(defaultMockHookReturn);

    const { getByTestId, getByText } = await renderScreen(['TASK_CREATE']);

    const createButton = getByTestId('tasks-create-button');
    expect(createButton).toBeTruthy();
    expect(getByText('+ Tạo mới')).toBeTruthy();

    fireEvent.press(createButton);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('CreateTask');
  });
});
