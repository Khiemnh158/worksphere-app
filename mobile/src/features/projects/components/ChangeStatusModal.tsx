/**
 * Phase 14E: Change Project Status Modal (SCR-PRJ-05)
 * Modal providing safeguarded project status transitions with optimistic concurrency control.
 *
 * Capabilities:
 * - Domain-restricted status transitions via projectStatusTransitions
 * - Informative message when project is in a terminal status
 * - Radio selection for allowed target statuses
 * - Optional reason input
 * - Passes authoritative `version` for optimistic lock verification
 * - Handles 409 conflict with reload callback
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { AppButton } from '../../../shared/components/AppButton';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { projectApi } from '../api/projectApi';
import { ChangeProjectStatusRequest, ProjectDetail, ProjectStatus } from '../api/projectTypes';
import {
  canTransitionStatus,
  getAllowedTargetStatuses,
  getStatusLabel,
  isTerminalStatus,
} from '../domain/projectStatusTransitions';

export interface ChangeStatusModalProps {
  visible: boolean;
  projectId: string;
  currentStatus: ProjectStatus;
  version: number;
  onSuccess: (updated: ProjectDetail) => void;
  onClose: () => void;
  onConflictReload?: () => void;
  testID?: string;
}

export function ChangeStatusModal({
  visible,
  projectId,
  currentStatus,
  version,
  onSuccess,
  onClose,
  onConflictReload,
  testID = 'change-status-modal',
}: ChangeStatusModalProps) {
  const theme = useAppTheme();

  const [selectedTarget, setSelectedTarget] = useState<ProjectStatus | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);

  const allowedTargets = getAllowedTargetStatuses(currentStatus);
  const isTerminal = isTerminalStatus(currentStatus);

  useEffect(() => {
    if (visible) {
      setSelectedTarget(null);
      setReason('');
      setError(null);
      setIsConflict(false);
    }
  }, [visible, currentStatus]);

  const handleSubmit = async () => {
    setError(null);
    setIsConflict(false);

    if (!selectedTarget) {
      setError('Vui lòng chọn trạng thái mới');
      return;
    }

    if (!canTransitionStatus(currentStatus, selectedTarget)) {
      setError(`Không thể chuyển trạng thái từ ${getStatusLabel(currentStatus)} sang ${getStatusLabel(selectedTarget)}`);
      return;
    }

    setSubmitting(true);
    try {
      const request: ChangeProjectStatusRequest = {
        status: selectedTarget,
        reason: reason.trim() || undefined,
        version,
      };

      const updated = await projectApi.changeProjectStatus(projectId, request);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const is409 =
        err?.status === 409 ||
        err?.code === 'OPTIMISTIC_LOCK_CONFLICT' ||
        err?.message?.includes('409') ||
        err?.message?.includes('xung đột') ||
        err?.message?.includes('phiên bản');

      if (is409) {
        setIsConflict(true);
        setError('Trạng thái dự án đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu.');
      } else {
        setError(err?.message ?? 'Không thể thay đổi trạng thái dự án');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.scrim}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.large,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
              Đổi trạng thái dự án
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng modal đổi trạng thái"
              style={styles.closeBtn}
              testID={`${testID}-close-btn`}
            >
              <Text style={[theme.typography.heading3, { color: theme.colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Current Status Display */}
            <View style={styles.currentRow}>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Trạng thái hiện tại:
              </Text>
              <View style={{ marginLeft: 8 }}>
                <StatusBadge status={currentStatus} testID={`${testID}-current-status`} />
              </View>
            </View>

            {/* Error / Conflict Banner */}
            {error ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: theme.colors.errorContainer,
                    borderColor: theme.colors.error,
                    borderRadius: theme.radii.small,
                  },
                ]}
                accessibilityRole="alert"
                testID={`${testID}-error-banner`}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.error, fontWeight: '600' }]}>
                  {error}
                </Text>
                {isConflict && onConflictReload ? (
                  <View style={{ marginTop: 8 }}>
                    <AppButton
                      title="Tải lại dữ liệu"
                      onPress={() => {
                        onClose();
                        onConflictReload();
                      }}
                      variant="outline"
                      testID={`${testID}-reload-btn`}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Terminal Status Explanation */}
            {isTerminal ? (
              <View
                style={[
                  styles.terminalBanner,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: theme.radii.small,
                    borderColor: theme.colors.border,
                  },
                ]}
                testID={`${testID}-terminal-notice`}
              >
                <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                  Dự án đã ở trạng thái kết thúc ({getStatusLabel(currentStatus)}), không thể chuyển sang trạng thái khác.
                </Text>
              </View>
            ) : (
              <>
                {/* Target Status Radios */}
                <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                  Chọn trạng thái mới:
                </Text>
                <View style={styles.targetList} testID={`${testID}-targets-group`}>
                  {allowedTargets.map(target => {
                    const isSelected = selectedTarget === target;
                    return (
                      <Pressable
                        key={target}
                        onPress={() => setSelectedTarget(target)}
                        style={({ pressed }) => [
                          styles.targetItem,
                          {
                            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                            backgroundColor: isSelected
                              ? theme.colors.surfaceVariant
                              : pressed
                              ? theme.colors.surfaceVariant
                              : theme.colors.surface,
                            borderRadius: theme.radii.medium,
                          },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Trạng thái ${getStatusLabel(target)}`}
                        testID={`${testID}-target-${target.toLowerCase()}`}
                      >
                        <View style={styles.targetItemLeft}>
                          <View
                            style={[
                              styles.radioCircle,
                              {
                                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                              },
                            ]}
                          >
                            {isSelected ? <View style={styles.radioInner} /> : null}
                          </View>
                          <Text
                            style={[
                              theme.typography.body,
                              {
                                color: theme.colors.textPrimary,
                                fontWeight: isSelected ? '700' : '400',
                                marginLeft: 10,
                              },
                            ]}
                          >
                            {getStatusLabel(target)}
                          </Text>
                        </View>
                        <StatusBadge status={target} />
                      </Pressable>
                    );
                  })}
                </View>

                {/* Reason Input */}
                <View style={{ marginTop: theme.spacing.md }}>
                  <AppTextInput
                    label="Lý do thay đổi (Không bắt buộc)"
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Nhập lý do chuyển trạng thái..."
                    multiline
                    numberOfLines={3}
                    testID={`${testID}-reason-input`}
                  />
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border, gap: theme.spacing.sm }]}>
            <View style={styles.actionBtn}>
              <AppButton
                title={isTerminal ? 'Đóng' : 'Hủy'}
                onPress={onClose}
                variant="secondary"
                disabled={submitting}
                testID={`${testID}-cancel-btn`}
              />
            </View>
            {!isTerminal ? (
              <View style={styles.actionBtn}>
                <AppButton
                  title="Cập nhật"
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={submitting || !selectedTarget}
                  variant="primary"
                  testID={`${testID}-confirm-btn`}
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorBanner: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  terminalBanner: {
    padding: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  targetList: {
    gap: 8,
  },
  targetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  targetItemLeft: {
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
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flex: 1,
  },
});
