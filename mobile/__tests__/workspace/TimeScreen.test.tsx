import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { TimeScreen } from '../../src/features/workspace/TimeScreens';
import { workspaceApi } from '../../src/features/workspace/api';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
jest.mock('react-native-keychain', () => ({}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({}),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../../src/features/workspace/WorkspaceNavigator', () => ({
  useWorkplace: () => ({
    context: {
      ...require('../test-utils/workplaceFixture').workplaceFixture,
      timeDepartments: ['it'],
    },
  }),
}));
jest.mock('../../src/features/workspace/api', () => ({
  workspaceApi: { time: jest.fn(), reviewTime: jest.fn() },
}));
const request = {
  id: 'ot-lan',
  user_id: 'lan',
  full_name: 'Lan',
  work_date: '2026-10-30',
  status: 'PENDING',
  version: 5,
  requested_minutes: 60,
  request_type: 'OVERTIME',
  canReview: true,
};
beforeEach(() => jest.clearAllMocks());

test('an open IN only exposes the server-provided OUT action and preserves the saved punch', async () => {
  (workspaceApi.time as jest.Mock).mockResolvedValue({
    attendance: [],
    balances: [],
    requests: [],
    today: {
      status: 'WORKING',
      actions: ['OUT'],
      message: 'Giờ máy chủ',
      calendar: null,
      punches: [
        {
          id: 'p',
          punch_type: 'IN',
          recorded_at: '2030-05-06T01:00:00Z',
          network_status: 'UNCONFIGURED',
        },
      ],
    },
  });
  const ui = await render(
    <ThemeProvider theme={theme}>
      <TimeScreen />
    </ThemeProvider>,
  );
  await waitFor(() => expect(ui.getByText('Đã vào — chưa ra ca')).toBeTruthy());
  expect(ui.getByText('Quét QR · Ra ca')).toBeTruthy();
  expect(ui.queryByText('Quét QR · Vào ca')).toBeNull();
  expect(ui.queryByText('Quét QR · Bắt đầu OT')).toBeNull();
  expect(ui.getByText(/Có cảnh báo mạng, chờ xác minh/)).toBeTruthy();
});

test('network acknowledgement starts false and is transmitted only after an explicit review choice', async () => {
  const record = {
    ...request,
    id: 'record',
    network_review_required: true,
    regular_minutes: 180,
  };
  (workspaceApi.time as jest.Mock).mockResolvedValue({
    attendance: [record],
    balances: [],
    requests: [],
  });
  (workspaceApi.reviewTime as jest.Mock).mockResolvedValue(null);
  const ui = await render(
    <ThemeProvider theme={theme}>
      <TimeScreen />
    </ThemeProvider>,
  );
  await waitFor(() => expect(ui.getByText('Tôi được duyệt')).toBeTruthy());
  await fireEvent.press(ui.getByText('Tôi được duyệt'));
  await fireEvent.press(ui.getByText('Đồng ý'));
  expect(ui.getByText('Chưa xác minh mạng')).toBeTruthy();
  await fireEvent.changeText(
    ui.getByLabelText('Lý do / kết quả kiểm tra'),
    'Đã hỏi nhân viên và xác minh tại văn phòng',
  );
  await fireEvent.press(ui.getByText('Đã xác minh mạng, ghi căn cứ'));
  await fireEvent.press(ui.getByText('Xác nhận'));
  expect(workspaceApi.reviewTime).toHaveBeenCalledWith(
    record,
    true,
    'APPROVE',
    expect.stringContaining('Đã hỏi'),
    undefined,
    true,
    undefined,
  );
});

test('review identifies the employee and sends only that record/version after an explicit reason', async () => {
  (workspaceApi.time as jest.Mock).mockResolvedValue({
    attendance: [],
    balances: [],
    requests: [
      request,
      {
        ...request,
        id: 'own',
        user_id: 'me',
        full_name: 'Hải',
        canReview: false,
      },
    ],
  });
  (workspaceApi.reviewTime as jest.Mock).mockResolvedValue(null);
  const ui = await render(
    <ThemeProvider theme={theme}>
      <TimeScreen />
    </ThemeProvider>,
  );
  await waitFor(() => expect(ui.getByText('Hải')).toBeTruthy());
  expect(ui.queryByText('Lan')).toBeNull();
  expect(ui.queryByText('Đồng ý')).toBeNull();
  await fireEvent.press(ui.getByText('Tôi được duyệt'));
  expect(ui.getByText('Lan')).toBeTruthy();
  await fireEvent.press(ui.getByText('Đồng ý'));
  expect(ui.getByText('Lan · 2026-10-30')).toBeTruthy();
  await fireEvent.press(ui.getByText('Xác nhận'));
  expect(workspaceApi.reviewTime).not.toHaveBeenCalled();
  await fireEvent.changeText(
    ui.getByLabelText('Lý do / kết quả kiểm tra'),
    'Đã kiểm tra kế hoạch và nhu cầu tăng ca',
  );
  await fireEvent.press(ui.getByText('Xác nhận'));
  expect(workspaceApi.reviewTime).toHaveBeenCalledWith(
    request,
    false,
    'APPROVE',
    expect.stringContaining('Đã kiểm tra'),
    undefined,
    false,
    undefined,
  );
});
