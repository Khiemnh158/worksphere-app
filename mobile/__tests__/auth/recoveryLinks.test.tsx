import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import {
  parseRecoveryLink,
  useRecoveryLink,
} from '../../src/app/navigation/recoveryLinks';
import type { SessionState } from '../../src/app/navigation/types';

const token = 'a'.repeat(43);
const reset = `worksphere://reset/${token}`;
let receive: (event: { url: string }) => void;
const remove = jest.fn();
beforeEach(() => {
  jest.restoreAllMocks();
  remove.mockClear();
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  jest
    .spyOn(Linking, 'addEventListener')
    .mockImplementation((_type, listener) => {
      receive = listener;
      return { remove };
    });
});

test('strictly parses both recovery purposes without accepting arbitrary navigation', () => {
  expect(parseRecoveryLink(reset)).toEqual({ screen: 'ResetPassword', token });
  expect(parseRecoveryLink(`worksphere://activate/${token}`)).toEqual({
    screen: 'ActivateAccount',
    token,
  });
  for (const invalid of [
    null,
    'https://example.test/#reset/' + token,
    reset + '?redirect=Main',
    reset + '/extra',
    reset + '#extra',
    reset.replace('reset', 'staff'),
    reset.replace('worksphere:', 'javascript:'),
    reset.slice(0, -1),
    'worksphere://reset/%61'.repeat(43),
  ]) {
    expect(parseRecoveryLink(invalid)).toBeNull();
  }
});

test('cold URL waits for bootstrap and then opens a form for a signed-out session', async () => {
  (Linking.getInitialURL as jest.Mock).mockResolvedValue(reset);
  const ui = await renderHook(
    ({ state }: { state: SessionState }) => useRecoveryLink(state),
    { initialProps: { state: 'INITIALIZING' as SessionState } },
  );
  await act(async () => {});
  expect(ui.result.current).toBeNull();
  await ui.rerender({ state: 'UNAUTHENTICATED' });
  await waitFor(() => expect(ui.result.current?.screen).toBe('ResetPassword'));
});

test('a restored session discards pending links and does not replay them after logout', async () => {
  (Linking.getInitialURL as jest.Mock).mockResolvedValue(reset);
  const ui = await renderHook(
    ({ state }: { state: SessionState }) => useRecoveryLink(state),
    { initialProps: { state: 'INITIALIZING' as SessionState } },
  );
  await act(async () => {});
  await ui.rerender({ state: 'AUTHENTICATED' });
  await act(async () => receive({ url: reset }));
  expect(ui.result.current).toBeNull();
  await ui.rerender({ state: 'UNAUTHENTICATED' });
  expect(ui.result.current).toBeNull();
});

test('a new warm URL wins over a late initial URL and subscription is cleaned up', async () => {
  let resolve!: (value: string | null) => void;
  (Linking.getInitialURL as jest.Mock).mockReturnValue(
    new Promise<string | null>(r => {
      resolve = r;
    }),
  );
  const ui = await renderHook(() => useRecoveryLink('UNAUTHENTICATED'));
  await act(async () => receive({ url: `worksphere://activate/${token}` }));
  await act(async () => resolve(reset));
  expect(ui.result.current?.screen).toBe('ActivateAccount');
  await ui.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('malformed warm link cannot open a form; native URL lookup failure remains harmless', async () => {
  (Linking.getInitialURL as jest.Mock).mockRejectedValue(
    new Error('unavailable'),
  );
  const ui = await renderHook(() => useRecoveryLink('UNAUTHENTICATED'));
  await act(async () =>
    receive({ url: 'worksphere://reset/not-a-valid-token' }),
  );
  expect(ui.result.current).toBeNull();
});
