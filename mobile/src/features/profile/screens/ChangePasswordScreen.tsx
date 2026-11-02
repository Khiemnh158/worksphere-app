import React, { useState, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { authApi } from '../../auth/api/authApi';
import {
  validateChangePassword,
  FieldErrors,
} from '../../auth/validation/authValidation';
import {
  mapAuthError,
  AuthPresentationError,
} from '../../auth/errors/authErrorMapper';
import { PasswordInput } from '../../../shared/components/PasswordInput';
import { AppButton } from '../../../shared/components/AppButton';
import type { ProfileNavigationProp } from '../../../app/navigation/types';

export function ChangePasswordScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<ProfileNavigationProp<'ChangePassword'>>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<'currentPassword' | 'newPassword' | 'confirmPassword'>
  >({});
  const [globalError, setGlobalError] = useState<AuthPresentationError | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const submitLockRef = useRef(false);

  const handleSubmit = async () => {
    if (submitLockRef.current || submitting) {
      return;
    }

    // Client-side validation: pure validator with strict un-trimmed password invariant
    const validationErrors = validateChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setGlobalError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    submitLockRef.current = true;

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Clear password inputs on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Đổi mật khẩu thành công');
    } catch (err: any) {
      const mapped = mapAuthError(err);
      if (mapped.placement === 'currentPassword') {
        setFieldErrors({ currentPassword: mapped.message });
      } else if (mapped.placement === 'newPassword') {
        setFieldErrors({ newPassword: mapped.message });
      } else if (mapped.placement === 'confirmPassword') {
        setFieldErrors({ confirmPassword: mapped.message });
      } else if (err?.fieldErrors && typeof err.fieldErrors === 'object') {
        setFieldErrors(err.fieldErrors);
      } else {
        setGlobalError(mapped);
      }
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-change-password"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { padding: theme.spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={[
              theme.typography.heading2,
              {
                color: theme.colors.textPrimary,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            Đổi mật khẩu
          </Text>
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            Mật khẩu mới có ít nhất 12 ký tự, tối đa 72 byte và khác mật khẩu
            hiện tại
          </Text>

          {globalError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: theme.colors.errorContainer,
                  borderRadius: theme.radii.medium,
                },
              ]}
              testID="change-password-global-error"
            >
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.error },
                ]}
              >
                {globalError.message}
              </Text>
              {globalError.traceId ? (
                <Text
                  style={[
                    theme.typography.caption,
                    styles.traceIdText,
                    { color: theme.colors.error },
                  ]}
                >
                  Mã tham chiếu: {globalError.traceId}
                </Text>
              ) : null}
            </View>
          ) : null}

          {successMessage ? (
            <View
              style={[
                styles.successBanner,
                {
                  backgroundColor: theme.colors.successContainer,
                  borderRadius: theme.radii.medium,
                },
              ]}
              testID="change-password-success-message"
            >
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.success },
                ]}
              >
                {successMessage}
              </Text>
            </View>
          ) : null}

          <PasswordInput
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            error={fieldErrors.currentPassword}
            required
            placeholder="Nhập mật khẩu hiện tại"
            accessibilityLabel="Mật khẩu hiện tại"
            testID="input-current-password"
            disabled={submitting}
            containerStyle={{ marginBottom: theme.spacing.md }}
          />

          <PasswordInput
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            error={fieldErrors.newPassword}
            required
            placeholder="Mật khẩu mới (ít nhất 12 ký tự)"
            accessibilityLabel="Mật khẩu mới"
            testID="input-new-password"
            disabled={submitting}
            containerStyle={{ marginBottom: theme.spacing.md }}
          />

          <PasswordInput
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={fieldErrors.confirmPassword}
            required
            placeholder="Nhập lại mật khẩu mới"
            accessibilityLabel="Xác nhận mật khẩu mới"
            testID="input-confirm-password"
            disabled={submitting}
            containerStyle={{ marginBottom: theme.spacing.xl }}
          />

          <View style={styles.buttonGroup}>
            <AppButton
              title="Cập nhật mật khẩu"
              variant="primary"
              loading={submitting}
              onPress={handleSubmit}
              accessibilityLabel="Xác nhận cập nhật mật khẩu"
              testID="btn-submit-change-password"
              style={{ marginBottom: theme.spacing.sm }}
            />

            <AppButton
              title="Quay lại"
              variant="outline"
              disabled={submitting}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Quay lại màn hình trước"
              testID="btn-cancel-change-password"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  errorBanner: {
    padding: 12,
    marginBottom: 16,
  },
  successBanner: {
    padding: 12,
    marginBottom: 16,
  },
  buttonGroup: {
    marginTop: 8,
  },
  traceIdText: {
    marginTop: 4,
  },
});
