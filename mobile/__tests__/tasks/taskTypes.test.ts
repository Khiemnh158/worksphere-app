import {
  AssigneeDetail,
  AssigneeSummary,
  isAssigneeDetail,
  isAssigneeSummary,
  isKnownTaskAction,
  isTaskComment,
  isTaskCommentPage,
  isTaskDetail,
  isTaskPriority,
  isTaskStatus,
  isTaskSummary,
  isTaskSummaryPage,
  TaskComment,
  TaskDetail,
  TaskPriority,
  TaskStatus,
  TaskSummary,
} from '../../src/features/tasks/api/taskTypes';
import { PagedData } from '../../src/shared/api';

describe('Task Types & Runtime Type Guards', () => {
  describe('Enum Guards', () => {
    it('validates TaskStatus correctly', () => {
      const validStatuses: TaskStatus[] = [
        'TODO',
        'IN_PROGRESS',
        'IN_REVIEW',
        'COMPLETED',
        'CANCELLED',
      ];

      validStatuses.forEach(status => {
        expect(isTaskStatus(status)).toBe(true);
      });

      expect(isTaskStatus('DRAFT')).toBe(false);
      expect(isTaskStatus('PENDING')).toBe(false);
      expect(isTaskStatus('todo')).toBe(false);
      expect(isTaskStatus(null)).toBe(false);
      expect(isTaskStatus(undefined)).toBe(false);
      expect(isTaskStatus(123)).toBe(false);
    });

    it('validates TaskPriority correctly', () => {
      const validPriorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      validPriorities.forEach(priority => {
        expect(isTaskPriority(priority)).toBe(true);
      });

      expect(isTaskPriority('URGENT')).toBe(false);
      expect(isTaskPriority('NORMAL')).toBe(false);
      expect(isTaskPriority('low')).toBe(false);
      expect(isTaskPriority(null)).toBe(false);
    });

    it('validates known allowedActions correctly', () => {
      expect(isKnownTaskAction('ADD_COMMENT')).toBe(true);
      expect(isKnownTaskAction('UPDATE')).toBe(true);
      expect(isKnownTaskAction('UPDATE_PROGRESS')).toBe(true);
      expect(isKnownTaskAction('UPDATE_STATUS')).toBe(true);
      expect(isKnownTaskAction('ASSIGN')).toBe(true);
      expect(isKnownTaskAction('UNASSIGN')).toBe(true);
      expect(isKnownTaskAction('CREATE_SUBTASK')).toBe(true);
      expect(isKnownTaskAction('DELETE')).toBe(true);

      expect(isKnownTaskAction('UNKNOWN_ACTION')).toBe(false);
      expect(isKnownTaskAction('MANAGE_MEMBERS')).toBe(false);
    });
  });

  describe('Assignee Guards & Identity Distinction', () => {
    it('validates AssigneeSummary correctly', () => {
      const valid: AssigneeSummary = {
        id: 'user-uuid-1',
        fullName: 'Nguyễn Văn A',
        avatarUrl: 'https://example.com/avatar.jpg',
      };
      expect(isAssigneeSummary(valid)).toBe(true);

      expect(isAssigneeSummary({ id: 'u1' })).toBe(false); // missing fullName
      expect(isAssigneeSummary(null)).toBe(false);
    });

    it('validates AssigneeDetail and proves userId != assignmentId', () => {
      const validDetail: AssigneeDetail = {
        assignmentId: 'assignment-uuid-100',
        id: 'user-uuid-1', // distinct identity
        fullName: 'Nguyễn Văn A',
        avatarUrl: null,
        assignedAt: '2026-10-20T10:00:00Z',
      };

      expect(isAssigneeDetail(validDetail)).toBe(true);
      expect(validDetail.id).not.toBe(validDetail.assignmentId);
      expect(validDetail.assignmentId).toBe('assignment-uuid-100');
      expect(validDetail.id).toBe('user-uuid-1');

      expect(isAssigneeDetail({ ...validDetail, assignmentId: undefined })).toBe(false);
      expect(isAssigneeDetail({ ...validDetail, id: 123 })).toBe(false);
    });
  });

  describe('TaskSummary Guard', () => {
    const validSummary: TaskSummary = {
      id: 'task-uuid-1',
      project: {
        id: 'proj-uuid-1',
        code: 'PRJ-01',
        name: 'WorkSphere Core',
      },
      parentTaskId: null,
      title: 'Thiết kế giao diện',
      status: 'TODO',
      priority: 'HIGH',
      progressPercent: 0,
      assignees: [
        {
          id: 'user-uuid-1',
          fullName: 'Nguyễn Văn A',
          avatarUrl: null,
        },
      ],
      reporter: {
        id: 'user-uuid-2',
        fullName: 'Trần Thị B',
      },
      dueDate: '2026-10-25T17:00:00Z',
      overdue: false,
      subtaskCount: 2,
      completedSubtaskCount: 0,
      commentCount: 5,
      attachmentCount: 0,
      updatedAt: '2026-10-20T08:00:00Z',
    };

    it('accepts valid TaskSummary', () => {
      expect(isTaskSummary(validSummary)).toBe(true);
    });

    it('rejects malformed TaskSummary', () => {
      expect(isTaskSummary({ ...validSummary, id: 123 })).toBe(false);
      expect(isTaskSummary({ ...validSummary, status: 'INVALID_STATUS' })).toBe(false);
      expect(isTaskSummary({ ...validSummary, project: null })).toBe(false);
      expect(isTaskSummary({ ...validSummary, assignees: [{ id: 'u1' }] })).toBe(false);
    });
  });

  describe('TaskDetail Guard & Forward Compatibility', () => {
    const validDetail: TaskDetail = {
      id: 'task-uuid-1',
      project: {
        id: 'proj-uuid-1',
        code: 'PRJ-01',
        name: 'WorkSphere Core',
      },
      parentTaskId: null,
      parentTask: null,
      milestoneId: 'ms-uuid-1',
      milestone: {
        id: 'ms-uuid-1',
        name: 'Mốc 1: Khởi động',
      },
      title: 'Thiết kế giao diện',
      description: 'Mô tả chi tiết công việc',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      progressPercent: 30,
      startDate: '2026-10-18',
      dueDate: '2026-10-25T17:00:00Z',
      completedAt: null,
      estimatedMinutes: 480,
      actualMinutes: 120,
      reporter: {
        id: 'user-uuid-2',
        fullName: 'Trần Thị B',
        avatarUrl: null,
      },
      assignees: [
        {
          assignmentId: 'assign-uuid-1',
          id: 'user-uuid-1',
          fullName: 'Nguyễn Văn A',
          avatarUrl: null,
          assignedAt: '2026-10-18T09:00:00Z',
        },
      ],
      subtasks: [],
      recentComments: [],
      attachments: [],
      statusHistory: [
        {
          id: 'hist-uuid-1',
          taskId: 'task-uuid-1',
          fromStatus: 'TODO',
          toStatus: 'IN_PROGRESS',
          comment: 'Bắt đầu làm',
          changedBy: {
            id: 'user-uuid-1',
            fullName: 'Nguyễn Văn A',
            avatarUrl: null,
          },
          changedAt: '2026-10-18T09:30:00Z',
        },
      ],
      allowedActions: ['UPDATE', 'UPDATE_PROGRESS', 'ADD_COMMENT', 'UPDATE_STATUS'],
      createdAt: '2026-10-18T08:00:00Z',
      updatedAt: '2026-10-18T09:30:00Z',
      version: 1,
    };

    it('accepts valid TaskDetail', () => {
      expect(isTaskDetail(validDetail)).toBe(true);
    });

    it('accepts forward-compatible future allowedActions without error', () => {
      const withFutureAction = {
        ...validDetail,
        allowedActions: [...validDetail.allowedActions, 'FUTURE_SERVER_ACTION_2027'],
      };
      expect(isTaskDetail(withFutureAction)).toBe(true);
    });

    it('rejects malformed TaskDetail', () => {
      expect(isTaskDetail({ ...validDetail, version: '1' })).toBe(false);
      expect(isTaskDetail({ ...validDetail, reporter: null })).toBe(false);
      expect(isTaskDetail({ ...validDetail, allowedActions: 'not-an-array' })).toBe(false);
    });
  });

  describe('TaskComment Guard', () => {
    const validComment: TaskComment = {
      id: 'comment-uuid-1',
      taskId: 'task-uuid-1',
      author: {
        id: 'user-uuid-1',
        fullName: 'Nguyễn Văn A',
        avatarUrl: null,
      },
      content: 'Báo cáo tiến độ hoàn thành 50%',
      parentId: null,
      isEdited: false,
      editedAt: null,
      createdAt: '2026-10-20T11:00:00Z',
    };

    it('accepts valid TaskComment', () => {
      expect(isTaskComment(validComment)).toBe(true);
    });

    it('rejects malformed TaskComment', () => {
      expect(isTaskComment({ ...validComment, author: null })).toBe(false);
      expect(isTaskComment({ ...validComment, isEdited: 'false' })).toBe(false);
    });
  });

  describe('Pagination Page Guards', () => {
    it('validates TaskSummaryPage correctly', () => {
      const validPage: PagedData<TaskSummary> = {
        items: [],
        page: 0,
        size: 20,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      expect(isTaskSummaryPage(validPage)).toBe(true);
      expect(isTaskSummaryPage({ ...validPage, page: '0' })).toBe(false);
      expect(isTaskSummaryPage({ ...validPage, items: [{ invalid: true }] })).toBe(false);
    });

    it('validates TaskCommentPage correctly', () => {
      const validPage: PagedData<TaskComment> = {
        items: [],
        page: 0,
        size: 20,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      expect(isTaskCommentPage(validPage)).toBe(true);
      expect(isTaskCommentPage({ ...validPage, items: null })).toBe(false);
    });
  });
});
