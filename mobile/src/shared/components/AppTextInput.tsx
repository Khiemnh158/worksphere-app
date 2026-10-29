import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';

export interface AppTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  leadingElement?: React.ReactNode;
  trailingElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function AppTextInput({
  label,
  value,
  defaultValue,
  onChangeText,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  multiline = false,
  leadingElement,
  trailingElement,
  containerStyle,
  inputStyle,
  testID,
  accessibilityLabel,
  onFocus,
  onBlur,
  ...restProps
}: AppTextInputProps) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputProps['onFocus'] = e => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = e => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const hasError = !!error;

  const getBorderColor = (): string => {
    if (hasError) {
      return theme.colors.error;
    }
    if (isFocused) {
      return theme.colors.borderFocus;
    }
    return theme.colors.border;
  };

  const resolvedAccessibilityLabel =
    accessibilityLabel ?? label ?? placeholder ?? 'Input';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text
            style={[
              theme.typography.bodyMedium,
              styles.labelText,
              { color: disabled ? theme.colors.disabled : theme.colors.textPrimary },
            ]}
          >
            {label}
          </Text>
          {required ? (
            <Text
              style={[
                theme.typography.bodyMedium,
                styles.requiredStar,
                { color: theme.colors.error },
              ]}
              accessibilityLabel="bắt buộc"
            >
              {' *'}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled
              ? theme.colors.surfaceVariant
              : theme.colors.surface,
            borderColor: getBorderColor(),
            borderRadius: theme.radii.medium,
            paddingHorizontal: theme.spacing.sm,
            minHeight: theme.minTouchTarget,
          },
          multiline && styles.multilineContainer,
        ]}
      >
        {leadingElement ? (
          <View style={[styles.elementSlot, { marginRight: theme.spacing.xs }]}>
            {leadingElement}
          </View>
        ) : null}

        <TextInput
          value={value}
          defaultValue={defaultValue}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          editable={!disabled}
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={resolvedAccessibilityLabel}
          accessibilityState={{ disabled }}
          testID={testID}
          style={[
            theme.typography.body,
            styles.textInput,
            {
              color: disabled ? theme.colors.disabled : theme.colors.textPrimary,
            },
            inputStyle,
          ]}
          {...restProps}
        />

        {trailingElement ? (
          <View style={[styles.elementSlot, { marginLeft: theme.spacing.xs }]}>
            {trailingElement}
          </View>
        ) : null}
      </View>

      {hasError ? (
        <Text
          style={[
            theme.typography.bodySmall,
            styles.messageText,
            { color: theme.colors.error, marginTop: theme.spacing.xxs },
          ]}
          accessibilityRole="alert"
          testID={testID ? `${testID}-error` : undefined}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            theme.typography.bodySmall,
            styles.messageText,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.xxs },
          ]}
          testID={testID ? `${testID}-helper` : undefined}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelText: {
    fontWeight: '500',
  },
  requiredStar: {
    fontWeight: '500',
  },
  inputContainer: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  multilineContainer: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 44,
  },
  elementSlot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    paddingHorizontal: 2,
  },
});
