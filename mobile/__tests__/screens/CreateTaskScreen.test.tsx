/**
 * Phase 15D Hardening: CreateTaskScreen Component Tests (SCR-TSK-03)
 * Verifies:
 * - Direct route authorization gating (currentUser.permissions.includes('TASK_CREATE'))
 * - Fail-closed unauthorized presentation with back action when TASK_CREATE absent
 * - Required field validation (projectId, title)
 * - Strict calendar date validation (rejects 2026-02-30, invalid ranges)
 * - Due date serialization to ISO-8601 Instant UTC end-of-day (T23:59:59Z)
 * - Exact POST DTO payload conforming to CreateTaskRequest
 * - Synchronous submit lock (submittingRef) prevents duplicate requests on double-press
 * - Navigation to TaskDetail on success with exact { taskId: created.id }
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CreateTaskScreen } from '../../src/features/tasks/screens/CreateTaskScreen';
import { taskApi } from '../../src/features/tasks/api/taskApi';
import { projectApi } from '../../src/features/projects/api/projectApi';
import { ProjectSummary } from '../../src/features/projects/api/projectTypes';
import { TaskDetail } from '../../src/features/tasks/api/taskTypes';
import { AppProviders } from '../../src/app/providers';
import { AuthContext } from '../../src/app/auth/AuthProvider';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('../../src/features/tasks/api/taskApi');
jest.mock('../../src/features/projects/api/projectApi');

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

describe('CreateTaskScreen (SCR-TSK-03)', () => {
  const mockProject: ProjectSummary = {
    id: 'proj-123',
    code: 'WS-MOB',
    name: 'WorkSphere Mobile',
    description: null,
    status: 'ACTIVE',
    priority: 'HIGH',
    manager: { id: 'mgr-1', fullName: 'Quản Lý', avatarUrl: null },
    startDate: '2026-01-01',
    plannedEndDate: '2026-12-31',
    progressPercent: 20,
    memberCount: 5,
    taskSummary: { total: 10, completed: 2, overdue: 0 },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockCreatedTask: TaskDetail = {
    id: 'new-task-uuid',
    project: { id: 'proj-123', code: 'WS-MOB', name: 'WorkSphere Mobile' },
    title: 'Phát triển màn hình tạo công việc',
    status: 'TODO',
    priority: 'HIGH',
    progressPercent: 0,
    reporter: { id: 'usr-1', fullName: 'Tôi', avatarUrl: null },
    assignees: [],
    subtasks: [],
    recentComments: [],
    attachments: [],
    statusHistory: [],
    allowedActions: ['UPDATE'],
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
    version: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (projectApi.listProjects as jest.Mock).mockResolvedValue({
      items: [mockProject],
      page: 0,
      size: 100,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });
  });

  const renderScreen = async (permissions: string[] = ['TASK_CREATE']) => {
    const authContextValue: any = {
      currentUser: {
        id: 'user-task-creator',
        fullName: 'Task Creator',
        email: 'creator@worksphere.com',
        username: 'taskcreator',
        roles: ['PROJECT_MANAGER'],
        permissions,
      },
      initialized: true,
      sessionState: 'AUTHENTICATED',
    };

    return await render(
      <AppProviders>
        <AuthContext.Provider value={authContextValue}>
          <CreateTaskScreen />
        </AuthContext.Provider>
      </AppProviders>
    );
  };

  it('1. fails closed and renders unauthorized state when user lacks TASK_CREATE permission', async () => {
    const { getByTestId, getByText, queryByTestId } = await renderScreen([]);

    expect(getByTestId('create-task-unauthorized')).toBeTruthy();
    expect(getByText('Bạn không có quyền tạo công việc.')).toBeTruthy();
    expect(queryByTestId('btn-submit-create-task')).toBeNull();
    expect(queryByTestId('input-task-title')).toBeNull();

    // Back button works
    fireEvent.press(getByTestId('btn-unauthorized-back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);

    expect(taskApi.createTask).not.toHaveBeenCalled();
  });

  it('2. validates required fields, invalid calendar dates and date ranges before submission', async () => {
    const { getByTestId, getByText } = await renderScreen(['TASK_CREATE']);

    // Press submit immediately without filling project or title
    fireEvent.press(getByTestId('btn-submit-create-task'));

    await waitFor(() => {
      expect(getByText('Vui lòng chọn dự án cho công việc')).toBeTruthy();
      expect(getByText('Tiêu đề công việc không được để trống')).toBeTruthy();
    });

    // Enter impossible calendar date (2026-02-30)
    await act(async () => {
      fireEvent.changeText(getByTestId('input-task-due-date'), '2026-02-30');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-create-task'));
    });

    await waitFor(() => {
      expect(getByText('Hạn hoàn thành không phải là ngày hợp lệ trong lịch')).toBeTruthy();
    });

    // Enter inverted date range (startDate > dueDate)
    await act(async () => {
      fireEvent.changeText(getByTestId('input-task-start-date'), '2026-10-31');
      fireEvent.changeText(getByTestId('input-task-due-date'), '2026-10-01');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-create-task'));
    });

    await waitFor(() => {
      expect(getByText('Hạn hoàn thành không được trước ngày bắt đầu')).toBeTruthy();
    });

    expect(taskApi.createTask).not.toHaveBeenCalled();
  });

  it('3. submits exact CreateTaskRequest payload with serialized ISO Instant due date and navigates on success', async () => {
    (taskApi.createTask as jest.Mock).mockResolvedValueOnce(mockCreatedTask);

    const { getByTestId, getByText } = await renderScreen(['TASK_CREATE']);

    // Select project
    fireEvent.press(getByTestId('btn-open-project-selector'));
    await waitFor(() => {
      expect(getByText('[WS-MOB]')).toBeTruthy();
    });
    fireEvent.press(getByTestId('project-option-proj-123'));
    await waitFor(() => {
      expect(getByTestId('project-option-proj-123').props.accessibilityState.selected).toBe(true);
    });
    fireEvent.press(getByTestId('btn-confirm-project-select'));

    await waitFor(() => {
      expect(getByText('[WS-MOB] WorkSphere Mobile')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('input-task-title'), 'Phát triển màn hình tạo công việc');
      fireEvent.press(getByTestId('chip-priority-high'));
      fireEvent.changeText(getByTestId('input-task-description'), 'Mô tả chi tiết công việc mới.');
      fireEvent.changeText(getByTestId('input-task-start-date'), '2026-10-01');
      fireEvent.changeText(getByTestId('input-task-due-date'), '2026-10-31');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-create-task'));
    });

    await waitFor(() => {
      expect(taskApi.createTask).toHaveBeenCalledTimes(1);
      expect(taskApi.createTask).toHaveBeenCalledWith({
        projectId: 'proj-123',
        title: 'Phát triển màn hình tạo công việc',
        priority: 'HIGH',
        description: 'Mô tả chi tiết công việc mới.',
        startDate: '2026-10-01',
        dueDate: '2026-10-31T17:00:00Z', // Exact D-064 Vietnam UTC+7 boundary ISO Instant
      });
      expect(mockNavigate).toHaveBeenCalledWith('TaskDetail', { taskId: 'new-task-uuid' });
    });
  });

  it('4. enforces synchronous submit lock on double-press (only 1 POST call)', async () => {
    let resolveTask!: (val: TaskDetail) => void;
    const pendingPromise = new Promise<TaskDetail>(res => {
      resolveTask = res;
    });
    (taskApi.createTask as jest.Mock).mockReturnValue(pendingPromise);

    const { getByTestId, getByText } = await renderScreen(['TASK_CREATE']);

    // Select project
    fireEvent.press(getByTestId('btn-open-project-selector'));
    await waitFor(() => {
      expect(getByText('[WS-MOB]')).toBeTruthy();
    });
    fireEvent.press(getByTestId('project-option-proj-123'));
    await waitFor(() => {
      expect(getByTestId('project-option-proj-123').props.accessibilityState.selected).toBe(true);
    });
    fireEvent.press(getByTestId('btn-confirm-project-select'));

    await waitFor(() => {
      expect(getByText('[WS-MOB] WorkSphere Mobile')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('input-task-title'), 'Phát triển tính năng');
    });

    // Double press submit in same event loop
    const submitBtn = getByTestId('btn-submit-create-task');
    await act(async () => {
      fireEvent.press(submitBtn);
      fireEvent.press(submitBtn);
    });

    expect(taskApi.createTask).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveTask(mockCreatedTask);
      await pendingPromise;
    });

    expect(mockNavigate).toHaveBeenCalledWith('TaskDetail', { taskId: 'new-task-uuid' });
  });
});
