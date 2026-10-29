/**
 * Phase 14E: Project Status Transition Domain Logic
 * Aligned with backend Project.java and 02_USER_ROLES_AND_WORKFLOWS.md section 4.2.
 *
 * State Machine:
 * - DRAFT -> ACTIVE, CANCELLED
 * - ACTIVE -> ON_HOLD, COMPLETED, CANCELLED
 * - ON_HOLD -> ACTIVE, CANCELLED
 * - COMPLETED -> (terminal, cannot transition)
 * - CANCELLED -> (terminal, cannot transition)
 */

import { ProjectStatus } from '../api/projectTypes';

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang chạy',
  ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const ALLOWED_TRANSITIONS: Record<ProjectStatus, readonly ProjectStatus[]> = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['ACTIVE', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function getAllowedTargetStatuses(currentStatus: ProjectStatus): ProjectStatus[] {
  return [...(ALLOWED_TRANSITIONS[currentStatus] ?? [])];
}

export function canTransitionStatus(
  currentStatus: ProjectStatus,
  targetStatus: ProjectStatus
): boolean {
  if (currentStatus === targetStatus) {
    return false;
  }
  const targets = ALLOWED_TRANSITIONS[currentStatus];
  if (!targets) {
    return false;
  }
  return targets.includes(targetStatus);
}

export function isTerminalStatus(status: ProjectStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

export function getStatusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status] ?? status;
}
