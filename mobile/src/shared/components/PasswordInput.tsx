import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AppTextInput, AppTextInputProps } from './AppTextInput';
import { useAppTheme } from '../../app/providers/ThemeProvider';

export type PasswordInputProps = Omit<
  AppTextInputProps,
  'secureTextEntry' | 'trailingElement'
>;

export function PasswordInput(props: PasswordInputProps) {
  const theme = useAppTheme();
  const [isSecure, setIsSecure] = useState(true);

  const toggleSecure = () => {
    setIsSecure(prev => !prev);
  };

  const toggleAccessibilityLabel = isSecure ? 'Hiện mật khẩu' : 'Ẩn mật khẩu';
  const toggleText = isSecure ? 'Hiện' : 'Ẩn';

  const toggleButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={toggleAccessibilityLabel}
      onPress={toggleSecure}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.toggleButton,
        {
          minHeight: theme.minTouchTarget,
          minWidth: theme.minTouchTarget,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      testID={props.testID ? `${props.testID}-toggle` : 'password-visibility-toggle'}
    >
      <Text
        style={[
          theme.typography.label,
          styles.toggleText,
          { color: theme.colors.primary },
        ]}
      >
        {toggleText}
      </Text>
    </Pressable>
  );

  return (
    <AppTextInput
      {...props}
      secureTextEntry={isSecure}
      trailingElement={toggleButton}
    />
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  toggleText: {
    fontSize: 13,
  },
});
