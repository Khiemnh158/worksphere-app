import React from 'react';
import { AppState, Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SecurityScreen } from '../../src/features/workspace/SecurityScreen';
import { http } from '../../src/shared/api/apiClient';
import { authApi } from '../../src/features/auth/api/authApi';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
const mockLogoutLocal = jest.fn();
jest.mock('../../src/app/auth', () => ({
  useAuth: () => ({ logoutLocal: mockLogoutLocal }),
}));
jest.mock('../../src/shared/api/apiClient', () => ({
  http: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('../../src/features/auth/api/authApi', () => ({
  authApi: { logoutAll: jest.fn() },
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
let backgroundCallbacks: ((state: any) => void)[] = [];
beforeEach(() => {
  jest.clearAllMocks();
  backgroundCallbacks = [];
  (http.get as jest.Mock).mockResolvedValue({ enabled: false });
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_name, callback) => {
      backgroundCallbacks.push(callback);
      return { remove: jest.fn() };
    });
});
afterEach(() => jest.restoreAllMocks());
async function screen() {
  return render(
    <ThemeProvider theme={theme}>
      <SecurityScreen />
    </ThemeProvider>,
  );
}

test('setup requires current password and late secret response cannot appear after backgrounding', async () => {
  let resolve!: (value: object) => void;
  (http.post as jest.Mock).mockImplementation(
    () =>
      new Promise(r => {
        resolve = r;
      }),
  );
  const ui = await screen();
  await waitFor(() =>
    expect(ui.getByText('Tạo khóa thiết lập TOTP')).toBeTruthy(),
  );
  await fireEvent.press(ui.getByText('Tạo khóa thiết lập TOTP'));
  expect(http.post).not.toHaveBeenCalled();
  await fireEvent.changeText(
    ui.getByLabelText('Mật khẩu hiện tại'),
    'fixture-password',
  );
  await fireEvent.press(ui.getByText('Tạo khóa thiết lập TOTP'));
  await act(async () => {
    backgroundCallbacks.forEach(callback => callback('background'));
    resolve({ secret: 'PRIVATE_SETUP_FIXTURE' });
  });
  expect(ui.queryByText('PRIVATE_SETUP_FIXTURE')).toBeNull();
  expect(ui.getByLabelText('Mật khẩu hiện tại').props.value).toBe('');
});

test('backup codes are shown once and cleared with the password when app backgrounds', async () => {
  (http.post as jest.Mock)
    .mockResolvedValueOnce({ secret: 'SETUP_FIXTURE' })
    .mockResolvedValueOnce({ recoveryCodes: ['BACKUP_FIXTURE'] });
  const ui = await screen();
  await waitFor(() =>
    expect(ui.getByText('Tạo khóa thiết lập TOTP')).toBeTruthy(),
  );
  await fireEvent.changeText(
    ui.getByLabelText('Mật khẩu hiện tại'),
    'fixture-password',
  );
  await fireEvent.press(ui.getByText('Tạo khóa thiết lập TOTP'));
  await waitFor(() => expect(ui.getByText('SETUP_FIXTURE')).toBeTruthy());
  await fireEvent.changeText(
    ui.getByLabelText('Mã xác thực / mã dự phòng'),
    '123456',
  );
  (http.get as jest.Mock).mockResolvedValue({ enabled: true });
  await fireEvent.press(ui.getByText('Xác nhận bật hai bước'));
  await waitFor(() => expect(ui.getByText('BACKUP_FIXTURE')).toBeTruthy());
  expect(http.post).toHaveBeenLastCalledWith('/me/two-factor/enable', {
    password: 'fixture-password',
    code: '123456',
  });
  await act(async () => {
    backgroundCallbacks.forEach(callback => callback('background'));
  });
  expect(ui.queryByText('BACKUP_FIXTURE')).toBeNull();
  expect(ui.queryByText('SETUP_FIXTURE')).toBeNull();
});

test('remote logout failure stays visible and does not pretend all sessions were revoked', async () => {
  (authApi.logoutAll as jest.Mock).mockRejectedValue({
    kind: 'NETWORK_ERROR',
    message: 'Không kết nối được máy chủ',
  });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = await screen();
  await fireEvent.press(ui.getByText('Đăng xuất mọi thiết bị'));
  const buttons = alert.mock.calls[0][2]!;
  await act(async () => {
    buttons[1].onPress?.();
  });
  await waitFor(() =>
    expect(ui.getByText('Không kết nối được máy chủ')).toBeTruthy(),
  );
  expect(mockLogoutLocal).not.toHaveBeenCalled();
});
