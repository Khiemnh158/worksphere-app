/**
 * Phase 15C: TaskCard Component
 * Renders a canonical task item card for Task List Screen (SCR-TSK-01).
 *
 * Capabilities:
 * - Interactive Pressable when onPress callback is provided (navigates to TaskDetail).
 * - accessibilityRole="button" when interactive.
 * - Minimum touch target >= 48dp.
 * - Human-readable accessible label.
 *
 * Canonical Fields:
 * - title, project.name
 * - StatusBadge (type="task", task.status)
 * - PriorityBadge (task.priority)
 * - progressPercent (clamped 0..100)
 * - dueDate & overdue indicator
 * - assignees count / summary
 * - subtask progress (completedSubtaskCount / subtaskCount)
 * - commentCount
 *
 * Security & Presentation Invariants:
 * - Never renders raw UUIDs (id, parentTaskId, projectId, reporter.id).
 * - Never renders version or allowedActions.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';
import { PriorityBadge, StatusBadge } from '../../../shared/components';
import { TaskSummary } from '../api/taskTypes';

export interface TaskCardProps {
  task: TaskSummary;
  onPress?: (taskId: string) => void;
  testID?: string;
}

export function TaskCard({ task, onPress, testID }: TaskCardProps) {
  const theme = useAppTheme();

  // Defensive progress clamping: 0..100
  const clampedProgress = Math.max(0, Math.min(100, Math.round(task.progressPercent ?? 0)));

  // Format ISO due date to DD/MM/YYYY
  const formattedDueDate = task.dueDate
    ? task.dueDate.split('T')[0]?.split('-').reverse().join('/')
    : null;

  // Human-readable assignee text
  const assigneeText =
    task.assignees && task.assignees.length > 0
      ? task.assignees.length === 1
        ? task.assignees[0].fullName
        : `${task.assignees[0].fullName} +${task.assignees.length - 1}`
      : 'Chưa phân công';

  // Subtask progress indicator
  const hasSubtasks = task.subtaskCount > 0;
  const subtaskText = hasSubtasks
    ? `${task.completedSubtaskCount}/${task.subtaskCount} việc con`
    : null;

  const accessibleLabel = [
    `Công việc: ${task.title}`,
    `Dự án: ${task.project.name}`,
    `Trạng thái: ${task.status}`,
    `Độ ưu tiên: ${task.priority}`,
    `Tiến độ: ${clampedProgress}%`,
    formattedDueDate ? `Hạn chót: ${formattedDueDate}` : null,
    task.overdue ? 'Quá hạn' : null,
    `Người thực hiện: ${assigneeText}`,
    subtaskText,
    task.commentCount > 0 ? `${task.commentCount} bình luận` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const isInteractive = typeof onPress === 'function';

  const content = (
    <>
      {/* Header: Project Name + Badges */}
      <View style={styles.headerRow}>
        <Text
          style={[theme.typography.caption, styles.projectNameText, { color: theme.colors.primary }]}
          numberOfLines={1}
        >
          {task.project.name}
        </Text>
        <View style={styles.badgeRow}>
          <PriorityBadge priority={task.priority} />
          <View style={styles.badgeSpacer} />
          <StatusBadge type="task" status={task.status} />
        </View>
      </View>

      {/* Task Title */}
      <Text
        style={[theme.typography.heading3, styles.titleText, { color: theme.colors.textPrimary, marginTop: theme.spacing.xs }]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {/* Progress Bar */}
      <View style={[styles.progressSection, { marginTop: theme.spacing.sm }]}>
        <View style={styles.progressHeader}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Tiến độ
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textPrimary }, styles.progressPercentText]}>
            {clampedProgress}%
          </Text>
        </View>
        <View
          style={[
            styles.progressBarTrack,
            { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.radii.small },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radii.small,
                width: `${clampedProgress}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Footer Info: Due Date / Overdue + Assignee + Subtask/Comment counts */}
      <View style={[styles.footerRow, { marginTop: theme.spacing.sm }]}>
        {/* Assignee & Date */}
        <View style={styles.metaLeft}>
          <Text
            style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {assigneeText}
          </Text>
          {formattedDueDate ? (
            <View style={styles.dateRow}>
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: task.overdue ? theme.colors.error : theme.colors.textSecondary,
                  },
                  task.overdue ? styles.overdueDateText : styles.normalDateText,
                ]}
              >
                {task.overdue ? `Quá hạn: ${formattedDueDate}` : `Hạn: ${formattedDueDate}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Counts (Subtasks & Comments) */}
        <View style={styles.metaRight}>
          <View style={styles.badgeRow}>
            {subtaskText ? (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.radii.small },
                ]}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {subtaskText}
                </Text>
              </View>
            ) : null}
            {task.commentCount > 0 ? (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.radii.small },
                ]}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {task.commentCount} bình luận
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </>
  );

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.medium,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
  ];

  if (isInteractive) {
    return (
      <Pressable
        testID={testID ?? `task-card-${task.id}`}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibleLabel}
        onPress={() => onPress(task.id)}
        style={({ pressed }) => [
          ...cardStyle,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID ?? `task-card-${task.id}`}
      accessible={true}
      accessibilityLabel={accessibleLabel}
      style={cardStyle}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    minHeight: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectNameText: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeSpacer: {
    width: 6,
  },
  titleText: {
    fontWeight: '600',
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBarTrack: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  metaLeft: {
    flex: 1,
    marginRight: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  progressPercentText: {
    fontWeight: '600',
  },
  overdueDateText: {
    fontWeight: '600',
  },
  normalDateText: {
    fontWeight: '400',
  },
});
