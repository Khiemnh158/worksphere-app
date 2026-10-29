import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { theme, colors, spacing, radii, typography, shadows, minTouchTarget } from '../src/shared/theme';
import { ThemeProvider, useAppTheme } from '../src/app/providers/ThemeProvider';

describe('Design Tokens Verification', () => {
  test('primary and semantic colors match exact canonical design system tokens', () => {
    expect(colors.primary).toBe('#1E3A8A');
    expect(colors.onPrimary).toBe('#FFFFFF');
    expect(colors.background).toBe('#F8FAFC');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.error).toBe('#DC2626');
    expect(colors.warning).toBe('#D97706');
    expect(colors.success).toBe('#16A34A');
    expect(colors.info).toBe('#0284C7');
    expect(colors.textPrimary).toBe('#0F172A');
    expect(colors.textSecondary).toBe('#64748B');
  });

  test('spacing scale values are numbers and strictly increasing', () => {
    expect(spacing.xxs).toBe(4);
    expect(spacing.xs).toBe(8);
    expect(spacing.sm).toBe(12);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(20);
    expect(spacing.xl).toBe(24);
    expect(spacing.xxl).toBe(32);
    expect(spacing.huge).toBe(40);

    expect(spacing.xxs < spacing.xs).toBe(true);
    expect(spacing.xs < spacing.sm).toBe(true);
    expect(spacing.sm < spacing.md).toBe(true);
    expect(spacing.md < spacing.lg).toBe(true);
    expect(spacing.lg < spacing.xl).toBe(true);
    expect(spacing.xl < spacing.xxl).toBe(true);
    expect(spacing.xxl < spacing.huge).toBe(true);
  });

  test('minimum touch target equals 48', () => {
    expect(minTouchTarget).toBe(48);
    expect(typeof minTouchTarget).toBe('number');
  });

  test('radii scale values match canonical tokens and are numbers', () => {
    expect(radii.small).toBe(4);
    expect(radii.medium).toBe(8);
    expect(radii.large).toBe(16);
    expect(radii.full).toBe(9999);

    Object.values(radii).forEach(val => {
      expect(typeof val).toBe('number');
      expect(typeof val).not.toBe('string');
    });
  });

  test('typography scale representative values and numeric types', () => {
    expect(typography.display.fontSize).toBe(28);
    expect(typography.display.lineHeight).toBe(36);
    expect(typography.heading1.fontSize).toBe(22);
    expect(typography.heading1.lineHeight).toBe(28);
    expect(typography.body.fontSize).toBe(14);
    expect(typography.body.lineHeight).toBe(20);
    expect(typography.caption.fontSize).toBe(11);
    expect(typography.caption.lineHeight).toBe(14);

    // Verify no accidental CSS string values (e.g. "16px")
    Object.values(typography).forEach(style => {
      expect(typeof style.fontSize).toBe('number');
      expect(typeof style.lineHeight).toBe('number');
    });
  });

  test('shadow levels define elevations and shadow properties', () => {
    expect(shadows.level0.elevation).toBe(0);
    expect(shadows.level1.elevation).toBe(1);
    expect(shadows.level2.elevation).toBe(3);
    expect(shadows.level3.elevation).toBe(6);
    expect(shadows.level4.elevation).toBe(8);
  });

  test('composite theme object aggregates all tokens', () => {
    expect(theme.colors).toBe(colors);
    expect(theme.spacing).toBe(spacing);
    expect(theme.radii).toBe(radii);
    expect(theme.typography).toBe(typography);
    expect(theme.shadows).toBe(shadows);
    expect(theme.minTouchTarget).toBe(48);
  });
});

describe('ThemeProvider and useAppTheme Hook', () => {
  function ThemeConsumer() {
    const appTheme = useAppTheme();
    return (
      <View testID="theme-consumer" style={{ backgroundColor: appTheme.colors.background }}>
        <Text testID="primary-color">{appTheme.colors.primary}</Text>
        <Text testID="bg-color">{appTheme.colors.background}</Text>
      </View>
    );
  }

  function BadConsumer() {
    useAppTheme();
    return null;
  }

  test('child reads canonical primary and background tokens from provider', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(getByTestId('primary-color')).toHaveTextContent('#1E3A8A');
    expect(getByTestId('bg-color')).toHaveTextContent('#F8FAFC');
  });

  test('useAppTheme outside provider throws descriptive error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<BadConsumer />)).rejects.toThrow(
      'useAppTheme must be used within a ThemeProvider'
    );

    spy.mockRestore();
  });
});
