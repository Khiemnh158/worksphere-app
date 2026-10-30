import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../../src/app/navigation/RootNavigator';
import { AuthContext } from '../../src/app/auth/AuthProvider';
import type { AuthContextValue } from '../../src/app/auth/authTypes';
import { ThemeProvider } from '../../src/app/providers/ThemeProvider';
import { theme } from '../../src/shared/theme';

jest.mock('../../src/features/workspace/WorkspaceNavigator', () => ({
  WorkspaceNavigator: () => {
    const { View } = require('react-native');
    return <View testID="workspace-root" />;
  },
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-screens', () => {
  const actual = jest.requireActual('react-native-screens');
  return {
    ...actual,
    enableScreens: jest.fn(),
  };
});

describe('RootNavigator Authentication Guard', () => {
  const createMockAuthContext = (
    sessionState: 'INITIALIZING' | 'UNAUTHENTICATED' | 'AUTHENTICATED',
  ): AuthContextValue => ({
    sessionState,
    operationState: 'idle',
    currentUser:
      sessionState === 'AUTHENTICATED'
        ? {
            id: 'u-1',
            username: 'test.user',
            email: 'test@worksphere.com',
            fullName: 'Test User',
            roles: ['ROLE_USER'],
            permissions: [],
          }
        : null,
    initialized: sessionState !== 'INITIALIZING',
    lastAuthError: null,
    login: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    logoutLocal: jest.fn(),
    retryBootstrap: jest.fn().mockResolvedValue(undefined),
    clearAuthError: jest.fn(),
  });

  async function renderGuardedNavigator(
    sessionState: 'INITIALIZING' | 'UNAUTHENTICATED' | 'AUTHENTICATED',
  ) {
    const authContext = createMockAuthContext(sessionState);
    return await render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={authContext}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthContext.Provider>
      </ThemeProvider>,
    );
  }

  test('when INITIALIZING: renders loading indicator and does NOT mount Auth or Main stacks', async () => {
    const { getByTestId, queryByTestId } = await renderGuardedNavigator(
      'INITIALIZING',
    );

    expect(getByTestId('root-initializing-state')).toBeTruthy();
    expect(getByTestId('root-initializing-indicator')).toBeTruthy();
    expect(queryByTestId('screen-login')).toBeNull();
    expect(queryByTestId('workspace-root')).toBeNull();
  });

  test('when UNAUTHENTICATED: renders Auth stack (LoginScreen) and strictly prevents Main stack access', async () => {
    const { getByTestId, queryByTestId } = await renderGuardedNavigator(
      'UNAUTHENTICATED',
    );

    expect(getByTestId('screen-login')).toBeTruthy();
    expect(queryByTestId('workspace-root')).toBeNull();
    expect(queryByTestId('root-initializing-state')).toBeNull();
  });

  test('when AUTHENTICATED: renders Main stack (Dashboard) and unmounts Auth stack', async () => {
    const { getByTestId, queryByTestId } = await renderGuardedNavigator(
      'AUTHENTICATED',
    );

    expect(getByTestId('workspace-root')).toBeTruthy();
    expect(queryByTestId('screen-login')).toBeNull();
    expect(queryByTestId('root-initializing-state')).toBeNull();
  });
});
