import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { WorkDetailScreen } from '../../src/features/workspace/WorkScreens';
import { workspaceApi, Work } from '../../src/features/workspace/api';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { id: 'work' } }),
  useNavigation: () => ({}),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../../src/features/workspace/WorkspaceNavigator', () => ({
  useWorkplace: () => ({
    context: require('../test-utils/workplaceFixture').workplaceFixture,
  }),
}));
jest.mock('../../src/features/workspace/api', () => ({
  workspaceApi: { workDetail: jest.fn(), command: jest.fn() },
}));

const inheritedWork: Work = {
  id: 'work',
  version: 8,
  progress: 65,
  title: 'Tiếp tục phần Lan đã làm',
  description: 'Giữ tiến độ và lịch sử',
  status: 'HANDOVER',
  priority: 'MEDIUM',
  department_id: 'it',
  assignee_id: 'me',
  assignee_name: 'Hải',
  reviewer_id: 'manager',
  reviewer_name: 'Hùng',
  due_at: null,
  department_name: 'Công nghệ thông tin',
  allowedActions: ['ACCEPT_HANDOVER', 'COMMENT'],
  attachments: [],
  events: [],
  handovers: [],
};
describe('handover review on mobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (workspaceApi.workDetail as jest.Mock).mockResolvedValue(inheritedWork);
  });
  test('receiving a handover requires review and preserves the existing version/progress', async () => {
    (workspaceApi.command as jest.Mock).mockResolvedValue({
      ...inheritedWork,
      status: 'IN_PROGRESS',
    });
    const ui = await render(
      <ThemeProvider theme={theme}>
        <WorkDetailScreen />
      </ThemeProvider>,
    );
    await waitFor(() =>
      expect(ui.getByText('Rà soát trước khi tiếp tục')).toBeTruthy(),
    );
    expect(ui.queryByText('Nghiệm thu')).toBeNull();
    await fireEvent.press(ui.getByText('Rà soát và tiếp nhận'));
    await fireEvent.press(ui.getAllByText('Rà soát và tiếp nhận').at(-1)!);
    expect(workspaceApi.command).not.toHaveBeenCalled();
    await fireEvent.changeText(
      ui.getByLabelText('Kết quả rà soát và phần việc tiếp tục'),
      'Đã kiểm tra cấu hình; tiếp tục kiểm tra máy trạm.',
    );
    await act(async () => {
      await fireEvent.press(ui.getAllByText('Rà soát và tiếp nhận').at(-1)!);
    });
    expect(workspaceApi.command).toHaveBeenCalledWith(
      expect.objectContaining({ version: 8, progress: 65 }),
      'ACCEPT_HANDOVER',
      expect.stringContaining('Đã kiểm tra'),
      undefined,
      undefined,
    );
  });
  test('a concurrent update refreshes detail and does not silently retry an old command', async () => {
    (workspaceApi.command as jest.Mock).mockRejectedValue({
      kind: 'CONFLICT',
      message: 'Dữ liệu đã thay đổi. Tải lại.',
    });
    const ui = await render(
      <ThemeProvider theme={theme}>
        <WorkDetailScreen />
      </ThemeProvider>,
    );
    await waitFor(() =>
      expect(ui.getByText('Rà soát trước khi tiếp tục')).toBeTruthy(),
    );
    await fireEvent.press(ui.getByText('Rà soát và tiếp nhận'));
    await fireEvent.changeText(
      ui.getByLabelText('Kết quả rà soát và phần việc tiếp tục'),
      'Đã kiểm tra phần bàn giao',
    );
    await act(async () => {
      await fireEvent.press(ui.getAllByText('Rà soát và tiếp nhận').at(-1)!);
    });
    await waitFor(() =>
      expect(ui.getByText('Dữ liệu đã thay đổi. Tải lại.')).toBeTruthy(),
    );
    expect(workspaceApi.command).toHaveBeenCalledTimes(1);
    expect(workspaceApi.workDetail).toHaveBeenCalledTimes(2);
  });
});
