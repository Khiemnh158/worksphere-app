import { http } from '../../shared/api/apiClient';

export interface Person {
  id: string;
  full_name: string;
  department_id?: string;
  status?: string;
  email?: string;
  job_title?: string;
  is_manager?: boolean;
}
export interface Department {
  id: string;
  name: string;
  manager_id?: string;
  manager_name?: string;
}
export interface Category {
  id: string;
  name: string;
  department_name: string;
  receiving_department_id: string;
}
export interface WorkplaceContext {
  admin: boolean;
  executive: boolean;
  capabilities: string[];
  user: Person & {
    username: string;
    employee_code?: string;
    department_name?: string;
    email: string;
  };
  managedDepartments: string[];
  timeDepartments: string[];
  supportDepartments: string[];
  people: Person[];
  departments: Department[];
  categories: Category[];
}
export interface Work {
  id: string;
  title: string;
  description: string;
  department_id: string;
  department_name: string;
  status: string;
  priority: string;
  progress: number;
  due_at: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  reviewer_id: string;
  reviewer_name: string;
  version: number;
  allowedActions?: string[];
  events?: WorkEvent[];
  attachments?: Attachment[];
  handovers?: {
    id: string;
    from_name: string;
    to_name: string;
    review_note: string | null;
    progress_snapshot: number;
    accepted_at: string | null;
  }[];
}
export interface WorkEvent {
  id: string;
  actor_name: string;
  content: string;
  action: string;
  created_at: string;
}
export interface Attachment {
  id: string;
  original_name?: string;
  originalName?: string;
  size_bytes?: number;
}
export interface Page<T> {
  items: T[];
  page: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
export interface TicketRow {
  id: string;
  request_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category_name: string;
  department_name: string;
  assignee_name?: string;
}
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export const ticketPriorities: TicketPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requestNumber: string;
  version: number;
  receivingDepartmentId: string;
  category: { id: string; name: string };
  requester: { id: string; fullName: string };
  assignee?: { id: string; fullName: string };
  allowedActions: string[];
  comments: {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
  histories: {
    id?: string;
    comment: string;
    toStatus: string;
    changedByName: string;
    changedAt: string;
  }[];
  attachments: Attachment[];
}
export type PunchAction = 'IN' | 'OUT' | 'OT_IN' | 'OT_OUT';
export interface PunchRow {
  id: string;
  user_id: string;
  full_name?: string;
  punch_type: PunchAction;
  recorded_at: string;
  network_status: string;
  station_name?: string;
}
export interface AttendanceToday {
  lateMinutes?: number;
  earlyMinutes?: number;
  status: string;
  serverTime: string;
  workDate: string;
  message: string;
  actions: PunchAction[];
  punches: PunchRow[];
  calendar: {
    shift_start: string;
    shift_end: string;
    break_start?: string;
    break_end?: string;
  } | null;
}
export interface TimeRow {
  id: string;
  user_id: string;
  full_name?: string;
  work_date: string;
  status: string;
  version: number;
  regular_minutes?: number;
  request_type?: string;
  reason?: string;
  requested_minutes?: number;
  actual_minutes?: number;
  canReview?: boolean;
  clock_in?: string;
  clock_out?: string;
  late_minutes?: number;
  early_minutes?: number;
  network_review_required?: boolean;
  exception_reason?: string;
  approval_mode?: string;
}
export interface TimeOverview {
  today?: AttendanceToday;
  punches?: PunchRow[];
  attendance: TimeRow[];
  requests: TimeRow[];
  balances: { user_id: string; allowance_minutes: number }[];
}
export interface Income {
  id: string;
  user_id: string;
  period: string;
  approval_state: string;
  monthly_salary: number;
  calculation: {
    ready: boolean;
    grossEstimate?: number;
    basePay?: number;
    overtimePay?: number;
    paidMinutes?: number;
    overtimeMinutes?: number;
    standardMinutes?: number;
    message?: string;
  };
  adjustments: { id: string; status: string; amount: number; reason: string }[];
}
export interface Notice {
  id: string;
  title: string;
  read_at: string | null;
  created_at: string;
  reference_type?: string;
  reference_id?: string;
}
export interface Directory {
  items: Person[];
  total: number;
  page: number;
  pageSize: number;
  contacts: { id: string; name: string; department_name: string }[];
}

async function required<T>(value: Promise<T | null>): Promise<T> {
  const result = await value;
  if (result === null)
    throw new Error('Máy chủ chưa trả dữ liệu. Vui lòng thử lại.');
  return result;
}
export const workspaceApi = {
  context: () => required(http.get<WorkplaceContext>('/workplace/context')),
  work: () => required(http.get<Work[]>('/workplace/work')),
  workDetail: (id: string) => required(http.get<Work>(`/workplace/work/${id}`)),
  command: (
    work: Work,
    action: string,
    content: string,
    progress?: number,
    userId?: string,
    fileIds?: string[],
  ) =>
    required(
      http.post<object, Work>(`/workplace/work/${work.id}/commands`, {
        version: work.version,
        action,
        content,
        progress,
        userId,
        fileIds,
      }),
    ),
  tickets: (scope: string, page: number, search = '') =>
    required(
      http.get<Page<TicketRow>>('/workplace/requests', {
        params: { scope, page, search },
      }),
    ),
  ticket: (id: string) => required(http.get<Ticket>(`/service-requests/${id}`)),
  createTicket: (
    categoryId: string,
    title: string,
    description: string,
    priority: TicketPriority,
    attachmentFileIds: string[],
  ) =>
    required(
      http.post<object, { id: string }>('/service-requests', {
        categoryId,
        title,
        description,
        priority,
        attachmentFileIds,
      }),
    ),
  ticketComment: (id: string, content: string, attachmentFileIds: string[]) =>
    http.post(`/service-requests/${id}/comments`, {
      content,
      attachmentFileIds,
      isInternal: false,
    }),
  ticketAction: async (
    r: Ticket,
    action: string,
    content: string,
    assigneeId?: string,
  ) => {
    if (action === 'ASSIGN')
      return http.post(`/service-requests/${r.id}/assignments`, {
        assigneeId,
        version: r.version,
      });
    if (action === 'REJECT_RESOLUTION')
      return http.post(`/service-requests/${r.id}/reject-resolution`, {
        reason: content,
        version: r.version,
      });
    const status = (
      {
        START: 'IN_PROGRESS',
        WAIT_FOR_USER: 'WAITING_FOR_USER',
        RESUME: 'IN_PROGRESS',
        RESOLVE: 'RESOLVED',
        CONFIRM: 'CLOSED',
        CANCEL: 'CANCELLED',
      } as Record<string, string>
    )[action];
    if (!status) throw new Error('Thao tác này cần màn điều phối trên web.');
    return http.put(`/service-requests/${r.id}/status`, {
      status,
      comment: content,
      version: r.version,
    });
  },
  time: (period: string) =>
    required(http.get<TimeOverview>('/workplace/time', { params: { period } })),
  timeRequest: (
    requestType: string,
    workDate: string,
    requestedMinutes: number,
    reason: string,
    startsAt?: string,
    endsAt?: string,
    exceptionReason?: string,
  ) =>
    http.post('/workplace/time/requests', {
      requestType,
      workDate,
      requestedMinutes,
      reason,
      startsAt,
      endsAt,
      exceptionReason: exceptionReason || null,
    }),
  reviewTime: (
    row: TimeRow,
    record: boolean,
    action: string,
    reason: string,
    actualMinutes?: number,
    acknowledgeNetwork = false,
    exceptionReason?: string,
  ) =>
    http.post(
      `/workplace/time/${record ? 'records' : 'requests'}/${row.id}/review`,
      {
        version: row.version,
        action,
        reason,
        actualMinutes,
        acknowledgeNetwork,
        exceptionReason: exceptionReason || null,
      },
    ),
  punch: (token: string, type: PunchAction, generation?: number) =>
    required(
      http.post<object, { message: string; recordedAt: string; type: string }>(
        '/workplace/attendance/punches',
        { token, type },
        ...(generation === undefined
          ? []
          : [{ _sessionGeneration: generation }]),
      ),
    ),
  incomes: (period: string) =>
    required(
      http.get<Income[]>('/workplace/time/incomes/mine', {
        params: { period },
      }),
    ),
  notices: () => required(http.get<Notice[]>('/workplace/notices')),
  readNotice: (id: string) => http.put(`/workplace/notices/${id}/read`),
  directory: (page: number, search: string) =>
    required(
      http.get<Directory>('/workplace/directory', { params: { page, search } }),
    ),
};
