import React, { useCallback, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { View } from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';
import { normalizeError } from '../../shared/api/apiError';
import { workspaceApi, Work } from './api';
import {
  useWorkplace,
  WorkspaceNavigation,
  WorkspaceRoutes,
} from './WorkspaceNavigator';
import { actionLabels, dateTime, label, personalWorks } from './rules';
import { Button, Card, Choices, Copy, Field, Page, useLoad } from './ui';

function WorkCard({ work }: { work: Work }) {
  const navigation = useNavigation<WorkspaceNavigation>();
  const { colors } = useAppTheme();
  return (
    <Card>
      <Copy muted>
        {label(work.status)} · {label(work.priority)}
      </Copy>
      <Copy title>{work.title}</Copy>
      <View
        accessibilityLabel={`Tiến độ ${work.progress}%`}
        style={{
          height: 5,
          borderRadius: 3,
          backgroundColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${work.progress}%`,
            height: 5,
            backgroundColor: colors.primary,
          }}
        />
      </View>
      <Copy muted>
        {work.progress}% · Hạn {dateTime(work.due_at)}
      </Copy>
      <Copy muted>{work.assignee_name ?? 'Chờ phân công'}</Copy>
      <Button
        title="Xem công việc →"
        secondary
        onPress={() => navigation.navigate('WorkDetail', { id: work.id })}
      />
    </Card>
  );
}
export function HomeScreen() {
  const { context } = useWorkplace();
  const navigation = useNavigation<WorkspaceNavigation>();
  const state = useLoad(
    useCallback(
      async () => (context.admin ? [] : workspaceApi.work()),
      [context.admin],
    ),
  );
  const mine = personalWorks(state.data ?? [], context.user.id).filter(
    w => !['COMPLETED', 'CANCELLED'].includes(w.status),
  );
  return (
    <Page loading={state.loading} error={state.error} onRefresh={state.refresh}>
      <Copy muted>{context.user.department_name ?? 'KHÔNG GIAN NỘI BỘ'}</Copy>
      <Copy title>Chào {context.user.full_name.split(' · ')[0]}</Copy>
      {context.admin ? (
        <Card accent>
          <Copy title>Quản trị hệ thống</Copy>
          <Copy>
            Quản lý tài khoản, phòng ban và yêu cầu truy cập trên web. Tài khoản
            này không có nghiệp vụ công việc hoặc lương cá nhân.
          </Copy>
        </Card>
      ) : (
        <>
          <Card accent>
            <Copy title>Từng việc một.{'\n'}Cùng một tiến độ.</Copy>
            <Copy>
              {mine.length} việc cần tiếp tục ·{' '}
              {mine.filter(w => w.status === 'HANDOVER').length} bàn giao cần rà
              soát.
            </Copy>
            <Button
              title="Gửi yêu cầu hỗ trợ"
              onPress={() => navigation.navigate('CreateTicket')}
            />
          </Card>
          <Copy title>Lịch cần làm</Copy>
          <Copy muted>
            Sắp xếp theo hạn công việc thật. Hôm nay và các ngày tới.
          </Copy>
          {mine.length === 0 && (
            <Card>
              <Copy>Chưa có việc đang mở được giao cho bạn.</Copy>
            </Card>
          )}
          {mine.slice(0, 8).map(work => (
            <WorkCard key={work.id} work={work} />
          ))}
          <Button
            title="Danh bạ phòng bạn"
            secondary
            onPress={() => navigation.navigate('Directory')}
          />
        </>
      )}
    </Page>
  );
}
export function WorkScreen() {
  const { context } = useWorkplace();
  const [scope, setScope] = useState('mine');
  const [search, setSearch] = useState('');
  const state = useLoad(workspaceApi.work);
  const rows = (
    scope === 'mine'
      ? personalWorks(state.data ?? [], context.user.id)
      : state.data ?? []
  ).filter(w => w.title.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <Page loading={state.loading} error={state.error} onRefresh={state.refresh}>
      <Copy title>Công việc</Copy>
      <Field
        label="Tìm trong công việc đã tải"
        value={search}
        onChange={setSearch}
      />
      <Choices
        value={scope}
        onChange={setScope}
        values={[
          { id: 'mine', name: 'Việc của tôi' },
          { id: 'scope', name: 'Phạm vi tôi phụ trách' },
        ]}
      />
      {!rows.length && !state.loading && (
        <Card>
          <Copy>Chưa có công việc trong phạm vi này.</Copy>
        </Card>
      )}
      {rows.map(work => (
        <WorkCard key={work.id} work={work} />
      ))}
    </Page>
  );
}
export function WorkDetailScreen() {
  const route = useRoute<RouteProp<WorkspaceRoutes, 'WorkDetail'>>();
  const { context } = useWorkplace();
  const state = useLoad(
    useCallback(
      () => workspaceApi.workDetail(route.params.id),
      [route.params.id],
    ),
  );
  const [action, setAction] = useState('');
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState('');
  const [receiver, setReceiver] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const work = state.data;
  const submit = async () => {
    if (!work || busy) return;
    const note = content.trim();
    if (!['START', 'APPROVE', 'PROGRESS'].includes(action) && !note) {
      setError('Hãy ghi rõ nội dung và phần cần tiếp tục.');
      return;
    }
    if (
      action === 'PROGRESS' &&
      (!/^\d{1,3}$/.test(progress) || Number(progress) > 100)
    ) {
      setError('Tiến độ phải từ 0 đến 100.');
      return;
    }
    if (action === 'HANDOVER' && !receiver) {
      setError('Chọn người nhận bàn giao.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await workspaceApi.command(
        work,
        action,
        note,
        action === 'PROGRESS' ? Number(progress) : undefined,
        receiver || undefined,
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
  };
  return (
    <Page
      loading={state.loading}
      error={state.error}
      onRefresh={() => {
        setAction('');
        void state.refresh();
      }}
    >
      {work && (
        <>
          <Copy title>{work.title}</Copy>
          <Copy muted>
            {label(work.status)} · {work.progress}% · {label(work.priority)}
          </Copy>
          <Card>
            <Copy>{work.description}</Copy>
            <Copy muted>
              Người thực hiện: {work.assignee_name ?? 'Chờ phân công'}
            </Copy>
            <Copy muted>Người kiểm tra: {work.reviewer_name}</Copy>
            <Copy muted>Hạn {dateTime(work.due_at)}</Copy>
          </Card>
          {work.status === 'HANDOVER' && (
            <Card accent>
              <Copy title>Rà soát trước khi tiếp tục</Copy>
              <Copy>
                Tiến độ và lịch sử được giữ nguyên. Hãy kiểm tra phần đã làm,
                ghi rõ phần đạt, phần cần sửa và công việc tiếp theo.
              </Copy>
            </Card>
          )}
          {!action ? (
            <View style={{ gap: 8 }}>
              {(work.allowedActions ?? [])
                .filter(a => a !== 'EDIT')
                .map(a => (
                  <Button
                    key={a}
                    secondary={a !== 'ACCEPT_HANDOVER' && a !== 'START'}
                    title={actionLabels[a] ?? a}
                    onPress={() => {
                      setAction(a);
                      setProgress(String(work.progress));
                      setError('');
                    }}
                  />
                ))}
            </View>
          ) : (
            <Card>
              <Copy title>{actionLabels[action]}</Copy>
              {action === 'PROGRESS' && (
                <Field
                  label="Tiến độ (%)"
                  numeric
                  value={progress}
                  onChange={setProgress}
                />
              )}
              {action === 'HANDOVER' && (
                <Choices
                  value={receiver}
                  onChange={setReceiver}
                  values={context.people
                    .filter(
                      p =>
                        p.department_id === work.department_id &&
                        p.id !== work.assignee_id &&
                        p.id !== work.reviewer_id,
                    )
                    .map(p => ({ id: p.id, name: p.full_name }))}
                />
              )}
              <Field
                label={
                  action === 'ACCEPT_HANDOVER'
                    ? 'Kết quả rà soát và phần việc tiếp tục'
                    : 'Nội dung / căn cứ'
                }
                value={content}
                onChange={setContent}
                multiline
              />
              {!!error && <Copy>{error}</Copy>}
              <Button
                busy={busy}
                title={actionLabels[action] ?? 'Xác nhận'}
                onPress={() => void submit()}
              />
              <Button
                secondary
                busy={busy}
                title="Hủy thao tác"
                onPress={() => {
                  setAction('');
                  setContent('');
                }}
              />
            </Card>
          )}
          {!!work.attachments?.length && (
            <Card>
              <Copy title>Tệp công việc</Copy>
              {work.attachments.map(file => (
                <Copy key={file.id}>{file.original_name}</Copy>
              ))}
              <Copy muted>Tải tệp trên web trong bản mobile đầu tiên.</Copy>
            </Card>
          )}
          <Copy title>Lịch sử & trao đổi</Copy>
          {work.events?.map(e => (
            <Card key={e.id}>
              <Copy muted>
                {e.actor_name} · {dateTime(e.created_at)}
              </Copy>
              <Copy>{e.content}</Copy>
            </Card>
          ))}
          {!!work.handovers?.length && (
            <>
              <Copy title>Lịch sử bàn giao</Copy>
              {work.handovers.map(h => (
                <Card key={h.id}>
                  <Copy>
                    {h.from_name ?? 'Người trước'} → {h.to_name}
                  </Copy>
                  <Copy muted>
                    Giữ tiến độ {h.progress_snapshot}% ·{' '}
                    {h.accepted_at ? 'Đã nhận' : 'Chờ rà soát'}
                  </Copy>
                  <Copy>
                    {h.review_note ?? 'Người nhận chưa ghi nhận rà soát.'}
                  </Copy>
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </Page>
  );
}
