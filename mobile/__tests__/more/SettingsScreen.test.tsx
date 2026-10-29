import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { SettingsScreen } from '../../src/features/more/screens/SettingsScreen';
import { AuthContext } from '../../src/app/auth/AuthProvider';
import type { AuthContextValue, AuthUser } from '../../src/app/auth/authTypes';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
import { APP_INFO } from '../../src/shared/config';

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

describe('SettingsScreen Component (SCR-ACC-03, SCR-ACC-04)', () => {
  const mockCurrentUser: AuthUser = {
    id: 'user-uuid-1234',
    username: 'nguyenvana',
    email: 'nguyenvana@worksphere.local',
    fullName: 'Nguyễn Văn A',
    avatarUrl: null,
    department: {
      id: 'dept-01',
      name: 'Kỹ thuật Công nghệ',
    },
    roles: ['EMPLOYEE'],
    permissions: ['TASK_READ', 'TASK_WRITE'],
  };

  const mockLogout = jest.fn();

  const defaultMockAuthContext: AuthContextValue = {
    sessionState: 'AUTHENTICATED',
    operationState: 'idle',
    currentUser: mockCurrentUser,
    initialized: true,
    lastAuthError: null,
    login: jest.fn().mockResolvedValue(true),
    logout: mockLogout,
    logoutLocal: jest.fn().mockResolvedValue(undefined),
    retryBootstrap: jest.fn().mockResolvedValue(undefined),
    clearAuthError: jest.fn(),
    updateCurrentUser: jest.fn(),
  };

  async function renderSettingsScreen(customContext: Partial<AuthContextValue> = {}) {
    const contextValue = { ...defaultMockAuthContext, ...customContext };
    return await render(
      <AuthContext.Provider value={contextValue}>
        <ThemeProvider theme={theme}>
          <SettingsScreen />
        </ThemeProvider>
      </AuthContext.Provider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockReset();
  });

  test('renders canonical screen ID SCR-ACC-03 and header title', async () => {
    const { getByTestId, getByText } = await renderSettingsScreen();

    expect(getByTestId('screen-settings')).toBeTruthy();
    expect(getByText('SCR-ACC-03')).toBeTruthy();
    expect(getByText('Cài đặt')).toBeTruthy();
  });

  test('renders app information with authoritative version from APP_INFO', async () => {
    const { getByTestId, getByText } = await renderSettingsScreen();

    expect(getByTestId('settings-app-info-card')).toBeTruthy();
    expect(getByTestId('settings-app-name')).toBeTruthy();
    expect(getByText(APP_INFO.name)).toBeTruthy();
    expect(getByTestId('settings-app-version')).toBeTruthy();
    expect(getByText(APP_INFO.version)).toBeTruthy();
  });

  test('renders safe user account summary without exposing sensitive tokens or sessionId', async () => {
    const { getByTestId, getByText, queryByText } = await renderSettingsScreen();

    expect(getByTestId('settings-account-card')).toBeTruthy();
    expect(getByText('Nguyễn Văn A')).toBeTruthy();
    expect(getByText('nguyenvana@worksphere.local')).toBeTruthy();
    expect(getByText('EMPLOYEE')).toBeTruthy();

    // Verify sensitive data is never present
    expect(queryByText('accessToken')).toBeNull();
    expect(queryByText('refreshToken')).toBeNull();
    expect(queryByText('sessionId')).toBeNull();
    expect(queryByText('TASK_READ')).toBeNull();
  });

  test('navigates to Profile screen from account card button', async () => {
    const { getByTestId } = await renderSettingsScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-navigate-profile-from-settings'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('Profile');
  });

  test('renders informational preferences card (theme, notifications, policy)', async () => {
    const { getByTestId, getByText } = await renderSettingsScreen();

    expect(getByTestId('settings-preferences-card')).toBeTruthy();
    expect(getByText('Mặc định (Sáng)')).toBeTruthy();
    expect(getByText('Trung tâm thông báo trong ứng dụng')).toBeTruthy();
    expect(getByText('Tuân thủ chính sách bảo mật nội bộ WorkSphere')).toBeTruthy();
  });

  test('opens logout confirmation dialog (SCR-ACC-04) when logout button is pressed', async () => {
    const { getByTestId, getByText } = await renderSettingsScreen();

    expect(getByTestId('btn-logout-settings')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('btn-logout-settings'));
    });

    expect(getByTestId('dialog-logout-settings')).toBeTruthy();
    expect(getByText('Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?')).toBeTruthy();
  });

  test('cancels logout and closes dialog when Hủy is pressed', async () => {
    const { getByTestId, queryByTestId } = await renderSettingsScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-logout-settings'));
    });

    expect(getByTestId('dialog-logout-settings')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('dialog-logout-settings-cancel-btn'));
    });

    expect(queryByTestId('dialog-logout-settings')).toBeNull();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  test('confirms logout and invokes auth logout callback', async () => {
    mockLogout.mockResolvedValue(undefined);
    const { getByTestId } = await renderSettingsScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-logout-settings'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('dialog-logout-settings-confirm-btn'));
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('prevents duplicate logout execution with synchronous lock ref', async () => {
    let resolvePromise: () => void = () => {};
    const pendingPromise = new Promise<void>(resolve => {
      resolvePromise = resolve;
    });
    mockLogout.mockReturnValue(pendingPromise);

    const { getByTestId } = await renderSettingsScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-logout-settings'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('dialog-logout-settings-confirm-btn'));
      fireEvent.press(getByTestId('dialog-logout-settings-confirm-btn'));
      fireEvent.press(getByTestId('dialog-logout-settings-confirm-btn'));
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise();
    });
  });

  test('handles logout rejection gracefully without unhandled exception', async () => {
    mockLogout.mockRejectedValue(new Error('Network error during remote revoke'));

    const { getByTestId } = await renderSettingsScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-logout-settings'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('dialog-logout-settings-confirm-btn'));
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
