import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { http } from '../../../shared/api/apiClient';
import { normalizeError } from '../../../shared/api/apiError';
import type {
  AuthNavigationProp,
  AuthRouteProp,
} from '../../../app/navigation/types';
import { Button, Copy, Field, Page } from '../../workspace/ui';
import { validateResetPassword } from '../validation/authValidation';

import { recoveryToken } from '../validation/recoveryToken';

export function ActivateAccountScreen() {
  const navigation = useNavigation<AuthNavigationProp<'ActivateAccount'>>();
  const route = useRoute<AuthRouteProp<'ActivateAccount'>>();
  const [token, setToken] = useState(route.params?.token ?? '');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  async function submit() {
    if (busy) return;
    const value = recoveryToken(token, 'activate');
    const errors = validateResetPassword({
      resetToken: value,
      newPassword: password,
      confirmPassword,
    });
    if (Object.values(errors).length || !username.trim() || !fullName.trim()) {
      setError(
        Object.values(errors).join('. ') || 'Điền tên đăng nhập và họ tên.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      await http.post(
        '/auth/activate',
        {
          token: value,
          password,
          confirmPassword,
          username: username.trim(),
          fullName: fullName.trim(),
          phoneNumber: phone.trim() || null,
        },
        { skipAuthRefresh: true },
      );
      setToken('');
      setPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (e) {
      setError(normalizeError(e).message);
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <Page>
        <Copy title>Kích hoạt thành công</Copy>
        <Copy>Đăng nhập bằng tên và mật khẩu bạn vừa đặt.</Copy>
        <Button
          title="Về đăng nhập"
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
          }
        />
      </Page>
    );
  return (
    <Page error={error}>
      <Copy title>Bắt đầu không gian của bạn</Copy>
      <Copy muted>
        Dán liên kết kích hoạt trong thư do công ty cấp (hạn 24 giờ, một lần).
        Bản thử dùng hộp thư local trên máy quản lý; không gửi email thật.
      </Copy>
      <Field
        label="Liên kết hoặc mã kích hoạt"
        value={token}
        onChange={setToken}
      />
      <Field
        label="Tên đăng nhập mới"
        value={username}
        onChange={setUsername}
      />
      <Field label="Họ tên" value={fullName} onChange={setFullName} />
      <Field
        label="Số điện thoại (không bắt buộc)"
        value={phone}
        onChange={setPhone}
      />
      <Field
        secure
        label="Mật khẩu mới (ít nhất 12 ký tự, tối đa 72 byte UTF-8)"
        value={password}
        onChange={setPassword}
      />
      <Field
        secure
        label="Nhập lại mật khẩu mới"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />
      <Button title="Kích hoạt" busy={busy} onPress={() => void submit()} />
    </Page>
  );
}
