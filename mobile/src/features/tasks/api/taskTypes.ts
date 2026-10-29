/**
 * Phase 15A: Mobile Task Types, Enums and Runtime Type Guards
 * Aligned with backend Task models, DTOs, and 06_API_CONTRACT.md section 12.
 */

import { PagedData } from '../../../shared/api';

// ==========================================
// 1. Core Domain Enums & Constants
// ==========================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const TASK_STATUS_VALUES: readonly TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'COMPLETED',
  'CANCELLED',
] as const;

export const TASK_PRIORITY_VALUES: readonly TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export const TASK_SORT_PROPERTIES = [
  'createdAt',
  'dueDate',
  'priority',
  'status',
  'title',
] as const;

export type TaskSortProperty = (typeof TASK_SORT_PROPERTIES)[number];
export type TaskSortDirection = 'asc' | 'desc';

export const KNOWN_TASK_ACTIONS = [
  'ADD_COMMENT',
  'UPDATE',
  'UPDATE_PROGRESS',
  'UPDATE_STATUS',
  'ASSIGN',
  'UNASSIGN',
  'CREATE_SUBTASK',
  'DELETE',
] as const;

export type KnownTaskAction = (typeof KNOWN_TASK_ACTIONS)[number];

export function isKnownTaskAction(action: string): action is KnownTaskAction {
  return (KNOWN_TASK_ACTIONS as readonly string[]).includes(action);
}

// ==========================================
// 2. Sub-Entities & Nested Types
// ==========================================

export interface ProjectBrief {
  id: string;
  code: string;
  name: string;
}

export interface ParentTaskBrief {
  id: string;
  title: string;
}

export interface MilestoneBrief {
  id: string;
  name: string;
}

export interface ReporterSummary {
  id: string;
  fullName: string;
}

export interface ReporterDetail {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface AssigneeSummary {
  id: string; // User account UUID
  fullName: string;
  avatarUrl?: string | null;
}

/**
 * AssigneeDetail preserves the distinction between:
 * - id: the User account UUID
 * - assignmentId: the join entity (task_assignments.id) UUID, required for unassigning
 */
export interface AssigneeDetail {
  assignmentId: string; // task_assignments.id
  id: string; // User account UUID
  fullName: string;
  avatarUrl?: string | null;
  assignedAt: string;
}

export interface TaskStatusHistoryItem {
  id: string;
  taskId: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  comment?: string | null;
  changedBy: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  changedAt: string;
}

export interface TaskCommentAuthor {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface TaskComment {
  id: string;
  taskId: string;
  author: TaskCommentAuthor;
  content: string;
  parentId?: string | null;
  isEdited: boolean;
  editedAt?: string | null;
  createdAt: string;
}

// ==========================================
// 3. Task Summary & Detail Responses
// ==========================================

export interface TaskSummary {
  id: string;
  project: ProjectBrief;
  parentTaskId?: string | null;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progressPercent: number;
  assignees: AssigneeSummary[];
  reporter?: ReporterSummary | null;
  dueDate?: string | null;
  overdue: boolean;
  subtaskCount: number;
  completedSubtaskCount: number;
  commentCount: number;
  attachmentCount: number;
  updatedAt: string;
}

export interface TaskDetail {
  id: string;
  project: ProjectBrief;
  parentTaskId?: string | null;
  parentTask?: ParentTaskBrief | null;
  milestoneId?: string | null;
  milestone?: MilestoneBrief | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progressPercent: number;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  reporter: ReporterDetail;
  assignees: AssigneeDetail[];
  subtasks: TaskSummary[];
  recentComments: TaskComment[];
  attachments: unknown[];
  statusHistory: TaskStatusHistoryItem[];
  allowedActions: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ==========================================
// 4. Request DTOs
// ==========================================

export interface CreateTaskRequest {
  projectId: string;
  parentTaskId?: string;
  milestoneId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeIds?: string[];
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  version: number;
}

export interface ChangeTaskStatusRequest {
  status: TaskStatus;
  comment?: string;
  version: number;
}

export interface UpdateTaskProgressRequest {
  progressPercent: number;
  version: number;
}

export interface AssignTaskRequest {
  assigneeIds: string[];
}

export interface CreateSubtaskRequest {
  milestoneId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeIds?: string[];
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
}

export interface CreateTaskCommentRequest {
  content: string;
  parentCommentId?: string;
  attachmentFileIds?: string[];
}

export interface UpdateTaskCommentRequest {
  content: string;
}

// ==========================================
// 5. Query DTO
// ==========================================

export interface TaskListQuery {
  search?: string;
  projectId?: string;
  parentTaskId?: string;
  assigneeId?: string;
  reporterId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  overdue?: boolean;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ==========================================
// 6. Runtime Type Guards
// ==========================================

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUS_VALUES as readonly string[]).includes(value);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && (TASK_PRIORITY_VALUES as readonly string[]).includes(value);
}

export function isAssigneeSummary(value: unknown): value is AssigneeSummary {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.fullName === 'string';
}

export function isAssigneeDetail(value: unknown): value is AssigneeDetail {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.assignmentId === 'string' &&
    typeof v.id === 'string' &&
    typeof v.fullName === 'string' &&
    typeof v.assignedAt === 'string'
  );
}

export function isTaskSummary(value: unknown): value is TaskSummary {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v.id !== 'string' ||
    typeof v.title !== 'string' ||
    !isTaskStatus(v.status) ||
    !isTaskPriority(v.priority) ||
    typeof v.progressPercent !== 'number' ||
    typeof v.overdue !== 'boolean' ||
    typeof v.subtaskCount !== 'number' ||
    typeof v.completedSubtaskCount !== 'number' ||
    typeof v.commentCount !== 'number' ||
    typeof v.attachmentCount !== 'number' ||
    typeof v.updatedAt !== 'string'
  ) {
    return false;
  }

