/**
 * Task Date Utilities for WorkSphere Mobile
 *
 * Implements deterministic, timezone-independent calendar date parsing, validation,
 * and serialization between date-only mobile UI input (YYYY-MM-DD) and backend
 * ISO-8601 Instant format (Vietnam UTC+7 end-of-day: YYYY-MM-DDT17:00:00Z per Decision D-064).
 *
 * Grounded in:
 * - Decision D-064: Phase 15 Task Due-Date Semantics
 * - 06_API_CONTRACT.md section 10.3, 12.2, 12.4, 17 (Instant dueDate serialization at 17:00:00Z)
 * - Task.java date range validation (startDate.isAfter(dueDate.atZone(ZoneOffset.UTC).toLocalDate()))
 * - Zero third-party date dependencies (dependency-free, pure algorithms)
 * - No Date object rollover bugs (e.g. 2026-02-30 -> March 2)
 */

export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_INSTANT_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Pure leap year algorithm:
 * Leap years are divisible by 4, except end-of-century years unless divisible by 400.
 */
export function isLeapYear(year: number): boolean {
  if (year % 4 !== 0) return false;
  if (year % 100 !== 0) return true;
  return year % 400 === 0;
}

/**
 * Returns the maximum days in a given month of a given year.
 */
export function getDaysInMonth(year: number, month: number): number {
  switch (month) {
    case 1: // January
    case 3: // March
    case 5: // May
    case 7: // July
    case 8: // August
    case 10: // October
    case 12: // December
      return 31;
    case 4: // April
    case 6: // June
    case 9: // September
    case 11: // November
      return 30;
    case 2: // February
      return isLeapYear(year) ? 29 : 28;
    default:
      return 0;
  }
}

/**
 * Validates that a string is a strictly valid calendar date formatted as YYYY-MM-DD.
 * Rejects invalid calendar dates without silent rollover (e.g. 2026-02-30, 2026-04-31).
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  if (!DATE_ONLY_REGEX.test(trimmed)) return false;

  const [yStr, mStr, dStr] = trimmed.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const maxDays = getDaysInMonth(year, month);
  return day >= 1 && day <= maxDays;
}

/**
 * Parses a backend dueDate (Instant ISO-8601 string or date string) into
 * a human-editable date-only string YYYY-MM-DD for text input fields.
 * Returns empty string for empty/null input.
 */
export function parseTaskDueDateForInput(dueDate?: string | null): string {
  if (!dueDate || typeof dueDate !== 'string') return '';
  const trimmed = dueDate.trim();
  if (!trimmed) return '';

  if (trimmed.includes('T')) {
    const datePart = trimmed.split('T')[0];
    return isValidCalendarDate(datePart) ? datePart : '';
  }

  return isValidCalendarDate(trimmed) ? trimmed : '';
}

/**
 * Serializes a user-input due date into a deterministic ISO-8601 Instant string.
 *
 * Grounded in Decision D-064: Phase 15 Task Due-Date Semantics
 * - Empty/whitespace -> undefined (omitted from DTO or undefined)
 * - Already valid ISO Instant -> preserved
 * - Valid YYYY-MM-DD date -> serialized to Vietnam (UTC+7) end-of-day deadline: `${YYYY-MM-DD}T17:00:00Z`
 * - Invalid format / impossible calendar date -> throws Error
 */
export function serializeTaskDueDate(dueDateInput?: string | null): string | undefined {
  if (!dueDateInput || typeof dueDateInput !== 'string') return undefined;
  const trimmed = dueDateInput.trim();
  if (!trimmed) return undefined;

  // If already full ISO Instant format
  if (ISO_INSTANT_REGEX.test(trimmed)) {
    const datePart = trimmed.split('T')[0];
    if (!isValidCalendarDate(datePart)) {
      throw new Error(`Ngày hạn chót không hợp lệ: ${trimmed}`);
    }
    return trimmed;
  }

  // If date-only format
  if (!isValidCalendarDate(trimmed)) {
    throw new Error(`Định dạng ngày hạn chót phải là YYYY-MM-DD hợp lệ: ${trimmed}`);
  }

  // Decision D-064: End-of-day deadline in Vietnam business calendar (next calendar day 00:00:00 +07:00 -> 17:00:00Z)
  return `${trimmed}T17:00:00Z`;
}

/**
 * Validates a date-only text input.
 * Returns an error message string if invalid, or null if valid / empty.
 */
export function validateTaskDateInput(
  dateStr: string,
  fieldLabel: string
): string | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null; // Optional fields are valid when empty

  if (!DATE_ONLY_REGEX.test(trimmed)) {
    return `${fieldLabel} phải có định dạng YYYY-MM-DD (Ví dụ: 2026-10-31)`;
  }

  if (!isValidCalendarDate(trimmed)) {
    return `${fieldLabel} không phải là ngày hợp lệ trong lịch`;
  }

  return null;
}

/**
 * Validates that startDate is not after dueDate.
 * Both inputs can be YYYY-MM-DD or ISO strings.
 * Returns error message string if invalid range, or null if valid.
 */
export function validateTaskDateRange(
  startDateStr?: string | null,
  dueDateStr?: string | null
): string | null {
  if (!startDateStr || !dueDateStr) return null;

  const start = startDateStr.trim().split('T')[0];
  const due = dueDateStr.trim().split('T')[0];

  if (!isValidCalendarDate(start) || !isValidCalendarDate(due)) {
    return null; // Individual field validation handles malformed strings
  }

  if (start > due) {
    return 'Hạn hoàn thành không được trước ngày bắt đầu';
  }

  return null;
}
