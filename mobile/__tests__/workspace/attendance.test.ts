import { scanAndPunch } from '../../src/features/workspace/attendance';
import { workspaceApi } from '../../src/features/workspace/api';
import { invalidateSessionCredentials } from '../../src/app/auth/sessionCredentialCoordinator';
jest.mock('../../src/features/workspace/api', () => ({
  workspaceApi: { punch: jest.fn() },
}));
jest.mock('react-native-keychain', () => ({}));

describe('camera attendance session boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('cancel or another QR never creates an attendance punch', async () => {
    await expect(scanAndPunch(async () => null, 'IN')).resolves.toBeNull();
    await expect(
      scanAndPunch(async () => 'https://example.com', 'IN'),
    ).rejects.toThrow('QR');
    expect(workspaceApi.punch).not.toHaveBeenCalled();
  });
  test('camera result arriving after account switch cannot punch for the new account', async () => {
    let finish!: (value: string) => void;
    const pending = new Promise<string>(resolve => {
      finish = resolve;
    });
    const result = scanAndPunch(() => pending, 'OUT');
    invalidateSessionCredentials();
    finish(`worksphere-attendance:${'a'.repeat(43)}`);
    await expect(result).rejects.toThrow('Phiên đã thay đổi');
    expect(workspaceApi.punch).not.toHaveBeenCalled();
  });
  test('a valid scan binds its request to the session that opened the camera', async () => {
    (workspaceApi.punch as jest.Mock).mockResolvedValue({
      recordedAt: 'server-time',
    });
    await scanAndPunch(
      async () => `worksphere-attendance:${'b'.repeat(43)}`,
      'IN',
    );
    expect(workspaceApi.punch).toHaveBeenCalledWith(
      'b'.repeat(43),
      'IN',
      expect.any(Number),
    );
  });
});
