import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppRoot } from '../src/app/AppRoot';
import { AppProviders } from '../src/app/providers';
import { LoginScreen, ResetPasswordScreen } from '../src/features/auth/screens';
import type { AuthStackParamList } from '../src/app/navigation/types';
import { TEST_INITIAL_METRICS } from './test-utils';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// Mock react-native-screens if needed in jest environment
jest.mock('react-native-screens', () => {
  const actual = jest.requireActual('react-native-screens');
  return {
    ...actual,
    enableScreens: jest.fn(),
  };
});

describe('RootNavigator Session Abstraction & Navigation Shell', () => {
  test('A. Root initializing: renders loading scaffold foundation', async () => {
    const { getByTestId, getByText } = await render(<AppRoot sessionState="INITIALIZING" />);

    expect(getByTestId('root-initializing-state')).toBeTruthy();
    expect(getByText('Đang khởi tạo ứng dụng...')).toBeTruthy();
  });

  test('B. Root unauthenticated: renders Auth navigator with Login screen', async () => {
    const { getByTestId, getAllByText, getByText } = await render(<AppRoot sessionState="UNAUTHENTICATED" />);

    expect(getByTestId('screen-login')).toBeTruthy();
    expect(getAllByText('Đăng nhập').length).toBeGreaterThanOrEqual(1);
    expect(getByText('SCR-AUTH-02: Hệ thống quản lý công việc và dự án WorkSphere')).toBeTruthy();
    expect(getByText('Quên mật khẩu?')).toBeTruthy();
  });

  test('C. Root authenticated: renders Main Tab navigator with Dashboard as default tab', async () => {
    const { getByTestId, getByText } = await render(<AppRoot sessionState="AUTHENTICATED" />);

    expect(getByTestId('screen-dashboard')).toBeTruthy();
    expect(getByText('SCR-MAIN-01')).toBeTruthy();
  });

  test('D. Main tab order: all 5 canonical tabs are rendered in exact order', async () => {
    const { getByLabelText } = await render(<AppRoot sessionState="AUTHENTICATED" />);

    // Check all 5 canonical tab buttons exist
    const dashboardTab = getByLabelText('Tab 1: Dashboard');
    const projectsTab = getByLabelText('Tab 2: Dự án');
    const tasksTab = getByLabelText('Tab 3: Công việc');
    const serviceRequestsTab = getByLabelText('Tab 4: Yêu cầu');
    const moreTab = getByLabelText('Tab 5: Thêm');

    expect(dashboardTab).toBeTruthy();
    expect(projectsTab).toBeTruthy();
    expect(tasksTab).toBeTruthy();
    expect(serviceRequestsTab).toBeTruthy();
    expect(moreTab).toBeTruthy();
  });

  test('E. Typed navigation smoke: switching between tabs does not crash', async () => {
    const { getByTestId, getByText, getByLabelText } = await render(<AppRoot sessionState="AUTHENTICATED" />);

    // Starts on Dashboard
    expect(getByTestId('screen-dashboard')).toBeTruthy();

    // Navigate to Projects tab
    fireEvent.press(getByLabelText('Tab 2: Dự án'));
    await waitFor(() => {
      expect(getByTestId('screen-projects')).toBeTruthy();
      expect(getByText('SCR-PRJ-01')).toBeTruthy();
    });

    // Navigate to Tasks tab
    fireEvent.press(getByLabelText('Tab 3: Công việc'));
    await waitFor(() => {
      expect(getByTestId('screen-tasks')).toBeTruthy();
      expect(getByText('SCR-TSK-01')).toBeTruthy();
    });

    // Navigate to Service Requests tab
    fireEvent.press(getByLabelText('Tab 4: Yêu cầu'));
    await waitFor(() => {
      expect(getByTestId('screen-service-requests')).toBeTruthy();
      expect(getByText('SCR-SRV-01')).toBeTruthy();
    });

    // Navigate to More tab
    fireEvent.press(getByLabelText('Tab 5: Thêm'));
    await waitFor(() => {
      expect(getByTestId('screen-more')).toBeTruthy();
      expect(getByText('SCR-MAIN-03')).toBeTruthy();
    });

    // Navigate back to Dashboard tab
    fireEvent.press(getByLabelText('Tab 1: Dashboard'));
    await waitFor(() => {
      expect(getByTestId('screen-dashboard')).toBeTruthy();
    });
  });

  test('Main tab navigation: navigating from More to Settings works', async () => {
    const { getByTestId, getByLabelText, getByText } = await render(
      <AppRoot sessionState="AUTHENTICATED" />
    );

    // Navigate to More tab
    fireEvent.press(getByLabelText('Tab 5: Thêm'));
    await waitFor(() => {
      expect(getByTestId('screen-more')).toBeTruthy();
      expect(getByTestId('btn-navigate-settings')).toBeTruthy();
    });

    // Press Settings button
    fireEvent.press(getByTestId('btn-navigate-settings'));
    await waitFor(() => {
      expect(getByTestId('screen-settings')).toBeTruthy();
      expect(getByText('SCR-ACC-03')).toBeTruthy();
    });
  });

  test('Auth stack navigation: navigating from Login to ForgotPassword works', async () => {
    const { getByTestId, getByText } = await render(<AppRoot sessionState="UNAUTHENTICATED" />);

    // Starts on Login
    expect(getByTestId('screen-login')).toBeTruthy();

    // Press Forgot Password button
    fireEvent.press(getByTestId('btn-to-forgot-password'));

    // Reaches Forgot Password screen
    await waitFor(() => {
      expect(getByTestId('screen-forgot-password')).toBeTruthy();
      expect(getByText('SCR-AUTH-03')).toBeTruthy();
      expect(getByText('Back to Login')).toBeTruthy();
    });

    // Navigate back to Login
    fireEvent.press(getByTestId('btn-back-to-login'));
    await waitFor(() => {
      expect(getByTestId('screen-login')).toBeTruthy();
    });
  });

  test('Auth stack navigation: ResetPassword route shell renders with params and navigates back to Login', async () => {
    const Stack = createNativeStackNavigator<AuthStackParamList>();

    function ResetPasswordTestHarness() {
      return (
        <NavigationContainer>
          <Stack.Navigator initialRouteName="ResetPassword">
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              initialParams={{ token: 'test-reset-token' }}
            />
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }

    const { getByTestId, getByText, getAllByText } = await render(
      <AppProviders initialMetrics={TEST_INITIAL_METRICS}>
        <ResetPasswordTestHarness />
      </AppProviders>
    );

    // Verify SCR-AUTH-04 visible
    expect(getByTestId('screen-reset-password')).toBeTruthy();
    expect(getByText('SCR-AUTH-04')).toBeTruthy();
    expect(getAllByText('Đặt lại mật khẩu').length).toBeGreaterThanOrEqual(1);
    expect(getByTestId('btn-back-to-login-from-reset')).toBeTruthy();

    // Verify navigation action back to Login
    fireEvent.press(getByTestId('btn-back-to-login-from-reset'));
    await waitFor(() => {
      expect(getByTestId('screen-login')).toBeTruthy();
      expect(getByText('SCR-AUTH-02: Hệ thống quản lý công việc và dự án WorkSphere')).toBeTruthy();
    });
  });
});
