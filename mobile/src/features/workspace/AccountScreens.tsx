import React, { useCallback, useState } from 'react';
import { Alert, AppState, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../app/auth';
import { useAppearance } from '../../app/providers/ThemeProvider';
import { normalizeError } from '../../shared/api/apiError';
import { workspaceApi } from './api';
import { useWorkplace, WorkspaceNavigation } from './WorkspaceNavigator';
import { currentMonth, dateTime, money, ownPublishedIncomes } from './rules';
import { Button, Card, Copy, Field, Page, useLoad } from './ui';

export function AccountScreen() {
  const { context } = useWorkplace();
  const { logout, operationState } = useAuth();
  const { dark, toggle } = useAppearance();
  const navigation = useNavigation<WorkspaceNavigation>();
  return (
    <Page>
      <Copy title>{context.user.full_name}</Copy>
      <Card>
        <Copy>{context.user.job_title || 'Người dùng nội bộ'}</Copy>
        <Copy muted>{context.user.department_name ?? 'Quản trị kỹ thuật'}</Copy>
        <Copy muted>{context.user.employee_code ?? context.user.username}</Copy>
        <Copy>{context.user.email}</Copy>
      </Card>
      {!context.admin && (
        <>
          <Button
            title="Danh bạ phòng bạn"
            secondary
            onPress={() => navigation.navigate('Directory')}
          />
          <Button
            title="Phiếu thu nhập của tôi"
            secondary
            onPress={() => navigation.navigate('Income')}
          />
        </>
      )}
      <Button
        title={dark ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
        secondary
        onPress={toggle}
      />
      <Card>
        <Copy title>Bảo mật tài khoản</Copy>
        <Copy muted>
          Thiết lập mã hai bước, đổi mật khẩu và đăng xuất mọi thiết bị ngay
          trên ứng dụng. Tài khoản bị khóa hoặc đến hạn ngừng truy cập sẽ bị từ
          chối trên cả web và mobile.
        </Copy>
        <Button
          title="Mở bảo mật tài khoản"
          secondary
          onPress={() => navigation.navigate('Security')}
        />
      </Card>
      <Button
        title="Đăng xuất"
        busy={operationState === 'signingOut'}
        onPress={() =>
          Alert.alert(
            'Đăng xuất',
            'Xóa phiên và dữ liệu đang xem trên thiết bị này?',
            [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Đăng xuất', onPress: () => void logout() },
            ],
          )
        }
      />
    </Page>
  );
}
export function DirectoryScreen() {
  const navigation = useNavigation<WorkspaceNavigation>();
  const [page, setPage] = useState(0);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const state = useLoad(
    useCallback(() => workspaceApi.directory(page, search), [page, search]),
  );
  return (
    <Page loading={state.loading} error={state.error} onRefresh={state.refresh}>
      <Copy muted>
        Đồng nghiệp cùng phòng để tìm người phụ trách. Giao việc do trưởng phòng
        thực hiện; danh bạ không cấp quyền giao việc cho nhân viên.
      </Copy>
      <Field
        label="Tìm tên hoặc mã nhân viên"
        value={text}
        onChange={setText}
      />
      <Button
        title="Tìm kiếm"
        secondary
        onPress={() => {
          setPage(0);
          setSearch(text.trim());
        }}
      />
      {state.data?.items.map(person => (
        <Card key={person.id}>
          <Copy title>{person.full_name}</Copy>
          <Copy muted>
            {person.is_manager
              ? 'Trưởng phòng'
              : person.job_title || 'Thành viên phòng'}
          </Copy>
        </Card>
      ))}
      {state.data && (
        <>
          <Copy muted>
            Trang {page + 1} · {state.data.total} người · tối đa 20/trang
          </Copy>
          {page > 0 && (
            <Button
              title="Trang trước"
              secondary
              onPress={() => setPage(v => v - 1)}
            />
          )}
          {(page + 1) * 20 < state.data.total && (
            <Button
              title="Trang tiếp"
              secondary
              onPress={() => setPage(v => v + 1)}
            />
          )}
          <Copy title>Đầu mối hỗ trợ liên phòng</Copy>
          {state.data.contacts.map(c => (
            <Card key={c.id}>
              <Copy>{c.name}</Copy>
              <Copy muted>{c.department_name}</Copy>
            </Card>
          ))}
          <Button
            title="Gửi yêu cầu tới phòng hỗ trợ"
            onPress={() => navigation.navigate('CreateTicket')}
          />
        </>
      )}
    </Page>
  );
}
export function IncomeScreen() {
  const { context } = useWorkplace();
  const [period, setPeriod] = useState(currentMonth());
  const [input, setInput] = useState(period);
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      const listener = AppState.addEventListener('change', state => {
        if (state !== 'active') setRevealed(false);
      });
      return () => {
        listener.remove();
        setRevealed(false);
      };
    }, []),
  );
  const state = useLoad(
    useCallback(() => workspaceApi.incomes(period), [period]),
  );
  const rows = ownPublishedIncomes(state.data ?? [], context.user.id);
  return (
    <Page loading={state.loading} error={state.error} onRefresh={state.refresh}>
      <Copy title>Phiếu cá nhân đã phát hành</Copy>
      <Copy muted>
        Chỉ phiếu đã phát hành. Không tự tăng theo đăng ký OT, không tự phạt và
        không xác nhận đã chuyển tiền.
      </Copy>
      <Field label="Kỳ (YYYY-MM)" value={input} onChange={setInput} />
      <Button
        title="Xem kỳ"
        secondary
        onPress={() => {
          if (/^\d{4}-(0[1-9]|1[0-2])$/.test(input)) {
            setPeriod(input);
            setRevealed(false);
          }
        }}
      />
      <Button
        title={revealed ? 'Ẩn số tiền' : 'Hiện số tiền riêng tư'}
        secondary
        onPress={() => setRevealed(v => !v)}
      />
      {rows.map(row => (
        <Card key={row.id} accent>
          <Copy title>Phiếu {row.period}</Copy>
          <Copy muted>
            Đã phát hành · Công {row.calculation.paidMinutes ?? 0} phút · OT{' '}
            {row.calculation.overtimeMinutes ?? 0} phút
          </Copy>
          <Copy title>
            {revealed ? money(row.calculation.grossEstimate) : '••• ••• đ'}
          </Copy>
          {revealed && (
            <>
              <Copy>Lương theo công: {money(row.calculation.basePay)}</Copy>
              <Copy>OT đã xác nhận: {money(row.calculation.overtimePay)}</Copy>
              {row.adjustments
                .filter(a => a.status === 'APPROVED')
                .map(a => (
                  <Copy key={a.id}>
                    Điều chỉnh được duyệt: {money(a.amount)} · {a.reason}
                  </Copy>
                ))}
            </>
          )}
          <Copy muted>
            Chưa phải thực lĩnh sau thuế/BHXH; điều chỉnh bổ sung được liệt kê
            riêng.
          </Copy>
        </Card>
      ))}
      {state.data && !rows.length && (
        <Card>
          <Copy>Chưa có phiếu đã phát hành cho bạn ở kỳ này.</Copy>
        </Card>
      )}
    </Page>
  );
}
export function NoticesScreen() {
  const navigation = useNavigation<WorkspaceNavigation>();
  const state = useLoad(workspaceApi.notices);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Page
      loading={state.loading}
      error={state.error || error}
      onRefresh={state.refresh}
    >
      <Copy title>Thông báo của bạn</Copy>
      <Copy muted>
        Thông báo trong ứng dụng. Bản này chưa có thông báo đẩy khi ứng dụng
        đóng.
      </Copy>
      {state.data?.map(n => (
        <Card key={n.id}>
          <Copy muted>
            {n.read_at ? 'Đã đọc' : 'Mới'} · {dateTime(n.created_at)}
          </Copy>
          <Copy>{n.title}</Copy>
          <Button
            title="Xem thông báo"
            secondary
            busy={busy}
            onPress={() => {
              if (busy) return;
              setBusy(true);
              setError('');
              workspaceApi
                .readNotice(n.id)
                .then(async () => {
                  await state.refresh();
                  if (n.reference_type === 'WORK' && n.reference_id)
                    navigation.navigate('WorkDetail', { id: n.reference_id });
                  else if (
                    ['TIME', 'ATTENDANCE'].includes(n.reference_type ?? '')
                  )
                    navigation.navigate('WorkspaceTabs', { screen: 'Time' });
                  else if (
                    ['SERVICE_REQUEST', 'REQUEST'].includes(
                      n.reference_type ?? '',
                    ) &&
                    n.reference_id
                  )
                    navigation.navigate('TicketDetail', { id: n.reference_id });
                })
                .catch(e => setError(normalizeError(e).message))
                .finally(() => setBusy(false));
            }}
          />
        </Card>
      ))}
      {state.data && !state.data.length && (
        <View>
          <Copy>Chưa có thông báo.</Copy>
        </View>
      )}
    </Page>
  );
}
