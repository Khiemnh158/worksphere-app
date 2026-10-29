import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ConfirmationDialog } from '../../src/shared/components';
import * as SharedComponents from '../../src/shared/components';
import { renderWithProviders } from '../test-utils';

describe('ConfirmationDialog Component', () => {
  test('public API surface exports ConfirmationDialog and excludes ConfirmDialog alias', () => {
    expect(ConfirmationDialog).toBeDefined();
    expect(typeof ConfirmationDialog).toBe('function');
    expect((SharedComponents as Record<string, unknown>).ConfirmDialog).toBeUndefined();
  });
  test('renders title, message, and buttons when visible', async () => {
    const handleConfirm = jest.fn();
    const handleCancel = jest.fn();

    const { getByText, getByRole } = await renderWithProviders(
      <ConfirmationDialog
        visible={true}
        title="Xác nhận xóa dự án"
        message="Hành động này không thể hoàn tác. Bạn có chắc muốn tiếp tục?"
        confirmText="Xác nhận xóa"
        cancelText="Đóng"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDanger={true}
      />
    );

    expect(getByText('Xác nhận xóa dự án')).toBeTruthy();
    expect(getByText('Hành động này không thể hoàn tác. Bạn có chắc muốn tiếp tục?')).toBeTruthy();
    expect(getByText('Xác nhận xóa')).toBeTruthy();
    expect(getByText('Đóng')).toBeTruthy();
    expect(getByRole('alert')).toBeTruthy();
  });

  test('calls onConfirm callback when confirm button is pressed', async () => {
    const handleConfirm = jest.fn();
    const { getByText } = await renderWithProviders(
      <ConfirmationDialog
        visible={true}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất?"
        onConfirm={handleConfirm}
        onCancel={jest.fn()}
      />
    );

    fireEvent.press(getByText('Xác nhận'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel callback when cancel button is pressed', async () => {
    const handleCancel = jest.fn();
    const { getByText } = await renderWithProviders(
      <ConfirmationDialog
        visible={true}
        title="Hủy thao tác"
        message="Nội dung chưa lưu sẽ bị mất."
        onConfirm={jest.fn()}
        onCancel={handleCancel}
      />
    );

    fireEvent.press(getByText('Hủy'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  test('hidden when visible is false', async () => {
    const { queryByText } = await renderWithProviders(
      <ConfirmationDialog
        visible={false}
        title="Hộp thoại ẩn"
        message="Không được hiển thị"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(queryByText('Hộp thoại ẩn')).toBeNull();
  });
});
