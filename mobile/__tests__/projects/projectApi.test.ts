import { projectApi, serializeProjectListQuery } from '../../src/features/projects/api/projectApi';
import {
  AddProjectMemberRequest,
  ChangeProjectStatusRequest,
  CreateMilestoneRequest,
  CreateProjectRequest,
  MilestoneItem,
  ProjectDetail,
  ProjectMember,
  ProjectSummary,
  UpdateProjectMemberRoleRequest,
  UpdateProjectRequest,
} from '../../src/features/projects/api/projectTypes';
import { http, PagedData } from '../../src/shared/api';

jest.mock('../../src/shared/api', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Project API Adapter (projectApi)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockManager = {
    id: 'manager-1',
    fullName: 'Jane Doe',
    avatarUrl: null,
  };

  const mockProjectSummary: ProjectSummary = {
    id: 'project-1',
    code: 'PRJ-001',
    name: 'Project One',
    description: 'First project',
    status: 'ACTIVE',
    priority: 'HIGH',
    manager: mockManager,
    startDate: '2026-10-01',
    plannedEndDate: '2026-12-31',
    progressPercent: 30,
    memberCount: 5,
    taskSummary: {
      total: 10,
      completed: 3,
      overdue: 0,
    },
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
  };

  const mockProjectDetail: ProjectDetail = {
    id: 'project-1',
    code: 'PRJ-001',
    name: 'Project One',
    description: 'First project',
    status: 'ACTIVE',
    priority: 'HIGH',
    manager: mockManager,
    department: {
      id: 'dept-1',
      code: 'TECH',
      name: 'Technology',
    },
    startDate: '2026-10-01',
    plannedEndDate: '2026-12-31',
    actualEndDate: null,
    progressPercent: 30,
    memberCount: 5,
    milestones: [],
    recentTasks: [],
    allowedActions: ['UPDATE', 'MANAGE_MEMBERS'],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
    version: 1,
  };

  const mockMember: ProjectMember = {
    id: 'member-1',
    projectId: 'project-1',
    userId: 'user-1',
    fullName: 'Bob Member',
    email: 'bob@worksphere.local',
    avatarUrl: null,
    projectRole: 'MEMBER',
    joinedAt: '2026-10-01T00:00:00Z',
    leftAt: null,
    active: true,
  };

  const mockMilestone: MilestoneItem = {
    id: 'milestone-1',
    projectId: 'project-1',
    name: 'Kickoff Meeting',
    description: 'Initial team alignment',
    dueDate: '2026-10-05',
    completedAt: '2026-10-05T12:00:00Z',
    status: 'COMPLETED',
    createdBy: 'manager-1',
    createdAt: '2026-10-01T00:00:00Z',
    version: 1,
  };

  describe('serializeProjectListQuery', () => {
    it('returns empty object when query is undefined', () => {
      expect(serializeProjectListQuery()).toEqual({});
    });

    it('serializes page and size correctly', () => {
      expect(serializeProjectListQuery({ page: 2, size: 25 })).toEqual({
        page: 2,
        size: 25,
      });
    });

    it('trims search query and omits whitespace-only search', () => {
      expect(serializeProjectListQuery({ search: '  Mobile App  ' })).toEqual({
        search: 'Mobile App',
      });
      expect(serializeProjectListQuery({ search: '   ' })).toEqual({});
      expect(serializeProjectListQuery({ search: '' })).toEqual({});
    });

    it('whitelists sort property and defaults to desc when direction omitted', () => {
      expect(serializeProjectListQuery({ sort: 'createdAt,asc' })).toEqual({
        sort: 'createdAt,asc',
      });
      expect(serializeProjectListQuery({ sort: 'name,desc' })).toEqual({
        sort: 'name,desc',
      });
      expect(serializeProjectListQuery({ sort: 'priority' })).toEqual({
        sort: 'priority,desc',
      });
      // Unknown sort property is omitted
      expect(serializeProjectListQuery({ sort: 'unknownField,asc' })).toEqual({});
    });

    it('serializes filters correctly', () => {
      expect(
        serializeProjectListQuery({
          status: 'ACTIVE',
          priority: 'CRITICAL',
          managerId: '  manager-uuid-1  ',
          departmentId: 'dept-uuid-2',
        })
      ).toEqual({
        status: 'ACTIVE',
        priority: 'CRITICAL',
        managerId: 'manager-uuid-1',
        departmentId: 'dept-uuid-2',
      });
    });
  });

  describe('listProjects', () => {
    it('calls GET /projects with serialized params and returns paged data', async () => {
      const pagedData: PagedData<ProjectSummary> = {
        items: [mockProjectSummary],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
      (http.get as jest.Mock).mockResolvedValueOnce(pagedData);

      const result = await projectApi.listProjects({ search: 'Project', status: 'ACTIVE' });

      expect(http.get).toHaveBeenCalledWith('/projects', {
        params: { search: 'Project', status: 'ACTIVE' },
      });
      expect(result).toEqual(pagedData);
    });

    it('throws error when response data shape is invalid', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce({ invalid: true });

      await expect(projectApi.listProjects()).rejects.toThrow(
        'Dữ liệu danh sách dự án máy chủ trả về không hợp lệ'
      );
    });
  });

  describe('createProject', () => {
    it('calls POST /projects and returns created ProjectDetail', async () => {
      const request: CreateProjectRequest = {
        code: 'PRJ-001',
        name: 'Project One',
        priority: 'HIGH',
      };
      (http.post as jest.Mock).mockResolvedValueOnce(mockProjectDetail);

      const result = await projectApi.createProject(request);

      expect(http.post).toHaveBeenCalledWith('/projects', request);
      expect(result).toEqual(mockProjectDetail);
    });
  });

  describe('getProject', () => {
    it('calls GET /projects/{projectId} and returns ProjectDetail', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce(mockProjectDetail);

      const result = await projectApi.getProject('project-1');

      expect(http.get).toHaveBeenCalledWith('/projects/project-1');
      expect(result).toEqual(mockProjectDetail);
    });
  });

  describe('updateProject', () => {
    it('calls PUT /projects/{projectId} with version and returns updated ProjectDetail', async () => {
      const request: UpdateProjectRequest = {
        name: 'Updated Name',
        version: 1,
      };
      (http.put as jest.Mock).mockResolvedValueOnce(mockProjectDetail);

      const result = await projectApi.updateProject('project-1', request);

      expect(http.put).toHaveBeenCalledWith('/projects/project-1', request);
      expect(result).toEqual(mockProjectDetail);
    });
  });

  describe('changeProjectStatus', () => {
    it('calls PUT /projects/{projectId}/status with version and returns ProjectDetail', async () => {
      const request: ChangeProjectStatusRequest = {
        status: 'ON_HOLD',
        reason: 'Pending budget approval',
        version: 1,
      };
      (http.put as jest.Mock).mockResolvedValueOnce({
        ...mockProjectDetail,
        status: 'ON_HOLD',
      });

      const result = await projectApi.changeProjectStatus('project-1', request);

      expect(http.put).toHaveBeenCalledWith('/projects/project-1/status', request);
      expect(result.status).toBe('ON_HOLD');
    });
  });

  describe('listMembers', () => {
    it('calls GET /projects/{projectId}/members with query params', async () => {
      const pagedMembers: PagedData<ProjectMember> = {
        items: [mockMember],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
      (http.get as jest.Mock).mockResolvedValueOnce(pagedMembers);

      const result = await projectApi.listMembers('project-1', { page: 0, role: 'MEMBER' });

      expect(http.get).toHaveBeenCalledWith('/projects/project-1/members', {
        params: { page: 0, role: 'MEMBER' },
      });
      expect(result).toEqual(pagedMembers);
    });
  });

  describe('addProjectMember', () => {
    it('calls POST /projects/{projectId}/members and returns ProjectMember', async () => {
      const request: AddProjectMemberRequest = {
        userId: 'user-1',
        projectRole: 'MEMBER',
      };
      (http.post as jest.Mock).mockResolvedValueOnce(mockMember);

      const result = await projectApi.addProjectMember('project-1', request);

      expect(http.post).toHaveBeenCalledWith('/projects/project-1/members', request);
      expect(result).toEqual(mockMember);
    });
  });

  describe('updateProjectMemberRole', () => {
    it('calls PUT /projects/{projectId}/members/{memberId} and returns updated ProjectMember', async () => {
      const request: UpdateProjectMemberRoleRequest = {
        projectRole: 'TEAM_LEADER',
      };
      (http.put as jest.Mock).mockResolvedValueOnce({
        ...mockMember,
        projectRole: 'TEAM_LEADER',
      });

      const result = await projectApi.updateProjectMemberRole('project-1', 'member-1', request);

      expect(http.put).toHaveBeenCalledWith('/projects/project-1/members/member-1', request);
      expect(result.projectRole).toBe('TEAM_LEADER');
    });
  });

  describe('removeProjectMember', () => {
    it('calls DELETE /projects/{projectId}/members/{memberId}', async () => {
      (http.delete as jest.Mock).mockResolvedValueOnce(undefined);

      await projectApi.removeProjectMember('project-1', 'member-1');

      expect(http.delete).toHaveBeenCalledWith('/projects/project-1/members/member-1');
    });
  });

  describe('createMilestone', () => {
    it('calls POST /projects/{projectId}/milestones and returns MilestoneItem', async () => {
      const request: CreateMilestoneRequest = {
        name: 'Sprint 1',
        dueDate: '2026-11-15',
      };
      (http.post as jest.Mock).mockResolvedValueOnce(mockMilestone);

      const result = await projectApi.createMilestone('project-1', request);

      expect(http.post).toHaveBeenCalledWith('/projects/project-1/milestones', request);
      expect(result).toEqual(mockMilestone);
    });
  });

  describe('listMilestones', () => {
    it('calls GET /projects/{projectId}/milestones and returns MilestoneItem array', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce([mockMilestone]);

      const result = await projectApi.listMilestones('project-1');

      expect(http.get).toHaveBeenCalledWith('/projects/project-1/milestones');
      expect(result).toEqual([mockMilestone]);
    });
  });
});
