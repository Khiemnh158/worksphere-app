/**
 * Phase 15E: Change Status Modal (SCR-TSK-07)
 * Modal enabling task status transition according to domain state machine.
 *
 * Invariants & Correctness Guarantees:
 * - Domain state machine: Only displays valid transitions from getValidTaskStatusTransitions(currentStatus).
 * - Terminal handling: If current status is terminal, displays friendly message and prevents mutation.
 * - Rejection reason: Requires non-empty comment when transitioning IN_REVIEW -> IN_PROGRESS per TaskApplicationService.
 * - Synchronous submit lock prevents double submissions.
 * - Zero raw version exposure in UI.
 * - Accessibility: touch targets >= 48dp, radio role for status selection.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { AppButton } from '../../../shared/components/AppButton';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { TaskStatus } from '../api/taskTypes';
import {
  getTaskStatusLabel,
  getValidTaskStatusTransitions,
  isCommentRequiredForTransition,
  isTaskTerminalStatus,
} from '../domain/taskStatusTransitions';

export interface ChangeStatusModalProps {
  visible: boolean;
  currentStatus: TaskStatus;
  onConfirm: (targetStatus: TaskStatus, comment?: string) => Promise<void> | void;
  onClose: () => void;
  submitting?: boolean;
  testID?: string;
}

export function ChangeStatusModal({
  visible,
  currentStatus,
  onConfirm,
  onClose,
  submitting = false,
  testID = 'change-status-modal',
}: ChangeStatusModalProps) {
  const theme = useAppTheme();
  const validTransitions = getValidTaskStatusTransitions(currentStatus);
  const isTerminal = isTaskTerminalStatus(currentStatus);

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [comment, setComment] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (visible) {
      const transitions = getValidTaskStatusTransitions(currentStatus);
      setSelectedStatus(transitions.length > 0 ? transitions[0] : null);
      setComment('');
      setErrorMessage(null);
      submittingRef.current = false;
    }
  }, [visible, currentStatus]);

  const handleSubmit = async () => {
    if (submittingRef.current || submitting) {
      return;
    }

    if (!selectedStatus) {
      setErrorMessage('Vui lòng chọn trạng thái mới.');
      return;
    }

    if (isCommentRequiredForTransition(currentStatus, selectedStatus) && !comment.trim()) {
      setErrorMessage('Vui lòng nhập lý do khi chuyển về Đang làm.');
      return;
    }

    submittingRef.current = true;
    setErrorMessage(null);

    try {
      await onConfirm(selectedStatus, comment.trim() || undefined);
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text
              style={[
                theme.typography.heading3,
                styles.headerTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Chuyển trạng thái công việc
            </Text>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              testID="btn-close-status-modal"
              accessibilityRole="button"
              accessibilityLabel="Đóng modal"
            >
              <Text style={[styles.closeIcon, { color: theme.colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Current Status Info */}
            <View style={styles.currentStatusRow}>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Trạng thái hiện tại:
              </Text>
              <View style={styles.statusBadgeWrapper}>
                <StatusBadge type="task" status={currentStatus} />
              </View>
            </View>

            {/* Terminal State Warning */}
            {isTerminal || validTransitions.length === 0 ? (
              <View
                style={[
                  styles.terminalBanner,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                testID="status-terminal-notice"
              >
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Công việc đã ở trạng thái kết thúc ({getTaskStatusLabel(currentStatus)}), không thể chuyển trạng thái.
                </Text>
              </View>
            ) : (
              <>
                {/* Target Status Selection */}
                <Text
                  style={[
                    theme.typography.caption,
                    styles.sectionLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Chọn trạng thái tiếp theo:
                </Text>

                <View style={styles.statusOptionsList}>
                  {validTransitions.map(status => {
                    const isSelected = selectedStatus === status;
                    return (
                      <Pressable
                        key={status}
                        onPress={() => setSelectedStatus(status)}
                        disabled={submitting}
                        style={({ pressed }) => [
                          styles.statusOptionRow,
                          {
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.border,
                            backgroundColor: isSelected
                              ? theme.colors.surfaceVariant
                              : pressed
                              ? theme.colors.background
                              : 'transparent',
                          },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={getTaskStatusLabel(status)}
                        testID={`status-option-${status}`}
                      >
                        <View style={styles.optionLabelGroup}>
                          <View
                            style={[
                              styles.radioCircle,
                              {
                                borderColor: isSelected
                                  ? theme.colors.primary
                                  : theme.colors.textSecondary,
                              },
                            ]}
                          >
                            {isSelected ? (
                              <View
                                style={[
                                  styles.radioDot,
                                  { backgroundColor: theme.colors.primary },
                                ]}
                              />
                            ) : null}
                          </View>
                          <Text
                            style={[
                              theme.typography.body,
                              styles.optionText,
                              isSelected ? styles.fontBold : styles.fontRegular,
                              {
                                color: isSelected
                                  ? theme.colors.primary
                                  : theme.colors.textPrimary,
                              },
                            ]}
                          >
                            {getTaskStatusLabel(status)}
                          </Text>
                        </View>
                        <StatusBadge type="task" status={status} />
                      </Pressable>
                    );
                  })}
                </View>

                {/* Comment / Reason Input */}
                <View style={styles.commentContainer}>
                  <Text
                    style={[
                      theme.typography.caption,
                      styles.sectionLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Ghi chú / Lý do
                    {selectedStatus &&
                    isCommentRequiredForTransition(currentStatus, selectedStatus) ? (
                      <Text style={[styles.requiredStar, { color: theme.colors.error }]}> * (Bắt buộc)</Text>
                    ) : (
                      ' (Không bắt buộc)'
                    )}
                  </Text>
                  <TextInput
                    value={comment}
                    onChangeText={text => {
                      setComment(text);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={
                      selectedStatus &&
                      isCommentRequiredForTransition(currentStatus, selectedStatus)
                        ? 'Nhập lý do từ chối kiểm tra...'
                        : 'Nhập ghi chú thay đổi trạng thái...'
                    }
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    maxLength={1000}
                    editable={!submitting}
                    style={[
                      styles.commentInput,
                      {
                        borderColor: theme.colors.border,
                        color: theme.colors.textPrimary,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                    testID="input-status-comment"
                  />
                </View>
              </>
            )}

            {/* Error Message */}
            {errorMessage ? (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: theme.colors.errorContainer },
                ]}
                testID="change-status-error"
              >
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.error },
                  ]}
                >
                  {errorMessage}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <AppButton
              title="Hủy"
              onPress={onClose}
              variant="outline"
              disabled={submitting}
              testID="btn-cancel-status"
              style={styles.footerButton}
            />
            {validTransitions.length > 0 && !isTerminal ? (
              <AppButton
                title={submitting ? 'Đang cập nhật...' : 'Cập nhật'}
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting || !selectedStatus}
                testID="btn-confirm-status"
                style={styles.footerButton}
              />
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    marginTop: 8,
  },
  bodyContent: {
    paddingBottom: 8,
  },
  currentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadgeWrapper: {
    marginLeft: 8,
  },
  terminalBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 13,
  },
  statusOptionsList: {
    marginBottom: 16,
  },
  statusOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  optionLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 15,
  },
  fontBold: {
    fontWeight: '700',
  },
  fontRegular: {
    fontWeight: '400',
  },
  requiredStar: {
    fontWeight: '600',
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  errorBanner: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  footerButton: {
    minWidth: 100,
  },
});
