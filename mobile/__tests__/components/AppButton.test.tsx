import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { AppButton } from '../../src/shared/components/AppButton';
import { renderWithProviders } from '../test-utils';

describe('AppButton Component', () => {
  test('renders button label correctly', async () => {
    const { getByText, getByRole } = await renderWithProviders(
      <AppButton title="Lưu thông tin" onPress={jest.fn()} />
    );

    expect(getByText('Lưu thông tin')).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
  });

  test('calls onPress callback when pressed in normal state', async () => {
    const handlePress = jest.fn();
    const { getByRole } = await renderWithProviders(
      <AppButton title="Đăng nhập" onPress={handlePress} />
    );

    fireEvent.press(getByRole('button'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  test('does not trigger onPress when disabled', async () => {
    const handlePress = jest.fn();
    const { getByRole } = await renderWithProviders(
      <AppButton title="Tiếp tục" onPress={handlePress} disabled={true} />
    );

    const button = getByRole('button');
    fireEvent.press(button);
    expect(handlePress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false });
  });

  test('does not trigger onPress when loading and renders loading indicator', async () => {
    const handlePress = jest.fn();
    const { getByTestId, getByRole, queryByText } = await renderWithProviders(
      <AppButton
        title="Đang gửi..."
        onPress={handlePress}
        loading={true}
        testID="submit-btn"
      />
    );

    const button = getByRole('button');
    fireEvent.press(button);
    expect(handlePress).not.toHaveBeenCalled();
    expect(getByTestId('submit-btn-loading')).toBeTruthy();
    expect(queryByText('Đang gửi...')).toBeNull();
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  test('supports outline and danger variants', async () => {
    const { getByText: getOutline } = await renderWithProviders(
      <AppButton title="Hủy bỏ" variant="outline" onPress={jest.fn()} />
    );
    expect(getOutline('Hủy bỏ')).toBeTruthy();

    const { getByText: getDanger } = await renderWithProviders(
      <AppButton title="Xóa tài sản" variant="danger" onPress={jest.fn()} />
    );
    expect(getDanger('Xóa tài sản')).toBeTruthy();
  });

  test('preserves baseline touch target minHeight of 48dp against caller style override', async () => {
    const { getByRole } = await renderWithProviders(
      <AppButton
        title="Nút bấm nhỏ"
        onPress={jest.fn()}
        style={{ minHeight: 20 }}
      />
    );

    const button = getByRole('button');
    const flatStyle = StyleSheet.flatten(
      typeof button.props.style === 'function'
        ? button.props.style({ pressed: false })
        : button.props.style
    );
    expect(flatStyle.minHeight).toBe(48);
  });
});
