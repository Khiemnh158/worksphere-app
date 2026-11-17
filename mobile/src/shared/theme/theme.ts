/**
 * Canonical WorkSphere Theme Definition
 * Source: design/05_DESIGN_SYSTEM.md
 */

import { colors, ColorTokens } from './colors';
import { spacing, minTouchTarget } from './spacing';
import { radii } from './radii';
import { typography } from './typography';
import { shadows } from './shadows';

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  minTouchTarget,
} as const;

export type Theme = Omit<typeof theme, 'colors'> & { colors: ColorTokens };

export const darkTheme: Theme = {
  ...theme,
  colors: {
    ...colors,
    primary: '#d8eda9',
    onPrimary: '#17200f',
    primaryContainer: '#283320',
    onPrimaryContainer: '#d8eda9',
    secondary: '#a7cba4',
    background: '#101411',
    surface: '#191e1a',
    surfaceVariant: '#232a23',
    textPrimary: '#edf1e7',
    textSecondary: '#a3afa0',
    border: '#343d33',
    borderFocus: '#d8eda9',
    error: '#ffb4ab',
    errorContainer: '#402623',
    warning: '#efcc80',
    warningContainer: '#3b3220',
    success: '#a7d7a1',
    successContainer: '#233c28',
    info: '#b4cbde',
    infoContainer: '#24333f',
    disabled: '#778273',
    disabledContainer: '#2c342b',
  },
};
export const lightTheme: Theme = {
  ...theme,
  colors: {
    ...colors,
    primary: '#36591f',
    onPrimary: '#ffffff',
    primaryContainer: '#e0edcc',
    onPrimaryContainer: '#243d16',
    background: '#f5f7f0',
    surface: '#ffffff',
    surfaceVariant: '#eaf0e3',
    border: '#d5ddce',
    textPrimary: '#192216',
    textSecondary: '#5b6954',
    borderFocus: '#36591f',
  },
};
