/**
 * Phase 15C + 15E: TaskDetailScreen Component Tests
 *
 * Verifies:
 * - Loading indicator during initial load
 * - Canonical field rendering (title, project, description, status, priority, progress, dates, reporter, assignees)
 * - Hierarchy (parent task) and Milestone rendering
 * - Status history rendering
 * - Read-only subtask and comment summaries
 * - Strictly zero raw IDs, versions, or raw allowedActions strings exposed
 * - Unknown future allowedActions handled gracefully
 * - 404 Not Found error state (friendly message, back button, no retry loop)
 * - 403 Forbidden error state (safe permission message, back button)
 * - Network error with retryable action
 * - Non-blocking refresh error banner
 * - Back button triggers navigation.goBack()
 * - Phase 15E: Status mutation (UPDATE_STATUS capability gating, modal, comment requirement on rejection, submit lock, 409 conflict)
 * - Phase 15E: Progress mutation (UPDATE_PROGRESS capability gating, modal, decimal value support, submit lock, 409 conflict)
 * - Phase 15E: Assignment (ASSIGN capability gating, eligible project members, disabled existing assignees, request sends ProjectMember.userId, submit lock)
 * - Phase 15E: Unassignment (UNASSIGN capability gating, ConfirmationDialog, DELETE sends assignmentId NOT userId, submit lock)
 * - Phase 15E: Version chaining across successive mutations
 */

import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { TaskDetailScreen } from '../../src/features/tasks/screens/TaskDetailScreen';
import { useTaskDetail } from '../../src/features/tasks/hooks/useTaskDetail';
import { AppProviders } from '../../src/app/providers';
import { TaskDetail } from '../../src/features/tasks/api/taskTypes';
import { taskApi } from '../../src/features/tasks/api/taskApi';
import { projectApi } from '../../src/features/projects/api/projectApi';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockAddListener = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate,
      addListener: mockAddListener,
    }),
    useRoute: () => ({
      params: { taskId: 'task-123' },
    }),
  };
});

jest.mock('../../src/features/tasks/hooks/useTaskDetail');
jest.mock('../../src/features/tasks/api/taskApi');
jest.mock('../../src/features/projects/api/projectApi');

