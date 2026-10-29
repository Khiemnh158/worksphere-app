import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../../app/providers/ThemeProvider';

export interface MetricCardProps {
  label: string;
  value: number;
  highlight?: 'default' | 'warning' | 'info' | 'success';
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function MetricCard({
  label,
  value,
  highlight = 'default',
  testID,
  style,
}: MetricCardProps) {
  const theme = useAppTheme();

  const getHighlightColor = () => {
    switch (highlight) {
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      case 'success':
        return theme.colors.success;
      default:
        return theme.colors.primary;
    }
  };

  const color = getHighlightColor();

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
      testID={testID ?? `metric-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          padding: theme.spacing.sm,
        },
        style,
      ]}
    >
      <Text
        style={[
          theme.typography.caption,
          styles.label,
          { color: theme.colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[
          theme.typography.heading1,
          styles.value,
          { color },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    minWidth: 72,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginBottom: 4,
    textAlign: 'center',
  },
  value: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
