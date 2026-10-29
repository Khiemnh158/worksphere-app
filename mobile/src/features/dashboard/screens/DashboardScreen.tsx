/**
 * Phase 14B: Personal Dashboard Screen (SCR-MAIN-01)
 * Displays personal metrics, upcoming tasks, and recent notifications.
 *
 * Implements:
 * - Summary metric cards (Tasks, Projects, Service Requests)
 * - Max 5 upcoming tasks with status and priority badges
 * - Max 5 recent notifications with read/unread indicators
 * - Pull-to-refresh with RefreshControl
 * - Initial LoadingIndicator and full-screen ErrorState
 * - Section-level empty states when array data is empty
 * - Touch targets >= 48dp and accessibility headers/roles
 */

import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { MainTabNavProp } from '../../../app/navigation/types';
import { EmptyState, ErrorState, LoadingIndicator, PriorityBadge, StatusBadge } from '../../../shared/components';
import { MetricCard } from '../components/MetricCard';
import { useDashboard } from '../hooks/useDashboard';
import { formatDateTime } from '../utils/dateFormat';
import { RecentNotificationItem, UpcomingTaskItem } from '../api';

export function DashboardScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'Dashboard'>>();
  const { data, initialLoading, refreshing, error, refreshError, load, refresh } = useDashboard();

  if (initialLoading && !data) {
    return (
      <View
        style={[styles.centerWrapper, { backgroundColor: theme.colors.background }]}
        testID="screen-dashboard"
      >
        <Text style={styles.screenIdHidden}>SCR-MAIN-01</Text>
        <LoadingIndicator size="large" message="Đang tải dữ liệu bảng điều khiển..." fullScreen testID="dashboard-loading" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View
        style={[styles.centerWrapper, { backgroundColor: theme.colors.background }]}
        testID="screen-dashboard"
      >
        <Text style={styles.screenIdHidden}>SCR-MAIN-01</Text>
        <ErrorState
          title="Không thể tải bảng điều khiển"
          message={error}
          onRetry={load}
          retryTitle="Thử lại"
          testID="dashboard-error-state"
        />
      </View>
    );
  }

  const tasks = data?.tasks;
  const projects = data?.projects;
  const serviceRequests = data?.serviceRequests;
  const upcomingTasks = data?.upcomingTasks ?? [];
  const recentNotifications = data?.recentNotifications ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.contentContainer, { padding: theme.spacing.md }]}
      testID="screen-dashboard"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
          testID="dashboard-refresh-control"
        />
      }
    >
      {/* Header Info */}
      <View style={styles.headerArea}>
        <View style={styles.titleRow}>
          <Text style={[theme.typography.heading1, { color: theme.colors.textPrimary }]}>
            Bảng điều khiển
          </Text>
          <Text style={styles.screenIdHidden}>SCR-MAIN-01</Text>
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: theme.spacing.xxs }]}>
          SCR-MAIN-01: Tổng quan công việc và dự án cá nhân
        </Text>
      </View>

      {/* Inline Refresh Error Banner if refresh fails */}
      {refreshError ? (
        <View
          style={[
            styles.bannerError,
            {
              backgroundColor: theme.colors.errorContainer,
              borderColor: theme.colors.error,
              borderRadius: theme.radii.small,
              padding: theme.spacing.sm,
              marginBottom: theme.spacing.md,
            },
          ]}
          testID="dashboard-refresh-error-banner"
          accessible={true}
          accessibilityRole="alert"
        >
          <Text style={[theme.typography.body, { color: theme.colors.error }]}>
            {refreshError}
          </Text>
        </View>
      ) : null}

      {/* 1. Task Summary Section */}
      <View style={[styles.section, { marginBottom: theme.spacing.lg }]} testID="dashboard-task-summary-section">
        <Text
          style={[theme.typography.heading2, styles.sectionTitle, { color: theme.colors.textPrimary }]}
          accessibilityRole="header"
        >
          Công việc của tôi
        </Text>
        <View style={styles.metricRow}>
          <MetricCard label="Cần làm" value={tasks?.todo ?? 0} testID="metric-tasks-todo" />
          <View style={{ width: theme.spacing.xs }} />
          <MetricCard label="Đang làm" value={tasks?.inProgress ?? 0} highlight="info" testID="metric-tasks-inprogress" />
          <View style={{ width: theme.spacing.xs }} />
          <MetricCard label="Đang xét" value={tasks?.inReview ?? 0} testID="metric-tasks-inreview" />
          <View style={{ width: theme.spacing.xs }} />
          <MetricCard label="Hoàn thành" value={tasks?.completed ?? 0} highlight="success" testID="metric-tasks-completed" />
        </View>
        <View style={[styles.metricRow, { marginTop: theme.spacing.xs }]}>
          <MetricCard label="Quá hạn" value={tasks?.overdue ?? 0} highlight="warning" testID="metric-tasks-overdue" />
          <View style={{ width: theme.spacing.xs }} />
          <MetricCard label="Sắp đến hạn" value={tasks?.dueSoon ?? 0} highlight="warning" testID="metric-tasks-duesoon" />
        </View>
      </View>

      {/* 2. Project Summary Section */}
      <View style={[styles.section, { marginBottom: theme.spacing.lg }]} testID="dashboard-project-summary-section">
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[theme.typography.heading2, styles.sectionTitle, { color: theme.colors.textPrimary }]}
            accessibilityRole="header"
          >
            Dự án tham gia
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Projects')}
            style={({ pressed }) => [
              styles.navLink,
              { opacity: pressed ? 0.7 : 1, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Xem tất cả dự án"
            testID="btn-view-all-projects"
          >
            <Text style={[theme.typography.caption, styles.navLinkText, { color: theme.colors.primary }]}>
              Xem tất cả
            </Text>
          </Pressable>
        </View>
        <View style={styles.metricRow}>
          <MetricCard label="Đang thực hiện" value={projects?.active ?? 0} highlight="success" testID="metric-projects-active" />
          <View style={{ width: theme.spacing.xs }} />
          <MetricCard label="Tạm dừng" value={projects?.onHold ?? 0} highlight="warning" testID="metric-projects-onhold" />
        </View>
      </View>

      {/* 3. Service Request Summary Section */}
      <View style={[styles.section, { marginBottom: theme.spacing.lg }]} testID="dashboard-service-summary-section">
        <Text
          style={[theme.typography.heading2, styles.sectionTitle, { color: theme.colors.textPrimary }]}
          accessibilityRole="header"
        >
          Yêu cầu dịch vụ
        </Text>
        <View style={styles.metricRow}>
          <MetricCard label="Mở" value={serviceRequests?.open ?? 0} testID="metric-service-open" />
          <View style={{ width: theme.spacing.xs }} />
          <MetricCard label="Đang xử lý" value={serviceRequests?.inProgress ?? 0} highlight="info" testID="metric-service-inprogress" />
          <View style={{ width: theme.spacing.xs }} />
          <MetricCard label="Chờ phản hồi" value={serviceRequests?.waitingForUser ?? 0} highlight="warning" testID="metric-service-waiting" />
          <View style={{ width: theme.spacing.xs }} />
          <MetricCard label="Đã xử lý" value={serviceRequests?.resolved ?? 0} highlight="success" testID="metric-service-resolved" />
        </View>
      </View>

      {/* 4. Upcoming Tasks Section */}
      <View style={[styles.section, { marginBottom: theme.spacing.lg }]} testID="dashboard-upcoming-tasks-section">
        <Text
          style={[theme.typography.heading2, styles.sectionTitle, { color: theme.colors.textPrimary }]}
          accessibilityRole="header"
        >
          Công việc sắp đến hạn
        </Text>
        {upcomingTasks.length === 0 ? (
          <EmptyState
            title="Không có công việc sắp đến hạn"
            description="Bạn không có công việc nào cần hoàn thành trong 72 giờ tới."
            testID="empty-upcoming-tasks"
          />
        ) : (
          upcomingTasks.map((task: UpcomingTaskItem, index: number) => (
            <View
              key={task.id}
              accessible={true}
              accessibilityLabel={`Công việc: ${task.title}, Dự án: ${task.projectName}, Hạn chót: ${formatDateTime(task.dueDate)}`}
              testID={`upcoming-task-item-${index}`}
              style={[
                styles.taskCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.medium,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              <Text
                style={[theme.typography.body, styles.itemTitle, { color: theme.colors.textPrimary }]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <Text
                style={[theme.typography.caption, styles.itemSubtitle, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {task.projectName}
              </Text>
              <View style={[styles.badgeRow, { marginTop: theme.spacing.sm }]}>
                <StatusBadge status={task.status} />
                <View style={{ width: theme.spacing.xs }} />
                <PriorityBadge priority={task.priority} />
                <View style={styles.flexSpacer} />
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {formatDateTime(task.dueDate)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 5. Recent Notifications Section */}
      <View style={[styles.section, { marginBottom: theme.spacing.xl }]} testID="dashboard-recent-notifications-section">
        <Text
          style={[theme.typography.heading2, styles.sectionTitle, { color: theme.colors.textPrimary }]}
          accessibilityRole="header"
        >
          Thông báo gần đây
        </Text>
        {recentNotifications.length === 0 ? (
          <EmptyState
            title="Chưa có thông báo gần đây"
            description="Mọi cập nhật và thông báo mới sẽ xuất hiện tại đây."
            testID="empty-recent-notifications"
          />
        ) : (
          recentNotifications.map((notification: RecentNotificationItem, index: number) => (
            <View
              key={notification.id}
              accessible={true}
              accessibilityLabel={`Thông báo: ${notification.title}, ${notification.read ? 'Đã đọc' : 'Chưa đọc'}, Ngày gửi: ${formatDateTime(notification.createdAt)}`}
              testID={`recent-notification-item-${index}`}
              style={[
                styles.notificationCard,
                notification.read ? styles.notificationReadBorder : styles.notificationUnreadBorder,
                {
                  backgroundColor: notification.read ? theme.colors.surface : theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.medium,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.sm,
                  borderLeftColor: notification.read ? theme.colors.border : theme.colors.primary,
                },
              ]}
            >
              <View style={styles.notificationHeaderRow}>
                <Text
                  style={[
                    theme.typography.body,
                    styles.notificationTitle,
                    notification.read ? styles.textWeightRegular : styles.textWeightBold,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {notification.title}
                </Text>
                {!notification.read ? (
                  <View
                    style={[
                      styles.unreadDot,
                      { backgroundColor: theme.colors.primary, marginLeft: theme.spacing.xs },
                    ]}
                    accessibilityLabel="Chưa đọc"
                  />
                ) : null}
              </View>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: theme.spacing.xxs },
                ]}
                numberOfLines={2}
              >
                {notification.message}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  styles.notificationDate,
                  { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
                ]}
              >
                {formatDateTime(notification.createdAt)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  headerArea: {
    marginBottom: 20,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navLink: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    width: '100%',
  },
  bannerError: {
    borderWidth: 1,
  },
  taskCard: {
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationCard: {
    borderWidth: 1,
  },
  notificationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navLinkText: {
    fontWeight: '600',
  },
  itemTitle: {
    fontWeight: '600',
  },
  itemSubtitle: {
    marginTop: 2,
  },
  flexSpacer: {
    flex: 1,
  },
  notificationReadBorder: {
    borderLeftWidth: 1,
  },
  notificationUnreadBorder: {
    borderLeftWidth: 4,
  },
  notificationTitle: {
    flex: 1,
  },
  textWeightRegular: {
    fontWeight: '500',
  },
  textWeightBold: {
    fontWeight: '700',
  },
  notificationDate: {
    fontSize: 11,
  },
  screenIdHidden: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  screenIdBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
});
