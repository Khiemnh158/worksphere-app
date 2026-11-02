import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ResetPasswordScreen } from '../../src/features/auth/screens/ResetPasswordScreen';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
import { authApi } from '../../src/features/auth/api/authApi';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

const mockReset = jest.fn();
const mockNavigate = jest.fn();
let mockRouteParams: { token?: string } | undefined;

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
  };
});

jest.mock('../../src/features/auth/api/authApi', () => ({
  authApi: {
    resetPassword: jest.fn(),
  },
}));

describe('ResetPasswordScreen Component (KHÔI PHỤC TRUY CẬP)', () => {
  async function renderResetPasswordScreen() {
    return await render(
      <ThemeProvider theme={theme}>
        <ResetPasswordScreen />
      </ThemeProvider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = undefined;
  });

  test('renders manual token input when no route token is provided', async () => {
    mockRouteParams = undefined;

    const { getByTestId, getByText } = await renderResetPasswordScreen();

    expect(getByTestId('screen-reset-password')).toBeTruthy();
    expect(getByText('KHÔI PHỤC TRUY CẬP')).toBeTruthy();
    expect(getByTestId('input-reset-token')).toBeTruthy();
    expect(getByTestId('input-new-password')).toBeTruthy();
    expect(getByTestId('input-confirm-password')).toBeTruthy();
    expect(getByTestId('btn-submit-reset-password')).toBeTruthy();
    expect(getByTestId('btn-back-to-login-from-reset')).toBeTruthy();
  });

  test('hides manual token input when valid route token param is present', async () => {
    mockRouteParams = { token: 'synthetic-test-token-123' };

    const { getByTestId, queryByTestId } = await renderResetPasswordScreen();

    expect(getByTestId('screen-reset-password')).toBeTruthy();
    expect(queryByTestId('input-reset-token')).toBeNull();
    expect(getByTestId('input-new-password')).toBeTruthy();
    expect(getByTestId('input-confirm-password')).toBeTruthy();
  });

  test('validates required fields on empty submit', async () => {
    mockRouteParams = undefined;

    const { getByTestId, getByText } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(getByText('Mã xác thực không được để trống')).toBeTruthy();
      expect(getByText('Vui lòng nhập mật khẩu mới')).toBeTruthy();
      expect(getByText('Vui lòng xác nhận mật khẩu mới')).toBeTruthy();
    });

    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  test('rejects new password shorter than 12 characters', async () => {
    mockRouteParams = { token: 'synthetic-test-token-123' };

    const { getByTestId, getByText } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-new-password'), '12345678901'); // 11 chars
      fireEvent.changeText(
        getByTestId('input-confirm-password'),
        '12345678901',
      );
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(
        getByText('Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte UTF-8'),
      ).toBeTruthy();
    });

    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  test('accepts new password with exactly 12 characters', async () => {
    (authApi.resetPassword as jest.Mock).mockResolvedValue(undefined);
    mockRouteParams = { token: 'synthetic-test-token-123' };

    const { getByTestId } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-new-password'), '123456789012'); // 12 chars
      fireEvent.changeText(
        getByTestId('input-confirm-password'),
        '123456789012',
      );
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        resetToken: 'synthetic-test-token-123',
        newPassword: '123456789012',
        confirmPassword: '123456789012',
      });
    });
  });

  test('accepts new password with exactly 72 ASCII bytes', async () => {
    (authApi.resetPassword as jest.Mock).mockResolvedValue(undefined);
    mockRouteParams = { token: 'synthetic-test-token-123' };

    const valid72 = 'a'.repeat(72);
    const { getByTestId } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-new-password'), valid72);
      fireEvent.changeText(getByTestId('input-confirm-password'), valid72);
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        resetToken: 'synthetic-test-token-123',
        newPassword: valid72,
        confirmPassword: valid72,
      });
    });
  });

  test('rejects new password longer than 72 bytes (73 ASCII chars)', async () => {
    mockRouteParams = { token: 'synthetic-test-token-123' };

    const invalid73 = 'a'.repeat(73);
    const { getByTestId, getByText } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-new-password'), invalid73);
      fireEvent.changeText(getByTestId('input-confirm-password'), invalid73);
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(
        getByText('Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte UTF-8'),
      ).toBeTruthy();
    });

    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  test('validates confirmation password mismatch', async () => {
    mockRouteParams = { token: 'synthetic-test-token-123' };

    const { getByTestId, getByText } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-new-password'), 'validPass123');
      fireEvent.changeText(
        getByTestId('input-confirm-password'),
        'differentPass456',
      );
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(getByText('Mật khẩu xác nhận không khớp')).toBeTruthy();
    });

    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  test('preserves password spaces (strict untrimmed password policy)', async () => {
    (authApi.resetPassword as jest.Mock).mockResolvedValue(undefined);
    mockRouteParams = { token: 'synthetic-test-token-123' };

    const { getByTestId } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(
        getByTestId('input-new-password'),
        '  password with spaces  ',
      );
      fireEvent.changeText(
        getByTestId('input-confirm-password'),
        '  password with spaces  ',
      );
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        resetToken: 'synthetic-test-token-123',
        newPassword: '  password with spaces  ',
        confirmPassword: '  password with spaces  ',
      });
    });
  });

  test('prevents duplicate submissions with synchronous lock ref', async () => {
    let resolvePromise: () => void = () => {};
    const pendingPromise = new Promise<void>(resolve => {
      resolvePromise = resolve;
    });
    (authApi.resetPassword as jest.Mock).mockReturnValue(pendingPromise);
    mockRouteParams = { token: 'synthetic-test-token-123' };

    const { getByTestId } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-new-password'), 'validPass123');
      fireEvent.changeText(
        getByTestId('input-confirm-password'),
        'validPass123',
      );
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
      fireEvent.press(getByTestId('btn-submit-reset-password'));
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    expect(authApi.resetPassword).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise();
    });
  });

  test('maps RESET_TOKEN_INVALID backend error to resetToken field error', async () => {
    (authApi.resetPassword as jest.Mock).mockRejectedValue({
      kind: 'VALIDATION_ERROR',
      backendCode: 'RESET_TOKEN_INVALID',
      message: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.',
    });
    mockRouteParams = undefined;

    const { getByTestId, getByText } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-reset-token'), 'invalid-token');
      fireEvent.changeText(getByTestId('input-new-password'), 'validPass123');
      fireEvent.changeText(
        getByTestId('input-confirm-password'),
        'validPass123',
      );
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(
        getByText('Mã đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.'),
      ).toBeTruthy();
    });
  });

  test('maps RESET_TOKEN_EXPIRED backend error to resetToken field error', async () => {
    (authApi.resetPassword as jest.Mock).mockRejectedValue({
      kind: 'VALIDATION_ERROR',
      backendCode: 'RESET_TOKEN_EXPIRED',
      message: 'Mã đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.',
    });
    mockRouteParams = undefined;

    const { getByTestId, getByText } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-reset-token'), 'expired-token');
      fireEvent.changeText(getByTestId('input-new-password'), 'validPass123');
      fireEvent.changeText(
        getByTestId('input-confirm-password'),
        'validPass123',
      );
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(
        getByText('Mã đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.'),
      ).toBeTruthy();
    });
  });

  test('submits successfully, clears fields, and resets navigation to Login on return action', async () => {
    (authApi.resetPassword as jest.Mock).mockResolvedValue(undefined);
    mockRouteParams = { token: 'synthetic-test-token-123' };

    const { getByTestId, getByText } = await renderResetPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-new-password'), 'validPass123');
      fireEvent.changeText(
        getByTestId('input-confirm-password'),
        'validPass123',
      );
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-reset-password'));
    });

    await waitFor(() => {
      expect(getByTestId('reset-password-success-view')).toBeTruthy();
      expect(
        getByText(
          'Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.',
        ),
      ).toBeTruthy();
    });

    // Press return to login resets navigation stack
    await act(async () => {
      fireEvent.press(getByTestId('btn-back-to-login-from-reset'));
    });

    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  });
});
