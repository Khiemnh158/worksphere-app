import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { useAuth } from '../../../app/auth';
import { authApi } from '../../auth/api/authApi';
import { UserProfileResponse } from '../../auth/api/authTypes';
import { mapAuthError, AuthPresentationError } from '../../auth/errors/authErrorMapper';
import { AppButton } from '../../../shared/components/AppButton';
import { LoadingIndicator } from '../../../shared/components/LoadingIndicator';
import { ErrorState } from '../../../shared/components/ErrorState';
import { ConfirmationDialog } from '../../../shared/components/ConfirmationDialog';
import type { ProfileNavigationProp } from '../../../app/navigation/types';

export function ProfileScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<ProfileNavigationProp<'Profile'>>();
  const { currentUser, logout, updateCurrentUser } = useAuth();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AuthPresentationError | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchLockRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (isPullToRefresh = false) => {
    if (fetchLockRef.current) {
      return;
    }
    fetchLockRef.current = true;

    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await authApi.getCurrentUser();
      if (mountedRef.current) {
        setProfile(data);
        if (updateCurrentUser) {
          updateCurrentUser({
            id: data.id,
            username: data.username,
            email: data.email,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl,
            department: data.department ? { id: data.department.id, name: data.department.name } : null,
            roles: data.roles ?? [],
            permissions: data.permissions ?? [],
          });
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        const mapped = mapAuthError(err);
        setError(mapped);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      fetchLockRef.current = false;
    }
  }, [updateCurrentUser]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProfile]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      if (mountedRef.current) {
        setLoggingOut(false);
        setShowLogoutDialog(false);
      }
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return 'WS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'Chưa ghi nhận';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Chưa ghi nhận';
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return 'Chưa ghi nhận';
    }
  };

  // Determine active display data (profile fetched or cached currentUser summary)
  const displayName = profile?.fullName || currentUser?.fullName || 'Người dùng';
  const displayEmail = profile?.email || currentUser?.email || 'Chưa cập nhật email';
  const displayUsername = profile?.username || currentUser?.username || '—';
  const displayPhone = profile?.phoneNumber || 'Chưa cập nhật';
  const displayDepartment = profile?.department?.name || currentUser?.department?.name || 'Chưa phân bổ';
  const displayStatus = profile?.status === 'ACTIVE' ? 'Đang hoạt động' : profile?.status || 'Hoạt động';
  const displayRoles = profile?.roles && profile.roles.length > 0
    ? profile.roles.join(', ')
    : currentUser?.roles && currentUser.roles.length > 0
    ? currentUser.roles.join(', ')
    : 'Thành viên';
  const displayCreatedAt = formatDate(profile?.createdAt);
  const displayLastLogin = formatDate(profile?.lastLoginAt);

  if (loading && !profile && !currentUser) {
    return (
      <SafeAreaView
        style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}
        testID="screen-profile-loading"
      >
        <LoadingIndicator size="large" message="Đang tải thông tin cá nhân..." />
      </SafeAreaView>
    );
  }

  if (error && !profile && !currentUser) {
    return (
      <SafeAreaView
        style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}
        testID="screen-profile-error"
      >
        <ErrorState
          title="Không thể tải hồ sơ"
          message={error.message}
          traceId={error.traceId}
          onRetry={() => fetchProfile()}
          testID="profile-error-state"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-profile"
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProfile(true)}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header Summary / Avatar */}
        <View style={styles.headerSection}>
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: theme.colors.primary },
            ]}
            accessible={true}
            accessibilityLabel={`Ảnh đại diện viết tắt: ${getInitials(displayName)}`}
            testID="profile-avatar-initials"
          >
            <Text style={[theme.typography.heading1, { color: theme.colors.onPrimary }]}>
              {getInitials(displayName)}
            </Text>
          </View>
          <Text
            style={[theme.typography.heading2, { color: theme.colors.textPrimary, marginTop: theme.spacing.md }]}
            testID="profile-display-name"
          >
            {displayName}
          </Text>
          <Text
            style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}
            testID="profile-display-email"
          >
            {displayEmail}
          </Text>
        </View>

        {/* Profile Information Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.medium,
              padding: theme.spacing.md,
              borderColor: theme.colors.border,
              marginTop: theme.spacing.lg,
            },
          ]}
        >
          <Text style={[theme.typography.heading3, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
            Thông tin chi tiết
          </Text>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Tên đăng nhập:</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} testID="profile-info-username">
              {displayUsername}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Số điện thoại:</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} testID="profile-info-phone">
              {displayPhone}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Phòng ban:</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} testID="profile-info-department">
              {displayDepartment}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Vai trò:</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} testID="profile-info-roles">
              {displayRoles}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Trạng thái:</Text>
            <Text style={[theme.typography.bodyMedium, { color: theme.colors.success }]} testID="profile-info-status">
              {displayStatus}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Ngày tham gia:</Text>
            <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]} testID="profile-info-created">
              {displayCreatedAt}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Đăng nhập gần nhất:</Text>
            <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]} testID="profile-info-last-login">
              {displayLastLogin}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
          <AppButton
            title="Chỉnh sửa thông tin"
            variant="outline"
            onPress={() => navigation.navigate('EditProfile')}
            accessibilityLabel="Chỉnh sửa thông tin cá nhân"
            testID="profile-edit-button"
            style={{ marginBottom: theme.spacing.sm }}
          />

          <AppButton
            title="Đổi mật khẩu"
            variant="outline"
            onPress={() => navigation.navigate('ChangePassword')}
            accessibilityLabel="Đổi mật khẩu tài khoản"
            testID="profile-change-password-button"
            style={{ marginBottom: theme.spacing.sm }}
          />

          <AppButton
            title="Đăng xuất"
            variant="danger"
            onPress={() => setShowLogoutDialog(true)}
            accessibilityLabel="Đăng xuất khỏi thiết bị này"
            testID="profile-logout-button"
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
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
        testID="dialog-logout"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionGroup: {
    marginTop: 24,
    marginBottom: 16,
  },
});
