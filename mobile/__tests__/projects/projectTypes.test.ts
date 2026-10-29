import {
  isMilestoneItem,
  isMilestoneStatus,
  isProjectDepartmentDetail,
  isProjectDetail,
  isProjectManagerSummary,
  isProjectMember,
  isProjectPriority,
  isProjectRole,
  isProjectStatus,
  isProjectSummary,
  isProjectTaskSummary,
  MilestoneItem,
  ProjectDetail,
  ProjectMember,
  ProjectSummary,
} from '../../src/features/projects/api/projectTypes';

describe('Project Types & Runtime Type Guards', () => {
  describe('Enum Guards', () => {
    it('validates ProjectStatus correctly', () => {
      expect(isProjectStatus('DRAFT')).toBe(true);
      expect(isProjectStatus('ACTIVE')).toBe(true);
      expect(isProjectStatus('ON_HOLD')).toBe(true);
      expect(isProjectStatus('COMPLETED')).toBe(true);
      expect(isProjectStatus('CANCELLED')).toBe(true);

      expect(isProjectStatus('ARCHIVED')).toBe(false);
      expect(isProjectStatus('draft')).toBe(false);
      expect(isProjectStatus(null)).toBe(false);
      expect(isProjectStatus(123)).toBe(false);
    });

    it('validates ProjectPriority correctly', () => {
      expect(isProjectPriority('LOW')).toBe(true);
      expect(isProjectPriority('MEDIUM')).toBe(true);
      expect(isProjectPriority('HIGH')).toBe(true);
      expect(isProjectPriority('CRITICAL')).toBe(true);

      expect(isProjectPriority('URGENT')).toBe(false);
      expect(isProjectPriority(undefined)).toBe(false);
    });

    it('validates ProjectRole correctly', () => {
      expect(isProjectRole('PROJECT_MANAGER')).toBe(true);
      expect(isProjectRole('TEAM_LEADER')).toBe(true);
      expect(isProjectRole('MEMBER')).toBe(true);
      expect(isProjectRole('OBSERVER')).toBe(true);

      expect(isProjectRole('ADMIN')).toBe(false);
      expect(isProjectRole('DEVELOPER')).toBe(false);
    });

    it('validates MilestoneStatus correctly', () => {
      expect(isMilestoneStatus('PLANNED')).toBe(true);
      expect(isMilestoneStatus('IN_PROGRESS')).toBe(true);
      expect(isMilestoneStatus('COMPLETED')).toBe(true);
      expect(isMilestoneStatus('OVERDUE')).toBe(true);
      expect(isMilestoneStatus('CANCELLED')).toBe(true);

      expect(isMilestoneStatus('PENDING')).toBe(false);
      expect(isMilestoneStatus(null)).toBe(false);
    });
  });

  describe('Structural DTO Guards', () => {
    const validManager = {
      id: 'manager-uuid-1',
      fullName: 'Alice Smith',
      avatarUrl: 'https://example.com/alice.png',
    };

    const validTaskSummary = {
      total: 10,
      completed: 6,
      overdue: 1,
    };

    const validDepartment = {
      id: 'dept-uuid-1',
      code: 'ENG',
      name: 'Engineering',
    };

    const validMilestone: MilestoneItem = {
      id: 'milestone-uuid-1',
      projectId: 'project-uuid-1',
      name: 'Architecture Signoff',
      description: 'Review and approve technical specs',
      dueDate: '2026-11-01',
      completedAt: null,
      status: 'IN_PROGRESS',
      createdBy: 'manager-uuid-1',
      createdAt: '2026-10-15T09:00:00Z',
      version: 0,
    };

    const validProjectSummary: ProjectSummary = {
      id: 'project-uuid-1',
      code: 'WS-2026-001',
      name: 'WorkSphere Mobile App',
      description: 'Enterprise workflow management app',
      status: 'ACTIVE',
      priority: 'HIGH',
      manager: validManager,
      startDate: '2026-10-01',
      plannedEndDate: '2026-12-31',
      progressPercent: 45.5,
      memberCount: 8,
      taskSummary: validTaskSummary,
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-18T14:30:00Z',
    };

    const validProjectDetail: ProjectDetail = {
      id: 'project-uuid-1',
      code: 'WS-2026-001',
      name: 'WorkSphere Mobile App',
      description: 'Enterprise workflow management app',
      status: 'ACTIVE',
      priority: 'HIGH',
      manager: validManager,
      department: validDepartment,
      startDate: '2026-10-01',
      plannedEndDate: '2026-12-31',
      actualEndDate: null,
      progressPercent: 45.5,
      memberCount: 8,
      milestones: [validMilestone],
      recentTasks: [],
      allowedActions: ['UPDATE', 'MANAGE_MEMBERS', 'CHANGE_STATUS', 'CREATE_TASK', 'CREATE_MILESTONE'],
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-18T14:30:00Z',
      version: 3,
    };

    const validMember: ProjectMember = {
      id: 'member-uuid-1',
      projectId: 'project-uuid-1',
      userId: 'user-uuid-2',
      fullName: 'Bob Johnson',
      email: 'bob.johnson@worksphere.local',
      avatarUrl: null,
      projectRole: 'MEMBER',
      joinedAt: '2026-10-02T10:00:00Z',
      leftAt: null,
      active: true,
    };

    it('validates ProjectManagerSummary', () => {
      expect(isProjectManagerSummary(validManager)).toBe(true);
      expect(isProjectManagerSummary({ ...validManager, avatarUrl: null })).toBe(true);
      expect(isProjectManagerSummary(null)).toBe(false);
      expect(isProjectManagerSummary({ id: '123' })).toBe(false);
    });

    it('validates ProjectTaskSummary', () => {
      expect(isProjectTaskSummary(validTaskSummary)).toBe(true);
      expect(isProjectTaskSummary({ total: 10, completed: '6', overdue: 1 })).toBe(false);
    });

    it('validates ProjectDepartmentDetail', () => {
      expect(isProjectDepartmentDetail(validDepartment)).toBe(true);
      expect(isProjectDepartmentDetail({ id: '1', code: 'A' })).toBe(false);
    });

    it('validates MilestoneItem', () => {
      expect(isMilestoneItem(validMilestone)).toBe(true);
      expect(isMilestoneItem({ ...validMilestone, completedAt: '2026-10-18T10:00:00Z' })).toBe(true);
      expect(isMilestoneItem({ ...validMilestone, status: 'INVALID' })).toBe(false);
    });

    it('validates ProjectSummary', () => {
      expect(isProjectSummary(validProjectSummary)).toBe(true);
      expect(isProjectSummary({ ...validProjectSummary, description: null })).toBe(true);
      expect(isProjectSummary({ ...validProjectSummary, status: 'UNKNOWN' })).toBe(false);
      expect(isProjectSummary(null)).toBe(false);
    });

    it('validates ProjectDetail', () => {
      expect(isProjectDetail(validProjectDetail)).toBe(true);
      expect(isProjectDetail({ ...validProjectDetail, department: null })).toBe(true);
      expect(isProjectDetail({ ...validProjectDetail, version: '3' })).toBe(false);
      expect(isProjectDetail({ ...validProjectDetail, milestones: [{ invalid: true }] })).toBe(false);
    });

    it('validates ProjectMember', () => {
      expect(isProjectMember(validMember)).toBe(true);
      expect(isProjectMember({ ...validMember, avatarUrl: 'https://img.png' })).toBe(true);
      expect(isProjectMember({ ...validMember, active: 'true' })).toBe(false);
      expect(isProjectMember({ ...validMember, projectRole: 'SUPERUSER' })).toBe(false);
    });
  });
});
