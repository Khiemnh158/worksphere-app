/**
 * Phase 15D: Edit Task Screen (SCR-TSK-04)
 * Implements canonical task editing form conforming strictly to 06_API_CONTRACT.md section 12.4.
 *
 * Invariants & Correctness Guarantees:
 * - Authoritative task load on mount via taskApi.getTaskDetail(taskId).
 * - Exact UpdateTaskRequest DTO fields: title, description, priority, startDate, dueDate, estimatedMinutes, version.
 * - Due date serialization: Converts changed date-only input (YYYY-MM-DD) to ISO-8601 Instant Vietnam UTC+7 boundary (T17:00:00Z per Decision D-064) and strictly preserves exact server Instant when date is unchanged.
 * - Captures version internally; NEVER displays version in user-facing UI.
 * - Strictly zero status, progress, assignees, or projectId in generic Edit form (15E boundary).
 * - Synchronous submit lock (submittingRef) prevents duplicate same-tick submissions.
 * - Optimistic locking: on HTTP 409 conflict (isConflict: true), displays conflict prompt with
 *   "Tải lại dữ liệu" action to reload latest authoritative server data and version.
 * - On success, calls navigation.goBack() to return to TaskDetail.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { MainTabNavProp, MainTabScreenRouteProp } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { ConfirmationDialog } from '../../../shared/components/ConfirmationDialog';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingIndicator } from '../../../shared/components/LoadingIndicator';
import { PriorityBadge } from '../../../shared/components/PriorityBadge';
import { taskApi } from '../api/taskApi';
import { TaskDetail, TaskPriority, UpdateTaskRequest } from '../api/taskTypes';
import { mapTaskError } from '../errors/taskErrorMapper';
import {
  parseTaskDueDateForInput,
  serializeTaskDueDate,
  validateTaskDateInput,
  validateTaskDateRange,
} from '../utils/taskDate';

const PRIORITIES: { priority: TaskPriority; label: string }[] = [
  { priority: 'CRITICAL', label: 'Khẩn cấp' },
  { priority: 'HIGH', label: 'Cao' },
  { priority: 'MEDIUM', label: 'Trung bình' },
  { priority: 'LOW', label: 'Thấp' },
];

export function EditTaskScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'EditTask'>>();
  const route = useRoute<MainTabScreenRouteProp<'EditTask'>>();

  const taskId = route.params?.taskId;

  // Form State
  const [projectName, setProjectName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [originalDueDateInstant, setOriginalDueDateInstant] = useState<string | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('');
  const [version, setVersion] = useState<number>(0);

  // Screen Lifecycle State
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [conflictVisible, setConflictVisible] = useState<boolean>(false);

  // Synchronous correctness lock
  const submittingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  const populateForm = (data: TaskDetail) => {
    setTitle(data.title);
    setDescription(data.description ?? '');
    setPriority(data.priority);
    setStartDate(data.startDate ?? '');
    setDueDate(parseTaskDueDateForInput(data.dueDate));
    setOriginalDueDateInstant(data.dueDate ?? null);
    setEstimatedMinutes(
      data.estimatedMinutes !== null && data.estimatedMinutes !== undefined
        ? String(data.estimatedMinutes)
        : ''
    );
    setProjectName(data.project?.name ?? '');
    setVersion(data.version);
  };

  const loadTask = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(null);
    try {
      const data = await taskApi.getTaskDetail(taskId);
      if (mountedRef.current) {
        populateForm(data);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const mapped = mapTaskError(err);
        setLoadError(mapped.message);
      }
    } finally {
      if (mountedRef.current) {
        setInitialLoading(false);
      }
    }
  }, [taskId]);

  useEffect(() => {
    mountedRef.current = true;
    loadTask();

    return () => {
      mountedRef.current = false;
    };
  }, [loadTask]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Tiêu đề công việc không được để trống';
    } else if (title.trim().length > 255) {
      errors.title = 'Tiêu đề không được vượt quá 255 ký tự';
    }

    if (startDate.trim().length > 0) {
      const startErr = validateTaskDateInput(startDate, 'Ngày bắt đầu');
      if (startErr) {
        errors.startDate = startErr;
      }
    }

    if (dueDate.trim().length > 0) {
      const dueErr = validateTaskDateInput(dueDate, 'Hạn hoàn thành');
      if (dueErr) {
        errors.dueDate = dueErr;
      }
    }

    if (!errors.startDate && !errors.dueDate && startDate.trim() && dueDate.trim()) {
      const rangeErr = validateTaskDateRange(startDate, dueDate);
      if (rangeErr) {
        errors.dueDate = rangeErr;
      }
    }

    if (estimatedMinutes.trim().length > 0) {
      const minutes = parseInt(estimatedMinutes.trim(), 10);
      if (isNaN(minutes) || minutes < 0) {
        errors.estimatedMinutes = 'Thời gian ước tính phải là số nguyên không âm';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (submittingRef.current) {
      return;
    }

    if (!validate()) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    const payload: UpdateTaskRequest = {
      title: title.trim(),
      priority,
      version,
    };

    if (description.trim().length > 0) {
      payload.description = description.trim();
    } else {
      payload.description = '';
    }

    if (startDate.trim().length > 0) {
      payload.startDate = startDate.trim();
    }

    const currentDueDateInput = dueDate.trim();
    const originalDueDateInput = parseTaskDueDateForInput(originalDueDateInstant);

    if (currentDueDateInput.length > 0) {
      if (currentDueDateInput === originalDueDateInput && originalDueDateInstant) {
        // Decision D-064: PRESERVE_EXACT_SERVER_INSTANT_WHEN_DATE_UNCHANGED
        payload.dueDate = originalDueDateInstant;
      } else {
        // Decision D-064: serialize new date to Vietnam UTC+7 boundary (YYYY-MM-DDT17:00:00Z)
        payload.dueDate = serializeTaskDueDate(currentDueDateInput);
      }
    }

    if (estimatedMinutes.trim().length > 0) {
      payload.estimatedMinutes = parseInt(estimatedMinutes.trim(), 10);
    }

    try {
      await taskApi.updateTask(taskId, payload);
      if (mountedRef.current) {
        navigation.goBack();
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const mapped = mapTaskError(err);
        if (mapped.isConflict) {
          setConflictVisible(true);
        } else {
          setSubmitError(mapped.message);
        }
      }
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  const handleReloadLatest = async () => {
    setConflictVisible(false);
    await loadTask();
  };

  if (initialLoading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}
        testID="edit-task-loading"
      >
        <LoadingIndicator size="large" message="Đang tải dữ liệu công việc..." />
      </View>
    );
  }

  if (loadError) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}
        testID="edit-task-load-error"
      >
        <ErrorState
          title="Không thể tải công việc"
          message={loadError}
          onRetry={loadTask}
          testID="edit-task-error-state"
        />
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backNavRow,
            { opacity: pressed ? 0.7 : 1, marginTop: theme.spacing.md },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          testID="btn-edit-task-error-back"
        >
          <Text style={[theme.typography.body, styles.backNavText, { color: theme.colors.primary }]}>
            ← Quay lại
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-edit-task"
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Navigation Button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backNavRow,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          testID="btn-edit-task-back"
        >
          <Text style={[theme.typography.body, styles.backNavText, { color: theme.colors.primary }]}>
            ← Quay lại
          </Text>
        </Pressable>

        <Text
          style={[
            theme.typography.heading1,
            styles.screenTitle,
            { color: theme.colors.textPrimary },
          ]}
        >
          Chỉnh sửa công việc
        </Text>

        {projectName ? (
          <Text
            style={[
              theme.typography.caption,
              styles.projectContextText,
              { color: theme.colors.textSecondary },
            ]}
            testID="edit-task-project-name"
          >
            Dự án: {projectName}
          </Text>
        ) : null}

        {/* Submit Error Banner */}
        {submitError ? (
          <View
            style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}
            testID="edit-task-error-banner"
          >
            <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
              {submitError}
            </Text>
          </View>
        ) : null}

        {/* 1. Task Title */}
        <View style={styles.fieldSection}>
          <AppTextInput
            label="Tiêu đề công việc *"
            value={title}
            onChangeText={t => {
              setTitle(t);
              if (fieldErrors.title) {
                setFieldErrors(prev => ({ ...prev, title: '' }));
              }
            }}
            placeholder="Nhập tiêu đề công việc..."
            error={fieldErrors.title}
            maxLength={255}
            testID="input-edit-task-title"
          />
        </View>

        {/* 2. Priority Selection */}
        <View style={styles.fieldSection}>
          <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            Mức độ ưu tiên <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => {
              const isSelected = priority === p.priority;
              return (
                <Pressable
                  key={p.priority}
                  onPress={() => setPriority(p.priority)}
                  style={({ pressed }) => [
                    styles.priorityChip,
                    {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected
                        ? theme.colors.primaryContainer
                        : theme.colors.surface,
                      borderRadius: theme.radii.small,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={p.label}
                  testID={`chip-priority-${p.priority.toLowerCase()}`}
                >
                  <PriorityBadge priority={p.priority} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. Description */}
        <View style={styles.fieldSection}>
          <AppTextInput
            label="Mô tả công việc"
            value={description}
            onChangeText={setDescription}
            placeholder="Nhập mô tả chi tiết công việc..."
            multiline
            numberOfLines={4}
            testID="input-edit-task-description"
          />
        </View>

        {/* 4. Dates: Start Date & Due Date */}
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <AppTextInput
              label="Ngày bắt đầu (YYYY-MM-DD)"
              value={startDate}
              onChangeText={d => {
                setStartDate(d);
                if (fieldErrors.startDate) {
                  setFieldErrors(prev => ({ ...prev, startDate: '' }));
                }
              }}
              placeholder="2026-10-01"
              error={fieldErrors.startDate}
              testID="input-edit-task-start-date"
            />
          </View>
          <View style={styles.dateColSpacer} />
          <View style={styles.dateCol}>
            <AppTextInput
              label="Hạn hoàn thành (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={d => {
                setDueDate(d);
                if (fieldErrors.dueDate) {
                  setFieldErrors(prev => ({ ...prev, dueDate: '' }));
                }
              }}
              placeholder="2026-10-31"
              error={fieldErrors.dueDate}
              testID="input-edit-task-due-date"
            />
          </View>
        </View>

        {/* 5. Estimated Minutes */}
        <View style={styles.fieldSection}>
          <AppTextInput
            label="Thời gian ước tính (phút)"
            value={estimatedMinutes}
            onChangeText={m => {
              setEstimatedMinutes(m);
              if (fieldErrors.estimatedMinutes) {
                setFieldErrors(prev => ({ ...prev, estimatedMinutes: '' }));
              }
            }}
            placeholder="Ví dụ: 120"
            keyboardType="numeric"
            error={fieldErrors.estimatedMinutes}
            testID="input-edit-task-estimated-minutes"
          />
        </View>

        {/* Submit Actions */}
        <View style={styles.submitSection}>
          <AppButton
            title="Lưu thay đổi"
            variant="primary"
            onPress={handleSubmit}
            loading={submitting}
            testID="btn-submit-edit-task"
          />
        </View>
      </ScrollView>

      {/* Optimistic Lock Conflict Confirmation Dialog */}
      <ConfirmationDialog
        visible={conflictVisible}
        title="Xung đột dữ liệu"
        message="Dữ liệu công việc đã được thay đổi bởi người dùng khác trong khi bạn đang chỉnh sửa. Bạn có muốn tải lại dữ liệu mới nhất không?"
        confirmText="Tải lại dữ liệu"
        cancelText="Hủy bỏ"
        onConfirm={handleReloadLatest}
        onCancel={() => setConflictVisible(false)}
        testID="dialog-conflict-reload"
      />
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  backNavRow: {
    paddingVertical: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  backNavText: {
    fontWeight: '600',
  },
  screenTitle: {
    marginBottom: 16,
    fontWeight: '700',
  },
  projectContextText: {
    marginBottom: 16,
    fontStyle: 'italic',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 6,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateCol: {
    flex: 1,
  },
  dateColSpacer: {
    width: 12,
  },
  submitSection: {
    marginTop: 24,
    marginBottom: 16,
  },
});
