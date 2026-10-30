import React, { createContext, useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../app/auth';
import { useAppTheme } from '../../app/providers/ThemeProvider';
import { workspaceApi, WorkplaceContext } from './api';
import { Button, Copy, Page, useLoad } from './ui';
import { HomeScreen, WorkScreen, WorkDetailScreen } from './WorkScreens';
import {
  TicketListScreen,
  TicketDetailScreen,
  CreateTicketScreen,
} from './TicketScreens';
import { TimeScreen, TimeRequestScreen } from './TimeScreens';
import {
  AccountScreen,
  DirectoryScreen,
  IncomeScreen,
  NoticesScreen,
} from './AccountScreens';

export type WorkspaceRoutes = {
  WorkspaceTabs: undefined;
  WorkDetail: { id: string };
  TicketDetail: { id: string };
  CreateTicket: undefined;
  TimeRequest: undefined;
  Directory: undefined;
  Income: undefined;
  Notices: undefined;
};
export type WorkspaceNavigation = NativeStackNavigationProp<WorkspaceRoutes>;
const Stack = createNativeStackNavigator<WorkspaceRoutes>();
const Tabs = createBottomTabNavigator();
const Context = createContext<{
  context: WorkplaceContext;
  reload: () => Promise<void>;
} | null>(null);
export function useWorkplace() {
  const value = useContext(Context);
  if (!value) throw new Error('Workplace context required');
  return value;
}
function WorkspaceTabs() {
  const { colors } = useAppTheme();
  const { context } = useWorkplace();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 66,
        },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 5 },
      }}
    >
      <Tabs.Screen
        name="Today"
        component={HomeScreen}
        options={{
          title: 'Hôm nay',
          tabBarAccessibilityLabel: 'Tab: Hôm nay',
          tabBarIcon: () => <Copy>◷</Copy>,
        }}
      />
      {!context.admin && (
        <Tabs.Screen
          name="Work"
          component={WorkScreen}
          options={{
            title: 'Công việc',
            tabBarAccessibilityLabel: 'Tab: Công việc',
            tabBarIcon: () => <Copy>✓</Copy>,
          }}
        />
      )}
      {!context.admin && (
        <Tabs.Screen
          name="Support"
          component={TicketListScreen}
          options={{
            title: 'Hỗ trợ',
            tabBarAccessibilityLabel: 'Tab: Hỗ trợ',
            tabBarIcon: () => <Copy>↗</Copy>,
          }}
        />
      )}
      {!context.admin && (
        <Tabs.Screen
          name="Time"
          component={TimeScreen}
          options={{
            title: 'Chấm công',
            tabBarAccessibilityLabel: 'Tab: Chấm công',
            tabBarIcon: () => <Copy>▦</Copy>,
          }}
        />
      )}
      <Tabs.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Cá nhân',
          tabBarAccessibilityLabel: 'Tab: Cá nhân',
          tabBarIcon: () => <Copy>◎</Copy>,
        }}
      />
    </Tabs.Navigator>
  );
}
export function WorkspaceNavigator() {
  const { colors } = useAppTheme();
  const { logout } = useAuth();
  const state = useLoad(workspaceApi.context);
  if (!state.data)
    return (
      <Page
        error={state.error}
        loading={state.loading}
        onRefresh={state.refresh}
      >
        <View style={{ paddingTop: 80, gap: 24 }}>
          <Copy title>Không gian của bạn</Copy>
          {state.loading && <ActivityIndicator color={colors.primary} />}
          <Button title="Đăng xuất" secondary onPress={() => void logout()} />
        </View>
      </Page>
    );
  return (
    <Context.Provider value={{ context: state.data, reload: state.refresh }}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="WorkspaceTabs"
          component={WorkspaceTabs}
          options={({ navigation }) => ({
            title: 'w· worksphere',
            headerRight: () => (
              <Button
                secondary
                title="Thông báo"
                onPress={() => navigation.navigate('Notices')}
              />
            ),
          })}
        />
        <Stack.Screen
          name="WorkDetail"
          component={WorkDetailScreen}
          options={{ title: 'Chi tiết công việc' }}
        />
        <Stack.Screen
          name="TicketDetail"
          component={TicketDetailScreen}
          options={{ title: 'Yêu cầu hỗ trợ' }}
        />
        <Stack.Screen
          name="CreateTicket"
          component={CreateTicketScreen}
          options={{ title: 'Gửi yêu cầu' }}
        />
        <Stack.Screen
          name="TimeRequest"
          component={TimeRequestScreen}
          options={{ title: 'Đơn công, nghỉ & tăng ca' }}
        />
        <Stack.Screen
          name="Directory"
          component={DirectoryScreen}
          options={{ title: 'Danh bạ phòng bạn' }}
        />
        <Stack.Screen
          name="Income"
          component={IncomeScreen}
          options={{ title: 'Phiếu thu nhập của tôi' }}
        />
        <Stack.Screen
          name="Notices"
          component={NoticesScreen}
          options={{ title: 'Thông báo' }}
        />
      </Stack.Navigator>
    </Context.Provider>
  );
}
