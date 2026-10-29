/**
 * Phase 14A: Mobile Project API Adapter
 * Transport adapter connecting mobile Project features to backend Spring Boot REST endpoints.
 * Operates purely as a transport adapter:
 * - Does NOT store entity cache
 * - Does NOT mutate navigation state
 * - Performs query serialization and validation
 * - Unwraps standard ApiResponse envelope via shared http client
 */

import { http, PagedData } from '../../../shared/api';
import {
  AddProjectMemberRequest,
  ChangeProjectStatusRequest,
  CreateMilestoneRequest,
  CreateProjectRequest,
  isMilestoneItem,
  isProjectDetail,
  isProjectMember,
  isProjectSummary,
  MilestoneItem,
  ProjectDetail,
  ProjectListQuery,
  ProjectMember,
  PROJECT_SORT_PROPERTIES,
  ProjectSummary,
  UpdateProjectMemberRoleRequest,
  UpdateProjectRequest,
} from './projectTypes';

/**
 * Builds deterministic query parameters for project listing.
 * - Trims search string; omits if empty or whitespace only.
 * - Validates sort field against canonical whitelist.
 * - Only includes defined filter parameters.
 */
export function serializeProjectListQuery(query?: ProjectListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  if (!query) {
    return params;
  }

  if (typeof query.page === 'number' && query.page >= 0) {
    params.page = query.page;
  }

  if (typeof query.size === 'number' && query.size > 0) {
    params.size = query.size;
  }

  if (query.sort && typeof query.sort === 'string') {
    const parts = query.sort.split(',');
    const property = parts[0]?.trim();
    const direction = parts[1]?.trim().toLowerCase();
    if (PROJECT_SORT_PROPERTIES.includes(property as any)) {
      const validDir = direction === 'asc' ? 'asc' : 'desc';
      params.sort = `${property},${validDir}`;
    }
  }

  if (typeof query.search === 'string') {
    const trimmed = query.search.trim();
    if (trimmed.length > 0) {
      params.search = trimmed;
    }
  }

  if (query.status) {
    params.status = query.status;
  }

  if (query.priority) {
    params.priority = query.priority;
  }

  if (query.managerId && typeof query.managerId === 'string' && query.managerId.trim().length > 0) {
    params.managerId = query.managerId.trim();
  }

  if (query.departmentId && typeof query.departmentId === 'string' && query.departmentId.trim().length > 0) {
    params.departmentId = query.departmentId.trim();
  }

  return params;
}

