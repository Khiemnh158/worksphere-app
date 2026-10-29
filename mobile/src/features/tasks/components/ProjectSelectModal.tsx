/**
 * Phase 15D: Project Select Modal
 * Accessible modal allowing users to select a Project for Task creation.
 * - Displays human-readable project code and name.
 * - Never shows raw UUID.
 * - Supports client-side search by code and name.
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
import { projectApi } from '../../projects/api/projectApi';
import { ProjectSummary } from '../../projects/api/projectTypes';

export interface ProjectSelectModalProps {
  visible: boolean;
  selectedProjectId?: string | null;
  onSelect: (project: ProjectSummary | null) => void;
  onClose: () => void;
  title?: string;
  testID?: string;
}

export function ProjectSelectModal({
  visible,
  selectedProjectId,
  onSelect,
  onClose,
  title = 'Chọn dự án',
  testID = 'project-select-modal',
}: ProjectSelectModalProps) {
  const theme = useAppTheme();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [draftSelectedId, setDraftSelectedId] = useState<string | null>(selectedProjectId ?? null);

  useEffect(() => {
    if (visible) {
      setDraftSelectedId(selectedProjectId ?? null);
      setSearch('');
      loadProjects();
    }
  }, [visible, selectedProjectId]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectApi.listProjects({ page: 0, size: 100 });
      setProjects(data.items);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách dự án';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const handleConfirm = () => {
    const selected = projects.find(p => p.id === draftSelectedId) ?? null;
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
              testID="btn-close-project-modal"
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
              placeholder="Tìm kiếm theo mã hoặc tên dự án..."
              testID="input-search-project"
            />
          </View>

          {/* Body */}
          <View style={styles.body}>
            {loading ? (
              <View style={styles.centerContainer}>
                <LoadingIndicator message="Đang tải danh sách dự án..." />
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <ErrorState
                  title="Không thể tải dự án"
                  message={error}
                  onRetry={loadProjects}
                  testID="project-select-error"
                />
              </View>
            ) : filteredProjects.length === 0 ? (
              <View style={styles.centerContainer}>
                <EmptyState
                  title="Không tìm thấy dự án"
                  description={
                    search.trim().length > 0
                      ? 'Không có dự án nào phù hợp với tìm kiếm.'
                      : 'Hiện chưa có dự án nào khả dụng.'
                  }
                  testID="project-select-empty"
                />
              </View>
            ) : (
              <FlatList
                data={filteredProjects}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isSelected = item.id === draftSelectedId;
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.itemRow,
                        {
                          borderBottomColor: theme.colors.border,
                          backgroundColor: isSelected
                            ? theme.colors.surfaceVariant
                            : pressed
                            ? theme.colors.background
                            : 'transparent',
                        },
                      ]}
                      onPress={() => setDraftSelectedId(item.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${item.code} - ${item.name}`}
                      testID={`project-option-${item.id}`}
                    >
                      <View style={styles.itemTextContainer}>
                        <Text
                          style={[
                            theme.typography.caption,
                            styles.projectCode,
                            { color: theme.colors.primary },
                          ]}
                        >
                          [{item.code}]
                        </Text>
                        <Text
                          style={[
                            theme.typography.body,
                            styles.projectName,
                            { color: theme.colors.textPrimary },
                            isSelected ? styles.fontBold : styles.fontRegular,
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {isSelected ? (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: theme.colors.primary },
                            ]}
                          />
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
                title="Bỏ chọn"
                variant="outline"
                onPress={handleClear}
                disabled={!draftSelectedId}
                testID="btn-clear-project-select"
              />
            </View>
            <View style={styles.footerButtonWrapper}>
              <AppButton
                title="Xác nhận"
                variant="primary"
                onPress={handleConfirm}
                testID="btn-confirm-project-select"
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
  projectCode: {
    fontWeight: '700',
    marginBottom: 2,
  },
  projectName: {
    flex: 1,
  },
  fontBold: {
    fontWeight: '700',
  },
  fontRegular: {
    fontWeight: '400',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
