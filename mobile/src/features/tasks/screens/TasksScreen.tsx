/**
 * Phase 15B: Task List Screen (SCR-TSK-01)
 * Displays paginated list of tasks backed by GET /tasks.
 *
 * Capabilities:
 * - Controlled search bar with 300ms debounce.
 * - Canonical status filter chips: Tất cả, Cần làm (TODO), Đang làm (IN_PROGRESS), Đang kiểm tra (IN_REVIEW), Hoàn thành (COMPLETED).
 * - Canonical priority filter chips: Tất cả, Khẩn cấp (CRITICAL), Cao (HIGH), Trung bình (MEDIUM), Thấp (LOW).
 * - FlatList with ListHeaderComponent, onEndReached pagination, and footer retry on error.
 * - Pull-to-refresh preserving existing list during refresh.
 * - Full-screen LoadingIndicator for initial load.
 * - Full-screen ErrorState with retry for initial load failures.
 * - Differentiated empty states: "Bạn chưa có công việc nào" vs "Không tìm thấy công việc phù hợp".
 *
 * Staged Navigation Rule (15B):
 * - Presentation-only TaskCard (TaskDetail SCR-TSK-02 deferred to 15C).
 * - Create Task button absent in 15B (CreateTask SCR-TSK-03 deferred to 15D).
 * - Runtime Tab route retains exact name "Tasks".
 */

import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MainTabNavProp } from '../../../app/navigation/types';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { useAuth } from '../../../app/auth/AuthProvider';
import { EmptyState, ErrorState, LoadingIndicator } from '../../../shared/components';
import { SearchBar } from '../../../shared/components/SearchBar';
import { TaskPriority, TaskStatus, TaskSummary } from '../api/taskTypes';
import { TaskCard } from '../components/TaskCard';
import { useTasks } from '../hooks/useTasks';

interface StatusFilterOption {
  status: TaskStatus | undefined;
  label: string;
}

interface PriorityFilterOption {
  priority: TaskPriority | undefined;
  label: string;
}

const STATUS_FILTERS: StatusFilterOption[] = [
  { status: undefined, label: 'Tất cả trạng thái' },
  { status: 'TODO', label: 'Cần làm' },
  { status: 'IN_PROGRESS', label: 'Đang làm' },
  { status: 'IN_REVIEW', label: 'Đang kiểm tra' },
  { status: 'COMPLETED', label: 'Hoàn thành' },
];

const PRIORITY_FILTERS: PriorityFilterOption[] = [
  { priority: undefined, label: 'Tất cả ưu tiên' },
  { priority: 'CRITICAL', label: 'Khẩn cấp' },
  { priority: 'HIGH', label: 'Cao' },
  { priority: 'MEDIUM', label: 'Trung bình' },
  { priority: 'LOW', label: 'Thấp' },
];

