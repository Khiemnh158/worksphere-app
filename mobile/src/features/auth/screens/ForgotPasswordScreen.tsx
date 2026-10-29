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
import { authApi } from '../api/authApi';
import {
  normalizeEmail,
  validateForgotPassword,
  FieldErrors,
} from '../validation/authValidation';
import { mapAuthError, AuthPresentationError } from '../errors/authErrorMapper';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { AppButton } from '../../../shared/components/AppButton';
import type { AuthNavigationProp } from '../../../app/navigation/types';

export function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<AuthNavigationProp<'ForgotPassword'>>();

  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'email'>>({});
  const [globalError, setGlobalError] = useState<AuthPresentationError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitLockRef = useRef(false);

  const handleSubmit = async () => {
    if (submitLockRef.current || submitting) {
      return;
    }

    const normalized = normalizeEmail(email);
    const validationErrors = validateForgotPassword({ email: normalized });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setGlobalError(null);
    setSubmitting(true);
    submitLockRef.current = true;

    try {
      await authApi.forgotPassword({ email: normalized });
      // Always show safe uniform success state regardless of account existence
      setSubmitted(true);
    } catch (err: unknown) {
      const mapped = mapAuthError(err);
      // Account enumeration protection: never reveal whether email was not found
      if (mapped.retryable) {
        setGlobalError(mapped);
      } else {
        // Uniform safe success state even on account-not-found / enumeration error codes
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-forgot-password"
      accessibilityLabel="Màn hình quên mật khẩu"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Canonical Screen ID badge */}
          <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer, borderRadius: theme.radii.small }]}>
            <Text style={[theme.typography.caption, { color: theme.colors.onPrimaryContainer }]}>
              SCR-AUTH-03
            </Text>
          </View>

          <Text style={[theme.typography.heading1, { color: theme.colors.textPrimary, marginTop: theme.spacing.sm }]}>
            Quên mật khẩu
          </Text>

          {submitted ? (
            <View style={styles.successSection} testID="forgot-password-success-view">
              <View
                style={[
                  styles.successBanner,
                  { backgroundColor: theme.colors.successContainer, borderRadius: theme.radii.medium },
                ]}
                accessible={true}
                accessibilityRole="alert"
                testID="forgot-password-success-banner"
              >
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.success }]}>
                  Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.
                </Text>
              </View>

              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xl }]}>
                Vui lòng kiểm tra hộp thư đến (và thư mục rác) để nhận hướng dẫn và mã xác thực đặt lại mật khẩu.
              </Text>

              <AppButton
                title="Quay lại đăng nhập"
                variant="primary"
                onPress={() => navigation.navigate('Login')}
                accessibilityLabel="Quay lại đăng nhập"
                testID="btn-back-to-login"
                style={styles.buttonSpacing}
              />

              <AppButton
                title="Nhập mã xác thực đặt lại mật khẩu"
                variant="outline"
                onPress={() => navigation.navigate('ResetPassword')}
                accessibilityLabel="Chuyển đến màn hình đặt lại mật khẩu"
                testID="btn-to-reset-password"
              />
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xl }]}>
                Nhập địa chỉ email liên kết với tài khoản của bạn để nhận hướng dẫn khôi phục mật khẩu.
              </Text>

              {globalError ? (
                <View
                  style={[
                    styles.errorBanner,
                    { backgroundColor: theme.colors.errorContainer, borderRadius: theme.radii.medium },
                  ]}
                  accessible={true}
                  accessibilityRole="alert"
                  testID="forgot-password-global-error"
                >
                  <Text style={[theme.typography.bodyMedium, { color: theme.colors.error }]}>
                    {globalError.message}
                  </Text>
                  {globalError.traceId ? (
                    <Text style={[theme.typography.caption, styles.traceIdText, { color: theme.colors.error }]}>
                      Mã tham chiếu: {globalError.traceId}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <AppTextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={fieldErrors.email}
                required
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                accessibilityLabel="Địa chỉ email"
                testID="input-email"
                disabled={submitting}
                containerStyle={styles.inputMargin}
              />

              <View style={styles.buttonGroup}>
                <AppButton
                  title="Gửi yêu cầu"
                  variant="primary"
                  loading={submitting}
                  onPress={handleSubmit}
                  accessibilityLabel="Gửi yêu cầu đặt lại mật khẩu"
                  testID="btn-submit-forgot-password"
                  style={styles.buttonSpacing}
                />

                <AppButton
                  title="Back to Login"
                  variant="outline"
                  disabled={submitting}
                  onPress={() => navigation.navigate('Login')}
                  accessibilityLabel="Back to Login"
                  testID="btn-back-to-login"
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
    marginBottom: 24,
  },
  buttonGroup: {
    marginTop: 8,
  },
  buttonSpacing: {
    marginBottom: 12,
  },
});
