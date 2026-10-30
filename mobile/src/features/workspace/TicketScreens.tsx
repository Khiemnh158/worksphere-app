import React, { useCallback, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { normalizeError } from '../../shared/api/apiError';
import { Ticket, TicketPriority, ticketPriorities, workspaceApi } from './api';
import {
  useWorkplace,
  WorkspaceNavigation,
  WorkspaceRoutes,
} from './WorkspaceNavigator';
import { Button, Card, Choices, Copy, Field, Page, useLoad } from './ui';
import { dateTime, label, ticketActionLabels } from './rules';

export function TicketListScreen() {
  const { context } = useWorkplace();
  const navigation = useNavigation<WorkspaceNavigation>();
  const [scope, setScope] = useState('mine');
  const [page, setPage] = useState(0);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const state = useLoad(
    useCallback(
      () => workspaceApi.tickets(scope, page, search),
      [scope, page, search],
    ),
  );
  return (
    <Page error={state.error} loading={state.loading} onRefresh={state.refresh}>
      <Copy title>Yêu cầu hỗ trợ</Copy>
      <Button
        title="Gửi yêu cầu mới"
        onPress={() => navigation.navigate('CreateTicket')}
      />
      <Choices
        value={scope}
        onChange={value => {
          setScope(value);
          setPage(0);
        }}
        values={[
          { id: 'mine', name: 'Tôi đã gửi' },
          { id: 'assigned', name: 'Tôi xử lý' },
          ...(context.supportDepartments.length
            ? [{ id: 'queue', name: 'Phòng tiếp nhận' }]
            : []),
        ]}
      />
      <Field label="Tìm theo tiêu đề hoặc mã" value={text} onChange={setText} />
      <Button
        title="Tìm kiếm"
        secondary
        onPress={() => {
          setSearch(text.trim());
          setPage(0);
        }}
      />
      {state.data?.items.map(row => (
        <Card key={row.id}>
          <Copy muted>
            {row.request_number} · {label(row.status)}
          </Copy>
          <Copy title>{row.title}</Copy>
          <Copy muted>{row.department_name}</Copy>
          <Button
            title="Chi tiết →"
            secondary
            onPress={() => navigation.navigate('TicketDetail', { id: row.id })}
          />
        </Card>
      ))}
      {state.data && !state.data.items.length && (
        <Card>
          <Copy>Chưa có yêu cầu trong phạm vi này.</Copy>
        </Card>
      )}
      {state.data && (
        <>
          <Copy muted>
            Trang {page + 1} · {state.data.totalItems} yêu cầu
          </Copy>
          {state.data.hasPrevious && (
            <Button
              title="Trang trước"
              secondary
              busy={state.loading}
              onPress={() => setPage(value => value - 1)}
            />
          )}
          {state.data.hasNext && (
            <Button
              title="Trang tiếp"
              secondary
              busy={state.loading}
              onPress={() => setPage(value => value + 1)}
            />
          )}
        </>
      )}
    </Page>
  );
}
export function CreateTicketScreen() {
  const navigation = useNavigation<WorkspaceNavigation>();
  const { context } = useWorkplace();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (busy) return;
    if (
      !category ||
      !title.trim() ||
      title.trim().length > 255 ||
      !description.trim()
    ) {
      setError('Chọn nơi hỗ trợ và điền tiêu đề (tối đa 255 ký tự), nội dung.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await workspaceApi.createTicket(
        category,
        title.trim(),
        description.trim(),
        priority,
        [],
      );
      navigation.replace('TicketDetail', { id: result.id });
    } catch (e) {
      setError(normalizeError(e).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page error={error}>
      <Copy muted>
        Chọn loại hỗ trợ; hệ thống gửi tới đúng phòng tiếp nhận.
      </Copy>
      <Choices
        value={category}
        onChange={setCategory}
        values={context.categories.map(c => ({
          id: c.id,
          name: `${c.name} · ${c.department_name}`,
        }))}
      />
      <Field
        label="Tiêu đề (tối đa 255 ký tự)"
        value={title}
        onChange={setTitle}
      />
      <Field
        label="Nội dung cần hỗ trợ"
        value={description}
        onChange={setDescription}
        multiline
      />
      <Choices
        value={priority}
        onChange={value => setPriority(value as TicketPriority)}
        values={ticketPriorities.map(id => ({ id, name: label(id) }))}
      />
      <Button title="Gửi yêu cầu" busy={busy} onPress={() => void submit()} />
    </Page>
  );
}
const supported = new Set([
  'START',
  'WAIT_FOR_USER',
  'RESUME',
  'RESOLVE',
  'CONFIRM',
  'CANCEL',
  'ASSIGN',
  'REJECT_RESOLUTION',
  'COMMENT',
]);
export function TicketDetailScreen() {
  const { context } = useWorkplace();
  const route = useRoute<RouteProp<WorkspaceRoutes, 'TicketDetail'>>();
  const state = useLoad(
    useCallback(() => workspaceApi.ticket(route.params.id), [route.params.id]),
  );
  const [action, setAction] = useState('');
  const [content, setContent] = useState('');
  const [person, setPerson] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(ticket: Ticket) {
    if (busy) return;
    if (
      [
        'COMMENT',
        'RESOLVE',
        'REJECT_RESOLUTION',
        'WAIT_FOR_USER',
        'CANCEL',
      ].includes(action) &&
      !content.trim()
    ) {
      setError('Hãy ghi rõ nội dung hoặc lý do.');
      return;
    }
    if (action === 'ASSIGN' && !person) {
      setError('Chọn người nhận xử lý trong phòng.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (action === 'COMMENT')
        await workspaceApi.ticketComment(ticket.id, content.trim(), []);
      else
        await workspaceApi.ticketAction(
          ticket,
          action,
          content.trim(),
          person || undefined,
        );
      setAction('');
      setContent('');
      await state.refresh();
    } catch (e) {
      setError(normalizeError(e).message);
      await state.refresh();
    } finally {
      setBusy(false);
    }
  }
  const ticket = state.data;
  return (
    <Page
      error={state.error}
      loading={state.loading}
      onRefresh={() => {
        setAction('');
        void state.refresh();
      }}
    >
      {ticket && (
        <>
          <Copy muted>
            {ticket.requestNumber} · {label(ticket.status)}
          </Copy>
          <Copy title>{ticket.title}</Copy>
          <Card>
            <Copy>{ticket.description}</Copy>
            <Copy muted>Người gửi: {ticket.requester.fullName}</Copy>
            <Copy muted>
              Người xử lý: {ticket.assignee?.fullName ?? 'Chờ phân công'}
            </Copy>
            <Copy muted>{ticket.category.name}</Copy>
          </Card>
          {!action ? (
            ticket.allowedActions
              .filter(a => supported.has(a))
              .map(a => (
                <Button
                  key={a}
                  title={ticketActionLabels[a] ?? a}
                  secondary={a !== 'CONFIRM' && a !== 'START'}
                  onPress={() => {
                    setAction(a);
                    setError('');
                  }}
                />
              ))
          ) : (
            <Card>
              <Copy title>{ticketActionLabels[action]}</Copy>
              {action === 'CONFIRM' && (
                <Copy>
                  Bạn đã kiểm tra kết quả và xác nhận vấn đề được xử lý đầy đủ?
                </Copy>
              )}
              {action === 'ASSIGN' && (
                <Choices
                  value={person}
                  onChange={setPerson}
                  values={context.people
                    .filter(
                      p =>
                        p.department_id === ticket.receivingDepartmentId &&
                        p.id !== ticket.requester.id,
                    )
                    .map(p => ({ id: p.id, name: p.full_name }))}
                />
              )}
              <Field
                label={
                  action === 'RESOLVE'
                    ? 'Kết quả và hướng dẫn kiểm tra'
                    : 'Nội dung / lý do'
                }
                value={content}
                onChange={setContent}
                multiline
              />
              {!!error && <Copy>{error}</Copy>}
              <Button
                busy={busy}
                title={ticketActionLabels[action] ?? 'Xác nhận'}
                onPress={() => void submit(ticket)}
              />
              <Button
                busy={busy}
                title="Hủy thao tác"
                secondary
                onPress={() => {
                  setAction('');
                  setContent('');
                }}
              />
            </Card>
          )}
          {ticket.allowedActions.some(
            a => !supported.has(a) && !['UPDATE', 'RATE'].includes(a),
          ) && (
            <Copy muted>
              Các bước điều phối, sửa nội dung và quản trị mở rộng thực hiện
              trên web.
            </Copy>
          )}
          <Copy title>Kết quả & lịch sử</Copy>
          {ticket.histories?.map((h, i) => (
            <Card key={h.id ?? String(i)}>
              <Copy muted>
                {h.changedByName} · {dateTime(h.changedAt)} ·{' '}
                {label(h.toStatus)}
              </Copy>
              <Copy>{h.comment || 'Đã chuyển trạng thái'}</Copy>
            </Card>
          ))}
          <Copy title>Trao đổi</Copy>
          {ticket.comments?.map(c => (
            <Card key={c.id}>
              <Copy muted>
                {c.authorName} · {dateTime(c.createdAt)}
              </Copy>
              <Copy>{c.content}</Copy>
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}
