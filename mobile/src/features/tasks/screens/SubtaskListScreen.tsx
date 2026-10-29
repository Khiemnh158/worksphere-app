/**
 * Phase 15F: Subtask List Screen (SCR-TSK-05)
 * Displays all subtasks under a parent task, with creation action gated by permissions.
 *
 * Invariants & Correctness Guarantees:
 * - Direct navigation to TaskDetail on child task card press.
 * - Subtask creation gated by canCreateSubtask capability passed from parent TaskDetail.allowedActions.
 * - Pull-to-refresh retains existing list on network failure, displaying non-blocking banner.
 * - Empty state rendered cleanly when parent task has 0 subtasks.
 * - Touch targets >= 48dp.
 */

import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { MainTabNavProp, MainTabScreenRouteProp } from '../../../app/navigation/types';
import { ErrorState, LoadingIndicator } from '../../../shared/components';
import { TaskDetail, TaskSummary } from '../api/taskTypes';
import { CreateSubtaskModal } from '../components/CreateSubtaskModal';
import { TaskCard } from '../components/TaskCard';
import { useSubtasks } from '../hooks/useSubtasks';
import { useTaskDetail } from '../hooks/useTaskDetail';

export function SubtaskListScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'SubtaskList'>>();
  const route = useRoute<MainTabScreenRouteProp<'SubtaskList'>>();

  const { parentTaskId, projectId: routeProjectId, parentTaskTitle: routeParentTaskTitle } = route.params;

  // Authoritatively derive parent task capabilities and context
  const { task: parentTask, initialLoading: parentTaskLoading } = useTaskDetail(parentTaskId);
  const canCreateSubtask = !parentTaskLoading && (parentTask?.allowedActions?.includes('CREATE_SUBTASK') === true);
  const projectId = routeProjectId || parentTask?.project?.id || '';
  const parentTaskTitle = routeParentTaskTitle || parentTask?.title;

  const {
    subtasks,
    loading,
    refreshing,
    error,
    refreshError,
    load,
    refresh,
    addSubtask,
  } = useSubtasks(parentTaskId);

  const [createModalVisible, setCreateModalVisible] = useState(false);

  const handleSubtaskPress = (subtask: TaskSummary) => {
    navigation.navigate('TaskDetail', { taskId: subtask.id });
  };

  const handleSubtaskCreated = (created: TaskDetail) => {
    addSubtask(created);
    setCreateModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerRow,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Quay lại chi tiết công việc"
          testID="btn-subtask-list-back"
        >
          <Text style={[styles.backIcon, { color: theme.colors.primary }]}>‹</Text>
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text
            style={[
              theme.typography.heading3,
              styles.headerTitleText,
              { color: theme.colors.textPrimary },
            ]}
            numberOfLines={1}
            testID="subtask-list-header-title"
          >
            Công việc con
          </Text>
          {parentTaskTitle ? (
            <Text
              style={[
                theme.typography.caption,
                styles.headerSubtitleText,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}
              testID="subtask-list-parent-title"
            >
              {parentTaskTitle}
            </Text>
          ) : null}
        </View>

        {canCreateSubtask ? (
          <Pressable
            onPress={() => setCreateModalVisible(true)}
            style={({ pressed }) => [
              styles.createButton,
              {
                borderColor: theme.colors.primary,
                backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Thêm công việc con mới"
            testID="btn-open-create-subtask-modal"
          >
            <Text
              style={[
                theme.typography.caption,
                styles.createButtonText,
                { color: theme.colors.primary },
              ]}
            >
              + Thêm
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </View>

      {/* Non-blocking Refresh Error Banner */}
      {refreshError ? (
        <View
          style={[styles.refreshErrorBanner, { backgroundColor: theme.colors.errorContainer }]}
          testID="subtask-list-refresh-error"
        >
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
            {refreshError}
          </Text>
        </View>
      ) : null}

      {/* Content States */}
      {loading ? (
        <View style={styles.centerContainer} testID="subtask-list-loading">
          <LoadingIndicator size="large" message="Đang tải danh sách công việc con..." />
        </View>
      ) : error ? (
        <View style={styles.centerContainer} testID="subtask-list-error">
          <ErrorState
            title="Không thể tải công việc con"
            message={error.message}
            onRetry={load}
            testID="subtask-list-error-state"
          />
        </View>
      ) : (
        <FlatList
          data={subtasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TaskCard task={item} onPress={() => handleSubtaskPress(item)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            subtasks.length === 0 ? styles.emptyContainer : undefined,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContent} testID="subtask-list-empty">
              <Text
                style={[
                  theme.typography.body,
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Chưa có công việc con nào.
              </Text>
              {canCreateSubtask ? (
                <Pressable
                  onPress={() => setCreateModalVisible(true)}
                  style={({ pressed }) => [
                    styles.emptyCreateButton,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Tạo công việc con đầu tiên"
                  testID="btn-empty-create-subtask"
                >
                  <Text style={[theme.typography.body, styles.emptyCreateButtonText, { color: theme.colors.primary }]}>
                    + Tạo công việc con
                  </Text>
                </Pressable>
              ) : null}
            </View>
          }
          testID="subtask-flat-list"
        />
      )}

      {/* Create Subtask Modal */}
      <CreateSubtaskModal
        visible={createModalVisible}
        parentTaskId={parentTaskId}
        projectId={projectId}
        onCreated={handleSubtaskCreated}
        onClose={() => setCreateModalVisible(false)}
        testID="create-subtask-modal"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 36,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  headerTitleText: {
    fontWeight: '700',
  },
  headerSubtitleText: {
    marginTop: 2,
  },
  createButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontWeight: '600',
  },
  headerRightSpacer: {
    width: 48,
  },
  refreshErrorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyCreateButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCreateButtonText: {
    fontWeight: '600',
  },
});
