/**
 * Phase 14E: Edit Project Screen (SCR-PRJ-04)
 * Provides authoritative editing of an existing project with optimistic concurrency control.
 *
 * Capabilities:
 * - Authoritative prefill via GET /projects/{projectId}
 * - Non-editable read-only display for code and department
 * - Editable name (required, 3-200 chars)
 * - Editable description
 * - Priority selector (LOW, MEDIUM, HIGH, CRITICAL)
 * - Editable startDate and plannedEndDate with validation
 * - Optimistic concurrency protection using `version`
 * - 409 OPTIMISTIC_LOCK_CONFLICT shows reload prompt ("Tải lại dữ liệu")
 * - Success returns to ProjectDetail screen
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
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
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingIndicator } from '../../../shared/components/LoadingIndicator';
import { projectApi } from '../api/projectApi';
import {
  ProjectDetail,
  ProjectPriority,
  PROJECT_PRIORITY_VALUES,
  UpdateProjectRequest,
} from '../api/projectTypes';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Khẩn cấp',
};

export function EditProjectScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'EditProject'>>();
  const route = useRoute<MainTabScreenRouteProp<'EditProject'>>();
  const { projectId } = route.params;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('MEDIUM');
  const [startDate, setStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadAuthoritativeData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setSubmitError(null);
    setIsConflict(false);
    try {
      const data = await projectApi.getProject(projectId);
      setProject(data);
      setName(data.name);
      setDescription(data.description ?? '');
      setPriority(data.priority);
      setStartDate(data.startDate ?? '');
      setPlannedEndDate(data.plannedEndDate ?? '');
    } catch (err: any) {
      setLoadError(err?.message ?? 'Không thể tải thông tin dự án');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAuthoritativeData();
  }, [loadAuthoritativeData]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Tên dự án không được để trống';
    } else if (trimmedName.length < 3 || trimmedName.length > 200) {
      errors.name = 'Tên dự án phải từ 3 đến 200 ký tự';
    }

    const trimmedStart = startDate.trim();
    if (trimmedStart && !DATE_REGEX.test(trimmedStart)) {
      errors.startDate = 'Định dạng ngày phải là YYYY-MM-DD';
    }

    const trimmedEnd = plannedEndDate.trim();
    if (trimmedEnd && !DATE_REGEX.test(trimmedEnd)) {
      errors.plannedEndDate = 'Định dạng ngày phải là YYYY-MM-DD';
    }

    if (trimmedStart && trimmedEnd && DATE_REGEX.test(trimmedStart) && DATE_REGEX.test(trimmedEnd)) {
      if (trimmedEnd < trimmedStart) {
        errors.plannedEndDate = 'Ngày kết thúc không thể trước ngày bắt đầu';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsConflict(false);
    if (!project || !validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const request: UpdateProjectRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        startDate: startDate.trim() || undefined,
        plannedEndDate: plannedEndDate.trim() || undefined,
        version: project.version,
      };

      await projectApi.updateProject(projectId, request);
      navigation.goBack();
    } catch (err: any) {
      const is409 =
        err?.status === 409 ||
        err?.code === 'OPTIMISTIC_LOCK_CONFLICT' ||
        err?.message?.includes('409') ||
        err?.message?.includes('xung đột') ||
        err?.message?.includes('phiên bản');

      if (is409) {
        setIsConflict(true);
        setSubmitError(
          'Dữ liệu dự án đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.'
        );
      } else {
        setSubmitError(err?.message ?? 'Không thể cập nhật dự án. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]} testID="edit-project-loading">
        <LoadingIndicator size="large" message="Đang tải thông tin dự án..." />
      </View>
    );
  }

  if (loadError || !project) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]} testID="edit-project-error">
        <ErrorState
          title="Không thể tải dự án"
          message={loadError ?? 'Đã xảy ra lỗi khi tải dữ liệu.'}
          onRetry={loadAuthoritativeData}
          testID="edit-project-error-state"
        />
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButtonBottom}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          testID="btn-back-from-edit-error"
        >
          <Text style={[theme.typography.body, { color: theme.colors.primary }]}>← Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID="screen-edit-project">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại chi tiết dự án"
          testID="btn-edit-project-back"
        >
          <Text style={[theme.typography.body, { color: theme.colors.primary, fontWeight: '600' }]}>← Quay lại</Text>
        </Pressable>
        <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
          Chỉnh sửa dự án
        </Text>
        <Text style={styles.screenIdHidden}>SCR-PRJ-04</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Error banner / Optimistic Lock Conflict */}
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
            testID="edit-project-error-banner"
          >
            <Text style={[theme.typography.caption, { color: theme.colors.error, fontWeight: '600' }]}>
              {submitError}
            </Text>
            {isConflict ? (
              <View style={{ marginTop: theme.spacing.sm }}>
                <AppButton
                  title="Tải lại dữ liệu"
                  onPress={loadAuthoritativeData}
                  variant="outline"
                  testID="btn-reload-conflict-data"
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Read-only Code */}
        <View style={styles.readOnlyField}>
          <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            Mã dự án (Không thể sửa)
          </Text>
          <View
            style={[
              styles.readOnlyContainer,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.small,
              },
            ]}
          >
            <Text
              style={[theme.typography.body, { color: theme.colors.textSecondary, fontWeight: '600' }]}
              testID="edit-project-code-readonly"
            >
              {project.code}
            </Text>
          </View>
        </View>

        {/* Read-only Department */}
        <View style={[styles.readOnlyField, { marginTop: theme.spacing.sm }]}>
          <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            Phòng ban (Không thể sửa)
          </Text>
          <View
            style={[
              styles.readOnlyContainer,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.small,
              },
            ]}
          >
            <Text
              style={[theme.typography.body, { color: theme.colors.textSecondary }]}
              testID="edit-project-department-readonly"
            >
              {project.department ? `${project.department.name} (${project.department.code})` : 'Chưa phân bổ'}
            </Text>
          </View>
        </View>

        {/* Name */}
        <View style={{ marginTop: theme.spacing.sm }}>
          <AppTextInput
            label="Tên dự án *"
            value={name}
            onChangeText={text => {
              setName(text);
              if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
            }}
            placeholder="VD: Xây dựng nền tảng WorkSphere"
            error={fieldErrors.name}
            helperText="Tên dự án (3-200 ký tự)"
            testID="edit-project-name-input"
          />
        </View>

        {/* Description */}
        <View style={{ marginTop: theme.spacing.sm }}>
          <AppTextInput
            label="Mô tả dự án"
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả chi tiết mục tiêu, phạm vi dự án..."
            multiline
            numberOfLines={4}
            testID="edit-project-description-input"
          />
        </View>

        {/* Priority Selector */}
        <View style={{ marginTop: theme.spacing.md }}>
          <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            Mức độ ưu tiên
          </Text>
          <View style={styles.priorityRow} testID="edit-project-priority-group">
            {PROJECT_PRIORITY_VALUES.map(p => {
              const isSelected = priority === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityChip,
                    {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                      borderRadius: theme.radii.full,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Ưu tiên ${PRIORITY_LABELS[p]}`}
                  testID={`edit-project-priority-${p.toLowerCase()}`}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: isSelected ? theme.colors.onPrimary : theme.colors.textPrimary, fontWeight: '600' },
                    ]}
                  >
                    {PRIORITY_LABELS[p]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={{ flex: 1, marginRight: theme.spacing.xs }}>
            <AppTextInput
              label="Ngày bắt đầu"
              value={startDate}
              onChangeText={text => {
                setStartDate(text);
                if (fieldErrors.startDate) setFieldErrors(prev => ({ ...prev, startDate: '' }));
              }}
              placeholder="YYYY-MM-DD"
              error={fieldErrors.startDate}
              testID="edit-project-start-date-input"
            />
          </View>
          <View style={{ flex: 1, marginLeft: theme.spacing.xs }}>
            <AppTextInput
              label="Dự kiến kết thúc"
              value={plannedEndDate}
              onChangeText={text => {
                setPlannedEndDate(text);
                if (fieldErrors.plannedEndDate) setFieldErrors(prev => ({ ...prev, plannedEndDate: '' }));
              }}
              placeholder="YYYY-MM-DD"
              error={fieldErrors.plannedEndDate}
              testID="edit-project-planned-end-date-input"
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.xl }}>
          <AppButton
            title="Lưu thay đổi"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            testID="btn-edit-project-submit"
          />
        </View>
      </ScrollView>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
  },
  backButtonBottom: {
    marginTop: 16,
    padding: 8,
  },
  screenIdHidden: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  scrollContent: {
    padding: 16,
  },
  errorBanner: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  readOnlyField: {
    marginBottom: 8,
  },
  readOnlyContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datesRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
});
