import React from 'react';
import { StatusBadge } from '../../src/shared/components/StatusBadge';
import { renderWithProviders } from '../test-utils';

describe('StatusBadge Component', () => {
  test('renders canonical active / in_progress status with correct text', async () => {
    const { getByText } = await renderWithProviders(
      <StatusBadge status="ACTIVE" />
    );

    expect(getByText('Đang thực hiện')).toBeTruthy();
  });

  test('renders canonical draft status with info mapping', async () => {
    const { getByText } = await renderWithProviders(
      <StatusBadge status="DRAFT" />
    );

    expect(getByText('Bản nháp')).toBeTruthy();
  });

  test('renders canonical on_hold / waiting status with warning mapping', async () => {
    const { getByText } = await renderWithProviders(
      <StatusBadge status="ON_HOLD" />
    );

    expect(getByText('Tạm dừng')).toBeTruthy();
  });

  test('renders canonical completed and cancelled statuses', async () => {
    const { getByText: getCompleted } = await renderWithProviders(
      <StatusBadge status="COMPLETED" />
    );
    expect(getCompleted('Hoàn thành')).toBeTruthy();

    const { getByText: getCancelled } = await renderWithProviders(
      <StatusBadge status="CANCELLED" />
    );
    expect(getCancelled('Đã hủy')).toBeTruthy();
  });

  test('renders canonical task statuses (TODO and IN_REVIEW) with correct labels', async () => {
    const { getByText: getTodo } = await renderWithProviders(
      <StatusBadge status="TODO" type="task" />
    );
    expect(getTodo('Cần làm')).toBeTruthy();

    const { getByText: getInReview } = await renderWithProviders(
      <StatusBadge status="IN_REVIEW" type="task" />
    );
    expect(getInReview('Đang kiểm tra')).toBeTruthy();
  });

  test('renders canonical serviceRequest statuses (all 7 states) with correct labels', async () => {
    const { getByText: getOpen } = await renderWithProviders(
      <StatusBadge status="OPEN" type="serviceRequest" />
    );
    expect(getOpen('Mở')).toBeTruthy();

    const { getByText: getAssigned } = await renderWithProviders(
      <StatusBadge status="ASSIGNED" type="serviceRequest" />
    );
    expect(getAssigned('Đã phân công')).toBeTruthy();

    const { getByText: getInProgress } = await renderWithProviders(
      <StatusBadge status="IN_PROGRESS" type="serviceRequest" />
    );
    expect(getInProgress('Đang xử lý')).toBeTruthy();

    const { getByText: getWaiting } = await renderWithProviders(
      <StatusBadge status="WAITING_FOR_USER" type="serviceRequest" />
    );
    expect(getWaiting('Chờ phản hồi')).toBeTruthy();

    const { getByText: getResolved } = await renderWithProviders(
      <StatusBadge status="RESOLVED" type="serviceRequest" />
    );
    expect(getResolved('Đã giải quyết')).toBeTruthy();

    const { getByText: getClosed } = await renderWithProviders(
      <StatusBadge status="CLOSED" type="serviceRequest" />
    );
    expect(getClosed('Đã đóng')).toBeTruthy();

    const { getByText: getCancelled } = await renderWithProviders(
      <StatusBadge status="CANCELLED" type="serviceRequest" />
    );
    expect(getCancelled('Đã hủy')).toBeTruthy();
  });

  test('renders canonical ASSIGNED status without type override as "Đã phân công"', async () => {
    const { getByText } = await renderWithProviders(
      <StatusBadge status="ASSIGNED" />
    );
    expect(getByText('Đã phân công')).toBeTruthy();
  });

  test('supports custom label override and unknown status fallback', async () => {
    const { getByText: getCustom } = await renderWithProviders(
      <StatusBadge status="ACTIVE" label="Tùy biến" />
    );
    expect(getCustom('Tùy biến')).toBeTruthy();

    const { getByText: getUnknown } = await renderWithProviders(
      <StatusBadge status="UNKNOWN_STATE" />
    );
    expect(getUnknown('UNKNOWN_STATE')).toBeTruthy();
  });
});
