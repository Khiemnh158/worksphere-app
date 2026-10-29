/**
 * Phase 16A: Mobile Service Request Types, Enums and Runtime Type Guards
 * Aligned with backend Service Request models, DTOs, and 06_API_CONTRACT.md section 13.
 * Follows Decision D-065 (Mobile Service Request Contract & Scope Freeze).
 */

import { PagedData } from '../../../shared/api';

// ==========================================
// 1. Core Domain Enums & Constants
// ==========================================

export type ServiceStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type ServicePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const SERVICE_STATUS_VALUES: readonly ServiceStatus[] = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
] as const;

export const SERVICE_PRIORITY_VALUES: readonly ServicePriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export const SERVICE_REQUEST_SORT_PROPERTIES = [
  'createdAt',
  'updatedAt',
  'priority',
  'status',
  'requestNumber',
  'title',
] as const;

export type ServiceRequestSortProperty = (typeof SERVICE_REQUEST_SORT_PROPERTIES)[number];
export type ServiceRequestSortDirection = 'asc' | 'desc';

export const KNOWN_SERVICE_REQUEST_ACTIONS = [
  'ASSIGN',
  'UPDATE',
  'CANCEL',
  'REJECT_RESOLUTION',
  'CONFIRM',
  'RATE',
  'START',
  'WAIT_FOR_USER',
  'RESOLVE',
  'RESUME',
  'COMMENT',
] as const;

export type KnownServiceRequestAction = (typeof KNOWN_SERVICE_REQUEST_ACTIONS)[number];

export function isKnownServiceRequestAction(action: string): action is KnownServiceRequestAction {
  return (KNOWN_SERVICE_REQUEST_ACTIONS as readonly string[]).includes(action);
}

export function hasServiceRequestAction(
  actions: string[] | undefined,
  action: KnownServiceRequestAction | string
): boolean {
  if (!actions || !Array.isArray(actions)) return false;
  return actions.includes(action);
}

// ==========================================
// 2. Sub-Entities & Brief Projections
// ==========================================

export interface ServiceCategoryBrief {
  id: string;
  code: string;
  name: string;
}

export interface ServiceUserBrief {
  id: string;
  fullName: string;
  email: string;
}

export interface ServiceAssigneeBrief {
  assignmentId: string;
  id: string;
  fullName: string;
  email: string;
  assignedAt: string;
}

export interface ServiceAssetBrief {
  id: string;
  assetCode: string;
  name: string;
}

// ==========================================
// 3. Response DTOs
// ==========================================

/**
 * Service Category Response
 * Matches com.worksphere.service_request.api.response.ServiceCategoryResponse
 */
export interface ServiceCategoryResponse {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  defaultPriority: ServicePriority;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
  version: number;
}

/**
 * Service Request Summary Response (for list screen SCR-SRV-01)
 * Matches com.worksphere.service_request.api.response.ServiceRequestSummaryResponse
 */
