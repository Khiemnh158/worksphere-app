import { AxiosError, AxiosHeaders } from 'axios';
import {
  apiClient,
  registerTokenRefreshHandler,
} from '../../src/shared/api/apiClient';
import { binaryErrorEnvelope } from '../../src/shared/api/binaryError';
const { Buffer } = require('buffer');

const asBytes = (v: object) =>
  Uint8Array.from(Buffer.from(JSON.stringify(v), 'utf8')).buffer;
test('only bounded JSON API errors are decoded, preserving UTF-8 messages and ignoring arbitrary files', () => {
  const envelope = {
    success: false,
    code: 'FILE_ACCESS_DENIED',
    message: 'Không có quyền tải tệp',
    timestamp: 'fixture',
  };
  expect(binaryErrorEnvelope(asBytes(envelope), 'application/json')).toEqual(
    envelope,
  );
  const pdf = new Uint8Array([37, 80, 68, 70]).buffer;
  expect(binaryErrorEnvelope(pdf, 'application/pdf')).toBe(pdf);
  expect(binaryErrorEnvelope(pdf, 'application/json')).toBe(pdf);
  const huge = new ArrayBuffer(65537);
  expect(binaryErrorEnvelope(huge, 'application/json')).toBe(huge);
});
test('a binary download 401 follows the existing refresh coordinator and retries once with its session binding', async () => {
  const refresh = jest.fn().mockResolvedValue('fixture-access');
  const unregister = registerTokenRefreshHandler(refresh);
  const request = jest
    .spyOn(apiClient, 'request')
    .mockResolvedValue({ data: new ArrayBuffer(1) } as never);
  const config = {
    url: '/files/fixture/download',
    headers: new AxiosHeaders({ Authorization: 'Bearer old-fixture' }),
  };
  const error = new AxiosError('Unauthorized', '401', config as never, {}, {
    status: 401,
    statusText: 'Unauthorized',
    config,
    headers: { 'content-type': 'application/json' },
    data: asBytes({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Phiên hết hạn',
      timestamp: 'fixture',
    }),
  } as never);
  const rejected = (
    apiClient.interceptors.response as unknown as {
      handlers: { rejected: (e: unknown) => Promise<unknown> }[];
    }
  ).handlers[0].rejected;
  try {
    await rejected(error);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        _retry: true,
        headers: expect.any(AxiosHeaders),
      }),
    );
    expect(config.headers.get('Authorization')).toBe('Bearer fixture-access');
  } finally {
    request.mockRestore();
    unregister();
  }
});
