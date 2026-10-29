/**
 * Phase 14E: Project Members Screen (SCR-PRJ-06 & SCR-PRJ-07)
 * Comprehensive management of project members with role-based governance and D-013 last PM protection.
 *
 * Capabilities:
 * - List active project members with roles and contact information
 * - Role filter chips: Tất cả, Quản lý dự án, Trưởng nhóm, Thành viên, Quan sát viên
 * - Add member via single-select UserPickerModal with disabledIds prevention
 * - Change member role with D-013 last PM invariant protection
 * - Remove member with ConfirmationDialog and D-013 last PM protection
 * - Stale query protection & unmount safety via useProjectMembers hook
 */

import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { MainTabNavProp, MainTabScreenRouteProp } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { ConfirmationDialog } from '../../../shared/components/ConfirmationDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingIndicator } from '../../../shared/components/LoadingIndicator';
import { UserDirectoryItem } from '../../directory/api/directoryTypes';
import { UserPickerModal } from '../../directory/components/UserPickerModal';
import { projectApi } from '../api/projectApi';
import {
  ProjectMember,
  ProjectRole,
  PROJECT_ROLE_VALUES,
} from '../api/projectTypes';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useProjectDetail } from '../hooks/useProjectDetail';

const ROLE_LABELS: Record<ProjectRole, string> = {
  PROJECT_MANAGER: 'Quản lý dự án',
  TEAM_LEADER: 'Trưởng nhóm',
  MEMBER: 'Thành viên',
  OBSERVER: 'Quan sát viên',
};

const ROLE_FILTERS: { role: ProjectRole | undefined; label: string }[] = [
  { role: undefined, label: 'Tất cả' },
  { role: 'PROJECT_MANAGER', label: 'Quản lý' },
  { role: 'TEAM_LEADER', label: 'Trưởng nhóm' },
  { role: 'MEMBER', label: 'Thành viên' },
  { role: 'OBSERVER', label: 'Quan sát viên' },
];

function getInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProjectMembersScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'ProjectMembers'>>();
  const route = useRoute<MainTabScreenRouteProp<'ProjectMembers'>>();
  const { projectId } = route.params;

  const {
    members,
    initialLoading,
    refreshing,
    error,
    refreshError,
    roleFilter,
    setRoleFilter,
    load,
    refresh,
    updateLocalMember,
    removeLocalMember,
    addLocalMember,
  } = useProjectMembers(projectId);

  // Authoritative capability derived strictly from server ProjectDetail.
  // Fails closed (false) while loading, on fetch failure, or if MANAGE_MEMBERS is absent.
  const {
    project: projectDetail,
    refresh: refreshProjectDetail,
  } = useProjectDetail(projectId);
  const canManageMembers = !!projectDetail?.allowedActions?.includes('MANAGE_MEMBERS');

  // Add Member State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserDirectoryItem | null>(null);
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState<ProjectRole>('MEMBER');
  const [addingMember, setAddingMember] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  // Edit Role State
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<ProjectRole>('MEMBER');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Remove Member State
  const [removingMember, setRemovingMember] = useState<ProjectMember | null>(null);
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Global action error banner (e.g. D-013 violation)
  const [actionError, setActionError] = useState<string | null>(null);

  // Existing member userIds to disable in UserPickerModal
  const existingUserIds = members.map(m => m.userId);

  // 1. Handle Add Member
  const handleUserSelected = (users: UserDirectoryItem[]) => {
    if (!canManageMembers) return;
    if (users.length > 0) {
      setPendingUser(users[0]);
      setSelectedRoleForAdd('MEMBER');
      setPickerVisible(false);
      setRoleModalVisible(true);
    }
  };

  const handleConfirmAddMember = async () => {
    if (!canManageMembers || !pendingUser) return;
    setActionError(null);
    setAddingMember(true);
    try {
      const added = await projectApi.addProjectMember(projectId, {
        userId: pendingUser.id,
        projectRole: selectedRoleForAdd,
      });
      addLocalMember(added);
      setRoleModalVisible(false);
      setPendingUser(null);
    } catch (err: any) {
      setActionError(err?.message ?? 'Không thể thêm thành viên');
    } finally {
      setAddingMember(false);
    }
  };

  // 2. Handle Edit Role
  const handleOpenEditRole = (member: ProjectMember) => {
    if (!canManageMembers) return;
    setEditingMember(member);
    setSelectedRoleForEdit(member.projectRole);
    setActionError(null);
  };

  const handleConfirmEditRole = async () => {
    if (!canManageMembers || !editingMember) return;
    setActionError(null);
    setUpdatingRole(true);
    try {
      const updated = await projectApi.updateProjectMemberRole(projectId, editingMember.id, {
        projectRole: selectedRoleForEdit,
      });
      updateLocalMember(editingMember.id, { projectRole: updated.projectRole });
      setEditingMember(null);
    } catch (err: any) {
      // D-013 or other error
      setActionError(err?.message ?? 'Không thể cập nhật vai trò');
    } finally {
      setUpdatingRole(false);
    }
  };

  // 3. Handle Remove Member
  const handleOpenRemoveDialog = (member: ProjectMember) => {
    if (!canManageMembers) return;
    setRemovingMember(member);
    setRemoveDialogVisible(true);
    setActionError(null);
  };

  const handleConfirmRemove = async () => {
    if (!canManageMembers || !removingMember) return;
    setActionError(null);
    setRemoving(true);
    try {
      await projectApi.removeProjectMember(projectId, removingMember.id);
      removeLocalMember(removingMember.id);
      setRemoveDialogVisible(false);
      setRemovingMember(null);
    } catch (err: any) {
      // D-013 or other error
      setActionError(err?.message ?? 'Không thể xóa thành viên');
      setRemoveDialogVisible(false);
    } finally {
      setRemoving(false);
    }
  };

  // Header Component
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenIdHidden}>SCR-PRJ-06</Text>

      {/* Top Title Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại chi tiết dự án"
          testID="btn-members-back"
        >
          <Text style={[theme.typography.body, { color: theme.colors.primary, fontWeight: '600' }]}>← Quay lại</Text>
        </Pressable>
        {canManageMembers ? (
          <Pressable
            onPress={() => {
              setActionError(null);
              setPickerVisible(true);
            }}
            style={[
              styles.addMemberBtn,
              { backgroundColor: theme.colors.primary, borderRadius: theme.radii.medium },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Thêm thành viên mới vào dự án"
            testID="btn-add-member"
          >
            <Text style={[theme.typography.caption, { color: theme.colors.onPrimary, fontWeight: '600' }]}>
              + Thêm thành viên
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={[theme.typography.heading1, styles.titleText, { color: theme.colors.textPrimary }]}>
        Thành viên dự án ({members.length})
      </Text>

      {/* Action Error Banner (e.g. D-013 Last PM rule) */}
      {actionError ? (
        <View
          style={[
            styles.actionErrorBanner,
            {
              backgroundColor: theme.colors.errorContainer,
              borderColor: theme.colors.error,
              borderRadius: theme.radii.small,
            },
          ]}
          accessibilityRole="alert"
          testID="members-action-error-banner"
        >
          <Text style={[theme.typography.caption, { color: theme.colors.error, fontWeight: '600' }]}>
            {actionError}
          </Text>
        </View>
      ) : null}

      {/* Refresh Error Banner */}
      {refreshError ? (
        <View
          style={[
            styles.actionErrorBanner,
            {
              backgroundColor: theme.colors.errorContainer,
              borderColor: theme.colors.error,
              borderRadius: theme.radii.small,
            },
          ]}
          accessibilityRole="alert"
          testID="members-refresh-error-banner"
        >
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
            {refreshError}
          </Text>
        </View>
      ) : null}

      {/* Role Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
        testID="members-role-filters"
      >
        {ROLE_FILTERS.map(f => {
          const isSelected = roleFilter === f.role;
          return (
            <Pressable
              key={f.label}
              onPress={() => setRoleFilter(f.role)}
              style={[
                styles.filterChip,
                {
                  borderRadius: theme.radii.full,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Lọc theo vai trò: ${f.label}`}
              testID={`filter-role-${f.role ? f.role.toLowerCase() : 'all'}`}
            >
              <Text
                style={[
                  theme.typography.caption,
                  { color: isSelected ? theme.colors.onPrimary : theme.colors.textPrimary, fontWeight: '600' },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (initialLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]} testID="members-loading">
        <LoadingIndicator size="large" message="Đang tải danh sách thành viên..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]} testID="members-error">
        <ErrorState
          title="Không thể tải thành viên"
          message={error.message}
          onRetry={load}
          testID="members-error-state"
        />
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButtonBottom}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          testID="btn-back-from-members-error"
        >
          <Text style={[theme.typography.body, { color: theme.colors.primary }]}>← Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID="screen-project-members">
      <FlatList<ProjectMember>
        data={members}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            title="Không có thành viên"
            description="Chưa có thành viên nào phù hợp với bộ lọc đã chọn."
            testID="members-empty-state"
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refresh();
              refreshProjectDetail();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.memberCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.medium,
              },
            ]}
            testID={`member-item-${item.id}`}
          >
            {/* Member Info */}
            <View style={styles.memberTopRow}>
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.radii.full },
                ]}
              >
                <Text style={[theme.typography.caption, { fontWeight: '700', color: theme.colors.primary }]}>
                  {getInitials(item.fullName)}
                </Text>
              </View>

              <View style={styles.memberTextContainer}>
                <Text style={[theme.typography.body, styles.memberName, { color: theme.colors.textPrimary }]}>
                  {item.fullName}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {item.email}
                </Text>
              </View>

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      item.projectRole === 'PROJECT_MANAGER'
                        ? theme.colors.primaryContainer
                        : theme.colors.surfaceVariant,
                    borderColor:
                      item.projectRole === 'PROJECT_MANAGER'
                        ? theme.colors.primary
                        : theme.colors.border,
                    borderRadius: theme.radii.small,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color:
                        item.projectRole === 'PROJECT_MANAGER'
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                      fontWeight: '600',
                    },
                  ]}
                  testID={`member-role-${item.id}`}
                >
                  {ROLE_LABELS[item.projectRole]}
                </Text>
              </View>
            </View>

            {/* Member Actions - Only rendered if user has authoritative MANAGE_MEMBERS capability */}
            {canManageMembers ? (
              <View style={[styles.cardActionsRow, { borderTopColor: theme.colors.border }]}>
                <Pressable
                  onPress={() => handleOpenEditRole(item)}
                  style={styles.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Đổi vai trò thành viên ${item.fullName}`}
                  testID={`btn-edit-role-${item.id}`}
                >
                  <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
                    Đổi vai trò
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleOpenRemoveDialog(item)}
                  style={styles.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Xóa thành viên ${item.fullName}`}
                  testID={`btn-remove-member-${item.id}`}
                >
                  <Text style={[theme.typography.caption, { color: theme.colors.error, fontWeight: '600' }]}>
                    Xóa
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      />

      {/* 1. User Directory Picker Modal */}
      {canManageMembers && pickerVisible ? (
        <UserPickerModal
          visible={pickerVisible}
          mode="single"
          disabledIds={existingUserIds}
          disabledReason="Đã là thành viên"
          onConfirm={handleUserSelected}
          onCancel={() => setPickerVisible(false)}
          title="Chọn người dùng vào dự án"
          testID="picker-modal-add-member"
        />
      ) : null}

      {/* 2. Select Role Dialog for Add Member */}
      {canManageMembers && roleModalVisible && pendingUser ? (
        <Modal
          visible={roleModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRoleModalVisible(false)}
          testID="modal-select-role-add"
        >
          <View style={styles.scrim}>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radii.large,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
                Chọn vai trò dự án
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                Thêm {pendingUser.fullName} vào dự án với vai trò:
              </Text>

              <View style={styles.roleRadiosList}>
                {PROJECT_ROLE_VALUES.map(r => {
                  const isSelected = selectedRoleForAdd === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setSelectedRoleForAdd(r)}
                      style={[
                        styles.roleRadioItem,
                        {
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected ? theme.colors.surfaceVariant : 'transparent',
                          borderRadius: theme.radii.medium,
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      testID={`radio-role-add-${r.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          theme.typography.body,
                          {
                            color: theme.colors.textPrimary,
                            fontWeight: isSelected ? '700' : '400',
                          },
                        ]}
                      >
                        {ROLE_LABELS[r]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.dialogActionsRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <AppButton
                    title="Hủy"
                    onPress={() => {
                      setRoleModalVisible(false);
                      setPendingUser(null);
                    }}
                    variant="secondary"
                    testID="btn-cancel-add-role"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <AppButton
                    title="Xác nhận thêm"
                    onPress={handleConfirmAddMember}
                    loading={addingMember}
                    disabled={addingMember}
                    variant="primary"
                    testID="btn-confirm-add-role"
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* 3. Edit Role Modal */}
      {canManageMembers && editingMember ? (
        <Modal
          visible={!!editingMember}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingMember(null)}
          testID="modal-edit-role"
        >
          <View style={styles.scrim}>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radii.large,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
                Cập nhật vai trò
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                Thành viên: {editingMember.fullName}
              </Text>

              <View style={styles.roleRadiosList}>
                {PROJECT_ROLE_VALUES.map(r => {
                  const isSelected = selectedRoleForEdit === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setSelectedRoleForEdit(r)}
                      style={[
                        styles.roleRadioItem,
                        {
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected ? theme.colors.surfaceVariant : 'transparent',
                          borderRadius: theme.radii.medium,
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      testID={`radio-role-edit-${r.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          theme.typography.body,
                          {
                            color: theme.colors.textPrimary,
                            fontWeight: isSelected ? '700' : '400',
                          },
                        ]}
                      >
                        {ROLE_LABELS[r]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.dialogActionsRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <AppButton
                    title="Hủy"
                    onPress={() => setEditingMember(null)}
                    variant="secondary"
                    testID="btn-cancel-edit-role"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <AppButton
                    title="Lưu vai trò"
                    onPress={handleConfirmEditRole}
                    loading={updatingRole}
                    disabled={updatingRole}
                    variant="primary"
                    testID="btn-confirm-edit-role"
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* 4. Remove Member Confirmation Dialog */}
      <ConfirmationDialog
        visible={canManageMembers && removeDialogVisible}
        title="Xóa thành viên"
        message={
          removingMember
            ? `Bạn có chắc muốn xóa "${removingMember.fullName}" khỏi dự án này?`
            : ''
        }
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmRemove}
        onCancel={() => {
          setRemoveDialogVisible(false);
          setRemovingMember(null);
        }}
        isDanger={true}
        loading={removing}
        testID="dialog-confirm-remove-member"
      />
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
  headerContainer: {
    marginBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  backButtonBottom: {
    marginTop: 16,
    padding: 8,
  },
  addMemberBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontWeight: '700',
  },
  screenIdHidden: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  actionErrorBanner: {
    padding: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  memberCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberTextContainer: {
    flex: 1,
  },
  memberName: {
    fontWeight: '600',
  },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 8,
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderWidth: 1,
  },
  roleRadiosList: {
    marginVertical: 16,
    gap: 8,
  },
  roleRadioItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  dialogActionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
