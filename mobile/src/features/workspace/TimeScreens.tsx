import React, { useCallback, useState } from 'react';
import { Alert, NativeModules, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { normalizeError } from '../../shared/api/apiError';
import { PunchAction, TimeRow, workspaceApi } from './api';
import { useWorkplace, WorkspaceNavigation } from './WorkspaceNavigator';
import { Button, Card, Choices, Copy, Field, Page, useLoad } from './ui';
import {
  currentMonth,
  dateTime,
  label,
  localDay,
  validLocalDay,
} from './rules';
import { scanAndPunch } from './attendance';

export function TimeScreen() {
  const navigation = useNavigation<WorkspaceNavigation>();
  const { context } = useWorkplace();
  const [period, setPeriod] = useState(currentMonth());
  const [monthText, setMonthText] = useState(period);
  const [scope, setScope] = useState('mine');
  const state = useLoad(useCallback(() => workspaceApi.time(period), [period]));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState<{
    row: TimeRow;
    record: boolean;
    action: string;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [actual, setActual] = useState('');
  const [acknowledgeNetwork, setAcknowledgeNetwork] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const punchLabels: Record<PunchAction, string> = {
    IN: 'Vào ca',
    OUT: 'Ra ca',
    OT_IN: 'Bắt đầu OT',
    OT_OUT: 'Kết thúc OT',
  };
  async function scan(type: PunchAction) {
    if (busy) return;
    if (Platform.OS !== 'android' || !NativeModules.WorkplaceDevice?.scanQr) {
      setError('Camera QR hiện có trong bản Android.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const saved = await scanAndPunch(
        () => NativeModules.WorkplaceDevice.scanQr(),
        type,
      );
      if (!saved) return;
      setMessage(
        `${punchLabels[type]} · ${dateTime(saved.recordedAt)}. ${
          saved.message
        }`,
      );
      await state.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : normalizeError(e).message);
    } finally {
      setBusy(false);
    }
  }
  function beginScan(type: PunchAction) {
    Alert.alert(
      punchLabels[type],
      'Quét QR đang hiển thị tại điểm chấm công. Lượt chấm được gửi ngay theo thời gian máy chủ.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Mở camera', onPress: () => void scan(type) },
      ],
    );
  }
  async function submitReview() {
    if (!review || busy) return;
    if (!reason.trim()) {
      setError('Ghi rõ lý do kiểm tra.');
      return;
    }
    if (review.action === 'CONFIRM' && !/^\d+$/.test(actual)) {
      setError('Nhập số phút tăng ca thực tế.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await workspaceApi.reviewTime(
        review.row,
        review.record,
        review.action,
        reason.trim(),
        review.action === 'CONFIRM' ? Number(actual) : undefined,
        acknowledgeNetwork,
        exceptionReason || undefined,
      );
      setReview(null);
      setReason('');
      await state.refresh();
    } catch (e) {
      setError(normalizeError(e).message);
      await state.refresh();
    } finally {
      setBusy(false);
    }
  }
  function rows(items: TimeRow[], record: boolean) {
    return items
      .filter(r =>
        scope === 'mine' ? r.user_id === context.user.id : r.canReview,
      )
      .map(row => (
        <Card key={row.id}>
          <Copy>{row.full_name ?? context.user.full_name}</Copy>
          <Copy>
            {row.work_date} ·{' '}
            {record ? 'Bản ghi công' : label(row.request_type ?? '')}
          </Copy>
          <Copy muted>
            {label(row.status)} ·{' '}
            {record ? row.regular_minutes : row.requested_minutes} phút
          </Copy>
          {!!row.clock_in && (
            <Copy muted>
              Vào {dateTime(row.clock_in)} · Ra {dateTime(row.clock_out)}
            </Copy>
          )}
          {record && (
            <Copy muted>
              Muộn {row.late_minutes ?? 0} phút · Về sớm{' '}
              {row.early_minutes ?? 0} phút
            </Copy>
          )}
          {row.network_review_required && (
            <Copy>Cần xác minh mạng trước khi duyệt.</Copy>
          )}
          {!!row.exception_reason && (
            <Copy>Ngoại lệ OT: {row.exception_reason}</Copy>
          )}
          {!!row.reason && <Copy>{row.reason}</Copy>}
          {row.canReview && row.status === 'PENDING' && (
            <>
              <Button
                secondary
                title="Đồng ý"
                onPress={() => {
                  setReview({ row, record, action: 'APPROVE' });
                  setAcknowledgeNetwork(false);
                  setExceptionReason('');
                  setError('');
                }}
              />
              <Button
                secondary
                title="Từ chối"
                onPress={() => {
                  setReview({ row, record, action: 'REJECT' });
                  setAcknowledgeNetwork(false);
                  setExceptionReason('');
                  setError('');
                }}
              />
            </>
          )}
          {row.canReview &&
            row.request_type === 'OVERTIME' &&
            row.status === 'APPROVED' && (
              <Button
                title="Xác nhận OT thực tế"
                secondary
                onPress={() => {
                  setReview({ row, record, action: 'CONFIRM' });
                  setAcknowledgeNetwork(false);
                  setExceptionReason('');
                  setActual(String(row.requested_minutes));
                  setError('');
                }}
              />
            )}
        </Card>
      ));
  }
  return (
    <Page
      error={state.error || error}
      loading={state.loading}
      onRefresh={state.refresh}
    >
      <Copy title>Công, nghỉ & tăng ca</Copy>
      <Card accent>
        <Copy title>Chấm tại văn phòng</Copy>
        <Copy>
          Mã đổi liên tục. Chỉ chấm cho chính bạn; không chọn thời gian hay
          người khác.
        </Copy>
        <Copy>
          {(
            {
              NOT_STARTED: 'Chưa vào ca',
              WORKING: 'Đã vào — chưa ra ca',
              COMPLETED: 'Đã kết thúc ca',
            } as Record<string, string>
          )[state.data?.today?.status ?? ''] ??
            'Đang kiểm tra trạng thái máy chủ'}
        </Copy>
        {state.data?.today?.calendar && (
          <Copy muted>
            Ca {state.data.today.calendar.shift_start}–
            {state.data.today.calendar.shift_end} · Nghỉ{' '}
            {state.data.today.calendar.break_start ?? 'chưa cấu hình'}–
            {state.data.today.calendar.break_end ?? ''}
          </Copy>
        )}
        <Copy muted>{state.data?.today?.message}</Copy>
        {state.data?.today && !state.data.today.actions.length && (
          <Copy muted>
            Hiện không có thao tác quét khả dụng. Kiểm tra lịch hoặc gửi đơn bổ
            sung nếu quên chấm công.
          </Copy>
        )}
        {!!state.data?.today && (
          <Copy muted>
            Muộn {state.data.today.lateMinutes ?? 0} phút · Về sớm{' '}
            {state.data.today.earlyMinutes ?? 0} phút. Đây là số phút theo lịch,
            không tự sinh khoản phạt.
          </Copy>
        )}
        {(state.data?.today?.actions ?? []).map(action => (
          <Button
            key={action}
            title={'Quét QR · ' + punchLabels[action]}
            busy={busy}
            onPress={() => beginScan(action)}
          />
        ))}
        {(state.data?.today?.punches ?? []).map(p => (
          <Copy key={p.id}>
            {punchLabels[p.punch_type]} · {dateTime(p.recorded_at)} ·{' '}
            {p.network_status === 'MATCH'
              ? 'Khớp mạng cấu hình'
              : 'Có cảnh báo mạng, chờ xác minh'}
          </Copy>
        ))}
        <Copy muted>
          OT chỉ hiện trong khoảng được duyệt; quét muộn không tự cộng tiền.
          Không tự sửa giờ hoặc chấm offline.
        </Copy>
        <Copy muted>
          Mất mạng hoặc mã hết hạn: quét lại khi kết nối được; không lưu lượt
          chấm giả trên máy.
        </Copy>
      </Card>
      {!!message && (
        <Card>
          <Copy>{message}</Copy>
        </Card>
      )}
      <Button
        title="Tạo đơn nghỉ / tăng ca / sửa công"
        onPress={() => navigation.navigate('TimeRequest')}
      />
      <Field
        label="Tháng xem (YYYY-MM)"
        value={monthText}
        onChange={setMonthText}
      />
      <Button
        title="Xem tháng"
        secondary
        onPress={() => {
          if (/^\d{4}-(0[1-9]|1[0-2])$/.test(monthText)) setPeriod(monthText);
          else setError('Tháng có dạng YYYY-MM.');
        }}
      />
      <Choices
        value={scope}
        onChange={setScope}
        values={[
          { id: 'mine', name: 'Của tôi' },
          ...(context.timeDepartments.length ||
          context.capabilities.includes('TIME_REVIEW')
            ? [{ id: 'review', name: 'Tôi được duyệt' }]
            : []),
        ]}
      />
      {review && (
        <Card>
          <Copy title>
            {review.action === 'CONFIRM'
              ? 'Xác nhận OT thực tế'
              : review.action === 'APPROVE'
              ? 'Đồng ý đối soát'
              : 'Từ chối'}
          </Copy>
          <Copy>
            {review.row.full_name ?? context.user.full_name} ·{' '}
            {review.row.work_date}
          </Copy>
          <Field
            label="Lý do / kết quả kiểm tra"
            value={reason}
            onChange={setReason}
            multiline
          />
          {(review.row.network_review_required ||
            review.action === 'CONFIRM') && (
            <Choices
              value={String(acknowledgeNetwork)}
              onChange={value => setAcknowledgeNetwork(value === 'true')}
              values={[
                { id: 'false', name: 'Chưa xác minh mạng' },
                { id: 'true', name: 'Đã xác minh mạng, ghi căn cứ' },
              ]}
            />
          )}
          {!review.record &&
            review.row.request_type === 'OVERTIME' &&
            review.action === 'APPROVE' && (
              <Field
                label="Căn cứ duyệt OT ngoại lệ sau giờ bắt đầu (nếu có)"
                value={exceptionReason}
                onChange={setExceptionReason}
                multiline
              />
            )}
          {review.action === 'CONFIRM' && (
            <Field
              label="Số phút thực tế"
              numeric
              value={actual}
              onChange={setActual}
            />
          )}
          <Button
            busy={busy}
            title="Xác nhận"
            onPress={() => void submitReview()}
          />
          <Button
            title="Hủy thao tác"
            busy={busy}
            secondary
            onPress={() => setReview(null)}
          />
        </Card>
      )}
      <Copy title>Bản ghi công</Copy>
      {rows(state.data?.attendance ?? [], true)}
      <Copy title>Đơn đã gửi</Copy>
      {rows(state.data?.requests ?? [], false)}
      {state.data &&
        !state.data.attendance.length &&
        !state.data.requests.length && (
          <Copy muted>
            Chưa có dữ liệu tháng này. Việc tính công cần lịch và nguồn đã được
            xác nhận.
          </Copy>
        )}
    </Page>
  );
}
export function TimeRequestScreen() {
  const navigation = useNavigation<WorkspaceNavigation>();
  const [type, setType] = useState('LEAVE_PAID');
  const [day, setDay] = useState(localDay());
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('17:00');
  const [minutes, setMinutes] = useState('480');
  const [reason, setReason] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (busy) return;
    if (
      !validLocalDay(day) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end) ||
      !/^\d+$/.test(minutes) ||
      Number(minutes) < 1 ||
      !reason.trim()
    ) {
      setError('Kiểm tra ngày, giờ, số phút và lý do.');
      return;
    }
    const startsAt = new Date(`${day}T${start}:00+07:00`);
    const endsAt = new Date(`${day}T${end}:00+07:00`);
    if (
      !Number.isFinite(startsAt.getTime()) ||
      endsAt <= startsAt ||
      Number(minutes) > (endsAt.getTime() - startsAt.getTime()) / 60000
    ) {
      setError('Khoảng giờ và số phút không phù hợp.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await workspaceApi.timeRequest(
        type,
        day,
        Number(minutes),
        reason.trim(),
        startsAt.toISOString(),
        endsAt.toISOString(),
        exceptionReason.trim() || undefined,
      );
      navigation.goBack();
    } catch (e) {
      setError(normalizeError(e).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page error={error}>
      <Copy muted>
        Ngày/giờ theo Việt Nam (UTC+7). Lịch ca và quyền duyệt được kiểm tra lại
        tại máy chủ.
      </Copy>
      <Choices
        value={type}
        onChange={setType}
        values={[
          'LEAVE_PAID',
          'LEAVE_UNPAID',
          'OVERTIME',
          'TIME_CORRECTION',
        ].map(id => ({
          id,
          name: label(id === 'TIME_CORRECTION' ? 'CORRECTION' : id),
        }))}
      />
      <Field label="Ngày (YYYY-MM-DD)" value={day} onChange={setDay} />
      <Field label="Từ giờ (HH:mm)" value={start} onChange={setStart} />
      <Field label="Đến giờ (HH:mm)" value={end} onChange={setEnd} />
      <Field
        label="Số phút đề nghị (không tính nghỉ giữa ca)"
        value={minutes}
        onChange={setMinutes}
        numeric
      />
      <Field
        label="Lý do và căn cứ"
        value={reason}
        onChange={setReason}
        multiline
      />
      {type === 'OVERTIME' && (
        <Field
          label="Giải trình OT phát sinh sau giờ bắt đầu (nếu có)"
          value={exceptionReason}
          onChange={setExceptionReason}
          multiline
        />
      )}
      <Button title="Gửi đơn" busy={busy} onPress={() => void submit()} />
    </Page>
  );
}
