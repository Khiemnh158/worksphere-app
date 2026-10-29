import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'text';

export interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  textStyle,
}: AppButtonProps) {
  const theme = useAppTheme();
  const isInteractive = !disabled && !loading;

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    if (disabled) {
      if (variant === 'outline' || variant === 'text') {
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: variant === 'outline' ? theme.colors.disabled : 'transparent',
            borderWidth: variant === 'outline' ? 1 : 0,
          },
          text: {
            color: theme.colors.disabled,
          },
        };
      }
      return {
        container: {
          backgroundColor: theme.colors.disabledContainer,
          borderColor: 'transparent',
          borderWidth: 0,
        },
        text: {
          color: theme.colors.disabled,
        },
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.border,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.textPrimary,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: theme.colors.primary,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.primary,
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: theme.colors.error,
            borderColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: theme.colors.onError,
          },
        };
      case 'text':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: theme.colors.primary,
          },
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: theme.colors.primary,
            borderColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: theme.colors.onPrimary,
          },
        };
    }
  };

  const spinnerColor = (() => {
    if (variant === 'primary' || variant === 'danger') {
      return theme.colors.onPrimary;
    }
    return theme.colors.primary;
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled: !isInteractive,
        busy: loading,
      }}
      disabled={!isInteractive}
      onPress={isInteractive ? onPress : undefined}
      testID={testID}
      style={({ pressed }) => [
        styles.baseButton,
        {
          borderRadius: theme.radii.medium,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        },
        getVariantStyles().container,
        pressed && isInteractive && styles.pressed,
        style,
        {
          minHeight: theme.minTouchTarget,
        },
      ]}
    >
      {() => (
        loading ? (
          <ActivityIndicator
            size="small"
            color={spinnerColor}
            testID={testID ? `${testID}-loading` : 'button-loading-indicator'}
          />
        ) : (
          <Text
            style={[
              theme.typography.label,
              styles.baseText,
              getVariantStyles().text,
              textStyle,
            ]}
          >
            {title}
          </Text>
        )
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  baseText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
