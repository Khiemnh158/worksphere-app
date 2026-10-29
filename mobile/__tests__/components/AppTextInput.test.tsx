import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { AppTextInput } from '../../src/shared/components/AppTextInput';
import { renderWithProviders } from '../test-utils';

describe('AppTextInput Component', () => {
  test('renders label, placeholder, and helper text', async () => {
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <AppTextInput
        label="Email công ty"
        placeholder="user@worksphere.vn"
        helperText="Nhập email do công ty cấp"
      />
    );

    expect(getByText('Email công ty')).toBeTruthy();
    expect(getByPlaceholderText('user@worksphere.vn')).toBeTruthy();
    expect(getByText('Nhập email do công ty cấp')).toBeTruthy();
  });

  test('calls onChangeText when user types', async () => {
    const handleChangeText = jest.fn();
    const { getByPlaceholderText } = await renderWithProviders(
      <AppTextInput
        label="Họ và tên"
        placeholder="Nguyễn Văn A"
        onChangeText={handleChangeText}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Nguyễn Văn A'), 'Trần Thị B');
    expect(handleChangeText).toHaveBeenCalledWith('Trần Thị B');
  });

  test('shows error message with precedence over helperText', async () => {
    const { getByText, queryByText } = await renderWithProviders(
      <AppTextInput
        label="Mật khẩu"
        helperText="Tối thiểu 8 ký tự"
        error="Mật khẩu không được để trống"
      />
    );

    expect(getByText('Mật khẩu không được để trống')).toBeTruthy();
    expect(queryByText('Tối thiểu 8 ký tự')).toBeNull();
  });

  test('handles disabled state properly', async () => {
    const { getByPlaceholderText } = await renderWithProviders(
      <AppTextInput
        label="Mã định danh"
        placeholder="ID-001"
        disabled={true}
      />
    );

    const input = getByPlaceholderText('ID-001');
    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState).toEqual({ disabled: true });
  });

  test('renders required asterisk when required is true', async () => {
    const { getByText } = await renderWithProviders(
      <AppTextInput
        label="Tên dự án"
        required={true}
      />
    );

    expect(getByText(' *')).toBeTruthy();
  });
});
