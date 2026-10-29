/**
 * Phase 14E: Create Milestone Modal (SCR-PRJ-09)
 * Modal form allowing authorized users to create a project milestone.
 *
 * Capabilities:
 * - Milestone name (required, max 200 chars)
 * - Due date (required, YYYY-MM-DD format)
 * - Description (optional, multiline)
 * - Deterministic client-side validation
 * - Calls POST /projects/{projectId}/milestones via projectApi
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
import { projectApi } from '../api/projectApi';
import { CreateMilestoneRequest, MilestoneItem } from '../api/projectTypes';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface CreateMilestoneModalProps {
  visible: boolean;
  projectId: string;
  onSuccess: (milestone: MilestoneItem) => void;
  onClose: () => void;
  testID?: string;
}

export function CreateMilestoneModal({
  visible,
  projectId,
  onSuccess,
  onClose,
  testID = 'create-milestone-modal',
}: CreateMilestoneModalProps) {
  const theme = useAppTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setName('');
      setDescription('');
      setDueDate('');
      setSubmitError(null);
      setFieldErrors({});
    }
  }, [visible]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Tên mốc tiến độ không được để trống';
    } else if (trimmedName.length > 200) {
      errors.name = 'Tên mốc tiến độ tối đa 200 ký tự';
    }

    const trimmedDueDate = dueDate.trim();
    if (!trimmedDueDate) {
      errors.dueDate = 'Hạn chót không được để trống';
    } else if (!DATE_REGEX.test(trimmedDueDate)) {
      errors.dueDate = 'Định dạng ngày phải là YYYY-MM-DD';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const request: CreateMilestoneRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate.trim(),
      };

      const created = await projectApi.createMilestone(projectId, request);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Không thể tạo mốc tiến độ. Vui lòng thử lại.');
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
              Tạo mốc tiến độ mới
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng modal tạo mốc"
              style={styles.closeBtn}
              testID={`${testID}-close-btn`}
            >
              <Text style={[theme.typography.heading3, { color: theme.colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.screenIdHidden}>SCR-PRJ-09</Text>

            {submitError ? (
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
                  {submitError}
                </Text>
              </View>
            ) : null}

            {/* Milestone Name */}
            <AppTextInput
              label="Tên mốc tiến độ *"
              value={name}
              onChangeText={text => {
                setName(text);
                if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="VD: Triển khai thử nghiệm MVP"
              error={fieldErrors.name}
              testID="create-milestone-name-input"
            />

            {/* Due Date */}
            <View style={{ marginTop: theme.spacing.sm }}>
              <AppTextInput
                label="Hạn chót (YYYY-MM-DD) *"
                value={dueDate}
                onChangeText={text => {
                  setDueDate(text);
                  if (fieldErrors.dueDate) setFieldErrors(prev => ({ ...prev, dueDate: '' }));
                }}
                placeholder="VD: 2026-11-30"
                error={fieldErrors.dueDate}
                testID="create-milestone-due-date-input"
              />
            </View>

            {/* Description */}
            <View style={{ marginTop: theme.spacing.sm }}>
              <AppTextInput
                label="Mô tả"
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả mục tiêu cụ thể của mốc..."
                multiline
                numberOfLines={3}
                testID="create-milestone-description-input"
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border, gap: theme.spacing.sm }]}>
            <View style={styles.actionBtn}>
              <AppButton
                title="Hủy"
                onPress={onClose}
                variant="secondary"
                disabled={submitting}
                testID={`${testID}-cancel-btn`}
              />
            </View>
            <View style={styles.actionBtn}>
              <AppButton
                title="Tạo mốc"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                variant="primary"
                testID="btn-confirm-create-milestone"
              />
            </View>
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
  screenIdHidden: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  content: {
    padding: 16,
  },
  errorBanner: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
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