export const projectApi = {
  /**
   * 11.1. Lấy danh sách dự án
   * GET /projects
   */
  async listProjects(query?: ProjectListQuery): Promise<PagedData<ProjectSummary>> {
    const params = serializeProjectListQuery(query);
    const data = await http.get<PagedData<ProjectSummary>>('/projects', { params });

    if (
      !data ||
      !Array.isArray(data.items) ||
      typeof data.page !== 'number' ||
      typeof data.size !== 'number' ||
      typeof data.totalItems !== 'number' ||
      typeof data.totalPages !== 'number' ||
      typeof data.hasNext !== 'boolean' ||
      typeof data.hasPrevious !== 'boolean' ||
      !data.items.every(isProjectSummary)
    ) {
      throw new Error('Dữ liệu danh sách dự án máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 11.2. Tạo dự án
   * POST /projects
   */
  async createProject(request: CreateProjectRequest): Promise<ProjectDetail> {
    const data = await http.post<CreateProjectRequest, ProjectDetail>('/projects', request);

    if (!isProjectDetail(data)) {
      throw new Error('Dữ liệu tạo dự án máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 11.3. Chi tiết dự án
   * GET /projects/{projectId}
   */
  async getProject(projectId: string): Promise<ProjectDetail> {
    const data = await http.get<ProjectDetail>(`/projects/${encodeURIComponent(projectId)}`);

    if (!isProjectDetail(data)) {
      throw new Error('Dữ liệu chi tiết dự án máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 11.4. Cập nhật dự án (Optimistic locking via version)
   * PUT /projects/{projectId}
   */
  async updateProject(projectId: string, request: UpdateProjectRequest): Promise<ProjectDetail> {
    const data = await http.put<UpdateProjectRequest, ProjectDetail>(
      `/projects/${encodeURIComponent(projectId)}`,
      request
    );

    if (!isProjectDetail(data)) {
      throw new Error('Dữ liệu cập nhật dự án máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 11.5. Thay đổi trạng thái dự án
   * PUT /projects/{projectId}/status
   */
  async changeProjectStatus(projectId: string, request: ChangeProjectStatusRequest): Promise<ProjectDetail> {
    const data = await http.put<ChangeProjectStatusRequest, ProjectDetail>(
      `/projects/${encodeURIComponent(projectId)}/status`,
      request
    );

    if (!isProjectDetail(data)) {
      throw new Error('Dữ liệu cập nhật trạng thái dự án máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 11.6. Danh sách thành viên dự án
   * GET /projects/{projectId}/members
   */
  async listMembers(
    projectId: string,
    query?: { page?: number; size?: number; role?: string; active?: boolean }
  ): Promise<PagedData<ProjectMember>> {
    const params: Record<string, string | number | boolean> = {};
    if (typeof query?.page === 'number' && query.page >= 0) params.page = query.page;
    if (typeof query?.size === 'number' && query.size > 0) params.size = query.size;
    if (query?.role) params.role = query.role;
    if (typeof query?.active === 'boolean') params.active = query.active;

    const data = await http.get<PagedData<ProjectMember>>(
      `/projects/${encodeURIComponent(projectId)}/members`,
      { params }
    );

    if (
      !data ||
      !Array.isArray(data.items) ||
      typeof data.page !== 'number' ||
      typeof data.size !== 'number' ||
      typeof data.totalItems !== 'number' ||
      typeof data.totalPages !== 'number' ||
      typeof data.hasNext !== 'boolean' ||
      typeof data.hasPrevious !== 'boolean' ||
      !data.items.every(isProjectMember)
    ) {
      throw new Error('Dữ liệu danh sách thành viên máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 11.7. Thêm thành viên dự án
   * POST /projects/{projectId}/members
   */
  async addProjectMember(projectId: string, request: AddProjectMemberRequest): Promise<ProjectMember> {
    const data = await http.post<AddProjectMemberRequest, ProjectMember>(
      `/projects/${encodeURIComponent(projectId)}/members`,
      request
    );

    if (!isProjectMember(data)) {
      throw new Error('Dữ liệu thêm thành viên máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 11.8. Cập nhật vai trò thành viên
   * PUT /projects/{projectId}/members/{memberId}
   */
  async updateProjectMemberRole(
    projectId: string,
    memberId: string,
    request: UpdateProjectMemberRoleRequest
  ): Promise<ProjectMember> {
    const data = await http.put<UpdateProjectMemberRoleRequest, ProjectMember>(
      `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}`,
      request
    );

    if (!isProjectMember(data)) {
      throw new Error('Dữ liệu cập nhật vai trò thành viên máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 11.9. Xóa thành viên dự án
   * DELETE /projects/{projectId}/members/{memberId}
   */
  async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    await http.delete<void>(
      `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}`
    );
  },

  /**
   * 11.10. Tạo milestone
   * POST /projects/{projectId}/milestones
   */
  async createMilestone(projectId: string, request: CreateMilestoneRequest): Promise<MilestoneItem> {
    const data = await http.post<CreateMilestoneRequest, MilestoneItem>(
      `/projects/${encodeURIComponent(projectId)}/milestones`,
      request
    );

    if (!isMilestoneItem(data)) {
      throw new Error('Dữ liệu tạo milestone máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 11.11. Danh sách milestone
   * GET /projects/{projectId}/milestones
   */
  async listMilestones(projectId: string): Promise<MilestoneItem[]> {
    const data = await http.get<MilestoneItem[]>(
      `/projects/${encodeURIComponent(projectId)}/milestones`
    );

    if (!Array.isArray(data) || !data.every(isMilestoneItem)) {
      throw new Error('Dữ liệu danh sách milestone máy chủ trả về không hợp lệ');
    }

    return data;
  },
};