export function TasksScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'Tasks'>>();
  const { currentUser } = useAuth();
  const canCreateTask = currentUser?.permissions?.includes('TASK_CREATE') ?? false;

  const {
    tasks,
    initialLoading,
    refreshing,
    loadingMore,
    error,
    paginationError,
    refreshError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    loadInitial,
    refresh,
    loadMore,
    retryPagination,
    clearFilters,
  } = useTasks();

  const isQueryActive =
    search.trim().length > 0 || statusFilter !== undefined || priorityFilter !== undefined;

  // 1. Initial Loading State
  if (initialLoading && tasks.length === 0 && !error) {
    return (
      <View
        style={[styles.centerWrapper, { backgroundColor: theme.colors.background }]}
        testID="screen-tasks"
      >
        <Text style={styles.screenIdHidden}>SCR-TSK-01</Text>
        <LoadingIndicator
          size="large"
          message="Đang tải danh sách công việc..."
          fullScreen
          testID="tasks-loading"
        />
      </View>
    );
  }

  // 2. Initial Error State
  if (error && tasks.length === 0) {
    return (
      <View
        style={[styles.centerWrapper, { backgroundColor: theme.colors.background }]}
        testID="screen-tasks"
      >
        <Text style={styles.screenIdHidden}>SCR-TSK-01</Text>
        <ErrorState
          title="Không thể tải danh sách công việc"
          message={error.message}
          onRetry={loadInitial}
          retryTitle="Thử lại"
          testID="tasks-error"
        />
      </View>
    );
  }

  // Header Component (SearchBar + Filter Chips + Refresh Banner)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenIdHidden}>SCR-TSK-01</Text>

      {/* Top Title Bar */}
      <View style={styles.topBar}>
        <View style={styles.titleContainer}>
          <Text
            style={[theme.typography.heading1, styles.pageTitle, { color: theme.colors.textPrimary }]}
            accessibilityRole="header"
          >
            Công việc
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            SCR-TSK-01: Quản lý và theo dõi tiến độ công việc
          </Text>
        </View>

        {canCreateTask ? (
          <Pressable
            onPress={() => navigation.navigate('CreateTask')}
            style={({ pressed }) => [
              styles.createButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radii.small,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tạo công việc mới"
            testID="tasks-create-button"
          >
            <Text style={[theme.typography.caption, styles.createButtonText, { color: theme.colors.onPrimary }]}>
              + Tạo mới
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Search Bar */}
      <View style={{ marginTop: theme.spacing.sm }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm kiếm công việc..."
          accessibilityLabel="Tìm kiếm công việc theo tiêu đề"
          testID="tasks-search-bar"
        />
      </View>

      {/* Status Filter Chips Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterChipsRow, { marginTop: theme.spacing.sm }]}
        testID="tasks-status-filters"
      >
        {STATUS_FILTERS.map(f => {
          const isSelected = statusFilter === f.status;
          return (
            <Pressable
              key={`status-${f.label}`}
              onPress={() => setStatusFilter(f.status)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Lọc theo trạng thái: ${f.label}`}
              style={[
                styles.filterChip,
                {
                  borderRadius: theme.radii.full,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  marginRight: theme.spacing.xs,
                },
              ]}
              testID={`filter-chip-status-${f.status ? f.status.toLowerCase() : 'all'}`}
            >
              <Text
                style={[
                  theme.typography.caption,
                  styles.filterChipText,
                  { color: isSelected ? theme.colors.onPrimary : theme.colors.textPrimary },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Priority Filter Chips Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterChipsRow, { marginTop: theme.spacing.xs }]}
        testID="tasks-priority-filters"
      >
        {PRIORITY_FILTERS.map(f => {
          const isSelected = priorityFilter === f.priority;
          return (
            <Pressable
              key={`priority-${f.label}`}
              onPress={() => setPriorityFilter(f.priority)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Lọc theo độ ưu tiên: ${f.label}`}
              style={[
                styles.filterChip,
                {
                  borderRadius: theme.radii.full,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  marginRight: theme.spacing.xs,
                },
              ]}
              testID={`filter-chip-priority-${f.priority ? f.priority.toLowerCase() : 'all'}`}
            >
              <Text
                style={[
                  theme.typography.caption,
                  styles.filterChipText,
                  { color: isSelected ? theme.colors.onPrimary : theme.colors.textPrimary },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Non-blocking Refresh Error Banner */}
      {refreshError ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.errorContainer,
              borderColor: theme.colors.error,
              borderRadius: theme.radii.small,
              padding: theme.spacing.sm,
              marginTop: theme.spacing.sm,
            },
          ]}
          testID="tasks-refresh-error-banner"
          accessibilityRole="alert"
        >
          <Text style={[theme.typography.caption, { color: theme.colors.error }]}>
            {refreshError}
          </Text>
        </View>
      ) : null}
    </View>
  );

  // Footer Component (Loading more indicator / Pagination error retry)
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader} testID="tasks-footer-loader">
          <LoadingIndicator size="small" message="Đang tải thêm công việc..." />
        </View>
      );
    }

    if (paginationError) {
      return (
        <View
          style={[
            styles.paginationErrorContainer,
            { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.radii.small },
          ]}
          testID="tasks-pagination-error"
        >
          <Text style={[theme.typography.caption, styles.errorCenterText, { color: theme.colors.error }]}>
            {paginationError.message}
          </Text>
          <Pressable
            onPress={retryPagination}
            style={[styles.retryPaginationBtn, { backgroundColor: theme.colors.primary }]}
            testID="btn-retry-pagination"
            accessibilityRole="button"
            accessibilityLabel="Thử tải lại trang kế tiếp"
          >
            <Text style={[theme.typography.caption, styles.retryBtnText, { color: theme.colors.onPrimary }]}>
              Thử lại
            </Text>
          </Pressable>
        </View>
      );
    }

    return <View style={{ height: theme.spacing.xl }} />;
  };

  // Empty Component
  const renderEmpty = () => {
    if (initialLoading) {
      return null;
    }

    if (isQueryActive) {
      return (
        <EmptyState
          title="Không tìm thấy công việc phù hợp"
          description="Không có công việc nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại."
          actionTitle="Xóa bộ lọc"
          onAction={clearFilters}
          testID="tasks-empty-filtered"
        />
      );
    }

    return (
      <EmptyState
        title="Bạn chưa có công việc nào"
        description="Các công việc được giao hoặc do bạn tạo sẽ xuất hiện tại đây."
        testID="tasks-empty-all"
      />
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-tasks"
    >
      <FlatList<TaskSummary>
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={taskId => {
              navigation.navigate('TaskDetail', { taskId });
            }}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        testID="tasks-flatlist"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenIdHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  createButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontWeight: '700',
  },
  pageTitle: {
    fontWeight: '700',
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontWeight: '500',
  },
  banner: {
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationErrorContainer: {
    marginVertical: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCenterText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  retryPaginationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    fontWeight: '600',
  },
});
