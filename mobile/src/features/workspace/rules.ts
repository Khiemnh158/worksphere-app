import type { Income, Work } from './api';

export const statusLabels: Record<string, string> = {
  ASSIGNED: 'Được giao',
  IN_PROGRESS: 'Đang thực hiện',
  REVIEW: 'Chờ nghiệm thu',
  COMPLETED: 'Hoàn tất',
  BLOCKED: 'Đang vướng',
  CANCELLED: 'Đã hủy',
  HANDOVER: 'Chờ rà soát bàn giao',
  OPEN: 'Mới gửi',
  WAITING_FOR_USER: 'Chờ bổ sung',
  RESOLVED: 'Chờ xác nhận',
  CLOSED: 'Đã đóng',
  REJECTED: 'Từ chối',
  PENDING: 'Chờ xét',
  APPROVED: 'Đã duyệt',
  CONFIRMED: 'Đã xác nhận',
  PUBLISHED: 'Đã phát hành',
  LOW: 'Thấp',
  MEDIUM: 'Bình thường',
  NORMAL: 'Ngày thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn',
  CRITICAL: 'Khẩn cấp',
  LEAVE_PAID: 'Nghỉ có lương',
  LEAVE_UNPAID: 'Nghỉ không lương',
  OVERTIME: 'Tăng ca',
  CORRECTION: 'Đề nghị sửa công',
  TIME_CORRECTION: 'Đề nghị sửa công',
};
export const actionLabels: Record<string, string> = {
  START: 'Bắt đầu',
  PROGRESS: 'Cập nhật tiến độ',
  BLOCK: 'Báo vướng mắc',
  RESUME: 'Tiếp tục thực hiện',
  SUBMIT: 'Gửi nghiệm thu',
  APPROVE: 'Nghiệm thu',
  RETURN: 'Yêu cầu làm lại',
  COMMENT: 'Trao đổi',
  ACCEPT_HANDOVER: 'Rà soát và tiếp nhận',
  HANDOVER: 'Bàn giao',
  CANCEL: 'Hủy công việc',
  ASSIGN: 'Phân công',
  WAIT_FOR_USER: 'Yêu cầu bổ sung',
  RESOLVE: 'Báo kết quả',
  CONFIRM: 'Xác nhận đã xử lý',
  REJECT_RESOLUTION: 'Chưa đạt, cần xử lý lại',
};
export const ticketActionLabels: Record<string, string> = {
  ...actionLabels,
  CANCEL: 'Hủy yêu cầu',
};
export function parseAttendanceQr(value: string): string {
  const match = /^worksphere-attendance:([A-Za-z0-9_-]{43})$/.exec(
    value.trim(),
  );
  if (!match)
    throw new Error(
      'Đây không phải QR chấm công WorkSphere. Hãy quét mã tại điểm chấm công.',
    );
  return match[1];
}
export function ownPublishedIncomes(rows: Income[], userId: string): Income[] {
  return rows.filter(
    row => row.user_id === userId && row.approval_state === 'PUBLISHED',
  );
}
export function personalWorks(rows: Work[], userId: string): Work[] {
  return rows.filter(row => row.assignee_id === userId);
}
export function localDay(date = new Date()): string {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
export function currentMonth() {
  return localDay().slice(0, 7);
}
export function validLocalDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00+07:00`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function dateTime(value?: string | null) {
  if (!value) return 'Chưa đặt';
  return new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}
export function label(value: string) {
  return statusLabels[value] ?? value;
}
export function money(value?: number) {
  return value === undefined
    ? 'Chưa có'
    : `${Number(value).toLocaleString('vi-VN')} đ`;
}
