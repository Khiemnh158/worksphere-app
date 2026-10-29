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
import { useAuth } from '../../../app/auth';
import { authApi } from '../../auth/api/authApi';
import {
  normalizeFullName,
  normalizePhoneNumber,
  validateUpdateProfile,
  FieldErrors,
} from '../../auth/validation/authValidation';
import { mapAuthError, AuthPresentationError } from '../../auth/errors/authErrorMapper';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { AppButton } from '../../../shared/components/AppButton';
import type { ProfileNavigationProp } from '../../../app/navigation/types';

export function EditProfileScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<ProfileNavigationProp<'EditProfile'>>();
  const { currentUser, updateCurrentUser } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'fullName' | 'phoneNumber'>>({});
  const [globalError, setGlobalError] = useState<AuthPresentationError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const submitLockRef = useRef(false);

  const handleSubmit = async () => {
    if (submitLockRef.current || submitting) {
      return;
    }

    const trimmedFullName = normalizeFullName(fullName);
    const trimmedPhone = normalizePhoneNumber(phoneNumber);

    const validationErrors = validateUpdateProfile({
      fullName: trimmedFullName,
      phoneNumber: trimmedPhone,
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
      const updatedProfile = await authApi.updateProfile({
        fullName: trimmedFullName,
        phoneNumber: trimmedPhone,
        avatarFileId: null,
      });

      if (updateCurrentUser) {
        updateCurrentUser({
          id: updatedProfile.id,
          username: updatedProfile.username,
          email: updatedProfile.email,
          fullName: updatedProfile.fullName,
          avatarUrl: updatedProfile.avatarUrl,
          department: updatedProfile.department
            ? { id: updatedProfile.department.id, name: updatedProfile.department.name }
            : null,
          roles: updatedProfile.roles ?? [],
          permissions: updatedProfile.permissions ?? [],
        });
      }

      setSuccessMessage('Hồ sơ đã được cập nhật thành công');
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (err: any) {
      const mapped = mapAuthError(err);
      if (err?.fieldErrors && typeof err.fieldErrors === 'object') {
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
      testID="screen-edit-profile"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary, marginBottom: theme.spacing.xs }]}>
            Chỉnh sửa hồ sơ
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xl }]}>
            Cập nhật tên và số điện thoại liên lạc của bạn
          </Text>

          {globalError ? (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: theme.colors.errorContainer, borderRadius: theme.radii.medium },
              ]}
              testID="edit-profile-global-error"
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

          {successMessage ? (
            <View
              style={[
                styles.successBanner,
                { backgroundColor: theme.colors.successContainer, borderRadius: theme.radii.medium },
              ]}
              testID="edit-profile-success-message"
            >
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.success }]}>
                {successMessage}
              </Text>
            </View>
          ) : null}

          <AppTextInput
            label="Họ và tên"
            value={fullName}
            onChangeText={setFullName}
            error={fieldErrors.fullName}
            required
            placeholder="Nhập họ và tên đầy đủ"
            accessibilityLabel="Họ và tên đầy đủ"
            testID="input-fullname"
            disabled={submitting}
            containerStyle={{ marginBottom: theme.spacing.md }}
          />

          <AppTextInput
            label="Số điện thoại"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            error={fieldErrors.phoneNumber}
            placeholder="Ví dụ: 0912 345 678"
            keyboardType="phone-pad"
            accessibilityLabel="Số điện thoại"
            testID="input-phone"
            disabled={submitting}
            containerStyle={{ marginBottom: theme.spacing.xl }}
          />

          <View style={styles.buttonGroup}>
            <AppButton
              title="Lưu thay đổi"
              variant="primary"
              loading={submitting}
              onPress={handleSubmit}
              accessibilityLabel="Lưu cập nhật hồ sơ"
              testID="btn-save-profile"
              style={{ marginBottom: theme.spacing.sm }}
            />

            <AppButton
              title="Hủy"
              variant="outline"
              disabled={submitting}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Hủy và quay lại"
              testID="btn-cancel-edit-profile"
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
