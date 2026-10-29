/**
 * Phase 14E: Create Project Screen (SCR-PRJ-03)
 * Provides comprehensive form to create a new project.
 *
 * Capabilities:
 * - Code input (required, 3-50 chars)
 * - Name input (required, 3-200 chars)
 * - Description input (optional)
 * - Priority selector (LOW, MEDIUM, HIGH, CRITICAL - default MEDIUM)
 * - Start date and planned end date (YYYY-MM-DD format with validation)
 * - Department selection via DepartmentSelectModal (zero raw UUID exposed)
 * - Initial members selection via UserPickerModal (multiple selection, zero raw UUID exposed)
 * - Deterministic validation & error handling
 * - Navigates to newly created project detail upon success
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { MainTabNavProp } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { DepartmentItem, DepartmentSelectModal } from '../../organization';
import { UserDirectoryItem } from '../../directory/api/directoryTypes';
import { UserPickerModal } from '../../directory/components/UserPickerModal';
import { projectApi } from '../api/projectApi';
import { CreateProjectRequest, ProjectPriority, PROJECT_PRIORITY_VALUES } from '../api/projectTypes';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Khẩn cấp',
};

export function CreateProjectScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'CreateProject'>>();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('MEDIUM');
  const [startDate, setStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<UserDirectoryItem[]>([]);

  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      errors.code = 'Mã dự án không được để trống';
    } else if (trimmedCode.length < 3 || trimmedCode.length > 50) {
      errors.code = 'Mã dự án phải từ 3 đến 50 ký tự';
    }

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

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const request: CreateProjectRequest = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        startDate: startDate.trim() || undefined,
        plannedEndDate: plannedEndDate.trim() || undefined,
        departmentId: selectedDepartment?.id,
        initialMemberIds: selectedMembers.length > 0 ? selectedMembers.map(m => m.id) : undefined,
      };

      const created = await projectApi.createProject(request);
      navigation.navigate('ProjectDetail', { projectId: created.id });
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Không thể tạo dự án. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID="screen-create-project">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách dự án"
          testID="btn-create-project-back"
        >
          <Text style={[theme.typography.body, { color: theme.colors.primary, fontWeight: '600' }]}>← Quay lại</Text>
        </Pressable>
        <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
          Tạo dự án mới
        </Text>
        <Text style={styles.screenIdHidden}>SCR-PRJ-03</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Error banner */}
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
            testID="create-project-error-banner"
          >
            <Text style={[theme.typography.caption, { color: theme.colors.error, fontWeight: '600' }]}>
              {submitError}
            </Text>
          </View>
        ) : null}

        {/* Code */}
        <AppTextInput
          label="Mã dự án *"
          value={code}
          onChangeText={text => {
            setCode(text);
            if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: '' }));
          }}
          placeholder="VD: PRJ-2026-001"
          error={fieldErrors.code}
          helperText="Mã định danh duy nhất (3-50 ký tự)"
          testID="create-project-code-input"
          autoCapitalize="characters"
        />

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
            helperText="Tên dự án rõ ràng (3-200 ký tự)"
            testID="create-project-name-input"
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
            testID="create-project-description-input"
          />
        </View>

        {/* Priority Selector */}
        <View style={{ marginTop: theme.spacing.md }}>
          <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            Mức độ ưu tiên
          </Text>
          <View style={styles.priorityRow} testID="create-project-priority-group">
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
                  testID={`create-project-priority-${p.toLowerCase()}`}
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
              testID="create-project-start-date-input"
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
              testID="create-project-planned-end-date-input"
            />
          </View>
        </View>

        {/* Department Selection */}
        <View style={{ marginTop: theme.spacing.md }}>
          <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            Phòng ban phụ trách
          </Text>
          <Pressable
            onPress={() => setDepartmentModalVisible(true)}
            style={[
              styles.selectorField,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.small,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              selectedDepartment
                ? `Phòng ban đã chọn: ${selectedDepartment.name}`
                : 'Chọn phòng ban phụ trách'
            }
            testID="create-project-department-select"
          >
            <Text
              style={[
                theme.typography.body,
                { color: selectedDepartment ? theme.colors.textPrimary : theme.colors.textSecondary },
              ]}
              testID="create-project-department-value"
            >
              {selectedDepartment ? `${selectedDepartment.name} (${selectedDepartment.code})` : 'Chọn phòng ban...'}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Chọn</Text>
          </Pressable>
        </View>

        {/* Initial Members Selection */}
        <View style={{ marginTop: theme.spacing.md }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[theme.typography.caption, styles.fieldLabel, { color: theme.colors.textSecondary }]}>
              Thành viên ban đầu ({selectedMembers.length})
            </Text>
            <Pressable
              onPress={() => setMemberPickerVisible(true)}
              style={styles.addMemberBtn}
              accessibilityRole="button"
              accessibilityLabel="Chọn thêm thành viên dự án"
              testID="btn-open-member-picker"
            >
              <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
                + Thêm thành viên
              </Text>
            </Pressable>
          </View>

          {selectedMembers.length === 0 ? (
            <Text style={[theme.typography.caption, styles.hintText, { color: theme.colors.textSecondary }]}>
              Chưa chọn thành viên nào. Bạn có thể thêm thành viên sau khi tạo dự án.
            </Text>
          ) : (
            <View style={styles.membersWrap}>
              {selectedMembers.map(user => (
                <View
                  key={user.id}
                  style={[
                    styles.memberPill,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radii.full,
                    },
                  ]}
                  testID={`selected-member-pill-${user.id}`}
                >
                  <Text style={[theme.typography.caption, styles.memberPillText, { color: theme.colors.textPrimary }]}>
                    {user.fullName}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveMember(user.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Xóa thành viên ${user.fullName}`}
                    testID={`btn-remove-member-${user.id}`}
                    style={styles.removePillBtn}
                  >
                    <Text style={{ color: theme.colors.textSecondary, fontWeight: '700', fontSize: 12 }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.xl }}>
          <AppButton
            title="Tạo dự án"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            testID="btn-create-project-submit"
          />
        </View>
      </ScrollView>

      {/* Modals */}
      {departmentModalVisible ? (
        <DepartmentSelectModal
          visible={departmentModalVisible}
          selectedId={selectedDepartment?.id}
          onSelect={dept => setSelectedDepartment(dept)}
          onClose={() => setDepartmentModalVisible(false)}
          testID="modal-select-department"
        />
      ) : null}

      {memberPickerVisible ? (
        <UserPickerModal
          visible={memberPickerVisible}
          mode="multiple"
          selectedIds={selectedMembers.map(m => m.id)}
          initialSelectedUsers={selectedMembers}
          onConfirm={users => {
            setSelectedMembers(users);
            setMemberPickerVisible(false);
          }}
          onCancel={() => setMemberPickerVisible(false)}
          title="Chọn thành viên dự án"
          testID="modal-select-members"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  selectorField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    minHeight: 48,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addMemberBtn: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  hintText: {
    fontStyle: 'italic',
    marginTop: 4,
  },
  membersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  memberPillText: {
    marginRight: 8,
  },
  removePillBtn: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
