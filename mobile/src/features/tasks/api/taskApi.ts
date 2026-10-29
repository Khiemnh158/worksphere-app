/**
 * Phase 15A: Mobile Task API Adapter
 * Transport adapter connecting mobile Task features to backend Spring Boot REST endpoints.
 * Operates purely as a transport adapter:
 * - Does NOT store entity cache
 * - Does NOT mutate navigation state
 * - Performs query serialization and validation
 * - Unwraps standard ApiResponse envelope via shared http client
 * - Validates responses through runtime type guards
 */

import { http, PagedData } from '../../../shared/api';
import {
  AssignTaskRequest,
  ChangeTaskStatusRequest,
  CreateSubtaskRequest,
  CreateTaskCommentRequest,
  CreateTaskRequest,
  isTaskComment,
  isTaskCommentPage,
  isTaskDetail,
  isTaskSummary,
  isTaskSummaryPage,
  TASK_SORT_PROPERTIES,
  TaskComment,
  TaskDetail,
  TaskListQuery,
  TaskSortProperty,
  TaskSummary,
  UpdateTaskCommentRequest,
  UpdateTaskProgressRequest,
  UpdateTaskRequest,
} from './taskTypes';

function isTaskSortProperty(property: string): property is TaskSortProperty {
  return (TASK_SORT_PROPERTIES as readonly string[]).includes(property);
}

/**
 * Builds deterministic query parameters for task listing.
 * - Trims search string; omits if empty or whitespace only.
 * - Validates sort field against canonical whitelist.
 * - Only includes defined filter parameters.
 */
export function serializeTaskListQuery(query?: TaskListQuery): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};

  if (!query) {
    return params;
  }

  if (typeof query.page === 'number' && query.page >= 0) {
    params.page = query.page;
  }

  if (typeof query.size === 'number' && query.size > 0) {
    params.size = query.size;
  }

  if (query.sort && typeof query.sort === 'string') {
    const parts = query.sort.split(',');
    const property = parts[0]?.trim();
    const direction = parts[1]?.trim().toLowerCase();
    if (property && isTaskSortProperty(property)) {
      const validDir = direction === 'asc' ? 'asc' : 'desc';
      params.sort = `${property},${validDir}`;
    }
  }

  if (typeof query.search === 'string') {
    const trimmed = query.search.trim();
    if (trimmed.length > 0) {
      params.search = trimmed;
    }
  }

  if (query.projectId && typeof query.projectId === 'string' && query.projectId.trim().length > 0) {
    params.projectId = query.projectId.trim();
  }

  if (query.parentTaskId && typeof query.parentTaskId === 'string' && query.parentTaskId.trim().length > 0) {
    params.parentTaskId = query.parentTaskId.trim();
  }

  if (query.assigneeId && typeof query.assigneeId === 'string' && query.assigneeId.trim().length > 0) {
    params.assigneeId = query.assigneeId.trim();
  }

  if (query.reporterId && typeof query.reporterId === 'string' && query.reporterId.trim().length > 0) {
    params.reporterId = query.reporterId.trim();
  }

  if (query.status) {
    params.status = query.status;
  }

  if (query.priority) {
    params.priority = query.priority;
  }

  if (typeof query.overdue === 'boolean') {
    params.overdue = query.overdue;
  }

  if (query.dueFrom && typeof query.dueFrom === 'string' && query.dueFrom.trim().length > 0) {
    params.dueFrom = query.dueFrom.trim();
  }

  if (query.dueTo && typeof query.dueTo === 'string' && query.dueTo.trim().length > 0) {
    params.dueTo = query.dueTo.trim();
  }

  return params;
}

