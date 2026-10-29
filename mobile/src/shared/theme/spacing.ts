/**
 * Canonical Spacing Scale for WorkSphere Mobile
 * Source: design/05_DESIGN_SYSTEM.md (4-point and 8-point grid)
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 40,
} as const;

export const minTouchTarget = 48 as const;

export type SpacingTokens = typeof spacing;
export type SpacingKey = keyof typeof spacing;
