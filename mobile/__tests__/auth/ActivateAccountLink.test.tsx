import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
import { AuthNavigator } from '../../src/app/navigation/AuthNavigator';
import { http } from '../../src/shared/api/apiClient';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../../src/shared/api/apiClient', () => ({
  http: { post: jest.fn() },
}));
jest.mock('../../src/app/auth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    operationState: 'idle',
    lastAuthError: null,
    clearAuthError: jest.fn(),
  }),
}));

test('a native activation link opens the correct form without submitting credentials or activating automatically', async () => {
  const token = 'b'.repeat(43);
  const ui = await render(
    <ThemeProvider theme={theme}>
      <NavigationContainer>
        <AuthNavigator recovery={{ screen: 'ActivateAccount', token }} />
      </NavigationContainer>
    </ThemeProvider>,
  );
  await waitFor(() =>
    expect(ui.getByLabelText('Liên kết hoặc mã kích hoạt').props.value).toBe(
      token,
    ),
  );
  expect(ui.getByText('Bắt đầu không gian của bạn')).toBeTruthy();
  expect(http.post).not.toHaveBeenCalled();
  await fireEvent.press(ui.getByText('Về đăng nhập'));
  await waitFor(() => expect(ui.getByTestId('screen-login')).toBeTruthy());
  expect(ui.queryByLabelText('Liên kết hoặc mã kích hoạt')).toBeNull();
  expect(http.post).not.toHaveBeenCalled();
});
