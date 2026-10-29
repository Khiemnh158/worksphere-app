/**
 * Phase 15F: Task Comments Screen (SCR-TSK-06)
 * Displays paginated task comments with create, edit, and delete capabilities.
 *
 * Invariants & Correctness Guarantees:
 * - Direct navigation from TaskDetail.
 * - Add comment gated by task.allowedActions.includes('ADD_COMMENT') independently fetched from task detail.
 * - Edit and delete comment gated to comment author OR users with canonical ADMIN role.
 * - Synchronous useRef locks protect create, update, and delete mutations against double-submission.
 * - Monotonic generation and pagination lock in useTaskComments ensure race-free list updates.
 * - Non-blocking refresh error banner preserves existing comments.
 * - Accessible roles, minimum 48dp touch targets, zero raw IDs in user-visible text.
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../../app/auth';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { MainTabNavProp, MainTabScreenRouteProp } from '../../../app/navigation/types';
import { AppButton, ConfirmationDialog, ErrorState, LoadingIndicator } from '../../../shared/components';
import { taskApi } from '../api/taskApi';
import { TaskComment } from '../api/taskTypes';
import { mapTaskError } from '../errors/taskErrorMapper';
import { useTaskComments } from '../hooks/useTaskComments';
import { useTaskDetail } from '../hooks/useTaskDetail';

function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) {
    return '—';
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return isoString;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

export function TaskCommentsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'TaskComments'>>();
  const route = useRoute<MainTabScreenRouteProp<'TaskComments'>>();
  const { currentUser } = useAuth();

  const { taskId } = route.params;

  // Authoritatively derive task capabilities
  const { task, initialLoading: taskLoading } = useTaskDetail(taskId);
  const canAddComment = !taskLoading && (task?.allowedActions?.includes('ADD_COMMENT') === true);

  const {
    comments,
    loading,
    refreshing,
    loadingMore,
    error,
    refreshError,
    load,
    refresh,
    loadMore,
    addComment,
    updateCommentInList,
    removeCommentFromList,
  } = useTaskComments(taskId);

  // New Comment State
  const [newCommentText, setNewCommentText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const addingRef = useRef(false);

  // Edit Comment State
  const [editingComment, setEditingComment] = useState<TaskComment | null>(null);
  const [editContentText, setEditContentText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const updatingRef = useRef(false);

  // Delete Comment State
  const [commentToDelete, setCommentToDelete] = useState<TaskComment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletingRef = useRef(false);

  // Permissions check: aligns with backend TaskCommentApplicationService (author OR canonical system admin)
  const isSystemAdmin = currentUser?.roles?.includes('ADMIN') || false;

  const isAuthor = (comment: TaskComment): boolean => {
    return !!currentUser?.id && comment.author?.id === currentUser.id;
  };

  const canManageComment = (comment: TaskComment): boolean => {
    return isAuthor(comment) || isSystemAdmin;
  };

  const canEditComment = (comment: TaskComment): boolean => {
    return canManageComment(comment);
  };

  const canDeleteComment = (comment: TaskComment): boolean => {
    return canManageComment(comment);
  };

  // Add Comment Handler
  const handleAddComment = async () => {
    const trimmed = newCommentText.trim();
    if (!trimmed || addingRef.current || isAdding) {
      return;
    }

    addingRef.current = true;
    setIsAdding(true);
    setAddError(null);

    try {
      const created = await taskApi.createComment(taskId, { content: trimmed });
      addComment(created);
      setNewCommentText('');
    } catch (err: unknown) {
      const presentationErr = mapTaskError(err);
      setAddError(presentationErr.message);
    } finally {
      addingRef.current = false;
      setIsAdding(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (comment: TaskComment) => {
    setEditingComment(comment);
    setEditContentText(comment.content);
    setEditError(null);
  };

  // Save Edit Handler
  const handleSaveEdit = async () => {
    if (!editingComment) return;
    const trimmed = editContentText.trim();
    if (!trimmed || updatingRef.current || isUpdating) {
      return;
    }

    updatingRef.current = true;
    setIsUpdating(true);
    setEditError(null);

    try {
      const updated = await taskApi.updateComment(taskId, editingComment.id, {
        content: trimmed,
      });
      updateCommentInList(editingComment.id, updated);
      setEditingComment(null);
      setEditContentText('');
    } catch (err: unknown) {
      const presentationErr = mapTaskError(err);
      setEditError(presentationErr.message);
    } finally {
      updatingRef.current = false;
      setIsUpdating(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!commentToDelete || deletingRef.current || isDeleting) {
      return;
    }

    deletingRef.current = true;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await taskApi.deleteComment(taskId, commentToDelete.id);
      removeCommentFromList(commentToDelete.id);
      setCommentToDelete(null);
    } catch (err: unknown) {
      const presentationErr = mapTaskError(err);
      setDeleteError(presentationErr.message);
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  const renderCommentItem = ({ item }: { item: TaskComment }) => {
    const authorInitial = item.author?.fullName ? item.author.fullName.charAt(0).toUpperCase() : '?';
    const canEdit = canEditComment(item);
    const canDelete = canDeleteComment(item);

    return (
      <View
        style={[
          styles.commentCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        testID={`comment-item-${item.id}`}
      >
        <View style={styles.commentHeader}>
          <View
            style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
            accessibilityRole="image"
            accessibilityLabel={`Ảnh đại diện của ${item.author?.fullName || 'người dùng'}`}
          >
            <Text
              style={[
                theme.typography.caption,
                styles.avatarText,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {authorInitial}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text
              style={[
                theme.typography.body,
                styles.authorName,
                { color: theme.colors.textPrimary },
              ]}
              testID={`comment-author-${item.id}`}
            >
              {item.author?.fullName || 'Người dùng'}
            </Text>
            <View style={styles.timeRow}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary },
                ]}
                testID={`comment-time-${item.id}`}
              >
                {formatDateTime(item.createdAt)}
              </Text>
              {item.isEdited ? (
                <Text
                  style={[
                    theme.typography.caption,
                    styles.editedLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                  testID={`comment-edited-label-${item.id}`}
                >
                  {' '}(đã chỉnh sửa)
                </Text>
              ) : null}
            </View>
          </View>

          {/* Action buttons (Edit/Delete) */}
          <View style={styles.commentActions}>
            {canEdit ? (
              <Pressable
                onPress={() => handleOpenEdit(item)}
                style={({ pressed }) => [
                  styles.iconActionButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Chỉnh sửa bình luận"
                testID={`btn-edit-comment-${item.id}`}
              >
                <Text style={[styles.actionIconText, { color: theme.colors.primary }]}>Sửa</Text>
              </Pressable>
            ) : null}

            {canDelete ? (
              <Pressable
                onPress={() => {
                  setDeleteError(null);
                  setCommentToDelete(item);
                }}
                style={({ pressed }) => [
                  styles.iconActionButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Xoá bình luận"
                testID={`btn-delete-comment-${item.id}`}
              >
                <Text style={[styles.actionIconText, { color: theme.colors.error }]}>Xoá</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text
          style={[
            theme.typography.body,
            styles.commentContent,
            { color: theme.colors.textPrimary },
          ]}
          testID={`comment-content-${item.id}`}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
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
          testID="btn-comments-back"
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
            testID="comments-header-title"
          >
            Bình luận
          </Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Non-blocking Refresh Error Banner */}
      {refreshError ? (
        <View
          style={[styles.refreshErrorBanner, { backgroundColor: theme.colors.errorContainer }]}
          testID="comments-refresh-error"
        >
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
            {refreshError}
          </Text>
        </View>
      ) : null}

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer} testID="comments-loading">
          <LoadingIndicator size="large" message="Đang tải bình luận..." />
        </View>
      ) : error ? (
        <View style={styles.centerContainer} testID="comments-error">
          <ErrorState
            title="Không thể tải bình luận"
            message={error.message}
            onRetry={load}
            testID="comments-error-state"
          />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          renderItem={renderCommentItem}
          contentContainerStyle={[
            styles.listContent,
            comments.length === 0 ? styles.emptyContainer : undefined,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreFooter} testID="comments-loading-more">
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyContent} testID="comments-empty">
              <Text
                style={[
                  theme.typography.body,
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Chưa có bình luận nào.
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Input Section */}
      {canAddComment ? (
        <View
          style={[
            styles.bottomInputBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          {addError ? (
            <View style={styles.inlineErrorRow} testID="comment-add-error">
              <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
                {addError}
              </Text>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.textInput,
                theme.typography.body,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder="Viết bình luận..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newCommentText}
              onChangeText={text => {
                setNewCommentText(text);
                if (addError) setAddError(null);
              }}
              multiline
              maxLength={2000}
              accessibilityLabel="Nội dung bình luận"
              testID="input-comment-content"
              editable={!isAdding}
            />

            <Pressable
              onPress={handleAddComment}
              disabled={isAdding || newCommentText.trim().length === 0}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor:
                    newCommentText.trim().length > 0 && !isAdding
                      ? theme.colors.primary
                      : theme.colors.disabled,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Gửi bình luận"
              testID="btn-send-comment"
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text
                  style={[
                    theme.typography.caption,
                    styles.sendButtonText,
                    { color: theme.colors.onPrimary },
                  ]}
                >
                  Gửi
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.disabledNoticeBar,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderTopColor: theme.colors.border,
            },
          ]}
          testID="comments-add-disabled-notice"
        >
          <Text
            style={[
              theme.typography.caption,
              styles.disabledNoticeText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Bạn không có quyền bình luận công việc này.
          </Text>
        </View>
      )}

      {/* Edit Comment Modal */}
      <Modal
        visible={!!editingComment}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isUpdating) {
            setEditingComment(null);
            setEditContentText('');
          }
        }}
        testID="edit-comment-modal"
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.large,
                ...theme.shadows.level4,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.heading2,
                styles.modalTitle,
                { color: theme.colors.textPrimary },
              ]}
              accessibilityRole="header"
            >
              Chỉnh sửa bình luận
            </Text>

            {editError ? (
              <View style={styles.modalErrorBanner} testID="edit-comment-error">
                <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
                  {editError}
                </Text>
              </View>
            ) : null}

            <TextInput
              style={[
                styles.modalTextInput,
                theme.typography.body,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                  borderRadius: theme.radii.medium,
                },
              ]}
              value={editContentText}
              onChangeText={setEditContentText}
              multiline
              maxLength={2000}
              placeholder="Nội dung bình luận..."
              placeholderTextColor={theme.colors.textSecondary}
              testID="input-edit-comment-content"
              editable={!isUpdating}
            />

            <View style={styles.modalActionsRow}>
              <View style={styles.modalActionBtnWrapper}>
                <AppButton
                  title="Hủy"
                  variant="secondary"
                  onPress={() => {
                    setEditingComment(null);
                    setEditContentText('');
                  }}
                  disabled={isUpdating}
                  testID="btn-cancel-edit-comment"
                />
              </View>
              <View style={styles.modalActionBtnWrapper}>
                <AppButton
                  title="Lưu"
                  variant="primary"
                  onPress={handleSaveEdit}
                  loading={isUpdating}
                  disabled={isUpdating || editContentText.trim().length === 0}
                  testID="btn-save-edit-comment"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={!!commentToDelete}
        title="Xoá bình luận"
        message={
          deleteError
            ? `${deleteError}\n\nBạn có muốn thử lại không?`
            : 'Bạn có chắc chắn muốn xoá bình luận này không? Thao tác này không thể hoàn tác.'
        }
        confirmText="Xoá"
        cancelText="Hủy"
        isDanger
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setCommentToDelete(null);
            setDeleteError(null);
          }
        }}
        testID="dialog-delete-comment"
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
    paddingHorizontal: 8,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRightSpacer: {
    width: 48,
  },
  refreshErrorBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
  },
  commentCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editedLabel: {
    fontStyle: 'italic',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentContent: {
    lineHeight: 20,
  },
  loadingMoreFooter: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInputBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disabledNoticeBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disabledNoticeText: {
    textAlign: 'center',
  },
  inlineErrorRow: {
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    minWidth: 64,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sendButtonText: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    marginBottom: 12,
  },
  modalErrorBanner: {
    marginBottom: 10,
  },
  modalTextInput: {
    borderWidth: 1,
    padding: 12,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalActionBtnWrapper: {
    flex: 1,
  },
});
