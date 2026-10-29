import { dashboardApi } from '../../src/features/dashboard/api/dashboardApi';
import { PersonalDashboardData } from '../../src/features/dashboard/api/dashboardTypes';
import { http } from '../../src/shared/api';

jest.mock('../../src/shared/api', () => ({
  http: {
    get: jest.fn(),
  },
}));

describe('Dashboard API Adapter (dashboardApi)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validDashboard: PersonalDashboardData = {
    tasks: {
      todo: 4,
      inProgress: 2,
      inReview: 1,
      completed: 12,
      overdue: 1,
      dueSoon: 3,
    },
    serviceRequests: {
      open: 1,
      inProgress: 2,
      waitingForUser: 0,
      resolved: 5,
    },
    projects: {
      active: 4,
      onHold: 0,
    },
    upcomingTasks: [
      {
        id: 'task-uuid-1',
        projectId: 'project-uuid-1',
        projectName: 'Alpha Portal',
        title: 'Review PR #42',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: '2026-10-21T10:00:00Z',
      },
    ],
    recentNotifications: [
      {
        id: 'notif-uuid-1',
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'System Maintenance',
        message: 'Server upgrade tonight at 23:00',
        referenceType: 'SYSTEM',
        referenceId: 'system-1',
        read: true,
        createdAt: '2026-10-19T06:00:00Z',
      },
    ],
  };

  it('calls GET /dashboard/me and returns valid personal dashboard data', async () => {
    (http.get as jest.Mock).mockResolvedValueOnce(validDashboard);

    const result = await dashboardApi.getMyDashboard();

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/dashboard/me');
    expect(result).toEqual(validDashboard);
    expect(result.tasks.todo).toBe(4);
    expect(result.projects.active).toBe(4);
    expect(result.upcomingTasks).toHaveLength(1);
  });

  it('throws descriptive error when response fails runtime type guard validation', async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({
      tasks: { todo: 'not-a-number' },
    });

    await expect(dashboardApi.getMyDashboard()).rejects.toThrow(
      'Dữ liệu bảng điều khiển máy chủ trả về không hợp lệ'
    );
  });

  it('propagates transport rejection when http.get rejects', async () => {
    const networkError = new Error('Network Connection Failure');
    (http.get as jest.Mock).mockRejectedValueOnce(networkError);

    await expect(dashboardApi.getMyDashboard()).rejects.toThrow('Network Connection Failure');
  });
});
