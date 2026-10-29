import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../../src/features/profile/screens/ProfileScreen';
import { AuthContext } from '../../src/app/auth/AuthProvider';
import type { AuthContextValue, AuthUser } from '../../src/app/auth/authTypes';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
import { authApi } from '../../src/features/auth/api/authApi';
import type { UserProfileResponse } from '../../src/features/auth/api/authTypes';

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
    getCurrentUser: jest.fn(),
  },
}));

describe('ProfileScreen Component (SCR-ACC-01, SCR-ACC-04)', () => {
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

  const mockProfileResponse: UserProfileResponse = {
    id: 'user-uuid-1234',
    username: 'nguyenvana',
    email: 'nguyenvana@worksphere.local',
    fullName: 'Nguyễn Văn A',
    phoneNumber: '0912345678',
    avatarUrl: null,
    status: 'ACTIVE',
    department: {
      id: 'dept-01',
      name: 'Kỹ thuật Công nghệ',
    },
    roles: ['EMPLOYEE'],
    permissions: ['TASK_READ', 'TASK_WRITE'],
    createdAt: '2026-01-15T08:30:00Z',
    lastLoginAt: '2026-10-18T10:00:00Z',
  };

  const defaultMockAuthContext: AuthContextValue = {
    sessionState: 'AUTHENTICATED',
    operationState: 'idle',
    currentUser: mockCurrentUser,
    initialized: true,
    lastAuthError: null,
    login: jest.fn().mockResolvedValue(true),
    logout: jest.fn().mockResolvedValue(undefined),
    logoutLocal: jest.fn().mockResolvedValue(undefined),
    retryBootstrap: jest.fn().mockResolvedValue(undefined),
    clearAuthError: jest.fn(),
    updateCurrentUser: jest.fn(),
  };

  async function renderProfileScreen(customContext: Partial<AuthContextValue> = {}) {
    const contextValue = { ...defaultMockAuthContext, ...customContext };
    return await render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={contextValue}>
          <ProfileScreen />
        </AuthContext.Provider>
      </ThemeProvider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders user profile and information cards successfully after fetch', async () => {
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockProfileResponse);

    const { getByTestId } = await renderProfileScreen();

    await waitFor(() => {
      expect(getByTestId('screen-profile')).toBeTruthy();
      expect(getByTestId('profile-display-name')).toHaveTextContent('Nguyễn Văn A');
      expect(getByTestId('profile-display-email')).toHaveTextContent('nguyenvana@worksphere.local');
      expect(getByTestId('profile-info-username')).toHaveTextContent('nguyenvana');
      expect(getByTestId('profile-info-phone')).toHaveTextContent('0912345678');
      expect(getByTestId('profile-info-department')).toHaveTextContent('Kỹ thuật Công nghệ');
      expect(getByTestId('profile-info-roles')).toHaveTextContent('EMPLOYEE');
      expect(getByTestId('profile-info-status')).toHaveTextContent('Đang hoạt động');
    });

    expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(defaultMockAuthContext.updateCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-uuid-1234',
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@worksphere.local',
      })
    );
  });

  test('navigates to EditProfile screen when edit button pressed', async () => {
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockProfileResponse);

    const { getByTestId } = await renderProfileScreen();

    await waitFor(() => {
      expect(getByTestId('profile-edit-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('profile-edit-button'));
    expect(mockNavigate).toHaveBeenCalledWith('EditProfile');
  });

  test('navigates to ChangePassword screen when change password button pressed', async () => {
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockProfileResponse);

    const { getByTestId } = await renderProfileScreen();

    await waitFor(() => {
      expect(getByTestId('profile-change-password-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('profile-change-password-button'));
    expect(mockNavigate).toHaveBeenCalledWith('ChangePassword');
  });

  test('displays confirmation dialog and triggers logout when confirmed', async () => {
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockProfileResponse);
    const mockLogout = jest.fn().mockResolvedValue(undefined);

    const { getByTestId } = await renderProfileScreen({ logout: mockLogout });

    await waitFor(() => {
      expect(getByTestId('profile-logout-button')).toBeTruthy();
    });

    // Press logout button opens dialog
    await act(async () => {
      fireEvent.press(getByTestId('profile-logout-button'));
    });

    await waitFor(() => {
      expect(getByTestId('dialog-logout-confirm-btn')).toBeTruthy();
    });

    // Confirm dialog
    await act(async () => {
      fireEvent.press(getByTestId('dialog-logout-confirm-btn'));
    });

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  test('renders error state and allows retry if GET /me fails and no initial user is available', async () => {
    (authApi.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { getByTestId } = await renderProfileScreen({ currentUser: null });

    await waitFor(() => {
      expect(getByTestId('screen-profile-error')).toBeTruthy();
      expect(getByTestId('profile-error-state')).toBeTruthy();
    });

    // Mock successful retry
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockProfileResponse);
    const retryButton = getByTestId('profile-error-state-retry-btn');
    await act(async () => {
      fireEvent.press(retryButton);
    });

    await waitFor(() => {
      expect(getByTestId('screen-profile')).toBeTruthy();
    });
  });
});
