import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';
import { AppButton } from './AppButton';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  description,
  actionTitle,
  onAction,
  icon,
  testID,
  style,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          padding: theme.spacing.xl,
        },
        style,
      ]}
      testID={testID ?? 'empty-state'}
      accessibilityRole="summary"
    >
      {icon ? <View style={[styles.iconSlot, { marginBottom: theme.spacing.md }]}>{icon}</View> : null}

      <Text
        style={[
          theme.typography.heading2,
          styles.textCenter,
          { color: theme.colors.textPrimary },
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>

      <Text
        style={[
          theme.typography.body,
          styles.textCenter,
          {
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.xs,
          },
        ]}
      >
        {description}
      </Text>

      {actionTitle && onAction ? (
        <View style={[styles.actionWrapper, { marginTop: theme.spacing.lg }]}>
          <AppButton
            title={actionTitle}
            onPress={onAction}
            variant="primary"
            testID={testID ? `${testID}-action-btn` : 'empty-state-action-btn'}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconSlot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionWrapper: {
    minWidth: 160,
  },
  textCenter: {
    textAlign: 'center',
  },
});
