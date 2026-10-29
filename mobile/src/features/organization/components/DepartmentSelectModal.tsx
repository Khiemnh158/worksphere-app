/**
 * Phase 14E: Department Select Modal
 * Accessible modal allowing users to select an organization department.
 * - Displays human-readable department name and code.
 * - Never shows raw UUID.
 * - Supports client-side search by name and code.
 * - Accessible radio selection semantics with touch targets >= 48dp.
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import { departmentApi } from '../api/departmentApi';
import { DepartmentItem } from '../api/departmentTypes';

export interface DepartmentSelectModalProps {
  visible: boolean;
  selectedId?: string | null;
  onSelect: (department: DepartmentItem | null) => void;
  onClose: () => void;
  title?: string;
  testID?: string;
}

export function DepartmentSelectModal({
  visible,
  selectedId,
  onSelect,
  onClose,
  title = 'Chọn phòng ban',
  testID = 'department-select-modal',
}: DepartmentSelectModalProps) {
  const theme = useAppTheme();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draftSelectedId, setDraftSelectedId] = useState<string | null>(selectedId ?? null);

  useEffect(() => {
    if (visible) {
      setDraftSelectedId(selectedId ?? null);
      setSearch('');
      loadDepartments();
    }
  }, [visible, selectedId]);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await departmentApi.getDepartments();
      setDepartments(data.filter(d => d.active));
    } catch (err: any) {
      setError(err?.message ?? 'Không thể tải danh sách phòng ban');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }, [departments, search]);

  const handleConfirm = () => {
    const selected = departments.find(d => d.id === draftSelectedId) ?? null;
    onSelect(selected);
    onClose();
  };

  const handleClear = () => {
    setDraftSelectedId(null);
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
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radii.large,
              borderTopRightRadius: theme.radii.large,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng modal chọn phòng ban"
              testID={`${testID}-close-btn`}
              style={styles.closeBtn}
            >
              <Text style={[theme.typography.heading3, { color: theme.colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={styles.searchWrapper}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm theo tên hoặc mã phòng ban..."
              accessibilityLabel="Tìm kiếm phòng ban"
              testID={`${testID}-search-input`}
            />
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.centerContainer} testID={`${testID}-loading`}>
              <LoadingIndicator size="large" message="Đang tải phòng ban..." />
            </View>
          ) : error ? (
            <View style={styles.centerContainer} testID={`${testID}-error`}>
              <ErrorState
                title="Lỗi tải dữ liệu"
                message={error}
                onRetry={loadDepartments}
                testID={`${testID}-error-state`}
              />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerContainer} testID={`${testID}-empty`}>
              <EmptyState
                title="Không có phòng ban"
                description={
                  search ? 'Không tìm thấy phòng ban phù hợp với từ khóa.' : 'Chưa có dữ liệu phòng ban hoạt động.'
                }
                testID={`${testID}-empty-state`}
              />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              testID={`${testID}-list`}
              renderItem={({ item }) => {
                const isSelected = draftSelectedId === item.id;
                return (
                  <Pressable
                    onPress={() => setDraftSelectedId(item.id)}
                    style={({ pressed }) => [
                      styles.itemRow,
                      {
                        borderBottomColor: theme.colors.border,
                        backgroundColor: isSelected
                          ? theme.colors.surfaceVariant
                          : pressed
                          ? theme.colors.surfaceVariant
                          : 'transparent',
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${item.name}, mã ${item.code}`}
                    testID={`${testID}-item-${item.id}`}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={[theme.typography.body, styles.itemName, { color: theme.colors.textPrimary }]}>
                        {item.name}
                      </Text>
                      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                        Mã: {item.code}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioIndicator,
                        {
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        },
                      ]}
                      testID={`${testID}-radio-${item.id}`}
                    >
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          {/* Footer actions */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border, gap: theme.spacing.sm }]}>
            {draftSelectedId ? (
              <View style={styles.actionBtn}>
                <AppButton
                  title="Bỏ chọn"
                  onPress={handleClear}
                  variant="outline"
                  testID={`${testID}-clear-btn`}
                />
              </View>
            ) : null}
            <View style={styles.actionBtn}>
              <AppButton
                title="Hủy"
                onPress={onClose}
                variant="secondary"
                testID={`${testID}-cancel-btn`}
              />
            </View>
            <View style={styles.actionBtn}>
              <AppButton
                title="Xác nhận"
                onPress={handleConfirm}
                variant="primary"
                testID={`${testID}-confirm-btn`}
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
  sheet: {
    maxHeight: '80%',
    minHeight: '50%',
    width: '100%',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontWeight: '600',
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
