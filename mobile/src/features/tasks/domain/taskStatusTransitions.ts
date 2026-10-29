/**
 * Phase 15E: Task Status Transition Domain Logic
 * Aligned with backend Task.java, TaskApplicationService.java, and 06_API_CONTRACT.md section 12.5.
 *
 * State Machine Matrix:
 * - TODO -> IN_PROGRESS, CANCELLED
 * - IN_PROGRESS -> IN_REVIEW, CANCELLED
 * - IN_REVIEW -> COMPLETED, IN_PROGRESS (mandatory comment required for rejection)
 * - COMPLETED -> (terminal, cannot transition)
 * - CANCELLED -> (terminal, cannot transition)
 */

import { TaskStatus } from '../api/taskTypes';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  IN_REVIEW: 'Đang kiểm tra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const ALLOWED_TASK_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  TODO: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Returns allowed target statuses from the given current status.
 */
export function getValidTaskStatusTransitions(currentStatus: TaskStatus): TaskStatus[] {
  return [...(ALLOWED_TASK_TRANSITIONS[currentStatus] ?? [])];
}

/**
 * Checks whether transitioning from currentStatus to targetStatus is permitted by the domain machine.
 */
export function canTransitionTaskStatus(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus
): boolean {
  if (currentStatus === targetStatus) {
    return false;
  }
  const targets = ALLOWED_TASK_TRANSITIONS[currentStatus];
  if (!targets) {
    return false;
  }
  return targets.includes(targetStatus);
}

/**
 * Determines whether a status is a terminal state (COMPLETED or CANCELLED).
 */
export function isTaskTerminalStatus(status: TaskStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/**
 * Human-readable Vietnamese label for task status.
 */
export function getTaskStatusLabel(status: TaskStatus): string {
  return TASK_STATUS_LABELS[status] ?? status;
}

/**
 * Invariant from TaskApplicationService.java:
 * Transition from IN_REVIEW back to IN_PROGRESS represents a QA/Review rejection
 * and strictly requires an explanatory comment.
 */
export function isCommentRequiredForTransition(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus
): boolean {
  return currentStatus === 'IN_REVIEW' && targetStatus === 'IN_PROGRESS';
}
