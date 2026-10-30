import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ProfileBasicsScreen } from '../../src/features/workspace/ProfileBasicsScreen';
import { authApi } from '../../src/features/auth/api/authApi';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
const mockBack = jest.fn(),
  mockReload = jest.fn(),
  mockUpdate = jest.fn();
jest.mock('../../src/app/auth', () => ({
  useAuth: () => ({ updateCurrentUser: mockUpdate }),
}));
jest.mock('../../src/features/auth/api/authApi', () => ({
  authApi: { getCurrentUser: jest.fn(), updateProfile: jest.fn() },
}));
jest.mock('../../src/features/workspace/WorkspaceNavigator', () => ({
  useWorkplace: () => ({ reload: mockReload }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockBack }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
beforeEach(() => {
  jest.clearAllMocks();
  (authApi.getCurrentUser as jest.Mock).mockResolvedValue({
    id: 'fixture',
    fullName: 'Nhân viên',
    phoneNumber: '0901234567',
    roles: ['EMPLOYEE'],
  });
  (authApi.updateProfile as jest.Mock).mockResolvedValue({
    id: 'fixture',
    fullName: 'Tên mới',
    phoneNumber: '0901234567',
  });
  mockReload.mockResolvedValue(undefined);
});
test('editing the name preserves the loaded phone and never sends department, roles or avatar', async () => {
  const ui = await render(
    <ThemeProvider theme={theme}>
      <ProfileBasicsScreen />
    </ThemeProvider>,
  );
  await waitFor(() =>
    expect(ui.getByLabelText('Số điện thoại liên hệ').props.value).toBe(
      '0901234567',
    ),
  );
  await fireEvent.changeText(ui.getByLabelText('Họ và tên'), 'Tên mới');
  await fireEvent.press(ui.getByText('Lưu thông tin'));
  await waitFor(() =>
    expect(authApi.updateProfile).toHaveBeenCalledWith({
      fullName: 'Tên mới',
      phoneNumber: '0901234567',
    }),
  );
  expect(mockUpdate).toHaveBeenCalled();
  expect(mockReload).toHaveBeenCalled();
  expect(mockBack).toHaveBeenCalled();
});
test('failed profile load cannot submit empty values over an existing profile', async () => {
  (authApi.getCurrentUser as jest.Mock).mockRejectedValue(
    new Error('Không tải được hồ sơ'),
  );
  const ui = await render(
    <ThemeProvider theme={theme}>
      <ProfileBasicsScreen />
    </ThemeProvider>,
  );
  await waitFor(() =>
    expect(ui.getByText('Không tải được hồ sơ')).toBeTruthy(),
  );
  expect(ui.queryByText('Lưu thông tin')).toBeNull();
  expect(authApi.updateProfile).not.toHaveBeenCalled();
});
