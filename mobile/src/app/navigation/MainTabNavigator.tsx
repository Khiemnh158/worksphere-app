import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../../features/dashboard/screens';
import {
  ProjectsScreen,
  ProjectDetailScreen,
  CreateProjectScreen,
  EditProjectScreen,
  ProjectMembersScreen,
  ProjectMilestonesScreen,
} from '../../features/projects/screens';
import {
  TasksScreen,
  TaskDetailScreen,
  CreateTaskScreen,
  EditTaskScreen,
  SubtaskListScreen,
  TaskCommentsScreen,
} from '../../features/tasks/screens';
import { ServiceRequestsScreen } from '../../features/serviceRequests/screens';
import { MoreScreen, SettingsScreen } from '../../features/more/screens';
import {
  ProfileScreen,
  EditProfileScreen,
  ChangePasswordScreen,
} from '../../features/profile/screens';
import { useAppTheme } from '../providers/ThemeProvider';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const theme = useAppTheme();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          ...theme.typography.heading2,
          color: theme.colors.textPrimary,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 64,
        },
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarAccessibilityLabel: 'Tab 1: Dashboard',
          headerTitle: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarLabel: 'Dự án',
          tabBarAccessibilityLabel: 'Tab 2: Dự án',
          headerTitle: 'Dự án',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarLabel: 'Công việc',
          tabBarAccessibilityLabel: 'Tab 3: Công việc',
          headerTitle: 'Công việc',
        }}
      />
      <Tab.Screen
        name="ServiceRequests"
        component={ServiceRequestsScreen}
        options={{
          tabBarLabel: 'Yêu cầu',
          tabBarAccessibilityLabel: 'Tab 4: Yêu cầu',
          headerTitle: 'Yêu cầu dịch vụ',
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'Thêm',
          tabBarAccessibilityLabel: 'Tab 5: Thêm',
          headerTitle: 'Thêm',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Hồ sơ cá nhân',
        }}
      />
      <Tab.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Chỉnh sửa hồ sơ',
        }}
      />
      <Tab.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Đổi mật khẩu',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Cài đặt',
        }}
      />
      <Tab.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Chi tiết dự án',
        }}
      />
      <Tab.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Tạo dự án mới',
        }}
      />
      <Tab.Screen
        name="EditProject"
        component={EditProjectScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Chỉnh sửa dự án',
        }}
      />
      <Tab.Screen
        name="ProjectMembers"
        component={ProjectMembersScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Thành viên dự án',
        }}
      />
      <Tab.Screen
        name="ProjectMilestones"
        component={ProjectMilestonesScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Mốc tiến độ',
        }}
      />
      <Tab.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Chi tiết công việc',
        }}
      />
      <Tab.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Tạo công việc mới',
        }}
      />
      <Tab.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Chỉnh sửa công việc',
        }}
      />
      <Tab.Screen
        name="SubtaskList"
        component={SubtaskListScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Công việc con',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="TaskComments"
        component={TaskCommentsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerTitle: 'Bình luận',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