export interface ServiceRequestSummaryResponse {
  id: string;
  requestNumber: string;
  categoryId: string;
  categoryName: string;
  requesterId: string;
  requesterName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  title: string;
  priority: ServicePriority;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Create Service Request Response
 * Matches com.worksphere.service_request.api.response.CreateServiceRequestResponse
 */
export interface CreateServiceRequestResponse {
  id: string;
  requestNumber: string;
  status: ServiceStatus;
}

/**
 * Service Attachment Response
 * Matches com.worksphere.service_request.api.response.ServiceAttachmentResponse
 */
export interface ServiceAttachmentResponse {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  uploadedBy: string;
  createdAt: string;
}

/**
 * Service Comment Response
 * Matches com.worksphere.service_request.api.response.ServiceCommentResponse
 */
export interface ServiceCommentResponse {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  isEdited: boolean;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Service Status History Response
 * Matches com.worksphere.service_request.api.response.ServiceStatusHistoryResponse
 */
export interface ServiceStatusHistoryResponse {
  id: string;
  requestId: string;
  fromStatus: ServiceStatus | null;
  toStatus: ServiceStatus;
  comment: string | null;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}

/**
 * Service Rating Response
 * Matches com.worksphere.service_request.api.response.ServiceRatingResponse
 */
export interface ServiceRatingResponse {
  id: string;
  requestId: string;
  ratedBy: string;
  ratedByName: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

/**
 * Service Request Detail Response
 * Matches com.worksphere.service_request.api.response.ServiceRequestDetailResponse
 */
export interface ServiceRequestDetailResponse {
  id: string;
  requestNumber: string;
  category: ServiceCategoryBrief;
  requester: ServiceUserBrief;
  assignee: ServiceAssigneeBrief | null;
  asset: ServiceAssetBrief | null;
  title: string;
  description: string;
  priority: ServicePriority;
  status: ServiceStatus;
  resolvedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  attachments: ServiceAttachmentResponse[];
  comments: ServiceCommentResponse[];
  histories: ServiceStatusHistoryResponse[];
  rating: ServiceRatingResponse | null;
  allowedActions: string[];
  createdAt: string;
  updatedAt: string | null;
  version: number;
}

// ==========================================
// 4. Request DTOs
// ==========================================

export interface CreateServiceRequestRequest {
  categoryId: string;
  title: string;
  description: string;
  priority?: ServicePriority;
  assetId?: string;
  attachmentFileIds?: string[];
}

export interface UpdateServiceRequestRequest {
  categoryId?: string;
  title: string;
  description: string;
  priority?: ServicePriority;
  assetId?: string;
  version: number;
}

export interface AssignServiceRequestRequest {
  assigneeId: string;
}

export interface UpdateServiceRequestStatusRequest {
  status: ServiceStatus;
  comment?: string;
  version: number;
}

export interface RejectResolutionRequest {
  reason: string;
  version: number;
}

export interface CreateServiceCommentRequest {
  content: string;
  isInternal?: boolean;
  attachmentFileIds?: string[];
}

export interface CreateServiceRatingRequest {
  score: number;
  comment?: string;
}

// ==========================================
// 5. Query DTOs
// ==========================================

export interface ServiceRequestListQuery {
  categoryId?: string;
  requesterId?: string;
  assigneeId?: string;
  assetId?: string;
  status?: ServiceStatus;
  priority?: ServicePriority;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ServiceCommentListQuery {
  page?: number;
  size?: number;
  sort?: string;
}

// ==========================================
// 6. Runtime Type Guards
// ==========================================

export function isServiceStatus(value: unknown): value is ServiceStatus {
  return typeof value === 'string' && (SERVICE_STATUS_VALUES as readonly string[]).includes(value);
}

export function isServicePriority(value: unknown): value is ServicePriority {
  return typeof value === 'string' && (SERVICE_PRIORITY_VALUES as readonly string[]).includes(value);
}

export function isServiceCategoryResponse(value: unknown): value is ServiceCategoryResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === 'string' &&
    (v.parentId === null || typeof v.parentId === 'string') &&
    typeof v.code === 'string' &&
    typeof v.name === 'string' &&
    (v.description === null || typeof v.description === 'string') &&
    isServicePriority(v.defaultPriority) &&
    typeof v.active === 'boolean' &&
    typeof v.createdAt === 'string' &&
    (v.updatedAt === null || typeof v.updatedAt === 'string') &&
    typeof v.version === 'number'
  );
}

export function isServiceCategoryList(value: unknown): value is ServiceCategoryResponse[] {
  if (!Array.isArray(value)) return false;
  return value.every(isServiceCategoryResponse);
}

export function isServiceRequestSummary(value: unknown): value is ServiceRequestSummaryResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === 'string' &&
    typeof v.requestNumber === 'string' &&
    typeof v.categoryId === 'string' &&
    typeof v.categoryName === 'string' &&
    typeof v.requesterId === 'string' &&
    typeof v.requesterName === 'string' &&
    (v.assigneeId === null || typeof v.assigneeId === 'string') &&
    (v.assigneeName === null || typeof v.assigneeName === 'string') &&
    typeof v.title === 'string' &&
    isServicePriority(v.priority) &&
    isServiceStatus(v.status) &&
    typeof v.createdAt === 'string' &&
    (v.updatedAt === null || typeof v.updatedAt === 'string')
  );
}

export function isServiceRequestSummaryPage(
  value: unknown
): value is PagedData<ServiceRequestSummaryResponse> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v.page !== 'number' ||
    typeof v.size !== 'number' ||
    typeof v.totalItems !== 'number' ||
    typeof v.totalPages !== 'number' ||
    typeof v.hasNext !== 'boolean' ||
    typeof v.hasPrevious !== 'boolean' ||
    !Array.isArray(v.items)
  ) {
    return false;
  }

  return v.items.every(isServiceRequestSummary);
}

export function isCreateServiceRequestResponse(
  value: unknown
): value is CreateServiceRequestResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === 'string' &&
    typeof v.requestNumber === 'string' &&
    isServiceStatus(v.status)
  );
}

export function isServiceAttachmentResponse(value: unknown): value is ServiceAttachmentResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.fileId === 'string' &&
    typeof v.originalName === 'string' &&
    typeof v.mimeType === 'string' &&
    typeof v.sizeBytes === 'number' &&
    typeof v.downloadUrl === 'string' &&
    typeof v.uploadedBy === 'string' &&
    typeof v.createdAt === 'string'
  );
}

