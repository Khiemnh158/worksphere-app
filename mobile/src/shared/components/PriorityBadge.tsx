import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PriorityBadgeProps {
  priority: PriorityLevel;
  label?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

const CANONICAL_PRIORITY_LABELS: Record<PriorityLevel, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Khẩn cấp',
};

export function PriorityBadge({
  priority,
  label,
  testID,
  style,
}: PriorityBadgeProps) {
  const theme = useAppTheme();

  const getPriorityColors = (): { bg: string; text: string; border: string } => {
    switch (priority) {
      case 'LOW':
        return {
          bg: theme.colors.surfaceVariant,
          text: theme.colors.textSecondary,
          border: theme.colors.border,
        };
      case 'MEDIUM':
        return {
          bg: theme.colors.primaryContainer,
          text: '#2563EB',
          border: '#93C5FD',
        };
      case 'HIGH':
        return {
          bg: theme.colors.warningContainer,
          text: theme.colors.warning,
          border: theme.colors.warning,
        };
      case 'CRITICAL':
        return {
          bg: theme.colors.errorContainer,
          text: theme.colors.error,
          border: theme.colors.error,
        };
    }
  };

  const colors = getPriorityColors();
  const displayLabel = label ?? CANONICAL_PRIORITY_LABELS[priority];

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderRadius: theme.radii.small,
          paddingHorizontal: theme.spacing.xs,
          paddingVertical: theme.spacing.xxs,
        },
        style,
      ]}
      testID={testID ?? `priority-badge-${priority.toLowerCase()}`}
      accessibilityLabel={`Độ ưu tiên: ${displayLabel}`}
    >
      <Text
        style={[
          theme.typography.caption,
          styles.badgeText,
          { color: colors.text },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontWeight: '500',
  },
});
