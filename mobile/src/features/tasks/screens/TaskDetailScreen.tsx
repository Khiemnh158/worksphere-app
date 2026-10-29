/**
 * Phase 15C + 15E: Task Detail Screen (SCR-TSK-02)
 *
 * Canonical UI & Presentation Rules:
 * - Back button to return to Tasks list via navigation.goBack()
 * - Header shows project name and task title (strictly zero raw UUIDs)
 * - Details section: project context, status badge, priority badge, description
 * - Progress section: clamped 0..100 progress bar, start date, due date, completed date, estimated/actual minutes
 * - People section: reporter full name, assignees list (fullName, assigned date; zero raw IDs)
 * - Hierarchy & Milestone section: parent task title (if present), milestone name (if present)
 * - Status History section: timeline of transitions (fromStatus -> toStatus, changedBy, changedAt, comment)
 * - Summaries section: read-only subtask count and comment count
 * - Phase 15E Mutations:
 *   - Status transition modal (SCR-TSK-07) gated by UPDATE_STATUS
 *   - Progress update modal (SCR-TSK-08) gated by UPDATE_PROGRESS
 *   - Assign modal (eligible active project members only, disabled existing assignees) gated by ASSIGN
 *   - Unassign action with ConfirmationDialog using assignmentId (NOT userId) gated by UNASSIGN
 *   - Synchronous submit locks on all mutations
 *   - Immediate authoritative TaskDetail update via applyTaskUpdate without redundant GET
 *   - Stale fetch overwrite protection
 *   - Optimistic locking (HTTP 409) reload dialog
 * - Subtasks & Comments client capabilities are strictly deferred to Phase 15F
 * - Safe presentation error handling with reload/retry, and friendly 403 / 404 screens
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { MainTabNavProp, MainTabScreenRouteProp } from '../../../app/navigation/types';
import {
  ConfirmationDialog,
  ErrorState,
  LoadingIndicator,
  PriorityBadge,
  StatusBadge,
} from '../../../shared/components';
import { taskApi } from '../api/taskApi';
import { AssigneeDetail, TaskStatus, TaskStatusHistoryItem } from '../api/taskTypes';
import { ChangeStatusModal } from '../components/ChangeStatusModal';
import { ProjectMemberAssigneePickerModal } from '../components/ProjectMemberAssigneePickerModal';
import { UpdateProgressModal } from '../components/UpdateProgressModal';
import { mapTaskError } from '../errors/taskErrorMapper';
import { useTaskDetail } from '../hooks/useTaskDetail';

function formatDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) {
    return 'Chưa xác định';
  }
  const datePart = isoOrDate.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoOrDate;
}

function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) {
    return 'Chưa xác định';
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return formatDate(isoString);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return formatDate(isoString);
  }
}

export function TaskDetailScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'TaskDetail'>>();
  const route = useRoute<MainTabScreenRouteProp<'TaskDetail'>>();

  const { taskId } = route.params;
  const { task, initialLoading, refreshing, error, refreshError, load, refresh, applyTaskUpdate } =
    useTaskDetail(taskId);

  // Mutation modal visibility states
  const [statusModalVisible, setStatusModalVisible] = useState<boolean>(false);
  const [progressModalVisible, setProgressModalVisible] = useState<boolean>(false);
  const [assignModalVisible, setAssignModalVisible] = useState<boolean>(false);
  const [unassignConfirmVisible, setUnassignConfirmVisible] = useState<boolean>(false);
  const [assigneeToUnassign, setAssigneeToUnassign] = useState<AssigneeDetail | null>(null);

  // Optimistic lock conflict reload dialog
  const [conflictVisible, setConflictVisible] = useState<boolean>(false);

  // Mutation error banner
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Loading states for buttons/modals
  const [statusSubmitting, setStatusSubmitting] = useState<boolean>(false);
  const [progressSubmitting, setProgressSubmitting] = useState<boolean>(false);
  const [unassignSubmitting, setUnassignSubmitting] = useState<boolean>(false);

  // Synchronous submit locks
  const statusLockRef = useRef<boolean>(false);
  const progressLockRef = useRef<boolean>(false);
  const assignLockRef = useRef<boolean>(false);
  const unassignLockRef = useRef<boolean>(false);

  // Focus-aware refresh for return-from-edit freshness without initial duplicate GET
  const isFirstMountRef = useRef<boolean>(true);
  useEffect(() => {
    if (!navigation?.addListener) return;
    const unsubscribe = navigation.addListener('focus', () => {
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
        return;
      }
      refresh();
    });

    return () => {
      unsubscribe?.();
    };
  }, [navigation, refresh]);

  // Mutation Handlers
  const handleStatusChange = async (targetStatus: TaskStatus, comment?: string) => {
    if (statusLockRef.current || !task) return;
    statusLockRef.current = true;
    setStatusSubmitting(true);
    setMutationError(null);

    try {
      const updated = await taskApi.changeTaskStatus(task.id, {
        status: targetStatus,
        comment,
        version: task.version,
      });
      applyTaskUpdate(updated);
      setStatusModalVisible(false);
    } catch (err: unknown) {
      const mapped = mapTaskError(err);
      if (mapped.isConflict) {
        setStatusModalVisible(false);
        setConflictVisible(true);
      } else {
        setMutationError(mapped.message);
      }
    } finally {
      statusLockRef.current = false;
      setStatusSubmitting(false);
    }
  };

  const handleProgressChange = async (newProgress: number) => {
    if (progressLockRef.current || !task) return;
    progressLockRef.current = true;
    setProgressSubmitting(true);
    setMutationError(null);

    try {
      const updated = await taskApi.updateTaskProgress(task.id, {
        progressPercent: newProgress,
        version: task.version,
      });
      applyTaskUpdate(updated);
      setProgressModalVisible(false);
    } catch (err: unknown) {
      const mapped = mapTaskError(err);
      if (mapped.isConflict) {
        setProgressModalVisible(false);
        setConflictVisible(true);
      } else {
        setMutationError(mapped.message);
      }
    } finally {
      progressLockRef.current = false;
      setProgressSubmitting(false);
    }
  };

  const handleAssign = async (selectedUserIds: string[]) => {
    if (assignLockRef.current || !task) return;
    const existingUserIds = task.assignees.map(a => a.id);
    const newUserIds = selectedUserIds.filter(uid => !existingUserIds.includes(uid));

    if (newUserIds.length === 0) {
      setAssignModalVisible(false);
      return;
    }

    assignLockRef.current = true;
    setMutationError(null);

    try {
      const updated = await taskApi.assignUsers(task.id, {
        assigneeIds: newUserIds,
      });
      applyTaskUpdate(updated);
      setAssignModalVisible(false);
    } catch (err: unknown) {
      const mapped = mapTaskError(err);
      setMutationError(mapped.message);
    } finally {
      assignLockRef.current = false;
    }
  };

  const handleUnassign = async () => {
    if (unassignLockRef.current || !task || !assigneeToUnassign) return;
    unassignLockRef.current = true;
    setUnassignSubmitting(true);
    setMutationError(null);

    try {
      // CRITICAL: Must use assignmentId, NOT userId!
      const updated = await taskApi.unassignUser(task.id, assigneeToUnassign.assignmentId);
      applyTaskUpdate(updated);
      setUnassignConfirmVisible(false);
      setAssigneeToUnassign(null);
    } catch (err: unknown) {
      const mapped = mapTaskError(err);
      setMutationError(mapped.message);
    } finally {
      unassignLockRef.current = false;
      setUnassignSubmitting(false);
    }
  };

  // 1. Initial Loading State
  if (initialLoading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}
        testID="task-detail-loading"
      >
        <LoadingIndicator size="large" message="Đang tải chi tiết công việc..." />
      </View>
    );
  }

  // 2. Initial Error State (404, 403, Network, Server)
  if (error || !task) {
    const errorTitle = error?.isNotFound
      ? 'Không tìm thấy công việc'
      : error?.isForbidden
      ? 'Không có quyền truy cập'
      : 'Không thể tải công việc';

    const errorMessage = error?.isNotFound
      ? 'Công việc không tồn tại hoặc đã bị xóa.'
      : error?.isForbidden
      ? 'Bạn không có quyền xem thông tin công việc này.'
      : error?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu công việc.';

    const canRetry = !error?.isNotFound && !error?.isForbidden && error?.retryable !== false;

    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}
        testID="task-detail-error"
      >
        <ErrorState
          title={errorTitle}
          message={errorMessage}
          onRetry={canRetry ? load : undefined}
          testID="task-detail-error-state"
        />
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButtonBottom,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          testID="btn-back-from-error"
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách công việc"
        >
          <Text
            style={[
              theme.typography.body,
              styles.backButtonText,
              { color: theme.colors.textPrimary },
            ]}
          >
            ← Quay lại danh sách
          </Text>
        </Pressable>
      </View>
    );
  }

  const clampedProgress = Math.max(0, Math.min(100, Math.round(task.progressPercent ?? 0)));
  const formattedStartDate = formatDate(task.startDate);
  const formattedDueDate = formatDate(task.dueDate);
  const formattedCompletedAt = task.completedAt ? formatDate(task.completedAt) : null;
  const formattedCreatedAt = formatDateTime(task.createdAt);
  const formattedUpdatedAt = formatDateTime(task.updatedAt);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-task-detail"
    >
      {/* Non-blocking refresh error banner */}
      {refreshError ? (
        <View
          style={[styles.refreshErrorBanner, { backgroundColor: theme.colors.errorContainer }]}
          testID="task-detail-refresh-error"
        >
          <Text
            style={[theme.typography.caption, styles.bannerText, { color: theme.colors.error }]}
          >
            {refreshError}
          </Text>
        </View>
      ) : null}

      {/* Mutation error banner */}
      {mutationError ? (
        <View
          style={[styles.mutationErrorBanner, { backgroundColor: theme.colors.errorContainer }]}
          testID="task-detail-mutation-error"
        >
          <Text
            style={[theme.typography.caption, styles.bannerText, styles.flexOne, { color: theme.colors.error }]}
          >
            {mutationError}
          </Text>
          <Pressable
            onPress={() => setMutationError(null)}
            style={styles.closeBannerButton}
            accessibilityRole="button"
            accessibilityLabel="Đóng thông báo lỗi"
          >
            <Text style={[styles.closeBannerText, { color: theme.colors.error }]}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Top Navigation Row: Back Button & Edit Action */}
        <View style={styles.topNavRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backNavRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Quay lại danh sách công việc"
            testID="btn-task-detail-back"
          >
            <Text style={[theme.typography.body, styles.backNavText, { color: theme.colors.primary }]}>
              ← Quay lại
            </Text>
          </Pressable>

          {task.allowedActions?.includes('UPDATE') ? (
            <Pressable
              onPress={() => navigation.navigate('EditTask', { taskId: task.id })}
              style={({ pressed }) => [
                styles.editButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: pressed ? 0.8 : 1,
                  borderRadius: theme.radii.small,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Chỉnh sửa công việc"
              testID="btn-edit-task"
            >
              <Text
                style={[
                  theme.typography.caption,
                  styles.editButtonText,
                  { color: theme.colors.onPrimary },
                ]}
              >
                Chỉnh sửa
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Header Section: Project Context, Status & Title */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.medium,
            },
          ]}
        >
          <View style={styles.projectContextRow}>
            <Text
              style={[
                theme.typography.caption,
                styles.projectNameText,
                { color: theme.colors.textSecondary },
              ]}
              testID="task-detail-project-name"
            >
              {task.project?.name ?? 'Dự án'}
            </Text>
            <View style={styles.badgeRow}>
              <PriorityBadge priority={task.priority} />
              <View style={styles.badgeSpacer} />
              <StatusBadge type="task" status={task.status} />
              {task.allowedActions?.includes('UPDATE_STATUS') ? (
                <Pressable
                  onPress={() => setStatusModalVisible(true)}
                  style={({ pressed }) => [
                    styles.actionChip,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
                      marginLeft: 8,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Đổi trạng thái công việc"
                  testID="btn-open-status-modal"
                >
                  <Text style={[theme.typography.caption, styles.chipText, { color: theme.colors.primary }]}>
                    Đổi trạng thái
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Text
            style={[
              theme.typography.heading2,
              styles.taskTitleText,
              { color: theme.colors.textPrimary },
            ]}
            testID="task-detail-title"
          >
            {task.title}
          </Text>

          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text
                style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
              >
                Tiến độ thực hiện
              </Text>
              <View style={styles.progressActionsRow}>
                <Text
                  style={[
                    theme.typography.caption,
                    styles.progressPercentText,
                    { color: theme.colors.textPrimary },
                  ]}
                  testID="task-detail-progress-percent"
                >
                  {task.progressPercent ?? 0}%
                </Text>
                {task.allowedActions?.includes('UPDATE_PROGRESS') ? (
                  <Pressable
                    onPress={() => setProgressModalVisible(true)}
                    style={({ pressed }) => [
                      styles.actionChipSmall,
                      {
                        borderColor: theme.colors.primary,
                        backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
                        marginLeft: 8,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Cập nhật tiến độ"
                    testID="btn-open-progress-modal"
                  >
                    <Text style={[theme.typography.caption, styles.chipText, { color: theme.colors.primary }]}>
                      Cập nhật
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            <View
              style={[
                styles.progressBarTrack,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.radii.small,
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radii.small,
                    width: `${clampedProgress}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Schedule & Time Section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.medium,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.heading3,
              styles.sectionTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Thời gian & Tiến độ
          </Text>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Ngày bắt đầu:
            </Text>
            <Text
              style={[theme.typography.body, styles.infoValue, { color: theme.colors.textPrimary }]}
              testID="task-detail-start-date"
            >
              {formattedStartDate}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Hạn hoàn thành:
            </Text>
            <Text
              style={[theme.typography.body, styles.infoValue, { color: theme.colors.textPrimary }]}
              testID="task-detail-due-date"
            >
              {formattedDueDate}
            </Text>
          </View>

          {task.completedAt ? (
            <View style={styles.infoRow}>
              <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Hoàn thành lúc:
              </Text>
              <Text
                style={[theme.typography.body, styles.infoValue, { color: theme.colors.textPrimary }]}
                testID="task-detail-completed-date"
              >
                {formattedCompletedAt}
              </Text>
            </View>
          ) : null}

          {task.estimatedMinutes !== null && task.estimatedMinutes !== undefined ? (
            <View style={styles.infoRow}>
              <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Thời gian ước tính:
              </Text>
              <Text style={[theme.typography.body, styles.infoValue, { color: theme.colors.textPrimary }]}>
                {task.estimatedMinutes} phút
              </Text>
            </View>
          ) : null}

          {task.actualMinutes !== null && task.actualMinutes !== undefined ? (
            <View style={styles.infoRow}>
              <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Thời gian thực tế:
              </Text>
              <Text style={[theme.typography.body, styles.infoValue, { color: theme.colors.textPrimary }]}>
                {task.actualMinutes} phút
              </Text>
            </View>
          ) : null}
        </View>

        {/* Hierarchy & Milestone Section (if present) */}
        {task.parentTask || task.milestone ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.medium,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.heading3,
                styles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Phân cấp & Mốc dự án
            </Text>

            {task.parentTask ? (
              <View style={styles.infoRow}>
                <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Công việc cha:
                </Text>
                <Text
                  style={[theme.typography.body, styles.infoValue, { color: theme.colors.textPrimary }]}
                  testID="task-detail-parent-task"
                >
                  {task.parentTask.title}
                </Text>
              </View>
            ) : null}

            {task.milestone ? (
              <View style={styles.infoRow}>
                <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Mốc tiến độ:
                </Text>
                <Text
                  style={[theme.typography.body, styles.infoValue, { color: theme.colors.textPrimary }]}
                  testID="task-detail-milestone"
                >
                  {task.milestone.name}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Description Section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.medium,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.heading3,
              styles.sectionTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Mô tả công việc
          </Text>
          <Text
            style={[
              theme.typography.body,
              styles.descriptionText,
              { color: task.description ? theme.colors.textPrimary : theme.colors.textSecondary },
            ]}
            testID="task-detail-description"
          >
            {task.description && task.description.trim().length > 0
              ? task.description
              : 'Chưa có mô tả cho công việc này.'}
          </Text>
        </View>

        {/* Personnel Section: Reporter & Assignees */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.medium,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.heading3,
              styles.sectionTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Nhân sự tham gia
          </Text>

          {/* Reporter */}
          <View style={styles.infoRow}>
            <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Người giao việc:
            </Text>
            <Text
              style={[theme.typography.body, styles.infoValue, { color: theme.colors.textPrimary }]}
              testID="task-detail-reporter"
            >
              {task.reporter?.fullName ?? 'Hệ thống'}
            </Text>
          </View>

          {/* Assignees Header with Assign Action */}
          <View style={styles.assigneeSection}>
            <View style={styles.assigneeHeaderRow}>
              <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Người thực hiện:
              </Text>
              {task.allowedActions?.includes('ASSIGN') ? (
                <Pressable
                  onPress={() => setAssignModalVisible(true)}
                  style={({ pressed }) => [
                    styles.actionChipSmall,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Phân công người thực hiện"
                  testID="btn-open-assign-modal"
                >
                  <Text style={[theme.typography.caption, styles.chipText, { color: theme.colors.primary }]}>
                    + Phân công
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {task.assignees && task.assignees.length > 0 ? (
              <View style={styles.assigneeList} testID="task-detail-assignees-list">
                {task.assignees.map((assignee, index) => (
                  <View
                    key={`assignee-${assignee.assignmentId || assignee.id || index}`}
                    style={styles.assigneeItem}
                  >
                    <View style={styles.assigneeItemLeft}>
                      <Text style={[theme.typography.body, styles.assigneeName, { color: theme.colors.textPrimary }]}>
                        • {assignee.fullName}
                      </Text>
                      {assignee.assignedAt ? (
                        <Text style={[theme.typography.caption, styles.assignedAtText, { color: theme.colors.textSecondary }]}>
                          (Giao ngày: {formatDate(assignee.assignedAt)})
                        </Text>
                      ) : null}
                    </View>

                    {task.allowedActions?.includes('UNASSIGN') ? (
                      <Pressable
                        onPress={() => {
                          setAssigneeToUnassign(assignee);
                          setUnassignConfirmVisible(true);
                        }}
                        style={({ pressed }) => [
                          styles.unassignButton,
                          { opacity: pressed ? 0.6 : 1 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Gỡ phân công ${assignee.fullName}`}
                        testID={`btn-unassign-${assignee.id}`}
                      >
                        <Text style={[theme.typography.caption, styles.unassignText, { color: theme.colors.error }]}>
                          Gỡ
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text
                style={[theme.typography.body, styles.emptyText, { color: theme.colors.textSecondary }]}
                testID="task-detail-no-assignees"
              >
                Chưa phân công người thực hiện.
              </Text>
            )}
          </View>
        </View>

        {/* Summaries: Subtasks & Comments (Navigable to SCR-TSK-05 & SCR-TSK-06 in 15F) */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.medium,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.heading3,
              styles.sectionTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Công việc con & Bình luận
          </Text>

          <Pressable
            onPress={() =>
              navigation.navigate('SubtaskList', {
                parentTaskId: task.id,
                projectId: task.project.id,
                parentTaskTitle: task.title,
              })
            }
            style={({ pressed }) => [
              styles.navRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Xem danh sách công việc con"
            testID="btn-navigate-subtasks"
          >
            <View style={styles.infoRow}>
              <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Công việc con:
              </Text>
              <View style={styles.navRowRight}>
                <Text
                  style={[theme.typography.body, styles.infoValue, { color: theme.colors.primary }]}
                  testID="task-detail-subtask-count"
                >
                  {task.subtasks ? task.subtasks.length : 0} công việc con
                </Text>
                <Text style={[styles.navChevron, { color: theme.colors.primary }]}> ›</Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate('TaskComments', {
                taskId: task.id,
                taskTitle: task.title,
              })
            }
            style={({ pressed }) => [
              styles.navRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Xem danh sách bình luận"
            testID="btn-navigate-comments"
          >
            <View style={styles.infoRow}>
              <Text style={[theme.typography.caption, styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Bình luận gần đây:
              </Text>
              <View style={styles.navRowRight}>
                <Text
                  style={[theme.typography.body, styles.infoValue, { color: theme.colors.primary }]}
                  testID="task-detail-comment-count"
                >
                  {task.recentComments ? task.recentComments.length : 0} bình luận
                </Text>
                <Text style={[styles.navChevron, { color: theme.colors.primary }]}> ›</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Status History Section */}
        {task.statusHistory && task.statusHistory.length > 0 ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.medium,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.heading3,
                styles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Lịch sử trạng thái
            </Text>

            <View style={styles.historyList} testID="task-detail-status-history">
              {task.statusHistory.map((item: TaskStatusHistoryItem, index: number) => (
                <View
                  key={`history-${item.id || index}`}
                  style={[
                    styles.historyItem,
                    index > 0 ? styles.historyItemBorder : null,
                  ]}
                >
                  <View style={styles.historyHeader}>
                    <Text
                      style={[
                        theme.typography.caption,
                        styles.historyChangedBy,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {item.changedBy?.fullName ?? 'Hệ thống'}
                    </Text>
                    <Text
                      style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
                    >
                      {formatDateTime(item.changedAt)}
                    </Text>
                  </View>
                  <View style={styles.historyTransitionRow}>
                    <StatusBadge type="task" status={item.fromStatus as TaskStatus} />
                    <Text
                      style={[styles.historyArrow, { color: theme.colors.textSecondary }]}
                    >
                      →
                    </Text>
                    <StatusBadge type="task" status={item.toStatus as TaskStatus} />
                  </View>
                  {item.comment ? (
                    <Text
                      style={[
                        theme.typography.caption,
                        styles.historyComment,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      "{item.comment}"
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Audit Metadata Section */}
        <View style={styles.metadataSection}>
          <Text style={[theme.typography.caption, styles.metaText, { color: theme.colors.textSecondary }]}>
            Tạo ngày: {formattedCreatedAt}
          </Text>
          <Text style={[theme.typography.caption, styles.metaText, { color: theme.colors.textSecondary }]}>
            Cập nhật lần cuối: {formattedUpdatedAt}
          </Text>
        </View>
      </ScrollView>

      {/* Mutation Modals & Dialogs */}
      <ChangeStatusModal
        visible={statusModalVisible}
        currentStatus={task.status}
        onConfirm={handleStatusChange}
        onClose={() => setStatusModalVisible(false)}
        submitting={statusSubmitting}
      />

      <UpdateProgressModal
        visible={progressModalVisible}
        currentProgress={task.progressPercent ?? 0}
        onConfirm={handleProgressChange}
        onClose={() => setProgressModalVisible(false)}
        submitting={progressSubmitting}
      />

      <ProjectMemberAssigneePickerModal
        visible={assignModalVisible}
        projectId={task.project.id}
        selectedUserIds={[]}
        disabledUserIds={task.assignees.map(a => a.id)}
        onConfirm={handleAssign}
        onClose={() => setAssignModalVisible(false)}
        title="Phân công người thực hiện"
        testID="task-assignee-picker-modal"
      />

      <ConfirmationDialog
        visible={unassignConfirmVisible}
        title="Gỡ phân công"
        message={`Bạn có chắc chắn muốn gỡ ${assigneeToUnassign?.fullName ?? 'người thực hiện này'} khỏi công việc không?`}
        confirmText="Gỡ"
        cancelText="Hủy"
        isDanger
        loading={unassignSubmitting}
        onConfirm={handleUnassign}
        onCancel={() => {
          setUnassignConfirmVisible(false);
          setAssigneeToUnassign(null);
        }}
        testID="dialog-confirm-unassign"
      />

      <ConfirmationDialog
        visible={conflictVisible}
        title="Xung đột dữ liệu"
        message="Dữ liệu công việc đã được cập nhật bởi người khác trong khi bạn đang thao tác. Bạn có muốn tải lại dữ liệu mới nhất không?"
        confirmText="Tải lại dữ liệu"
        cancelText="Đóng"
        onConfirm={() => {
          setConflictVisible(false);
          refresh();
        }}
        onCancel={() => setConflictVisible(false)}
        testID="dialog-conflict-reload"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  refreshErrorBanner: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  mutationErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  bannerText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  flexOne: {
    flex: 1,
  },
  closeBannerButton: {
    padding: 4,
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBannerText: {
    fontWeight: 'bold',
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backNavRow: {
    paddingVertical: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  backNavText: {
    fontWeight: '600',
  },
  editButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '600',
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  projectContextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectNameText: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeSpacer: {
    width: 6,
  },
  actionChip: {
    minHeight: 48,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionChipSmall: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontWeight: '600',
  },
  taskTitleText: {
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPercentText: {
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    flex: 1,
  },
  infoValue: {
    flex: 1.5,
    textAlign: 'right',
  },
  descriptionText: {
    lineHeight: 22,
  },
  assigneeSection: {
    marginTop: 8,
  },
  assigneeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  assigneeList: {
    marginTop: 4,
  },
  assigneeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    minHeight: 48,
  },
  assigneeItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  assigneeName: {
    fontWeight: '500',
  },
  assignedAtText: {
    marginLeft: 6,
  },
  unassignButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unassignText: {
    fontWeight: '600',
  },
  emptyText: {
    fontStyle: 'italic',
    marginTop: 4,
  },
  historyList: {
    marginTop: 4,
  },
  historyItem: {
    paddingVertical: 10,
  },
  historyItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyChangedBy: {
    fontWeight: '600',
  },
  historyTransitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyArrow: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  historyComment: {
    fontStyle: 'italic',
    marginTop: 4,
  },
  metadataSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  metaText: {
    marginBottom: 2,
  },
  backButtonBottom: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  backButtonText: {
    fontWeight: '600',
  },
  navRow: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  navChevron: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 4,
  },
});
