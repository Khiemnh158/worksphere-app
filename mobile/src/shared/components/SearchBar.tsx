import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../app/providers/ThemeProvider';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Tìm kiếm...',
  onSubmitEditing,
  autoFocus = false,
  accessibilityLabel = 'Ô tìm kiếm',
  testID,
  style,
}: SearchBarProps) {
  const theme = useAppTheme();

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const hasValue = !!value && value.length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: theme.radii.medium,
          borderColor: theme.colors.border,
          minHeight: theme.minTouchTarget,
          paddingHorizontal: theme.spacing.sm,
        },
        style,
      ]}
      testID={testID ?? 'search-bar'}
    >
      <Text
        style={[
          styles.searchIcon,
          { color: theme.colors.textSecondary, marginRight: theme.spacing.xs },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        🔍
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="search"
        testID={testID ? `${testID}-input` : 'search-bar-input'}
        style={[
          theme.typography.body,
          styles.input,
          { color: theme.colors.textPrimary },
        ]}
      />

      {hasValue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xóa tìm kiếm"
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.clearButton,
            {
              minHeight: theme.minTouchTarget,
              minWidth: theme.minTouchTarget,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
          testID={testID ? `${testID}-clear-btn` : 'search-bar-clear-btn'}
        >
          <Text
            style={[
              theme.typography.bodyMedium,
              styles.clearText,
              { color: theme.colors.textSecondary },
            ]}
          >
            ✕
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  searchIcon: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 44,
  },
  clearButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
