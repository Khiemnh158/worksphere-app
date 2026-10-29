import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../src/features/auth/screens/LoginScreen';
import { AuthContext } from '../../src/app/auth/AuthProvider';
import type { AuthContextValue } from '../../src/app/auth/authTypes';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';

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

describe('LoginScreen Component', () => {
  const defaultMockAuthContext: AuthContextValue = {
    sessionState: 'UNAUTHENTICATED',
    operationState: 'idle',
    currentUser: null,
    initialized: true,
    lastAuthError: null,
    login: jest.fn().mockResolvedValue(true),
    logout: jest.fn().mockResolvedValue(undefined),
    logoutLocal: jest.fn().mockResolvedValue(undefined),
    retryBootstrap: jest.fn().mockResolvedValue(undefined),
    clearAuthError: jest.fn(),
  };

  async function renderLoginScreen(customContext: Partial<AuthContextValue> = {}) {
    const contextValue = { ...defaultMockAuthContext, ...customContext };
    return await render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={contextValue}>
          <LoginScreen />
        </AuthContext.Provider>
      </ThemeProvider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all essential elements and accessible inputs', async () => {
    const { getByTestId, getAllByText, getByPlaceholderText } = await renderLoginScreen();

    expect(getByTestId('screen-login')).toBeTruthy();
    expect(getAllByText('Đăng nhập').length).toBeGreaterThanOrEqual(1);
    expect(getByPlaceholderText('Nhập username hoặc email')).toBeTruthy();
    expect(getByPlaceholderText('Nhập mật khẩu')).toBeTruthy();
    expect(getByTestId('btn-to-forgot-password')).toBeTruthy();
    expect(getByTestId('btn-submit-login')).toBeTruthy();
  });

  test('validates required fields on submit without input', async () => {
    const { getByTestId, getByText } = await renderLoginScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-login'));
    });

    await waitFor(() => {
      expect(getByText('Vui lòng nhập tên đăng nhập hoặc email')).toBeTruthy();
      expect(getByText('Vui lòng nhập mật khẩu')).toBeTruthy();
    });

    expect(defaultMockAuthContext.login).not.toHaveBeenCalled();
  });

  test('validates password length constraint (min 8 chars)', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = await renderLoginScreen();

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Nhập username hoặc email'), 'valid.user');
    });

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu'), 'short');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-login'));
    });

    await waitFor(() => {
      expect(getByText('Mật khẩu phải có từ 8 đến 128 ký tự')).toBeTruthy();
    });

    expect(defaultMockAuthContext.login).not.toHaveBeenCalled();
  });

  test('calls login with normalized username and UNTRIMMED password', async () => {
    const mockLogin = jest.fn().mockResolvedValue(true);
    const { getByTestId, getByPlaceholderText } = await renderLoginScreen({ login: mockLogin });

    // Surrounding whitespace in login
    // Password with surrounding space (MUST NOT be trimmed per security policy)
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Nhập username hoặc email'), '  valid.user  ');
    });

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu'), '  Password123  ');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-submit-login'));
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('valid.user', '  Password123  ');
    });
  });

  test('displays server error banner and traceId when lastAuthError is present', async () => {
    const { getByTestId, getByText } = await renderLoginScreen({
      lastAuthError: {
        message: 'Thông tin đăng nhập không chính xác',
        placement: 'form',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
        traceId: 'tr-auth-fail-999',
      },
    });

    expect(getByTestId('login-auth-error-banner')).toBeTruthy();
    expect(getByText('Thông tin đăng nhập không chính xác')).toBeTruthy();
    expect(getByText('Mã tham chiếu: tr-auth-fail-999')).toBeTruthy();
  });

  test('clears error banner when typing new input', async () => {
    const clearAuthError = jest.fn();
    const { getByPlaceholderText } = await renderLoginScreen({
      lastAuthError: {
        message: 'Lỗi',
        placement: 'form',
        retryable: false,
        clearSession: false,
        navigateToLogin: false,
      },
      clearAuthError,
    });

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Nhập username hoặc email'), 'a');
    });

    expect(clearAuthError).toHaveBeenCalled();
  });

  test('navigates to ForgotPassword when link is pressed', async () => {
    const { getByTestId } = await renderLoginScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-to-forgot-password'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  test('disables inputs and button when authenticating', async () => {
    const { getByTestId } = await renderLoginScreen({
      operationState: 'authenticating',
    });

    const submitBtn = getByTestId('btn-submit-login');
    expect(submitBtn.props.accessibilityState.disabled).toBe(true);
    expect(submitBtn.props.accessibilityState.busy).toBe(true);
  });
});
