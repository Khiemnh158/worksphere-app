import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';

export interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
  color?: string;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingIndicator({
  size = 'small',
  message,
  fullScreen = false,
  color,
  accessibilityLabel = 'Đang tải...',
  testID,
  style,
}: LoadingIndicatorProps) {
  const theme = useAppTheme();
  const indicatorColor = color ?? theme.colors.primary;

  const content = (
    <View
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      testID={testID ?? 'loading-indicator'}
      style={[styles.container, style]}
    >
      <ActivityIndicator size={size} color={indicatorColor} />
      {message ? (
        <Text
          style={[
            theme.typography.body,
            styles.message,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreenWrapper,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullScreenWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
