/**
 * Canonical WorkSphere Theme Definition
 * Source: design/05_DESIGN_SYSTEM.md
 */

import { colors } from './colors';
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

export type Theme = typeof theme;
