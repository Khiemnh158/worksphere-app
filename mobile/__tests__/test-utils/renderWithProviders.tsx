import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import type { Metrics } from 'react-native-safe-area-context';
import { AppProviders } from '../../src/app/providers';
import type { Theme } from '../../src/shared/theme';

export const TEST_INITIAL_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: Theme;
  initialMetrics?: Metrics | null;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions,
) {
  const { theme, initialMetrics = TEST_INITIAL_METRICS, ...renderOptions } = options || {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppProviders theme={theme} initialMetrics={initialMetrics}>
        {children}
      </AppProviders>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