export const taskApi = {
  /**
   * 12.1. Danh sách công việc
   * GET /tasks
   */
  async listTasks(query?: TaskListQuery): Promise<PagedData<TaskSummary>> {
    const params = serializeTaskListQuery(query);
    const data = await http.get<PagedData<TaskSummary>>('/tasks', { params });

    if (!isTaskSummaryPage(data)) {
      throw new Error('Dữ liệu danh sách công việc máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.2. Tạo công việc
   * POST /tasks
   */
  async createTask(request: CreateTaskRequest): Promise<TaskDetail> {
    const data = await http.post<CreateTaskRequest, TaskDetail>('/tasks', request);

    if (!isTaskDetail(data)) {
      throw new Error('Dữ liệu tạo công việc máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.3. Chi tiết công việc
   * GET /tasks/{taskId}
   */
  async getTaskDetail(taskId: string): Promise<TaskDetail> {
    const data = await http.get<TaskDetail>(`/tasks/${encodeURIComponent(taskId)}`);

    if (!isTaskDetail(data)) {
      throw new Error('Dữ liệu chi tiết công việc máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.4. Cập nhật công việc
   * PUT /tasks/{taskId}
   */
  async updateTask(taskId: string, request: UpdateTaskRequest): Promise<TaskDetail> {
    const data = await http.put<UpdateTaskRequest, TaskDetail>(
      `/tasks/${encodeURIComponent(taskId)}`,
      request
    );

    if (!isTaskDetail(data)) {
      throw new Error('Dữ liệu cập nhật công việc máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.5. Cập nhật trạng thái công việc
   * PUT /tasks/{taskId}/status
   */
  async changeTaskStatus(taskId: string, request: ChangeTaskStatusRequest): Promise<TaskDetail> {
    const data = await http.put<ChangeTaskStatusRequest, TaskDetail>(
      `/tasks/${encodeURIComponent(taskId)}/status`,
      request
    );

    if (!isTaskDetail(data)) {
      throw new Error('Dữ liệu cập nhật trạng thái máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.6. Cập nhật tiến độ
   * PUT /tasks/{taskId}/progress
   */
  async updateTaskProgress(taskId: string, request: UpdateTaskProgressRequest): Promise<TaskDetail> {
    const data = await http.put<UpdateTaskProgressRequest, TaskDetail>(
      `/tasks/${encodeURIComponent(taskId)}/progress`,
      request
    );

    if (!isTaskDetail(data)) {
      throw new Error('Dữ liệu cập nhật tiến độ máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.7. Phân công người thực hiện
   * POST /tasks/{taskId}/assignments
   */
  async assignUsers(taskId: string, request: AssignTaskRequest): Promise<TaskDetail> {
    const data = await http.post<AssignTaskRequest, TaskDetail>(
      `/tasks/${encodeURIComponent(taskId)}/assignments`,
      request
    );

    if (!isTaskDetail(data)) {
      throw new Error('Dữ liệu phân công người thực hiện máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.8. Gỡ phân công
   * DELETE /tasks/{taskId}/assignments/{assignmentId}
   * Invariant: Requires assignmentId (task_assignments.id), NOT userId.
   */
  async unassignUser(taskId: string, assignmentId: string): Promise<TaskDetail> {
    const data = await http.delete<TaskDetail>(
      `/tasks/${encodeURIComponent(taskId)}/assignments/${encodeURIComponent(assignmentId)}`
    );

    if (!isTaskDetail(data)) {
      throw new Error('Dữ liệu gỡ phân công người thực hiện máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.9. Xoá công việc
   * DELETE /tasks/{taskId}
   */
  async deleteTask(taskId: string): Promise<void> {
    await http.delete<void>(`/tasks/${encodeURIComponent(taskId)}`);
  },

  /**
   * 12.10. Lấy danh sách công việc con
   * GET /tasks/{taskId}/subtasks
   */
  async getSubtasks(taskId: string): Promise<TaskSummary[]> {
    const data = await http.get<TaskSummary[]>(`/tasks/${encodeURIComponent(taskId)}/subtasks`);

    if (!Array.isArray(data) || !data.every(isTaskSummary)) {
      throw new Error('Dữ liệu danh sách công việc con máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.11. Tạo công việc con
   * POST /tasks/{taskId}/subtasks
   */
  async createSubtask(taskId: string, request: CreateSubtaskRequest): Promise<TaskDetail> {
    const data = await http.post<CreateSubtaskRequest, TaskDetail>(
      `/tasks/${encodeURIComponent(taskId)}/subtasks`,
      request
    );

    if (!isTaskDetail(data)) {
      throw new Error('Dữ liệu tạo công việc con máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.12. Danh sách bình luận công việc
   * GET /tasks/{taskId}/comments
   */
  async getComments(
    taskId: string,
    page = 0,
    size = 20,
    sort = 'createdAt,asc'
  ): Promise<PagedData<TaskComment>> {
    const params: Record<string, string | number> = { page, size, sort };
    const data = await http.get<PagedData<TaskComment>>(
      `/tasks/${encodeURIComponent(taskId)}/comments`,
      { params }
    );

    if (!isTaskCommentPage(data)) {
      throw new Error('Dữ liệu danh sách bình luận máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.13. Thêm bình luận công việc
   * POST /tasks/{taskId}/comments
   */
  async createComment(taskId: string, request: CreateTaskCommentRequest): Promise<TaskComment> {
    const data = await http.post<CreateTaskCommentRequest, TaskComment>(
      `/tasks/${encodeURIComponent(taskId)}/comments`,
      request
    );

    if (!isTaskComment(data)) {
      throw new Error('Dữ liệu tạo bình luận máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.14. Chỉnh sửa bình luận
   * PUT /tasks/{taskId}/comments/{commentId}
   */
  async updateComment(
    taskId: string,
    commentId: string,
    request: UpdateTaskCommentRequest
  ): Promise<TaskComment> {
    const data = await http.put<UpdateTaskCommentRequest, TaskComment>(
      `/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
      request
    );

    if (!isTaskComment(data)) {
      throw new Error('Dữ liệu chỉnh sửa bình luận máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 12.15. Xoá bình luận
   * DELETE /tasks/{taskId}/comments/{commentId}
   */
  async deleteComment(taskId: string, commentId: string): Promise<void> {
    await http.delete<void>(
      `/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`
    );
  },
};
