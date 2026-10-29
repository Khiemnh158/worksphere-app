import {
  serializeServiceCommentListQuery,
  serializeServiceRequestListQuery,
  serviceRequestApi,
} from '../../src/features/serviceRequests/api/serviceRequestApi';
import {
  AssignServiceRequestRequest,
  CreateServiceCommentRequest,
  CreateServiceRatingRequest,
  CreateServiceRequestRequest,
  CreateServiceRequestResponse,
  RejectResolutionRequest,
  ServiceCategoryResponse,
  ServiceCommentResponse,
  ServiceRatingResponse,
  ServiceRequestDetailResponse,
  ServiceRequestSummaryResponse,
  UpdateServiceRequestRequest,
  UpdateServiceRequestStatusRequest,
} from '../../src/features/serviceRequests/types/serviceRequestTypes';
import { http, PagedData } from '../../src/shared/api';

jest.mock('../../src/shared/api', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Service Request API Adapter (serviceRequestApi)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCategory: ServiceCategoryResponse = {
    id: 'cat-1',
    parentId: null,
    code: 'FACILITY',
    name: 'Cơ sở vật chất',
    description: 'Sửa chữa điện nước, bàn ghế văn phòng',
    defaultPriority: 'MEDIUM',
    active: true,
    createdAt: '2026-10-21T08:00:00Z',
    updatedAt: null,
    version: 1,
  };

  const mockSummary: ServiceRequestSummaryResponse = {
    id: 'sr-1',
    requestNumber: 'SR-202610-0001',
    categoryId: 'cat-1',
    categoryName: 'Cơ sở vật chất',
    requesterId: 'usr-1',
    requesterName: 'Nguyễn Văn A',
    assigneeId: null,
    assigneeName: null,
    title: 'Thay bóng đèn phòng họp A',
    priority: 'MEDIUM',
    status: 'OPEN',
    createdAt: '2026-10-21T09:00:00Z',
    updatedAt: null,
  };

  const mockDetail: ServiceRequestDetailResponse = {
    id: 'sr-1',
    requestNumber: 'SR-202610-0001',
    category: {
      id: 'cat-1',
      code: 'FACILITY',
      name: 'Cơ sở vật chất',
    },
    requester: {
      id: 'usr-1',
      fullName: 'Nguyễn Văn A',
      email: 'vana@worksphere.vn',
    },
    assignee: null,
    asset: null,
    title: 'Thay bóng đèn phòng họp A',
    description: 'Bóng đèn huỳnh quang nhấp nháy liên tục',
    priority: 'MEDIUM',
    status: 'OPEN',
    resolvedAt: null,
    closedAt: null,
    cancelledAt: null,
    attachments: [],
    comments: [],
    histories: [],
    rating: null,
    allowedActions: ['UPDATE', 'CANCEL', 'ASSIGN', 'COMMENT'],
    createdAt: '2026-10-21T09:00:00Z',
    updatedAt: null,
    version: 1,
  };

  const mockComment: ServiceCommentResponse = {
    id: 'cmt-1',
    requestId: 'sr-1',
    authorId: 'usr-1',
    authorName: 'Nguyễn Văn A',
    content: 'Đã báo tiếp tân mở cửa phòng',
    isInternal: false,
    isEdited: false,
    editedAt: null,
    createdAt: '2026-10-21T09:10:00Z',
    updatedAt: null,
  };

  const mockRating: ServiceRatingResponse = {
    id: 'rate-1',
    requestId: 'sr-1',
    ratedBy: 'usr-1',
    ratedByName: 'Nguyễn Văn A',
    score: 5,
    comment: 'Đèn sáng tốt',
    createdAt: '2026-10-21T11:00:00Z',
  };

  describe('Query Serialization', () => {
    it('serializes ServiceRequestListQuery with trims, sort validation, and ignores empty parameters', () => {
      const params = serializeServiceRequestListQuery({
        page: 0,
        size: 20,
        sort: 'createdAt,desc',
        search: '  bóng đèn  ',
        categoryId: '  cat-1  ',
        requesterId: '  usr-1  ',
        assigneeId: '  usr-2  ',
        assetId: '  ast-1  ',
        status: 'OPEN',
        priority: 'HIGH',
        createdFrom: '  2026-10-01T00:00:00Z  ',
        createdTo: '  2026-10-31T23:59:59Z  ',
      });

      expect(params).toEqual({
        page: 0,
        size: 20,
        sort: 'createdAt,desc',
        search: 'bóng đèn',
        categoryId: 'cat-1',
        requesterId: 'usr-1',
        assigneeId: 'usr-2',
        assetId: 'ast-1',
        status: 'OPEN',
        priority: 'HIGH',
        createdFrom: '2026-10-01T00:00:00Z',
        createdTo: '2026-10-31T23:59:59Z',
      });
    });

    it('omits invalid or whitespace-only params in serializeServiceRequestListQuery', () => {
      const params = serializeServiceRequestListQuery({
        search: '   ',
        categoryId: '',
        sort: 'unsupportedField,asc',
      });

      expect(params).toEqual({});
      expect(serializeServiceRequestListQuery(undefined)).toEqual({});
    });

    it('serializes ServiceCommentListQuery correctly', () => {
      const params = serializeServiceCommentListQuery({
        page: 1,
        size: 10,
        sort: 'createdAt,asc',
      });

      expect(params).toEqual({
        page: 1,
        size: 10,
        sort: 'createdAt,asc',
      });

      expect(serializeServiceCommentListQuery(undefined)).toEqual({});
    });
  });

  describe('Endpoint Client Methods (11 Methods)', () => {
    // 1. listCategories
    it('13.1 listCategories: GET /service-categories returns active categories', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce([mockCategory]);

      const result = await serviceRequestApi.listCategories();

      expect(http.get).toHaveBeenCalledWith('/service-categories');
      expect(result).toEqual([mockCategory]);
    });

    it('13.1 listCategories: throws when response fails guard', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce({ not: 'an array' });

      await expect(serviceRequestApi.listCategories()).rejects.toThrow(
        'Dữ liệu danh mục dịch vụ máy chủ trả về không hợp lệ'
      );
    });

    // 2. listServiceRequests
    it('13.2 listServiceRequests: GET /service-requests with query params', async () => {
      const mockPage: PagedData<ServiceRequestSummaryResponse> = {
        items: [mockSummary],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      (http.get as jest.Mock).mockResolvedValueOnce(mockPage);

      const result = await serviceRequestApi.listServiceRequests({ status: 'OPEN', page: 0 });

      expect(http.get).toHaveBeenCalledWith('/service-requests', {
        params: { status: 'OPEN', page: 0 },
      });
      expect(result).toEqual(mockPage);
    });

    it('13.2 listServiceRequests: throws when response fails page guard', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce({ items: [{ invalid: true }] });

      await expect(serviceRequestApi.listServiceRequests()).rejects.toThrow(
        'Dữ liệu danh sách yêu cầu dịch vụ máy chủ trả về không hợp lệ'
      );
    });

    // 3. createServiceRequest
    it('13.3 createServiceRequest: POST /service-requests returns create response', async () => {
      const mockCreateResponse: CreateServiceRequestResponse = {
        id: 'sr-1',
        requestNumber: 'SR-202610-0001',
        status: 'OPEN',
      };

      (http.post as jest.Mock).mockResolvedValueOnce(mockCreateResponse);

      const payload: CreateServiceRequestRequest = {
        categoryId: 'cat-1',
        title: 'Thay bóng đèn phòng họp A',
        description: 'Bóng đèn nhấp nháy',
        priority: 'MEDIUM',
      };

      const result = await serviceRequestApi.createServiceRequest(payload);

      expect(http.post).toHaveBeenCalledWith('/service-requests', payload);
      expect(result).toEqual(mockCreateResponse);
    });

    it('13.3 createServiceRequest: throws when create response fails guard', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce({ id: 'sr-1' }); // missing requestNumber and status

      await expect(
        serviceRequestApi.createServiceRequest({
          categoryId: 'cat-1',
          title: 'A',
          description: 'B',
        })
      ).rejects.toThrow('Dữ liệu phản hồi tạo yêu cầu dịch vụ máy chủ trả về không hợp lệ');
    });

    // 4. getServiceRequestDetail
    it('13.4 getServiceRequestDetail: GET /service-requests/{requestId}', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce(mockDetail);

      const result = await serviceRequestApi.getServiceRequestDetail('sr-1');

      expect(http.get).toHaveBeenCalledWith('/service-requests/sr-1');
      expect(result).toEqual(mockDetail);
    });

    it('13.4 getServiceRequestDetail: throws when detail fails guard', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce({ id: 'sr-1', bad: true });

      await expect(serviceRequestApi.getServiceRequestDetail('sr-1')).rejects.toThrow(
        'Dữ liệu chi tiết yêu cầu dịch vụ máy chủ trả về không hợp lệ'
      );
    });

    // 5. updateServiceRequest
    it('13.5 updateServiceRequest: PUT /service-requests/{requestId}', async () => {
      const updatedDetail = { ...mockDetail, version: 2, title: 'Tiêu đề mới' };
      (http.put as jest.Mock).mockResolvedValueOnce(updatedDetail);

      const payload: UpdateServiceRequestRequest = {
        title: 'Tiêu đề mới',
        description: 'Mô tả mới',
        version: 1,
      };

      const result = await serviceRequestApi.updateServiceRequest('sr-1', payload);

      expect(http.put).toHaveBeenCalledWith('/service-requests/sr-1', payload);
      expect(result).toEqual(updatedDetail);
    });

    it('13.5 updateServiceRequest: throws when response fails guard', async () => {
      (http.put as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        serviceRequestApi.updateServiceRequest('sr-1', {
          title: 'A',
          description: 'B',
          version: 1,
        })
      ).rejects.toThrow('Dữ liệu cập nhật yêu cầu dịch vụ máy chủ trả về không hợp lệ');
    });

    // 6. assignServiceRequest
    it('13.6 assignServiceRequest: POST /service-requests/{requestId}/assignments', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce(undefined);

      const payload: AssignServiceRequestRequest = {
        assigneeId: 'usr-2',
      };

      await serviceRequestApi.assignServiceRequest('sr-1', payload);

      expect(http.post).toHaveBeenCalledWith('/service-requests/sr-1/assignments', payload);
    });

    // 7. updateServiceRequestStatus
    it('13.7 updateServiceRequestStatus: PUT /service-requests/{requestId}/status', async () => {
      (http.put as jest.Mock).mockResolvedValueOnce(undefined);

      const payload: UpdateServiceRequestStatusRequest = {
        status: 'IN_PROGRESS',
        comment: 'Bắt đầu xử lý',
        version: 1,
      };

      await serviceRequestApi.updateServiceRequestStatus('sr-1', payload);

      expect(http.put).toHaveBeenCalledWith('/service-requests/sr-1/status', payload);
    });

    // 8. rejectResolution
    it('13.7.1 rejectResolution: POST /service-requests/{requestId}/reject-resolution', async () => {
      const rejectedDetail = { ...mockDetail, status: 'IN_PROGRESS', version: 3 };
      (http.post as jest.Mock).mockResolvedValueOnce(rejectedDetail);

      const payload: RejectResolutionRequest = {
        reason: 'Đèn vẫn còn nhấp nháy',
        version: 2,
      };

      const result = await serviceRequestApi.rejectResolution('sr-1', payload);

      expect(http.post).toHaveBeenCalledWith('/service-requests/sr-1/reject-resolution', payload);
      expect(result).toEqual(rejectedDetail);
    });

    it('13.7.1 rejectResolution: throws when response fails guard', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce({ bad: true });

      await expect(
        serviceRequestApi.rejectResolution('sr-1', {
          reason: 'Lỗi',
          version: 1,
        })
      ).rejects.toThrow('Dữ liệu phản hồi từ chối giải quyết máy chủ trả về không hợp lệ');
    });

    // 9. getComments
    it('13.8 getComments: GET /service-requests/{requestId}/comments with query params', async () => {
      const mockCommentPage: PagedData<ServiceCommentResponse> = {
        items: [mockComment],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      (http.get as jest.Mock).mockResolvedValueOnce(mockCommentPage);

      const result = await serviceRequestApi.getComments('sr-1', { page: 0 });

      expect(http.get).toHaveBeenCalledWith('/service-requests/sr-1/comments', {
        params: { page: 0 },
      });
      expect(result).toEqual(mockCommentPage);
    });

    it('13.8 getComments: throws when comments page fails guard', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce({ items: 'not an array' });

      await expect(serviceRequestApi.getComments('sr-1')).rejects.toThrow(
        'Dữ liệu danh sách bình luận máy chủ trả về không hợp lệ'
      );
    });

    // 10. createComment
    it('13.9 createComment: POST /service-requests/{requestId}/comments', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce(mockComment);

      const payload: CreateServiceCommentRequest = {
        content: 'Đã báo tiếp tân mở cửa phòng',
        isInternal: false,
      };

      const result = await serviceRequestApi.createComment('sr-1', payload);

      expect(http.post).toHaveBeenCalledWith('/service-requests/sr-1/comments', payload);
      expect(result).toEqual(mockComment);
    });

    it('13.9 createComment: throws when comment response fails guard', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce({ content: 123 });

      await expect(
        serviceRequestApi.createComment('sr-1', {
          content: 'Test',
        })
      ).rejects.toThrow('Dữ liệu phản hồi tạo bình luận máy chủ trả về không hợp lệ');
    });

    // 11. rateServiceRequest
    it('13.10 rateServiceRequest: POST /service-requests/{requestId}/rating', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce(mockRating);

      const payload: CreateServiceRatingRequest = {
        score: 5,
        comment: 'Đèn sáng tốt',
      };

      const result = await serviceRequestApi.rateServiceRequest('sr-1', payload);

      expect(http.post).toHaveBeenCalledWith('/service-requests/sr-1/rating', payload);
      expect(result).toEqual(mockRating);
    });

    it('13.10 rateServiceRequest: throws when rating response fails guard', async () => {
      (http.post as jest.Mock).mockResolvedValueOnce({ score: 'invalid' });

      await expect(
        serviceRequestApi.rateServiceRequest('sr-1', {
          score: 5,
        })
      ).rejects.toThrow('Dữ liệu phản hồi đánh giá dịch vụ máy chủ trả về không hợp lệ');
    });
  });
});
