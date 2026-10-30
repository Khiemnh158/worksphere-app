import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { WorkspaceNavigator } from '../../features/workspace/WorkspaceNavigator';
import { useAppTheme } from '../providers/ThemeProvider';
import { useAuth } from '../auth';
import type { RootStackParamList, SessionState } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export interface RootNavigatorProps {
  sessionState?: SessionState;
}

export function RootNavigator({
  sessionState: explicitSessionState,
}: RootNavigatorProps) {
  const theme = useAppTheme();
  const auth = useAuth();
  const sessionState = explicitSessionState ?? auth.sessionState;

  if (sessionState === 'INITIALIZING') {
    if (auth.canRetryBootstrap) {
      return (
        <SafeAreaView
          style={[
            styles.centerContainer,
            {
              backgroundColor: theme.colors.background,
              padding: theme.spacing.lg,
            },
          ]}
          testID="root-bootstrap-error-state"
        >
          <Text
            style={[
              theme.typography.heading2,
              styles.centerText,
              { color: theme.colors.error, marginBottom: theme.spacing.sm },
            ]}
          >
            Không thể kết nối đến máy chủ
          </Text>
          <Text
            style={[
              theme.typography.body,
              styles.centerText,
              {
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            {auth.lastAuthError?.message ||
              'Vui lòng kiểm tra lại đường truyền mạng và thử lại.'}
          </Text>
          <Text
            onPress={() => auth.retryBootstrap()}
            style={[
              theme.typography.bodyMedium,
              {
                color: theme.colors.primary,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
              },
            ]}
            accessibilityRole="button"
            testID="root-bootstrap-retry-button"
          >
            Thử lại
          </Text>
          <Text
            onPress={() => auth.logoutLocal()}
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, padding: theme.spacing.sm },
            ]}
            accessibilityRole="button"
            testID="root-bootstrap-login-button"
          >
            Đăng nhập lại
          </Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
        testID="root-initializing-state"
        accessibilityLabel="Loading Initializing State"
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          testID="root-initializing-indicator"
        />
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
          ]}
        >
          Đang khởi tạo ứng dụng...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {sessionState === 'AUTHENTICATED' ? (
        <Stack.Screen
          name="Main"
          component={WorkspaceNavigator}
          navigationKey={auth.currentUser?.id ?? 'session'}
        />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
