import {
  hasServiceRequestAction,
  isCreateServiceRequestResponse,
  isKnownServiceRequestAction,
  isServiceAttachmentResponse,
  isServiceCategoryList,
  isServiceCategoryResponse,
  isServiceCommentPage,
  isServiceCommentResponse,
  isServicePriority,
  isServiceRatingResponse,
  isServiceRequestDetail,
  isServiceRequestSummary,
  isServiceRequestSummaryPage,
  isServiceStatus,
  isServiceStatusHistoryResponse,
  KNOWN_SERVICE_REQUEST_ACTIONS,
  SERVICE_PRIORITY_VALUES,
  SERVICE_REQUEST_SORT_PROPERTIES,
  SERVICE_STATUS_VALUES,
  ServiceAttachmentResponse,
  ServiceCategoryResponse,
  ServiceCommentResponse,
  ServicePriority,
  ServiceRatingResponse,
  ServiceRequestDetailResponse,
  ServiceRequestSummaryResponse,
  ServiceStatus,
  ServiceStatusHistoryResponse,
} from '../../src/features/serviceRequests/types/serviceRequestTypes';
import { PagedData } from '../../src/shared/api';

describe('Service Request Types & Runtime Guards', () => {
  describe('Enum Guards & Constants', () => {
    it('validates ServiceStatus correctly for all 7 canonical states', () => {
      const validStatuses: ServiceStatus[] = [
        'OPEN',
        'ASSIGNED',
        'IN_PROGRESS',
        'WAITING_FOR_USER',
        'RESOLVED',
        'CLOSED',
        'CANCELLED',
      ];

      expect(SERVICE_STATUS_VALUES).toEqual(validStatuses);

      validStatuses.forEach(status => {
        expect(isServiceStatus(status)).toBe(true);
      });

      expect(isServiceStatus('DRAFT')).toBe(false);
      expect(isServiceStatus('TODO')).toBe(false);
      expect(isServiceStatus('open')).toBe(false);
      expect(isServiceStatus(null)).toBe(false);
      expect(isServiceStatus(undefined)).toBe(false);
      expect(isServiceStatus(123)).toBe(false);
      expect(isServiceStatus({})).toBe(false);
    });

    it('validates ServicePriority correctly for all 4 levels', () => {
      const validPriorities: ServicePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      expect(SERVICE_PRIORITY_VALUES).toEqual(validPriorities);

      validPriorities.forEach(priority => {
        expect(isServicePriority(priority)).toBe(true);
      });

      expect(isServicePriority('URGENT')).toBe(false);
      expect(isServicePriority('NORMAL')).toBe(false);
      expect(isServicePriority('low')).toBe(false);
      expect(isServicePriority(null)).toBe(false);
      expect(isServicePriority(undefined)).toBe(false);
      expect(isServicePriority(0)).toBe(false);
    });

    it('validates known allowed actions correctly', () => {
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('ASSIGN');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('UPDATE');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('CANCEL');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('REJECT_RESOLUTION');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('CONFIRM');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('RATE');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('START');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('WAIT_FOR_USER');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('RESOLVE');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('RESUME');
      expect(KNOWN_SERVICE_REQUEST_ACTIONS).toContain('COMMENT');

      expect(isKnownServiceRequestAction('ASSIGN')).toBe(true);
      expect(isKnownServiceRequestAction('RATE')).toBe(true);
      expect(isKnownServiceRequestAction('DELETE')).toBe(false);
      expect(isKnownServiceRequestAction('UNKNOWN')).toBe(false);
    });

    it('checks action presence with hasServiceRequestAction helper', () => {
      const actions = ['ASSIGN', 'UPDATE', 'COMMENT'];
      expect(hasServiceRequestAction(actions, 'ASSIGN')).toBe(true);
      expect(hasServiceRequestAction(actions, 'RATE')).toBe(false);
      expect(hasServiceRequestAction(undefined, 'ASSIGN')).toBe(false);
      expect(hasServiceRequestAction([] as string[], 'ASSIGN')).toBe(false);
    });

    it('exposes canonical sort properties', () => {
      expect(SERVICE_REQUEST_SORT_PROPERTIES).toContain('createdAt');
      expect(SERVICE_REQUEST_SORT_PROPERTIES).toContain('updatedAt');
      expect(SERVICE_REQUEST_SORT_PROPERTIES).toContain('priority');
      expect(SERVICE_REQUEST_SORT_PROPERTIES).toContain('status');
      expect(SERVICE_REQUEST_SORT_PROPERTIES).toContain('requestNumber');
      expect(SERVICE_REQUEST_SORT_PROPERTIES).toContain('title');
    });
  });

  describe('Entity & DTO Runtime Type Guards', () => {
    const validCategory: ServiceCategoryResponse = {
      id: 'cat-1',
      parentId: null,
      code: 'IT_SUPPORT',
      name: 'Hỗ trợ CNTT',
      description: 'Hỗ trợ phần cứng và phần mềm',
      defaultPriority: 'MEDIUM',
      active: true,
      createdAt: '2026-10-21T08:00:00Z',
      updatedAt: null,
      version: 1,
    };

    const validSummary: ServiceRequestSummaryResponse = {
      id: 'sr-1',
      requestNumber: 'SR-202610-0001',
      categoryId: 'cat-1',
      categoryName: 'Hỗ trợ CNTT',
      requesterId: 'usr-1',
      requesterName: 'Nguyễn Văn A',
      assigneeId: 'usr-2',
      assigneeName: 'Trần Văn B',
      title: 'Hỏng bàn phím máy tính',
      priority: 'HIGH',
      status: 'OPEN',
      createdAt: '2026-10-21T08:30:00Z',
      updatedAt: null,
    };

    const validAttachment: ServiceAttachmentResponse = {
      fileId: 'file-1',
      originalName: 'photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1048576,
      downloadUrl: '/api/v1/files/file-1/download',
      uploadedBy: 'usr-1',
      createdAt: '2026-10-21T08:30:00Z',
    };

    const validComment: ServiceCommentResponse = {
      id: 'cmt-1',
      requestId: 'sr-1',
      authorId: 'usr-1',
      authorName: 'Nguyễn Văn A',
      content: 'Đã gửi ảnh chụp phím bị kẹt',
      isInternal: false,
      isEdited: false,
      editedAt: null,
      createdAt: '2026-10-21T08:35:00Z',
      updatedAt: null,
    };

    const validHistory: ServiceStatusHistoryResponse = {
      id: 'hist-1',
      requestId: 'sr-1',
      fromStatus: null,
      toStatus: 'OPEN',
      comment: 'Tạo mới yêu cầu',
      changedBy: 'usr-1',
      changedByName: 'Nguyễn Văn A',
      changedAt: '2026-10-21T08:30:00Z',
    };

    const validRating: ServiceRatingResponse = {
      id: 'rate-1',
      requestId: 'sr-1',
      ratedBy: 'usr-1',
      ratedByName: 'Nguyễn Văn A',
      score: 5,
      comment: 'Xử lý rất nhanh và nhiệt tình',
      createdAt: '2026-10-21T10:00:00Z',
    };

    const validDetail: ServiceRequestDetailResponse = {
      id: 'sr-1',
      requestNumber: 'SR-202610-0001',
      category: {
        id: 'cat-1',
        code: 'IT_SUPPORT',
        name: 'Hỗ trợ CNTT',
      },
      requester: {
        id: 'usr-1',
        fullName: 'Nguyễn Văn A',
        email: 'vana@worksphere.vn',
      },
      assignee: {
        assignmentId: 'asg-1',
        id: 'usr-2',
        fullName: 'Trần Văn B',
        email: 'vanb@worksphere.vn',
        assignedAt: '2026-10-21T08:45:00Z',
      },
      asset: {
        id: 'ast-1',
        assetCode: 'AST-001',
        name: 'Laptop Dell Latitude 7420',
      },
      title: 'Hỏng bàn phím máy tính',
      description: 'Phím cách và phím Enter bị kẹt không gõ được',
      priority: 'HIGH',
      status: 'ASSIGNED',
      resolvedAt: null,
      closedAt: null,
      cancelledAt: null,
      attachments: [validAttachment],
      comments: [validComment],
      histories: [validHistory],
      rating: null,
      allowedActions: ['UPDATE', 'CANCEL', 'COMMENT'],
      createdAt: '2026-10-21T08:30:00Z',
      updatedAt: '2026-10-21T08:45:00Z',
      version: 2,
    };

    it('validates ServiceCategoryResponse and list guard', () => {
      expect(isServiceCategoryResponse(validCategory)).toBe(true);
      expect(isServiceCategoryList([validCategory])).toBe(true);
      expect(isServiceCategoryList([])).toBe(true);

      expect(isServiceCategoryResponse({ ...validCategory, code: undefined })).toBe(false);
      expect(isServiceCategoryResponse({ ...validCategory, defaultPriority: 'INVALID' })).toBe(false);
      expect(isServiceCategoryList([validCategory, { invalid: true }])).toBe(false);
      expect(isServiceCategoryList(null)).toBe(false);
    });

    it('validates ServiceRequestSummaryResponse and PagedData guard', () => {
      expect(isServiceRequestSummary(validSummary)).toBe(true);

      const pagedData: PagedData<ServiceRequestSummaryResponse> = {
        items: [validSummary],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      expect(isServiceRequestSummaryPage(pagedData)).toBe(true);
      expect(isServiceRequestSummary({ ...validSummary, status: 'INVALID_STATUS' })).toBe(false);
      expect(isServiceRequestSummaryPage({ ...pagedData, items: [{ bad: true }] })).toBe(false);
      expect(isServiceRequestSummaryPage(null)).toBe(false);
    });

    it('validates CreateServiceRequestResponse guard', () => {
      expect(isCreateServiceRequestResponse({
        id: 'sr-1',
        requestNumber: 'SR-202610-0001',
        status: 'OPEN',
      })).toBe(true);

      expect(isCreateServiceRequestResponse({
        id: 'sr-1',
        requestNumber: 'SR-202610-0001',
        status: 'UNKNOWN',
      })).toBe(false);
      expect(isCreateServiceRequestResponse(null)).toBe(false);
    });

    it('validates ServiceAttachmentResponse guard', () => {
      expect(isServiceAttachmentResponse(validAttachment)).toBe(true);
      expect(isServiceAttachmentResponse({ ...validAttachment, sizeBytes: '1024' })).toBe(false);
      expect(isServiceAttachmentResponse(null)).toBe(false);
    });

    it('validates ServiceCommentResponse and PagedData guard', () => {
      expect(isServiceCommentResponse(validComment)).toBe(true);

      const pagedComments: PagedData<ServiceCommentResponse> = {
        items: [validComment],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      expect(isServiceCommentPage(pagedComments)).toBe(true);
      expect(isServiceCommentResponse({ ...validComment, isInternal: 'no' })).toBe(false);
      expect(isServiceCommentPage({ ...pagedComments, items: null })).toBe(false);
    });

    it('validates ServiceStatusHistoryResponse guard', () => {
      expect(isServiceStatusHistoryResponse(validHistory)).toBe(true);
      expect(isServiceStatusHistoryResponse({ ...validHistory, toStatus: 'INVALID' })).toBe(false);
      expect(isServiceStatusHistoryResponse(null)).toBe(false);
    });

    it('validates ServiceRatingResponse guard', () => {
      expect(isServiceRatingResponse(validRating)).toBe(true);
      expect(isServiceRatingResponse({ ...validRating, score: 'five' })).toBe(false);
      expect(isServiceRatingResponse(null)).toBe(false);
    });

    it('validates ServiceRequestDetailResponse guard including nullable projections', () => {
      expect(isServiceRequestDetail(validDetail)).toBe(true);

      // Nullable assignee, asset, rating
      const detailWithNulls: ServiceRequestDetailResponse = {
        ...validDetail,
        assignee: null,
        asset: null,
        rating: null,
      };
      expect(isServiceRequestDetail(detailWithNulls)).toBe(true);

      // Detail with rating populated
      const detailWithRating: ServiceRequestDetailResponse = {
        ...validDetail,
        rating: validRating,
      };
      expect(isServiceRequestDetail(detailWithRating)).toBe(true);

      // Invalid category
      expect(isServiceRequestDetail({ ...validDetail, category: { code: 'bad' } })).toBe(false);
      // Invalid requester
      expect(isServiceRequestDetail({ ...validDetail, requester: null })).toBe(false);
      // Invalid assignee
      expect(isServiceRequestDetail({ ...validDetail, assignee: { id: 'usr-1' } })).toBe(false);
      // Invalid asset
      expect(isServiceRequestDetail({ ...validDetail, asset: { id: 'ast-1' } })).toBe(false);
      // Invalid rating
      expect(isServiceRequestDetail({ ...validDetail, rating: { score: 'five' } })).toBe(false);
      // Invalid attachment inside array
      expect(isServiceRequestDetail({ ...validDetail, attachments: [{ fileId: 123 }] })).toBe(false);
      // Non-object
      expect(isServiceRequestDetail(null)).toBe(false);
      expect(isServiceRequestDetail('string')).toBe(false);
    });
  });
});
