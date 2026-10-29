/**
 * Phase 15D Hardening: Task Date Utility Tests
 * Verifies:
 * - Leap year calculations
 * - Strict calendar date validation without Date rollover
 * - Date parsing from ISO string for human input
 * - Date serialization to ISO-8601 Instant with Vietnam UTC+7 end-of-day deadline (YYYY-MM-DDT17:00:00Z per Decision D-064)
 * - Round-trip idempotency
 * - Optional empty handling
 * - Date range validation parity with Task.java
 */

import {
  isLeapYear,
  getDaysInMonth,
  isValidCalendarDate,
  parseTaskDueDateForInput,
  serializeTaskDueDate,
  validateTaskDateInput,
  validateTaskDateRange,
} from '../../src/features/tasks/utils/taskDate';

describe('taskDate utilities (Phase 15D Hardening)', () => {
  describe('isLeapYear & getDaysInMonth', () => {
    it('correctly identifies leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
    });

    it('returns correct days in month including February', () => {
      expect(getDaysInMonth(2026, 1)).toBe(31);
      expect(getDaysInMonth(2026, 2)).toBe(28); // non-leap
      expect(getDaysInMonth(2024, 2)).toBe(29); // leap
      expect(getDaysInMonth(2026, 4)).toBe(30);
      expect(getDaysInMonth(2026, 12)).toBe(31);
    });
  });

  describe('isValidCalendarDate', () => {
    it('accepts valid calendar dates', () => {
      expect(isValidCalendarDate('2026-10-31')).toBe(true);
      expect(isValidCalendarDate('2026-01-01')).toBe(true);
      expect(isValidCalendarDate('2024-02-29')).toBe(true); // valid leap day
    });

    it('rejects impossible dates without Date rollover', () => {
      expect(isValidCalendarDate('2026-02-29')).toBe(false); // 2026 is non-leap
      expect(isValidCalendarDate('2026-02-30')).toBe(false);
      expect(isValidCalendarDate('2026-04-31')).toBe(false); // April has 30 days
      expect(isValidCalendarDate('2026-06-31')).toBe(false);
      expect(isValidCalendarDate('2026-09-31')).toBe(false);
      expect(isValidCalendarDate('2026-11-31')).toBe(false);
    });

    it('rejects invalid months and days', () => {
      expect(isValidCalendarDate('2026-00-15')).toBe(false);
      expect(isValidCalendarDate('2026-13-01')).toBe(false);
      expect(isValidCalendarDate('2026-10-00')).toBe(false);
      expect(isValidCalendarDate('2026-10-32')).toBe(false);
    });

    it('rejects non-conforming formats', () => {
      expect(isValidCalendarDate('2026/10/31')).toBe(false);
      expect(isValidCalendarDate('31-10-2026')).toBe(false);
      expect(isValidCalendarDate('2026-1-1')).toBe(false);
      expect(isValidCalendarDate('')).toBe(false);
      expect(isValidCalendarDate('invalid')).toBe(false);
    });
  });

  describe('parseTaskDueDateForInput', () => {
    it('extracts date part from full ISO Instant string', () => {
      expect(parseTaskDueDateForInput('2026-10-25T17:00:00Z')).toBe('2026-10-25');
      expect(parseTaskDueDateForInput('2026-10-25T23:59:59Z')).toBe('2026-10-25');
      expect(parseTaskDueDateForInput('2026-10-25T00:00:00.000Z')).toBe('2026-10-25');
    });

    it('passes through valid date-only string', () => {
      expect(parseTaskDueDateForInput('2026-10-25')).toBe('2026-10-25');
    });

    it('handles empty and null values safely', () => {
      expect(parseTaskDueDateForInput('')).toBe('');
      expect(parseTaskDueDateForInput(null)).toBe('');
      expect(parseTaskDueDateForInput(undefined)).toBe('');
      expect(parseTaskDueDateForInput('invalid-date')).toBe('');
    });
  });

  describe('serializeTaskDueDate', () => {
    it('serializes valid YYYY-MM-DD to Vietnam UTC+7 end-of-day ISO Instant (D-064)', () => {
      expect(serializeTaskDueDate('2026-10-31')).toBe('2026-10-31T17:00:00Z');
      expect(serializeTaskDueDate('2026-01-01')).toBe('2026-01-01T17:00:00Z');
    });

    it('preserves already valid ISO Instant strings', () => {
      expect(serializeTaskDueDate('2026-10-25T17:00:00Z')).toBe('2026-10-25T17:00:00Z');
      expect(serializeTaskDueDate('2026-10-31T14:00:00Z')).toBe('2026-10-31T14:00:00Z');
    });

    it('returns undefined for empty/whitespace input', () => {
      expect(serializeTaskDueDate('')).toBeUndefined();
      expect(serializeTaskDueDate('   ')).toBeUndefined();
      expect(serializeTaskDueDate(null)).toBeUndefined();
      expect(serializeTaskDueDate(undefined)).toBeUndefined();
    });

    it('throws on impossible calendar dates', () => {
      expect(() => serializeTaskDueDate('2026-02-30')).toThrow(
        /Định dạng ngày hạn chót phải là YYYY-MM-DD hợp lệ/
      );
      expect(() => serializeTaskDueDate('2026-04-31')).toThrow(
        /Định dạng ngày hạn chót phải là YYYY-MM-DD hợp lệ/
      );
    });

    it('preserves round-trip idempotency under D-064', () => {
      const originalIso = '2026-10-25T17:00:00Z';
      const inputVal = parseTaskDueDateForInput(originalIso);
      expect(inputVal).toBe('2026-10-25');
      const reSerialized = serializeTaskDueDate(inputVal);
      expect(reSerialized).toBe(originalIso);
    });
  });

  describe('validateTaskDateInput & validateTaskDateRange', () => {
    it('validates single date field correctly', () => {
      expect(validateTaskDateInput('2026-10-31', 'Ngày bắt đầu')).toBeNull();
      expect(validateTaskDateInput('', 'Ngày bắt đầu')).toBeNull(); // optional
      expect(validateTaskDateInput('2026-02-30', 'Hạn hoàn thành')).toBe(
        'Hạn hoàn thành không phải là ngày hợp lệ trong lịch'
      );
      expect(validateTaskDateInput('31/10/2026', 'Hạn hoàn thành')).toBe(
        'Hạn hoàn thành phải có định dạng YYYY-MM-DD (Ví dụ: 2026-10-31)'
      );
    });

    it('validates date range correctly', () => {
      expect(validateTaskDateRange('2026-10-01', '2026-10-31')).toBeNull();
      expect(validateTaskDateRange('2026-10-15', '2026-10-15')).toBeNull(); // same day allowed
      expect(validateTaskDateRange('2026-10-20', '2026-10-10')).toBe(
        'Hạn hoàn thành không được trước ngày bắt đầu'
      );
      expect(validateTaskDateRange('2026-10-20T00:00:00Z', '2026-10-10T17:00:00Z')).toBe(
        'Hạn hoàn thành không được trước ngày bắt đầu'
      );
    });
  });
});
