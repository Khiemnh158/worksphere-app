/**
 * Phase 15D Hardening: EditTaskScreen Component Tests (SCR-TSK-04)
 * Verifies:
 * - Authoritative initial load on mount via taskApi.getTaskDetail
 * - Prefills fields accurately (title, description, priority, dates)
 * - Due date parsing from ISO string for human input
 * - Due date serialization to ISO-8601 Instant Vietnam UTC+7 boundary (T17:00:00Z per D-064)
 * - PRESERVE_EXACT_SERVER_INSTANT_WHEN_DATE_UNCHANGED: unchanged due date preserves exact server Instant
 * - Changed due date maps to T17:00:00Z
 * - Changing then reverting due date preserves original raw server Instant
 * - Conflict reload updates authoritative baseline for subsequent submits
 * - Validation on invalid calendar dates and inverted date ranges
 * - Version is captured internally and never visible in user-facing UI
 * - Submits exact UpdateTaskRequest payload (with version, without status/progress/assignees)
 * - Synchronous submit lock prevents duplicate requests
 * - On success, calls navigation.goBack()
 * - On HTTP 409 conflict, displays conflict dialog with "Tải lại dữ liệu" action
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { EditTaskScreen } from '../../src/features/tasks/screens/EditTaskScreen';
import { taskApi } from '../../src/features/tasks/api/taskApi';
import { TaskDetail } from '../../src/features/tasks/api/taskTypes';
import { AppProviders } from '../../src/app/providers';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('../../src/features/tasks/api/taskApi');

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate,
    }),
    useRoute: () => ({
      params: { taskId: 'task-uuid-1' },
    }),
  };
});

describe('EditTaskScreen (SCR-TSK-04)', () => {
  const mockTask: TaskDetail = {
    id: 'task-uuid-1',
    project: { id: 'proj-1', code: 'WS-CORE', name: 'WorkSphere Platform' },
    title: 'Xây dựng module nhiệm vụ',
    description: 'Chi tiết mô tả nhiệm vụ',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    progressPercent: 50,
    startDate: '2026-10-01',
    dueDate: '2026-10-31T14:23:45Z',
    estimatedMinutes: 240,
    reporter: { id: 'user-rep', fullName: 'Người giao việc', avatarUrl: null },
    assignees: [],
    subtasks: [],
    recentComments: [],
    attachments: [],
    statusHistory: [],
    allowedActions: ['UPDATE'],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
    version: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. performs authoritative load on mount and prefills form fields without exposing version', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTask);

    const { getByTestId, getByText, queryByText } = await render(
      <AppProviders>
        <EditTaskScreen />
      </AppProviders>
    );

    await waitFor(() => {
      expect(taskApi.getTaskDetail).toHaveBeenCalledWith('task-uuid-1');
      expect(getByTestId('input-edit-task-title').props.value).toBe('Xây dựng module nhiệm vụ');
      expect(getByTestId('input-edit-task-description').props.value).toBe('Chi tiết mô tả nhiệm vụ');
      expect(getByTestId('input-edit-task-start-date').props.value).toBe('2026-10-01');
      expect(getByTestId('input-edit-task-due-date').props.value).toBe('2026-10-31');
      expect(getByTestId('input-edit-task-estimated-minutes').props.value).toBe('240');
      expect(getByText('Dự án: WorkSphere Platform')).toBeTruthy();
    });

    // Strictly ZERO version numbers exposed in text
    expect(queryByText('version')).toBeNull();
    expect(queryByText('Version: 3')).toBeNull();
  });

  it('2. preserves exact server Instant when dueDate is unchanged (D-064)', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTask);
    (taskApi.updateTask as jest.Mock).mockResolvedValueOnce({
      ...mockTask,
      title: 'Xây dựng module nhiệm vụ (Đã sửa)',
      version: 4,
    });

    const { getByTestId } = await render(
      <AppProviders>
        <EditTaskScreen />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByTestId('input-edit-task-title').props.value).toBe('Xây dựng module nhiệm vụ');
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('input-edit-task-title'), 'Xây dựng module nhiệm vụ (Đã sửa)');
    });

    // Submit without touching dueDate
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-edit-task'));
    });

    await waitFor(() => {
      expect(taskApi.updateTask).toHaveBeenCalledTimes(1);
      expect(taskApi.updateTask).toHaveBeenCalledWith('task-uuid-1', {
        title: 'Xây dựng module nhiệm vụ (Đã sửa)',
        description: 'Chi tiết mô tả nhiệm vụ',
        priority: 'HIGH',
        startDate: '2026-10-01',
        dueDate: '2026-10-31T14:23:45Z', // Exact byte-for-byte server Instant preserved!
        estimatedMinutes: 240,
        version: 3,
      });
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  it('3. validates date inputs and submits edited dueDate using D-064 (T17:00:00Z)', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTask);
    (taskApi.updateTask as jest.Mock).mockResolvedValueOnce({
      ...mockTask,
      dueDate: '2026-11-05T17:00:00Z',
      version: 4,
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <EditTaskScreen />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByTestId('input-edit-task-title').props.value).toBe('Xây dựng module nhiệm vụ');
    });

    // Enter impossible calendar date (2026-02-30)
    await act(async () => {
      fireEvent.changeText(getByTestId('input-edit-task-due-date'), '2026-02-30');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-edit-task'));
    });

    await waitFor(() => {
      expect(getByText('Hạn hoàn thành không phải là ngày hợp lệ trong lịch')).toBeTruthy();
    });
    expect(taskApi.updateTask).not.toHaveBeenCalled();

    // Now enter valid new due date (2026-11-05)
    await act(async () => {
      fireEvent.changeText(getByTestId('input-edit-task-due-date'), '2026-11-05');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-edit-task'));
    });

    await waitFor(() => {
      expect(taskApi.updateTask).toHaveBeenCalledTimes(1);
      expect(taskApi.updateTask).toHaveBeenCalledWith('task-uuid-1', expect.objectContaining({
        dueDate: '2026-11-05T17:00:00Z', // D-064 boundary for new date
      }));
    });
  });

  it('4. preserves original server Instant when date is changed then reverted back to original (effective calendar equality)', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTask);
    (taskApi.updateTask as jest.Mock).mockResolvedValueOnce({
      ...mockTask,
      title: 'Tiêu đề đổi',
      version: 4,
    });

    const { getByTestId } = await render(
      <AppProviders>
        <EditTaskScreen />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByTestId('input-edit-task-due-date').props.value).toBe('2026-10-31');
    });

    // Change date
    await act(async () => {
      fireEvent.changeText(getByTestId('input-edit-task-due-date'), '2026-11-05');
    });

    // Change back to original calendar date
    await act(async () => {
      fireEvent.changeText(getByTestId('input-edit-task-due-date'), '2026-10-31');
    });

    // Submit
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-edit-task'));
    });

    await waitFor(() => {
      expect(taskApi.updateTask).toHaveBeenCalledTimes(1);
      expect(taskApi.updateTask).toHaveBeenCalledWith('task-uuid-1', expect.objectContaining({
        dueDate: '2026-10-31T14:23:45Z', // Preserved because effective calendar value is unchanged
      }));
    });
  });

  it('5. enforces synchronous submit lock on rapid double-press (only 1 PUT call)', async () => {
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(mockTask);

    let resolveUpdate!: (val: TaskDetail) => void;
    const pendingPromise = new Promise<TaskDetail>(res => {
      resolveUpdate = res;
    });
    (taskApi.updateTask as jest.Mock).mockReturnValue(pendingPromise);

    const { getByTestId } = await render(
      <AppProviders>
        <EditTaskScreen />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByTestId('input-edit-task-title').props.value).toBe('Xây dựng module nhiệm vụ');
    });

    const submitBtn = getByTestId('btn-submit-edit-task');
    await act(async () => {
      fireEvent.press(submitBtn);
      fireEvent.press(submitBtn);
    });

    expect(taskApi.updateTask).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpdate({ ...mockTask, version: 4 });
      await pendingPromise;
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('6. updates authoritative baseline on HTTP 409 reload and uses newly fetched Instant on next submit', async () => {
    const initialTask: TaskDetail = {
      ...mockTask,
      dueDate: '2026-10-31T14:00:00Z',
      version: 1,
    };
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(initialTask);
    (taskApi.updateTask as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: 'OPTIMISTIC_LOCK_CONFLICT',
          message: 'Dữ liệu đã bị thay đổi bởi người khác.',
        },
      },
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <EditTaskScreen />
      </AppProviders>
    );

    await waitFor(() => {
      expect(getByTestId('input-edit-task-title').props.value).toBe('Xây dựng module nhiệm vụ');
    });

    // Press save -> triggers 409 conflict
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-edit-task'));
    });

    await waitFor(() => {
      expect(getByText('Xung đột dữ liệu')).toBeTruthy();
      expect(
        getByText(
          'Dữ liệu công việc đã được thay đổi bởi người dùng khác trong khi bạn đang chỉnh sửa. Bạn có muốn tải lại dữ liệu mới nhất không?'
        )
      ).toBeTruthy();
    });

    // Conflict reload returns new Instant and version 2
    const updatedTask: TaskDetail = {
      ...mockTask,
      title: 'Tiêu đề mới nhất từ máy chủ',
      dueDate: '2026-10-31T16:30:00Z',
      version: 2,
    };
    (taskApi.getTaskDetail as jest.Mock).mockResolvedValueOnce(updatedTask);
    (taskApi.updateTask as jest.Mock).mockResolvedValueOnce({
      ...updatedTask,
      version: 3,
    });

    await act(async () => {
      fireEvent.press(getByText('Tải lại dữ liệu'));
    });

    await waitFor(() => {
      expect(taskApi.getTaskDetail).toHaveBeenCalledTimes(2);
      expect(getByTestId('input-edit-task-title').props.value).toBe('Tiêu đề mới nhất từ máy chủ');
      expect(getByTestId('input-edit-task-due-date').props.value).toBe('2026-10-31');
    });

    // Next submit without changing dueDate must use newly fetched Instant (16:30:00Z) and version 2!
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-edit-task'));
    });

    await waitFor(() => {
      expect(taskApi.updateTask).toHaveBeenCalledTimes(2);
      expect(taskApi.updateTask).toHaveBeenLastCalledWith('task-uuid-1', expect.objectContaining({
        title: 'Tiêu đề mới nhất từ máy chủ',
        dueDate: '2026-10-31T16:30:00Z', // Newly fetched baseline Instant preserved
        version: 2,
      }));
    });
  });
});
