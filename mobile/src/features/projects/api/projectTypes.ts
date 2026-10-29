/**
 * Phase 14A: Mobile Project Types, Enums and Runtime Type Guards
 * Aligned with backend Project models, DTOs and 06_API_CONTRACT.md section 11.
 */

// ==========================================
// 1. Core Domain Enums & Constants
// ==========================================

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProjectRole = 'PROJECT_MANAGER' | 'TEAM_LEADER' | 'MEMBER' | 'OBSERVER';

export type MilestoneStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export const PROJECT_STATUS_VALUES: readonly ProjectStatus[] = [
  'DRAFT',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const;

export const PROJECT_PRIORITY_VALUES: readonly ProjectPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export const PROJECT_ROLE_VALUES: readonly ProjectRole[] = [
  'PROJECT_MANAGER',
  'TEAM_LEADER',
  'MEMBER',
  'OBSERVER',
] as const;

export const MILESTONE_STATUS_VALUES: readonly MilestoneStatus[] = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'OVERDUE',
  'CANCELLED',
] as const;

export const PROJECT_SORT_PROPERTIES = [
  'createdAt',
  'name',
  'code',
  'startDate',
  'plannedEndDate',
  'priority',
  'status',
] as const;

export type ProjectSortProperty = (typeof PROJECT_SORT_PROPERTIES)[number];
export type ProjectSortDirection = 'asc' | 'desc';

// ==========================================
// 2. Query and Request Interfaces
// ==========================================

export interface ProjectListQuery {
  page?: number;
  size?: number;
  sort?: string; // e.g. "createdAt,desc"
  search?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  managerId?: string; // UUID
  departmentId?: string; // UUID
}

export interface CreateProjectRequest {
  code: string;
  name: string;
  description?: string | null;
  priority?: ProjectPriority;
  startDate?: string | null; // YYYY-MM-DD
  plannedEndDate?: string | null; // YYYY-MM-DD
  departmentId?: string | null; // UUID
  initialMemberIds?: string[] | null; // UUID[]
}

export interface UpdateProjectRequest {
  name: string;
  description?: string | null;
  priority?: ProjectPriority;
  startDate?: string | null; // YYYY-MM-DD
  plannedEndDate?: string | null; // YYYY-MM-DD
  version: number;
}

export interface ChangeProjectStatusRequest {
  status: ProjectStatus;
  reason?: string | null;
  version: number;
}

export interface AddProjectMemberRequest {
  userId: string; // UUID
  projectRole: ProjectRole;
}

export interface UpdateProjectMemberRoleRequest {
  projectRole: ProjectRole;
}

export interface CreateMilestoneRequest {
  name: string;
  description?: string | null;
  dueDate: string; // YYYY-MM-DD
}

// ==========================================
// 3. Response DTO Interfaces
// ==========================================

export interface ProjectManagerSummary {
  id: string; // UUID
  fullName: string;
  avatarUrl: string | null;
}

export interface ProjectTaskSummary {
  total: number;
  completed: number;
  overdue: number;
}

export interface ProjectDepartmentDetail {
  id: string; // UUID
  code: string;
  name: string;
}

export interface ProjectSummary {
  id: string; // UUID
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  manager: ProjectManagerSummary;
  startDate: string; // YYYY-MM-DD
  plannedEndDate: string; // YYYY-MM-DD
  progressPercent: number;
  memberCount: number;
  taskSummary: ProjectTaskSummary;
  createdAt: string; // ISO-8601 Instant
  updatedAt: string; // ISO-8601 Instant
}

export interface MilestoneItem {
  id: string; // UUID
  projectId: string; // UUID
  name: string;
  description: string | null;
  dueDate: string; // YYYY-MM-DD
  completedAt: string | null; // ISO-8601 Instant
  status: MilestoneStatus;
  createdBy: string; // UUID
  createdAt: string; // ISO-8601 Instant
  version: number;
}

export interface ProjectDetail {
  id: string; // UUID
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  manager: ProjectManagerSummary;
  department: ProjectDepartmentDetail | null;
  startDate: string; // YYYY-MM-DD
  plannedEndDate: string; // YYYY-MM-DD
  actualEndDate: string | null; // YYYY-MM-DD
  progressPercent: number;
  memberCount: number;
  milestones: MilestoneItem[];
  recentTasks: unknown[];
  allowedActions: string[];
  createdAt: string; // ISO-8601 Instant
  updatedAt: string; // ISO-8601 Instant
  version: number;
}

