/**
 * Phase 15F: Create Subtask Modal Component (SCR-TSK-05)
 * Modal enabling creation of a child task under a parent task.
 *
 * Invariants & Correctness Guarantees:
 * - Inherits project automatically from parent task (POST /tasks/{parentTaskId}/subtasks).
 * - Due-date serialized via serializeTaskDueDate adhering to D-064 (UTC+7 end-of-day boundary).
 * - Assignee selection restricted to active project members via ProjectMemberAssigneePickerModal.
 * - Title length: 1 to 255 chars, validated client-side with friendly Vietnamese message.
 * - Synchronous submit lock prevents double submissions.
 * - Accessible touch targets (>= 48dp).
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
import { PriorityBadge } from '../../../shared/components/PriorityBadge';
import { ProjectMember } from '../../projects/api/projectTypes';
import { taskApi } from '../api/taskApi';
import { CreateSubtaskRequest, TaskDetail, TaskPriority } from '../api/taskTypes';
import { mapTaskError } from '../errors/taskErrorMapper';
import {
  serializeTaskDueDate,
  validateTaskDateInput,
  validateTaskDateRange,
} from '../utils/taskDate';
import { ProjectMemberAssigneePickerModal } from './ProjectMemberAssigneePickerModal';

export interface CreateSubtaskModalProps {
  visible: boolean;
  parentTaskId: string;
  projectId: string;
  onCreated: (created: TaskDetail) => void;
  onClose: () => void;
  testID?: string;
}

const PRIORITIES: { priority: TaskPriority; label: string }[] = [
  { priority: 'CRITICAL', label: 'Khẩn cấp' },
  { priority: 'HIGH', label: 'Cao' },
  { priority: 'MEDIUM', label: 'Trung bình' },
  { priority: 'LOW', label: 'Thấp' },
];

export function CreateSubtaskModal({
  visible,
  parentTaskId,
  projectId,
  onCreated,
  onClose,
  testID = 'create-subtask-modal',
}: CreateSubtaskModalProps) {
  const theme = useAppTheme();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [selectedAssigneeNames, setSelectedAssigneeNames] = useState<string[]>([]);

  // Sub-modal state
  const [assigneeModalVisible, setAssigneeModalVisible] = useState(false);

  // Errors & submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submittingRef = useRef(false);

  // Reset form on open
  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setStartDate('');
      setDueDate('');
      setEstimatedMinutes('');
      setSelectedAssigneeIds([]);
      setSelectedAssigneeNames([]);
      setErrors({});
      setFormError(null);
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [visible]);

  const handleAssigneeConfirm = (userIds: string[], members: ProjectMember[]) => {
    setSelectedAssigneeIds(userIds);
    setSelectedAssigneeNames(members.map(m => m.fullName));
    setAssigneeModalVisible(false);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errs.title = 'Tiêu đề công việc không được để trống';
    } else if (trimmedTitle.length > 255) {
      errs.title = 'Tiêu đề không được vượt quá 255 ký tự';
    }

    if (description.trim().length > 2000) {
      errs.description = 'Mô tả không được vượt quá 2000 ký tự';
    }

    if (startDate.trim().length > 0) {
      const startErr = validateTaskDateInput(startDate, 'Ngày bắt đầu');
      if (startErr) errs.startDate = startErr;
    }

    if (dueDate.trim().length > 0) {
      const dueErr = validateTaskDateInput(dueDate, 'Hạn hoàn thành');
      if (dueErr) errs.dueDate = dueErr;
    }

    if (!errs.startDate && !errs.dueDate && startDate.trim() && dueDate.trim()) {
      const rangeErr = validateTaskDateRange(startDate, dueDate);
      if (rangeErr) errs.dueDate = rangeErr;
    }

    if (estimatedMinutes.trim().length > 0) {
      const mins = parseInt(estimatedMinutes.trim(), 10);
      if (isNaN(mins) || mins < 0) {
        errs.estimatedMinutes = 'Thời gian ước tính phải là số nguyên không âm';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (submittingRef.current || submitting) {
      return;
    }

    if (!validate()) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);

    const payload: CreateSubtaskRequest = {
      title: title.trim(),
      priority,
    };

    if (description.trim().length > 0) {
      payload.description = description.trim();
    }

    if (startDate.trim().length > 0) {
      payload.startDate = startDate.trim();
    }

    if (dueDate.trim().length > 0) {
      payload.dueDate = serializeTaskDueDate(dueDate);
    }

    if (estimatedMinutes.trim().length > 0) {
      payload.estimatedMinutes = parseInt(estimatedMinutes.trim(), 10);
    }

    if (selectedAssigneeIds.length > 0) {
      payload.assigneeIds = selectedAssigneeIds;
    }

    try {
      const created = await taskApi.createSubtask(parentTaskId, payload);
      onCreated(created);
    } catch (err: unknown) {
      const mapped = mapTaskError(err);
      setFormError(mapped.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
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
            styles.container,
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
              Thêm công việc con
            </Text>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              testID="btn-close-create-subtask"
              accessibilityRole="button"
              accessibilityLabel="Đóng modal thêm công việc con"
            >
              <Text style={[styles.closeIcon, { color: theme.colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          {/* Form Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {formError ? (
              <View
                style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}
                testID="create-subtask-form-error"
              >
                <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
                  {formError}
                </Text>
              </View>
            ) : null}

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}>
                Tiêu đề công việc con <Text style={{ color: theme.colors.error }}>*</Text>
              </Text>
              <TextInput
                value={title}
                onChangeText={t => {
                  setTitle(t);
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}
                placeholder="Nhập tiêu đề công việc con"
                placeholderTextColor={theme.colors.textSecondary}
                editable={!submitting}
                style={[
                  styles.input,
                  {
                    borderColor: errors.title ? theme.colors.error : theme.colors.border,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                testID="input-subtask-title"
                accessibilityLabel="Tiêu đề công việc con"
              />
              {errors.title ? (
                <Text
                  style={[theme.typography.caption, styles.errorText, { color: theme.colors.error }]}
                  testID="error-subtask-title"
                >
                  {errors.title}
                </Text>
              ) : null}
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}>
                Mô tả chi tiết
              </Text>
              <TextInput
                value={description}
                onChangeText={d => {
                  setDescription(d);
                  if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                }}
                placeholder="Nhập mô tả cho công việc con (tùy chọn)"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
                editable={!submitting}
                style={[
                  styles.textArea,
                  {
                    borderColor: errors.description ? theme.colors.error : theme.colors.border,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                testID="input-subtask-description"
                accessibilityLabel="Mô tả công việc con"
              />
              {errors.description ? (
                <Text
                  style={[theme.typography.caption, styles.errorText, { color: theme.colors.error }]}
                  testID="error-subtask-description"
                >
                  {errors.description}
                </Text>
              ) : null}
            </View>

            {/* Priority */}
            <View style={styles.fieldGroup}>
              <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}>
                Độ ưu tiên
              </Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map(p => {
                  const isSelected = priority === p.priority;
                  return (
                    <Pressable
                      key={p.priority}
                      onPress={() => setPriority(p.priority)}
                      disabled={submitting}
                      style={({ pressed }) => [
                        styles.priorityChip,
                        {
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected
                            ? theme.colors.surfaceVariant
                            : pressed
                            ? theme.colors.surfaceVariant
                            : theme.colors.background,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Độ ưu tiên ${p.label}`}
                      accessibilityState={{ checked: isSelected }}
                      testID={`chip-subtask-priority-${p.priority.toLowerCase()}`}
                    >
                      <PriorityBadge priority={p.priority} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Assignee Picker */}
            <View style={styles.fieldGroup}>
              <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}>
                Người thực hiện
              </Text>
              <Pressable
                onPress={() => setAssigneeModalVisible(true)}
                disabled={submitting || !projectId}
                style={({ pressed }) => [
                  styles.assigneeButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.background,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Chọn người thực hiện"
                testID="btn-open-subtask-assignee-picker"
              >
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color:
                        selectedAssigneeIds.length > 0
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                    },
                  ]}
                  testID="subtask-selected-assignees-text"
                >
                  {selectedAssigneeIds.length === 0
                    ? 'Chưa chọn người thực hiện'
                    : selectedAssigneeIds.length === 1
                    ? selectedAssigneeNames[0] ?? '1 người đã chọn'
                    : `${selectedAssigneeNames[0] ?? 'Người thực hiện'} (+${selectedAssigneeIds.length - 1})`}
                </Text>
                <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>›</Text>
              </Pressable>
            </View>

            {/* Dates: Start Date & Due Date */}
            <View style={styles.dateRow}>
              <View style={[styles.fieldGroup, styles.fieldHalfLeft]}>
                <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}>
                  Ngày bắt đầu
                </Text>
                <TextInput
                  value={startDate}
                  onChangeText={s => {
                    setStartDate(s);
                    if (errors.startDate) setErrors(prev => ({ ...prev, startDate: '' }));
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textSecondary}
                  editable={!submitting}
                  style={[
                    styles.input,
                    {
                      borderColor: errors.startDate ? theme.colors.error : theme.colors.border,
                      color: theme.colors.textPrimary,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  testID="input-subtask-start-date"
                  accessibilityLabel="Ngày bắt đầu công việc con (định dạng YYYY-MM-DD)"
                />
                {errors.startDate ? (
                  <Text style={[theme.typography.caption, styles.errorText, { color: theme.colors.error }]}>
                    {errors.startDate}
                  </Text>
                ) : null}
              </View>

              <View style={[styles.fieldGroup, styles.fieldHalfRight]}>
                <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}>
                  Hạn hoàn thành
                </Text>
                <TextInput
                  value={dueDate}
                  onChangeText={d => {
                    setDueDate(d);
                    if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: '' }));
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textSecondary}
                  editable={!submitting}
                  style={[
                    styles.input,
                    {
                      borderColor: errors.dueDate ? theme.colors.error : theme.colors.border,
                      color: theme.colors.textPrimary,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  testID="input-subtask-due-date"
                  accessibilityLabel="Hạn hoàn thành công việc con (định dạng YYYY-MM-DD)"
                />
                {errors.dueDate ? (
                  <Text style={[theme.typography.caption, styles.errorText, { color: theme.colors.error }]}>
                    {errors.dueDate}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Estimated Minutes */}
            <View style={styles.fieldGroup}>
              <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}>
                Thời gian ước tính (phút)
              </Text>
              <TextInput
                value={estimatedMinutes}
                onChangeText={m => {
                  setEstimatedMinutes(m);
                  if (errors.estimatedMinutes) setErrors(prev => ({ ...prev, estimatedMinutes: '' }));
                }}
                placeholder="Ví dụ: 120"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={!submitting}
                style={[
                  styles.input,
                  {
                    borderColor: errors.estimatedMinutes ? theme.colors.error : theme.colors.border,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                testID="input-subtask-estimated-minutes"
                accessibilityLabel="Thời gian ước tính tính theo phút"
              />
              {errors.estimatedMinutes ? (
                <Text style={[theme.typography.caption, styles.errorText, { color: theme.colors.error }]}>
                  {errors.estimatedMinutes}
                </Text>
              ) : null}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footerRow, { borderTopColor: theme.colors.border }]}>
            <AppButton
              title="Hủy"
              variant="outline"
              onPress={onClose}
              disabled={submitting}
              style={styles.actionButton}
              testID="btn-cancel-create-subtask"
            />
            <View style={styles.spacerWidth12} />
            <AppButton
              title="Tạo việc con"
              variant="primary"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.actionButton}
              testID="btn-submit-create-subtask"
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sub-picker: Assignees */}
      <ProjectMemberAssigneePickerModal
        visible={assigneeModalVisible}
        projectId={projectId}
        selectedUserIds={selectedAssigneeIds}
        onConfirm={handleAssigneeConfirm}
        onClose={() => setAssigneeModalVisible(false)}
        title="Chọn người thực hiện việc con"
        testID="subtask-assignee-picker-modal"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
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
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 20,
  },
  bodyContent: {
    paddingBottom: 24,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '400',
  },
  dateRow: {
    flexDirection: 'row',
  },
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
  },
  fieldHalfLeft: {
    flex: 1,
    marginRight: 8,
  },
  fieldHalfRight: {
    flex: 1,
    marginLeft: 8,
  },
  spacerWidth12: {
    width: 12,
  },
});
