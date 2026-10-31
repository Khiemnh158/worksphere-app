import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../../app/providers/ThemeProvider';
import { normalizeError } from '../../shared/api/apiError';

export function useLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const result = await loader();
      if (id === sequence.current) setData(result);
    } catch (e) {
      if (id === sequence.current) {
        setError(normalizeError(e).message);
        setData(null);
      }
    } finally {
      if (id === sequence.current) setLoading(false);
    }
  }, [loader]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
      const listener = AppState.addEventListener('change', state => {
        if (state === 'active') void refresh();
      });
      return () => {
        sequence.current++;
        listener.remove();
      };
    }, [refresh]),
  );
  return { data, error, loading, refresh };
}
export function Copy({
  children,
  muted = false,
  title = false,
  selectable = false,
}: {
  children: ReactNode;
  muted?: boolean;
  title?: boolean;
  selectable?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Text
      selectable={selectable}
      style={{
        color: muted ? colors.textSecondary : colors.textPrimary,
        fontSize: title ? 22 : 14,
        fontWeight: title ? '700' : '400',
        lineHeight: title ? 30 : 22,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primaryContainer : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  busy = false,
  secondary = false,
  testID,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? colors.surfaceVariant : colors.primary,
          opacity: busy ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text
          style={{
            color: secondary ? colors.textPrimary : colors.onPrimary,
            fontWeight: '700',
            fontSize: 14,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChange,
  numeric = false,
  multiline = false,
  secure = false,
  placeholder,
  testID,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  numeric?: boolean;
  multiline?: boolean;
  secure?: boolean;
  placeholder?: string;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: 6, marginVertical: 6 }}>
      <Copy muted>{label}</Copy>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={numeric ? 'number-pad' : 'default'}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={{
          minHeight: multiline ? 100 : 48,
          padding: 12,
          borderWidth: 1,
          borderRadius: 12,
          borderColor: colors.border,
          color: colors.textPrimary,
          backgroundColor: colors.background,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}
export function Choices({
  values,
  value,
  onChange,
}: {
  values: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      {values.map(item => (
        <Pressable
          key={item.id}
          accessibilityRole="radio"
          accessibilityState={{ checked: item.id === value }}
          onPress={() => onChange(item.id)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor:
              value === item.id
                ? colors.primaryContainer
                : colors.surfaceVariant,
            borderWidth: 1,
            borderColor: value === item.id ? colors.primary : colors.border,
          }}
        >
          <Text style={{ color: colors.textPrimary }}>{item.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Page({
  children,
  loading,
  error,
  onRefresh,
}: {
  children: ReactNode;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}) {
  const { colors } = useAppTheme();
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!reduce && live) {
        fade.setValue(0);
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    });
    return () => {
      live = false;
      fade.stopAnimation();
    };
  }, [fade]);
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 36, gap: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      {onRefresh && (
        <Button
          title={loading ? 'Đang tải…' : 'Cập nhật dữ liệu ↻'}
          secondary
          onPress={onRefresh}
          busy={loading}
        />
      )}
      {!!error && (
        <View accessibilityRole="alert">
          <Card>
            <Copy>{error}</Copy>
            <Copy muted>
              Dữ liệu có thể đã đổi trên web. Tải lại trước khi thao tác tiếp.
            </Copy>
          </Card>
        </View>
      )}
      <Animated.View style={{ opacity: fade, gap: 14 }}>
        {children}
      </Animated.View>
    </ScrollView>
  );
}
export const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 10 },
  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
