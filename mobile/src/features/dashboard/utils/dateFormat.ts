/**
 * Safe Date Formatter for WorkSphere Mobile
 * Parses ISO-8601 strings and formats into localized Vietnamese display text.
 * Gracefully handles invalid dates without crashing.
 */

export function formatDateTime(isoString?: string | null): string {
  if (!isoString || typeof isoString !== 'string') {
    return 'Chưa xác định';
  }

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return 'Chưa xác định';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return 'Chưa xác định';
  }
}

export function formatDate(isoString?: string | null): string {
  if (!isoString || typeof isoString !== 'string') {
    return 'Chưa xác định';
  }

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return 'Chưa xác định';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return 'Chưa xác định';
  }
}
