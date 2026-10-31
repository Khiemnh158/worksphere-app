import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../app/auth';
import { normalizeError } from '../../shared/api/apiError';
import { authApi } from '../auth/api/authApi';
import {
  normalizeFullName,
  normalizePhoneNumber,
  validateUpdateProfile,
} from '../auth/validation/authValidation';
import { useWorkplace, WorkspaceNavigation } from './WorkspaceNavigator';
import { Button, Copy, Field, Page, useLoad } from './ui';

export function ProfileBasicsScreen() {
  const navigation = useNavigation<WorkspaceNavigation>();
  const { updateCurrentUser } = useAuth();
  const { reload } = useWorkplace();
  const state = useLoad(authApi.getCurrentUser);
  const [fullName, setFullName] = useState(''),
    [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const initialized = useRef(false),
    lock = useRef(false);
  useEffect(() => {
    if (state.data && !initialized.current) {
      setFullName(state.data.fullName);
      setPhone(state.data.phoneNumber ?? '');
      initialized.current = true;
    }
  }, [state.data]);
  async function save() {
    if (lock.current || !state.data || !initialized.current) return;
    const name = normalizeFullName(fullName),
      number = normalizePhoneNumber(phone);
    const errors = validateUpdateProfile({
      fullName: name,
      phoneNumber: number,
    });
    if (Object.keys(errors).length) {
      setError(Object.values(errors).filter(Boolean).join(' '));
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      // Preserve existing phone until the user edits it. Never send department/roles/avatar as a side effect.
      const result = await authApi.updateProfile({
        fullName: name,
        phoneNumber: number,
      });
      updateCurrentUser?.(result);
      await reload();
      navigation.goBack();
    } catch (e) {
      setError(normalizeError(e).message);
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
      <Copy title>Thông tin cá nhân</Copy>
      <Copy muted>
        Chỉnh họ tên và số liên hệ. Phòng ban, chức vụ và quyền do người phụ
        trách quản lý.
      </Copy>
      {state.data && (
        <>
          <Field label="Họ và tên" value={fullName} onChange={setFullName} />
          <Field
            label="Số điện thoại liên hệ"
            value={phone}
            onChange={setPhone}
          />
          <Button
            title="Lưu thông tin"
            busy={busy}
            onPress={() => void save()}
          />
        </>
      )}
    </Page>
  );
}
