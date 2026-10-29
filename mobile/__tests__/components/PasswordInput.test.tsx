import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { PasswordInput } from '../../src/shared/components/PasswordInput';
import { renderWithProviders } from '../test-utils';

describe('PasswordInput Component', () => {
  test('has secureTextEntry enabled by default and shows "Hiện" toggle', async () => {
    const { getByPlaceholderText, getByRole, getByText } = await renderWithProviders(
      <PasswordInput
        label="Mật khẩu"
        placeholder="Nhập mật khẩu..."
      />
    );

    const input = getByPlaceholderText('Nhập mật khẩu...');
    expect(input.props.secureTextEntry).toBe(true);

    const toggleButton = getByRole('button');
    expect(toggleButton.props.accessibilityLabel).toBe('Hiện mật khẩu');
    expect(getByText('Hiện')).toBeTruthy();
  });

  test('toggles visibility and updates accessibilityLabel when toggle pressed', async () => {
    const { getByPlaceholderText, getByRole, getByText } = await renderWithProviders(
      <PasswordInput
        label="Mật khẩu"
        placeholder="Nhập mật khẩu..."
      />
    );

    const toggleButton = getByRole('button');

    // Toggle to visible
    fireEvent.press(toggleButton);
    await waitFor(() => {
      expect(getByPlaceholderText('Nhập mật khẩu...').props.secureTextEntry).toBe(false);
      expect(getByRole('button').props.accessibilityLabel).toBe('Ẩn mật khẩu');
      expect(getByText('Ẩn')).toBeTruthy();
    });

    // Toggle back to secure
    fireEvent.press(getByRole('button'));
    await waitFor(() => {
      expect(getByPlaceholderText('Nhập mật khẩu...').props.secureTextEntry).toBe(true);
      expect(getByRole('button').props.accessibilityLabel).toBe('Hiện mật khẩu');
      expect(getByText('Hiện')).toBeTruthy();
    });
  });

  test('forwards error and onChangeText callbacks', async () => {
    const handleChangeText = jest.fn();
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <PasswordInput
        label="Mật khẩu mới"
        placeholder="Nhập..."
        onChangeText={handleChangeText}
        error="Mật khẩu quá ngắn"
      />
    );

    expect(getByText('Mật khẩu quá ngắn')).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText('Nhập...'), 'Secret123!');
    expect(handleChangeText).toHaveBeenCalledWith('Secret123!');
  });
});
