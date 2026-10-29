import React, { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { useAuth } from '../../../app/auth';
import { APP_INFO } from '../../../shared/config';
import { AppButton } from '../../../shared/components/AppButton';
import { ConfirmationDialog } from '../../../shared/components/ConfirmationDialog';
import type { MainTabNavProp } from '../../../app/navigation/types';

export function SettingsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'Settings'>>();
  const { currentUser, logout } = useAuth();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutLockRef = useRef(false);

  const handleLogoutConfirm = async () => {
    if (logoutLockRef.current || loggingOut) {
      return;
    }

    logoutLockRef.current = true;
    setLoggingOut(true);

    try {
      await logout();
      // On success, AuthProvider sets unauthenticated state and root navigates to Login
    } catch {
      // Per Phase 13C: AuthProvider.logout clears local tokens even if server call fails
    } finally {
      setLoggingOut(false);
      logoutLockRef.current = false;
      setShowLogoutDialog(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-settings"
      accessibilityLabel="Màn hình cài đặt"
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
      >
        {/* Canonical Screen ID badge */}
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.colors.primaryContainer, borderRadius: theme.radii.small },
          ]}
        >
          <Text style={[theme.typography.caption, { color: theme.colors.onPrimaryContainer }]}>
            SCR-ACC-03
          </Text>
        </View>

        <Text
          style={[theme.typography.heading1, { color: theme.colors.textPrimary, marginTop: theme.spacing.sm }]}
        >
          Cài đặt
        </Text>

        {/* Safe User Account Summary */}
        {currentUser ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.medium,
                borderColor: theme.colors.border,
                padding: theme.spacing.md,
                marginTop: theme.spacing.md,
              },
            ]}
            testID="settings-account-card"
          >
            <Text style={[theme.typography.heading3, { color: theme.colors.textPrimary, marginBottom: theme.spacing.xs }]}>
              Tài khoản hiện tại
            </Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} testID="settings-user-name">
              {currentUser.fullName}
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]} testID="settings-user-email">
              {currentUser.email}
            </Text>
            <View style={styles.roleContainer}>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Vai trò:{' '}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.primary }, styles.roleText]} testID="settings-user-role">
                {currentUser.roles.join(', ') || 'EMPLOYEE'}
              </Text>
            </View>

            <AppButton
              title="Xem hồ sơ cá nhân"
              variant="outline"
              onPress={() => navigation.navigate('Profile')}
              accessibilityLabel="Xem hồ sơ cá nhân"
              testID="btn-navigate-profile-from-settings"
              style={styles.profileButton}
            />
          </View>
        ) : null}

        {/* Preferences / Options Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.medium,
              borderColor: theme.colors.border,
              padding: theme.spacing.md,
              marginTop: theme.spacing.md,
            },
          ]}
          testID="settings-preferences-card"
        >
          <Text style={[theme.typography.heading3, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
            Tùy chọn ứng dụng
          </Text>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Giao diện:</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} testID="settings-theme-info">
              Mặc định (Sáng)
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Thông báo:</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} testID="settings-notification-info">
              Trung tâm thông báo trong ứng dụng
            </Text>
          </View>

          <View style={[styles.infoRow, styles.lastInfoRow]}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Chính sách bảo mật:</Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }, styles.policyText]} testID="settings-policy-info">
              Tuân thủ chính sách bảo mật nội bộ WorkSphere
            </Text>
          </View>
        </View>

        {/* Application Information Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.medium,
              borderColor: theme.colors.border,
              padding: theme.spacing.md,
              marginTop: theme.spacing.md,
            },
          ]}
          testID="settings-app-info-card"
        >
          <Text style={[theme.typography.heading3, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
            Thông tin ứng dụng
          </Text>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Ứng dụng:</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} testID="settings-app-name">
              {APP_INFO.name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Phiên bản:</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} testID="settings-app-version">
              {APP_INFO.version}
            </Text>
          </View>

          <View style={[styles.infoRow, styles.lastInfoRow]}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Bản quyền:</Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
              © 2026 WorkSphere Team
            </Text>
          </View>
        </View>

        {/* Logout Action */}
        <View style={styles.logoutSection}>
          <AppButton
            title="Đăng xuất"
            variant="danger"
            onPress={() => setShowLogoutDialog(true)}
            accessibilityLabel="Đăng xuất tài khoản khỏi thiết bị"
            testID="btn-logout-settings"
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation Dialog (SCR-ACC-04) */}
      <ConfirmationDialog
        visible={showLogoutDialog}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        isDanger={true}
        loading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutDialog(false)}
        testID="dialog-logout-settings"
      />
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
  card: {
    borderWidth: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  logoutSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  profileButton: {
    marginTop: 12,
  },
  roleText: {
    fontWeight: '600',
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  policyText: {
    flex: 1,
    textAlign: 'right',
  },
});
