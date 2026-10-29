/**
 * Phase 16A: Mobile Service Request API Adapter
 * Transport adapter connecting mobile Service Request features to backend Spring Boot REST endpoints.
 * Operates purely as a transport adapter:
 * - Does NOT store entity cache
 * - Does NOT mutate navigation state
 * - Performs query serialization and validation
 * - Unwraps standard ApiResponse envelope via shared http client
 * - Validates responses through runtime type guards
 *
 * Implements 11 canonical client methods matching Decision D-065 & 06_API_CONTRACT.md section 13.
 */

import { http, PagedData } from '../../../shared/api';
import {
  AssignServiceRequestRequest,
  CreateServiceCommentRequest,
  CreateServiceRatingRequest,
  CreateServiceRequestRequest,
  CreateServiceRequestResponse,
  isCreateServiceRequestResponse,
  isServiceCategoryList,
  isServiceCommentPage,
  isServiceCommentResponse,
  isServicePriority,
  isServiceRatingResponse,
  isServiceRequestDetail,
  isServiceRequestSummaryPage,
  isServiceStatus,
  RejectResolutionRequest,
  SERVICE_REQUEST_SORT_PROPERTIES,
  ServiceCategoryResponse,
  ServiceCommentListQuery,
  ServiceCommentResponse,
  ServiceRatingResponse,
  ServiceRequestDetailResponse,
  ServiceRequestListQuery,
  ServiceRequestSortProperty,
  ServiceRequestSummaryResponse,
  UpdateServiceRequestRequest,
  UpdateServiceRequestStatusRequest,
} from '../types/serviceRequestTypes';

function isServiceRequestSortProperty(property: string): property is ServiceRequestSortProperty {
  return (SERVICE_REQUEST_SORT_PROPERTIES as readonly string[]).includes(property);
}

/**
 * Builds deterministic query parameters for service request listing.
 * - Trims search string; omits if empty or whitespace only.
 * - Validates sort field format.
 * - Only includes defined filter parameters.
 */
export function serializeServiceRequestListQuery(
  query?: ServiceRequestListQuery
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};

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
    const trimmed = query.sort.trim();
    if (trimmed.length > 0) {
      const [field] = trimmed.split(',');
      if (isServiceRequestSortProperty(field.trim())) {
        params.sort = trimmed;
      }
    }
  }

  if (query.search && typeof query.search === 'string') {
    const trimmed = query.search.trim();
    if (trimmed.length > 0) {
      params.search = trimmed;
    }
  }

  if (query.categoryId && typeof query.categoryId === 'string') {
    const trimmed = query.categoryId.trim();
    if (trimmed.length > 0) {
      params.categoryId = trimmed;
    }
  }

  if (query.requesterId && typeof query.requesterId === 'string') {
    const trimmed = query.requesterId.trim();
    if (trimmed.length > 0) {
      params.requesterId = trimmed;
    }
  }

  if (query.assigneeId && typeof query.assigneeId === 'string') {
    const trimmed = query.assigneeId.trim();
    if (trimmed.length > 0) {
      params.assigneeId = trimmed;
    }
  }

  if (query.assetId && typeof query.assetId === 'string') {
    const trimmed = query.assetId.trim();
    if (trimmed.length > 0) {
      params.assetId = trimmed;
    }
  }

  if (query.status && isServiceStatus(query.status)) {
    params.status = query.status;
  }

  if (query.priority && isServicePriority(query.priority)) {
    params.priority = query.priority;
  }

  if (query.createdFrom && typeof query.createdFrom === 'string') {
    const trimmed = query.createdFrom.trim();
    if (trimmed.length > 0) {
      params.createdFrom = trimmed;
    }
  }

  if (query.createdTo && typeof query.createdTo === 'string') {
    const trimmed = query.createdTo.trim();
    if (trimmed.length > 0) {
      params.createdTo = trimmed;
    }
  }

  return params;
}

/**
 * Builds deterministic query parameters for service comment listing.
 */
export function serializeServiceCommentListQuery(
  query?: ServiceCommentListQuery
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};

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
    const trimmed = query.sort.trim();
    if (trimmed.length > 0) {
      params.sort = trimmed;
    }
  }

  return params;
}

