import React, { ReactNode } from 'react';
import { SafeAreaProvider, Metrics } from 'react-native-safe-area-context';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from '../auth';
import { Theme } from '../../shared/theme';

export interface AppProvidersProps {
  children: ReactNode;
  theme?: Theme;
  initialMetrics?: Metrics | null;
}

export function AppProviders({ children, theme, initialMetrics }: AppProvidersProps) {
  return (
    <SafeAreaProvider {...(initialMetrics !== undefined ? { initialMetrics } : {})}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
