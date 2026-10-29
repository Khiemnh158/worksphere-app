/**
 * Phase 14A: Mobile Dashboard Types and Runtime Type Guards
 * Aligned with backend PersonalDashboardResponse.java and 06_API_CONTRACT.md section 10.
 */

export interface TaskDashboardSummary {
  todo: number;
  inProgress: number;
  inReview: number;
  completed: number;
  overdue: number;
  dueSoon: number;
}

export interface ServiceRequestDashboardSummary {
  open: number;
  inProgress: number;
  waitingForUser: number;
  resolved: number;
}

export interface ProjectDashboardSummary {
  active: number;
  onHold: number;
}

export const DASHBOARD_TASK_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export type DashboardTaskPriority = (typeof DASHBOARD_TASK_PRIORITIES)[number];

export function isDashboardTaskPriority(value: unknown): value is DashboardTaskPriority {
  return typeof value === 'string' && (DASHBOARD_TASK_PRIORITIES as readonly string[]).includes(value);
}

export const DASHBOARD_TASK_STATUSES = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'COMPLETED',
  'CANCELLED',
] as const;

export type DashboardTaskStatus = (typeof DASHBOARD_TASK_STATUSES)[number];

export function isDashboardTaskStatus(value: unknown): value is DashboardTaskStatus {
  return typeof value === 'string' && (DASHBOARD_TASK_STATUSES as readonly string[]).includes(value);
}

export interface UpcomingTaskItem {
  id: string; // UUID
  projectId: string; // UUID
  projectName: string;
  title: string;
  status: DashboardTaskStatus; // TaskStatus
  priority: DashboardTaskPriority; // TaskPriority
  dueDate: string; // ISO-8601 Instant string
}

export interface RecentNotificationItem {
  id: string; // UUID
  type: string; // NotificationType
  title: string;
  message: string;
  referenceType: string; // NotificationReferenceType
  referenceId: string; // UUID
  read: boolean;
  createdAt: string; // ISO-8601 Instant string
}

export interface PersonalDashboardData {
  tasks: TaskDashboardSummary;
  serviceRequests: ServiceRequestDashboardSummary;
  projects: ProjectDashboardSummary;
  upcomingTasks: UpcomingTaskItem[];
  recentNotifications: RecentNotificationItem[];
}

/**
 * Type guard for TaskDashboardSummary
 */
export function isTaskDashboardSummary(data: unknown): data is TaskDashboardSummary {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.todo === 'number' &&
    typeof obj.inProgress === 'number' &&
    typeof obj.inReview === 'number' &&
    typeof obj.completed === 'number' &&
    typeof obj.overdue === 'number' &&
    typeof obj.dueSoon === 'number'
  );
}

/**
 * Type guard for ServiceRequestDashboardSummary
 */
export function isServiceRequestDashboardSummary(data: unknown): data is ServiceRequestDashboardSummary {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.open === 'number' &&
    typeof obj.inProgress === 'number' &&
    typeof obj.waitingForUser === 'number' &&
    typeof obj.resolved === 'number'
  );
}

/**
 * Type guard for ProjectDashboardSummary
 */
export function isProjectDashboardSummary(data: unknown): data is ProjectDashboardSummary {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return typeof obj.active === 'number' && typeof obj.onHold === 'number';
}

/**
 * Type guard for UpcomingTaskItem
 */
export function isUpcomingTaskItem(data: unknown): data is UpcomingTaskItem {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.projectId === 'string' &&
    typeof obj.projectName === 'string' &&
    typeof obj.title === 'string' &&
    isDashboardTaskStatus(obj.status) &&
    isDashboardTaskPriority(obj.priority) &&
    typeof obj.dueDate === 'string'
  );
}

/**
 * Type guard for RecentNotificationItem
 */
export function isRecentNotificationItem(data: unknown): data is RecentNotificationItem {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.referenceType === 'string' &&
    typeof obj.referenceId === 'string' &&
    typeof obj.read === 'boolean' &&
    typeof obj.createdAt === 'string'
  );
}

/**
 * Type guard for PersonalDashboardData response payload
 */
export function isPersonalDashboardResponse(data: unknown): data is PersonalDashboardData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    isTaskDashboardSummary(obj.tasks) &&
    isServiceRequestDashboardSummary(obj.serviceRequests) &&
    isProjectDashboardSummary(obj.projects) &&
    Array.isArray(obj.upcomingTasks) &&
    obj.upcomingTasks.every(isUpcomingTaskItem) &&
    Array.isArray(obj.recentNotifications) &&
    obj.recentNotifications.every(isRecentNotificationItem)
  );
}
