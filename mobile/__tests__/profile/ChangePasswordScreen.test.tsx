import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ChangePasswordScreen } from '../../src/features/profile/screens/ChangePasswordScreen';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
import { authApi } from '../../src/features/auth/api/authApi';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
  };
});

jest.mock('../../src/features/auth/api/authApi', () => ({
  authApi: {
    changePassword: jest.fn(),
  },
}));

describe('ChangePasswordScreen Component (SCR-ACC-02)', () => {
  async function renderChangePasswordScreen() {
    return await render(
      <ThemeProvider theme={theme}>
        <ChangePasswordScreen />
      </ThemeProvider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all inputs and buttons', async () => {
    const { getByTestId } = await renderChangePasswordScreen();

    expect(getByTestId('screen-change-password')).toBeTruthy();
    expect(getByTestId('input-current-password')).toBeTruthy();
    expect(getByTestId('input-new-password')).toBeTruthy();
    expect(getByTestId('input-confirm-password')).toBeTruthy();
    expect(getByTestId('btn-submit-change-password')).toBeTruthy();
    expect(getByTestId('btn-cancel-change-password')).toBeTruthy();
  });

  test('validates required fields on empty submit', async () => {
    const { getByTestId, getByText } = await renderChangePasswordScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-change-password'));
    });

    await waitFor(() => {
      expect(getByText('Vui lòng nhập mật khẩu hiện tại')).toBeTruthy();
      expect(getByText('Vui lòng nhập mật khẩu mới')).toBeTruthy();
      expect(getByText('Vui lòng xác nhận mật khẩu mới')).toBeTruthy();
    });

    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  test('validates new password min/max length (8-128 chars)', async () => {
    const { getByTestId, getByText } = await renderChangePasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-current-password'), 'oldpassword123');
      fireEvent.changeText(getByTestId('input-new-password'), 'short');
      fireEvent.changeText(getByTestId('input-confirm-password'), 'short');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-change-password'));
    });

    await waitFor(() => {
      expect(getByText('Mật khẩu phải có từ 8 đến 128 ký tự')).toBeTruthy();
    });

    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  test('validates new password must be different from current password', async () => {
    const { getByTestId, getByText } = await renderChangePasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-current-password'), 'password123');
      fireEvent.changeText(getByTestId('input-new-password'), 'password123');
      fireEvent.changeText(getByTestId('input-confirm-password'), 'password123');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-change-password'));
    });

    await waitFor(() => {
      expect(getByText('Mật khẩu mới không được trùng mật khẩu hiện tại')).toBeTruthy();
    });

    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  test('validates confirmation password mismatch', async () => {
    const { getByTestId, getByText } = await renderChangePasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-current-password'), 'oldpassword123');
      fireEvent.changeText(getByTestId('input-new-password'), 'newpassword123');
      fireEvent.changeText(getByTestId('input-confirm-password'), 'differentpassword123');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-change-password'));
    });

    await waitFor(() => {
      expect(getByText('Mật khẩu xác nhận không khớp')).toBeTruthy();
    });

    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  test('preserves password spaces (strict untrimmed invariant)', async () => {
    (authApi.changePassword as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = await renderChangePasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-current-password'), '  current password  ');
      fireEvent.changeText(getByTestId('input-new-password'), '  new password  ');
      fireEvent.changeText(getByTestId('input-confirm-password'), '  new password  ');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-change-password'));
    });

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith({
        currentPassword: '  current password  ',
        newPassword: '  new password  ',
        confirmPassword: '  new password  ',
      });
    });
  });

  test('submits successfully, clears inputs, displays success banner, and stays on screen', async () => {
    (authApi.changePassword as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId, getByText } = await renderChangePasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-current-password'), 'currentPass123');
      fireEvent.changeText(getByTestId('input-new-password'), 'newSecurePass456');
      fireEvent.changeText(getByTestId('input-confirm-password'), 'newSecurePass456');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-change-password'));
    });

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'currentPass123',
        newPassword: 'newSecurePass456',
        confirmPassword: 'newSecurePass456',
      });
      expect(getByText('Đổi mật khẩu thành công')).toBeTruthy();
    });

    // Inputs cleared
    expect(getByTestId('input-current-password').props.value).toBe('');
    expect(getByTestId('input-new-password').props.value).toBe('');
    expect(getByTestId('input-confirm-password').props.value).toBe('');
    // User remains on screen (session not revoked)
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  test('maps CURRENT_PASSWORD_INCORRECT backend error to currentPassword input', async () => {
    (authApi.changePassword as jest.Mock).mockRejectedValue({
      kind: 'VALIDATION_ERROR',
      status: 400,
      backendCode: 'CURRENT_PASSWORD_INCORRECT',
      message: 'Mật khẩu hiện tại không chính xác',
    });

    const { getByTestId, getByText } = await renderChangePasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-current-password'), 'wrongPass123');
      fireEvent.changeText(getByTestId('input-new-password'), 'newSecurePass456');
      fireEvent.changeText(getByTestId('input-confirm-password'), 'newSecurePass456');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-change-password'));
    });

    await waitFor(() => {
      expect(getByText('Mật khẩu hiện tại không chính xác')).toBeTruthy();
    });
  });

  test('maps NEW_PASSWORD_SAME_AS_CURRENT backend error to newPassword input', async () => {
    (authApi.changePassword as jest.Mock).mockRejectedValue({
      kind: 'VALIDATION_ERROR',
      status: 400,
      backendCode: 'NEW_PASSWORD_SAME_AS_CURRENT',
      message: 'Mật khẩu mới không được trùng mật khẩu hiện tại',
    });

    const { getByTestId, getByText } = await renderChangePasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-current-password'), 'currentPass123');
      fireEvent.changeText(getByTestId('input-new-password'), 'newSecurePass456');
      fireEvent.changeText(getByTestId('input-confirm-password'), 'newSecurePass456');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-change-password'));
    });

    await waitFor(() => {
      expect(getByText('Mật khẩu mới không được trùng mật khẩu hiện tại')).toBeTruthy();
    });
  });

  test('prevents duplicate submissions with lock ref', async () => {
    let resolvePromise: () => void = () => {};
    const pendingPromise = new Promise<void>(resolve => {
      resolvePromise = resolve;
    });
    (authApi.changePassword as jest.Mock).mockReturnValue(pendingPromise);

    const { getByTestId } = await renderChangePasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-current-password'), 'currentPass123');
      fireEvent.changeText(getByTestId('input-new-password'), 'newSecurePass456');
      fireEvent.changeText(getByTestId('input-confirm-password'), 'newSecurePass456');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-change-password'));
      fireEvent.press(getByTestId('btn-submit-change-password'));
      fireEvent.press(getByTestId('btn-submit-change-password'));
    });

    expect(authApi.changePassword).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise();
    });
  });
});
