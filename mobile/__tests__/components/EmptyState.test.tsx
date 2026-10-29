import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../../src/shared/components/EmptyState';
import { renderWithProviders } from '../test-utils';

describe('EmptyState Component', () => {
  test('renders title and description properly', async () => {
    const { getByText, getByRole } = await renderWithProviders(
      <EmptyState
        title="Chưa có dự án nào"
        description="Bấm nút bên dưới để tạo dự án đầu tiên của bạn"
      />
    );

    expect(getByText('Chưa có dự án nào')).toBeTruthy();
    expect(getByText('Bấm nút bên dưới để tạo dự án đầu tiên của bạn')).toBeTruthy();
    expect(getByRole('header')).toBeTruthy();
  });

  test('calls onAction callback when action button is pressed', async () => {
    const handleAction = jest.fn();
    const { getByText, getByRole } = await renderWithProviders(
      <EmptyState
        title="Không tìm thấy kết quả"
        description="Thử tìm kiếm với từ khóa khác"
        actionTitle="Tạo mới"
        onAction={handleAction}
      />
    );

    expect(getByText('Tạo mới')).toBeTruthy();
    fireEvent.press(getByRole('button'));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  test('does not render button when actionTitle or onAction is missing', async () => {
    const { queryByRole } = await renderWithProviders(
      <EmptyState
        title="Trống"
        description="Không có dữ liệu"
      />
    );

    expect(queryByRole('button')).toBeNull();
  });
});
