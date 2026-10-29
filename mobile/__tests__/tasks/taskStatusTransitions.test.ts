/**
 * Phase 15E: Task Status Transition Domain Machine Tests
 * Verifies:
 * - State machine matrix for all canonical statuses: TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, CANCELLED
 * - Terminal states return empty transitions
 * - Invalid transition detection
 * - Mandatory rejection comment rule (IN_REVIEW -> IN_PROGRESS)
 * - Human-readable status labels
 */

import {
  canTransitionTaskStatus,
  getTaskStatusLabel,
  getValidTaskStatusTransitions,
  isCommentRequiredForTransition,
  isTaskTerminalStatus,
} from '../../src/features/tasks/domain/taskStatusTransitions';

describe('taskStatusTransitions domain machine (Phase 15E)', () => {
  describe('getValidTaskStatusTransitions', () => {
    it('returns IN_PROGRESS and CANCELLED for TODO', () => {
      expect(getValidTaskStatusTransitions('TODO')).toEqual(['IN_PROGRESS', 'CANCELLED']);
    });

    it('returns IN_REVIEW and CANCELLED for IN_PROGRESS', () => {
      expect(getValidTaskStatusTransitions('IN_PROGRESS')).toEqual(['IN_REVIEW', 'CANCELLED']);
    });

    it('returns COMPLETED and IN_PROGRESS for IN_REVIEW', () => {
      expect(getValidTaskStatusTransitions('IN_REVIEW')).toEqual(['COMPLETED', 'IN_PROGRESS']);
    });

    it('returns empty array for COMPLETED (terminal)', () => {
      expect(getValidTaskStatusTransitions('COMPLETED')).toEqual([]);
    });

    it('returns empty array for CANCELLED (terminal)', () => {
      expect(getValidTaskStatusTransitions('CANCELLED')).toEqual([]);
    });
  });

  describe('canTransitionTaskStatus', () => {
    it('validates allowed transitions', () => {
      expect(canTransitionTaskStatus('TODO', 'IN_PROGRESS')).toBe(true);
      expect(canTransitionTaskStatus('TODO', 'CANCELLED')).toBe(true);
      expect(canTransitionTaskStatus('IN_PROGRESS', 'IN_REVIEW')).toBe(true);
      expect(canTransitionTaskStatus('IN_PROGRESS', 'CANCELLED')).toBe(true);
      expect(canTransitionTaskStatus('IN_REVIEW', 'COMPLETED')).toBe(true);
      expect(canTransitionTaskStatus('IN_REVIEW', 'IN_PROGRESS')).toBe(true);
    });

    it('rejects identity transitions (same status)', () => {
      expect(canTransitionTaskStatus('TODO', 'TODO')).toBe(false);
      expect(canTransitionTaskStatus('IN_PROGRESS', 'IN_PROGRESS')).toBe(false);
      expect(canTransitionTaskStatus('IN_REVIEW', 'IN_REVIEW')).toBe(false);
      expect(canTransitionTaskStatus('COMPLETED', 'COMPLETED')).toBe(false);
      expect(canTransitionTaskStatus('CANCELLED', 'CANCELLED')).toBe(false);
    });

    it('rejects disallowed transitions', () => {
      expect(canTransitionTaskStatus('TODO', 'COMPLETED')).toBe(false);
      expect(canTransitionTaskStatus('TODO', 'IN_REVIEW')).toBe(false);
      expect(canTransitionTaskStatus('IN_PROGRESS', 'TODO')).toBe(false);
      expect(canTransitionTaskStatus('IN_PROGRESS', 'COMPLETED')).toBe(false);
      expect(canTransitionTaskStatus('IN_REVIEW', 'TODO')).toBe(false);
      expect(canTransitionTaskStatus('IN_REVIEW', 'CANCELLED')).toBe(false);
      expect(canTransitionTaskStatus('COMPLETED', 'IN_PROGRESS')).toBe(false);
      expect(canTransitionTaskStatus('COMPLETED', 'TODO')).toBe(false);
      expect(canTransitionTaskStatus('CANCELLED', 'TODO')).toBe(false);
      expect(canTransitionTaskStatus('CANCELLED', 'IN_PROGRESS')).toBe(false);
    });
  });

  describe('isTaskTerminalStatus', () => {
    it('identifies terminal statuses', () => {
      expect(isTaskTerminalStatus('COMPLETED')).toBe(true);
      expect(isTaskTerminalStatus('CANCELLED')).toBe(true);
    });

    it('identifies non-terminal statuses', () => {
      expect(isTaskTerminalStatus('TODO')).toBe(false);
      expect(isTaskTerminalStatus('IN_PROGRESS')).toBe(false);
      expect(isTaskTerminalStatus('IN_REVIEW')).toBe(false);
    });
  });

  describe('isCommentRequiredForTransition', () => {
    it('requires comment when rejecting from IN_REVIEW to IN_PROGRESS', () => {
      expect(isCommentRequiredForTransition('IN_REVIEW', 'IN_PROGRESS')).toBe(true);
    });

    it('does not require comment for other transitions', () => {
      expect(isCommentRequiredForTransition('TODO', 'IN_PROGRESS')).toBe(false);
      expect(isCommentRequiredForTransition('TODO', 'CANCELLED')).toBe(false);
      expect(isCommentRequiredForTransition('IN_PROGRESS', 'IN_REVIEW')).toBe(false);
      expect(isCommentRequiredForTransition('IN_PROGRESS', 'CANCELLED')).toBe(false);
      expect(isCommentRequiredForTransition('IN_REVIEW', 'COMPLETED')).toBe(false);
    });
  });

  describe('getTaskStatusLabel', () => {
    it('returns Vietnamese labels for all statuses', () => {
      expect(getTaskStatusLabel('TODO')).toBe('Cần làm');
      expect(getTaskStatusLabel('IN_PROGRESS')).toBe('Đang làm');
      expect(getTaskStatusLabel('IN_REVIEW')).toBe('Đang kiểm tra');
      expect(getTaskStatusLabel('COMPLETED')).toBe('Hoàn thành');
      expect(getTaskStatusLabel('CANCELLED')).toBe('Đã hủy');
    });
  });
});