export const serviceRequestApi = {
  /**
   * 13.1. Danh sách danh mục dịch vụ đang hoạt động
   * GET /service-categories
   */
  async listCategories(): Promise<ServiceCategoryResponse[]> {
    const data = await http.get<ServiceCategoryResponse[]>('/service-categories');

    if (!isServiceCategoryList(data)) {
      throw new Error('Dữ liệu danh mục dịch vụ máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 13.2. Danh sách yêu cầu dịch vụ
   * GET /service-requests
   */
  async listServiceRequests(
    query?: ServiceRequestListQuery
  ): Promise<PagedData<ServiceRequestSummaryResponse>> {
    const params = serializeServiceRequestListQuery(query);
    const data = await http.get<PagedData<ServiceRequestSummaryResponse>>('/service-requests', {
      params,
    });

    if (!isServiceRequestSummaryPage(data)) {
      throw new Error('Dữ liệu danh sách yêu cầu dịch vụ máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 13.3. Tạo yêu cầu dịch vụ
   * POST /service-requests
   */
  async createServiceRequest(
    request: CreateServiceRequestRequest
  ): Promise<CreateServiceRequestResponse> {
    const data = await http.post<CreateServiceRequestRequest, CreateServiceRequestResponse>(
      '/service-requests',
      request
    );

    if (!isCreateServiceRequestResponse(data)) {
      throw new Error('Dữ liệu phản hồi tạo yêu cầu dịch vụ máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 13.4. Chi tiết yêu cầu dịch vụ
   * GET /service-requests/{requestId}
   */
  async getServiceRequestDetail(requestId: string): Promise<ServiceRequestDetailResponse> {
    const data = await http.get<ServiceRequestDetailResponse>(
      `/service-requests/${encodeURIComponent(requestId)}`
    );

    if (!isServiceRequestDetail(data)) {
      throw new Error('Dữ liệu chi tiết yêu cầu dịch vụ máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 13.5. Cập nhật yêu cầu dịch vụ
   * PUT /service-requests/{requestId}
   */
  async updateServiceRequest(
    requestId: string,
    request: UpdateServiceRequestRequest
  ): Promise<ServiceRequestDetailResponse> {
    const data = await http.put<UpdateServiceRequestRequest, ServiceRequestDetailResponse>(
      `/service-requests/${encodeURIComponent(requestId)}`,
      request
    );

    if (!isServiceRequestDetail(data)) {
      throw new Error('Dữ liệu cập nhật yêu cầu dịch vụ máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 13.6. Phân công người xử lý
   * POST /service-requests/{requestId}/assignments
   */
  async assignServiceRequest(
    requestId: string,
    request: AssignServiceRequestRequest
  ): Promise<void> {
    await http.post<AssignServiceRequestRequest, void>(
      `/service-requests/${encodeURIComponent(requestId)}/assignments`,
      request
    );
  },

  /**
   * 13.7. Cập nhật trạng thái yêu cầu dịch vụ
   * PUT /service-requests/{requestId}/status
   */
  async updateServiceRequestStatus(
    requestId: string,
    request: UpdateServiceRequestStatusRequest
  ): Promise<void> {
    await http.put<UpdateServiceRequestStatusRequest, void>(
      `/service-requests/${encodeURIComponent(requestId)}/status`,
      request
    );
  },

  /**
   * 13.7.1. Từ chối kết quả xử lý
   * POST /service-requests/{requestId}/reject-resolution
   */
  async rejectResolution(
    requestId: string,
    request: RejectResolutionRequest
  ): Promise<ServiceRequestDetailResponse> {
    const data = await http.post<RejectResolutionRequest, ServiceRequestDetailResponse>(
      `/service-requests/${encodeURIComponent(requestId)}/reject-resolution`,
      request
    );

    if (!isServiceRequestDetail(data)) {
      throw new Error('Dữ liệu phản hồi từ chối giải quyết máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 13.8. Danh sách bình luận
   * GET /service-requests/{requestId}/comments
   */
  async getComments(
    requestId: string,
    query?: ServiceCommentListQuery
  ): Promise<PagedData<ServiceCommentResponse>> {
    const params = serializeServiceCommentListQuery(query);
    const data = await http.get<PagedData<ServiceCommentResponse>>(
      `/service-requests/${encodeURIComponent(requestId)}/comments`,
      { params }
    );

    if (!isServiceCommentPage(data)) {
      throw new Error('Dữ liệu danh sách bình luận máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 13.9. Thêm bình luận
   * POST /service-requests/{requestId}/comments
   */
  async createComment(
    requestId: string,
    request: CreateServiceCommentRequest
  ): Promise<ServiceCommentResponse> {
    const data = await http.post<CreateServiceCommentRequest, ServiceCommentResponse>(
      `/service-requests/${encodeURIComponent(requestId)}/comments`,
      request
    );

    if (!isServiceCommentResponse(data)) {
      throw new Error('Dữ liệu phản hồi tạo bình luận máy chủ trả về không hợp lệ');
    }

    return data;
  },

  /**
   * 13.10. Đánh giá dịch vụ
   * POST /service-requests/{requestId}/rating
   */
  async rateServiceRequest(
    requestId: string,
    request: CreateServiceRatingRequest
  ): Promise<ServiceRatingResponse> {
    const data = await http.post<CreateServiceRatingRequest, ServiceRatingResponse>(
      `/service-requests/${encodeURIComponent(requestId)}/rating`,
      request
    );

    if (!isServiceRatingResponse(data)) {
      throw new Error('Dữ liệu phản hồi đánh giá dịch vụ máy chủ trả về không hợp lệ');
    }

    return data;
  },
};
