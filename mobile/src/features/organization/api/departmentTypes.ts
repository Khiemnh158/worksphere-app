/**
 * Phase 14E: Organization & Department Types
 * Aligned with backend DepartmentResponse.java and GET /departments
 */

export interface DepartmentItem {
  id: string; // UUID
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  managerId?: string | null;
  parentId?: string | null;
}

export function isDepartmentItem(data: unknown): data is DepartmentItem {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.active === 'boolean'
  );
}

export function isDepartmentList(data: unknown): data is DepartmentItem[] {
  return Array.isArray(data) && data.every(isDepartmentItem);
}
