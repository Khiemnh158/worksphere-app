/**
 * Phase 15D: Create Task Screen (SCR-TSK-03)
 * Implements canonical task creation form conforming strictly to 06_API_CONTRACT.md section 12.2.
 *
 * Invariants & Correctness Guarantees:
 * - Direct-route capability gating: Enforces currentUser.permissions.includes('TASK_CREATE').
 * - Project selection via ProjectSelectModal (human-readable [code] name; strictly zero raw UUIDs).
 * - Assignee selection via ProjectMemberAssigneePickerModal (eligible active project members ONLY).
 * - Cross-project invalidation: changing project synchronously clears selected assignees.
 * - Exact CreateTaskRequest DTO fields: projectId, parentTaskId, title, description, priority, assigneeIds, startDate, dueDate, estimatedMinutes.
 * - Due date serialization: Converts date-only input (YYYY-MM-DD) to ISO-8601 Instant Vietnam UTC+7 end-of-day boundary (T17:00:00Z per Decision D-064).
 * - Strictly zero status, progress, or version fields in create form.
 * - Synchronous submit lock (submittingRef) prevents duplicate same-tick submissions.
 * - On success, navigates directly to TaskDetail: { taskId: created.id }.
 */

import React, { useEffect, useRef, useState } from 'react';
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
import { useAuth } from '../../../app/auth/AuthProvider';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { MainTabNavProp, MainTabScreenRouteProp } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingIndicator } from '../../../shared/components/LoadingIndicator';
import { PriorityBadge } from '../../../shared/components/PriorityBadge';
import { projectApi } from '../../projects/api/projectApi';
import { ProjectMember, ProjectSummary } from '../../projects/api/projectTypes';
import { taskApi } from '../api/taskApi';
import { CreateTaskRequest, TaskPriority } from '../api/taskTypes';
import { mapTaskError } from '../errors/taskErrorMapper';
import { ProjectMemberAssigneePickerModal } from '../components/ProjectMemberAssigneePickerModal';
import { ProjectSelectModal } from '../components/ProjectSelectModal';
import {
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

export function CreateTaskScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'CreateTask'>>();
  const route = useRoute<MainTabScreenRouteProp<'CreateTask'>>();
  const { currentUser, initialized, sessionState } = useAuth();

  const routeProjectId = route.params?.projectId;
  const routeParentTaskId = route.params?.parentTaskId;

  // Form State
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [resolvingProject, setResolvingProject] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<ProjectMember[]>([]);

  // Modal Visibility
  const [projectModalVisible, setProjectModalVisible] = useState<boolean>(false);
  const [assigneeModalVisible, setAssigneeModalVisible] = useState<boolean>(false);

  // Validation & Submission State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Synchronous correctness lock
  const submittingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  // Pre-resolve route projectId if provided
  useEffect(() => {
    mountedRef.current = true;
    if (routeProjectId && routeProjectId.trim().length > 0) {
      setResolvingProject(true);
      projectApi
        .getProject(routeProjectId)
        .then(projectDetail => {
          if (mountedRef.current) {
            setSelectedProject({
              id: projectDetail.id,
              code: projectDetail.code,
              name: projectDetail.name,
              description: projectDetail.description,
              status: projectDetail.status,
              priority: projectDetail.priority,
              manager: projectDetail.manager,
              startDate: projectDetail.startDate,
              plannedEndDate: projectDetail.plannedEndDate,
              progressPercent: projectDetail.progressPercent,
              memberCount: projectDetail.memberCount,
              taskSummary: {
                total: 0,
                completed: 0,
                overdue: 0,
              },
              createdAt: projectDetail.createdAt,
              updatedAt: projectDetail.updatedAt,
            });
          }
        })
        .catch(() => {
          // If fetch fails, user can manually select project via modal
        })
        .finally(() => {
          if (mountedRef.current) {
            setResolvingProject(false);
          }
        });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [routeProjectId]);

  // Project selection handler with synchronous invalidation
  const handleSelectProject = (project: ProjectSummary | null) => {
    if (project?.id !== selectedProject?.id) {
      setSelectedProject(project);
      // Synchronously clear selected assignees belonging to previous project
      setSelectedAssigneeIds([]);
      setSelectedMembers([]);
      if (fieldErrors.projectId) {
        setFieldErrors(prev => ({ ...prev, projectId: '' }));
      }
    }
  };

  const handleAssigneeConfirm = (userIds: string[], members: ProjectMember[]) => {
    setSelectedAssigneeIds(userIds);
    setSelectedMembers(members);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedProject?.id) {
      errors.projectId = 'Vui lòng chọn dự án cho công việc';
    }

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
    setFormError(null);

    const payload: CreateTaskRequest = {
      projectId: selectedProject!.id,
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

    if (routeParentTaskId && routeParentTaskId.trim().length > 0) {
      payload.parentTaskId = routeParentTaskId.trim();
    }

    try {
      const created = await taskApi.createTask(payload);
      if (mountedRef.current) {
        navigation.navigate('TaskDetail', { taskId: created.id });
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const mapped = mapTaskError(err);
        setFormError(mapped.message);
      }
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  // Direct route authorization checks
  if (!initialized || sessionState === 'INITIALIZING') {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}
        testID="create-task-auth-loading"
      >
        <LoadingIndicator size="large" message="Đang kiểm tra quyền truy cập..." />
      </View>
    );
  }

  const canCreateTask = currentUser?.permissions?.includes('TASK_CREATE') === true;

  if (!canCreateTask) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}
        testID="create-task-unauthorized"
      >
        <ErrorState
          title="Không có quyền truy cập"
          message="Bạn không có quyền tạo công việc."
          testID="create-task-unauthorized-error"
        />
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backNavRow,
            { opacity: pressed ? 0.7 : 1, marginTop: theme.spacing.md },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          testID="btn-unauthorized-back"
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
      testID="screen-create-task"
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
          testID="btn-create-task-back"
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
          Tạo công việc mới
        </Text>

        {/* Form Error Banner */}
        {formError ? (
          <View
            style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}
            testID="create-task-error-banner"
          >
            <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
              {formError}
            </Text>
          </View>
        ) : null}

        {/* 1. Project Selection */}
        <View style={styles.fieldSection}>
          <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            Dự án <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          {resolvingProject ? (
            <View style={styles.resolvingWrapper} testID="project-resolving-indicator">
              <LoadingIndicator size="small" message="Đang nạp thông tin dự án..." />
            </View>
          ) : (
            <Pressable
              onPress={() => setProjectModalVisible(true)}
              style={({ pressed }) => [
                styles.selectorButton,
                {
                  borderColor: fieldErrors.projectId ? theme.colors.error : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radii.small,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                selectedProject
                  ? `Dự án: ${selectedProject.name}`
                  : 'Chọn dự án cho công việc'
              }
              testID="btn-open-project-selector"
            >
              <Text
                style={[
                  theme.typography.body,
                  selectedProject ? styles.fontSemiBold : styles.fontRegular,
                  {
                    color: selectedProject
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {selectedProject
                  ? `[${selectedProject.code}] ${selectedProject.name}`
                  : 'Chọn dự án...'}
              </Text>
              <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>▼</Text>
            </Pressable>
          )}
          {fieldErrors.projectId ? (
            <Text
              style={[theme.typography.caption, styles.errorText, { color: theme.colors.error }]}
              testID="error-project-id"
            >
              {fieldErrors.projectId}
            </Text>
          ) : null}
        </View>

        {/* 2. Task Title */}
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
            testID="input-task-title"
          />
        </View>

        {/* 3. Priority Selection */}
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

        {/* 4. Description */}
        <View style={styles.fieldSection}>
          <AppTextInput
            label="Mô tả công việc"
            value={description}
            onChangeText={setDescription}
            placeholder="Nhập mô tả chi tiết công việc..."
            multiline
            numberOfLines={4}
            testID="input-task-description"
          />
        </View>

        {/* 5. Assignees Picker */}
        <View style={styles.fieldSection}>
          <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            Người thực hiện (Tùy chọn)
          </Text>
          <Pressable
            onPress={() => {
              if (!selectedProject) {
                setFieldErrors(prev => ({
                  ...prev,
                  projectId: 'Vui lòng chọn dự án trước khi phân công người thực hiện',
                }));
                return;
              }
              setAssigneeModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.selectorButton,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.small,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              selectedAssigneeIds.length > 0
                ? `Đã chọn ${selectedAssigneeIds.length} người thực hiện`
                : 'Chọn người thực hiện từ dự án'
            }
            testID="btn-open-assignee-picker"
          >
            <Text
              style={[
                theme.typography.body,
                selectedAssigneeIds.length > 0 ? styles.fontSemiBold : styles.fontRegular,
                {
                  color:
                    selectedAssigneeIds.length > 0
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary,
                },
              ]}
              numberOfLines={1}
              testID="create-task-selected-assignees-text"
            >
              {selectedAssigneeIds.length === 0
                ? 'Chưa phân công người thực hiện'
                : selectedAssigneeIds.length === 1
                ? `${selectedMembers[0]?.fullName ?? '1 người được chọn'}`
                : `${selectedMembers[0]?.fullName ?? 'Đã chọn'} (+${selectedAssigneeIds.length - 1})`}
            </Text>
            <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>▼</Text>
          </Pressable>
        </View>

        {/* 6. Dates: Start Date & Due Date */}
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
              testID="input-task-start-date"
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
              testID="input-task-due-date"
            />
          </View>
        </View>

        {/* 7. Estimated Minutes */}
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
            testID="input-task-estimated-minutes"
          />
        </View>

        {/* Submit Actions */}
        <View style={styles.submitSection}>
          <AppButton
            title="Tạo công việc"
            variant="primary"
            onPress={handleSubmit}
            loading={submitting}
            testID="btn-submit-create-task"
          />
        </View>
      </ScrollView>

      {/* Project Selector Modal */}
      <ProjectSelectModal
        visible={projectModalVisible}
        selectedProjectId={selectedProject?.id}
        onSelect={handleSelectProject}
        onClose={() => setProjectModalVisible(false)}
        testID="create-task-project-modal"
      />

      {/* Assignee Picker Modal */}
      <ProjectMemberAssigneePickerModal
        visible={assigneeModalVisible}
        projectId={selectedProject?.id ?? null}
        selectedUserIds={selectedAssigneeIds}
        onConfirm={handleAssigneeConfirm}
        onClose={() => setAssigneeModalVisible(false)}
        testID="create-task-assignee-modal"
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
  resolvingWrapper: {
    paddingVertical: 12,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chevron: {
    fontSize: 12,
    marginLeft: 8,
  },
  errorText: {
    marginTop: 4,
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
  fontSemiBold: {
    fontWeight: '600',
  },
  fontRegular: {
    fontWeight: '400',
  },
  submitSection: {
    marginTop: 24,
    marginBottom: 16,
  },
});
