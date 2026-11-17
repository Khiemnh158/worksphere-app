import { NativeModules, Platform } from 'react-native';
import { http } from '../../src/shared/api/apiClient';
import {
  discardAttachment,
  downloadAttachment,
  encodeFileBase64,
  pickAttachment,
  submitWithAttachment,
  validateAttachment,
} from '../../src/features/workspace/attachmentFiles';
import type { AttachmentDraft } from '../../src/features/workspace/attachmentFiles';
const { Buffer } = require('buffer');
let mockGeneration = 10;
jest.mock('../../src/app/auth/sessionCredentialCoordinator', () => ({
  getSessionCredentialGeneration: () => mockGeneration,
}));
jest.mock('../../src/shared/api/apiClient', () => ({
  http: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));
const file = {
  cacheId: 'cache',
  uri: 'file:///private/fixture.pdf',
  name: 'fixture.pdf',
  type: 'application/pdf',
  size: 128,
};
const native = {
  pickAttachment: jest.fn(),
  releaseAttachment: jest.fn(),
  cacheAttachment: jest.fn(),
  openAttachment: jest.fn(),
  saveAttachment: jest.fn(),
};
const serverFile = {
  fileId: '11111111-1111-4111-8111-111111111111',
  originalName: 'fixture.pdf',
};
beforeEach(() => {
  // Jest runs on Node, whose FormData does not support RN's { uri, name, type } file parts.
  Object.defineProperty(globalThis, 'FormData', {
    value: require('react-native/Libraries/Network/FormData').default,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(Platform, 'OS', {
    value: 'android',
    configurable: true,
  });
  jest.clearAllMocks();
  mockGeneration = 10;
  NativeModules.WorkplaceFiles = native;
  native.pickAttachment.mockResolvedValue(file);
  native.cacheAttachment.mockResolvedValue(file);
  native.openAttachment.mockResolvedValue(true);
  native.saveAttachment.mockResolvedValue(true);
  (http.post as jest.Mock).mockResolvedValue({ id: 'server-file' });
  (http.delete as jest.Mock).mockResolvedValue(null);
});
test('cancelled picker has no upload; a response after switching sessions is released and cannot submit', async () => {
  native.pickAttachment.mockResolvedValueOnce(null);
  expect(await pickAttachment()).toBeNull();
  native.pickAttachment.mockImplementationOnce(async () => {
    mockGeneration++;
    return file;
  });
  await expect(pickAttachment()).rejects.toThrow('Phiên');
  expect(native.releaseAttachment).toHaveBeenCalledWith(file.cacheId);
  expect(http.post).not.toHaveBeenCalled();
});
test('picker rejects a remote upload URI or mismatched type before any upload', async () => {
  native.pickAttachment.mockResolvedValueOnce({
    ...file,
    uri: 'https://example.test/file.pdf',
  });
  await expect(pickAttachment()).rejects.toThrow('hợp lệ');
  native.pickAttachment.mockResolvedValueOnce({ ...file, type: 'text/html' });
  await expect(pickAttachment()).rejects.toThrow('hợp lệ');
});
test('upload enforces purpose/multipart and binds both upload and attach to the starting generation', async () => {
  const draft = await pickAttachment();
  const submit = jest.fn().mockResolvedValue('ok');
  expect(await submitWithAttachment(draft, 'TASK_ATTACHMENT', submit)).toBe(
    'ok',
  );
  const [url, form, config] = (http.post as jest.Mock).mock.calls[0];
  expect(url).toBe('/files');
  expect(config).toMatchObject({
    _sessionGeneration: 10,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  expect(form.getParts()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        fieldName: 'purpose',
        string: 'TASK_ATTACHMENT',
      }),
      expect.objectContaining({
        fieldName: 'file',
        uri: file.uri,
        name: file.name,
        type: file.type,
      }),
    ]),
  );
  expect(submit).toHaveBeenCalledWith(['server-file'], 10);
  discardAttachment(draft);
  expect(http.delete).not.toHaveBeenCalled();
});
test('a session switch while uploading cannot attach the resulting file under another account', async () => {
  const draft = await pickAttachment();
  const submit = jest.fn();
  (http.post as jest.Mock).mockImplementationOnce(async () => {
    mockGeneration++;
    return { id: 'uploaded' };
  });
  await expect(
    submitWithAttachment(draft, 'SERVICE_ATTACHMENT', submit),
  ).rejects.toThrow('Phiên');
  expect(submit).not.toHaveBeenCalled();
  discardAttachment(draft);
  await Promise.resolve();
  expect(http.delete).not.toHaveBeenCalled();
});
test('an uploaded file is reused when attach fails; cancelling only attempts server deletion with its original generation', async () => {
  const draft = await pickAttachment();
  const submit = jest
    .fn()
    .mockRejectedValueOnce(new Error('conflict'))
    .mockResolvedValueOnce('ok');
  await expect(
    submitWithAttachment(draft, 'SERVICE_ATTACHMENT', submit),
  ).rejects.toThrow('conflict');
  await submitWithAttachment(draft, 'SERVICE_ATTACHMENT', submit);
  expect(http.post).toHaveBeenCalledTimes(1);
  const abandoned = {
    ...file,
    generation: 10,
    uploadedId: 'abandoned',
  } as AttachmentDraft;
  discardAttachment(abandoned);
  await Promise.resolve();
  expect(http.delete).toHaveBeenCalledWith('/files/abandoned', {
    _sessionGeneration: 10,
  });
});
test('discarding an in-flight draft stops the attach step and cleans up after upload finishes', async () => {
  const draft = await pickAttachment();
  const submit = jest.fn();
  let resolve!: (value: { id: string }) => void;
  (http.post as jest.Mock).mockReturnValueOnce(
    new Promise(r => {
      resolve = r;
    }),
  );
  const result = submitWithAttachment(draft, 'TASK_ATTACHMENT', submit);
  discardAttachment(draft);
  resolve({ id: 'orphan' });
  await expect(result).rejects.toThrow('lựa chọn');
  await Promise.resolve();
  expect(submit).not.toHaveBeenCalled();
});
test.each(['open', 'save'] as const)(
  'authorized %s downloads bytes with auth transport rather than leaking a bearer token in a URL',
  async mode => {
    const bytes = Uint8Array.from([37, 80, 68, 70, 45]).buffer;
    (http.get as jest.Mock).mockResolvedValue(bytes);
    expect(await downloadAttachment(serverFile, mode)).toBe(true);
    expect(http.get).toHaveBeenCalledWith(
      '/files/' + serverFile.fileId + '/download',
      expect.objectContaining({
        responseType: 'arraybuffer',
        _sessionGeneration: 10,
      }),
    );
    expect(native.cacheAttachment).toHaveBeenCalledWith(
      'JVBERi0=',
      'fixture.pdf',
    );
    expect(
      mode === 'open' ? native.openAttachment : native.saveAttachment,
    ).toHaveBeenCalledWith('cache');
  },
);
test('server denial creates no local file and opens no viewer', async () => {
  (http.get as jest.Mock).mockRejectedValue(new Error('forbidden'));
  await expect(downloadAttachment(serverFile, 'open')).rejects.toThrow(
    'forbidden',
  );
  expect(native.cacheAttachment).not.toHaveBeenCalled();
  expect(native.openAttachment).not.toHaveBeenCalled();
});
test('leaving the file list aborts a late download before it can cache or open a viewer', async () => {
  const controller = new AbortController();
  (http.get as jest.Mock).mockImplementationOnce(async () => {
    controller.abort();
    return new Uint8Array([1]).buffer;
  });
  await expect(
    downloadAttachment(serverFile, 'open', controller.signal),
  ).rejects.toThrow('hủy');
  expect(native.cacheAttachment).not.toHaveBeenCalled();
  expect(native.openAttachment).not.toHaveBeenCalled();
});
test('cancelled Save As is not reported as saved; an old download cannot reach the native viewer', async () => {
  (http.get as jest.Mock).mockResolvedValue(new Uint8Array([1, 2]).buffer);
  native.saveAttachment.mockResolvedValueOnce(false);
  expect(await downloadAttachment(serverFile, 'save')).toBe(false);
  (http.get as jest.Mock).mockImplementationOnce(async () => {
    mockGeneration++;
    return new Uint8Array([1]).buffer;
  });
  await expect(downloadAttachment(serverFile, 'open')).rejects.toThrow('Phiên');
  expect(native.openAttachment).not.toHaveBeenCalled();
});
test('a session switch during cache write releases the late file and never opens it', async () => {
  (http.get as jest.Mock).mockResolvedValue(new Uint8Array([1]).buffer);
  native.cacheAttachment.mockImplementationOnce(async () => {
    mockGeneration++;
    return file;
  });
  await expect(downloadAttachment(serverFile, 'open')).rejects.toThrow('Phiên');
  expect(native.releaseAttachment).toHaveBeenCalledWith('cache');
  expect(native.openAttachment).not.toHaveBeenCalled();
});
test('size/type/name limits match server policy; chunked base64 retains every byte and padding', () => {
  expect(validateAttachment('a.JPG', 10 * 1024 * 1024)).toBe('image/jpeg');
  expect(validateAttachment('a.docx', 20 * 1024 * 1024)).toMatch(
    /wordprocessing/,
  );
  for (const [name, size] of [
    ['x.exe', 1],
    ['x.pdf', 0],
    ['../x.pdf', 1],
    ['x.png', 10 * 1024 * 1024 + 1],
    ['x.xlsx', 20 * 1024 * 1024 + 1],
  ] as const)
    expect(() => validateAttachment(name, size)).toThrow();
  for (const n of [1, 2, 3, 16383, 16384, 20001]) {
    const bytes = Uint8Array.from({ length: n }, (_, i) => i % 256);
    expect(encodeFileBase64(bytes.buffer)).toBe(
      Buffer.from(bytes).toString('base64'),
    );
  }
});
