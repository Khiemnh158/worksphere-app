/**
 * Phase 14E-G2: Reusable User Directory Picker Modal
 * Supports single and multi-select modes for human-readable employee selection.
 *
 * Strict Privacy & UX Invariants:
 * - Never renders raw UUIDs in the UI.
 * - Displays human-readable fullName, username, email, and departmentName.
 * - Server-side search with 300ms debounce via useUserDirectory.
 * - Supports disabledIds with accessible reason label (e.g. "Đã tham gia").
 * - Touch targets >= 48dp, explicit accessibility labels and states.
 * - Controlled draft selection: cancels cleanly without leaking unconfirmed selections.
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
import { UserDirectoryItem } from '../api/directoryTypes';
import { useUserDirectory } from '../hooks/useUserDirectory';

export interface UserPickerModalProps {
  visible: boolean;
  mode?: 'single' | 'multiple';
  selectedIds?: string[];
  initialSelectedUsers?: UserDirectoryItem[];
  onConfirm: (selectedUsers: UserDirectoryItem[]) => void;
  onCancel: () => void;
  disabledIds?: string[];
  disabledReason?: string;
  title?: string;
  departmentId?: string;
  testID?: string;
}

const EMPTY_STRING_ARRAY: string[] = [];
const EMPTY_USERS_ARRAY: UserDirectoryItem[] = [];

function getInitials(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserPickerModal({
  visible,
  mode = 'single',
  selectedIds = EMPTY_STRING_ARRAY,
  initialSelectedUsers = EMPTY_USERS_ARRAY,
  onConfirm,
  onCancel,
  disabledIds = EMPTY_STRING_ARRAY,
  disabledReason = 'Đã tham gia',
  title = 'Chọn người dùng',
  departmentId,
  testID = 'user-picker-modal',
}: UserPickerModalProps) {
  const theme = useAppTheme();

  // Internal directory data hook, enabled only when modal is visible
  const {
    users,
    initialLoading,
    loadingMore,
    hasNext,
    error,
    paginationError,
    search,
    debouncedSearch,
    setSearch,
    loadMore,
    retry,
    retryPagination,
    reset,
  } = useUserDirectory({
    departmentId,
    enabled: visible,
  });

  // Local draft selection of IDs
  const [draftSelectedIds, setDraftSelectedIds] = useState<Set<string>>(
    () => new Set(selectedIds)
  );
  const draftSelectedIdsRef = useRef<Set<string>>(draftSelectedIds);
  draftSelectedIdsRef.current = draftSelectedIds;

  // Cache of known user items to resolve selected items even across pagination/search
  const knownUsersMapRef = useRef<Map<string, UserDirectoryItem>>(new Map());

  // Populate known users from initial props and incoming pages
  useEffect(() => {
    for (const u of initialSelectedUsers) {
      knownUsersMapRef.current.set(u.id, u);
    }
  }, [initialSelectedUsers]);

  useEffect(() => {
    for (const u of users) {
      knownUsersMapRef.current.set(u.id, u);
    }
  }, [users]);

  // Synchronize draft selection with props whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      const initialSet = new Set(selectedIds);
      draftSelectedIdsRef.current = initialSet;
      setDraftSelectedIds(initialSet);
    } else {
      reset();
    }
  }, [visible, selectedIds, reset]);

  const disabledIdSet = useMemo(() => new Set(disabledIds), [disabledIds]);

  const handleToggleSelect = useCallback(
    (user: UserDirectoryItem) => {
      if (disabledIdSet.has(user.id)) {
        return;
      }

      knownUsersMapRef.current.set(user.id, user);

      const next = new Set(mode === 'single' ? [] : draftSelectedIdsRef.current);
      if (mode === 'single') {
        next.add(user.id);
      } else {
        if (next.has(user.id)) {
          next.delete(user.id);
        } else {
          next.add(user.id);
        }
      }
      draftSelectedIdsRef.current = next;
      setDraftSelectedIds(next);
    },
    [disabledIdSet, mode]
  );

  const handleConfirm = useCallback(() => {
    const selectedUsers: UserDirectoryItem[] = [];
    for (const id of draftSelectedIdsRef.current) {
      const item = knownUsersMapRef.current.get(id) || users.find(u => u.id === id);
      if (item) {
        selectedUsers.push(item);
      }
    }
    onConfirm(selectedUsers);
  }, [onConfirm, users]);

  const renderUserItem = useCallback(
    ({ item }: { item: UserDirectoryItem }) => {
      const isSelected = draftSelectedIds.has(item.id);
      const isDisabled = disabledIdSet.has(item.id);
      const initials = getInitials(item.fullName);

      return (
        <Pressable
          testID={`user-picker-item-${item.username}`}
          disabled={isDisabled}
          onPress={() => handleToggleSelect(item)}
          accessible={true}
          accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
          accessibilityState={{
            selected: isSelected,
            disabled: isDisabled,
          }}
          accessibilityLabel={`${item.fullName}, username: ${item.username}, email: ${item.email}${
            item.departmentName ? `, phòng ban: ${item.departmentName}` : ''
          }${isDisabled ? `, ${disabledReason}` : ''}${isSelected ? ', Đã chọn' : ''}`}
          style={({ pressed }) => [
            styles.userRow,
            {
              backgroundColor: isSelected
                ? theme.colors.surfaceVariant
                : pressed
                ? theme.colors.surfaceVariant
                : theme.colors.surface,
              borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              opacity: isDisabled ? 0.5 : 1,
            },
          ]}
        >
          {/* Avatar / Initials circle */}
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: isSelected
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                {
                  color: isSelected ? theme.colors.surface : theme.colors.textPrimary,
                },
              ]}
            >
              {initials}
            </Text>
          </View>

          {/* User information */}
          <View style={styles.userInfo}>
            <Text
              style={[
                theme.typography.body,
                styles.fullName,
                { color: theme.colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {item.fullName}
            </Text>

            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              @{item.username} • {item.email}
            </Text>

            {item.departmentName ? (
              <View
                style={[
                  styles.departmentBadge,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    styles.departmentText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.departmentName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Status / Selection Indicator */}
          <View style={styles.actionColumn}>
            {isDisabled ? (
              <View
                style={[
                  styles.disabledBadge,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    styles.disabledText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {disabledReason}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  mode === 'single' ? styles.radioCircle : styles.checkboxSquare,
                  isSelected
                    ? { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary }
                    : { borderColor: theme.colors.border },
                ]}
              >
                {isSelected ? (
                  <Text
                    style={[
                      styles.indicatorCheckmark,
                      { color: theme.colors.surface },
                    ]}
                  >
                    ✓
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [
      draftSelectedIds,
      disabledIdSet,
      disabledReason,
      handleToggleSelect,
      mode,
      theme,
    ]
  );

  const renderEmptyComponent = useCallback(() => {
    if (initialLoading) {
      return null;
    }

    const isSearching = debouncedSearch.trim().length > 0;
    return (
      <EmptyState
        title="Không tìm thấy người dùng"
        description={
          isSearching
            ? 'Không tìm thấy người dùng phù hợp với từ khóa.'
            : 'Không tìm thấy người dùng phù hợp.'
        }
        testID="user-picker-empty-state"
      />
    );
  }, [initialLoading, debouncedSearch]);

  const renderFooterComponent = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader} testID="user-picker-footer-loading">
          <LoadingIndicator message="Đang tải thêm người dùng..." />
        </View>
      );
    }

    if (paginationError) {
      return (
        <View style={styles.footerError} testID="user-picker-footer-error">
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.error, marginBottom: theme.spacing.xs },
            ]}
          >
            {paginationError.message}
          </Text>
          <AppButton
            title="Thử lại"
            onPress={retryPagination}
            variant="outline"
            testID="user-picker-retry-pagination-btn"
          />
        </View>
      );
    }

    return null;
  }, [loadingMore, paginationError, retryPagination, theme]);

  const confirmTitle = useMemo(() => {
    if (mode === 'multiple' && draftSelectedIds.size > 0) {
      return `Xác nhận (${draftSelectedIds.size})`;
    }
    return 'Xác nhận';
  }, [mode, draftSelectedIds.size]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onCancel}
      testID={testID}
    >
      <View
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        {/* Header Bar */}
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.heading2,
              styles.headerTitle,
              { color: theme.colors.textPrimary },
            ]}
            accessibilityRole="header"
          >
            {title}
          </Text>
          <Pressable
            onPress={onCancel}
            testID="user-picker-close-btn"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Đóng bộ chọn người dùng"
            style={styles.closeButton}
          >
            <Text
              style={[
                styles.closeIconText,
                { color: theme.colors.textSecondary },
              ]}
            >
              ✕
            </Text>
          </Pressable>
        </View>

        {/* Search Bar Container */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo họ tên, username, email..."
            accessibilityLabel="Ô tìm kiếm người dùng"
            testID="user-picker-search-bar"
          />
        </View>

        {/* Body Content */}
        <View style={styles.body}>
          {initialLoading ? (
            <View style={styles.centered} testID="user-picker-loading-indicator">
              <LoadingIndicator message="Đang tải danh bạ người dùng..." />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <ErrorState
                title="Lỗi tải danh bạ"
                message={error.message}
                onRetry={error.retryable ? retry : undefined}
                testID="user-picker-error-state"
              />
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={item => item.id}
              renderItem={renderUserItem}
              ListEmptyComponent={renderEmptyComponent}
              ListFooterComponent={renderFooterComponent}
              onEndReached={hasNext ? loadMore : undefined}
              onEndReachedThreshold={0.4}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              testID="user-picker-flat-list"
            />
          )}
        </View>

        {/* Bottom Actions Bar */}
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <AppButton
            title="Hủy"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
            testID="user-picker-cancel-btn"
          />
          <AppButton
            title={confirmTitle}
            onPress={handleConfirm}
            variant="primary"
            style={styles.confirmButton}
            testID="user-picker-confirm-btn"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fullName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  departmentBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  departmentText: {
    fontSize: 11,
  },
  actionColumn: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorCheckmark: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  disabledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  disabledText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerError: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});
