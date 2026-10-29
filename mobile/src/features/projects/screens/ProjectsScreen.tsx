/**
 * Phase 14C: Project List Screen (SCR-PRJ-01)
 * Displays paginated list of projects backed by GET /projects.
 *
 * Capabilities:
 * - Controlled search bar with 300ms debounce.
 * - Canonical status filter chips: Tất cả, Bản nháp (DRAFT), Đang chạy (ACTIVE), Tạm dừng (ON_HOLD), Hoàn thành (COMPLETED).
 * - FlatList with onEndReached pagination and footer retry on error.
 * - Pull-to-refresh preserving existing list during refresh.
 * - Full-screen LoadingIndicator for initial load.
 * - Full-screen ErrorState with retry for initial load failures.
 * - Differentiated empty states: "Bạn chưa tham gia dự án nào" vs "Không tìm thấy dự án phù hợp".
 * - Navigates to ProjectDetail with projectId UUID on card click.
 * - Permission-gated Create Project button checking PROJECT_CREATE.
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
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { useAuth } from '../../../app/auth/AuthProvider';
import { MainTabNavProp } from '../../../app/navigation/types';
import { EmptyState, ErrorState, LoadingIndicator } from '../../../shared/components';
import { SearchBar } from '../../../shared/components/SearchBar';
import { ProjectStatus, ProjectSummary } from '../api/projectTypes';
import { ProjectCard } from '../components/ProjectCard';
import { useProjects } from '../hooks/useProjects';

interface StatusFilterOption {
  status: ProjectStatus | undefined;
  label: string;
}

/**
 * Canonical Project List Status Filter Chips (SCR-PRJ-01)
 * Source: design/02_SCREEN_INVENTORY.md & design/04_WIREFRAME_SPEC.md
 * Canonical chips: Tất cả, Đang chạy (ACTIVE), Bản nháp (DRAFT), Tạm dừng (ON_HOLD).
 * COMPLETED remains supported by backend and transport types, but is excluded from primary list chips per canonical UI wireframe.
 */
const STATUS_FILTERS: StatusFilterOption[] = [
  { status: undefined, label: 'Tất cả' },
  { status: 'ACTIVE', label: 'Đang chạy' },
  { status: 'DRAFT', label: 'Bản nháp' },
  { status: 'ON_HOLD', label: 'Tạm dừng' },
];

export function ProjectsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<MainTabNavProp<'Projects'>>();
  const { currentUser } = useAuth();
  const canCreateProject = currentUser?.permissions?.includes('PROJECT_CREATE') ?? false;

  const {
    projects,
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
    loadInitial,
    refresh,
    loadMore,
    retryPagination,
    clearFilters,
  } = useProjects();

  const handleCardPress = (projectId: string) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const isQueryActive = search.trim().length > 0 || statusFilter !== undefined;

  // 1. Initial Loading State
  if (initialLoading && projects.length === 0 && !error) {
    return (
      <View
        style={[styles.centerWrapper, { backgroundColor: theme.colors.background }]}
        testID="screen-projects"
      >
        <Text style={styles.screenIdHidden}>SCR-PRJ-01</Text>
        <LoadingIndicator size="large" message="Đang tải danh sách dự án..." fullScreen testID="projects-loading" />
      </View>
    );
  }

  // 2. Initial Error State
  if (error && projects.length === 0) {
    return (
      <View
        style={[styles.centerWrapper, { backgroundColor: theme.colors.background }]}
        testID="screen-projects"
      >
        <Text style={styles.screenIdHidden}>SCR-PRJ-01</Text>
        <ErrorState
          title="Không thể tải danh sách dự án"
          message={error.message}
          onRetry={loadInitial}
          retryTitle="Thử lại"
          traceId={error.traceId}
          testID="projects-initial-error"
        />
      </View>
    );
  }

  // Header Component (SearchBar + Filter Chips + Refresh Banner)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenIdHidden}>SCR-PRJ-01</Text>

      {/* Top Title Bar */}
      <View style={styles.topBar}>
        <View>
          <Text
            style={[theme.typography.heading1, styles.pageTitle, { color: theme.colors.textPrimary }]}
            accessibilityRole="header"
          >
            Dự án
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            SCR-PRJ-01: Quản lý và theo dõi tiến độ dự án
          </Text>
        </View>
        {canCreateProject ? (
          <Pressable
            onPress={() => navigation.navigate('CreateProject')}
            style={[
              styles.createButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radii.medium,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tạo dự án mới"
            testID="btn-create-project"
          >
            <Text
              style={[
                theme.typography.caption,
                styles.createButtonText,
                { color: theme.colors.onPrimary, fontWeight: '600' },
              ]}
            >
              + Tạo mới
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Controlled Search Bar */}
      <View style={{ marginTop: theme.spacing.sm }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Nhập tên hoặc mã dự án..."
          accessibilityLabel="Tìm kiếm dự án theo tên hoặc mã"
          testID="projects-search-bar"
        />
      </View>

      {/* Canonical Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterChipsRow, { marginTop: theme.spacing.sm }]}
        testID="projects-status-filters"
      >
        {STATUS_FILTERS.map(filter => {
          const isSelected = statusFilter === filter.status;
          return (
            <Pressable
              key={filter.label}
              onPress={() => setStatusFilter(filter.status)}
              testID={`filter-chip-${filter.status ? filter.status.toLowerCase() : 'all'}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Lọc theo trạng thái: ${filter.label}`}
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
            >
              <Text
                style={[
                  theme.typography.caption,
                  styles.filterChipText,
                  { color: isSelected ? theme.colors.onPrimary : theme.colors.textPrimary },
                ]}
              >
                {filter.label}
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
          testID="projects-refresh-error-banner"
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
        <View style={styles.footerLoader} testID="projects-footer-loader">
          <LoadingIndicator size="small" message="Đang tải thêm dự án..." />
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
          testID="projects-pagination-error"
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
          title="Không tìm thấy dự án phù hợp"
          description="Không có dự án nào khớp với từ khóa tìm kiếm hoặc bộ lọc trạng thái hiện tại."
          actionTitle="Xóa bộ lọc"
          onAction={clearFilters}
          testID="projects-empty-filtered"
        />
      );
    }

    return (
      <EmptyState
        title="Bạn chưa tham gia dự án nào"
        description="Bạn chưa được phân công hoặc chưa tham gia vào bất kỳ dự án nào trong hệ thống."
        testID="projects-empty-all"
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID="screen-projects">
      <FlatList<ProjectSummary>
        data={projects}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ProjectCard project={item} onPress={handleCardPress} />}
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
        testID="projects-flat-list"
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
    opacity: 0.01,
    height: 1,
    width: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerContainer: {
    marginBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontWeight: '700',
  },
  createButton: {
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontWeight: '600',
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterChip: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 32,
    borderWidth: 1,
  },
  filterChipText: {
    fontWeight: '600',
  },
  banner: {
    borderWidth: 1,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  paginationErrorContainer: {
    padding: 12,
    marginVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  errorCenterText: {
    textAlign: 'center',
  },
  retryPaginationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryBtnText: {
    fontWeight: '600',
  },
});
