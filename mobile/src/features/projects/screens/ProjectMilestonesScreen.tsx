/**
 * Phase 14E: Project Milestones Screen (SCR-PRJ-08)
 * Comprehensive milestone listing and management for a project.
 *
 * Capabilities:
 * - Fetches milestones from GET /projects/{projectId}/milestones
 * - Milestone card display: name, description, status badge, formatted dueDate, completedAt
 * - Filter by status
 * - Pull-to-refresh
 * - "+ Thêm mốc" button opening CreateMilestoneModal (SCR-PRJ-09)
 * - Safe error handling & loading states
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
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
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingIndicator } from '../../../shared/components/LoadingIndicator';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { projectApi } from '../api/projectApi';
import {
  MilestoneItem,
  MilestoneStatus,
  MILESTONE_STATUS_VALUES,
} from '../api/projectTypes';
import { CreateMilestoneModal } from '../components/CreateMilestoneModal';
import { useProjectDetail } from '../hooks/useProjectDetail';

function formatDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return 'Chưa xác định';
  const datePart = isoOrDate.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoOrDate;
}

const STATUS_FILTER_LABELS: Record<MilestoneStatus, string> = {
  PLANNED: 'Kế hoạch',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  OVERDUE: 'Quá hạn',
  CANCELLED: 'Đã hủy',
};

export function ProjectMilestonesScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'ProjectMilestones'>>();
  const route = useRoute<MainTabScreenRouteProp<'ProjectMilestones'>>();
  const { projectId } = route.params;

  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | undefined>(undefined);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Authoritative capability derived strictly from server ProjectDetail.
  // Fails closed (false) while loading, on fetch failure, or if CREATE_MILESTONE is absent.
  const {
    project: projectDetail,
    refresh: refreshProjectDetail,
  } = useProjectDetail(projectId);
  const canCreateMilestone = !!projectDetail?.allowedActions?.includes('CREATE_MILESTONE');

  const mountedRef = useRef(true);

  const loadMilestones = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
      setRefreshError(null);
    } else {
      setInitialLoading(true);
      setError(null);
    }

    try {
      const data = await projectApi.listMilestones(projectId);
      if (!mountedRef.current) return;
      setMilestones(data);
      setError(null);
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (isRefresh) {
        setRefreshError(err?.message ?? 'Không thể làm mới danh sách mốc');
      } else {
        setError(err?.message ?? 'Không thể tải danh sách mốc tiến độ');
      }
    } finally {
      if (mountedRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    mountedRef.current = true;
    loadMilestones(false);
    return () => {
      mountedRef.current = false;
    };
  }, [loadMilestones]);

  const filteredMilestones = useMemo(() => {
    if (!statusFilter) return milestones;
    return milestones.filter(m => m.status === statusFilter);
  }, [milestones, statusFilter]);

  const handleMilestoneCreated = (created: MilestoneItem) => {
    setMilestones(prev => [created, ...prev]);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenIdHidden}>SCR-PRJ-08</Text>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại chi tiết dự án"
          testID="btn-milestones-back"
        >
          <Text style={[theme.typography.body, { color: theme.colors.primary, fontWeight: '600' }]}>← Quay lại</Text>
        </Pressable>

        {canCreateMilestone ? (
          <Pressable
            onPress={() => setCreateModalVisible(true)}
            style={[
              styles.createBtn,
              { backgroundColor: theme.colors.primary, borderRadius: theme.radii.medium },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tạo mốc tiến độ mới"
            testID="btn-create-milestone"
          >
            <Text style={[theme.typography.caption, { color: theme.colors.onPrimary, fontWeight: '600' }]}>
              + Thêm mốc
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={[theme.typography.heading1, styles.titleText, { color: theme.colors.textPrimary }]}>
        Mốc tiến độ ({milestones.length})
      </Text>

      {/* Refresh Error Banner */}
      {refreshError ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.errorContainer,
              borderColor: theme.colors.error,
              borderRadius: theme.radii.small,
            },
          ]}
          accessibilityRole="alert"
          testID="milestones-refresh-error-banner"
        >
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
            {refreshError}
          </Text>
        </View>
      ) : null}

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
        testID="milestones-status-filters"
      >
        <Pressable
          onPress={() => setStatusFilter(undefined)}
          style={[
            styles.filterChip,
            {
              borderRadius: theme.radii.full,
              borderColor: statusFilter === undefined ? theme.colors.primary : theme.colors.border,
              backgroundColor: statusFilter === undefined ? theme.colors.primary : theme.colors.surface,
            },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: statusFilter === undefined }}
          testID="filter-milestone-all"
        >
          <Text
            style={[
              theme.typography.caption,
              {
                color: statusFilter === undefined ? theme.colors.onPrimary : theme.colors.textPrimary,
                fontWeight: '600',
              },
            ]}
          >
            Tất cả
          </Text>
        </Pressable>

        {MILESTONE_STATUS_VALUES.map(st => {
          const isSelected = statusFilter === st;
          return (
            <Pressable
              key={st}
              onPress={() => setStatusFilter(st)}
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
              testID={`filter-milestone-${st.toLowerCase()}`}
            >
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: isSelected ? theme.colors.onPrimary : theme.colors.textPrimary,
                    fontWeight: '600',
                  },
                ]}
              >
                {STATUS_FILTER_LABELS[st]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (initialLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]} testID="milestones-loading">
        <LoadingIndicator size="large" message="Đang tải danh sách mốc tiến độ..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]} testID="milestones-error">
        <ErrorState
          title="Không thể tải mốc tiến độ"
          message={error}
          onRetry={() => loadMilestones(false)}
          testID="milestones-error-state"
        />
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButtonBottom}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          testID="btn-back-from-milestones-error"
        >
          <Text style={[theme.typography.body, { color: theme.colors.primary }]}>← Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID="screen-project-milestones">
      <FlatList<MilestoneItem>
        data={filteredMilestones}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            title="Chưa có mốc tiến độ"
            description="Dự án chưa có mốc tiến độ nào được thiết lập hoặc khớp với bộ lọc."
            testID="milestones-empty-state"
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              await Promise.all([loadMilestones(true), refreshProjectDetail()]);
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.milestoneCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.medium,
              },
            ]}
            testID={`milestone-item-${item.id}`}
          >
            <View style={styles.cardHeader}>
              <Text
                style={[
                  theme.typography.body,
                  styles.milestoneName,
                  { color: theme.colors.textPrimary },
                ]}
                testID={`milestone-name-${item.id}`}
              >
                {item.name}
              </Text>
              <StatusBadge status={item.status} testID={`milestone-status-${item.id}`} />
            </View>

            {item.description ? (
              <Text
                style={[
                  theme.typography.caption,
                  styles.milestoneDesc,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {item.description}
              </Text>
            ) : null}

            <View style={[styles.metaRow, { borderTopColor: theme.colors.border }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Hạn chót: <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>{formatDate(item.dueDate)}</Text>
              </Text>
              {item.completedAt ? (
                <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>
                  Hoàn thành: {formatDate(item.completedAt)}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      />

      {/* Create Milestone Modal (SCR-PRJ-09) - Gated strictly by canCreateMilestone */}
      {canCreateMilestone && createModalVisible ? (
        <CreateMilestoneModal
          visible={createModalVisible}
          projectId={projectId}
          onSuccess={handleMilestoneCreated}
          onClose={() => setCreateModalVisible(false)}
          testID="modal-create-milestone"
        />
      ) : null}
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
  createBtn: {
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
  banner: {
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
  milestoneCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneName: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  milestoneDesc: {
    marginTop: 6,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});
