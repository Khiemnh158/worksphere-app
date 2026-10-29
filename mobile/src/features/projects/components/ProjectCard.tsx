/**
 * Phase 14C: ProjectCard Component
 * Renders a canonical project item card for Project List Screen (SCR-PRJ-01).
 *
 * Canonical Fields:
 * - code, name, description
 * - StatusBadge (ProjectStatus)
 * - PriorityBadge (ProjectPriority)
 * - manager.fullName
 * - progressPercent (clamped 0..100)
 * - memberCount
 * - taskSummary (completed / total)
 * - plannedEndDate formatted as dd/MM/yyyy
 *
 * Security & Presentation:
 * - Never renders raw UUIDs (id, managerId, departmentId).
 * - Minimum touch target >= 48dp.
 * - Accessible label includes project code, name, status, progress, and manager.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { PriorityBadge, StatusBadge } from '../../../shared/components';
import { ProjectSummary } from '../api/projectTypes';

export interface ProjectCardProps {
  project: ProjectSummary;
  onPress?: (projectId: string) => void;
  testID?: string;
}

export function ProjectCard({ project, onPress, testID }: ProjectCardProps) {
  const theme = useAppTheme();

  // Defensive progress clamping: 0..100
  const clampedProgress = Math.max(0, Math.min(100, Math.round(project.progressPercent ?? 0)));

  const handlePress = () => {
    if (onPress) {
      onPress(project.id);
    }
  };

  const formattedDate = project.plannedEndDate
    ? project.plannedEndDate.split('-').reverse().join('/')
    : 'Chưa xác định';

  return (
    <Pressable
      onPress={handlePress}
      testID={testID ?? `project-card-${project.code.toLowerCase()}`}
      accessibilityRole="button"
      accessibilityLabel={`Dự án ${project.code}: ${project.name}, Trạng thái: ${project.status}, Tiến độ: ${clampedProgress} phần trăm, Quản lý: ${project.manager.fullName}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Header: Code + Status Badge */}
      <View style={styles.headerRow}>
        <Text style={[theme.typography.caption, styles.codeText, { color: theme.colors.primary }]}>
          {project.code}
        </Text>
        <StatusBadge status={project.status} />
      </View>

      {/* Title */}
      <Text
        style={[
          theme.typography.heading2,
          styles.titleText,
          { color: theme.colors.textPrimary, marginTop: theme.spacing.xs },
        ]}
        numberOfLines={2}
      >
        {project.name}
      </Text>

      {/* Description */}
      {project.description ? (
        <Text
          style={[
            theme.typography.body,
            styles.descText,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
          ]}
          numberOfLines={2}
        >
          {project.description}
        </Text>
      ) : null}

      {/* Progress Bar */}
      <View style={[styles.progressSection, { marginTop: theme.spacing.sm }]}>
        <View style={styles.progressHeaderRow}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Tiến độ</Text>
          <Text style={[theme.typography.caption, styles.boldText, { color: theme.colors.textPrimary }]}>
            {clampedProgress}%
          </Text>
        </View>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.radii.small },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${clampedProgress}%`,
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radii.small,
              },
            ]}
          />
        </View>
      </View>

      {/* Metadata Row: Priority, Manager, Tasks, Due Date */}
      <View style={[styles.footerRow, { marginTop: theme.spacing.sm }]}>
        <PriorityBadge priority={project.priority} />
        <View style={{ width: theme.spacing.xs }} />
        <Text
          style={[theme.typography.caption, styles.managerText, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          QL: <Text style={{ color: theme.colors.textPrimary }}>{project.manager.fullName}</Text>
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          Hạn: {formattedDate}
        </Text>
      </View>

      {/* Secondary Meta Row: Members & Task Summary */}
      <View style={[styles.metaRow, { marginTop: theme.spacing.xs }]}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          Thành viên: <Text style={{ color: theme.colors.textPrimary }}>{project.memberCount} người</Text>
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          Công việc:{' '}
          <Text style={{ color: theme.colors.textPrimary }}>
            {project.taskSummary.completed}/{project.taskSummary.total}
          </Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    minHeight: 120,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleText: {
    fontWeight: '600',
  },
  descText: {
    lineHeight: 18,
  },
  progressSection: {
    width: '100%',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTrack: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boldText: {
    fontWeight: '600',
  },
  managerText: {
    flex: 1,
  },
});
