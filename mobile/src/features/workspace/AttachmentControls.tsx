import React, { useEffect, useRef, useState } from 'react';
import { normalizeError } from '../../shared/api/apiError';
import type { Attachment } from './api';
import {
  AttachmentDraft,
  discardAttachment,
  downloadAttachment,
  pickAttachment,
} from './attachmentFiles';
import { Button, Card, Copy } from './ui';

export function useAttachmentDraft() {
  const [draft, setDraft] = useState<AttachmentDraft | null>(null);
  const ref = useRef(draft);
  ref.current = draft;
  useEffect(() => () => discardAttachment(ref.current), []);
  const clear = () => {
    discardAttachment(ref.current);
    ref.current = null;
    setDraft(null);
  };
  return {
    draft,
    setDraft: (next: AttachmentDraft | null) => {
      ref.current = next;
      setDraft(next);
    },
    clear,
  };
}
export function AttachmentPicker({
  draft,
  onChange,
  busy = false,
}: {
  draft: AttachmentDraft | null;
  onChange: (draft: AttachmentDraft | null) => void;
  busy?: boolean;
}) {
  const [picking, setPicking] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false),
    live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const choose = async () => {
    if (lock.current || busy) return;
    lock.current = true;
    setPicking(true);
    setError('');
    try {
      const next = await pickAttachment();
      if (!live.current) {
        discardAttachment(next);
        return;
      }
      if (next) {
        discardAttachment(draft);
        onChange(next);
      }
    } catch (e) {
      if (live.current)
        setError(e instanceof Error ? e.message : normalizeError(e).message);
    } finally {
      lock.current = false;
      if (live.current) setPicking(false);
    }
  };
  return (
    <Card>
      <Copy>Tệp đính kèm (không bắt buộc)</Copy>
      <Copy muted>
        JPG, PNG, WEBP tối đa10MB; PDF, DOCX, XLSX tối đa20MB. Chọn một tệp mỗi
        lần gửi.
      </Copy>
      {draft && (
        <Copy>
          {draft.name} · {Math.ceil(draft.size / 1024)} KB
        </Copy>
      )}
      {!!error && <Copy>{error}</Copy>}
      <Button
        title={draft ? 'Chọn tệp khác' : 'Chọn tệp'}
        secondary
        busy={busy || picking}
        onPress={() => void choose()}
      />
      {draft && (
        <Button
          title="Bỏ lựa chọn tệp"
          secondary
          busy={busy || picking}
          onPress={() => {
            discardAttachment(draft);
            onChange(null);
          }}
        />
      )}
    </Card>
  );
}
export function AttachmentList({ files }: { files: Attachment[] }) {
  const controller = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const lock = useRef(false),
    live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      controller.current?.abort();
    };
  }, []);
  const perform = async (file: Attachment, mode: 'open' | 'save') => {
    if (lock.current) return;
    lock.current = true;
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const result = await downloadAttachment(file, mode, request.signal);
      if (live.current)
        setMessage(
          result
            ? mode === 'save'
              ? 'Đã lưu bản sao tại nơi bạn chọn.'
              : 'Đã gửi tệp tới bộ chọn ứng dụng đọc.'
            : 'Đã hủy lưu; chưa ghi bản sao.',
        );
    } catch (e) {
      if (live.current)
        setError(e instanceof Error ? e.message : normalizeError(e).message);
    } finally {
      lock.current = false;
      if (controller.current === request) controller.current = null;
      if (live.current) setBusy(false);
    }
  };
  if (!files.length) return null;
  return (
    <Card>
      <Copy title>Tệp đính kèm</Copy>
      <Copy muted>
        Mở bằng ứng dụng bạn chọn hoặc lưu bản sao. Ứng dụng đọc/nơi lưu sẽ nhận
        nội dung tệp.
      </Copy>
      {!!error && <Copy>{error}</Copy>}
      {!!message && <Copy>{message}</Copy>}
      {files.map(file => (
        <React.Fragment key={file.fileId ?? file.id}>
          <Copy>
            {file.originalName ?? file.original_name ?? 'Tệp đính kèm'}
          </Copy>
          <Button
            title="Mở tệp"
            secondary
            busy={busy}
            onPress={() => void perform(file, 'open')}
          />
          <Button
            title="Lưu bản sao"
            secondary
            busy={busy}
            onPress={() => void perform(file, 'save')}
          />
        </React.Fragment>
      ))}
    </Card>
  );
}
