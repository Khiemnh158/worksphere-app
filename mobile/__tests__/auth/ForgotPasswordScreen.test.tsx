import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ForgotPasswordScreen } from '../../src/features/auth/screens/ForgotPasswordScreen';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
import { authApi } from '../../src/features/auth/api/authApi';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('../../src/features/auth/api/authApi', () => ({
  authApi: {
    forgotPassword: jest.fn(),
  },
}));

describe('ForgotPasswordScreen Component (SCR-AUTH-03)', () => {
  async function renderForgotPasswordScreen() {
    return await render(
      <ThemeProvider theme={theme}>
        <ForgotPasswordScreen />
      </ThemeProvider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all screen elements, inputs and buttons', async () => {
    const { getByTestId, getByText } = await renderForgotPasswordScreen();

    expect(getByTestId('screen-forgot-password')).toBeTruthy();
    expect(getByText('SCR-AUTH-03')).toBeTruthy();
    expect(getByText('Quên mật khẩu')).toBeTruthy();
    expect(getByTestId('input-email')).toBeTruthy();
    expect(getByTestId('btn-submit-forgot-password')).toBeTruthy();
    expect(getByTestId('btn-back-to-login')).toBeTruthy();
  });

  test('validates required email field on empty submit', async () => {
    const { getByTestId, getByText } = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
    });

    await waitFor(() => {
      expect(getByText('Vui lòng nhập email')).toBeTruthy();
    });

    expect(authApi.forgotPassword).not.toHaveBeenCalled();
  });

  test('validates malformed email input', async () => {
    const { getByTestId, getByText } = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-email'), 'invalid-email-string');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
    });

    await waitFor(() => {
      expect(getByText('Email không đúng định dạng')).toBeTruthy();
    });

    expect(authApi.forgotPassword).not.toHaveBeenCalled();
  });

  test('validates max 255 length constraint', async () => {
    const { getByTestId, getByText } = await renderForgotPasswordScreen();

    const longEmail = 'a'.repeat(250) + '@example.com'; // > 255 chars
    await act(async () => {
      fireEvent.changeText(getByTestId('input-email'), longEmail);
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
    });

    await waitFor(() => {
      expect(getByText('Email không được vượt quá 255 ký tự')).toBeTruthy();
    });

    expect(authApi.forgotPassword).not.toHaveBeenCalled();
  });

  test('normalizes email (trim and lowercase) before submission', async () => {
    (authApi.forgotPassword as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-email'), '  User.Test@Example.Com  ');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
    });

    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith({
        email: 'user.test@example.com',
      });
    });
  });

  test('submits successfully and transitions to uniform success view', async () => {
    (authApi.forgotPassword as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId, getByText } = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-email'), 'user@example.com');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
    });

    await waitFor(() => {
      expect(getByTestId('forgot-password-success-view')).toBeTruthy();
      expect(getByText('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.')).toBeTruthy();
    });
  });

  test('anti-enumeration invariant: existing and non-existing email results in identical user feedback', async () => {
    const expectedSafeMessage = 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.';

    // Scenario A: Conceptual existing user returns success
    (authApi.forgotPassword as jest.Mock).mockResolvedValue(undefined);
    const viewA = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.changeText(viewA.getByTestId('input-email'), 'existing@example.com');
    });

    await act(async () => {
      fireEvent.press(viewA.getByTestId('btn-submit-forgot-password'));
    });

    await waitFor(() => {
      expect(viewA.getByTestId('forgot-password-success-banner')).toBeTruthy();
      expect(viewA.getByText(expectedSafeMessage)).toBeTruthy();
    });

    // Scenario B: Conceptual non-existing user (backend or client error)
    (authApi.forgotPassword as jest.Mock).mockRejectedValue({
      kind: 'NOT_FOUND',
      backendCode: 'USER_NOT_FOUND',
      message: 'User not found',
    });
    const viewB = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.changeText(viewB.getByTestId('input-email'), 'nonexistent@example.com');
    });

    await act(async () => {
      fireEvent.press(viewB.getByTestId('btn-submit-forgot-password'));
    });

    await waitFor(() => {
      expect(viewB.getByTestId('forgot-password-success-banner')).toBeTruthy();
      expect(viewB.getByText(expectedSafeMessage)).toBeTruthy();
    });

    // Explicitly verify USER_NOT_FOUND is never displayed
    expect(viewB.queryByText('USER_NOT_FOUND')).toBeNull();
    expect(viewB.queryByText('User not found')).toBeNull();
  });

  test('prevents duplicate submissions with synchronous lock ref', async () => {
    let resolvePromise: () => void = () => {};
    const pendingPromise = new Promise<void>(resolve => {
      resolvePromise = resolve;
    });
    (authApi.forgotPassword as jest.Mock).mockReturnValue(pendingPromise);

    const { getByTestId } = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-email'), 'user@example.com');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
    });

    expect(authApi.forgotPassword).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise();
    });
  });

  test('displays retryable network error message with traceId', async () => {
    (authApi.forgotPassword as jest.Mock).mockRejectedValue({
      kind: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
      traceId: 'tr-net-err-01',
    });

    const { getByTestId, getByText } = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-email'), 'user@example.com');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
    });

    await waitFor(() => {
      expect(getByTestId('forgot-password-global-error')).toBeTruthy();
      expect(getByText('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.')).toBeTruthy();
      expect(getByText('Mã tham chiếu: tr-net-err-01')).toBeTruthy();
    });
  });

  test('navigates back to Login when Back button is pressed', async () => {
    const { getByTestId } = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-back-to-login'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  test('navigates to ResetPassword from success view action', async () => {
    (authApi.forgotPassword as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = await renderForgotPasswordScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-email'), 'user@example.com');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-forgot-password'));
    });

    await waitFor(() => {
      expect(getByTestId('btn-to-reset-password')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-to-reset-password'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('ResetPassword');
  });
});
