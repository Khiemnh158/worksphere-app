import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/auth';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import type { AuthNavigationProp } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { PasswordInput } from '../../../shared/components/PasswordInput';
import { normalizeLogin, validateLogin } from '../validation/authValidation';

export function LoginScreen() {
  const navigation = useNavigation<AuthNavigationProp<'Login'>>();
  const theme = useAppTheme();
  const { login, operationState, lastAuthError, clearAuthError } = useAuth();

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    login?: string;
    password?: string;
  }>({});

  const isAuthenticating = operationState === 'authenticating';

  const handleLoginChange = (text: string) => {
    setLoginInput(text);
    if (fieldErrors.login) {
      setFieldErrors(prev => ({ ...prev, login: undefined }));
    }
    if (lastAuthError) {
      clearAuthError();
    }
  };

  const handlePasswordChange = (text: string) => {
    setPasswordInput(text);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: undefined }));
    }
    if (lastAuthError) {
      clearAuthError();
    }
  };

  const handleForgotPassword = () => {
    if (lastAuthError) {
      clearAuthError();
    }
    navigation.navigate('ForgotPassword');
  };

  const handleSubmit = async () => {
    if (isAuthenticating) {
      return;
    }

    if (lastAuthError) {
      clearAuthError();
    }

    const validationErrors = validateLogin({
      login: loginInput,
      password: passwordInput,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});

    // Normalization Policy:
    // Login identifier is trimmed.
    // Password input is strictly UNTRIMMED to preserve password character invariants.
    const normalizedIdentifier = normalizeLogin(loginInput);
    if (mfaCode.trim())
      await login(normalizedIdentifier, passwordInput, mfaCode.trim());
    else await login(normalizedIdentifier, passwordInput);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-login"
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: 28,
              fontWeight: '800',
              marginBottom: 30,
            }}
          >
            w· worksphere
          </Text>
          <Text
            style={[
              theme.typography.heading1,
              styles.headerTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Đăng nhập
          </Text>
          <Text
            style={[
              theme.typography.body,
              styles.headerSubtitle,
              {
                color: theme.colors.textSecondary,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            Công việc rõ ràng. Phối hợp nhịp nhàng.
          </Text>
        </View>

        {lastAuthError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: theme.colors.errorContainer,
                borderColor: theme.colors.error,
                borderRadius: theme.radii.medium,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
              },
            ]}
            accessibilityRole="alert"
            testID="login-auth-error-banner"
          >
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.error },
              ]}
              testID="login-auth-error-message"
            >
              {lastAuthError.message}
            </Text>
            {lastAuthError.traceId ? (
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.error, marginTop: theme.spacing.xxs },
                ]}
                testID="login-auth-error-trace-id"
              >
                {`Mã tham chiếu: ${lastAuthError.traceId}`}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <AppTextInput
            label="Tên đăng nhập hoặc Email"
            value={loginInput}
            onChangeText={handleLoginChange}
            placeholder="Nhập username hoặc email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            disabled={isAuthenticating}
            error={fieldErrors.login}
            required
            testID="input-login"
            containerStyle={{ marginBottom: theme.spacing.md }}
          />

          <PasswordInput
            label="Mật khẩu"
            value={passwordInput}
            onChangeText={handlePasswordChange}
            placeholder="Nhập mật khẩu"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            disabled={isAuthenticating}
            error={fieldErrors.password}
            required
            testID="input-password"
            containerStyle={{ marginBottom: theme.spacing.xs }}
          />

          <AppTextInput
            label="Mã hai bước / mã dự phòng (nếu đã bật)"
            value={mfaCode}
            onChangeText={setMfaCode}
            autoCapitalize="none"
            autoCorrect={false}
            disabled={isAuthenticating}
            testID="input-mfa"
            containerStyle={{ marginTop: 16, marginBottom: 16 }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ActivateAccount')}
          >
            <Text style={{ color: theme.colors.primary, marginBottom: 14 }}>
              Kích hoạt tài khoản được cấp →
            </Text>
          </Pressable>
          <View style={styles.forgotPasswordContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quên mật khẩu?"
              testID="btn-to-forgot-password"
              onPress={handleForgotPassword}
              disabled={isAuthenticating}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  theme.typography.label,
                  styles.forgotPasswordText,
                  { color: theme.colors.primary },
                ]}
              >
                Quên mật khẩu?
              </Text>
            </Pressable>
          </View>

          <View
            style={[styles.submitContainer, { marginTop: theme.spacing.lg }]}
          >
            <AppButton
              title="Đăng nhập"
              onPress={handleSubmit}
              loading={isAuthenticating}
              disabled={isAuthenticating}
              testID="btn-submit-login"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    textAlign: 'right',
  },
  submitContainer: {
    width: '100%',
  },
  errorBanner: {
    borderWidth: 1,
  },
});
