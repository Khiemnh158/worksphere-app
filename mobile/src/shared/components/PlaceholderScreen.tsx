import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../app/providers/ThemeProvider';

export interface PlaceholderScreenProps {
  title: string;
  screenId?: string;
  subtitle?: string;
  testID?: string;
  children?: ReactNode;
}

export function PlaceholderScreen({
  title,
  screenId,
  subtitle = 'Phase 12 Shell Placeholder',
  testID,
  children,
}: PlaceholderScreenProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      testID={testID ?? `screen-${title.toLowerCase().replace(/\s+/g, '-')}`}
      accessibilityLabel={`${title} Screen`}
    >
      <View style={[styles.container, { padding: theme.spacing.md }]}>
        <View style={[styles.headerCard, {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.medium,
          borderColor: theme.colors.border,
          padding: theme.spacing.md,
          ...theme.shadows.level1,
        }]}>
          {screenId ? (
            <View style={[styles.badge, {
              backgroundColor: theme.colors.primaryContainer,
              borderRadius: theme.radii.small,
              paddingHorizontal: theme.spacing.xs,
              paddingVertical: theme.spacing.xxs,
              marginBottom: theme.spacing.xs,
            }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.onPrimaryContainer }]}>
                {screenId}
              </Text>
            </View>
          ) : null}

          <Text
            style={[theme.typography.heading1, { color: theme.colors.textPrimary }]}
            accessibilityRole="header"
          >
            {title}
          </Text>

          <Text style={[theme.typography.bodySmall, {
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.xs,
          }]}>
            {subtitle}
          </Text>
        </View>

        {children ? <View style={{ marginTop: theme.spacing.md }}>{children}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerCard: {
    borderWidth: 1,
  },
  badge: {
    alignSelf: 'flex-start',
  },
});