export interface ProjectMember {
  id: string; // UUID
  projectId: string; // UUID
  userId: string; // UUID
  fullName: string;
  email: string;
  avatarUrl: string | null;
  projectRole: ProjectRole;
  joinedAt: string; // ISO-8601 Instant
  leftAt: string | null; // ISO-8601 Instant
  active: boolean;
}

// ==========================================
// 4. Runtime Type Guards
// ==========================================

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === 'string' && (PROJECT_STATUS_VALUES as readonly string[]).includes(value);
}

export function isProjectPriority(value: unknown): value is ProjectPriority {
  return typeof value === 'string' && (PROJECT_PRIORITY_VALUES as readonly string[]).includes(value);
}

export function isProjectRole(value: unknown): value is ProjectRole {
  return typeof value === 'string' && (PROJECT_ROLE_VALUES as readonly string[]).includes(value);
}

export function isMilestoneStatus(value: unknown): value is MilestoneStatus {
  return typeof value === 'string' && (MILESTONE_STATUS_VALUES as readonly string[]).includes(value);
}

export function isProjectManagerSummary(data: unknown): data is ProjectManagerSummary {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.fullName === 'string' &&
    (obj.avatarUrl === null || typeof obj.avatarUrl === 'string')
  );
}

export function isProjectTaskSummary(data: unknown): data is ProjectTaskSummary {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.total === 'number' &&
    typeof obj.completed === 'number' &&
    typeof obj.overdue === 'number'
  );
}

export function isProjectDepartmentDetail(data: unknown): data is ProjectDepartmentDetail {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.name === 'string'
  );
}

export function isMilestoneItem(data: unknown): data is MilestoneItem {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.projectId === 'string' &&
    typeof obj.name === 'string' &&
    (obj.description === null || typeof obj.description === 'string') &&
    typeof obj.dueDate === 'string' &&
    (obj.completedAt === null || typeof obj.completedAt === 'string') &&
    isMilestoneStatus(obj.status) &&
    typeof obj.createdBy === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.version === 'number'
  );
}

export function isProjectSummary(data: unknown): data is ProjectSummary {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.name === 'string' &&
    (obj.description === null || typeof obj.description === 'string') &&
    isProjectStatus(obj.status) &&
    isProjectPriority(obj.priority) &&
    isProjectManagerSummary(obj.manager) &&
    typeof obj.startDate === 'string' &&
    typeof obj.plannedEndDate === 'string' &&
    typeof obj.progressPercent === 'number' &&
    typeof obj.memberCount === 'number' &&
    isProjectTaskSummary(obj.taskSummary) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}

export function isProjectDetail(data: unknown): data is ProjectDetail {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.name === 'string' &&
    (obj.description === null || typeof obj.description === 'string') &&
    isProjectStatus(obj.status) &&
    isProjectPriority(obj.priority) &&
    isProjectManagerSummary(obj.manager) &&
    (obj.department === null || isProjectDepartmentDetail(obj.department)) &&
    typeof obj.startDate === 'string' &&
    typeof obj.plannedEndDate === 'string' &&
    (obj.actualEndDate === null || typeof obj.actualEndDate === 'string') &&
    typeof obj.progressPercent === 'number' &&
    typeof obj.memberCount === 'number' &&
    Array.isArray(obj.milestones) &&
    obj.milestones.every(isMilestoneItem) &&
    Array.isArray(obj.recentTasks) &&
    Array.isArray(obj.allowedActions) &&
    obj.allowedActions.every(action => typeof action === 'string') &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string' &&
    typeof obj.version === 'number'
  );
}

export function isProjectMember(data: unknown): data is ProjectMember {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.projectId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.fullName === 'string' &&
    typeof obj.email === 'string' &&
    (obj.avatarUrl === null || typeof obj.avatarUrl === 'string') &&
    isProjectRole(obj.projectRole) &&
    typeof obj.joinedAt === 'string' &&
    (obj.leftAt === null || typeof obj.leftAt === 'string') &&
    typeof obj.active === 'boolean'
  );
}
