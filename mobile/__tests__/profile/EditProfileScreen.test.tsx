import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { EditProfileScreen } from '../../src/features/profile/screens/EditProfileScreen';
import { AuthContext } from '../../src/app/auth/AuthProvider';
import type { AuthContextValue, AuthUser } from '../../src/app/auth/authTypes';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
import { authApi } from '../../src/features/auth/api/authApi';
import type { UserProfileResponse } from '../../src/features/auth/api/authTypes';

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
    updateProfile: jest.fn(),
  },
}));

describe('EditProfileScreen Component', () => {
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
    permissions: ['TASK_READ'],
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

  async function renderEditProfileScreen(customContext: Partial<AuthContextValue> = {}) {
    const contextValue = { ...defaultMockAuthContext, ...customContext };
    return await render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={contextValue}>
          <EditProfileScreen />
        </AuthContext.Provider>
      </ThemeProvider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('pre-fills initial fullName from currentUser and renders inputs', async () => {
    const { getByTestId, getByDisplayValue } = await renderEditProfileScreen();

    expect(getByTestId('screen-edit-profile')).toBeTruthy();
    expect(getByDisplayValue('Nguyễn Văn A')).toBeTruthy();
    expect(getByTestId('input-phone')).toBeTruthy();
    expect(getByTestId('btn-save-profile')).toBeTruthy();
  });

  test('validates required fullName and shows inline field error', async () => {
    const { getByTestId, getByText } = await renderEditProfileScreen();

    // Clear fullName
    await act(async () => {
      fireEvent.changeText(getByTestId('input-fullname'), '   ');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-save-profile'));
    });

    await waitFor(() => {
      expect(getByText('Vui lòng nhập họ và tên')).toBeTruthy();
    });

    expect(authApi.updateProfile).not.toHaveBeenCalled();
  });

  test('validates phoneNumber max length constraint', async () => {
    const { getByTestId, getByText } = await renderEditProfileScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-phone'), '0123456789012345678901'); // 22 chars
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-save-profile'));
    });

    await waitFor(() => {
      expect(getByText('Số điện thoại không được vượt quá 20 ký tự')).toBeTruthy();
    });

    expect(authApi.updateProfile).not.toHaveBeenCalled();
  });

  test('calls updateProfile, updates currentUser in AuthProvider, and goes back on success', async () => {
    const updatedResponse: UserProfileResponse = {
      id: 'user-uuid-1234',
      username: 'nguyenvana',
      email: 'nguyenvana@worksphere.local',
      fullName: 'Nguyễn Văn B',
      phoneNumber: '0987654321',
      avatarUrl: null,
      status: 'ACTIVE',
      department: {
        id: 'dept-01',
        name: 'Kỹ thuật Công nghệ',
      },
      roles: ['EMPLOYEE'],
      permissions: ['TASK_READ'],
      createdAt: '2026-01-15T08:30:00Z',
      lastLoginAt: '2026-10-18T10:00:00Z',
    };

    (authApi.updateProfile as jest.Mock).mockResolvedValue(updatedResponse);

    const { getByTestId, getByText } = await renderEditProfileScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-fullname'), 'Nguyễn Văn B');
      fireEvent.changeText(getByTestId('input-phone'), '0987654321');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-save-profile'));
    });

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledWith({
        fullName: 'Nguyễn Văn B',
        phoneNumber: '0987654321',
        avatarFileId: null,
      });
      expect(defaultMockAuthContext.updateCurrentUser).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Nguyễn Văn B',
        })
      );
      expect(getByText('Hồ sơ đã được cập nhật thành công')).toBeTruthy();
    });

    await waitFor(
      () => {
        expect(mockGoBack).toHaveBeenCalledTimes(1);
      },
      { timeout: 1500 }
    );
  });

  test('prevents duplicate submissions with lock ref', async () => {
    let resolvePromise: (val: any) => void = () => {};
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    (authApi.updateProfile as jest.Mock).mockReturnValue(pendingPromise);

    const { getByTestId } = await renderEditProfileScreen();

    await act(async () => {
      fireEvent.changeText(getByTestId('input-fullname'), 'Nguyễn Văn C');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-save-profile'));
      fireEvent.press(getByTestId('btn-save-profile'));
      fireEvent.press(getByTestId('btn-save-profile'));
    });

    expect(authApi.updateProfile).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise({
        id: 'user-uuid-1234',
        username: 'nguyenvana',
        email: 'nguyenvana@worksphere.local',
        fullName: 'Nguyễn Văn C',
        phoneNumber: null,
        avatarUrl: null,
        status: 'ACTIVE',
        department: null,
        roles: ['EMPLOYEE'],
        permissions: [],
        createdAt: '2026-01-15T08:30:00Z',
        lastLoginAt: null,
      });
    });
  });

  test('maps API field errors correctly to inputs', async () => {
    (authApi.updateProfile as jest.Mock).mockRejectedValue({
      response: {
        status: 400,
        data: {
          code: 'VALIDATION_FAILED',
          message: 'Dữ liệu không hợp lệ',
          fieldErrors: {
            fullName: 'Họ và tên không hợp lệ từ máy chủ',
          },
        },
      },
      fieldErrors: {
        fullName: 'Họ và tên không hợp lệ từ máy chủ',
      },
    });

    const { getByTestId, getByText } = await renderEditProfileScreen();

    await act(async () => {
      fireEvent.press(getByTestId('btn-save-profile'));
    });

    await waitFor(() => {
      expect(getByText('Họ và tên không hợp lệ từ máy chủ')).toBeTruthy();
    });
  });
});
