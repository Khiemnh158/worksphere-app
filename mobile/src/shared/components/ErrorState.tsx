import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';
import { AppButton } from './AppButton';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryTitle?: string;
  traceId?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message,
  onRetry,
  retryTitle = 'Thử lại',
  traceId,
  testID,
  style,
}: ErrorStateProps) {
  const theme = useAppTheme();

  return (
    <View
      accessible={true}
      style={[
        styles.container,
        {
          padding: theme.spacing.xl,
        },
        style,
      ]}
      testID={testID ?? 'error-state'}
      accessibilityRole="alert"
    >
      <Text
        style={[
          theme.typography.heading2,
          styles.textCenter,
          { color: theme.colors.error },
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
        {message}
      </Text>

      {traceId ? (
        <Text
          style={[
            theme.typography.caption,
            styles.textCenter,
            {
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          {`Mã tham chiếu: ${traceId}`}
        </Text>
      ) : null}

      {onRetry ? (
        <View style={[styles.actionWrapper, { marginTop: theme.spacing.lg }]}>
          <AppButton
            title={retryTitle}
            onPress={onRetry}
            variant="outline"
            testID={testID ? `${testID}-retry-btn` : 'error-state-retry-btn'}
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
  actionWrapper: {
    minWidth: 160,
  },
  textCenter: {
    textAlign: 'center',
  },
});