export function isServiceCommentResponse(value: unknown): value is ServiceCommentResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === 'string' &&
    typeof v.requestId === 'string' &&
    typeof v.authorId === 'string' &&
    typeof v.authorName === 'string' &&
    typeof v.content === 'string' &&
    typeof v.isInternal === 'boolean' &&
    typeof v.isEdited === 'boolean' &&
    (v.editedAt === null || typeof v.editedAt === 'string') &&
    typeof v.createdAt === 'string' &&
    (v.updatedAt === null || typeof v.updatedAt === 'string')
  );
}

export function isServiceCommentPage(
  value: unknown
): value is PagedData<ServiceCommentResponse> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v.page !== 'number' ||
    typeof v.size !== 'number' ||
    typeof v.totalItems !== 'number' ||
    typeof v.totalPages !== 'number' ||
    typeof v.hasNext !== 'boolean' ||
    typeof v.hasPrevious !== 'boolean' ||
    !Array.isArray(v.items)
  ) {
    return false;
  }

  return v.items.every(isServiceCommentResponse);
}

export function isServiceStatusHistoryResponse(
  value: unknown
): value is ServiceStatusHistoryResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === 'string' &&
    typeof v.requestId === 'string' &&
    (v.fromStatus === null || isServiceStatus(v.fromStatus)) &&
    isServiceStatus(v.toStatus) &&
    (v.comment === null || typeof v.comment === 'string') &&
    typeof v.changedBy === 'string' &&
    typeof v.changedByName === 'string' &&
    typeof v.changedAt === 'string'
  );
}

export function isServiceRatingResponse(value: unknown): value is ServiceRatingResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === 'string' &&
    typeof v.requestId === 'string' &&
    typeof v.ratedBy === 'string' &&
    typeof v.ratedByName === 'string' &&
    typeof v.score === 'number' &&
    (v.comment === null || typeof v.comment === 'string') &&
    typeof v.createdAt === 'string'
  );
}

export function isServiceRequestDetail(value: unknown): value is ServiceRequestDetailResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v.id !== 'string' ||
    typeof v.requestNumber !== 'string' ||
    typeof v.title !== 'string' ||
    typeof v.description !== 'string' ||
    !isServicePriority(v.priority) ||
    !isServiceStatus(v.status) ||
    (v.resolvedAt !== null && typeof v.resolvedAt !== 'string') ||
    (v.closedAt !== null && typeof v.closedAt !== 'string') ||
    (v.cancelledAt !== null && typeof v.cancelledAt !== 'string') ||
    !Array.isArray(v.attachments) ||
    !Array.isArray(v.comments) ||
    !Array.isArray(v.histories) ||
    !Array.isArray(v.allowedActions) ||
    typeof v.createdAt !== 'string' ||
    (v.updatedAt !== null && typeof v.updatedAt !== 'string') ||
    typeof v.version !== 'number'
  ) {
    return false;
  }

  // category check
  if (!v.category || typeof v.category !== 'object') return false;
  const cat = v.category as Record<string, unknown>;
  if (
    typeof cat.id !== 'string' ||
    typeof cat.code !== 'string' ||
    typeof cat.name !== 'string'
  ) {
    return false;
  }

  // requester check
  if (!v.requester || typeof v.requester !== 'object') return false;
  const req = v.requester as Record<string, unknown>;
  if (
    typeof req.id !== 'string' ||
    typeof req.fullName !== 'string' ||
    typeof req.email !== 'string'
  ) {
    return false;
  }

  // assignee check (nullable)
  if (v.assignee !== null) {
    if (typeof v.assignee !== 'object') return false;
    const ass = v.assignee as Record<string, unknown>;
    if (
      typeof ass.assignmentId !== 'string' ||
      typeof ass.id !== 'string' ||
      typeof ass.fullName !== 'string' ||
      typeof ass.email !== 'string' ||
      typeof ass.assignedAt !== 'string'
    ) {
      return false;
    }
  }

  // asset check (nullable)
  if (v.asset !== null) {
    if (typeof v.asset !== 'object') return false;
    const ast = v.asset as Record<string, unknown>;
    if (
      typeof ast.id !== 'string' ||
      typeof ast.assetCode !== 'string' ||
      typeof ast.name !== 'string'
    ) {
      return false;
    }
  }

  // rating check (nullable)
  if (v.rating !== null && !isServiceRatingResponse(v.rating)) {
    return false;
  }

  // arrays inner check
  if (!v.attachments.every(isServiceAttachmentResponse)) return false;
  if (!v.comments.every(isServiceCommentResponse)) return false;
  if (!v.histories.every(isServiceStatusHistoryResponse)) return false;
  if (!v.allowedActions.every(action => typeof action === 'string')) return false;

  return true;
}
