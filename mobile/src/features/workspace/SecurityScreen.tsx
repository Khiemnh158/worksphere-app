import React, { useCallback, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../app/auth';
import { http } from '../../shared/api/apiClient';
import { normalizeError } from '../../shared/api/apiError';
import { authApi } from '../auth/api/authApi';
import { Button, Card, Copy, Field, Page, useLoad } from './ui';
import { WorkspaceNavigation } from './WorkspaceNavigator';

const status = async () => {
  const result = await http.get<{ enabled: boolean }>('/me/two-factor');
  if (!result || typeof result.enabled !== 'boolean')
    throw new Error('Không tải được trạng thái bảo mật.');
  return result;
};
export function SecurityScreen() {
  const navigation = useNavigation<WorkspaceNavigation>();
  const { logoutLocal } = useAuth();
  const state = useLoad(status);
  const [password, setPassword] = useState(''),
    [code, setCode] = useState('');
  const [secret, setSecret] = useState(''),
    [backups, setBackups] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const epoch = useRef(0),
    lock = useRef(false);
  const clear = useCallback(() => {
    epoch.current++;
    setPassword('');
    setCode('');
    setSecret('');
    setBackups([]);
  }, []);
  useFocusEffect(
    useCallback(() => {
      const listener = AppState.addEventListener('change', next => {
        if (next !== 'active') clear();
      });
      return () => {
        clear();
        listener.remove();
      };
    }, [clear]),
  );
  async function perform(action: 'setup' | 'enable' | 'disable' | 'logoutAll') {
    if (lock.current) return;
    if (action !== 'logoutAll' && !password) {
      setError('Nhập mật khẩu hiện tại.');
      return;
    }
    if (['enable', 'disable'].includes(action) && !code.trim()) {
      setError('Nhập mã xác thực.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    const current = epoch.current;
    try {
      if (action === 'logoutAll') {
        // If the server cannot revoke remote sessions, keep the screen and report failure.
        await authApi.logoutAll();
        await logoutLocal();
        return;
      }
      if (action === 'disable') {
        await http.post('/me/two-factor/disable', {
          password,
          code: code.trim(),
        });
        clear();
        await logoutLocal();
        return;
      }
      const result = await http.post<
        { password: string; code: string },
        { secret?: string; recoveryCodes?: string[] }
      >(`/me/two-factor/${action}`, { password, code: code.trim() });
      // Backgrounding/navigating away must not resurrect secrets from a late response.
      if (current !== epoch.current) return;
      if (action === 'setup' && result?.secret) {
        setBackups([]);
        setSecret(result.secret);
        setCode('');
      } else if (action === 'enable' && Array.isArray(result?.recoveryCodes)) {
        setBackups(result.recoveryCodes);
        setSecret('');
        setPassword('');
        setCode('');
        await state.refresh();
      } else
        throw new Error(
          'Phản hồi thiết lập chưa hợp lệ; kiểm tra trạng thái trước khi thử lại.',
        );
    } catch (e) {
      if (current === epoch.current) setError(normalizeError(e).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Page
      loading={state.loading}
      error={state.error || error}
      onRefresh={state.refresh}
    >
      <Copy title>Bảo mật tài khoản</Copy>
      <Button
        title="Đổi mật khẩu"
        secondary
        onPress={() => navigation.navigate('ChangePassword')}
      />
      <Card>
        <Copy title>Xác thực hai bước</Copy>
        <Copy>
          {state.data
            ? state.data.enabled
              ? 'Đã bật mã xác thực'
              : 'Chưa bật mã xác thực'
            : 'Đang tải trạng thái'}
        </Copy>
        <Field
          label="Mật khẩu hiện tại"
          value={password}
          onChange={setPassword}
          secure
        />
        {state.data && !state.data.enabled && !secret && (
          <Button
            title="Tạo khóa thiết lập TOTP"
            busy={busy}
            onPress={() => void perform('setup')}
          />
        )}
        {!!secret && (
          <>
            <Copy muted>
              Thêm tài khoản vào ứng dụng xác thực bằng khóa bên dưới, loại TOTP
              theo thời gian, 6 chữ số. Thiết lập hết hạn sau 10 phút. Nhấn giữ
              để sao chép nếu cần.
            </Copy>
            <Copy selectable>{secret}</Copy>
          </>
        )}
        {(!!secret || state.data?.enabled) && (
          <Field
            label="Mã xác thực / mã dự phòng"
            value={code}
            onChange={setCode}
          />
        )}
        {!!secret && (
          <Button
            title="Xác nhận bật hai bước"
            busy={busy}
            onPress={() => void perform('enable')}
          />
        )}
        {state.data?.enabled && (
          <Button
            title="Tắt hai bước và đăng xuất"
            secondary
            busy={busy}
            onPress={() =>
              Alert.alert(
                'Tắt xác thực hai bước',
                'Sau khi xác minh mật khẩu và mã, máy chủ sẽ thu hồi các phiên đăng nhập.',
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Xác nhận tắt',
                    onPress: () => void perform('disable'),
                  },
                ],
              )
            }
          />
        )}
        {!!backups.length && (
          <Card>
            <Copy title>Lưu mã dự phòng</Copy>
            <Copy muted>
              Mỗi mã dùng một lần. Chỉ hiện ở lượt này; rời màn hoặc đưa app
              xuống nền sẽ che. Tự lưu ở nơi riêng trước khi rời màn.
            </Copy>
            {backups.map(value => (
              <Copy key={value} selectable>
                {value}
              </Copy>
            ))}
            <Button
              title="Tôi đã lưu, che các mã"
              secondary
              onPress={() => setBackups([])}
            />
          </Card>
        )}
        <Copy muted>
          Khóa, mật khẩu và mã dự phòng không được ghi xuống tệp, bộ nhớ lưu trữ
          hoặc nhật ký.
        </Copy>
      </Card>
      <Button
        title="Đăng xuất mọi thiết bị"
        secondary
        busy={busy}
        onPress={() =>
          Alert.alert(
            'Kết thúc mọi phiên',
            'Chỉ báo hoàn tất sau khi máy chủ thu hồi thành công. Thiết bị này cũng sẽ đăng xuất.',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Đăng xuất mọi thiết bị',
                onPress: () => void perform('logoutAll'),
              },
            ],
          )
        }
      />
    </Page>
  );
}