  if (!v.project || typeof v.project !== 'object') return false;
  const p = v.project as Record<string, unknown>;
  if (typeof p.id !== 'string' || typeof p.code !== 'string' || typeof p.name !== 'string') {
    return false;
  }

  if (!Array.isArray(v.assignees) || !v.assignees.every(isAssigneeSummary)) {
    return false;
  }

  return true;
}

export function isTaskDetail(value: unknown): value is TaskDetail {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v.id !== 'string' ||
    typeof v.title !== 'string' ||
    !isTaskStatus(v.status) ||
    !isTaskPriority(v.priority) ||
    typeof v.progressPercent !== 'number' ||
    typeof v.version !== 'number' ||
    typeof v.createdAt !== 'string' ||
    typeof v.updatedAt !== 'string'
  ) {
    return false;
  }

  if (!v.project || typeof v.project !== 'object') return false;
  const p = v.project as Record<string, unknown>;
  if (typeof p.id !== 'string' || typeof p.code !== 'string' || typeof p.name !== 'string') {
    return false;
  }

  if (!v.reporter || typeof v.reporter !== 'object') return false;
  const rep = v.reporter as Record<string, unknown>;
  if (typeof rep.id !== 'string' || typeof rep.fullName !== 'string') {
    return false;
  }

  if (!Array.isArray(v.assignees) || !v.assignees.every(isAssigneeDetail)) {
    return false;
  }

  if (!Array.isArray(v.allowedActions) || !v.allowedActions.every(a => typeof a === 'string')) {
    return false;
  }

  return true;
}

export function isTaskComment(value: unknown): value is TaskComment {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v.id !== 'string' ||
    typeof v.taskId !== 'string' ||
    typeof v.content !== 'string' ||
    typeof v.isEdited !== 'boolean' ||
    typeof v.createdAt !== 'string'
  ) {
    return false;
  }

  if (!v.author || typeof v.author !== 'object') return false;
  const a = v.author as Record<string, unknown>;
  if (typeof a.id !== 'string' || typeof a.fullName !== 'string') {
    return false;
  }

  return true;
}

export function isTaskSummaryPage(value: unknown): value is PagedData<TaskSummary> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v.page !== 'number' ||
    typeof v.size !== 'number' ||
    typeof v.totalItems !== 'number' ||
    typeof v.totalPages !== 'number' ||
    typeof v.hasNext !== 'boolean' ||
    typeof v.hasPrevious !== 'boolean' ||
    !Array.isArray(v.items)
  ) {
    return false;
  }

  return v.items.every(isTaskSummary);
}

export function isTaskCommentPage(value: unknown): value is PagedData<TaskComment> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v.page !== 'number' ||
    typeof v.size !== 'number' ||
    typeof v.totalItems !== 'number' ||
    typeof v.totalPages !== 'number' ||
    typeof v.hasNext !== 'boolean' ||
    typeof v.hasPrevious !== 'boolean' ||
    !Array.isArray(v.items)
  ) {
    return false;
  }

  return v.items.every(isTaskComment);
}
