import { http } from '../../src/shared/api/apiClient';
import { workspaceApi, Work, Ticket } from '../../src/features/workspace/api';
jest.mock('../../src/shared/api/apiClient', () => ({
  http: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

describe('mobile shares server workflow contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (http.post as jest.Mock).mockResolvedValue({ id: 'result' });
  });
  test('work command carries the current version and handover review, never resets progress implicitly', async () => {
    await workspaceApi.command(
      { id: 'w', version: 7 } as Work,
      'ACCEPT_HANDOVER',
      'Kiểm tra phần Lan đã làm',
    );
    expect(http.post).toHaveBeenCalledWith(
      '/workplace/work/w/commands',
      expect.objectContaining({
        version: 7,
        action: 'ACCEPT_HANDOVER',
        content: 'Kiểm tra phần Lan đã làm',
        progress: undefined,
      }),
    );
  });
  test('QR punch never submits a user ID, client clock or approval', async () => {
    await workspaceApi.punch('nonce', 'IN');
    expect(http.post).toHaveBeenCalledWith('/workplace/attendance/punches', {
      token: 'nonce',
      type: 'IN',
    });
  });
  test('personal salary uses the minimal personal endpoint, not the specialist payroll list', async () => {
    (http.get as jest.Mock).mockResolvedValue([]);
    await workspaceApi.incomes('2026-10');
    expect(http.get).toHaveBeenCalledWith('/workplace/time/incomes/mine', {
      params: { period: '2026-10' },
    });
  });
  test('support confirmation and rejection preserve independent server version checks', async () => {
    const ticket = { id: 'r', version: 4 } as Ticket;
    await workspaceApi.ticketAction(ticket, 'CONFIRM', 'Đã kiểm tra');
    expect(http.put).toHaveBeenCalledWith('/service-requests/r/status', {
      status: 'CLOSED',
      comment: 'Đã kiểm tra',
      version: 4,
    });
    await workspaceApi.ticketAction(ticket, 'REJECT_RESOLUTION', 'Vẫn lỗi');
    expect(http.post).toHaveBeenLastCalledWith(
      '/service-requests/r/reject-resolution',
      { reason: 'Vẫn lỗi', version: 4 },
    );
  });
  test('unsupported workflow actions cannot accidentally send an undefined state', async () => {
    await expect(
      workspaceApi.ticketAction(
        { id: 'r', version: 1 } as Ticket,
        'TRANSFER',
        'reason',
      ),
    ).rejects.toThrow('web');
    expect(http.post).not.toHaveBeenCalled();
    expect(http.put).not.toHaveBeenCalled();
  });
});
