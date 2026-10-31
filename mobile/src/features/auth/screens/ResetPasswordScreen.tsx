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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { authApi } from '../api/authApi';
import {
  validateResetPassword,
  FieldErrors,
} from '../validation/authValidation';
import { mapAuthError, AuthPresentationError } from '../errors/authErrorMapper';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { PasswordInput } from '../../../shared/components/PasswordInput';
import { AppButton } from '../../../shared/components/AppButton';
import type {
  AuthNavigationProp,
  AuthRouteProp,
} from '../../../app/navigation/types';
import { recoveryToken } from '../validation/recoveryToken';

export function ResetPasswordScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<AuthNavigationProp<'ResetPassword'>>();
  const route = useRoute<AuthRouteProp<'ResetPassword'>>();

  const routeToken = route.params?.token;
  const [resetToken, setResetToken] = useState(routeToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<'resetToken' | 'newPassword' | 'confirmPassword'>
  >({});
  const [globalError, setGlobalError] = useState<AuthPresentationError | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const submitLockRef = useRef(false);

  const handleSubmit = async () => {
    if (submitLockRef.current || submitting) {
      return;
    }

    const effectiveToken = recoveryToken(routeToken || resetToken, 'reset');

    // Strict validation: passwords are untrimmed
    const validationErrors = validateResetPassword({
      resetToken: effectiveToken,
      newPassword,
      confirmPassword,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setGlobalError(null);
    setSubmitting(true);
    submitLockRef.current = true;

    try {
      await authApi.resetPassword({
        resetToken: effectiveToken.trim(),
        newPassword,
        confirmPassword,
      });

      // Clear sensitive state
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setResetSuccess(true);
    } catch (err: unknown) {
      const mapped = mapAuthError(err);
      if (mapped.placement === 'resetToken') {
        setFieldErrors({ resetToken: mapped.message });
      } else if (mapped.placement === 'newPassword') {
        setFieldErrors({ newPassword: mapped.message });
      } else if (mapped.placement === 'confirmPassword') {
        setFieldErrors({ confirmPassword: mapped.message });
      } else {
        setGlobalError(mapped);
      }
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleReturnToLogin = () => {
    // Navigate and reset to Login so back cannot return to completed form
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-reset-password"
      accessibilityLabel="Màn hình đặt lại mật khẩu"
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
          {/* Canonical Screen ID badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: theme.radii.small,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              KHÔI PHỤC TRUY CẬP
            </Text>
          </View>

          <Text
            style={[
              theme.typography.heading1,
              { color: theme.colors.textPrimary, marginTop: theme.spacing.sm },
            ]}
          >
            Đặt lại mật khẩu
          </Text>

          {resetSuccess ? (
            <View
              style={styles.successSection}
              testID="reset-password-success-view"
            >
              <View
                style={[
                  styles.successBanner,
                  {
                    backgroundColor: theme.colors.successContainer,
                    borderRadius: theme.radii.medium,
                  },
                ]}
                accessible={true}
                accessibilityRole="alert"
                testID="reset-password-success-banner"
              >
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.success },
                  ]}
                >
                  Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng
                  nhập lại bằng mật khẩu mới.
                </Text>
              </View>

              <AppButton
                title="Đăng nhập ngay"
                variant="primary"
                onPress={handleReturnToLogin}
                accessibilityLabel="Đăng nhập ngay"
                testID="btn-back-to-login-from-reset"
                style={styles.buttonSpacing}
              />
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xl,
                  },
                ]}
              >
                Nhập mã xác thực nhận được cùng với mật khẩu mới của bạn (từ 8
                đến 128 ký tự).
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
                  accessible={true}
                  accessibilityRole="alert"
                  testID="reset-password-global-error"
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

              {/* Show manual token field if not provided in route params */}
              {!routeToken ? (
                <AppTextInput
                  label="Mã xác thực đặt lại mật khẩu"
                  value={resetToken}
                  onChangeText={setResetToken}
                  error={fieldErrors.resetToken}
                  required
                  placeholder="Nhập mã xác thực đặt lại mật khẩu"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Mã xác thực đặt lại mật khẩu"
                  testID="input-reset-token"
                  disabled={submitting}
                  containerStyle={styles.inputMargin}
                />
              ) : null}

              <PasswordInput
                label="Mật khẩu mới"
                value={newPassword}
                onChangeText={setNewPassword}
                error={fieldErrors.newPassword}
                required
                placeholder="Nhập mật khẩu mới (8-128 ký tự)"
                accessibilityLabel="Mật khẩu mới"
                testID="input-new-password"
                disabled={submitting}
                containerStyle={styles.inputMargin}
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
                containerStyle={styles.inputMarginLarge}
              />

              <View style={styles.buttonGroup}>
                <AppButton
                  title="Đặt lại mật khẩu"
                  variant="primary"
                  loading={submitting}
                  onPress={handleSubmit}
                  accessibilityLabel="Xác nhận đặt lại mật khẩu"
                  testID="btn-submit-reset-password"
                  style={styles.buttonSpacing}
                />

                <AppButton
                  title="Back to Login"
                  variant="outline"
                  disabled={submitting}
                  onPress={handleReturnToLogin}
                  accessibilityLabel="Back to Login"
                  testID="btn-back-to-login-from-reset"
                />
              </View>
            </View>
          )}
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
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  formSection: {
    marginTop: 8,
  },
  successSection: {
    marginTop: 16,
  },
  errorBanner: {
    padding: 12,
    marginBottom: 16,
  },
  successBanner: {
    padding: 12,
    marginBottom: 16,
  },
  traceIdText: {
    marginTop: 4,
  },
  inputMargin: {
    marginBottom: 16,
  },
  inputMarginLarge: {
    marginBottom: 24,
  },
  buttonGroup: {
    marginTop: 8,
  },
  buttonSpacing: {
    marginBottom: 12,
  },
});
