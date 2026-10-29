/**
 * Phase 15F: SubtaskListScreen Component Tests (SCR-TSK-05)
 *
 * Verifies:
 * 1. Initial loading indicator rendered.
 * 2. Error state with retry action rendered on initial fetch failure.
 * 3. Header renders parent task title and back button navigates back.
 * 4. Subtasks list rendered with TaskCard items, pressing card navigates to TaskDetail.
 * 5. Empty state rendered when subtasks list is empty.
 * 6. canCreateSubtask capability gating: + Thêm button visible when true, hidden when false.
 * 7. Non-blocking refresh error banner displayed on pull-to-refresh failure.
 * 8. Subtask creation modal opened on + Thêm press.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SubtaskListScreen } from '../../src/features/tasks/screens/SubtaskListScreen';
import { useSubtasks } from '../../src/features/tasks/hooks/useSubtasks';
import { AppProviders } from '../../src/app/providers';
import { TaskDetail, TaskSummary } from '../../src/features/tasks/api/taskTypes';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

let mockRouteParams: {
  parentTaskId: string;
  projectId?: string;
  parentTaskTitle?: string;
} = {
  parentTaskId: 'parent-task-1',
  projectId: 'proj-1',
  parentTaskTitle: 'Tính năng Đăng nhập SSO',
};

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
  };
});

let mockParentTask: Partial<TaskDetail> | null = {
  id: 'parent-task-1',
  title: 'Tính năng Đăng nhập SSO',
  allowedActions: ['CREATE_SUBTASK'],
  project: { id: 'proj-1', name: 'ERP System', code: 'ERP' },
};
let mockParentTaskLoading = false;

jest.mock('../../src/features/tasks/hooks/useTaskDetail', () => ({
  useTaskDetail: () => ({
    task: mockParentTask,
    initialLoading: mockParentTaskLoading,
    loading: mockParentTaskLoading,
    error: null,
    refreshError: null,
    load: jest.fn(),
    refresh: jest.fn(),
    applyTaskUpdate: jest.fn(),
  }),
}));

jest.mock('../../src/features/tasks/hooks/useSubtasks');
jest.mock('../../src/features/projects/api/projectApi', () => ({
  projectApi: {
    listMembers: jest.fn().mockResolvedValue({ items: [] }),
  },
}));

const mockSubtaskItem: TaskSummary = {
  id: 'child-task-10',
  project: { id: 'proj-1', name: 'ERP System', code: 'ERP' },
  parentTaskId: 'parent-task-1',
  title: 'Cài đặt OAuth2 Provider',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  progressPercent: 50,
  assignees: [],
  dueDate: '2026-10-31T17:00:00Z',
  overdue: false,
  subtaskCount: 0,
  completedSubtaskCount: 0,
  commentCount: 2,
  attachmentCount: 0,
  updatedAt: '2026-10-21T08:00:00Z',
};

const defaultHookReturn = {
  subtasks: [mockSubtaskItem],
  loading: false,
  refreshing: false,
  error: null,
  refreshError: null,
  load: jest.fn(),
  refresh: jest.fn(),
  addSubtask: jest.fn(),
};

describe('Phase 15F: SubtaskListScreen (SCR-TSK-05)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {
      parentTaskId: 'parent-task-1',
      projectId: 'proj-1',
      parentTaskTitle: 'Tính năng Đăng nhập SSO',
    };
    mockParentTask = {
      id: 'parent-task-1',
      title: 'Tính năng Đăng nhập SSO',
      allowedActions: ['CREATE_SUBTASK'],
      project: { id: 'proj-1', name: 'ERP System', code: 'ERP' },
    };
    mockParentTaskLoading = false;
    (useSubtasks as jest.Mock).mockReturnValue({ ...defaultHookReturn });
  });

  it('1. renders loading indicator during initial fetch', async () => {
    (useSubtasks as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      loading: true,
      subtasks: [],
    });

    const { getByTestId } = await render(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(getByTestId('subtask-list-loading')).toBeTruthy();
  });

  it('2. renders error state with retry on initial failure', async () => {
    const mockLoad = jest.fn();
    (useSubtasks as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      error: { message: 'Không thể kết nối máy chủ.' },
      subtasks: [],
      load: mockLoad,
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(getByTestId('subtask-list-error')).toBeTruthy();
    expect(getByText('Không thể kết nối máy chủ.')).toBeTruthy();

    fireEvent.press(getByText('Thử lại'));
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('3. renders header with parent title and back button navigates back', async () => {
    const { getByTestId, getByText } = await render(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(getByText('Công việc con')).toBeTruthy();
    expect(getByText('Tính năng Đăng nhập SSO')).toBeTruthy();

    fireEvent.press(getByTestId('btn-subtask-list-back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('4. renders subtasks list with TaskCards and navigates to TaskDetail on card press', async () => {
    const { getByText } = await render(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(getByText('Cài đặt OAuth2 Provider')).toBeTruthy();

    fireEvent.press(getByText('Cài đặt OAuth2 Provider'));
    expect(mockNavigate).toHaveBeenCalledWith('TaskDetail', { taskId: 'child-task-10' });
  });

  it('5. renders empty state when subtask list is empty', async () => {
    (useSubtasks as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      subtasks: [],
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(getByTestId('subtask-list-empty')).toBeTruthy();
    expect(getByText('Chưa có công việc con nào.')).toBeTruthy();
  });

  it('6. gates subtask creation authoritatively via parentTask.allowedActions', async () => {
    // When allowedActions includes CREATE_SUBTASK:
    const { getByTestId, rerender, queryByTestId } = await render(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(getByTestId('btn-open-create-subtask-modal')).toBeTruthy();

    // When allowedActions does not include CREATE_SUBTASK:
    mockParentTask = {
      ...mockParentTask,
      allowedActions: [],
    };

    await rerender(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(queryByTestId('btn-open-create-subtask-modal')).toBeNull();

    // When parentTask is still loading (fail-closed):
    mockParentTask = {
      ...mockParentTask,
      allowedActions: ['CREATE_SUBTASK'],
    };
    mockParentTaskLoading = true;

    await rerender(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(queryByTestId('btn-open-create-subtask-modal')).toBeNull();

    // When parentTask failed to load (null):
    mockParentTaskLoading = false;
    mockParentTask = null;

    await rerender(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(queryByTestId('btn-open-create-subtask-modal')).toBeNull();
  });

  it('7. displays non-blocking refresh error banner when refreshError is present', async () => {
    (useSubtasks as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      refreshError: 'Làm mới danh sách thất bại.',
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    expect(getByTestId('subtask-list-refresh-error')).toBeTruthy();
    expect(getByText('Làm mới danh sách thất bại.')).toBeTruthy();
  });

  it('8. opens CreateSubtaskModal on + Thêm button press', async () => {
    const { getByTestId } = await render(
      <AppProviders>
        <SubtaskListScreen />
      </AppProviders>
    );

    fireEvent.press(getByTestId('btn-open-create-subtask-modal'));

    await waitFor(() => {
      expect(getByTestId('create-subtask-modal')).toBeTruthy();
    });
  });
});
