import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import { PunchHistory } from '../../src/features/workspace/PunchHistory';
import { workspaceApi } from '../../src/features/workspace/api';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';
jest.mock('react-native-keychain', () => ({}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('../../src/features/workspace/api', () => ({
  workspaceApi: { punchHistory: jest.fn() },
}));
const row = (id: string, name: string) => ({
  id,
  user_id: id,
  full_name: name,
  punch_type: 'IN',
  recorded_at: '2032-01-01T01:00:00Z',
  network_status: 'MISMATCH',
  station_name: 'Điểm văn phòng',
});
const page = (index: number, items: object[], hasNext = false) => ({
  items,
  page: index,
  size: 20,
  total: 21,
  hasNext,
});
function screen(period = '2032-01') {
  return (
    <ThemeProvider theme={theme}>
      <PunchHistory key={period} period={period} />
    </ThemeProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  (workspaceApi.punchHistory as jest.Mock).mockReset();
});

test('next/previous request the scoped page and never mix rows between pages', async () => {
  (workspaceApi.punchHistory as jest.Mock)
    .mockResolvedValueOnce(page(0, [row('a', 'Fixture A')], true))
    .mockResolvedValueOnce(page(1, [row('b', 'Fixture B')]))
    .mockResolvedValueOnce(page(0, [row('a', 'Fixture A')], true));
  const ui = await render(screen());
  await waitFor(() => expect(ui.getByText('Fixture A')).toBeTruthy());
  expect(ui.queryByText('Lượt quét: trang trước')).toBeNull();
  expect(ui.getByText('Khác mạng — cần xác minh')).toBeTruthy();
  await fireEvent.press(ui.getByText('Lượt quét: trang sau'));
  await waitFor(() => expect(ui.getByText('Fixture B')).toBeTruthy());
  expect(ui.queryByText('Fixture A')).toBeNull();
  expect(ui.queryByText('Lượt quét: trang sau')).toBeNull();
  expect(workspaceApi.punchHistory).toHaveBeenLastCalledWith('2032-01', 1);
  await fireEvent.press(ui.getByText('Lượt quét: trang trước'));
  await waitFor(() => expect(ui.getByText('Fixture A')).toBeTruthy());
  expect(workspaceApi.punchHistory).toHaveBeenLastCalledWith('2032-01', 0);
});

test('a failed next page clears old rows, offers retry and never displays false empty success', async () => {
  (workspaceApi.punchHistory as jest.Mock)
    .mockResolvedValueOnce(page(0, [row('a', 'Fixture A')], true))
    .mockRejectedValueOnce(new Error('Mạng thử bị gián đoạn'))
    .mockResolvedValueOnce(page(1, [row('b', 'Fixture B')]));
  const ui = await render(screen());
  await waitFor(() => expect(ui.getByText('Fixture A')).toBeTruthy());
  await fireEvent.press(ui.getByText('Lượt quét: trang sau'));
  await waitFor(() =>
    expect(ui.getByText('Mạng thử bị gián đoạn')).toBeTruthy(),
  );
  expect(ui.queryByText('Fixture A')).toBeNull();
  expect(ui.queryByText('Trang này chưa có lượt quét.')).toBeNull();
  await fireEvent.press(ui.getByText('Tải lại lịch sử quét'));
  await waitFor(() => expect(ui.getByText('Fixture B')).toBeTruthy());
  expect(workspaceApi.punchHistory).toHaveBeenLastCalledWith('2032-01', 1);
});

test('changing the month resets pagination and discards a late response from the old month', async () => {
  let resolveOld!: (value: object) => void;
  const old = new Promise(resolve => {
    resolveOld = resolve;
  });
  (workspaceApi.punchHistory as jest.Mock)
    .mockReturnValueOnce(old)
    .mockResolvedValueOnce(page(0, [row('new', 'Tháng mới')]));
  const ui = await render(screen());
  await waitFor(() =>
    expect(workspaceApi.punchHistory).toHaveBeenCalledWith('2032-01', 0),
  );
  await ui.rerender(screen('2032-02'));
  await waitFor(() => expect(ui.getByText('Tháng mới')).toBeTruthy());
  await act(async () => {
    resolveOld(page(0, [row('old', 'Tháng cũ')]));
  });
  expect(ui.queryByText('Tháng cũ')).toBeNull();
  expect(workspaceApi.punchHistory).toHaveBeenLastCalledWith('2032-02', 0);
});
