import { NativeModules, Platform } from 'react-native';
import { http } from '../../shared/api/apiClient';
import { getSessionCredentialGeneration } from '../../app/auth/sessionCredentialCoordinator';
import type { Attachment } from './api';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
export type AttachmentPurpose = 'TASK_ATTACHMENT' | 'SERVICE_ATTACHMENT';
type CachedFile = {
  cacheId: string;
  uri: string;
  name: string;
  type: string;
  size: number;
};
export type AttachmentDraft = CachedFile & {
  generation: number;
  uploadedId?: string;
  uploading?: Promise<string>;
  discarded?: boolean;
  linked?: boolean;
};
function bridge() {
  const native = NativeModules.WorkplaceFiles;
  if (Platform.OS !== 'android' || !native?.pickAttachment)
    throw new Error('Tệp đính kèm hiện dùng trong bản Android mới.');
  return native;
}
export function validateAttachment(name: string, size: number): string {
  if (!name || name.length > 255 || /[\\/\x00-\x1f\x7f]/.test(name))
    throw new Error('Tên tệp không hợp lệ.');
  const mime = MIME[name.split('.').pop()?.toLowerCase() ?? ''];
  if (!mime) throw new Error('Chỉ hỗ trợ JPG, PNG, WEBP, PDF, DOCX và XLSX.');
  const max = (mime.startsWith('image/') ? 10 : 20) * 1024 * 1024;
  if (!Number.isSafeInteger(size) || size <= 0 || size > max)
    throw new Error(
      `Tệp phải có nội dung và không vượt ${max / 1024 / 1024} MB.`,
    );
  return mime;
}
function current(generation: number, draft?: AttachmentDraft) {
  if (generation !== getSessionCredentialGeneration() || draft?.discarded)
    throw new Error(
      'Phiên hoặc lựa chọn tệp đã thay đổi. Hãy tải lại và chọn lại tệp.',
    );
}
function release(cacheId: string) {
  try {
    NativeModules.WorkplaceFiles?.releaseAttachment(cacheId);
  } catch {
    /* private cache is also purged on session invalidation */
  }
}
export async function pickAttachment(): Promise<AttachmentDraft | null> {
  const generation = getSessionCredentialGeneration();
  const file: CachedFile | null = await bridge().pickAttachment();
  if (!file) return null;
  try {
    current(generation);
    const mime = validateAttachment(file.name, file.size);
    if (!file.cacheId || !file.uri.startsWith('file:///') || file.type !== mime)
      throw new Error('Tệp đã chọn không hợp lệ.');
    return { ...file, generation };
  } catch (e) {
    release(file.cacheId);
    throw e;
  }
}
export function discardAttachment(draft: AttachmentDraft | null) {
  if (!draft || draft.discarded) return;
  draft.discarded = true;
  const cleanup = async () => {
    release(draft.cacheId);
    // Server refuses to remove a file that was linked despite a lost command response.
    if (
      draft.uploadedId &&
      !draft.linked &&
      draft.generation === getSessionCredentialGeneration()
    ) {
      try {
        await http.delete(`/files/${encodeURIComponent(draft.uploadedId)}`, {
          _sessionGeneration: draft.generation,
        });
      } catch {
        /* never claim the server file was deleted */
      }
    }
  };
  if (draft.uploading)
    void draft.uploading.catch(() => undefined).then(cleanup);
  else void cleanup();
}
async function upload(
  draft: AttachmentDraft,
  purpose: AttachmentPurpose,
): Promise<string> {
  current(draft.generation, draft);
  if (draft.uploadedId) return draft.uploadedId;
  if (!draft.uploading) {
    draft.uploading = (async () => {
      const form = new FormData();
      form.append('purpose', purpose);
      form.append('file', {
        uri: draft.uri,
        name: draft.name,
        type: draft.type,
      } as unknown as Blob);
      const value = await http.post<FormData, { id: string }>('/files', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        _sessionGeneration: draft.generation,
      });
      // Retain the ID after an upload so retrying a failed attach does not upload it twice.
      if (!value?.id)
        throw new Error('Máy chủ chưa xác nhận tệp. Hãy thử lại.');
      draft.uploadedId = value.id;
      current(draft.generation, draft);
      return value.id;
    })();
  }
  try {
    return await draft.uploading;
  } finally {
    draft.uploading = undefined;
  }
}
export async function submitWithAttachment<T>(
  draft: AttachmentDraft | null,
  purpose: AttachmentPurpose,
  submit: (fileIds: string[], generation: number) => Promise<T>,
): Promise<T> {
  const generation = draft?.generation ?? getSessionCredentialGeneration();
  current(generation, draft ?? undefined);
  const ids = draft ? [await upload(draft, purpose)] : [];
  current(generation, draft ?? undefined);
  const result = await submit(ids, generation);
  current(generation, draft ?? undefined);
  if (draft) draft.linked = true;
  return result;
}

export function encodeFileBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer),
    alphabet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const parts: string[] = [];
  let part = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i],
      b = bytes[i + 1] ?? 0,
      c = bytes[i + 2] ?? 0;
    part +=
      alphabet[a >> 2] +
      alphabet[((a & 3) << 4) | (b >> 4)] +
      (i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=') +
      (i + 2 < bytes.length ? alphabet[c & 63] : '=');
    if (part.length >= 16384) {
      parts.push(part);
      part = '';
    }
  }
  parts.push(part);
  return parts.join('');
}
export async function downloadAttachment(
  file: Attachment,
  mode: 'open' | 'save',
  signal?: AbortSignal,
): Promise<boolean> {
  const native = bridge(),
    generation = getSessionCredentialGeneration();
  const active = () => {
    current(generation);
    if (signal?.aborted) throw new Error('Đã hủy tải tệp.');
  };
  active();
  const id = file.fileId ?? file.id,
    name = file.originalName ?? file.original_name ?? '';
  if (!id || !/^[\da-f-]{36}$/i.test(id))
    throw new Error('Mã tệp không hợp lệ. Tải lại trang chi tiết.');
  const bytes = await http.get<ArrayBuffer>(
    `/files/${encodeURIComponent(id)}/download`,
    {
      responseType: 'arraybuffer',
      timeout: 120000,
      _sessionGeneration: generation,
      signal,
    },
  );
  active();
  if (!(bytes instanceof ArrayBuffer))
    throw new Error('Máy chủ chưa trả nội dung tệp hợp lệ.');
  validateAttachment(name, bytes.byteLength);
  let cached: CachedFile | undefined;
  try {
    cached = await native.cacheAttachment(encodeFileBase64(bytes), name);
    active();
    if (!cached?.cacheId) throw new Error('Không tạo được tệp tạm.');
    if (mode === 'save') {
      const saved = await native.saveAttachment(cached.cacheId);
      active();
      release(cached.cacheId);
      return saved === true;
    }
    await native.openAttachment(cached.cacheId);
    active();
    return true; // Keep the private copy until session teardown/expiry for the external reader.
  } catch (e) {
    if (cached) release(cached.cacheId);
    throw e;
  }
}
