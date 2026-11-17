import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AppRoot } from '../src/app/AppRoot';
import { workspaceApi } from '../src/features/workspace/api';
import { workplaceFixture } from './test-utils/workplaceFixture';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/features/workspace/api', () => ({
  workspaceApi: {
    context: jest.fn(),
    work: jest.fn(),
    tickets: jest.fn(),
    time: jest.fn(),
    notices: jest.fn(),
  },
}));

describe('current workplace navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (workspaceApi.context as jest.Mock).mockResolvedValue(workplaceFixture);
    (workspaceApi.work as jest.Mock).mockResolvedValue([]);
    (workspaceApi.notices as jest.Mock).mockResolvedValue([]);
    (workspaceApi.tickets as jest.Mock).mockResolvedValue({
      items: [],
      totalItems: 0,
      hasNext: false,
    });
  });
  test('initializing cannot mount business screens', async () => {
    const ui = await render(<AppRoot sessionState="INITIALIZING" />);
    expect(ui.getByTestId('root-initializing-state')).toBeTruthy();
    expect(ui.queryByLabelText('Tab: Công việc')).toBeNull();
  });
  test('signed out shows login and recovery, without business tabs', async () => {
    const ui = await render(<AppRoot sessionState="UNAUTHENTICATED" />);
    expect(ui.getByTestId('screen-login')).toBeTruthy();
    expect(ui.getByText('Quên mật khẩu?')).toBeTruthy();
    expect(ui.getByTestId('input-mfa')).toBeTruthy();
    expect(ui.queryByLabelText('Tab: Công việc')).toBeNull();
    await fireEvent.press(ui.getByTestId('btn-to-forgot-password'));
    await waitFor(() =>
      expect(ui.getByTestId('screen-forgot-password')).toBeTruthy(),
    );
  });
  test('staff can navigate work, support and personal functions of the new portal', async () => {
    const ui = await render(<AppRoot sessionState="AUTHENTICATED" />);
    await waitFor(() => expect(ui.getByText('Lịch cần làm')).toBeTruthy());
    await fireEvent.press(ui.getByLabelText('Tab: Công việc'));
    await waitFor(() => expect(ui.getByText('Việc của tôi')).toBeTruthy());
    await fireEvent.press(ui.getByLabelText('Tab: Hỗ trợ'));
    await waitFor(() => expect(ui.getByText('Gửi yêu cầu mới')).toBeTruthy());
    await fireEvent.press(ui.getByLabelText('Tab: Cá nhân'));
    await waitFor(() =>
      expect(ui.getByText('Phiếu thu nhập của tôi')).toBeTruthy(),
    );
  });
  test('technical admin never gets business, attendance or income tabs', async () => {
    (workspaceApi.context as jest.Mock).mockResolvedValue({
      ...workplaceFixture,
      admin: true,
    });
    const ui = await render(<AppRoot sessionState="AUTHENTICATED" />);
    await waitFor(() => expect(ui.getByText('Quản trị hệ thống')).toBeTruthy());
    expect(ui.queryByLabelText('Tab: Công việc')).toBeNull();
    expect(ui.queryByLabelText('Tab: Chấm công')).toBeNull();
    await fireEvent.press(ui.getByLabelText('Tab: Cá nhân'));
    await waitFor(() => expect(ui.getByText('Bảo mật tài khoản')).toBeTruthy());
    expect(ui.queryByText('Phiếu thu nhập của tôi')).toBeNull();
    expect(workspaceApi.work).not.toHaveBeenCalled();
  });
});
