/**
 * Phase 14A: Mobile Dashboard API Adapter
 * Connects mobile Dashboard feature to backend GET /api/v1/dashboard/me.
 * Adheres strictly to:
 * - Transport-only boundary (no hook state, no navigation side effects)
 * - Automatic envelope unwrapping via shared http client
 * - Runtime type guard validation
 */

import { http } from '../../../shared/api';
import { isPersonalDashboardResponse, PersonalDashboardData } from './dashboardTypes';

export const dashboardApi = {
  /**
   * Retrieves personal dashboard statistics and summary items for authenticated user.
   * GET /dashboard/me
   */
  async getMyDashboard(): Promise<PersonalDashboardData> {
    const data = await http.get<PersonalDashboardData>('/dashboard/me');

    if (!isPersonalDashboardResponse(data)) {
      throw new Error('Dữ liệu bảng điều khiển máy chủ trả về không hợp lệ');
    }

    return data;
  },
};
