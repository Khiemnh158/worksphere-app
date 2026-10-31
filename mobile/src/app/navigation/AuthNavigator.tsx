import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LoginScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '../../features/auth/screens';
import { useAppTheme } from '../providers/ThemeProvider';
import type { AuthStackParamList } from './types';
import { ActivateAccountScreen } from '../../features/auth/screens/ActivateAccountScreen';
import type { RecoveryLink } from './recoveryLinks';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator({ recovery }: { recovery?: RecoveryLink }) {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName={recovery?.screen ?? 'Login'}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          ...theme.typography.heading3,
          color: theme.colors.textPrimary,
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Quên mật khẩu' }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        initialParams={
          recovery?.screen === 'ResetPassword'
            ? { token: recovery.token }
            : undefined
        }
        options={{ title: 'Đặt lại mật khẩu' }}
      />
      <Stack.Screen
        name="ActivateAccount"
        component={ActivateAccountScreen}
        initialParams={
          recovery?.screen === 'ActivateAccount'
            ? { token: recovery.token }
            : undefined
        }
        options={{ title: 'Kích hoạt tài khoản' }}
      />
    </Stack.Navigator>
  );
}
