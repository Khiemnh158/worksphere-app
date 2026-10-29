/**
 * Phase 15D: Project Member Assignee Picker Modal
 * Modal allowing users to select task assignees exclusively from eligible active project members.
 *
 * Invariants & Correctness Guarantees:
 * - Data source: projectApi.listMembers(projectId, { active: true }) ONLY.
 * - Never calls directoryApi (strictly enforces D-063 assignee eligibility).
 * - Multi-select checkbox semantics with touch targets >= 48dp.
 * - Displays member.fullName and member.projectRole (strictly zero raw UUIDs).
 * - Selection outputs array of user account UUIDs (member.userId).
 * - Cross-project invalidation: Monotonic requestGenerationRef discards in-flight candidate
 *   responses from prior project IDs.
 * - Synchronous pagination lock (paginationLockRef) prevents duplicate same-tick page loads.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { AppButton } from '../../../shared/components/AppButton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingIndicator } from '../../../shared/components/LoadingIndicator';
import { SearchBar } from '../../../shared/components/SearchBar';
import { projectApi } from '../../projects/api/projectApi';
import { ProjectMember } from '../../projects/api/projectTypes';

export interface ProjectMemberAssigneePickerModalProps {
  visible: boolean;
  projectId: string | null;
  selectedUserIds: string[];
  disabledUserIds?: string[];
  onConfirm: (selectedUserIds: string[], selectedMembers: ProjectMember[]) => void;
  onClose: () => void;
  title?: string;
  testID?: string;
}

export function ProjectMemberAssigneePickerModal({
  visible,
  projectId,
  selectedUserIds,
  disabledUserIds = [],
  onConfirm,
  onClose,
  title = 'Chọn người thực hiện',
  testID = 'assignee-picker-modal',
}: ProjectMemberAssigneePickerModalProps) {
  const theme = useAppTheme();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [draftSelectedUserIds, setDraftSelectedUserIds] = useState<string[]>([]);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);

  const requestGenerationRef = useRef<number>(0);
  const paginationLockRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  // Sync draft selection and load candidates when visible or projectId changes
  useEffect(() => {
    mountedRef.current = true;
    if (visible) {
      setDraftSelectedUserIds([...selectedUserIds]);
      setSearch('');
      setPage(0);
      setHasNext(false);
      setMembers([]);

      if (projectId && projectId.trim().length > 0) {
        loadInitialMembers(projectId);
      } else {
        setMembers([]);
        setInitialLoading(false);
        setError('Vui lòng chọn dự án trước khi phân công người thực hiện.');
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, [visible, projectId, selectedUserIds]);

  const loadInitialMembers = async (targetProjectId: string) => {
    const generation = ++requestGenerationRef.current;
    setInitialLoading(true);
    setError(null);

    try {
      const data = await projectApi.listMembers(targetProjectId, {
        active: true,
        page: 0,
        size: 50,
      });

      if (!mountedRef.current || generation !== requestGenerationRef.current) {
        return;
      }

      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray((data as any)?.content)
        ? ((data as any).content as ProjectMember[])
        : [];

      setMembers(items);
      setHasNext(Boolean(data?.hasNext));
      setPage(0);
    } catch (err: unknown) {
      if (!mountedRef.current || generation !== requestGenerationRef.current) {
        return;
      }
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách thành viên';
      setError(message);
    } finally {
      if (mountedRef.current && generation === requestGenerationRef.current) {
        setInitialLoading(false);
      }
    }
  };

  const loadMoreMembers = useCallback(async () => {
    if (
      !projectId ||
      !hasNext ||
      loadingMore ||
      initialLoading ||
      paginationLockRef.current
    ) {
      return;
    }

    paginationLockRef.current = true;
    const generation = requestGenerationRef.current;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const data = await projectApi.listMembers(projectId, {
        active: true,
        page: nextPage,
        size: 50,
      });

      if (!mountedRef.current || generation !== requestGenerationRef.current) {
        return;
      }

      const moreItems = Array.isArray(data?.items)
        ? data.items
        : Array.isArray((data as any)?.content)
        ? ((data as any).content as ProjectMember[])
        : [];

      setMembers(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newItems = moreItems.filter(m => !existingIds.has(m.id));
        return [...prev, ...newItems];
      });
      setHasNext(Boolean(data?.hasNext));
      setPage(nextPage);
    } catch {
      // Non-blocking pagination error
    } finally {
      paginationLockRef.current = false;
      if (mountedRef.current && generation === requestGenerationRef.current) {
        setLoadingMore(false);
      }
    }
  }, [projectId, hasNext, loadingMore, initialLoading, page]);

  const filteredMembers = useMemo(() => {
    const safeList = members || [];
    const q = search.trim().toLowerCase();
    if (!q) return safeList;
    return safeList.filter(
      m => m.fullName.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );
  }, [members, search]);

  const toggleUserSelection = (userId: string) => {
    if (disabledUserIds.includes(userId)) {
      return;
    }
    setDraftSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleConfirm = () => {
    // Only return newly selected members that are not already disabled/assigned
    const effectiveSelectedUserIds = draftSelectedUserIds.filter(id => !disabledUserIds.includes(id));
    const selectedMembers = members.filter(m => effectiveSelectedUserIds.includes(m.userId));
    onConfirm(effectiveSelectedUserIds, selectedMembers);
    onClose();
  };

  const handleClear = () => {
    setDraftSelectedUserIds([]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.scrim}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.large,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text
              style={[
                theme.typography.heading3,
                styles.title,
                { color: theme.colors.textPrimary },
              ]}
            >
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              testID="btn-close-assignee-modal"
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Text style={[styles.closeIcon, { color: theme.colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm kiếm thành viên theo tên..."
              testID="input-search-assignee"
            />
          </View>

          {/* Body */}
          <View style={styles.body}>
            {initialLoading ? (
              <View style={styles.centerContainer}>
                <LoadingIndicator message="Đang tải danh sách thành viên dự án..." />
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <ErrorState
                  title="Không thể tải thành viên"
                  message={error}
                  onRetry={projectId ? () => loadInitialMembers(projectId) : undefined}
                  testID="assignee-picker-error"
                />
              </View>
            ) : filteredMembers.length === 0 ? (
              <View style={styles.centerContainer}>
                <EmptyState
                  title="Không có thành viên phù hợp"
                  description={
                    !projectId
                      ? 'Vui lòng chọn dự án trước.'
                      : search.trim().length > 0
                      ? 'Không tìm thấy thành viên nào phù hợp với tìm kiếm.'
                      : 'Dự án này chưa có thành viên hoạt động.'
                  }
                  testID="assignee-picker-empty"
                />
              </View>
            ) : (
              <FlatList
                data={filteredMembers}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onEndReached={loadMoreMembers}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  loadingMore ? (
                    <View style={styles.footerLoader} testID="assignee-picker-footer-loader">
                      <LoadingIndicator size="small" message="Đang tải thêm..." />
                    </View>
                  ) : undefined
                }
                renderItem={({ item }) => {
                  const isDisabled = disabledUserIds.includes(item.userId);
                  const isSelected = draftSelectedUserIds.includes(item.userId) || isDisabled;
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.itemRow,
                        {
                          borderBottomColor: theme.colors.border,
                          opacity: isDisabled ? 0.6 : 1,
                          backgroundColor: isSelected && !isDisabled
                            ? theme.colors.surfaceVariant
                            : pressed && !isDisabled
                            ? theme.colors.background
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        if (!isDisabled) {
                          toggleUserSelection(item.userId);
                        }
                      }}
                      disabled={isDisabled}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                      accessibilityLabel={`${item.fullName} (${item.projectRole})${isDisabled ? ' - Đã phân công' : ''}`}
                      testID={`assignee-option-${item.userId}`}
                    >
                      <View style={styles.itemTextContainer}>
                        <View style={styles.memberNameRow}>
                          <Text
                            style={[
                              theme.typography.body,
                              styles.memberName,
                              { color: isDisabled ? theme.colors.textSecondary : theme.colors.textPrimary },
                              isSelected && !isDisabled ? styles.fontBold : styles.fontMedium,
                            ]}
                            numberOfLines={1}
                          >
                            {item.fullName}
                          </Text>
                          {isDisabled ? (
                            <Text
                              style={[
                                theme.typography.caption,
                                styles.alreadyAssignedBadge,
                                { color: theme.colors.textSecondary },
                              ]}
                            >
                              (Đã phân công)
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            theme.typography.caption,
                            styles.memberRole,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Vai trò: {item.projectRole}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.checkboxOuter,
                          isDisabled
                            ? { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }
                            : isSelected
                            ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                            : { borderColor: theme.colors.textSecondary },
                        ]}
                      >
                        {isSelected ? (
                          <Text
                            style={[
                              styles.checkmark,
                              { color: isDisabled ? theme.colors.textSecondary : theme.colors.onPrimary },
                            ]}
                          >
                            ✓
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}
          </View>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <View style={styles.footerButtonWrapper}>
              <AppButton
                title="Bỏ chọn tất cả"
                variant="outline"
                onPress={handleClear}
                disabled={draftSelectedUserIds.length === 0}
                testID="btn-clear-assignee-select"
              />
            </View>
            <View style={styles.footerButtonWrapper}>
              <AppButton
                title={`Xác nhận (${draftSelectedUserIds.length})`}
                variant="primary"
                onPress={handleConfirm}
                testID="btn-confirm-assignee-select"
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
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '85%',
    minHeight: '50%',
    width: '100%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
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
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  body: {
    flex: 1,
    minHeight: 200,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alreadyAssignedBadge: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  memberName: {
    marginBottom: 2,
  },
  fontBold: {
    fontWeight: '700',
  },
  fontMedium: {
    fontWeight: '500',
  },
  memberRole: {
    marginTop: 2,
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButtonWrapper: {
    flex: 1,
  },
});