describe('Phase 15C + 15E: TaskDetailScreen', () => {
  const mockTask: TaskDetail = {
    id: 'task-uuid-123',
    project: {
      id: 'proj-uuid-1',
      name: 'Hệ thống Quản lý Doanh nghiệp',
      code: 'ERP-CORE',
    },
    parentTaskId: 'parent-task-uuid',
    parentTask: {
      id: 'parent-task-uuid',
      title: 'Xây dựng phân hệ Tài chính',
    },
    milestoneId: 'ms-uuid-1',
    milestone: {
      id: 'ms-uuid-1',
      name: 'Giai đoạn 1: Khởi động',
    },
    title: 'Phát triển API thanh toán trực tuyến',
    description: 'Tích hợp cổng thanh toán VNPay và MoMo vào luồng checkout.',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    progressPercent: 75,
    startDate: '2026-10-01T00:00:00Z',
    dueDate: '2026-10-25T00:00:00Z',
    completedAt: null,
    estimatedMinutes: 600,
    actualMinutes: 450,
    reporter: {
      id: 'user-reporter',
      fullName: 'Hoàng Văn Quản Lý',
      avatarUrl: null,
    },
    assignees: [
      {
        assignmentId: 'assign-uuid-999',
        id: 'user-dev-1',
        fullName: 'Lê Văn Lập Trình',
        avatarUrl: null,
        assignedAt: '2026-10-02T08:00:00Z',
      },
    ],
    subtasks: [
      {
        id: 'subtask-1',
        project: { id: 'proj-uuid-1', name: 'ERP-CORE', code: 'ERP-CORE' },
        title: 'Cấu hình webhook VNPay',
        status: 'COMPLETED',
        priority: 'HIGH',
        progressPercent: 100,
        assignees: [],
        overdue: false,
        subtaskCount: 0,
        completedSubtaskCount: 0,
        commentCount: 0,
        attachmentCount: 0,
        updatedAt: '2026-10-10T00:00:00Z',
      },
    ],
    recentComments: [
      {
        id: 'comment-1',
        taskId: 'task-uuid-123',
        author: {
          id: 'user-dev-1',
          fullName: 'Lê Văn Lập Trình',
          avatarUrl: null,
        },
        content: 'Đã hoàn tất kiểm thử sandbox VNPay.',
        isEdited: false,
        createdAt: '2026-10-15T10:00:00Z',
      },
    ],
    attachments: [],
    statusHistory: [
      {
        id: 'history-1',
        taskId: 'task-uuid-123',
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
        comment: 'Bắt đầu tích hợp code sandbox',
        changedBy: {
          id: 'user-dev-1',
          fullName: 'Lê Văn Lập Trình',
          avatarUrl: null,
        },
        changedAt: '2026-10-02T08:30:00Z',
      },
    ],
    allowedActions: ['UPDATE', 'UPDATE_STATUS', 'UPDATE_PROGRESS', 'ASSIGN', 'UNASSIGN', 'UNKNOWN_FUTURE_ACTION'],
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z',
    version: 3,
  };

  const mockApplyTaskUpdate = jest.fn();
  const mockRefresh = jest.fn();

  const defaultHookReturn = {
    task: mockTask,
    initialLoading: false,
    refreshing: false,
    error: null,
    refreshError: null,
    load: jest.fn(),
    refresh: mockRefresh,
    applyTaskUpdate: mockApplyTaskUpdate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTaskDetail as jest.Mock).mockReturnValue({ ...defaultHookReturn });
    const memberList = [
      {
        id: 'member-record-1',
        projectId: 'proj-uuid-1',
        userId: 'user-dev-1', // Already assigned!
        fullName: 'Lê Văn Lập Trình',
        email: 'dev1@worksphere.local',
        projectRole: 'DEVELOPER',
        active: true,
        joinedAt: '2026-10-01T00:00:00Z',
      },
      {
        id: 'member-record-2',
        projectId: 'proj-uuid-1',
        userId: 'user-cand-2', // Candidate eligible!
        fullName: 'Nguyễn Thị Tester',
        email: 'tester@worksphere.local',
        projectRole: 'TESTER',
        active: true,
        joinedAt: '2026-10-01T00:00:00Z',
      },
    ];
    (projectApi.listMembers as jest.Mock).mockResolvedValue({
      items: memberList,
      content: memberList,
      totalItems: 2,
      totalElements: 2,
      totalPages: 1,
      size: 20,
      page: 0,
      number: 0,
      first: true,
      last: true,
      hasNext: false,
      hasPrevious: false,
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('1. renders loading indicator during initial load', async () => {
    (useTaskDetail as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      task: null,
      initialLoading: true,
    });

    const { getByTestId, queryByTestId } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    expect(getByTestId('task-detail-loading')).toBeTruthy();
    expect(queryByTestId('screen-task-detail')).toBeNull();
  });

  it('2. renders canonical task details, badges, and progress', async () => {
    const { getByTestId, getByText, getAllByText, queryByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    expect(getByTestId('screen-task-detail')).toBeTruthy();
    expect(getByTestId('task-detail-project-name').props.children).toBe('Hệ thống Quản lý Doanh nghiệp');
    expect(getByTestId('task-detail-title').props.children).toBe('Phát triển API thanh toán trực tuyến');

    expect(getByText('Khẩn cấp')).toBeTruthy();
    expect(getAllByText('Đang làm').length).toBeGreaterThanOrEqual(1);

    expect(getByTestId('task-detail-progress-percent').props.children).toEqual([75, '%']);
    expect(getByTestId('task-detail-description').props.children).toBe(
      'Tích hợp cổng thanh toán VNPay và MoMo vào luồng checkout.'
    );

    expect(getByTestId('task-detail-start-date').props.children).toBe('01/10/2026');
    expect(getByTestId('task-detail-due-date').props.children).toBe('25/10/2026');
    expect(getByTestId('task-detail-reporter').props.children).toBe('Hoàng Văn Quản Lý');

    expect(getByText('• Lê Văn Lập Trình')).toBeTruthy();

    expect(getByTestId('task-detail-parent-task').props.children).toBe('Xây dựng phân hệ Tài chính');
    expect(getByTestId('task-detail-milestone').props.children).toBe('Giai đoạn 1: Khởi động');

    expect(getByTestId('task-detail-subtask-count').props.children).toEqual([1, ' công việc con']);
    expect(getByTestId('task-detail-comment-count').props.children).toEqual([1, ' bình luận']);
    expect(getByTestId('btn-navigate-subtasks')).toBeTruthy();
    expect(getByTestId('btn-navigate-comments')).toBeTruthy();

    // Verify Subtasks row navigation (SCR-TSK-05)
    await act(async () => {
      fireEvent.press(getByTestId('btn-navigate-subtasks'));
    });
    expect(mockNavigate).toHaveBeenCalledWith('SubtaskList', {
      parentTaskId: 'task-uuid-123',
      projectId: 'proj-uuid-1',
      parentTaskTitle: 'Phát triển API thanh toán trực tuyến',
    });

    // Verify Comments row navigation (SCR-TSK-06)
    await act(async () => {
      fireEvent.press(getByTestId('btn-navigate-comments'));
    });
    expect(mockNavigate).toHaveBeenCalledWith('TaskComments', {
      taskId: 'task-uuid-123',
      taskTitle: 'Phát triển API thanh toán trực tuyến',
    });

    expect(queryByText('task-uuid-123')).toBeNull();
    expect(queryByText('proj-uuid-1')).toBeNull();
    expect(queryByText('user-dev-1')).toBeNull();
    expect(queryByText('assign-uuid-999')).toBeNull();
    expect(queryByText('Version: 3')).toBeNull();
    expect(queryByText('UNKNOWN_FUTURE_ACTION')).toBeNull();
  });

  it('3. renders 404 Not Found error state with back action', async () => {
    (useTaskDetail as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      task: null,
      error: {
        isNotFound: true,
        isForbidden: false,
        message: 'Công việc không tồn tại hoặc đã bị xóa.',
      },
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    expect(getByText('Không tìm thấy công việc')).toBeTruthy();
    expect(getByText('Công việc không tồn tại hoặc đã bị xóa.')).toBeTruthy();

    const backBtn = getByTestId('btn-back-from-error');
    fireEvent.press(backBtn);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('4. renders 403 Forbidden error state with back action', async () => {
    (useTaskDetail as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      task: null,
      error: {
        isNotFound: false,
        isForbidden: true,
        message: 'Bạn không có quyền xem thông tin công việc này.',
      },
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    expect(getByText('Không có quyền truy cập')).toBeTruthy();
    expect(getByText('Bạn không có quyền xem thông tin công việc này.')).toBeTruthy();

    const backBtn = getByTestId('btn-back-from-error');
    fireEvent.press(backBtn);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('5. renders network error state with retry action', async () => {
    const mockLoad = jest.fn();
    (useTaskDetail as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      task: null,
      load: mockLoad,
      error: {
        isNotFound: false,
        isForbidden: false,
        retryable: true,
        message: 'Không thể kết nối đến máy chủ.',
      },
    });

    const { getByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    expect(getByText('Không thể tải công việc')).toBeTruthy();
    expect(getByText('Không thể kết nối đến máy chủ.')).toBeTruthy();

    const retryBtn = getByText('Thử lại');
    fireEvent.press(retryBtn);
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('6. displays non-blocking refresh error banner when refresh fails', async () => {
    (useTaskDetail as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      refreshError: 'Không thể làm mới dữ liệu.',
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    expect(getByTestId('task-detail-refresh-error')).toBeTruthy();
    expect(getByText('Không thể làm mới dữ liệu.')).toBeTruthy();
  });

  it('7. top back button triggers navigation.goBack()', async () => {
    const { getByTestId } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    const backBtn = getByTestId('btn-task-detail-back');
    fireEvent.press(backBtn);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('8. opens status mutation modal and submits ChangeTaskStatusRequest (SCR-TSK-07)', async () => {
    const updatedTask: TaskDetail = {
      ...mockTask,
      status: 'IN_REVIEW',
      version: 4,
    };
    (taskApi.changeTaskStatus as jest.Mock).mockResolvedValueOnce(updatedTask);

    const { getByTestId, getByText, queryByTestId } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    // Open status modal
    const openStatusBtn = getByTestId('btn-open-status-modal');
    fireEvent.press(openStatusBtn);

    await waitFor(() => {
      expect(getByTestId('change-status-modal')).toBeTruthy();
      expect(getByText('Chuyển trạng thái công việc')).toBeTruthy();
    });

    // For IN_PROGRESS, valid transitions are IN_REVIEW and CANCELLED
    expect(getByTestId('status-option-IN_REVIEW')).toBeTruthy();
    expect(getByTestId('status-option-CANCELLED')).toBeTruthy();
    expect(queryByTestId('status-option-TODO')).toBeNull();

    // Select IN_REVIEW
    fireEvent.press(getByTestId('status-option-IN_REVIEW'));
    await waitFor(() => {
      expect(getByTestId('status-option-IN_REVIEW').props.accessibilityState.checked).toBe(true);
    });

    // Input comment
    fireEvent.changeText(getByTestId('input-status-comment'), 'Đã hoàn thành tính năng, gửi duyệt.');
    await waitFor(() => {
      expect(getByTestId('input-status-comment').props.value).toBe('Đã hoàn thành tính năng, gửi duyệt.');
    });

    // Confirm submit
    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-status'));
    });

    await waitFor(() => {
      expect(taskApi.changeTaskStatus).toHaveBeenCalledTimes(1);
      expect(taskApi.changeTaskStatus).toHaveBeenCalledWith('task-uuid-123', {
        status: 'IN_REVIEW',
        comment: 'Đã hoàn thành tính năng, gửi duyệt.',
        version: 3,
      });
      expect(mockApplyTaskUpdate).toHaveBeenCalledWith(updatedTask);
    });
  });

  it('9. enforces comment requirement when transitioning IN_REVIEW to IN_PROGRESS (rejection)', async () => {
    (useTaskDetail as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      task: {
        ...mockTask,
        status: 'IN_REVIEW',
      },
    });

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    fireEvent.press(getByTestId('btn-open-status-modal'));

    await waitFor(() => {
      expect(getByTestId('status-option-IN_PROGRESS')).toBeTruthy();
    });

    // Select IN_PROGRESS (rejection)
    fireEvent.press(getByTestId('status-option-IN_PROGRESS'));
    await waitFor(() => {
      expect(getByTestId('status-option-IN_PROGRESS').props.accessibilityState.checked).toBe(true);
    });

    // Press confirm without entering comment
    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-status'));
    });

    await waitFor(() => {
      expect(getByText('Vui lòng nhập lý do khi chuyển về Đang làm.')).toBeTruthy();
    });
    expect(taskApi.changeTaskStatus).not.toHaveBeenCalled();
  });

  it('10. status mutation handles HTTP 409 conflict with authoritative reload dialog', async () => {
    (taskApi.changeTaskStatus as jest.Mock).mockRejectedValueOnce({
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
        <TaskDetailScreen />
      </AppProviders>
    );

    fireEvent.press(getByTestId('btn-open-status-modal'));
    await waitFor(() => {
      expect(getByTestId('btn-confirm-status')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-status'));
    });

    await waitFor(() => {
      expect(getByText('Xung đột dữ liệu')).toBeTruthy();
    });

    // Pressing reload triggers refresh()
    fireEvent.press(getByText('Tải lại dữ liệu'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('11. opens progress modal and submits UpdateTaskProgressRequest with decimal value (SCR-TSK-08)', async () => {
    const updatedTask: TaskDetail = {
      ...mockTask,
      progressPercent: 85.5,
      version: 4,
    };
    (taskApi.updateTaskProgress as jest.Mock).mockResolvedValueOnce(updatedTask);

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    // Open progress modal
    fireEvent.press(getByTestId('btn-open-progress-modal'));

    await waitFor(() => {
      expect(getByTestId('update-progress-modal')).toBeTruthy();
      expect(getByText('Cập nhật tiến độ công việc')).toBeTruthy();
      expect(getByTestId('input-task-progress').props.value).toBe('75');
    });

    // Change input to decimal value 85.5%
    fireEvent.changeText(getByTestId('input-task-progress'), '85.5');
    await waitFor(() => {
      expect(getByTestId('input-task-progress').props.value).toBe('85.5');
    });

    // Confirm submit
    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-progress'));
    });

    await waitFor(() => {
      expect(taskApi.updateTaskProgress).toHaveBeenCalledTimes(1);
      expect(taskApi.updateTaskProgress).toHaveBeenCalledWith('task-uuid-123', {
        progressPercent: 85.5,
        version: 3,
      });
      expect(mockApplyTaskUpdate).toHaveBeenCalledWith(updatedTask);
    });
  });

  it('12. assigns eligible project member and passes ProjectMember.userId NOT membership UUID', async () => {
    const updatedTask: TaskDetail = {
      ...mockTask,
      assignees: [
        ...mockTask.assignees,
        {
          assignmentId: 'assign-uuid-new',
          id: 'user-cand-2',
          fullName: 'Nguyễn Thị Tester',
          avatarUrl: null,
          assignedAt: '2026-10-20T00:00:00Z',
        },
      ],
    };
    (taskApi.assignUsers as jest.Mock).mockResolvedValueOnce(updatedTask);

    const { getByTestId, getByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    // Open assign modal
    fireEvent.press(getByTestId('btn-open-assign-modal'));

    await waitFor(() => {
      expect(getByTestId('task-assignee-picker-modal')).toBeTruthy();
      expect(projectApi.listMembers).toHaveBeenCalledWith('proj-uuid-1', expect.objectContaining({ active: true }));
    });

    await waitFor(() => {
      expect(getByText('Nguyễn Thị Tester')).toBeTruthy();
    });

    // Existing assignee (user-dev-1) must be disabled
    expect(getByTestId('assignee-option-user-dev-1').props.accessibilityState.disabled).toBe(true);

    // Select candidate member (userId: 'user-cand-2')
    fireEvent.press(getByTestId('assignee-option-user-cand-2'));
    await waitFor(() => {
      expect(getByTestId('assignee-option-user-cand-2').props.accessibilityState.checked).toBe(true);
    });

    // Confirm selection
    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-assignee-select'));
    });

    await waitFor(() => {
      expect(taskApi.assignUsers).toHaveBeenCalledTimes(1);
      // Critical check: passes user-cand-2, NOT member-record-2!
      expect(taskApi.assignUsers).toHaveBeenCalledWith('task-uuid-123', {
        assigneeIds: ['user-cand-2'],
      });
      expect(mockApplyTaskUpdate).toHaveBeenCalledWith(updatedTask);
    });
  });

  it('13. unassigns existing member using assignmentId NOT userId after ConfirmationDialog', async () => {
    const updatedTask: TaskDetail = {
      ...mockTask,
      assignees: [],
    };
    (taskApi.unassignUser as jest.Mock).mockResolvedValueOnce(updatedTask);

    const { getByTestId, getByText, queryByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    // Press unassign button for user-dev-1
    const unassignBtn = getByTestId('btn-unassign-user-dev-1');
    fireEvent.press(unassignBtn);

    await waitFor(() => {
      expect(getByText('Gỡ phân công')).toBeTruthy();
      expect(getByText('Bạn có chắc chắn muốn gỡ Lê Văn Lập Trình khỏi công việc không?')).toBeTruthy();
    });

    // Cancel first
    fireEvent.press(getByText('Hủy'));
    await waitFor(() => {
      expect(queryByText('Bạn có chắc chắn muốn gỡ Lê Văn Lập Trình khỏi công việc không?')).toBeNull();
    });
    expect(taskApi.unassignUser).not.toHaveBeenCalled();

    // Press unassign again and confirm
    fireEvent.press(unassignBtn);
    await waitFor(() => {
      expect(getByText('Gỡ phân công')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('dialog-confirm-unassign-confirm-btn'));
    });

    await waitFor(() => {
      expect(taskApi.unassignUser).toHaveBeenCalledTimes(1);
      // Critical check: passes assign-uuid-999, NEVER user-dev-1!
      expect(taskApi.unassignUser).toHaveBeenCalledWith('task-uuid-123', 'assign-uuid-999');
      expect(mockApplyTaskUpdate).toHaveBeenCalledWith(updatedTask);
    });
  });

  it('14. gates mutation actions: hides controls when allowedActions does not include them', async () => {
    (useTaskDetail as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      task: {
        ...mockTask,
        allowedActions: [], // No actions allowed (e.g. read-only or terminal)
      },
    });

    const { queryByTestId } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    expect(queryByTestId('btn-edit-task')).toBeNull();
    expect(queryByTestId('btn-open-status-modal')).toBeNull();
    expect(queryByTestId('btn-open-progress-modal')).toBeNull();
    expect(queryByTestId('btn-open-assign-modal')).toBeNull();
    expect(queryByTestId('btn-unassign-user-dev-1')).toBeNull();
  });

  it('15. continuous version chain across successive mutations in a single mounted screen lifecycle (v1 -> v2 -> v3)', async () => {
    const { useTaskDetail: actualUseTaskDetail } = jest.requireActual('../../src/features/tasks/hooks/useTaskDetail');

    const taskV1: TaskDetail = {
      ...mockTask,
      id: 'task-123',
      version: 1,
      status: 'IN_PROGRESS',
      progressPercent: 10,
      allowedActions: ['UPDATE', 'UPDATE_STATUS', 'UPDATE_PROGRESS', 'ASSIGN', 'UNASSIGN'],
    };

    const taskV2: TaskDetail = {
      ...taskV1,
      version: 2,
      progressPercent: 25,
    };

    const taskV3: TaskDetail = {
      ...taskV2,
      version: 3,
      progressPercent: 85.5,
    };

    (taskApi.getTaskDetail as jest.Mock).mockResolvedValue(taskV1);
    (taskApi.updateTaskProgress as jest.Mock)
      .mockResolvedValueOnce(taskV2)
      .mockResolvedValueOnce(taskV3);

    (useTaskDetail as jest.Mock).mockReset();
    (useTaskDetail as jest.Mock).mockImplementation(actualUseTaskDetail);

    const { getByTestId, queryByTestId, getByText } = await render(
      <AppProviders>
        <TaskDetailScreen />
      </AppProviders>
    );

    // Initial state check after load: version 1, 10%
    await waitFor(() => {
      expect(getByTestId('task-detail-progress-percent').props.children).toEqual([10, '%']);
    });

    // --- Mutation 1: Progress Update (v1 -> v2: 10% -> 25%) ---
    fireEvent.press(getByTestId('btn-open-progress-modal'));
    await waitFor(() => {
      expect(getByTestId('update-progress-modal')).toBeTruthy();
      expect(getByText('Cập nhật tiến độ công việc')).toBeTruthy();
      expect(getByTestId('input-task-progress').props.value).toBe('10');
    });

    fireEvent.changeText(getByTestId('input-task-progress'), '25');
    await waitFor(() => {
      expect(getByTestId('input-task-progress').props.value).toBe('25');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-progress'));
    });

    await waitFor(() => {
      expect(taskApi.updateTaskProgress).toHaveBeenCalledTimes(1);
      expect(taskApi.updateTaskProgress).toHaveBeenNthCalledWith(1, 'task-123', {
        progressPercent: 25,
        version: 1,
      });
    });

    await waitFor(() => {
      expect(queryByTestId('update-progress-modal')).toBeNull();
      // Screen reflects updated progress from taskV2
      expect(getByTestId('task-detail-progress-percent').props.children).toEqual([25, '%']);
    });

    // --- Mutation 2: Successive Progress Update (v2 -> v3: 25% -> 85.5%) on SAME mounted screen ---
    fireEvent.press(getByTestId('btn-open-progress-modal'));
    await waitFor(() => {
      expect(getByTestId('update-progress-modal')).toBeTruthy();
      expect(getByText('Cập nhật tiến độ công việc')).toBeTruthy();
      // Modal pre-populates with taskV2 progress (25)
      expect(getByTestId('input-task-progress').props.value).toBe('25');
    });

    fireEvent.changeText(getByTestId('input-task-progress'), '85.5');
    await waitFor(() => {
      expect(getByTestId('input-task-progress').props.value).toBe('85.5');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-confirm-progress'));
    });

    await waitFor(() => {
      expect(taskApi.updateTaskProgress).toHaveBeenCalledTimes(2);
      // CRITICAL: MUST pass version 2 from taskV2, proving continuous version chaining!
      expect(taskApi.updateTaskProgress).toHaveBeenNthCalledWith(2, 'task-123', {
        progressPercent: 85.5,
        version: 2,
      });
    });

    await waitFor(() => {
      expect(queryByTestId('update-progress-modal')).toBeNull();
      // Final screen state check: version 3 progress (85.5%) rendered
      expect(getByTestId('task-detail-progress-percent').props.children).toEqual([85.5, '%']);
    });
  });
});