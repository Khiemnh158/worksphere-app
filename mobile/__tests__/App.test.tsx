import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

describe('App Entrypoint', () => {
  test('renders default unauthenticated shell with Login screen', async () => {
    const { getByTestId, getAllByText, getByText } = await render(<App />);

    expect(getByTestId('screen-login')).toBeTruthy();
    expect(getAllByText('Đăng nhập').length).toBeGreaterThanOrEqual(1);
    expect(getByText('SCR-AUTH-02: Hệ thống quản lý công việc và dự án WorkSphere')).toBeTruthy();
  });
});
