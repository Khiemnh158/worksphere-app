/**
 * Phase 14E: Organization & Department API Adapter
 * Calls GET /departments to retrieve active departments.
 */

import { http } from '../../../shared/api';
import { DepartmentItem, isDepartmentList } from './departmentTypes';

export const departmentApi = {
  /**
   * GET /departments
   * Returns list of active departments.
   */
  async getDepartments(): Promise<DepartmentItem[]> {
    const data = await http.get<DepartmentItem[]>('/departments');

    if (!isDepartmentList(data)) {
      throw new Error('Dữ liệu phòng ban trả về không hợp lệ');
    }

    return data;
  },
};
