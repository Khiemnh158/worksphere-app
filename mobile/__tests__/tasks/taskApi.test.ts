import { serializeTaskListQuery, taskApi } from '../../src/features/tasks/api/taskApi';
import {
  AssignTaskRequest,
  ChangeTaskStatusRequest,
  CreateSubtaskRequest,
  CreateTaskCommentRequest,
  CreateTaskRequest,
  TaskComment,
  TaskDetail,
  TaskSummary,
  UpdateTaskCommentRequest,
  UpdateTaskProgressRequest,
  UpdateTaskRequest,
} from '../../src/features/tasks/api/taskTypes';
import { http, PagedData } from '../../src/shared/api';

jest.mock('../../src/shared/api', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Task API Adapter (taskApi)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProjectBrief = {
    id: 'proj-1',
    code: 'PRJ-01',
    name: 'WorkSphere Platform',
  };

  const mockReporter = {
    id: 'reporter-1',
    fullName: 'Jane Doe',
    avatarUrl: null,
  };

  const mockTaskSummary: TaskSummary = {
    id: 'task-1',
    project: mockProjectBrief,
    parentTaskId: null,
    title: 'Viết tài liệu hợp đồng',
    status: 'TODO',
    priority: 'HIGH',
    progressPercent: 0,
    assignees: [
      {
        id: 'user-1',
        fullName: 'John Smith',
        avatarUrl: null,
      },
    ],
    reporter: {
      id: 'reporter-1',
      fullName: 'Jane Doe',
    },
    dueDate: '2026-10-30T17:00:00Z',
    overdue: false,
    subtaskCount: 0,
    completedSubtaskCount: 0,
    commentCount: 2,
    attachmentCount: 0,
    updatedAt: '2026-10-20T10:00:00Z',
  };

  const mockTaskDetail: TaskDetail = {
    id: 'task-1',
    project: mockProjectBrief,
    parentTaskId: null,
    parentTask: null,
    milestoneId: null,
    milestone: null,
    title: 'Viết tài liệu hợp đồng',
    description: 'Chi tiết tài liệu',
    status: 'TODO',
    priority: 'HIGH',
    progressPercent: 0,
    startDate: '2026-10-20',
    dueDate: '2026-10-30T17:00:00Z',
    completedAt: null,
    estimatedMinutes: 240,
    actualMinutes: null,
    reporter: mockReporter,
    assignees: [
      {
        assignmentId: 'assign-100',
        id: 'user-1',
        fullName: 'John Smith',
        avatarUrl: null,
        assignedAt: '2026-10-20T10:00:00Z',
      },
    ],
    subtasks: [],
    recentComments: [],
    attachments: [],
    statusHistory: [],
    allowedActions: ['UPDATE', 'UPDATE_PROGRESS', 'UPDATE_STATUS', 'ASSIGN', 'DELETE'],
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
    version: 1,
  };

  const mockTaskComment: TaskComment = {
    id: 'comment-1',
    taskId: 'task-1',
    author: {
      id: 'user-1',
      fullName: 'John Smith',
      avatarUrl: null,
    },
    content: 'Đã hoàn thành phân tích yêu cầu',
    parentId: null,
    isEdited: false,
    editedAt: null,
    createdAt: '2026-10-20T11:00:00Z',
  };

  describe('serializeTaskListQuery', () => {
    it('returns empty object when query is omitted', () => {
      expect(serializeTaskListQuery()).toEqual({});
    });

    it('serializes pagination and filters correctly', () => {
      const result = serializeTaskListQuery({
        page: 0,
        size: 20,
        search: '  kiểm thử  ',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        projectId: 'proj-1',
        parentTaskId: 'parent-1',
        assigneeId: 'assignee-1',
        reporterId: 'reporter-1',
        overdue: true,
        dueFrom: '2026-10-01',
        dueTo: '2026-10-31',
        sort: 'dueDate,asc',
      });

      expect(result).toEqual({
        page: 0,
        size: 20,
        search: 'kiểm thử',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        projectId: 'proj-1',
        parentTaskId: 'parent-1',
        assigneeId: 'assignee-1',
        reporterId: 'reporter-1',
        overdue: true,
        dueFrom: '2026-10-01',
        dueTo: '2026-10-31',
        sort: 'dueDate,asc',
      });
    });

    it('omits blank or whitespace-only search string', () => {
      const result = serializeTaskListQuery({ search: '   ' });
      expect(result.search).toBeUndefined();
    });

    it('validates sort against whitelist and discards invalid sort properties', () => {
      const validResult = serializeTaskListQuery({ sort: 'priority,desc' });
      expect(validResult.sort).toBe('priority,desc');

      const invalidResult = serializeTaskListQuery({ sort: 'hackerField,desc' });
      expect(invalidResult.sort).toBeUndefined();
    });
  });

  describe('API Endpoints', () => {
    it('listTasks: calls GET /tasks with serialized params and unwraps page', async () => {
      const mockPage: PagedData<TaskSummary> = {
        items: [mockTaskSummary],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      (http.get as jest.Mock).mockResolvedValueOnce(mockPage);

      const result = await taskApi.listTasks({ page: 0, size: 20, search: 'doc' });

      expect(http.get).toHaveBeenCalledWith('/tasks', {
        params: { page: 0, size: 20, search: 'doc' },
      });
      expect(result.items).toHaveLength(1);
    });

    it('createTask: calls POST /tasks with payload', async () => {
      const request: CreateTaskRequest = {
        projectId: 'proj-1',
        title: 'Tạo task mới',
        priority: 'HIGH',
      };

      (http.post as jest.Mock).mockResolvedValueOnce(mockTaskDetail);

      const result = await taskApi.createTask(request);

      expect(http.post).toHaveBeenCalledWith('/tasks', request);
      expect(result.id).toBe('task-1');
    });

    it('getTaskDetail: calls GET /tasks/{id} with encoded taskId', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce(mockTaskDetail);

      const result = await taskApi.getTaskDetail('task-1/special');

      expect(http.get).toHaveBeenCalledWith('/tasks/task-1%2Fspecial');
      expect(result.title).toBe('Viết tài liệu hợp đồng');
    });

    it('updateTask: calls PUT /tasks/{id} with UpdateTaskRequest', async () => {
      const request: UpdateTaskRequest = {
        title: 'Tiêu đề cập nhật',
        priority: 'MEDIUM',
        version: 1,
      };

      (http.put as jest.Mock).mockResolvedValueOnce({
        ...mockTaskDetail,
        title: 'Tiêu đề cập nhật',
        version: 2,
      });

      const result = await taskApi.updateTask('task-1', request);

      expect(http.put).toHaveBeenCalledWith('/tasks/task-1', request);
      expect(result.version).toBe(2);
    });

    it('changeTaskStatus: calls PUT /tasks/{id}/status with version token', async () => {
      const request: ChangeTaskStatusRequest = {
        status: 'IN_PROGRESS',
        comment: 'Bắt đầu xử lý',
        version: 1,
      };

      (http.put as jest.Mock).mockResolvedValueOnce({
        ...mockTaskDetail,
        status: 'IN_PROGRESS',
        version: 2,
      });

      const result = await taskApi.changeTaskStatus('task-1', request);

      expect(http.put).toHaveBeenCalledWith('/tasks/task-1/status', request);
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('updateTaskProgress: calls PUT /tasks/{id}/progress with version token', async () => {
      const request: UpdateTaskProgressRequest = {
        progressPercent: 75.5,
        version: 2,
      };

      (http.put as jest.Mock).mockResolvedValueOnce({
        ...mockTaskDetail,
        progressPercent: 75.5,
        version: 3,
      });

      const result = await taskApi.updateTaskProgress('task-1', request);

      expect(http.put).toHaveBeenCalledWith('/tasks/task-1/progress', request);
      expect(result.progressPercent).toBe(75.5);
    });

    it('assignUsers: calls POST /tasks/{id}/assignments with assigneeIds', async () => {
      const request: AssignTaskRequest = {
        assigneeIds: ['user-1', 'user-2'],
      };

      (http.post as jest.Mock).mockResolvedValueOnce(mockTaskDetail);

      const result = await taskApi.assignUsers('task-1', request);

      expect(http.post).toHaveBeenCalledWith('/tasks/task-1/assignments', request);
      expect(result.id).toBe('task-1');
    });

    it('unassignUser: calls DELETE /tasks/{id}/assignments/{assignmentId} with assignmentId (NOT userId)', async () => {
      const taskId = 'task-uuid-abc';
      const userId = 'user-uuid-xyz';
      const assignmentId = 'assignment-uuid-999';

      (http.delete as jest.Mock).mockResolvedValueOnce(mockTaskDetail);

      const result = await taskApi.unassignUser(taskId, assignmentId);

      // Invariant: URL must contain assignmentId, NOT userId!
      expect(http.delete).toHaveBeenCalledWith(
        `/tasks/${taskId}/assignments/${assignmentId}`
      );
      expect(http.delete).not.toHaveBeenCalledWith(expect.stringContaining(userId));
      expect(result.id).toBe('task-1');
    });

    it('deleteTask: calls DELETE /tasks/{id} and returns void', async () => {
      (http.delete as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(taskApi.deleteTask('task-1')).resolves.toBeUndefined();
      expect(http.delete).toHaveBeenCalledWith('/tasks/task-1');
    });

    it('getSubtasks: calls GET /tasks/{id}/subtasks', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce([mockTaskSummary]);

      const result = await taskApi.getSubtasks('task-1');

      expect(http.get).toHaveBeenCalledWith('/tasks/task-1/subtasks');
      expect(result).toHaveLength(1);
    });

    it('createSubtask: calls POST /tasks/{id}/subtasks', async () => {
      const request: CreateSubtaskRequest = {
        title: 'Công việc con 1',
        priority: 'LOW',
      };

      (http.post as jest.Mock).mockResolvedValueOnce(mockTaskDetail);

      const result = await taskApi.createSubtask('task-1', request);

      expect(http.post).toHaveBeenCalledWith('/tasks/task-1/subtasks', request);
      expect(result.id).toBe('task-1');
    });

    it('getComments: calls GET /tasks/{id}/comments with pagination params', async () => {
      const mockCommentPage: PagedData<TaskComment> = {
        items: [mockTaskComment],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      (http.get as jest.Mock).mockResolvedValueOnce(mockCommentPage);

      const result = await taskApi.getComments('task-1', 0, 20, 'createdAt,asc');

      expect(http.get).toHaveBeenCalledWith('/tasks/task-1/comments', {
        params: { page: 0, size: 20, sort: 'createdAt,asc' },
      });
      expect(result.items).toHaveLength(1);
    });

    it('createComment: calls POST /tasks/{id}/comments', async () => {
      const request: CreateTaskCommentRequest = {
        content: 'Thảo luận thêm',
      };

      (http.post as jest.Mock).mockResolvedValueOnce(mockTaskComment);

      const result = await taskApi.createComment('task-1', request);

      expect(http.post).toHaveBeenCalledWith('/tasks/task-1/comments', request);
      expect(result.content).toBe('Đã hoàn thành phân tích yêu cầu');
    });

    it('updateComment: calls PUT /tasks/{id}/comments/{commentId}', async () => {
      const request: UpdateTaskCommentRequest = {
        content: 'Nội dung cập nhật',
      };

      (http.put as jest.Mock).mockResolvedValueOnce({
        ...mockTaskComment,
        content: 'Nội dung cập nhật',
        isEdited: true,
      });

      const result = await taskApi.updateComment('task-1', 'comment-1', request);

      expect(http.put).toHaveBeenCalledWith('/tasks/task-1/comments/comment-1', request);
      expect(result.content).toBe('Nội dung cập nhật');
      expect(result.isEdited).toBe(true);
    });

    it('deleteComment: calls DELETE /tasks/{id}/comments/{commentId}', async () => {
      (http.delete as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(taskApi.deleteComment('task-1', 'comment-1')).resolves.toBeUndefined();
      expect(http.delete).toHaveBeenCalledWith('/tasks/task-1/comments/comment-1');
    });
  });

  describe('Response Guard Rejections', () => {
    it('throws error when listTasks receives malformed page data', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce({ invalid: 'shape' });
      await expect(taskApi.listTasks()).rejects.toThrow(
        'Dữ liệu danh sách công việc máy chủ trả về không hợp lệ'
      );
    });

    it('throws error when getTaskDetail receives malformed task detail', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce({ id: 'task-1' }); // missing required fields
      await expect(taskApi.getTaskDetail('task-1')).rejects.toThrow(
        'Dữ liệu chi tiết công việc máy chủ trả về không hợp lệ'
      );
    });
  });
});
